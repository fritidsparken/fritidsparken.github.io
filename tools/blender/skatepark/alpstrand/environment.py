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
    water=batch('Lake • alpine blue water',(.025,.205,.32),.25,.28)
    water.box(0,143,-1.52,620,166,.08)
    wave=batch('Lake • wind driven glints',(.156,.386,.47),.36,.18)
    for i in range(1050):
        x=rng.uniform(-185,185);y=rng.uniform(64,220);s=rng.uniform(.12,1.3)
        wave.poly((x-s,y,-1.433),(x,y-.024,-1.433),(x+s*1.4,y+.01,-1.433),(x+.12,y+.036,-1.433))
    # Two mountain ranges, ridged and broken by saddles. Snow collects in irregular high cirques.
    stone=[batch('Alpine slate '+str(k),c) for k,c in enumerate([
        (.235,.308,.365),(.278,.366,.427),(.33,.413,.47),(.402,.483,.53)])]
    snow=[batch('Alpine snow '+str(k),c) for k,c in enumerate([(.71,.80,.845),(.865,.91,.92)])]
    def mountain(x,y,layer):
        ridgey=278+layer*75+11*math.sin(x*.026+layer)
        band=math.exp(-((y-ridgey)/(29+layer*8))**2)
        peaks=8+3*math.sin(.019*x+layer)+6*abs(math.sin(.014*x+1.2+layer))+min(20,max(0,(x-7)*.15))
        peaks+=11*max(0,math.cos((x-121)*.034+layer*.41))**8
        k=noise.fractal(Vector((x*.054,y*.068,layer+2)),1.05,2,4)*5.6
        return max(-1.2,band*(peaks+k)+k*.24-2)
    for layer in (1,0):
        dx=3.2;dy=4; start=224+layer*69
        for ix in range(-118,118):
            x=ix*dx
            for j in range(21):
                y=start+j*dy
                q=[(a,b,mountain(a,b,layer)) for a,b in ((x,y),(x+dx,y),(x+dx,y+dy),(x,y+dy))]
                for ids in ((0,1,2),(0,2,3)):
                    pts=[q[k] for k in ids]; height=sum(p[2] for p in pts)/3
                    n=noise.noise_vector(Vector((x*.15,y*.09,layer+.26))).z
                    facet=pts[1][2]-pts[0][2]
                    m=snow[int(facet<1)] if height>22+4*math.sin(x*.033+layer)+n*3+max(0,facet*1.2) else stone[min(3,max(0,round(1.2+layer+.44*facet+n)))]
                    m.poly(*pts)
    grassdark.box(0,228,-1.54,520,10,1.3)
    forest=[batch('Pine forest '+str(i),c) for i,c in enumerate([(.06,.13,.093),(.097,.184,.116),(.13,.216,.143)])]
    for i in range(1520):
        x=rng.uniform(-240,240);y=rng.uniform(218,236);h=rng.uniform(2.4,6.8)
        forest[i%3].pipe((x,y,-.37),(x,y,h),h*.23,.035,5)
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
    for b in batches:b.finish()
