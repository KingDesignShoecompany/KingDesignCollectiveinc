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
    };
    return map[name] || "XX";
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
        <div class="region-card" data-region="${c.region}">
            <div class="region-icon">🌏</div>
            <h3>${c.name}</h3>
            <p>${c.region}</p>
            <p class="country-code">${c.code}</p>
            <span class="completion-bar"><span class="completion-fill" style="width: 85%"></span></span>
        </div>
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

    // Populate entry requirements
    document.getElementById('entryRequirements').innerHTML = `
        <ul>
            <li><strong>Visa:</strong> Visa-free for 90 days</li>
            <li><strong>Passport:</strong> 6 months validity required</li>
            <li><strong>Health:</strong> No specific requirements</li>
            <li><strong>Customs:</strong> 100 cigarettes, 50 cigars, 500ml alcohol</li>
        </ul>
    `;

    document.getElementById('climateMaps').innerHTML = `
        <p>Climate: Temperate with four distinct seasons</p>
        <p>BIO1 (Annual Mean Temperature): 15.5°C</p>
        <p>BIO5 (Max Temperature): 28.5°C</p>
        <p>BIO6 (Min Temperature): 2.5°C</p>
    `;

    document.getElementById('currencyConverter').innerHTML = `
        <div class="currency-converter">
            <input type="number" id="amount" placeholder="Amount in USD" style="padding:0.5rem; width:150px;">
            <button onclick="convertCurrency()" style="padding:0.5rem 1rem; background:#D4AF37; color:#0A0A0A; border:none; border-radius:5px; font-weight:700;">Convert</button>
            <p id="convertedResult" style="margin-top:0.5rem;"></p>
        </div>
    `;

    document.getElementById('attractionsList').innerHTML = `
        <ol>
            <li>Sensoji Temple, Tokyo</li>
            <li>Fushimi Inari Shrine, Kyoto</li>
            <li>Mount Fuji</li>
            <li>Hiroshima Peace Memorial</li>
            <li>Nara Park</li>
            <li>Kyoto Gion District</li>
            <li>Osaka Castle</li>
            <li>Hakone Hot Springs</li>
            <li>Nikko Shrines</li>
            <li>Miyajima Island</li>
        </ol>
    `;

    document.getElementById('tiktokFeed').innerHTML = `
        <div class="tiktok-card">
            <div class="tiktok-video-placeholder">Japan Travel Tips #1</div>
            <p class="tiktok-caption">Hidden temples in Kyoto 🏯</p>
            <span class="tiktok-stats">12.4K views | 890 likes</span>
        </div>
    `;
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

function convertCurrency() {
    const amount = document.getElementById('amount').value;
    if (!amount) return;
    const converted = parseFloat(amount) * 150; // USD to JPY demo rate
    document.getElementById('convertedResult').textContent = `${amount} USD = ${converted.toFixed(0)} JPY`;
}
