#!/usr/bin/env python3
"""Doc 98: Traveler Identity Continuity Operator"""

CONTINUITY_OPERATOR = ["continuity_factor", "stability_factor",
                       "coherence_factor", "seasonal_smoothing_factor",
                       "drift_resilience_factor", "operator_matrix",
                       "transformed_identity_vector"]

OPERATOR_ENGINE = {
    "inputs": ["continuity_tensor", "stability_manifold",
               "seasonal_matrix", "drift_model"],
    "methods": ["computeContinuityFactor", "computeStabilityFactor",
                "computeCoherenceFactor", "computeSeasonalSmoothingFactor",
                "computeDriftResilienceFactor", "computeOperatorMatrix",
                "applyOperator"],
    "output": "IdentityContinuityOperator"
}

CONTINUITY_FACTOR = "continuity_tensor.continuity_score"
STABILITY_FACTOR = "stability_manifold.stability_score"
COHERENCE_FACTOR = "stability_manifold.manifold_curvature * -1"
SEASONAL_SMOOTHING = "1 - variance(seasonal_matrix.temperature_band)"
DRIFT_RESILIENCE = "1 - drift_model.drift_rate"

OPERATOR_MATRIX = """
[
  [continuity_factor, stability_factor],
  [coherence_factor, seasonal_smoothing_factor],
  [drift_resilience_factor, 0]
]
"""

TRANSFORMED_VECTOR = "operator_matrix * continuity_tensor.tensor_matrix"
OUTPUT = ["continuity_operator: dict", "transformed_identity_vector: list"]
