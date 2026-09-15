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

function initializeStoryPlayer() {
    const urlParams = new URLSearchParams(window.location.search);
    const sid = urlParams.get('sid') || 'moonbear';
    const story = STORIES.find(s => s.id === sid);
    if (!story) return;

    // Set story title
    const titleEl = document.getElementById('storyTitle');
    if (titleEl) titleEl.textContent = story.title;

    // Set audio source
    const audioEl = document.getElementById('storyAudio');
    if (audioEl && story.audio) {
        audioEl.src = story.audio;
    }

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
