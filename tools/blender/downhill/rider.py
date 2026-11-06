"""Original Downhill cyclist. Blender 4.3+, metre units, exported Y-up/-Z forward.
Run: blender -b --python tools/blender/downhill/rider.py
All meshes authored here; no external models or textures.
"""
import bpy, math, random, os
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
random.seed(18)
def co(p): return Vector((p[0],-p[2],p[1]))
def mat(name, color, rough=.65, metal=0):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
 n=m.node_tree.nodes.get('Principled BSDF'); n.inputs['Base Color'].default_value=(*color,1); n.inputs['Roughness'].default_value=rough; n.inputs['Metallic'].default_value=metal
 return m
orange=mat('FramePaint',(1,.255,.018),.32,.15); blue=mat('JerseyBlue',(.015,.27,.65)); navy=mat('NavyFabric',(.012,.065,.18)); gold=mat('Sunflower', (1,.67,.025),.47)
skin=mat('WarmSkin',(1,.56,.28),.65); hair=mat('ChestnutHair',(.18,.065,.022)); white=mat('Cream',(.98,.96,.83)); black=mat('Rubber',(.018,.027,.035),.82); silver=mat('BrushedMetal',(.47,.57,.61),.28,.82); pupil=mat('Pupils',(.007,.016,.023),.3)
materials=[orange,blue,navy,gold,skin,hair,white,black,silver,pupil]
def empty(name,p=(0,0,0),parent=None):
 o=bpy.data.objects.new(name,None); bpy.context.collection.objects.link(o); o.location=co(p); o.parent=parent; return o
def finish(o,name,m,parent=None):
 o.name=name; o.data.materials.append(m)
 for f in o.data.polygons: f.use_smooth=True
 if parent: o.parent=parent
 return o
def ball(name,p,s,m,parent=None,seg=16,rings=10):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,location=co(p)); o=bpy.context.object; o.scale=(s[0],s[2],s[1]); return finish(o,name,m,parent)
def bar(name,a,b,r,m,parent=None,verts=12):
 a,b=co(a),co(b); bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=(b-a).length,location=(a+b)/2)
 o=bpy.context.object; o.rotation_mode='QUATERNION'; o.rotation_quaternion=(b-a).to_track_quat('Z','Y'); bevel=o.modifiers.new('Soft edges','BEVEL'); bevel.width=r*.35; bevel.segments=2
 return finish(o,name,m,parent)
def box(name,p,s,m,parent=None,bevel=.04):
 bpy.ops.mesh.primitive_cube_add(size=1,location=co(p)); o=bpy.context.object; o.scale=(s[0],s[2],s[1]); bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 mod=o.modifiers.new('Rounded corners','BEVEL'); mod.width=bevel; mod.segments=3
 o.modifiers.new('Weighted normals','WEIGHTED_NORMAL'); return finish(o,name,m,parent)
def ring(name,p,r,t,m,parent=None):
 bpy.ops.mesh.primitive_torus_add(major_segments=40,minor_segments=8,location=co(p),major_radius=r,minor_radius=t,rotation=(0,math.pi/2,0)); return finish(bpy.context.object,name,m,parent)
def join_children(parent):
 # Merge by material within articulated node: named pivot remains stable.
 for m in materials:
  obs=[o for o in list(parent.children) if o.type=='MESH' and o.data.materials[0]==m]
  if not obs: continue
  bpy.ops.object.select_all(action='DESELECT')
  for o in obs:
   bpy.context.view_layer.objects.active=o
   for mod in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=mod.name)
   o.select_set(True)
  bpy.context.view_layer.objects.active=obs[0]; bpy.ops.object.join(); o=bpy.context.object; o.name=parent.name+'_'+m.name
  # preserve transformed geometry but normalize mesh transform under parent
  bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
root=empty('RiderAsset')
frame=empty('Frame',parent=root)
rear=(0,.395,.65); front=(0,.395,-.72); seat=(0,1.02,.22); axle=(0,.42,0); neck=(0,1.0,-.48)
for s in [-1,1]:
 bar('Chainstay',(s*.095,.395,.65),axle,.031,orange,frame)
 bar('Seatstay',(s*.095,.395,.65),seat,.026,orange,frame)
 bar('Fork',(s*.095,.395,-.72),(s*.095,.74,-.61),.035,navy,frame)
 bar('Stanchion',(s*.095,.72,-.61),(s*.095,1.0,-.48),.025,silver,frame)
