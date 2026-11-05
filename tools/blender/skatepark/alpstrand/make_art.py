"""Produce original tileable park finishes and painted murals. All sizes are pixels."""
from pathlib import Path
import math
import numpy as np
from PIL import Image, ImageDraw, ImageColor
from scipy.ndimage import gaussian_filter, map_coordinates

OUT = Path(__file__).resolve().parent / "art"
OUT.mkdir(exist_ok=True)
rng = np.random.default_rng(1425)
SIDE = 512
yy, xx = np.mgrid[:SIDE,:SIDE]


def noise(scale, shape=(SIDE,SIDE)):
    n = gaussian_filter(rng.normal(size=shape), scale, mode="wrap")
    return (n - n.mean()) / max(n.std(), 1e-7)


def rgb(base, variation):
    return np.clip(np.asarray(base)[None,None,:] + variation[:,:,None], 0, 255).astype('uint8')


def save_surface(name, color, height, rough, metallic, intensity):
    Image.fromarray(color).save(OUT/f'{name}-color.jpg',quality=91)
    gx = (np.roll(height, -1, axis=1) - np.roll(height,1,axis=1))*intensity
    gy = (np.roll(height, -1, axis=0) - np.roll(height,1,axis=0))*intensity
    vectors = np.stack([-gx,gy,np.ones_like(gx)],axis=-1)
    vectors /= np.linalg.norm(vectors,axis=-1,keepdims=True)
    Image.fromarray(((vectors*.5+.5)*255).astype('uint8')).save(OUT/f'{name}-normal.png',optimize=True)
    occlusion=np.clip(250 - np.maximum(-height,0)*6,220,255)
    orm=np.stack((occlusion,np.clip(rough,0,255),np.full_like(rough,metallic)),axis=-1)
    Image.fromarray(orm.astype('uint8')).save(OUT/f'{name}-orm.png',optimize=True)


fine = noise(.5)
concrete = noise(28)*4+noise(5)*1.8+fine*1.6
pores = np.maximum(0,-fine-1.55)**.8
height = fine*.12 - pores*.48 + noise(4)*.10
save_surface("cast-concrete",rgb((178,174,166),concrete-pores*13),height,192 + fine*4,0,.17)

