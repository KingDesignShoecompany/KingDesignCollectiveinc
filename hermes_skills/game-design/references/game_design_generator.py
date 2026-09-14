#!/usr/bin/env python3
"""
Aura Champions Game Design Script Generator
Generates C++ code snippets and UE5 blueprints for game mechanics

Uses local Ollama (deepseek-r1:8b) for complex generation
Supports gemma3:1b for fast prototyping
"""

import json
import os
import subprocess
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

class GameDesignGenerator:
    """Generates UE5-compatible game mechanics with C++ code"""
    
    def __init__(self, ollama_url="http://localhost:11435", model="deepseek-r1:8b"):
        self.ollama_url = ollama_url
        self.model = model
        self.output_dir = Path("game_design")
        self.output_dir.mkdir(exist_ok=True)
        (self.output_dir / "cpp_scripts").mkdir(exist_ok=True)
        (self.output_dir / "blueprints").mkdir(exist_ok=True)
        (self.output_dir / "concepts").mkdir(exist_ok=True)
        
    def generate_mechanic_concept(self, focus_area: str, theme: str = "fantasy", 
                                complexity: str = "intermediate") -> Dict:
        """Generate a structured game mechanic concept"""
        
        prompt = f"""
You are a senior game designer for Aura Champions, an AR card battler game built in Unreal Engine 5.
Generate ONLY valid JSON (no markdown, no explanations) for a structured game mechanic concept.

Focus Area: {focus_area}
Theme: {theme}
Complexity: {complexity}

Return ONLY this exact JSON structure (replace placeholder values):
{{
  "concept_name": "Exact Name Here",
  "category": "combat",
  "mechanic_type": "active",
  "description": "Two sentences describing the mechanic.",
  "implementation": {{
    "ue5_blueprint": "Class hierarchy and key event nodes",
    "cpp_snippet": "// C++ code here",
    "ar_integration": "AR overlay and interaction details"
  }},
  "balance": {{
    "resource_cost": "energy",
    "cost_amount": 5,
    "cooldown": 10,
    "scaling": "Scales with player level"
  }},
  "synergy_cards": ["Card One", "Card Two"],
  "trinity_alignment": "offense",
  "rarity_tier": "rare"
}}

Ensure ALL strings use double quotes only. No markdown formatting.
"""

        cmd = [
            "curl", "-s", f"{self.ollama_url}/api/generate",
            "-H", "Content-Type: application/json",
            "-d", json.dumps({
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "num_ctx": 4000
                }
            })
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            response = json.loads(result.stdout)
            output_text = response.get("response", "").strip()
            
            # Clean up any smart quotes that break JSON
            output_text = re.sub(r'[“”]', '"', output_text)
            output_text = re.sub(r'[‘’]', "'", output_text)
            
            # Clean up any markdown formatting - extract first JSON block
            output_text = re.sub(r'```json\s*', '', output_text)
            output_text = re.sub(r'```\s*$', '', output_text)
            # Remove any markdown code blocks entirely
            output_text = re.sub(r'^\s*```[a-z]*\s*', '', output_text)
            output_text = re.sub(r'\s*```\s*$', '', output_text)
            
            # Extract the first complete JSON object using bracket counting
            json_start = output_text.find('{')
            if json_start == -1:
                raise ValueError("No JSON object found in response")
            
            # Count brackets to find the end of the JSON object
            bracket_count = 0
            json_end = json_start
            in_string = False
            escape_next = False
            
            for i in range(json_start, len(output_text)):
                char = output_text[i]
                if escape_next:
                    escape_next = False
                    continue
                if char == '\\':
                    escape_next = True
                    continue
                if char == '"':
                    in_string = not in_string
                    continue
                if in_string:
                    continue
                if char == '{':
                    bracket_count += 1
                elif char == '}':
                    bracket_count -= 1
                    if bracket_count == 0:
                        json_end = i + 1
                        break
            
            json_str = output_text[json_start:json_end]
            concept = json.loads(json_str)
            
            concept["generated_at"] = datetime.utcnow().isoformat()
            concept["model_used"] = self.model
            
            return {
                "success": True,
                "concept": concept
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "raw_output": response.get("response", "") if 'response' in dir() else "No response"
            }
    
    def generate_cpp_implementation(self, concept: Dict) -> str:
        """Generate complete UE5.7 C++ implementation from concept"""
        
        cpp_template = f"""
// {concept["concept_name"]} - UE5.7 Implementation
// Category: {concept["category"]}
// Generated: {datetime.now().isoformat()}

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/ActorComponent.h"
#include "AR/AREnvironmentProbeManager.h"
#include "AuraChampions.h"
#include "{concept['concept_name'].replace(' ', '')}.generated.h"

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class AURA_CHAMPIONS_API U{concept['concept_name'].replace(' ', '').replace('-', '_')} : public UActorComponent
{{
    GENERATED_BODY()

public:
    U{concept['concept_name'].replace(' ', '').replace('-', '_')}();

    virtual void BeginPlay() override;
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, 
                              FActorComponentTickFunction* ThisTickFunction) override;

    // Core mechanic implementation
    UFUNCTION(BlueprintCallable, Category = "Aura|Mechanics")
    bool ActivateMechanic();

    UFUNCTION(BlueprintCallable, Category = "Aura|Mechanic")
    void DeactivateMechanic();

    // AR Integration
    UFUNCTION(BlueprintCallable, Category = "Aura|AR")
    void UpdateARVisualization();

    // Configuration
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Aura|Config")
    float CostAmount = {concept.get('balance', {}).get('cost_amount', 5)};

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Aura|Config")
    float CooldownDuration = {concept.get('balance', {}).get('cooldown', 10)};

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Aura|Config")
    bool bEnableARMode = true;

private:
    FTimerHandle CooldownTimerHandle;
    float CurrentCooldown = 0.0f;
    bool bIsActive = false;

    // Resource management
    void ConsumeResource();
    bool CheckResourceAvailability();
    
    // AR state management
    void SyncARState();
}};

// Implementation file would follow with all method bodies
// See full implementation below for details

/*
IMPLEMENTATION NOTES:
Category: {concept['category']}
Mechanic Type: {concept['mechanic_type']}
Trinity Alignment: {concept.get('trinity_alignment', 'neutral')}
Rarity Tier: {concept.get('rarity_tier', 'common')}

AR Integration Requirements:
{concept['implementation']['ar_integration']}

Synergy Cards:
{chr(10).join('- ' + card for card in concept.get('synergy_cards', []))}
*/
"""
        return cpp_template.strip()
    
    def save_concept_package(self, concept_result: Dict):
        """Save complete concept package including C++ and blueprint files"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        concept_name = concept_result["concept"]["concept_name"].replace(" ", "_").lower()
        base_name = f"{timestamp}_{concept_name}"
        
        # Save concept JSON
        concept_path = self.output_dir / "concepts" / f"{base_name}.json"
        with open(concept_path, 'w') as f:
            json.dump(concept_result, f, indent=2)
        print(f"✅ Concept saved: {concept_path}")
        
        # Generate and save C++ implementation
        cpp_code = self.generate_cpp_implementation(concept_result["concept"])
        cpp_path = self.output_dir / "cpp_scripts" / f"{base_name}.cpp"
        with open(cpp_path, 'w') as f:
            f.write(cpp_code)
        print(f"✅ C++ implementation saved: {cpp_path}")
        
        # Save blueprint description
        bp_path = self.output_dir / "blueprints" / f"{base_name}.md"
        bp_content = f"""# {concept_result['concept']['concept_name']} - Blueprint Design

