const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "zendrop-proxy-dual", version: "2.0" });
});

// --- Zendrop MCP API (full catalog) ---
const ZENDROP_MCP_TOKEN = process.env.ZENDROP_MCP_TOKEN || "tokenvillaoi";
const ZENDROP_TTS_TOKEN = process.env.ZENDROP_TTS_TOKEN || "tokenvillaoi";

async function callMCP(body) {
    const response = await fetch("https://app.zendrop.com/mcp/v1", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${ZENDROP_MCP_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`MCP error: ${response.status}`);
    return response.json();
}

async function callTTS(body) {
    const response = await fetch("https://app.zendrop.com/tts/v1", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${ZENDROP_TTS_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`TTS error: ${response.status}`);
    return response.json();
}

// MCP Endpoints (full Zendrop catalog)
app.get("/mcp/products", async (req, res) => {
    try {
        const data = await callMCP({ action: "list_my_products" });
        const formatted = (data.products || []).map(p => ({
            id: p.id,
            title: p.title || p.name || "",
            description: p.description || "",
            price: p.price || 0,
            compare_at_price: p.compare_at_price || null,
            image: (p.images && p.images[0]) || "",
            tags: p.tags || [],
            variants: p.variants || [],
            rating: p.rating || 0,
            reviews_count: p.reviews_count || 0,
            shipping_days: p.shipping_days || "5-10",
            category: p.category || "General",
            source: "zendrop-mcp"
        }));
        res.json(formatted);
    } catch (err) {
        console.error("MCP error:", err.message);
        res.status(500).json({ error: err.message, source: "mcp" });
    }
});

app.get("/mcp/products/:id", async (req, res) => {
    try {
        const data = await callMCP({
            action: "get_catalog_product",
            product_id: Number(req.params.id)
        });
        res.json(data.product || data);
    } catch (err) {
        res.status(500).json({ error: err.message, source: "mcp" });
    }
});

// TikTok Shop Endpoints (your storefront)
app.get("/tts/products", async (req, res) => {
    try {
        const data = await callTTS({ action: "get_tts_products" });
        const formatted = (data.products || data.items || []).map(p => {
            // Normalize TikTok Shop product format
            const title = p.title || p.name || p.product_name || "";
            const price = parseFloat(p.price || p.sale_price || p.regular_price || 0);
            const image = (p.images && p.images[0]) || p.image || p.main_image || "";
            const tags = p.tags || [];
            // Try to extract region from tags or title
            const region = extractRegion(tags, title);
            if (region) tags.push(region);
            return {
                id: p.id || p.product_id,
                title: title,
                description: p.description || p.desc || "",
                price: price,
                compare_at_price: p.compare_at_price || p.regular_price || null,
                image: image,
                tags: tags,
                variants: p.variants || [],
                rating: p.rating || 0,
                reviews_count: p.reviews_count || p.review_count || 0,
                shipping_days: p.shipping_days || "5-10",
                category: p.category || "Travel Wear",
                source: "tiktok-shop",
                region: region
            };
        });
        res.json(formatted);
    } catch (err) {
        console.error("TTS error:", err.message);
        // Fallback: return error but keep endpoint usable
        res.status(500).json({ error: err.message, source: "tts", products: [] });
    }
});

app.get("/tts/orders", async (req, res) => {
    try {
        const data = await callTTS({ action: "get_tts_orders" });
        res.json(data.orders || data);
    } catch (err) {
        res.status(500).json({ error: err.message, source: "tts" });
    }
});

app.get("/tts/inventory", async (req, res) => {
    try {
        const data = await callTTS({ action: "get_tts_inventory" });
        res.json(data.inventory || data);
    } catch (err) {
        res.status(500).json({ error: err.message, source: "tts" });
    }
});

// Hermes Endpoints (AI-generated bundles, hero, regions)
app.get("/bundles", async (req, res) => {
    try {
        const bundlesPath = require("path").join(__dirname, "config", "bundles.json");
        const bundlesData = require(bundlesPath);
        res.json(bundlesData.bundles || bundlesData);
    } catch (e) {
        res.json([]);
    }
});

app.get("/hero", async (req, res) => {
    try {
        const heroPath = require("path").join(__dirname, "config", "homepage.json");
        const heroData = require(heroPath);
        res.json(heroData.hero || heroData);
    } catch (e) {
        res.json({ error: "No hero config", title: "Travel-Ready Wear", subtitle: "Curated for movement" });
    }
});

app.get("/regions/:region", async (req, res) => {
    const region = req.params.region;
    // Try TikTok Shop products first, then MCP
    let products = [];
    try {
        const ttsRes = await fetch(`http://localhost:5055/tts/products`);
        products = await ttsRes.json();
    } catch (e) {
        products = [];
    }

    const q = region.toLowerCase();
    const regional = products.filter(p =>
        (p.tags || []).some(t => t.toLowerCase().includes(q)) ||
        (p.region || "").toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q)
    );

    res.json({ region, count: regional.length, products: regional });
});

const PORT = process.env.PORT || 5055;
app.listen(PORT, () => {
    console.log("Dual-mode Zendrop proxy running on port " + PORT);
});

// Helper to extract region from tags/title
function extractRegion(tags, title) {
    const regions = ["Japan", "Mediterranean", "Balkans", "Asia", "Europe", "America", "Africa", "Oceania", "Japan", "Kyoto", "Tokyo", "Osaka"];
    for (const r of regions) {
        if (tags.some(t => t.toLowerCase().includes(r.toLowerCase()))) return r;
        if (title.toLowerCase().includes(r.toLowerCase())) return r;
    }
    return null;
}
