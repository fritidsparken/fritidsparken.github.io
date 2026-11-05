"""Build Solkajen GLB: blender -b -P tools/blender/skatepark/solkajen.py (from repo root)."""
import bpy, json, math, random, subprocess
from pathlib import Path
from mathutils import Vector
from math import sin, cos, pi
random.seed(51)
root=Path.cwd()
# Sample the actual game surfaces, including grind bars, in metres.
sample="""
import {parks,surface,railPoint} from './games/skatepark/model.js';
const park=parks[4], shapes=park.shapes.filter(s=>!['kidney','bowl'].includes(s[0]));
const surfaces=shapes.map(s=>{
 const [kind,x,z,w,d]=s,nx=Math.ceil(w*1.7),nz=Math.ceil(d*2.5);
 const xs=Array.from({length:nx+1},(_,i)=>x-w/2+w*i/nx);
 const zs=Array.from({length:nz+1},(_,i)=>z-d*(kind==='mega'?.58:.5)+d*(kind==='mega'?1.08:1)*i/nz);
 if(kind==='steps')for(let i=1;i<7;i++){const edge=z-d/2+d*i/7;zs.push(edge-.005,edge+.005)}
 zs.sort((a,b)=>a-b);
 return {kind,x,z,w,d,xs,zs,ys:zs.map(b=>xs.map(a=>surface(s,a,b)))};
});
const grid=Array.from({length:209},(_,j)=>Array.from({length:225},(_,i)=>{
 const x=i*.5-56,z=j*.5-52;
 return park.shapes.filter(s=>s[5]<0).reduce((y,s)=>y+surface(s,x,z),0);
}));
console.log(JSON.stringify({grid,surfaces,loop:park.loops[0],rails:park.rails.map(r=>[railPoint(park,r,0),railPoint(park,r,1)])}));
"""
data=json.loads(subprocess.check_output(['node','--input-type=module','-e',sample],cwd=root))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
palette={'concrete':'bcb9b6','step':'aea9a4','edge':'ff8529','metal':'454e56','red':'b34227','board':'c28d62','board2':'d2a27a','dark':'293c4c','aqua':'36c4c8','pink':'df60a5','yellow':'fac558','white':'e8e8de','leaf':'648447','stone':'adab98','violet':'766bb1'}
mats={}
for name,color in palette.items():
 m=bpy.data.materials.new(name);rgb=[int(color[i:i+2],16)/255 for i in (0,2,4)]
 m.diffuse_color=tuple(((v+.055)/1.055)**2.4 if v>.04045 else v/12.92 for v in rgb)+(1,)
 m.use_backface_culling=False;m.roughness=.49 if name=='metal' else .82;mats[name]=m
verts=[];faces=[];indices=[]
def pt(p):return (p[0],-p[2],p[1])
def face(points,mat):
 idx=len(verts);verts.extend(pt(p) for p in points);faces.append(tuple(range(idx,len(verts))));indices.append(list(mats).index(mat))
def box(x,y,z,w,h,d,mat):
 pts=[(x+i*w/2,y+j*h/2,z+k*d/2) for i,j,k in [(-1,-1,-1),(1,-1,-1),(1,-1,1),(-1,-1,1),(-1,1,-1),(1,1,-1),(1,1,1),(-1,1,1)]]
 for ids in [(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]:face([pts[i] for i in ids],mat)
def rod(a,b,r,mat,sides=8):
 a,b=Vector(a),Vector(b);axis=(b-a).normalized();u=axis.cross(Vector((0,1,0)) if abs(axis.y)<.9 else Vector((1,0,0))).normalized()*r;v=axis.cross(u)
 ring=[cos(i*2*pi/sides)*u+sin(i*2*pi/sides)*v for i in range(sides)]
 for i,j in enumerate(ring):k=ring[(i+1)%sides];face([a+j,a+k,b+k,b+j],mat)
def flush(name):
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces)
 for m in mats.values():mesh.materials.append(m)
 for poly,index in zip(mesh.polygons,indices):poly.material_index=index
 ob=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(ob)
 verts.clear();faces.clear();indices.clear()
for s in data['surfaces']:
 xs,zs,ys=s['xs'],s['zs'],s['ys'];kind=s['kind']
 for j in range(len(zs)-1):
  for i in range(len(xs)-1):
   corners=[(xs[a],ys[b][a],zs[b]) for a,b in [(i,j),(i,j+1),(i+1,j+1),(i+1,j)]]
   if max(q[1] for q in corners)<.009:continue
   mat='step' if kind=='steps' and max(q[1] for q in corners)-min(q[1] for q in corners)>.1 else 'concrete'
   if kind=='mega':mat='board' if j%5 else 'board2'
   if kind in ('manual','funbox') and i in (2,len(xs)-4):mat='edge'
   face(corners,mat)
flush('Transitions, trappor och streetplaza')
l=data['loop']
def loop(a,side,extra):
 r=l['r']+extra
 return (l['x']+r*sin(a),.035+l['r']-r*cos(a),l['z']+l['drift']*(a-sin(a))/(2*pi)+side*2.05)
for i in range(112):
 a,b=i*2*pi/112,(i+1)*2*pi/112
 face([loop(a,-1,0),loop(b,-1,0),loop(b,1,0),loop(a,1,0)],'board' if i%4 else 'board2')
 for j in range(12):
  u,v=-1+j/6,-1+(j+1)/6
  col=['aqua','dark','pink','white','yellow','violet'][int((i/4+3*sin(j*.68+i*.12)+j*.6)%6)]
  face([loop(a,u,.22),loop(a,v,.22),loop(b,v,.22),loop(b,u,.22)],col)
 for side in (-1,1):face([loop(a,side,0),loop(a,side,.22),loop(b,side,.22),loop(b,side,0)],'aqua')
