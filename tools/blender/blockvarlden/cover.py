"""Original Blockvärlden key art. blender -b -P tools/blender/blockvarlden/cover.py"""
import math
import random
from pathlib import Path
import bpy
from mathutils import Vector

root = Path(__file__).resolve().parents[3]
out = root / "assets/blockvarlden/art"
out.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
rng = random.Random(72504)
verts, faces, matids, palette = [], [], [], {}
def mat(hexcol):
    if hexcol not in palette:
        m = bpy.data.materials.new(hexcol)
        color = [int(hexcol[i:i+2], 16)/255 for i in (0, 2, 4)]
        m.diffuse_color = tuple((v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4) for v in color)+(1,)
        palette[hexcol] = m
    return list(palette).index(hexcol)

def box(x,y,z,w,d,h,col):
    i=len(verts)
    verts.extend((x+a*w/2,y+b*d/2,z+c*h) for a,b,c in [(-1,-1,0),(1,-1,0),(1,1,0),(-1,1,0),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)])
    faces.extend(tuple(i+j for j in f) for f in [(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])
    matids.extend([mat(col)]*6)
grass=['86bd62','78ae58','9ac76b','8ab866','93c069']
sand=['edc88d','f0d199','dcbc83']
rock=['87939a','83969c','94a4a2','889598']
dark=['356c59','407e64','3b7359','508268']
water=['3badae','4eb7b8','40aeb2','48b3b4','42b1b4']
def river(y):
    return -3.5+math.sin(y*.13)*4.0+math.sin(y*.34)*.8
def elev(x,y):
    bank=abs(x-river(y))-4.0
    if bank<0:return 0
    h=min(bank*.80,3.5)+.65*math.sin(x*.35)+.38*math.cos(y*.60)
    for px,py,amp,r in [(-13,7,8,7),(13,20,9,9),(6,27,15,8),(-12,29,13,9),(-3,37,19,9),(20,36,20,10)]:
        h+=max(0,1-math.hypot(x-px,y-py)/r)*amp
    return max(.5,round(h*1.25)/1.25)
def pine(x,y,h,s):
    box(x,y,h,.32*s,.32*s,1.1*s,'735341')
    for j,(w,z) in enumerate([(1.8,.75),(1.50,1.42),(1.13,2.02),(.65,2.57),(.27,2.98)]):
        box(x,y,h+z*s,w*s,w*s,.72*s,dark[j%4])
def decid(x,y,h,s):
    box(x,y,h,.48*s,.48*s,2.35*s,'805c3f')
    for dx,dy,dz,w,c in [(0,0,1.72,1.92,'6eaa54'),(-.52,.12,2.15,1.4,'77af55'),(.54,0,2.23,1.42,'88bc58'),(.15,-.43,2.55,1.42,'97c466'),(0,.27,2.82,1.45,'a4ca67')]:
        box(x+dx*s,y+dy*s,h+dz*s,w*s,w*s,1*s,c)
for y in range(-21,46):
    for x in range(-35,38):
        h=elev(x,y)
        if h==0:
            box(x,y,-.3,1.005,1.005,.7,rng.choice(water))
            if rng.random()<.20:box(x+rng.uniform(-.22,.22),y,.406,rng.uniform(.22,.62),.05,.012,'83d5ca')
            continue
        top=rng.choice(grass if h>1.5 else sand)
        if h>8:top=rng.choice(rock)
        if h>12:top=rng.choice(['e8f4ef','e2eae5','d5e4de'])
        box(x,y,-.4,1.002,1.002,h+.4, rng.choice(rock) if h>5 else 'a38760')
        box(x,y,h-.16,1.005,1.005,.18,top)
        near_cabin=(abs(x-6)<5 and -9<y<4) or (y<-3 and abs(x-river(y))<7) or (x>7 and y<-4)
        if 2<h<9 and not near_cabin and rng.random()<(.06 if y<10 else .115):
            (pine if y>4 or rng.random()<.52 else decid)(x,y,h,rng.uniform(.65,1.55))
        elif 1.6<h<6 and not near_cabin and rng.random()<.17:
            for _ in range(3):
                fx,fy=x+rng.uniform(-.38,.38),y+rng.uniform(-.38,.38)
                box(fx,fy,h,.065,.075,.25,'568349')
                box(fx,fy,h+.22,.15,.15,.10,rng.choice(['f5cf71','e98e87','d4e6ad']))
# Waterside timber cottage, split logs, stepping roof and chimney.
cx,cy,base=6,1,4.1
box(cx,cy,base-.7,4.8,3.75,.76,'87918a')
for j in range(7):
    box(cx,cy,base+j*.37,4.35,3.3,.37,['ad7449','ba8450','c18c5b'][j%3])
for off in [-1.85,1.85]:box(cx+off,cy-1.69,base,.28,.20,2.6,'6c503e')
box(cx+.68,cy-1.7,base,.82,.13,1.8,'684938')
for ox in [-1.10,1.52]:
    box(cx+ox,cy-1.75,base+1.1,.77,.12,.8,'634c41')
    box(cx+ox,cy-1.83,base+1.18,.58,.05,.60,'f6c978')
    box(cx+ox,cy-1.865,base+1.18,.07,.03,.6,'866343')
for j in range(6):
    box(cx,cy,base+2.55+j*.23,5.1,4.1-j*.64,.27,['965646','aa644c','b77055'][j%3])
box(cx+1.29,cy+.39,base+3.4,.58,.61,1.35,'8e887b')
# Footbridge follows the curved stream.
by=-6; bx=river(by)
for j in range(24):
    xx=bx+(j-11.5)*.42
    box(xx,by,1.12,.40,1.25,.21,['b58b57','c2975f','aa8053'][j%3])
for xx in [bx-4.6,bx,bx+4.6]:
    for yy in [by-.60,by+.60]:box(xx,yy,.32,.18,.18,1.85,'785d48')
for yy in [by-.60,by+.60]:box(bx,yy,2.0,9.5,.12,.13,'94744c')
for cx,cy,cz in [(-27,39,17),(-8,43,21),(15,46,23),(30,40,21)]:
    for j in range(3):box(cx+j*2.6,cy+j*.5,cz+j%2,4.3,2.5,.87,'f7f1d9')
mesh=bpy.data.meshes.new("Sculpted voxel valley");mesh.from_pydata(verts,[],faces);mesh.update()
obj=bpy.data.objects.new("Ängsdalen",mesh);bpy.context.collection.objects.link(obj)
for m in palette.values():mesh.materials.append(m)
mesh.polygons.foreach_set("material_index",matids)
scene=bpy.context.scene
scene.world=bpy.data.worlds.new("Himmelsljus");scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.58,.77,.91,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.72
nodes=scene.world.node_tree.nodes
links=scene.world.node_tree.links
day=nodes.new('ShaderNodeBackground');day.inputs[0].default_value=(.32,.67,.95,1)
mix=nodes.new('ShaderNodeMixShader')
links.new(nodes.new('ShaderNodeLightPath').outputs['Is Camera Ray'],mix.inputs[0])
links.new(nodes['Background'].outputs[0],mix.inputs[1]);links.new(day.outputs[0],mix.inputs[2])
links.new(mix.outputs[0],nodes['World Output'].inputs[0])
sun=bpy.data.lights.new("Kvällssol","SUN");sun.energy=3.4;sun.color=(1,.83,.63);sun.angle=.12
lamp=bpy.data.objects.new("Kvällssol",sun);scene.collection.objects.link(lamp)
lamp.rotation_euler=Vector((.6,.53,-.9)).to_track_quat('-Z','Y').to_euler()
camera=bpy.data.cameras.new("Utsikt");observer=bpy.data.objects.new("Utsikt",camera);scene.collection.objects.link(observer);scene.camera=observer
def viewpoint(loc, target, lens):
    observer.location=loc;observer.rotation_euler=(Vector(target)-Vector(loc)).to_track_quat('-Z','Y').to_euler();camera.lens=lens
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
scene.render.engine='CYCLES';scene.cycles.samples=12;scene.cycles.use_denoising=False;scene.cycles.max_bounces=3
scene.render.image_settings.file_format='WEBP';scene.render.image_settings.quality=88
for key,w,h,loc,target,lens in [
    ('cover',1080,660,(15,-23,15),(-2.8,7.4,6.7),31),
    ('icon',448,448,(15,-16,13),(1.8,1.0,4.0),40)]:
    viewpoint(loc,target,lens);scene.render.resolution_x=w;scene.render.resolution_y=h
    scene.render.filepath=str(out/(key+'.webp'));bpy.ops.render.render(write_still=True)
