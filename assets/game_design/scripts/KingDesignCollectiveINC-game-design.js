/*
 * Umbrella UI — Game Design Enhanced Interactions
 * AR card battler: card hover reveal, 3D flip, NFT rarity animation
 */

(function() {
  if (document.body.classList.contains('KingDesignCollectiveINC-game-design')) {
    // 3D card frame interaction
    const cardFrames = document.querySelectorAll('.ar-card-reveal .card-frame');
    cardFrames.forEach(frame => {
      frame.addEventListener('mouseenter', () => {
        frame.style.transform = 'perspective(1200px) rotateY(10deg) scale(1.03)';
      });
      frame.addEventListener('mouseleave', () => {
        frame.style.transform = 'perspective(1200px) rotateY(0) scale(1)';
      });
    });

    // Card hover glow intensifies
    const cards = document.querySelectorAll('.feature-card, .trinity-card');
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.boxShadow = '0 0 40px rgba(187, 134, 255, 0.5)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.boxShadow = '';
      });
    });

    // CTA button pulse on hover
    const ctas = document.querySelectorAll('.cta-button');
    ctas.forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.animation = 'cta-pulse 1.5s ease infinite';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.animation = 'none';
      });
    });

    // Milestone badges cycle animation
    const statBadges = document.querySelectorAll('.stat-badge');
    if (statBadges.length > 0) {
      let current = 0;
      setInterval(() => {
        statBadges.forEach((b, i) => {
          b.style.opacity = i === current ? '1' : '0.5';
        });
        current = (current + 1) % statBadges.length;
      }, 3000);
    }

    // Terminal text effect on header
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
      const original = heroTitle.textContent;
      let i = 0;
      const typeInterval = setInterval(() => {
        if (i <= original.length) {
          heroTitle.textContent = original.substring(0, i) + '|';
          i++;
        } else {
          heroTitle.textContent = original;
          clearInterval(typeInterval);
        }
      }, 50);
    }
  }
})();
