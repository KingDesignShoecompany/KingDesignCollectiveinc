// Homepage JS: hero config + globe map with bundles
var BUNDLES_URL = "../config/bundles.json";
var HOMEPAGE_URL = "../config/homepage.json";

document.addEventListener("DOMContentLoaded", function() {
    loadHomepageConfig();
    loadBundles();
});

async function loadHomepageConfig() {
    try {
        var res = await fetch(HOMEPAGE_URL + "?ts=" + Date.now());
        if (!res.ok) return;
        var cfg = await res.json();
        var hero = cfg.hero;
        if (!hero) return;
        var heroSection = document.getElementById("hero-content");
        if (heroSection) {
            heroSection.innerHTML =
                "<h2 class='hero-title'>" + (hero.title || "Travel-Ready Wear") + "</h2>" +
                "<p class='hero-subtitle'>" + (hero.subtitle || "Curated for movement") + "</p>";
        }
        var heroImg = document.getElementById("hero-image");
        if (heroImg && hero.image) {
            heroImg.src = hero.image.startsWith("http") ? hero.image : "../" + hero.image;
        }
    } catch (e) {
        console.warn("No homepage config:", e);
    }
}

async function loadBundles() {
    try {
        var res = await fetch(BUNDLES_URL + "?ts=" + Date.now());
        if (!res.ok) return;
        var data = await res.json();
        var bundles = data.bundles || data;
        renderBundleList(bundles);
        renderGlobe(bundles);
    } catch (e) {
        console.warn("No bundles config:", e);
    }
}

function renderBundleList(bundles) {
    var container = document.getElementById("bundle-list");
    if (!container) return;
    container.innerHTML = "";
    bundles.forEach(function(b) {
        var div = document.createElement("div");
        div.className = "bundle-card";
        var itemsHtml = (b.items || []).map(function(i) {
            return "<li><a href='shop.html'>" + i.title + "</a> - $" + i.price + "</li>";
        }).join("");
        div.innerHTML =
            "<h3>" + b.region + "</h3>" +
            "<ul>" + itemsHtml + "</ul>";
        container.appendChild(div);
    });
}

// Simple 2D globe with region markers
function renderGlobe(bundles) {
    var canvas = document.getElementById("globe-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var W = canvas.width;
    var H = canvas.height;

    // Draw globe circle
    ctx.fillStyle = "#020814";
    ctx.beginPath();
    ctx.arc(W/2, H/2, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = "rgba(212, 175, 55, 0.15)";
    ctx.lineWidth = 1;
    for (var i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(W/2, H/2, 120, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Draw region markers
    bundles.forEach(function(b) {
        if (!b.lat || !b.lng) return;
        // Equirectangular projection
        var x = W/2 + (b.lng / 180) * (W/2 - 40);
        var y = H/2 - (b.lat / 90) * (H/2 - 40);
        ctx.fillStyle = "#D4AF37";
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "10px system-ui";
        ctx.fillText(b.region, x + 8, y + 3);
        ctx.fillStyle = "#D4AF37";
    });
}
