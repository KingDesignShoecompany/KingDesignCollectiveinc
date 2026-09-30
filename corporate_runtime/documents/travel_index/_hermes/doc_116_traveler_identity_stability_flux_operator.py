#!/usr/bin/env python3
"""Doc 116: Traveler Identity Stability Flux Operator"""

STABILITY_FLUX_OP = ["stability_flux_value", "identity_energy_flow",
                     "stability_exchange_value", "drift_flux_modifier",
                     "seasonal_flux_modifier", "flux_vector", "traveler_id"]

FLUX_OP_ENGINE = {
    "inputs": ["stability_manifold", "identity_resonance", "drift_potential",
               "seasonal_matrix", "harmonics"],
    "methods": ["computeStabilityFlux", "computeIdentityEnergyFlow",
                "computeStabilityExchange", "computeDriftModifier",
                "computeSeasonalModifier", "computeFluxVector"],
    "output": "IdentityStabilityFluxOperator"
}

STABILITY_FLUX = "derivative(stability_manifold.stability_score)"
ID_ENERGY_FLOW = "identity_resonance.identity_resonance_value * drift_potential.energy_potential_value"
STAB_EXCHANGE = "stability_manifold.manifold_curvature * identity_resonance.identity_alignment_value"
DRIFT_MOD = "1 - drift_potential.drift_potential_value"
SEASONAL_MOD = "1 - variance(seasonal_matrix.temperature_band)"

FLUX_VEC = "[stability_flux_value, identity_energy_flow, stability_exchange_value, drift_mod, seasonal_mod]"
OUTPUT = ["identity_stability_flux_operator: dict", "flux_vector: list"]
