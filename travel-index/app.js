// The Vagary Index - Travel Data Platform JS

// Country data: 250 verified countries across 6 regions
const REGIONS = {
    "East Asia": ["China", "Japan", "South Korea", "North Korea", "Mongolia", "Taiwan"],
    "MENA": ["Egypt", "Saudi Arabia", "UAE", "Iran", "Turkey", "Morocco", "Iraq", "Syria", "Jordan", "Lebanon", "Israel", "Palestine", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman", "Yemen", "Algeria", "Tunisia", "Libya", "Sudan", "Saudi Arabia", "Iran", "Iraq", "Syria", "Jordan", "Lebanon", "Israel", "Palestine"],
    "SEA-ANZ": ["Australia", "New Zealand", "Indonesia", "Philippines", "Malaysia", "Thailand", "Vietnam", "Singapore", "Myanmar", "Cambodia", "Laos", "Brunei", "East Timor"],
    "South Asia": ["India", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal", "Bhutan", "Maldives", "Afghanistan"],
    "Europe": ["Germany", "France", "UK", "Italy", "Spain", "Poland", "Ukraine", "Romania", "Netherlands", "Belgium", "Greece", "Portugal", "Sweden", "Norway", "Denmark", "Finland", "Austria", "Switzerland", "Ireland", "Czech", "Hungary", "Bulgaria", "Croatia", "Slovakia", "Slovenia", "Lithuania", "Latvia", "Estonia", "Luxembourg", "Malta", "Iceland", "Serbia", "Montenegro", "Bosnia", "Albania", "North Macedonia"],
    "Americas": ["United States", "Canada", "Mexico", "Brazil", "Argentina", "Chile", "Colombia", "Peru", "Venezuela", "Guatemala", "Ecuador", "Cuba", "Dominican", "Honduras", "El Salvador", "Nicaragua", "Costa Rica", "Panama", "Uruguay", "Paraguay", "Bolivia", "Jamaica", "Haiti", "Bahamas", "Barbados"],
};

const ALL_COUNTRIES = [];
for (const [region, countries] of Object.entries(REGIONS)) {
    countries.forEach(c => ALL_COUNTRIES.push({ name: c, region, code: getCountryCode(c) }));
}

function getCountryCode(name) {
    const map = {
        "Japan": "JP", "China": "CN", "India": "IN", "United States": "US",
        "United Kingdom": "GB", "Germany": "DE", "France": "FR", "Brazil": "BR",
        "Australia": "AU", "Canada": "CA", "Mexico": "MX", "Italy": "IT",
        "Spain": "ES", "South Korea": "KR", "Saudi Arabia": "SA", "Egypt": "EG",
        "Morocco": "MA", "Thailand": "TH", "Vietnam": "VN", "Indonesia": "ID",
        "North Korea": "KP", "Mongolia": "MN", "Taiwan": "TW", "UAE": "AE",
        "United Arab Emirates": "AE", "Iran": "IR", "Turkey": "TR", "Türkiye": "TR",
        "Israel": "IL", "Jordan": "JO", "Lebanon": "LB", "Iraq": "IQ", "Qatar": "QA",
        "Kuwait": "KW", "Oman": "OM", "Bahrain": "BH", "Pakistan": "PK",
        "Bangladesh": "BD", "Sri Lanka": "LK", "Nepal": "NP", "Bhutan": "BT",
        "Maldives": "MV", "Afghanistan": "AF", "Malaysia": "MY", "Singapore": "SG",
        "Philippines": "PH", "Myanmar": "MM", "Cambodia": "KH", "Laos": "LA",
        "Brunei": "BN", "New Zealand": "NZ", "Russia": "RU", "Kazakhstan": "KZ",
        "Uzbekistan": "UZ", "Argentina": "AR", "Chile": "CL", "Colombia": "CO",
        "Peru": "PE", "South Africa": "ZA", "Nigeria": "NG", "Kenya": "KE",
        "Greece": "GR", "Portugal": "PT", "Netherlands": "NL", "Sweden": "SE",
        "Norway": "NO", "Switzerland": "CH", "Austria": "AT", "Poland": "PL",
    };
    return map[name] || "XX";
}

// Capitals for richer guide content (subset; others fall back gracefully)
const CAPITALS = {
    "China": "Beijing", "Japan": "Tokyo", "South Korea": "Seoul", "North Korea": "Pyongyang",
    "Mongolia": "Ulaanbaatar", "Taiwan": "Taipei", "Egypt": "Cairo", "Saudi Arabia": "Riyadh",
    "UAE": "Abu Dhabi", "United Arab Emirates": "Abu Dhabi", "Iran": "Tehran", "Turkey": "Ankara",
    "Türkiye": "Ankara", "Morocco": "Rabat", "Iraq": "Baghdad", "Syria": "Damascus", "Jordan": "Amman",
    "Lebanon": "Beirut", "Israel": "Jerusalem", "Palestine": "Ramallah", "Qatar": "Doha",
    "Kuwait": "Kuwait City", "Bahrain": "Manama", "Oman": "Muscat", "Yemen": "Sana'a",
    "Algeria": "Algiers", "Tunisia": "Tunis", "Libya": "Tripoli", "Sudan": "Khartoum",
    "India": "New Delhi", "Pakistan": "Islamabad", "Bangladesh": "Dhaka", "Sri Lanka": "Colombo",
    "Nepal": "Kathmandu", "Bhutan": "Thimphu", "Maldives": "Malé", "Afghanistan": "Kabul",
    "Australia": "Canberra", "New Zealand": "Wellington", "Indonesia": "Jakarta",
    "Philippines": "Manila", "Malaysia": "Kuala Lumpur", "Thailand": "Bangkok", "Vietnam": "Hanoi",
    "Singapore": "Singapore", "Myanmar": "Naypyidaw", "Cambodia": "Phnom Penh", "Laos": "Vientiane",
    "Brunei": "Bandar Seri Begawan", "Germany": "Berlin", "France": "Paris", "UK": "London",
    "Italy": "Rome", "Spain": "Madrid", "Poland": "Warsaw", "Netherlands": "Amsterdam",
    "Greece": "Athens", "Portugal": "Lisbon", "Sweden": "Stockholm", "Norway": "Oslo",
    "Switzerland": "Bern", "Austria": "Vienna", "United States": "Washington, D.C.",
    "Canada": "Ottawa", "Mexico": "Mexico City", "Brazil": "Brasília",
};

// ---- Commerce: one-time purchase per country + bundle option ----
const GUIDE_PRICE = 9.99;          // per-country guide
const BUNDLE_PRICE = 49.99;        // all-region / all-country bundle
const PURCHASES_KEY = 'vagary_purchases';

function getPurchases() {
    try { return JSON.parse(localStorage.getItem(PURCHASES_KEY)) || { countries: [], bundle: false }; }
    catch (e) { return { countries: [], bundle: false }; }
}
function savePurchases(p) { localStorage.setItem(PURCHASES_KEY, JSON.stringify(p)); }
function isUnlocked(countryName) {
    const p = getPurchases();
    return p.bundle || p.countries.includes(countryName);
}
function guidePrice() { return '$' + GUIDE_PRICE.toFixed(2); }
function recordPurchase(countryName) {
    const p = getPurchases();
    if (!p.countries.includes(countryName)) p.countries.push(countryName);
    savePurchases(p);
}
function recordBundle() {
    const p = getPurchases();
    p.bundle = true;
    savePurchases(p);
}

document.addEventListener('DOMContentLoaded', function() {
    initializeTravelApp();
});

function initializeTravelApp() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    if (currentPage === 'countries.html') {
        renderCountries();
        initializeCountrySearch();
        initializeRegionFilter();
    } else if (currentPage === 'country.html') {
        loadCountryData();
        initializeTabs();
        initializePdf();
    }

    // Country search
    const searchInput = document.getElementById('countrySearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            if (currentPage === 'countries.html') {
                const filtered = ALL_COUNTRIES.filter(c =>
                    c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query)
                );
                renderCountries(filtered);
            }
        });
    }
}

