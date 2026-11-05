"""Make portable module entry files linking to the editable Blender master."""
from pathlib import Path
import bpy, json
ROOT=Path(__file__).resolve().parents[4]
assets=ROOT/'assets/skatepark'
catalog=assets/'library/alpstrand/catalog.json'
data=json.loads(catalog.read_text())
directory=assets/'blender/alpstrand'
master=directory/'Alpstrand.blend'
for module in data['modules']:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.preferences.filepaths.save_version=0
    name=module['collection']
    with bpy.data.libraries.load(str(master),link=True) as (src,dst):
        assert name in src.collections
        dst.collections=[name]
    group=dst.collections[0]
    obj=bpy.data.objects.new(name,None)
    obj.instance_type='COLLECTION'
    obj.instance_collection=group
    bpy.context.scene.collection.objects.link(obj)
    obj.empty_display_size=.35
    filename=Path(module['glb']).stem+'.blend'
    bpy.ops.wm.save_as_mainfile(filepath=str(directory/filename),compress=True)
    group.library.filepath='//Alpstrand.blend'
    bpy.ops.wm.save_as_mainfile(filepath=str(directory/filename),compress=True)
    module['blend']='../../blender/alpstrand/'+filename
catalog.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
