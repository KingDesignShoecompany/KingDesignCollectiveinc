/*
 * Umbrella UI — Kids Channel Enhanced Interactions
 * Immersive storytelling: star click effects, play button pulse, reading progress
 */

(function() {
  if (document.body.classList.contains('KingDesignCollectiveINC-kids-channel')) {
    // Create floating stars
    const starsContainer = document.createElement('div');
    starsContainer.className = 'stars-floating';
    starsContainer.style.position = 'fixed';
    starsContainer.style.top = '0';
    starsContainer.style.left = '0';
    starsContainer.style.width = '100%';
    starsContainer.style.height = '100%';
    starsContainer.style.pointerEvents = 'none';
    starsContainer.style.zIndex = '-1';
    document.body.prepend(starsContainer);

    for (let i = 0; i < 60; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.width = `${Math.random() * 3 + 1}px}`;
      star.style.height = star.style.width;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * 5}s`;
      star.style.opacity = `${Math.random() * 0.6 + 0.2}`;
      starsContainer.appendChild(star);
    }

    // Click creates ripple effect
    document.addEventListener('click', (e) => {
      const ripple = document.createElement('div');
      ripple.style.position = 'fixed';
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      ripple.style.width = '12px';
      ripple.style.height = '12px';
      ripple.style.background = 'var(--color-primary)';
      ripple.style.borderRadius = '50%';
      ripple.style.pointerEvents = 'none';
      ripple.style.zIndex = '999';
      ripple.style.animation = 'ripple-pop 1.5s ease-out forwards';
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 1500);
    });

    // Play button animation
    const playButton = document.querySelector('.play-overlay');
    if (playButton) {
      playButton.addEventListener('click', () => {
        playButton.style.animation = 'none';
        setTimeout(() => {
          playButton.style.animation = 'pulse-play 0.5s ease 3';
        }, 10);
      });
    }

    // Age selector interaction
    const ageButtons = document.querySelectorAll('.age-btn');
    ageButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        ageButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Story cards glow pulse
    const storyCards = document.querySelectorAll('.theme-card');
    storyCards.forEach((card, i) => {
      card.style.animationDelay = `${i * 0.2}s`;
    });
  }
})();
