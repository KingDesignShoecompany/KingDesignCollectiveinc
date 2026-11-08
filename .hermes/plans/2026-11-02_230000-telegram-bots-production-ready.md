# Telegram Bot Infrastructure Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make both Telegram bots durable and production-ready: auto-start on boot, with all inbound DM/update handling in local python-telegram-bot processes, n8n restricted to outbound/scheduled channel posts only.

**Architecture:** Local python-telegram-bot long-polling daemons under `C:\Users\young\bots\`, persisted via Windows Task Scheduler. Inbound DMs/updates handled entirely by local bots. n8n workflows use bot tokens only for outbound channel posts and scheduled jobs; no n8n Telegram Triggers are used.

**Tech Stack:** python-telegram-bot 22.8, Windows Task Scheduler, n8n 1.79.3, Telegram BotFather/API, git.

---

## Option 1 — Persist Bots as Services

### Task 1: Add startup scripts

**Objective:** Provide restartable launch scripts so the user can run either bot without remembering env vars or paths.

**Files:**
- Create: `C:\Users\young\bots\start_uponbot.bat`
- Create: `C:\Users\young\bots\start_headmaster.bat`

**Step 1: Write files**

`start_uponbot.bat`:
```bat
@echo off
cd /d C:\Users\young\bots
set UPONBOT_TOKEN=
for /f "tokens=1,* delims=:" %a in ('findstr /b "8866994677" ..\agents\telegram_bot_token.txt') do set UPONBOT_TOKEN=%a:%b
"C:\Users\young\bots\.venv\Scripts\python.exe" uponbot_kdc.py
pause
```

`start_headmaster.bat`:
```bat
@echo off
cd /d C:\Users\young\bots
set HEADMASTERGOONER_TOKEN=
for /f "tokens=1,* delims=:" %a in ('findstr /b "8638289272" ..\agents\telegram_bot_token.txt') do set HEADMASTERGOONER_TOKEN=%a:%b
"C:\Users\young\bots\.venv\Scripts\python.exe" headmaster_gooner.py
pause
```

**Step 2: Verify files exist**

Run: `dir C:\Users\young\bots\*.bat`
Expected: 2 files listed

### Task 2: Create Windows Task Scheduler entries

**Objective:** Auto-start both bots when the user logs on, without exposing ports.

**Files:**
- Modify: none
- Test: manual Task Scheduler verification

**Step 1: Create uponbot task**

Run:
```powershell
schtasks /create /tn "uponbot_kdc" /tr "C:\Users\young\bots\start_uponbot.bat" /sc onlogon /ru "young" /f
```
Expected: SUCCESS

**Step 2: Create headmaster task**

Run:
```powershell
schtasks /create /tn "headmaster_gooner" /tr "C:\Users\young\bots\start_headmaster.bat" /sc onlogon /ru "young" /f
```
Expected: SUCCESS

**Step 3: Verify**

Run: `schtasks /query /tn "uponbot_kdc" /fo list | findstr "Task\|Status\|Run\|Start\|Comment\|Next"`
Run: `schtasks /query /tn "headmaster_gooner" /fo list | findstr "Task\|Status\|Run\|Start\|Comment\|Next"`

### Task 3: Add README for bot operations

**Objective:** Document how to start/stop/check logs for both bots.

**Files:**
- Create: `C:\Users\young\bots\README.md`

Content outline:
- File layout
- How to start manually
- How to view running bot logs via process manager
- How to update tokens: edit `~/agents/telegram_bot_token.txt`

---

## Option 2 — Enhance Local Bots Only (n8n inbound webhooks disabled)

**Rationale:** Telegram Triggers in n8n require a public HTTPS webhook URL. Under the no-open-ports constraint, inbound updates must be handled by local python-telegram-bot long-polling. n8n may still post to Telegram using bot credentials for outbound/scheduled content.

### Task 4: Harden `@uponbot` local responder

**Objective:** Replace any planned n8n Telegram Trigger with local bot handlers for /start, /help, DMs, and callback queries.

**Files:**
- Modify: `C:\Users\young\bots\uponbot_kdc.py`
- Test: manual Telegram DM

**Step 1: Add /help handler**

```python
async def help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "👑 Commands:\n/start — KDC overview\n/help — this message\n/subs — subsidiaries"
    )
```

**Step 2: Add /subs handler**

```python
async def subs(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(KDC_STATUS, parse_mode="Markdown")
```

**Step 3: Register handlers**

```python
app.add_handler(CommandHandler("help", help))
app.add_handler(CommandHandler("subs", subs))
```

**Step 4: Verify manually**

DM `/help`, `/subs`, `/start` to `@uponbot`; expect replies within 30s.

### Task 5: Harden `@HeadMasterGooner_Bot` local responder

**Objective:** Add /help, /channel, and course deep-link helpers to the local bot.

**Files:**
- Modify: `C:\Users\young\bots\headmaster_gooner.py`

**Step 1: Add /help handler**

```python
async def help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🎓 Commands:\n/start — channel info\n/help — this message\n/courses — list courses"
    )
