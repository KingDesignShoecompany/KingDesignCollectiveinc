#!/usr/bin/env python3
"""
DOC 60 — CULTURAL SIGNATURE COMPRESSION SPEC
Lossless + Loss-Aware Compression of Cultural Signature Vectors

Premium PB-3C Formatting
"""

FULL_SIGNATURE = ["texture_score", "depth_score", "flow_score",
                  "rhythm_score", "gravity_score", "meaning_score",
                  "seasonal_modifier", "amplitude_alignment"]

COMPRESSION_STRATEGIES = {
    "lossless": ["normalization", "quantization", "vector_packing", "delta_encoding"],
    "loss_aware": ["dimensionality_reduction", "weighted_pca",
                   "cultural_meaning_preservation", "emotional_tone_preservation"]
}

PCA_WEIGHTS = {
    "depth": 0.25,
    "gravity": 0.25,
    "meaning": 0.20,
    "rhythm": 0.15,
    "flow": 0.10,
    "texture": 0.05
}

MEANING_PRESERVATION = "meaning_preserved = meaning_score"
EMOTIONAL_TONE_PRESERVATION = "emotional_tone = gravity_score * meaning_score"

COMPRESSED_SIGNATURE = ["core_vector: float[4]",
                        "meaning_preserved: float",
                        "emotional_tone_preserved: float"]

PERFORMANCE_TARGETS = {
    "size_reduction": "60-70%",
    "compression_time": "<1ms",
    "decompression_time": "<1ms",
    "resonance_accuracy_loss": "<5%"
}
