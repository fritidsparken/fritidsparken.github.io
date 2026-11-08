"""Original Rymdäventyret assets. Blender 4.3+: blender -b -t 4 -P build_assets.py.
Blender +Y forward / +Z up; exported glTF -Z forward / +Y up. Units metres.
All geometry/materials are original; no external assets.
"""
import bpy, math, random, os, sys
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'assets/space'
random.seed(82)
def clear():
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    for m in list(bpy.data.materials):
        if m.users==0:bpy.data.materials.remove(m)
def mat(name,color,metal=0,rough=.4,emission=0,alpha=1):
    m=bpy.data.materials.new(name); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,alpha); p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    if emission:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
    if alpha<1:
        p.inputs['Alpha'].default_value=alpha;m.surface_render_method='DITHERED';p.inputs['Coat Weight'].default_value=.8
    m.diffuse_color=(*color,alpha);return m
def mats():
    global white,red,dark,steel,cyan,gold,glass,black,orange
    white=mat('Pearl ceramic white',(.82,.87,.92),.46,.26)
    red=mat('Crimson enamel',(.7,.023,.038),.42,.25)
    dark=mat('Graphite panels',(.025,.04,.065),.6,.3)
    steel=mat('Brushed titanium',(.28,.34,.4),.85,.24)
    cyan=mat('Ion cyan emission',(.025,.65,1),.1,.22,4)
    gold=mat('Warm gold',(.95,.47,.08),.6,.27)
    glass=mat('Cockpit blue glass',(.11,.38,.62),.15,.08,alpha=.12)
    black=mat('Carbon rubber',(.012,.018,.028),.15,.6)
    orange=mat('Rescue orange',(.93,.18,.035),.2,.38)
def finish(o,n,m,smooth=True):
    o.name=n
    if m:o.data.materials.append(m)
    if smooth and o.type=='MESH':
        for p in o.data.polygons:p.use_smooth=True
    return o
def uv(n,loc,scale,m,seg=24,rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,location=loc);o=bpy.context.object;o.scale=scale;return finish(o,n,m)
def cube(n,loc,scale,m,bevel=.04):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new('Soft machined edges','BEVEL');mod.width=bevel;mod.segments=2
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(o,n,m,False)
def cyl(n,loc,r,depth,m,axis='Z',vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=loc);o=bpy.context.object
    if axis=='Y':o.rotation_euler.x=math.pi/2
    if axis=='X':o.rotation_euler.y=math.pi/2
    return finish(o,n,m)
def tor(n,loc,r,t,m,axis='Y',segments=48):
    bpy.ops.mesh.primitive_torus_add(major_segments=segments,minor_segments=8,location=loc,major_radius=r,minor_radius=t);o=bpy.context.object
    if axis=='Y':o.rotation_euler.x=math.pi/2
    if axis=='X':o.rotation_euler.y=math.pi/2
    return finish(o,n,m)
def line(n,points,r,m):
    c=bpy.data.curves.new(n,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=2;c.resolution_u=2
    s=c.splines.new('POLY');s.points.add(len(points)-1)
    for p,v in zip(s.points,points):p.co=(*v,1)
    o=bpy.data.objects.new(n,c);bpy.context.collection.objects.link(o);o.data.materials.append(m)
    bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False);return o
def mesh(n,verts,faces,m):
    d=bpy.data.meshes.new(n);d.from_pydata(verts,[],faces);d.update();o=bpy.data.objects.new(n,d);bpy.context.collection.objects.link(o);return finish(o,n,m)
def rod(n,a,b,r,m):
    a,b=Vector(a),Vector(b);o=cyl(n,(a+b)/2,r,(b-a).length,m);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
