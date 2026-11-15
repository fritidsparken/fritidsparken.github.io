"""Build real double-sided paper meshes and a reusable Blender animation.

node origami/blender/export-frames.mjs /tmp/glidaren-frames.json
blender -b -t 4 --python origami/blender/render-glidaren.py -- \
  --input /tmp/glidaren-frames.json --out /tmp/glidaren-render
Use --preview to render just preparation, nose lock and the finished model.
Then encode.py packages the images and clips for the web guide.
"""
import argparse, json, math, sys, hashlib, shutil
from pathlib import Path
import bpy
from mathutils import Vector

p=argparse.ArgumentParser()
p.add_argument('--input',required=True);p.add_argument('--out',required=True)
p.add_argument('--preview',action='store_true')
args=p.parse_args(sys.argv[sys.argv.index('--')+1:])
data=json.loads(Path(args.input).read_text());out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='BLENDER_WORKBENCH'
scene.render.resolution_x=640;scene.render.resolution_y=640;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB'
scene.render.fps=data['fps'];scene.display.render_aa='16'
sh=scene.display.shading;sh.light='STUDIO';sh.studiolight_rotate_z=.6
sh.studiolight_rotate_z=.3;sh.studio_light='paint.sl';sh.shadow_intensity=.18
sh.color_type='MATERIAL';sh.show_shadows=True;sh.show_cavity=True;sh.cavity_type='BOTH'
sh.curvature_ridge_factor=1.15;sh.curvature_valley_factor=1.05
sh.cavity_ridge_factor=1.25;sh.cavity_valley_factor=1.2
sh.show_specular_highlight=True
sh.background_type='WORLD';scene.world.color=(.71,.77,.70)
scene.view_settings.view_transform='Standard'

def material(name,color):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.roughness=.82;m.use_nodes=True
    bsdf=m.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=(*color,1);bsdf.inputs['Roughness'].default_value=.82
    return m
blue=material('Turquoise paper • coloured face',(.24,.55,.61))
cream=material('Warm white • reverse face',(.94,.90,.79))
edge=material('Cut paper edge',(.76,.79,.70))
ground=material('Sage studio backdrop',(.71,.77,.70))
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.17))
floor=bpy.context.object;floor.name='Shadow-catching backdrop';floor.data.materials.append(ground)
bpy.ops.object.camera_add(location=(.24,-.46,.64))
camera=bpy.context.object;camera.name='Folding camera';target=Vector((0,-.015,.015))
camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=.44;camera.data.lens=50
scene.camera=camera
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.8,.9,1,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
for name,location,power,size in [('Softbox',(-.3,-.2,.65),2,.45),('Fill',(.35,.3,.5),.8,.4)]:
    light=bpy.data.lights.new(name,'AREA');light.energy=power;light.shape='DISK';light.size=size
    ob=bpy.data.objects.new(name,light);scene.collection.objects.link(ob);ob.location=location;ob.rotation_euler=(-ob.location).to_track_quat('-Z','Y').to_euler()


def geometry(state):
    verts=[];faces=[];materials=[]
    for layer,panel in sorted(enumerate(state['panels']),key=lambda v:v[1]['id']):
        offset=panel.get('layerOffset',[0,0,layer*.18])
        points=[Vector(((p[0]+offset[0])/1000,-(p[1]+offset[1])/1000,(p[2]+offset[2])/1000)) for p in panel['points']]
        n=Vector((0,0,0))
        for i in range(1,len(points)-1):
            n=(points[i]-points[0]).cross(points[i+1]-points[0])
            if n.length>1e-12:break
        n.normalize();n*=.000055
        start=len(verts);count=len(points)
        verts.extend(tuple(v+n) for v in points);verts.extend(tuple(v-n) for v in points)
        faces.append(tuple(start+i for i in range(count)));materials.append(0)
        faces.append(tuple(start+count+i for i in reversed(range(count))));materials.append(1)
        for i in range(count):
            j=(i+1)%count;faces.append((start+i,start+j,start+count+j,start+count+i));materials.append(2)
    return verts,faces,materials

def make_mesh(name,state):
    v,f,m=geometry(state);mesh=bpy.data.meshes.new(name);mesh.from_pydata(v,[],f);mesh.update()
    obj=bpy.data.objects.new(name,mesh);scene.collection.objects.link(obj)
    for mat in [blue,cream,edge]:mesh.materials.append(mat)
    for polygon,mat in zip(mesh.polygons,m):polygon.material_index=mat
    return obj

def render(path,state=None):
    paper=[o for o in scene.objects if o.type=='MESH' and o!=floor and not o.hide_render]
    if state:floor.location.z=min(v[2] for v in geometry(state)[0])-.012
    elif paper:floor.location.z=min(v.co.z for o in paper for v in o.data.vertices)-.012
    floor.keyframe_insert('location',frame=scene.frame_current)
    scene.render.filepath=str(path);bpy.ops.render.render(write_still=True)

# State posters give instant back/next/result navigation with no video seeking.
indices=[0,8,len(data['states'])-1] if args.preview else range(len(data['states']))
for i in indices:
    obj=make_mesh('Poster paper',data['states'][i]);render(out/f'state-{i:02d}.png')
    bpy.data.objects.remove(obj,do_unlink=True)
if args.preview:sys.exit(0)

# Each step is an actual animated mesh in the saved .blend project. The
# topology is stable within each fold; shape keys contain rigid-panel samples.
timeline=1
render_cache={}
for step in data['steps']:
    frames=step['frames'];obj=make_mesh(f"Step {step['number']:02d} — {step['text']}",frames[0])
    obj.shape_key_add(name='Basis')
    for f,state in enumerate(frames):
        vertices,_,_=geometry(state)
        key=obj.shape_key_add(name=f'Fold {f+1:02d}')
        for point,co in zip(key.data,vertices):point.co=co
        for at,value in [(timeline+f-1,0),(timeline+f,1),(timeline+f+1,0)]:
            key.value=value;key.keyframe_insert('value',frame=at)
    for at,hidden in [(0,True),(timeline-1,True),(timeline,False),(timeline+len(frames)-1,False),(timeline+len(frames),True)]:
        obj.hide_render=hidden;obj.hide_viewport=hidden
        obj.keyframe_insert('hide_render',frame=at);obj.keyframe_insert('hide_viewport',frame=at)
    for f,state in enumerate(frames):
        scene.frame_set(timeline+f)
        path=out/f"step-{step['number']:02d}-{f:03d}.png"
        fingerprint=hashlib.sha256(json.dumps(state,sort_keys=True).encode()).hexdigest()
        if fingerprint in render_cache:
            shutil.copyfile(render_cache[fingerprint],path)
            floor.location.z=min(v[2] for v in geometry(state)[0])-.012
            floor.keyframe_insert('location',frame=scene.frame_current)
        else:
            render(path,state);render_cache[fingerprint]=path
    timeline+=len(frames)
scene.frame_start=1;scene.frame_end=timeline-1;scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'glidaren.blend'),compress=True)
print('BLENDER_BUILD_COMPLETE',out,flush=True)
