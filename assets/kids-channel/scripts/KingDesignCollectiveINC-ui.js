/*
 * Umbrella UI - Shared Interactive Components
 * Version: 1.0.0
 *
 * Usage: Add to any page with:
 *   <script src="https://kingdesignshoecompany.github.io/KingDesignCollectiveinc/assets/js/KingDesignCollectiveINC-ui.js" defer></script>
 *
 * Required HTML for theme toggle (auto-inserted if not present):
 *   <button class="ui-theme-toggle" id="themeToggle"><span class="icon">🌓</span></button>
 */

(function () {
  "use strict";

  // ─── Theme System ─────────────────────────

  const THEME_KEY = "KingDesignCollectiveINC-theme";
  const THEME_DARK = "dark";
  const THEME_LIGHT = "light";

  /**
   * Apply theme to document element.
   * @param {string} theme
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === THEME_DARK) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Dispatch event so other scripts can react
    window.dispatchEvent(
      new CustomEvent("umbrella:themechange", { detail: { theme: theme } })
    );
  }

  /**
   * Detect OS-level preference for dark mode.
   * @returns {string}
   */
  function detectOSPreference() {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return THEME_DARK;
    }
    return THEME_LIGHT;
  }

  /**
   * Initialize the theme system.
   */
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const theme = saved || detectOSPreference();
    applyTheme(theme);
  }

  /**
   * Toggle between dark and light themes.
   */
  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }

  // ─── Theme Toggle Button ──────────────────

  /**
   * Insert theme toggle button if not present.
   */
  function ensureThemeToggle() {
    if (document.getElementById("themeToggle")) return;

    const toggle = document.createElement("button");
    toggle.id = "themeToggle";
    toggle.className = "ui-theme-toggle";
    toggle.setAttribute("aria-label", "Toggle theme");
    toggle.innerHTML =
      '<span class="icon" id="themeIcon">🌓</span>';

    // Insert at end of body
    document.body.appendChild(toggle);

    // Listen for theme changes to update icon
    window.addEventListener("umbrella:themechange", function (e) {
      const icon = document.getElementById("themeIcon");
      if (icon) {
        icon.textContent = e.detail.theme === THEME_DARK ? "☀️" : "🌓";
      }
    });

    // Click handler
    toggle.addEventListener("click", function (e) {
      e.preventDefault();
      toggleTheme();
    });
  }

  // ─── Smooth Scroll & Anchor Links ─────────

  /**
   * Handle smooth scrolling for anchor links.
   */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      // Skip if it's just "#"
      const href = anchor.getAttribute("href");
      if (href === "#") return;

      anchor.addEventListener("click", function (e) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const offset = 60; // Nav height offset
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
    threshold: 0.1,
  };

  /**
   * Callback for intersection observer.
   * @param {IntersectionObserverEntry[]} entries
   * @param {IntersectionObserver} observer
   */
  function handleIntersect(entries, observer) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("ui-animate-visible");
        observer.unobserve(entry.target);
      }
    });
  }

  const animationObserver = new IntersectionObserver(handleIntersect, observerOptions);

  /**
   * Initialize animation on scroll for elements with .ui-animate class.
   */
  function initAnimations() {
    const elements = document.querySelectorAll(".ui-animate");
    elements.forEach(function (el) {
      // Set initial hidden state
      el.style.opacity = "0";
      el.style.transform = "translateY(12px)";
      el.style.transition = "opacity 0.4s ease, transform 0.4s ease";

      // Reset transform when visible
      el.addEventListener("transitionend", function () {
        // Optional: fire event
      });

      animationObserver.observe(el);
    });

    // Apply visible state via CSS
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

  /**
   * Auto-detect subsidiary from body class or page context.
   */
  function detectSubsidiary() {
    const body = document.body;
    const classes = Array.from(body.classList);
    const umbrellaClass = classes.find(function (c) {
      return c.startsWith("KingDesignCollectiveINC-");
    });
    return umbrellaClass || "KingDesignCollectiveINC-default";
  }

  // ─── Initialization ───────────────────────

  function init() {
    initTheme();
    ensureThemeToggle();
    initSmoothScroll();
    initAnimations();

    // Dispatch init event
    window.dispatchEvent(
      new CustomEvent("umbrella:loaded", {
        detail: {
          theme: localStorage.getItem(THEME_KEY) || detectOSPreference(),
          subsidiary: detectSubsidiary(),
        },
      })
    );
  }

  // ─── Export to window for external use ─────

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

  // ─── Auto-init on DOM ready ───────────────

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
