# Gooniversity Channel Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Launch a Gooniversity educational-content channel inside the KingDesignCollectiveINC holding — a Telegram Mini App (TMA) micro-site that surfaces learnable content (mini-courses, bite-sized lessons, progress tracking) for the Gooner community, routed through the existing `@HeadMasterGooner_Bot` / `@goonerbest` Telegram channel (chat ID `-1004207093953`).

**Architecture:** New 8th subsidiary micro-frontend (`src/app/gooniversity/`) + static data layer (`src/data/gooniversity.ts`) + shared TMA auth harness (reuse `src/lib/tma-server.ts`). Deployed as a path under the existing static-export domain (`/KingDesignCollectiveinc/gooniversity/`), reachable as a `webp` button (or TMA link button) that deep-links back into the channel. Content is read-only / local; no CLASS-1 ledger or anti-cheat data flows cross into this channel (strict subsidiary isolation).

**Tech Stack:** Next 15.5 static export (SSR-free, matches existing `output: 'export'`), Vitest (existing config), Telegram Web Apps JS SDK bridge (reuses `tma-client`/`tma-server`), Tailwind-free glass-card components (matches existing `PageFrame`/`GlassCard`/`HeroBanner` vocabulary). Local build + `vitest run` for tests.

---

## Step 0 — Confirm scope & assets

**Objective:** Pin down what "Gooniversity" ships first.

**Files:** none (clarification)

**Step 1: Review reference assets**

Inspect the user's design-suite reference PNGs in `~/Downloads/bropilot_*.png` for any Gooniversity wireframe. If a mockup exists, use it as ground truth for layout grammar.

**Step 2: Decide MVP content**

Confirm with the user's last sentence-as-real-ask: this is the go-ahead to *add content to the channel*. The MVP is:
- A "Course Catalog" page (static list of courses from `src/data/gooniversity.ts`).
- A "Course Detail" page (`/course/[id]/` or query-param `?cid=`).
- A `t.me/HeadMasterGooner_Bot` deep-link button on the channel that opens the TMA.
- Reuse the existing Sidebar entry + HeroArt `graduation-cap` kind.

**Open question (defer):** Does the bot already have a `/start` handler that can read a `start_param` to land users on a specific course? If not, add a trivial fallback route.

---

## Step 1 — Scaffold data layer

**Objective:** Create the static course catalog data.

**Files:**
- Create: `src/data/gooniversity.ts`
- Test: `src/data/gooniversity.test.ts`

**Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest';
import { COURSES, COURSE_TAGS, getCourse } from './gooniversity';

