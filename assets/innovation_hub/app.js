// Umbrella Innovation Hub - Patent & IP Management JS

// Patent status definitions
const PATENT_STATUS = {
    SUBMITTED: 'submitted',
    PENDING: 'pending',
    REVIEW: 'review',
    GRANTED: 'granted',
    PUBLISHED: 'published',
    REJECTED: 'rejected'
};

// Subsidiary IP data
const SUBSIDIARY_IP = [
    { name: 'King Design Collective', file: 'shoe_brand', patents: 12, value: '$420K', status: 'active' },
    { name: 'The Vagary Index', file: 'travel_index', patents: 8, value: '$380K', status: 'active' },
    { name: 'Aura Champions', file: 'game_design', patents: 15, value: '$850K', status: 'active' },
    { name: 'Seven Minute Story Sessions', file: 'kids_channel', patents: 6, value: '$180K', status: 'active' },
    { name: 'e-Waste Reclamation', file: 'ewaste_recycling', patents: 9, value: '$310K', status: 'active' },
    { name: 'Quantum Wearables', file: 'quantum_wearables', patents: 7, value: '$310K', status: 'active' },
    { name: 'Crypto Treasury', file: 'crypto_treasury', patents: 4, value: '$280K', status: 'active' },
];

// White paper templates
const WP_TEMPLATES = {
    'technical': {
        name: 'Technical Paper',
        sections: ['Abstract', 'Introduction', 'Methodology', 'Results', 'Discussion', 'Conclusion', 'References']
    },
    'business': {
        name: 'Business Whitepaper',
        sections: ['Executive Summary', 'Market Analysis', 'Business Model', 'Financials', 'Risk Assessment', 'Appendix']
    },
    'ip': {
        name: 'IP Disclosure',
        sections: ['Disclosure Statement', 'Prior Art', 'Claims', 'Drawings', 'Assignment', 'Inventor Oath']
    },
    'cross-subsidiary': {
        name: 'Cross-Subsidiary Paper',
        sections: ['Executive Summary', 'Subsidiary Scope', 'Integration Points', 'Results', 'Future Work', 'Appendix']
    }
};

document.addEventListener('DOMContentLoaded', function() {
    initializeInnovationHub();
});

function initializeInnovationHub() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    if (currentPage === 'index.html' || currentPage === '') {
        initDashboard();
    } else if (currentPage === 'patents.html') {
        initPatentPortal();
    } else if (currentPage === 'whitepapers.html') {
        initWhitePapers();
    } else if (currentPage === 'tech-stack.html') {
        initTechStack();
    }

    // CTA buttons
    document.querySelectorAll('.cta-button').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (this.textContent.includes('Submit')) {
                submitPatent();
            } else if (this.textContent.includes('View')) {
                alert('Patent details: UMB-P-023\nStatus: Under Review\nFiled: 2026-02-15\nAssignee: Quantum Wearables');
            }
        });
    });
}

function initDashboard() {
    // Metrics animation
    animateMetric('activePatents', 23);
    animateMetric('whitePapers', 15);
    animateMetric('subsidiaries', 7);

    // Render IP grid
    const ipGrid = document.getElementById('ipGrid');
    if (ipGrid) {
        ipGrid.innerHTML = SUBSIDIARY_IP.map(s => `
            <div class="ip-card" data-sub="${s.file}">
                <h4>${s.name}</h4>
                <p>IP portfolio with ${s.patents} patent families</p>
                <span class="ip-count">${s.patents} patents | ${s.value} valuation</span>
            </div>
        `).join('');
    }
}

function animateMetric(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        if (id === 'ipValue') {
            el.textContent = '$' + current.toFixed(1) + 'M';
        } else {
            el.textContent = Math.floor(current);
        }
    }, 20);
}

function initPatentPortal() {
    // Add claim button
    const addClaimBtn = document.getElementById('addClaimBtn');
    if (addClaimBtn) {
        addClaimBtn.addEventListener('click', function() {
            const container = document.getElementById('claimsContainer');
            const claimCount = container.children.length + 1;
            container.innerHTML += `
                <div class="claim-item">
                    <label>Claim ${claimCount}</label>
                    <textarea placeholder="Dependent claim..."></textarea>
                </div>
            `;
        });
    }
}

function submitPatent() {
    const title = document.getElementById('patentTitle')?.value;
    const jurisdiction = document.getElementById('filingJurisdiction')?.value;
    const assignee = document.getElementById('assignee')?.value;

    if (!title) {
        alert('Please enter a patent title');
        return;
    }

    alert(`Patent submitted!\nTitle: ${title}\nJurisdiction: ${jurisdiction}\nAssignee: ${assignee}\nStatus: Submitted\nPatent ID: UMB-P-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`);
}

function initWhitePapers() {
    // Template selector
    const templates = document.querySelectorAll('.template-card');
    templates.forEach(tpl => {
        tpl.addEventListener('click', function() {
            const template = this.dataset.template;
            const config = WP_TEMPLATES[template];
            if (!config) return;

            const sections = config.sections.join('\n');
            alert(`Template: ${config.name}\n\nSections:\n${sections}\n\nNew paper created with template structure.`);
        });
    });
}

function initTechStack() {
    // Interactive nodes
    const nodes = document.querySelectorAll('.node');
    nodes.forEach(node => {
        node.addEventListener('click', function() {
            const name = this.querySelector('.node-name').textContent;
            const detail = this.querySelector('.node-detail').textContent;
            const models = this.querySelector('.node-models').textContent;
            alert(`Node: ${name}\n${detail}\n${models}\n\nFull configuration in /c/Users/young/agents/hermes_skills/_packages/`);
        });
    });

    // Security items
    const securityItems = document.querySelectorAll('.security-item');
    securityItems.forEach(item => {
        item.addEventListener('click', function() {
            const title = this.querySelector('h3').textContent;
            const desc = this.querySelector('p').textContent;
            alert(`${title}\n\n${desc}`);
        });
    });
}