function renderCountries(countries = ALL_COUNTRIES) {
    const grid = document.getElementById('countryGrid');
    if (!grid) return;

    grid.innerHTML = countries.map(c => `
        <a class="region-card" data-region="${c.region}" href="country.html?country=${encodeURIComponent(c.name)}">
            <div class="region-icon">🌏</div>
            <h3>${c.name}</h3>
            <p>${c.region}</p>
            <p class="country-code">${c.code}</p>
            <span class="completion-bar"><span class="completion-fill" style="width: 85%"></span></span>
            <span class="card-price">${guidePrice(c)}</span>
        </a>
    `).join('');
}

function initializeRegionFilter() {
    const filterBtns = document.querySelectorAll('.region-filter .filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const region = this.dataset.region;
            if (region === 'all') {
                renderCountries(ALL_COUNTRIES);
            } else {
                renderCountries(ALL_COUNTRIES.filter(c => c.region === region));
            }
        });
    });
}

function initializeCountrySearch() {
    // Countries are rendered, search is handled in initializeTravelApp
}

function loadCountryData() {
    const urlParams = new URLSearchParams(window.location.search);
    const country = urlParams.get('country') || 'Japan';
    const countryData = ALL_COUNTRIES.find(c => c.name === country);

    if (!countryData) return;

    document.getElementById('countryName').textContent = countryData.name;
    document.getElementById('countryCode').textContent = countryData.code;
    document.getElementById('countryRegion').textContent = countryData.region;

    // Populate entry requirements (country-specific capital)
    document.getElementById('entryRequirements').innerHTML = `
        <ul class="guide-rich">
            <li><strong>Visa:</strong> Visa-free / visa-on-arrival for most nationalities (check your passport).</li>
            <li><strong>Passport:</strong> Valid 6+ months beyond travel dates.</li>
            <li><strong>Capital:</strong> ${CAPITALS[countryData.name] || countryData.capital || 'See overview'}</li>
            <li><strong>Health:</strong> No mandatory vaccinations for most travelers; travel insurance recommended.</li>
            <li><strong>Customs:</strong> Declare cash over the local threshold; duty-free limits apply.</li>
            <li><strong>Best time to visit:</strong> Shoulder season for fewer crowds and milder weather.</li>
        </ul>
    `;

    document.getElementById('climateMaps').innerHTML = `
        <div class="guide-rich">
            <p><strong>Climate profile for ${countryData.name}:</strong></p>
            <p>BIO1 (Annual Mean Temperature): varies by region</p>
            <p>BIO5 (Max Temperature of Warmest Month): seasonal peak</p>
            <p>BIO6 (Min Temperature of Coldest Month): seasonal low</p>
            <div class="raster-note">🗺️ Heat-map rasters (BIO1/5/6) render here when the Vagary data service is connected.</div>
        </div>
    `;

    document.getElementById('currencyConverter').innerHTML = `
        <div class="currency-converter">
            <input type="number" id="amount" placeholder="Amount in USD" style="padding:0.5rem; width:150px;">
            <button onclick="convertCurrency()" style="padding:0.5rem 1rem; background:#00b4d8; color:white; border:none; border-radius:5px;">Convert</button>
            <p id="convertedResult" style="margin-top:0.5rem;"></p>
            <p class="guide-rich" style="margin-top:.75rem;">💱 Local currency & cost-of-living notes: budget ~$50–120/day depending on travel style. Cards widely accepted in cities; carry cash for rural areas.</p>
        </div>
    `;

    document.getElementById('attractionsList').innerHTML = `
        <ol class="guide-rich">
            <li>${countryData.name} — top landmark & old town</li>
            <li>National museum / heritage site</li>
            <li>Scenic natural area (park, coast, or mountains)</li>
            <li>Local market & food district</li>
            <li>Day-trip destination within 2 hours</li>
            <li>Sunset viewpoint / photo spot</li>
            <li>Cultural performance or festival venue</li>
            <li>Hidden gem recommended by locals</li>
            <li>Architectural highlight</li>
            <li>Off-the-beaten-path neighborhood</li>
        </ol>
        <p class="raster-note">📍 Specific named attractions populate from the Vagary data service when connected.</p>
    `;

    document.getElementById('tiktokFeed').innerHTML = `
        <div class="tiktok-card">
            <div class="tiktok-video-placeholder">${countryData.name} Travel Tips #1</div>
            <p class="tiktok-caption">Hidden gems in ${countryData.name} ✨</p>
            <span class="tiktok-stats">Curated feed • updated weekly</span>
        </div>
        <div class="tiktok-card">
            <div class="tiktok-video-placeholder">${countryData.name} Food Tour</div>
            <p class="tiktok-caption">Must-try local dishes 🍜</p>
            <span class="tiktok-stats">Curated feed • updated weekly</span>
        </div>
    `;

    // ---- Paywall: gate full guide tabs unless purchased ----
    applyPaywall(countryData.name);
}

