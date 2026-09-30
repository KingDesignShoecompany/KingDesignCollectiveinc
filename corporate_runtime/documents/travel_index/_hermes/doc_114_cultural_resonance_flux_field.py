#!/usr/bin/env python3
"""Doc 114: Cultural Resonance Flux Field"""

FLUX_FIELD = ["flux_value", "energy_transfer", "cross_dimensional_exchange",
              "drift_flux_modifier", "seasonal_flux_modifier", "flux_vector",
              "region_code"]

FLUX_ENGINE = {
    "inputs": ["curl_operator", "divergence_operator", "harmonics",
               "drift_model", "seasonal_matrix"],
    "methods": ["computeFluxValue", "computeEnergyTransfer",
                "computeCrossDimensionalExchange", "computeDriftModifier",
                "computeSeasonalModifier", "computeFluxVector"],
    "output": "ResonanceFluxField"
}

FLUX_VALUE = "curl_operator.curl_value - divergence_operator.divergence_value"
ENERGY_TRANSFER = "flux_value * harmonics.harmonic_amplitude"
CROSS_EXCHANGE = "curl_operator.vorticity_value * divergence_operator.instability_outflow"
DRIFT_MOD = "1 - drift_model.drift_rate"
SEASONAL_MOD = "1 - variance(seasonal_matrix.temperature_band)"

FLUX_VEC = "[flux_value, energy_transfer, cross_dimensional_exchange, drift_mod, seasonal_mod]"
OUTPUT = ["resonance_flux_field: dict", "flux_vector: list"]
