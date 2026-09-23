#!/usr/bin/env python3
"""Doc 91: Global Cultural Drift Gradient Map"""

GRADIENT_MODEL = ["gradient_direction", "gradient_magnitude", "gradient_slope",
                  "gradient_curvature", "gradient_acceleration",
                  "gradient_vector", "region_code"]

GRADIENT_ENGINE = {
    "inputs": ["drift_model", "seasonal_matrix",
               "influence_propagation", "cultural_signature_history"],
    "methods": ["computeGradientDirection", "computeGradientMagnitude",
                "computeGradientSlope", "computeGradientCurvature",
                "computeGradientAcceleration", "computeGradientVector"],
    "output": "DriftGradient[]"
}

DIRECTION = "derivative(drift_model.drift_vector)"
MAGNITUDE = "abs(drift_model.drift_rate)"
SLOPE = "derivative(drift_model.drift_rate)"
CURVATURE = "second_derivative(drift_model.drift_vector)"
ACCELERATION = "derivative(gradient_slope)"
GRADIENT_VEC = "[gradient_direction, gradient_magnitude, gradient_slope, gradient_curvature]"

OUTPUT = ["drift_gradient_map: dict", "gradient_vectors: list"]
