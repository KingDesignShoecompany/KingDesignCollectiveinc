#!/usr/bin/env node
/**
 * KingDesignCollectiveINC - Zendrop API Integration
 * Handles API token management, product catalog imports, and order management
 * For: Shoe Brand storefront and Vagary Index travel accessories
 *
 * Usage:
 *   node zendrop_api.js create-token "Token Name" "description" "never"
 *   node zendrop_api.js catalog --limit 50 --category "sneakers"
 *   node zendrop_api.js import-shoe-brand     # Import products for shoe store
 *   node zendrop_api.js import-vagary         # Import vacation items for Vagary Index
 *   node zendrop_api.js orders --limit 20
 *   node zendrop_api.js stores
 *   node zendrop_api.js billing
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';

const CONFIG = {
  apiKey: "tokenvillaoi",
  apiSecret: "iJ4lh89YTldSdjxVffKXEOiIiWRTghC80WRNhj1KmpvSqAzaSnRR52sFVQWKduEO",
  baseUrl: 'https://api.zendrop.com',
  tokenFile: path.join(process.cwd(), '.zendrop_token.json'),
  // Scopes for the token
  scopes: [
    'catalog:read',
    'my_products:read',
    'my_products:write',
    'orders:read',
    'orders:write',
    'order_issues:read',
    'order_issues:write',
    'stores:read',
    'stores:write',
    'billing:read'
  ]
};

const SCOPES = CONFIG.scopes;

class ZendropClient {
  constructor() {
    this.baseUrl = CONFIG.baseUrl;
    this.token = this.loadToken();
  }

  loadToken() {
    try {
      if (fs.existsSync(CONFIG.tokenFile)) {
        const data = JSON.parse(fs.readFileSync(CONFIG.tokenFile, 'utf8'));
        // Check expiry
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          console.log('Token expired.');
          return null;
        }
        return data;
      }
    } catch (e) {
      console.error('Token load error:', e.message);
    }
    return null;
  }

  saveToken(data) {
    fs.writeFileSync(CONFIG.tokenFile, JSON.stringify(data, null, 2));
    this.token = data;
  }

  async request(endpoint, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + endpoint);
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      // Try different auth methods
      if (this.token?.access_token) {
        headers['Authorization'] = `Bearer ${this.token.access_token}`;
      } else {
        // Use basic auth with the provided API credentials
        headers['Authorization'] = `Basic ${Buffer.from(CONFIG.apiKey + ':' + CONFIG.apiSecret).toString('base64')}`;
      }

      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: method,
        headers: headers
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          // Check if response is JSON
          const contentType = res.headers['content-type'] || '';
          if (contentType.includes('application/json')) {
            try {
              const parsed = JSON.parse(data);
              if (res.statusCode >= 400) {
                reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
              } else {
                resolve(parsed);
              }
            } catch (e) {
              reject(new Error(`JSON parse error: ${data.substring(0, 200)}`));
            }
          } else {
            // Non-JSON response
            if (res.statusCode >= 400) {
              reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
            } else {
              resolve({ status: res.statusCode, body: data.substring(0, 500) });
            }
          }
        });
      });

      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  /**
   * Create API Token with all requested scopes
   */
  async createToken(tokenName, description = '', expiration = 'never') {
    const payload = {
      name: tokenName,
      description: description,
      expires_at: expiration === 'never' ? null : expiration,
      scopes: SCOPES.map(s => ({ scope: s }))
    };

    try {
      const result = await this.request('/v2/tokens', 'POST', payload);
      console.log('Token created successfully!');
      console.log('  Name:', tokenName);
      console.log('  Scopes:', SCOPES.join(', '));
      console.log('  Expiration:', expiration);
      this.saveToken(result);
      return result;
    } catch (e) {
      // Try alternate endpoint formats
      try {
        const result = await this.request('/api/v2/tokens', 'POST', payload);
        console.log('Token created successfully!');
        console.log('  Name:', tokenName);
        console.log('  Scopes:', SCOPES.join(', '));
        this.saveToken(result);
        return result;
      } catch (e2) {
        // Try /api/v1/
        try {
          const result = await this.request('/api/v1/tokens', 'POST', payload);
          console.log('Token created (v1 API)!');
          console.log('  Name:', tokenName);
          console.log('  Scopes:', SCOPES.join(', '));
          this.saveToken(result);
          return result;
        } catch (e3) {
          console.error('Failed to create token. API may require browser auth.');
          console.error('  Error:', e.message);
          console.log('\nFallback: Using existing API credentials for all operations.');
          return null;
        }
      }
    }
  }

  /**
   * Fetch catalog products
   */
  async getCatalog(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', options.limit);
    if (options.offset) params.set('offset', options.offset);
    if (options.search) params.set('search', options.search);
    if (options.category) params.set('category', options.category);

    const query = params.toString();
    const endpoint = `/v2/catalog${query ? '?' + query : ''}`;

    try {
      return await this.request(endpoint);
    } catch (e) {
      // Try alternate endpoints
      try {
        return await this.request(`/api/v2/catalog${query ? '?' + query : ''}`);
      } catch (e2) {
        try {
          return await this.request(`/api/v1/catalog${query ? '?' + query : ''}`);
        } catch (e3) {
          console.error('Failed to fetch catalog:', e.message);
          return null;
        }
      }
    }
  }

  async getMyProducts(options = {}) {
    const params = new URLSearchParams(options).toString();
    try {
      return await this.request(`/v2/my_products?${params}`);
    } catch (e) {
      return await this.request(`/api/v2/my_products?${params}`);
    }
  }

  async getStores() {
    try {
      return await this.request('/v2/stores');
    } catch (e) {
      return await this.request('/api/v2/stores');
    }
  }

  async getOrders(options = {}) {
    const params = new URLSearchParams(options).toString();
    try {
      return await this.request(`/v2/orders?${params}`);
    } catch (e) {
      return await this.request(`/api/v2/orders?${params}`);
    }
  }

  async getBilling() {
    try {
      return await this.request('/v2/billing');
    } catch (e) {
      return await this.request('/api/v2/billing');
    }
  }
}

