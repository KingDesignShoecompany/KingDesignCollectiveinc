#!/usr/bin/env python3
"""Doc 104: Traveler Identity Evolution Kernel"""

EVOLUTION_KERNEL = ["evolution_slope", "evolution_curvature", "identity_acceleration",
                    "identity_drift", "identity_transformation", "kernel_vector",
                    "traveler_id"]

EVOLUTION_ENGINE = {
    "inputs": ["identity_momentum", "continuity_tensor",
               "stability_manifold", "drift_tensor"],
    "methods": ["computeEvolutionSlope", "computeEvolutionCurvature",
                "computeIdentityAcceleration", "computeIdentityDrift",
                "computeIdentityTransformation", "computeKernelVector"],
    "output": "IdentityEvolutionKernel"
}

EVOLUTION_SLOPE = "derivative(identity_momentum.momentum_score)"
EVOLUTION_CURVATURE = "stability_manifold.manifold_curvature"
IDENTITY_ACCELERATION = "identity_momentum.acceleration"
IDENTITY_DRIFT = "drift_tensor.drift_intensity"
IDENTITY_TRANSFORMATION = "continuity_tensor.continuity_score * stability_manifold.stability_score"

KERNEL_VEC = "[evolution_slope, evolution_curvature, identity_acceleration, identity_drift, identity_transformation]"
OUTPUT = ["identity_evolution_kernel: dict", "kernel_vector: list"]
