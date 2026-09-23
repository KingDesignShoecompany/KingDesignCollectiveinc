#!/usr/bin/env python3
# 18. AMPLITUDE INTELLIGENCE SPEC — Math + Matching Algorithms
# Full mathematical and algorithmic definition of amplitude, matching, and guide generation.

AMPLITUDE_INTELLIGENCE_SPEC = {
    "doc": "18. AMPLITUDE INTELLIGENCE SPEC",
    "purpose": "Mathematical backbone for the Vagary Index Travel Intelligence Engine",

    "A": {
        "title": "AMPLITUDE VECTOR STRUCTURE",
        "description": "Continuous, real-valued vectors for infinite traveler profiles",
        "traveler_vector": [
            {"name": "risk_tolerance", "range": [0, 1]},
            {"name": "cultural_curiosity", "range": [0, 1]},
            {"name": "pace", "range": [0, 1]},
            {"name": "social_openness", "range": [0, 1]},
            {"name": "luxury_preference", "range": [0, 1]},
            {"name": "adventure_preference", "range": [0, 1]},
            {"name": "learning_preference", "range": [0, 1]},
            {"name": "food_exploration", "range": [0, 1]},
            {"name": "nature_preference", "range": [0, 1]},
            {"name": "urban_preference", "range": [0, 1]},
            {"name": "environmental_sensitivity", "range": [0, 1]},
            {"name": "budget_amplitude", "range": [0, 1]},
            {"name": "comfort_amplitude", "range": [0, 1]},
            {"name": "planning_style", "range": [0, 1]},
            {"name": "spontaneity", "range": [0, 1]},
            {"name": "tech_adoption", "range": [0, 1]},
            {"name": "cultural_depth_preference", "range": [0, 1]},
            {"name": "exploration_radius", "range": [0, 1]},
            {"name": "sensory_sensitivity", "range": [0, 1]},
            {"name": "travel_confidence", "range": [0, 1]}
        ],
        "country_vector": [
            {"name": "cultural_depth", "range": [0, 1]},
            {"name": "exploration_difficulty", "range": [0, 1]},
            {"name": "safety_profile", "range": [0, 1]},
            {"name": "social_norm_intensity", "range": [0, 1]},
            {"name": "environmental_conditions", "range": [0, 1]},
            {"name": "sensory_intensity", "range": [0, 1]},
            {"name": "pace", "range": [0, 1]},
            {"name": "food_adventurousness", "range": [0, 1]},
            {"name": "urban_density", "range": [0, 1]},
            {"name": "nature_density", "range": [0, 1]},
            {"name": "seasonal_variability", "range": [0, 1]},
            {"name": "cultural_formality", "range": [0, 1]},
            {"name": "travel_complexity", "range": [0, 1]}
        ]
    },

    "B": {
        "title": "AMPLITUDE FUSION ALGORITHM",
        "formula": "T(x) = α · E + (1 - α) · I",
        "description": "Weighted merge of explicit and implicit amplitude vectors",
        "variables": {
            "T(x)": "final traveler amplitude vector",
            "α": "explicit weight (0.7 early, decays to 0.3 over time)",
            "E": "explicit amplitude vector from onboarding",
            "I": "implicit amplitude vector from behavior"
        },
        "alpha_decay": "α = 0.7 · e^(-0.1·t) + 0.3",
        "implicit_update": "I_i += β · (behavior_signal_i - I_i)"
    },

    "C": {
        "title": "GUIDE GENERATION ALGORITHM",
        "formula": "GuideOutput = f(T(x), C(y), J(z))",
        "description": "Match traveler amplitude with country + journey-phase amplitude",
        "steps": [
            "Calculate amplitude match score: cosine similarity between T(x) and C(y)",
            "Weight by journey phase relevance: J(z) modulates content emphasis",
            "Score each content module: relevance = match_score × phase_weight",
            "Rank modules by score and select top N based on phase needs",
            "Apply contextual modifiers (season, region, persona) to final ranking"
        ]
    },

    "D": {
        "title": "COSINE SIMILARITY MATCHING",
        "formula": "match_score = (T · C) / (||T|| × ||C||)",
        "description": "Continuous similarity score from -1 to 1, mapped to 0-100% UI",
        "threshold": ">0.65 triggers high-match content variants"
    },

    "E": {
        "title": "PERSONA CLUSTERING",
        "description": "Emergent personas via k-means on amplitude vectors",
        "k": "dynamic (detected via elbow method)",
        "example_personas": [
            "Cultural Seeker",
            "Urban Explorer",
            "Slow Luxury Traveler",
            "Fast Adventure Nomad",
            "Food-Driven Wanderer",
            "Nature-Bound Minimalist",
            "Social Connector",
            "Reflective Traveler"
        ]
    },

    "F": {
        "title": "AMPLITUDE EVOLUTION",
        "description": "Post-trip persona + amplitude update",
        "formula": "T_new(x) = T_old(x) + γ · Δbehavior",
        "learning_rate": "γ = 0.15 (15% of observed behavior shifts the vector)",
        "reset_condition": "If |Δbehavior| > 0.5 for 3+ consecutive trips → significant persona shift"
    }
}

def amplitude_match_score(traveler_vector, country_vector):
    """Calculate cosine similarity between traveler and country amplitude vectors."""
    import math
    dot_product = sum(a * b for a, b in zip(traveler_vector, country_vector))
    norm_t = math.sqrt(sum(a * a for a in traveler_vector))
    norm_c = math.sqrt(sum(b * b for b in country_vector))
    if norm_t == 0 or norm_c == 0:
        return 0.0
    return dot_product / (norm_t * norm_c)

def fuse_amplitude(explicit, implicit, alpha=0.7):
    """Weighted merge of explicit and implicit amplitude vectors."""
    return [alpha * e + (1 - alpha) * i for e, i in zip(explicit, implicit)]

if __name__ == "__main__":
    import json
    print(json.dumps(AMPLITUDE_INTELLIGENCE_SPEC, indent=2))
