"""blender -b -t 2 --python-exit-code 1 -P tools/blender/blockvarlden/generate_blocks.py"""
from pathlib import Path
import json
import struct
import sys
import zlib

import bpy
import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from block_catalog import catalog
from block_surfaces import surface, N

DEST = HERE.parents[2] / 'assets/blockvarlden/blocks'
GRID = 32
DEST.mkdir(parents=True, exist_ok=True)
atlas = np.zeros((GRID*N, GRID*N, 3), dtype=np.uint8)
next_tile = 0


def bake(block, face, seed):
    global next_tile
    tile = next_tile
    next_tile += 1
    y, x = divmod(tile, GRID)
    atlas[y*N:(y+1)*N,x*N:(x+1)*N] = surface(block, face, seed)
    return tile


def chunk(kind, data):
    return (struct.pack('>I', len(data)) + kind + data
            + struct.pack('>I', zlib.crc32(kind + data)))


def write_atlas():
    # PNG Sub filter lets the atlas compress without changing the palette.
    diff = atlas.copy()
    diff[:,1:] -= atlas[:,:-1]
    rows = b''.join(b'\1'+row.tobytes() for row in diff)
    header = struct.pack('>2I5B', atlas.shape[1], atlas.shape[0],8,2,0,0,0)
    (DEST/'atlas.png').write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',header)
        +chunk(b'IDAT',zlib.compress(rows,9))+chunk(b'IEND',b''))


def make_definition(block, ident):
    family = block['family']
    category = block['category']
    variants = []
    for variation in range(2 if category in ('Natur','Trä','Vegetation','Mineraler') else 1):
        seed = ident*1000+variation*10
        side = bake(block,'side',seed)
        top = bottom = side
        if family in ('grass','log','beam','workbench','crate','lamp'):
            top = bottom = bake(block,'top',seed+1)
            if family=='grass':
                bottom = bake(block,'bottom',seed+2)
        variants.append(dict(side=side,top=top,bottom=bottom))
    soft = family in ('grass','moss','earth','peat','sand','field','snow')
    wood = category=='Trä' or family in ('crate','workbench')
    liquid = family in ('water','lava')
    glass = family in ('ice','glass')
    sound = ('water' if liquid else 'wood' if wood else 'leaf' if category=='Vegetation'
             else 'sand' if family in ('sand','gravel') else 'earth' if soft
             else 'glass' if glass else 'metal' if family=='metal' else 'stone')
    tool = 'yxa' if wood else 'spade' if soft else None if liquid or category=='Vegetation' else 'hacka'
    rough = .18 if glass or liquid else .34 if family in ('metal','tile','crystal') else .86
    return dict(**block, id=ident, tiles=variants[0], variants=variants, hardness=(
        .2 if category=='Vegetation' else .55 if soft else 1.5 if wood else 0 if liquid else 2.4),
        sound=sound,tool=tool,transparent=liquid or glass, collision=not liquid, roughness=rough,
        opacity=.62 if family in ('glass','water') else .83 if family=='ice' else 1.,
        light=13 if family in ('lamp','lava') else 8 if family=='crystal' else 0,
        drop=None if liquid else ident, crafting=not liquid, model=block['key'])


blocks = [make_definition(b,i) for i,b in enumerate(catalog(),1)]
assert len(set(b['key'] for b in blocks)) == len(blocks) >= 120
assert next_tile < GRID**2
write_atlas()
registry = dict(version=1,tileSize=N,columns=GRID,rows=GRID,atlas='atlas.png',
                blender=bpy.app.version_string,modelLibrary='block-library.glb',
                license='CC0-1.0',blocks=blocks)
(DEST/'registry.json').write_text(json.dumps(registry, ensure_ascii=False, separators=(',',':'))+'\n')
bpy.ops.wm.read_factory_settings(use_empty=True)
image = bpy.data.images.load(str(DEST/'atlas.png'))
image.name = 'Blockvärlden • färgatlas'
for block in blocks:
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,0))
    obj = bpy.context.object
    obj.name = obj.data.name = block['key']
    obj['block_id'] = block['id']
    obj['sv'] = block['name']
    # In the export, root origin is the lower centre of each unit block.
    for vertex in obj.data.vertices:
        vertex.co.z += .5
    uv = obj.data.uv_layers.active.data
    for poly in obj.data.polygons:
        face = 'top' if poly.normal.z>.5 else 'bottom' if poly.normal.z<-.5 else 'side'
        row, col = divmod(block['tiles'][face],GRID)
        for idx in poly.loop_indices:
            p = obj.data.vertices[obj.data.loops[idx].vertex_index].co
            if face in ('top','bottom'):
                u,v = p.x+.5,p.y+.5
            else:
                u = .5+(p.y*poly.normal.x if abs(poly.normal.x)>.5 else -p.x*poly.normal.y)
                v = p.z
            uv[idx].uv = ((col + (.5 + (N-1)*u)/N)/GRID,
                          1-(row+1-(.5 + (N-1)*v)/N)/GRID)
    mat = bpy.data.materials.new(block['name'])
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Roughness'].default_value = block['roughness']
    shader.inputs['Metallic'].default_value = .55 if block['family']=='metal' else 0.
    shader.inputs['Alpha'].default_value = block['opacity']
    tex = mat.node_tree.nodes.new('ShaderNodeTexImage')
    tex.image = image
    tex.interpolation = 'Closest'
    mat.node_tree.links.new(tex.outputs['Color'],shader.inputs['Base Color'])
    if block['light']:
        mat.node_tree.links.new(tex.outputs['Color'],shader.inputs['Emission Color'])
        shader.inputs['Emission Strength'].default_value = block['light']/18
    obj.data.materials.append(mat)
    row, col = divmod(block['id']-1,16)
    obj.location = (col*1.25,row*1.25,0)
target = DEST/'block-library.glb'
bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',export_texcoords=True,
                          export_extras=True,export_animations=False)
raw = target.read_bytes()
assert raw[:4] == b'glTF'
doc = json.loads(raw[20:20+struct.unpack_from('<I',raw,12)[0]])
assert len(doc['meshes']) == len(blocks)
assert all('TEXCOORD_0' in m['primitives'][0]['attributes'] for m in doc['meshes'])
assert {node['name'] for node in doc['nodes']} == {b['key'] for b in blocks}
assert len(doc['images']) == 1
print(f"Validated {len(blocks)} distinct Blender block meshes, {next_tile} baked tiles and the embedded atlas.")
