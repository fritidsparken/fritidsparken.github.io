"""Organize the editable source; only the excavator is visible on opening.
Unhide a named asset collection in the Outliner to edit the other assets.
"""
import bpy
from pathlib import Path
root=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(root/'blender'/'construction.blend'))
for name in ['excavator','dumper','loader','crane','mixer','roller','environment']+['project_'+str(i) for i in range(6)]:
 obj=bpy.data.objects[name];col=bpy.data.collections.get('Asset - '+name)
 if not col:col=bpy.data.collections.new('Asset - '+name);bpy.context.scene.collection.children.link(col)
 for o in [obj]+list(obj.children_recursive):
  if o.name not in col.objects:col.objects.link(o)
  for old in list(o.users_collection):
   if old!=col:old.objects.unlink(o)
 col.hide_viewport=name!='excavator'
bpy.ops.wm.save_as_mainfile(filepath=str(root/'blender'/'construction.blend'),compress=True)
