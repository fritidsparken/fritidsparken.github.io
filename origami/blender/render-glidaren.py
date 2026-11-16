"""Build real double-sided paper meshes and a reusable Blender animation.

node origami/blender/export-frames.mjs /tmp/glidaren-frames.json
blender -b -t 4 --python origami/blender/render-glidaren.py -- \
  --input /tmp/glidaren-frames.json --out /tmp/glidaren-render
Use --preview to render preparation, an intermediate state and the finished model.
The model is selected in export-frames.mjs by its third argument.
Then encode.py packages the images and clips for the web guide.
"""
import argparse, json, math, sys, hashlib, shutil
from pathlib import Path
import bpy
from mathutils import Vector

p=argparse.ArgumentParser()
p.add_argument('--input',required=True);p.add_argument('--out',required=True)
p.add_argument('--preview',action='store_true');p.add_argument('--samples',choices=['8','16','32'],default='16')
args=p.parse_args(sys.argv[sys.argv.index('--')+1:])
data=json.loads(Path(args.input).read_text());out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='BLENDER_WORKBENCH'
scene.render.resolution_x=640;scene.render.resolution_y=640;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB'
scene.render.fps=data['fps'];scene.display.render_aa=args.samples
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
hex_color=data['model']['color'].lstrip('#')
paper_color=tuple((int(hex_color[i:i+2],16)/255)**1.7 for i in (0,2,4))
if data['model']['id']=='glidaren':paper_color=(.24,.55,.61)
blue=material('Coloured paper face',paper_color)
cream=material('Warm white • reverse face',(.94,.90,.79))
edge=material('Cut paper edge',(.76,.79,.70))
ground=material('Sage studio backdrop',(.71,.77,.70))
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.17))
floor=bpy.context.object;floor.name='Shadow-catching backdrop';floor.data.materials.append(ground)
bpy.ops.object.camera_add(location=(.24,-.46,.64))
camera=bpy.context.object;camera.name='Folding camera';target=Vector((0,-.015,.015))
camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=.44;camera.data.lens=50;camera.data.clip_start=.01;camera.data.clip_end=5
scene.camera=camera
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.8,.9,1,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
for name,location,power,size in [('Softbox',(-.3,-.2,.65),2,.45),('Fill',(.35,.3,.5),.8,.4)]:
    light=bpy.data.lights.new(name,'AREA');light.energy=power;light.shape='DISK';light.size=size
    ob=bpy.data.objects.new(name,light);scene.collection.objects.link(ob);ob.location=location;ob.rotation_euler=(-ob.location).to_track_quat('-Z','Y').to_euler()


# Square models are viewed more directly so faces and petals read clearly.
# Fit one stable camera to the entire sequence, including lifted corners.
if data['model']['category']!='Pappersflygplan':
    camera.location=(0,-.27,.75)
    camera.rotation_euler=(-camera.location).to_track_quat('-Z','Y').to_euler()
if data['model']['id']!='glidaren':
    right=camera.rotation_euler.to_matrix()@Vector((1,0,0))
    up=camera.rotation_euler.to_matrix()@Vector((0,1,0))
    min_x=min_y=math.inf;max_x=max_y=-math.inf
    for step in data['steps']:
        for state in step['frames']:
            for panel in state['panels']:
                for x,y,z in panel['points']:
                    point=Vector((x/1000,-y/1000,z/1000))
                    px=point.dot(right);py=point.dot(up)
                    min_x=min(min_x,px);max_x=max(max_x,px)
                    min_y=min(min_y,py);max_y=max(max_y,py)
    camera.location+=right*((min_x+max_x)/2)+up*((min_y+max_y)/2)
    camera.data.ortho_scale=max(max_x-min_x,max_y-min_y)*1.18

