// Shop.js - TikTok Shop product grid with hero, filters, cart, checkout
// Updated to pull from Zendrop TikTok Shop API proxy instead of catalog.json

const CART_KEY = "kdc_cart";
const WISHLIST_KEY = "kdc_wishlist";
const API_BASE = "http://localhost:5055";
const DEBOUNCE_MS = 300;
const MAX_AUTOCOMPLETE = 5;
let products = [];
// In-memory index of full product objects keyed by id (for quick-view lookup)
const productIndex = {};
// Wishlist set of ids persisted to localStorage
let wishlist = loadWishlist();
let cart = loadCart();

// Search state
let searchTimeout = null;
let currentSearchTerm = "";
let filteredProducts = [];
let activeSuggestion = -1;
let isLoadingSearch = false;
let processTimer = null;

// DOM references (cached after DOMContentLoaded)
let el = {};

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

// Wishlist persistence
function loadWishlist() {
    try {
        const raw = localStorage.getItem(WISHLIST_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveWishlist() {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
}

// Toggle a product id in/out of the wishlist
function toggleWishlist(id) {
    const idx = wishlist.indexOf(id);
    if (idx >= 0) {
        wishlist.splice(idx, 1);
    } else {
        wishlist.push(id);
    }
    saveWishlist();
    return wishlist;
}

function isInWishlist(id) {
    return wishlist.indexOf(id) >= 0;
}

function refreshWishlistButtons() {
    document.querySelectorAll(".wishlist-btn").forEach(function(btn) {
        const id = btn.getAttribute("data-id");
        const on = isInWishlist(id);
        btn.classList.toggle("active", on);
        btn.textContent = on ? "★" : "♡";
    });
    const qvBtn = document.getElementById("qv-wishlist");
    if (qvBtn && typeof currentQuickViewId !== "undefined") {
        const on = isInWishlist(currentQuickViewId);
        qvBtn.classList.toggle("active", on);
        qvBtn.textContent = on ? "★ Added to Wishlist" : "♡ Add to Wishlist";
    }
}

function updateCartSummary() {
    const count = cart.reduce(function(sum, item) { return sum + item.qty; }, 0);
    const total = cart.reduce(function(sum, item) { return sum + item.qty * item.price; }, 0);
    const countEl = document.getElementById("cart-count");
    const totalEl = document.getElementById("cart-total");
    const badgeEl = document.getElementById("cart-count-badge");
    const cartIcon = document.getElementById("cart-icon");
    if (countEl) countEl.textContent = count;
    if (totalEl) totalEl.textContent = total.toFixed(2);
    if (badgeEl) {
        badgeEl.textContent = count;
        badgeEl.classList.toggle("hidden", count === 0);
    }
    // Subtle gold pulse when the cart updates
    if (cartIcon) {
        cartIcon.classList.add("pulse");
        setTimeout(function() { cartIcon.classList.remove("pulse"); }, 600);
    }
}

document.addEventListener("DOMContentLoaded", function() {
    // Cache DOM references
    el = {
        searchInput: document.getElementById("search"),
        tagFilter: document.getElementById("tag-filter"),
        autocompleteDropdown: document.getElementById("autocomplete-dropdown"),
        searchSpinner: document.getElementById("search-spinner"),
        resultsCount: document.getElementById("results-count"),
        productGrid: document.getElementById("product-grid"),
        emptyState: document.getElementById("empty-state")
    };

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
        updateResultsCount(products.length);
        showEmptyState(products.length === 0);
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
            updateResultsCount(products.length);
            showEmptyState(products.length === 0);
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
        if (!tag) { applyFilters(); return; }
        filterByTag(tag);
    });

    const searchInput = document.getElementById("search");
    if (searchInput) {
        searchInput.addEventListener("input", onSearchInput);
        searchInput.addEventListener("keydown", onSearchKeydown);
        searchInput.addEventListener("blur", function() {
            // Delay hiding to allow click on autocomplete item
            setTimeout(hideAutocomplete, 200);
        });
    }
}

// —  —  — Live Search: debounce + autocomplete + filter-as-you-type —  —  — // Called on every keystroke, debounced by DEBOUNCE_MS (300ms).
function onSearchInput() {
    const term = el.searchInput.value;
    currentSearchTerm = term;
    activeSuggestion = -1;

    // Clear any pending debounce timer
    if (searchTimeout) clearTimeout(searchTimeout);

    // Show loading spinner during "API" processing window
    if (term.trim().length >= 1) {
        showSpinner(true);
        isLoadingSearch = true;
    }

    searchTimeout = setTimeout(function() {
        performSearch(term);
    }, DEBOUNCE_MS);
}

// Core search: highlight matches, populate autocomplete dropdown, filter grid
// Works with both catalog.json and TTS API products (both are unified in `products`).
function performSearch(term) {
    const trimmed = term.trim();

    // Cancel any in-flight simulated "API" processing if a newer search began
    if (processTimer) clearTimeout(processTimer);

    if (trimmed.length === 0) {
        currentSearchTerm = "";
        isLoadingSearch = false;
        showSpinner(false);
        hideAutocomplete();
        filteredProducts = [];
        renderProductGrid(products);
        updateResultsCount(products.length);
        showEmptyState(products.length === 0);
        return;
    }

    isLoadingSearch = true;
    showSpinner(true);

    // Simulate async processing (works for both catalog.json and TTS API products).
    // The spinner reflects this processing window plus the 300ms debounce from
    // onSearchInput that already elapsed before we got here.
    processTimer = setTimeout(function() {
        isLoadingSearch = false;
        showSpinner(false);

        const results = searchProducts(products, trimmed);
        currentSearchTerm = trimmed;
        filteredProducts = results;

        renderAutocomplete(results.slice(0, MAX_AUTOCOMPLETE));
        renderProductGrid(results);
        updateResultsCount(results.length);
        showEmptyState(results.length === 0);
    }, 150);
}

// Unified search across both catalog.json and TTS API products
function searchProducts(source, term) {
    const lower = term.toLowerCase();
    const results = [];

    source.forEach(function(p) {
        const name = (p.name || p.title || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const tags = (p.tags || []).map(function(t) { return t.toLowerCase(); });
        const category = (p._category || p.category || "").toLowerCase();

        // Match against name, description, tags, or category
        const match = name.includes(lower) ||
                      desc.includes(lower) ||
                      tags.some(function(t) { return t.includes(lower); }) ||
                      category.includes(lower);

        if (match) {
            const item = Object.assign({}, p);
            item._matchTerm = term;
            results.push(item);
        }
    });

    // Sort by relevance: exact matches first, then by name match prefix
    results.sort(function(a, b) {
        const aName = (a.name || a.title || "").toLowerCase();
        const bName = (b.name || b.title || "").toLowerCase();
        const aStart = aName.startsWith(lower) ? 0 : 1;
        const bStart = bName.startsWith(lower) ? 0 : 1;
        return aStart - bStart;
    });

    return results;
}

// Render autocomplete dropdown with top N matching products
function renderAutocomplete(suggestions) {
    if (!el.autocompleteDropdown) return;
    if (suggestions.length === 0) {
        el.autocompleteDropdown.innerHTML = "";
        hideAutocomplete();
        return;
    }

    el.autocompleteDropdown.innerHTML = suggestions.map(function(p, i) {
        const img = p.image || p.thumbnail || "";
        const name = p.name || p.title || "";
        const price = (p.price || 0).toFixed(2);
        const isActive = i === activeSuggestion;
        return '<div class="autocomplete-item' + (isActive ? " active" : "") + '" data-index="' + i + '">' +
            '<img src="' + img + '" alt="' + escapeHtml(name) + '">' +
            '<div class="ac-name">' + highlightMatch(name, currentSearchTerm) + '</div>' +
            '<div class="ac-price">$' + price + '</div>' +
            '</div>';
    }).join("");

    showAutocomplete();

    // Attach click handlers to autocomplete items
    el.autocompleteDropdown.querySelectorAll(".autocomplete-item").forEach(function(item, idx) {
        item.addEventListener("click", function() {
            selectAutocompleteItem(idx, suggestions);
        });
        item.addEventListener("mouseenter", function() {
            activeSuggestion = idx;
            refreshAutocompleteActive();
        });
    });
}

// Show / hide autocomplete dropdown with CSS transition
function showAutocomplete() {
    if (!el.autocompleteDropdown) return;
    el.autocompleteDropdown.classList.add("visible");
}

function hideAutocomplete() {
    if (!el.autocompleteDropdown) return;
    el.autocompleteDropdown.classList.remove("visible");
}

function refreshAutocompleteActive() {
    if (!el.autocompleteDropdown) return;
    el.autocompleteDropdown.querySelectorAll(".autocomplete-item").forEach(function(item, i) {
        item.classList.toggle("active", i === activeSuggestion);
    });
}

// Select an autocomplete item → focus the grid to that product
function selectAutocompleteItem(index, suggestions) {
    const p = suggestions[index];
    if (!p) return;
    hideAutocomplete();
    el.searchInput.value = p.name || p.title || "";
    currentSearchTerm = el.searchInput.value;

    // Scroll to / highlight the matched product card
    const grid = el.productGrid;
    if (grid) {
        const card = grid.querySelector('[data-id="' + p.id + '"]');
        if (card) {
            card.scrollIntoView({ block: "center", behavior: "smooth" });
            card.classList.add("highlight");
            setTimeout(function() { card.classList.remove("highlight"); }, 2000);
        }
    }

    // Clear search to show all matching products in the grid
    applyFilters();
}

// Keyboard navigation for autocomplete (up/down arrows, Enter, Escape)
function onSearchKeydown(e) {
    const items = el.autocompleteDropdown ? el.autocompleteDropdown.querySelectorAll(".autocomplete-item") : [];

    if (e.key === "ArrowDown") {
        e.preventDefault();
        if (items.length === 0) return;
        activeSuggestion = Math.min(activeSuggestion + 1, items.length - 1);
        refreshAutocompleteActive();
        const item = items[activeSuggestion];
        if (item) item.scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (items.length === 0) return;
        activeSuggestion = Math.max(activeSuggestion - 1, -1);
        refreshAutocompleteActive();
        if (activeSuggestion >= 0) {
            const item = items[activeSuggestion];
            if (item) item.scrollIntoView({ block: "nearest" });
        }
    } else if (e.key === "Enter") {
        if (activeSuggestion >= 0 && items.length > 0) {
            e.preventDefault();
            // Trigger the click on the active suggestion
            items[activeSuggestion].click();
        }
        // If no suggestion active, the input event + debounce already handles filter
    } else if (e.key === "Escape") {
        hideAutocomplete();
        activeSuggestion = -1;
    }
}

// Toggle loading spinner
function showSpinner(show) {
    if (!el.searchSpinner) return;
    el.searchSpinner.classList.toggle("hidden", !show);
}

// Update results count badge
function updateResultsCount(count) {
    if (!el.resultsCount) return;
    el.resultsCount.textContent = count + " results";
    el.resultsCount.classList.toggle("hidden", count <= 0 && currentSearchTerm.trim().length === 0);
    if (currentSearchTerm.trim().length > 0) {
        el.resultsCount.classList.remove("hidden");
    }
}

// Show / hide empty state message
function showEmptyState(show) {
    if (!el.emptyState) return;
    if (show) {
        const term = currentSearchTerm.trim();
        const message = term
            ? 'No products found for "' + escapeHtml(term) + '". Try a different search term or clear the filter.'
            : "No products available in this collection.";
        el.emptyState.innerHTML = '<div class="empty-icon">🔍</div><p>' + message + '</p>';
        el.emptyState.classList.remove("hidden");
    } else {
        el.emptyState.classList.add("hidden");
    }
}

// Highlight matched term in product names (gold #D4AF37)
function highlightMatch(text, term) {
    if (!term || !term.trim()) return escapeHtml(text);
    const escaped = escapeHtml(text);
    const regex = new RegExp("(" + escapeRegex(term.trim()) + ")", "gi");
    return escaped.replace(regex, "<span class=\"match\">$1</span>");
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Apply tag filter + current search term together
function applyFilters() {
    const tag = el.tagFilter ? el.tagFilter.value : "";
    let result = products;

    if (tag) {
        result = result.filter(function(p) {
            return (p.tags || []).includes(tag) ||
                (p._category || "") === tag ||
                (p.category || "") === tag;
        });
    }

    if (currentSearchTerm.trim().length > 0) {
        result = searchProducts(result, currentSearchTerm);
    }

    filteredProducts = result;
    renderProductGrid(result);
    updateResultsCount(result.length);
    showEmptyState(result.length === 0);
}

function filterByTag(tag) {
    // Reset search when filtering by tag from region groups
    currentSearchTerm = "";
    if (el.searchInput) el.searchInput.value = "";
    hideAutocomplete();

    const filtered = products.filter(function(p) {
        return (p.tags || []).includes(tag) ||
            (p._category || "") === tag ||
            (p.category || "") === tag;
    });
    filteredProducts = filtered;
    renderProductGrid(filtered);
    updateResultsCount(filtered.length);
    showEmptyState(filtered.length === 0);
}

function renderProductGrid(list) {
    const grid = document.getElementById("product-grid");
    if (!grid) return;
    const term = currentSearchTerm.trim();
    grid.innerHTML = list.map(function(p) {
        var img = escapeHtml(p.image || "");
        var desc = (p.description || "").substring(0, 80);
        var price = (p.price || 0).toFixed(2);
        var name = p.name || p.title || "";
        var displayName = term ? highlightMatch(name, term) : escapeHtml(name);
        var displayDesc = term ? highlightMatch(desc, term) : escapeHtml(desc);
        var productId = escapeHtml(String(p.id || ""));
        // Persist full product for quick-view lookup by id
        productIndex[productId] = p;
        var productObj = {
            id: p.id, name: name, price: p.price || 0,
            image: img, description: p.description || ""
        };
        var json = JSON.stringify(productObj).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
        return '<div class="product-card hw" data-id="' + productId + '">' +
            '<div class="card-actions">' +
            '<button type="button" class="action-btn wishlist-btn" data-id="' + productId + '" aria-label="Toggle wishlist">♡</button>' +
            '<button type="button" class="action-btn quickview-btn" data-id="' + productId + '" aria-label="Quick view">👁</button>' +
            '</div>' +
            '<div class="product-image-wrap">' +
            '<img src="' + img + '" alt="' + escapeHtml(name) + '" class="product-image" loading="lazy">' +
            '</div>' +
            '<div class="product-info">' +
            '<span class="badge">' + escapeHtml(p._category || p.category || "General") + '</span>' +
            '<h3 class="product-title">' + displayName + '</h3>' +
            '<p class="product-price">$' + price + '</p>' +
            '<p class="product-desc">' + displayDesc + '</p>' +
            '<button class="cta-button small cta-add-cart" data-id="' + productId + '" data-json="' + json + '">Add to Cart</button>' +
            '</div></div>';
    }).join("");
    attachGridEvents();
}

function addToCart(p, ctx) {
    var existing = cart.find(function(item) { return item.id === p.id; });
    if (existing) { existing.qty += 1; }
    else {
        cart.push({
            id: p.id, title: p.name, price: p.price, image: p.image, qty: 1
        });
    }
    saveCart();
    // Animate the product image flying to the cart icon if a source element is provided
    if (ctx) flyToCart(p, ctx);
    return existing ? existing.qty : 1;
}

/**
 * Fly-to-cart animation: clone the source product image, animate it via
 * hardware-accelerated transform3d to the cart icon, then remove.
 */
function flyToCart(p, sourceEl) {
    var cartIcon = document.getElementById("cart-icon");
    if (!cartIcon) return;
    var sourceImg = typeof sourceEl === "string" ? document.querySelector(sourceEl) : sourceEl;
    if (!sourceImg) return;

    var rect = sourceImg.getBoundingClientRect();
    var cartRect = cartIcon.getBoundingClientRect();

    var clone = document.createElement("img");
    clone.src = p.image || "";
    clone.className = "fly-to-cart hw";
    clone.style.cssText =
        "position:fixed;left:" + rect.left + "px;top:" + rect.top + "px;" +
        "width:" + rect.width + "px;height:" + rect.height + "px;" +
        "pointer-events:none;z-index:9999;" +
        "transform:translateZ(0);backface-visibility:hidden;";
    document.body.appendChild(clone);

    // Force a frame so the transition takes effect
    requestAnimationFrame(function() {
        clone.style.transition = "all 0.7s cubic-bezier(0.25,0.1,0.25,1)";
        clone.style.transform = "translate3d(" +
            (cartRect.left - rect.left) + "px," +
            (cartRect.top - rect.top) + "px," +
            "0) scale(" + (cartRect.width / Math.max(rect.width, 1)) + ") scale(0.6)";
        clone.style.opacity = "0.85";
    });

    // Pulse the cart icon on arrival
    setTimeout(function() {
        if (cartIcon) cartIcon.classList.add("pulse-arrive");
        setTimeout(function() {
            if (cartIcon) cartIcon.classList.remove("pulse-arrive");
            if (clone && clone.parentNode) clone.parentNode.removeChild(clone);
        }, 500);
    }, 700);
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
