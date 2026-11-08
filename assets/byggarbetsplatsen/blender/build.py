"""Original toy construction fleet. Blender 4.3; metres; author coordinates x/right y/up z/back.
Run: blender -b --python assets/byggarbetsplatsen/blender/build.py
Exports neutral pivot GLBs; runtime supplies poses, hydraulic constraints and cargo.
"""
import bpy, math, random, os, json
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
random.seed(82)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def cv(p):return Vector((p[0],-p[2],p[1]))
def material(name,hex,rough=.5,metal=0):
 m=bpy.data.materials.new(name);linear=lambda v:v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4;m.diffuse_color=(*[linear(int(hex[i:i+2],16)/255) for i in (0,2,4)],1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=m.diffuse_color;bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
 return m
Y=material('Sunflower enamel','FFBF12',.3,.15); O=material('Tangerine enamel','F88019',.32,.12); D=material('Graphite rubber','29333C',.85); T=material('Track pads','41454C',.72); S=material('Brushed steel','8D9AA5',.32,.65); CH=material('Piston chrome','CBD8DD',.21,.8); G=material('Cab glass','92CAD2',.19,.05); W=material('Ivory','FFF2CE',.48); B=material('Ocean teal','167D83',.45); WO=material('Honey timber','DDA153',.67); SO=material('Warm earth','A56942',.95); GR=material('Gravel','A6AAA2',.98); LE=material('Leaf green','70AD28',.8); LE2=material('Leaf lime','95C938',.8); TR=material('Tree bark','96633C',.9); BR=material('Terracotta','CF7053',.85); WHITE=material('Mixer pearl','E9EFDE',.38,.12)
G.diffuse_color=(*G.diffuse_color[:3],.22);G.node_tree.nodes.get('Principled BSDF').inputs['Alpha'].default_value=.22;G.surface_render_method='DITHERED'
roots=[]
def empty(name,p=None,at=(0,0,0)):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.parent=p;o.location=cv(at);return o
def finish(o,name,p,at,mat):
 o.name=name;o.parent=p;o.location=cv(at);o.data.materials.append(mat)
 for f in o.data.polygons:f.use_smooth=True
 return o
def _box(p,name,dim,at,mat=Y,bev=.07):
 bpy.ops.mesh.primitive_cube_add();o=bpy.context.object;o.scale=(dim[0]/2,dim[2]/2,dim[1]/2);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bev:
  mod=o.modifiers.new('Soft manufactured edges','BEVEL');mod.width=min(bev,min(dim)*.3);mod.segments=3;bpy.ops.object.modifier_apply(modifier=mod.name)
  mod=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=mod.name)
 return finish(o,name,p,at,mat)
def _cyl(p,name,r,h,at,mat=S,axis='y',r2=None,n=16):
 bpy.ops.mesh.primitive_cone_add(vertices=n,radius1=r,radius2=r if r2 is None else r2,depth=h);o=bpy.context.object
 if axis=='x':o.rotation_euler[1]=math.pi/2
 if axis=='z':o.rotation_euler[0]=math.pi/2
 bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
 mod=o.modifiers.new('Rim rounding','BEVEL');mod.width=min(.035,r*.15,h*.15);mod.segments=2;bpy.ops.object.modifier_apply(modifier=mod.name)
 return finish(o,name,p,at,mat)
def _ball(p,name,r,at,mat=LE,scale=(1,1,1)):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=r);o=bpy.context.object;o.scale=(scale[0],scale[2],scale[1]);return finish(o,name,p,at,mat)
# Reuse manufactured geometry rather than invoking operators for each repeated bolt/window.
cache={}
def cached(kind,p,name,key,at,build,scale=(1,1,1)):
 k=(kind,)+key
 if k not in cache:
  o=build();cache[k]=o.data;return o
 o=bpy.data.objects.new(name,cache[k]);bpy.context.collection.objects.link(o);o.parent=p;o.location=cv(at);o.scale=(scale[0],scale[2],scale[1]);return o
