// Homepage JS: hero carousel, globe map with bundles
var BUNDLES_URL = "../config/bundles.json";
var HOMEPAGE_URL = "../config/homepage.json";
var CAROUSEL_INTERVAL = 5000; // 5 seconds

document.addEventListener("DOMContentLoaded", function() {
    loadHomepageConfig();
    loadBundles();
    initCarousel();
    // Mobile menu toggle is handled by responsive.js
    // initMobileMenu();
});

// — Carousel — //
var carouselState = {
    slides: [],
    currentIndex: 0,
    interval: null,
    isAnimating: false
};

var carouselSlidesEl, carouselDotsEl;

async function initCarousel() {
    carouselSlidesEl = document.getElementById("hero-slides");
    carouselDotsEl = document.getElementById("carousel-dots");

    try {
        // Fetch multiple hero products from bundles + homepage config
        const [homepageRes, bundlesRes] = await Promise.allSettled([
            fetch(HOMEPAGE_URL + "?ts=" + Date.now()),
            fetch(BUNDLES_URL + "?ts=" + Date.now())
        ]);

        const heroes = [];

        if (homepageRes.status === "fulfilled" && homepageRes.value.ok) {
            const hp = await homepageRes.value.json();
            if (hp.hero) heroes.push(hp.hero);
        }

        if (bundlesRes.status === "fulfilled" && bundlesRes.value.ok) {
            const bd = await bundlesRes.value.json();
            const bundles = bd.bundles || bd;
            bundles.forEach(function(b) {
                if (b.items && b.items.length > 0) {
                    b.items.forEach(function(item) {
                        if (item.image) {
                            heroes.push({
                                id: item.id,
                                title: item.title || b.region + " Collection",
                                subtitle: b.region + " | " + (b.items.length > 1 ? b.items.length + " items" : "Featured"),
                                image: item.image.startsWith("http") ? item.image : "../" + item.image,
                                price: item.price,
                                url: "shop.html",
                                region: b.region
                            });
                        }
                    });
                }
            });
        }

        // Deduplicate by id
        const seen = new Set();
        carouselState.slides = heroes.filter(function(h) {
            if (seen.has(h.id)) return false;
            seen.add(h.id);
            return true;
        });

        if (carouselState.slides.length === 0) {
            carouselState.slides = [{
                title: "Travel-Ready Wear",
                subtitle: "Curated for movement",
                image: "../images/products/KING-007-side.jpg",
                price: 249,
                url: "shop.html"
            }];
        }

        renderCarouselSlides();
        renderCarouselDots();
        startAutoRotate();

        // Attach event listeners
        const prevBtn = document.getElementById("carousel-prev");
        const nextBtn = document.getElementById("carousel-next");
        if (prevBtn) prevBtn.addEventListener("click", prevSlide);
        if (nextBtn) nextBtn.addEventListener("click", nextSlide);
    } catch (e) {
        console.warn("Carousel init failed:", e);
    }
}

function renderCarouselSlides() {
    if (!carouselSlidesEl) return;
    carouselSlidesEl.innerHTML = carouselState.slides.map(function(slide, i) {
        var img = slide.image || "";
        return '<div class="carousel-slide" data-index="' + i + '">' +
            '<div class="carousel-slide-content">' +
            '<div class="carousel-hero-text">' +
            '<h2>' + (slide.title || "Travel-Ready Wear") + '</h2>' +
            '<p>' + (slide.subtitle || "Curated for movement") + '</p>' +
            '<button onclick="window.location.href=\'' + (slide.url || "shop.html") + '\'" class="cta-button">Shop Now</button>' +
            '</div>' +
            '<div class="carousel-hero-image">' +
            '<img src="' + img + '" alt="' + (slide.title || "Hero") + '">' +
            '</div>' +
            '</div>' +
            '</div>';
    }).join("");
}

function renderCarouselDots() {
    if (!carouselDotsEl) return;
    carouselDotsEl.innerHTML = carouselState.slides.map(function(_, i) {
        return '<button class="carousel-dot" data-index="' + i + '"></button>';
    }).join("");

    carouselDotsEl.querySelectorAll(".carousel-dot").forEach(function(dot) {
        dot.addEventListener("click", function() {
            goToSlide(Number(dot.dataset.index));
        });
    });
}