bar('Downtube',axle,neck,.061,orange,frame); bar('Seattube',axle,seat,.046,orange,frame); bar('TopTube',neck,seat,.05,orange,frame)
bar('Seatpost',seat,(0,1.14,.25),.026,silver,frame)
ball('Saddle',(0,1.15,.25),(.14,.05,.20),navy,frame)
bar('Stem',neck,(0,1.23,-.52),.026,navy,frame)
for i in range(8):
 # Rear spring coils, oblique suspension linkage.
 ring('Spring',(0,.59+i*.021,.11+i*.01),.042,.009,gold,frame)
bar('Damper',(0,.55,.10),(0,.84,.24),.022,silver,frame)
ball('Bottle',(0,.74,-.06),(.046,.14,.05),blue,frame)
for sy in [-1,1]: bar('Chain',(.11,.42+sy*.105,0),(.11,.395+sy*.065,.65),.008,silver,frame)
ring('Chainring',(.115,.42,0),.105,.012,silver,frame)
ring('Cassette',(.115,.395,.65),.065,.014,silver,frame)
# Brake cable follows a curved spline.
curve=bpy.data.curves.new('BrakeCable','CURVE');curve.dimensions='3D';curve.bevel_depth=.008;curve.bevel_resolution=2
sp=curve.splines.new('BEZIER');sp.bezier_points.add(3)
for p,v in zip(sp.bezier_points,[(.29,1.25,-.5),(.22,1.02,-.79),(.12,.77,-.63),(.1,.44,-.72)]):p.co=co(v);p.handle_left_type=p.handle_right_type='AUTO'
o=bpy.data.objects.new('BrakeCable',curve);bpy.context.collection.objects.link(o);o.parent=frame;curve.materials.append(black)
bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
handle=empty('Handlebar',(0,1.23,-.52),root)
bar('Bars',(-.37,0,0),(.37,0,0),.024,silver,handle)
for s in [-1,1]:
 bar('Grip',(s*.25,0,0),(s*.37,0,0),.037,navy,handle)
 bar('BrakeLever',(s*.26,-.035,-.055),(s*.34,-.035,-.06),.011,silver,handle)
for label,hub in [('RearWheel',rear),('FrontWheel',front)]:
 w=empty(label,hub,root);ring('Tire',(0,0,0),.335,.059,black,w);ring('Rim',(0,0,0),.293,.017,orange,w)
 ring('BrakeDisc',(.065,0,0),.112,.014,silver,w);bar('Hub',(-.07,0,0),(.07,0,0),.032,silver,w)
 for i in range(20):
  a=i*math.tau/20;bar('Spoke',((i%2*2-1)*.045,0,0),(0,math.cos(a)*.29,math.sin(a)*.29),.004,silver,w,8)
 for i in range(40):
  a=i*math.tau/40
  for s in [-1,1]:
   o=box('Tread',(s*.028,math.cos(a)*.387,math.sin(a)*.387),(.043,.022,.038),black,w,.005);o.rotation_euler.x=-a
 join_children(w)
for s in [-1,1]:
 cr=empty('CrankL' if s<0 else 'CrankR',(0,.42,0),root)
 bar('Crank',(s*.11,0,0),(s*.15,.15,0),.017,silver,cr)
 box('Pedal',(s*.17,.15,0),(.13,.028,.105),navy,cr,.008);join_children(cr)
body=empty('Body',parent=root)
ball('Shorts',(0,1.28,.20),(.255,.20,.22),blue,body)
ball('Jersey',(0,1.56,.055),(.295,.33,.21),orange,body)
# Seams and shoulder panels.
for s in [-1,1]:
 ball('Sleeve',(s*.255,1.64,-.025),(.105,.14,.14),blue,body)
 bar('PackStrap',(s*.19,1.79,.02),(s*.21,1.34,.23),.032,navy,body)
