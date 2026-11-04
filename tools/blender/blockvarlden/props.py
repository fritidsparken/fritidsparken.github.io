"""Build the Blockvärlden prop kit with Blender 4.3: blender -b -P tools/blender/blockvarlden/props.py"""
import bpy
import json
import math
import random
import struct
from pathlib import Path
from mathutils import Euler, Vector

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "assets/blockvarlden/props"
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
rng = random.Random(747)
registry = []
palette = {
    'bark': '#644132', 'bark2':'#886044', 'end':'#c69d65', 'rings':'#996e45',
    'timber':'#a56942', 'edge':'#d29859', 'lightwood':'#dfae70', 'oak':'#507d47',
    'oak2':'#6e9a4e', 'oak3':'#91ae56', 'fir':'#305f55', 'fir2':'#487960',
    'palm':'#49a56d', 'palm2':'#78b756', 'grass':'#80a349', 'stalk':'#587840',
    'stone':'#788a88', 'slate':'#536c74', 'cream':'#f4e6c3', 'red':'#d55649',
    'amber':'#f1ad41', 'iron':'#455662', 'steel':'#9bbab8', 'gold':'#d6a455',
    'fabric':'#257a80', 'cloth':'#549c9d', 'plum':'#644c67', 'leather':'#93573e',
    'black':'#323c43', 'glass':'#9cdbdd', 'glow':'#ffe49a', 'water':'#69b9c6',
    'berry':'#a84b6b', 'pink':'#e995a5', 'soil':'#705044', 'tile':'#b56c54'
}
def linear(value):
    c = value / 255
    return c / 12.92 if c <= .04045 else ((c+.055)/1.055)**2.4
def rgb(color):
    s=palette.get(color,color).lstrip('#')
    return tuple(linear(int(s[i:i+2],16)) for i in (0,2,4))
materials = []
for name, rough, metal in [('Handmålad yta',.86,0),('Borstad metall',.43,.58),('Lyktsken',.38,0),('Färgat glas',.22,.16)]:
    m=bpy.data.materials.new(name)
    m.use_nodes=True
    shader=m.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Roughness'].default_value=rough
    shader.inputs['Metallic'].default_value=metal
    attr=m.node_tree.nodes.new('ShaderNodeVertexColor')
    attr.layer_name='Kulör'
    m.node_tree.links.new(attr.outputs['Color'],shader.inputs['Base Color'])
    if name=='Lyktsken':
        shader.inputs['Emission Color'].default_value=(*rgb('glow'),1)
        shader.inputs['Emission Strength'].default_value=.75
    materials.append(m)
def start(id, title, group):
    global vs, polygons, colors, slots, current
    vs=[]; polygons=[]; colors=[]; slots=[]
    current=id
    registry.append(dict(id=id,name=title,category=group,node=id,license="CC0-1.0",path="assets/blockvarlden/props/explorer-kit.glb"))
def finish():
    mesh=bpy.data.meshes.new(current)
    base_z = min(p[2] for p in vs)
    mesh.from_pydata([(x, y, z - base_z) for x, y, z in vs], [], polygons)
    mesh.update()
    ob=bpy.data.objects.new(current,mesh)
    bpy.context.collection.objects.link(ob)
    for m in materials: mesh.materials.append(m)
    layer=mesh.color_attributes.new(name='Kulör',type='BYTE_COLOR',domain='CORNER')
    uv=mesh.uv_layers.new(name='Planar')
    for face,color,slot in zip(mesh.polygons,colors,slots):
        face.material_index=slot
        axis=max(range(3),key=lambda i:abs(face.normal[i]))
        for li in face.loop_indices:
            layer.data[li].color=(*color,1)
            p=mesh.vertices[mesh.loops[li].vertex_index].co
            uv.data[li].uv=(p[(axis+1)%3],p[(axis+2)%3])
    registry[-1]["triangles"]=sum(len(p)-2 for p in polygons)
