// King Design Collective - Store Frontend JS
// Integrated with inventory.csv and product image assets

document.addEventListener('DOMContentLoaded', function() {
    initializeStore();
});

// Product data mapped to inventory.csv SKU system and actual image assets
const PRODUCTS = [
    {
        id: 'KING-001',
        name: 'Apex Runner V1',
        category: 'Performance Running',
        price: 189,
        cost: 45.00,
        material: 'Engineered Knit + TPU Sole',
        stock: 120,
        sizes: [7, 8, 9, 10, 11, 12, 13],
        color: 'Obsidian Black',
        status: 'Active',
        image: 'images/products/KING-001-side.jpg',
        detailImage: 'images/products/KING-001-detail.jpg',
        boxImage: 'images/products/KING-001-box.jpg'
    },
    {
        id: 'KING-002',
        name: 'Daily Drift Low',
        category: 'Casual Lifestyle',
        price: 149,
        cost: 38.50,
        material: 'Suede + Natural Rubber',
        stock: 85,
        sizes: [6, 7, 8, 9, 10, 11, 12],
        color: 'Desert Sand',
        status: 'Active',
        image: 'images/products/KING-002-side.jpg',
        detailImage: 'images/products/KING-002-detail.jpg',
        boxImage: 'images/products/KING-002-box.jpg'
    },
    {
        id: 'KING-003',
        name: 'Summit Trail X',
        category: 'Trail Hiking',
        price: 229,
        cost: 52.00,
        material: 'Thermo-Molded Upper + Vibram',
        stock: 60,
        sizes: [8, 9, 10, 11, 12, 13, 14],
        color: 'Forest Green',
        status: 'Active',
        image: 'images/products/KING-003-side.jpg',
        detailImage: 'images/products/KING-003-detail.jpg',
        boxImage: 'images/products/KING-003-box.jpg'
    },
    {
        id: 'KING-004',
        name: 'Urban Flux Knit',
        category: 'Urban Commuter',
        price: 119,
        cost: 29.00,
        material: 'Seamless Flyknit + PU Foam',
        stock: 200,
        sizes: [6, 7, 8, 9, 10, 11, 12],
        color: 'Midnight Navy',
        status: 'Active',
        image: 'images/products/KING-004-side.jpg',
        detailImage: 'images/products/KING-004-side.jpg',
        boxImage: 'images/products/KING-004-box.jpg'
    },
    {
        id: 'KING-005',
        name: 'Cloud Step Walker',
        category: 'Comfort Walking',
        price: 175,
        cost: 41.00,
        material: 'Memory Foam + Gel Insert',
        stock: 95,
        sizes: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
        color: 'Cloud White',
        status: 'Active',
        image: 'images/products/KING-005-side.jpg',
        detailImage: 'images/products/KING-005-detail.jpg',
        boxImage: 'images/products/KING-005-box.jpg'
    },
    {
        id: 'KING-006',
        name: 'Nitro Sprint Pro',
        category: 'Racing',
        price: 289,
        cost: 65.00,
        material: 'Carbon Plate + Mesh Upper',
        stock: 45,
        sizes: [7, 8, 9, 10, 11, 12, 13],
        color: 'Neon Volt',
        status: 'Active',
        image: 'images/products/KING-006-side.jpg',
        detailImage: 'images/products/KING-006-side.jpg',
        boxImage: 'images/products/KING-006-box.jpg'
    }

    {
        id: 'KING-007',
        name: 'Apex Runner V2',
        category: 'Athletic',
        price: 249,
        cost: 249.00,
        material: 'Premium Synthetic Upper + EVA Sole',
        stock: 87,
        sizes: [7, 8, 9, 10, 11, 12],
        color: 'Black/ Gold',
        status: 'Active',
        image: 'images/products/KING-007-side.jpg',
        detailImage: 'images/products/KING-007-side.jpg',
        boxImage: 'images/products/KING-007-side.jpg'
    },
    {
        id: 'KING-008',
        name: 'Velocity Blue',
        category: 'Athletic',
        price: 179,
        cost: 179.00,
        material: 'Premium Synthetic Upper + EVA Sole',
        stock: 80,
        sizes: [8, 9, 10, 11, 12],
        color: 'Navy/ White',
        status: 'Active',
        image: 'images/products/KING-008-side.jpg',
        detailImage: 'images/products/KING-008-side.jpg',
        boxImage: 'images/products/KING-008-side.jpg'
    },
    {
        id: 'KING-009',
        name: 'Daily Drift V2',
        category: 'Casual',
        price: 139,
        cost: 139.00,
        material: 'Premium Synthetic Upper + EVA Sole',
        stock: 81,
        sizes: [6, 7, 8, 9, 10, 11],
        color: 'Tan/ Cream',
        status: 'Active',
        image: 'images/products/KING-009-side.jpg',
        detailImage: 'images/products/KING-009-side.jpg',
        boxImage: 'images/products/KING-009-side.jpg'
    },
    {
        id: 'KING-010',
        name: 'Nitro Edge',
        category: 'Athletic',
        price: 199,
        cost: 199.00,
        material: 'Premium Synthetic Upper + EVA Sole',
        stock: 75,
        sizes: [7, 8, 9, 10, 11],
        color: 'Black/ Silver',
        status: 'Active',
        image: 'images/products/KING-010-side.jpg',
        detailImage: 'images/products/KING-010-side.jpg',
        boxImage: 'images/products/KING-010-side.jpg'
    },
    {
        id: 'KING-011',
        name: 'Green Light Runner',
        category: 'Athletic',
        price: 169,
        cost: 169.00,
        material: 'Premium Synthetic Upper + EVA Sole',
        stock: 80,
        sizes: [8, 9, 10, 11, 12],
        color: 'Grey/ Lime',
        status: 'Active',
        image: 'images/products/KING-011-side.jpg',
        detailImage: 'images/products/KING-011-side.jpg',
        boxImage: 'images/products/KING-011-side.jpg'
    },
    {
        id: 'KING-012',
        name: 'Desert Trek',
        category: 'Outdoor',
        price: 159,
        cost: 159.00,
        material: 'Premium Synthetic Upper + EVA Sole',
        stock: 75,
        sizes: [7, 8, 9, 10, 11],
        color: 'Brown/ Tan',
        status: 'Active',
        image: 'images/products/KING-012-side.jpg',
        detailImage: 'images/products/KING-012-side.jpg',
        boxImage: 'images/products/KING-012-side.jpg'
    },
    {
        id: 'KING-013',
        name: 'Street Champion',
        category: 'Athletic',
        price: 219,
        cost: 219.00,
        material: 'Premium Synthetic Upper + EVA Sole',
        stock: 87,
        sizes: [7, 8, 9, 10, 11, 12],
        color: 'Red/ Black',
        status: 'Active',
        image: 'images/products/KING-013-side.jpg',
        detailImage: 'images/products/KING-013-side.jpg',
        boxImage: 'images/products/KING-013-side.jpg'
    },
    {
        id: 'KING-014',
        name: 'Cloud Walker',
        category: 'Casual',
        price: 129,
        cost: 129.00,
        material: 'Premium Synthetic Upper + EVA Sole',
        stock: 81,
        sizes: [6, 7, 8, 9, 10, 11],
        color: 'Beige/ Cream',
        status: 'Active',
        image: 'images/products/KING-014-side.jpg',
        detailImage: 'images/products/KING-014-side.jpg',
        boxImage: 'images/products/KING-014-side.jpg'
    },
    {
        id: 'KING-015',
        name: 'Trail Blazer',
        category: 'Outdoor',
        price: 239,
        cost: 239.00,
        material: 'Premium Synthetic Upper + EVA Sole',
        stock: 80,
        sizes: [8, 9, 10, 11, 12],
        color: 'Black/ Gum',
        status: 'Active',
        image: 'images/products/KING-015-side.jpg',
        detailImage: 'images/products/KING-015-side.jpg',
        boxImage: 'images/products/KING-015-side.jpg'
    },
    {
        id: 'KING-016',
        name: 'Minimalist Luxe',
        category: 'Formal',
        price: 189,
        cost: 189.00,
        material: 'Premium Synthetic Upper + EVA Sole',
        stock: 70,
        sizes: [6, 7, 8, 9, 10],
        color: 'White/ Rose Gold',
        status: 'Active',
        image: 'images/products/KING-016-side.jpg',
        detailImage: 'images/products/KING-016-side.jpg',
        boxImage: 'images/products/KING-016-side.jpg'
    },
    {
        id: 'KING-017',
        name: 'Volt Rush',
        category: 'Athletic',
        price: 189,
        cost: 189.00,
        material: 'Premium Synthetic Upper + EVA Sole',
        stock: 80,
        sizes: [8, 9, 10, 11, 12],
        color: 'Orange/ Black',
        status: 'Active',
        image: 'images/products/KING-017-side.jpg',
        detailImage: 'images/products/KING-017-side.jpg',
        boxImage: 'images/products/KING-017-side.jpg'
    },
    {
        id: 'KING-018',
        name: 'Skate King',
        category: 'Casual',
        price: 179,
        cost: 179.00,
        material: 'Premium Synthetic Upper + EVA Sole',
        stock: 81,
        sizes: [6, 7, 8, 9, 10, 11],
        color: 'Purple/ Black',
        status: 'Active',
        image: 'images/products/KING-018-side.jpg',
        detailImage: 'images/products/KING-018-side.jpg',
        boxImage: 'images/products/KING-018-side.jpg'
    },
    {
        id: 'KING-019',
        name: 'Urban Essentials',
        category: 'Casual',
        price: 149,
        cost: 149.00,
        material: 'Premium Synthetic Upper + EVA Sole',
        stock: 75,
        sizes: [7, 8, 9, 10, 11],
        color: 'Grey/ White',
        status: 'Active',
        image: 'images/products/KING-019-side.jpg',
        detailImage: 'images/products/KING-019-side.jpg',
        boxImage: 'images/products/KING-019-side.jpg'
    },
    {
        id: 'KING-020',
        name: 'Wine Country',
        category: 'Casual',
        price: 199,
        cost: 199.00,
        material: 'Premium Synthetic Upper + EVA Sole',
        stock: 75,
        sizes: [7, 8, 9, 10, 11],
        color: 'Burgundy/ Black',
        status: 'Active',
        image: 'images/products/KING-020-side.jpg',
        detailImage: 'images/products/KING-020-side.jpg',
        boxImage: 'images/products/KING-020-side.jpg'
    },
    {
        id: 'KING-021',
        name: 'Solar Flare',
        category: 'Athletic',
        price: 169,
        cost: 169.00,
        material: 'Premium Synthetic Upper + EVA Sole',
        stock: 80,
        sizes: [8, 9, 10, 11, 12],
        color: 'Yellow/ White',
        status: 'Active',
        image: 'images/products/KING-021-side.jpg',
        detailImage: 'images/products/KING-021-side.jpg',
        boxImage: 'images/products/KING-021-side.jpg'
    },
    {
        id: 'KING-022',
        name: 'Classic Revival',
        category: 'Casual',
        price: 119,
        cost: 119.00,
        material: 'Premium Synthetic Upper + EVA Sole',
        stock: 81,
        sizes: [6, 7, 8, 9, 10, 11],
        color: 'Black/ White',
        status: 'Active',
        image: 'images/products/KING-022-side.jpg',
        detailImage: 'images/products/KING-022-side.jpg',
        boxImage: 'images/products/KING-022-side.jpg'
    },
    {
        id: 'KING-023',
        name: 'Cosmic Shift',
        category: 'Athletic',
        price: 279,
        cost: 279.00,
        material: 'Premium Synthetic Upper + EVA Sole',
        stock: 75,
        sizes: [7, 8, 9, 10, 11],
        color: 'Silver/ Holographic',
        status: 'Active',
        image: 'images/products/KING-023-side.jpg',
        detailImage: 'images/products/KING-023-side.jpg',
        boxImage: 'images/products/KING-023-side.jpg'
    },
    {
        id: 'KING-024',
        name: 'Mountain Peak',
        category: 'Outdoor',
        price: 229,
        cost: 229.00,
        material: 'Premium Synthetic Upper + EVA Sole',
        stock: 80,
        sizes: [8, 9, 10, 11, 12],
        color: 'Forest Green/ Khaki',
        status: 'Active',
        image: 'images/products/KING-024-side.jpg',
        detailImage: 'images/products/KING-024-side.jpg',
        boxImage: 'images/products/KING-024-side.jpg'
    },
    {
        id: 'KING-025',
        name: 'Desert Sage',
        category: 'Outdoor',
        price: 169,
        cost: 169.00,
        material: 'Premium Synthetic Upper + EVA Sole',
        stock: 75,
        sizes: [7, 8, 9, 10, 11],
        color: 'Brown/ Tan',
        status: 'Active',
        image: 'images/products/KING-025-side.jpg',
        detailImage: 'images/products/KING-025-side.jpg',
        boxImage: 'images/products/KING-025-side.jpg'
    },
];

