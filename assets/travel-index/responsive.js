/*
 * responsive.js - Mobile-first responsive behaviour for Vagary Index
 * Handles: hamburger menu toggle, touch-friendly carousel swipe support,
 *          adaptive globe canvas sizing, and mobile search input sizing.
 *
 * Theme: Gold (#D4AF37) / Black (#0A0A0A) — vanilla JS, no frameworks.
 */
(function () {
  "use strict";

  // ─── Hamburger menu toggle ─────────────────────────────────────────────────
  function initMobileMenu() {
    var toggle = document.getElementById("mobile-menu-toggle");
    var navLinks = document.querySelector(".nav-links");
    if (!toggle || !navLinks) return;

    toggle.addEventListener("click", function () {
      var expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.classList.toggle("open");
      navLinks.classList.toggle("active");
      toggle.setAttribute("aria-expanded", !expanded);
    });

    // Close menu when a link is clicked (mobile navigation)
    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth <= 768) {
          toggle.classList.remove("open");
          navLinks.classList.remove("active");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  // ─── Touch-friendly carousel with swipe support ─────────────────────────
  function initSwipeCarousel() {
    var carousel = document.querySelector(".hero-carousel");
    var slidesEl = document.getElementById("hero-slides");
    if (!carousel || !slidesEl) return;

    var isDragging = false;
    var startX = 0;
    var deltaX = 0;
    var threshold = 40; // minimum px to register a swipe

    // Touch events
    carousel.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) return;
      isDragging = true;
      startX = e.touches[0].clientX;
      deltaX = 0;
      carousel.style.transition = "none";
    });

    carousel.addEventListener("touchmove", function (e) {
      if (!isDragging) return;
      e.preventDefault(); // prevent page scroll while swiping
      var currentX = e.touches[0].clientX;
      deltaX = currentX - startX;
      // Apply a subtle "drag" transform (limited range)
      var maxDrag = 80;
      var limitedDelta = Math.max(-maxDrag, Math.min(maxDrag, deltaX));
      var offset = -carouselState.currentIndex * 100 + (limitedDelta / carousel.offsetWidth) * 100;
      slidesEl.style.transform = "translateX(" + offset + "%)";
    });

    carousel.addEventListener("touchend", function (e) {
      if (!isDragging) return;
      isDragging = false;
      carousel.style.transition = "";
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && typeof prevSlide === "function") {
          prevSlide();
        } else if (deltaX < 0 && typeof nextSlide === "function") {
          nextSlide();
        }
      }
      updateCarousel();
    });

    // Mouse drag support (desktop fallback for testing)
    carousel.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return; // only left click
      isDragging = true;
      startX = e.clientX;
      deltaX = 0;
      carousel.style.cursor = "grabbing";
      carousel.style.transition = "none";
    });

    document.addEventListener("mousemove", function (e) {
      if (!isDragging) return;
      e.preventDefault();
      var currentX = e.clientX;
      deltaX = currentX - startX;
      var maxDrag = 80;
      var limitedDelta = Math.max(-maxDrag, Math.min(maxDrag, deltaX));
      var offset = -carouselState.currentIndex * 100 + (limitedDelta / carousel.offsetWidth) * 100;
      slidesEl.style.transform = "translateX(" + offset + "%)";
    });

    document.addEventListener("mouseup", function () {
      if (!isDragging) return;
      isDragging = false;
      carousel.style.cursor = "";
      carousel.style.transition = "";
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && typeof prevSlide === "function") {
          prevSlide();
        } else if (deltaX < 0 && typeof nextSlide === "function") {
          nextSlide();
        }
      }
      updateCarousel();
    });
  }

  // ─── Adaptive globe canvas sizing ───────────────────────────────────────
  function initAdaptiveGlobe() {
    var canvas = document.getElementById("globe-canvas");
    if (!canvas) return;

    // Store natural size as data attributes if not already set
    if (!canvas.dataset.naturalWidth) {
      canvas.dataset.naturalWidth = canvas.width || 500;
      canvas.dataset.naturalHeight = canvas.height || 280;
    }

    var sizes = {
      // (width, height) for each breakpoint tier
      xs: { w: 280, h: 180, r: 85, cx: 140, cy: 90 },   // < 480px
      sm: { w: 360, h: 220, r: 95, cx: 180, cy: 110 },  // 480px–767px
      md: { w: 420, h: 260, r: 110, cx: 210, cy: 130 }, // 768px–1023px
      lg: { w: 500, h: 300, r: 120, cx: 250, cy: 150 }  // >= 1024px
    };

    function getSize() {
      var w = window.innerWidth;
      if (w < 480) return sizes.xs;
      if (w < 768) return sizes.sm;
      if (w < 1024) return sizes.md;
      return sizes.lg;
    }

    function resizeCanvas() {
      var s = getSize();
      canvas.width = s.w;
      canvas.height = s.h;

      // Update globe state if the drawGlobe function is available
      if (window.globeState) {
        window.globeState.centerX = s.cx;
        window.globeState.centerY = s.cy;
        window.globeState.radius = s.r;
      }

      // Redraw if drawGlobe is available (from homepage.js)
      if (typeof window.drawGlobe === "function") {
        var ctx = canvas.getContext("2d");
        // Use current bundles if available
        var bundles = window.globeState && window.globeState._bundles ? window.globeState._bundles : [];
        window.drawGlobe(ctx, bundles);
      }
    }

    // Resize on load and on breakpoint change
    window.addEventListener("resize", resizeCanvas);
    // Use matches to avoid firing on every resize pixel — debounce
    var resizeTimer = null;
    var debouncedResize = function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeCanvas, 150);
    };
    window.addEventListener("resize", debouncedResize);

    // Initial sizing
    resizeCanvas();
  }

  // ─── Mobile search container input sizing ───────────────────────────────
  function initMobileSearch() {
    var searchContainer = document.querySelector(".search-container");
    var searchInput = document.querySelector(".search-input") || document.getElementById("search");
    if (!searchContainer || !searchInput) return;

    function adjustSearchInput() {
      if (window.innerWidth <= 480) {
        // Full-width input on mobile with proper touch targets
        searchInput.style.width = "100%";
        searchInput.style.maxWidth = "100%";
        searchInput.style.fontSize = "16px"; // prevents iOS zoom
      } else if (window.innerWidth <= 768) {
        searchInput.style.width = "280px";
        searchInput.style.fontSize = "14px";
      } else {
        // Reset to CSS-defined width for desktop
        searchInput.style.width = "";
        searchInput.style.maxWidth = "";
      }
    }

    window.addEventListener("resize", adjustSearchInput);
    adjustSearchInput();
  }

  // ─── Initialize all responsive behaviours ──────────────────────────────
  function init() {
    // Hamburger menu toggle (works after DOM or dynamic content)
    initMobileMenu();

    // Carousel swipe (after DOMContentLoaded so carousel elements exist)
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        initSwipeCarousel();
        initAdaptiveGlobe();
        initMobileSearch();
      });
    } else {
      initSwipeCarousel();
      initAdaptiveGlobe();
      initMobileSearch();
    }
  }

  // Expose for potential manual re-init
  window.initResponsive = init;

  // Auto-initialize
  init();
})();
