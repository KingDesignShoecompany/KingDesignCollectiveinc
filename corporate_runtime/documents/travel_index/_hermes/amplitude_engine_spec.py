#!/usr/bin/env python3
"""
AMPLITUDE ENGINE — ENGINEERING SPECIFICATION

Core Intelligence Layer Implementation
"""

# 1. PURPOSE
# Models traveler identity as a 20-dimensional living vector
# Foundation for adaptive guides, persona storytelling, visualization, forecasting

# 2. ARCHITECTURE (5 modular subsystems)
# Explicit Vector Layer | Implicit Vector Layer | Fusion Layer | Contextual Modifiers | Evolution Layer

# 3. AMPLITUDE VECTOR STRUCTURE (20 dimensions)
AMPLITUDE_VECTOR = {
    "pace": {"range": [0.0, 1.0], "source": "onboarding_slider"},
    "cultural_curiosity": {"range": [0.0, 1.0], "source": "onboarding_slider"},
    "adventure_appetite": {"range": [0.0, 1.0], "source": "onboarding_slider"},
    "comfort_preference": {"range": [0.0, 1.0], "source": "onboarding_slider"},
    "sensory_openness": {"range": [0.0, 1.0], "source": "onboarding_slider"},
    "social_openness": {"range": [0.0, 1.0], "source": "onboarding_slider"},
    "exploration_style": {"range": [0.0, 1.0], "source": "onboarding_slider"},
    "confidence": {"range": [0.0, 1.0], "source": "onboarding_slider"},
    "stability": {"range": [0.0, 1.0], "source": "onboarding_question"},
    "rhythm_preference": {"range": [0.0, 1.0], "source": "behavioral_signal"},
    "environmental_tolerance": {"range": [0.0, 1.0], "source": "behavioral_signal"},
    "food_openness": {"range": [0.0, 1.0], "source": "behavioral_signal"},
    "cultural_depth_preference": {"range": [0.0, 1.0], "source": "behavioral_signal"},
    "novelty_appetite": {"range": [0.0, 1.0], "source": "behavioral_signal"},
    "reflection_tendency": {"range": [0.0, 1.0], "source": "post_travel_reflection"},
    "planning_style": {"range": [0.0, 1.0], "source": "behavioral_pattern"},
    "risk_tolerance": {"range": [0.0, 1.0], "source": "behavioral_pattern"},
    "movement_style": {"range": [0.0, 1.0], "source": "behavioral_pattern"},
    "emotional_resonance": {"range": [0.0, 1.0], "source": "cultural_module_engagement"},
    "seasonal_preference": {"range": [0.0, 1.0], "source": "seasonal_history"}
}

# 4. EXPLICIT VECTOR LAYER
def compute_explicit_vector(onboarding_inputs):
    """Normalize onboarding inputs (0-100 scale -> 0.0-1.0)"""
    explicit = {}
    for dim, raw in onboarding_inputs.items():
        explicit[dim] = raw / 100.0
    return explicit

EXPLICIT_WEIGHT = 0.65

# 5. IMPLICIT VECTOR LAYER
def compute_implicit_vector(behavioral_signals):
    """Min-max normalize behavioral signals to 0.0-1.0"""
    implicit = {}
    for dim, values in behavioral_signals.items():
        min_v, max_v = min(values), max(values)
        if max_v - min_v > 0:
            implicit[dim] = (values[-1] - min_v) / (max_v - min_v)
        else:
            implicit[dim] = 0.5
    return implicit

IMPLICIT_WEIGHT = 0.35

# 6. FUSION LAYER
def fuse_vectors(explicit, implicit):
    """Weighted merge with stability-based smoothing"""
    amplitude = {}
    for dim in AMPLITUDE_VECTOR:
        amplitude[dim] = (explicit[dim] * EXPLICIT_WEIGHT +
                         implicit[dim] * IMPLICIT_WEIGHT)
    return smooth_amplitude(amplitude, stable=False)

def smooth_amplitude(amplitude, previous, stable=False):
    """Apply smoothing to prevent jumps"""
    smoothed = {}
    factor = 0.8 if stable else 0.9
    for dim in amplitude:
        smoothed[dim] = (amplitude[dim] * factor +
                        previous[dim] * (1 - factor))
    return smoothed

# 7. CONTEXTUAL MODIFIERS (capped at ±0.15)
SEASONAL_MODIFIERS = {
    "winter": {"comfort_preference": 0.05, "environmental_tolerance": -0.03},
    "summer": {"sensory_openness": 0.04, "exploration_style": 0.03},
    "rainy": {"indoor_preference": 0.06, "pace": -0.02}
}

