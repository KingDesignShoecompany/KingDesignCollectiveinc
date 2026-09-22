// Country detail page: dynamically load country data from JSON
// Reads ?code=XXX from URL, fetches country_guides/XXX.json

var COUNTRY_GUIDES_URL = "country_guides/";

document.addEventListener("DOMContentLoaded", function() {
    loadCountryFromUrl();
});

// Extract country code from URL query string
function getCountryCode() {
    var params = new URLSearchParams(window.location.search);
    var code = params.get("code") || params.get("country");
    if (!code) {
        // Try path-based routing: /country/JPN.html or /country.html?code=JPN
        var pathParts = window.location.pathname.split("/");
        var lastPart = pathParts[pathParts.length - 1];
        if (lastPart.match(/\.html$/)) {
            var stem = lastPart.replace(/\.html$/, "");
            if (stem.length === 3 && /^[A-Z]{3}$/.test(stem)) {
                code = stem;
            }
        }
    }
    return code ? code.toUpperCase() : null;
}

function loadCountryFromUrl() {
    var code = getCountryCode();
    if (!code) {
        // Default to first country if no code specified
        code = "JPN";
    }
    fetchCountry(code);
}

function fetchCountry(code) {
    var url = COUNTRY_GUIDES_URL + code + ".json";
    fetch(url + "?ts=" + Date.now())
        .then(function(res) {
            if (!res.ok) throw new Error("Country not found: " + code);
            return res.json();
        })
        .then(function(data) {
            renderCountry(data, code);
        })
        .catch(function(err) {
            console.error("Failed to load country:", err);
            // Try to fetch the list of available countries
            fetchCountryList();
        });
}

function fetchCountryList() {
    // Fallback: try to find first available country
    var commonCodes = ["JPN", "USA", "GBR", "DEU", "FRA", "JPN"];
    var idx = 0;
    
    function tryNext() {
        if (idx >= commonCodes.length) {
            console.error("No country data available at all");
            return;
        }
        var code = commonCodes[idx];
        idx++;
        fetch(COUNTRY_GUIDES_URL + code + ".json")
            .then(function(res) {
                if (!res.ok) throw new Error("Not found");
                return res.json();
            })
            .then(function(data) {
                renderCountry(data, code);
            })
            .catch(function() {
                setTimeout(tryNext, 100); // Try next with small delay
            });
    }
    tryNext();
}

