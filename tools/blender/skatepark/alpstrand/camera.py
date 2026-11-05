import math
import bpy
from mathutils import Vector

def setup(sky_file=None):
    scene=bpy.context.scene
    scene.render.engine='CYCLES'
    scene.cycles.samples=12
    scene.cycles.use_denoising=False
    scene.render.resolution_x=1280
    scene.render.resolution_y=720
    scene.render.resolution_percentage=100
    scene.view_settings.view_transform='AgX'
    world=bpy.data.worlds.new('Alpstrand • klar sommardag')
    world.use_nodes=True
    scene.world=world
    nodes=world.node_tree.nodes
    link=world.node_tree.links.new
    sky=nodes.new('ShaderNodeTexSky')
    sky.sky_type='NISHITA'
    sky.sun_elevation=math.radians(48)
    sky.sun_rotation=math.radians(-53)
    sky.sun_disc=False
    sky.air_density=0.85
    sky.dust_density=0.34
    bg=nodes.get('Background')
    link(sky.outputs[0],bg.inputs[0])
    bg.inputs[1].default_value=0.13
    if sky_file:
        panorama=nodes.new('ShaderNodeTexEnvironment')
        panorama.image=bpy.data.images.load(str(sky_file))
        panorama.image.pack()
        backdrop=nodes.new('ShaderNodeBackground')
        link(panorama.outputs[0],backdrop.inputs[0])
        backdrop.inputs[1].default_value=1.0
        mix=nodes.new('ShaderNodeMixShader')
        lightpath=nodes.new('ShaderNodeLightPath')
        link(lightpath.outputs['Is Camera Ray'],mix.inputs[0])
        link(bg.outputs[0],mix.inputs[1])
        link(backdrop.outputs[0],mix.inputs[2])
        link(mix.outputs[0],nodes.get('World Output').inputs['Surface'])
    bpy.ops.object.light_add(type='SUN',location=(-42,-26,43))
    sun=bpy.context.object
    sun.name='Sol • sydost'
    sun.rotation_euler=(-sun.location).to_track_quat('-Z','Y').to_euler()
    sun.data.energy=3.6
    sun.data.angle=math.radians(1.15)
    sun.data.color=(1,0.94,0.84)
    bpy.ops.object.camera_add(location=(-7.5,-68,21))
    camera=bpy.context.object
    camera.name='Referenskamera • södra läktaren'
    camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.lens=25.0
    camera.data.clip_end=1800
    scene.camera=camera
    scene.view_settings.look='AgX - Medium High Contrast'
    return scene
