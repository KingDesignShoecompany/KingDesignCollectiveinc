#!/usr/bin/env python3
"""Test simple 1-sample card back render."""
import socket
import json
import os
import time

code = r'''
import bpy, math, os
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
for m in list(bpy.data.meshes):
    bpy.data.meshes.remove(m)

bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.05, radius2=1.8, depth=0.2, location=(0, 1.0, 0.01))
obj = bpy.context.object
obj.rotation_euler = (0, 0, math.radians(22.5))

mat = bpy.data.materials.new("Gold")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
for n in list(nodes):
    nodes.remove(n)
pbr = nodes.new(type='ShaderNodeBsdfPrincipled')
pbr.inputs['Base Color'].default_value = (0.95, 0.77, 0.06, 1.0)
pbr.inputs['Metallic'].default_value = 1.0
pbr.inputs['Roughness'].default_value = 0.1
out = nodes.new(type='ShaderNodeOutputMaterial')
links.new(pbr.outputs['BSDF'], out.inputs['Surface'])
obj.data.materials.append(mat)

bpy.ops.object.camera_add(location=(0, -6, 2))
bpy.context.scene.camera = bpy.context.object
bpy.context.scene.camera.rotation_euler = (math.radians(85), 0, 0)

world = bpy.context.scene.world
if not world:
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs[0].default_value = (0.03, 0.02, 0.12, 1.0)

bpy.ops.object.light_add(type='SUN', location=(5, -5, 10))
bpy.context.object.data.energy = 3
bpy.ops.object.light_add(type='POINT', location=(0, 0, 5))
bpy.context.object.data.energy = 50

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'GPU'
scene.cycles.samples = 1
scene.render.resolution_x = 768
scene.render.resolution_y = 1024
scene.render.filepath = os.path.join(r"C:\Users\young\agents\aura_champions_card_art\art_raw", "card_back_simple.png")
bpy.ops.render.render(write_still=True)
print("SIMPLE_DONE")
'''

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(5)
s.connect(('localhost', 9876))
msg = {"type": "execute_code", "params": {"code": code}}
s.sendall((json.dumps(msg) + '\n').encode('utf-8'))
s.close()
print("Sent simple render to Blender")

# Wait for file
path = r"C:\Users\young\agents\aura_champions_card_art\art_raw\card_back_simple.png"
for i in range(15):
    if os.path.exists(path):
        print(f"Done: {os.path.getsize(path)} bytes")
        break
    print(f"Waiting... {i*10}s")
    time.sleep(10)
else:
    print("Timed out")
