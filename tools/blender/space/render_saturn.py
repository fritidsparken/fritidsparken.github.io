"""Offline model/composition comparison; this is NOT a gameplay screenshot."""
import bpy, math, random
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'assets/space'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'blender/rocket.blend'))
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=False
scene.render.resolution_x=1280;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
def mat(name,color,emission=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.55
 if emission:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
 return m
def aim(o,p):o.rotation_euler=(Vector(p)-o.location).to_track_quat('-Z','Y').to_euler()
def sphere(n,p,r,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=96,ring_count=64,radius=r,location=p);o=bpy.context.object;o.name=n;o.data.materials.append(m)
 for f in o.data.polygons:f.use_smooth=True
 return o
planet=mat('Saturn cloud bands',(.7,.52,.27));nodes=planet.node_tree.nodes;tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(OUT/'textures/saturn.jpg'));planet.node_tree.links.new(tex.outputs['Color'],nodes.get('Principled BSDF').inputs['Base Color'])
p=(13,38,12);s=sphere('Saturn model reference',p,12,planet);s.rotation_euler=(.2,-.12,.4)
# Annular textured ring plane with transparent bands and genuine 3D debris.
ring=mat('Saturn ice ring',(.82,.67,.41));tex=ring.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(OUT/'textures/rings.png'));ps=ring.node_tree.nodes.get('Principled BSDF');ring.node_tree.links.new(tex.outputs['Color'],ps.inputs['Base Color']);ring.node_tree.links.new(tex.outputs['Alpha'],ps.inputs['Alpha']);ps.inputs['Roughness'].default_value=.85
verts=[];faces=[]
for r in [15,26]:
 for i in range(192):
  a=i*math.tau/192;verts.append((r*math.cos(a),r*math.sin(a),0))
for i in range(192):faces.append((i,(i+1)%192,192+(i+1)%192,192+i))
me=bpy.data.meshes.new('rings');me.from_pydata(verts,[],faces);me.update();uv=me.uv_layers.new()
for f in me.polygons:
 for li in f.loop_indices:
  vi=me.loops[li].vertex_index;uv.data[li].uv=(0 if vi<192 else 1,(vi%192)/191)
o=bpy.data.objects.new('Saturn rings',me);bpy.context.collection.objects.link(o);o.location=p;o.rotation_euler=(.38,-.13,0);o.data.materials.append(ring)
# Subdued purple/cyan procedural nebula world with texture stars.
scene.world.use_nodes=True;n=scene.world.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputWorld');bg=n.new('ShaderNodeBackground');bg.inputs['Strength'].default_value=.28
coord=n.new('ShaderNodeTexCoord');noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=3.8;noise.inputs['Detail'].default_value=7
ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.32;ramp.color_ramp.elements[0].color=(.006,.009,.035,1);ramp.color_ramp.elements[1].position=.72;ramp.color_ramp.elements[1].color=(.19,.035,.36,1);e=ramp.color_ramp.elements.new(.63);e.color=(.015,.16,.3,1)
stars=n.new('ShaderNodeTexEnvironment');stars.image=bpy.data.images.load(str(OUT/'textures/stars.jpg'));mix=n.new('ShaderNodeMixRGB');mix.blend_type='ADD';mix.inputs[0].default_value=.65
l=scene.world.node_tree.links;l.new(coord.outputs['Normal'],noise.inputs['Vector']);l.new(noise.outputs['Fac'],ramp.inputs[0]);l.new(ramp.outputs[0],mix.inputs[1]);l.new(stars.outputs[0],mix.inputs[2]);l.new(mix.outputs[0],bg.inputs[0]);l.new(bg.outputs[0],out.inputs[0])
# Warm backlight and blue fill match the reference's readable materials.
for pos,power,size,col in [((14,5,10),3200,6,(1,.57,.23)),((-5,-6,8),2200,6,(.32,.62,1)),((2,3,6),900,5,(1,.85,.64))]:
 bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.data.color=col;aim(o,(0,0,.7))
bpy.ops.object.light_add(type='SUN',location=(15,8,10));o=bpy.context.object;o.data.energy=3;o.data.color=(1,.77,.5);o.data.angle=.08;aim(o,(0,25,0))
# Blue engine exhaust tapers, amber crystals, varied foreground rocks.
glow=mat('Plasma blue',(.04,.58,1),4)
for x in [-1.15,1.15]:
 bpy.ops.mesh.primitive_cone_add(vertices=32,radius1=.45,radius2=.02,depth=3.2,location=(x,-6,-.15));o=bpy.context.object;o.rotation_euler.x=math.pi/2;o.data.materials.append(glow)
random.seed(84)
with bpy.data.libraries.load(str(OUT/'blender/asteroids.blend'),link=False) as (src,dst):dst.objects=[n for n in src.objects if n.startswith('asteroid_')]
asteroids=dst.objects
for i in range(28):
 o=asteroids[i%len(asteroids)].copy();o.data=asteroids[i%len(asteroids)].data;bpy.context.collection.objects.link(o);o.location=(random.uniform(-14,18),random.uniform(0,22),random.uniform(-7,4));r=random.uniform(.18,.85);o.scale=(r,r,r);o.rotation_euler=(random.random()*6,random.random()*6,random.random()*6)
with bpy.data.libraries.load(str(OUT/'blender/crystal.blend'),link=False) as (src,dst):dst.objects=src.objects
for p in [(5,0,-1),(-6,4,-1),(7,8,1)]:
 for orig in dst.objects:
  o=orig.copy();o.data=orig.data;bpy.context.collection.objects.link(o);o.location+=Vector(p)
sphere('Sun glow',(19,22,16),.8,mat('Sun', (1,.64,.21),20))
bpy.ops.object.camera_add(location=(-11,-17,8));cam=bpy.context.object;aim(cam,(1,2,2));cam.data.lens=37;scene.camera=cam
scene.use_nodes=True;nt=scene.node_tree;nt.nodes.clear();r=nt.nodes.new('CompositorNodeRLayers');g=nt.nodes.new('CompositorNodeGlare');g.glare_type='FOG_GLOW';g.quality='HIGH';g.threshold=2;out=nt.nodes.new('CompositorNodeComposite');nt.links.new(r.outputs['Image'],g.inputs['Image']);nt.links.new(g.outputs['Image'],out.inputs['Image'])
scene.render.filepath=str(OUT/'rocket/saturn-model-study.png');bpy.ops.render.render(write_still=True)
