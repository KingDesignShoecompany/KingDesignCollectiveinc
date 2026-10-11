// Seven Minute Story Sessions - Children's Story App JS
// Updated with audio file references and story-play.html linking

// Story database with audio file references
const STORIES = [
    { id: 'moonbear', title: "The Moonbear's Lullaby", theme: 'Animals', duration: '7:00', voice: 'Luna (Child)', ambient: 'Rain', views: '12.4K', age: '4-6', audio: 'audio/moonbear_lullaby.mp3', color: '🌙' },
    { id: 'starlight', title: 'The Starlight Adventure', theme: 'Adventure', duration: '7:00', voice: 'Luna (Child)', ambient: 'Ocean', views: '8.9K', age: '4-6', audio: 'audio/starlight_adventure.mp3', color: '⭐' },
    { id: 'cloud', title: 'Cloud Knight Dreamer', theme: 'Fantasy', duration: '7:00', voice: 'Luna (Child)', ambient: 'Forest', views: '6.7K', age: '2-4', audio: 'audio/cloud_knight_dreamer.mp3', color: '☁️' },
    { id: 'mermaid', title: 'The Mermaid Lagoon', theme: 'Fantasy', duration: '7:00', voice: 'Nova (Narrator)', ambient: 'Ocean', views: '9.3K', age: '4-6', audio: 'audio/mermaid_lagoon.mp3', color: '🧜‍♀️' },
    { id: 'dragonfriend', title: 'The Dragon Who Liked Cupcakes', theme: 'Fantasy', duration: '7:00', voice: 'Orion (Male)', ambient: 'Fireplace', views: '15.6K', age: '4-6', audio: null, color: '🐉' },
    { id: 'spaceship', title: "Timmy's Spaceship Adventure", theme: 'Adventure', duration: '7:00', voice: 'Nova (Narrator)', ambient: 'Ocean', views: '4.2K', age: '6-8', audio: null, color: '🚀' },
    { id: 'counting', title: 'Counting with Benny the Bunny', theme: 'Learning', duration: '7:00', voice: 'Lyra (Female)', ambient: 'Silence', views: '7.5K', age: '2-4', audio: null, color: '🐰' },
    { id: 'underwater', title: "The Mermaid's Pearl", theme: 'Fantasy', duration: '7:00', voice: 'Luna (Child)', ambient: 'Ocean', views: '11.8K', age: '4-6', audio: null, color: '🐚' },
];

const VOICES = ['Luna (Child)', 'Orion (Male)', 'Lyra (Female)', 'Nova (Narrator)'];
const AMBIENT_SOUNDS = ['Rain', 'Ocean Waves', 'Fireplace', 'Forest Sounds', 'Silence'];

