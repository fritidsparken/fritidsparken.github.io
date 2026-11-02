"""Build sampled audio from licensed originals; see assets/stunt-bike/audio/LICENSES.md.
Usage: python build-audio.py /path/to/extracted-engine-pack /path/to/Raving-Energy.mp3
Requires ffmpeg, numpy and scipy. No synthesized engine audio is created.
"""
import subprocess,sys,numpy as np
from pathlib import Path
from scipy.io import wavfile
source=Path(sys.argv[1]);music=sys.argv[2];out=Path('assets/stunt-bike/audio');out.mkdir(parents=True,exist_ok=True)
def decode(path):
 return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-ar','24000','-ac','1','-f','f32le','-']),dtype=np.float32).copy()
def clip(name,file,start,end,loop=True):
 x=decode(source/file)[int(start*24000):int(end*24000)];x-=x.mean()
 # Normalize each separately recorded operating range, retaining its timbre.
 x*=.19/max(.01,np.sqrt(np.mean(x*x)));x=np.clip(x,-.85,.85)
 if loop:
  n=min(2400,len(x)//5);fade=np.linspace(0,1,n)
  seam=x[-n:]*(1-fade)+x[:n]*fade;x=np.concatenate([x[n:-n],seam])
 else:
  n=min(240,len(x)//4);x[:n]*=np.linspace(0,1,n);x[-n:]*=np.linspace(1,0,n)
 wavfile.write(out/(name+'.wav'),24000,(x*32767).astype(np.int16))
clip('idle','090912-022.mp3',2,6)
clip('low','090912-017.mp3',1.7,3.4)
clip('mid','090912-017.mp3',4,5.8)
clip('high','090912-022.mp3',9.6,11.4)
clip('overrun','090912-022.mp3',11.7,13.3)
clip('metal-impact','kickstand_on_concrete_01.mp3',0,3.8,False)
# 32 bars at the source's documented 122 BPM; bake short loop seam crossfade.
x=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-ss','31.47541','-i',music,'-t',str(128*60/122+.04),'-ar','44100','-ac','2','-f','f32le','-']),dtype=np.float32).copy().reshape(-1,2)
n=1764;f=np.linspace(0,1,n)[:,None];x=np.concatenate([x[n:-n],x[-n:]*(1-f)+x[:n]*f]);x*=.82/max(.01,np.max(abs(x)))
wavfile.write('/tmp/music-loop.wav',44100,(x*32767).astype(np.int16))
subprocess.run(['ffmpeg','-v','error','-y','-i','/tmp/music-loop.wav','-map_metadata','-1','-codec:a','libmp3lame','-b:a','96k',str(out/'raving-energy.mp3')],check=True)
