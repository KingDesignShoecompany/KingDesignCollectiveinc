# Mod Tools

> **Course:** Community Mod Playbook · **Lesson:** 1 of 3

## The Goon Moderation Toolkit

Look, moderation isn't about being the fun police — it's about keeping the server alive and well so everyone can actually enjoy being there. The HeadMaster Bot hands you a few key weapons, and the smart gooner mod knows when to use which one. `/mute` is your go-to for the guy who's arguing about last night's result three hours after kickoff — it silences them for a set duration, usually 15 minutes to an hour depending on how heated things got. `/warn` is softer and better for the first-time offender who accidentally posted a duplicate meme — one warning and they know the rules, a second one and the mute follows. `/kick` is nuclear for when someone's being legitimately toxic, but always log it because the senior mods want to know why you yeeted someone.

## Ban and Timeout Commands

When a goon crosses the line into harassment or hate territory, you've got the big guns. `/ban` drops them from the server entirely, and unlike a kick they can't just rejoin with a new account if you've got the verify gate enabled. For repeat offenders, the bot also supports timed bans — `/ban 7d` keeps their account locked out for a week, which gives them time to cool off and reflect on why being a wanker doesn't pay. Timeouts are the middle ground: they can still read channels but can't send messages, reaction, or join voice chat for the duration. The bot keeps a full audit log, so always add a reason with the command — `reason` tags save every mod's arse during the monthly review meeting.

## Custom Moderation Flows

Here's where the goon mod separates from the pack: automating the boring stuff so you can focus on the human problems. Set up auto-mute filters for specific keywords that the bot will silently handle without you lifting a finger, and configure slow-mode in busy channels during peak hours so the spam doesn't overwhelm the regular conversation. The bot also supports custom report commands — train your regulars to use `/report @username reason` and you'll get pinged with a clean notification instead of a dozen people mobbing you in replies. Most importantly, document everything. When you figure out that guy who spams football takes at 3am every Tuesday is causing chaos, set up a recurring mute so the bot handles it before it even becomes your problem. A good mod is proactive, but a great mod is one the community forgets ever existed because everything just works.

---
*Next: [Event Scheduling]*