def shape(points, faces, color, center, rot=(0,0,0), slot=0):
    offset=len(vs)
    rotation=Euler(rot).to_matrix()
    for point in points: vs.append(tuple(rotation @ Vector(point)+Vector(center)))
    base=rgb(color)
    for face in faces:
        polygons.append(tuple(offset+i for i in face))
        # Small per-facet pigment shifts retain a coherent hand-painted material.
        k=rng.uniform(.92,1.06)
        colors.append(tuple(min(1,c*k) for c in base))
        slots.append(slot)
def box(center, size, color, rot=(0,0,0), slot=0, bevel=.04):
    w,d,h=size
    # Octagonal plan trims vertical edges. A narrow upper bevel catches skylight.
    b=min(w*.13,d*.13,h*.22,bevel)
    rings=[]
    for z,inset in [(-h/2,0),(h/2-b*.5,0),(h/2,b*.55)]:
        x=w/2-inset; y=d/2-inset; t=max(.0001,b-inset*.6)
        rings.extend([(-x+t,-y,z),(x-t,-y,z),(x,-y+t,z),(x,y-t,z),(x-t,y,z),(-x+t,y,z),(-x,y-t,z),(-x,-y+t,z)])
    faces=[tuple(reversed(range(8))),tuple(range(16,24))]
    for level in (0,8):
        for i in range(8): faces.append((level+i,level+(i+1)%8,level+(i+1)%8+8,level+i+8))
    shape(rings,faces,color,center,rot,slot)
def taper(center,r1,r2,h,color,n=7,rot=(0,0,0),slot=0):
    points=[(math.cos(i*math.tau/n)*r,math.sin(i*math.tau/n)*r,z) for z,r in ((-h/2,r1),(h/2,r2)) for i in range(n)]
    faces=[tuple(reversed(range(n))),tuple(range(n,n*2))]
    faces.extend((i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n))
    shape(points,faces,color,center,rot,slot)
def stem(a,b,rad,color,rad2=None,n=6,slot=0):
    p=Vector(a); q=Vector(b); v=q-p
    taper(tuple((p+q)/2),rad,rad if rad2 is None else rad2,v.length,color,n,v.to_track_quat('Z','Y').to_euler(),slot)
def crown(c,scale,color,n=7):
    sx,sy,sz=scale
    points=[]
    for z,r,phase in ((-.7,.59,0),(-.2,1,.2),(.45,.85,-.1),(.78,.38,.1)):
        for j in range(n):
            a=j*math.tau/n+phase
            points.append((math.cos(a)*r*sx,math.sin(a)*r*sy,z*sz))
    faces=[tuple(reversed(range(n))),tuple(range(3*n,4*n))]
    for level in range(3):
        for i in range(n):
            a=level*n+i; b=level*n+(i+1)%n
            faces.extend(((a,b,b+n),(a,b+n,a+n)))
    shape(points,faces,color,c)
def branch(a,b,r=.11): stem(a,b,r,'bark2',r*.5)
def leaf(a,b,width,color):
    p=Vector(a); q=Vector(b); v=q-p
    side=Vector((-v.y,v.x,0)).normalized()*width
    mid=p+v*.43; mid.z+=width*.38
    local=[(0,0,0),tuple(mid+side-p),tuple(q-p),tuple(mid-side-p),tuple(mid-p+Vector((0,0,width*.3)))]
    shape(local,[(0,3,4),(3,2,4),(2,1,4),(1,0,4),(0,1,2,3)],color,a)
def legs(w,d,h):
    for x in (-w/2,w/2):
        for y in (-d/2,d/2): box((x,y,h/2),(.10,.10,h),'bark2')
def planks(w,d,z,n=4):
    for i in range(n):
        x=-w/2+w/n*(i+.5)
        box((x,0,z),(w/n-.012,d,.095),'edge' if i%3==1 else 'timber')
def obj(id,title,group="Inredning"): start(id,title,group)
obj('oak','Ängsek','Vegetation')
stem((0,0,0),(.08,0,2.6),.34,'bark',.19,8)
for i in range(7):
    a=i*math.tau/7
    x,y=math.cos(a),math.sin(a)
    branch((0,0,1.35+i*.07),(x*.82,y*.82,2.5+i*.05),.15)
    crown((x*.86,y*.86,2.7+i*.06),(.88,.91,.97),['oak','oak2','oak3'][i%3])
