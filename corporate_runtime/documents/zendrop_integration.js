#!/usr/bin/env node
/**
 * KingDesignCollectiveINC - Zendrop API Integration
 * Handles API token management, product imports, and order synchronization
 * For: Shoe Brand store and Vagary Index travel accessories/vacation items
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

class ZendropAPI {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.ZENDROP_API_KEY || null;
    this.apiSecret = options.apiSecret || process.env.ZENDROP_API_SECRET || null;
    this.baseUrl = 'https://api.zendrop.com/v1';
    this.tokenFile = options.tokenFile || path.join(process.cwd(), '.zendrop-token.json');
    this.accessToken = null;
  }

  /**
   * Create API Token with specified scopes
   * @param {string} tokenName - Token name
   * @param {string} expiration - Expiration date (ISO string or 'never')
   * @param {string} description - Optional description
   * @param {Array} scopes - Array of scope strings
   * @returns {Promise<object>}
   */
  async createToken(tokenName, expiration = 'never', description = '', scopes = []) {
    const defaultScopes = [
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
    ];

    const selectedScopes = scopes.length > 0 ? scopes : defaultScopes;

    const payload = {
      name: tokenName,
      description: description,
      expires_at: expiration === 'never' ? null : expiration,
      scopes: selectedScopes.map(s => ({ scope: s }))
    };

    const response = await this._request('/tokens', 'POST', payload);

    // Cache token locally
    const tokenData = {
      access_token: response.access_token,
      token_id: response.id,
      expires_at: response.expires_at,
      scopes: selectedScopes,
      created_at: new Date().toISOString()
    };

    fs.writeFileSync(this.tokenFile, JSON.stringify(tokenData, null, 2));
    this.accessToken = response.access_token;

    console.log(`Token '${tokenName}' created successfully.`);
    console.log(`Scopes: ${selectedScopes.join(', ')}`);
    if (response.expires_at) {
      console.log(`Expires: ${response.expires_at}`);
    } else {
      console.log('Expires: never');
    }

    return response;
  }

  /**
   * Validate existing token
   * @param {string} tokenId - Token ID to validate
   * @returns {Promise<object>}
   */
  async validateToken(tokenId) {
    return await this._request(`/tokens/${tokenId}`, 'GET');
  }

  /**
   * Load cached token
   * @returns {object|null}
   */
  loadToken() {
    try {
      if (fs.existsSync(this.tokenFile)) {
        const data = JSON.parse(fs.readFileSync(this.tokenFile, 'utf8'));
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          console.log('Token expired, please create a new one.');
          return null;
        }
        this.accessToken = data.access_token;
        return data;
      }
    } catch (e) {
      console.error('Error loading token:', e.message);
    }
    return null;
  }

  /**
   * Revoke/Invalidate API token
   * @param {string} tokenId - Token ID to revoke
   * @returns {Promise<object>}
   */
  async revokeToken(tokenId) {
    return await this._request(`/tokens/${tokenId}`, 'DELETE');
  }

  /**
   * Fetch all products from catalog
   * @param {object} options - Query options {limit, offset, search, category}
   * @returns {Promise<object>}
   */
  async getCatalog(options = {}) {
    const params = new URLSearchParams(options).toString();
    const path = params ? `/catalog?${params}` : '/catalog';
    return await this._request(path, 'GET');
  }

  /**
   * Fetch a specific product by ID
   * @param {string} productId - Product ID
   * @returns {Promise<object>}
   */
  async getProduct(productId) {
    return await this._request(`/catalog/${productId}`, 'GET');
  }

  /**
   * Search products (for vacation items/accessories)
   * @param {string} query - Search term
   * @param {object} options - Additional options
   * @returns {Promise<object>}
   */
  async searchProducts(query, options = {}) {
    const params = new URLSearchParams({ ...options, search: query }).toString();
    return await this._request(`/catalog?${params}`, 'GET');
  }

  /**
   * Get my products (supplier's products)
   * @param {object} options - Query options
   * @returns {Promise<object>}
   */
  async getMyProducts(options = {}) {
    const params = new URLSearchParams(options).toString();
    const path = params ? `/my_products?${params}` : '/my_products';
    return await this._request(path, 'GET');
  }

  /**
   * Add product to my store
   * @param {object} productData - Product data
   * @returns {Promise<object>}
   */
  async addToMyProducts(productData) {
    return await this._request('/my_products', 'POST', productData);
  }

  /**
   * Fetch all stores
   * @returns {Promise<object>}
   */
  async getStores() {
    return await this._request('/stores', 'GET');
  }

  /**
   * Fetch orders
   * @param {object} options - Query options
   * @returns {Promise<object>}
   */
  async getOrders(options = {}) {
    const params = new URLSearchParams(options).toString();
    const path = params ? `/orders?${params}` : '/orders';
    return await this._request(path, 'GET');
  }

  /**
   * Get specific order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<object>}
   */
  async getOrder(orderId) {
    return await this._request(`/orders/${orderId}`, 'GET');
  }

  /**
   * Create fulfillment for an order
   * @param {string} orderId - Order ID
   * @param {object} fulfillmentData - Tracking info, carrier, etc.
   * @returns {Promise<object>}
   */
  async createFulfillment(orderId, fulfillmentData) {
    return await this._request(`/orders/${orderId}/fulfillments`, 'POST', fulfillmentData);
  }

  /**
   * Fetch billing info
   * @returns {Promise<object>}
   */
  async getBilling() {
    return await this._request('/billing', 'GET');
  }

  /**
   * Fetch vacation items and accessories (for Vagary Index)
   * @returns {Promise<object>}
   */
  async getVacationItems() {
    return await this.searchProducts('vacation accessories travel gear', {
      category: 'accessories',
      limit: 50
    });
  }

  /**
   * Internal: make authenticated request
   */
  async _request(endpoint, method, body = null) {
    if (!this.accessToken) {
      this.loadToken();
    }

    if (!this.accessToken) {
      throw new Error('No access token. Call createToken() first.');
    }

    const options = {
      hostname: 'api.zendrop.com',
      port: 443,
      path: `/v1${endpoint}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'KingDesignCollectiveINC-v1.0'
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 400) {
              reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || data}`));
            } else {
              resolve(parsed);
            }
          } catch (e) {
            reject(new Error(`Parse error: ${data}`));
          }
        });
      });

      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }
}