ball('Pack',(0,1.57,.275),(.245,.28,.125),blue,body)
box('PackPocket',(0,1.48,.38),(.30,.15,.07),navy,body,.045)
bar('PackZip',(-.14,1.59,.397),(.14,1.59,.397),.009,gold,body)
# Star extruded in backpack plane, rounded bevel.
verts=[]
for depth in [.395,.425]:
 for i in range(10):
  a=math.pi/2+i*math.pi/5;r=.139 if i%2==0 else .064;verts.append(co((math.cos(a)*r,1.67+math.sin(a)*r,depth)))
faces=[tuple(range(9,-1,-1)),tuple(range(10,20))]+[(i,(i+1)%10,(i+1)%10+10,i+10) for i in range(10)]
me=bpy.data.meshes.new('Star');me.from_pydata(verts,[],faces);o=bpy.data.objects.new('BackpackStar',me);bpy.context.collection.objects.link(o);finish(o,'BackpackStar',gold,body);be=o.modifiers.new('Star bevel','BEVEL');be.width=.009;be.segments=3
ball('Neck',(0,1.80,-.09),(.11,.13,.11),skin,body)
ball('Face',(0,1.995,-.15),(.29,.295,.27),skin,body,24,16)
for s in [-1,1]:
 ball('Ear',(s*.283,1.975,-.12),(.062,.095,.065),skin,body)
 ball('EyeWhite',(s*.10,2.045,-.393),(.068,.085,.028),white,body)
 ball('Eye',(s*.10,2.045,-.416),(.033,.049,.015),pupil,body)
 ball('EyeGlint',(s*.10-.01,2.067,-.429),(.011,.014,.007),white,body)
ball('Nose',(0,1.99,-.427),(.05,.052,.046),skin,body)
ball('Smile',(0,1.915,-.394),(.061,.025,.017),hair,body)
# Curled brown fringe at rear silhouette under helmet.
for i in range(11):
 a=i*math.tau/11;ball('HairCurl',(math.cos(a)*.255,1.92,-.13+math.sin(a)*.23),(.09,.12,.078),hair,body)
ball('Helmet',(0,2.155,-.145),(.345,.275,.32),orange,body,24,16)
ball('HelmetRim',(0,2.055,-.15),(.349,.067,.325),orange,body,24,10)
# Friendly cartoon graphics on rear of helmet, visible from follow camera.
for s in [-1,1]:
 ball('HelmetEyeWhite',(s*.12,2.19,.14),(.061,.083,.018),white,body)
 ball('HelmetEye',(s*.12,2.19,.157),(.032,.048,.009),pupil,body)
 ball('HelmetShine',(s*.12-.01,2.21,.165),(.011,.015,.005),white,body)
ball('HelmetNose',(0,2.105,.178),(.027,.022,.012),hair,body)
for s in [-1,1]:
 bar('ChinStrap',(s*.26,2.03,-.13),(s*.16,1.83,-.17),.015,navy,body)
 ball('HelmetVent',(s*.19,2.34,-.12),(.026,.014,.075),navy,body)
# Normalized articulated limb segments (length 1 along +Y), runtime IK positions them.
for s in ['L','R']:
 for name,rad,m in [('Thigh',.105,blue),('Shin',.079,skin),('UpperArm',.08,orange),('Forearm',.065,skin)]:
  part=empty(name+s,parent=root);ball(name,(0,0,0),(rad,.55,rad),m,part)
  if name=='Thigh':ball('Cuff',(0,-.30,0),(rad*1.05,.12,rad*1.05),navy,part)
  join_children(part)
 shoe=empty('Shoe'+s,parent=root)
 box('Sole',(0,-.035,-.035),(.15,.055,.29),white,shoe,.024)
 ball('ShoeUpper',(0,.018,-.04),(.08,.073,.14),blue,shoe)
 ball('Heel',(0,.035,.067),(.072,.07,.06),orange,shoe)
 for z in [-.04,-.075,-.11]:bar('Laces',(-.045,.077,z),(.045,.077,z),.007,white,shoe,8)
 join_children(shoe)
 hand=empty('Hand'+s,parent=root);ball('Glove',(0,0,0),(.078,.065,.081),blue,hand);ball('Thumb',(.048,-.025,-.025),(.035,.035,.049),blue,hand);join_children(hand)
 knee=empty('Knee'+s,parent=root);ball('Knee',(0,0,0),(.09,.095,.095),skin,knee);join_children(knee)
