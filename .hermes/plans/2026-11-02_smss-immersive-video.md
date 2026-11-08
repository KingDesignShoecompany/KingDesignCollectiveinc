# Seven Minute Story Sessions — Immersive Video Experience Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Replace the audio-only kids experience with a real MP4-based video channel UI in `kdc-next`, anchored by `C:\Users\young\Downloads\STory)SMSS01.mp4` as the first story video, plus an immersive kids landing page and a richer dashboard module row. The new visuals must remain consistent with the existing `kdc-next` theme: dark background, gold accents, Fraunces headings, Inter body, glass panels, and subtle gradients.

**Architecture:** Treat stories as video-first media with optional audio/text fallback. Each story record gets a `video` path under `/KingDesignCollectiveinc/videos/`. The player page drives a `<video>` element when a path exists, otherwise falls back to the existing simulated timer/honest badge. The kids landing page upgrades to an immersive hero + featured preview row using the same glass/gold grammar. Dashboard stays functional and becomes visually richer for the kids module with no theme change.

**Tech Stack:** Next.js 15 static export, React, TypeScript, public static assets, browser-native `<video>` with no extra deps, existing global CSS token system in `src/styles/globals.css`.

---

## Current state

- `kdc-next/src/data/stories.ts` — 8 stories, `audio: null`, no `video` field.
- `kdc-next/src/app/story-play/page.tsx` — simulated timer with honest badge when `audio` is null.
- `kdc-next/src/app/kids-channel/page.tsx` — glass-card library landing page.
- `C:\Users\young\Downloads\STory)SMSS01.mp4` — 7 min, 1920x1080 H.264, ~313 MB.
- No `kdc-next/public/videos/` directory exists.

## Assumptions

- Large video files belong in `public/videos/`, committed or copy-managed separately.
- Static export can serve `/KingDesignCollectiveinc/videos/*.mp4` directly.
- Story playback UI should favor `<video>` when available, preserve chapters/progress UI.
- Kids landing should feel immersive with featured video preview, darker mood, motion-aware cards.
- Dashboard change is limited to richer module tiles for Kids, not a full rewrite.

---

## Phase 1 — Story data: add video paths

### Task 1.1: Add `video` field to `Story` type

**Files:**
- Modify: `C:\Users\young\agents\kdc-next\src\data\stories.ts:1-14`

**Step 1:** Update type + add SMSS01 mapping.

```ts
export type Story = {
  id: string;
  title: string;
  theme: string;
  duration: string;
  voice: string;
  ambient: string;
  views: string;
  age: string;
  audio: string | null;
  video: string | null;   // new
  emoji: string;
  text: string[];
};
```

**Step 2:** Add only `STory)SMSS01.mp4` as `smss01`, mapped to the existing Moonbear story.

```ts
video: '/KingDesignCollectiveinc/videos/smss01.mp4'
```

**Step 3:** Verify build still compiles.

Run: `cd C:\Users\young\agents\kdc-next && npx tsc --noEmit`
Expected: no new type errors.

---

## Phase 2 — Assets: stage the MP4

### Task 2.1: Copy source MP4 into public videos

