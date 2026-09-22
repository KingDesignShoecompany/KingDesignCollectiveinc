// Shop.js - Product grid, filters, cart, checkout
const CART_KEY = "kdc_cart";
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
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const total = cart.reduce((sum, item) => sum + item.qty * item.price, 0);
    const countEl = document.getElementById("cart-count");
    const totalEl = document.getElementById("cart-total");
    if (countEl) countEl.textContent = count;
    if (totalEl) totalEl.textContent = total.toFixed(2);
}

document.addEventListener("DOMContentLoaded", function() {
    loadHomepageConfig();
    fetchProducts();
    setupEvents();
    updateCartSummary();
});

async function loadHomepageConfig() {
    try {
        const res = await fetch("../config/homepage.json?ts=" + Date.now());
        if (!res.ok) return;
        const cfg = await res.json();
        const hero = cfg.hero;
        if (!hero) return;
        const heroSection = document.querySelector(".hero-section");
        if (heroSection) {
            heroSection.innerHTML =
                '<div class="container">' +
                '<h2 class="hero-title">' + (hero.title || "Vagary Index Shop") + '</h2>' +
                '<p class="hero-subtitle">' + (hero.subtitle || "Essential vacation wear and travel accessories") + '</p>' +
                '</div>';
        }
    } catch (e) {
        console.warn("No homepage config:", e);
    }
}

async function fetchProducts() {
    try {
        const res = await fetch("catalog.json");
        if (!res.ok) throw new Error("catalog.json not found");
        const data = await res.json();
        const allProducts = [];
        const categories = data.products_by_category || {};
        Object.entries(categories).forEach(function(cat, prods) {
            prods.forEach(function(p) {
                p._category = cat;
                allProducts.push(p);
            });
        });
        if (data.products) {
            data.products.forEach(function(p) {
                if (!p._category) p._category = "General";
                allProducts.push(p);
            });
        }
        products = allProducts;
        renderFilters();
        renderProducts(products);
    } catch (err) {
        const grid = document.getElementById("product-grid");
        if (grid) grid.innerHTML = '<p style="color: var(--color-text-secondary)">Failed to load products.</p>';
    }
}

function renderFilters() {
    const tagSet = new Set();
    products.forEach(function(p) {
        (p.tags || []).forEach(function(t) { tagSet.add(t); });
        if (p.category) tagSet.add(p.category);
    });

    const select = document.getElementById("tag-filter");
    if (!select) return;
    tagSet.forEach(function(tag) {
        const opt = document.createElement("option");
        opt.value = tag;
        opt.textContent = tag;
        select.appendChild(opt);
    });

    select.addEventListener("change", function() {
        const tag = select.value;
        if (!tag) { renderProducts(products); return; }
        const filtered = products.filter(function(p) {
            return (p.tags || []).includes(tag) || p.category === tag || p._category === tag;
        });
        renderProducts(filtered);
    });

    const searchInput = document.getElementById("search");
    if (searchInput) {
        searchInput.addEventListener("input", function() {
            const term = searchInput.value.toLowerCase();
            const filtered = products.filter(function(p) {
                return p.name.toLowerCase().includes(term) ||
                       (p.tags || []).some(function(t) { return t.toLowerCase().includes(term); }) ||
                       (p.category || "").toLowerCase().includes(term);
            });
            renderProducts(filtered);
        });
    }
}

function renderProducts(list) {
    const grid = document.getElementById("product-grid");
    if (!grid) return;
    grid.innerHTML = list.map(function(p) {
        var img = p.image || "";
        var desc = (p.description || "").substring(0, 80);
        return '<div class="product-card">' +
            '<img src="' + img + '" alt="' + p.name + '" class="product-image" loading="lazy">' +
            '<div class="product-info">' +
            '<span class="badge">' + (p._category || p.category || "General") + '</span>' +
            '<h3>' + p.name + '</h3>' +
            '<p class="product-price">$' + (p.price || 0).toFixed(2) + '</p>' +
            '<p class="product-desc">' + desc + '</p>' +
            '<button class="cta-button small" onclick="addToCart(' + JSON.stringify(p).replace(/"/g, "&quot;") + ')">Add to Cart</button>' +
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

// Make addToCart globally accessible for inline onclick
window.addToCart = addToCart;
