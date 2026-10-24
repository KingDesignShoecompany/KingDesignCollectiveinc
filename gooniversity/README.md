# Gooniversity

Gooniversity is a standalone, Gooner-focused learning platform that delivers bite-sized courses across gaming, tech, sports, and finance. Each lesson is a 5-minute micro-session designed to level up your game knowledge quickly.

## Directory Layout

```
gooniversity/
├── README.md
├── data/
│   ├── catalog.json       # Course catalog data (6 courses, 18 lessons)
│   ├── catalog.ts         # TypeScript types + COURSES import + getCourse()
│   └── catalog.test.ts    # Vitest test suite for the catalog
├── metadata/channel_posts/  # Telegram channel post assets
├── thumbnails/              # Course/lesson thumbnail images
├── webapp/                  # Web application (future)
├── scripts/
│   ├── build_catalog.py     # Regenerate catalog.json from lesson markdown
│   ├── gen_thumbnail.py     # Generate thumbnails via FAL.ai
│   ├── format_post.py       # Format Telegram channel posts
│   └── gen_lessons.py       # Generate 18 lesson markdown files from catalog
└── skills/gooniversity-pipeline/
    └── SKILL.md             # Hermes skill for the Gooniversity pipeline
```

## Courses

| Course | Tag | Emoji |
|--------|-----|-------|
| Aura Trinity Mastery | Gaming | ✨ |
| Stream Setup Academy | Tech | 🎮 |
| Football IQ Essentials | Sports | ⚽ |
| Headmaster Bot | Tech | 🤖 |
| Community Mod Playbook | Social | 🛡️ |
| Gooner Finance 101 | Finance | 💰 |

## Testing

Tests are run via Vitest from the `gooniversity/` directory (self-contained):

```bash
cd ~/agents/gooniversity
npx vitest run
```

A local `vitest.config.ts` configures the jsdom environment and global test
globals, so tests are fully self-contained and do not depend on the
`~/agents` monorepo root.

## License

Part of the KingDesign Collective ecosystem.