**Files:**
- Create dir: `C:\Users\young\agents\kdc-next\public\videos\`

**Step 1:** Create the directory.

Run: `mkdir -p "C:\Users\young\agents\kdc-next\public\videos"`
Expected: directory exists.

**Step 2:** Copy the source file with a clean filename.

Run: `cp "C:\Users\young\Downloads\STory)SMSS01.mp4" "C:\Users\young\agents\kdc-next\public\videos\smss01.mp4"`
Expected: copy succeeds, file size ~327 MB.

**Step 3:** Optional git hygiene — if you do not want 313 MB in the repo, add a `.gitignore` entry for `public/videos/*.mp4` and store upload/deploy separately.

**Verification:** `ffprobe public/videos/smss01.mp4` shows duration `420.x`, `1920x1080`.

---

## Phase 3 — Video-first player

### Task 3.1: Rewrite `story-play` to prefer `<video>`, keep honest fallback

**Files:**
- Modify: `C:\Users\young\agents\kdc-next\src\app\story-play\page.tsx`

**Step 1:** Add `videoRef`, `videoFailed`, `hasRealMedia`.

```ts
const videoRef = useRef<HTMLVideoElement | null>(null);
const [videoFailed, setVideoFailed] = useState(false);
const hasVideo = !!story.video && !videoFailed;
const hasAudio = !!story.audio && !videoFailed;
const hasRealMedia = hasVideo || hasAudio;
```

**Step 2:** Sync play state to `<video>` when `hasVideo`.

```ts
useEffect(() => {
  if (!hasVideo) return;
  const el = videoRef.current;
  if (!el) return;
  const onTime = () => setElapsed(Math.floor(el.currentTime));
  const onErr = () => setVideoFailed(true);
  const onEnd = () => setPlaying(false);
  el.addEventListener('timeupdate', onTime);
  el.addEventListener('error', onErr);
  el.addEventListener('ended', onEnd);
  return () => {
    el.removeEventListener('timeupdate', onTime);
    el.removeEventListener('error', onErr);
    el.removeEventListener('ended', onEnd);
  };
}, [hasVideo]);
```

**Step 3:** Keep simulated clock only when `!hasRealMedia`.

**Step 4:** Render the appropriate media element in this priority order:
- `hasVideo` → `<video ref={videoRef} src={story.video} controls playsInline preload="metadata" />`
- `hasAudio` → `<audio ref={audioRef} src={story.audio} />`
- else → honest badge + simulated clock

**Step 5:** Preserve read-along/chapters/progress UI.

**Step 6:** Verify:
- localhost:3000/KingDesignCollectiveinc/story-play/?sid=moonbear → video plays and drives progress.
- Corrupt path → honest badge appears instead of blank.

---

## Phase 4 — Immersive kids landing

### Task 4.1: Make `kids-channel/page.tsx` more immersive

**Files:**
- Modify: `C:\Users\young\agents\kdc-next\src\app\kids-channel\page.tsx`

**Step 1:** Swap hero to an immersive kids mood.

```tsx
<HeroBanner kind="cards" title="Seven Minute Story Sessions" subtitle="Bedtime videos for little dreamers" badge="Safe Mode: ON" />
```

**Step 2:** Add a featured video preview row above the library when `featured.video` exists.

```tsx
{featured.video && (
  <a className="featured-video-wrap" href={`/KingDesignCollectiveinc/story-play/?sid=${featured.id}`}>
    <video src={featured.video} preload="metadata" muted playsInline />
    <div className="featured-video-overlay">
      <div className="featured-play">▶</div>
      <div>
        <div className="sp-title">{featured.title}</div>
        <div className="sp-meta">{featured.theme} · {featured.duration} · age {featured.age}</div>
      </div>
    </div>
  </a>
)}
```

**Step 3:** Upgrade card grid to show a video tag for stories with `video`, otherwise keep emoji.

```tsx
<div className="story-media">
  {s.video ? (
    <video src={s.video} preload="metadata" muted playsInline />
  ) : (
    <div className="story-emoji">{s.emoji}</div>
  )}
</div>
```

**Step 4:** Add immersive CSS tokens in `kids-channel` scope: darker panel, softer glow, larger hover lift, thumbnail play icon overlay.

**Verification:** `/KingDesignCollectiveinc/kids-channel/` shows a featured preview for Moonbear + hoverable video thumbnails.

---

## Phase 5 — Richer dashboard module tile for kids

### Task 5.1: Upgrade the kids module tile to show “Now Playing” / last story

**Files:**
- Modify: `C:\Users\young\agents\kdc-next\src\app\page.tsx`
- Modify: `C:\Users\young\agents\kdc-next\src\data\dashboard.ts`

**Step 1:** Add a kids-specific module variant in the module grid.

```tsx
href="/KingDesignCollectiveinc/kids-channel/"
kind="cards"
title="Seven Minute Story Sessions"
tagline="Bedtime videos"
badge="Now Playing"
```

**Step 2:** Make `Module` accept an optional `badge` and render it as a small pill in the module tile.

**Step 3:** Keep all other modules unchanged.

---

## Phase 6 — Tests / validation

### Task 6.1: Verify build + media wiring

Run: `cd C:\Users\young\agents\kdc-next && npm run build`
Expected: build succeeds.

Run: `npx next start --port 3210` in background, then:
- `/KingDesignCollectiveinc/kids-channel/` HTTP 200
- `/KingDesignCollectiveinc/story-play/?sid=moonbear` HTTP 200
- `/KingDesignCollectiveinc/videos/smss01.mp4` HTTP 200, content-type `video/mp4`

Run: `npx tsc --noEmit`
Expected: clean.

---

## Files likely to change

- `C:\Users\young\agents\kdc-next\src\data\stories.ts`
- `C:\Users\young\agents\kdc-next\src\app\story-play\page.tsx`
- `C:\Users\young\agents\kdc-next\src\app\kids-channel\page.tsx`
- `C:\Users\young\agents\kdc-next\src\app\page.tsx`
- `C:\Users\young\agents\kdc-next\src\data\dashboard.ts`
- `C:\Users\young\agents\kdc-next\public\videos\smss01.mp4`

## Risks / tradeoffs

- 313 MB MP4 is large for git; prefer git-lfs or external asset hosting if history matters.
- Mobile playback can autoblock unmuted video — use `muted` previews until user opts in.
- If the user supplies more MP4s later, this design scales trivially: just set `video` on each story.
