# Player Movement Mechanics Spec

## Overview
This document defines the player movement mechanics for Umbrella Corporation game projects.

## Movement Types
- Walking/Running
- Jumping/Double Jump
- Crouching/Sliding
- Wall Running
- Mantling

## Parameters
- Max walk speed: 600 uu/s
- Max sprint speed: 900 uu/s
- Jump velocity: 420 uu/s
- Gravity: -980 uu/s²

## UE5 Implementation Notes
- Use Character Movement Component
- Implement in C++ for performance
- Expose key parameters to Blueprint
