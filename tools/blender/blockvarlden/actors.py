"""Regenerate Blockvärlden's independently designed, vertex-painted rigged cast.
blender -b -t 2 --python-exit-code 1 -P tools/blender/blockvarlden/actors.py
"""
import bpy
import hashlib
import json
import math
import struct
from mathutils import Vector
from pathlib import Path

OUT = Path(__file__).resolve().parents[3] / "assets/blockvarlden/actors"
OUT.mkdir(parents=True, exist_ok=True)
# body width, length, depth, leg length, head width, main coat, muzzle/belly, mane/accents
SPECIES = {
    'ko': ('Ko', .76, 1.28, .72, .56, .54, '9c644c','fae4b3','5d433b'),
    'far': ('Får', .72, .99, .7, .4, .4, 'eddfbf','695549','bc9b78'),
    'gris': ('Gris', .62, .87, .54, .27, .44, 'df988b','f5bc9e','b96c65'),
    'hona': ('Höna', .37, .52, .39, .16, .24, 'dcaf69','f2d79a','a64b39'),
    'hast': ('Häst', .64, 1.48, .7, .85, .43, '925c3a','d4a16a','4c3b36'),
    'kanin': ('Kanin', .32, .48, .34, .13, .25, 'b7a391','e6d1ac','be8d83'),
    'rav': ('Räv', .45, .83, .44, .38, .34, 'ca7448','f3d5aa','564035'),
    'varg': ('Varg', .53, .97, .55, .46, .42, '78838b','d0c7ad','515866'),
    'bjorn': ('Björn', .89, 1.24, .82, .43, .54, '79604a','bf946e','57473e'),
    'fisk': ('Fisk', .19, .57, .29, .02, .18, '52a1aa','aed8be','ea9a53'),
    'lyktmott': ('Lyktmott', .26,.49,.26,.12,.21, '426788','b4e9c0','ffbd66'),
    'mosslynx': ('Mosslo', .54,.98,.56,.5,.43, '638477','dbd493','d49b59'),
    'skifferbagge': ('Skifferbagge', .61,.86,.42,.18,.31,'566780','ccc49a','6eb6b2'),
    'korallvandrare': ('Korallvandrare', .69,.94,.51,.48,.41,'b66e71','ecd0a2','e5a35d'),
    'rimfena': ('Rimfena', .32,.93,.45,.03,.31,'7e99c9','c2e3de','a6b9ed'),
    'stigfinnare': ('Stigfinnaren', .5,.33,.55,.69,.4,'306e70','c28e6c','f2b95e'),
}
AQUATIC = {'fisk','rimfena'}
COLORS = {}
def srgb(value):
    if value not in COLORS:
        v=[int(value[i:i+2],16)/255 for i in (0,2,4)]
        COLORS[value]=tuple(n/12.92 if n<=.04045 else ((n+.055)/1.055)**2.4 for n in v)
    return COLORS[value]