function updateCarousel() {
    if (!carouselSlidesEl) return;
    var offset = -carouselState.currentIndex * 100;
    carouselSlidesEl.style.transform = "translateX(" + offset + "%)";

    // Update dots
    if (carouselDotsEl) {
        carouselDotsEl.querySelectorAll(".carousel-dot").forEach(function(dot, i) {
            dot.classList.toggle("active", i === carouselState.currentIndex);
        });
    }
}

function nextSlide() {
    if (carouselState.isAnimating) return;
    carouselState.currentIndex = (carouselState.currentIndex + 1) % carouselState.slides.length;
    updateCarousel();
    resetAutoRotate();
}

function prevSlide() {
    if (carouselState.isAnimating) return;
    carouselState.currentIndex = (carouselState.currentIndex - 1 + carouselState.slides.length) % carouselState.slides.length;
    updateCarousel();
    resetAutoRotate();
}

function goToSlide(index) {
    if (carouselState.isAnimating) return;
    carouselState.currentIndex = index;
    updateCarousel();
    resetAutoRotate();
}

function startAutoRotate() {
    carouselState.interval = setInterval(function() {
        if (!carouselState.isAnimating) {
            nextSlide();
        }
    }, CAROUSEL_INTERVAL);
}

function resetAutoRotate() {
    if (carouselState.interval) clearInterval(carouselState.interval);
    startAutoRotate();
}

// Pause carousel on hover
var carouselContainer;
document.addEventListener("DOMContentLoaded", function() {
    carouselContainer = document.querySelector(".hero-carousel");
    if (carouselContainer) {
        carouselContainer.addEventListener("mouseenter", function() {
            if (carouselState.interval) clearInterval(carouselState.interval);
        });
        carouselContainer.addEventListener("mouseleave", function() {
            startAutoRotate();
        });
    }
});

