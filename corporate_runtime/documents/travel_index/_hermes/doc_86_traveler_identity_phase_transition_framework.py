#!/usr/bin/env python3
"""Doc 86: Traveler Identity Phase Transition Framework"""

PHASE_TRANSITION_MODEL = ["transition_threshold", "resonance_trigger",
                          "turbulence_trigger", "emotional_breakpoint",
                          "seasonal_trigger", "next_phase",
                          "transition_probability"]

PHASE_ENGINE = {
    "inputs": ["identity_momentum", "turbulence_map", "emotional_continuity",
               "seasonal_matrix", "persona_history"],
    "methods": ["computeTransitionThreshold", "computeResonanceTrigger",
                "computeTurbulenceTrigger", "computeEmotionalBreakpoint",
                "computeSeasonalTrigger", "computeNextPhase",
                "computeTransitionProbability"],
    "output": "IdentityPhaseTransition"
}

THRESHOLD = "1 - identity_momentum.momentum_score"
RESONANCE_TRIGGER = "identity_momentum.resonance_inertia"
TURBULENCE_TRIGGER = "max(turbulence_map.turbulence_index)"
EMOTIONAL_BREAKPOINT = "1 - emotional_continuity.continuity_score"
SEASONAL_TRIGGER = "variance(seasonal_matrix.temperature_band)"

NEXT_PHASE = "persona_cluster_with_highest_alignment(resonance_trigger, persona_history)"

TRANSITION_PROB = """
(resonance_trigger * 0.35) +
(turbulence_trigger * 0.25) +
(emotional_breakpoint * 0.20) +
(seasonal_trigger * 0.20)
"""

TRANSITION_WEIGHTS = {
    "resonance": 0.35,
    "turbulence": 0.25,
    "emotional": 0.20,
    "seasonal": 0.20
}

OUTPUT = ["phase_transition: dict", "transition_probability: float"]
