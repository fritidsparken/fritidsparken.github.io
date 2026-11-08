"""Add original weathered PBR textures and retractable landing gear to the Blender rocket.
Run after build_assets.py: blender -b -t 4 -P tools/blender/space/finish_rocket.py
Textures are embedded in each GLB and packed into the Blender source.
"""
import bpy, math, sys
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(Path(__file__).parent))
import build_assets as b
OUT=ROOT/'assets/space'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'blender/rocket.blend'))
# Idempotent: remove prior landing-gear objects before rebuilding them.
for obj in list(bpy.data.objects):
    if obj.name.startswith('LandingGear'):
        bpy.data.objects.remove(obj,do_unlink=True)
rng=np.random.default_rng(228)
n=512
noise=rng.random((n,n)).astype(np.float32)
wear=np.zeros((n,n),dtype=np.float32)
for _ in range(320):
    x,y=rng.integers(0,n,2); length=int(rng.integers(2,20))
    wear[y:min(n,y+length),x]=float(rng.uniform(.08,.4))
for _ in range(80):
    x,y=rng.integers(0,n,2); radius=int(rng.integers(1,5))
    wear[max(0,y-radius):min(n,y+radius),max(0,x-radius):min(n,x+radius)] += .035

def image(name, rgb, colorspace):
    old=bpy.data.images.get(name)
    if old:bpy.data.images.remove(old)
    img=bpy.data.images.new(name,width=n,height=n,alpha=True)
    rgba=np.ones((n,n,4),dtype=np.float32);rgba[:,:,:3]=rgb
    img.colorspace_settings.name=colorspace
    img.pixels.foreach_set(rgba.ravel());img.update()
    img.pack();return img

for matname in ['Pearl ceramic white','Crimson enamel','Brushed titanium']:
    mat=bpy.data.materials.get(matname)
    if not mat:continue
    nodes=mat.node_tree.nodes;links=mat.node_tree.links;p=nodes.get('Principled BSDF')
    # Re-use original palette; subtle original grime, scratches and microfinish.
    palette={'Pearl ceramic white':(.91,.94,.97),'Crimson enamel':(.86,.12,.16),'Brushed titanium':(.52,.58,.65)}
    base=np.array(palette[matname],dtype=np.float32)
    tint=1-.025*noise-wear
    rgb=np.clip(tint[:,:,None]*base[None,None,:],0,1)
    color=image(matname+' surface',rgb,'sRGB')
    rough=np.clip(.27+noise*.08+wear*.5,0,1)
    rough=image(matname+' roughness',np.repeat(rough[:,:,None],3,axis=2),'Non-Color')
    for socket,img in [('Base Color',color),('Roughness',rough)]:
        tex=nodes.new('ShaderNodeTexImage');tex.image=img;tex.label='Original packed PBR finish';links.new(tex.outputs['Color'],p.inputs[socket])
    if matname=='Crimson enamel':
        # White wear mask multiplied by live paint color in the game.
        neutral=image('Enamel wear mask',np.repeat(tint[:,:,None],3,axis=2),'sRGB')
        tex.image=rough # roughness node is the most recent
        base_node=p.inputs['Base Color'].links[0].from_node
        base_node.image=neutral
        mix=nodes.new('ShaderNodeMix');mix.data_type='RGBA';mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1
        mix.inputs[7].default_value=(.7,.023,.038,1)
        links.new(base_node.outputs['Color'],mix.inputs[6]);links.new(mix.outputs[2],p.inputs['Base Color'])
    for obj in bpy.context.scene.objects:
        if obj.type!='MESH' or not any(m==mat for m in obj.data.materials):continue
        if not obj.data.uv_layers:
            uv=obj.data.uv_layers.new(name='FinishUV')
            for poly in obj.data.polygons:
                axis=max(range(3),key=lambda a:abs(poly.normal[a])); axes=[a for a in range(3) if a!=axis]
                for li in poly.loop_indices:
                    co=obj.data.vertices[obj.data.loops[li].vertex_index].co
                    uv.data[li].uv=(co[axes[0]]*.22,co[axes[1]]*.22)
# Separate gear root permits animation/hiding in Three.js without touching the hull.
root=bpy.data.objects.new('LandingGear',None);bpy.context.collection.objects.link(root)
steel=bpy.data.materials['Brushed titanium'];dark=bpy.data.materials['Graphite panels']
for i,(x,y) in enumerate([(-1.3,-1.9),(1.3,-1.9),(0,2)]):
    upper=(x*.7,y,-.8);foot=(x*1.5,y,-2.5)
    rod=b.rod('LandingGearStrut'+str(i),upper,foot,.11,steel);rod.parent=root
    pad=b.cube('LandingGearFoot'+str(i),(foot[0],foot[1],-2.45),(.85,.75,.16),dark,.08);pad.parent=root
# Preserve high-resolution source. LOD uses decimation, with rig and naming retained.
b.export('rocket/rocket-high.glb','rocket.blend')
for obj in bpy.context.scene.objects:
    if obj.type=='MESH' and len(obj.data.polygons)>100 and not obj.vertex_groups:
        mod=obj.modifiers.new('Release LOD','DECIMATE');mod.ratio=.5
        bpy.context.view_layer.objects.active=obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
b.export('rocket/rocket-low.glb')
if '--render' in sys.argv:
    bpy.ops.wm.open_mainfile(filepath=str(OUT/'blender/rocket.blend'))
    b.render('rocket-release.png',(16,-12,8),(0,-.3,0))
print('FINISHED_ROCKET_PBR_AND_GEAR')
