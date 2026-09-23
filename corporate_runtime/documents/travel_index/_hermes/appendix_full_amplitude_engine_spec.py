#!/usr/bin/env python3
"""Appendix: Full Amplitude Engine Specification"""

AMPLITUDE_ENGINE_ARCH = {
    "name": "AmplitudeEngine",
    "inputs": ["identity_state", "resonance_state", "drift_state",
               "seasonal_state", "global_graph_state", "master_tensor"],
    "methods": ["computeAmplitudeVector", "computeAmplitudeDelta",
                "computeAmplitudeTrajectory", "computeAmplitudeForecast"],
    "output": "AmplitudeProfile"
}

AMPLITUDE_VECTOR_20D = [
    "pace", "cultural_curiosity", "adventure_appetite", "comfort_preference",
    "sensory_openness", "social_energy", "exploration_style", "confidence",
    "stability", "rhythm_preference", "environmental_tolerance", "food_openness",
    "cultural_depth_preference", "novelty_appetite", "reflection_tendency",
    "planning_style", "risk_tolerance", "movement_style",
    "emotional_resonance", "seasonal_preference"
]

CORE_FNS = {
    "computeAmplitudeVector": "f(identity_momentum, resonance_field, drift_tensor, seasonal_matrix, global_graph, master_tensor)",
    "computeAmplitudeDelta": "AmplitudeVector(t) - AmplitudeVector(t-1)",
    "computeAmplitudeTrajectory": "integrate(AmplitudeDelta over time)",
    "computeAmplitudeForecast": "model(Trajectory, Drift, Resonance, Seasonal)"
}

AMPLITUDE_PROFILE = ["amplitude_vector", "amplitude_delta", "trajectory",
                     "forecast", "persona_alignment",
                     "cultural_resonance_alignment"]