// Per-story body text (paragraphs). Loaded into story-play.html by
// initializeStoryPlayer() so each story shows its OWN text, not Moonbear's.
const STORY_TEXT = {
    moonbear: [
        "Once upon a time, in a quiet forest, there lived a little bear named Bumble. Bumble had the softest golden fur and the kindest eyes.",
        "Every evening, as the sun painted the sky orange and pink, Bumble would hum a gentle lullaby that made all the forest animals feel safe and cozy.",
        "Tonight, the wind whispered through the trees, and Bumble began his lullaby. \"Hush now, little ones, the stars are coming out to play. Close your eyes and dream of tomorrow, when the sun will warm your face.\"",
        "The little rabbits curled up in their burrows, the birds nestled in their trees, and even the busy squirrels paused to listen.",
        "Sleep now, dear forest, sleep now and rest. Tomorrow will bring new adventures and new friends to meet.",
        "And so, under the silver moon, the entire forest slept peacefully, dreaming sweet dreams, because Bumble's lullaby had brought them comfort and warmth.",
        "The end. Sweet dreams, little one. Time for sleep."
    ],
    starlight: [
        "High above the sleeping town, a tiny star named Pip woke up with a big dream — to touch the Earth and see what it felt like.",
        "\"But stars belong in the sky,\" whispered the old moon. Pip didn't listen. With a wiggle and a wobble, off Pip floated, down through the soft night clouds.",
        "Pip drifted past an owl who hooted hello, and past a airplane that blinked its lights like a friendly wink.",
        "Down, down, down — until Pip landed softly on the windowsill of a little girl named Maya, who was still awake wishing on the very same sky.",
        "\"You came to visit me!\" Maya whispered in wonder. Pip glowed warm and golden, just for her.",
        "They talked until Maya's eyes grew heavy, and Pip glowed a soft goodnight song until she drifted off to sleep.",
        "And when Maya woke in the morning, a tiny golden smudge still sparkled on her windowsill — a reminder that wishes really can come true. The end."
    ],
    cloud: [
        "In a kingdom made entirely of fluffy white clouds, there lived a small knight named Sir Puff. Sir Puff was the smallest knight in all the sky, but he had the biggest heart.",
        "One night, Sir Puff set off on his trusty cloud-horse to guard the dreams of every sleeping child below.",
        "He sailed over sleepy towns and quiet farms, his armor made of soft mist and his helmet crowned with a tiny moon.",
        "When a little dream cloud wandered too far and got lost in the windy dark, Sir Puff caught it gently and carried it home.",
        "\"Rest now, little dream,\" he whispered. \"I'll keep you safe until morning.\"",
        "And so the Cloud Knight drifted on through the night, keeping watch over every dream until the first light of dawn touched the sky. The end."
    ],
    mermaid: [
        "Deep beneath the sparkling blue waves, in a hidden lagoon, lived a curious little mermaid named Coral. Coral had hair like seaweed and a laugh like bubbling water.",
        "One morning, Coral found something shimmering in the sand — a pearl unlike any she had ever seen, glowing with a soft pink light.",
        "\"Where did you come from?\" Coral asked the pearl. The pearl only glowed brighter, as if it had a story to tell.",
        "Coral swam through coral gardens and past sleepy turtles, asking everyone she met about the mysterious glowing pearl.",
        "At last, a wise old fish told her, \"That is a wishing pearl. It glows brightest when held by someone with a kind heart.\"",
        "Coral held the pearl close and made a wish — that all the creatures of the sea would always have a safe, happy home. The lagoon shimmered in agreement.",
        "And that night, the whole ocean glowed softly, as if the sea itself were dreaming sweet dreams. The end."
    ],
    dragonfriend: [
        "In a cozy cave at the edge of a sleepy village lived a dragon named Ember. Now, most dragons liked gold and treasure, but Ember had a different favorite thing — cupcakes!",
        "Every morning, the sweet smell of baking floated up from the village, and Ember's tummy would rumble like gentle thunder.",
        "One day, a little baker named Lily noticed her cupcakes disappearing from the windowsill. She peeked out and saw a small green dragon, sniffing happily.",
        "Instead of being scared, Lily laughed. \"Would you like to help me bake?\" she asked. Ember's eyes lit up like two little fires.",
        "Together they baked the most wonderful cupcakes the village had ever smelled — Ember warming the oven with just a tiny, careful puff of fire.",
        "From that day on, the dragon and the baker were the very best of friends, and every evening the whole village shared warm cupcakes under the stars. The end."
    ],
    spaceship: [
        "Timmy had always dreamed of flying to the stars, and tonight, his wish came true — a little silver spaceship landed softly in his backyard!",
        "\"Come aboard!\" beeped a friendly robot at the door. Timmy climbed in, and with a gentle whoosh, they were off among the twinkling stars.",
        "They zoomed past the moon, waved at Saturn's rings, and even had a picnic on a fluffy cloud made of stardust.",
        "\"Look!\" said Timmy, pointing at a tiny blue planet far below. \"That's home.\" It looked so small and so beautiful from up high.",
        "The robot gave Timmy a little glowing star to keep. \"So you'll always remember your adventure,\" it beeped.",
        "Timmy hugged the star tight as they floated back home, and that night he fell asleep smiling, dreaming of all the stars still waiting to be explored. The end."
    ],
    counting: [
        "Benny the Bunny loved to count. \"One!\" he'd say, hopping once. \"Two!\" he'd hop twice, his soft white tail bouncing along.",
        "One sunny morning, Benny decided to count everything in the meadow. One fluffy cloud floated by. \"One!\" cheered Benny.",
        "Two butterflies danced past. \"Two!\" Benny hopped twice with joy. Three bees buzzed happily around the flowers. \"Three!\"",
        "Four ladybugs spotted a leaf. \"Four!\" Five little fish swam in the brook. \"Five!\" Benny was getting very good at this.",
        "Six ducks waddled in a row, and seven daisies nodded in the breeze. \"Six! Seven!\" Benny counted, his nose wiggling with delight.",
        "By sunset, Benny had counted all the way to ten sleepy fireflies. \"Ten!\" he yawned, curling up in his cozy burrow.",
        "\"Counting is the best,\" Benny whispered, and drifted off to sleep, already dreaming of tomorrow's numbers. The end."
    ],
    underwater: [
        "Far down in the deepest blue, where the sunlight turned to silver, a young mermaid named Pearl searched for the most beautiful thing in the ocean.",
        "She swam through fields of swaying seaweed and gardens of glowing coral, but nothing seemed quite right.",
        "\"What are you looking for?\" asked a passing dolphin. \"Something that shines from the inside,\" Pearl answered softly.",
        "The dolphin smiled. \"Then look closer to home, little one.\" Pearl thought about this as she drifted back toward her quiet cove.",
        "There, nestled in the sand, her friends had gathered shells and stones, each one glowing with friendship and care.",
        "Pearl realized the most beautiful thing in the ocean wasn't a treasure at all — it was the friends who filled her days with light.",
        "And so Pearl sang a happy song, and the whole cove shimmered with joy beneath the silver waves. The end."
    ]
};

