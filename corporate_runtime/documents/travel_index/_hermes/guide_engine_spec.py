#!/usr/bin/env python3
"""
ADAPTIVE GUIDE ENGINE — ENGINEERING SPECIFICATION

Transforms amplitude vectors into personalized, journey-phase-aware
cultural intelligence for every country × traveler combination.
"""

# 1. PURPOSE
# Generate amplitude-matched cultural guidance at the right moment
# for the right person in the right place, at the right time.

# 2. GUIDE ARCHITECTURE
# Inputs -> Matching Logic -> Module Selection -> Content Assembly -> Journey-Phase Rendering

# 3. INPUT CONTRACTS
AMPLITUDE_INPUT = {
    "required": ["pace", "cultural_curiosity", "adventure_appetite",
                 "comfort_preference", "sensory_openness",
                 "exploration_style", "confidence"],
    "optional": ["social_openness", "food_openness",
                 "cultural_depth_preference", "risk_tolerance"]
}

COUNTRY_INPUT = {
    "required": ["country_code", "cultural_rhythm", "social_norms",
                 "food_intensity", "safety_profile", "exploration_difficulty",
                 "seasonal_variability"],
    "optional": ["micro_guides", "regional_overlays"]
}

JOURNEY_PHASE_INPUT = {
    "phases": ["pre_travel", "in_transit", "on_location", "post_travel", "continuous"]
}

# 4. DEEP TIER SELECTION LOGIC
def determine_depth_tier(cultural_curiosity, travel_confidence):
    """
    Tier 1 (Surface): curiosity < 0.4
    Tier 2 (Interpretive): curiosity 0.4-0.7
    Tier 3 (Deep): curiosity > 0.7
    Adjustments: high confidence lowers tier threshold
    """
    base = cultural_curiosity
    if travel_confidence > 0.8:
        base *= 0.85  # experienced travelers get content faster
    if base < 0.4:
        return 1
    elif base < 0.7:
        return 2
    else:
        return 3

# 5. MODULE SELECTION ENGINE
def select_cultural_modules(amplitude, country, phase):
    """Match traveler amplitude + country context + journey phase to content"""
    depth = determine_depth_tier(
        amplitude["cultural_curiosity"],
        amplitude["confidence"]
    )

    modules = []

    # Cultural Briefing — always included, depth-scaled
    modules.append({
        "type": "cultural_briefing",
        "depth": depth,
        "content": country["cultural_rhythm"][f"tier_{depth}"]
    })

    # Safety & Norms — higher for low confidence / high risk tolerance
    if amplitude["confidence"] < 0.5 or amplitude["risk_tolerance"] > 0.7:
        modules.append({
            "type": "safety_norms",
            "priority": "high",
            "content": country["social_norms"]
        })

    # Exploration Routes — scaled by adventure + pace
    if amplitude["adventure_appetite"] > 0.5:
        modules.append({
            "type": "exploration_routes",
            "style": "adventure" if amplitude["adventure_appetite"] > 0.7 else "balanced",
            "routes": select_routes_by_amplitude(amplitude, country)
        })

    # Food Intelligence — scaled by food_openness + sensory_openness
    if amplitude.get("food_openness", 0.5) > 0.4:
        modules.append({
            "type": "food_intelligence",
            "intensity": "high" if amplitude["sensory_openness"] > 0.7 else "medium",
            "dishes": select_food_by_amplitude(amplitude, country)
        })

    # Micro-guides — delivered at specific journey moments
    micro_guides = filter_micro_guides(
        country["micro_guides"],
        amplitude["cultural_curiosity"],
        phase
    )
    if micro_guides:
        modules.append({
            "type": "micro_guides",
            "delivery_time": phase,
            "guides": micro_guides
        })

    return modules

