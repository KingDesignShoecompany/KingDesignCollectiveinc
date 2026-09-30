#!/usr/bin/env python3
"""Doc 103: Global Cultural Drift Tensor Engine"""

DRIFT_TENSOR = ["force_axis", "curvature_axis", "pressure_axis",
                "acceleration_axis", "interaction_axis", "tensor_matrix",
                "drift_intensity", "region_code"]

TENSOR_ENGINE = {
    "inputs": ["drift_dynamics", "drift_gradient", "drift_waveform",
               "influence_propagation"],
    "methods": ["computeForceAxis", "computeCurvatureAxis", "computePressureAxis",
                "computeAccelerationAxis", "computeInteractionAxis",
                "computeTensorMatrix", "computeDriftIntensity"],
    "output": "DriftTensor"
}

FORCE_AXIS = "drift_dynamics.drift_force"
CURVATURE_AXIS = "drift_gradient.gradient_curvature"
PRESSURE_AXIS = "drift_gradient.gradient_magnitude"
ACCELERATION_AXIS = "drift_dynamics.drift_acceleration"
INTERACTION_AXIS = "average(influence_propagation.final_influence_vector)"

TENSOR_MATRIX = """
[
  [force_axis, curvature_axis],
  [pressure_axis, acceleration_axis],
  [interaction_axis, 0]
]
"""

INTENSITY = "force_axis + curvature_axis + pressure_axis + acceleration_axis"
OUTPUT = ["drift_tensor: dict", "drift_intensity: float"]
