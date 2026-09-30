#!/usr/bin/env python3
"""Doc 117: Cultural Resonance Potential Field"""

POTENTIAL_FIELD = ["potential_value", "attractor_potential", "repeller_potential",
                   "harmonic_potential", "drift_potential_modifier",
                   "seasonal_potential_modifier", "potential_vector", "region_code"]

POTENTIAL_FIELD_ENGINE = {
    "inputs": ["flux_field", "harmonics", "drift_potential", "seasonal_matrix",
               "stability_tensor"],
    "methods": ["computePotentialValue", "computeAttractorPotential",
                "computeRepellerPotential", "computeHarmonicPotential",
                "computeDriftModifier", "computeSeasonalModifier",
                "computePotentialVector"],
    "output": "ResonancePotentialField"
}

POT_VALUE = "flux_field.energy_transfer * stability_tensor.stability_score"
ATTRACTOR = "max(flux_field.flux_value, 0)"
REPELLER = "max(-flux_field.flux_value, 0)"
HARMONIC_POT = "harmonics.harmonic_amplitude * (1 - variance(harmonics.overtone_series))"
DRIFT_MOD = "1 - drift_potential.drift_potential_value"
SEASONAL_MOD = "1 - variance(seasonal_matrix.temperature_band)"

POT_VEC = "[potential_value, attractor_potential, repeller_potential, harmonic_potential, drift_mod, seasonal_mod]"
OUTPUT = ["resonance_potential_field: dict", "potential_vector: list"]