## UE5 Blueprint Structure

**Parent Class**: UActorComponent  
**Target Platform**: AR Mobile (iOS/Android)  
**Feature Set**: {concept_result['concept']['category']} system  

### Component Nodes

1. **Input Handler**
   - Touch/Gesture recognition
   - AR anchor point detection
   - Resource validation

2. **Logic Core**
   - State machine (Inactive → Active → Cooldown)
   - Resource consumption subsystem
   - Trinity alignment modifier

3. **AR Integration**
   - Particle effect spawning
   - Spatial audio triggers
   - Visual feedback overlays

### Event Graph Flow

1. OnTriggerActivated → CheckResourceAvailability
2. Branch → If Resources Available → ConsumeResource
3. Branch → If Sufficient Resources → ActivateMechanic
4. ActivateMechanic → StartCooldownTimer
5. OnCooldownComplete → DeactivateMechanic

### AR Visualization Requirements

{concept_result['concept']['implementation']['ar_integration']}
"""
        with open(bp_path, 'w') as f:
            f.write(bp_content)
        print(f"✅ Blueprint guide saved: {bp_path}")
        
        return {
            "concept_file": str(concept_path),
            "cpp_file": str(cpp_path),
            "blueprint_file": str(bp_path)
        }
    
    def run_generation(self, focus_area: str, theme: str = "fantasy"):
        """Run complete game design generation pipeline"""
        print(f"\n=== Aura Champions Game Design Generator ===")
        print(f"Focus Area: {focus_area}")
        print(f"Theme: {theme}")
        print(f"Model: {self.model}")
        print()
        
        # Step 1: Generate concept
        print("[1/3] Generating mechanic concept...")
        concept_result = self.generate_mechanic_concept(focus_area, theme)
        
        if not concept_result["success"]:
            print(f"❌ Error: {concept_result['error']}")
            if "raw_output" in concept_result:
                print(f"Debug: {concept_result['raw_output'][:200]}...")
            return None
        
        print(f"✅ Concept generated: {concept_result['concept']['concept_name']}")
        
        # Step 2: Generate C++ implementation
        print("[2/3] Generating C++ implementation...")
        files = self.save_concept_package(concept_result)
        
        # Step 3: Summary
        print("[3/3] Generation summary...")
        print()
        print("=== Generation Complete ===")
        print(f"Concept: {concept_result['concept']['concept_name']}")
        print(f"Category: {concept_result['concept']['category']}")
        print(f"Trinity Alignment: {concept_result['concept'].get('trinity_alignment', 'N/A')}")
        print(f"Rarity: {concept_result['concept'].get('rarity_tier', 'N/A')}")
        print()
        print("Files generated:")
        for key, path in files.items():
            print(f"  - {key}: {path}")
        
        return files

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Aura Champions Game Design Generator")
    parser.add_argument("focus_area", help="Game design focus area")
    parser.add_argument("--theme", "-t", default="fantasy", 
                       help="Theme for the concept")
    parser.add_argument("--model", "-m", default="deepseek-r1:8b",
                       choices=["deepseek-r1:8b", "gemma3:1b"],
                       help="Model to use for generation")
    parser.add_argument("--ollama-url", default="http://localhost:11435",
                       help="Ollama API URL")
    
    args = parser.parse_args()
    
    generator = GameDesignGenerator(args.ollama_url, args.model)
    result = generator.run_generation(args.focus_area, args.theme)
    
    return 0 if result else 1

if __name__ == "__main__":
    exit(main())
