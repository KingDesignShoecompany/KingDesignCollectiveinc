#!/usr/bin/env python3
"""Doc 105: Cultural Resonance Stability Laplacian"""

LAPLACIAN_MODEL = ["laplacian_value", "curvature_value", "diffusion_rate",
                   "drift_laplacian_modifier", "seasonal_laplacian_modifier",
                   "harmonic_laplacian_modifier", "laplacian_vector", "region_code"]

LAPLACIAN_ENGINE = {
    "inputs": ["stability_tensor", "stability_gradient", "drift_model",
               "seasonal_matrix", "harmonics"],
    "methods": ["computeLaplacianValue", "computeCurvatureValue",
                "computeDiffusionRate", "computeDriftModifier",
                "computeSeasonalModifier", "computeHarmonicModifier",
                "computeLaplacianVector"],
    "output": "StabilityLaplacian"
}

LAPLACIAN_VAL = "second_derivative(stability_tensor.stability_score)"
CURVATURE_VAL = "stability_gradient.stability_slope"
DIFFUSION_RATE = "laplacian_value * (1 - variance(stability_tensor.tensor_matrix))"
DRIFT_MOD = "1 - drift_model.drift_rate"
SEASONAL_MOD = "1 - variance(seasonal_matrix.temperature_band)"
HARMONIC_MOD = "1 - variance(harmonics.overtone_series)"

LAPLACIAN_VEC = "[laplacian_value, curvature_value, diffusion_rate, drift_mod, seasonal_mod, harmonic_mod]"
OUTPUT = ["stability_laplacian: dict", "laplacian_vector: list"]
