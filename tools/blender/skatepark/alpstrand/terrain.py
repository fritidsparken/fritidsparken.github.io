"""Camera-oriented construction of the lakefront concrete skatepark, in metres."""
import math
import bpy
from mathutils import Vector, geometry

TAU = 2 * math.pi
PALETTE = {
    "Concrete": (.55, .54, .51), "Plywood": (.66, .34, .14),
    "BlueSteel": (.025, .19, .43), "DarkSteel": (.04, .063, .078),
    "Orange": (.93, .29, .045), "Octopus": (.18, .57, .66),
    "Sunset": (.86, .41, .21), "Mountains": (.12, .27, .33),
    "Chevrons": (.93, .34, .033)
}


def mat(key):
    name = "Highland_" + key
    value = bpy.data.materials.get(name)
    if value is None:
        value = bpy.data.materials.new(name)
        value.diffuse_color = (*PALETTE[key], 1)
        value.roughness = .46 if "Steel" in key else .82
        value.metallic = .74 if "Steel" in key else 0
    return value


def mesh(name, verts, faces, material, uv=None, smooth=False):
    data = bpy.data.meshes.new(name)
    data.from_pydata(verts, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    data.materials.append(mat(material))
    obj["skateSurface"] = name.startswith("RIDE_")
    layer = data.uv_layers.new(name="UVMap")
    for face in data.polygons:
        face.use_smooth = smooth
        for loop in face.loop_indices:
            index = data.loops[loop].vertex_index
            x, y, z = verts[index]
            if uv:
                value = uv[index]
            elif abs(face.normal.z) > .5:
                value = (x / 2, y / 2)
            elif abs(face.normal.y) > abs(face.normal.x):
                value = (x / 2, z / 2)
            else:
                value = (y / 2, z / 2)
            layer.data[loop].uv = value
    return obj


def section(name, verts, n, material, uv=None, smooth=False, loop=False):
    faces = []
    for i in range(len(verts) // n - 1):
        for j in range(n if loop else n - 1):
            a, b = i*n+j, i*n+(j+1)%n
            faces.append((a, b, b+n, a+n))
    return mesh(name, verts, faces, material, uv, smooth)


def tubes(name, paths, radius, material, sides=8):
    vertices, faces = [], []
    for path in paths:
        base = len(vertices)
        for i, point in enumerate(path):
            p = Vector(point)
            tan = (Vector(path[min(i+1,len(path)-1)]) -
                   Vector(path[max(i-1,0)])).normalized()
            axis = Vector((0,0,1)) if abs(tan.z) < .9 else Vector((0,1,0))
            side = tan.cross(axis).normalized()
            up = tan.cross(side).normalized()
            for j in range(sides):
                a = TAU*j/sides
                vertices.append(tuple(p + radius*(side*math.cos(a)+up*math.sin(a))))
            if i:
                start = base+(i-1)*sides
                for j in range(sides):
                    k = (j+1)%sides
                    faces.append((start+j,start+k,start+sides+k,start+sides+j))
    if faces:
        return mesh(name, vertices, faces, material, smooth=True)


def blocks(name, parts, material):
    verts, faces = [], []
    for x,y,z,w,d,h in parts:
        base = len(verts)
        for dz in (0,h):
            verts.extend([(x-w/2,y-d/2,z+dz),(x+w/2,y-d/2,z+dz),
                          (x+w/2,y+d/2,z+dz),(x-w/2,y+d/2,z+dz)])
        faces.extend(tuple(base+i for i in face) for face in
                     ((3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)))
    return mesh(name, verts, faces, material)


def contour(points, steps=8):
    result = []
    for i in range(len(points)):
        a,b,c,d = [Vector(points[(i+j)%len(points)]) for j in (-1,0,1,2)]
        for k in range(steps):
            t = k / steps
            point = .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t**3)
            result.append(tuple(point))
    return result


def bowl(name, points, center, depth):
    outline = contour(points)
    n = len(outline)
    normals = []
    for i in range(n):
        dx = outline[(i+1)%n][0] - outline[i-1][0]
        dy = outline[(i+1)%n][1] - outline[i-1][1]
        q = math.hypot(dx,dy)
        normals.append((dy/q,-dx/q))
    # Parallel offsets preserve wall radius independently of the basin footprint.
    # Relative inward scaling on the short necks prevents self intersections.
    widths = []
    for i, p in enumerate(outline):
        prev, nex = outline[i-1], outline[(i+1)%n]
        a = Vector(p)-Vector(prev)
        b = Vector(nex)-Vector(p)
        cross = a.x*b.y - a.y*b.x
        radius = (a.length*b.length*(a+b).length/(2*cross)) if cross>1e-8 else 1000
        widths.append(min(depth*.98, .70*radius))
    # Bound rate of wall-width changes to keep transitions along the coping gentle.
    for _ in range(3):
        for order, step in ((range(n),-1),(reversed(range(n)),1)):
            for i in order:
                j=(i+step)%n
                widths[i]=min(widths[i],widths[j]+.25*math.dist(outline[i],outline[j]))
    rings = []
    for k in range(25):
        theta = math.pi/2*k/24
        inward = 1-math.cos(theta)
        z = -depth*math.sin(theta)
        row = [(x-inward*w*nx,y-inward*w*ny,z) for (x,y),(nx,ny),w in zip(outline,normals,widths)]
        rings.append(row)
    verts = [v for row in rings for v in row]
    faces = []
    for i in range(24):
        for j in range(n):
            a = i*n+j
            b = i*n+(j+1)%n
            faces.append((a,b,b+n,a+n))
    # CDT supports concave multi-lobed bowl floors without a triangle fan.
    bottom = [Vector((x,y)) for x,y,z in rings[-1]]
    coords, _, tris, _, _, _ = geometry.delaunay_2d_cdt(bottom, [], [list(range(n))], 1, .00001)
    offset = len(verts)
    verts.extend((p.x,p.y,-depth) for p in coords)
    faces.extend(tuple(offset+j for j in tri) for tri in tris)
    mesh("RIDE_"+name,verts,faces,"Concrete",smooth=True)
    ring = [(x,y,.012) for x,y in outline]
    path=ring+[ring[0]]
    coping=tubes("GRIND_Coping_"+name,[path],.085,"BlueSteel",12)
    coping["grindPath"]=[float(v) for x,y,z in path for v in (x,y,z+.065)]
    # Broken painted accent following the perimeter, flush with the concrete.
    for number,(start,end) in enumerate(((.04,.25),(.39,.55),(.74,.94))):
        stripe = []
        for j in range(int(start*n),int(end*n)):
            x,y = outline[j]
            nx,ny = normals[j]
            width = .16 + .37*math.sin(math.pi*(j-int(start*n))/((end-start)*n))
            stripe.extend(((x+.13*nx,y+.13*ny,.009),(x+width*nx,y+width*ny,.009)))
        section("DeckPaint_"+name+str(number),stripe,2,"Orange")
    return outline


def volcano(cx,cy,bottom):
    # Raised volcanic island with a rounded shoulder and a flat manual platform.
    n=96
    profile=[(5.6,0),(5.32,.035),(5,.12),(4.6,.32),(4.25,.57),(3.86,.92),
             (3.52,1.33),(3.26,1.72),(2.99,2.14),(2.70,2.55),(2.46,2.82),
             (2.21,3.02),(2.01,3.1),(1.87,3.12),(.06,3.12)]
    verts=[]
    for r,h in profile:
        verts.extend((cx+1.14*r*math.cos(TAU*j/n),cy+.83*r*math.sin(TAU*j/n),bottom+h) for j in range(n))
    obj=section("RIDE_Ember_island",verts,n,"Concrete",smooth=True,loop=True)
    # Independently curved painted tongues follow the radial surface profile.
    import bisect
    heights=[h for _,h in profile[:14]]
    flames_v,flames_f=[],[]
    for j in range(12):
        start=TAU*j/12
        top=1.55+.56*(1+math.sin(2.31*j))
        foot=.11+.035*math.cos(j*.91)
        base=len(flames_v)
        for k in range(32):
            f=k/31
            height=.065+top*f
            i=bisect.bisect_right(heights,height)-1
            fz=(height-heights[i])/(heights[i+1]-heights[i])
            r=profile[i][0]*(1-fz)+profile[i+1][0]*fz+.012
            curve=start+.14*math.sin(f*3.8+j*.6)*f+.24*f
            spread=foot*(1-f**1.2)*(1+.34*math.sin(f*5))
            for a in (curve-spread,curve+spread):
                flames_v.append((cx+1.14*r*math.cos(a),cy+.83*r*math.sin(a),bottom+height+.006))
            if k:
                q=base+2*k
                flames_f.append((q-2,q-1,q+1,q))
    mesh("Island_painted_flames",flames_v,flames_f,"Orange",smooth=True)
    lip=[(cx+1.14*1.97*math.cos(TAU*j/n),cy+.83*1.97*math.sin(TAU*j/n),bottom+3.113)
         for j in range(n)]
    tubes("Island_platform_rolled_lip",[lip+[lip[0]]],.055,"BlueSteel",10)
    mesh("RIDE_Island_cap",[(cx+.07*math.cos(TAU*j/n),cy+.07*math.sin(TAU*j/n),bottom+3.12)
                           for j in range(n)],[tuple(range(n))],"Concrete")


def floor(outlines):
    verts=[(-48,-43),(48,-43),(48,43),(-48,43)]
    loops=[list(range(4))]
    for outline in outlines:
        start=len(verts)
        verts.extend(outline)
        loops.append(list(range(start,len(verts))))
    coords,_,faces,_,_,members=geometry.delaunay_2d_cdt([Vector(p) for p in verts],[],loops,0,.00001)
    ground=[face for face,ids in zip(faces,members) if 0 in ids and len(ids)==1]
    mesh("RIDE_Expansion_joint_plaza",[(p.x,p.y,0) for p in coords],ground,"Concrete")


def guard(name,path):
    posts=[]; bars=[]
    for a,b in zip(path,path[1:]):
        a,b=Vector(a),Vector(b)
        count=max(1,math.ceil((b-a).length/1.65))
        for k in range(count+1):
            p=a.lerp(b,k/count)
            posts.append((p,p+Vector((0,0,1.07))))
        for h in (.48,1.03):
            bars.append((a+Vector((0,0,h)),b+Vector((0,0,h))))
    tubes(name,posts+bars,.042,"DarkSteel")


def vert(name,x,y,width,run,height,tower=False,angle=0):
    existing=set(bpy.context.scene.objects)
    steps=72
    def profile(t):
        arc=1-math.cos(t)
        if not tower:
            return height*arc
        # The reference drop has a second shoulder halfway up the timber run.
        u=max(0,min(1,(math.sin(t)-.14)/.46))
        eased=u**3*(u*(u*6-15)+10)
        return height*(.63*arc+.37*eased)
    rows=[]; uv=[]
    for i in range(steps+1):
        t=math.pi/2*i/steps
        yy=y+run*math.sin(t)
        zz=profile(t)
        for xx in (x-width/2,x+width/2):
            rows.append((xx,yy,zz))
            uv.append(((xx-x)/2,(run*t)/2))
    section("RIDE_"+name+"_transition",rows,2,"Plywood",uv,True)
    lip=y+run
    tubes("SteelLip_"+name,[((x-width/2,lip,height),(x+width/2,lip,height))],.075,"BlueSteel")
    depth=3.8 if tower else 3.1
    blocks("RIDE_"+name+"_deck",[(x,lip+depth/2,height-.13,width,depth,.13)],"DarkSteel")
    sideL=x-width/2; sideR=x+width/2
    guard("Guard_"+name,[(sideL,lip,height),(sideL,lip+depth,height),
                          (sideR,lip+depth,height),(sideR,lip,height)])
    for side in (sideL,sideR):
        verts=[]; coords=[]
        for i in range(1,steps+1):
            t=math.pi/2*i/steps
            yy=y+run*math.sin(t)
            zz=profile(t)
            for z in (.015,zz-.003):
                verts.append((side,yy,z))
                coords.append(((yy-y)/run,z/height))
        section("Cladding_"+name,verts,2,"Mountains",coords)
    # A graphic fascia below the platform sits behind the last portion of the
    # curved sheet, leaving the tower head and diagonal steel frame visible.
    for side in (sideL,sideR):
        gap=2.8 if tower else .58
        verts=[(side,lip,.12),(side,lip+depth,.12),
               (side,lip+depth,height-gap),(side,lip,height-gap)]
        mesh("Mountain_platform_fascia_"+name,verts,[(0,1,2,3)],"Mountains",
             [(0,0),(1,0),(1,1),(0,1)])
    # Exposed trusswork under the start platform and rear landings.
    truss=[]
    for a in (sideL,sideR):
        for b in (lip,lip+depth):
            truss.append(((a,b,0),(a,b,height)))
    levels=math.ceil(height/2.5)
    for i in range(levels):
        lo=height*i/levels
        hi=height*(i+1)/levels
        for a in (sideL,sideR):
            truss.extend([((a,lip,lo),(a,lip+depth,hi)),((a,lip+depth,lo),(a,lip,hi)),
                          ((a,lip,hi),(a,lip+depth,hi))])
        truss.extend([((sideL,lip+depth,lo),(sideR,lip+depth,hi)),((sideR,lip+depth,lo),(sideL,lip+depth,hi))])
    tubes("Lattice_"+name,truss,.10,"DarkSteel")
    if tower:
        # Three flights ascending towards the tower, with intermediate steel decks.
        stepParts=[]; legs=[]
        length=4.2; flightRise=height/3
        for flight in range(3):
            xa=sideL-3*(length+.7)+flight*(length+.7)
            z0=flight*flightRise
            yc=lip+.6
            for i in range(20):
                xx=xa+(i+.5)*length/20
                zz=z0+(i+1)*flightRise/20
                stepParts.append((xx,yc,zz-.09,length/20+.012,1.2,.09))
            stepParts.append((xa+length+.35,yc,z0+flightRise-.15,.7,1.2,.15))
            for yy in (yc-.6,yc+.6):
                legs.append(((xa,yy,z0-.08),(xa+length,yy,z0+flightRise-.08)))
                legs.append(((xa,yy,z0+1),(xa+length,yy,z0+flightRise+1)))
                legs.append(((xa+length,yy,0),(xa+length,yy,z0+flightRise+1)))
                for k in range(5):
                    xx=xa+length*k/4
                    zz=z0+flightRise*k/4
                    legs.append(((xx,yy,zz),(xx,yy,zz+1)))
        blocks("Steel_grated_stair_treads",stepParts,"DarkSteel")
        tubes("Tower_stair_stringers_and_handrails",legs,.065,"DarkSteel")
    
    # Pivot at the back lip so both drops present their plywood profile and
    # decorated side to the reference viewpoint.
    if angle:
        from mathutils import Matrix
        pivot=Vector((x,lip,0))
        transform=(Matrix.Translation(pivot) @ Matrix.Rotation(math.radians(angle),4,'Z') @
                   Matrix.Translation(-pivot))
        for obj in set(bpy.context.scene.objects)-existing:
            obj.data.transform(transform)
            obj.data.update()


def wall(name,endX,centerY,halfWidth,run,h,mural,hole=False):
    sign=1 if endX>0 else -1
    steps=40
    # Extrude the arced transition section over its width to form a watertight solid.
    profile=[]
    for i in range(steps+1):
        t=math.pi/2*i/steps
        profile.append((endX-sign*run*(1-math.sin(t)),h*(1-math.cos(t))))
    profile += [(endX+sign*.75,h),(endX+sign*.75,-.12),(profile[0][0],-.12)]
    n=len(profile)
    verts=[(x,y,z) for y in (centerY-halfWidth,centerY+halfWidth) for x,z in profile]
    faces=[(j,(j+1)%n,(j+1)%n+n,j+n) for j in range(n)]
    faces += [tuple(reversed(range(n))),tuple(range(n,n*2))]
    obj=mesh("RIDE_"+name,verts,faces,"Concrete")
    obj.data.materials.append(mat(mural))
    for face in obj.data.polygons[:steps]:
        face.use_smooth=True
        face.material_index=1
        for idx in face.loop_indices:
            vert=obj.data.vertices[obj.data.loops[idx].vertex_index].co
            u=(vert.y-centerY+halfWidth)/(2*halfWidth)
            obj.data.uv_layers.active.data[idx].uv=(u if sign>0 else 1-u,vert.z/h)
    # Boolean tools require consistently outward-facing polygon normals.
    import bmesh
    bm=bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bm.to_mesh(obj.data);bm.free()
    if hole:
        bpy.ops.mesh.primitive_cylinder_add(vertices=80,radius=1.74,depth=run+4,
            location=(endX-sign*run*.35,centerY+2.3,h*.63),rotation=(0,math.pi/2,0))
        cutter=bpy.context.object
        modifier=obj.modifiers.new("Circular pass-through","BOOLEAN")
        modifier.operation="DIFFERENCE";modifier.object=cutter
        bpy.context.view_layer.objects.active=obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        bpy.data.objects.remove(cutter,do_unlink=True)
    guard("Guard_"+name,[(endX+sign*.63,centerY-halfWidth,h),(endX+sign*.63,centerY+halfWidth,h)])
    tubes("Lip_"+name,[((endX,centerY-halfWidth,h),(endX,centerY+halfWidth,h))],.06,"BlueSteel")


def spine():
    x0,x1=6.5,22.5; y0=26; length=12; height=5.6
    verts=[]; uv=[]
    for i in range(61):
        f=i/60
        if f<.38:
            z=height*.5*(1-math.cos(math.pi*f/.38))
        elif f>.62:
            z=height*.5*(1+math.cos(math.pi*(f-.62)/.38))
        else:
            z=height
        x=x0+(x1-x0)*f
        for y in (y0+length,y0):
            verts.append((x,y,z))
            uv.append((x/2,y/2))
    section("RIDE_Alpine_spine",verts,2,"Concrete",uv,True)
    for y in (y0,y0+length):
        side=[]; coords=[]
        for i in range(1,60):
            x,_,z=verts[2*i]
            side.extend(((x,y,0),(x,y,z)))
            coords.extend((((x-x0)/(x1-x0),0),((x-x0)/(x1-x0),z/height)))
        section("Spine_chevron_inlay",side,2,"Chevrons",coords)


def build():
    main=[(-27,-26),(-26,-22),(-22,-19),(-15,-18),(-9,-18.7),(-5,-17.3),
          (0,-18),(5,-17.6),(8,-15.8),(5.1,-14.7),(4.7,-12.7),(9,-11.7),
          (16,-11.5),(20,-12.8),(21,-15),(20.4,-17.7),(24,-18.8),
          (29,-20),(33,-22.5),(36,-27),(35,-31.5),(30,-35.8),(22,-38.3),
          (12,-39.8),(4,-39.3),(-2,-36.5),(-4,-33),(-4.8,-30.5),
          (-7.7,-30),(-10.8,-32.4),(-14,-34.2),(-20,-34),(-25,-31)]
    main=[(.87*x+2.8,y) for x,y in main]
    mid=[(1,17),(3,14),(8,13.2),(12,13.6),(16.4,12.4),(21.4,12.9),(25,15.2),
         (25.5,18.8),(22.3,21),(18,21),(14,20.6),(9,22.1),(4.1,21.5)]
    rear=[(-25,21),(-23,19.6),(-19,19.3),(-16,18.7),(-12,19.6),(-10,21.8),
          (-12,23.7),(-18,24.2),(-23,23.4)]
    root=bpy.data.collections.new("Transition park | reusable concrete and vert modules")
    bpy.context.scene.collection.children.link(root)
    def asset(label, anchor, fn, *args, **kwargs):
        before=set(bpy.context.scene.objects)
        result=fn(*args,**kwargs)
        group=bpy.data.collections.new(label)
        root.children.link(group)
        group.instance_offset=anchor
        group.asset_mark()
        group.asset_data.description="Original skating module, metres (Z up). Rideable surfaces have RIDE_ prefixes."
        for obj in set(bpy.context.scene.objects)-before:
            for previous in list(obj.users_collection):
                previous.objects.unlink(obj)
            group.objects.link(obj)
        return result

    outlines=[]
    for name,pts,center,depth in (("Great_lagoon",main,(4,-25),3.3),
                                   ("Painted_channel",mid,(13,17.5),1.75),
                                   ("North_pocket",rear,(-18,21.4),1.25)):
        area=sum(a[0]*b[1]-a[1]*b[0] for a,b in zip(pts,pts[1:]+pts[:1]))
        if area<0:
            pts=list(reversed(pts))
        outlines.append(asset(name,(*center,0),bowl,name,pts,center,depth))
    asset("Joined plaza and basin cut-outs",(0,0,0),floor,outlines)
    asset("Volcanic island",(10,-29,-3.3),volcano,10,-29,-3.3)
    asset("West timber vert",(-35,35.7,0),vert,"Timber_vert",-35,24,14,11.7,9,angle=41)
    asset("Summit drop and stair tower",(-6,35.6,0),vert,"Summit_drop",-6,22.7,9.2,12.9,15,True,angle=44)
    asset("Chevron spine",(14.5,32,0),spine)
    asset("Kraken quarter",(-32.5,-23,0),wall,"Kraken_quarter",-32.5,-23,8.6,8.3,5.4,"Octopus")
    asset("Low west quarter",(-47,8.3,0),wall,"West_quarter",-47,8.3,6,6.8,3.4,"Concrete")
    asset("Circular portal wall",(46.4,5.4,0),wall,"Portal_wall",46.4,5.4,8.2,9,8.3,"Sunset",True)
