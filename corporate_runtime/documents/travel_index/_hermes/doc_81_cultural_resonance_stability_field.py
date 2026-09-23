#!/usr/bin/env python3
"""Doc 81: Cultural Resonance Stability Field"""

STABILITY_FIELD_MODEL = ["region_code", "stability_value", "volatility_value",
                         "attractor_strength", "repeller_strength",
                         "seasonal_stability_modifier", "drift_stability_modifier",
                         "field_vector"]

STABILITY_ENGINE = {
    "inputs": ["resonance_history", "stability_matrix", "drift_model", "seasonal_matrix"],
    "methods": ["computeStabilityValue", "computeVolatilityValue",
                "computeAttractorStrength", "computeRepellerStrength",
                "computeSeasonalModifier", "computeDriftModifier", "computeFieldVector"],
    "output": "ResonanceStabilityField[]"
}

STABILITY = "moving_average(resonance_history.resonance_score) * stability_matrix.total_stability"
VOLATILITY = "variance(resonance_history.resonance_score)"
ATTRACTOR = "stability_value * (1 - volatility_value)"
REPELLER = "volatility_value * (1 - stability_value)"
SEASONAL_MOD = "1 - variance(seasonal_matrix.temperature_band)"
DRIFT_MOD = "1 - drift_model.drift_rate"

FIELD_VECTOR = "[stability_value, volatility_value, attractor_strength, repeller_strength]"
OUTPUT = ["stability_field: list", "global_stability_map: dict"]
