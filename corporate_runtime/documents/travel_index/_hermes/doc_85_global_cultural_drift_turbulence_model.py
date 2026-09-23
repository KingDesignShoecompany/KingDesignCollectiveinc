#!/usr/bin/env python3
"""Doc 85: Global Cultural Drift Turbulence Model"""

TURBULENCE_MODEL = ["turbulence_index", "seasonal_turbulence",
                    "exchange_turbulence", "symbolic_turbulence",
                    "drift_acceleration", "turbulence_vector", "region_code"]

TURBULENCE_ENGINE = {
    "inputs": ["drift_model", "seasonal_matrix", "influence_propagation",
               "cultural_signature_history"],
    "methods": ["computeTurbulenceIndex", "computeSeasonalTurbulence",
                "computeExchangeTurbulence", "computeSymbolicTurbulence",
                "computeDriftAcceleration", "computeTurbulenceVector"],
    "output": "DriftTurbulence[]"
}

TURBULENCE_INDEX = "variance(drift_model.drift_vector)"
SEASONAL_TURBULENCE = "variance(seasonal_matrix.temperature_band) + variance(seasonal_matrix.humidity_band)"
EXCHANGE_TURBULENCE = "variance(influence_propagation.final_influence_vector)"
SYMBOLIC_TURBULENCE = "variance(cultural_signature_history.texture_score)"
DRIFT_ACCELERATION = "derivative(drift_model.drift_vector)"

TURBULENCE_VECTOR = "[turbulence_index, seasonal_turbulence, exchange_turbulence, symbolic_turbulence]"
OUTPUT = ["turbulence_map: list", "turbulence_vectors: list"]
