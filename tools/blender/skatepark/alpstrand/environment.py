"""Lakefront, Alpine skyline and furniture for the reference park (Blender metres)."""
import bpy
import math
import random
from pathlib import Path
from mathutils import Vector, noise

def mat(name, rgb, rough=0.8, metal=0):
    m=bpy.data.materials.new(name)
    m.diffuse_color=(*rgb,1)
    m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*rgb,1)
    p.inputs['Metallic'].default_value=metal
    p.inputs['Roughness'].default_value=rough
    return m

class Batch:
    """A single renderable material, accumulated as disconnected mesh islands."""
    def __init__(self,name,material):
        self.name=name; self.mat=material; self.v=[]; self.f=[]
    def poly(self,*coords):
        i=len(self.v); self.v.extend(coords); self.f.append(tuple(range(i,len(self.v))))
    def box(self,x,y,z,w,d,h):
        a,b=x-w/2,x+w/2; c,e=y-d/2,y+d/2; f=z+h
        base=len(self.v); self.v.extend([(a,c,z),(b,c,z),(b,e,z),(a,e,z),(a,c,f),(b,c,f),(b,e,f),(a,e,f)])
        for face in ((3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)):
            self.f.append(tuple(base+v for v in face))
    def pipe(self,a,b,r1,r2=None,n=8):
        v=Vector(b)-Vector(a)
        if v.length<.00001:return
        axis=v.normalized(); u=axis.orthogonal().normalized(); w=axis.cross(u); base=len(self.v)
        for origin,r in ((a,r1),(b,r1 if r2 is None else r2)):
            for i in range(n):
                angle=i*math.tau/n
                self.v.append(tuple(Vector(origin)+r*(math.cos(angle)*u+math.sin(angle)*w)))
        for i in range(n):
            j=(i+1)%n; self.f.append((base+i,base+j,base+n+j,base+n+i))
        self.f.extend([tuple(base+i for i in reversed(range(n))),tuple(base+n+i for i in range(n))])
    def finish(self):
        if not self.v:return
        m=bpy.data.meshes.new(self.name);m.from_pydata(self.v,[],self.f);m.materials.append(self.mat);m.update()
        ob=bpy.data.objects.new(self.name,m);bpy.context.collection.objects.link(ob)
        return ob

def resource(name):
    bases=[Path.cwd(),Path.cwd()/'repo',Path.cwd()/'cache']
    bases+=list(Path(__file__).resolve().parents)
    for base in bases:
        f=base/name if name.startswith('games/') else base/'assets/skatepark/shared'/name
        if f.is_file():return f
    raise FileNotFoundError(name)

def load_asset(name):
    bpy.ops.import_scene.gltf(filepath=str(resource(name)),import_pack_images=True)
    objects=[ob for ob in bpy.context.selected_objects if ob.type=='MESH']
    ob=objects[0]; data=ob.data
    for ob in objects:bpy.data.objects.remove(ob,do_unlink=True)
    return data

def instance(data,name,x,y,z,scale=1,angle=0):
    ob=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(ob)
    ob.location=(x,y,z); ob.rotation_euler.z=angle
    ob.scale=(scale,scale,scale) if isinstance(scale,(int,float)) else scale
    return ob

