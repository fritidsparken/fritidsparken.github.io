"""Original Downhill scenery. Blender 4.3+, metres; exported Y-up, forward -Z."""
import bpy, math, random, os
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'assets/downhill'
random.seed(42)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(n,c):
 m=bpy.data.materials.new(n); m.diffuse_color=(*c,1); m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=(*c,1); bs.inputs['Roughness'].default_value=.78
 return m
leaf=[mat('Needles'+str(i),c) for i,c in enumerate([(.10,.52,.008),(.23,.72,.012),(.39,.83,.018),(.15,.63,.006)])]
bark=mat('Warm cedar',(.38,.145,.039)); wood=mat('Honey timber',(.63,.28,.07)); gold=mat('Cut wood',(.77,.45,.14)); stone=mat('Lavender granite',(.38,.42,.49)); white=mat('Snow',(.85,.94,1)); blue=mat('Mountain blue',(.085,.29,.73))
petals=[mat('Petal'+str(i),c) for i,c in enumerate([(1,.68,.008),(1,.035,.28),(.98,.97,.87)])]; green=mat('Grass',(.13,.65,.008))
def uv(n,p,s,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,location=p); o=bpy.context.object; o.name=n; o.scale=s; o.data.materials.append(m)
 for f in o.data.polygons:f.use_smooth=True
 return o
def cube(n,p,s,m,bevel=.1):
 bpy.ops.mesh.primitive_cube_add(size=1,location=p);o=bpy.context.object;o.name=n;o.scale=s;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 mod=o.modifiers.new('Rounded crafted edges','BEVEL');mod.width=bevel;mod.segments=2;bpy.ops.object.modifier_apply(modifier=mod.name)
 for f in o.data.polygons:f.use_smooth=True
 mod=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=mod.name)
 return o
def tube(n,a,b,r,m):
 d=Vector(b)-Vector(a);bpy.ops.mesh.primitive_cone_add(vertices=10,radius1=r,radius2=r*.82,depth=d.length,location=(Vector(a)+Vector(b))/2);o=bpy.context.object;o.name=n;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();o.data.materials.append(m)
 for f in o.data.polygons:f.use_smooth=True
 return o
# Merge each family to one mesh using vertex colours. One material and draw call per instanced family.
vertex=mat('Scenery vertex palette',(1,1,1));ns=vertex.node_tree.nodes;v=ns.new('ShaderNodeVertexColor');v.layer_name='Palette';vertex.node_tree.links.new(v.outputs['Color'],ns.get('Principled BSDF').inputs['Base Color'])
def finish(name,objects):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:
  o.select_set(True);bpy.context.view_layer.objects.active=o
  bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
  attr=o.data.color_attributes.new(name='Palette',type='BYTE_COLOR',domain='CORNER')
  for face in o.data.polygons:
   c=o.data.materials[face.material_index].diffuse_color
   for li in face.loop_indices:attr.data[li].color=c
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object;o.name=name
 bpy.context.scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR');o.data.materials.clear();o.data.materials.append(vertex)
 for f in o.data.polygons:f.material_index=0
 return o
def family(name,fn):
 before=set(bpy.data.objects);fn();return finish(name,[o for o in bpy.data.objects if o not in before])
def spruce(variant):
 tube('sculpted trunk',(0,0,0),(0,0,5.6),.26,bark)
 for j in range(7):
  z=1.45+j*.65;radius=1.48*(1-j/8)
  for k in range(7):
   a=k*math.tau/7+j*.53+variant*.23
   o=uv('drooping rounded bough',(math.cos(a)*radius*.51,math.sin(a)*radius*.51,z),(radius*.76,radius*.29,.31*(1-j*.065)),leaf[(j+k+variant)%4]);o.rotation_euler=(0,-.2,a)
  uv('crown heart',(0,0,z+.12),(radius*.48,radius*.48,.46),leaf[j%4])
 uv('tender tip',(0,0,6.02),(.19,.19,.48),leaf[2])
for i in range(3):family('spruce'+str(i),lambda:spruce(i))
def bush():
 for j in range(13):
  a=j*2.4;r=.15+.55*math.sqrt(j/13)
  uv('leaf cushion',(math.cos(a)*r,math.sin(a)*r,.32+random.random()*.33),(.38,.3,.36),leaf[j%4])
