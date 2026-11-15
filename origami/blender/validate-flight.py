"""Verify source mesh identity and reject leftover animated folding objects."""
import bpy,math
from pathlib import Path
from mathutils import Vector,Matrix
root=Path(__file__).resolve().parent
for name in ['glidaren','vapor','arrowhead']:
 bpy.ops.wm.open_mainfile(filepath=str(root/(name+'.blend')))
 scene=bpy.context.scene;scene.frame_set(scene.frame_end)
 ob=[ob for ob in scene.objects if ob.type=='MESH' and ob.name.startswith('Step ') and not ob.hide_render][0]
 mesh=bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get()))
 center=Vector(tuple((min(v.co[i] for v in mesh.vertices)+max(v.co[i] for v in mesh.vertices))/2 for i in range(3)))
 forward=scene.get('flight_forward_xy',[0,1]);heading=Matrix.Rotation(math.atan2(forward[0],forward[1]),3,'Z')
 expected=[heading@(v.co-center) for v in mesh.vertices]
 bpy.ops.wm.open_mainfile(filepath=str(root/(name+'-flight.blend')))
 scene=bpy.context.scene
 assert not any(o.name.startswith('Step ') for o in scene.objects),'Old folding step leaked into the flight scene'
 moving={o.name for o in scene.objects if o.animation_data and o.animation_data.action}
 assert moving=={'Finished folded paper — unchanged geometry','Smooth following camera'},moving
 visible={o.name for o in scene.objects if not o.hide_render}
 for frame in range(1,361):
  scene.frame_set(frame)
  assert {o.name for o in scene.objects if not o.hide_render}==visible,('Unexpected visibility change',frame)
 ob=bpy.data.objects['Finished folded paper — unchanged geometry']
 actual=[v.co.copy() for v in ob.data.vertices]
 assert len(actual)==len(expected)
 error=max((a-b).length for a,b in zip(actual,expected));assert error<1e-7,(name,error)
 scene=bpy.context.scene;assert scene.frame_end==360 and scene.render.fps==30
 scene.frame_set(1);start=ob.location.copy();scene.frame_set(360);assert (ob.location-start).length>10
 print('VERIFIED',name,len(actual),'vertices; max mesh difference',error,flush=True)
