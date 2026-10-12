// Innovation Hub — IP portfolio, white-paper templates, and tech stack.
// Ported from the static webapp.

export type SubsidiaryIP = { name: string; file: string; patents: number; value: string; status: string };

export const SUBSIDIARY_IP: SubsidiaryIP[] = [
  { name: 'King Design Collective', file: 'shoe_brand', patents: 12, value: '$420K', status: 'active' },
  { name: 'The Vagary Index', file: 'travel_index', patents: 8, value: '$380K', status: 'active' },
  { name: 'Aura Champions', file: 'game_design', patents: 15, value: '$850K', status: 'active' },
  { name: 'Seven Minute Story Sessions', file: 'kids_channel', patents: 6, value: '$180K', status: 'active' },
  { name: 'e-Waste Reclamation', file: 'ewaste_recycling', patents: 9, value: '$310K', status: 'active' },
  { name: 'Quantum Wearables', file: 'quantum_wearables', patents: 7, value: '$310K', status: 'active' },
  { name: 'Crypto Treasury', file: 'crypto_treasury', patents: 4, value: '$280K', status: 'active' },
];

export type WPTemplate = { key: string; name: string; sections: string[]; emoji: string };

export const WP_TEMPLATES: WPTemplate[] = [
  { key: 'technical', name: 'Technical Paper', emoji: '🔬', sections: ['Abstract', 'Introduction', 'Methodology', 'Results', 'Discussion', 'Conclusion', 'References'] },
  { key: 'business', name: 'Business Whitepaper', emoji: '💼', sections: ['Executive Summary', 'Market Analysis', 'Business Model', 'Financials', 'Risk Assessment', 'Appendix'] },
  { key: 'ip', name: 'IP Disclosure', emoji: '📜', sections: ['Disclosure Statement', 'Prior Art', 'Claims', 'Drawings', 'Assignment', 'Inventor Oath'] },
  { key: 'cross-subsidiary', name: 'Cross-Subsidiary Paper', emoji: '🔗', sections: ['Executive Summary', 'Subsidiary Scope', 'Integration Points', 'Results', 'Future Work', 'Appendix'] },
];

export type TechNode = { name: string; detail: string; models: string; emoji: string };

export const TECH_NODES: TechNode[] = [
  { name: 'Ollama', detail: 'Port 11435', models: 'gemma3:1b, qwen3-coder:30b', emoji: '🧠' },
  { name: 'Bolt.diy', detail: 'Port 5173', models: 'Remix + Vite', emoji: '⚡' },
  { name: 'Backend API', detail: 'Port 3100', models: 'Node.js + Express', emoji: '🔌' },
  { name: 'Anti-Cheat', detail: 'Port 3101', models: 'HMAC + Nonce', emoji: '🛡️' },
  { name: 'Trinity Service', detail: 'Port 3102', models: 'Convergence Events', emoji: '✨' },
  { name: 'Tournament Admin', detail: 'Port 3103', models: 'Judge Tools', emoji: '🏆' },
  { name: 'NFC Handler', detail: 'Port 3104', models: 'NTAG216 Handler', emoji: '📱' },
  { name: 'PostgreSQL', detail: 'Port 5432', models: 'multiagent_db', emoji: '🗄️' },
  { name: 'Hermes Agent', detail: 'Local', models: 'Master Orchestrator', emoji: '🤖' },
];

export type SecurityItem = { title: string; desc: string; emoji: string };

export const SECURITY_ITEMS: SecurityItem[] = [
  { title: 'Class-1 Sovereignty', desc: 'All corporate operations run locally through Hermes + Ollama. No external cloud APIs for classified data.', emoji: '🔒' },
  { title: 'Local Compute Mesh', desc: 'Distributed inference across local nodes with strict resource isolation and no egress.', emoji: '🕸️' },
  { title: 'Data Segregation', desc: 'Strict per-subsidiary data boundaries. Legal references are read-only; no cross-subsidiary leakage.', emoji: '🧱' },
  { title: 'Container Isolation', desc: 'Each service runs in its own container with network segmentation and signed proof tokens.', emoji: '📦' },
];

export const TOTAL_PATENTS = SUBSIDIARY_IP.reduce((n, s) => n + s.patents, 0);
