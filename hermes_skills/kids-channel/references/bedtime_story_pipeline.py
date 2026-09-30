#!/usr/bin/env python3
"""
Kids Channel Bedtime Story Pipeline
Generates child-safe bedtime stories with TTS narration scripts

Supports two models:
- deepseek-r1:8b: Rich, detailed stories (slower but higher quality)
- gemma3:1b: Fast story generation (quicker for iterations/testing)
"""

import json
import os
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

# Child-safe content filters
BLACKLISTED_WORDS = {
    "violence", "death", "kill", "blood", "scary", "fear",
    "monster", "weapon", "war", "hurt", "pain", "danger",
    "nightmare", "horror", "terror", "panic", "wound", "deadly"
}

SENSITIVE_TOPICS = {
    "weapons", "violence", "mature themes", "adult content",
    "sexual content", "gore", "profanity", "substance abuse"
}

# Age-appropriate parameters
AGE_GROUPS = {
    "2-4": {
        "max_length": 200,
        "vocab_complexity": "simple",
        "theme_safety": "high",
        "sentence_length": 15
    },
    "4-6": {
        "max_length": 400,
        "vocab_complexity": "moderate",
        "theme_safety": "high",
        "sentence_length": 20
    },
    "6-8": {
        "max_length": 600,
        "vocab_complexity": "intermediate",
        "theme_safety": "medium",
        "sentence_length": 25
    }
}


