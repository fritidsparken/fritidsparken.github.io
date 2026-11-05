"""Run with Blender 4.3+: blender -b -t 6 --python-exit-code 1 --python assemble.py -- /path/to/raw.glb /path/to/cover.png"""
import json
import sys
from pathlib import Path
import bpy
from mathutils import Vector

HERE = Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
import camera, environment, finish, street, terrain

ROOT = next(p for p in (HERE/'repo', *HERE.parents) if (p/'games/skatepark/index.html').exists())
ASSETS = ROOT/'assets/skatepark'
args = sys.argv[sys.argv.index('--')+1:]
raw, cover = map(Path,args)
raw.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version=0
terrain.build()
street.build()
before=set(bpy.context.scene.objects)
environment.build()
env=bpy.data.collections.new('Alpstrand • lakeside landscape')
bpy.context.scene.collection.children.link(env)
for obj in sorted(set(bpy.context.scene.objects)-before,key=lambda o:o.name):
    for previous in list(obj.users_collection):
        previous.objects.unlink(obj)
    env.objects.link(obj)
    if obj.data and obj.data.users>1:
        obj.data.asset_mark()
env.asset_mark()
finish.build()
scene=camera.setup(ASSETS/'environment/alpstrand/daylight.webp')
scene.unit_settings.system='METRIC'
scene.render.resolution_x=1456
scene.render.resolution_y=819
scene.cycles.samples=100
scene.cycles.adaptive_threshold=.035
scene.cycles.max_bounces=5
scene.cycles.transparent_max_bounces=12
scene.cycles.sample_clamp_indirect=2.0
scene['park']='Alpstrand Vertpark'
scene['scale_note']='Estimated from the single design image; one unit is one metre.'
bpy.context.view_layer.update()
rows=[]
for c in sorted(bpy.data.collections,key=lambda c:c.name):
    objects=[o for o in c.all_objects if o.type=='MESH']
    if not c.asset_data or not objects:
        continue
    pts=[o.matrix_world @ Vector(v) for o in objects for v in o.bound_box]
    mini=Vector([min(v[i] for v in pts) for i in range(3)])
    maxi=Vector([max(v[i] for v in pts) for i in range(3)])
    if c.name not in [x.name for x in bpy.data.collections.get('Transition park | reusable concrete and vert modules').children] and c!=env:
        c.instance_offset=((mini.x+maxi.x)/2,(mini.y+maxi.y)/2,mini.z)
    rows.append(dict(collection=c.name,dimensions_m=[round(float(v),2) for v in maxi-mini],
        origin_m=[round(x,3) for x in c.instance_offset],nodes=sorted(o.name for o in objects),
        materials=sorted(set(m.name for o in objects for m in o.data.materials if m))))
catalog=ASSETS/'library/alpstrand/catalog.json'
catalog.write_text(json.dumps(dict(native='../../blender/alpstrand/Alpstrand.blend',web='../../models/alpstrand.glb',units='metres',modules=rows),ensure_ascii=False,indent=2)+'\n')
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_perspective='CAMERA'
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(ASSETS/'blender/alpstrand/Alpstrand.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath=str(raw.resolve()),export_format='GLB',export_extras=True,
                         export_cameras=False, export_lights=False,export_animations=False,
                         export_gpu_instances=True,export_yup=True)
if str(cover)!='-':
    scene.render.filepath=str(cover.resolve())
    bpy.ops.render.render(write_still=True)
