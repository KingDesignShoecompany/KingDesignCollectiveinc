#!/usr/bin/env python3
"""Cultural Intelligence End-State Model (CI-ESM)."""

END_STATE_MODEL = {
    "name": "EndStateModel",
    "purpose": "Final cultural state after all dynamics cease",
    "definition": "E_end = E(t) where dE/dt = 0 — culture becomes static",
    "components": ["terminal_resonance", "terminal_drift",
                   "terminal_depth", "terminal_rhythm", "terminal_signature"],
    "outputs": ["resonance", "drift", "depth", "rhythm", "signature"]
}