/**
 * Import products into shoe brand storefront format
 */
class ProductImport {
  constructor(api, storeType = 'shoe_brand') {
    this.api = api;
    this.storeType = storeType;
  }

  /**
   * Import catalog products to local JSON for storefront
   */
  async importCatalog(category = null, limit = 50) {
    try {
      let products;
      if (category) {
        products = await this.api.searchProducts(category, { limit });
      } else {
        products = await this.api.getCatalog({ limit });
      }

      const formatted = products.products?.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        retail_price: p.retail_price,
        currency: p.currency || 'USD',
        image: p.image_url,
        thumbnail: p.thumbnail_url,
        description: p.description,
        category: p.category,
        variants: p.variants || [],
        supplier: p.supplier,
        rating: p.rating,
        reviews_count: p.reviews_count,
        active: p.active !== false,
        store_type: this.storeType
      })) || [];

      return formatted;
    } catch (e) {
      console.error('Import failed:', e.message);
      return [];
    }
  }

  /**
   * Save product data to storefront JSON
   */
  saveCatalog(products, outputPath) {
    const output = {
      store_type: this.storeType,
      source: 'Zendrop',
      imported_at: new Date().toISOString(),
      total_products: products.length,
      products: products
    };
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`Saved ${products.length} products to ${outputPath}`);
  }
}

// CLI usage
async function main() {
  const api = new ZendropAPI();
  const import_ = new ProductImport(api);

  // Check for existing token
  const token = api.loadToken();

  if (!token) {
    console.log('\n=== Creating Zendrop API Token ===\n');
    console.log('Scopes to be granted:');
    console.log('  catalog:read, my_products:read, my_products:write,');
    console.log('  orders:read, orders:write, order_issues:read, order_issues:write,');
    console.log('  stores:read, stores:write, billing:read');
    console.log('\nUsage:');
    console.log('  Set ZENDROP_API_KEY and ZENDROP_API_SECRET environment variables');
    console.log('  Or pass them as constructor options: new ZendropAPI({ apiKey, apiSecret })');
    console.log('\nExample:');
    println(`
      const api = new ZendropAPI({
        apiKey: 'your_api_key',
        apiSecret: 'your_api_secret'
      });
      await api.createToken(
        'KingDesignCollectiveINC - Primary Store',
        'never',
        'Token for shoe brand and travel index storefronts',
        ['catalog:read', 'my_products:read', 'my_products:write', 'orders:read', 'orders:write', 'order_issues:read', 'order_issues:write', 'stores:read', 'stores:write', 'billing:read']
      );
    `);
    return;
  }

  console.log('Token loaded successfully.');
  console.log(`Scopes: ${token.scopes?.join(', ') || 'unknown'}`);
}

function println(str) { console.log(str); }

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ZendropAPI, ProductImport };
