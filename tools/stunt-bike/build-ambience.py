"""Build CC0 BigSoundBank ambience loops. Usage: build-ambience.py 0122.mp3 0595.mp3"""
import subprocess,sys,numpy as np
from scipy.io import wavfile
from pathlib import Path
out=Path('assets/stunt-bike/audio')
for name,file,start,duration in [('city-traffic',sys.argv[1],10,20),('wind',sys.argv[2],12,12)]:
 x=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-ss',str(start),'-i',file,'-t',str(duration),'-ar','24000','-ac','1','-f','f32le','-']),dtype=np.float32).copy()
 x-=x.mean();x*=.14/max(.01,np.sqrt(np.mean(x*x)));x=np.clip(x,-.8,.8)
 n=12000;f=np.linspace(0,1,n);x=np.concatenate([x[n:-n],x[-n:]*(1-f)+x[:n]*f])
 wavfile.write('/tmp/'+name+'-loop.wav',24000,(x*32767).astype(np.int16))
 subprocess.run(['ffmpeg','-v','error','-y','-i','/tmp/'+name+'-loop.wav','-map_metadata','-1','-codec:a','libmp3lame','-b:a','64k',str(out/(name+'.mp3'))],check=True)
