# Holographic Card Finish Enhancement Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add proper holographic foil iridescence effect to the 3D card renders, matching the reference image (mesh-like texture, rainbow color shifts, metallic sheen).

**Architecture:** Modify the Blender material node trees in the existing render pipeline to use iridescent/holographic shaders instead of solid emission colors. Re-render 3 key sample cards first, then batch-render all 24 if results meet requirements.

**Tech Stack:** Blender 3.3.0 + BlenderMCP socket + Cycles GPU rendering

---

## Current State

- 24 3D renders exist (20 Legendary + 3 Trinity + 1 card back) at `art_raw/`
- Current materials: `ShaderNodeEmission` with flat colors per element
- MCP server running on port 9876
- Reference image: `C:\Users\young\Downloads\Meshy_AI_impressed_name_card.png`

## Proposed Approach

Replace emission materials with a holographic shader node setup:
1. **Layer Weight node** to control angle-based iridescence
2. **Noise texture** modulated by layer weight for mesh-like pattern
3. **ColorRamp** cycling through rainbow hues
4. **Anisotropic BSDF** mixed with **Principled BSDF** for metallic highlight

## Task List

### Task 1: Test holographic shader on card back render

**Objective:** Verify the holographic material node setup produces acceptable iridescence on a test scene.

**Files:**
- Create: `C:\Users\young\agents\test_holo_shader.py`

**Step 1: Write Blender script with holographic material**

```python
import bpy, math, os

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

# Central star (8-pointed)
bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.05, radius2=1.8, depth=0.2, location=(0, 0, 0))
star = bpy.context.object
star.rotation_euler = (0, 0, math.radians(22.5))

# Holographic material
mat = bpy.data.materials.new("HoloFoil")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
for n in list(nodes):
    nodes.remove(n)

# Layer Weight for angle-based iridescence
layer_weight = nodes.new(type='ShaderNodeLayerWeight')
layer_weight.inputs[0].default_value = 0.2  # Blend factor

# Noise texture for mesh-like pattern
noise = nodes.new(type='ShaderNodeTexNoise')
noise.inputs[1].default_value = 15.0  # Scale
noise.inputs[2].default_value = 2.0   # Detail
noise.inputs[3].default_value = 2.0   # Roughness

# ColorRamp for rainbow hue cycling
color_ramp = nodes.new(type='ShaderNodeValToRGB')
color_ramp.color_ramp.elements[0].position = 0.0
color_ramp.color_ramp.elements[0].color = (0.85, 0.1, 0.1, 1.0)  # Red
color_ramp.color_ramp.elements[0.25].position = 0.25
color_ramp.color_ramp.elements[0.25].color = (0.9, 0.9, 0.1, 1.0)  # Yellow
color_ramp.color_ramp.elements[0.5].position = 0.5
color_ramp.color_ramp.elements[0.5].color = (0.1, 0.85, 0.3, 1.0)  # Green
color_ramp.color_ramp.elements[0.7].position = 0.7
color_ramp.color_ramp.elements[0.7].color = (0.1, 0.4, 0.95, 1.0)  # Blue
color_ramp.color_ramp.elements[0.85].position = 0.85
color_ramp.color_ramp.elements[0.85].color = (0.6, 0.1, 0.9, 1.0)  # Purple
color_ramp.color_ramp.elements[1.0].position = 1.0
color_ramp.color_ramp.elements[1.0].color = (0.85, 0.1, 0.1, 1.0)  # Back to Red

# Hue/Saturation for fine-tuning
hue_sat = nodes.new(type='ShaderNodeHueSaturation')
hue_sat.inputs[0].default_value = 0.0   # Hue
hue_sat.inputs[1].default_value = 1.5   # Saturation
hue_sat.inputs[2].default_value = 1.0   # Value

# Mix Layer Weight with Noise
mix = nodes.new(type='ShaderNodeMixRGB')
mix.blend_type = 'MULTIPLY'
mix.inputs[0].default_value = 0.7

# Two Principled BSDFs - one for holo color, one for metallic base
pbr_holo = nodes.new(type='ShaderNodeBsdfPrincipled')
pbr_holo.inputs['Metallic'].default_value = 1.0
pbr_holo.inputs['Roughness'].default_value = 0.05
pbr_holo.inputs['Anisotropic'].default_value = 0.5
pbr_holo.inputs['Clearcoat'].default_value = 0.5
pbr_holo.inputs['Clearcoat Roughness'].default_value = 0.1

pbr_base = nodes.new(type='ShaderNodeBsdfPrincipled')
pbr_base.inputs['Base Color'].default_value = (0.95, 0.77, 0.06, 1.0)  # Gold base
pbr_base.inputs['Metallic'].default_value = 1.0
pbr_base.inputs['Roughness'].default_value = 0.1

# Mix two shaders based on layer weight
mix_shader = nodes.new(type='ShaderNodeMixShader')

# Output
out = nodes.new(type='ShaderNodeOutputMaterial')

# Node links
links.new(layer_weight.outputs[0], mix.inputs[1])  # Fac
links.new(noise.outputs['Color'], mix.inputs[2])  # Secondary color

links.new(mix.outputs['Color'], hue_sat.inputs[4])  # Color input

links.new(hue_sat.outputs['Color'], pbr_holo.inputs['Base Color'])

links.new(layer_weight.outputs[0], mix_shader.inputs[0])  # Fac
links.new(pbr_holo.outputs['BSDF'], mix_shader.inputs[1])  # Holo
links.new(pbr_base.outputs['BSDF'], mix_shader.inputs[2])  # Base
links.new(mix_shader.outputs['Shader'], out.inputs['Surface'])

star.data.materials.append(mat)

# Camera
bpy.ops.object.camera_add(location=(0, -15, 4))
bpy.context.scene.camera = bpy.context.object
bpy.context.scene.camera.rotation_euler = (math.radians(85), 0, 0)

# World - dark background
world = bpy.context.scene.world
if not world:
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs[0].default_value = (0.02, 0.01, 0.05, 1.0)
    bg.inputs[1].default_value = 0.3

# Lighting
bpy.ops.object.light_add(type='POINT', location=(5, 5, 8))
bpy.context.object.data.energy = 200
bpy.context.object.data.color = (1.0, 0.84, 0.0)
bpy.ops.object.light_add(type='POINT', location=(-3, -3, 5))
bpy.context.object.data.energy = 100
bpy.context.object.data.color = (0.5, 0.2, 0.9)

# Render
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'GPU'
scene.cycles.samples = 8
scene.render.resolution_x = 768
scene.render.resolution_y = 1024
scene.render.filepath = os.path.join(r"C:\Users\young\agents\aura_champions_card_art\art_raw", "holo_test.png")
bpy.ops.render.render(write_still=True)
print("HOLO_TEST_DONE")
```

