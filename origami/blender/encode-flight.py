"""Encode a Blender flight and keep the editable scene beside the folding project."""
from pathlib import Path
import json,subprocess,shutil,sys
from PIL import Image
source=Path(sys.argv[1]);dest=Path(sys.argv[2]);dest.mkdir(parents=True,exist_ok=True)
info=json.loads((source/'flight.json').read_text())
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-framerate',str(info['fps']),'-i',str(source/'flight-%04d.png'),'-frames:v',str(info['frames']),'-c:v','libx264','-preset','slow','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart','-an',str(dest/'flight.mp4')],check=True)
Image.open(source/'flight-0001.png').save(dest/'flight.webp',quality=90,method=6)
shutil.copyfile(source/'flight.blend',dest.parent.parent/'blender'/(dest.name+'-flight.blend'))
(dest/'flight.json').write_text(json.dumps(info,ensure_ascii=False,indent=2)+'\n')
print('FLIGHT_ENCODED',dest,flush=True)
