/*
 * KingDesignCollectiveINC UI — e-Waste Recycling Enhanced Interactions
 * Industrial dashboard: live metric pulsing, constraint status updates, table animations
 */

(function() {
  if (document.body.classList.contains('KingDesignCollectiveINC-ewaste-recycling')) {
    // Constraint status pulsing
    const constraints = document.querySelectorAll('.constraint-status');
    constraints.forEach(status => {
      const text = status.textContent.trim().toUpperCase();
      if (text.includes('WARN') || text.includes('WARNING')) {
        status.style.color = 'var(--color-accent)';
        status.style.animation = 'pulse-warning 2s infinite';
      } else if (text.includes('CRITICAL') || text.includes('FAIL')) {
        status.style.color = '#ff4757';
        status.style.animation = 'pulse-critical 1s infinite';
      } else {
        status.style.color = 'var(--color-primary)';
      }
    });

    // Compliance list items staggered animation
    const complianceItems = document.querySelectorAll('.compliance-item');
    complianceItems.forEach((item, i) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(15px)';
      item.style.transition = 'all 500ms ease';
      setTimeout(() => {
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      }, i * 150);
    });

    // Recovery table row highlight
    const tableRows = document.querySelectorAll('.recovery-table tbody tr');
    tableRows.forEach(row => {
      row.addEventListener('mouseenter', () => {
        row.style.borderLeft = '3px solid var(--color-primary)';
        row.style.boxShadow = 'inset 0 0 20px rgba(255, 107, 53, 0.1)';
      });
      row.addEventListener('mouseleave', () => {
        row.style.borderLeft = '';
        row.style.boxShadow = '';
      });
    });

    // Metric hover pulse enhancement
    const metricCards = document.querySelectorAll('.metric-card');
    metricCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        const value = card.querySelector('.metric-value');
        if (value) {
          value.style.textShadow = '0 0 20px rgba(255, 107, 53, 0.5)';
        }
      });
      card.addEventListener('mouseleave', () => {
        const value = card.querySelector('.metric-value');
        if (value) {
          value.style.textShadow = '0 0 10px rgba(255, 107, 53, 0.3)';
        }
      });
    });

    // Report action buttons
    const actionButtons = document.querySelectorAll('.report-actions .cta-button');
    actionButtons.forEach((btn, i) => {
      btn.style.animationDelay = `${i * 0.1}s`;
    });
  }
})();

@keyframes pulse-critical {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
