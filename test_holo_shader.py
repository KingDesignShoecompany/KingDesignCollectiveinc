#!/usr/bin/env python3
"""Test holographic shader on card back render."""
import socket
import json
import os

BLENDER_CODE = r'''
import bpy, math, os

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
for m in list(bpy.data.meshes):
    bpy.data.meshes.remove(m)

# Card back - 8-pointed star with corner stars (matching reference)
bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.05, radius2=1.8, depth=0.2, location=(0, 0, 0))
star = bpy.context.object
star.rotation_euler = (0, 0, math.radians(22.5))

# Corner stars
for cx, cy in [(5, 5), (-5, 5), (5, -5), (-5, -5)]:
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.08, radius2=0.25, depth=0.1, location=(cx, cy, 0.05))
    corner = bpy.context.object
    corner.rotation_euler = (0, 0, math.radians(22.5))

# Ground plane
bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, -0.1))
ground = bpy.context.object

# === Holographic material ===
def make_holo_mat():
    mat = bpy.data.materials.new("HoloFoil")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    for n in list(nodes):
        nodes.remove(n)
    
    # Layer Weight - angle-based iridescence
    layer_weight = nodes.new(type='ShaderNodeLayerWeight')
    layer_weight.inputs[0].default_value = 0.05  # Blend
    layer_weight.inputs[1].default_value = 0.5   # Fresnel
    
    # Noise texture for mesh-like pattern
    noise = nodes.new(type='ShaderNodeTexNoise')
    noise.inputs[1].default_value = 25.0  # Scale
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
    
    # Mix noise with layer weight for iridescent effect
    mix = nodes.new(type='ShaderNodeMixRGB')
    mix.blend_type = 'MULTIPLY'
    mix.inputs[0].default_value = 0.5
    
    # Hue/Saturation
    hue_sat = nodes.new(type='ShaderNodeHueSaturation')
    hue_sat.inputs[0].default_value = 0.0   # Hue
    hue_sat.inputs[1].default_value = 2.0   # Saturation
    hue_sat.inputs[2].default_value = 1.0   # Value
    
    # Main holo Principled BSDF
    pbr_holo = nodes.new(type='ShaderNodeBsdfPrincipled')
    pbr_holo.inputs['Metallic'].default_value = 1.0
    pbr_holo.inputs['Roughness'].default_value = 0.05
    pbr_holo.inputs['Anisotropic'].default_value = 0.5
    pbr_holo.inputs['Clearcoat'].default_value = 0.5
    pbr_holo.inputs['Clearcoat Roughness'].default_value = 0.1
    pbr_holo.inputs['IOR'].default_value = 1.5
    
    # Base gold material
    pbr_base = nodes.new(type='ShaderNodeBsdfPrincipled')
    pbr_base.inputs['Base Color'].default_value = (0.95, 0.77, 0.06, 1.0)
    pbr_base.inputs['Metallic'].default_value = 1.0
    pbr_base.inputs['Roughness'].default_value = 0.1
    
    # Mix two shaders based on layer weight
    mix_shader = nodes.new(type='ShaderNodeMixShader')
    
    out = nodes.new(type='ShaderNodeOutputMaterial')
    
    # Links
    links.new(layer_weight.outputs[0], mix.inputs[1])
    links.new(noise.outputs['Fac'], mix.inputs[2])
    links.new(mix.outputs['Color'], color_ramp.inputs[0])
    links.new(color_ramp.outputs['Color'], hue_sat.inputs[4])
    links.new(hue_sat.outputs['Color'], pbr_holo.inputs['Base Color'])
    links.new(layer_weight.outputs[0], mix_shader.inputs[0])
    links.new(pbr_holo.outputs['BSDF'], mix_shader.inputs[1])
    links.new(pbr_base.outputs['BSDF'], mix_shader.inputs[2])
    links.new(mix_shader.outputs['Shader'], out.inputs['Surface'])
    
    return mat
    
    # Ground material (black)
    ground_mat = bpy.data.materials.new("Ground")
    ground_mat.use_nodes = True
    nodes_g = ground_mat.node_tree.nodes
    for n in list(nodes_g):
        nodes_g.remove(n)
    pbr_g = nodes_g.new(type='ShaderNodeBsdfPrincipled')
    pbr_g.inputs['Base Color'].default_value = (0.02, 0.01, 0.05, 1.0)
    pbr_g.inputs['Roughness'].default_value = 0.9
    out_g = nodes_g.new(type='ShaderNodeOutputMaterial')
    links_g = ground_mat.node_tree.links
    links_g.new(pbr_g.outputs['BSDF'], out_g.inputs['Surface'])
    ground.data.materials.append(ground_mat)

holo_mat = make_holo_mat()
for obj in [star, ground]:
    for c in bpy.data.objects:
        if c.name in [o.name for o in bpy.data.objects if "orner" in o.name]:
            pass
    obj.data.materials.append(holo_mat)

# Apply to star and corners
for obj in list(bpy.data.objects):
    if obj.type == 'MESH':
        if obj.name not in ['Ground']:
            obj.data.materials.append(holo_mat)

# World
world = bpy.context.scene.world
if not world:
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs[0].default_value = (0.02, 0.01, 0.05, 1.0)
    bg.inputs[1].default_value = 1.0

# Camera
bpy.ops.object.camera_add(location=(0, -15, 4))
bpy.context.scene.camera = bpy.context.object
bpy.context.scene.camera.rotation_euler = (math.radians(85), 0, 0)

# Lighting
bpy.ops.object.light_add(type='SUN', location=(8, -5, 12))
bpy.context.object.data.energy = 5
bpy.ops.object.light_add(type='POINT', location=(0, 0, 8))
bpy.context.object.data.energy = 200

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
'''

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(5)
s.connect(('localhost', 9876))
msg = {"type": "execute_code", "params": {"code": BLENDER_CODE}}
s.sendall((json.dumps(msg) + '\n').encode('utf-8'))
s.close()
print("Sent holo test render to Blender (running in background)")
