// Shared travel data — ported from the Vagary Index static webapp.
export const REGIONS: Record<string, string[]> = {
  "East Asia": ["China", "Japan", "South Korea", "North Korea", "Mongolia", "Taiwan"],
  "MENA": ["Egypt", "Saudi Arabia", "UAE", "Iran", "Turkey", "Morocco", "Iraq", "Syria", "Jordan", "Lebanon", "Israel", "Palestine", "Qatar", "Kuwait", "Bahrain", "Oman", "Yemen", "Algeria", "Tunisia", "Libya", "Sudan"],
  "SEA-ANZ": ["Australia", "New Zealand", "Indonesia", "Philippines", "Malaysia", "Thailand", "Vietnam", "Singapore", "Myanmar", "Cambodia", "Laos", "Brunei", "East Timor"],
  "South Asia": ["India", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal", "Bhutan", "Maldives", "Afghanistan"],
  "Europe": ["Germany", "France", "UK", "Italy", "Spain", "Poland", "Ukraine", "Romania", "Netherlands", "Belgium", "Greece", "Portugal", "Sweden", "Norway", "Denmark", "Finland", "Austria", "Switzerland", "Ireland", "Czech", "Hungary", "Bulgaria", "Croatia", "Slovakia", "Slovenia", "Lithuania", "Latvia", "Estonia", "Luxembourg", "Malta", "Iceland", "Serbia", "Montenegro", "Bosnia", "Albania", "North Macedonia"],
  "Americas": ["United States", "Canada", "Mexico", "Brazil", "Argentina", "Chile", "Colombia", "Peru", "Venezuela", "Guatemala", "Ecuador", "Cuba", "Dominican", "Honduras", "El Salvador", "Nicaragua", "Costa Rica", "Panama", "Uruguay", "Paraguay", "Bolivia", "Jamaica", "Haiti", "Bahamas", "Barbados"],
};

const CODE_MAP: Record<string, string> = {
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

export const CAPITALS: Record<string, string> = {
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

export function getCountryCode(name: string): string {
  return CODE_MAP[name] || "XX";
}

// Canonical region taxonomy. The committed snapshot mixes WorldBank labels
// ("Europe & Central Asia") with slugified internal labels ("mena",
// "south_asia_1", "east_asia_block2"); normalizeRegion collapses both onto one
// human-readable set so the country list shows 10 filter buckets, not 23.
export const REGION_ORDER = [
  'East Asia',
  'Southeast Asia',
  'South Asia',
  'Middle East',
  'Europe',
  'Africa',
  'North America',
  'South America',
  'Oceania',
  'Unclassified',
] as const;

const REGION_MAP: Record<string, string> = {
  // WorldBank human-readable labels
  'europe & central asia': 'Europe',
  'latin america & caribbean': 'South America',
  'sub-saharan africa': 'Africa',
  'east asia & pacific': 'East Asia',
  'middle east, north africa, afghanistan & pakistan': 'Middle East',
  'north america': 'North America',
  'south asia': 'South Asia',
  // Slugified internal labels
  mena: 'Middle East',
  middle_east: 'Middle East',
  ssa: 'Africa',
  africa: 'Africa',
  north_america: 'North America',
  oceania: 'Oceania',
  south_america: 'South America',
  americas: 'South America',
  sea2: 'Southeast Asia',
  east_asia: 'East Asia',
  east_asia_block2: 'East Asia',
  europe: 'Europe',
  central_asia: 'South Asia',
  south_asia_1: 'South Asia',
  polar_micro: 'Unclassified',
  unclassified: 'Unclassified',
};

export function normalizeRegion(raw: unknown): string {
  const key = String(raw ?? '').trim().toLowerCase();
  if (!key) return 'Unclassified';
  const mapped = REGION_MAP[key];
  // Idempotence by construction: a canonical name lowercased maps to itself.
  if (mapped) return mapped;
  const canonical = REGION_ORDER.find((r) => r.toLowerCase() === key);
  return canonical ?? 'Unclassified';
}

export type Country = { name: string; region: string; code: string };

export const ALL_COUNTRIES: Country[] = [];
for (const [region, countries] of Object.entries(REGIONS)) {
  // dedupe (source data had some repeats)
  const seen = new Set<string>();
  for (const c of countries) {
    if (seen.has(c)) continue;
    seen.add(c);
    ALL_COUNTRIES.push({ name: c, region, code: getCountryCode(c) });
  }
}

export const GUIDE_PRICE = 9.99;
export const BUNDLE_PRICE = 49.99;