def box(p,name,dim,at,mat=Y,bev=.07):return cached('box',p,name,(tuple(dim),mat.name,bev),at,lambda:_box(p,name,dim,at,mat,bev))
def cyl(p,name,r,h,at,mat=S,axis='y',r2=None,n=16):return cached('cyl',p,name,(r,h,mat.name,axis,r2,n),at,lambda:_cyl(p,name,r,h,at,mat,axis,r2,n))
def ball(p,name,r,at,mat=LE,scale=(1,1,1)):return cached('ball',p,name,(r,mat.name),at,lambda:_ball(p,name,r,at,mat,scale),scale)
def rod(p,name,a,b,r=.04,mat=D):
 v=cv(b)-cv(a);o=cyl(p,name,r,v.length,tuple((Vector(a)+Vector(b))/2),mat);o.rotation_mode='QUATERNION';o.rotation_quaternion=Vector((0,0,1)).rotation_difference(v.normalized());return o
def seat(p,at):
 x,y,z=at;box(p,'seat cushion',(.62,.18,.65),(x,y,z),D);box(p,'seat back',(.65,.7,.16),(x,y+.35,z+.27),D);box(p,'headrest',(.43,.28,.17),(x,y+.83,z+.28),D)
 for a in [-.45,.45]:rod(p,'joystick',(x+a,y,z-.2),(x+a,y+.43,z-.3),.035,S);ball(p,'control knob',.08,(x+a,y+.43,z-.3),O)
def cab(p,at=(0,1,0),paint=Y,open=False):
 x,y,z=at;box(p,'cab sill',(1.6,.28,1.65),(x,y,z),paint);seat(p,(x,y+.35,z+.14))
 for a in [-.73,.73]:
  for b in [-.72,.72]:rod(p,'ROPS frame',(x+a,y,z+b),(x+a*.92,y+1.75,z+b*.9),.065,D)
 box(p,'rounded roof',(1.8,.19,1.85),(x,y+1.8,z),paint,.12)
 if not open:
  for b in [-.7,.7]:box(p,'windshield',(1.34,1.43,.035),(x,y+.88,z+b),G,.01)
  for a in [-.72,.72]:box(p,'side glazing',(.035,1.43,1.35),(x+a,y+.88,z),G,.01)
  rod(p,'wiper',(x-.45,y+.23,z-.73),(x+.2,y+1.1,z-.73),.018,D)
 for a in [-.64,.64]:box(p,'headlight housing',(.3,.3,.2),(x+a,y+1.78,z-.9),D);box(p,'headlight lens',(.21,.2,.04),(x+a,y+1.78,z-1.01),W,.03)
 for a in [-.87,.87]:
  box(p,'step',(.35,.1,.6),(x+a,y-.4,z),D);rod(p,'handrail',(x+a,y-.2,z-.5),(x+a,y+.7,z-.5),.035,Y)
 cyl(p,'beacon base',.17,.08,(x,y+1.96,z),D);cyl(p,'beacon',.13,.24,(x,y+2.09,z),O,r2=.1)
def tracks(root,length=3.9,width=2.65):
 pads=[]
 for side in [-1,1]:
  x=side*width/2;box(root,'track core',(.61,.65,length-.45),(x,.58,0),D,.23)
  for j in range(5):
   z=-(length/2-.55)+j*(length-1.1)/4;cyl(root,'track roller',.34,.65,(x,.53,z),S,'x');cyl(root,'hub',.18,.69,(x,.53,z),D,'x')
  # racetrack loop, separate pads driven analytically on the loop
  half=(length-1)/2;per=4*half+2*math.pi*.44
  for j in range(30):
   q=empty('track_%s_%02d'%('L' if side<0 else 'R',j),root);q['track_side']=side;q['track_phase']=j/30;q['track_half']=half;q['track_x']=x
   box(q,'tread',(.76,.16,.27),(0,0,0),T,.05);pads.append(q)
 return pads
def wheel(root,x,z,r=.75):
 p=empty('wheel',root,(x,r,z));p['wheel_radius']=r
 cyl(p,'tire',r,.49,(0,0,0),D,'x');cyl(p,'rim',r*.52,.53,(0,0,0),Y,'x');cyl(p,'hub',r*.23,.56,(0,0,0),S,'x')
 for i in range(16):
  a=i*math.tau/16;o=box(p,'tread block',(.54,.14,.25),(0,math.sin(a)*r,math.cos(a)*r),T,.03);o.rotation_euler[0]=a
 return p
def bucket(p,width=1.5,at=(0,0,0)):
 g=empty('scoop',p,at);box(g,'bucket floor',(width,.14,1.15),(0,0,-.1),S);box(g,'bucket back',(width,.65,.17),(0,.25,.45),D)
 for x in [-width/2,width/2]:box(g,'bucket cheek',(.12,.68,1.16),(x,.25,-.1),S)
 for i in range(5):box(g,'tooth',(.14,.14,.42),(-width*.4+i*width*.2,-.04,-.81),CH,.025)
 return g
