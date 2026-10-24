# TMA Deep Links

> **Course:** HeadMaster Bot · **Lesson:** 3 of 3

## What Are TMA Links

TMA stands for Telegram Mini App, and deep-links are basically shortcuts that teleport you straight to a specific spot inside the bot's interface without having to click through five menus first. Instead of opening the bot, navigating to the marketplace, finding the right tab, and clicking "forge," you can just tap a link like `https://t.me/HeadMasterGooner_bot/market/forge` and boom — you're already there. The gooner who's figured this out early saves themselves minutes every day, and when you're doing the same routes five times an hour, that adds up to hours of pure time theft back in your pocket. Most gooners never even realise these links exist, which means anyone using them is already ahead of the curve.

## Crafting Your Own

The beauty of TMA deep-links is that they follow a predictable pattern, which means you can build your own. The base format is `https://t.me/HeadMasterGooner_bot/<section>/<action>` and you can usually append parameters with a question mark, like `https://t.me/HeadMasterGooner_Bot/inventory?category=cosmetics`. The full section list lives in the bot's dev docs, but the gooner shortcut is to watch what your browser address bar shows when you click through the menus — that's your link template right there. Once you've got a few of these saved, throw them into your Telegram Saved Messages folder as bookmarks, or better yet, ask the bot to generate quick-access buttons that appear right in your chat window.

## Start_Param Navigation

The real flex move with TMA deep-links is the `start_param` — this is a special string you pass to the bot that triggers a specific action or loads a particular state the moment the app opens. For example, if you're sharing a team challenge with your squad, you can generate a link like `https://t.me/HeadMasterGooner_bot/start?start_app=challenge_join&token=abc123` and anyone who clicks it lands directly in the challenge lobby without typing a single command. This is how gooner squads coordinate efficiently — they share deep-links in their group chats to jump straight into raids, tournaments, or cooperative quests. The bot validates the token server-side, so these aren't just static bookmarks — they're dynamic invitations that carry context and permissions. Master these and you're running your own private shortcuts through the bot.

---
*Next: [Course complete — well done, gooner!]*