function initializeStore() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    if (currentPage === 'products.html' || currentPage === '') {
        renderProductGrid(PRODUCTS);
        initializeSearch();
        initializeFilters();
    } else if (currentPage === 'product.html') {
        renderProductDetail();
    }

    // CTA button handlers - route to checkout
    document.querySelectorAll('.cta-button').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('.product-card');
            const sku = card?.dataset?.sku;
            if (sku) {
                window.location.href = `checkout.html?sku=${sku}`;
            } else {
                alert('Please select a product first.');
            }
        });
    });
}

function renderProductGrid(products, filter = 'all') {
    const grid = document.getElementById('productGrid') || document.querySelector('.product-grid');
    const carousel = document.getElementById('productCarousel');
    if (!grid && !carousel) return;

    const filtered = filter === 'all'
        ? products
        : products.filter(p => p.category === filter);

    const cards = filtered.map(p => `
        <div class="product-card" data-sku="${p.id}">
            <img src="${p.image}" alt="${p.name}" class="product-image" loading="lazy">
            <h3>${p.name}</h3>
            <p class="product-category">${p.category}</p>
            <p class="product-price">$${p.price}.00</p>
            <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 0.5rem;">
                Color: ${p.color} | Stock: ${p.stock}
            </div>
            <a href="product.html?sku=${p.id}" class="cta-button small">View Details</a>
        </div>
    `).join('');

    if (grid) grid.innerHTML = cards;
    if (carousel) carousel.innerHTML = cards;

    initCarousel();
}

