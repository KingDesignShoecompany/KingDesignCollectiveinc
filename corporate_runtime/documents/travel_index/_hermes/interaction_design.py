#!/usr/bin/env python3
# 15. INTERACTION DESIGN SYSTEM
# Micro-interactions, motion rules, amplitude-adaptive behaviors,
# and the emotional choreography of Vagary Index.

INTERACTION_DESIGN_SYSTEM = {
    "doc": "15. INTERACTION DESIGN SYSTEM",
    "motion_philosophy": "Premium Calm, Intelligent Motion — smooth, purposeful, directional, culturally warm, subtle",
    "core_motion_rules": {
        "duration": {
            "primary": "180-240ms",
            "secondary": "120-160ms",
            "cultural_fades": "300-400ms",
            "globe_rotations": "physics-based, easing out"
        },
        "easing": {
            "premium": "cubic-bezier(0.25, 0.1, 0.25, 1)",
            "exploration": "ease-out",
            "cultural": "ease-in"
        },
        "directionality": {
            "global_nav": "East → West",
            "region_transitions": "region-based directional slides",
            "cultural_modules": "fade upward (storytelling)",
            "intelligence_modules": "slide horizontally (data)"
        }
    },
    "micro_interactions": {
        "amplitude_bars": [
            "pulse gently when updated",
            "glow gold for luxury amplitude",
            "glow cyan for adventure amplitude",
            "expand when confidence increases"
        ],
        "cultural_cards": [
            "fade in with warm tones",
            "glyph animates subtly",
            "depth meter grows based on amplitude"
        ],
        "exploration_routes": [
            "route lines animate forward",
            "difficulty pulses",
            "pace indicator slides faster or slower"
        ],
        "neighborhood_cards": [
            "radius expands based on amplitude",
            "cultural highlights shimmer",
            "safety notes pulse red or gold"
        ],
        "food_intelligence": [
            "sensory meter vibrates subtly",
            "food clusters animate outward",
            "recommended dishes glow based on openness"
        ],
        "persona_evolution": [
            "persona glyph pulses",
            "timeline nodes expand",
            "amplitude bars animate upward"
        ]
    },
    "amplitude_adaptive_interactions": {
        "high_pace": [
            "faster transitions",
            "snappier interactions",
            "more direct routes"
        ],
        "low_pace": [
            "slower transitions",
            "softer motion",
            "more narrative emphasis"
        ],
        "high_cultural_curiosity": [
            "deeper cultural fades",
            "more storytelling modules",
            "richer glyph animations"
        ],
        "high_adventure": [
            "cyan pulses",
            "dynamic route animations",
            "more exploration cards"
        ],
        "high_luxury": [
            "gold accents",
            "smooth, premium transitions",
            "curated modules emphasized"
        ]
    },
    "journey_phase_interactions": {
        "pre_travel": [
            "calm, premium motion",
            "soft fades",
            "predictive intelligence pulses"
        ],
        "in_transit": [
            "lightweight animations",
            "fast transitions",
            "countdown pulses"
        ],
        "on_location": [
            "map interactions",
            "route animations",
            "cultural glyph micro-gestures"
        ],
        "post_travel": [
            "reflective fades",
            "slow transitions",
            "persona evolution pulses"
        ]
    },
    "cultural_motion_identity": {
        "east_asia": "precise, minimal, elegant",
        "south_america": "warm, rhythmic, energetic",
        "europe": "structured, refined, balanced",
        "africa": "bold, grounded, organic",
        "middle_east": "flowing, ornate, smooth",
        "oceania": "airy, fluid, natural"
    },
    "css_motion_primitives": {
        "premium_transition": "transition: all 0.24s cubic-bezier(0.25, 0.1, 0.25, 1)",
        "cultural_fade": "transition: opacity 0.35s ease-in, transform 0.35s ease-in",
        "amplitude_pulse": "animation: pulse-gold 0.6s ease-in-out infinite",
        "route_animate": "stroke-dasharray: 100; animation: draw 1.5s ease-in-out forwards",
        "glyph_float": "transform: translateY(-2px); transition: transform 0.3s ease"
    }
}

if __name__ == "__main__":
    import json
    print(json.dumps(INTERACTION_DESIGN_SYSTEM, indent=2))
