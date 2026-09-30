#!/usr/bin/env python3
"""Doc 84: Cultural Resonance Equilibrium Engine"""

EQUILIBRIUM_MODEL = ["equilibrium_point", "stability_basin_depth",
                     "destabilization_force", "seasonal_equilibrium_modifier",
                     "drift_equilibrium_modifier", "equilibrium_score", "region_code"]

EQUILIBRIUM_ENGINE = {
    "inputs": ["stability_field", "drift_model", "seasonal_matrix", "resonance_history"],
    "methods": ["computeEquilibriumPoint", "computeStabilityBasinDepth",
                "computeDestabilizationForce", "computeSeasonalModifier",
                "computeDriftModifier", "computeEquilibriumScore"],
    "output": "ResonanceEquilibrium[]"
}

EQUILIBRIUM_POINT = "moving_average(resonance_history.resonance_score)"
BASIN_DEPTH = "stability_field.stability_value - stability_field.volatility_value"
DELIBERATION_FORCE = "stability_field.repeller_strength * drift_model.drift_rate"
SEASONAL_MOD = "1 - variance(seasonal_matrix.temperature_band)"
DRIFT_MOD = "1 - drift_model.drift_rate"

EQUILIBRIUM_SCORE = """
(stability_basin_depth * 0.40) +
(seasonal_equilibrium_modifier * 0.25) +
(drift_equilibrium_modifier * 0.20) +
((1 - destabilization_force) * 0.15)
"""

EQUILIBRIUM_WEIGHTS = {
    "basin_depth": 0.40,
    "seasonal_mod": 0.25,
    "drift_mod": 0.20,
    "destabilization_neg": 0.15
}

OUTPUT = ["equilibrium_map: list", "equilibrium_scores: list"]