def batch_static():
    batches={}
    for o in list(bpy.context.scene.objects):
        if o.type!='MESH' or len(o.data.materials)!=1 or len(o.vertex_groups) or o.animation_data or o.parent or (o.name.startswith(('EngineCore','WingLeft','WingRight')) or (o.name.startswith('Wheel') and not o.name.startswith('Wheel tread'))):continue
        batches.setdefault(o.data.materials[0].name,[]).append(o)
    for name,objects in batches.items():
        if len(objects)<2:continue
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();bpy.context.object.name='Static_'+name
def export(path,blend=None):
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.context.scene.objects:
        if o.type not in ('CAMERA','LIGHT'):o.select_set(True)
    path=OUT/path;path.parent.mkdir(parents=True,exist_ok=True)
    if blend:bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'blender'/blend),compress=True)
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_yup=True,export_animations=True,export_cameras=False,export_lights=False,export_materials='EXPORT')
def render(name,loc,target):
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=False
    scene.render.resolution_x=1100;scene.render.resolution_y=760;scene.render.resolution_percentage=100
    scene.world.color=(.12,.15,.24)
    for p,power,size,color in [((-7,4,10),1700,7,(.7,.85,1)),((6,-5,7),2400,6,(1,.58,.3)),((0,7,5),1200,5,(.4,.75,1))]:
        bpy.ops.object.light_add(type='AREA',location=p);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.data.color=color;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=loc);o=bpy.context.object;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();o.data.lens=48;scene.camera=o
    scene.render.filepath=str(OUT/'rocket'/name);bpy.ops.render.render(write_still=True)
    for o in list(scene.objects):
        if o.type in ('LIGHT','CAMERA'):bpy.data.objects.remove(o,do_unlink=True)
