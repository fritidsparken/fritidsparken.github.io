"""Deterministic original texture authoring: maple, woven upholstery and resin.
Base color uses sRGB; normal and ORM images contain linear data. No runtime noise.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
OUT=Path(__file__).resolve().parents[2]/'games/crazy-bowling/assets'
rng=np.random.default_rng(431)
def save(name,a):
 a=np.uint8(np.clip(a,0,255));Image.fromarray(a).save(OUT/(name+'.webp'),quality=90,method=6)
def maps(name,h,rough,ao=None):
 dy,dx=np.gradient(h);n=np.stack([-dx*1.3,-dy*1.3,np.ones_like(h)],-1);n/=np.linalg.norm(n,axis=-1,keepdims=True);save(name+'-normal',(n*.5+.5)*255)
 save(name+'-orm',np.stack([np.ones_like(h)*255 if ao is None else ao,rough,np.zeros_like(h)],-1))
H,W=2048,1024;y,x=np.mgrid[:H,:W];grain=np.zeros((H,W));tone=np.zeros((H,W));seam=np.zeros((H,W),bool)
for i in range(16):
 left=i*64;shift=rng.uniform(0,100);xx=x[:,left:left+64];yy=y[:,left:left+64];warp=2*np.sin(yy/129+i)+1.3*np.sin(yy/43+i*.7);g=np.sin((xx+warp)*1.8+shift)*.9+np.sin((xx+warp)*.38+shift)*1.8+np.sin((xx+warp)*.081+shift)*3
 grain[:,left:left+64]=g;cuts=(yy+int(rng.integers(0,460)))//460;pal=rng.uniform(-9,9,8);tone[:,left:left+64]=pal[cuts]+rng.uniform(-5,5);seam[:,left:left+2]=True;seam[:,left:left+64]|=((yy+int(shift*4))%460<2)
noise=rng.normal(0,.75,(H,W));value=grain+tone+noise;rgb=np.stack([212+value,166+value*.82,105+value*.6],-1);rgb[seam]*=.7;save('maple',rgb);height=grain*.03; height[seam]-=.75;maps('maple',height,np.clip(66+grain*1.2+tone,48,90),np.where(seam,208,255))
H=W=512;y,x=np.mgrid[:H,:W];weave=3*np.sin(x*np.pi/2)+3*np.sin(y*np.pi/2)+rng.normal(0,2,(H,W));save('fabric',np.stack([42+weave,89+weave,94+weave],-1));maps('fabric',weave*.035,np.full((H,W),218))
grain=rng.normal(0,2,(H,W))+2*np.sin(x/12)*np.sin(y/17);save('concrete',np.stack([76+grain,80+grain,83+grain],-1));maps('concrete',grain*.02,np.full((H,W),210))
H,W=512,1024;y,x=np.mgrid[:H,:W];u=x/W*2*np.pi;v=y/H*np.pi
# Seamless longitude-domain resin flow; the chosen ball colour tints this pearl map.
flow=np.sin(6*u+5*np.sin(3*v+2*np.cos(u)))+ .45*np.sin(15*u+7*np.cos(v)+2*np.sin(2*u))
swirl=np.clip((flow+1.2)/2.4,0,1);pearl=40+swirl*208+rng.random((H,W))*5
save('resin',np.stack([pearl,pearl*.91+15,pearl*.85+30],-1));maps('resin',flow*.015,32+swirl*20)
# Lacquer decal texture uses the pin's arc-length UV, derived from authored profile.
H,W=1024,256;a=np.full((H,W,3),[246,244,231],dtype=np.uint8)
# UV remapped to physical pin height by the asset authoring tool.
for low,high in [(.345,.395),(.425,.475)]:
 lo=int((1-(high+.54)/1.34)*H);hi=int((1-(low+.54)/1.34)*H);a[lo:hi]=[195,31,46]
img=Image.fromarray(a);d=ImageDraw.Draw(img);d.ellipse((110,610,146,646),outline=(35,65,74),width=3);img.save(OUT/'pin.webp',quality=95)
# Branded graphic panel / architectural mural, shared throughout the hall.
im=Image.new('RGB',(2048,512),'#152c36');d=ImageDraw.Draw(im)
for x in range(-800,2400,180):d.polygon([(x,512),(x+450,0),(x+510,0),(x+60,512)],fill='#1a3943')
font='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
d.text((1024,205),'CRAZY BOWLING',font=ImageFont.truetype(font,122),fill='#f7dba3',anchor='mm');d.text((1024,355),'FRITIDSPARKEN   /   BOWL • PLAY • REPEAT',font=ImageFont.truetype(font,32),fill='#83cabb',anchor='mm');im.save(OUT/'mural.webp',quality=90)
print('Texture set:',sum(p.stat().st_size for p in OUT.glob('*.webp')),'bytes')