crown((.12,0,3.45),(1.19,1.03,.97),'oak2')
for i in range(5):
    a=i*math.tau/5; branch((0,0,.34),(.57*math.cos(a),.57*math.sin(a),.03),.18)
finish()
obj('pine','Dagggran','Vegetation')
taper((0,0,1.62),.23,.11,3.24,'bark')
for i in range(4):
    z=1+i*.69; r=1.13-i*.19
    taper((0,0,z+.62),r,r*.06,1.42,'fir' if i%2==0 else 'fir2',9,rot=(0,0,i*.27))
    for j in range(6):
        a=j*math.tau/6+i
        crown((r*.67*math.cos(a),r*.67*math.sin(a),z+.18),(.39,.37,.33),'fir2',5)
finish()
obj('palm','Solpalm','Vegetation')
for i in range(10): taper((i*i*.003,0,.17+i*.31),.22-i*.006,.185-i*.006,.35,'rings' if i%2 else 'bark2')
for i in range(10):
    a=i*math.tau/10; x=math.cos(a);y=math.sin(a)
    leaf((.28,0,3.1),(.28+x*1.64,y*1.64,2.79+(i%3)*.19),.33,'palm' if i%2 else 'palm2')
for i in range(3): crown((.2+i*.13,-.12,2.95),(.16,.15,.19),'bark',6)
finish()
obj('shrub','Lingonris','Vegetation')
for i in range(9):
    x=rng.uniform(-.35,.35);y=rng.uniform(-.35,.35);z=rng.uniform(.18,.42)
    stem((0,0,.02),(x,y,z),.035,'stalk')
    crown((x,y,z),(.22,.21,.18),'oak2' if i%2 else 'oak')
    crown((x+.1,y-.08,z+.09),(.046,.05,.047),'berry',5)
finish()
obj('flowers','Sommarblommor','Vegetation')
for x,y,z,c in [(-.18,.07,.45,'pink'),(.17,.1,.39,'amber'),(0,-.13,.54,'cream')]:
    stem((x*.8,y*.7,0),(x,y,z),.018,'stalk')
    leaf((x,y,z*.4),(x+.14,y-.05,z*.74),.045,'grass')
    for i in range(5):
        a=math.tau*i/5
        crown((x+math.cos(a)*.062,y+math.sin(a)*.062,z),(.061,.061,.042),c,5)
    taper((x,y,z+.025),.046,.04,.035,'gold',7)
finish()
obj('mushroom','Lyktvaxskivling','Vegetation')
for x,y,h in [(0,0,1.1),(.39,.16,.52),(-.24,-.18,.39)]:
    taper((x,y,h*.32),.13*h,.095*h,h*.64,'cream')
    taper((x,y,h*.69),.34*h,.39*h,h*.13,'cream',9)
    taper((x,y,h*.84),.39*h,.11*h,h*.23,'red',9)
    for i in range(5):
        a=i*math.tau/5
        taper((x+math.cos(a)*.23*h,y+math.sin(a)*.23*h,h*.87),.045*h,.03*h,.025*h,'cream',5)
finish()
obj('log','Nedfallen ekstock','Vegetation')
stem((-.7,0,.26),(.7,0,.26),.26,'bark',n=10)
for x in [-.705,.705]:
    for i,c in enumerate(['end','rings','end','rings']):
        stem((x+i*.003*(1 if x>0 else -1),0,.26),(x+(i+1)*.003*(1 if x>0 else -1),0,.26),.223-i*.054,c,n=10)
branch((.12,0,.35),(.30,.12,.63));finish()
obj('roots','Frilagda rötter','Vegetation')
for i in range(6):
    a=i*math.tau/6; x=math.cos(a);y=math.sin(a)
    stem((0,0,.20),(x*.33,y*.33,.12),.13,'bark',.078)
    stem((x*.33,y*.33,.12),(x*.64+.08,y*.57,.018),.078,'bark2',.015)