// Product import functions for each store
class ProductImporter {
  constructor(client) {
    this.client = client;
  }

  /**
   * Import products for Shoe Brand store
   */
  async importShoeBrand() {
    console.log('=== Importing Shoe Brand Products from Zendrop ===\n');

    const catalog = await this.client.getCatalog({ limit: 50 });
    if (!catalog) {
      console.log('No catalog data available. API may need browser auth.');
      return;
    }

    let products = [];
    if (catalog.products) {
      products = catalog.products.filter(p =>
        p.category?.toLowerCase().includes('shoe') ||
        p.category?.toLowerCase().includes('sneaker') ||
        p.category?.toLowerCase().includes('athletic') ||
        p.tags?.some(t => ['shoe', 'sneaker', 'athletic', 'casual'].includes(t.toLowerCase()))
      );
    }

    // Format for storefront
    const formatted = products.map(p => ({
      id: p.id || p.sku || `zd-${Math.random().toString(36).substr(2, 9)}`,
      name: p.name,
      price: p.price || p.retail_price,
      compare_at_price: p.compare_at_price,
      currency: p.currency || 'USD',
      image: p.images?.[0]?.url || p.image_url,
      thumbnail: p.images?.[0]?.thumbnail || p.thumbnail_url,
      description: p.description || p.meta_description,
      category: p.category,
      tags: p.tags || [],
      variants: p.variants || [],
      supplier: p.supplier_name || 'Zendrop',
      rating: p.rating || 0,
      reviews_count: p.reviews_count || 0,
      shipping_days: p.shipping_days_min + '-' + p.shipping_days_max,
      active: true,
      source: 'zendrop'
    }));

    const output = {
      store: 'KingDesignCollectiveINC Shoe Brand',
      source: 'Zendrop Catalog API',
      imported_at: new Date().toISOString(),
      total_products: formatted.length,
      products: formatted
    };

    const outputPath = path.join(process.cwd(), 'catalog', 'zendrop_products.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`Imported ${formatted.length} shoe products to ${outputPath}`);
    return formatted;
  }

  /**
   * Import vacation items and accessories for Vagary Index
   */
  async importVagary() {
    console.log('=== Importing Vagary Index Vacation Items ===\n');

    const categories = ['travel', 'accessories', 'luggage', 'outdoor', 'beach', 'summer'];
    const allProducts = [];

    for (const cat of categories) {
      const catalog = await this.client.getCatalog({ limit: 20, category: cat });
      if (catalog && catalog.products) {
        const filtered = catalog.products.map(p => ({
          id: p.id || p.sku || `zd-${Math.random().toString(36).substr(2, 9)}`,
          name: p.name,
          price: p.price || p.retail_price,
          currency: p.currency || 'USD',
          image: p.images?.[0]?.url || p.image_url,
          thumbnail: p.images?.[0]?.thumbnail || p.thumbnail_url,
          description: p.description,
          category: p.category,
          tags: p.tags || [],
          supplier: p.supplier_name || 'Zendrop',
          rating: p.rating || 0,
          reviews_count: p.reviews_count || 0,
          shipping_days: `${p.shipping_days_min}-${p.shipping_days_max}`,
          active: true,
          source: 'zendrop',
          vagary_category: cat
        }));
        allProducts.push(...filtered);
      }
    }

    const output = {
      store: 'The Vagary Index',
      source: 'Zendrop Catalog API',
      imported_at: new Date().toISOString(),
      total_products: allProducts.length,
      products_by_category: {},
      products: allProducts
    };

    // Group by category
    for (const p of allProducts) {
      const cat = p.vagary_category;
      if (!output.products_by_category[cat]) output.products_by_category[cat] = [];
      output.products_by_category[cat].push(p);
    }

    const outputPath = path.join(process.cwd(), 'catalog', 'vagary_products.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`Imported ${allProducts.length} vacation items to ${outputPath}`);
    return allProducts;
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const client = new ZendropClient();
  const importer = new ProductImporter(client);

  switch (command) {
    case 'create-token':
      const name = args[1] || 'KingDesignCollectiveINC - Primary Store';
      const desc = args[2] || 'Token for shoe brand and Vagary Index storefronts';
      const exp = args[3] || 'never';
      console.log('Creating token with scopes:');
      console.log(SCOPES.join(', '));
      console.log(`\nExpiration: ${exp}`);
      await client.createToken(name, desc, exp);
      break;

    case 'catalog':
      const limit = args.includes('--limit') ? args[args.indexOf('--limit') + 1] : '50';
      const search = args.includes('--search') ? args[args.indexOf('--search') + 1] : null;
      const category = args.includes('--category') ? args[args.indexOf('--category') + 1] : null;
      const result = await client.getCatalog({ limit, search, category });
      console.log(JSON.stringify(result, null, 2).substring(0, 2000));
      break;

    case 'import-shoe-brand':
      await importer.importShoeBrand();
      break;

    case 'import-vagary':
      await importer.importVagary();
      break;

    case 'orders':
      const orders = await client.getOrders({ limit: 20 });
      console.log(JSON.stringify(orders, null, 2).substring(0, 2000));
      break;

    case 'stores':
      const stores = await client.getStores();
      console.log(JSON.stringify(stores, null, 2).substring(0, 2000));
      break;

    case 'billing':
      const billing = await client.getBilling();
      console.log(JSON.stringify(billing, null, 2).substring(0, 2000));
      break;

    case 'scopes':
      console.log('Available scopes:');
      SCOPES.forEach(s => console.log('  - ' + s));
      break;

    default:
      console.log(`
KingDesignCollectiveINC - Zendrop API Integration
Usage: node zendrop_api.js <command> [options]

Commands:
  create-token [name] [description] [expiration]  Create API token with all scopes
  catalog [--limit N] [--search term] [--category cat]  Fetch catalog products
  import-shoe-brand   Import products for shoe store
  import-vagary       Import vacation items for Vagary Index
  orders [--limit N]  Fetch orders
  stores              Fetch store info
  billing             Fetch billing info
  scopes              List available scopes`);
  }
}

main().catch(console.error);