class Sculpt:
    def __init__(self):
        self.vertices=[]; self.faces=[]; self.colors=[]; self.groups={}; self.bones={}
    def bone(self,name,pivot,parent=None):
        self.bones[name]=(pivot,parent)
    def part(self,bone,center,size,color, *, lean=(0,0), taper=.91, bevel=.13, rotation=0):
        # Four bevelled octagonal rings give broad handmade planes and clean silhouettes.
        x,y,z=center; w,l,h=size; cut=.27
        outline=[(-1+cut,-1),(1-cut,-1),(1,-1+cut),(1,1-cut),(1-cut,1),(-1+cut,1),(-1,1-cut),(-1,-1+cut)]
        start=len(self.vertices)
        for altitude,scale in ((-.5,.83),(-.5+bevel,1),(.5-bevel,taper),(.5,.84*taper)):
            for a,b in outline:
                px=a*w*.5*scale+altitude*lean[0]; py=b*l*.5*scale+altitude*lean[1]
                self.vertices.append((x+px*math.cos(rotation)-py*math.sin(rotation),y+py*math.cos(rotation)+px*math.sin(rotation),z+altitude*h))
        faces=[tuple(range(7,-1,-1))]
        for level in range(3):
            for i in range(8):
                a=level*8+i; b=level*8+(i+1)%8; faces.append((a,b,b+8,a+8))
        faces.append(tuple(range(24,32)))
        self.groups.setdefault(bone,[]).extend(range(start,start+32))
        for n,f in enumerate(faces):
            self.faces.append(tuple(start+i for i in f))
            factor=.94+((n*11+len(self.faces)*3)%9)*.012
            self.colors.append(tuple(min(1,c*factor) for c in srgb(color))+(1,))
    def model(self,name):
        arm=bpy.data.armatures.new(name); rig=bpy.data.objects.new(name,arm); bpy.context.collection.objects.link(rig)
        bpy.context.view_layer.objects.active=rig; bpy.ops.object.mode_set(mode='EDIT')
        for bone,(pivot,parent) in self.bones.items():
            b=arm.edit_bones.new(bone); b.head=pivot; b.tail=Vector(pivot)+Vector((0,0,.11))
            if parent: b.parent=arm.edit_bones[parent]
        bpy.ops.object.mode_set(mode='OBJECT')
        mesh=bpy.data.meshes.new(name+' skulptur'); mesh.from_pydata(self.vertices,[],self.faces); mesh.update()
        ob=bpy.data.objects.new(name+' färgytor',mesh); bpy.context.collection.objects.link(ob); ob.parent=rig
        attr=mesh.color_attributes.new(name='COLOR_0',type='BYTE_COLOR',domain='CORNER')
        uv=mesh.uv_layers.new(name='UV')
        for face,color in zip(mesh.polygons,self.colors):
            axis=max(range(3),key=lambda a:abs(face.normal[a])); axes=[i for i in range(3) if i!=axis]
            for li in face.loop_indices:
                attr.data[li].color=color
                v=mesh.vertices[mesh.loops[li].vertex_index].co; uv.data[li].uv=(v[axes[0]],v[axes[1]])
        mat=bpy.data.materials.new(name+' pigment'); mat.use_nodes=True
        p=mat.node_tree.nodes.get('Principled BSDF'); p.inputs['Roughness'].default_value=.85
        c=mat.node_tree.nodes.new('ShaderNodeVertexColor'); c.layer_name='COLOR_0'
        mat.node_tree.links.new(c.outputs['Color'],p.inputs['Base Color']); ob.data.materials.append(mat)
        for key,indices in self.groups.items(): ob.vertex_groups.new(name=key).add(indices,1,'REPLACE')
        mod=ob.modifiers.new('Skelett','ARMATURE'); mod.object=rig
        return rig