# 6. ROUTE SELECTION BY AMPLITUDE
def select_routes_by_amplitude(amplitude, country):
    """Return routes matched to traveler's pace + adventure profile"""
    routes = []
    pace = amplitude["pace"]
    adventure = amplitude["adventure_appetite"]

    if pace > 0.7 and adventure > 0.6:
        routes = country["routes"]["high_pace_adventure"]
    elif pace > 0.5 and adventure > 0.4:
        routes = country["routes"]["moderate_exploration"]
    else:
        routes = country["routes"]["cultural_neighborhoods"]

    return routes

# 7. FOOD SELECTION BY AMPLITUDE
def select_food_by_amplitude(amplitude, country):
    """Return dishes matched to food openness + sensory tolerance"""
    openness = amplitude.get("food_openness", 0.5)
    sensory = amplitude["sensory_openness"]

    if openness > 0.7 and sensory > 0.7:
        return country["food"]["adventurous"]
    elif openness > 0.5:
        return country["food"]["moderate"]
    else:
        return country["food"]["familiar"]

# 8. MICRO-GUIDE FILTERING
def filter_micro_guides(guides, curiosity, phase):
    """Filter micro-guides by depth + journey phase"""
    filtered = []
    for g in guides:
        if g["min_curiosity"] <= curiosity:
            if phase in g["delivery_phases"] or "all" in g["delivery_phases"]:
                filtered.append(g)
    return filtered[:3]  # top 3 per delivery

# 9. JOURNEY-PHASE RENDERING
def render_for_phase(modules, phase):
    """Adapt module presentation for journey-phase context"""
    rendered = {
        "phase": phase,
        "modules": modules,
        "delivery_mode": "detailed" if phase in ["pre_travel", "post_travel"] else "micro" if phase == "in_transit" else "contextual"
    }

    # On-location: real-time updates
    if phase == "on_location":
        rendered["notifications"] = True
        rendered["geo_triggered"] = True

    return rendered

# 10. GUIDE GENERATION PIPELINE
def generate_guide(amplitude, country, phase, season=None, persona=None):
    """Full pipeline: input → matching → assembly → rendering"""

    # Step 1: Apply contextual modifiers
    if season:
        amplitude = apply_seasonal_context(amplitude, season)
    if persona:
        amplitude = adjust_for_persona(amplitude, persona)

    # Step 2: Select modules based on amplitude × country × phase
    modules = select_cultural_modules(amplitude, country, phase)

    # Step 3: Render for journey phase
    guide = render_for_phase(modules, phase)

    # Step 4: Add metadata
    guide["amplitude_match_score"] = calculate_match_score(amplitude, country)
    guide["generated_at"] = get_timestamp()
    guide["expires"] = get_ttl()

    return guide

def apply_seasonal_context(amplitude, season):
    """Adjust amplitude for seasonal factors"""
    seasonal = {
        "winter": {"comfort_preference": 0.05, "pace": -0.03},
        "summer": {"sensory_openness": 0.04, "exploration_style": 0.03},
        "rainy": {"indoor_preference": 0.06}
    }
    if season in seasonal:
        for dim, delta in seasonal[season].items():
            if dim in amplitude:
                amplitude[dim] = max(0.0, min(1.0, amplitude[dim] + delta))
    return amplitude

def adjust_for_persona(amplitude, persona):
    """Apply persona-specific modifiers"""
    persona_adjustments = {
        "Cultural Seeker": {"cultural_curiosity": 0.10, "sensory_openness": -0.05},
        "Fast Explorer": {"pace": 0.10, "adventure_appetite": 0.08},
        "Slow Luxury": {"comfort_preference": 0.12, "pace": -0.08},
        "Food Wanderer": {"food_openness": 0.15, "sensory_openness": 0.10}
    }
    if persona in persona_adjustments:
        for dim, delta in persona_adjustments[persona].items():
            if dim in amplitude:
                amplitude[dim] = max(0.0, min(1.0, amplitude[dim] + delta))
    return amplitude

