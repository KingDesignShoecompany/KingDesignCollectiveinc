/*
 * Umbrella UI — Quantum Wearables Enhanced Interactions
 * Sci-fi UX: live metric pulsing, device status indicators, thermal simulation
 */

(function() {
  if (document.body.classList.contains('KingDesignCollectiveINC-quantum-wearables')) {
    // Live metric pulsing
    const metricCards = document.querySelectorAll('.metric-card');
    metricCards.forEach((card, i) => {
      card.style.animationDelay = `${i * 0.3}s`;
      const status = card.querySelector('.metric-status');
      if (status) {
        const statusText = status.textContent.trim().toUpperCase();
        if (statusText.includes('CRITICAL')) {
          status.style.color = '#ff4757';
        } else if (statusText.includes('WARN')) {
          status.style.color = 'var(--color-accent)';
        }
      }
    });

    // Particle field generation
    const particleContainer = document.querySelector('.particle-field');
    if (particleContainer) {
      for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.width = `${Math.random() * 3 + 1}px}`;
        particle.style.height = particle.style.width;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 10}s`;
        particleContainer.appendChild(particle);
      }
    }

    // Thermal simulator form interaction
    const simForm = document.querySelector('.sim-form');
    if (simForm) {
      const inputs = simForm.querySelectorAll('input');
      inputs.forEach(input => {
        input.addEventListener('input', () => {
          const resultItems = document.querySelectorAll('.result-item');
          resultItems.forEach((item, i) => {
            item.style.opacity = '0.5';
            setTimeout(() => item.style.opacity = '1', i * 200);
          });
        });
      });
    }

    // Device cards status cycling
    const deviceCards = document.querySelectorAll('.device-card');
    deviceCards.forEach((card, i) => {
      card.style.animationDelay = `${i * 0.2}s`;
    });

    // Graph placeholder with simulated data points
    const graphPlaceholders = document.querySelectorAll('.graph-placeholder');
    graphPlaceholders.forEach(ph => {
      ph.innerHTML = '<p>Live Data Stream</p><div class="data-points"></div>';
      const dataPoints = ph.querySelector('.data-points');
      for (let i = 0; i < 20; i++) {
        const point = document.createElement('span');
        point.style.display = 'inline-block';
        point.style.width = '4px';
        point.style.height = `${Math.random() * 60 + 20}px}`;
        point.style.background = 'var(--color-primary)';
        point.style.margin = '0 1px';
        point.style.opacity = `${Math.random() * 0.5 + 0.3}`;
        point.style.animation = 'data-pulse 2s ease infinite';
        point.style.animationDelay = `${Math.random() * 2}s`;
        dataPoints.appendChild(point);
      }
    });

    // Scan line effect for quantum header
    const header = document.querySelector('.quantum-header');
    if (header) {
      const scanLine = document.createElement('div');
      scanLine.style.position = 'absolute';
      scanLine.style.top = '0';
      scanLine.style.left = '0';
      scanLine.style.width = '100%';
      scanLine.style.height = '1px';
      scanLine.style.background = 'var(--gradient-accent)';
      scanLine.style.animation = 'scan 3s linear infinite';
      header.appendChild(scanLine);
    }
  }
})();
