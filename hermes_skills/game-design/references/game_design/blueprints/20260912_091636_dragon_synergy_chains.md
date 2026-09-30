# Dragon Synergy Chains - Blueprint Design

## UE5 Blueprint Structure

**Parent Class**: UActorComponent  
**Target Platform**: AR Mobile (iOS/Android)  
**Feature Set**: combat system  

### Component Nodes

1. **Input Handler**
   - Touch/Gesture recognition
   - AR anchor point detection
   - Resource validation

2. **Logic Core**
   - State machine (Inactive → Active → Cooldown)
   - Resource consumption subsystem
   - Trinity alignment modifier

3. **AR Integration**
   - Particle effect spawning
   - Spatial audio triggers
   - Visual feedback overlays

### Event Graph Flow

1. OnTriggerActivated → CheckResourceAvailability
2. Branch → If Resources Available → ConsumeResource
3. Branch → If Sufficient Resources → ActivateMechanic
4. ActivateMechanic → StartCooldownTimer
5. OnCooldownComplete → DeactivateMechanic

### AR Visualization Requirements

AR overlay dynamically displays adjacent cards, triggering synergies based on distance and color matching.  Uses a 'resonance' system with visual feedback.