document.addEventListener('DOMContentLoaded', function() {
    initializeStoryApp();
});

function initializeStoryApp() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    if (currentPage === 'stories.html') {
        renderStories();
        initializeStoryFilters();
    } else if (currentPage === 'story.html' || currentPage === 'story-play.html') {
        initializeStoryPlayer();
    } else if (currentPage === 'create.html') {
        initializeStoryCreator();
    }

    // Play buttons
    document.querySelectorAll('.cta-button').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const text = this.textContent.trim();
            if (text.includes('Play')) {
                const card = this.closest('.story-card');
                const sid = card?.dataset?.sid || 'moonbear';
                window.location.href = 'story-play.html?sid=' + sid;
            } else if (text.includes('Generate')) {
                generateStory();
            } else if (text.includes('Save')) {
                alert('Draft saved! Continue editing anytime.');
            }
        });
    });
}

function renderStories() {
    const grid = document.getElementById('storyGrid');
    if (!grid) return;

    grid.innerHTML = STORIES.map(story => `
        <div class="story-card" data-theme="${story.theme}" data-voice="${story.voice}" data-sid="${story.id}">
            <div class="story-thumbnail">${story.color}</div>
            <h3 class="story-title">${story.title}</h3>
            <div class="story-meta">
                <span>${story.duration}</span> ·
                <span>${story.age}</span>
            </div>
            <div class="story-meta">
                <span>🎵 ${story.voice}</span> ·
                <span>${story.views} views</span> ·
                <span>🔊 ${story.ambient}</span>
            </div>
            <a href="story-play.html?sid=${story.id}" class="cta-button small">Play Story</a>
        </div>
    `).join('');
}

function initializeStoryFilters() {
    const filterBtns = document.querySelectorAll('.theme-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterStories(this.dataset.theme);
        });
    });

    const voiceFilter = document.getElementById('voiceFilter');
    if (voiceFilter) {
        voiceFilter.addEventListener('change', function() {
            filterStoriesByVoice(this.value);
        });
    }
}

function filterStories(theme) {
    const cards = document.querySelectorAll('.story-card');
    cards.forEach(card => {
        card.style.display = (theme === 'all' || card.dataset.theme === theme) ? '' : 'none';
    });
}

function filterStoriesByVoice(voice) {
    if (!voice || voice === 'All Voices') {
        document.querySelectorAll('.story-card').forEach(c => c.style.display = '');
        return;
    }
    const cards = document.querySelectorAll('.story-card');
    cards.forEach(card => {
        card.style.display = card.dataset.voice === voice ? '' : 'none';
    });
}

