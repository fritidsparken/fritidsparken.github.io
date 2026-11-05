"""Retain cloud structures from the project's CC0 panorama, grading for clear alpine daylight."""
from pathlib import Path
from PIL import Image
from scipy.ndimage import gaussian_filter
import numpy as np
def make(source, destination):
    im=np.asarray(Image.open(source).convert('RGB'),dtype=float)/255
    h,w=im.shape[:2]; y=np.linspace(1,-1,h)[:,None]
    # Shift the cloud layer towards the apparent mountain horizon.
    row=np.clip((.37-y*.40)*h,0,h-1).astype(int)[:,0]
    sky=im[row]
    ratio=sky[:,:,0]/np.maximum(.04,sky[:,:,2])
    bright=sky[:,:,0]
    mask=np.clip((ratio-.77)*3.1+.9*(bright-.59),0,1)
    mask*=np.clip((bright-.43)*2.4,0,1)
    mask=gaussian_filter(mask,.48)
    horizon=np.exp(-np.maximum(y,0)*4)
    base=np.stack([.15+.42*horizon,.47+.3*horizon,.84+.12*horizon],axis=-1)
    rgb=base*(1-mask[:,:,None])+(.80+.19*bright[:,:,None])*mask[:,:,None]
    Image.fromarray((rgb.clip(0,1)*255).astype('uint8')).save(destination,quality=92)
