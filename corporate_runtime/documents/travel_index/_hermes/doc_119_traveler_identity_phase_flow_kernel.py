#!/usr/bin/env python3
"""Doc 119: Traveler Identity Phase Flow Kernel"""

PHASE_FLOW_KERNEL = ["phase_flow_value", "phase_shift_value",
                     "phase_acceleration_value", "culture_phase_interaction",
                     "seasonal_phase_modifier", "kernel_vector", "traveler_id"]

PHASE_KERNEL_ENGINE = {
    "inputs": ["identity_evolution_kernel", "identity_resonance",
               "drift_resonance", "seasonal_matrix", "harmonics"],
    "methods": ["computePhaseFlow", "computePhaseShift",
                "computePhaseAcceleration", "computeCulturePhaseInteraction",
                "computeSeasonalModifier", "computeKernelVector"],
    "output": "IdentityPhaseFlowKernel"
}

PHASE_FLOW = "derivative(identity_evolution_kernel.evolution_slope)"
PHASE_SHIFT = "identity_resonance.identity_alignment_value * drift_resonance.resonance_amplification"
PHASE_ACCEL = "identity_evolution_kernel.identity_acceleration"
CULT_PHASE = "harmonics.harmonic_amplitude * identity_resonance.harmonic_interaction_value"
SEASONAL_MOD = "1 - variance(seasonal_matrix.temperature_band)"

KERNEL_VEC = "[phase_flow_value, phase_shift_value, phase_acceleration_value, culture_phase_interaction, seasonal_mod]"
OUTPUT = ["identity_phase_flow_kernel: dict", "kernel_vector: list"]
