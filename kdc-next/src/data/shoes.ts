// Shoe-brand product catalog — ported from the static webapp (inventory SKU system).
export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  material: string;
  stock: number;
  sizes: number[];
  color: string;
};

export const PRODUCTS: Product[] = [
  { id: 'KING-001', name: 'Apex Runner V1', category: 'Performance Running', price: 189, material: 'Engineered Knit + TPU Sole', stock: 120, sizes: [7, 8, 9, 10, 11, 12, 13], color: 'Obsidian Black' },
  { id: 'KING-002', name: 'Daily Drift Low', category: 'Casual Lifestyle', price: 149, material: 'Suede + Natural Rubber', stock: 85, sizes: [6, 7, 8, 9, 10, 11, 12], color: 'Desert Sand' },
  { id: 'KING-003', name: 'Summit Trail X', category: 'Trail Hiking', price: 229, material: 'Thermo-Molded Upper + Vibram', stock: 60, sizes: [8, 9, 10, 11, 12, 13, 14], color: 'Forest Green' },
  { id: 'KING-004', name: 'Urban Flux Knit', category: 'Urban Commuter', price: 119, material: 'Seamless Flyknit + PU Foam', stock: 200, sizes: [6, 7, 8, 9, 10, 11, 12], color: 'Midnight Navy' },
  { id: 'KING-005', name: 'Cloud Step Walker', category: 'Comfort Walking', price: 175, material: 'Memory Foam + Gel Insert', stock: 95, sizes: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14], color: 'Cloud White' },
  { id: 'KING-006', name: 'Nitro Sprint Pro', category: 'Racing', price: 289, material: 'Carbon Plate + Mesh Upper', stock: 45, sizes: [7, 8, 9, 10, 11, 12, 13], color: 'Neon Volt' },
];

export const CATEGORIES = ['all', ...Array.from(new Set(PRODUCTS.map((p) => p.category)))];
