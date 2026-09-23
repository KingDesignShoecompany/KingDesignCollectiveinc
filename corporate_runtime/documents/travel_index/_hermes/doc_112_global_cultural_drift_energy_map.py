#!/usr/bin/env python3
"""Doc 112: Global Cultural Drift Energy Map"""

DRIFT_ENERGY_MODEL = ["kinetic_energy", "potential_energy", "drift_power",
                      "thermodynamic_pressure", "energy_distribution_vector",
                      "region_code"]

ENERGY_ENGINE = {
    "inputs": ["drift_dynamics", "drift_tensor", "seasonal_matrix",
               "influence_propagation"],
    "methods": ["computeKineticEnergy", "computePotentialEnergy",
                "computeDriftPower", "computeThermodynamicPressure",
                "computeEnergyDistributionVector"],
    "output": "DriftEnergyMap"
}

KINETIC_ENERGY = "drift_dynamics.drift_motion**2 * 0.5"
POTENTIAL_ENERGY = "drift_tensor.pressure_axis * drift_tensor.curvature_axis"
DRIFT_POWER = "drift_dynamics.drift_energy * drift_dynamics.drift_acceleration"
THERMO_PRESSURE = "average(influence_propagation.final_influence_vector)"

ENERGY_DIST = "[kinetic_energy, potential_energy, drift_power, thermodynamic_pressure]"
OUTPUT = ["drift_energy_map: dict", "energy_distribution_vector: list"]