```

**Step 2: Add /courses handler**

```python
async def courses(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "📚 6 courses • 18 lessons\nChannel: @goonerbest\nWeb: kingdesignshoecompany.github.io/KingDesignCollectiveinc/gooniversity",
        parse_mode="Markdown"
    )
```

**Step 3: Register handlers**

```python
app.add_handler(CommandHandler("help", help))
app.add_handler(CommandHandler("courses", courses))
```

**Step 4: Verify manually**

DM `/help`, `/courses`, `/start`; expect replies within 30s.

### Task 6: Remove broken n8n inbound dependency

**Objective:** Stop using n8n Telegram Trigger for inbound handling.

**Files:**
- Modify: `C:\Users\young\agents\.n8n\workflows\kingdesign\uponbot_dm_responder.json` → delete or archive

**Step 1: Archive workflow**

Move `uponbot_dm_responder.json` to:
- `C:\Users\young\agents\.n8n\workflows\kingdesign\archived\uponbot_dm_responder.json`

**Step 2: Verify**

Confirm no active n8n workflow uses Telegram Trigger updates = `message` or `callback_query` if the goal is inbound DM handling.

---

## Option 3 — Profile Polish for @HeadMasterGooner_Bot

### Task 7: Set bot description/about

**Objective:** Give `@HeadMasterGooner_Bot` a public-facing description.

**Files:**
- Manual step via BotFather

**Step 1: Use BotFather**

1. Open Telegram → `/mybots` → `@HeadMasterGooner_Bot` → Bot Settings → Edit Description
2. Paste:
   > 🎓 Gooniversity bot — channel @goonerbest, 6 courses, 18 lessons. Posts brainrot captcha gatekeeping, VIP hooks, AI Q&A, scheduled queue drops. DM /start for channel info.
3. Save

**Step 2: Edit About section**

1. BotFather → Edit About Text
2. Paste:
   > Gooniversity channel bot. AI captioned memes, automated lessons, VIP tracking.
3. Save

### Task 8: Set profile picture

**Objective:** Upload a 512x512 profile picture for `@HeadMasterGooner_Bot`.

**Files:**
- Manual step via BotFather

**Step 1: Prepare image**

Create or select a 512x512 PNG avatar representing Gooniversity (brainrot/sigma/educational hybrid).

**Step 2: Upload**

BotFather → Edit Photo → Upload image → Confirm crop → Save

### Task 9: Request custom username from Bot Support

**Objective:** Ask Telegram Bot Support for a custom username instead of `HeadMasterGooner_Bot`.

**Precondition:** Bot must be fully operational and have a profile picture (from Task 8).

**Step 1: Contact Bot Support**

1. Open Telegram → search `@BotSupport`
2. Send message:
   > Hello, I have completed setup for @HeadMasterGooner_Bot. It is fully operational with description, about, and profile picture. Please review and allow a custom username change. Current: HeadMasterGooner_Bot. Requested replacement: [desired-username]. Thank you.
3. Await response

**Open question:** What exact custom username do you want for the bot? Telegram usernames must be unique and end in `bot` or `Bot`.

---

## Tests / Validation

- [ ] Both `.bat` files launch their respective bots from a fresh shell
- [ ] `schtasks /query` shows both tasks registered and enabled
- [ ] Logging into Windows auto-starts both bots within 60s
- [ ] `@uponbot` responds to `/start`, `/help`, `/subs` in Telegram within 30s
- [ ] `@HeadMasterGooner_Bot` responds to `/start`, `/help`, `/courses` in Telegram within 30s
- [ ] Both bots show online status and message delivery 200 OK in logs
- [ ] `uponbot_dm_responder.json` is archived, not imported
- [ ] No n8n workflow uses Telegram Trigger for inbound DMs/updates
- [ ] `@HeadMasterGooner_Bot` has description, about text, and profile picture visible in Telegram
- [ ] Bot Support ticket submitted if username change desired

---

## Risks, Tradeoffs, and Open Questions

- **Task Scheduler dependency:** Bots only auto-start on user login. For always-on behavior, this host must stay logged in or the tasks should run as a service account.
- **Token storage:** `telegram_bot_token.txt` stores tokens on disk. If needed, move to Windows Credential Manager or environment secrets.
- **n8n import CLI broken:** n8n 1.79.3 import fails with `workflows.map is not a function`. UI-based credential wiring and workflow import is required.
- **n8n API auth:** REST API requires an API key; without it, credential insertion must be done manually in the UI.
- **Custom username availability:** The desired username must be unique across Telegram. Have 2–3 fallback names ready.
- **BotFather rate limits:** Avoid rapid profile edits; wait 24h if BotFather returns rate-limit errors.

---

## Execution Handoff

Ready to execute using subagent-driven-development. I can dispatch a fresh subagent per task with two-stage review (spec compliance then code quality). Shall I proceed?
