// Shop.js - TikTok Shop product grid with hero, filters, cart, checkout
// Updated to pull from Zendrop TikTok Shop API proxy instead of catalog.json

const CART_KEY = "kdc_cart";
const API_BASE = "http://localhost:5055";
let products = [];
let cart = loadCart();

function loadCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartSummary();
}

function updateCartSummary() {
    const count = cart.reduce(function(sum, item) { return sum + item.qty; }, 0);
    const total = cart.reduce(function(sum, item) { return sum + item.qty * item.price; }, 0);
    const countEl = document.getElementById("cart-count");
    const totalEl = document.getElementById("cart-total");
    if (countEl) countEl.textContent = count;
    if (totalEl) totalEl.textContent = total.toFixed(2);
}

document.addEventListener("DOMContentLoaded", function() {
    loadHero();
    fetchTTSProducts();
    setupEvents();
    updateCartSummary();
});

// Load hero config from homepage.json
async function loadHero() {
    try {
        const res = await fetch("../config/homepage.json?ts=" + Date.now());
        if (!res.ok) return;
        const cfg = await res.json();
        const hero = cfg.hero;
        if (!hero) return;
        const heroSection = document.querySelector(".shop-hero");
        if (heroSection) {
            heroSection.innerHTML =
                '<div class="hero-copy">' +
                '<h1 id="shop-hero-title">' + (hero.title || "Travel-Ready Wear") + '</h1>' +
                '<p id="shop-hero-subtitle">' + (hero.subtitle || "Curated for movement") + '</p>' +
                '<button id="shop-hero-cta" onclick="window.location.href=\'' + hero.url + '\'">View bundle</button>' +
                '</div>' +
                '<div class="hero-image">' +
                '<img id="shop-hero-image" src="' + (hero.image ? "../" + hero.image : "") + '" alt="Hero product">' +
                '</div>';
        }
    } catch (e) {
        console.warn("No homepage config:", e);
    }
}

// Fetch products from TikTok Shop API
async function fetchTTSProducts() {
    try {
        const res = await fetch(API_BASE + "/tts/products?ts=" + Date.now());
        if (!res.ok) throw new Error("TikTok API unavailable");
        const data = await res.json();

        if (data.error && !data.products) {
            // API returned error, fall back to catalog.json
            const catalogRes = await fetch("catalog.json");
            const catalogData = await catalogRes.json();
            const allProducts = [];
            const categories = catalogData.products_by_category || {};
            Object.entries(categories).forEach(function([cat, prods]) {
                prods.forEach(function(p) {
                    p._category = cat;
                    allProducts.push(p);
                });
            });
            products = allProducts;
        } else {
            products = data.map(function(p) {
                p._category = p.category || p.region || "TikTok Shop";
                p.name = p.title || p.name || "";
                return p;
            });
        }

        renderRegionGroups();
        renderFilters();
        renderProductGrid(products);
    } catch (err) {
        const grid = document.getElementById("product-grid");
        if (grid) grid.innerHTML = '<p style="color: var(--color-text-secondary)">Failed to load products. Showing local catalog.</p>';
        // Fallback to catalog.json
        try {
            const catalogRes = await fetch("catalog.json");
            const catalogData = await catalogRes.json();
            const allProducts = [];
            const categories = catalogData.products_by_category || {};
            Object.entries(categories).forEach(function([cat, prods]) {
                prods.forEach(function(p) {
                    p._category = cat;
                    allProducts.push(p);
                });
            });
            products = allProducts;
            renderFilters();
            renderProductGrid(products);
        } catch (e2) {
            console.error("All product sources failed:", e2);
        }
    }
}

// Group products by region/tag and render sections
function renderRegionGroups() {
    const container = document.getElementById("region-groups");
    if (!container) return;

    // Group by region/tag
    const groups = {};
    products.forEach(function(p) {
        const region = (p.tags && p.tags.find(function(t) {
            return ["Japan", "Mediterranean", "Balkans", "Asia", "Europe", "America"].some(function(r) {
                return t.toLowerCase().includes(r.toLowerCase());
            });
        })) || p._category || "All Products";

        if (!groups[region]) groups[region] = [];
        groups[region].push(p);
    });

    // Only show groups with at least 2 items
    const sortedRegions = Object.keys(groups).filter(function(r) {
        return groups[r].length >= 2;
    }).sort(function(a, b) {
        return groups[b].length - groups[a].length;
    });

    if (sortedRegions.length === 0) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = sortedRegions.map(function(region) {
        var items = groups[region].slice(0, 6);
        var itemsHtml = items.map(function(p) {
            var img = p.image || "";
            var price = (p.price || 0).toFixed(2);
            return '<div class="region-product">' +
                '<img src="' + img + '" alt="' + (p.name || p.title) + '" loading="lazy">' +
                '<h4>' + (p.name || p.title) + '</h4>' +
                '<p class="price">$' + price + '</p>' +
                '</div>';
        }).join("");

        return '<div class="region-group">' +
            '<h3 class="region-title">' + region + ' Collection</h3>' +
            '<div class="region-products">' + itemsHtml + '</div>' +
            '<button class="view-all" onclick="filterByTag(\'' + region + '\')">View all ' + region + '</button>' +
            '</div>';
    }).join("");
}