def oak_model():
    """Original branching tree carrying the photographed oak twigs."""
    # Paula Benson, HD Oak Branch (CC0): https://opengameart.org/node/49256
    # Source photograph is trimmed and downsampled to a web atlas.
    bases=[Path(__file__).resolve().parent,Path.cwd(),*Path(__file__).resolve().parents]
    candidates=[root / sub / 'benson-oak-branch.png' for root in bases for sub in ('art','textures/alpstrand','assets/skatepark/textures/alpstrand')]
    source=next(path for path in candidates if path.is_file())
    image=bpy.data.images.load(str(source),check_existing=True)
    image.pack()
    leaf=mat('Pedunculate oak • photographed branch',(.22,.35,.075),.86)
    nodes=leaf.node_tree.nodes; links=leaf.node_tree.links
    tex=nodes.new('ShaderNodeTexImage');tex.image=image
    bsdf=nodes.get('Principled BSDF')
    links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
    clip=nodes.new('ShaderNodeMath');clip.operation='GREATER_THAN';clip.inputs[1].default_value=.38
    links.new(tex.outputs['Alpha'],clip.inputs[0]);links.new(clip.outputs[0],bsdf.inputs['Alpha'])
    # Dithered alpha in Blender; GLB exporter uses gltf alpha mode MASK below.
    leaf.surface_render_method='DITHERED'
    leaf.alpha_threshold=.38
    timber=mat('Oak bark • branching limbs',(.155,.099,.053),.95)
    templates=[]
    for variant in range(3):
        rng=random.Random(1289+variant)
        wood=Batch('Oak limbs '+str(variant),timber)
        crown=Batch('Oak shoots '+str(variant),leaf)
        points=[Vector((0,0,0)),Vector((.12,.12,1.25)),Vector((-.16,.08,2.55)),Vector((.07,-.15,3.85)),Vector((-.29,-.16,5.5)),Vector((-.12,.2,6.8)),Vector((.12,.14,7.95))]
        radii=[.255,.20,.168,.145,.11,.069,.018]
        for i in range(len(points)-1):wood.pipe(points[i],points[i+1],radii[i],radii[i+1],9)
        for i in range(26):
            f=i/26;phi=i*2.4+rng.uniform(-.4,.4)
            root=Vector((.04*math.sin(phi),.05*math.cos(phi),2.32+f*5.3))
            d=Vector((math.cos(phi),math.sin(phi),0))
            reach=(2.6+math.sin(f*3)*.65)*(1-.63*f**2)*rng.uniform(.83,1.12)
            joint=root+d*reach*.42+Vector((0,0,.75))
            tip=root+d*reach+Vector((0,0,1.65+rng.uniform(-.3,.3)))
            wood.pipe(root,joint,.102*(1-.48*f),.065,7);wood.pipe(joint,tip,.066,.022,6)
            for j in range(6):
                q=j/6
                a=joint.lerp(tip,q);ang=phi+(-1 if j%2 else 1)*rng.uniform(.35,1.24)
                lateral=Vector((math.cos(ang),math.sin(ang),rng.uniform(.12,.59)))
                b=a+lateral*rng.uniform(.83,1.52)
                wood.pipe(a,b,.029,.007,5)
                for k in range(5):
                    t=k/5;origin=a.lerp(b,t)
                    angle=ang+(1 if k%2 else -1)*rng.uniform(.27,1.25)
                    direction=Vector((math.cos(angle),math.sin(angle),rng.uniform(-.39,.72))).normalized()
                    side=direction.cross(Vector((0,0,1))).normalized()
                    up=direction.cross(side).normalized()
                    roll=rng.uniform(.35,2.75)
                    breadth=(side*math.cos(roll)+up*math.sin(roll))*rng.uniform(.22,.36)
                    end=origin+direction*rng.uniform(.88,1.47)
                    crown.poly(origin-breadth,end-breadth,end+breadth,origin+breadth)
        parts=[]
        for b in (wood,crown):
            ob=b.finish();data=ob.data
            if b==crown:
                uv=data.uv_layers.new()
                for poly in data.polygons:
                    for li,co in zip(poly.loop_indices,((0,0),(1,0),(1,1),(0,1))):uv.data[li].uv=co
            parts.append(data); bpy.data.objects.remove(ob,do_unlink=True)
        templates.append(parts)
    return templates

