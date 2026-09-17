/*
 * Umbrella UI — Shoe Brand Enhanced Interactions
 * Luxury e-commerce: NFC tap integration, 3D product showcase, cart simulation
 */

// NFC tap hint on product pages
(function() {
  if (document.body.classList.contains('KingDesignCollectiveINC-shoe-brand')) {
    // Product card 3D tilt effect
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const tiltX = (y - centerY) / centerY * 5;
        const tiltY = (x - centerX) / centerX * -5;
        card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(0) scale3d(1.02, 1.02, 1.02)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0) scale3d(1, 1, 1)';
      });
    });

    // NFC tap hint
    const productDetail = document.querySelector('.product-detail') || document.querySelector('.product-image');
    if (productDetail) {
      const hint = document.createElement('div');
      hint.className = 'nfc-tap-hint';
      hint.innerHTML = '<span class="pulse"></span> Tap with NFC-enabled device';
      document.body.appendChild(hint);

      productDetail.addEventListener('mouseenter', () => hint.classList.add('visible'));
      productDetail.addEventListener('mouseleave', () => hint.classList.remove('visible'));
    }

    // Floating hero logo animation
    const heroLogo = document.querySelector('.hero-logo');
    if (heroLogo) {
      heroLogo.style.animation = 'float 6s ease-in-out infinite';
    }

    // AR badge interaction
    const arTag = document.querySelector('.ar-tag');
    if (arTag) {
      arTag.innerHTML = '<span>📱</span> AR Experience';
      arTag.style.cursor = 'pointer';
      arTag.addEventListener('click', () => {
        alert('AR view launching... (Demo)');
      });
    }

    // Floating cart button
    const cartBtn = document.querySelector('.cta-button[href*="checkout"]');
    if (cartBtn) {
      cartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const card = cartBtn.closest('.product-card');
        if (card) {
          card.classList.add('cart-adding');
          setTimeout(() => card.classList.remove('cart-adding'), 600);
          setTimeout(() => window.location.href = cartBtn.href, 600);
        }
      });
    }
  }
})();
