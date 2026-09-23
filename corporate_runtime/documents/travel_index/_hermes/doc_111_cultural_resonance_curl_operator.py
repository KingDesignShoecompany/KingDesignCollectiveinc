#!/usr/bin/env python3
"""Doc 111: Cultural Resonance Curl Operator"""

CURL_MODEL = ["curl_value", "vorticity_value", "drift_curl_modifier",
              "seasonal_curl_modifier", "harmonic_curl_modifier", "curl_vector",
              "region_code"]

CURL_ENGINE = {
    "inputs": ["stability_gradient", "stability_tensor",
               "drift_model", "seasonal_matrix", "harmonics"],
    "methods": ["computeCurlValue", "computeVorticityValue",
                "computeDriftModifier", "computeSeasonalModifier",
                "computeHarmonicModifier", "computeCurlVector"],
    "output": "ResonanceCurlOperator"
}

CURL_VALUE = "curl(stability_gradient.gradient_vector)"
VORTICITY = "curl_value * (1 - stability_tensor.stability_score)"
DRIFT_MOD = "1 - drift_model.drift_rate"
SEASONAL_MOD = "1 - variance(seasonal_matrix.temperature_band)"
HARMONIC_MOD = "1 - variance(harmonics.overtone_series)"

CURL_VEC = "[curl_value, vorticity_value, drift_mod, seasonal_mod, harmonic_mod]"
OUTPUT = ["curl_operator: dict", "curl_vector: list"]
