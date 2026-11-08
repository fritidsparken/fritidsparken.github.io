import bpy, math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'blender'/'construction.blend'))
for col in bpy.data.collections:col.hide_viewport=False
for o in list(bpy.data.objects):
 if o.type in ['LIGHT','CAMERA']:bpy.data.objects.remove(o,do_unlink=True)
roots=[bpy.data.objects[n] for n in ['excavator','dumper','loader','crane','mixer','roller','environment']+['project_'+str(i) for i in range(6)]]
def cv(p):return Vector((p[0],-p[2],p[1]))
source=(ROOT/'blender'/'build.py').read_text();exec(source[source.index('# Pack originals'):])
