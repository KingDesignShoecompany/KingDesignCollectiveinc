#!/usr/bin/env python3
"""Doc 115: Global Cultural Drift Potential Engine"""

DRIFT_POTENTIAL = ["drift_potential_value", "gradient_potential_value",
                   "energy_potential_value", "equilibrium_potential_value",
                   "seasonal_potential_modifier", "potential_vector", "region_code"]

POTENTIAL_ENGINE = {
    "inputs": ["drift_energy_map", "drift_gradient", "drift_tensor",
               "seasonal_matrix", "influence_propagation"],
    "methods": ["computeDriftPotential", "computeGradientPotential",
                "computeEnergyPotential", "computeEquilibriumPotential",
                "computeSeasonalModifier", "computePotentialVector"],
    "output": "DriftPotential"
}

DRIFT_POT_VAL = "drift_energy_map.potential_energy"
GRAD_POT_VAL = "drift_gradient.gradient_slope * drift_gradient.gradient_curvature"
ENERGY_POT = "drift_energy_map.kinetic_energy + drift_energy_map.drift_power"
EQ_POT = "drift_tensor.force_axis * (1 - drift_tensor.curvature_axis)"
SEASONAL_MOD = "1 - variance(seasonal_matrix.temperature_band)"

POT_VEC = "[drift_potential_value, gradient_potential_value, energy_potential_value, equilibrium_potential_value, seasonal_mod]"
OUTPUT = ["drift_potential: dict", "potential_vector: list"]
