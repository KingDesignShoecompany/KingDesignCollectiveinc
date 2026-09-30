#!/usr/bin/env python3
"""Traveler Identity Genome (TIG)."""

IDENTITY_GENOME = {
    "name": "IdentityGenome",
    "components": [
        "genes: IdentityGene[]",
        "clusters: GeneCluster[]",
        "mutations: IdentityMutations[]",
        "evolution_path: GeneEvolutionPath[]",
        "genome_signature: float[]"
    ],
    "gene_clusters": [
        ("Emotional Genes", "Consistency, openness, resonance"),
        ("Cognitive Genes", "Planning, reflection, novelty appetite"),
        ("Behavioral Genes", "Pace, movement style, exploration style"),
        ("Cultural Genes", "Depth preference, food openness, rhythm preference"),
        ("Stability Genes", "Risk tolerance, stability, confidence")
    ],
    "mutations": [
        "resonance mutations", "drift mutations", "seasonal mutations",
        "amplitude mutations", "persona mutations"
    ],
    "output": "IdentityGenomeProfile"
}

GENOME_PROFILE = ["genome", "clusters", "mutations", "evolution_path",
                  "genome_signature"]