def rocket():
    clear();mats()
    # Custom cross-section fuselage with a real open cockpit, not an intersecting sphere.
    rings=[(-4,.9,.7),(-3.6,1.45,1.05),(-2.8,1.7,1.2),(-1.8,1.78,1.25),(-.8,1.75,1.25),(.3,1.63,1.15),(1.5,1.4,.95),(2.5,1.1,.75),(3.4,.66,.48),(3.9,.1,.15)]
    N=49;v=[];f=[]
    sections=[-4+i*7.9/64 for i in range(65)]
    for y in sections:
        k=next((k for k in range(len(rings)-1) if rings[k][0]<=y<=rings[k+1][0]),len(rings)-2)
        t=(y-rings[k][0])/(rings[k+1][0]-rings[k][0]);rx=rings[k][1]*(1-t)+rings[k+1][1]*t;rz=rings[k][2]*(1-t)+rings[k+1][2]*t
        opening=-3.35<y<2.05
        hole=1.49*math.sqrt(max(0,1-((y+.65)/2.7)**2)) if opening else 0
        theta=math.asin(min(.999,hole/rx))
        for j in range(N):
            a=theta+j/(N-1)*(math.tau-2*theta)
            z=rz*math.cos(a)
            if opening:z+=(.72-rz*math.cos(theta))*math.exp(-min(j,N-1-j)*.7)
            v.append((rx*math.sin(a),y,z))
    for i in range(len(sections)-1):
        for j in range(N-1):f.append((i*N+j,i*N+j+1,(i+1)*N+j+1,(i+1)*N+j))
    o=mesh('RocketHull',v,f,white);mod=o.modifiers.new('Continuous hull','SUBSURF');mod.levels=1;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
    # Cockpit rim is an elongated rounded oval in the horizontal plane.
    rim=[(1.49*math.sin(i*math.tau/64),-.65+2.7*math.cos(i*math.tau/64),.72) for i in range(65)]
    line('Cockpit gasket',rim,.09,dark);line('Cockpit polished rim',[(x,y,z+.07) for x,y,z in rim],.045,steel)
    # Transparent upper ellipsoidal canopy.
    vs=[];fs=[];rows=14;cols=48
    for j in range(rows+1):
        t=(j/rows)*math.pi/2
        for i in range(cols):
            a=i*math.tau/cols;vs.append((1.49*math.cos(t)*math.sin(a),-.65+2.7*math.cos(t)*math.cos(a),.77+1.7*math.sin(t)))
    for j in range(rows):
        for i in range(cols):fs.append((j*cols+i,j*cols+(i+1)%cols,(j+1)*cols+(i+1)%cols,(j+1)*cols+i))
    mesh('CockpitGlass',vs,fs,glass)
    line('Canopy spine',[(0,-.65+2.7*math.cos(t),.79+1.7*math.sin(t)) for t in [i*math.pi/32 for i in range(33)]],.04,steel)
    cube('Cockpit floor',(0,-.7,.05),(2.3,3.9,.18),dark)
    seat=cube('Pilot seat',(0,-1.45,.8),(1.05,.45,1.75),dark,.15);seat.rotation_euler.x=-.15
    cube('Seat cushion',(0,-.9,.4),(1.05,.95,.25),black,.1)
    # Seated astronaut. Arms and head have animated transforms, facing +Y.
    uv('PilotBody',(0,-1,1.05),(.44,.35,.57),white)
    cube('Pilot life support',(0,-1.36,1.05),(.65,.24,.66),orange,.1)
    head=uv('PilotHead',(0,-.82,1.89),(.48,.45,.49),white,32,24)
    visor=uv('PilotVisor',(0,-.49,1.9),(.37,.16,.3),mat('Visor blue gold',(.055,.14,.2),.65,.15),32,16)
    visor.parent=head;visor.matrix_parent_inverse=head.matrix_world.inverted()
    for side in [-1,1]:
        cyl('Helmet ear seal',(side*.46,-.83,1.88),.15,.12,steel,'X')
        rod('Pilot upper arm',(side*.38,-.95,1.36),(side*.58,-.44,1.1),.18,white)
        arm=rod('PilotArmLeft' if side<0 else 'PilotArmRight',(side*.58,-.44,1.1),(side*.52,.12,1.25),.145,white)
        uv('Pilot glove',(side*.52,.18,1.26),(.14,.2,.14),dark)
        rod('Pilot leg',(side*.24,-.8,.65),(side*.25,.1,.48),.2,white)
        cube('Pilot boot',(side*.25,.3,.35),(.36,.58,.25),dark,.08)
        line('Harness',[(side*.26,-.67,1.5),(side*.19,-.63,1.05),(side*.29,-.64,.65)],.045,orange)
        rod('Flight stick',(side*.52,.22,.78),(side*.52,.2,1.3),.06,steel)
        for frame,angle in [(1,0),(30,side*.07),(60,0)]:arm.rotation_euler.y+=angle;arm.keyframe_insert(data_path='rotation_euler',frame=frame)
    for frame,angle in [(1,-.04),(60,.04),(120,-.04)]:head.rotation_euler.z=angle;head.keyframe_insert(data_path='rotation_euler',frame=frame)
    panel=cube('InstrumentPanel',(0,.95,.86),(2,.6,.7),dark,.12);panel.rotation_euler.x=-.4
    for x in [-.64,0,.64]:
        s=cube('CockpitDisplay',(x,.61,1.16),(.52,.07,.4),cyan,.025);s.rotation_euler.x=-.5
        for j in range(4):cube('Display telemetry',(x-.15+j*.1,.565,1.17),(.025,.018,.2*(.5+random.random()*.5)),white,.005)
        for j in range(3):uv('Control button',(x-.15+j*.15,.48,.91),(.035,.035,.026),red if j==0 else gold,12,8)
    # Swept solid red wings, bevelled mesh, with blue marker lights.
    for side in [-1,1]:
        outline=[(side*1.2,-2.9,-.25),(side*4.2,-3.55,-.5),(side*3.6,-1.4,-.35),(side*1.42,.65,-.15)]
        verts=[(x,y,z+dz) for dz in [-.12,.12] for x,y,z in outline]
        faces=[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]
        o=mesh('WingLeft' if side<0 else 'WingRight',verts,faces,red);b=o.modifiers.new('Wing edge rounding','BEVEL');b.width=.1;b.segments=3;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=b.name)
        line('Wing panel seam',[(side*1.6,-2.7,-.07),(side*3.75,-3.13,-.2),(side*3.22,-1.62,-.16)],.018,dark)
        line('Wing cyan strip',[(side*3.8,-3,-.24),(side*3.5,-1.95,-.17)],.055,cyan)
        for y in [-2.5,-1.8,-1.1]:uv('Wing rivet',(side*(2.8-(y+2.5)*.4),y,-.1),(.035,.035,.035),steel,8,6)
    # Red dorsal fin gives a recognisable rear silhouette.
    mesh('DorsalFin',[(-.13,-3.6,.6),(.13,-3.6,.6),(-.1,-3.7,2.2),(.1,-3.7,2.2),(-.08,-1.9,.9),(.08,-1.9,.9)],[(0,2,4),(1,5,3),(0,1,3,2),(2,3,5,4),(4,5,1,0)],red)
    line('Dorsal cyan light',[(0,-3.72,1),(0,-3.72,1.85)],.045,cyan)
    # Two layered annular thrusters, open back and visible glowing cores.
    for side in [-1,1]:
        x=side*1.15
        cyl('EnginePod',(x,-3.1,-.15),.68,1.8,white,'Y')
        for y,r,t in [(-3.65,.68,.09),(-4.0,.64,.1),(-4.35,.69,.1),(-4.47,.58,.045)]:tor('Nozzle titanium rings',(x,y,-.15),r,t,steel)
        cyl('EngineCoreLeft' if side<0 else 'EngineCoreRight',(x,-4.36,-.15),.46,.08,cyan,'Y')
        tor('Thruster blue rim',(x,-4.49,-.15),.5,.045,cyan)
        for i in range(12):
            a=i*math.tau/12;rod('Engine cooling fin',(x+.6*math.cos(a),-3.8,-.15+.6*math.sin(a)),(x+.63*math.cos(a),-4.28,-.15+.63*math.sin(a)),.035,dark)
    # Physical hull seams, ventilation and fasteners.
    for y,rx,rz in [rings[2],rings[4],rings[6]]:
        line('Hull panel seam',[(rx*math.sin(a),y,rz*math.cos(a)) for a in [1.2+i*(math.tau-2.4)/40 for i in range(41)]],.014,dark)
    for side in [-1,1]:
        for y in [-2.7,-2,-1.3,-.6,.1,.8,1.5]:
            uv('Hull fastener',(side*(1.71-max(0,y)*.2),y,.15),(.027,.035,.035),steel,8,6)
        for j in range(5):cube('Vent louvre',(side*1.68,-2.3+j*.15,.5),(.07,.07,.38),dark,.01)
        line('Hull blue stripe',[(side*1.75,-1.75,.2),(side*1.73,-.1,.2)],.045,cyan)
    uv('Nose scarlet fairing',(0,3.25,0),(.68,.72,.5),red,32,20)
    # Real skeletal rig: rigid weighted garment pieces retain their crafted silhouettes.
    bpy.ops.object.select_all(action='DESELECT')
    armature=bpy.data.armatures.new('Astronaut skeleton');rig=bpy.data.objects.new('PilotRig',armature);bpy.context.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    for name,a,b in [('torso',(0,-1,.5),(0,-1,1.5)),('head',(0,-.82,1.5),(0,-.82,2.3)),('handL',(-.58,-.44,1.1),(-.52,.12,1.25)),('handR',(.58,-.44,1.1),(.52,.12,1.25))]:
        bone=armature.edit_bones.new(name);bone.head=a;bone.tail=b
        if name!='torso':bone.parent=armature.edit_bones['torso']
    bpy.ops.object.mode_set(mode='OBJECT')
    for o in list(bpy.context.scene.objects):
        if o.type!='MESH':continue
        name=o.name
        bone='head' if name.startswith(('PilotHead','PilotVisor','Helmet ear')) else 'handL' if name=='PilotArmLeft' else 'handR' if name=='PilotArmRight' else 'torso' if name=='PilotBody' else None
        if bone:
            o.animation_data_clear();group=o.vertex_groups.new(name=bone);group.add(list(range(len(o.data.vertices))),1,'REPLACE');modifier=o.modifiers.new('Astronaut skin','ARMATURE');modifier.object=rig
    for bone_name,axis,amount in [('head',2,.045),('handL',0,.07),('handR',0,-.07)]:
        bone=rig.pose.bones[bone_name];bone.rotation_mode='XYZ'
        for frame,angle in [(1,-amount),(60,amount),(120,-amount)]:bone.rotation_euler[axis]=angle;bone.keyframe_insert(data_path='rotation_euler',frame=frame)
    bpy.context.scene.frame_end=120;bpy.context.scene.frame_set(1)
    batch_static();export('rocket/rocket-high.glb','rocket.blend')
    for o in bpy.context.scene.objects:
        if o.type=='MESH' and len(o.data.polygons)>300:
            mod=o.modifiers.new('Mobile LOD','DECIMATE');mod.ratio=.52;bpy.context.view_layer.objects.active=o
            try:bpy.ops.object.modifier_apply(modifier=mod.name)
            except:pass
    export('rocket/rocket-low.glb')
    if '--render' in sys.argv:
        render('rocket-rear.png',(-11,-14,9),(0,-.3,.6));render('rocket-front.png',(10,14,8),(0,-.3,.6));render('rocket-cockpit.png',(5,7,7),(0,-.8,.8));render('rocket-side.png',(17,0,5),(0,-.3,.6));render('rocket-top.png',(0,-.5,20),(0,-.3,.6))
