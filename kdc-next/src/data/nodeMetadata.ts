export type VentureCategory =
  | "orchestration"
  | "intelligence"
  | "commerce"
  | "hardware"
  | "gaming"
  | "media"
  | "innovation"
  | "treasury"
  | "incubation";

export interface VentureMetadata {
  id: string;
  title: string;
  category: VentureCategory;
  sectorTag: string;
  route: string;
  health: number;
  projects: number;
  agents: number;
  revenueStreamCount: number;
  leadAgent: string;
  primaryMetricLabel: string;
  primaryMetricValue: string;
  summary: string;
  isDeclaredGap?: boolean;
}

export const KDCI_VENTURE_METADATA: Record<string, VentureMetadata> = {
  "kdci-core": {
    id: "kdci-core",
    title: "KDCI Core",
    category: "orchestration",
    sectorTag: "MASTER_ORCHESTRATOR",
    route: "/",
    health: 100,
    projects: 24,
    agents: 8,
    revenueStreamCount: 7,
    leadAgent: "hermes-master-router",
    primaryMetricLabel: "ACTIVE SECTORS",
    primaryMetricValue: "8 / 8 LIVE",
    summary:
      "Central spatial runtime governing cross-venture routing, agent telemetry, and capital allocation.",
  },
  "travel-index": {
    id: "travel-index",
    title: "The Vagary Index",
    category: "intelligence",
    sectorTag: "TRAVEL_INDEX",
    route: "/travel-index/",
    health: 97,
    projects: 4,
    agents: 2,
    revenueStreamCount: 3,
    leadAgent: "agent-travel-index",
    primaryMetricLabel: "INDEXED ROUTES",
    primaryMetricValue: "142 CITIES",
    summary:
      "Spatial expedition intelligence, field guides, and curated global transit telemetry.",
  },
  "shoe-brand": {
    id: "shoe-brand",
    title: "King Design Footwear",
    category: "commerce",
    sectorTag: "SHOE_BRAND",
    route: "/shoe-brand/",
    health: 98,
    projects: 6,
    agents: 2,
    revenueStreamCount: 3,
    leadAgent: "agent-shoe-brand",
    primaryMetricLabel: "ACTIVE SILHOUETTES",
    primaryMetricValue: "12 SKUS",
    summary:
      "Direct-to-collector performance footwear design, limited drops, and supply-chain telemetry.",
  },
  "quantum-wearables": {
    id: "quantum-wearables",
    title: "Quantum Wearables 3.0",
    category: "hardware",
    sectorTag: "QUANTUM_WEARABLES",
    route: "/quantum-wearables/",
    health: 99,
    projects: 5,
    agents: 3,
    revenueStreamCount: 2,
    leadAgent: "agent-quantum-wearables",
    primaryMetricLabel: "SENSOR STACK",
    primaryMetricValue: "REV 3.0",
    summary:
      "Next-generation biometric wearables, spatial HUD hardware, and kinetic energy harvesting.",
  },
  "game-design": {
    id: "game-design",
    title: "Aura Champions & Sim",
    category: "gaming",
    sectorTag: "GAME_DESIGN",
    route: "/game-design/",
    health: 96,
    projects: 4,
    agents: 3,
    revenueStreamCount: 4,
    leadAgent: "agent-game-design",
    primaryMetricLabel: "NFC / AR DECKS",
    primaryMetricValue: "GEN-1 LIVE",
    summary:
      "Phygital NFC collectible card battles, arena simulations, and interactive world-building.",
  },
  "kids-channel": {
    id: "kids-channel",
    title: "7-Minute Story Sessions",
    category: "media",
    sectorTag: "KIDS_CHANNEL",
    route: "/kids-channel/",
    health: 95,
    projects: 3,
    agents: 1,
    revenueStreamCount: 2,
    leadAgent: "agent-kids-channel",
    primaryMetricLabel: "CONTENT SAFETY",
    primaryMetricValue: "SAFE MODE",
    summary:
      "Curated 7-minute audio-visual storytelling sessions engineered for young minds.",
  },
  "innovation-hub": {
    id: "innovation-hub",
    title: "IP Foundry & Gooniversity",
    category: "innovation",
    sectorTag: "INNOVATION_HUB",
    route: "/innovation-hub/",
    health: 98,
    projects: 7,
    agents: 2,
    revenueStreamCount: 3,
    leadAgent: "agent-innovation-hub",
    primaryMetricLabel: "PATENT PORTFOLIO",
    primaryMetricValue: "61 PATENTS",
    summary:
      "R&D incubator, patent licensing foundry, and applied technical curriculum.",
  },
  "ewaste-recycling": {
    id: "ewaste-recycling",
    title: "E-Waste & Treasury",
    category: "treasury",
    sectorTag: "EWASTE_RECYCLING",
    route: "/ewaste-recycling/",
    health: 99,
    projects: 5,
    agents: 2,
    revenueStreamCount: 3,
    leadAgent: "agent-ewaste-treasury",
    primaryMetricLabel: "RECOVERY YIELD",
    primaryMetricValue: "94.2%",
    summary:
      "Circular hardware reclamation and automated ecosystem liquidity treasury.",
  },
  "still-alive-arcade": {
    id: "still-alive-arcade",
    title: "Still Alive Arcade",
    category: "incubation",
    sectorTag: "ARCADE_INCUBATOR",
    route: "/still-alive-arcade/",
    health: 0,
    projects: 1,
    agents: 0,
    revenueStreamCount: 0,
    leadAgent: "agent-arcade-standby",
    primaryMetricLabel: "DEPLOYMENT STATE",
    primaryMetricValue: "404 STANDBY",
    summary:
      "Declared incubation gap reserved for retro-futuristic browser arcade experiments.",
    isDeclaredGap: true,
  },
};

export function getVentureMetadata(nodeId: string): VentureMetadata | undefined {
  return KDCI_VENTURE_METADATA[nodeId];
}
