/*
 * Umbrella UI — Innovation Hub Enhanced Interactions
 * Tech showcase: metric count-up, tech stack flow animation, terminal typing
 */

(function() {
  if (document.body.classList.contains('umbrella-innovation-hub')) {
    // Metric count-up animation
    const metricValues = document.querySelectorAll('.metric-value');
    if (metricValues.length > 0 && 'IntersectionObserver' in window) {
      const countObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = el.dataset.count || el.textContent;
            const numericTarget = parseFloat(target.replace(/[^\d.-]/g, ''));
            if (!isNaN(numericTarget)) {
              const suffix = target.replace(/[\d.-]/g, '');
              let start = 0;
              const duration = 2000;
              const step = numericTarget / (duration / 16);
              const timer = setInterval(() => {
                start += step;
                if (start >= numericTarget) {
                  el.textContent = numericTarget.toFixed(0) + suffix;
                  clearInterval(timer);
                } else {
                  el.textContent = Math.floor(start).toString() + suffix;
                }
              }, 16);
            }
            countObserver.unobserve(el);
          }
        });
      }, { threshold: 0.5 });
      metricValues.forEach(el => countObserver.observe(el));
    }

    // Tech stack items connection lines
    const stackItems = document.querySelectorAll('.stack-item');
    stackItems.forEach((item, i) => {
      item.style.animationDelay = `${i * 0.1}s`;
      item.style.animation = 'slideIn 0.5s ease forwards';
    });

    // Terminal typing effect for patent form
    const formSections = document.querySelectorAll('.form-section');
    formSections.forEach((section, i) => {
      section.style.opacity = '0';
      section.style.transform = 'translateY(10px)';
      section.style.transition = 'all 400ms ease';
      setTimeout(() => {
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
      }, i * 200);
    });

    // Patent table row highlight on hover
    const tableRows = document.querySelectorAll('.patent-table tbody tr');
    tableRows.forEach(row => {
      row.addEventListener('mouseenter', () => {
        row.style.borderLeft = '3px solid var(--color-primary)';
      });
      row.addEventListener('mouseleave', () => {
        row.style.borderLeft = '';
      });
    });

    // Status badge pulse
    const statusBadges = document.querySelectorAll('.status-badge');
    statusBadges.forEach(badge => {
      if (badge.textContent.includes('active') || badge.textContent.includes('online')) {
        badge.style.animation = 'pulse-status 2s infinite';
      }
    });
  }
})();
