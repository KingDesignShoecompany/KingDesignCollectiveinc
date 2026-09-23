#!/usr/bin/env python3
"""Doc 108: Cultural Resonance Divergence Operator"""

DIVERGENCE_MODEL = ["divergence_value", "instability_outflow",
                    "drift_divergence_modifier", "seasonal_divergence_modifier",
                    "harmonic_divergence_modifier", "operator_vector", "region_code"]

DIVERGENCE_ENGINE = {
    "inputs": ["stability_gradient", "stability_tensor",
               "drift_model", "seasonal_matrix", "harmonics"],
    "methods": ["computeDivergenceValue", "computeInstabilityOutflow",
                "computeDriftModifier", "computeSeasonalModifier",
                "computeHarmonicModifier", "computeOperatorVector"],
    "output": "ResonanceDivergenceOperator"
}

DIVERGENCE_VALUE = "divergence(stability_gradient.gradient_vector)"
INSTABILITY_OUTFLOW = "divergence_value * (1 - stability_tensor.stability_score)"
DRIFT_MOD = "1 - drift_model.drift_rate"
SEASONAL_MOD = "1 - variance(seasonal_matrix.temperature_band)"
HARMONIC_MOD = "1 - variance(harmonics.overtone_series)"

OPERATOR_VEC = "[divergence_value, instability_outflow, drift_mod, seasonal_mod, harmonic_mod]"
OUTPUT = ["divergence_operator: dict", "operator_vector: list"]
