# Gooniversity Navigation & Channel Index — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add navigation aids to Gooniversity's webapp and Telegram channel content so users can browse courses, jump between lessons, see progress, and find related content easily.

**Architecture:** Enhance the existing static HTML webapp with a SPA-like navigation layer (URL routing via `?cid=` and `?cid=<id>&lesson=<slug>`), add a lesson list drawer per course, and generate an index post + lesson-to-lesson navigation links in the Telegram channel posts.

**Tech Stack:** Plain HTML/CSS/JS (no build step), Python for content scripts, existing `catalog.json` data. Git at `~/agents/` root.

---

## Step 1 — Add lesson navigation to the webapp

**Objective:** When a user opens `?cid=<course-id>`, show a lesson list sidebar with clickable links to each lesson, a "back to courses" button, and progress indicators.

**Files:**
- Modify: `gooniversity/webapp/index.html` (add lesson list rendering, back button, lesson deep-linking)
- No new files needed (courses data already inline)

**Step 1: Rewrite the JS `renderSingleCourse` function**

Replace the existing function with one that:
1. Renders a "← Back to Courses" button (links to root `?`)
2. Shows a sidebar with all 3 lessons as clickable links (`?cid=<id>&lesson=<slug>`)
3. Highlights the active lesson
4. Shows a "Next lesson" button

```js
function renderSingleCourse(course, activeLessonSlug) {
  const lessonsList = course.lessons.map((l, i) => {
    const slug = l.slug || l.id;
    const isActive = slug === activeLessonSlug;
    return `<a href="?cid=${course.id}&lesson=${slug}" class="lesson-link ${isActive ? 'active' : ''}">
      <span class="lesson-num">${i + 1}</span>
      <span class="lesson-name">${l.title}</span>
      <span class="lesson-dur">${l.duration}</span>
    </a>`;
  }).join('');

  let content = '';
  if (activeLessonSlug) {
    const lesson = course.lessons.find(l => (l.slug || l.id) === activeLessonSlug);
    if (lesson) {
      content = `<div class="lesson-content">
        <h2>${lesson.title}</h2>
        <p class="lesson-desc">Lesson content for ${lesson.title}.</p>
      </div>`;
    }
  } else {
    content = `<div class="lesson-content">
      <h2>Select a lesson to begin</h2>
      <p>Choose a lesson from the sidebar to start learning ${course.title}.</p>
    </div>`;
  }

  const nextLesson = activeLessonSlug
    ? course.lessons[course.lessons.findIndex(l => (l.slug || l.id) === activeLessonSlug) + 1]
    : null;

  const nextBtn = nextLesson
    ? `<a href="?cid=${course.id}&lesson=${nextLesson.slug || nextLesson.id}" class="next-btn">Next: ${nextLesson.title} →</a>`
    : '';

  return `
    <header>
      <button onclick="location.search=''" class="back-btn">← Back to Courses</button>
      <h1>${course.emoji} ${course.title}</h1>
      <p>${course.tagline}</p>
      <div class="subtitle"><span>${course.description}</span></div>
    </header>
    <div class="course-view">
      <div class="lesson-sidebar">
        <div class="sidebar-title">Lessons</div>
        ${lessonsList}
        ${nextBtn}
      </div>
      ${content}
    </div>
  `;
}
```

**Step 2: Add CSS for the new layout**

```css
.course-view {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 24px;
}
.lesson-sidebar {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 16px;
  height: fit-content;
}
.lesson-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
}
.lesson-link:hover {
  background: var(--glass);
  color: var(--gold2);
}
.lesson-link.active {
  background: var(--gold3);
  color: var(--bg);
  font-weight: 600;
}
.lesson-num { font-size: 0.7rem; width: 20px; }
.lesson-name { flex: 1; font-size: 0.85rem; }
.lesson-dur { font-size: 0.75rem; color: var(--text-muted); }
.back-btn {
  background: var(--glass);
  border: 1px solid var(--card-border);
  color: var(--gold2);
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 16px;
}
.next-btn {
  display: block;
  margin-top: 12px;
  padding: 8px 12px;
  background: var(--gold);
  color: var(--bg);
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
}
.lesson-content h2 { color: var(--gold2); margin-bottom: 12px; }

@media (max-width: 768px) {
  .course-view { grid-template-columns: 1fr; }
}
```