for a,b in data['rails']:
 a,b=Vector(a),Vector(b);rod(a,b,.075,'red')
 span=(b-a).length
 supports=max(1,math.ceil(span/3.5))
 for t in [(k+.5)/supports for k in range(supports)]:
  p=a.lerp(b,t);rod((p.x,0,p.z),p,.045,'metal')
flush('Graffitiloop och grindrails')
# Floodlight masts and textile pennants around the outer deck.
for n,(x,z) in enumerate([(-53,32),(-51,-20),(-24,-49),(5,-50),(50,-47),(54,2),(51,48)]):
 rod((x,0,z),(x,10,z),.10,'metal')
 for dx in (-.74,0,.74):
  box(x+dx,10,z,.62,.36,.45,'dark');box(x+dx,9.96,z+.235,.5,.23,.025,'white')
 rod((x,8.6,z),(x+2.4,8.6,z),.045,'metal')
 for j in range(8):
  u,v=j/8,(j+1)/8
  face([(x+.18+2*u,y,z+.2*sin(u*4)) for u,y in [(u,8.55),(v,8.55),(v,5.2+.24*v),(u,5.2+.24*u)]],('violet','yellow','aqua')[n%3] if j<6 else 'white')
# Elevated rear ramp decks and stair tower behind the coping.
for x,z,w,h in [(36,-46,16,12),(22,-42.5,7,6.2)]:
 for dx in (-w/2,w/2):
  for dz in (-1.5,1.5):rod((x+dx,0,z+dz),(x+dx,h+1.15,z+dz),.115,'metal')
 rod((x-w/2,h+1.15,z-1.5),(x+w/2,h+1.15,z-1.5),.08,'metal')
 box(x,h-.15,z,w,.3,3,'board2')
for i in range(40):box(47,i*.3,-32-i*.37,1.7,.23,.44,'metal')
for side in (-1,1):rod((47+side*.85,.85,-32),(47+side*.85,12.65,-46.6),.06,'metal')
# Outdoor café furniture, umbrellas and tables by the clubhouse.
for n,(x,z) in enumerate([(-48,-12),(-51,-4),(-48,5),(-51,13)]):
 rod((x,0,z),(x,3.1,z),.055,'metal');box(x,.88,z,2.8,.13,1.15,'board')
 for dx in (-1,1):
  for dz in (-.34,.34):box(x+dx,.43,z+dz,.12,.86,.12,'metal')
 box(x,.045,z,.7,.09,.7,'stone')
 for side in (-1,1):
  box(x,.49,z+side*.95,2.8,.12,.4,'board2')
  for dx in (-.95,.95):rod((x+dx,.04,z+side*1.05),(x+dx,.87,z+side*.33),.05,'metal')
 for i in range(10):
  a,b=2*pi*i/10,2*pi*(i+1)/10
  face([(x,3.25,z),(x+2*cos(a),2.73,z+2*sin(a)),(x+2*cos(b),2.73,z+2*sin(b))],'yellow' if n%2==0 else 'aqua')
flush('Ljusmaster, vimplar, utsiktstorn och uteservering')
# Arched pedestrian bridge and the planted riverbank behind the bowls.
for z in (-58,-61):
 for i in range(20):
  def arch(t):return (1+31*t,1.4+5.6*sin(pi*t),z)
  rod(arch(i/20),arch((i+1)/20),.17,'metal')
  if i%2==0:
   x,y,_=arch(i/20);rod((x,.9,z),(x,y,z),.065,'metal')
 rod((1,.9,z),(32,.9,z),.12,'metal')
box(16.5,.75,-59.5,32,.3,3.4,'board')
# Basalt stones, grasses and flowering spikes, clustered in perimeter beds.
for bx,bz in [(51,26),(51,38),(48,45),(-49,32),(-51,22),(-47,-36),(-36,-42),(16,-47)]:
 for i in range(8):
  x,z=bx+random.uniform(-2,2),bz+random.uniform(-2,2)
  radius=random.uniform(.3,.95);ring=[(x+radius*cos(j*pi/3),.08,z+radius*.7*sin(j*pi/3)) for j in range(6)]
  for j in range(6):face([ring[j],ring[(j+1)%6],(x+.12,radius*.83,z+.06)],'stone')
 for i in range(32):
  x,z=bx+random.uniform(-2.8,2.8),bz+random.uniform(-2.6,2.6);h=random.uniform(.32,.96)
  face([(x-.15,0,z),(x+.12,0,z+.05),(x+.25,h,z-.18)],'leaf')
  if i%4==0:rod((x,h*.45,z),(x+.09,h,z),.047,'violet',5)
flush('Bågbron och strandrabatter')
# Shared vertices keep the carved bowl transitions smooth.
grid=data['grid']
cols=len(grid[0])
points=[pt((i*.5-56,y,j*.5-52)) for j,row in enumerate(grid) for i,y in enumerate(row)]
cells=[(a,a+cols,a+cols+1,a+1) for j in range(len(grid)-1) for i in range(cols-1) for a in [j*cols+i]]
mesh=bpy.data.meshes.new('Bowlar och betongplatta')
mesh.from_pydata(points,[],cells)
mesh.materials.append(mats['concrete'])
for poly in mesh.polygons:poly.use_smooth=True
bpy.context.collection.objects.link(bpy.data.objects.new('SolkajenPlaza',mesh))
out=root/'games/skatepark/solkajen/park.glb' 
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',export_texcoords=False,export_normals=True)