def asteroids():
    clear();mats()
    rockm=[mat('Asteroid basalt',(.16,.13,.12),.04,.88),mat('Asteroid nickel',(.23,.21,.18),.25,.72),mat('Asteroid ice',(.4,.59,.7),.18,.3)]
    for n in range(18):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3,radius=1);o=bpy.context.object
        seed=random.random()*12
        for v in o.data.vertices:
            p=v.co;warp=1+.13*math.sin(p.x*11+seed)*math.cos(p.y*8-seed)+.11*math.sin(p.z*13+seed)+random.uniform(-.06,.06)
            # Multiple bowl-shaped craters in each unique asteroid.
            for direction,r in [(Vector((.3,.7,.5)).normalized(),.5),(Vector((-.6,.2,-.4)).normalized(),.35)]:
                d=(p.normalized()-direction).length
                if d<r:warp-=.22*(1-d/r)**2
            v.co*=warp
            v.co.x*=.65+((n*7)%13)/18;v.co.y*=.72+((n*3)%11)/17
        finish(o,f'asteroid_{n:02d}',rockm[n%3]);o.location=(0,0,0)
    export('asteroids/asteroid-library.glb','asteroids.blend')
    clear();mats();crystal=mat('Amber energy crystal',(1,.46,.035),.35,.15,1.8)
    for i,(p,s) in enumerate([((0,0,0),1),((.32,.1,-.2),.6),((-.24,-.2,-.3),.45)]):
        verts=[(p[0]+s*.24*math.cos(a*math.tau/6),p[1]+s*.24*math.sin(a*math.tau/6),p[2]+z*s) for z in [-.5,.5] for a in range(6)]+[(p[0],p[1],p[2]+1.05*s),(p[0],p[1],p[2]-.75*s)]
        faces=[]
        for a in range(6):faces.extend([(a,(a+1)%6,6+(a+1)%6,6+a),(6+a,6+(a+1)%6,12),(a,13,(a+1)%6)])
        mesh('EnergyCrystal'+str(i),verts,faces,crystal)
    export('materials/crystal.glb','crystal.blend')