// — Homepage config (legacy hero, now used by carousel) — //
async function loadHomepageConfig() {
    try {
        var res = await fetch(HOMEPAGE_URL + "?ts=" + Date.now());
        if (!res.ok) return;
        var cfg = await res.json();
        var hero = cfg.hero;
        if (!hero) return;
        var heroContent = document.getElementById("hero-content");
        if (heroContent) {
            heroContent.innerHTML =
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

// — Bundle loading + globe — //
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

// — Interactive 2D globe — //
var globeState = {
    centerX: 250,
    centerY: 140,
    radius: 120,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    selectedRegion: null
};

// Animation loop for globe idle rotation
var globeAnimId = null;
var globeRotAngle = 0;
function startGlobeAnimation() {
    if (globeAnimId) cancelAnimationFrame(globeAnimId);
    var bundles = globeState.bundles || [];
    function animate() {
        // Subtle idle rotation: increment angle smoothly, wrap at 2π
        globeRotAngle += 0.001; // Very slow rotation (~1 deg per frame at 60fps)
        if (globeRotAngle > Math.PI * 2) globeRotAngle = 0;
        // Use sin/cos for smooth, continuous rotation without jumps
        globeState.offsetX = Math.sin(globeRotAngle) * 2;
        globeState.offsetY = Math.cos(globeRotAngle) * 0.5;
        drawGlobe(globeState._ctx, bundles);
        globeAnimId = requestAnimationFrame(animate);
    }
    animate();
}

function renderGlobe(bundles) {
    var canvas = document.getElementById("globe-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    canvas.width = 500;
    canvas.height = 280;

    globeState.centerX = canvas.width / 2;
    globeState.centerY = canvas.height / 2;
    globeState.bundles = bundles;
    globeState._ctx = ctx;

    drawGlobe(ctx, bundles);
    startGlobeAnimation();

    // Click handler for region selection
    canvas.addEventListener("click", function(e) {
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        // Check if any marker was clicked
        bundles.forEach(function(b) {
            if (!b.lat || !b.lng) return;
            var screenX = globeState.centerX + (b.lng / 180) * (globeState.radius * 1.2) + globeState.offsetX;
            var screenY = globeState.centerY - (b.lat / 90) * (globeState.radius * 0.8) + globeState.offsetY;
            var dx = x - screenX;
            var dy = y - screenY;
            if (Math.sqrt(dx * dx + dy * dy) <= 10) {
                // Clicked this region
                globeState.selectedRegion = b.region;
                alert("Selected: " + b.region + "\nOpens shop.html with filter");
                window.location.href = "shop.html?region=" + encodeURIComponent(b.region);
            }
        });
    });

    // Hover tooltips
    canvas.addEventListener("mousemove", function(e) {
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        var hovered = null;
        bundles.forEach(function(b) {
            if (!b.lat || !b.lng) return;
            var screenX = globeState.centerX + (b.lng / 180) * (globeState.radius * 1.2) + globeState.offsetX;
            var screenY = globeState.centerY - (b.lat / 90) * (globeState.radius * 0.8) + globeState.offsetY;
            var dx = x - screenX;
            var dy = y - screenY;
            if (Math.sqrt(dx * dx + dy * dy) <= 10) {
                hovered = b.region;
            }
        });

        // Update cursor
        canvas.style.cursor = hovered ? "pointer" : "default";

        // Show tooltip
        var tooltip = document.getElementById("globe-tooltip");
        if (tooltip) {
            if (hovered) {
                tooltip.textContent = hovered;
                tooltip.style.left = (e.clientX + 10) + "px";
                tooltip.style.top = (e.clientY + 10) + "px";
                tooltip.classList.add("visible");
            } else {
                tooltip.classList.remove("visible");
            }
        }
    });

    // Hide tooltip when leaving canvas
    canvas.addEventListener("mouseleave", function() {
        var tooltip = document.getElementById("globe-tooltip");
        if (tooltip) tooltip.classList.remove("visible");
    });
}

function drawGlobe(ctx, bundles) {
    var W = ctx.canvas.width;
    var H = ctx.canvas.height;
    var cx = globeState.centerX;
    var cy = globeState.centerY;
    var r = globeState.radius * globeState.scale;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Draw globe circle with gradient
    var gradient = ctx.createRadialGradient(
        cx - r * 0.3, cy - r * 0.3, 5,
        cx, cy, r
    );
    gradient.addColorStop(0, "#041423");
    gradient.addColorStop(1, "#010a14");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx + globeState.offsetX, cy + globeState.offsetY, r, 0, Math.PI * 2);
    ctx.fill();

    // Draw grid lines
    ctx.strokeStyle = "rgba(212, 175, 55, 0.1)";
    ctx.lineWidth = 1;
    for (var i = -6; i <= 6; i++) {
        ctx.beginPath();
        ctx.arc(cx + globeState.offsetX, cy + globeState.offsetY, r, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Draw region markers
    bundles.forEach(function(b) {
        if (!b.lat || !b.lng) return;
        var x = cx + (b.lng / 180) * (r * 1.2) + globeState.offsetX;
        var y = cy - (b.lat / 90) * (r * 0.8) + globeState.offsetY;

        // Check if marker is on the visible half of the globe
        var dx = x - cx;
        var dy = y - cy;
        if (Math.sqrt(dx * dx + dy * dy) > r) return; // Skip back-side markers

        // Draw marker with glow
        ctx.shadowColor = "#D4AF37";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#D4AF37";
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Selected region highlight
        if (globeState.selectedRegion === b.region) {
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 9, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw region label
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "9px system-ui";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(b.region, x + 8, y - 2);
    });
}

// — Mobile menu — //
function initMobileMenu() {
    var toggle = document.getElementById("mobile-menu-toggle");
    var navLinks = document.querySelector(".nav-links");
    if (toggle && navLinks) {
        toggle.addEventListener("click", function() {
            toggle.classList.toggle("open");
            navLinks.classList.toggle("active");
        });
    }
}

window.filterByTag = function(tag) {
    window.location.href = "shop.html?tag=" + encodeURIComponent(tag);
};