finish()
obj('rocks','Mossklippor','Vegetation')
for x,y,r in [(-.2,0,.39),(.24,.10,.30),(.15,-.2,.19)]:
    crown((x,y,r*.53),(r,r*.87,r*.68),'stone')
    crown((x-.04,y,r*.93),(r*.58,r*.52,r*.2),'oak2')
finish()
obj('reeds','Kaveldun','Vegetation')
for i in range(7):
    x=rng.uniform(-.2,.2);y=rng.uniform(-.2,.2);h=rng.uniform(.59,1)
    stem((x,y,0),(x+.04,y,h),.014,'grass')
    stem((x+.04,y,h*.70),(x+.04,y,h*.95),.045,'bark')
    leaf((x,y,0),(x-.12,y+.10,h*.7),.035,'oak2')
finish()
obj('door','Spegelport','Byggnadsdelar')
for x in (-.41,.41): box((x,0,.99),(.12,.17,1.98),'bark')
for z in (.10,1.09,1.9): box((0,0,z),(.74,.15,.14),'bark2')
for x in (-.28,-.14,0,.14,.28): box((x,0,.59),(.133,.11,.84),'timber')
box((0,0,1.51),(.70,.062,.69),'glass',slot=3)
for x in (-.16,.16): box((x,0,1.50),(.04,.105,.72),'edge')
box((0,0,1.50),(.72,.10,.045),'edge')
box((.31,-.11,.98),(.11,.09,.065),'gold',slot=1)
finish()
obj('window','Spröjsfönster','Byggnadsdelar')
box((0,0,.50),(.84,.05,.84),'glass',slot=3)
for x in (-.46,0,.46): box((x,0,.50),(.08,.14,.97),'cream')
for z in (.05,.5,.95): box((0,0,z),(.98,.15,.075),'cream')
box((0,0,.045),(1.05,.24,.09),'edge');finish()
obj('stairs','Trappa i skiffer','Byggnadsdelar')
for i in range(4):
    h=(i+1)/4
    box((0,-.375+i*.25,h/2),(1,.25,h),'slate',bevel=.022)
    box((0,-.375+i*.25,h-.025),(1.01,.25,.05),'stone',bevel=.013)
finish()
obj('slab','Halvplatta i skiffer','Byggnadsdelar')
box((0,0,.25),(1,1,.5),'slate'); box((0,0,.475),(.98,.98,.05),'stone');finish()
obj('fence','Ängsstaket','Byggnadsdelar')
for x in (-.44,.44):
    box((x,0,.43),(.13,.14,.86),'timber')
    taper((x,0,.90),.094,.018,.10,'edge',4,rot=(0,0,math.pi/4))
for z in (.29,.61): box((0,.04,z),(.90,.09,.10),'edge')
finish()
obj('railing','Bryggräcke','Byggnadsdelar')
for x in (-.44,.44): box((x,0,.43),(.105,.12,.86),'iron',slot=1)
box((0,0,.86),(1,.15,.09),'edge')
for z in (.25,.54): stem((-.45,0,z),(.45,0,z),.018,'steel',n=5,slot=1)
finish()
obj('roof','Tegelnock','Byggnadsdelar')
for side in (-1,1):
    for i in range(4):
        for j in range(3):
            x=(i-1.5)*.249;y=side*(.10+j*.153);z=.48-j*.112
            box((x,y,z),(.253,.21,.07),'tile' if (i+j)%3 else 'red',rot=(-side*.62,0,0),bevel=.025)