def station():
    clear();mats()
    solar=mat('Photovoltaic blue',(.025,.06,.22),.65,.2)
    cyl('Habitat core',(0,0,0),2.2,7,white,'Y')
    for y in [-3.3,0,3.3]:tor('Pressure collar',(0,y,0),2.2,.2,dark)
    for side in [-1,1]:
        rod('Solar truss',(side*1,0,0),(side*8,0,0),.18,steel)
        for j in [-1,1]:
            cube('Solar panel frame',(side*6,j*2.4,0),(6.7,4.4,.16),steel)
            for x in range(8):
                for y in range(5):cube('Photovoltaic cell',(side*6-2.85+x*.81,j*2.4-1.7+y*.84,.11),(.73,.75,.025),solar,0)
    for a in range(12):
        t=a*math.tau/12;cube('Habitat window',(2.23*math.cos(t),0,2.23*math.sin(t)),(.25,2,.15),cyan)
    cyl('Docking throat',(0,4,0),1.3,1.4,dark,'Y');tor('Docking target',(0,4.8,0),1.35,.1,cyan)
    for x in [-1,1]:uv('Docking beacon',(x*1.6,4.7,0),(.12,.12,.12),red if x<0 else cyan)
    rod('Antenna mast',(0,-2,2),(0,-2,4.8),.08,steel);uv('Communication dish',(0,-2,4.7),(.9,.9,.16),white)
    batch_static();export('stations/orbital-station.glb','orbital-station.blend')
