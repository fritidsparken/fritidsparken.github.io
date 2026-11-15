"""Package Blender renders as small, Safari-compatible step clips and posters.
python origami/blender/encode.py /tmp/glidaren-render origami/assets/glidaren
"""
import json,shutil,subprocess,sys
from pathlib import Path
from PIL import Image
source=Path(sys.argv[1]);dest=Path(sys.argv[2]);dest.mkdir(parents=True,exist_ok=True)
for path in sorted(source.glob('state-*.png')):
    Image.open(path).save(dest/(path.stem+'.webp'),quality=88,method=6)
model=json.loads((source/'model.json').read_text())
for step in range(1,model['steps']+1):
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-framerate','24','-i',str(source/f'step-{step:02d}-%03d.png'),'-frames:v','48','-c:v','libx264','-preset','slow','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart','-an',str(dest/f'step-{step:02d}.mp4')],check=True)
shutil.copyfile(source/(model['id']+'.blend'),dest.parent.parent/'blender'/(model['id']+'.blend'))
metadata={'model':model['name'],'source':model['source'],'tool':'Blender 4.3.2','engine':'Workbench','resolution':[640,640],'fps':24,'framesPerStep':48,'steps':model['steps'],'paperThicknessMm':.11,'generatedBy':['export-frames.mjs','render-glidaren.py','encode.py']}
(dest/'manifest.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
print(f"Created {model['steps']} step videos, {model['steps']+1} posters and {model['id']}.blend.")
