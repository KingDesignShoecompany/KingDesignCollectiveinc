// Aura Champions - AR Card Battler Game Client JS

// Card database: 100+ cards across 5 rarities with elements
const CARDS = [
    // Convergence (Legendary+) - Trinity Specials
    { id: 'trinity50', name: 'Trinity Nova #50', rarity: 'Convergence', element: 'Light', hp: 500, atk: 99, def: 50, nfc: true, desc: 'Trinity Awakening VFX', abilities: ['Reality Ripple','Elemental Surge','Trinity Bond'] },
    { id: 'trinity75', name: 'Trinity Ascendant #75', rarity: 'Convergence', element: 'Cosmic', hp: 750, atk: 99, def: 75, nfc: true, desc: 'Trinity Ascendant VFX', abilities: ['Plasma Storm','Phase Shift','Trinity Dominion'] },
    { id: 'trinity100', name: 'Convergence Stone #100', rarity: 'Convergence', element: 'Cosmic', hp: 999, atk: 99, def: 99, nfc: true, desc: 'Reality Fracture VFX', abilities: ['World Reset','Infinite Energy','Convergence Domain'] },
    // Legendary
    { id: 'shadow-emp', name: 'Shadow Emperor', rarity: 'Legendary', element: 'Dark', hp: 400, atk: 75, def: 40, nfc: true, desc: 'Void Corruption', abilities: ['Dark Matter','Fear Aura','Life Steal'] },
    { id: 'storm-guard', name: 'Storm Guardian', rarity: 'Legendary', element: 'Air', hp: 350, atk: 68, def: 50, nfc: true, desc: 'Lightning Ward', abilities: ['Thunder Call','Wind Barrier','Speed Boost'] },
    { id: 'crystal-maid', name: 'Crystal Maiden', rarity: 'Legendary', element: 'Light', hp: 320, atk: 65, def: 35, nfc: false, desc: 'Ice Shard Storm', abilities: ['Freeze','Crystal Prison','Healing Light'] },
    // Epic
    { id: 'flame-wyrm', name: 'Flame Wyrm', rarity: 'Epic', element: 'Fire', hp: 280, atk: 55, def: 30, nfc: true, desc: 'Fire Breath', abilities: ['Flame Jet','Burn','Flight'] },
    { id: 'deep-seer', name: 'Deep Seer', rarity: 'Epic', element: 'Water', hp: 260, atk: 50, def: 40, nfc: false, desc: 'Tidal Wave', abilities: ['Water Jet','Slow','Heal'] },
    { id: 'stone-giant', name: 'Stone Giant', rarity: 'Epic', element: 'Earth', hp: 350, atk: 45, def: 60, nfc: true, desc: 'Earthquake', abilities: ['Rock Throw','Shield','Stagger'] },
    // Rare
    { id: 'wind-dancer', name: 'Wind Dancer', rarity: 'Rare', element: 'Air', hp: 180, atk: 45, def: 20, nfc: false, desc: 'Gale Force', abilities: ['Quick Strike','Evasive','Pierce'] },
    { id: 'ember-spark', name: 'Ember Spark', rarity: 'Rare', element: 'Fire', hp: 150, atk: 40, def: 15, nfc: false, desc: 'Ignite', abilities: ['Burn','Crit+','Weak Fire'] },
    // Common
    { id: 'rookie-guard', name: 'Rookie Guard', rarity: 'Common', element: 'Light', hp: 100, atk: 20, def: 25, nfc: false, desc: 'Basic Slash', abilities: ['Taunt'] },
    { id: 'scout', name: 'Forest Scout', rarity: 'Common', element: 'Earth', hp: 80, atk: 25, def: 15, nfc: false, desc: 'Quick Shot', abilities: ['Stealth'] },
    { id: 'novice-mage', name: 'Novice Mage', rarity: 'Common', element: 'Light', hp: 70, atk: 30, def: 10, nfc: false, desc: 'Magic Bolt', abilities: ['Zap'] },
];

// Element icons and colors
const ELEMENT_COLORS = {
    'Fire': '#ff4444',
    'Water': '#00b4d8',
    'Earth': '#8b4513',
    'Air': '#87ceeb',
    'Light': '#ffd700',
    'Dark': '#8a2be2',
    'Cosmic': '#ba68ff'
};

const RARITY_ORDER = ['Common', 'Rare', 'Epic', 'Legendary', 'Convergence'];
const RARITY_COLORS = {
    'Common': '#4ade80',
    'Rare': '#00b4d8',
    'Epic': '#8a2be2',
    'Legendary': '#ffd700',
    'Convergence': '#ff4444'
};

document.addEventListener('DOMContentLoaded', function() {
    initializeGameApp();
});

