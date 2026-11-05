"""Original modular street course for the alpine lakeside park. Distances in metres."""
import bpy
import math
import random
import numpy as np
from mathutils import Vector

ROOT = 'Street • asphalt to alpine'
rng = random.Random(53171)
M = {}
group = None


def collection(name, parent):
    c = bpy.data.collections.new(name)
    parent.children.link(c)
    return c


def tex(name, pixels):
    import tempfile
    import os
    n = pixels.shape[0]
    im = bpy.data.images.new(name, width=n, height=n, alpha=False)
    rgba = np.ones((n, n, 4), dtype=np.float32)
    rgba[:, :, :3] = pixels
    im.pixels.foreach_set(rgba.ravel())
    with tempfile.TemporaryDirectory() as d:
        im.filepath_raw = os.path.join(d, name + '.png')
        im.file_format = 'PNG'
        im.save()
        im.pack()
    return im


def mat(name, rgb, rough=.72, metal=0):
    m = bpy.data.materials.new('Street | ' + name)
    m.diffuse_color = (*rgb, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*rgb, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    m.asset_mark()
    M[name] = m
    return m


def materials():
    mats = [
        ('cast', (.48,.46,.43), .87,0), ('edge', (.66,.64,.60),.72,0),
        ('aggregate', (.29,.27,.25),.92,0),('ocher',(.92,.23,.043),.71,0),
        ('ocean',(.03,.23,.38),.68,0),('ivory',(.87,.82,.64),.76,0),
        ('navy',(.017,.067,.135),.32,.58),('zinc',(.40,.42,.43),.33,.84),
        ('graphite',(.036,.041,.043),.56,.32),('loam',(.077,.040,.016),.98,0),
        ('leaf dark',(.05,.132,.025),.82,0),('leaf',(.14,.31,.034),.83,0),
        ('leaf light',(.31,.42,.055),.78,0),('petal',(.68,.066,.15),.8,0),
        ('gold',(.94,.59,.052),.82,0),('purple',(.38,.088,.42),.84,0)]
    for k,c,r,m in mats:
        mat(k,c,r,m)
    # Seamless original baked colour and relief shared by the four slab finishes.
    r = np.random.default_rng(5904)
    n = 256
    y,x = np.mgrid[0:n,0:n] / n
    cloud = np.zeros((n,n))
    for f,a in [(1,.055),(3,.030),(7,.015),(16,.010)]:
        for _ in range(4):
            ax,ay = r.integers(-f,f+1,2)
            cloud += a * np.cos(2*np.pi*(ax*x+ay*y)+r.random()*6.28)
    grain = r.normal(0,.019,(n,n))
    pits = np.maximum(0,-grain-.024)*2
    relief = grain+cloud*.07-pits
    dx,dy = (np.roll(relief,-1,i)-np.roll(relief,1,i) for i in (1,0))
    normals = np.stack([-dx*2.1,-dy*2.1,np.ones_like(dx)],2)
    normals /= np.linalg.norm(normals,axis=2)[:,:,None]
    normal = tex('alpine_street_cement_normal', normals*.5+.5)
    normal.colorspace_settings.name='Non-Color'
    for k, base in [('cast',[.71,.70,.675]),('edge',[.84,.825,.785]),
                    ('aggregate',[.56,.54,.51]),('ocher',[.90,.46,.17])]:
        im = tex('alpine_street_'+k, np.clip((1+cloud[:,:,None])*np.array(base)
                      +(grain-pits)[:,:,None],0,1))
        nt = M[k].node_tree
        p = nt.nodes.get('Principled BSDF')
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = im
        nt.links.new(t.outputs['Color'],p.inputs['Base Color'])
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = normal
        nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value=.38
        nt.links.new(t.outputs['Color'],nm.inputs['Color'])
        nt.links.new(nm.outputs['Normal'],p.inputs['Normal'])


def mesh(name, verts, faces, keys, mi=None, smooth=False, target=None):
    data = bpy.data.meshes.new(name)
    data.from_pydata(verts,[],faces)
    data.update()
    ob = bpy.data.objects.new(name,data)
    (target or group).objects.link(ob)
    for k in keys: data.materials.append(M[k])
    uv = data.uv_layers.new(name='Metres x 0.5')
    for f in data.polygons:
        if mi: f.material_index=mi[f.index]
        f.use_smooth=smooth
        axis=max(range(3),key=lambda a:abs(f.normal[a]))
        axes=[(1,2),(0,2),(0,1)][axis]
        for li in f.loop_indices:
            v=data.vertices[data.loops[li].vertex_index].co
            uv.data[li].uv=(v[axes[0]]*.5,v[axes[1]]*.5)
    return ob


def frame(a,b):
    u=(Vector(b)-Vector(a)).normalized()
    v=Vector((-u.y,u.x))
    def pt(s,t,z):
        return (a[0]+u.x*s+v.x*t,a[1]+u.y*s+v.y*t,z)
    return pt,(Vector(b)-Vector(a)).length


def extrusion(name,a,b,profile,width,top='cast',side='aggregate',base=-.025,side2=None):
    point,L=frame(a,b)
    v=[]; f=[]; mi=[]
    for s,z in profile:
        v.extend([point(s,-width/2,z),point(s,width/2,z),
                  point(s,-width/2,base),point(s,width/2,base)])
    for i in range(len(profile)-1):
        j=i*4;k=j+4
        f.extend([(j,k,k+1,j+1),(j+2,k+2,k,j),(j+1,k+1,k+3,j+3),(j+3,k+3,k+2,j+2)])
        mi.extend([0,1,2 if side2 else 1,1])
    j=(len(profile)-1)*4
    f.extend([(0,1,3,2),(j+2,j+3,j+1,j)])
    mi.extend([1,1])
    return mesh(name,v,f,[top,side]+([side2] if side2 else []),mi)


def beam_data(v,f,a,b,r,segments=12):
    p,q=Vector(a),Vector(b)
    d=(q-p).normalized()
    u=d.cross(Vector((0,0,1)) if abs(d.z)<.94 else Vector((1,0,0))).normalized()
    w=d.cross(u)
    start=len(v)
    for c in (p,q):
        for i in range(segments):
            t=math.tau*i/segments
            v.append(tuple(c+r*(u*math.cos(t)+w*math.sin(t))))
    for i in range(segments):
        j=(i+1)%segments
        f.append(tuple(start+k for k in (i,j,j+segments,i+segments)))
    f.extend([tuple(start+i for i in reversed(range(segments))),
              tuple(start+i+segments for i in range(segments))])


def rail(name, path, height=.69, radius=.048):
    v=[];f=[]
    for a,b in zip(path,path[1:]): beam_data(v,f,a,b,radius,16)
    ob=mesh('GRIND_'+name,v,f,['navy'],smooth=True)
    ob['grindPath']=[float(k) for pt in path for k in pt]
    # Worn, bare top line on each powder coated rail.
    v=[];f=[]
    for a,b in zip(path,path[1:]):
        aa=list(a);bb=list(b);aa[2]+=radius*.81;bb[2]+=radius*.81
        beam_data(v,f,aa,bb,.011,8)
    mesh(name+' • polished crown',v,f,['zinc'],smooth=True)
    v=[];f=[];mv=[];mf=[]
    for j,(a,b) in enumerate(zip(path,path[1:])):
        a,b=Vector(a),Vector(b)
        span=(b-a).length
        n=max(1,math.ceil(span/2.3))
        samples=[i/n for i in range(n)]+([1] if j==len(path)-2 else [])
        for t in samples:
            p=a.lerp(b,t);foot=p-Vector((0,0,height))
            beam_data(v,f,foot,p,radius*.78)
            beam_data(mv,mf,foot,foot+Vector((0,0,.017)),radius*2.5)
    mesh(name+' • welded uprights',v,f,['navy'],smooth=True)
    mesh(name+' • anchor plates',mv,mf,['zinc'])
    return ob


def advanced_art(name,a,b,width,profile):
    # Original screen-printed mountain skyline on the long street platform fascia.
    point,L=frame(a,b)
    h=min(z for _,z in profile)
    if h<.25: return
    v=[]; f=[]; mi=[]
    for sign in [-1,1]:
        for i in range(14):
            s=L*(i-.45)/14
            s0=max(0,s);s1=min(L,s+L*.13);sp=(s0+s1)*.5
            h1=h*(.48+.39*rng.random())
            j=len(v); offset=sign*(width*.5+.002+i*.0002)
            v.extend([point(s0,offset,.04),point(s1,offset,.04),point(sp,offset,h1)])
            f.append((j,j+1,j+2) if sign<0 else (j+2,j+1,j)); mi.append(i%3)
    mesh(name+' • printed alpine skyline',v,f,['ocean','ocher','ivory'],mi)


def stair_set():
    a,b=(-15.5,-.7),(-19.8,6.8)
    p,L=frame(a,b); treads=11; h=1.65
    run=3.65
    profile=[(0,.003)]
    for i in range(treads):
        z=h*(i+1)/treads
        profile.extend([(i*run/treads,z),((i+1)*run/treads,z)])
    profile += [(L-2.3,h),(L, .007)]
    extrusion('RIDE_Tribune | eleven sawn concrete treads',a,b,profile,6.6,'edge','aggregate')
    for sign in (-1,1):
        offset=sign*3.56
        start=p(-.5,offset,0)[:2]; end=p(L,offset,0)[:2]
        shape=[(0,.30),(run+.5,h+.3),(L-2.3+.5,h+.3),(L+.5,.30)]
        extrusion('RIDE_Tribune | cheek ledge',start,end,shape,.52,'edge','cast')
        rail('Tribune ledge '+str(sign),[p(-.45,offset,.32),p(run,offset,h+.32),
             p(L-2.3,offset,h+.32)],height=.02,radius=.022)
    rail('Tribune main descending handrail',[p(-.38,0,.75),p(0,0,.75),
         p(run,0,h+.75),p(run+.8,0,h+.75)],height=.75)
    # Parallel return bank gives wheels a continuous ascent beside the flight.
    start=p(-.2,4.94,0)[:2];end=p(L,4.94,0)[:2]
    extrusion('RIDE_Tribune | return bank',start,end,
      [(0,.004),(run+.2,h),(L-2.3+.2,h),(L+.2,.004)],2.22)


def curved_bank(name,a,b,width,h,toplen,rail_it=False):
    p,L=frame(a,b); d=(L-toplen)/2
    up=[(d*t/16,h*(1-math.cos(math.pi*.5*t/16))) for t in range(17)]
    shape=up+[(L-s,z) for s,z in reversed(up)]
    extrusion('RIDE_'+name,a,b,shape,width,'cast','ocher')
    # Fine silver seams and steel coping along the lips.
    for s in [d,L-d]:
        rail(name+' lip '+str(round(s,1)),[p(s,-width/2,h+.024),p(s,width/2,h+.024)],
             height=.015,radius=.033)
    if rail_it:
        rail(name+' top rail',[p(d,0,h+.64),p(L-d,0,h+.64)],height=.64)


def pad(name,a,b,w,h):
    p,L=frame(a,b)
    profile=[(0,h),(L,h)]
    extrusion('RIDE_'+name,a,b,profile,w,'edge','cast')
    for t in [-w*.5,w*.5]:
        rail(name+' steel edge '+str(t),[p(0,t,h+.013),p(L,t,h+.013)],height=.01,radius=.018)
    return profile


def planter(name,a,b,width,h):
    pt,L=frame(a,b)
    for t in [-width/2+.09,width/2-.09]:
        start,end=pt(0,t,0)[:2],pt(L,t,0)[:2]
        extrusion('RIDE_'+name+' curb',start,end,[(0,h),(L,h)],.18,'edge','cast')
    for s in [0,L-.16]:
        extrusion('RIDE_'+name+' end cap',pt(s,0,0)[:2],pt(s+.16,0,0)[:2],
                  [(0,h),(.16,h)],width,'edge','cast')
    extrusion(name+' soil',pt(.14,0,0)[:2],pt(L-.14,0,0)[:2],[(0,h-.12),(L-.28,h-.12)],
              width-.30,'loam','loam')
    v=[]; f=[]; indices=[]
    def poly(points,m):
        i=len(v);v.extend(points);f.append(tuple(range(i,i+len(points))));indices.append(m)
    count=int(L*width*5)
    for n in range(count):
        s=rng.uniform(.22,L-.22); t=rng.uniform(-width/2+.23,width/2-.23)
        c=Vector(pt(s,t,h-.13)); size=rng.uniform(.17,.48)
        for i in range(8):
            angle=rng.random()*math.tau
            axis=Vector((math.cos(angle),math.sin(angle),0))
            side=Vector((-axis.y,axis.x,0))*rng.uniform(.013,.048)
            mid=c+axis*size*.43+Vector((0,0,size*.75))
            tip=c+axis*size+Vector((0,0,size*rng.uniform(.7,1.65)))
            col=rng.randrange(3)
            poly([c,mid-side,tip,mid],col)
            poly([c,mid,tip,mid+side],(col+1)%3)
        if n%3==0:
            center=c+Vector((0,0,size*1.43));stem=c+Vector((.015,0,.04))
            d=Vector((.009,.002,0))
            poly([stem-d,stem+d,center+d,center-d],0)
            col=3+rng.randrange(3)
            for i in range(5):
                angle=i*math.tau/5
                ax=Vector((math.cos(angle),math.sin(angle),0))*.047
                side=Vector((-ax.y,ax.x,0))*.45
                poly([center,center+ax*.6-side,center+ax+Vector((0,0,.018)),center+ax*.6+side],col)
    ob=mesh(name+' • ornamental grasses & perennials',v,f,
            ['leaf dark','leaf','leaf light','petal','gold','purple'],indices)
    ob['detailClass']='planting'


def build():
    global group
    rng.seed(53171)
    materials()
    root=collection(ROOT,bpy.context.scene.collection)
    sections=[
      ('Grand stair and return bank',stair_set),
      ('Long orange transfer',lambda:curved_bank('Copper ribbon',(-14,-10),(-4,-5.2),3.3,1.38,4.5,True)),
      ('Twin hip funbox',lambda:curved_bank('Twin peak hip',(3.7,-1.9),(11.9,2.1),4.4,1.28,2.8,True)),
    ]
    for n,fn in sections:
        group=collection(n,root); fn()
    group=collection('Street lines | manual pads and rails',root)
    a,b=(-32,-1.3),(-23,-4.5)
    advanced_art('Split ledge',a,b,1.2,pad('Split ledge',a,b,1.2,.45))
    pad('East slab',(14,-4.5),(20.6,-1.2),1.1,.55)
    pad('Manual island',(-29,11.3),(-21,12.6),1.65,.54)
    rail('East standalone',[(x,y,.67) for x,y in [(12,-5),(17.6,-2.4)]])
    rail('West entry', [(-41,-3,.69),(-35,-5.1,.69),(-30,-7.7,.69)])
    rail('Forecourt rail',[(-20,-11,.62),(-12,-9.5,.62)])
    rail('East return rail',[(16,4,.7),(22.5,1.6,.7)])
    rail('Rear flat bar',[(-5.5,14,.62),(1.6,14.7,.62)])
    group=collection('Rear line | banks & kickers',root)
    curved_bank('Planter hip',(-6.9,7.5),(-.9,8.3),2.3,.86,1.8)
    curved_bank('Railway wedge',(-31,16),(-25,16.8),3,.82,2.4)
    group=collection('Concrete planting islands',root)
    for name,a,b,w,h in [
      ('Agastache',(-37,6.1),(-29.5,5.4),2.1,.55),
      ('Wild lupine',(-27,5.6),(-22.4,4.5),1.5,.59),
      ('Copper sedge',(-10,10.8),(-4.6,11.5),1.6,.54),
      ('West border',(-39,-8),(-34,-9.7),1.5,.56),
      ('East border',(24.6,-6.7),(32.2,-8.7),1.5,.58),
      ('Lake border',(29,9.4),(33.9,11.3),1.35,.54),
      ('Bowl island',(-1.5,-10.8),(4,-10.4),1.45,.55)]:
        planter(name,a,b,w,h)
    for c in root.children:
        c.asset_mark()
        c.asset_data.description='Original Blender street module. Metres; Blender Z up.'
    return root
