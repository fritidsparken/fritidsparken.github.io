"""Join matching 24 fps Blender steps into one uninterrupted stream per guide."""
import json,subprocess,pathlib,tempfile
for manifest in pathlib.Path('origami/assets').glob('*/manifest.json'):
 data=json.loads(manifest.read_text());folder=manifest.parent
 with tempfile.NamedTemporaryFile(mode='w',suffix='.txt') as listing:
  for n in range(1,data['steps']+1):listing.write("file '"+str((folder/f'step-{n:02}.mp4').resolve())+"'\n")
  listing.flush()
  subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',listing.name,'-c','copy','-movflags','+faststart',str(folder/'continuous.mp4')],check=True)
 print(folder.name,flush=True)
