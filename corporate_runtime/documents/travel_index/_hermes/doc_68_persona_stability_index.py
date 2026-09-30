#!/usr/bin/env python3
"""Doc 68: Persona Stability Index"""

PERSONA_STABILITY_MODEL = ["amplitude_stability", "persona_coherence",
                           "emotional_consistency", "resonance_stability",
                           "seasonal_resilience", "final_index"]

STABILITY_ENGINE = {
    "inputs": ["amplitude_history", "persona_history", "resonance_history", "seasonal_matrix"],
    "methods": ["computeAmplitudeStability", "computePersonaCoherence",
                "computeEmotionalConsistency", "computeResonanceStability",
                "computeSeasonalResilience", "computeFinalIndex"],
    "output": "PersonaStabilityIndex"
}

AMPLITUDE_STABILITY = "1 - variance(amplitude_history)"
PERSONA_COHERENCE = "similarity(persona_history[-1], persona_history[-2])"
EMOTIONAL_CONSISTENCY = "moving_average(resonance_history.emotional_alignment)"
RESONANCE_STABILITY = "1 - variance(resonance_history.resonance_score)"
SEASONAL_RESILIENCE = "1 - variance(seasonal_matrix.temperature_band)"

FINAL_INDEX = """
(amplitude_stability * 0.30) +
(persona_coherence * 0.25) +
(emotional_consistency * 0.20) +
(resonance_stability * 0.15) +
(seasonal_resilience * 0.10)
"""

STABILITY_WEIGHTS = {
    "amplitude_stability": 0.30,
    "persona_coherence": 0.25,
    "emotional_consistency": 0.20,
    "resonance_stability": 0.15,
    "seasonal_resilience": 0.10
}

OUTPUT = ["persona_stability_index: dict"]
