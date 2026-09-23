#!/usr/bin/env python3
"""Amplitude Engine v5 — Fractal Edition."""

AMPLITUDE_ENGINE_V5 = {
    "name": "AmplitudeEngineV5",
    "type": "Fractal — self-similar recursive identity amplitude field",
    "definition": "A^n = G(A^(n-1)) where G is fractal generator, n is recursion depth",
    "scales": [
        ("micro", "moment-to-moment identity (n=1)"),
        ("meso", "trip-level identity (n=2)"),
        ("macro", "life-trajectory identity (n=3)")
    ],
    "input": ["identity_state", "resonance_state", "drift_state",
              "seasonal_state", "global_graph_state"],
    "methods": ["generateFractalBase", "generateFractalLayers",
                "computeFractalAmplitude", "computeFractalTrajectory",
                "computeFractalForecast"],
    "output": "FractalAmplitudeProfile"
}

FRACTAL_PROFILE = ["micro_amplitude", "meso_amplitude", "macro_amplitude",
                   "fractal_trajectory", "fractal_forecast"]
