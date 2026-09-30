#!/usr/bin/env python3
"""Doc 70: Global Cultural Rhythm Atlas"""

RHYTHM_ATLAS_MODEL = ["region_rhythm_profiles", "seasonal_rhythm_overlays",
                      "global_rhythm_clusters", "motion_profile_map",
                      "amplitude_projection_map"]

RHYTHM_PROFILE = ["region_code", "pace", "social_tempo", "emotional_cadence",
                  "sensory_flow", "seasonal_variation"]

CONSTRUCTION_PIPELINE = [
    "compute rhythm profiles",
    "apply seasonal rhythm modulation",
    "cluster regions by rhythm similarity",
    "generate motion profile map",
    "compute amplitude projection map",
    "render global rhythm atlas"
]

RHYTHM_SIMILARITY = "kmeans(rhythm_profiles, k=12)"
SEASONAL_OVERLAY = "seasonal_matrix[region][season].rhythm_shift"
MOTION_PROFILE = "rhythm.pace * directional_flow.flow_intensity"
AMPLITUDE_PROJECTION = "cosine_similarity(amplitude_vector, rhythm_vector)"

OUTPUT = ["rhythm_atlas: dict", "clusters: list", "projection_map: dict"]
