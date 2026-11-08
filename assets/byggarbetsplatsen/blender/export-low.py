"""Export reduced geometry for low/CPU rendering from the editable Blender source."""
import bpy
from pathlib import Path
root=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(root/'blender'/'construction.blend'))
for col in bpy.data.collections:col.hide_viewport=False
for o in list(bpy.data.objects):
 if o.type=='MESH' and len(o.data.polygons)>30:
  o.data=o.data.copy();bpy.context.view_layer.objects.active=o
  mod=o.modifiers.new('Mobile mesh reduction','DECIMATE');mod.ratio=.16
  bpy.ops.object.modifier_apply(modifier=mod.name)
for name in ['excavator','dumper','loader','crane','mixer','roller','environment']+['project_'+str(i) for i in range(6)]:
 o=bpy.data.objects[name];bpy.ops.object.select_all(action='DESELECT');o.select_set(True)
 for c in o.children_recursive:c.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(root/'models'/(name+'-low.glb')),use_selection=True,export_format='GLB',export_extras=True,export_yup=True)