function initCarousel() {
    const carousel = document.getElementById('productCarousel');
    if (!carousel) return;

    const scrollAmount = 320; // card width + gap

    document.getElementById('carouselPrev')?.addEventListener('click', function() {
        carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    document.getElementById('carouselNext')?.addEventListener('click', function() {
        carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
}

function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const search = this.value.toLowerCase();
            const filtered = PRODUCTS.filter(p =>
                p.name.toLowerCase().includes(search) ||
                p.id.toLowerCase().includes(search) ||
                p.category.toLowerCase().includes(search) ||
                p.color.toLowerCase().includes(search)
            );
            renderProductGrid(filtered);
        });
    }
}

function initializeFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const filter = this.dataset.filter;
            renderProductGrid(PRODUCTS, filter);
        });
    });
}

function renderProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const sku = urlParams.get('sku') || 'KING-001';
    const product = PRODUCTS.find(p => p.id === sku);
    if (!product) {
        window.location.href = 'products.html';
        return;
    }

    // Update product detail page elements
    const titleEl = document.getElementById('productTitle');
    const badgeEl = document.getElementById('productCategory');
    const priceEl = document.getElementById('productPrice');
    const descEl = document.getElementById('productDescription');
    const materialEl = document.getElementById('productMaterial');
    const stockEl = document.getElementById('stockBadge');
    const imgEl = document.getElementById('productImage');
    const detailImgEl = document.getElementById('detailImage');
    const sizeSelect = document.getElementById('sizeSelect');

    if (titleEl) titleEl.textContent = product.name;
    if (badgeEl) {
        badgeEl.textContent = product.category;
        badgeEl.className = 'product-badge';
    }
    if (priceEl) priceEl.textContent = `$${product.price}.00`;
    if (descEl) descEl.textContent = `Engineered for urban performance with cinematic style. Material: ${product.material}. Color: ${product.color}.`;
    if (materialEl) materialEl.textContent = product.material;
    if (stockEl) stockEl.textContent = `In Stock (${product.stock} pairs)`;
    if (imgEl) {
        imgEl.src = product.detailImage || product.image;
        imgEl.alt = product.name;
    }
    if (detailImgEl) {
        detailImgEl.src = product.boxImage || product.detailImage;
        detailImgEl.alt = `${product.name} in box`;
    }
    if (sizeSelect) {
        sizeSelect.innerHTML = product.sizes.map(s => `<option value="${s}">US ${s}</option>`).join('');
    }

    // Update thumbnail gallery
    const thumbnails = document.querySelectorAll('.thumbnail');
    if (thumbnails.length > 0 && product.detailImage) {
        thumbnails[0].src = product.image;
        thumbnails[0].onclick = () => { if (imgEl) imgEl.src = product.image; };
    }
    if (thumbnails.length > 1 && product.boxImage) {
        thumbnails[1].src = product.boxImage;
        thumbnails[1].onclick = () => { if (imgEl) imgEl.src = product.boxImage; };
    }

    // Update checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.onclick = function() {
            const selectedSize = sizeSelect ? sizeSelect.value : null;
            if (!selectedSize) {
                alert('Please select a size.');
                return;
            }
            window.location.href = `checkout.html?sku=${product.id}&size=${selectedSize}`;
        };
    }

    // Also handle "CLAIM YOUR PAIR" buttons on this page
    document.querySelectorAll('.cta-button').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const selectedSize = sizeSelect ? sizeSelect.value : null;
            if (!selectedSize) {
                alert('Please select a size.');
                return;
            }
            window.location.href = `checkout.html?sku=${product.id}&size=${selectedSize}`;
        });
    });
}