function renderCountry(data, code) {
    document.title = "The Vagary Index | " + (data.country_name || code);
    
    var nameEl = document.getElementById("countryName");
    if (nameEl) nameEl.textContent = data.country_name || code;
    
    var codeEl = document.getElementById("countryCode");
    if (codeEl) codeEl.textContent = data.country_code || code;
    
    var regionEl = document.getElementById("countryRegion");
    if (regionEl) regionEl.textContent = extractRegion(data);
    
    // History & Culture
    var histEl = document.getElementById("countryHistory");
    if (histEl) histEl.textContent = data.history_culture || "Country information not available.";
    
    // Completion status
    var statusEl = document.getElementById("guideStatus");
    if (statusEl) statusEl.textContent = data.complete ? "Complete" : "Incomplete";
    
    var badgeEl = document.getElementById("completionBadge");
    if (badgeEl) {
        var pct = calcCompletionPercent(data);
        badgeEl.textContent = pct + "%";
        badgeEl.className = "completion-badge " + (pct >= 80 ? "complete" : "partial");
    }
    
    // Entry Requirements
    var entry = data.entry_requirements || {};
    var visaEl = document.getElementById("visaRequired");
    if (visaEl) visaEl.textContent = entry.visa_required ? "Yes - " + (entry.visa_required_duration || "") + " days" : "No visa required";
    
    var passportEl = document.getElementById("passportValidity");
    if (passportEl) passportEl.textContent = entry.passport_validity || "Check with embassy";
    
    var entryNotes = document.getElementById("entryNotes");
    if (entryNotes && entry.notes) {
        entryNotes.innerHTML = entry.notes.map(function(n) {
            return "<li>" + n + "</li>";
        }).join("");
    }
    
    // Climate
    var climate = data.climate || {};
    var bestTravelEl = document.getElementById("bestTravelMonths");
    if (bestTravelEl) bestTravelEl.textContent = climate.best_travel_months || "N/A";
    
    var beachEl = document.getElementById("beachSeason");
    if (beachEl) beachEl.textContent = climate.beach_season || "N/A";
    
    var mountainEl = document.getElementById("mountainSeason");
    if (mountainEl) mountainEl.textContent = climate.mountain_season || "N/A";
    
    var avoidEl = document.getElementById("avoid");
    if (avoidEl) avoidEl.textContent = climate.avoid || "N/A";
    
    // Currency
    var currencyEl = document.getElementById("currencyCode");
    if (currencyEl) currencyEl.textContent = data.currency_code || data.currency || data.iso_code || "N/A";
    
    var languageEl = document.getElementById("language");
    if (languageEl) languageEl.textContent = data.languages ? data.languages.join(", ") : "N/A";
    
    // Attractions
    var attractionsEl = document.getElementById("attractionsList");
    if (attractionsEl && data.attractions && data.attractions.length > 0) {
        attractionsEl.innerHTML = data.attractions.map(function(a) {
            return "<li>" + escapeHtml(a) + "</li>";
        }).join("");
    }
    
    // Top experiences
    var top10El = document.getElementById("top10List");
    if (top10El && data.top10_experiences && data.top10_experiences.length > 0) {
        top10El.innerHTML = data.top10_experiences.map(function(exp, i) {
            return "<li><strong>" + (i + 1) + "</strong>. " + escapeHtml(exp) + "</li>";
        }).join("");
    }
    
    // Itineraries
    var itinerariesEl = document.getElementById("itineraryDays");
    if (itinerariesEl && data.itineraries_solo && data.itineraries_solo.days) {
        itinerariesEl.innerHTML = data.itineraries_solo.days.map(function(day, i) {
            return "<li>Day " + (i + 1) + ": " + escapeHtml(day) + "</li>";
        }).join("");
    }
    
    // Phrase cards
    var phrasesEl = document.getElementById("phraseCards");
    if (phrasesEl && data.phrase_cards && Object.keys(data.phrase_cards).length > 0) {
        var phrases = Object.values(data.phrase_cards);
        phrasesEl.innerHTML = phrases.map(function(p) {
            return "<li>" + escapeHtml(p) + "</li>";
        }).join("");
    }
    
    // Fun facts
    var factsEl = document.getElementById("funFacts");
    if (factsEl && data.fun_facts && data.fun_facts.length > 0) {
        // Deduplicate fun facts (they often appear duplicated in the source)
        var uniqueFacts = [];
        var seen = new Set();
        data.fun_facts.forEach(function(f) {
            var normalized = f.toLowerCase().trim();
            if (!seen.has(normalized)) {
                seen.add(normalized);
                uniqueFacts.push(f);
            }
        });
        factsEl.innerHTML = uniqueFacts.slice(0, 10).map(function(f) {
            return "<li>" + escapeHtml(f) + "</li>";
        }).join("");
    }
    
    // Sources
    var sourcesEl = document.getElementById("sourcesList");
    if (sourcesEl && data.sources && data.sources.primary) {
        sourcesEl.innerHTML = data.sources.primary.map(function(s) {
            return "<li>" + escapeHtml(s) + "</li>";
        }).join("");
    }
    
    // Update URL to reflect the loaded country
    if (window.history && window.history.replaceState) {
        var newUrl = window.location.pathname + "?code=" + code;
        window.history.replaceState({code: code}, "", newUrl);
    }
}

function extractRegion(data) {
    var region = data.region || "";
    if (typeof region === "string" && region.includes("&")) {
        region = region.split("&")[0].trim();
    }
    return region || "Unassigned";
}

function calcCompletionPercent(data) {
    var total = 9;
    var complete = 0;
    if (data.country_name) complete++;
    if (data.country_code) complete++;
    if (data.history_culture) complete++;
    if (data.entry_requirements && Object.keys(data.entry_requirements).length > 0) complete++;
    if (data.climate && Object.keys(data.climate).length > 0) complete++;
    if (data.attractions && data.attractions.length > 0) complete++;
    if (data.top10_experiences && data.top10_experiences.length > 0) complete++;
    if (data.itineraries_solo && data.itineraries_solo.days) complete++;
    if (data.phrase_cards && Object.keys(data.phrase_cards).length > 0) complete++;
    if (data.fun_facts && data.fun_facts.length > 0) complete++;
    return Math.round((complete / total) * 100);
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

window.openCountry = fetchCountry;

// Tab switching
function switchTab(tabId) {
    // Hide all tab panes
    document.querySelectorAll(".tab-pane").forEach(function(pane) {
        pane.classList.remove("active");
    });
    // Show target pane
    var target = document.getElementById(tabId);
    if (target) target.classList.add("active");
    // Update active tab button
    document.querySelectorAll(".tab-btn").forEach(function(btn) {
        btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
    });
}