**Step 3: Update the URL parser to handle `?lesson=<slug>`**

```js
const params = new URLSearchParams(window.location.search);
const cid = params.get('cid');
const lesson = params.get('lesson');
```

**Step 4: Run test (manual visual check)**

Open `webapp/index.html` in a browser, click a course card, verify sidebar + back button appear.

**Step 5: Commit**

```bash
cd ~/agents
git add gooniversity/webapp/index.html
git commit -m "feat(gooniversity): add lesson navigation sidebar + back button to webapp"
```

---

## Step 2 — Add index page to channel posts

**Objective:** Create a single "Gooniversity course index" post that lists all 6 courses with emojis, so users can easily browse what's available.

**Files:**
- Create: `gooniversity/metadata/channel_posts/_index.txt`
- Modify: `gooniversity/scripts/format_post.py` (add `--index` mode)

**Step 1: Add `format_index_post()` to format_post.py**

```python
def format_index_post(catalog: list) -> str:
    """Build a formatted Telegram Markdown index post listing all courses."""
    lines = ["🎓 *Gooniversity — Course Index*", ""]
    lines.append("All courses for the Gooner community:")
    lines.append("")
    for i, c in enumerate(catalog, 1):
        lessons = len(c.get("lessons", []))
        lines.append(f"{i}. {c.get('emoji', '📚')} *{c['title']}* — _{c.get('tagline', '')}_ ({lessons} lessons)")
    lines.append("")
    lines.append("💡 Tap any course title below to open its lesson list:")
    for c in catalog:
        lines.append(f"👉 t.me/{BOT_USERNAME}/app?start_param=catalog_{c['id']}")
    lines.append("")
    lines.append("#Gooniversity #Index")
    return "\n".join(lines)
```

**Step 2: Add `--index` flag to argparse**

```python
parser.add_argument("--index", action="store_true", help="Generate an index post listing all courses")
```

**Step 3: Handle `--index` in main()**

```python
if args.index:
    post = format_index_post(catalog)
    output_path = OUTPUT_DIR / "_index.txt"
    output_path.write_text(post + "\n", encoding="utf-8")
    print(post)
    print(f"Saved: {output_path}", file=sys.stderr)
    return 0
```

**Step 4: Generate the index post**

```bash
cd ~/agents/gooniversity
python3 scripts/format_post.py --index
```

**Step 5: Verify**

```bash
cat metadata/channel_posts/_index.txt
```

Expected: starts with "🎓 *Gooniversity — Course Index*", lists all 6 courses with deep-links.

**Step 6: Commit**

```bash
cd ~/agents
git add gooniversity/scripts/format_post.py gooniversity/metadata/channel_posts/_index.txt
git commit -m "feat(gooniversity): add course index post for channel navigation"
```

---

## Step 3 — Add "previous/next lesson" to lesson posts

**Objective:** Each lesson-level Telegram post should include "← Previous" and "Next →" links so users can navigate the course sequence in-channel.

**Files:**
- Modify: `gooniversity/scripts/format_post.py` (extend `format_lesson_post`)

**Step 1: Update `format_lesson_post()` with prev/next links**

```python
def format_lesson_post(course: dict, lesson: dict, index: int) -> str:
    emoji = course.get("emoji", "📚")
    course_title = course.get("title", "")
    lesson_title = lesson.get("title", "")
    duration = lesson.get("duration", "")
    slug = lesson.get("slug", "")
    tag = course.get("tag", "Gooniversity")
    total = len(course.get("lessons", []))

    deep_link = f"t.me/{BOT_USERNAME}/app?start_param=learn_{course['id']}_{slug}"

    lines = [
        f"{emoji} *{lesson_title}*",
        f"_Lesson {index} of {total} · {course_title}_",
        "",
        f"*{duration} read* · {course_title}",
        "",
        f"👉 {deep_link}",
        "",
    ]

    # Navigation links
    if index > 1:
        prev = course["lessons"][index - 2]
        prev_slug = prev.get("slug", prev.get("id", ""))
        lines.append(f"← *Previous:* t.me/{BOT_USERNAME}/app?start_param=learn_{course['id']}_{prev_slug}")
    if index < total:
        nxt = course["lessons"][index]
        next_slug = nxt.get("slug", nxt.get("id", ""))
        lines.append(f"→ *Next:* t.me/{BOT_USERNAME}/app?start_param=learn_{course['id']}_{next_slug}")

    lines.append("")
    lines.append(f"#{tag} #Gooniversity #Lesson{index}")
    return "\n".join(lines)
```