def animal(key,props):
    name,w,l,h,leg,head,main,cream,accent=props
    s=Sculpt(); s.bone('body',(0,0,leg+h*.5))
    headz=leg+h*(1.06 if key in ('hast','hona') else .76)
    hy=-l*.48
    s.bone('head',(0,hy,headz),'body'); s.bone('tail',(0,l*.45,leg+h*.65),'body')
    p=s.part
    p('body',(0,0,leg+h*.5),(w,l,h),main,taper=.94)
    p('body',(0,-l*.21,leg+h*.19),(w*.83,l*.49,h*.36),cream)
    if key=='hast': p('head',(0,hy+.06,headz),(w*.58,.41,.65),main,lean=(0,-.17))
    hz=headz+(head*.48 if key=='hast' else 0)
    if key not in AQUATIC: p('head',(0,hy-.04,hz),(head,head*.84,head*.83),main)
    if key=='ko':
        for sign in (-1,1):
            p('head',(sign*head*.43,hy,hz+head*.43),(head*.17,head*.21,head*.36),'ddc69a',lean=(sign*.04,0),taper=.48)
        for side,zoff,yoff in [(1,.05,.13),(-1,.02,-.12),(1,0,-.25),(-1,.1,.28)]:
            p('body',(side*w*.465,yoff,leg+h*.53+zoff),(.056,l*.23,h*.46),accent)
    if key in ('far','bjorn'):
        for x in (-.25,0,.25):
            for y in (-.25,.18):p('body',(x*w,y*l,leg+h*.84),(w*.46,l*.45,h*.36),main)
    if key not in AQUATIC and key not in ('skifferbagge','lyktmott'):
        for side in (-1,1):
            long=key=='kanin'; point=key in ('rav','varg','mosslynx','hast','kanin')
            ex=side*head*.36; ez=hz+head*(.68 if long else .39)
            p('head',(ex,hy+.035,ez),(head*.3,head*.26,head*(.89 if long else .45)),main,
              lean=(side*head*.16,head*.06),taper=.37 if point else .83)
            p('head',(ex,hy-.006,ez),(head*.16,head*.14,head*(.62 if long else .24)),accent,taper=.45)
    if key in ('hona','lyktmott','fisk','rimfena'): 
        p('head',(0,hy-head*.4,hz),(head*.54,head*.52,head*.28),accent,taper=.55)
    else:
        p('head',(0,hy-head*.41,hz-head*.14),(head*.72,head*.64,head*.43),cream)
        for side in (-1,1):p('head',(side*head*.16,hy-head*.71,hz-head*.1),(head*.09,head*.09,head*.08),accent)
    for side in (-1,1):
        p('head',(side*head*.39,hy-head*.27,hz+head*.09),(head*.14,head*.15,head*.14),'2c343c')
        p('head',(side*head*.41,hy-head*.32,hz+head*.115),(head*.055,head*.055,head*.055),'f8eedb')
    if key=='hona':p('head',(0,hy,hz+head*.42),(head*.22,head*.8,head*.55),'b74837',taper=.62)
    if key in ('mosslynx','korallvandrare','skifferbagge'):
        for j in range(4):
            y=(j-1.5)*l*.19
            p('body',((-.09 if j%2 else .09)*w,y,leg+h*1.06),(.13,l*.18,h*(.37+.07*j)),accent,lean=(0,l*.08),taper=.26)
    if key in ('hona','lyktmott','rimfena','fisk'):
        for side in (-1,1):
            b='wing'+str(side); s.bone(b,(side*w*.34,0,leg+h*.68),'body')
            wing=key=='lyktmott'; span=w*(1.24 if wing else .47)
            p(b,(side*(w*.45+span*.28),l*.07,leg+h*.57),(span,l*.74,h*(.25 if wing else .47)),accent,rotation=side*.28)
            if wing:p(b,(side*w*1.15,l*.02,leg+h*.61),(w*.33,l*.25,h*.22),cream)
    if key not in AQUATIC:
        for side in (-1,1):
            ys=[-.29,.31] if key!='hona' else [.03]
            for idx,yf in enumerate(ys):
                b=f'leg{side}_{idx}'; x=side*w*.32; y=yf*l
                s.bone(b,(x,y,leg+.08),'body'); thick=w*(.23 if key!='hona' else .14)
                p(b,(x,y,leg*.55),(thick,thick*1.14,leg*1.1),main)
                p(b,(x,y-thick*.19,leg*.14),(thick*1.12,thick*(2 if key=='kanin' else 1.4),max(.055,leg*.28)),accent)
    tailz=leg+h*.59; long=key in ('varg','rav','mosslynx','hast')
    if key in AQUATIC:
        p('tail',(0,l*.54,tailz),(.066,l*.43,h*.96),accent,taper=.74)
        p('body',(0,.03,leg+h*1.03),(.048,l*.4,h*.45),accent,lean=(0,.05),taper=.5)
    else:
        size=(w*(.39 if long else .24),l*(.65 if long else .26),h*(.43 if long else .32))
        p('tail',(0,l*(.70 if long else .49),tailz),size,accent)
        if key=='rav':p('tail',(0,l*.94,tailz),(w*.32,l*.24,h*.38),cream,taper=.66)
    return s

def player(props):
    _,w,l,h,leg,head,main,skin,accent=props
    s=Sculpt(); s.bone('body',(0,0,.74)); s.bone('head',(0,0,1.31),'body')
    p=s.part
    p('body',(0,0,1.04),(w,l,.59),main,taper=1.08); p('body',(0,0,.80),(w*.95,l*1.02,.10),'6f503d')
    p('body',(0,.19,1.01),(.34,.22,.43),'a56542');p('body',(0,.29,1.10),(.31,.065,.17),accent)
    p('body',(0,-.01,1.29),(.47,.36,.099),accent)
    p('head',(0,0,1.5),(head,.34,.40),skin)
    p('head',(0,.025,1.68),(.43,.39,.16),'593d34')
    p('head',(-.11,-.14,1.64),(.21,.09,.12),'593d34',lean=(.06,0))
    for side in (-1,1):
        x=side*.119
        p('head',(x,-.158,1.51),(.064,.04,.051),'382f33')
        p('head',(x+.008,-.179,1.52),(.017,.011,.017),'fff4df')
        p('head',(side*.20,0,1.51),(.061,.1,.13),skin)
        b=f'leg{side}_0'; s.bone(b,(x,0,.77),'body')
        p(b,(x,0,.47),(.206,.25,.54),'48556a'); p(b,(x,-.032,.15),(.227,.334,.25),'694f3a')
        b=f'arm{side}'; s.bone(b,(side*.238,0,1.25),'body')
        p(b,(side*.284,0,1.14),(.186,.23,.26),main)
        p(b,(side*.286,-.008,.95),(.144,.177,.23),skin);p(b,(side*.286,-.012,.838),(.157,.18,.11),'ac714d')
    p('head',(0,-.165,1.43),(.079,.022,.018),'90594c')
    return s