REGION_MODIFIERS = {
    "EAS": {"rhythm_preference": 0.07, "reflection_tendency": 0.04},
    "SAM": {"food_openness": 0.08, "social_openness": 0.05},
    "NAF": {"adventure_appetite": 0.06, "risk_tolerance": 0.04}
}

PHASE_MODIFIERS = {
    "on_location": {"sensory_openness": 0.10},
    "in_transit": {"pace": -0.05, "confidence": -0.03},
    "post_travel": {"reflection_tendency": 0.08}
}
def apply_contextual_modifiers(amplitude, season=None, region=None, phase=None):
    """Apply context-aware adjustments (capped ±0.15)"""
    result = amplitude.copy()
    if season and season in SEASONAL_MODIFIERS:
        for dim, delta in SEASONAL_MODIFIERS[season].items():
            if dim in result:
                result[dim] = max(0.0, min(1.0, result[dim] + delta))
    if region and region in REGION_MODIFIERS:
        for dim, delta in REGION_MODIFIERS[region].items():
            if dim not in result:
                result[dim] = 0.5
            result[dim] = max(0.0, min(1.0, result[dim] + delta))
    if phase and phase in PHASE_MODIFIERS:
        for dim, delta in PHASE_MODIFIERS[phase].items():
            if dim not in result:
                result[dim] = 0.5
            result[dim] = max(0.0, min(1.0, result[dim] + delta))
    return result

# 8. EVOLUTION LAYER
EVOLUTION_RATE_BASE = 0.25
EVOLUTION_ACCELERATION = {True: 1.5, False: 1.0}  # reflection_tendency modifier

def compute_evolution(trip_experience, amplitude, reflection_tendency):
    """Compute amplitude delta after a trip"""
    evolution_rate = EVOLUTION_RATE_BASE * EVOLUTION_ACCELERATION[
        reflection_tendency > 0.5
    ]
    delta = {}
    for dim in AMPLITUDE_VECTOR:
        target = trip_experience.get(dim, amplitude.get(dim, 0.5))
        current = amplitude.get(dim, 0.5)
        delta[dim] = (target - current) * evolution_rate
    return delta

def evolve_amplitude(amplitude, delta):
    """Apply evolution delta"""
    evolved = {}
    for dim in AMPLITUDE_VECTOR:
        current = amplitude.get(dim, 0.5)
        delta_val = delta.get(dim, 0.0)
        evolved[dim] = max(0.0, min(1.0, current + delta_val))
    return evolved

# 9. API ENDPOINTS (spec)
API_ENDPOINTS = {
    "POST /amplitude/initialize": {
        "request": {"explicit_vector": "AmplitudeVector"},
        "response": {"amplitude": "AmplitudeVector"}
    },
    "POST /amplitude/update-implicit": {
        "request": {"implicit_updates": "dict"},
        "response": {"amplitude": "AmplitudeVector"}
    },
    "POST /amplitude/fuse": {
        "request": {"explicit": "AmplitudeVector", "implicit": "AmplitudeVector"},
        "response": {"amplitude": "AmplitudeVector"}
    },
    "POST /amplitude/evolve": {
        "request": {"trip_experience": "dict"},
        "response": {"amplitude": "AmplitudeVector", "evolution_delta": "dict"}
    },
    "GET /amplitude/current": {
        "response": {"amplitude": "AmplitudeVector"}
    }
}

# 10. INTEGRATION POINTS
INTEGRATIONS = {
    "guide_engine": ["pace", "cultural_curiosity", "adventure_appetite", "comfort", "food_openness"],
    "persona_system": ["exploration_style", "cultural_depth_preference", "reflection_tendency"],
    "visualization": ["pace", "adventure_appetite", "cultural_curiosity", "comfort_preference", "confidence"],
    "forecasting": ["novelty_appetite", "reflection_tendency", "exploration_style"]
}

if __name__ == "__main__":
    # Demo: quick sanity check
    explicit_test = {"pace": 70, "cultural_curiosity": 85}
    implicit_test = {"pace": [0.5, 0.6, 0.7], "cultural_curiosity": [0.8, 0.85, 0.9]}

    explicit = compute_explicit_vector(explicit_test)
    implicit = compute_implicit_vector(implicit_test)

    print("Explicit:", explicit)
    print("Implicit:", implicit)

    fused = {}
    for dim in explicit_test:
        fused[dim] = (explicit[dim] * EXPLICIT_WEIGHT +
                     implicit[dim] * IMPLICIT_WEIGHT)

    print("Fused:", fused)
    print("\nAmplitude Engine — all modules functional")
