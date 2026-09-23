#!/usr/bin/env python3
"""Doc 87: Cultural Resonance Harmonics Model"""

HARMONICS_MODEL = ["fundamental_frequency", "overtone_series",
                   "harmonic_amplitude", "cultural_timbre",
                   "seasonal_harmonic_modifier", "drift_harmonic_modifier",
                   "harmonic_signature", "region_code"]

HARMONICS_ENGINE = {
    "inputs": ["resonance_history", "cultural_signature",
               "seasonal_matrix", "drift_model"],
    "methods": ["computeFundamentalFrequency", "computeOvertoneSeries",
                "computeHarmonicAmplitude", "computeCulturalTimbre",
                "computeSeasonalModifier", "computeDriftModifier",
                "computeHarmonicSignature"],
    "output": "ResonanceHarmonics"
}

FUNDAMENTAL_FREQ = "moving_average(resonance_history.resonance_score)"
OVERTONE_SERIES = "fourier_transform(resonance_history.resonance_score)"
HARMONIC_AMPLITUDE = "cultural_signature.gravity_score * cultural_signature.meaning_score"
CULTURAL_TIMBRE = "variance(cultural_signature.texture_score)"
SEASONAL_MOD = "seasonal_matrix.temperature_band * 0.5 + seasonal_matrix.humidity_band * 0.5"
DRIFT_MOD = "1 - drift_model.drift_rate"
HARMONIC_SIG = "overtone_series * harmonic_amplitude * drift_harmonic_modifier"

OUTPUT = ["harmonics: dict", "harmonic_signature: list"]
