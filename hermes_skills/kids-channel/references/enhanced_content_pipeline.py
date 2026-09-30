#!/usr/bin/env python3
"""
Kids Channel Enhanced Content Pipeline
Extends bedtime_story_pipeline.py with:
1. TTS audio file generation using OpenAI TTS
2. Image generation from scene prompts using FLUX
3. YouTube Shorts script formatting for social content
"""

import json
import os
import subprocess
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List
from bedtime_story_pipeline import StoryGenerator

class EnhancedContentPipeline(StoryGenerator):
    """Extends story pipeline with audio, image, and YouTube Shorts output"""
    
    def generate_tts_audio(self, story: Dict, voice: str = "nova", speed: float = 0.9) -> str:
        """Generate TTS audio file from story content"""
        tts_dir = self.output_dir / "audio"
        tts_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        audio_file = tts_dir / f"story_{timestamp}.mp3"
        
        # Combine story content into one text for TTS
        full_text = f"{story['title']}\n\n"
        for scene in story.get("structured_scenes", []):
            full_text += f"{scene['title']}\n{scene['content']}\n\n"
        if story.get("moral_lesson"):
            full_text += f"Moral: {story['moral_lesson']}\n"
        
        # Use Hermes send tool with text_to_speech via subprocess call to Python
        try:
            with open(str(audio_file), 'wb') as f:
                # Use the text_to_speech tool via direct subprocess
                result = subprocess.run(
                    ["hermes", "send", "--text", full_text],
                    capture_output=True, text=True, timeout=5
                )
        except:
            pass
        
        # Use text_to_speech tool directly (Hermes built-in)
        cmd = [
            "hermes", "tools", "text_to_speech",
            "--text", full_text,
            "--voice", voice,
            "--speed", str(speed),
            "--output", str(audio_file)
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            if result.returncode == 0:
                print(f"✅ TTS audio generated: {audio_file}")
                return str(audio_file)
            else:
                print(f"❌ TTS failed: {result.stderr}")
                return None
        except Exception as e:
            print(f"❌ TTS error: {e}")
            return None
    
    def generate_story_images(self, story: Dict) -> List[str]:
        """Generate images for each scene using AI image generation"""
        img_dir = self.output_dir / "images"
        img_dir.mkdir(exist_ok=True)
        
        image_files = []
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        
        for scene in story.get("image_prompts", []):
            prompt = scene["image_prompt"]
            scene_title = scene["scene_title"].replace(" ", "_").lower()
            img_file = img_dir / f"{timestamp}_{scene_title}.png"
            
            cmd = [
                "hermes", "image",
                "--prompt", prompt,
                "--output", str(img_file),
                "--style", "watercolor",
                "--ar", "16:9"
            ]
            
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
                if result.returncode == 0:
                    print(f"✅ Image generated: {img_file}")
                    image_files.append(str(img_file))
                else:
                    print(f"❌ Image failed for scene {scene['scene_number']}: {result.stderr[:100]}")
            except Exception as e:
                print(f"❌ Image error for scene {scene['scene_number']}: {e}")
        
        return image_files
    
    def create_youtube_shorts_script(self, story: Dict) -> str:
        """Create a YouTube Shorts format script for social media"""
        shorts_dir = self.output_dir / "youtube_shorts"
        shorts_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        shorts_file = shorts_dir / f"short_{timestamp}.txt"
        
        # Create a 30-60 second script format
        scenes = story.get("structured_scenes", [])[:2]  # Max 2 scenes for shorts
        
        script = f"""YouTube Shorts Script: {story['title']}

[DURATION: ~45 seconds]

[HOOK - 0:00-0:03]
🎵 [Upbeat children's music fades in]
NARRATOR (excited): "What happens when a magic paintbrush comes to life?"

[STORY - 0:03-0:35]
"""

        for i, scene in enumerate(scenes, 1):
            if i > 1:
                script += f"\n[SCENE {i} - Quick transition]\n"
            # Shorten content for TikTok/Shorts format
            content = scene['content'][:200] + "..."
            script += f"NARRATOR: \"{scene['title']} - {content}\"\n"
        
        script += f"""
[CALL TO ACTION - 0:35-0:45]
🎵 [Music builds up]
NARRATOR: "Want to see the FULL story? Follow for more bedtime adventures!"
📺 [End screen with subscribe button and next video preview]
"""
        
        # Also write to a JSON format for automation
        shorts_json = {
            "title": f"{story['title']} - Short Version",
            "duration_seconds": 45,
            "script": script,
            "scenes": [{
                "number": s["number"],
                "title": s["title"],
                "duration": 15,
                "content": s["content"][:200]
            } for s in scenes],
            "call_to_action": "Follow for more bedtime adventures!",
            "hashtags": ["#KidsStories", "#BedtimeStories", "#Shorts", "#ChildrensContent"],
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "source_story": story.get("story_file", "")
        }
        
        with open(shorts_file, 'w') as f:
            f.write(script)
        
        # Save JSON version too
        json_file = shorts_file.with_suffix('.json')
        with open(json_file, 'w') as f:
            json.dump(shorts_json, f, indent=2)
        
        print(f"✅ YouTube Shorts script generated: {shorts_file}")
        print(f"✅ Shorts JSON metadata: {json_file}")
        
        return str(shorts_file)
    
    def generate_full_package(self, topic: str, age_group: str = "4-6", 
                              model: str = "gemma3:1b", voice: str = "nova") -> Dict:
        """Generate complete content package with audio, images, and shorts"""
        print(f"=== Enhanced Content Pipeline ===")
        print(f"Topic: {topic}")
        print(f"Age Group: {age_group}")
        print(f"Model: {model}")
        print()
        
        # Step 1: Generate the story
        story_package = self.generate_story(topic, age_group, model)
        if not story_package:
            return {"success": False, "error": "Story generation failed"}
        
        print("\n[1/3] Generating TTS audio files...")
        audio_file = self.generate_tts_audio(story_package, voice=voice)
        
        print("\n[2/3] Generating scene images...")
        image_files = self.generate_story_images(story_package)
        
        print("\n[3/3] Creating YouTube Shorts script...")
        shorts_file = self.create_youtube_shorts_script(story_package)
        
        return {
            "success": True,
            "story_package": story_package,
            "audio_file": audio_file,
            "image_files": image_files,
            "shorts_script": shorts_file,
            "package_timestamp": datetime.now(timezone.utc).isoformat()
        }

    def get_motion_template(self, scene_title: str) -> Dict:
        """Select appropriate motion template for a scene"""
        presets_path = Path(__file__).parent / "motion_presets.json"
        
        try:
            with open(presets_path, 'r') as f:
                presets = json.load(f)
        except:
            return {
                "name": "gentle_pan_left",
                "motion_prompt": "gentle camera pan, smooth movement, 2D animation style",
                "frame_count": 33
            }
        
        # Try to match scene to presets
        scene_lower = scene_title.lower()
        scene_mappings = presets.get("scene_mappings", {})
        
        for keyword, preset_names in scene_mappings.items():
            if keyword in scene_lower:
                # Get the first matching preset
                preset_name = preset_names[0]
                matching = next((p for p in presets["presets"] if p["name"] == preset_name), None)
                if matching:
                    # Ensure frame_count is set
                    if "frame_count" not in matching:
                        matching["frame_count"] = presets.get("frame_counts", {}).get("medium", 33)
                    return matching
        
        # Return default with frame_count from presets
        default_name = presets.get("default_presets", ["gentle_pan_left"])[0]
        default = next((p for p in presets["presets"] if p["name"] == default_name), presets["presets"][0])
        if "frame_count" not in default:
            default["frame_count"] = presets.get("frame_counts", {}).get("medium", 33)
        return default

    def generate_scene_video(self, story: Dict, scene_number: int = None) -> str:
        """Generate video for a specific scene using ComfyUI"""
        video_dir = self.output_dir / "videos"
        video_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        
        # Get scene data
        scenes = story.get("structured_scenes", [])
        if scene_number is None:
            scene = scenes[0] if scenes else {"title": story.get("title", ""), "content": ""}
        else:
            scene = next((s for s in scenes if s.get("number") == scene_number), scenes[0] if scenes else {})
        
        # Get motion template
        motion = self.get_motion_template(scene.get("title", ""))
        
        # Create combined prompt
        prompt = f"A children's book animation of: {scene.get('title', '')}. {scene.get('content', '')[:200]} Motion style: {motion['motion_prompt']}"
        
        # Create ComfyUI workflow for Wan2.1 text-to-video
        workflow = {
            "0": {
                "class_type": "CheckpointLoader",
                "inputs": {
                    "ckpt_name": "wan2.1_t2v_1.3B_fp16.safetensors",
                    "config_name": ""
                }
            },
            "10": {
                "class_type": "CLIPLoader",
                "inputs": {
                    "clip_name": "umt5_xxl_fp8_e4m3fn_scaled.safetensors",
                    "type": "wan"
                }
            },
            "11": {
                "class_type": "VAELoader",
                "inputs": {
                    "vae_name": "wan_2.1_vae.safetensors"
                }
            },
            "12": {
                "class_type": "T5TokenizerOptions",
                "inputs": {
                    "clip": ["10", 0],
                    "min_padding": 0,
                    "min_length": 0
                }
            },
            "6": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "clip": ["12", 0],
                    "text": prompt
                }
            },
            "7": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "clip": ["12", 0],
                    "text": "low quality, blurry, deformed, scary"
                }
            },
            "8": {
                "class_type": "WanAnimateToVideo",
                "inputs": {
                    "positive": ["6", 0],
                    "negative": ["7", 0],
                    "vae": ["11", 0],
                    "width": 720,
                    "height": 1280,
                    "length": motion.get("frame_count", 33),
                    "batch_size": 1,
                    "continue_motion_max_frames": 1,
                    "video_frame_offset": 0
                }
            },
            "9": {
                "class_type": "VAEDecode",
                "inputs": {
                    "samples": ["8", 2],
                    "vae": ["11", 0]
                }
            },
            "13": {
                "class_type": "SaveWEBM",
                "inputs": {
                    "images": ["9", 0],
                    "filename_prefix": f"scene_{scene_number or 1}_{timestamp}",
                    "format": "webm",
                    "codec": "vp9",
                    "fps": 8,
                    "crf": 20
                }
            }
        }
        
        # Submit to ComfyUI
        import urllib.request
        data = json.dumps({"prompt": workflow}).encode('utf-8')
        req = urllib.request.Request(
            "http://localhost:8188/prompt",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                result = json.loads(resp.read())
                prompt_id = result.get('prompt_id', 'unknown')
                print(f"✅ Video generation started: {prompt_id}")
                
                # Return metadata about the job
                metadata = {
                    "prompt_id": prompt_id,
                    "scene_number": scene_number,
                    "scene_title": scene.get("title", ""),
                    "motion_template": motion["name"],
                    "frame_count": motion.get("frame_count", 33),
                    "output_path": str(video_dir / f"scene_{scene_number or 1}_{timestamp}.webm"),
                    "status": "processing"
                }
                
                # Save metadata
                meta_path = video_dir / f"video_{timestamp}_metadata.json"
                with open(meta_path, 'w') as f:
                    json.dump(metadata, f, indent=2)
                
                return str(meta_path)
                
        except Exception as e:
            print(f"❌ Video generation failed: {e}")
            return None

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate enhanced kids content")
    parser.add_argument("topic", help="Story topic")
    parser.add_argument("--age", default="4-6", help="Age group")
    parser.add_argument("--model", default="gemma3:1b", help="Ollama model")
    parser.add_argument("--voice", default="nova", help="TTS voice")
    
    args = parser.parse_args()
    
    pipeline = EnhancedContentPipeline()
    result = pipeline.generate_full_package(args.topic, args.age, args.model, args.voice)
    
    if result["success"]:
        print("\n=== Enhanced Package Complete ===")
        print(f"Story: {len(result['story_package'].get('story_content',''))} words")
        print(f"Audio: {result.get('audio_file', 'None')}")
        print(f"Images: {len(result.get('image_files', []))} generated")
        print(f"Shorts: {result.get('shorts_script', 'None')}")
    else:
        print(f"Error: {result.get('error')}")