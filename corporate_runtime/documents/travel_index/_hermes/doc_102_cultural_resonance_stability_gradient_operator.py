#!/usr/bin/env python3
"""Doc 102: Cultural Resonance Stability Gradient Operator"""

GRADIENT_OPERATOR = ["gradient_vector", "stability_slope", "drift_gradient_modifier",
                     "seasonal_gradient_modifier", "harmonic_gradient_modifier",
                     "operator_matrix", "transformed_gradient", "region_code"]

OPERATOR_ENGINE = {
    "inputs": ["stability_tensor", "drift_gradient", "seasonal_matrix", "harmonics"],
    "methods": ["computeGradientVector", "computeStabilitySlope", "computeDriftModifier",
                "computeSeasonalModifier", "computeHarmonicModifier",
                "computeOperatorMatrix", "applyOperator"],
    "output": "StabilityGradientOperator"
}

GRADIENT_VEC = "derivative(stability_tensor.tensor_matrix)"
STABILITY_SLOPE = "derivative(stability_tensor.stability_score)"
DRIFT_MOD = "1 - drift_gradient.gradient_magnitude"
SEASONAL_MOD = "1 - variance(seasonal_matrix.temperature_band)"
HARMONIC_MOD = "1 - variance(harmonics.overtone_series)"

OPERATOR_MATRIX = """
[
  [drift_gradient_modifier, seasonal_gradient_modifier],
  [harmonic_gradient_modifier, stability_slope]
]
"""

TRANSFORMED = "operator_matrix * gradient_vector"
OUTPUT = ["stability_gradient_operator: dict", "transformed_gradient: list"]
