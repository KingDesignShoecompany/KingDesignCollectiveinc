/* Umbrella UI — Portal Interactions
 * 3D card hover, floating animations, connection lines
 */
(function() {
  if (document.body.classList.contains('umbrella-portal')) {
    // Floating animation for cards
    const cards = document.querySelectorAll('.sub-card');
    cards.forEach((card, i) => {
      card.style.animationDelay = i * 0.1 + 's';
    });

    // 3D hover effect
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const tiltX = (y - centerY) / centerY * 4;
        const tiltY = (x - centerX) / centerX * -4;
        card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(0) scale3d(1.03, 1.03, 1.03)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0) scale3d(1, 1, 1)';
      });
    });

    // Click ripple effect
    document.addEventListener('click', (e) => {
      if (e.target.closest('.sub-card')) {
        const ripple = document.createElement('div');
        ripple.style.position = 'fixed';
        ripple.style.left = e.clientX + 'px';
        ripple.style.top = e.clientY + 'px';
        ripple.style.width = '12px';
        ripple.style.height = '12px';
        ripple.style.background = 'var(--color-primary)';
        ripple.style.borderRadius = '50%';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = '999';
        ripple.style.animation = 'ripple-pop 1.5s ease-out forwards';
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 1500);
      }
    });
  }
})();
