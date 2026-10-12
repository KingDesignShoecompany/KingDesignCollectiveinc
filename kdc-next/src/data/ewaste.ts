// E-Waste Recycling — materials, logistics, reports. Ported from static webapp.
export type Material = {
  key: string; name: string; conc: number; unit: string; recovery: number;
  price: number; priceUnit: string; emoji: string;
};

export const MATERIALS: Material[] = [
  { key: 'gold', name: 'Gold', conc: 0.1, unit: 'g/kg', recovery: 0.95, price: 2500, priceUnit: '/oz', emoji: '🥇' },
  { key: 'copper', name: 'Copper', conc: 150, unit: 'g/kg', recovery: 0.92, price: 4.50, priceUnit: '/lb', emoji: '🟠' },
  { key: 'palladium', name: 'Palladium', conc: 0.05, unit: 'g/kg', recovery: 0.88, price: 1200, priceUnit: '/oz', emoji: '⚪' },
  { key: 'silver', name: 'Silver', conc: 0.3, unit: 'g/kg', recovery: 0.90, price: 30, priceUnit: '/oz', emoji: '🔘' },
];

export const LOGISTICS_ROUTES = [
  { route: 'R-01', from: 'Downtown Hub', to: 'Reclamation Plant', stops: 12, kg: 4200, status: 'Active' },
  { route: 'R-02', from: 'Tech District', to: 'Reclamation Plant', stops: 8, kg: 3100, status: 'Active' },
  { route: 'R-03', from: 'University', to: 'Sorting Center', stops: 6, kg: 1850, status: 'Scheduled' },
  { route: 'R-04', from: 'Industrial Park', to: 'Reclamation Plant', stops: 15, kg: 5600, status: 'Active' },
];

export const BATCHES = [
  { batch: 'B-2401', material: 'Mixed Boards', kg: 850, gold: '2.1g', status: 'Processing' },
  { batch: 'B-2402', material: 'CPUs', kg: 320, gold: '4.8g', status: 'Complete' },
  { batch: 'B-2403', material: 'Connectors', kg: 1200, gold: '0.9g', status: 'Queued' },
  { batch: 'B-2404', material: 'Memory', kg: 90, gold: '3.2g', status: 'Processing' },
];

export const IMPACT = [
  { metric: 'CO₂ Avoided', value: '48.2 t', detail: 'vs. landfill' },
  { metric: 'Landfill Diverted', value: '125 t', detail: 'total processed' },
  { metric: 'Water Saved', value: '2.1M L', detail: 'vs. mining' },
  { metric: 'Energy Saved', value: '310 MWh', detail: 'vs. refining' },
];

export const COMPLIANCE = [
  { standard: 'R2 Certified', status: 'PASS', detail: 'Responsible Recycling' },
  { standard: 'e-Stewards', status: 'PASS', detail: 'Basel Action Network' },
  { standard: 'ISO 14001', status: 'PASS', detail: 'Environmental Mgmt' },
  { standard: 'Data Sanitization', status: 'PASS', detail: 'NIST 800-88' },
];