def animate(rig,key):
    names=['idle','walk','run','eat','rest','flee','swim']
    if key=='stigfinnare': names=['idle','walk','run','jump','land','swim','dig','chop','build','use','climb','hurt','rest']
    rig.animation_data_create()
    for action in names:
        act=bpy.data.actions.new(action); rig.animation_data.action=act
        for i in range(5):
            phase=i*math.pi/2; wave=math.sin(phase); alt=1-math.cos(phase)
            for b in rig.pose.bones:
                n=b.name; x=y=z=0; rise=0; gait=action in ('walk','run','flee','swim','climb')
                if n=='body':
                    rise=alt*(.023 if gait else .008)
                    if action=='rest':rise=-.07+alt*.004
                    if action in ('jump','land','hurt'):x=alt*(.09 if action=='jump' else -.09)
                    if key in AQUATIC:y=wave*.09
                elif n=='head':
                    x=wave*(.09 if gait else .046)
                    if action=='eat':x=-.38-alt*.19
                    if action=='rest':x=-.13
                    z=wave*.058
                elif n.startswith('leg') or n.startswith('arm'):
                    side= -1 if '-' in n else 1
                    if gait:x=wave*side*(-1 if n.endswith('_1') or n.startswith('arm') else 1)*(.6 if action in ('run','flee','climb') else .36)
                    if action in ('dig','chop','build','use') and n=='arm1':x=-.65+wave*.56
                    if action in ('jump','land','hurt'):x=side*alt*.16
                elif n.startswith('wing'):y=wave*(.42 if key=='lyktmott' else .2)*(-1 if '-' in n else 1)
                elif n=='tail':z=wave*(.37 if gait else .17)
                b.rotation_mode='XYZ'; b.rotation_euler=(x,y,z); b.location=(0,0,rise)
                if n=='body': b.keyframe_insert(data_path='location',frame=1+i*6)
                b.keyframe_insert(data_path='rotation_euler',frame=1+i*6)
        for curve in act.fcurves:
            for keyframe in curve.keyframe_points: keyframe.interpolation='LINEAR'
        track=rig.animation_data.nla_tracks.new();track.name=action
        track.strips.new(action,1,act);track.mute=True
        rig.animation_data.action=None
    return names

manifest=[]
for key,props in SPECIES.items():
    bpy.ops.wm.read_factory_settings(use_empty=True); bpy.context.scene.render.fps=24
    rig=(player(props) if key=='stigfinnare' else animal(key,props)).model(key)
    actions=animate(rig,key)
    path=OUT/(key+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',export_yup=True,
        export_animation_mode='ACTIONS',export_frame_range=False,export_force_sampling=False,
        export_optimize_animation_size=True,export_optimize_animation_keep_anim_armature=False,
        export_skins=True,export_texcoords=True,export_normals=True,
        export_cameras=False,export_lights=False)
    data=path.read_bytes(); size=struct.unpack_from('<I',data,12)[0]; doc=json.loads(data[20:20+size])
    clips={a['name'] for a in doc.get('animations',[])}
    assert doc.get('skins') and set(actions)==clips,(key,clips)
    for mesh in doc['meshes']:
        for prim in mesh['primitives']: assert {'JOINTS_0','COLOR_0','TEXCOORD_0','WEIGHTS_0'}<=prim['attributes'].keys(),prim['attributes']
    manifest.append(dict(id=key,name=props[0],file=path.name,kind='player' if key=='stigfinnare' else 'animal' if list(SPECIES).index(key)<10 else 'creature',aquatic=key in AQUATIC,animations=actions,sha256=hashlib.sha256(data).hexdigest()))
(OUT/'manifest.json').write_text(json.dumps(dict(blender=bpy.app.version_string,license='CC0-1.0',author='Fritidsparken – original procedural sculptures and animations',actors=manifest),ensure_ascii=False,indent=2)+'\n')
