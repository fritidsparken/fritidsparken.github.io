"""Animate the finished mesh from a saved folding project, without changing its shape.
blender -b -t 4 --python-exit-code 1 --python /absolute/render-flight.py -- \
  --model /absolute/model.blend --out /tmp/model-flight [--preview]
The path is a designed visual demonstration, not an aerodynamic prediction.
"""
import argparse,math,sys,json,random
from pathlib import Path
import bpy
from mathutils import Vector,Quaternion,Matrix

p=argparse.ArgumentParser();p.add_argument('--model',required=True);p.add_argument('--out',required=True);p.add_argument('--preview',action='store_true');p.add_argument('--samples',choices=['8','16','32'],default='16')
a=p.parse_args(sys.argv[sys.argv.index('--')+1:]);out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=a.model);scene=bpy.context.scene;scene.frame_set(scene.frame_end)
parts=[ob for ob in scene.objects if ob.type=='MESH' and ob.name.startswith('Step ') and not ob.hide_render]
assert len(parts)==1, 'Expected exactly one finished paper mesh'
mesh=bpy.data.meshes.new_from_object(parts[0].evaluated_get(bpy.context.evaluated_depsgraph_get()))
# The very same folded geometry is used in the guide and the flight.
center=Vector(tuple((min(v.co[i] for v in mesh.vertices)+max(v.co[i] for v in mesh.vertices))/2 for i in range(3)))
forward_xy=scene.get('flight_forward_xy',[0,1])
heading=Matrix.Rotation(math.atan2(forward_xy[0],forward_xy[1]),3,'Z')
for v in mesh.vertices:v.co=heading@(v.co-center)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene.animation_data_clear();scene.frame_start=1;scene.frame_end=360;scene.render.fps=30
scene.render.engine='BLENDER_WORKBENCH';scene.display.render_aa=a.samples
scene.render.resolution_x=960;scene.render.resolution_y=540;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.view_settings.view_transform='Standard'
sh=scene.display.shading;sh.light='STUDIO';sh.studio_light='paint.sl';sh.studiolight_rotate_z=.3;sh.color_type='MATERIAL';sh.show_shadows=True;sh.shadow_intensity=.25;sh.show_cavity=True;sh.cavity_type='BOTH';sh.curvature_ridge_factor=1.1;sh.curvature_valley_factor=1.0;sh.show_specular_highlight=True
sh.background_type='WORLD';scene.world.color=(.68,.83,.87)
plane=bpy.data.objects.new('Finished folded paper — unchanged geometry',mesh);scene.collection.objects.link(plane)
plane.rotation_mode='QUATERNION'

def mat(name,c):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.roughness=.9;return m
meadow=mat('Meadow',(.38,.52,.31));pathmat=mat('Warm stone path',(.71,.65,.48));leaf=mat('Deep sage foliage',(.16,.34,.22));leaflight=mat('Sunlit foliage',(.28,.43,.24));bark=mat('Tree bark',(.25,.19,.12));cloudmat=mat('Warm clouds',(.92,.93,.88));gold=mat('Meadow flowers',(.92,.67,.24))
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,0));bpy.context.object.name='Meadow';bpy.context.object.data.materials.append(meadow)
# A continuous path and a few well-separated trees make forward motion readable.
bpy.ops.mesh.primitive_cube_add(size=1,location=(-1.9,4,.005));ob=bpy.context.object;ob.name='Garden path';ob.scale=(.7,40,.01);ob.data.materials.append(pathmat)
random.seed(41)
for i in range(26):
 y=-8+i*1.3;x=(-1 if i%2 else 1)*random.uniform(1.8,4.5);h=random.uniform(.65,1.4)
 bpy.ops.mesh.primitive_cone_add(vertices=10,radius1=.05,radius2=.035,depth=h,location=(x,y,h/2));bpy.context.object.data.materials.append(bark)
 for dz,scale in [(h*.65,.35),(h,.28)]:
  bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=scale,location=(x,y,dz));ob=bpy.context.object;ob.scale=(1,1,1.25);ob.data.materials.append(leaf if i%3 else leaflight)
  for polygon in ob.data.polygons:polygon.use_smooth=True
for i in range(40):
 x=random.uniform(-1.4,1.6);y=random.uniform(-7,22)
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.018,location=(x,y,.028));bpy.context.object.data.materials.append(gold)
# Distant low hills, deliberately kept away from the flight corridor.
for x,y,r in [(-9,18,4),(10,24,6),(-12,35,7),(17,42,9)]:
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=1,location=(x,y,-.1));ob=bpy.context.object;ob.scale=(r,r,r*.28);ob.data.materials.append(leaflight)
 for polygon in ob.data.polygons:polygon.use_smooth=True
bpy.ops.object.camera_add();camera=bpy.context.object;camera.name='Smooth following camera';camera.data.type='PERSP';camera.data.lens=43;camera.data.clip_start=.01;camera.data.clip_end=300;scene.camera=camera

def position(t):
 return Vector((.8*math.sin(2*math.pi*t)-.25*math.sin(math.pi*t),-3+14*t,1.25+.22*math.sin(math.pi*t)-.42*t))
def tangent(t):
 return Vector((1.6*math.pi*math.cos(2*math.pi*t)-.25*math.pi*math.cos(math.pi*t),14,.22*math.pi*math.cos(math.pi*t)-.42)).normalized()
for frame in range(1,361):
 t=(frame-1)/359;pos=position(t);forward=tangent(t);right=forward.cross(Vector((0,0,1))).normalized()
 bank=-.16*math.sin(2*math.pi*t)
 plane.location=pos;plane.rotation_quaternion=forward.to_track_quat('Y','Z')@Quaternion((0,1,0),math.pi+bank)
 plane.keyframe_insert('location',frame=frame);plane.keyframe_insert('rotation_quaternion',frame=frame)
 # One uncut shot. A slow pull-back at the end reveals the landscape.
 pull=max(0,(t-.75)/.25);pull=pull*pull*(3-2*pull)
 camera.location=pos+right*(.30+.14*pull)-forward*(.56+.35*pull)+Vector((0,0,.23+.11*pull))
 target=pos+forward*.035;camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
 camera.keyframe_insert('location',frame=frame);camera.keyframe_insert('rotation_euler',frame=frame)
# Dense samples use linear interpolation; smooth analytic curves set every frame.
for ob in [plane,camera]:
 if ob.animation_data and ob.animation_data.action:
  for fc in ob.animation_data.action.fcurves:
   for k in fc.keyframe_points:k.interpolation='LINEAR'
scene.frame_set(1)
scene['flight_note']='Designed flight illustration; not a measured or simulated range.'
if not a.preview:bpy.ops.wm.save_as_mainfile(filepath=str(out/'flight.blend'),compress=True)
frames=[1,90,180,270,360] if a.preview else range(1,361)
for frame in frames:
 scene.frame_set(frame);scene.render.filepath=str(out/f'flight-{frame:04d}.png');bpy.ops.render.render(write_still=True)
(out/'flight.json').write_text(json.dumps({'fps':30,'frames':360,'duration':12,'resolution':[960,540],'sourceModel':Path(a.model).name,'type':'designed flight illustration'}))
print('FLIGHT_COMPLETE',out,flush=True)
