/*
 * KingDesignCollectiveInc UI — Shoe Brand Enhanced Interactions
 * Product rendering from Zendrop catalog integration
 * NFC tag interactions for AR card-battler
 */

(function() {
  if (document.body.classList.contains('KingDesignCollectiveINC-shoe-brand')) {

    // Load products from catalog.json
    fetch('catalog.json')
      .then(r => r.json())
      .then(data => {
        const grid = document.getElementById('productGrid');
        if (!grid) return;

        const products = data.products || [];
        grid.innerHTML = products.map(p => `
          <div class="product-card">
            <img src="${p.image || 'images/products/default-side.jpg'}" alt="${p.name}" class="product-image" loading="lazy">
            <div class="product-info">
              <h3>${p.name}</h3>
              <p class="product-price">$${p.price}</p>
              <p class="product-desc">${p.description}</p>
              <span class="nfc-badge">NFC + AR Ready</span>
              <button class="cta-button small" style="margin-top: 1rem;">View Details</button>
            </div>
          </div>
        `).join('');
      })
      .catch(err => {
        console.error('Failed to load catalog:', err);
        const grid = document.getElementById('productGrid');
        if (grid) grid.innerHTML = '<p style="color: var(--color-text-secondary)">Loading products...</p>';
      });

    // NFC tap hint on product pages
    const nfcHint = document.querySelector('.nfc-badge');
    if (nfcHint) {
      nfcHint.addEventListener('click', () => {
        alert('Tap your KingDesignCollectiveInc sneakers with an NFC-enabled device to unlock AR card-battler content!');
      });
    }
  }
})();
