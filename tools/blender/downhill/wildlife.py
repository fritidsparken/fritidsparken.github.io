"""Original Downhill wildlife. Blender 4.3; no external geometry/textures.

Run: blender -b --factory-startup --python tools/blender/downhill/wildlife.py
Five isolated root nodes at origin, metres, GLB +Y up / +Z facing camera.
Opaque vertex-colour PBR, one draw call per static animal; articulated wings.
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector

BASE = Path(__file__).resolve().parents[3]
OUT = BASE / 'assets/downhill'
(OUT/'models').mkdir(parents=True, exist_ok=True)
(OUT/'blender').mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)

def lin(v):
    return v/12.92 if v < .04045 else ((v+.055)/1.055)**2.4
def color(h):
    return tuple(lin(int(h[i:i+2],16)/255) for i in (0,2,4)) + (1,)
mat=bpy.data.materials.new('Wildlife_vertex_palette'); mat.use_nodes=True
bs=mat.node_tree.nodes.get('Principled BSDF'); bs.inputs['Roughness'].default_value=.62
vc=mat.node_tree.nodes.new('ShaderNodeVertexColor'); vc.layer_name='Color'
mat.node_tree.links.new(vc.outputs['Color'],bs.inputs['Base Color'])
current=None
def paint(o,h):
    ca=o.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
    co=color(h)
    for c in ca.data:c.color=co
    o.data.materials.append(mat)
    for p in o.data.polygons:p.use_smooth=True
    o.parent=current
    return o
def root(name):
    global current
    current=bpy.data.objects.new(name,None); bpy.context.collection.objects.link(current)
    current['provenance']='Original Blender geometry authored for Fritidsparken, 2026-11-06'
    current['collision']='decorative only; place outside rideable corridor'
    return current
def ell(name,pos,scale,h,rot=(0,0,0),parent=None):
    global current
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,location=pos)
    o=bpy.context.object;o.name=name;o.scale=scale;o.rotation_euler=rot
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    paint(o,h)
    if parent:o.parent=parent
    return o
def tube(name,points,radii,h):
    vs=[];fs=[];n=8
    for i,p in enumerate(points):
        p=Vector(p); tangent=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(0,i-1)])
        tangent.normalize(); axis=tangent.cross(Vector((1,0,0)))
        if axis.length<.01:axis=tangent.cross(Vector((0,1,0)))
        axis.normalize();side=tangent.cross(axis).normalized()
        for j in range(n):
            a=2*math.pi*j/n;vs.append(tuple(p+radii[i]*(math.cos(a)*axis+math.sin(a)*side)))
        if i:
            for j in range(n):fs.append(((i-1)*n+j,(i-1)*n+(j+1)%n,i*n+(j+1)%n,i*n+j))
    fs.extend([tuple(reversed(range(n))),tuple((len(points)-1)*n+j for j in range(n))])
    m=bpy.data.meshes.new(name);m.from_pydata(vs,[],fs);m.update()
    o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);paint(o,h);return o
def eye(x,y,z,r=.038):
    ell('eye_white',(x,y,z),(r*1.24,r*.63,r*1.45),'fffbea')
    ell('eye_pupil',(x,y-r*.46,z),(r*.69,r*.37,r*1.0),'242b38')
    ell('eye_glint',(x-r*.20,y-r*.79,z+r*.35),(r*.23,r*.12,r*.26),'ffffff')
def smile(y,z,width=.08):
    pts=[(-width,y,z+.025),(-width*.6,y-.008,z),(0,y-.011,z-.012),(width*.6,y-.008,z),(width,y,z+.025)]
    tube('smile',pts,[.008]*5,'51312a')
def toes(x,y,z,h):
    for j in [-1,0,1]:ell('toe',(x+j*.021,y-.041,z+.006),(.013,.027,.012),h)
def join_static(r):
    static=[o for o in r.children if o.type=='MESH']
    bpy.ops.object.select_all(action='DESELECT')
    for o in static:o.select_set(True)
    bpy.context.view_layer.objects.active=static[0];bpy.ops.object.join()
    o=bpy.context.object;o.name=r.name+'_body'
    bpy.context.scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    # Collapse duplicate slots introduced by joining to a single PBR material.
    for p in o.data.polygons:p.material_index=0
    while len(o.data.materials)>1:o.data.materials.pop(index=len(o.data.materials)-1)
    return o

roots=[]
r=root('rabbit');roots.append(r)
ell('belly',(0,.025,.28),(.19,.15,.235),'fff3dc')
ell('chest',(0,-.095,.34),(.12,.06,.14),'fffdf0')
ell('head',(0,-.035,.56),(.22,.17,.19),'fff8e9')
for s in [-1,1]:
    ell('haunch',(s*.145,.035,.15),(.10,.12,.145),'efe8dc')
    ell('foot',(s*.125,-.12,.055),(.087,.135,.055),'fff8e9');toes(s*.125,-.20,.06,'f1c7c2')
    ell('paw',(s*.13,-.115,.27),(.055,.06,.11),'fff8e9',rot=(0,s*.2,s*.25))
    ell('ear',(s*.125,.005,.83),(.062,.044,.235),'fff8e9',rot=(0,s*.28,0))
    ell('inner_ear',(s*.125,-.034,.835),(.035,.015,.18),'f7b2bb',rot=(0,s*.28,0))
    eye(s*.079,-.192,.586,.035)
    ell('cheek',(s*.113,-.178,.51),(.045,.023,.027),'f5b5b6')
    ell('muzzle',(s*.037,-.197,.507),(.045,.033,.036),'ffffff')
ell('nose',(0,-.232,.526),(.023,.018,.016),'cf828c')
smile(-.223,.482,.044)
ell('tail',(0,.19,.235),(.075,.07,.075),'ffffff')
join_static(r)

r=root('squirrel');roots.append(r)
ell('body',(0,.025,.27),(.17,.14,.22),'ce722b')
ell('belly',(0,-.106,.285),(.116,.034,.16),'ffda8e')
ell('head',(0,-.035,.54),(.19,.15,.165),'db8332')
for s in [-1,1]:
    ell('ear',(s*.13,.0,.70),(.062,.04,.085),'cf722b',rot=(0,s*.2,0))
    ell('inner_ear',(s*.13,-.032,.70),(.035,.012,.055),'f6b379')
    ell('haunch',(s*.14,.06,.145),(.09,.11,.13),'bf632b')
    ell('foot',(s*.12,-.10,.048),(.074,.11,.048),'d58236')
    ell('arm',(s*.14,-.095,.31),(.045,.055,.115),'db8332',rot=(0,-s*.45,0))
    ell('paw',(s*.10,-.158,.245),(.043,.045,.042),'edac5d')
    eye(s*.072,-.17,.565,.037)
    ell('muzzle',(s*.045,-.173,.492),(.064,.045,.044),'ffe2a3')
ell('nose',(0,-.219,.526),(.029,.021,.021),'57342a');smile(-.212,.467,.052)
pts=[];rad=[]
for i in range(24):
    a=i/23*math.pi*1.7
    pts.append((-.06,.17+.19*math.sin(a),.23+.40*(1-math.cos(a))*.5))
    rad.append(.07+.065*math.sin(i/23*math.pi)**.7)
tube('curl_tail',pts,rad,'b95a25')
pts2=[(x-.015,y-.035,z+.04) for x,y,z in pts[6:]]
tube('tail_highlight',pts2,[r*.61 for r in rad[6:]],'e59b49')
join_static(r)

r=root('bird');roots.append(r)
ell('body',(0,.015,.29),(.16,.15,.19),'249ee0')
ell('bib',(0,-.117,.285),(.125,.042,.14),'fff4cf')
ell('head',(0,-.023,.47),(.18,.15,.16),'28a8e6')
for s in [-1,1]:
    eye(s*.071,-.164,.495,.045)
    ell('foot',(s*.075,-.03,.054),(.048,.08,.023),'f3ad23')
    toes(s*.075,-.09,.057,'ef9b1b')
ell('beak_top',(0,-.204,.418),(.052,.064,.028),'ffc130')
ell('beak_lower',(0,-.197,.396),(.040,.048,.015),'e78a18')
for i in range(3):
    ell('crest',((i-1)*.035,.0,.61+i*.008),(.026,.025,.068),'168aca',rot=(.25,(i-1)*.25,0))
    ell('tail',((i-1)*.04,.18,.28),(.032,.10,.027),'117bb7',rot=(.35,0,(i-1)*.28))
join_static(r)
for s,label in [(-1,'L'),(1,'R')]:
    w=bpy.data.objects.new('bird_wing_'+label,None);bpy.context.collection.objects.link(w);w.parent=r
    w.location=(s*.13,0,.36)
    for i in range(4):
        o=ell('feather',(s*(.23+i*.03),.01+i*.018,.38+i*.018),(.12-i*.014,.045,.027),'168ccf',rot=(0,-s*.5,0),parent=w)
        o.location-=w.location
    # Join wing mesh children, retaining a correctly located shoulder pivot.
    children=list(w.children);bpy.ops.object.select_all(action='DESELECT')
    for o in children:o.select_set(True)
    bpy.context.view_layer.objects.active=children[0];bpy.ops.object.join()
    for p in bpy.context.object.data.polygons:p.material_index=0
    while len(bpy.context.object.data.materials)>1:bpy.context.object.data.materials.pop(index=1)

r=root('otter');roots.append(r)
ell('body',(0,.035,.27),(.19,.15,.25),'a96931')
ell('bib',(0,-.113,.30),(.127,.034,.17),'e9bd78')
ell('head',(0,-.025,.55),(.21,.16,.16),'b97d3c')
for s in [-1,1]:
    ell('ear',(s*.18,.0,.65),(.054,.031,.047),'94572c')
    ell('ear_inside',(s*.18,-.025,.65),(.03,.012,.026),'ddac72')
    ell('foot',(s*.13,-.07,.052),(.071,.10,.047),'87522d')
    ell('arm',(s*.20,-.01,.32),(.065,.07,.16),'aa6b32',rot=(0,s*.7,0))
    ell('hand',(s*.285,-.04,.42),(.06,.048,.06),'90532c')
    eye(s*.078,-.173,.571,.032)
    ell('muzzle',(s*.055,-.17,.51),(.08,.045,.052),'f0d69c')
    for j in range(3):
        tube('whisker',[(s*.08,-.207,.52-j*.014),(s*.19,-.198,.535-j*.018)],[.003,.0015],'65462e')
ell('nose',(0,-.22,.545),(.035,.024,.023),'4d3429');smile(-.207,.48,.055)
tube('tail',[(0,.10,.10),(0,.22,.07),(.10,.35,.05),(.20,.39,.035)],[.09,.07,.042,.008],'9e632f')
join_static(r)

r=root('butterfly');roots.append(r)
ell('body',(0,0,.06),(.018,.075,.025),'d18523')
ell('head',(0,-.07,.067),(.026,.025,.025),'db972b')
for s in [-1,1]:
    tube('antenna',[(s*.01,-.08,.08),(s*.028,-.12,.10),(s*.045,-.13,.10)],[.003]*3,'825925')
join_static(r)
for s,label in [(-1,'L'),(1,'R')]:
    w=bpy.data.objects.new('butterfly_wing_'+label,None);bpy.context.collection.objects.link(w);w.parent=r
    w.location=(s*.012,0,.065)
    parts=[]
    for y,scale in [(-.055,(.115,.105,.012)),(.075,(.085,.078,.012))]:
        for dz,f,h in [(0,1,'ffbe25'),(.011,.69,'ffe65b')]:
            o=ell('wing',(s*(.10 if y<0 else .075),y,.065+dz),tuple(v*f for v in scale),h,parent=w)
            o.location-=w.location;parts.append(o)
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts:o.select_set(True)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join()
    for p in bpy.context.object.data.polygons:p.material_index=0
    while len(bpy.context.object.data.materials)>1:bpy.context.object.data.materials.pop(index=1)

# Keep each asset at origin in the GLB for simple cloning and instancing.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT/'models/wildlife.glb'),export_format='GLB',use_selection=True,export_animations=False,export_extras=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'blender/wildlife.blend'))
report={}
for r in roots:
    meshes=[o for o in r.children_recursive if o.type=='MESH']
    report[r.name]={'meshes':len(meshes),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes)}
print('WILDLIFE_REPORT',json.dumps(report))

# Scratch-only studio inspection; not included in saved models.
for i,r in enumerate(roots):r.location=(i*1.1-2.2,0,0)
bpy.ops.mesh.primitive_plane_add(size=200);floor=bpy.context.object
fm=bpy.data.materials.new('Studio_floor');fm.diffuse_color=(.16,.22,.15,1);floor.data.materials.append(fm)
bpy.ops.object.camera_add(location=(3,-6,3));cam=bpy.context.object
cam.rotation_euler=(Vector((0,0,.4))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=6.4
bpy.context.scene.camera=cam
for pos,power,size in [((0,-4,6),1300,5),((-4,0,3),700,4)]:
    bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size
    o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=32;sc.cycles.use_denoising=False
sc.world.color=(.35,.35,.35);sc.view_settings.view_transform='AgX'
sc.render.resolution_x=1400;sc.render.resolution_y=700;sc.render.resolution_percentage=100
sc.render.filepath='/workspace/scratch/afd828002ad9/wildlife-preview.png'
bpy.ops.render.render(write_still=True)
