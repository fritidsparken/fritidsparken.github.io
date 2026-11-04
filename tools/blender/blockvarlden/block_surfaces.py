"""Tileable color recipes baked at texel centres by the Blender generator."""
import math
import numpy as np

N = 32
Y, X = np.mgrid[:N, :N]
TAU = 2 * math.pi


def field(rng, count):
    """Periodic value noise, smoothly interpolated from a coarse lattice."""
    grid = rng.uniform(-1, 1, (count, count))
    u, v = X * count / N, Y * count / N
    ix, iy = u.astype(int), v.astype(int)
    fx, fy = u % 1, v % 1
    fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    a, b = grid[iy, ix], grid[iy, (ix + 1) % count]
    c, d = grid[(iy + 1) % count, ix], grid[(iy + 1) % count, (ix + 1) % count]
    return (a*(1-fx)+b*fx)*(1-fy)+(c*(1-fx)+d*fx)*fy


def surface(block, face, seed):
    rng = np.random.default_rng(seed)
    f = block['family']
    rgb = np.array(list(bytes.fromhex(block['color'][1:])), dtype=float)
    coarse, fine = field(rng, 4), field(rng, 8)
    grain = rng.normal(0, 1, X.shape)
    shade = 7 * coarse + 4 * fine + 2 * grain
    base = np.broadcast_to(rgb, (*X.shape, 3)).copy()
    phase = rng.uniform(0, TAU)
    wave = np.sin(TAU*X/N + phase)
    if f in ('grass','moss','leaf','needle'):
        for _ in range(70 if f in ('leaf','needle') else 120):
            x, y = rng.integers(0,N,2)
            width = rng.integers(2,6) if f == 'leaf' else 1
            height = rng.integers(2,5)
            light = rng.choice([-16,-10,9,15])
            for j in range(height):
                w = max(1, width - abs(j-height//2))
                for i in range(w):
                    shade[(y+j)%N,(x+i+j//2)%N] += light + i * 2
        if f == 'grass' and face != 'top':
            depth = 5+2*wave+2*(np.sin(X*TAU*4/N+phase)>0)
            soil = (Y>depth) if face=='side' else np.ones_like(X,bool)
            base[soil] = [142,99,66]
            shade[soil] = (9*coarse+7*fine+3*grain)[soil]
            if face=='side':
                shade[(Y>depth)&(Y<depth+2)] -= 12
    elif f in ('log','beam','plank','parquet','crate','workbench'):
        if f in ('log','beam') and face != 'side':
            r = np.hypot(X-14+2*coarse,Y-17+2*fine)
            base += [15,13,9]
            shade += 9*np.sin(r*1.3) - 10*(r%5<1)
        else:
            along = Y if f in ('log','beam') else X
            across = X if f in ('log','beam') else Y
            grainline = across + 1.3*np.sin(along*TAU/N+phase)+.65*fine
            shade += np.sin(grainline*1.6)*5 - (np.sin(grainline*1.2)>.86)*14
            if f=='log' and block['key']=='bjorkstock':
                shade -= ((grain>-.2)&(np.cos(Y*.9+coarse*2)>.9))*50
            if f not in ('log','beam'):
                shade -= (across % 8 == 0)*22 + ((along+12*(across//8))%32==0)*13
                shade += (across%8==1)*7
            if f in ('crate','workbench'):
                border = (X<3)|(Y<3)|(X>N-4)|(Y>N-4)
                base[border] *= .83
                if face=='side':
                    base[np.abs(X-Y)<2] *= .82
                for x,y in [(2,2),(29,2),(29,29),(2,29)]:
                    shade[y,x] -= 40
    elif f in ('brick','ashlar','roof','tile','inlay','metal','glass'):
        h = 8 if f in ('brick','roof') else 16
        row = Y//h
        x = (X+(row%2)*8) % 16 if f in ('brick','roof','ashlar') else X%16
        seam = (Y%h==0)|(x==0)
        if f=='glass':
            seam = (X==0)|(Y==0)
            shade += 18*((X+Y)%32==9)+9*((X+Y)%32==11)
        if f=='inlay':
            diamond = abs(x-8)+abs(Y%16-8)
            shade += (diamond==6)*17-(diamond<5)*9
        if f=='roof':
            shade += 9*np.cos(x*TAU/16)
        if f=='metal':
            shade += ((X%16==2)&(Y%16==2))*22 + grain
        shade[seam] -= 18
        shade[(x==1)|(Y%h==1)] += 6
    elif f in ('strata','marble','ice','snow','water','sand','peat','field','lava'):
        stripe = Y + 1.8*np.sin(TAU*X/N+phase) + 1.1*fine
        if f in ('marble','ice','lava'):
            vein = np.abs(coarse+.35*fine)
            shade += (vein<.09)*(22 if f != 'lava' else 58)
            if f=='lava':
                base[vein>.32] *= [.61,.45,.52]
        elif f=='field':
            shade += 14*np.cos(TAU*X/8)
        else:
            strength = 10 if f in ('strata','peat','water') else 3
            shade += strength * np.cos(stripe*TAU/8)
    elif f in ('ore','gravel','cobble','crystal','basalt'):
        # Periodic Voronoi facets with lit rims. Minerals sit in a stone matrix.
        distances = []
        for _ in range(20 if f in ('ore','gravel') else 12):
            x,y = rng.uniform(0,N,2)
            dx, dy = (X-x+16)%N-16, (Y-y+16)%N-16
            distances.append(np.abs(dx)*.6+np.hypot(dx, dy))
        near = np.sort(distances,axis=0)
        boundary = near[1]-near[0]
        if f=='ore':
            base[:] = [102,105,111]
            inclusion = near[0]<2.7+.5*coarse
            base[inclusion] = rgb
            shade[inclusion] += 14*(near[0][inclusion]<1.7)
        else:
            shade += 5*np.minimum(boundary,3)-14*(boundary<.8)
            shade += (np.roll(boundary,1,axis=0)<.8)*9
    elif f=='lamp':
        shade += 8*np.cos(X*TAU/8)
        base[(X<3)|(Y<3)|(X>28)|(Y>28)|((face=='side')&(X%16==0))] = [104,83,62]
    elif f=='granite':
        shade += (grain>1.15)*21 - (grain<-1.25)*25
    elif f in ('earth','rock','concrete'):
        shade += 4*fine+(grain>1.4)*8
    return np.clip(base + shade[:,:,None],0,255).astype(np.uint8)