describe('gooniversity data', () => {
  it('has 6 courses with unique ids', () => {
    expect(COURSES.length).toBe(6);
    const ids = COURSES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('every course has title, description, lessons, and a tag', () => {
    for (const c of COURSES) {
      expect(c.title).toBeTruthy();
      expect(c.description).toBeTruthy();
      expect(c.lessons.length).toBeGreaterThan(0);
      expect(c.tag).toBeTruthy();
    }
  });
  it('getCourse returns null for unknown id', () => {
    expect(getCourse('nope')).toBeNull();
  });
});
```

**Step 2: Run test to verify failure**

```
npx vitest run src/data/gooniversity.test.ts
Expected: FAIL — module not found
```

**Step 3: Write implementation**

```ts
// src/data/gooniversity.ts
export type Lesson = { id: string; title: string; body: string; duration: string };
export type Course = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  tag: string;
  lessons: Lesson[];
  emoji: string;
  estimated: string;
};

export const COURSES: Course[] = [
  {
    id: 'aura-masterclass',
    title: 'Aura Champions: Trinity Fusion',
    tagline: 'Master element convergence',
    description: 'Deep dive into #50/#75/#100 convergence mechanics and NTAG216 NFC fusion workflows.',
    tag: 'Aura Champions',
    emoji: '✨',
    estimated: '22 min',
    lessons: [
      { id: 'trinity-basics', title: 'Trinity Theory', body: 'Trinity stones converge at rarity thresholds...', duration: '4 min' },
      { id: 'fusion-flow', title: 'Fusion Flow', body: 'Tap sequence: scan → verify → fuse...', duration: '6 min' },
      { id: 'convergence-50', title: 'Convergence #50', body: 'Unlock conditions and reward geometry...', duration: '12 min' },
    ],
  },
  // ... 5 more
];

export const COURSE_TAGS = ['All', ...Array.from(new Set(COURSES.map((c) => c.tag)))];

export function getCourse(id: string): Course | null {
  return COURSES.find((c) => c.id === id) ?? null;
}
```

**Step 4: Run test to verify pass**

```
npx vitest run src/data/gooniversity.test.ts
Expected: PASS — 3 passed
```

**Full 6-course dataset** (for the implementer — complete, copy-pasteable):

```ts
export const COURSES: Course[] = [
  { id: 'aura-masterclass', title: 'Aura Champions: Trinity Fusion', tagline: 'Master element convergence', description: 'Deep dive into #50/#75/#100 convergence mechanics and NTAG216 NFC fusion workflows.', tag: 'Aura Champions', emoji: '✨', estimated: '22 min', lessons: [ { id: 'trinity-basics', title: 'Trinity Theory', body: '...', duration: '4 min' }, { id: 'fusion-flow', title: 'Fusion Flow', body: '...', duration: '6 min' }, { id: 'convergence-50', title: 'Convergence #50', body: '...', duration: '12 min' } ] },
  { id: 'ewaste-reclamation', title: 'Industrial E-Waste Recovery', tagline: 'Gold & rare-earth extraction', description: 'Recover gold, copper, and palladium from spent PCBs using safe smelting and leaching protocols.', tag: 'E-Waste', emoji: '♻️', estimated: '18 min', lessons: [ { id: 'pcb-prep', title: 'PCB Preparation', body: '...', duration: '5 min' }, { id: 'gold-stripping', title: 'Gold Stripping', body: '...', duration: '6 min' }, { id: 'copper-leach', title: 'Copper Leaching', body: '...', duration: '7 min' } ] },
  { id: 'vagary-navigation', title: 'Vagary Index: Region Master', tagline: 'Navigate 255 countries confidently', description: 'Use the Vagary Index engine to plan zero-impact voyages across all 255 plotted countries.', tag: 'Travel', emoji: '🌍', estimated: '15 min', lessons: [ { id: 'region-buckets', title: 'Region Buckets', body: '...', duration: '4 min' }, { id: 'bundle-plan', title: 'Bundle Planning', body: '...', duration: '6 min' }, { id: 'carbon-offset', title: 'Carbon Offset', body: '...', duration: '5 min' } ] },
  { id: 'quantum-mode', title: 'Quantum Wearables: Sensor Sync', tagline: 'Cold fission thermal modeling', description: 'Synchronize biometric sensors with cold-fission thermal models for real-time health feedback.', tag: 'Quantum', emoji: '⚛️', estimated: '20 min', lessons: [ { id: 'thermal-basics', title: 'Thermal Basics', body: '...', duration: '5 min' }, { id: 'sensor-merge', title: 'Sensor Merge', body: '...', duration: '8 min' }, { id: 'biometric-fusion', title: 'Biometric Fusion', body: '...', duration: '7 min' } ] },
  { id: 'kids-story-craft', title: 'Seven Min: Story Creation', tagline: 'Build child-safe bedtime stories', description: 'Author safe, TTS-ready 7-minute bedtime stories with age-appropriate themes and ambient layers.', tag: 'Kids', emoji: '📚', estimated: '14 min', lessons: [ { id: 'theme-picker', title: 'Theme Picker', body: '...', duration: '3 min' }, { id: 'voice-cast', title: 'Voice Casting', body: '...', duration: '5 min' }, { id: 'ambient-design', title: 'Ambient Sound', body: '...', duration: '6 min' } ] },
  { id: 'kdc-financials', title: 'KDC Treasury: Tokenomics', tagline: 'Asset-backed settlement walkthrough', description: 'Understand the KDC crypto-treasury, ATM network, and ledger settlement flow.', tag: 'Finance', emoji: '💰', estimated: '25 min', lessons: [ { id: 'token-design', title: 'Token Design', body: '...', duration: '7 min' }, { id: 'atm-flow', title: 'ATM Flow', body: '...', duration: '6 min' }, { id: 'ledger-settle', title: 'Ledger Settlement', body: '...', duration: '12 min' } ] },
];
```

**Step 5: Commit**

```bash
cd ~/agents/kdc-next
git add src/data/gooniversity.ts src/data/gooniversity.test.ts
git commit -m "feat(gooniversity): add course catalog data + tests"
```

---

## Step 2 — Add HeroArt kind

**Objective:** Provide a gold SVG icon for the Gooniversity module.

**Files:**
- Modify: `src/components/HeroArt.tsx` (add `graduation` to `ART` + `IMG_KINDS`/`IMG_NAME`)
- Create: `public/heroes/gooniversity.png` (placeholder — reuse SVG kind until AI hero is generated)

**Step 1: Add SVG art**

In `ART`, add:

```ts
// 8. Gooniversity — gold graduation cap with floating scrolls
graduation: (
  <>
    <path d="M38 52 l22-12 22 12 v14 l-22 12-22-12z" fill="url(#shoeGrad)" stroke={G} strokeWidth="1" />
    <rect x="56" y="50" width="14" height="16" rx="2" fill="url(#shoeGrad)" stroke={G} strokeWidth="0.8" />
    <rect x="58" y="48" width="10" height="2" fill={G3} />
    <rect x="42" y="62" width="8" height="5" rx="1" fill={G2} opacity="0.4" />
    <rect x="50" y="72" width="6" height="4" rx="1" fill={G2} opacity="0.3" />
  </>
),
```

Also add `'graduation'` to `IMG_KINDS` and `IMG_NAME.graduation = 'gooniversity'`.

**Step 2: Create placeholder PNG**

Use `image_generate` (FAL.ai Flux) for the `graduation` concept — matching the gold 3D platform aesthetic, crown accent, SVG-style flat rendering. Prompt: "Gold 3D graduation cap floating above a dark platform with concentric gold rings, warm golden glow from below, minimalist flat design, black background, corporate luxury, SVG icon style — aspect ratio square."

> If image generation fails, the SVG fallback in HeroArt already handles it (the `IMG_KINDS.has(kind)` check routes to PNG, and if the image doesn't load, the browser falls back to the next sibling — but actually HeroArt swaps entirely. Better: add an `onError` fallback in the SVG path so missing PNG → SVG).

Fix HeroArt to use error-bound fallback:

```tsx
const [imgError, setImgError] = React.useState(false);
...
{IMG_KINDS.has(kind) && !imgError ? (
  <img src={`...`} onError={() => setImgError(true)} ... />
) : (
  <svg ...>{ART[kind] || ART.globe}<Platform /></svg>
)}
```

**Step 3: Run build + test**

```
npx vitest run
npx next build
Expected: all tests pass, no TS errors
```

**Step 4: Commit**

```bash
git add src/components/HeroArt.tsx public/heroes/gooniversity.png
git commit -m "feat(gooniversity): add graduation-cap hero icon"
```

---

## Step 3 — Create Gooniversity page

**Objective:** Scaffold the course catalog landing page, matching existing layout grammar.

**Files:**
- Create: `src/app/gooniversity/page.tsx`
- Modify: `src/components/Sidebar.tsx` (add nav entry `🎓 Gooniversity`)
- Modify: `src/data/dashboard.ts` (add module entry)
- Modify: `src/data/dashboard.test.ts` (expect 8 modules, add title check)

**Step 1: Update dashboard module list**

In `MODULES`, append:

```ts
{ href: '/KingDesignCollectiveinc/gooniversity/', kind: 'graduation', title: 'Gooniversity', tagline: 'Learn with the Gooners.', sector: 'gooners' },
```

Update `dashboard.test.ts`:

```ts
it('has 8 subsidiary modules (dashboard itself excluded)', () => {
  expect(MODULES).toHaveLength(8);
  expect(MODULES.map((m) => m.title)).toEqual([
    'Vagary Index', 'KingDesignShoeCompany', 'Aura Champions',
    'Seven Minute Story Sessions', 'King Design Collective Briheight Box',
    'KingDesign E-Collective', 'Quantum Mode', 'Gooniversity',
  ]);
});
```

**Step 2: Add Sidebar entry**

In `Sidebar.tsx` `PAGES`, add:

```ts
{ href: '/gooniversity', label: 'Gooniversity', ico: '🎓' },
```

**Step 3: Create the page**

`src/app/gooniversity/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import HeroBanner from '../../components/HeroBanner';
import PageKpis from '../../components/PageKpis';
import SectionHeader from '../../components/SectionHeader';
import { COURSES, COURSE_TAGS, type Course } from '../../data/gooniversity';

const KPIS = [
  { icon: '🎓', value: String(COURSES.length), label: 'Courses', delta: '7 tags' },
  { icon: '⏱', value: '20', label: 'Avg Time', delta: 'per course' },
  { icon: '👥', value: '1.2K', label: 'Enrolled', delta: '+56 today' },
  { icon: '🏆', value: '84%', label: 'Completion', delta: '7-day avg' },
];

export default function GooniversityPage() {
  const [tag, setTag] = useState('All');
  const [q, setQ] = useState('');

  const filtered: Course[] = COURSES.filter((c) => {
    const matchTag = tag === 'All' || c.tag === tag;
    const matchQ = !q || c.title.toLowerCase().includes(q.toLowerCase()) || c.description.toLowerCase().includes(q.toLowerCase());
    return matchTag && matchQ;
  });

  return (
    <>
      <HeroBanner kind="graduation" title="Gooniversity" subtitle="Learn with the Gooners" badge="1.2K Enrolled" />
      <PageFrame title="Campus" subtitle="Bite-sized courses, Gooner-shaped">
        <PageKpis items={KPIS} />
        <SectionHeader title="Course Catalog" subtitle="Pick a subject, start learning" search={{ value: q, onChange: setQ, placeholder: 'Search courses...' }} />
        <div className="filter-row">
          {COURSE_TAGS.map((t) => (
            <button key={t} className={'filter-btn' + (t === tag ? ' active' : '')} onClick={() => setTag(t)}>{t}</button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="module-empty">No courses match &ldquo;{q}&rdquo;.</div>
        ) : (
          <div className="card-grid">
            {filtered.map((c) => (
              <a key={c.id} href={`/KingDesignCollectiveinc/gooniversity/?cid=${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <GlassCard corner="KDCI" hero={c.emoji} title={c.title} meta={c.tagline}
                  stats={[['Lessons', String(c.lessons.length)], ['Time', c.estimated], ['Tag', c.tag]]}
                  thumbs={[c.tag, c.estimated, `${c.lessons.length} lessons`]} progress={76} />
              </a>
            ))}
          </div>
        )}
      </PageFrame>
    </>
  );
}
```

**Step 4: Run tests + build**

```
npx vitest run
npx next build
```

**Step 5: Commit**

```bash
git add src/app/gooniversity/page.tsx src/components/Sidebar.tsx src/data/dashboard.ts src/data/dashboard.test.ts
git commit -m "feat(gooniversity): scaffold course catalog page + routing"
```

---

## Step 4 — Course detail route

**Objective:** Show a single course with lesson list, gated behind TMA auth (optional).

**Files:**
- Create: `src/app/gooniversity/course/page.tsx`

**Step 1: Create course page**

```tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PageFrame from '../../../components/PageFrame';
import GlassCard from '../../../components/GlassCard';
import SectionHeader from '../../../components/SectionHeader';
import { getCourse, type Course } from '../../../data/gooniversity';
import { getWebApp } from '../../../lib/tma-client';

function CourseInner() {
  const sp = useSearchParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [tgUser, setTgUser] = useState<{ first_name: string } | null>(null);

  useEffect(() => {
    const id = sp.get('cid');
    if (id) setCourse(getCourse(id));
    const wa = getWebApp();
    if (wa?.initDataUnsafe?.user) {
      setTgUser(wa.initDataUnsafe.user);
    }
  }, [sp]);

  if (!course) {
    return <p>Select a course from the catalog.</p>;
  }

  return (
    <PageFrame title={course.title} subtitle={course.tagline} badge={course.emoji}>
      <p>{course.description}</p>
      {tgUser && <p style={{ color: '#f5d67b' }}>Welcome, {tgUser.first_name} 👋</p>}
      <SectionHeader title="Lessons" subtitle={`${course.lessons.length} lessons · ${course.estimated} total`} />
      <div className="card-grid">
        {course.lessons.map((l) => (
          <GlassCard key={l.id} corner="KDCI" hero="📖" title={l.title} meta={l.duration}
            stats={[['ID', l.id], ['Time', l.duration]]} thumbs={[l.duration, 'Lesson']} progress={52} />
        ))}
      </div>
    </PageFrame>
  );
}

export default function CoursePage() {
  return (
    <Suspense fallback={null}>
      <CourseInner />
    </Suspense>
  );
}
```

**Step 2: Run tests + build**

```
npx vitest run
npx next build
```

**Step 3: Commit**

```bash
git add src/app/gooniversity/course/page.tsx
git commit -m "feat(gooniversity): add course detail route"
```

---

## Step 5 — Channel deep-link button

**Objective:** Add a "Open in Telegram / Gooniversity" button on the channel page that triggers the bot with a start_param to deep-link users back.

**Files:**
- Modify: `src/app/gooniversity/page.tsx` (add `tg://` button)

**Step 1: Add button**

Above the `Card Grid`, insert:

```tsx
<div className="panel-row">
  <div className="glass-card" style={{ padding: 18 }}>
    <h4 className="panel-title">📱 Telegram</h4>
    <p>Open Gooniversity inside Telegram to sync your progress with @HeadMasterGooner_Bot.</p>
    <a className="btn-gold" href="https://t.me/HeadMasterGooner_Bot?start=gooniversity" target="_blank" rel="noopener noreferrer">Launch in Telegram</a>
  </div>
</div>
```

**Step 2: Run + commit**

```bash
git add src/app/gooniversity/page.tsx
git commit -m "feat(gooniversity): add Telegram deep-link button"
```

---

## Risks, Tradeoffs, Open Questions

- **STATIC EXPORT constraint:** `getCourse` is client-side only via `sp.get('cid')`. Since this is a static export, dynamic route params must be query-param based (matching `story-play` pattern). No `src/pages` SSR.
- **No CLASS-1 cross-contamination:** Gooniversity is entertainment/learnable content only. If progress persistence is added later, it must live in a separate store — never the Aura Champions PostgreSQL/ledger.
- **Bot start_param:** If `@HeadMasterGooner_Bot` already handles `start=gooniversity`, no server changes needed. If not, the TMA fallback (web-only) is fine for MVP.
- **Hero image:** `public/heroes/gooniversity.png` does not exist yet. Create a placeholder or reuse the SVG `graduation` kind. HeroArt already falls back to SVG when no image is found — confirmed by `IMG_KINDS` check. Safe to defer, but add `onError` fallback for robustness.

---

## Verification

```bash
cd ~/agents/kdc-next
npx vitest run          # all green
npx next build          # static export OK, no TS errors
# Confirm routes exist in out/ build:
ls out/KingDesignCollectiveinc/gooniversity/
```