**Step 2: Send to Blender via MCP**

```bash
python test_holo_shader.py
```

**Step 3: Verify output**

```bash
ls -la /c/Users/young/agents/aura_champions_card_art/art_raw/holo_test.png
```
Expected: File exists, >100KB, valid PNG

### Task 2: Render sample Legendary card with holo shader

**Objective:** Apply holo shader to card 4 (Solar element) and compare with original.

**Files:**
- Create: `C:\Users\young\agents\test_legendary_holo.py`

**Step 1: Write script** - Same shader as Task 1, but with Solar's sunburst geometry

**Step 2:** Run via MCP socket

**Step 3:** Verify `legendary_3d_holo_card_4.png` exists and is valid

### Task 3: Render sample Trinity card with holo shader

**Objective:** Apply holo shader to card 50 (Trinity convergence) and verify visual quality.

**Files:**
- Create: `C:\Users\young\agents\test_trinity_holo.py`

**Steps:** Same as Task 2

### Task 4: Batch re-render all 20 Legendary cards with holo shader

**Objective:** Re-render all 20 Legendary cards with the holographic material.

**Files:**
- Modify: `C:\Users\young\agents\generate_all_legendary_3d.py`

**Step 1: Add holo shader function to existing script**

```python
def make_holo_material(element_color):
    mat = bpy.data.materials.new(f"Holo_{element_color}")
    mat.use_nodes = True
    # ... (same node setup as Task 1)
    return mat
```

**Step 2: Replace `make_mat` calls with `make_holo_material`**

**Step 3: Delete existing renders (keep originals as backup)**

```bash
mv art_raw/legendary_3d_card_4.png art_raw/legendary_3d_card_4_original.png
# ... for all 20 cards
```

**Step 4: Run batch render script in background**

```bash
python generate_all_legendary_3d.py
```

### Task 5: Re-render Trinity + Card Back with holo shader

**Objective:** Same shader applied to Trinity + card back renders.

**Files:**
- Modify: `trinity_render_final2.py` pattern

### Task 6: Composite holo 3D renders with card frames

**Objective:** Update card frames to use holographic 3D renders.

**Files:**
- Modify: `C:\Users\young\agents\composite_card_frames.py`

**Step 1: Update art lookup to check for `legendary_3d_holo_card_*.png` first**

```python
def find_holo_art(card_id):
    holo_path = f"art_raw/legendary_3d_holo_card_{card_id}.png"
    if os.path.exists(holo_path):
        return holo_path
    return None
```

**Step 2: Composite frames with holo art

### Task 7: Update SQL migration with holo art URLs

**Objective:** Add `art_url_holo` column references in the SQL migration.

**Files:**
- Modify: `011_card_art_urls.sql`

**Step 1: Append holo art URL CASE statements for 24 cards**

## Risks & Tradeoffs

1. **Render time**: 8 samples doubles render time (~6 min/card vs 3 min)
   - Mitigation: Monitor first 3 renders, reduce to 4 if acceptable
   
2. **Node compatibility**: Blender 3.3 may not support all node types
   - Mitigation: Stick to Principled BSDF, Layer Weight, Noise, ColorRamp
   
3. **ShaderNodeHueSaturation**: May not exist - use ShaderNodeHueSaturation or skip
   - Fallback: Direct ColorRamp adjustment

## Open Questions

1. Should I keep original non-holo renders as backup? → Yes, rename with `_original.png`

2. Should card back also get holo treatment? → Yes per reference image

3. Should ALL 24 cards be re-rendered, or only the special ones (Trinity + Legendary)?
   → All 24 - they all benefit from the foil effect

## Verification Summary

- [ ] holo_test.png exists and shows rainbow iridescence
- [ ] legendary_3d_holo_card_4.png renders successfully
- [ ] trinity_card_50_holo.png renders successfully
- [ ] All 20 legendary + 3 Trinity + 1 card back re-rendered with holo shader
- [ ] 150 card frames updated with holo art
- [ ] SQL migration updated with holo art URLs