stem((-.51,0,.55),(.51,0,.55),.065,'tile',n=8);finish()
obj('table','Snickarbord');legs(.87,.52,.75);planks(1.12,.77,.78)
box((0,0,.18),(.92,.08,.075),'bark2');finish()
obj('chair','Köksstol');legs(.34,.33,.43);planks(.49,.47,.44,3)
for x in (-.17,.17): box((x,.18,.66),(.077,.08,.51),'bark2')
for z in (.70,.85): box((0,.18,z),(.44,.075,.115),'edge')
finish()
obj('bed','Fältsäng');legs(.72,1.53,.37)
box((0,0,.36),(.88,1.72,.15),'bark2');box((0,0,.49),(.83,1.66,.16),'cream',bevel=.07)
box((0,-.27,.586),(.84,1.08,.12),'fabric',bevel=.065)
for y in (-.60,-.53,.17): box((0,y,.648),(.79,.025,.01),'cloth',bevel=.003)
box((0,.55,.62),(.60,.34,.13),'cream',bevel=.09);finish()
obj('chest','Expeditionskista')
box((0,0,.28),(.87,.58,.52),'timber')
for z in (.075,.46): box((0,0,z),(.89,.60,.07),'bark2')
box((0,0,.57),(.90,.61,.18),'edge',bevel=.075)
for x in (-.29,.29):
    box((x,0,.66),(.08,.59,.023),'iron',slot=1)
    for y in (-.306,.306): box((x,y,.34),(.08,.023,.6),'iron',slot=1)
box((0,-.323,.48),(.13,.044,.14),'gold',slot=1)
finish()
obj('lantern','Bärnstenslykta')
taper((0,0,.06),.245,.20,.12,'iron',8,slot=1)
taper((0,0,.32),.14,.17,.42,'glow',8,slot=2)
for x in (-.15,.15):
    for y in (-.13,.13): stem((x*.84,y*.84,.1),(x,y,.54),.018,'iron',slot=1)
taper((0,0,.57),.245,.13,.11,'iron',8,slot=1)
stem((-.095,0,.61),(-.095,0,.75),.016,'gold',slot=1)
stem((.095,0,.61),(.095,0,.75),.016,'gold',slot=1)
stem((-.095,0,.75),(.095,0,.75),.016,'gold',slot=1)
finish()
obj('workbench','Snickarbänk');legs(.79,.63,.80);planks(1.02,.80,.81)
box((0,0,.26),(.9,.68,.065),'edge')
box((.27,-.30,.87),(.29,.18,.10),'iron',slot=1)
box((.27,-.47,.77),(.26,.09,.22),'bark2')
stem((.27,-.52,.65),(.27,-.52,.87),.02,'steel',slot=1)
box((-.20,.07,.89),(.28,.21,.06),'lightwood');finish()
def handle(h):
    stem((0,0,.03),(.03,0,h),.048,'lightwood',.039,8)
    for i in range(5): stem((0,0,.06+i*.032),(.007,0,.08+i*.032),.052,'leather',n=8)
obj('pickaxe','Bergshacka','Verktyg');handle(.75)
for side in (-1,1):
    stem((.03,0,.73),(.03+side*.21,0,.71),.084,'steel',.06,5,1)
    stem((.03+side*.21,0,.71),(.03+side*.34,0,.58),.063,'steel',.011,5,1)