**Step 2: Regenerate all lesson posts**

```bash
cd ~/agents/gooniversity
for c in data/catalog.json; do
  python3 -c "import json; [print(c['id']) for c in json.load(open('data/catalog.json'))]" | while read id; do
    python3 -c "import json,sys; c=[x for x in json.load(open('data/catalog.json')) if x['id']=='$id'][0]; [print(l['slug']) for l in c['lessons']]" | while read slug; do
      python3 scripts/format_post.py "$id" --lesson "$slug" >/dev/null 2>&1
    done
  done
done
```

Or simpler:
```bash
cd ~/agents/gooniversity && for f in metadata/channel_posts/*.txt; do basename "$f" .txt; done | grep -v teaser | grep -v _index | while read name; do
  # re-run format_post for each
done
```

Actually — cleanest approach: add a `--all-lessons` mode to `format_post.py`:
```bash
python3 scripts/format_post.py --all-lessons
```

**Step 3: Commit**

```bash
cd ~/agents
git add gooniversity/scripts/format_post.py gooniversity/metadata/channel_posts/
git commit -m "feat(gooniversity): add prev/next navigation to lesson posts + index post"
```

---

## Step 4 — Add search/tags to the webapp

**Objective:** Add a search box to the webapp that filters courses by tag or keyword.

**Files:**
- Modify: `gooniversity/webapp/index.html`

**Step 1: Add search input + filter logic**

```html
<div class="search-bar">
  <input type="text" id="search" placeholder="Search courses... (e.g. 'finance', 'bot', 'football')">
</div>
```

```css
.search-bar {
  max-width: 600px;
  margin: 0 auto 32px;
}
.search-bar input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  color: var(--text-primary);
  font-size: 0.9rem;
}
```

```js
document.getElementById('search').addEventListener('input', function(e) {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll('.course-card').forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(q) ? '' : 'none';
  });
});
```

**Step 2: Add `--all-lessons` mode to format_post.py for batch regeneration**

```python
parser.add_argument(
    "--all-lessons",
    action="store_true",
    help="Generate lesson-level posts for all courses and lessons",
)
```

Handling in `main()`:
```python
if args.all_lessons:
    if args.course_id or args.lesson:
        print("Error: --all-lessons cannot be combined with course_id or --lesson", file=sys.stderr)
        return 1
    for course in catalog:
        for i, lesson in enumerate(course["lessons"], 1):
            post = format_lesson_post(course, lesson, i)
            output_path = OUTPUT_DIR / f"{course['id']}-{lesson.get('slug', lesson['id'])}.txt"
            output_path.write_text(post + "\n", encoding="utf-8")
            print(f"Saved: {output_path}", file=sys.stderr)
    return 0
```

**Step 3: Regenerate all lesson posts with nav**

```bash
cd ~/agents/gooniversity && python3 scripts/format_post.py --all-lessons
```

**Step 4: Commit**

```bash
cd ~/agents
git add gooniversity/webapp/index.html gooniversity/scripts/format_post.py gooniversity/metadata/channel_posts/
git commit -m "feat(gooniversity): add search bar to webapp + batch lesson post generation"
```

---

## Tests / Validation

| Task | Verification Command | Expected Result |
|------|---------------------|-----------------|
| Step 1 | Open `webapp/index.html` in browser → click a course | See sidebar + back button |
| Step 2 | `python3 scripts/format_post.py --index` | Creates `_index.txt` with 6 courses |
| Step 3 | `python3 scripts/format_post.py --all-lessons` | 18 `.txt` files with prev/next links |
| Step 4 | Search input filters courses live | Matching courses show, others hide |
| All | `npx vitest run` (from gooniversity/) | 3/3 tests still pass |

## Risks & Tradeoffs

- SVG thumbnails only (FAL.ai was unavailable — HTTP 429/402). Acceptable for TMA web preview since SVGs scale perfectly and match the gold-platform aesthetic.
- The webapp is static HTML — no auth, no state persistence. Good for TMA deployment but can't track individual user progress. Acceptable for MVP.
- `--all-lessons` mode regenerates all 18 posts — safe since it's deterministic, but would overwrite any manually edited posts.