# Real face marks for the cat/dog finish, matching the ordinary guide.
face_marks=[]
if data['model'].get('face'):
    face=data['model']['face'];ink=material('Drawn face',(.025,.05,.04))
    height=max(p[2] for panel in data['states'][-1]['panels'] for p in panel['points'])/1000+len(data['states'][-1]['panels'])*.00018+.0004
    if face.get('marks'):
        for i,mark in enumerate(face['marks']):
            points=mark.get('points') or [(mark['x']+mark['rx']*math.cos(j*math.pi/24),mark['y']+mark['ry']*math.sin(j*math.pi/24)) for j in range(48)]
            mesh=bpy.data.meshes.new('Pen mark');mesh.from_pydata([(x/1000,-y/1000,height+i*.0002) for x,y in points],[],[tuple(range(len(points)))]);mesh.update()
            ob=bpy.data.objects.new('Drawn face mark',mesh);scene.collection.objects.link(ob)
            color=mark.get('fill','#293b34').lstrip('#');rgb=tuple((int(color[j:j+2],16)/255)**1.7 for j in (0,2,4))
            mesh.materials.append(material('Pen ink',rgb));face_marks.append(ob)
    else:
        for x,y in [(-face['eyes'],face['y']),(face['eyes'],face['y']),(0,face['y']+16)]:
            bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=8,radius=.0032,location=(x/1000,-y/1000,height))
            mark=bpy.context.object;mark.name='Face mark';mark.scale.z=.08;mark.data.materials.append(ink)
            face_marks.append(mark)

def set_face(visible,frame=None):
    for mark in face_marks:
        mark.hide_render=not visible;mark.hide_viewport=not visible
        if frame is not None:
            mark.keyframe_insert('hide_render',frame=frame);mark.keyframe_insert('hide_viewport',frame=frame)


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
    for mat in ([cream,blue,edge] if data['model']['paper'].get('front',False) else [blue,cream,edge]):mesh.materials.append(mat)
    for polygon,mat in zip(mesh.polygons,m):polygon.material_index=mat
    return obj

def render(path,state=None):
    paper=[o for o in scene.objects if o.type=='MESH' and o!=floor and not o.hide_render]
    if state:floor.location.z=min(v[2] for v in geometry(state)[0])-.012
    elif paper:floor.location.z=min(v.co.z for o in paper for v in o.data.vertices)-.012
    floor.keyframe_insert('location',frame=scene.frame_current)
    scene.render.filepath=str(path);bpy.ops.render.render(write_still=True)

# State posters give instant back/next/result navigation with no video seeking.
indices=sorted(set([0,min(8,len(data['states'])-1),len(data['states'])-1])) if args.preview else range(len(data['states']))
for i in indices:
    set_face(i==len(data['states'])-1)
    obj=make_mesh('Poster paper',data['states'][i]);render(out/f'state-{i:02d}.png')
    bpy.data.objects.remove(obj,do_unlink=True)
if args.preview:sys.exit(0)

# Each step is an actual animated mesh in the saved .blend project. The
# topology is stable within each fold; shape keys contain rigid-panel samples.
timeline=1
render_cache={}
for step in data['steps']:
    set_face(step['kind']=='finish',timeline)
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
        fingerprint=hashlib.sha256(json.dumps({'state':state,'face':step['kind']=='finish'},sort_keys=True).encode()).hexdigest()
        if fingerprint in render_cache:
            shutil.copyfile(render_cache[fingerprint],path)
            floor.location.z=min(v[2] for v in geometry(state)[0])-.012
            floor.keyframe_insert('location',frame=scene.frame_current)
        else:
            render(path,state);render_cache[fingerprint]=path
    timeline+=len(frames)
scene.frame_start=1;scene.frame_end=timeline-1;scene.frame_set(1)
for step in reversed(data['model']['steps']):
    if step['kind']=='turn' and step.get('angle')==90 and step.get('axis'):
        a,b=step['axis'];scene['flight_forward_xy']=[a[0]-b[0],b[1]-a[1]];break
bpy.ops.wm.save_as_mainfile(filepath=str(out/(data['model']['id']+'.blend')),compress=True)
(out/'model.json').write_text(json.dumps({'id':data['model']['id'],'name':data['model']['name'],'source':data['model']['source']['url'],'steps':len(data['steps'])}))
print('BLENDER_BUILD_COMPLETE',out,flush=True)
