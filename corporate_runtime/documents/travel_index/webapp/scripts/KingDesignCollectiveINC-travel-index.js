/*
 * Umbrella UI — Travel Index Enhanced Interactions
 * Luxury travel curation: region card hover reveal, interactive map, TikTok feed lazy load
 */

(function() {
  if (document.body.classList.contains('KingDesignCollectiveINC-travel-index')) {
    // Region cards with hover reveal
    const regionCards = document.querySelectorAll('.region-card');
    regionCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-12px) rotateX(5deg)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });

    // Country grid stagger animation
    const countryCards = document.querySelectorAll('.country-card');
    countryCards.forEach((card, i) => {
      card.style.animationDelay = `${i * 0.05}s`;
      card.classList.add('ui-animate');
    });

    // TikTok feed lazy loading
    const tiktokCards = document.querySelectorAll('.tiktok-card');
    if (tiktokCards.length > 0 && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      tiktokCards.forEach(card => observer.observe(card));
    }

    // Completion bar animation on scroll
    const completionBars = document.querySelectorAll('.completion-fill');
    if (completionBars.length > 0 && 'IntersectionObserver' in window) {
      const barObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const target = entry.target.dataset.target || '100';
            entry.target.style.width = target + '%';
            barObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      completionBars.forEach(bar => barObserver.observe(bar));
    }

    // Search input with region filtering
    const searchInput = document.getElementById('countrySearch');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        const search = this.value.toLowerCase();
        const cards = document.querySelectorAll('.country-card');
        cards.forEach(card => {
          const name = card.querySelector('h3')?.textContent.toLowerCase() || '';
          const region = card.querySelector('p')?.textContent.toLowerCase() || '';
          card.style.display = (name.includes(search) || region.includes(search)) ? '' : 'none';
        });
      });
    }
  }
})();
