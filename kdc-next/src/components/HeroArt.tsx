import React from 'react';

// Gold 3D-style hero art (inline SVG) matching the dashboard reference aesthetic:
// each object floats above a metallic platform with concentric rings, lit from
// below by a warm golden glow. Pure SVG — no external image assets needed.

const G = '#d4af37';
const G2 = '#f5d67b';
const G3 = '#8a6d1f';

function Platform() {
  return (
    <g>
      <ellipse cx="60" cy="86" rx="34" ry="8" fill="url(#platGrad)" />
      <ellipse cx="60" cy="84" rx="34" ry="8" fill="none" stroke={G} strokeWidth="1" opacity="0.6" />
      <ellipse cx="60" cy="82" rx="24" ry="5.5" fill="none" stroke={G} strokeWidth="0.8" opacity="0.4" />
      <ellipse cx="60" cy="81" rx="14" ry="3.2" fill="none" stroke={G} strokeWidth="0.7" opacity="0.3" />
      <ellipse cx="60" cy="90" rx="40" ry="9" fill={G} opacity="0.08" />
    </g>
  );
}

function Glow() {
  return <ellipse cx="60" cy="88" rx="30" ry="6" fill={G2} opacity="0.18" />;
}

const ART: Record<string, React.ReactNode> = {
  // 1. Travel — gold wireframe globe with pins
  globe: (
    <>
      <circle cx="60" cy="52" r="24" fill="none" stroke={G} strokeWidth="1.4" opacity="0.9" />
      <ellipse cx="60" cy="52" rx="24" ry="9" fill="none" stroke={G} strokeWidth="0.9" opacity="0.6" />
      <ellipse cx="60" cy="52" rx="9" ry="24" fill="none" stroke={G} strokeWidth="0.9" opacity="0.6" />
      <line x1="36" y1="52" x2="84" y2="52" stroke={G} strokeWidth="0.9" opacity="0.6" />
      <line x1="60" y1="28" x2="60" y2="76" stroke={G} strokeWidth="0.8" opacity="0.5" />
      <circle cx="52" cy="45" r="2" fill={G2} /><circle cx="68" cy="58" r="2" fill={G2} />
      <circle cx="60" cy="38" r="2" fill={G2} /><circle cx="72" cy="48" r="1.8" fill={G2} />
      <path d="M52 45 l-2-4 M52 45 l3-1 M68 58 l-2-4 M68 58 l3-1" stroke={G2} strokeWidth="0.8" />
    </>
  ),
  // 2. Shoe — gold high-top sneaker with crown
  shoe: (
    <>
      <path d="M38 66 q0-10 6-12 l6-10 q1-2 3-1 l2 6 4-6 q2-2 4 0 l3 8 8 2 q8 2 8 10 l0 6 q0 3-3 3 l-38 0 q-3 0-3-3 z"
        fill="url(#shoeGrad)" stroke={G} strokeWidth="1" />
      <path d="M44 62 l14-4 M46 56 l12-3" stroke={G3} strokeWidth="1.2" />
      <path d="M74 50 l6-2 6 2" fill="none" stroke={G} strokeWidth="1" />
      <path d="M74 40 l2-3 2 3 2-4 2 4 2-3 2 3z" fill={G2} stroke={G} strokeWidth="0.6" />
      <path d="M38 69 l44 0" stroke={G3} strokeWidth="2" />
    </>
  ),
  // 3. Game — gold controller with purple accents
  controller: (
    <>
      <path d="M40 58 q-6 0-8 6 l-2 8 q-1 6 4 7 l6 1 q4 0 5-3 l2-4 18 0 2 4 q1 3 5 3 l6-1 q5-1 4-7 l-2-8 q-2-6-8-6 z"
        fill="url(#shoeGrad)" stroke={G} strokeWidth="1" />
      <circle cx="48" cy="60" r="1.6" fill="#a855f7" /><circle cx="48" cy="66" r="1.6" fill="#a855f7" />
      <rect x="43" y="61.5" width="6" height="1.4" fill="#a855f7" /><rect x="45.6" y="59" width="1.4" height="6" fill="#a855f7" />
      <circle cx="74" cy="60" r="2.4" fill="#a855f7" /><circle cx="70" cy="66" r="2.4" fill="#a855f7" />
      <path d="M56 56 l2-3 2 3 2-4 2 4 2-3 2 3z" fill={G2} stroke={G} strokeWidth="0.5" />
    </>
  ),
  // 4. Kids — stack of play cards with notes/stars
  cards: (
    <>
      <rect x="42" y="44" width="30" height="40" rx="4" fill="url(#shoeGrad)" stroke={G} strokeWidth="1" transform="rotate(-6 57 64)" />
      <rect x="50" y="40" width="30" height="40" rx="4" fill="url(#shoeGrad)" stroke={G} strokeWidth="1" transform="rotate(4 65 60)" />
      <rect x="46" y="46" width="32" height="40" rx="4" fill="url(#shoeGrad)" stroke={G} strokeWidth="1.2" />
      <path d="M57 58 l10 6 -10 6 z" fill={G2} stroke={G} strokeWidth="0.6" />
      <text x="38" y="40" fontSize="7" fill={G2}>♪</text><text x="80" y="46" fontSize="6" fill={G2}>★</text>
      <text x="36" y="70" fontSize="5" fill={G2}>★</text>
    </>
  ),
  // 5. Innovation — gold lightbulb
  bulb: (
    <>
      <circle cx="60" cy="50" r="16" fill="url(#bulbGrad)" stroke={G} strokeWidth="1" />
      <path d="M55 56 q2 3 5 3 q3 0 5-3 M54 60 q3 2 6 2 q3 0 6-2 M56 64 q2 1 4 1 q2 0 4-1"
        fill="none" stroke={G2} strokeWidth="1.2" />
      <rect x="55" y="65" width="10" height="5" rx="1" fill="url(#shoeGrad)" stroke={G} strokeWidth="0.8" />
      <rect x="56" y="70" width="8" height="2" rx="1" fill={G3} />
      <path d="M60 30 l0-4 M46 40 l-3-3 M74 40 l3-3" stroke={G2} strokeWidth="1" opacity="0.7" />
    </>
  ),
  // 6. E-Waste — gold recycling triangle
  recycle: (
    <>
      <path d="M60 34 l12 6 -4 3 -8-4z M72 40 l6 10 -4 2 -6-9z M58 78 l6-10 4 2 -6 9z M42 50 l-6 10 4 2 6-9z M48 40 l-6 10 4 2 6-9z"
        fill="url(#shoeGrad)" stroke={G} strokeWidth="1" strokeLinejoin="round" />
      <path d="M60 50 l-8 14 M60 50 l12 0 M60 50 l6-10" stroke={G} strokeWidth="1.2" fill="none" opacity="0.5" />
    </>
  ),
  // 7. Quantum — gold atom
  atom: (
    <>
      <circle cx="60" cy="52" r="4" fill={G2} stroke={G} strokeWidth="0.8" />
      <ellipse cx="60" cy="52" rx="26" ry="10" fill="none" stroke={G} strokeWidth="1" opacity="0.8" />
      <ellipse cx="60" cy="52" rx="26" ry="10" fill="none" stroke={G} strokeWidth="1" opacity="0.8" transform="rotate(60 60 52)" />
      <ellipse cx="60" cy="52" rx="26" ry="10" fill="none" stroke={G} strokeWidth="1" opacity="0.8" transform="rotate(120 60 52)" />
      <circle cx="86" cy="52" r="2.2" fill={G2} /><circle cx="34" cy="52" r="2.2" fill={G2} />
      <circle cx="73" cy="30" r="2" fill={G2} /><circle cx="47" cy="74" r="2" fill={G2} />
    </>
  ),
  // 8. KD Intelligence — gold crown on rising bar chart
  crown: (
    <>
      <rect x="40" y="60" width="8" height="16" rx="1" fill="url(#shoeGrad)" stroke={G} strokeWidth="0.8" />
      <rect x="52" y="52" width="8" height="24" rx="1" fill="url(#shoeGrad)" stroke={G} strokeWidth="0.8" />
      <rect x="64" y="44" width="8" height="32" rx="1" fill="url(#shoeGrad)" stroke={G} strokeWidth="0.8" />
      <rect x="76" y="36" width="8" height="40" rx="1" fill="url(#shoeGrad)" stroke={G} strokeWidth="0.8" />
      <path d="M46 34 l4-8 4 6 6-10 6 10 4-6 4 8 z" fill={G2} stroke={G} strokeWidth="0.7" />
      <circle cx="54" cy="26" r="1.5" fill={G2} /><circle cx="66" cy="22" r="1.5" fill={G2} /><circle cx="74" cy="26" r="1.5" fill={G2} />
    </>
  ),
};

export default function HeroArt({ kind }: { kind: keyof typeof ART | string }) {
  return (
    <svg viewBox="0 0 120 100" width="100%" height="100%" style={{ display: 'block' }} aria-hidden="true">
      <defs>
        <linearGradient id="shoeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={G2} /><stop offset="55%" stopColor={G} /><stop offset="100%" stopColor={G3} />
        </linearGradient>
        <radialGradient id="bulbGrad"><stop offset="0%" stopColor="#fff3c4" /><stop offset="100%" stopColor={G} /></radialGradient>
        <radialGradient id="platGrad"><stop offset="0%" stopColor={G} stopOpacity="0.5" /><stop offset="100%" stopColor={G3} stopOpacity="0.1" /></radialGradient>
      </defs>
      <Glow />
      {ART[kind] || ART.globe}
      <Platform />
    </svg>
  );
}
