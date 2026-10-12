// Kids Channel story database — ported from the static webapp (with full text for read-along).
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
  emoji: string;
  text: string[];
};

export const STORIES: Story[] = [
  {
    id: 'moonbear', title: "The Moonbear's Lullaby", theme: 'Animals', duration: '7:00', voice: 'Luna (Child)', ambient: 'Rain', views: '12.4K', age: '4-6', audio: null, emoji: '🌙',
    text: [
      "Once upon a time, in a quiet forest, there lived a little bear named Bumble. Bumble had the softest golden fur and the kindest eyes.",
      "Every evening, as the sun painted the sky orange and pink, Bumble would hum a gentle lullaby that made all the forest animals feel safe and cozy.",
      "Tonight, the wind whispered through the trees, and Bumble began his lullaby. \"Hush now, little ones, the stars are coming out to play. Close your eyes and dream of tomorrow, when the sun will warm your face.\"",
      "The little rabbits curled up in their burrows, the birds nestled in their trees, and even the busy squirrels paused to listen.",
      "Sleep now, dear forest, sleep now and rest. Tomorrow will bring new adventures and new friends to meet.",
      "And so, under the silver moon, the entire forest slept peacefully, dreaming sweet dreams, because Bumble's lullaby had brought them comfort and warmth.",
      "The end. Sweet dreams, little one. Time for sleep.",
    ],
  },
  {
    id: 'starlight', title: 'The Starlight Adventure', theme: 'Adventure', duration: '7:00', voice: 'Luna (Child)', ambient: 'Ocean', views: '8.9K', age: '4-6', audio: null, emoji: '⭐',
    text: [
      "High above the sleeping town, a tiny star named Pip woke up with a big dream — to touch the Earth and see what it felt like.",
      "\"But stars belong in the sky,\" whispered the old moon. Pip didn't listen. With a wiggle and a wobble, off Pip floated, down through the soft night clouds.",
      "Pip drifted past an owl who hooted hello, and past an airplane that blinked its lights like a friendly wink.",
      "Down, down, down — until Pip landed softly on the windowsill of a little girl named Maya, who was still awake wishing on the very same sky.",
      "\"You came to visit me!\" Maya whispered in wonder. Pip glowed warm and golden, just for her.",
      "They talked until Maya's eyes grew heavy, and Pip glowed a soft goodnight song until she drifted off to sleep.",
      "And when Maya woke in the morning, a tiny golden smudge still sparkled on her windowsill — a reminder that wishes really can come true. The end.",
    ],
  },
  {
    id: 'cloud', title: 'Cloud Knight Dreamer', theme: 'Fantasy', duration: '7:00', voice: 'Luna (Child)', ambient: 'Forest', views: '6.7K', age: '2-4', audio: null, emoji: '☁️',
    text: [
      "In a kingdom made entirely of fluffy white clouds, there lived a small knight named Sir Puff. Sir Puff was the smallest knight in all the sky, but he had the biggest heart.",
      "One night, Sir Puff set off on his trusty cloud-horse to guard the dreams of every sleeping child below.",
      "He sailed over sleepy towns and quiet farms, his armor made of soft mist and his helmet crowned with a tiny moon.",
      "When a little dream cloud wandered too far and got lost in the windy dark, Sir Puff caught it gently and carried it home.",
      "\"Rest now, little dream,\" he whispered. \"I'll keep you safe until morning.\"",
      "And so the Cloud Knight drifted on through the night, keeping watch over every dream until the first light of dawn touched the sky. The end.",
    ],
  },
  {
    id: 'mermaid', title: 'The Mermaid Lagoon', theme: 'Fantasy', duration: '7:00', voice: 'Nova (Narrator)', ambient: 'Ocean', views: '9.3K', age: '4-6', audio: null, emoji: '🧜‍♀️',
    text: [
      "Deep beneath the sparkling blue waves, in a hidden lagoon, lived a curious little mermaid named Coral. Coral had hair like seaweed and a laugh like bubbling water.",
      "One morning, Coral found something shimmering in the sand — a pearl unlike any she had ever seen, glowing with a soft pink light.",
      "\"Where did you come from?\" Coral asked the pearl. The pearl only glowed brighter, as if it had a story to tell.",
      "Coral swam through coral gardens and past sleepy turtles, asking everyone she met about the mysterious glowing pearl.",
      "At last, a wise old fish told her, \"That is a wishing pearl. It glows brightest when held by someone with a kind heart.\"",
      "Coral held the pearl close and made a wish — that all the creatures of the sea would always have a safe, happy home. The lagoon shimmered in agreement.",
      "And that night, the whole ocean glowed softly, as if the sea itself were dreaming sweet dreams. The end.",
    ],
  },
  {
    id: 'dragonfriend', title: 'The Dragon Who Liked Cupcakes', theme: 'Fantasy', duration: '7:00', voice: 'Orion (Male)', ambient: 'Fireplace', views: '15.6K', age: '4-6', audio: null, emoji: '🐉',
    text: [
      "In a cozy cave at the edge of a sleepy village lived a dragon named Ember. Now, most dragons liked gold and treasure, but Ember had a different favorite thing — cupcakes!",
      "Every morning, the sweet smell of baking floated up from the village, and Ember's tummy would rumble like gentle thunder.",
      "One day, a little baker named Lily noticed her cupcakes disappearing from the windowsill. She peeked out and saw a small green dragon, sniffing happily.",
      "Instead of being scared, Lily laughed. \"Would you like to help me bake?\" she asked. Ember's eyes lit up like two little fires.",
      "Together they baked the most wonderful cupcakes the village had ever smelled — Ember warming the oven with just a tiny, careful puff of fire.",
      "From that day on, the dragon and the baker were the very best of friends, and every evening the whole village shared warm cupcakes under the stars. The end.",
    ],
  },
  {
    id: 'spaceship', title: "Timmy's Spaceship Adventure", theme: 'Adventure', duration: '7:00', voice: 'Nova (Narrator)', ambient: 'Ocean', views: '4.2K', age: '6-8', audio: null, emoji: '🚀',
    text: [
      "Timmy had always dreamed of flying to the stars, and tonight, his wish came true — a little silver spaceship landed softly in his backyard!",
      "\"Come aboard!\" beeped a friendly robot at the door. Timmy climbed in, and with a gentle whoosh, they were off among the twinkling stars.",
      "They zoomed past the moon, waved at Saturn's rings, and even had a picnic on a fluffy cloud made of stardust.",
      "\"Look!\" said Timmy, pointing at a tiny blue planet far below. \"That's home.\" It looked so small and so beautiful from up high.",
      "The robot gave Timmy a little glowing star to keep. \"So you'll always remember your adventure,\" it beeped.",
      "Timmy hugged the star tight as they floated back home, and that night he fell asleep smiling, dreaming of all the stars still waiting to be explored. The end.",
    ],
  },
  {
    id: 'counting', title: 'Counting with Benny the Bunny', theme: 'Learning', duration: '7:00', voice: 'Lyra (Female)', ambient: 'Silence', views: '7.5K', age: '2-4', audio: null, emoji: '🐰',
    text: [
      "Benny the Bunny loved to count. \"One!\" he'd say, hopping once. \"Two!\" he'd hop twice, his soft white tail bouncing along.",
      "One sunny morning, Benny decided to count everything in the meadow. One fluffy cloud floated by. \"One!\" cheered Benny.",
      "Two butterflies danced past. \"Two!\" Benny hopped twice with joy. Three bees buzzed happily around the flowers. \"Three!\"",
      "Four ladybugs spotted a leaf. \"Four!\" Five little fish swam in the brook. \"Five!\" Benny was getting very good at this.",
      "Six ducks waddled in a row, and seven daisies nodded in the breeze. \"Six! Seven!\" Benny counted, his nose wiggling with delight.",
      "By sunset, Benny had counted all the way to ten sleepy fireflies. \"Ten!\" he yawned, curling up in his cozy burrow.",
      "\"Counting is the best,\" Benny whispered, and drifted off to sleep, already dreaming of tomorrow's numbers. The end.",
    ],
  },
  {
    id: 'underwater', title: "The Mermaid's Pearl", theme: 'Fantasy', duration: '7:00', voice: 'Luna (Child)', ambient: 'Ocean', views: '11.8K', age: '4-6', audio: null, emoji: '🐚',
    text: [
      "Far down in the deepest blue, where the sunlight turned to silver, a young mermaid named Pearl searched for the most beautiful thing in the ocean.",
      "She swam through fields of swaying seaweed and gardens of glowing coral, but nothing seemed quite right.",
      "\"What are you looking for?\" asked a passing dolphin. \"Something that shines from the inside,\" Pearl answered softly.",
      "The dolphin smiled. \"Then look closer to home, little one.\" Pearl thought about this as she drifted back toward her quiet cove.",
      "There, nestled in the sand, her friends had gathered shells and stones, each one glowing with friendship and care.",
      "Pearl realized the most beautiful thing in the ocean wasn't a treasure at all — it was the friends who filled her days with light.",
      "And so Pearl sang a happy song, and the whole cove shimmered with joy beneath the silver waves. The end.",
    ],
  },
];

export const THEMES = ['All', ...Array.from(new Set(STORIES.map((s) => s.theme)))];
export const AGE_GROUPS = ['All Ages', '2-4', '4-6', '6-8'];