family('bush',bush)
def oak():
 tube('trunk',(0,0,0),(0,0,3.5),.32,bark)
 for j in range(12):
  a=j*2.4;r=.2+1.25*math.sqrt(j/12)
  uv('canopy',(math.cos(a)*r,math.sin(a)*r,3.4+random.random()),(.95,.8,.85),leaf[j%4])
family('oak',oak)
def palm():
 tube('trunk',(0,0,0),(.3,0,4.6),.24,bark)
 for k in range(10):
  a=k*math.tau/10
  for j in range(5):
   d=j*.36
   o=uv('palm leaf',(.3+math.cos(a)*d,math.sin(a)*d,4.6+.48*math.sin(j*.7)),(.5,.18,.13),leaf[k%4]);o.rotation_euler.z=a
family('palm',palm)
def rock():
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1);o=bpy.context.object;o.scale=(1,.8,.65);o.location.z=.38;o.data.materials.append(stone)
 for v in o.data.vertices:v.co*=1+random.uniform(-.12,.12)
 mod=o.modifiers.new('Soft eroded facets','BEVEL');mod.width=.08;mod.segments=2;bpy.ops.object.modifier_apply(modifier=mod.name)
 for p in o.data.polygons:p.use_smooth=True
family('rock',rock)
for variant in range(3):
 def flowers():
  for j in range(3):
   x=(j-1)*.23;y=math.sin(j*3)*.15;h=.28+.1*(j%2)
   tube('stem',(x,y,0),(x,y,h),.018,green)
   uv('leaf',(x+.08,y,.12),(.13,.035,.035),leaf[2])
   for k in range(5):
    a=k*math.tau/5;o=uv('petal',(x+math.cos(a)*.09,y+math.sin(a)*.09,h),(.09,.045,.026),petals[variant]);o.rotation_euler.z=a
   uv('pollen',(x,y,h+.025),(.044,.044,.035),gold)
 family('flowers'+str(variant),flowers)
def grass():
 for j in range(9):
  a=j*2.4;x=math.cos(a)*.15;y=math.sin(a)*.15;h=.16+random.random()*.23
  o=uv('blade',(x,y,h*.46),(.035,.025,h*.6),leaf[j%4]);o.rotation_euler=(.22*math.sin(a),.22*math.cos(a),a)
family('grass',grass)
family('plank',lambda:cube('plank',(0,0,0),(1,1,1),wood,.06))
family('post',lambda:cube('post',(0,0,0),(1,1,1),wood,.1))
# normalized unit mountain with an undulating snow line; all generated in Blender
for var in range(4):
 def mountain():
  verts=[];faces=[];N=28;R=14
  for j in range(R+1):
   t=j/R
   for k in range(N):
    a=k*math.tau/N;radius=(1-t)**.84*(.85+.1*math.sin(5*a+var)+.06*math.cos(9*a))
    verts.append((math.cos(a)*radius+.1*t,math.sin(a)*radius,t*(1+.06*math.sin(a*4)*math.sin(t*math.pi))))
  for j in range(R):
   for k in range(N):faces.append((j*N+k,j*N+(k+1)%N,(j+1)*N+(k+1)%N,(j+1)*N+k))
  me=bpy.data.meshes.new('ridge');me.from_pydata(verts,[],faces);me.materials.append(blue);me.materials.append(white);o=bpy.data.objects.new('ridge',me);bpy.context.collection.objects.link(o)
  for p in me.polygons:
   p.material_index=int(p.center.z>.7) if False else int(sum(verts[v][2] for v in p.vertices)/4 > .69+.065*math.sin(p.index%N*.8))
   p.use_smooth=True
 family('mountain'+str(var),mountain)
def cloud():
 for j in range(7):uv('cloud puff',((j-3)*.6,random.uniform(-.2,.2),.4+math.sin(j*.6)*.45),(.85,.55,.56),white)
family('cloud',cloud)
# Separate low-detail meshes share the palette and preserve the authored silhouette.
for original in list(bpy.context.scene.objects):
 if original.name.startswith(('spruce','oak','palm','bush','grass','flowers')):
  low=original.copy();low.data=original.data.copy();bpy.context.collection.objects.link(low);low.name=original.name+'_lod'
  bpy.context.view_layer.objects.active=low
  dec=low.modifiers.new('Distance LOD','DECIMATE');dec.ratio=.20
  bpy.ops.object.modifier_apply(modifier=dec.name)
for o in bpy.context.scene.objects:o.select_set(True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'blender/environment.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'models/environment.glb'),export_format='GLB',export_apply=True,export_yup=True,export_animations=False)
print('ENVIRONMENT_DONE')