function renderFilters() {
    const tagSet = new Set();
    products.forEach(function(p) {
        (p.tags || []).forEach(function(t) { tagSet.add(t); });
        if (p._category) tagSet.add(p._category);
        if (p.category) tagSet.add(p.category);
    });

    const select = document.getElementById("tag-filter");
    if (!select) return;

    // Add "All Products" option
    const allOpt = document.createElement("option");
    allOpt.value = "";
    allOpt.textContent = "All Products";
    select.appendChild(allOpt);

    tagSet.forEach(function(tag) {
        const opt = document.createElement("option");
        opt.value = tag;
        opt.textContent = tag;
        select.appendChild(opt);
    });

    select.addEventListener("change", function() {
        const tag = select.value;
        if (!tag) { renderProductGrid(products); return; }
        filterByTag(tag);
    });

    const searchInput = document.getElementById("search");
    if (searchInput) {
        searchInput.addEventListener("input", function() {
            const term = searchInput.value.toLowerCase();
            const filtered = products.filter(function(p) {
                return (p.name || p.title || "").toLowerCase().includes(term) ||
                       (p.tags || []).some(function(t) { return t.toLowerCase().includes(term); }) ||
                       (p._category || "").toLowerCase().includes(term);
            });
            renderProductGrid(filtered);
        });
    }
}

function filterByTag(tag) {
    const filtered = products.filter(function(p) {
        return (p.tags || []).includes(tag) ||
               (p._category || "") === tag ||
               (p.category || "") === tag;
    });
    renderProductGrid(filtered);
}

function renderProductGrid(list) {
    const grid = document.getElementById("product-grid");
    if (!grid) return;
    grid.innerHTML = list.map(function(p) {
        var img = p.image || "";
        var desc = (p.description || "").substring(0, 80);
        var price = (p.price || 0).toFixed(2);
        var name = p.name || p.title || "";
        var productObj = {
            id: p.id, name: name, price: p.price || 0,
            image: img, description: p.description || ""
        };
        return '<div class="product-card">' +
            '<img src="' + img + '" alt="' + name + '" class="product-image" loading="lazy">' +
            '<div class="product-info">' +
            '<span class="badge">' + (p._category || p.category || "General") + '</span>' +
            '<h3>' + name + '</h3>' +
            '<p class="product-price">$' + price + '</p>' +
            '<p class="product-desc">' + desc + '</p>' +
            '<button class="cta-button small" onclick="addToCart(' + JSON.stringify(productObj).replace(/"/g, "&quot;") + ')">Add to Cart</button>' +
            '</div></div>';
    }).join("");
}

function addToCart(p) {
    const existing = cart.find(function(item) { return item.id === p.id; });
    if (existing) { existing.qty += 1; }
    else {
        cart.push({
            id: p.id, title: p.name, price: p.price, image: p.image, qty: 1
        });
    }
    saveCart();
}

function openCart() {
    const modal = document.getElementById("cart-modal");
    const itemsDiv = document.getElementById("cart-items");
    const totalSpan = document.getElementById("cart-modal-total");
    if (!itemsDiv) return;
    itemsDiv.innerHTML = "";
    cart.forEach(function(item) {
        const row = document.createElement("div");
        row.className = "cart-item";
        row.innerHTML =
            "<strong>" + item.title + "</strong> - $" + item.price.toFixed(2) + " x " + item.qty +
            ' <button data-id="' + item.id + '" data-action="inc">+</button>' +
            ' <button data-id="' + item.id + '" data-action="dec">-</button>' +
            ' <button data-id="' + item.id + '" data-action="remove">Remove</button>';
        itemsDiv.appendChild(row);
    });
    const total = cart.reduce(function(sum, item) { return sum + item.qty * item.price; }, 0);
    if (totalSpan) totalSpan.textContent = total.toFixed(2);
    itemsDiv.querySelectorAll("button").forEach(function(btn) {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        btn.addEventListener("click", function() {
            const item = cart.find(function(i) { return String(i.id) === String(id); });
            if (!item) return;
            if (action === "inc") item.qty += 1;
            if (action === "dec") item.qty = Math.max(1, item.qty - 1);
            if (action === "remove") cart = cart.filter(function(i) { return i.id !== item.id; });
            saveCart();
            openCart();
        });
    });
    if (modal) modal.classList.remove("hidden");
}

function closeCart() {
    const el = document.getElementById("cart-modal");
    if (el) el.classList.add("hidden");
}

function openCheckout() {
    const el = document.getElementById("checkout-modal");
    if (el) el.classList.remove("hidden");
}

function closeCheckout() {
    const el = document.getElementById("checkout-modal");
    if (el) el.classList.add("hidden");
}

function setupEvents() {
    var viewCart = document.getElementById("view-cart");
    if (viewCart) viewCart.addEventListener("click", openCart);

    var closeCartBtn = document.getElementById("close-cart");
    if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);

    var checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) checkoutBtn.addEventListener("click", function() {
        closeCart();
        openCheckout();
    });

    var closeCheckoutBtn = document.getElementById("close-checkout");
    if (closeCheckoutBtn) closeCheckoutBtn.addEventListener("click", closeCheckout);

    var checkoutForm = document.getElementById("checkout-form");
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const payload = {
                name: formData.get("name"),
                email: formData.get("email"),
                address: formData.get("address"),
                cart: cart.map(function(i) {
                    return { id: i.id, title: i.title, price: i.price, qty: i.qty };
                })
            };
            console.log("Checkout payload:", payload);
            alert("Order captured (demo). Integrate payment + fulfillment next.");
            cart = [];
            saveCart();
            closeCheckout();
        });
    }
}

window.addToCart = addToCart;
window.filterByTag = filterByTag;
