#!/usr/bin/env python3
"""Audit every wash level and refine the 30 coarse hand-drawn masks."""
import json
import re
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'
OUT = ASSETS / 'masks'
DIAG = ROOT / 'diagnostics'
OUT.mkdir(parents=True, exist_ok=True)
DIAG.mkdir(parents=True, exist_ok=True)
FILES = ['levels.js', 'extra-levels-20261117.js',
         'extra-levels-20261117b.js', 'tivoli-levels-20261117.js']
levels = []
for filename in FILES:
    s = (ROOT / filename).read_text(encoding='utf-8')
    m = re.search(r'WASH_LEVELS(?:\s*=\s*|\.push\(\.\.\.)(\[[\s\S]*?\])\s*(?:;|\))', s)
    if not m:
        raise RuntimeError(f'Cannot parse level definitions: {filename}')
    for item in json.loads(m.group(1)):
        item['_file'] = filename
        levels.append(item)
assert len(levels) == 76, f'Expected 76, got {len(levels)}'

HOUSE = [
 [[.2445,.3268],[.319,.299],[.319,.262],[.365,.262],[.365,.291],[.733,.261],[.802,.296],[.800,.307],[.2445,.335]],
 [[.279,.334],[.770,.305],[.770,.418],[.679,.394],[.568,.438],[.568,.541],[.453,.535],[.279,.554]],
 [[.570,.435],[.681,.395],[.795,.435],[.793,.553],[.774,.576],[.594,.576],[.594,.555],[.570,.550]],
]
def existing_mask(level, size):
    w, h = size
    m = Image.new('L', size, 0)
    d = ImageDraw.Draw(m)
    if level['id'] == 'house':
        regions = [[p] for p in HOUSE]
    elif level.get('regions'):
        regions = level['regions']
    else:
        regions = [[p] for p in level.get('polygons', [])]
    for rings in regions:
        if not rings:
            continue
        d.polygon([(round(x*w), round(y*h)) for x,y in rings[0]], fill=255)
        for hole in rings[1:]:
            d.polygon([(round(x*w), round(y*h)) for x,y in hole], fill=0)
    return np.asarray(m).copy()

def refine(level, img, old, session):
    """Segment the main object, using rough polygons only as a spatial prior."""
    rgb = np.asarray(img.convert('RGB'))
    h, w = rgb.shape[:2]
    pred = remove(img, session=session, only_mask=True, post_process_mask=True)
    prob = np.asarray(pred.convert('L'))
    if prob.shape != old.shape:
        prob = cv2.resize(prob, (w, h), interpolation=cv2.INTER_LINEAR)
    dist = cv2.distanceTransform((old == 0).astype('uint8'), cv2.DIST_L2, 3)
    allowance = max(45, round(min(w, h)*.115))
    allowed = (old > 0) | (dist < allowance)
    binary = np.where((prob >= 120) & allowed, 255, 0).astype('uint8')
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE,
                              cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3,3)))
    count, labels, stats, _ = cv2.connectedComponentsWithStats(binary, connectivity=8)
    kept = np.zeros_like(binary)
    for i in range(1,count):
        area = int(stats[i, cv2.CC_STAT_AREA])
        if area < max(25, w*h*.00018):
            continue
        comp = labels == i
        overlap = int(np.count_nonzero(comp & (old > 0)))
        if overlap >= max(10, area*.035) or area >= w*h*.012:
            kept[comp] = 255
    # Remove visible background through slats, handrails and open frames.
    ident = level['id']
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    hue, sat, val = cv2.split(hsv)
    yy, xx = np.ogrid[:h, :w]
    fx, fy = xx / w, yy / h
    green = (hue >= 35) & (hue <= 88) & (sat > 65) & (val > 55)
    sky = (hue >= 87) & (hue <= 112) & (sat > 50) & (sat < 220) & (val > 215)
    def cut_pixels(pixel_class, x0, y0, x1, y1):
        roi = (fx > x0) & (fx < x1) & (fy > y0) & (fy < y1)
        kept[roi & pixel_class] = 0
    if ident == 'extra27_bench':
        cut_pixels(green, .13, .30, .87, .56)
    if ident == 'extra27_roundabout':
        cut_pixels(green, .05, .33, .95, .70)
    if ident == 'extra27_slide':
        cut_pixels(green, .08, .34, .91, .72)
        cut_pixels(sky, .27, .24, .75, .50)
    if ident == 'extra27_playcastle':
        cut_pixels(green, .09, .42, .92, .72)
        cut_pixels(sky, .10, .22, .90, .57)
    if ident == 'extra27_carousel':
        cut_pixels(green, .08, .35, .92, .74)
        cut_pixels(sky, .09, .29, .91, .58)
    if ident == 'new26_firetruck':
        cut_pixels(sky, .20, .22, .87, .41)
    if ident == 'extra27_helicopter':
        # Restore the four thin rotor blades, not the blue sky between them.
        roi = (fy > .165) & (fy < .305) & (fx > .01) & (fx < .99)
        red = ((hue < 12) | (hue > 170)) & (sat > 90) & (val > 75)
        yellow = (hue >= 12) & (hue <= 38) & (sat > 105) & (val > 95)
        gray = (sat < 115) & (val < 195) & (val > 55)
        rotor = roi & (red | yellow | gray)
        rotor &= ~((fx < .13) & (fy < .218))
        rotor = cv2.morphologyEx(rotor.astype('uint8'), cv2.MORPH_CLOSE,
                                 cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(3,3)))
        n, labels, stats, _ = cv2.connectedComponentsWithStats(rotor, connectivity=8)
        for component in range(1, n):
            if stats[component, cv2.CC_STAT_AREA] < 200:
                rotor[labels == component] = 0
        kept[rotor > 0] = 255
    fraction = float(np.count_nonzero(kept)/(w*h))
    if not (.02 < fraction < .72):
        raise RuntimeError(f'{level["id"]}: segmentation area {fraction:.1%} suspicious')
    rgba = Image.new('RGBA', (w,h), (255,255,255,0))
    rgba.putalpha(Image.fromarray(kept))
    rgba.save(OUT / (level['id']+'.webp'), format='WEBP', lossless=True, method=6)
    return kept, {'model': 'u2net', 'area': round(fraction,4),
                  'oldArea': round(float(np.count_nonzero(old)/(w*h)),4),
                  'overlapWithOld': round(float(np.count_nonzero((old>0)&(kept>0))/max(1,np.count_nonzero(old))),4),
                  'marginPixels': allowance}

