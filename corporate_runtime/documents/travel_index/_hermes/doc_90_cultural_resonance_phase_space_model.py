#!/usr/bin/env python3
"""Doc 90: Cultural Resonance Phase Space Model"""

PHASE_SPACE_MODEL = ["state_vector", "attractor_points", "repeller_points",
                     "trajectory_curve", "seasonal_phase_modifier",
                     "drift_phase_modifier", "phase_space_dimension", "region_code"]

PHASE_SPACE_ENGINE = {
    "inputs": ["resonance_history", "cultural_signature",
               "seasonal_matrix", "drift_model"],
    "methods": ["computeStateVector", "computeAttractorPoints",
                "computeRepellerPoints", "computeTrajectoryCurve",
                "computeSeasonalModifier", "computeDriftModifier",
                "computePhaseSpaceDimension"],
    "output": "ResonancePhaseSpace"
}

STATE_VEC = "[emotional_tone, gravity_score, meaning_score, resonance_score]"
ATTRACTORS = "local_maxima(resonance_history.resonance_score)"
REPELLERS = "local_minima(resonance_history.resonance_score)"
TRAJECTORY = "derivative(state_vector)"
SEASONAL_MOD = "seasonal_matrix.temperature_band * seasonal_matrix.humidity_band"
DRIFT_MOD = "drift_model.drift_rate * drift_model.emotional_drift"
DIMENSION = "len(state_vector)"

OUTPUT = ["phase_space: dict", "trajectory: list", "attractors: list"]