# Four plywood panel courses with staggered joints, countersunk screws and longitudinal grain.
grain_warp = noise((20,4))*2
grain = map_coordinates(noise((28,.6)), [yy, xx+grain_warp], mode="grid-wrap",order=1)
wood = grain*6+noise((22,2))*4+noise(14)*1.5
seams = np.zeros((SIDE,SIDE)); screws = seams.copy()
for k in range(4):
    start = k*128
    seams[:,start] = 1; seams[(yy%256==(k%2)*128)&(xx//128==k)] = 1
    for y0 in range(-64, SIDE+64,64):
        for x0 in (start+4,start+124):
            screws[((xx-x0)**2+(yy-y0)**2)<2] = 1
wood -= seams*32+screws*58
save_surface("maple-ply",rgb((195,155,112),wood),grain*.12-seams*.6-screws*.6,146+grain*7,0,.65)
steel = noise(.5)*1.25+noise(30)*.75
for key,base in [('blue-enamel',(28,75,114)),('graphite-enamel',(50,59,65)),('mandarin-enamel',(230,133,57))]:
    if key == 'blue-enamel':
        save_surface('painted-steel',rgb(base,steel),steel*.024,114+steel*3,45,.55)
        (OUT/'painted-steel-color.jpg').rename(OUT/f'{key}-color.jpg')
    else:
        Image.fromarray(rgb(base,steel)).save(OUT/f'{key}-color.jpg',quality=91)

# Wide plaza slabs repeat every eight metres; bowl walls use a joint-free finer cast.
size=1024
y,x=np.mgrid[:size,:size]
panel=np.zeros((size,size))
joint=np.ones_like(panel)*100
for row in range(3):
    y0,y1=row*size//3,(row+1)*size//3
    cut=(row%2)*size//4
    xx_local=(x-cut)%(size//2)
    select=(y>=y0)&(y<y1)
    phase=((x-cut)//(size//2))%2
    panel[select]=np.where(phase,.85,-.85)[select] + (row-1)*.8
    dist=np.minimum.reduce([xx_local,size//2-xx_local,y-y0,y1-y])
    joint[select]=dist[select]
pitting=noise(.55,(size,size))
surface=panel+noise(60,(size,size))*3.4+noise(8,(size,size))*1.8+pitting*3
surface-=np.exp(-joint**2/.65)*28+np.exp(-joint**2/13)*3
# A sparse group of fine curved wheel scuffs interrupts the regular slab rhythm.
scuffs=Image.new('L',(size,size),0)
pen=ImageDraw.Draw(scuffs)
for i in range(18):
    cx,cy=rng.integers(size,size=2);rad=int(rng.integers(32,78));ang=int(rng.integers(360))
    for j in range(2):
        box=(cx-rad+j*3,cy-rad+j*3,cx+rad-j*3,cy+rad-j*3)
        pen.arc(box,ang,ang+int(rng.integers(18,60)),int(rng.integers(5,14)),1)
# A few narrow shrinkage cracks with short, fading branches.
for x0,y0,dx,dy in [(30,343,98,56),(379,681,-72,-89),(770,7,64,106)]:
    px,py=x0,y0
    for k in range(14):
        nx,ny=px+dx/14+rng.uniform(-4,4),py+dy/14+rng.uniform(-5,5)
        pen.line((px,py,nx,ny),fill=max(3,22-k),width=1)
        if k in (3,7):
            pen.line((nx,ny,nx-8,ny+4,nx-15,ny+11),fill=9,width=1)
        px,py=nx,ny
surface-=np.asarray(scuffs)
Image.fromarray(rgb((183,178,169),surface)).save(OUT/'plaza-slabs-color.jpg',quality=91)

# Bowl wall mapped by arclength around coping and from the lip down to the floor.
shape=(512,1024)
wy,wx=np.mgrid[:shape[0],:shape[1]]
down=wy/(shape[0]-1)
mineral=noise((48,6),shape)
streak=noise((55,1.3),shape)
watermarks=(np.maximum(0,mineral)*9+np.maximum(0,streak)*3)*np.exp(-((down-.28)/.35)**2)
patina=noise((17,34),shape)*3.8+noise(3,shape)*1.8+noise(.65,shape)*1.6-watermarks
patina-=12*np.exp(-down*5)
# Arced tire rubs and shallow trowel joints follow the flowing transition.
rub=Image.new('L',(shape[1],shape[0]),0)
rubpen=ImageDraw.Draw(rub)
for i in range(52):
    cy=rng.uniform(90,420);cx=rng.uniform(-50,shape[1])
    rx=rng.uniform(17,60);ry=rng.uniform(30,80)
    rubpen.arc((cx-rx,cy-ry,cx+rx,cy+ry),rng.integers(15,60),rng.integers(96,150),fill=int(rng.integers(3,12)),width=1)
for px in (5,339,726):
    rubpen.line((px,0,px-3,200,px-5,511),fill=10,width=1)
patina-=np.asarray(rub)
Image.fromarray(rgb((178,174,166),patina)).save(OUT/'bowl-patina-color.jpg',quality=91)

W,H=1024,640
S=2


class Painting:
    def __init__(self, base):
        self.im=Image.new("RGB",(W*S,H*S),base)
        self.d=ImageDraw.Draw(self.im)

    def points(self, points):
        return [(int(x*S),int(y*S)) for x,y in points]

    def poly(self,points,fill):
        self.d.polygon(self.points(points),fill=fill)

    def line(self,points,fill,width=1):
        self.d.line(self.points(points),fill=fill,width=max(1,int(width*S)),joint="curve")

    def ellipse(self,x,y,rx,ry,fill):
        self.d.ellipse(self.points([(x-rx,y-ry),(x+rx,y+ry)]),fill=fill)

    def finish(self,name):
        result=np.array(self.im.resize((W,H),Image.Resampling.LANCZOS)).astype(float)
        big=noise(19,(H,W)); micro=noise(.35,(H,W))
        concrete=np.array([176.,172.,165.])+((big*4+micro*5)[:,:,None])
        chip=np.clip((noise(.8,(H,W)) - 1.8)*.35,0,.7)
        wear=np.clip(.07+big*.023+chip,0,.9)[:,:,None]
        result=result*(1-wear)+concrete*wear+micro[:,:,None]*2.6
        Image.fromarray(result.clip(0,255).astype('uint8')).save(OUT/f'{name}.jpg',quality=92)


def spline(points, samples=20):
    """Catmull-Rom through artist-specified knots."""
    knots=np.asarray([points[0],*points,points[-1]],float)
    out=[]
    for i in range(1,len(knots)-2):
        a,b,c,d=knots[i-1:i+3]
        for t in np.linspace(0,1,samples,endpoint=False):
            out.append(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t))
    return np.asarray([*out,points[-1]])


def waves(p,baseline,amp,count,fill,phase):
    x=np.arange(-20,W+22,2)
    phase=x/W*math.tau*count+phase
    y=baseline + amp*(np.sin(phase)+.37*np.sin(2*phase+.8))
    p.poly([*zip(x,y),(W+20,H),(-20,H)],fill)


def tapered(p,curve,radii,col,dx=0,dy=0):
    tangent=np.gradient(curve,axis=0)
    norms=np.stack((-tangent[:,1],tangent[:,0]),axis=1)
    norms/=np.maximum(np.linalg.norm(norms,axis=1,keepdims=True),1e-6)
    middle=curve+np.array([dx,dy])
    p.poly([*(middle+norms*radii[:,None]),*(middle-norms*radii[:,None])[::-1]],col)
    return norms


p=Painting('#c3c3b8')
for pos,col in [(245,'#8dacac'),(264,'#3e8491'),(293,'#184757'),(313,'#78b5b9'),(328,'#376f81')]:
    waves(p,pos,51,2.15,col,.9)
for pos,col in [(475,'#bed9d2'),(484,'#f1edcf'),(506,'#306576'),(536,'#72a4a8'),(557,'#e1eadf'),(580,'#2a5c6e')]:
    waves(p,pos,37,3.1,col,.25)
# Winding tentacles drawn from the body out to their ends, with hand-shaped silhouettes.
arms=[
[(492,322),(407,385),(284,325),(176,185),(89,149),(41,200),(59,243),(95,228),(90,207)],
[(488,331),(395,420),(259,398),(137,337),(68,343),(-24,416)],
[(480,350),(395,473),(294,504),(192,462),(126,480),(129,529),(171,544),(185,524)],
[(501,341),(462,469),(413,557),(354,583),(309,565),(312,539),(334,543)],
[(525,351),(536,427),(578,495),(663,529),(711,508),(717,475),(692,463),(676,475)],
[(550,336),(606,383),(698,369),(813,279),(907,276),(951,318),(938,360),(904,364),(891,347)],
[(549,321),(627,308),(685,230),(756,142),(835,163),(857,209),(844,238),(818,233)],
[(515,325),(557,400),(654,435),(745,424),(855,392),(948,401),(1036,451)]]
for i,arm in enumerate(arms):
    c=spline(arm)
    rad=33*(1-np.linspace(0,1,len(c)))**.72+1
    n=tapered(p,c,rad+4,'#214452')
    tapered(p,c,rad,'#d7658c')
    tapered(p,c+n*rad[:,None]*.44,rad*.32,'#f2a0a2')
    # Space suckers by arc length, maintaining separation through tight curls.
    dist=np.r_[0,np.cumsum(np.linalg.norm(np.diff(c,axis=0),axis=1))]
    for d in np.arange(62,dist[-1]-8,18):
        j=np.searchsorted(dist,d); loc=c[j]+n[j]*rad[j]*.47; r=max(1,rad[j]*.18)
        p.ellipse(*loc,r*1.4,r,'#9c4860'); p.ellipse(loc[0],loc[1]-1,r,r*.7,'#efc298')
p.ellipse(504,278,75,87,'#214452');p.ellipse(504,276,70,81,'#d87a99')
p.ellipse(480,248,35,28,'#e798a5')
for x in (477,532):
    p.ellipse(x,299,17,19,'#224353');p.ellipse(x,298,13,15,'#efd39e');p.ellipse(x+3,299,6,12,'#213c49')
for _ in range(54):
    a=rng.uniform(0,math.tau);r=rng.uniform(.1,.95);x=504+63*r*math.cos(a);y=256+52*r*math.sin(a)
    p.ellipse(x,y,3,2,'#bf6086')
p.finish('undertow-octopus')

p=Painting('#acaaa2')
# Ragged upper spray edge allows the warm colour to rise out of raw concrete.
xs=np.arange(0,W+2,2)
upper=156+55*np.sin(xs/81)+28*np.sin(xs/31)+16*np.sin(xs/13)
p.poly([*zip(xs,upper),(W,H),(0,H)],'#f5ab48')
for y,col in [(255,'#f38e55'),(323,'#ed765f'),(389,'#db627a'),(454,'#bb517c')]:
    waves(p,y,15,2.3,col,2.3)
p.ellipse(691,332,69,69,'#ffcf71')
for y,col,z in [(487,'#a44b75',1.8),(514,'#773d70',2.4),(555,'#523560',1.4)]:
    waves(p,y,49,z,col,1.1)
for x in range(-8,W,19):
    h=rng.uniform(18,85)
    p.poly([(x,564),(x,533-h),(x+13,530-h),(x+13,564)],'#49385c')
for x,base,h in [(105,548,190),(185,563,120),(815,585,147),(883,569,215),(971,572,133)]:
    crown=(x+h*.10,base-h)
    p.poly([(x-6,base),(x+.1*h-2,base-h),(x+.1*h+3,base-h),(x+7,base)],'#283b54')
    for angle in np.linspace(-3.1,.1,11):
        v=np.array([math.cos(angle),math.sin(angle)])*h*.31
        c=spline([crown,np.array(crown)+v*.55+[0,-8],np.array(crown)+v+[0,17]])
        tapered(p,c,np.linspace(3,.5,len(c)),'#283b54')
        for t in range(5,len(c)-3,3):
            dx,dy=c[t]
            p.poly([(dx,dy),(dx+2,dy+2),(dx+v[0]*.08,dy+10-t/len(c)*6)],'#283b54')
p.finish('lakeside-sunset')

p=Painting('#304052')
p.poly([(0,555),(179,379),(275,415),(420,246),(496,280),(649,95),(715,190),(759,171),(900,365),(1024,286),(1024,640),(0,640)],'#9db7bb')
p.poly([(0,555),(179,379),(137,451),(182,428),(202,442),(275,415),(232,469),(275,457),(420,246),(393,339),(422,314),(434,340),(496,280),(466,352),(649,95),(619,193),(644,164),(662,189),(715,190),(759,171),(729,232),(772,211),(900,365),(872,380),(1024,286),(1024,351),(903,405),(744,279),(698,307),(648,217),(518,381),(423,376),(294,533),(159,509),(48,591)],'#e7e9dc')
p.poly([(0,571),(142,495),(239,519),(411,402),(490,425),(585,360),(680,387),(781,312),(926,466),(1024,420),(1024,640),(0,640)],'#457583')
for row,color in [(0,'#3d616d'),(1,'#284654')]:
    for x in range(-12,1060,17+row*6):
        base=610+row*26+27*math.sin(x/75)
        h=rng.uniform(34,100)+row*13
        for v in (0,.25,.47):
            p.poly([(x,base-h+v*h),(x-h*(.08+v*.18),base-h+(v+.44)*h),(x+h*(.08+v*.18),base-h+(v+.44)*h)],color)
        p.poly([(x-2,base),(x-1,base-h*.65),(x+2,base)],color)
p.finish('alpine-ridge')

p=Painting('#53616a')
for y in [244,394]:
    p.poly([(216,y+81),(515,y-61),(819,y+81),(819,y+140),(515,y+3),(216,y+140)],'#ed933c')
p.finish('vert-arrows')
