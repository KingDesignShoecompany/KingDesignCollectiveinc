// Zendrop Products Hermes Skill Handler
// Manages Zendrop products and travel bundles for KingDesignCollectiveINC.
// Uses the zendrop-proxy Docker container for API access.

import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const API_BASE = "http://zendrop-proxy:5055";
const CONFIG_DIR = "/app/config";
const HOMEPAGE_CONFIG = path.join(CONFIG_DIR, "homepage.json");
const BUNDLES_CONFIG = path.join(CONFIG_DIR, "bundles.json");

let catalogSnapshot = [];

export async function list_products() {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error(`Zendrop proxy error: ${res.status}`);
    return res.json();
}

export async function get_product(params) {
    const res = await fetch(`${API_BASE}/products/${params.id}`);
    if (!res.ok) throw new Error(`Zendrop proxy error: ${res.status}`);
    return res.json();
}

export async function search_products(params) {
    const products = await list_products();
    const q = (params.query || "").toLowerCase();
    return products.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q))
    );
}

export async function create_travel_bundle(params) {
    const region = params.region || "General";
    const maxItems = params.max_items || 6;
    const products = await list_products();
    const q = region.toLowerCase();

    const candidates = products.filter(p =>
        (p.tags || []).some(t => t.toLowerCase().includes(q)) ||
        (p.description || "").toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q)
    );

    const bundle = {
        id: `bundle-${region.toLowerCase().replace(/\s+/g, "-")}`,
        region,
        lat: 0,
        lng: 0,
        items: candidates.slice(0, maxItems).map(p => ({
            id: p.id,
            title: p.title,
            price: p.price,
            image: p.image
        }))
    };

    // Persist bundles config
    let bundles = [];
    if (fs.existsSync(BUNDLES_CONFIG)) {
        try {
            const existing = JSON.parse(fs.readFileSync(BUNDLES_CONFIG, "utf8"));
            bundles = existing.bundles || existing;
        } catch (e) {
            console.warn("Could not parse bundles config:", e.message);
        }
    }

    const idx = bundles.findIndex(b => b.region.toLowerCase() === region.toLowerCase());
    if (idx >= 0) bundles[idx] = bundle;
    else bundles.push(bundle);

    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(BUNDLES_CONFIG, JSON.stringify({ bundles }, null, 2));

    return bundle;
}

export async function update_homepage_hero(params) {
    const region = params.region || "";
    const products = await list_products();

    let hero;
    if (region) {
        const q = region.toLowerCase();
        hero = products.find(p =>
            (p.tags || []).some(t => t.toLowerCase().includes(q)) ||
            (p.description || "").toLowerCase().includes(q)
        );
    }
    hero = hero || products[0];
    if (!hero) throw new Error("No products available");

    const config = {
        hero: {
            id: hero.id,
            title: region ? `Essential kit for ${region}` : "Travel-Ready Wear",
            subtitle: region ? `Curated for ${region}` : "Curated for movement",
            image: hero.image || "",
            price: hero.price || 0,
            url: "shop.html",
            region
        }
    };

    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(HOMEPAGE_CONFIG, JSON.stringify(config, null, 2));

    return config;
}

export async function sync_catalog_snapshot() {
    catalogSnapshot = await list_products();
    return { count: catalogSnapshot.length };
}

export function get_snapshot() {
    return catalogSnapshot;
}