def hoses(p,length,x=.31):
 for j in range(2):
  pts=[(x+j*.08,.1,.21),(x+j*.08,.35,.34),(x+j*.08,length-.3,.34),(x+j*.08,length,.1)]
  for a,b in zip(pts,pts[1:]):rod(p,'hydraulic hose',a,b,.025,D)
def hydraulic(parent,name,a,b):
 # endpoints reference named pivot empties; runtime keeps barrels and rods aligned
 p=empty(name,parent);cyl(p,'barrel',.11,1,(0,.5,0),D);q=empty(name+'_rod',parent);cyl(q,'chrome rod',.065,1,(0,.5,0),CH)
 p['hydraulic_a']=a;p['hydraulic_b']=b
 return p
for i,name in enumerate(['excavator','dumper','loader','crane','mixer','roller']):
 print('MODELING',name,flush=True);r=empty(name);roots.append(r);r['asset_version']='cartoon-1';upper=empty('upper',r,(0,1.1,0))
 if i in [0,1]:tracks(r,3.9,2.6);box(r,'undercarriage',(2.3,.3,2.7),(0,.72,0),D)
 else:
  box(r,'chassis',(2.2,.45,5.3 if i==3 else 4.3),(0,1,0),D)
  for x in [-1.22,1.22]:
   for z in ([-1.9,0,1.9] if i in [3,4] else ([1.25] if i==5 else [-1.4,1.4])):wheel(r,x,z)
 if i==0:
  cyl(upper,'slew bearing',1.04,.26,(0,0,0),S);box(upper,'body',(2.65,.7,2.7),(0,.4,.25),Y,.2);box(upper,'counterweight',(2.4,.7,1.15),(0,.8,1.1),Y,.25);cab(upper,(-.55,.8,.05))
  for k in range(6):box(upper,'engine vent',(.58,.045,.04),(.72,.7+k*.1,1.7),D,.01)
  b=empty('boom',upper,(0,.9,-1.45));box(b,'boom casting',(.48,3.4,.6),(0,1.7,0),Y,.14);box(b,'raised side plate',(.53,2.8,.3),(0,1.7,-.08),Y,.09);hoses(b,3.4)
  st=empty('stick',b,(0,3.4,0));box(st,'stick casting',(.38,2.7,.48),(0,1.35,0),Y,.12);hoses(st,2.7,.22);sc=bucket(st,1.45,(0,2.7,0))
  for par,pos in [(b,(0,0,0)),(st,(0,0,0)),(sc,(0,0,0))]:cyl(par,'joint pin',.17,.69,pos,S,'x')
  empty('boom_base',upper,(.23,.6,-1));empty('boom_tip',b,(.23,2.5,.24));hydraulic(upper,'hydraulic_boom','boom_base','boom_tip')
  empty('stick_base',b,(.21,1.7,-.28));empty('stick_tip',st,(.21,.75,.15));hydraulic(upper,'hydraulic_stick','stick_base','stick_tip')
  empty('bucket_base',st,(.2,1.6,-.27));empty('bucket_tip',sc,(.2,.43,.39));hydraulic(upper,'hydraulic_bucket','bucket_base','bucket_tip')
 elif i==1:
  cab(upper,(0,.45,1.05),O,True);box(upper,'engine cover',(2.2,.6,.9),(0,.3,1.35),O,.15)
  bed=empty('bed',r,(0,1.2,-1.75));box(bed,'tip floor',(2.35,.18,2.5),(0,0,1.1),O)
  for x in [-1.17,1.17]:
   box(bed,'flared side',(.16,.95,2.5),(x,.43,1.1),O);box(bed,'rolled rim',(.23,.13,2.65),(x,.96,1.1),O)
   for z in [.4,1.2,2]:box(bed,'side rib',(.1,.8,.12),(x*1.08,.45,z),Y,.03)
  for z in [-.12,2.37]:box(bed,'end wall',(2.4,.95,.15),(0,.43,z),O)
  empty('tip_base',r,(0,.8,.2));empty('tip_end',bed,(0,0,1.7));hydraulic(r,'hydraulic_tip','tip_base','tip_end')
 elif i==2:
  cab(upper,(0,.5,.65));box(upper,'engine hood',(1.9,.75,1.2),(0,.6,1.5),Y,.2);cyl(r,'articulation pin',.25,1,(0,1,0),S)
  b=empty('boom',r,(0,1.3,-1.1))
  for x in [-.8,.8]:box(b,'lift arm',(.19,.27,2.7),(x,.15,-1.15),Y);cyl(b,'arm pin',.15,.28,(x,0,0),S,'x')
  sc=bucket(b,2.6,(0,.1,-2.7))
  for j,x in enumerate([-.75,.75]):empty('lift_base'+str(j),r,(x,1.1,-.3));empty('lift_end'+str(j),b,(x,.2,-1.8));hydraulic(r,'hydraulic_lift'+str(j),'lift_base'+str(j),'lift_end'+str(j))
 elif i==3:
  cab(r,(0,1.2,-1.8));box(upper,'turntable',(2.2,.45,2.7),(0,.5,.8),Y);cab(upper,(-.7,.8,.7));b=empty('boom',upper,(.45,1.5,.8))
  for k in range(3):box(b,'telescoping section',(.64-k*.13,3.5,.65-k*.13),(0,1.75+k*2.4,0),Y)
  hook=empty('hook',b,(0,8.6,0));cyl(hook,'cable',.025,4,(0,-2,0),D);block=empty('hook_block',hook,(0,-4,0));box(block,'pulley block',(.45,.5,.35),(0,0,0),Y)
  bpy.ops.mesh.primitive_torus_add(major_radius=.2,minor_radius=.055,major_segments=16,minor_segments=6);o=finish(bpy.context.object,'steel hook',block,(0,-.35,0),S);o.rotation_euler[0]=math.pi/2
  for x in [-1,1]:
   for z in [-1.7,1.7]:
    leg=empty('leg',r,(x*1.1,1,z));box(leg,'outrigger',(1.4,.25,.3),(x*.6,0,0),S);cyl(leg,'jack',.13,.9,(x*1.2,-.4,0),Y);box(leg,'foot',(.65,.13,.65),(x*1.2,-.87,0),D)
  empty('crane_base',upper,(.6,.5,1));empty('crane_end',b,(.18,3,.25));hydraulic(upper,'hydraulic_crane','crane_base','crane_end')
 elif i==4:
  cab(r,(0,1.25,-1.5),WHITE);box(r,'front bumper',(2.3,.25,.25),(0,.85,-2.48),S);dr=empty('drum',r,(0,2.15,.7))
  cyl(dr,'mixing drum',1.05,2.3,(0,0,0),WHITE);cyl(dr,'rear cone',1.05,1.1,(0,-1.7,0),WHITE,r2=.4)
  for y in [-.8,0,.8]:cyl(dr,'yellow band',1.065,.14,(0,y,0),Y)
  cyl(r,'feed funnel',.5,.55,(0,2.45,2.3),S,r2=.7);sc=empty('scoop',r,(0,1.7,2.2))
  box(sc,'chute bed',(.65,.1,3),(0,0,1.5),S)
  for x in [-.32,.32]:box(sc,'chute side',(.07,.3,3),(x,.1,1.5),S)
  for z in [.7,1.3,1.9]:box(r,'ladder rung',(.7,.07,.12),(-1.1,z,1.9),S)
 elif i==5:
  cab(upper,(0,.6,.65),Y,True);box(r,'engine cover',(2.1,.6,1.1),(0,1.3,1.45),Y,.18)
  roll=empty('wheel_drum',r,(0,1,-1.8));roll['wheel_radius']=1;cyl(roll,'steel drum',1,2.6,(0,0,0),S,'x')
  for x in [-1.4,1.4]:box(r,'drum fork',(.17,.35,2),(x,1,-1.2),Y);cyl(r,'axle',.22,.2,(x,1,-1.8),D,'x')
  box(r,'scraper',(2.8,.12,.18),(0,1.5,-2.65),Y)
 # cargo is one named node so runtime can parent and style without touching machine paint
 load=empty('load',r);ball(load,'material load',.8,(0,0,0),SO,(1,.55,1))