def rover():
    clear();mats()
    cube('Rover chassis',(0,0,.9),(2,3.1,.5),white,.15);cube('Rover gold belly',(0,0,.55),(1.7,2.5,.2),gold)
    for side in [-1,1]:
        for y in [-1.1,0,1.1]:
            cyl('Wheel',(side*1.25,y,.48),.5,.4,black,'X',24);cyl('Wheel hub',(side*1.47,y,.48),.25,.04,steel,'X',24)
            rod('Suspension',(side*.75,y,.9),(side*1.3,y,.48),.08,steel)
            for i in range(10):
                a=i*math.tau/10;o=cube('Wheel tread',(side*1.25,y+.49*math.sin(a),.48+.49*math.cos(a)),(.43,.1,.06),dark,.01);o.rotation_euler.x=-a
    cube('Rover seat',(0,-.4,1.5),(.8,.35,1.1),dark,.12)
    cube('Rover console',(0,.7,1.35),(1,.3,.45),dark);cube('Rover screen',(0,.52,1.49),(.6,.04,.2),cyan)
    for side in [-1,1]:uv('Rover headlamp',(side*.75,1.58,1),(.18,.08,.13),cyan)
    rod('Camera mast',(.65,-1,1),(.65,-1,2.5),.06,steel);cube('Stereo camera',(.65,-1,2.5),(.6,.3,.25),white)
    batch_static();export('vehicles/moon-rover.glb','moon-rover.blend')
def landing():
    clear();mats()
    cyl('Landing platform',(0,0,.16),7,.3,dark,vertices=48);tor('Landing guidance light',(0,0,.34),6.2,.055,cyan,'Z')
    for x in [-2,2]:cube('Landing H',(x,0,.33),(.3,4,.025),white,0)
    cube('Landing H',(0,0,.33),(4,.3,.025),white,0)
    for i in range(8):
        t=i*math.tau/8;uv('Pad beacon',(6.8*math.cos(t),6.8*math.sin(t),.5),(.12,.12,.18),gold)
    cube('Research habitat',(10,0,1.7),(5,4,3),white,.45);cube('Habitat door',(7.45,0,1.6),(.1,1.25,2.4),dark,.1)
    for y in [-1.2,1.2]:cube('Base window',(7.4,y,2.2),(.08,.7,.8),cyan,.07)
    for x in [8.2,11.8]:
        for y in [-1.5,1.5]:rod('Habitat support',(x,y,0),(x,y,1),.15,steel)
    cube('Base solar panel',(10,0,3.4),(4.5,3.5,.1),mat('Base solar blue',(.03,.08,.3),.6,.2))
    rod('Base antenna',(12,0,3),(12,0,5.5),.06,steel);uv('Base beacon',(12,0,5.5),(.12,.12,.12),cyan)
    batch_static();export('terrain/landing-base.glb','landing-base.blend')
def satellite():
    clear();mats()
    cube('Probe bus',(0,0,0),(1,1,1.2),gold,.06)
    solar=mat('Probe photovoltaic blue',(.025,.065,.23),.65,.2)
    for side in [-1,1]:
        rod('Panel mast',(side*.4,0,0),(side*2,0,0),.06,steel)
        cube('Panel frame',(side*1.9,0,0),(2.1,1.5,.1),steel,.025)
        for x in range(5):
            for y in range(3):cube('Solar cell',(side*1.9-.8+x*.4,-.5+y*.5,.06),(.36,.44,.025),solar,0)
    rod('Probe antenna',(0,0,.5),(0,0,1.6),.04,steel)
    uv('Probe dish',(0,0,1.4),(.6,.6,.12),white)
    uv('Probe beacon',(0,0,1.7),(.08,.08,.1),cyan)
    batch_static();export('satellites/research-probe.glb','research-probe.blend')
if __name__=='__main__':
    for directory in ['blender','rocket','asteroids','stations','vehicles','terrain','materials']:(OUT/directory).mkdir(parents=True,exist_ok=True)
    rocket();asteroids();station();rover();landing();satellite();print('SPACE_ASSETS_COMPLETE',OUT)
