#!/usr/bin/env python3
"""Technical Bible: Cultural Intelligence World Graph"""

WORLD_GRAPH = {
    "name": "CulturalIntelligenceWorldGraph",
    "layers": ["ResonanceLayer", "DriftLayer", "SeasonalLayer",
               "IdentityLayer", "HarmonicLayer", "AmplitudeLayer"],
    "components": ["nodes", "edges", "embeddings", "dynamics", "forecasting"],
    "output": "WorldGraphState"
}

NODE = {
    "fields": ["region_code", "signature_vector", "resonance_vector",
               "drift_vector", "seasonal_vector",
               "identity_alignment_vector", "amplitude_vector"]
}

EDGE = {
    "fields": ["from", "to", "influence_weight", "drift_flow_weight",
               "resonance_flow_weight", "seasonal_flow_weight"]
}

GRAPH_DYNAMICS = ["resonance_flow", "drift_flow", "seasonal_flow",
                  "identity_flow", "amplitude_flow"]

FORECASTING = ["cultural_evolution", "drift_evolution",
               "resonance_evolution", "identity_evolution",
               "amplitude_evolution"]

GLOSSARY = {
    "WorldGraph": "Unified graph of global cultural dynamics",
    "CulturalNode": "Region-level cultural signature + identity + amplitude",
    "CulturalEdge": "Directed influence/drift/resonance flow",
    "GraphDynamics": "Multi-layer cultural flow computation",
    "GraphForecasting": "Temporal prediction of global cultural states"
}
