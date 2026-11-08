/* ==========================================================================
   KingDesignCollectiveINC UI — Quantum Wearables Enhanced Interactions
   Product-showcase interactions: exploded-device hover reveal, sensor mesh
   hover, intelligence-pipeline ripple, luxury cursor, scroll reactive glow.
   ========================================================================== */

(function() {
  "use strict";

  const QUANTUM_CLASS = "KingDesignCollectiveINC-quantum-wearables";

  function $(sel, root) {
    root = root || document;
    return root.querySelector(sel);
  }

  function $$(sel, root) {
    root = root || document;
    return Array.prototype.slice.call(root.querySelectorAll(sel));
  }

  function on(el, ev, fn) {
    if (!el) return;
    el.addEventListener(ev, fn);
  }

  // ---------------------------------------------------------------
  // Decorative: add extra orbital nodes to hero for liveliness
  // ---------------------------------------------------------------
  function addOrbitingNodes() {
    const hero = document.querySelector(".qc-hero");
    if (!hero) return;

    // inner ring nodes (already in HTML, add a few more via JS for visual richness)
    const ring = document.createElement("div");
    ring.className = "qc-orbiting-nodes";
    for (let i = 0; i < 8; i++) {
      const span = document.createElement("span");
      span.style.animationDelay = (i * 3) + "s";
      ring.appendChild(span);
    }
    hero.appendChild(ring);
  }

  // ---------------------------------------------------------------
  // Exploded device layers: hover a .qc-stack-layer to highlight on .qc-layer-name
  // Also: mouseenter on a layer reveals a spec popover (visual only).
  // ---------------------------------------------------------------
  function bindExplodedLayers() {
    const layers = $$(".qc-stack-layer");
    layers.forEach(function(layer) {
      const name = layer.querySelector(".qc-layer-name");
      const desc = layer.querySelector(".qc-layer-desc");
      const spec = layer.getAttribute("data-spec");

      on(layer, "mouseenter", function() {
        // highlight ring on the layer head
        const head = layer.querySelector(".qc-layer-head");
        head.style.color = "#fff";
        head.style.background = "rgba(124, 111, 240, 0.25)";
        head.style.borderRadius = "var(--border-radius-sm)";
        head.style.padding = "0.25rem 0.5rem";

        if (desc) {
          // subtle brightening of the layer
          layer.style.borderColor = "rgba(255,158,0,0.35)";
          desc.style.color = "#fff";
        }
      });

      on(layer, "mouseleave", function() {
        const head = layer.querySelector(".qc-layer-head");
        head.style.color = "var(--color-accent)";
          head.style.background = "transparent";
          head.style.borderRadius = "0";
          head.style.padding = "0";

        layer.style.borderColor = "var(--color-border)";
        desc.style.color = "var(--color-text-tertiary)";
      });

      // Provide a small spec tooltip on hover via a floating badge
      on(layer, "mouseover", function() {
        let badge = layer.querySelector(".qc-spec-tooltip");
        if (!badge) {
          badge = document.createElement("div");
          badge.className = "qc-spec-tooltip";
          badge.textContent = spec;
          badge.style.cssText =
            "position:absolute;top:-6px;right:-6px;padding:0.25rem 0.5rem;border-radius:var(--border-radius-sm);font-size:0.625rem;font-family:var(--font-display);color:#fff;letter-spacing:0.05em;text-transform:uppercase;background:rgba(0,180,216,0.85);border:1px solid rgba(255,255,255,0.15);pointer-events:none;z-index:20;transform:translate(0,0);";
          layer.appendChild(badge);
        }
        // keep visible
      });

      on(layer, "mouseout", function() {
        const badge = layer.querySelector(".qc-spec-tooltip");
        if (badge) {
          badge.style.opacity = "0";
          setTimeout(function() { if (badge.parentNode) badge.parentNode.removeChild(badge); }, 300);
        }
      });
    });
  }

  // ---------------------------------------------------------------
  // Sensor mesh hover: highlight connected nodes and links
  // ---------------------------------------------------------------
  function bindSensorMesh() {
    const mesh = document.querySelector(".qc-sensor-mesh");
    if (!mesh) return;

    const nodes = $$(".qc-node", mesh);
    const links = $$(".qc-link", mesh);

    nodes.forEach(function(node) {
      const label = node.getAttribute("data-label");
      on(node, "mouseenter", function() {
        // pulse the active node
        node.style.boxShadow = "0 0 24px #00b4d8, 0 0 50px rgba(0,180,216,0.45)";
        node.style.transform = "scale(1.5)";

        // highlight connected links and other nodes
        links.forEach(function(link) {
          link.style.opacity = "0.6";
          link.style.background = "linear-gradient(90deg, rgba(0,180,216,0.5), transparent)";
        });

        nodes.forEach(function(n) {
          if (n === node) return;
          n.style.transform = "scale(1.3)";
          n.style.boxShadow = "0 0 20px rgba(255,158,0,0.35)";
        });
      });

      on(node, "mouseleave", function() {
        node.style.boxShadow = "0 0 12px #00b4d8, 0 0 30px rgba(0,180,216,0.2)";
        node.style.transform = "scale(1)";

        links.forEach(function(link) {
          link.style.opacity = "0.3";
          link.style.background = "linear-gradient(90deg, rgba(0,180,216,0.2), transparent)";
        });

        nodes.forEach(function(n) {
          if (n === node) return;
          n.style.transform = "scale(1)";
          n.style.boxShadow = "0 0 12px #00b4d8, 0 0 30px rgba(0,180,216,0.2)";
        });
      });
    });
  }

  // ---------------------------------------------------------------
  // Intelligence pipeline: pulse the active node
  // ---------------------------------------------------------------
  function bindPipeline() {
    const nodes = $$(".qc-pipeline-node");
    nodes.forEach(function(node, i) {
      on(node, "mouseenter", function() {
        node.style.transform = "translateY(-6px)";
        node.style.boxShadow = "0 0 20px var(--color-accent), 0 0 40px rgba(255,158,0,0.2)";
      });
      on(node, "mouseleave", function() {
        node.style.transform = "translateY(0)";
        node.style.boxShadow = "none";
      });
    });
  }

  // ---------------------------------------------------------------
  // Luxury cursor (optional, active only if theme allows)
  // ---------------------------------------------------------------
  function initCursor() {
    const cursorWrap = document.createElement("div");
    cursorWrap.className = "luxury-cursor";
    cursorWrap.innerHTML =
      '<div class="cursor-ring"></div>' +
      '<div class="cursor-dot"></div>';
    document.body.appendChild(cursorWrap);

    const dot = cursorWrap.querySelector(".cursor-dot");
    const ring = cursorWrap.querySelector(".cursor-ring");

    on(document, "mousemove", function(e) {
      dot.style.left = (e.clientX - 3) + "px";
      dot.style.top = (e.clientY - 3) + "px";
      ring.style.left = (e.clientX - 20) + "px";
      ring.style.top = (e.clientY - 20) + "px";

      // subtle cross-fade on the hero device as cursor tracks
      const device = document.querySelector(".qc-device-body");
      if (device && !document.body.classList.contains("cursor-hover")) {
        // keep light on hover
      }
    });

    // fade rings on hover
    on(cursorWrap, "mouseenter", function() {
      cursorWrap.classList.add("cursor-hover");
    });
    on(cursorWrap, "mouseleave", function() {
      cursorWrap.classList.remove("cursor-hover");
    });
  }

  // ---------------------------------------------------------------
  // Intersection Observer: reveal scroll sections (ui-animate)
  // (uses the shared design system's ui-animate class if present)
  // ---------------------------------------------------------------
  function bindReveal() {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("ui-animate-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    $$(".qc-section, .qc-hero, .qc-ecosystem-card, .qc-stack-layer").forEach(function(el) {
      el.classList.add("ui-animate");
      io.observe(el);
    });
  }

  // ---------------------------------------------------------------
  // Keep the hero device body subtly alive (pulse on scroll)
  // ---------------------------------------------------------------
  function bindHeroPulse() {
    let last = 0;
    on(window, "scroll", function() {
      const now = Date.now();
      if (now - last < 60) return;
      last = now;
      const device = document.querySelector(".qc-device-body");
      if (device) {
        // subtle intensity change
        const intensity = 1 + Math.sin(now * 0.01) * 0.15;
        device.style.boxShadow = "0 0 80px rgba(0,180,216," + intensity + "), 0 0 110px rgba(0,180,216," + (intensity * 1.2) + ")";
      }
    });
  }

  // ---------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------
  function boot() {
    addOrbitingNodes();
    bindExplodedLayers();
    bindSensorMesh();
    bindPipeline();
    initCursor();
    bindReveal();
    bindHeroPulse();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