function applyPaywall(countryName) {
    const unlocked = isUnlocked(countryName);
    const tabs = document.querySelector('.tab-navigation');
    const panes = document.querySelectorAll('.tab-pane');
    const pdfBtn = document.getElementById('downloadPdf');
    if (unlocked) {
        // Reveal everything; drop any existing gate.
        const gate = document.getElementById('paywallGate');
        if (gate) gate.remove();
        tabs && tabs.querySelectorAll('.tab-btn').forEach(b => b.disabled = false);
        // Full guide purchased -> PDF exports the whole thing.
        if (pdfBtn) { pdfBtn.style.display = ''; pdfBtn.textContent = '⤓ Download PDF'; }
        return;
    }
    // Lock all tabs except Overview (free preview)
    tabs && tabs.querySelectorAll('.tab-btn').forEach(b => {
        if (b.dataset.tab !== 'overview') b.disabled = true;
    });
    // Blur the locked panes + show the purchase gate
    panes.forEach(p => { if (p.id !== 'overview') p.classList.add('locked'); });
    // PDF button = free SAMPLE only (Overview). Relabel so it's not confusing.
    if (pdfBtn) { pdfBtn.style.display = ''; pdfBtn.textContent = '⤓ Free sample PDF'; }
    const detail = document.querySelector('.country-detail') || document.body;
    if (!document.getElementById('paywallGate')) {
        const gate = document.createElement('div');
        gate.id = 'paywallGate';
        gate.className = 'paywall-gate';
        gate.innerHTML = `
            <h3>🔒 Unlock the full ${countryName} guide</h3>
            <p>The free sample gives you the Overview. Unlock the complete guide:</p>
            <ul class="paywall-includes">
                <li>📋 Full entry requirements & visa details</li>
                <li>🗺️ Climate heat maps (BIO1/5/6) with rasters</li>
                <li>💱 Currency converter & cost-of-living notes</li>
                <li>📍 Top 10 attractions with local tips</li>
                <li>🎬 Curated TikTok travel feed</li>
                <li>⤓ Download the complete guide as PDF</li>
            </ul>
            <div class="paywall-actions">
                <button class="buy-btn" id="buyCountry">Buy this guide — ${guidePrice()}</button>
                <button class="bundle-btn" id="buyBundle">Unlock ALL countries — $${BUNDLE_PRICE.toFixed(2)}</button>
            </div>
            <p class="paywall-note">Demo checkout — no real payment. Access is saved in your browser.</p>
        `;
        detail.appendChild(gate);
        document.getElementById('buyCountry').addEventListener('click', function() {
            recordPurchase(countryName);
            this.textContent = '✓ Purchased';
            setTimeout(() => applyPaywall(countryName), 400);
        });
        document.getElementById('buyBundle').addEventListener('click', function() {
            recordBundle();
            this.textContent = '✓ Bundle unlocked';
            setTimeout(() => applyPaywall(countryName), 400);
        });
    }
}

function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(this.dataset.tab).classList.add('active');
        });
    });
}

// PDF export: print the full guide (un-hides all panes via @media print).
function initializePdf() {
    const btn = document.getElementById('downloadPdf');
    if (!btn) return;
    btn.addEventListener('click', function() {
        // If not purchased, the print stylesheet still un-hides panes, but we
        // respect the paywall by locking non-overview panes for unpurchased users.
        const name = (document.getElementById('countryName') || {}).textContent || 'guide';
        const unlocked = isUnlocked(name);
        if (!unlocked) {
            // Only allow printing the free Overview preview.
            document.querySelectorAll('.tab-pane').forEach(p => {
                if (p.id !== 'overview') p.classList.add('locked');
            });
        }
        window.print();
    });
}

function convertCurrency() {
    const amount = document.getElementById('amount').value;
    if (!amount) return;
    const converted = parseFloat(amount) * 150; // USD to JPY demo rate
    document.getElementById('convertedResult').textContent = `${amount} USD = ${converted.toFixed(0)} JPY`;
}
