# OBS Config

> **Course:** Stream Setup Academy · **Lesson:** 2 of 3

## Scenes and Sources

A scene is basically a saved snapshot of everything you want to show, and sources are the individual pieces inside that scene. The gooner starter pack has three scenes minimum: Starting Soon, Be Right Back, and Live. Your Starting Soon scene should have a nice static image or simple animation, maybe a countdown timer so people know when you're actually coming online. Be Right Back is where you throw up aBRB screen with some chill music — don't just switch to your desktop, that's where you accidentally leak your Discord DMs mid-stream. The Live scene is where the magic happens: game capture source, your mic as an audio input, your webcam as a video capture device, and probably a browser source for your alerts and recent follower notifications.

## Bitrate and Encoder Settings

Bitrate is the amount of data you're pushing per second, and it's a direct trade-off between quality and accessibility. If you're on a budget rig without a fancy GPU, x264 at a CBR of 6000kbps is the sweet spot for 1080p60 — any higher and you start eating CPU you need for the actual game. Those with an RTX card can flip over to NVENC and push 8000kbps while keeping the game running buttery smooth, because the encode happens on a dedicated chip that doesn't fight your CPU for resources. Keyframe interval stays at 2, preset is "quality" for NVENC and "faster" or "fast" for x264 depending on your core count. Pro tip: run a test stream and watch the performance meters — if your CPU is pegged above 80%, drop the bitrate by 1000 and try again.

## Audio Mixing Like a Pro Goon

Audio is where a lot of promising gooner streams fall flat, and it's usually because everyone's volume is fighting for the same airspace. Your mic should sit around -12dB to -6dB on the OBS meters, loud enough that you don't have to shout but quiet enough that sudden peaks don't clip. Game audio lives around -20dB to -15dB, just audible enough to fill the gaps when you're not talking. If you've got background music, that sits even lower at around -30dB so it never competes with your voice. Use the sync offset feature to line up your audio — a slight delay on the game capture can kill the immersion faster than a bad mic. And for the love of all that is holy, set up a push-to-talk key instead of leaving your mic open — nobody wants to hear your keyboard every time you sneeze.

---
*Next: [Audience Growth]*