function renderChapters(paras) {
    const wrap = document.getElementById('chapterItems');
    if (!wrap) return;
    wrap.innerHTML = '';
    if (!paras.length) return;
    // Split the story's paragraphs into up to 3 chapters, proportional to length.
    const weights = paras.map(p => Math.max(1, p.length));
    const total = weights.reduce((a, b) => a + b, 0);
    const groups = [[], [], []];
    let acc = 0, gi = 0;
    paras.forEach((p, i) => {
        groups[gi].push(p);
        acc += weights[i];
        if (acc / total > (gi + 1) / 3 && gi < 2) gi++;
    });
    const audioEl = document.getElementById('storyAudio');
    const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s/60) + ':' + String(s%60).padStart(2,'0'); };
    // Cumulative start fraction of each group (for seek targets)
    let startFrac = 0;
    const bounds = [];
    groups.forEach(g => {
        const w = g.reduce((a, p) => a + Math.max(1, p.length), 0);
        bounds.push([startFrac, startFrac + w / total]);
        startFrac += w / total;
    });
    groups.forEach((g, idx) => {
        if (!g.length) return;
        const item = document.createElement('div');
        item.className = 'chapter-item' + (idx === 0 ? ' active' : '');
        const title = document.createElement('div');
        title.className = 'chapter-title';
        title.textContent = 'Chapter ' + (idx + 1) + ': ' + g[0].split(/[.,!?]/)[0].trim().substring(0, 48);
        const dur = document.createElement('div');
        dur.className = 'chapter-duration';
        dur.dataset.idx = idx;
        item.appendChild(title);
        item.appendChild(dur);
        item.addEventListener('click', function() {
            wrap.querySelectorAll('.chapter-item').forEach(c => c.classList.remove('active'));
            item.classList.add('active');
            if (audioEl && audioEl.duration) {
                audioEl.currentTime = bounds[idx][0] * audioEl.duration;
                if (audioEl.paused) audioEl.play();
            }
        });
        wrap.appendChild(item);
    });
    // Fill timestamps once audio duration is known
    function fillTimes() {
        const dur = audioEl && audioEl.duration ? audioEl.duration : 420; // fallback 7:00
        wrap.querySelectorAll('.chapter-duration').forEach(d => {
            const b = bounds[+d.dataset.idx];
            d.textContent = fmt(b[0] * dur) + ' - ' + fmt(b[1] * dur);
        });
    }
    if (audioEl) {
        if (audioEl.duration) fillTimes();
        else audioEl.addEventListener('loadedmetadata', fillTimes, { once: true });
    } else fillTimes();
}

function initializeStoryPlayer() {
    const urlParams = new URLSearchParams(window.location.search);
    const sid = urlParams.get('sid') || 'moonbear';
    const story = STORIES.find(s => s.id === sid);
    if (!story) return;

    // Set story title
    const titleEl = document.getElementById('storyTitle');
    if (titleEl) titleEl.textContent = story.title;

    // Set narrator + theme badges from story data
    const narratorEl = document.getElementById('storyNarrator');
    if (narratorEl && story.voice) narratorEl.textContent = 'Narrator: ' + story.voice;
    const themeEl = document.getElementById('storyTheme');
    if (themeEl && story.theme) themeEl.textContent = 'Theme: ' + story.theme;

    // Set audio source
    const audioEl = document.getElementById('storyAudio');
    if (audioEl && story.audio) {
        audioEl.src = story.audio;
    }

    // Load this story's OWN body text (replaces the hardcoded Moonbear paragraphs)
    const paras = (typeof STORY_TEXT !== 'undefined' && STORY_TEXT[story.id]) || null;
    if (paras) {
        const content = document.querySelector('.story-content');
        if (content) {
            content.innerHTML = '';
            paras.forEach(function(line) {
                const p = document.createElement('p');
                p.className = 'story-paragraph';
                p.textContent = line;
                content.appendChild(p);
            });
        }
    }

    // Build chapters from THIS story's paragraphs (3 equal groups), with
    // proportional timestamps. Each chapter seeks the audio when clicked.
    renderChapters(paras || []);

    // Text highlighting for story.html
    const paragraphs = document.querySelectorAll('.story-paragraph');
    const playBtn = document.querySelector('.play-btn');
    let currentLine = 0;

    if (playBtn) {
        playBtn.addEventListener('click', function() {
            this.classList.toggle('playing');
            if (this.classList.contains('playing')) {
                this.textContent = '⏸';
                playStory();
            } else {
                this.textContent = '▶';
                stopStory();
            }
        });
    }

    function playStory() {
        const wave = document.querySelector('.audio-wave span');
        let i = 0;
        const interval = setInterval(() => {
            paragraphs.forEach((p, idx) => {
                p.classList.toggle('highlight', idx === currentLine);
            });
            if (wave) {
                const spans = document.querySelectorAll('.audio-wave span');
                spans[i % spans.length].style.opacity = '1';
                setTimeout(() => spans[i % spans.length].style.opacity = '0.3', 300);
            }
            currentLine = (currentLine + 1) % paragraphs.length;
            i++;
            if (currentLine === 0) {
                clearInterval(interval);
                playBtn.textContent = '▶';
                playBtn.classList.remove('playing');
            }
        }, 2500);
    }

    function stopStory() {
        currentLine = 0;
        paragraphs.forEach(p => p.classList.remove('highlight'));
    }

    // Sleep timer
    const sleepTimerBtn = document.getElementById('sleepTimerBtn');
    const sleepTimer = document.getElementById('sleepTimer');
    if (sleepTimerBtn && sleepTimer) {
        sleepTimerBtn.addEventListener('click', function() {
            sleepTimer.style.display = sleepTimer.style.display === 'block' ? 'none' : 'block';
        });
        document.querySelectorAll('.timer-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                alert(`Sleep timer set for ${this.dataset.minutes} minutes. Story will pause automatically.`);
                sleepTimer.style.display = 'none';
            });
        });
    }

    // Ambient sound toggle
    const ambientBtn = document.getElementById('ambientBtn');
    if (ambientBtn) {
        ambientBtn.addEventListener('click', function() {
            alert(`Ambient sound: ${story.ambient}\nVolume: 70%`);
        });
    }

    // Text size
    const textSizeBtn = document.getElementById('textSizeBtn');
    if (textSizeBtn) {
        let sizes = ['1rem', '1.1rem', '1.2rem', '1.3rem'];
        let currentSize = 0;
        textSizeBtn.addEventListener('click', function() {
            currentSize = (currentSize + 1) % sizes.length;
            const textPanel = document.querySelector('.story-text');
            if (textPanel) textPanel.style.fontSize = sizes[currentSize];
        });
    }
}

