#!/usr/bin/env python3
"""Doc 64: Global Cultural Influence Propagation Spec"""

INFLUENCE_PROPAGATION_MODEL = ["region_code", "incoming_influence",
                               "outgoing_influence", "propagation_rate",
                               "seasonal_factor", "gravity_factor",
                               "emotional_factor", "final_influence_vector"]

PROPAGATION_ENGINE = {
    "inputs": ["global_graph", "seasonal_matrix", "cultural_signatures", "drift_model"],
    "methods": ["computeEdgeWeights", "computeSeasonalFactors",
                "computeGravityFactors", "computeEmotionalFactors",
                "propagateInfluence"],
    "output": "InfluencePropagation[]"
}

EDGE_WEIGHT = "cultural_similarity(from, to) * edge.relationship_strength"
SEASONAL_FACTOR = "seasonal_matrix[region][season].cultural_shift"
GRAVITY_FACTOR = "cultural_signatures[region].gravity_score"
EMOTIONAL_FACTOR = "meaning_score * texture_score"

PROPAGATION_FORMULA = """
incoming_influence * seasonal_factor +
outgoing_influence * gravity_factor +
emotional_factor
"""

OUTPUT = ["influence_propagation: list", "global_diffusion_map: dict"]
