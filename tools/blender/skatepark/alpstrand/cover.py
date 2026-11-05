"""Pose library skaters for the still thumbnail after opening the native course."""
from pathlib import Path
from mathutils import Vector, Matrix
import bpy, math, sys
root=next(p for p in Path(__file__).resolve().parents if (p/'games/skatepark/index.html').exists())
shared=root/'assets/skatepark/shared'
scene=bpy.context.scene
course_objects=[o for o in scene.objects if o.type=='MESH' and o.name.startswith('RIDE_')]
def surface(x,y):
    best=-10
    for o in course_objects:
        mat=o.matrix_world
        local=mat.inverted() @ Vector((x,y,30))
        hit,loc,_,_=o.ray_cast(local,mat.inverted().to_3x3() @ Vector((0,0,-1)))
        if hit:
            best=max(best,(mat@loc).z)
    return best
def pose(x,y,a,clip,extra=0):
    floor=surface(x,y)+.09+extra
    pivot=bpy.data.objects.new('Thumbnail session',None)
    scene.collection.objects.link(pivot)
    for name in ['characters/kaj-rider.glb','skateboards/kaj-deck.glb']:
        old=set(scene.objects); actions=set(bpy.data.actions)
        bpy.ops.import_scene.gltf(filepath=str(shared/name))
        new=set(scene.objects)-old
        for obj in new:
            if obj.animation_data:
                for track in obj.animation_data.nla_tracks:
                    track.mute=True
                desired=next((a for a in bpy.data.actions if a not in actions and a.name.split('.')[0]==clip),None)
                if desired:obj.animation_data.action=desired
            if not obj.parent:obj.parent=pivot
    pivot.location=(x,y,floor)
    pivot.rotation_euler[2]=math.radians(a)
for params in [(22,-27,65,'TurnLeft',0),(-10,-8,100,'Ollie',.35),(-31,2,30,'Push',0),(26,14,120,'Ride',0),(2,31,66,'Kickflip',14.7)]:
    pose(*params)
scene.frame_set(8)
scene.render.filepath=str(Path(sys.argv[-1]).resolve())
bpy.ops.render.render(write_still=True)
