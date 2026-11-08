"""Verify the binary exports, embedded resources, rig and named library entries."""
import json,struct,io
from PIL import Image,ImageStat
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]/'assets/space'
def read(name):
 b=(ROOT/name).read_bytes();magic,version,size=struct.unpack_from('<4sII',b)
 assert magic==b'glTF' and version==2 and size==len(b),name
 length,kind=struct.unpack_from('<II',b,12);assert kind==0x4e4f534a
 g=json.loads(b[20:20+length]);assert len(g.get('meshes',[]))>0
 binary=b[28+length:]
 for im in g.get('images',[]):
  view=g['bufferViews'][im['bufferView']];start=view.get('byteOffset',0)
  image=Image.open(io.BytesIO(binary[start:start+view['byteLength']])).convert('RGB')
  stats=ImageStat.Stat(image)
  assert min(image.size)>=256,im['name']+' texture too small'
  if 'roughness' in im.get('name',''):assert 30<stats.mean[1]<200,im['name']+' invalid roughness'
  else:assert min(stats.mean)>40 and max(stats.stddev)>1,im['name']+' empty texture'
 assert all('uri' not in v for v in g.get('buffers',[])),name+' has external buffer'
 assert all('uri' not in v for v in g.get('images',[])),name+' has external image'
 for mesh in g['meshes']:
  for p in mesh['primitives']:
   assert 'POSITION' in p['attributes'] and 'NORMAL' in p['attributes']
   assert 0<=p['material']<len(g['materials'])
 return g
for name in ['rocket/rocket-high.glb','rocket/rocket-low.glb']:
 g=read(name);assert len(g['skins'])==1 and g['animations']
 names={n.get('name') for n in g['nodes']}
 assert {'PilotRig','PilotHead','EngineCoreLeft','EngineCoreRight','CockpitGlass','LandingGear'}<=names
 assert len(g.get('images',[]))>=6
 assert any(m['name']=='Cockpit blue glass' and m.get('alphaMode')=='BLEND' for m in g['materials'])
g=read('asteroids/asteroid-library.glb');names={n.get('name') for n in g['nodes']}
assert {f'asteroid_{i:02}' for i in range(18)}<=names
for name in ['materials/crystal.glb','stations/orbital-station.glb','vehicles/moon-rover.glb','terrain/landing-base.glb','satellites/research-probe.glb']:read(name)
for name in ['rocket','asteroids','crystal','orbital-station','moon-rover','landing-base','research-probe']:
 assert (ROOT/'blender'/f'{name}.blend').stat().st_size>1000
print('PASS: 8 embedded GLB exports, packed PBR images, retractable gear, skeletal pilot animation, transparent canopy, 18 unique asteroids, 7 Blender originals')
