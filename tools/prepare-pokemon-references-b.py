"""Align the ten supplied color references to the unchanged coloring pages.
Usage: python tools/prepare-pokemon-references.py /path/to/upload
No generated artwork: affine registration, local contour alignment and RGB sampling only.
"""
import sys, json, hashlib
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt
ROOT=Path(__file__).resolve().parents[1]
UPLOAD=Path(sys.argv[1])
OUT=ROOT/'assets/pokemon-references-20261109-b'
ENTRIES=[('audino','13-audino','0d345657'),('spiritomb','15-spiritomb','6b6e35b9'),('salamence','20-salamence','4caef20e'),('chespin','16-chespin-alt1','5166c70e'),('xatu','21-xatu','6b9bc7f1'),('wigglytuff','22-wigglytuff','fd46c6eb'),('snorunt','18-snorunt','7d4ad030'),('ledian','19-ledian','176fb5af'),('weedle','23-weedle','650503c4'),('venonat','26-venonat','eb6edcbb')]
OUT.mkdir(exist_ok=True)
manifest=[]
for name,stem,key in ENTRIES:
 src=ROOT/f'assets/coloring-originals-2026/pokemon-20261021/{stem}.jpeg'
 ref=next(UPLOAD.glob('*'+key+'*'))
 original=np.array(Image.open(src).convert('RGB')); supplied=np.array(Image.open(ref).convert('RGB'))
 h,w=original.shape[:2];scale=min(1,(2500000/(w*h))**.5);W,H=round(w*scale),round(h*scale)
 original=cv2.resize(original,(W,H),interpolation=cv2.INTER_LINEAR)
 target=cv2.cvtColor(original,cv2.COLOR_RGB2GRAY)
 reference=cv2.resize(supplied,(W,H),interpolation=cv2.INTER_AREA)
 # Compare ink rather than colors. Strong reference contours exclude shaded fills.
 ink=(target<160).astype(np.uint8)*255
 refink=(np.max(reference,axis=2)<(28 if name=="seviper" else 45)).astype(np.uint8)*255
 a=cv2.GaussianBlur(ink,(0,0),3).astype(np.float32)/255
 b=cv2.GaussianBlur(refink,(0,0),3).astype(np.float32)/255
 warp=np.eye(2,3,dtype=np.float32)
 score,warp=cv2.findTransformECC(a,b,warp,cv2.MOTION_AFFINE,(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,150,1e-6),None,5)
 aligned=cv2.warpAffine(reference,warp,(W,H),flags=cv2.INTER_LINEAR|cv2.WARP_INVERSE_MAP,borderValue=(255,255,255))
 alignedInk=cv2.warpAffine(refink,warp,(W,H),flags=cv2.INTER_LINEAR|cv2.WARP_INVERSE_MAP)
 # Small local differences in the supplied outlines are registered to the original.
 flow=cv2.calcOpticalFlowFarneback(cv2.GaussianBlur(ink,(0,0),2),cv2.GaussianBlur(alignedInk,(0,0),2),None,.5,5,41,6,7,1.5,0)
 yy,xx=np.mgrid[:H,:W].astype(np.float32)
 aligned=cv2.remap(aligned,xx+flow[:,:,0],yy+flow[:,:,1],cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT,borderValue=(255,255,255))
 # Remove only duplicated reference ink next to original contours, retaining all RGB shading.
 near=distance_transform_edt(target>=220)<30
 bad=(np.max(aligned,axis=2)<(32 if name=="seviper" else 65))&near&(target>=220)
 _,labels,stats,_=cv2.connectedComponentsWithStats((target>=220).astype(np.uint8),4)
 for label in range(1,len(stats)):
  x,y,rw,rh,area=stats[label]
  if area<3:continue
  region=labels[y:y+rh,x:x+rw]==label
  invalid=bad[y:y+rh,x:x+rw]&region
  if not invalid.any():continue
  valid=region&~bad[y:y+rh,x:x+rw]
  if not valid.any():continue
  indices=distance_transform_edt(~valid,return_distances=False,return_indices=True)
  tile=aligned[y:y+rh,x:x+rw]
  tile[invalid]=tile[indices[0][invalid],indices[1][invalid]]
 paper=(np.min(aligned,axis=2)>245)&(np.ptp(aligned,axis=2)<9)
 aligned[paper]=255
 Image.fromarray(aligned).save(OUT/f'{name}-texture.webp',lossless=True)
 # Same original line-layer opacity as the painter. One contour layer only.
 alpha=np.clip(np.round((245-target.astype(float))*1.7),0,255)/255
 preview=np.round(aligned*(1-alpha[:,:,None])).astype(np.uint8)
 Image.fromarray(preview).save(OUT/f'{name}-reference.webp',lossless=True)
 entry={'name':name,'original':str(src.relative_to(ROOT)),'sourceFile':ref.name,'sourceSHA256':hashlib.sha256(ref.read_bytes()).hexdigest(),'width':W,'height':H,'affine':warp.tolist(),'alignmentScore':float(score),'texture':f'{name}-texture.webp','reference':f'{name}-reference.webp'}
 manifest.append(entry);print(name,round(score,4),W,H,flush=True)
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
