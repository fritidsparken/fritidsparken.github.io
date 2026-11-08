from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import urllib.request
from PIL import Image
root=Path(__file__).resolve().parents[2]/'assets/space/textures'
items={'mercury':'2k_mercury.jpg','venus':'2k_venus_atmosphere.jpg','earth':'2k_earth_daymap.jpg','earth-night':'2k_earth_nightmap.jpg','earth-clouds':'2k_earth_clouds.jpg','mars':'2k_mars.jpg','jupiter':'2k_jupiter.jpg','saturn':'2k_saturn.jpg','uranus':'2k_uranus.jpg','neptune':'2k_neptune.jpg','moon':'2k_moon.jpg','sun':'2k_sun.jpg','stars':'2k_stars_milky_way.jpg','rings':'2k_saturn_ring_alpha.png'}
def get(it):
 name,src=it
 dest=root/(name+('.png' if name=='rings' else '.jpg'))
 try:
  with urllib.request.urlopen('https://www.solarsystemscope.com/textures/download/'+src,timeout=45) as r: data=r.read()
  dest.write_bytes(data)
  with Image.open(dest) as im: im.verify()
  return name,len(data),'OK'
 except Exception as e: return name,str(e)
with ThreadPoolExecutor(max_workers=5) as pool:
 for result in pool.map(get,items.items()):print(result,flush=True)
