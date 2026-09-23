#!/usr/bin/env python3
"""Doc 109: Global Cultural Drift Stability Kernel"""

DRIFT_STABILITY_KERNEL = ["drift_stability", "drift_resistance",
                          "drift_equilibrium", "seasonal_stability_modifier",
                          "exchange_stability_modifier", "kernel_vector",
                          "region_code"]

STABILITY_ENGINE = {
    "inputs": ["drift_tensor", "drift_dynamics", "seasonal_matrix",
               "influence_propagation"],
    "methods": ["computeDriftStability", "computeDriftResistance",
                "computeDriftEquilibrium", "computeSeasonalModifier",
                "computeExchangeModifier", "computeKernelVector"],
    "output": "DriftStabilityKernel"
}

DRIFT_STABILITY = "1 - drift_tensor.pressure_axis"
DRIFT_RESISTANCE = "1 - drift_dynamics.drift_acceleration"
DRIFT_EQUILIBRIUM = "drift_tensor.force_axis * (1 - drift_tensor.curvature_axis)"
SEASONAL_STAB = "1 - variance(seasonal_matrix.temperature_band)"
EXCHANGE_STAB = "average(influence_propagation.final_influence_vector)"

KERNEL_VEC = "[drift_stability, drift_resistance, drift_equilibrium, seasonal_stab, exchange_stab]"
OUTPUT = ["drift_stability_kernel: dict", "kernel_vector: list"]
