// Aura Champions card database — ported from the static webapp.
export type Card = {
  id: string;
  name: string;
  rarity: string;
  element: string;
  hp: number;
  atk: number;
  def: number;
  nfc: boolean;
  desc: string;
  abilities: string[];
};

export const CARDS: Card[] = [
  { id: 'trinity50', name: 'Trinity Nova #50', rarity: 'Convergence', element: 'Light', hp: 500, atk: 99, def: 50, nfc: true, desc: 'Trinity Awakening VFX', abilities: ['Reality Ripple', 'Elemental Surge', 'Trinity Bond'] },
  { id: 'trinity75', name: 'Trinity Ascendant #75', rarity: 'Convergence', element: 'Cosmic', hp: 750, atk: 99, def: 75, nfc: true, desc: 'Trinity Ascendant VFX', abilities: ['Plasma Storm', 'Phase Shift', 'Trinity Dominion'] },
  { id: 'trinity100', name: 'Convergence Stone #100', rarity: 'Convergence', element: 'Cosmic', hp: 999, atk: 99, def: 99, nfc: true, desc: 'Reality Fracture VFX', abilities: ['World Reset', 'Infinite Energy', 'Convergence Domain'] },
  { id: 'shadow-emp', name: 'Shadow Emperor', rarity: 'Legendary', element: 'Dark', hp: 400, atk: 75, def: 40, nfc: true, desc: 'Void Corruption', abilities: ['Dark Matter', 'Fear Aura', 'Life Steal'] },
  { id: 'storm-guard', name: 'Storm Guardian', rarity: 'Legendary', element: 'Air', hp: 350, atk: 68, def: 50, nfc: true, desc: 'Lightning Ward', abilities: ['Thunder Call', 'Wind Barrier', 'Speed Boost'] },
  { id: 'crystal-maid', name: 'Crystal Maiden', rarity: 'Legendary', element: 'Light', hp: 320, atk: 65, def: 35, nfc: false, desc: 'Ice Shard Storm', abilities: ['Freeze', 'Crystal Prison', 'Healing Light'] },
  { id: 'flame-wyrm', name: 'Flame Wyrm', rarity: 'Epic', element: 'Fire', hp: 280, atk: 55, def: 30, nfc: true, desc: 'Fire Breath', abilities: ['Flame Jet', 'Burn', 'Flight'] },
  { id: 'deep-seer', name: 'Deep Seer', rarity: 'Epic', element: 'Water', hp: 260, atk: 50, def: 40, nfc: false, desc: 'Tidal Wave', abilities: ['Water Jet', 'Slow', 'Heal'] },
  { id: 'stone-giant', name: 'Stone Giant', rarity: 'Epic', element: 'Earth', hp: 350, atk: 45, def: 60, nfc: true, desc: 'Earthquake', abilities: ['Rock Throw', 'Shield', 'Stagger'] },
  { id: 'wind-dancer', name: 'Wind Dancer', rarity: 'Rare', element: 'Air', hp: 180, atk: 45, def: 20, nfc: false, desc: 'Gale Force', abilities: ['Quick Strike', 'Evasive', 'Pierce'] },
  { id: 'ember-spark', name: 'Ember Spark', rarity: 'Rare', element: 'Fire', hp: 150, atk: 40, def: 15, nfc: false, desc: 'Ignite', abilities: ['Burn', 'Crit+', 'Weak Fire'] },
  { id: 'rookie-guard', name: 'Rookie Guard', rarity: 'Common', element: 'Light', hp: 100, atk: 20, def: 25, nfc: false, desc: 'Basic Slash', abilities: ['Taunt'] },
  { id: 'scout', name: 'Forest Scout', rarity: 'Common', element: 'Earth', hp: 80, atk: 25, def: 15, nfc: false, desc: 'Quick Shot', abilities: ['Stealth'] },
  { id: 'novice-mage', name: 'Novice Mage', rarity: 'Common', element: 'Light', hp: 70, atk: 30, def: 10, nfc: false, desc: 'Magic Bolt', abilities: ['Zap'] },
];

export const RARITY_COLORS: Record<string, string> = {
  Convergence: '#d4af37',
  Legendary: '#f59e0b',
  Epic: '#a855f7',
  Rare: '#3b82f6',
  Common: '#9ca3af',
};

export const ELEMENT_COLORS: Record<string, string> = {
  Fire: '#ef4444',
  Water: '#3b82f6',
  Earth: '#84cc16',
  Air: '#e5e7eb',
  Light: '#fde047',
  Dark: '#6b7280',
  Cosmic: '#a855f7',
};

export const ELEMENT_ICONS: Record<string, string> = {
  Fire: '🔥', Water: '💧', Earth: '🌍', Air: '💨', Light: '⚡', Dark: '🌑', Cosmic: '🌌',
};

export const RARITIES = ['All', 'Convergence', 'Legendary', 'Epic', 'Rare', 'Common'];
export const ELEMENTS = ['All Elements', ...Array.from(new Set(CARDS.map((c) => c.element)))];
