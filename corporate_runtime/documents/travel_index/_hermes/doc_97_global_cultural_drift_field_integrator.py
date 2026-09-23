#!/usr/bin/env python3
"""Doc 97: Global Cultural Drift Field Integrator"""

DRIFT_FIELD_INTEGRATOR = ["drift_flow_integral", "drift_pressure_integral",
                          "drift_curvature_integral", "seasonal_integral",
                          "exchange_integral", "integrated_field_vector",
                          "region_code"]

INTEGRATOR_ENGINE = {
    "inputs": ["drift_flow_network", "drift_gradient_map",
               "seasonal_matrix", "influence_propagation"],
    "methods": ["computeFlowIntegral", "computePressureIntegral",
                "computeCurvatureIntegral", "computeSeasonalIntegral",
                "computeExchangeIntegral", "computeIntegratedFieldVector"],
    "output": "DriftFieldIntegrator"
}

FLOW_INTEGRAL = "integrate(drift_flow_network.drift_flow_vectors)"
PRESSURE_INTEGRAL = "integrate(drift_gradient_map.gradient_magnitude)"
CURVATURE_INTEGRAL = "integrate(drift_gradient_map.gradient_curvature)"
SEASONAL_INTEGRAL = "integrate(seasonal_matrix.temperature_band * seasonal_matrix.humidity_band)"
EXCHANGE_INTEGRAL = "integrate(influence_propagation.final_influence_vector)"

INTEGRATED_FIELD = "[drift_flow, drift_pressure, drift_curvature, seasonal, exchange]"
OUTPUT = ["drift_field_integrator: dict", "integrated_field_vector: list"]
