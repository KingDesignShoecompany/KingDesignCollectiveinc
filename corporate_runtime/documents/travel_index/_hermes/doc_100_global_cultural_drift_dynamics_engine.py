#!/usr/bin/env python3
"""Doc 100: Global Cultural Drift Dynamics Engine"""

DRIFT_DYNAMICS = ["drift_force", "drift_motion", "drift_energy",
                  "drift_acceleration", "drift_evolution",
                  "dynamics_vector", "region_code"]

DYNAMICS_ENGINE = {
    "inputs": ["drift_model", "drift_waveform", "drift_gradient",
               "influence_propagation"],
    "methods": ["computeDriftForce", "computeDriftMotion", "computeDriftEnergy",
                "computeDriftAcceleration", "computeDriftEvolution",
                "computeDynamicsVector"],
    "output": "DriftDynamics[]"
}

DRIFT_FORCE = "drift_model.drift_rate * drift_waveform.drift_amplitude"
DRIFT_MOTION = "drift_waveform.drift_frequency * drift_gradient.gradient_direction"
DRIFT_ENERGY = "drift_force * drift_motion"
DRIFT_ACCELERATION = "derivative(drift_model.drift_rate)"
DRIFT_EVOLUTION = "drift_energy * (1 - influence_propagation.final_influence_vector)"
DYNAMICS_VEC = "[drift_force, drift_motion, drift_energy, drift_acceleration, drift_evolution]"

OUTPUT = ["drift_dynamics: list", "dynamics_vector: list"]