def alpine_range(layer):
    """Shared grid normals and a baked, slope-aware alpine albedo with snow in gullies."""
    import numpy as np
    from PIL import Image
    import tempfile

    seed=53573+31*layer
    rng=np.random.default_rng(seed)
    lattice=rng.uniform(-1,1,(257,257))
    def value_noise(x,y):
        ax=np.floor(x).astype(int);ay=np.floor(y).astype(int)
        fx=x-ax;fy=y-ay
        fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy)
        a=lattice[ay%256,ax%256];b=lattice[ay%256,(ax+1)%256]
        c=lattice[(ay+1)%256,ax%256];d=lattice[(ay+1)%256,(ax+1)%256]
        return (a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy
    def height(x,y):
        ridge=278+layer*69+8*np.sin(x*.023+layer)+5*value_noise(x*.026,layer+np.zeros_like(x))
        relief=8+4*np.sin(x*.018+layer*.91)+2.6*np.cos(x*.049+layer)+8.5/(1+np.exp(-(x-9)/33))
        # Interlocking long ridges create broad shoulders with asymmetrical summit faces.
        for center,prominence,west,east in [(-141,10,34,46),(-30,6,47,22),(61,11,42,53),(139,13,62,27),(184,8,15,44),(259,11,39,26)]:
            xx=x-center-layer*(18+4*np.sin(center))
            spread=np.where(xx<0,west,east)
            relief+=prominence*np.exp(-(xx/spread)**2*1.6)
        relief+=3.7*value_noise(x*.046+layer*9,np.full_like(x,7.37)) + 2.15*value_noise(x*.145,np.full_like(x,4.81+layer))
        d=abs(y-ridge)
        band=np.exp(-(d/(23+layer*5))**1.19)
        warp=2.3*value_noise(x*.09,y*.075)+1.2*value_noise(x*.23,y*.21)
        gullies=abs(value_noise((x+warp)*.115+y*.018,y*.032))
        strata=value_noise(x*.052,y*.059)*2.7+value_noise(x*.149+11,y*.137)*1.05
        return -.92+band*(relief+strata+4.4*gullies)-3.85*gullies*np.exp(-((d-10)/13)**2)
    x0,x1=-380,380;y0,y1=209+layer*69,315+layer*69
    # Texture resolution independent from the silhouette mesh; all runtime variation is a single JPEG.
    tx,ty=2048,384
    uu,vv=np.meshgrid((np.arange(tx)+.5)/tx,(np.arange(ty)+.5)/ty)
    x=x0+(x1-x0)*uu;y=y0+(y1-y0)*vv
    z=height(x,y); sx=(height(x+.4,y)-height(x-.4,y))/.8;sy=(height(x,y+.4)-height(x,y-.4))/.8
    slope=np.sqrt(sx*sx+sy*sy)
    broad=value_noise(x*.10,y*.09);mid=value_noise(x*.25+14,y*.23)
    grit=value_noise(x*.56,y*.49)+.30*value_noise(x*1.25+26,y*.84)
    streak=abs(value_noise(x*.4+5.1*np.sin(y*.17)+broad,y*.075))
    # Rock through talus and alpine meadow. Snow remains in high, sheltered gullies and north-facing shelves.
    meadow=np.clip((16.5-z)/7.0+(.63-slope)*.48+.27*broad,0,1)
    rock=np.array([116,133,143])+((broad*5+mid*5+grit*3-streak*10)[...,None])
    green=np.array([83,112,106])+((broad*8+mid*5+grit*3)[...,None])
    colour=rock*(1-meadow[...,None])+green*meadow[...,None]
    snowline=20.8+1.55*np.sin(x*.027)+1.45*broad+2.85*streak
    snowcov=np.clip((z-snowline)*.54+(.83-slope)*2.56+mid*.79+grit*.39,0,1)
    white=np.array([207,218,222])+(mid*3+grit*1.6)[...,None]
    colour=colour*(1-snowcov[...,None])+white*snowcov[...,None]
    mist=.13+.14*layer
    colour=colour*(1-mist)+np.array([159,183,200])*mist
    with tempfile.TemporaryDirectory() as tmp:
        filename=Path(tmp)/('Alpine range %s • baked strata.jpg'%layer)
        Image.fromarray(np.flipud(colour).clip(0,255).astype('uint8')).save(filename,quality=88)
        pic=bpy.data.images.load(str(filename));pic.pack()
    material=mat('Alpine • aerial perspective '+str(layer),(.38,.43,.48),.98)
    node=material.node_tree.nodes.new('ShaderNodeTexImage');node.image=pic
    material.node_tree.links.new(node.outputs['Color'],material.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    nx,ny=343,35
    u,v=np.meshgrid(np.linspace(0,1,nx),np.linspace(0,1,ny))
    xx=x0+u*(x1-x0); yy=y0+v*(y1-y0);zz=height(xx,yy)
    vertices=np.stack((xx,yy,zz),axis=2).reshape(-1,3).tolist()
    faces=[(i,i+1,i+1+nx,i+nx) for j in range(ny-1) for i in range(j*nx,(j+1)*nx-1)]
    mesh=bpy.data.meshes.new('Alpine ridgeline '+str(layer));mesh.from_pydata(vertices,[],faces);mesh.materials.append(material)
    mesh.polygons.foreach_set('use_smooth',np.ones(len(faces),dtype=bool))
    uv=mesh.uv_layers.new();vtx=np.empty(len(mesh.loops),dtype=np.int32); mesh.loops.foreach_get('vertex_index',vtx)
    uv.data.foreach_set('uv',np.column_stack((u.ravel()[vtx],v.ravel()[vtx])).astype('f').ravel())
    ob=bpy.data.objects.new(mesh.name,mesh);bpy.context.collection.objects.link(ob)
    return ob

def shoreline_woodland(batches,rng):
    """Irregular wooded shoreline with clumped rounded crowns and gaps around buildings."""
    woods=[]
    for name,col in [('willow',(.119,.202,.129)),('beech',(.139,.206,.112)),('alder',(.105,.164,.117)),('birch',(.17,.218,.131))]:
        b=Batch('Far woodland • '+name,mat('Hazy '+name,col))
        batches.append(b);woods.append(b)
    def crown(b,x,y,z,rx,ry,rz):
        rings=5;sides=7;start=len(b.v)
        for k in range(rings):
            lat=-math.pi/2+(k+.14)*math.pi/(rings-1+.28)
            for i in range(sides):
                az=i*math.tau/sides+.13*math.sin(k)
                uneven=rng.uniform(.88,1.12)
                b.v.append((x+rx*math.cos(lat)*math.cos(az)*uneven,y+ry*math.cos(lat)*math.sin(az)*uneven,z+rz*math.sin(lat)*uneven))
        for k in range(rings-1):
            for i in range(sides):
                a=start+k*sides+i;j=start+k*sides+(i+1)%sides;b.f.append((a,j,j+sides,a+sides))
        b.f.append(tuple(start+(rings-1)*sides+i for i in range(sides)))
    for group in range(112):
        x=rng.uniform(-280,280);y=rng.uniform(220,230)
        radius=rng.uniform(2.1,6.4); h=rng.uniform(1.25,3.8)
        if x>40 and rng.random()<.38:continue
        for i in range(rng.randrange(3,10)):
            xx=x+rng.uniform(-radius,radius);yy=y+rng.uniform(-2,2)
            hh=h*rng.uniform(.71,1.29);r=hh*rng.uniform(.49,.83)
            crown(rng.choice(woods),xx,yy,hh*.48-.32,r,r*.83,hh*.57)
    return woods

def lake_surface():
    """Tiling micro-wave normal and colour textures authored for this lake."""
    import numpy as np
    from PIL import Image
    import tempfile
    matl=mat('Lake • alpine wavelets',(.024,.20,.31),.25,.25)
    size=512
    u,v=np.meshgrid(np.arange(size,dtype=float)/size*math.tau,np.arange(size,dtype=float)/size*math.tau)
    elongated=np.sin(2*u+5*v)+.5*np.sin(-4*u+9*v)+.32*np.sin(3*u-13*v)
    crests=np.sin(u+36*v+.88*elongated)+.65*np.sin(4*u-49*v+1.1*elongated)+.25*np.sin(7*u+83*v+np.cos(3*u-5*v))
    slope_x=(np.roll(crests,1,axis=1)-np.roll(crests,-1,axis=1))*.18
    slope_y=(np.roll(crests,1,axis=0)-np.roll(crests,-1,axis=0))*.25
    normal=np.stack((slope_x,slope_y,np.ones_like(u)),axis=-1)
    normal/=np.linalg.norm(normal,axis=-1,keepdims=True)
    diffuse=np.array([42,121,150])+(1.8*elongated+3.4*crests)[...,None]
    nodes=matl.node_tree.nodes; links=matl.node_tree.links;bsdf=nodes.get('Principled BSDF')
    with tempfile.TemporaryDirectory() as td:
        for label,pixels in [('wind colour',diffuse),('wave normal',(normal*.5+.5)*255)]:
            f=Path(td)/('Lakeside '+label+'.png');Image.fromarray(np.flipud(pixels).clip(0,255).astype('uint8')).save(f)
            tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(f))
            if label=='wave normal':
                tex.image.colorspace_settings.name='Non-Color'
                n=nodes.new('ShaderNodeNormalMap'); n.inputs['Strength'].default_value=.36
                links.new(tex.outputs['Color'],n.inputs['Color']);links.new(n.outputs[0],bsdf.inputs['Normal'])
            else:links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
            tex.image.pack()
    b=Batch('Alpine lake • open water',matl)
    b.poly((-325,60,-1.44),(325,60,-1.44),(325,226,-1.44),(-325,226,-1.44))
    ob=b.finish();uv=ob.data.uv_layers.new()
    for li,co in zip(ob.data.polygons[0].loop_indices,((0,0),(28,0),(28,9),(0,9))):uv.data[li].uv=co

def build():
    rng=random.Random(27191)
    batches=[]
    def batch(n,c,r=.82,m=0):
        b=Batch(n,mat(n,c,r,m)); batches.append(b);return b
    grass=batch('Park turf • cut grass',(.135,.255,.049))
    grassdark=batch('Distant wooded shoreline',(.064,.147,.092))
    earth=batch('Natural gravel shoreline',(.42,.38,.29))
    walk=batch('Lakeside promenade • aggregate',(.55,.51,.44))
    trim=batch('Lamp masts and fence frames',(.045,.069,.082),.43,.58)
    wire=batch('Galvanised barrier mesh',(.24,.29,.29),.51,.55)
    bolted=batch('Aluminium luminaires',(.30,.34,.36),.37,.70)
    light=batch('Floodlight reflectors',(.91,.90,.77),.30,.25)
    paving=batch('Pavilion base and plinths',(.48,.48,.445))
    zinc=batch('Pavilion roof and ridge capping',(.28,.38,.41),.36,.58)
    fascia=batch('Pavilion fascia and cedar posts',(.43,.216,.092))
    banner=batch('Competition flags • violet',(.42,.12,.30))
    orange=batch('Competition flags • apricot',(.95,.435,.078))
    snowlogo=batch('Competition flags • alpine insignia',(.92,.93,.87))
    # The park floor stops at the inside edge of this perimeter. Keep grass and water below it.
    for x in (-73,73):grass.box(x,0,-1.44,50,136,1.24)
    for y in (-55.5,55.5):grass.box(0,y,-1.44,96,25,1.24)
    for x in (-51.2,51.2):walk.box(x,0,-.18,3.2,88,.14)
    walk.box(0,46.8,-.18,105,3.5,.14)
    earth.box(0,65.6,-1.55,230,6,.55)
    lake_surface()
    for layer in (1,0):alpine_range(layer)
    for x in range(-325,325,4):
        def far_bank(xx):
            return 207+1.7*math.sin(xx*.057)+.9*math.sin(xx*.23)
        a=far_bank(x);b=far_bank(x+4)
        grassdark.poly((x,a,-1.48),(x+4,b,-1.48),(x+4,b+3,-.42),(x,a+3,-.42))
        grassdark.poly((x,a+3,-.42),(x+4,b+3,-.42),(x+4,237,-.38),(x,237,-.38))
    far_woods=shoreline_woodland(batches,random.Random(53121))
    # Existing Fritidsparken models have editable originals and embedded pigments.
    elm=load_asset('trees/elm-lod.glb'); bench=load_asset('street-furniture/harbour-bench.glb')
    tenement=load_asset('buildings/rose-tenement-distance.glb')
    for side in (-1,1):
        for i in range(11):
            x=side*rng.uniform(54.5,60);y=-46+i*9+rng.uniform(-1.8,1.8)
            instance(elm,'Perimeter elm',x,y,-.22,rng.uniform(.76,1.33),rng.uniform(0,math.tau))
    oaks=oak_model()
    def oak(x,y,z,scale):
        angle=rng.uniform(0,math.tau)
        for data in rng.choice(oaks):
            instance(data,'Lakeshore oak • '+data.name,x,y,z,scale,angle)
    for x in (-63,-58,-54,-49,-44,-39,-35,-32,-27,-21,-15,-8,1,12,22,41,55,64):
        oak(x,rng.uniform(49,59),-.23,rng.uniform(.82,1.55))
    for x,y,scale in [(-26.5,-46,1.52),(20,-48,1.48),(-46,-27,1.22),(47,-22,1.12),(-46,16,1.26),(51,18,.77)]:
        oak(x,y,-.15,scale)
    # An irregular wooded peninsula screens the lake to the west and curves towards the inlet.
    def shore(x):
        return 66+103/(1+math.exp((x+24)/13))+7*math.sin(.115*x)
    for x in range(-148,98,2):
        y1=shore(x); y2=shore(x+2)
        grass.poly((x,64,-.25),(x+2,64,-.25),(x+2,y2,-.70),(x,y1,-.70))
        earth.poly((x,y1,-.70),(x+2,y2,-.70),(x+2,y2+.9,-1.56),(x,y1+.9,-1.56))
    for i in range(70):
        x=rng.uniform(-125,0);y=rng.uniform(64,max(65,shore(x)-1))
        instance(elm,'Peninsula woodland',x,y,-.35,rng.uniform(.5,.95),rng.uniform(0,math.tau))
    for x,y,a in ((-46,-7,1.57),(-45,12,1.57),(42,24,-1.57),(12,42,0),(25,42,0),(39,42,0)):
        instance(bench,'Shared harbour bench',x,y,.02,1,a)
    for i in range(23):
        center=rng.choice((-52,24,67,84,103,122,142))
        x=center+rng.uniform(-11,11);y=rng.uniform(211,221)
        s=rng.uniform(.18,.32)
        instance(tenement,'Distant lakeside houses',x,y,-.32,(s*rng.uniform(.78,1.3),s,s),rng.uniform(-.22,.22))
    blocks=batch('Lake district • pale limestone',(.43,.48,.50))
    windows=batch('Lake district • blue grey windows',(.17,.27,.31),.39,.24)
    for x,y,w,d,h in [(91,222,3.4,2.7,8.2),(99,222,5.1,3.1,7.3),(108,224,3.3,3.4,5.5),(74,221,3.8,3.3,4.1),(126,219,5.7,3.5,5.8)]:
        blocks.box(x,y,-.3,w,d,h)
        for col in range(6):
            for floor in range(int(h/.87)):
                windows.box(x-w*.42+col*w*.16,y-d/2-.012,floor*.85+.08,w*.105,.04,.47)
    # Sports floodlights have a trussed head, luminous faces, a mounting base and woven flags.
    for x,y,h in [(-45,36,12.3),(-20,39.8,14.2),(34,36.8,13.2),(46,-28,11.0),(-46,-28,10.8)]:
        paving.box(x,y,0,.71,.71,.22);trim.pipe((x,y,.2),(x,y,h),.135,.069,10)
        trim.pipe((x-.85,y,h-.35),(x+.85,y,h-.35),.068,n=8)
        for sx in (-.64,0,.64):
            trim.pipe((x+sx,y,h-.35),(x+sx,y,h),.044,n=6)
            bolted.box(x+sx,y,h-.01,.46,.30,.35);light.box(x+sx,y-.158,h+.025,.373,.024,.237)
        trim.pipe((x,y,h*.76),(x+.93,y,h*.76),.035,n=6)
        z=h*.76
        for i in range(8):
            a=i/8;b=(i+1)/8
            va=.08*math.sin(a*4);vb=.08*math.sin(b*4)
            banner.poly((x+a*.92,y+va,z-.1),(x+a*.92,y+va,z-2.2),(x+b*.92,y+vb,z-2.2),(x+b*.92,y+vb,z-.1))
        snowlogo.poly((x+.13,y-.045,z-1.57),(x+.53,y-.05,z-.64),(x+.81,y-.055,z-1.57))
    # Tubular perimeter handrail and welded infill. Small viewing gates stay open at the rear.
    for a,b in [((-48,-43),(48,-43)),((-48,-43),(-48,43)),((48,-43),(48,43)),((-48,43),(-9,43)),((-6,43),(22,43)),((25,43),(48,43))]:
        p=Vector((*a,0));q=Vector((*b,0));d=(q-p);length=d.length; segments=math.ceil(length/2.55)
        for z,r in ((.16,.026),(1.09,.034),(1.22,.047)):
            trim.pipe(p+Vector((0,0,z)),q+Vector((0,0,z)),r,n=7)
        for i in range(segments+1):
            v=p+d*i/segments;trim.pipe(v,v+Vector((0,0,1.22)),.044,n=7)
        for i in range(1,int(length/.23)):
            v=p+d*(i*.23/length);wire.pipe(v+Vector((0,0,.17)),v+Vector((0,0,1.08)),.012,n=4)
        for z in (.36,.57,.78,.96):wire.pipe(p+Vector((0,0,z)),q+Vector((0,0,z)),.011,n=4)
    # Lakeside pavilion with a pitched sheet-metal roof and visible rafters on its underside.
    x,y=28,45
    paving.box(x,y,0,7.2,4.0,.16)
    for dx in (-3,0,3):
        for dy in (-1.55,1.55):fascia.box(x+dx,y+dy,.14,.16,.16,2.88)
        for dy in (-1.9,1.9):fascia.pipe((x+dx,y+dy,3.02),(x+dx,y,3.72),.085,n=4)
    for s in (-1,1):
        zinc.poly((x-3.85,y,3.76),(x-3.85,y+s*2.2,2.99),(x+3.85,y+s*2.2,2.99),(x+3.85,y,3.76))
        fascia.box(x,y+s*2.18,2.90,7.7,.12,.12)
    for b in batches:
        ob=b.finish()
        if ob and b in far_woods:
            for poly in ob.data.polygons:poly.use_smooth=True