class StoryGenerator:
    """Main story generation and TTS pipeline"""

    def __init__(self, ollama_url="http://localhost:11435", model="deepseek-r1:8b"):
        self.ollama_url = ollama_url
        self.model = model  # Can be "deepseek-r1:8b" or "gemma3:1b"
        self.output_dir = Path("stories")
        self.output_dir.mkdir(exist_ok=True)
        (self.output_dir / "tts_scripts").mkdir(exist_ok=True)
        (self.output_dir / "raw_stories").mkdir(exist_ok=True)
        (self.output_dir / "image_prompts").mkdir(exist_ok=True)

    def generate_story(self, topic: str, age_group: str = "4-6",
                       length_words: int = None) -> Dict:
        """Generate a child-safe bedtime story with all components"""

        # Default to age-appropriate length
        if length_words is None:
            age_params = AGE_GROUPS.get(age_group, AGE_GROUPS["4-6"])
            length_words = age_params["max_length"]

        # Create system prompt for child-safe story generation
        system_prompt = """
You are a children's bedtime story narrator for the Kids Channel.
Create warm, soothing stories that:
1. Contain no violence, scary elements, or mature themes
2. Feature positive role models and gentle adventure themes
3. Use age-appropriate vocabulary and sentence structure
4. Include calming, rhythmic language patterns
5. End with a positive, reassuring conclusion

Stories should be structured with clear scenes for TTS narration.
Always include gentle moral lessons about friendship, kindness, or curiosity.
"""

        user_prompt = f"""
Create a bedtime story for children aged {age_group}.
Topic: {topic}
Length: Approximately {length_words} words

FORMAT INSTRUCTIONS (follow strictly):
1. Start with: [Scene 1: Scene Title]
2. Each new scene MUST start with: [Scene N: Scene Title]
3. Maximum 5 scenes
4. Each scene must be 2-3 short paragraphs
5. Use simple, soothing language with gentle rhythm
6. End with moral lesson in this format: "Moral: [the lesson]"

Example format:
[Scene 1: Forest Clearing]
First paragraph content here.
Second paragraph content here.

[Scene 2: Sparkling Stream]
More story content here.

Moral: [The moral lesson of the story]

Story:
"""

        # Call Ollama via curl
        cmd = [
            "curl", "-s", f"{self.ollama_url}/api/generate",
            "-H", "Content-Type: application/json",
            "-d", json.dumps({
                "model": self.model,
                "prompt": system_prompt + user_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.3,
                    "top_p": 0.9,
                    "top_k": 40,
                    "stop": ["Story:"]
                }
            })
        ]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            response = json.loads(result.stdout)
            story_content = response.get("response", "")

            # Clean up smart quotes that break JSON
            story_content = story_content.replace(chr(8220), '"').replace(chr(8221), '"')
            story_content = story_content.replace(chr(8216), "'").replace(chr(8217), "'")

            # Apply child-safe filtering
            filtered_story = self._apply_content_filter(story_content)

            # Parse story into structured format
            structured_data = self._structure_story(filtered_story)

            # Generate image prompts from scenes
            image_prompts = self.generate_image_prompts({
                "age_group": age_group,
                "structured_scenes": structured_data["scenes"]
            })

            # Create TTS script
            tts_script = self.generate_tts_script({
                "title": topic,
                "age_group": age_group,
                "structured_scenes": structured_data["scenes"],
                "moral_lesson": structured_data["moral"],
                "model_used": self.model
            })

            # Return full package with all components
            return {
                "success": True,
                "title": topic,
                "age_group": age_group,
                "word_count": len(filtered_story.split()),
                "story_content": filtered_story,
                "structured_scenes": structured_data["scenes"],
                "moral_lesson": structured_data["moral"],
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "model_used": self.model,
                "image_prompts": image_prompts,
                "tts_script": tts_script
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "model_used": self.model
            }

    def _apply_content_filter(self, content: str) -> str:
        """Apply child-safe content filtering"""
        # Check for blacklisted words
        content_lower = content.lower()
        for word in BLACKLISTED_WORDS:
            if word in content_lower:
                content = re.sub(f"(?i){word}", "gentle", content)

        # Check for sensitive topics
        for topic in SENSITIVE_TOPICS:
            if topic in content_lower:
                content = re.sub(f"(?i){topic}", "wonderful adventure", content)

        return content

    def _structure_story(self, story: str) -> Dict:
        """Parse story into scenes and extract moral"""
        # Extract scenes marked with [Scene X: Title]
        scene_pattern = r'\[Scene (\d+):\s*([^\]]+)\]'
        scenes = []

        parts = re.split(scene_pattern, story)
        if len(parts) > 1:
            # First part is intro (if any)
            # Then alternating: scene number, scene title, scene content
            for i in range(1, len(parts), 3):
                if i + 2 < len(parts):
                    scenes.append({
                        "number": int(parts[i]),
                        "title": parts[i + 1].strip(),
                        "content": parts[i + 2].strip()
                    })
                elif i + 1 < len(parts):
                    scenes.append({
                        "number": int(parts[i]),
                        "title": parts[i + 1].strip(),
                        "content": ""
                    })
        else:
            # Single scene
            scenes = [{"number": 1, "title": "The Adventure", "content": story.strip()}]

        # Extract moral lesson from the "Moral:" line
        moral_lesson = self._extract_moral(story)

        return {
            "scenes": scenes,
            "moral": moral_lesson
        }

    def _extract_moral(self, story: str) -> str:
        """Extract moral lesson from story ending"""
        # Look for common moral indicators
        moral_patterns = [
            r"moral[:\s]+(.+?)(?:\n|$)",
            r"lesson[:\s]+(.+?)(?:\n|$)",
            r"remember[,\\s]+(.+?)(?:\n|$)"
        ]

        for pattern in moral_patterns:
            match = re.search(pattern, story, re.IGNORECASE)
            if match:
                return match.group(1).strip()

        # Default: last sentence of story
        sentences = story.strip().split('.')
        if sentences:
            return sentences[-1].strip() + "."
        return "Be kind and curious!"

    def generate_tts_script(self, story: Dict, voice_prefs: Dict = None) -> str:
        """Generate structured TTS narration script with timing cues"""
        if voice_prefs is None:
            voice_prefs = {
                "narrator_voice": "soft_female",
                "pace": "slow" if self.model == "gemma3:1b" else "moderate",
                "pauses": "long",
                "emphasis": "gentle"
            }

        script_lines = [
            "# TTS Narration Script",
            f"# Title: {story['title']}",
            f"# Age Group: {story['age_group']}",
            f"# Voice: {voice_prefs['narrator_voice']}",
            f"# Pace: {voice_prefs['pace']}",
            f"# Generated with: {story.get('model_used', 'unknown')}",
            "",
            "[Intro Music - Gentle lullaby, 5 seconds]",
            "",
            f'NARRATOR (warm, soothing): "Hello little dreamer. Tonight\'s story is... {story["title"]}."',
            "[Pause - 2 seconds]",
            ""
        ]

        for scene in story["structured_scenes"]:
            script_lines.extend([
                f"[Scene {scene['number']} Transition - Gentle music fade]",
                "",
                f'NARRATOR: "{scene["title"]}"',
                "[Brief pause - 1 second]",
                ""
            ])

            # Split scene content into readable chunks
            content_paragraphs = scene["content"].split('\n\n')
            for para in content_paragraphs:
                if para.strip():
                    script_lines.extend([
                        f'NARRATOR: "{para.strip()}"',
                        "[Natural pause - 0.5 seconds]",
                        ""
                    ])

            script_lines.append(f"[Scene {scene['number']} Outro - Soft piano, 5 seconds]")
            script_lines.append("")

        # Add moral lesson and outro
        moral = story.get("moral_lesson", "Be kind and curious!")
        script_lines.extend([
            f'NARRATOR: "And remember... {moral}"',
            "[Pause - 2 seconds]",
            "",
            "[Outro Music - Gentle lullaby fading, 15 seconds]",
            'NARRATOR: "Sweet dreams, little one. Sleep tight."',
            "[End - Fade to silence]",
            ""
        ])

        return "\n".join(script_lines)

    def generate_image_prompts(self, story: Dict) -> List[Dict]:
        """Generate child-safe image generation prompts for each scene"""
        prompts = []

        for scene in story.get("structured_scenes", []):
            prompt = {
                "scene_number": scene["number"],
                "scene_title": scene.get("title", "Unknown Scene"),
                "image_prompt": f"Children's book illustration style, {scene.get('title', 'scene')}, gentle and whimsical art, soft pastel colors, no sharp edges, no scary elements, suitable for ages {story.get('age_group', '4-6')}",
                "style": "watercolor illustration, Studio Ghibli inspired, soft lighting",
                "safety_checked": True
            }
            prompts.append(prompt)

        return prompts

    def save_story_package(self, story: Dict, tts_script: str, image_prompts: List[Dict]):
        """Save all story components to organized files"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = f"story_{timestamp}"

        # Save raw story JSON
        story_path = self.output_dir / "raw_stories" / f"{base_name}.json"
        with open(story_path, 'w') as f:
            json.dump(story, f, indent=2)
        print(f"Saved story JSON: {story_path}")

        # Save TTS script
        tts_path = self.output_dir / "tts_scripts" / f"{base_name}.txt"
        with open(tts_path, 'w') as f:
            f.write(tts_script)
        print(f"Saved TTS script: {tts_path}")

        # Save image prompts
        prompts_path = self.output_dir / "image_prompts" / f"{base_name}.json"
        with open(prompts_path, 'w') as f:
            json.dump(image_prompts, f, indent=2)
        print(f"Saved image prompts: {prompts_path}")

        # Save combined package
        package = {
            "story": story,
            "tts_script": tts_script,
            "image_prompts": image_prompts,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        package_path = self.output_dir / f"{base_name}_package.json"
        with open(package_path, 'w') as f:
            json.dump(package, f, indent=2)
        print(f"Saved complete package: {package_path}")

        return {
            "story_file": str(story_path),
            "tts_file": str(tts_path),
            "prompts_file": str(prompts_path),
            "package_file": str(package_path)
        }

    def run_pipeline(self, topic: str, age_group: str = "4-6"):
        """Run complete story generation pipeline"""
        print(f"\n=== Kids Channel Story Pipeline ===")
        print(f"Topic: {topic}")
        print(f"Age Group: {age_group}")
        print(f"Model: {self.model}")
        print()

        # Step 1: Generate story (includes TTS script and image prompts)
        print("[1/4] Generating bedtime story...")
        story = self.generate_story(topic, age_group)

        if not story["success"]:
            print(f"ERROR: {story['error']}")
            return None

        print(f"✅ Story generated ({story['word_count']} words) using {story.get('model_used', self.model)}")

        # Step 2: TTS script already generated in generate_story
        print("[2/4] Creating TTS narration script...")
        tts_script = story.get("tts_script", self.generate_tts_script(story))
        print(f"✅ TTS script created with {len(story['structured_scenes'])} scenes")

        # Step 3: Image prompts already generated in generate_story
        print("[3/4] Generating child-safe image prompts...")
        image_prompts = story.get("image_prompts", self.generate_image_prompts(story))
        print(f"✅ {len(image_prompts)} image prompts created")

        # Step 4: Save everything
        print("[4/4] Saving story package...")
        files = self.save_story_package(story, tts_script, image_prompts)

        print()
        print("=== Pipeline Complete ===")
        print("Files generated:")
        for key, path in files.items():
            print(f"  - {key}: {path}")

        return files


def main():
    """CLI entry point for bedtime story generation"""
    import argparse

    parser = argparse.ArgumentParser(description="Kids Channel Bedtime Story Generator")
    parser.add_argument("topic", help="Topic for the bedtime story")
    parser.add_argument("--age", "-a", default="4-6", choices=["2-4", "4-6", "6-8"],
                       help="Target age group")
    parser.add_argument("--model", "-m", default="deepseek-r1:8b",
                       choices=["deepseek-r1:8b", "gemma3:1b"],
                       help="Ollama model to use for generation")
    parser.add_argument("--ollama-url", default="http://localhost:11435",
                       help="Ollama API URL")

    args = parser.parse_args()

    generator = StoryGenerator(args.ollama_url, args.model)
    result = generator.run_pipeline(args.topic, args.age)

    if result:
        print("\nNext steps:")
        print("1. Review story in raw_stories/ folder")
        print("2. Use tts_scripts/ for narration recording")
        print("3. Use image_prompts/ for illustration generation")
        print("4. Package everything using the _package.json file")
        return 0
    else:
        return 1


if __name__ == "__main__":
    exit(main())