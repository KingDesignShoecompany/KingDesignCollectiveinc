#!/usr/bin/env python3
"""Doc 82: Global Cultural Drift Pressure Map"""

DRIFT_PRESSURE_MODEL = ["region_pressure_values", "seasonal_pressure_overlay",
                        "exchange_pressure_overlay", "drift_acceleration_map",
                        "global_pressure_clusters", "pressure_vector_field"]

PRESSURE_ENGINE = {
    "inputs": ["drift_model", "seasonal_matrix", "influence_propagation",
               "cultural_signatures"],
    "methods": ["computeRegionPressure", "computeSeasonalPressure",
                "computeExchangePressure", "computeDriftAcceleration",
                "computePressureVectorField", "clusterPressureZones"],
    "output": "DriftPressureMap"
}

REGION_PRESSURE = "drift_model.drift_rate * drift_model.emotional_drift"
SEASONAL_PRESSURE = "variance(temp_band) + variance(humidity_band)"
EXCHANGE_PRESSURE = "average(influence_propagation.final_influence_vector)"
DRIFT_ACCELERATION = "derivative(drift_model.drift_vector)"

PRESSURE_VECTOR = "[region_pressure, seasonal_pressure, exchange_pressure, drift_acceleration]"
CLUSTERS = "kmeans(pressure_vector_field, k=12)"
OUTPUT = ["drift_pressure_map: dict", "clusters: list", "pressure_vectors: dict"]
