"""Rebuild the pressure washer's Blender armature and shared browser proportions.
Run: blender --background --python tools/hogtryckstvatten/build-rig.py
The .blend is a reproducible local authoring file; runtime uses the generated JS data.
"""
import bpy, json, math
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'games/hogtryckstvatten'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
data = {'nearUpper':155, 'nearLower':160, 'farUpper':180, 'farLower':180,
        'nearReach':285, 'farReach':340, 'height':1024}
arm = bpy.data.armatures.new('Washer anatomical skeleton')
rig = bpy.data.objects.new('Washer rig', arm)
bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
def bone(name, a, b, parent=None):
    v = arm.edit_bones.new(name)
    v.head = (a[0], -a[1], 0)
    v.tail = (b[0], -b[1], 0)
    if parent: v.parent = arm.edit_bones[parent]
    return v
bone('pelvis', (200,560),(200,500))
bone('spine',(200,560),(235,350),'pelvis')
bone('head',(235,350),(235,130),'spine')
bone('near.upper',(270,350),(270,505),'spine')
bone('near.forearm',(270,505),(430,505),'near.upper')
bone('far.upper',(202,353),(202,533),'spine')
bone('far.forearm',(202,533),(382,533),'far.upper')
bone('tool',(407,438),(766,395))
bpy.ops.object.mode_set(mode='OBJECT')
for side,xy in [('near',(407,438)),('far',(525,403))]:
    target=bpy.data.objects.new(side+'.hand.target',None)
    bpy.context.collection.objects.link(target)
    target.location=(xy[0],-xy[1],0)
    pole=bpy.data.objects.new(side+'.elbow.pole',None)
    bpy.context.collection.objects.link(pole)
    pole.location=(220,-750,0)
    ik=rig.pose.bones[side+'.forearm'].constraints.new('IK')
    ik.target=target; ik.pole_target=pole; ik.chain_count=2; ik.use_stretch=False
    rig.pose.bones[side+'.upper'].ik_stretch=0
    rig.pose.bones[side+'.forearm'].ik_stretch=0
    for frame,angle in [(1,-1.2),(25,-.6),(49,0),(73,.8),(97,-1.2)]:
        dx,dy=xy[0]-270,xy[1]-350
        target.location=(270+dx*math.cos(angle)-dy*math.sin(angle),-(350+dx*math.sin(angle)+dy*math.cos(angle)),0)
        target.keyframe_insert('location',frame=frame)
# Include and pack the generated sprite source for the animator.
img=bpy.data.images.load(str(OUT/'assets/washer-rig-atlas.webp'))
img.pack()
rig['atlas']=img.name
rig['runtime']='washer-rig.js: continuous two-bone IK, shared rigid hand targets'
rig['proportions']=json.dumps(data)
bpy.context.scene.frame_end=97
bpy.context.scene.frame_set(49)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'washer-character.blend'))
(OUT/'washer-rig-data.js').write_text('window.WASHER_RIG_DATA='+json.dumps(data,separators=(',',':'))+';\n')
print('Exported anatomical rig proportions and Blender authoring scene')
