#!/usr/bin/env python3
"""Doc 99: Cultural Resonance Stability Kernel"""

STABILITY_KERNEL = ["local_stability", "damping_weight", "drift_weight",
                    "harmonic_weight", "seasonal_weight", "kernel_vector",
                    "region_code"]

KERNEL_ENGINE = {
    "inputs": ["stability_tensor", "harmonics", "drift_model", "seasonal_matrix"],
    "methods": ["computeLocalStability", "computeDampingWeight",
                "computeDriftWeight", "computeHarmonicWeight",
                "computeSeasonalWeight", "computeKernelVector"],
    "output": "StabilityKernel"
}

LOCAL_STABILITY = "stability_tensor.stability_score"
DAMPING_WEIGHT = "1 - variance(harmonics.overtone_series)"
DRIFT_WEIGHT = "1 - drift_model.drift_rate"
HARMONIC_WEIGHT = "harmonics.harmonic_amplitude"
SEASONAL_WEIGHT = "1 - variance(seasonal_matrix.temperature_band)"
KERNEL_VEC = "[local_stability, damping_weight, drift_weight, harmonic_weight, seasonal_weight]"

OUTPUT = ["stability_kernel: dict", "kernel_vector: list"]
