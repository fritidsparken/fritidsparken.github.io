"""Apply UV finishes and original murals after Blender's park geometry is assembled."""
from pathlib import Path
import bpy

HERE=Path(__file__).resolve().parent
TEXTURES=next((p for p in [HERE/'art', *[base/'assets/skatepark/textures/alpstrand' for base in HERE.parents], HERE.parent.parent/'textures'/'alpstrand', HERE.parent/'textures'/'alpstrand'] if (p/'undertow-octopus.jpg').exists()), HERE/'art')

# Material, base-colour map, packed roughness/metallic and tangent normal set.
FINISHES = {
    'Highland_Concrete': ('cast-concrete-color.jpg','cast-concrete'),
    'Highland_BowlWall': ('bowl-patina-color.jpg','cast-concrete'),
    'Highland_Plaza': ('plaza-slabs-color.jpg','cast-concrete'),
    'Highland_Plywood': ('maple-ply-color.jpg','maple-ply'),
    'Highland_BlueSteel': ('blue-enamel-color.jpg','painted-steel'),
    'Highland_DarkSteel': ('graphite-enamel-color.jpg','painted-steel'),
    'Highland_Orange': ('mandarin-enamel-color.jpg','painted-steel'),
    'Highland_Octopus': ('undertow-octopus.jpg',''),
    'Highland_Sunset': ('lakeside-sunset.jpg',''),
    'Highland_Mountains': ('alpine-ridge.jpg',''),
    'Highland_Chevrons': ('vert-arrows.jpg',''),
}


def texture(nodes, filename, data=False):
    image=bpy.data.images.load(str(TEXTURES/filename),check_existing=True)
    if data:
        image.colorspace_settings.name='Non-Color'
    if not image.packed_file:
        image.pack()
    n=nodes.new('ShaderNodeTexImage')
    n.image=image
    return n


def build():
    plaza=bpy.data.objects.get('RIDE_Expansion_joint_plaza')
    if plaza and plaza.data.materials and plaza.data.materials[0].name=='Highland_Concrete':
        slab=plaza.data.materials[0].copy()
        slab.name='Highland_Plaza'
        plaza.data.materials[0]=slab
        uv=plaza.data.uv_layers.active
        for datum in uv.data:
            datum.uv=datum.uv*.25
    concrete=bpy.data.materials.get('Highland_Concrete')
    if concrete:
        wall=bpy.data.materials.get('Highland_BowlWall') or concrete.copy()
        wall.name='Highland_BowlWall'
        for objname in ('RIDE_Great_lagoon','RIDE_Painted_channel','RIDE_North_pocket'):
            obj=bpy.data.objects.get(objname)
            if not obj or wall.name in obj.data.materials:
                continue
            data=obj.data
            rim_count=next(i for i,v in enumerate(data.vertices) if v.co.z < -.0001)
            rim=[v.co.copy() for v in data.vertices[:rim_count]]
            arc=[0]
            for a,b in zip(rim,rim[1:]+rim[:1]):
                arc.append(arc[-1]+(b-a).length)
            repeats=max(1,round(arc[-1]/12))
            data.materials.append(wall)
            idx=len(data.materials)-1
            uv=data.uv_layers.active
            # Fill faces appended after the 24 transition bands retain their planar mapping.
            for face in data.polygons:
                if len(face.vertices)!=4 or min(face.vertices)>=rim_count*24:
                    continue
                face.material_index=idx
                columns=[v%rim_count for v in face.vertices]
                seam=(0 in columns and rim_count-1 in columns)
                for loop in face.loop_indices:
                    v=data.loops[loop].vertex_index
                    col=v%rim_count
                    column=rim_count if col==0 and seam else col
                    uv.data[loop].uv=(arc[column]/arc[-1]*repeats,.997-(v//rim_count)/24*.994)
    for name,(color, maps) in FINISHES.items():
        material=bpy.data.materials.get(name)
        if material is None:
            continue
        material.use_nodes=True
        tree=material.node_tree
        nodes=tree.nodes
        bsdf=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
        # Retain object assignments and slots when rerunning on a previously finished file.
        for old_node in list(nodes):
            if old_node.type not in ('BSDF_PRINCIPLED','OUTPUT_MATERIAL'):
                nodes.remove(old_node)
        bsdf.location=(160,140)
        base=texture(nodes,color)
        base.location=(-440,300)
        tree.links.new(base.outputs['Color'],bsdf.inputs['Base Color'])
        if maps:
            packed=texture(nodes,maps+'-orm.png',True)
            packed.location=(-660,20)
            channels=nodes.new('ShaderNodeSeparateColor')
            channels.location=(-360,20)
            tree.links.new(packed.outputs['Color'],channels.inputs[0])
            tree.links.new(channels.outputs['Green'],bsdf.inputs['Roughness'])
            tree.links.new(channels.outputs['Blue'],bsdf.inputs['Metallic'])
            normal=texture(nodes,maps+'-normal.png',True)
            normal.location=(-660,-260)
            tangent=nodes.new('ShaderNodeNormalMap')
            tangent.location=(-360,-240)
            tree.links.new(normal.outputs['Color'],tangent.inputs['Color'])
            tree.links.new(tangent.outputs['Normal'],bsdf.inputs['Normal'])
        else:
            bsdf.inputs['Roughness'].default_value=.77
            bsdf.inputs['Metallic'].default_value=0
        material['surface_origin']='Original Alpstrand Vertpark finish'
        material.asset_mark()
