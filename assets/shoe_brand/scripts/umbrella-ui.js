/*
 * Umbrella UI v2.0 — Enhanced Interactive Components
 * Features: Parallax, page transitions, cursor effects, scroll animations
 */

(function () {
  "use strict";

  // ─── Theme System ─────────────────────────
  const THEME_KEY = "umbrella-theme";
  const THEME_DARK = "dark";
  const THEME_LIGHT = "light";

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === THEME_DARK) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.dispatchEvent(new CustomEvent("umbrella:themechange", { detail: { theme } }));
  }

  function detectOSPreference() {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return THEME_DARK;
    }
    return THEME_LIGHT;
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const theme = saved || detectOSPreference();
    applyTheme(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }

  // ─── Page Transitions ─────────────────────
  function initPageTransitions() {
    // Fade in on load
    document.body.style.opacity = "0";
    window.addEventListener("load", function () {
      document.body.style.transition = "opacity 400ms ease, transform 400ms ease";
      document.body.style.opacity = "1";
      document.body.style.transform = "translateY(0)";
    });

    // Fade out on link click for same-site navigation
    document.addEventListener("click", function (e) {
      const link = e.target.closest("a[href]");
      if (!link) return;

      // Skip external links, anchors, and special links
      const href = link.getAttribute("href");
      if (href.startsWith("http") || href.startsWith("#") || href.startsWith("javascript:") ||
          href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      e.preventDefault();
      document.body.style.opacity = "0";
      document.body.style.transform = "translateY(8px)";

      setTimeout(() => {
        window.location.href = href;
      }, 300);
    });
  }

  // ─── Parallax Scrolling ───────────────────
  function initParallax() {
    const parallaxElements = document.querySelectorAll("[data-parallax]");
    if (!parallaxElements.length) return;

    function updateParallax() {
      parallaxElements.forEach(function (el) {
        const speed = parseFloat(el.getAttribute("data-parallax")) || 0.5;
        const yPos = -(window.scrollY * speed);
        el.style.transform = `translate3d(0, ${yPos}px, 0)`;
      });
    }

    // Use requestAnimationFrame for smooth updates
    let ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(function () {
          updateParallax();
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll);
    updateParallax();
  }

  // ─── Cursor Effects ───────────────────────
  function initCursorEffect() {
    // Only enable on desktop (mouse devices)
    if ("ontouchstart" in window) return;

    const cursor = document.createElement("div");
    cursor.className = "luxury-cursor";
    cursor.innerHTML = '<div class="cursor-dot"></div><div class="cursor-ring"></div>';
    document.body.appendChild(cursor);

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

    document.addEventListener("mousemove", function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Smooth cursor follow
    function animateCursor() {
      cursorX += (mouseX - cursorX) * 0.12;
      cursorY += (mouseY - cursorY) * 0.12;
      cursor.style.left = cursorX + "px";
      cursor.style.top = cursorY + "px";
      requestAnimationFrame(animateCursor);
    }

    animateCursor();

    // Hover effects on interactive elements
    const hoverElements = document.querySelectorAll(
      "a, button, .ui-btn, .cta-button, .product-card, .region-card, .feature-card, .device-card, .theme-card"
    );

    hoverElements.forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        cursor.classList.add("cursor-hover");
      });
      el.addEventListener("mouseleave", function () {
        cursor.classList.remove("cursor-hover");
      });
    });
  }

  // ─── Smooth Scroll & Anchor Links ─────────
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      const href = anchor.getAttribute("href");
      if (href === "#") return;

      anchor.addEventListener("click", function (e) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const offset = 80;
          const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top: top, behavior: "smooth" });
        }
      });
    });
  }

  // ─── Animation on Scroll ──────────────────
  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.08,
  };

  function handleIntersect(entries, observer) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("ui-animate-visible");
        observer.unobserve(entry.target);
      }
    });
  }

  const animationObserver = new IntersectionObserver(handleIntersect, observerOptions);

  function initAnimations() {
    const elements = document.querySelectorAll(".ui-animate");
    elements.forEach(function (el) {
      el.style.opacity = "0";
      el.style.transform = "translateY(12px)";
      el.style.transition = "opacity 400ms ease, transform 400ms ease";
      animationObserver.observe(el);
    });

    const style = document.createElement("style");
    style.textContent = `
      .ui-animate.ui-animate-visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ─── Subsidiary Detection ─────────────────
  function detectSubsidiary() {
    const body = document.body;
    const classes = Array.from(body.classList);
    return classes.find(function (c) {
      return c.startsWith("umbrella-");
    }) || "umbrella-default";
  }

  // ─── Theme Toggle Button ──────────────────
  function ensureThemeToggle() {
    if (document.getElementById("themeToggle")) return;

    const toggle = document.createElement("button");
    toggle.id = "themeToggle";
    toggle.className = "ui-theme-toggle";
    toggle.setAttribute("aria-label", "Toggle theme");
    toggle.innerHTML = '<span class="icon">🌓</span>';

    document.body.appendChild(toggle);

    window.addEventListener("umbrella:themechange", function (e) {
      const icon = toggle.querySelector(".icon");
      if (icon) {
        icon.textContent = e.detail.theme === THEME_DARK ? "☀️" : "🌓";
      }
    });

    toggle.addEventListener("click", function (e) {
      e.preventDefault();
      toggleTheme();
    });
  }

  // ─── Initialization ───────────────────────
  function init() {
    // Add ui-ready class after a brief delay for smooth fade-in
    document.body.classList.add("ui-ready");

    initTheme();
    ensureThemeToggle();
    initSmoothScroll();
    initAnimations();
    initParallax();
    initPageTransitions();
    initCursorEffect();

    window.dispatchEvent(new CustomEvent("umbrella:loaded", {
      detail: {
        theme: localStorage.getItem(THEME_KEY) || detectOSPreference(),
        subsidiary: detectSubsidiary(),
      },
    }));
  }

  // ─── Export ───────────────────────────────
  window.UmbrellaUI = {
    init: init,
    theme: {
      apply: applyTheme,
      toggle: toggleTheme,
      get: function () {
        return localStorage.getItem(THEME_KEY) || detectOSPreference();
      },
    },
    subsidiary: detectSubsidiary,
  };

  // ─── Auto-init ────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
