"""Remove unstable Workbench shadow volumes from the existing flight scene."""
import bpy,sys,pathlib
model,out=sys.argv[sys.argv.index('--')+1:];out=pathlib.Path(out);out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=model);s=bpy.context.scene
s.display.shading.show_shadows=False
s['shadow_fix']='Workbench shadow volumes disabled to remove camera-crossing dark polygons.'
bpy.ops.wm.save_as_mainfile(filepath=str(out/'flight.blend'),compress=True)
for frame in range(1,361):
 s.frame_set(frame);s.render.filepath=str(out/f'flight-{frame:04}.png');bpy.ops.render.render(write_still=True)