function initializeStoryCreator() {
    const lengthSlider = document.getElementById('storyLength');
    const lengthDisplay = document.getElementById('lengthDisplay');
    if (lengthSlider && lengthDisplay) {
        lengthSlider.addEventListener('input', function() {
            const seconds = parseInt(this.value);
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            lengthDisplay.textContent = `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
        });
    }

    const steps = document.querySelectorAll('.wizard-step');
    const prevBtn = document.getElementById('prevStep');
    const nextBtn = document.getElementById('nextStep');
    let currentStep = 0;

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', function() {
            if (currentStep > 0) {
                steps[currentStep].classList.remove('active');
                currentStep--;
                steps[currentStep].classList.add('active');
                updateDots();
                prevBtn.disabled = currentStep === 0;
            }
        });
        nextBtn.addEventListener('click', function() {
            if (currentStep < steps.length - 1) {
                steps[currentStep].classList.remove('active');
                currentStep++;
                steps[currentStep].classList.add('active');
                updateDots();
                prevBtn.disabled = currentStep === 0;
                nextBtn.textContent = currentStep === steps.length - 1 ? 'Finish' : 'Next';
            }
        });
    }

    function updateDots() {
        document.querySelectorAll('.dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentStep);
        });
    }
}

function generateStory() {
    const theme = document.getElementById('themeSelect')?.value || 'Animals';
    const character = document.getElementById('mainCharacter')?.value || 'a friendly creature';
    const friend = document.getElementById('friendCharacter')?.value || 'a kind friend';
    const voice = document.getElementById('ttsVoice')?.value || 'Luna (Child)';
    const ambient = document.getElementById('ambientSound')?.value || 'Rain';

    const story = `
Once upon a time, ${character} and ${friend} went on a ${theme.toLowerCase()} adventure.

${theme === 'Animals' ? 'In a quiet forest, the animals gathered...' :
  theme === 'Adventure' ? 'Across distant lands, they discovered...' :
  theme === 'Fantasy' ? 'In a magical realm, wonders awaited...' :
  'On a bright morning, learning began...'}

[Story generated for 7-minute TTS narration with ${voice} voice and ${ambient} ambient sounds.]

The end. Sweet dreams!
    `;

    alert(`Story generated!\nTheme: ${theme}\nVoice: ${voice}\nAmbient: ${ambient}\nDuration: ~7 minutes\n\nStory preview:\n${story.substring(0, 200)}...`);
}
