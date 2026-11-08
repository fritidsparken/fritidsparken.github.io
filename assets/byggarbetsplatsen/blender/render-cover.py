"""Render a title illustration from the same exported model source."""
import bpy, math
from mathutils import Vector
from pathlib import Path
r=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(r/'blender'/'construction.blend'))
for col in bpy.data.collections:col.hide_viewport=False
def cv(p):return Vector((p[0],-p[2],p[1]))
for o in bpy.data.objects:
 if o.type!='LIGHT' and o.type!='CAMERA':o.hide_render=True

def show(o):
 o.hide_render=False
 for c in o.children_recursive:c.hide_render=False

def get(root,n):return next((o for o in root.children_recursive if o.name.split('.')[0]==n),None)
for name,pos in [('excavator',(-2,0,0)),('dumper',(-6,0,-2))]:
 o=bpy.data.objects[name];show(o);o.location=cv(pos);b=get(o,'boom');st=get(o,'stick');sc=get(o,'scoop')
 if b:b.rotation_euler[0]=-.7
 if st:st.rotation_euler[0]=-1.65
 if sc:sc.rotation_euler[0]=1.5
 load=get(o,'load');load.hide_render=True
 for c in load.children_recursive:c.hide_render=True
# Hydraulics in preview use the same endpoint constraint, in Blender coordinates.
bpy.context.view_layer.update()
for root in [bpy.data.objects['excavator'],bpy.data.objects['dumper']]:
 for o in root.children_recursive:
  if 'hydraulic_a' not in o:continue
  a=get(root,o['hydraulic_a']);b=get(root,o['hydraulic_b']);q=get(root,o.name.split('.')[0]+'_rod')
  va=o.parent.matrix_world.inverted()@a.matrix_world.translation;vb=o.parent.matrix_world.inverted()@b.matrix_world.translation;v=vb-va;o.location=va;o.rotation_mode='QUATERNION';o.rotation_quaternion=Vector((0,0,1)).rotation_difference(v.normalized());o.scale.z=v.length*.57;q.location=va+v*.45;q.rotation_mode='QUATERNION';q.rotation_quaternion=o.rotation_quaternion;q.scale.z=v.length*.55

def cube(name,dim,pos,mat):
 bpy.ops.mesh.primitive_cube_add();o=bpy.context.object;o.name=name;o.location=cv(pos);o.scale=(dim[0]/2,dim[2]/2,dim[1]/2);o.data.materials.append(bpy.data.materials[mat]);return o
cube('ground',(100,.2,100),(0,-.3,0),'Leaf green');cube('yard',(31,.15,24),(0,-.1,0),'Warm earth')
env=bpy.data.objects['environment']
def prop(name,pos,scale=1,angle=0):
 source=get(env,name);mapping={}
 for orig in [source]+list(source.children_recursive):
  copy=orig.copy();bpy.context.collection.objects.link(copy);mapping[orig]=copy
 for orig,copy in mapping.items():copy.parent=mapping.get(orig.parent);copy.hide_render=False
 o=mapping[source];o.location=cv(pos);o.scale=(scale,scale,scale);o.rotation_euler[2]=angle;return o
for x in range(-15,16,5):prop('fence',(x,0,10));prop('tree',(x,0,15),1.5)
for x in [-14,15]:
 for z in range(-8,9,5):prop('tree',(x,0,z),1.5)
for x in range(-10,14,3):prop('cone',(x,0,6))
prop('soil',(-9,0,6),1.3);prop('lumber',(9,0,7));prop('bricks',(11,0,8));prop('pipe',(13,0,7))
for x in [2.5,11.5]:cube('formwork',(.25,.5,7),(x,.15,-1),'Honey timber')
for z in [-4.5,2.5]:cube('formwork',(9,.5,.25),(7,.15,z),'Honey timber')
scene=bpy.context.scene
scene.world.use_nodes=True;bg=scene.world.node_tree.nodes.get('Background');bg.inputs['Color'].default_value=(.55,.75,1,1);bg.inputs['Strength'].default_value=.6
for light in bpy.data.lights:
 if light.type=='AREA':light.energy*=.4
sun=bpy.data.lights.new('Warm afternoon sun','SUN');sun.energy=2.5;sun.angle=.13;sun.color=(1,.88,.68);o=bpy.data.objects.new('Warm afternoon sun',sun);bpy.context.collection.objects.link(o);o.rotation_euler=(.5,-.4,-.5)
scene.render.engine='CYCLES';scene.cycles.samples=96;scene.cycles.use_denoising=False;scene.render.film_transparent=False;scene.world.color=(.45,.65,.8);scene.render.resolution_x=1280;scene.render.resolution_y=720;scene.render.resolution_percentage=100
cam=scene.camera;cam.data.type='PERSP';cam.data.lens=42;cam.location=cv((-14,10,-18));cam.rotation_euler=(cv((1,1,1))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(r/'cover-render.png');bpy.ops.render.render(write_still=True)