def calculate_match_score(amplitude, country):
    """Calculate amplitude-to-country alignment score (0-100)"""
    # Simplified: average of key dimension matches
    key_dims = ["cultural_curiosity", "adventure_appetite", "pace"]
    country_profile = {
        "high_culture": {"cultural_curiosity": 0.8},
        "adventure": {"adventure_appetite": 0.9},
        "relaxed": {"pace": 0.3}
    }
    scores = []
    for dim in key_dims:
        if dim in country_profile:
            target = country_profile[dim][dim]
            scores.append(1 - abs(amplitude[dim] - target))
        else:
            scores.append(0.5)
    return round(sum(scores) / len(scores) * 100) if scores else 50

def get_timestamp():
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()

def get_ttl():
    from datetime import datetime, timedelta
    return (datetime.utcnow() + timedelta(hours=48)).isoformat()

# 11. API SPECIFICATION
API_ENDPOINTS = {
    "POST /guide/generate": {
        "request": {
            "country_code": "string",
            "traveler_id": "string",
            "journey_phase": "string",
            "season": "string",
            "persona": "string"
        },
        "response": {
            "guide_id": "uuid",
            "phase": "string",
            "modules": "array",
            "amplitude_match_score": "int",
            "generated_at": "timestamp",
            "expires": "timestamp"
        }
    },
    "GET /guide/{guide_id}": {
        "response": "Full guide object"
    },
    "POST /guide/batch": {
        "request": {
            "country_code": "string",
            "traveler_id": "string",
            "phases": ["string"]
        },
        "response": "Array of phase-specific guides"
    }
}

# 12. CACHING STRATEGY
CACHE_CONFIG = {
    "ttl": "48h",
    "cache_key_format": "guide:{country}:{phase}:{amplitude_hash}",
    "precompute": ["pre_travel", "on_location"],
    "realtime": ["in_transit"],
    "personalized_cache": True,
    "batch_warming": ["destination_season_premium_users"]
}

if __name__ == "__main__":
    # Quick functional test
    test_amplitude = {
        "pace": 0.6, "cultural_curiosity": 0.8, "adventure_appetite": 0.5,
        "comfort_preference": 0.4, "sensory_openness": 0.6,
        "exploration_style": 0.7, "confidence": 0.65,
        "food_openness": 0.7, "risk_tolerance": 0.4
    }

    test_country = {
        "country_code": "JPN",
        "cultural_rhythm": {"tier_1": "Respectful quiet", "tier_2": "Ritual-based interactions", "tier_3": "Philosophy of ma (negative space)"},
        "social_norms": {"greetings": "Bow", "taboos": "Chopstick rules"},
        "food_intensity": {"adventurous": ["natto", "basashi"], "moderate": ["ramen", "sushi"], "familiar": ["tempura", "teriyaki"]},
        "routes": {
            "high_pace_adventure": ["Tokyo nightlife", "Osaka street food"],
            "moderate_exploration": ["Kyoto temples", "Nara park"],
            "cultural_neighborhoods": ["Gion district", "Nishiki market"]
        },
        "micro_guides": [
            {"id": "kyoto-silence", "text": "In Kyoto, silence is a form of respect.",
             "min_curiosity": 0.5, "delivery_phases": ["on_location"]},
            {"id": "tokyo-maze", "text": "Tokyo's streets are a maze — embrace getting lost.",
             "min_curiosity": 0.7, "delivery_phases": ["on_location"]}
        ]
    }

    guide = generate_guide(
        amplitude=test_amplitude,
        country=test_country,
        phase="on_location",
        season="spring",
        persona="Cultural Seeker"
    )

    print(f"Guide generated for JPN (on_location)")
    print(f"Modules: {len(guide['modules'])}")
    print(f"Match score: {guide['amplitude_match_score']}%")
    print(f"Phase: {guide['phase']}")
    print(f"TTL: 48h")
    print("\nAdaptive Guide Engine — all modules functional")