def thumb(img, mask, width=220, height=290, color=(255,32,64)):
    img = img.convert('RGB').resize((width,height), Image.Resampling.LANCZOS)
    mask = cv2.resize(mask,(width,height),interpolation=cv2.INTER_AREA)
    overlay = Image.new('RGB',(width,height),color)
    alpha = Image.fromarray(np.uint8(mask*.36))
    img.paste(overlay,(0,0),alpha)
    return img

session = new_session('u2net')
results=[]
fontpath='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
font=ImageFont.truetype(fontpath,16) if Path(fontpath).exists() else ImageFont.load_default()
for index, level in enumerate(levels):
    ident=level['id']
    source=ASSETS / (('house-portrait-v2' if ident=='house' else ident)+'.webp')
    if not source.is_file():
        raise RuntimeError(f'Missing asset {source}')
    im=Image.open(source).convert('RGB')
    old=existing_mask(level,im.size)
    if np.count_nonzero(old) < 50:
        raise RuntimeError(f'Empty original mask: {ident}')
    coarse=level['_file'].startswith('extra-levels')
    if coarse:
        new,metrics=refine(level,im,old,session)
    else:
        new=old
        metrics={'model':'existing detailed mask','area':round(float(np.count_nonzero(old)/old.size),4)}
    results.append({'index':index+1,'id':ident,'name':level['name'],'source':level['_file'],
                    'size':im.size,'coarse':coarse,**metrics})
    t=Image.new('RGB',(466,338),'#f5f8fd')
    d=ImageDraw.Draw(t)
    d.text((8,7),f'{index+1:02d} {level["name"]}',fill='#172b4d',font=font)
    t.paste(thumb(im,old),(8,34))
    t.paste(thumb(im,new,color=(30,210,80)),(238,34))
    if index%12==0:
        sheet=Image.new('RGB',(466*3,338*4),'#e8edf5')
    sheet.paste(t,((index%12)%3*466,(index%12)//3*338))
    if index%12==11 or index==len(levels)-1:
        sheet.save(DIAG / f'contours-{index//12+1:02d}.webp','WEBP',quality=85,method=6)
    print(f'{index+1:02d}/{len(levels)} {ident:25s} {metrics["area"]:.1%}',flush=True)
(DIAG/'report.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Generated {sum(x["coarse"] for x in results)} refined masks and {((len(levels)+11)//12)} contact sheets.')