function initializeGameApp() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    if (currentPage === 'index.html' || currentPage === '') {
        initLandingPage();
    } else if (currentPage === 'cards.html') {
        renderCardDatabase();
        initCardFilters();
    } else if (currentPage === 'card-detail.html') {
        loadCardDetail();
    } else if (currentPage === 'events.html') {
        initEventsPage();
    }

    // CTA buttons
    document.querySelectorAll('.cta-button').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (this.textContent.includes('SCAN')) {
                simulateNFCScan();
            } else if (this.textContent.includes('REGISTER')) {
                alert('Registration opens at launch. Pre-register for early access!');
            } else if (this.textContent.includes('CLAIM') || this.textContent.includes('DOWNLOAD')) {
                alert('Alpha access begins July 2026. Sign up for beta invites!');
            }
        });
    });

    // Card hover 3D flip
    document.querySelectorAll('.card-image-placeholder').forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            this.style.transform = `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(500px) rotateX(0) rotateY(0)';
        });
    });
}

function initLandingPage() {
    // Start AR card animation
    const frame = document.querySelector('.card-frame');
    if (frame) {
        let rotation = 0;
        setInterval(() => {
            rotation += 0.5;
            frame.style.transform = `rotateY(${rotation}deg)`;
        }, 50);
    }
}

function renderCardDatabase() {
    const grid = document.getElementById('cardGrid');
    if (!grid) return;

    const html = CARDS.map(card => `
        <div class="card-slot" data-card-id="${card.id}" data-rarity="${card.rarity}" data-element="${card.element}">
            <div class="card-inner">
                <div class="rarity-badge" style="background:${RARITY_COLORS[card.rarity]}">${card.rarity}</div>
                <div class="card-image-placeholder" style="background:${ELEMENT_COLORS[card.element] || '#8a2be2'}">
                    ${card.name.substring(0,2).toUpperCase()}
                </div>
                <h3>${card.name}</h3>
                <div class="element-badge" style="background:${ELEMENT_COLORS[card.element]}">${card.element}</div>
                <div class="card-stats">
                    <span class="stat">HP: ${card.hp}</span>
                    <span class="stat">ATK: ${card.atk}</span>
                </div>
                ${card.nfc ? '<div class="nfc-icon" title="NFC Enabled">📱</div>' : ''}
                <button class="cta-button small view-card" data-id="${card.id}">View</button>
            </div>
        </div>
    `).join('');

    grid.innerHTML = html;

    // Update total cards badge
    const badge = document.getElementById('totalCards');
    if (badge) badge.textContent = `${CARDS.length} CARDS`;

    // View card buttons
    document.querySelectorAll('.view-card').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            window.location.href = `card-detail.html?card=${id}`;
        });
    });
}

function initCardFilters() {
    // Search
    const search = document.getElementById('cardSearch');
    if (search) {
        search.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            const cards = document.querySelectorAll('.card-slot');
            cards.forEach(card => {
                const name = card.querySelector('h3').textContent.toLowerCase();
                card.style.display = name.includes(query) ? '' : 'none';
            });
        });
    }

    // Rarity filter
    document.querySelectorAll('.rarity-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.rarity-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const rarity = this.dataset.rarity;
            filterCards(rarity, null);
        });
    });

    // Element filter
    document.querySelectorAll('.element-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.element-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const element = this.dataset.element;
            filterCards(null, element);
        });
    });
}

function filterCards(rarity, element) {
    const cards = document.querySelectorAll('.card-slot');
    cards.forEach(card => {
        const r = card.dataset.rarity;
        const e = card.dataset.element;
        const rarityMatch = !rarity || rarity === 'all' || r === rarity;
        const elementMatch = !element || element === 'all' || e === element;
        card.style.display = (rarityMatch && elementMatch) ? '' : 'none';
    });
}

function loadCardDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const cardId = urlParams.get('card');
    if (!cardId) return;

    const card = CARDS.find(c => c.id === cardId);
    if (!card) return;

    document.getElementById('detailRarity').textContent = card.rarity;
    document.getElementById('detailCardName').textContent = card.name;
    document.getElementById('detailElement').textContent = card.element;
    document.getElementById('detailHP').textContent = card.hp;
    document.getElementById('detailATK').textContent = card.atk;
    document.getElementById('detailDEF').textContent = card.def;
    document.getElementById('nfcStatus').textContent = card.nfc ? 'Ready (NTAG216)' : 'NFC Offline';
    document.getElementById('abilitiesList').innerHTML = card.abilities.map(a => `<li>${a}</li>`).join('');
}

function simulateNFCScan() {
    const scanOverlay = document.querySelector('.ar-scan-overlay');
    if (scanOverlay) {
        scanOverlay.innerHTML = 'Scanning... <span>📱</span>';
        setTimeout(() => {
            alert('NFC Card Detected! Summoning AR Champion...\n\nCard: #100 Convergence Stone\nTrinity Status: Active\nBattle Sync: Ready');
        }, 1000);
    }
}

function initEventsPage() {
    // Countdown timers for events
    const countdownElements = document.querySelectorAll('[data-countdown]');
    countdownElements.forEach(el => {
        const targetDate = new Date(el.dataset.countdown);
        const now = new Date();
        const diff = targetDate - now;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days > 0) {
            el.textContent = `${days} days remaining`;
        }
    });
}