# Scenery templates
print('ENVIRONMENT',flush=True);kit=empty('environment');roots.append(kit)
def prop(name):return empty(name,kit)
p=prop('tree');cyl(p,'trunk',.25,2.7,(0,1.3,0),TR,r2=.17)
for a in range(5):
 angle=a*math.tau/5;rod(p,'branch',(0,1.7,0),(math.sin(angle)*.9,3,math.cos(angle)*.9),.13,TR)
for j in range(19):
 a=j*2.4;rr=1.35*math.sqrt(j/19);ball(p,'foliage lobe',.85,(math.sin(a)*rr,3.2+(1-rr/1.5)*1.2,math.cos(a)*rr),LE if j%3 else LE2,(1,.9,1))
p=prop('bush')
for j in range(5):ball(p,'bush lobe',.6,((j%3-1)*.5,.4+(j//3)*.3,(j//3)*.4),LE2)
p=prop('cone');box(p,'foot',(.7,.09,.7),(0,.045,0),D);cyl(p,'orange cone',.29,.85,(0,.5,0),O,r2=.055);cyl(p,'white band',.18,.16,(0,.58,0),W,r2=.14)
p=prop('fence')
for x in [-2.5,2.5]:cyl(p,'post',.065,2.2,(x,1.1,0),S);box(p,'concrete foot',(.5,.18,.6),(x,.09,0),GR)
for y in [.25,2.05]:rod(p,'frame',(-2.5,y,0),(2.5,y,0),.045,S)
for j in range(16):rod(p,'wire',(-2.5+j/3,.25,0),(-2.5+j/3,2.05,0),.013,S)
for j in range(5):rod(p,'wire',(-2.5,.45+j*.32,0),(2.5,.45+j*.32,0),.013,S)
p=prop('pallet')
for x in [-.65,0,.65]:box(p,'pallet runner',(.2,.16,1.8),(x,.1,0),WO)
for j in range(6):box(p,'pallet plank',(1.6,.12,.22),(0,.24,-.75+j*.3),WO,.02)
p=prop('lumber')
for i in range(12):box(p,'timber',(.32,.23,4),(i%4*.35-.5,.18+i//4*.25,0),WO,.025)
p=prop('bricks')
for i in range(16):box(p,'brick',(.65,.3,.48),(i%2*.68-.34,.2+(i//4)*.32,(i//2%2)*.5-.25),BR,.035)
p=prop('pipe')
bpy.ops.mesh.primitive_torus_add(major_radius=.58,minor_radius=.14,major_segments=24,minor_segments=8);o=finish(bpy.context.object,'pipe',p,(0,.75,0),GR);o.scale.z=5;o.rotation_euler[0]=math.pi/2
p=prop('soil')
for j in range(17):ball(p,'earth clump',.7+(j%3)*.2,(math.sin(j*2.4)*(j%4)*.55,.15+(1-j/20)*.7,math.cos(j*2.4)*(j%4)*.55),SO,(1,.75,1))
p=prop('rock');ball(p,'rounded boulder',1,(0,.5,0),GR,(1,.7,.8))
p=prop('office');box(p,'site office',(7.7,2.8,3.8),(0,1.5,0),B,.15);box(p,'roof',(8.1,.22,4.2),(0,3,0),W);box(p,'door',(1.3,2.2,.1),(0,1.2,-1.96),WO)
for x in [-2.5,2.5]:box(p,'window frame',(1.8,1.3,.14),(x,1.7,-1.96),W);box(p,'window',(1.55,1.08,.05),(x,1.7,-2.05),G)
# Built projects: exact nine installation nodes, same footprints and step indices.
colors=['E6B77C','39B4AD','DF7056','EAB247','CC534A','78A8AD']
for project in range(6):
 print('PROJECT',project,flush=True);p=empty('project_'+str(project));roots.append(p);paint=material('Project paint '+str(project),colors[project],.65)
 for i in range(9):
  part=empty('part_'+str(i),p)
  if project==1:
   x=(i%2)*9-4.5;z=(i//2)*6-5
   if i<4:
    for a in [-1,1]:
     for b in [-1,1]:cyl(part,'tower post',.13,3.6,(x+a,1.8,z+b),WO)
    box(part,'play deck',(2.4,.22,2.4),(x,2,z),paint)
    roof=box(part,'canopy',(2.9,.32,2.9),(x,3.6,z),Y)
    for j in range(6):rod(part,'ladder rung',(x-.8,.3+j*.3,z+1.15),(x+.8,.3+j*.3,z+1.15),.06,WO)
   elif i<6:
    x=4.5 if i==5 else -4.5;o=box(part,'slide',(1.4,.15,5),(x,1,-1.5),O);o.rotation_euler[0]=.4
    for a in [-.72,.72]:o=box(part,'slide rail',(.12,.3,5),(x+a,1.2,-1.5),Y);o.rotation_euler[0]=.4
   else:
    x=(i-6)*4-4
    for a in [-1.2,1.2]:rod(part,'swing support',(x+a,0,-9),(x+a,2.7,-9),.09,B)
    rod(part,'swing beam',(x-1.3,2.7,-9),(x+1.3,2.7,-9),.1,Y)
    for a in [-.4,.4]:rod(part,'rope',(x+a,2.65,-9),(x+a,.7,-9),.025,D)
    box(part,'swing seat',(1.1,.13,.6),(x,.65,-9),O)
  elif project==2:
   if i<4:box(part,'bridge pier',(1.9,3,4),(-6+i*4,1,-2),GR,.2);box(part,'cap',(2.4,.35,4.4),(-6+i*4,2.5,-2),W)
   elif i<6:
    z=-3.25+(i-4)*2.5;box(part,'deck beam',(16,.6,2.5),(0,2.5,z),B)
    for j in range(17):box(part,'deck plank',(.85,.12,2.45),(-7.5+j*.9,2.86,z),WO,.025)
   else:
    x=-5.3+(i-6)*5.3
    for z in [-4.6,.6]:
     rod(part,'handrail',(x-2.6,4,z),(x+2.6,4,z),.075,paint)
     for j in range(6):rod(part,'railing',(x-2.5+j,2.9,z),(x-2.5+j,4,z),.04,W)
  else:
   h=9 if project==5 else 5 if project==3 else 3.5
   if i<4:
    side=i<2;x=0 if side else (-7.5 if i==2 else 7.5);z=(-7.8 if i==0 else 3.8) if side else -2
    box(part,'wall',(15 if side else .3,h,.3 if side else 11.7),(x,h/2+.3,z),paint,.05)
    box(part,'foundation trim',(15.2 if side else .4,.4,.4 if side else 11.9),(x,.5,z),W)
    for level in range(3 if project==5 else 1):
     for k in range(5 if side else 3):
      xx=-5.6+k*2.8 if side else x+(-.2 if i==2 else .2);zz=z+(-.2 if i==0 else .2) if side else -5.5+k*3.4;y=1.8+level*2.7
      box(part,'window frame',(1.9 if side else .12,1.9,.12 if side else 1.9),(xx,y,zz),W,.03)
      box(part,'blue window',(1.62 if side else .15,1.62,.15 if side else 1.62),(xx,y,zz),G,.02)
      box(part,'window mullion',(.07 if side else .18,1.7,.18 if side else .07),(xx,y,zz),W,.01)
   elif i<6:
    z=-5+(i-4)*6
    for s in [-1,1]:
     o=box(part,'roof half',(8.8,.22,6.5),(s*4,h+1.5,z),B);o.rotation_euler[1]=s*.3
     for k in range(8):
      o=box(part,'roof seam',(.06,.08,6.5),(s*(.3+k*1.05),h+2.65-k*.32,z),B,.01)
    # Close each outer gable under the sloping roof.
    gz=-8.2 if i==4 else 4.2
    verts=[cv((x,y,gz+dz)) for dz in [-.12,.12] for x,y in [(-8,h+.3),(8,h+.3),(0,h+2.74)]]
    data=bpy.data.meshes.new('gable mesh');data.from_pydata(verts,[],[(0,2,1),(3,4,5),(0,1,4,3),(1,2,5,4),(2,0,3,5)]);data.update();obj=bpy.data.objects.new('painted gable',data);bpy.context.collection.objects.link(obj);obj.parent=part;data.materials.append(paint)
   elif i==8:
    box(part,'door frame',(4.3 if project==4 else 2,2.9,.22),(0,1.7,4.03),W);box(part,'door',(4 if project==4 else 1.7,2.65,.25),(0,1.6,4.1),B)
    cyl(part,'door knob',.07,.08,(.55,1.45,4.26),S,'z')
   else:
    x=-4.5 if i==6 else 4.5;box(part,'planter',(2,.4,.6),(x,.7,4.2),WO)
    for j in range(7):ball(part,'flowers',.18,(x-.8+j*.25,1,4.2),O if j%2 else LE)
# Merge fixed meshes per pivot/material. Keeps every articulated node but ~80% fewer draw calls.
print("MERGING",flush=True)
for parent in [o for o in bpy.data.objects if o.type=='EMPTY']:
 batches={}
 for o in list(parent.children):
  if o.type=='MESH' and not o.name.startswith('beacon'):batches.setdefault(o.data.materials[0].name,[]).append(o)
 for obs in batches.values():
  if len(obs)<2:continue
  bpy.ops.object.select_all(action='DESELECT')
  for o in obs:o.select_set(True)
  obs[0].data=obs[0].data.copy();bpy.context.view_layer.objects.active=obs[0];bpy.ops.object.join()
# Initial track positions and neutral presentation pose; export neutral articulated rotations.
def pose_track(o):
 half=o['track_half'];q=o['track_phase']*(4*half+math.tau*.44);r=.44
 if q<2*half:y=.58+r;z=-half+q;a=0
 elif q<2*half+math.pi*r:
  a=(q-2*half)/r;y=.58+r*math.cos(a);z=half+r*math.sin(a)
 elif q<4*half+math.pi*r:y=.58-r;z=half-(q-2*half-math.pi*r);a=math.pi
 else:
  a=math.pi+(q-4*half-math.pi*r)/r;y=.58+r*math.cos(a);z=-half+r*math.sin(a)
 o.location=cv((o['track_x'],y,z));o.rotation_euler[0]=a
for o in bpy.data.objects:
 if 'track_phase' in o:pose_track(o)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender'/'construction.blend'),compress=True)
for root in roots:
 bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
 for o in root.children_recursive:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(ROOT/'models'/f'{root.name}.glb'),use_selection=True,export_format='GLB',export_extras=True,export_yup=True)
# Pack originals and a consistent studio for thumbnails.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=128;scene.cycles.use_denoising=False;scene.render.resolution_x=384;scene.render.resolution_y=256;scene.render.resolution_percentage=100;scene.render.film_transparent=True
scene.world.color=(.45,.55,.65)
for name,pos,power,size in [('Key',(-6,7,-4),1600,7),('Fill',(5,6,2),1000,6)]:
 data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.location=cv(pos);o.rotation_euler=(cv((0,1,0))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=10;cam.location=cv((8,6,-10));cam.rotation_euler=(cv((0,2,0))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.view_settings.view_transform='Standard';scene.view_settings.exposure=-.6
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender'/'construction.blend'),compress=True)
for root in roots:
 for obj in [root]+list(root.children_recursive):obj.hide_render=True
for i,root in enumerate(roots[:6]):
 for obj in [root]+list(root.children_recursive):obj.hide_render=False
 def named(n):return next((o for o in root.children_recursive if o.name.split('.')[0]==n),None)
 b=named('boom');st=named('stick');sc=named('scoop');dr=named('drum')
 if b:b.rotation_euler[0]=-.7 if i==0 else -.9 if i==3 else 0
 if st:st.rotation_euler[0]=-1.65
 if sc and i==0:sc.rotation_euler[0]=1.5
 if dr:dr.rotation_euler[0]=math.pi/2+.25
 load=named('load')
 for obj in [load]+list(load.children_recursive):obj.hide_render=True
 bpy.context.view_layer.update()
 for h in root.children_recursive:
  if 'hydraulic_a' not in h:continue
  a=named(h['hydraulic_a']);b=named(h['hydraulic_b']);q=named(h.name.split('.')[0]+'_rod');va=h.parent.matrix_world.inverted()@a.matrix_world.translation;vb=h.parent.matrix_world.inverted()@b.matrix_world.translation;v=vb-va;h.location=va;h.rotation_mode='QUATERNION';h.rotation_quaternion=Vector((0,0,1)).rotation_difference(v.normalized());h.scale.z=v.length*.57;q.location=va+v*.45;q.rotation_mode='QUATERNION';q.rotation_quaternion=h.rotation_quaternion;q.scale.z=v.length*.55
 cam.data.ortho_scale=12 if i==3 else 8.5
 scene.render.filepath=str(ROOT/'thumbnails'/f'{root.name}.png');bpy.ops.render.render(write_still=True)
 for obj in [root]+list(root.children_recursive):obj.hide_render=True
print('BUILD_COMPLETE')

exec((ROOT/'blender'/'organize.py').read_text())
