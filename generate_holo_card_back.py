#!/usr/bin/env python3
"""
Generate holographic card back - ultra-simplified version.
Uses Workbench engine for instant rendering with manual holographic effect via material colors.
"""
import socket
import json
import os
import time

BLENDER_CODE = r'''
import bpy, math, os

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
for m in list(bpy.data.meshes):
    bpy.data.meshes.remove(m)

# === World ===
world = bpy.context.scene.world
if not world:
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
world.use_nodes = True
nodes = world.node_tree.nodes
links = world.node_tree.links
for n in list(nodes):
    nodes.remove(n)
bg = nodes.new(type='ShaderNodeBackground')
bg.inputs[0].default_value = (0.03, 0.02, 0.12, 1.0)
bg.inputs[1].default_value = 2.0
noise = nodes.new(type='ShaderNodeTexNoise')
noise.inputs[1].default_value = 50.0
mix = nodes.new(type='ShaderNodeMixRGB')
mix.blend_type = 'SCREEN'
mix.inputs[0].default_value = 0.6
mix.inputs[1].default_value = (0.03, 0.02, 0.12, 1.0)
mix.inputs[2].default_value = (0.8, 0.9, 1.0, 1.0)
out_w = nodes.new(type='ShaderNodeOutputWorld')
links.new(noise.outputs['Color'], mix.inputs[0])
links.new(noise.outputs['Fac'], mix.inputs[2])
links.new(mix.outputs['Color'], bg.inputs[0])
links.new(bg.outputs['Background'], out_w.inputs['Surface'])

# === Card back geometry ===
bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 0, 0))
card = bpy.context.object
card.name = "CardBack"
card.scale = (1.5, 2.0, 1.0)

# === Simple holographic material using Workbench-compatible material ===
card_mat = bpy.data.materials.new("HoloCardBack")
card_mat.use_nodes = True
nodes = card_mat.node_tree.nodes
links = card_mat.node_tree.links
for n in list(nodes):
    nodes.remove(n)

# For Workbench, we need Principled BSDF or similar
pbr = nodes.new(type='ShaderNodeBsdfPrincipled')
pbr.inputs['Base Color'].default_value = (0.95, 0.77, 0.06, 1.0)
pbr.inputs['Metallic'].default_value = 1.0
pbr.inputs['Roughness'].default_value = 0.05
pbr.inputs['Anisotropic'].default_value = 0.5
pbr.inputs['Clearcoat'].default_value = 0.8
pbr.inputs['Clearcoat Roughness'].default_value = 0.05
out_m = nodes.new(type='ShaderNodeOutputMaterial')
links.new(pbr.outputs['BSDF'], out_m.inputs['Surface'])
card.data.materials.append(card_mat)

# === 8-pointed star (center) ===
bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.03, radius2=1.5, depth=0.15, location=(0, 1.5, 0.01))
star = bpy.context.object
star.rotation_euler = (0, 0, math.radians(22.5))
star.data.materials.append(card_mat)

# Inner star ring
bpy.ops.mesh.primitive_torus_add(major_radius=0.6, minor_radius=0.08, location=(0, 1.5, 0.02))
bpy.context.object.data.materials.append(card_mat)

# Center gem - emissive for glow
bpy.ops.mesh.primitive_ico_sphere_add(radius=0.3, location=(0, 1.5, 0.05))
gem = bpy.context.object
gem_mat = bpy.data.materials.new("Gem")
gem_mat.use_nodes = True
nodes = gem_mat.node_tree.nodes
links = gem_mat.node_tree.links
for n in list(nodes):
    nodes.remove(n)
emit = nodes.new(type='ShaderNodeEmission')
emit.inputs[0].default_value = (1.0, 0.84, 0.1, 1.0)
emit.inputs[1].default_value = 2.5
out_em = nodes.new(type='ShaderNodeOutputMaterial')
links.new(emit.outputs['Emission'], out_em.inputs['Surface'])
gem.data.materials.append(gem_mat)

# Corner stars
for cx, cy in [(1.2, 0.8), (-1.2, 0.8), (1.2, -0.8), (-1.2, -0.8)]:
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.02, radius2=0.35, depth=0.08, location=(cx, cy, 0.01))
    bpy.context.object.rotation_euler = (0, 0, math.radians(22.5))
    bpy.context.object.data.materials.append(card_mat)

# Text
bpy.ops.object.text_add(location=(0, -1.0, 0.02))
text_obj = bpy.context.object
text_obj.data.body = "AURA CHAMPIONS"
text_obj.data.size = 0.4
text_obj.data.align_x = 'CENTER'
bpy.context.view_layer.objects.active = text_obj
bpy.ops.object.convert(target='MESH')
text_obj.data.materials.append(card_mat)

# Lighting
bpy.ops.object.light_add(type='SUN', location=(5, -5, 10))
bpy.context.object.data.energy = 3
bpy.context.object.data.color = (1.0, 0.95, 0.8)
bpy.ops.object.light_add(type='POINT', location=(0, 0, 8))
bpy.context.object.data.energy = 150
bpy.ops.object.light_add(type='POINT', location=(3, 3, 5))
bpy.context.object.data.energy = 100

# Camera
bpy.ops.object.camera_add(location=(0, -6, 2))
bpy.context.scene.camera = bpy.context.object
bpy.context.scene.camera.rotation_euler = (math.radians(85), 0, 0)

# Render with Workbench (instant) first to verify scene works
scene = bpy.context.scene
scene.render.engine = 'BLENDER_WORKBENCH'
scene.display.shading.light = 'MATCAP'
scene.display.shading.studio_light = 'sunrise-sunset'
scene.render.resolution_x = 768
scene.render.resolution_y = 1024
scene.render.filepath = os.path.join(r"C:\Users\young\agents\aura_champions_card_art\art_raw", "card_back_preview.png")
bpy.ops.render.render(write_still=True)
print("PREVIEW_DONE")

# Then do final Cycles GPU render
scene.render.engine = 'CYCLES'
scene.cycles.device = 'GPU'
scene.cycles.samples = 4
scene.render.filepath = os.path.join(r"C:\Users\young\agents\aura_champions_card_art\art_raw", "card_back_holo.png")
bpy.ops.render.render(write_still=True)
print("CARD_BACK_HOLO_DONE")
'''

# Send code with longer timeout to get the full response
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(600)
s.connect(('localhost', 9876))

msg = {"type": "execute_code", "params": {"code": BLENDER_CODE}}
s.sendall((json.dumps(msg) + '\n').encode('utf-8'))
print("Sending holo card back render (Workbench preview + Cycles GPU)...")

response = b''
while True:
    try:
        chunk = s.recv(65536)
        if not chunk:
            break
        response += chunk
    except socket.timeout:
        print("Socket timeout")
        break
s.close()

try:
    result = json.loads(response.decode('utf-8'))
    if result.get('status') == 'success':
        printed = result.get('result', {}).get('result', '')
        print(f"Output: {printed.strip()}")
    else:
        print(f"Error: {result.get('message', 'unknown')[:500]}")
except:
    print(f"Parse error: {response[:300]}")

# Check files
for f in ['card_back_preview.png', 'card_back_holo.png']:
    path = os.path.join(r"C:\Users\young\agents\aura_champions_card_art\art_raw", f)
    if os.path.exists(path):
        print(f"  {f}: {os.path.getsize(path)} bytes")
