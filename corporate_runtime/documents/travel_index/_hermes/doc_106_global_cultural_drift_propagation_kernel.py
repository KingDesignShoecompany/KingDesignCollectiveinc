#!/usr/bin/env python3
"""Doc 106: Global Cultural Drift Propagation Kernel"""

PROPAGATION_KERNEL = ["propagation_rate", "transmission_strength",
                      "influence_spread", "seasonal_propagation_modifier",
                      "exchange_propagation_modifier", "kernel_vector",
                      "region_code"]

PROPAGATION_ENGINE = {
    "inputs": ["drift_flow_network", "drift_tensor", "seasonal_matrix",
               "influence_propagation"],
    "methods": ["computePropagationRate", "computeTransmissionStrength",
                "computeInfluenceSpread", "computeSeasonalModifier",
                "computeExchangeModifier", "computeKernelVector"],
    "output": "DriftPropagationKernel"
}

PROP_RATE = "drift_tensor.force_axis * drift_tensor.pressure_axis"
TRANSMISSION = "drift_flow_network.edges.flow_strength"
INFLUENCE_SPREAD = "average(influence_propagation.final_influence_vector)"
SEASONAL_PROP = "seasonal_matrix.temperature_band * seasonal_matrix.humidity_band"
EXCHANGE_PROP = "influence_spread"

KERNEL_VEC = "[propagation_rate, transmission_strength, influence_spread, seasonal_prop, exchange_prop]"
OUTPUT = ["drift_propagation_kernel: dict", "kernel_vector: list"]
