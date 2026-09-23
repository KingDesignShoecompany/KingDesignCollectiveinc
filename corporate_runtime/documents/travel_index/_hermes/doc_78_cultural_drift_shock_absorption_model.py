#!/usr/bin/env python3
"""Doc 78: Cultural Drift Shock Absorption Model"""

SHOCK_ABSORPTION_MODEL = ["drift_shock_index", "seasonal_shock_index",
                          "influence_shock_index", "symbolic_shock_index",
                          "absorption_factor", "stabilized_signature",
                          "region_code"]

SHOCK_ABSORPTION_ENGINE = {
    "inputs": ["drift_model", "seasonal_matrix", "influence_propagation",
               "cultural_signature_history"],
    "methods": ["computeDriftShockIndex", "computeSeasonalShockIndex",
                "computeInfluenceShockIndex", "computeSymbolicShockIndex",
                "computeAbsorptionFactor", "applyAbsorption"],
    "output": "DriftShockAbsorption"
}

DRIFT_SHOCK_INDEX = "derivative(drift_model.drift_vector)"
SEASONAL_SHOCK_INDEX = "abs(delta(temp_band)) + abs(delta(humidity_band))"
INFLUENCE_SHOCK_INDEX = "variance(influence_propagation.final_influence_vector)"
SYMBOLIC_SHOCK_INDEX = "variance(cultural_signature_history.texture_score)"

ABSORPTION_FACTOR = "1 - normalize(sum_of_all_shock_indices)"
STABILIZED_SIGNATURE = "last_signature * factor + previous * (1 - factor)"

OUTPUT = ["shock_absorption: dict", "stabilized_signature: dict"]