box((.03,0,.73),(.13,.13,.14),'iron',slot=1);finish()
obj('axe','Skogsyxa','Verktyg');handle(.72)
box((.06,0,.67),(.21,.105,.15),'iron',slot=1)
shape([(.10,-.05,.61),(.10,.05,.61),(.10,.05,.72),(.10,-.05,.72),(.32,-.018,.50),(.32,.018,.50),(.35,.018,.78),(.35,-.018,.78)],[(0,3,2,1),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(4,5,6,7)],'steel',(0,0,0),slot=1);finish()
obj('shovel','Planteringsspade','Verktyg')
stem((0,0,.20),(0,0,.82),.033,'edge')
shape([(-.17,-.025,.30),(.17,-.025,.30),(.11,-.04,.10),(0,-.067,.012),(-.11,-.04,.10),(0,.03,.22)],[(0,1,5),(1,2,5),(2,3,5),(3,4,5),(4,0,5),(4,3,2,1,0)],'steel',(0,0,0),slot=1)
for x in (-.08,.08):stem((0,0,.78),(x,0,.91),.022,'iron',slot=1)
stem((-.08,0,.91),(.08,0,.91),.03,'edge');finish()
obj('hammer','Verkstadshammare','Verktyg');handle(.57)
box((.02,0,.54),(.31,.145,.14),'iron',slot=1)
box((.18,0,.54),(.056,.16,.16),'steel',slot=1);finish()
obj('rod','Fiskespö','Verktyg')
stem((0,0,.03),(.05,0,.45),.044,'leather',.038)
stem((.05,0,.45),(.25,0,1.31),.033,'edge',.012)
stem((.25,0,1.31),(.40,0,1.42),.012,'edge',.006)
stem((.40,0,1.42),(.41,0,.70),.004,'cream',n=4)
crown((.41,0,.68),(.038,.038,.055),'red',5)
taper((.045,-.057,.35),.072,.07,.065,'steel',8,(math.pi/2,0,0),1);finish()
obj('torch','Kådfackla','Verktyg')
stem((0,0,.02),(0,0,.66),.044,'bark2',.065)
for z in (.52,.56,.60):taper((0,0,z),.083,.084,.033,'leather',7)
crown((0,0,.71),(.098,.093,.17),'amber',6)
taper((.018,0,.85),.055,.005,.21,'glow',6,slot=2);finish()
obj('backpack','Vandrarsäck','Föremål')
box((0,0,.32),(.46,.28,.58),'fabric',bevel=.09)
box((0,-.11,.51),(.44,.13,.19),'cloth',bevel=.07)
box((0,-.16,.20),(.31,.16,.21),'leather')
for x in (-.135,.135):
    box((x,-.183,.39),(.045,.028,.24),'leather')
    box((x,-.202,.37),(.069,.023,.053),'gold',slot=1)
    stem((x,.135,.11),(x,.22,.36),.031,'leather')
    stem((x,.22,.36),(x,.135,.54),.031,'leather')
finish()
obj('apple','Äpple','Mat')
crown((0,0,.17),(.23,.21,.22),'red',9)
stem((0,0,.32),(.034,0,.43),.019,'bark')
leaf((.015,0,.37),(-.125,0,.42),.046,'oak2');finish()
obj('bread','Havrelimpa','Mat')
crown((0,0,.13),(.36,.19,.17),'edge',9)
for x in (-.14,0,.14):box((x,-.024,.243),(.038,.20,.012),'lightwood',rot=(0,0,.32),bevel=.005)
finish()
obj('potion','Blåbärssaft','Mat')
taper((0,0,.14),.105,.145,.26,'berry',9)
taper((0,0,.315),.144,.062,.10,'berry',9)
taper((0,0,.40),.061,.061,.085,'glass',9,slot=3)
taper((0,0,.46),.057,.064,.068,'rings',8)
box((0,-.13,.19),(.12,.025,.11),'cream');finish()
obj('planter','Örtkruka','Inredning')
taper((0,0,.20),.18,.25,.39,'tile',8)
taper((0,0,.38),.26,.26,.07,'red',8)
taper((0,0,.42),.21,.21,.023,'soil',8)
for i in range(6):
    a=i*math.tau/6
    leaf((0,0,.43),(.23*math.cos(a),.23*math.sin(a),.58+i*.02),.068,'palm2' if i%2 else 'oak')
finish()

target=OUT/'explorer-kit.glb'
bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',export_yup=True,
    export_animations=False,export_texcoords=True,export_normals=True,export_unused_images=False)
raw=target.read_bytes()
assert raw[:4]==b'glTF' and struct.unpack_from('<I',raw,8)[0]==len(raw)
length=struct.unpack_from('<I',raw,12)[0]
data=json.loads(raw[20:20+length])
nodes={n.get('name') for n in data['nodes'] if 'mesh' in n}
assert nodes=={r['id'] for r in registry}, nodes
for mesh in data['meshes']:
    for p in mesh['primitives']:assert {'POSITION','NORMAL','TEXCOORD_0','COLOR_0'}<=p['attributes'].keys()
(OUT/'manifest.json').write_text(json.dumps({'generator':'Blender '+bpy.app.version_string,'license':'CC0-1.0','source':'tools/blender/blockvarlden/props.py','unit':'block','pivot':'grounded centre','assets':registry},ensure_ascii=False,indent=2)+'\n')
print('VERIFIED',len(registry),'original props',sum(r['triangles'] for r in registry),'triangles',len(raw),'bytes')
