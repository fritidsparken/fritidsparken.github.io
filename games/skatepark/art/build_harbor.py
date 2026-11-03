"""Run in Blender's Python console. Leaves the user's original scene intact."""
import bpy
import math
import random
from pathlib import Path
from mathutils import Vector

root = Path(__file__).resolve().parent
rng = random.Random(332)
collection = bpy.data.collections.new("Soliga skateparken • Stadsgården")
bpy.context.scene.collection.children.link(collection)
verts, faces, slots, palette = [], [], [], {}
def material(name, color, rough=.78, metal=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    shader = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = rough
    shader.inputs['Metallic'].default_value = metal
    palette[name] = (len(palette), m)
    return name

def solid(points, polygons, mat):
    start = len(verts)
    verts.extend((x,-z,y) for x,y,z in points)
    for poly in polygons:
        faces.append(tuple(start+i for i in poly))
        slots.append(palette[mat][0])

def box(x,y,z,w,h,d,m):
    points = [(x+i*w/2,y+j*h/2,z+k*d/2) for i,j,k in
              [(-1,-1,-1),(1,-1,-1),(1,-1,1),(-1,-1,1),(-1,1,-1),(1,1,-1),(1,1,1),(-1,1,1)]]
    solid(points,[(0,1,2,3),(7,6,5,4),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],m)

def turned(x,z,rings,m,n=16):
    pp=[(x+math.cos(i*math.tau/n)*r,y,z+math.sin(i*math.tau/n)*r) for y,r in rings for i in range(n)]
    ff = [(a*n+i,(a+1)*n+i,(a+1)*n+(i+1)%n,a*n+(i+1)%n) for a in range(len(rings)-1) for i in range(n)]
    ff += [tuple(range(n)),tuple(range(len(pp)-1,len(pp)-n-1,-1))]
    solid(pp,ff,m)

stone = [material('Granit '+str(i),(v*.98,v*.93,v*.86)) for i,v in enumerate([.26,.30,.34,.37])]
iron = material('Gjutjärn',(.065,.075,.073),.46,.35)
trim = material('Kalksten',(.64,.57,.44))
glass = [material('Fönsterglas '+str(i),c,.3,.16) for i,c in enumerate([(.14,.21,.23),(.22,.29,.29),(.095,.14,.15)])]
roofs = [material('Takplåt',(.135,.15,.155),.52,.2),material('Ärgad koppar',(.15,.245,.195),.63,.13)]
walls = [material('Puts '+str(i),c) for i,c in enumerate([(.57,.36,.20),(.68,.54,.34),(.63,.41,.33),(.52,.47,.35)])]
water = [material('Saltsjön '+str(i),c,.27,.18) for i,c in enumerate([(.092,.19,.23),(.10,.205,.245),(.085,.178,.21)])]
wood = material('Oljat trä',(.26,.157,.091))
white = material('Färja elfenben',(.76,.74,.65),.48)
blue = material('Färja skrov',(.037,.075,.115),.4,.18)
rust = material('Skorsten ockra',(.61,.285,.072))
# Quay courses and individually offset granite coping stones.
box(0,-.73,-56,155,1.42,8,stone[1])
for i in range(76):
    x=-76+i*2.03
    box(x,.045,-59.8,2.015,.16,1.05,rng.choice(stone))
    if i%4==0:
        turned(x,-59.3,[(.12,.30),(.19,.29),(.21,.18),(.53,.14),(.6,.21),(.69,.23),(.71,.19)],iron)
for i in range(20):
    x=-78+i*8
    for j in range(7):
        z=-60-j*8
        p=[(x+a,-1.08+.038*math.sin((x+a)*.42+(z-b)*.65),z-b) for a,b in [(0,0),(8,0),(8,8),(0,8)]]
        solid(p,[(0,1,2),(0,2,3)], water[rng.choices(range(3),weights=[8,1,1])[0]])
# Rocky escarpment behind the park, with continuous irregular facets.
for i in range(38):
    def ridge(k,r):
        x=-85+k*4.6
        return (x+.48*math.sin(k*8+r),[-.6,3.3,7.1,9][r]+(.1+r*.36)*math.sin(k*.65+r),[54,57,59.5,66][r]+1.2*math.cos(k*.8+r))
    for r in range(3):
        pp=[ridge(i,r),ridge(i+1,r),ridge(i+1,r+1),ridge(i,r+1)]
        solid(pp,[(2,1,0)],rng.choice(stone))
        solid(pp,[(3,2,0)],rng.choice(stone))
# Södermalm-inspired facades above the exposed rock.
for j in range(11):
    x=-72+j*14.5; z=68+j%3; base=8.2; levels=3+(j*7)%3; h=levels*2.85+1
    box(x,base+h/2,z,14.15,h,9,walls[j%4])
    box(x,base+h-.12,z,14.48,.34,9.48,trim)
    e=base+h
    points=[(x+a,e+y,z+b) for a,y,b in [(-7.27,0,-4.75),(7.27,0,-4.75),(7.27,0,4.75),(-7.27,0,4.75),(-5.5,2.6,0),(5.5,2.6,0)]]
    solid(points,[(0,4,5,1),(1,5,2),(2,5,4,3),(3,4,0)],roofs[j%2])
    box(x+3,e+2.6,z,.82,2.5,1.02,walls[j%4])
    box(x+3,e+3.86,z,.99,.18,1.19,iron)
    for row in range(levels):
        for col in range(5):
            xx=x-5.4+col*2.7; yy=base+1.65+row*2.85
            box(xx,yy,z-4.54,1.47,2.03,.14,trim)
            box(xx,yy,z-4.64,1.18,1.77,.11,rng.choice(glass))
            box(xx,yy,z-4.72,.075,1.78,.065,trim)
            box(xx,yy+.23,z-4.72,1.23,.072,.065,trim)
            box(xx,yy-1.03,z-4.65,1.62,.15,.36,trim)
# Ferry alongside the quay. Cross sections taper to the bow.
bx,bz=-20,-66
rings=[(-9,.64),(-8,1.66),(-5,1.98),(3,2.03),(6.6,1.63),(9,.12)]
p=[(bx+x,y,bz+s*w*k) for x,w in rings for s,y,k in [(-1,-1.42,.68),(-1,.06,1),(1,.06,1),(1,-1.42,.68)]]
f=[(i*4+k,i*4+(k+1)%4,(i+1)*4+(k+1)%4,(i+1)*4+k) for i in range(len(rings)-1) for k in range(4)]
solid(p,f+[(3,2,1,0),(20,21,22,23)],blue)
box(bx-.8,.91,bz,13.8,1.76,3.54,white)
for k in range(12):
    box(bx-7+k*1.09,1.1,bz,.89,.98,3.57,glass[k%3])
box(bx-.8,1.87,bz,14.4,.22,3.92,wood)
box(bx+3.4,2.48,bz,3.72,1.21,2.82,white)
box(bx+3.4,2.61,bz,3.77,.57,2.87,glass[0])
box(bx+3.4,3.13,bz,4,.14,3.1,white)
turned(bx-2,bz,[(1.9,.49),(3.7,.4)],rust)
turned(bx-2,bz,[(3.7,.41),(4,.42)],iron)
for x in range(-48,52,12):
    turned(x,-55.5,[(0,.23),(.25,.21),(.4,.14),(4.24,.09)],iron)
    turned(x,-55.5,[(4.22,.18),(4.34,.28),(4.68,.21)],white)
    turned(x,-55.5,[(4.68,.31),(4.84,.15),(4.91,.04)],iron)
# The opposite shoreline breaks the horizon behind the ferry.
box(0,-.74,-108,196,1.25,6,stone[0])
for j in range(16):
    x=-91+j*12.2; z=-110-rng.random()*2; height=8.4+(j*5)%7
    box(x,height/2,z,11.8,height,6,walls[(j+2)%4])
    box(x,height-.16,z,12.02,.3,6.3,trim)
    pts=[(x+a,height+y,z+b) for a,y,b in [(-6,0,-3.3),(6,0,-3.3),(6,0,3.3),(-6,0,3.3),(-4.3,1.9,0),(4.3,1.9,0)]]
    solid(pts,[(0,4,5,1),(1,5,2),(2,5,4,3),(3,4,0)],roofs[j%2])
    for row in range(int(height/2.7)):
        for col in range(5):
            box(x-4.7+col*2.36,1.52+row*2.69,z+3.03,1.04,1.62,.09,glass[(j+col+row)%3])
            box(x-4.7+col*2.36,0.69+row*2.69,z+3.13,1.27,.11,.24,trim)

mesh=bpy.data.meshes.new('Stadsgårdens kajmiljö')
mesh.from_pydata(verts,[],faces)
mesh.update()
obj=bpy.data.objects.new('Stadsgårdens kajmiljö',mesh)
collection.objects.link(obj)
for _,m in palette.values(): mesh.materials.append(m)
for poly,idx in zip(mesh.polygons,slots): poly.material_index=idx
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active=obj
bpy.ops.export_scene.gltf(filepath=str(root/'stadsgarden.glb'),use_selection=True,export_format='GLB',export_cameras=False,export_animations=False)
