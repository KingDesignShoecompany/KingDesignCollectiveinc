#!/usr/bin/env python3
"""Vagary Index Runtime Kernel (CI-Kernel)."""

CI_KERNEL = {
    "name": "CI-Kernel",
    "purpose": "Computational heart of CI-OS — tensor-first execution",
    "execution_units": [
        ("TensorExecutor", "stability/drift/continuity tensors"),
        ("OperatorExecutor", "gradient/divergence/curl/Laplacian operators"),
        ("ManifoldExecutor", "identity/amplitude manifolds"),
        ("HarmonicExecutor", "harmonic signatures/overtones"),
        ("GraphExecutor", "global cultural graph dynamics"),
        ("QuantumExecutor", "quantum harmonic amplitude wavefunctions")
    ],
    "interfaces": ["scheduler_interface", "memory_interface"],
    "state": ["tensor_results", "operator_results", "manifold_results",
              "harmonic_results", "graph_results", "quantum_results"]
}