for group in [frame,handle,body]: join_children(group)
# Bake a real pedal cycle on articulation pivots. Runtime samples the same phase and
# adds landing/trick offsets; named clip is also reusable in Blender/AnimationMixer.
scene=bpy.context.scene;scene.render.fps=24
for f in range(1,26):
 phase=(f-1)/24*math.tau
 for i,s in enumerate(['L','R']):
  p=phase+(0 if i else math.pi);sign=-1 if i==0 else 1
  hip=Vector((sign*.145,1.3,.19));foot=Vector((sign*.17,.42+.15*math.sin(p),.15*math.cos(p)))
  knee=hip.lerp(foot,.5);knee.z-=.28
  shoulder=Vector((sign*.25,1.68,-.03));hand=Vector((sign*.31,1.23,-.52));elbow=shoulder.lerp(hand,.5);elbow.x+=sign*.09;elbow.z+=.10
  for name,a,b in [('Thigh',hip,knee),('Shin',knee,foot),('UpperArm',shoulder,elbow),('Forearm',elbow,hand)]:
   o=bpy.data.objects[name+s];o.location=co((a+b)/2);o.rotation_mode='QUATERNION';o.rotation_quaternion=(co(b)-co(a)).to_track_quat('Z','Y');o.scale=(1,1,(b-a).length)
   o.keyframe_insert('location',frame=f);o.keyframe_insert('rotation_quaternion',frame=f);o.keyframe_insert('scale',frame=f)
  for name,pt in [('Shoe',foot),('Knee',knee),('Hand',hand)]:
   o=bpy.data.objects[name+s];o.location=co(pt);o.keyframe_insert('location',frame=f)
  cr=bpy.data.objects['Crank'+s];cr.rotation_euler.x=math.pi/2-p;cr.keyframe_insert('rotation_euler',frame=f)
scene.frame_start=1;scene.frame_end=25;scene.frame_set(1)
for o in bpy.data.objects:
 if o.animation_data and o.animation_data.action: o.animation_data.action.name='PedalCycle_'+o.name
# Export model without rendering helpers.
out=ROOT/'assets/downhill/characters/rider.glb';out.parent.mkdir(parents=True,exist_ok=True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/downhill/blender/rider.blend'))
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_force_sampling=True,export_yup=True)
# Combine Blender's per-object action exports into one reusable phase-aligned clip.
import json, struct
blob=out.read_bytes();jlen=struct.unpack_from('<I',blob,12)[0]
doc=json.loads(blob[20:20+jlen]);channels=[];samplers=[]
for clip in doc.get('animations',[]):
 offset=len(samplers);samplers.extend(clip['samplers'])
 for channel in clip['channels']:
  channel['sampler']+=offset;channels.append(channel)
doc['animations']=[{'name':'PedalCycle','channels':channels,'samplers':samplers}]
js=json.dumps(doc,separators=(',',':')).encode();js+=b' '*((-len(js))%4)
tail=blob[20+jlen:];out.write_bytes(struct.pack('<III',0x46546c67,2,20+len(js)+len(tail))+struct.pack('<II',len(js),0x4e4f534a)+js+tail)
# Inspection render, not a game texture.
bpy.ops.mesh.primitive_plane_add(size=200);floor=bpy.context.object;floor.location.z=-.015;floor.data.materials.append(mat('StudioFloor',(.12,.21,.13)))
world=bpy.data.worlds.new('Studio') if not bpy.data.worlds else bpy.data.worlds[0];scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.55,.72,.9,1);world.node_tree.nodes['Background'].inputs[1].default_value=.65
for name,p,power,size in [('Key',(-3,-4,6),600,5),('Rim',(3,2,5),350,4)]:
 bpy.ops.object.light_add(type='AREA',location=p);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,1.2))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(3.2,-5.6,3));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,1.25))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=3.3;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=False;scene.render.resolution_x=800;scene.render.resolution_y=800;scene.render.resolution_percentage=100;scene.render.filepath='/workspace/scratch/afd828002ad9/rider-preview.png';bpy.ops.render.render(write_still=True)
print('RIDER_EXPORT',out, 'bytes',out.stat().st_size)
