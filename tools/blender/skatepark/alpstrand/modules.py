"""Split the shipped Meshopt scene by its Blender asset collections, sharing KTX2 maps."""
import copy, json, re, struct, unicodedata
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
ASSETS=ROOT/'assets/skatepark'
CAT=ASSETS/'library/alpstrand/catalog.json'
MODELS=ASSETS/'models/alpstrand'
MAPS=ASSETS/'materials/alpstrand'
def slug(value):
    text=unicodedata.normalize('NFKD',value).encode('ascii','ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+','-',text).strip('-')
def encode(doc, body):
    meta=json.dumps(doc,separators=(',',':')).encode()
    meta+=b' '*(-len(meta)%4)
    return (struct.pack('<4sIII4s',b'glTF',2,28+len(meta)+len(body),len(meta),b'JSON')+meta+struct.pack('<I4s',len(body),b'BIN\0')+body)
def subset(src,body,record):
    tables={k:[] for k in ('nodes','meshes','materials','textures','images','accessors','bufferViews')}
    indices={k:{} for k in tables}
    binary=bytearray()
    virtual=0
    def get(table,old):
        nonlocal virtual
        if old in indices[table]:
            return indices[table][old]
        item=copy.deepcopy(src[table][old])
        idx=len(tables[table]); indices[table][old]=idx; tables[table].append(item)
        if table=='meshes':
            for prim in item['primitives']:
                for k,v in prim['attributes'].items():prim['attributes'][k]=get('accessors',v)
                prim['indices']=get('accessors',prim['indices'])
                prim['material']=get('materials',prim['material'])
        elif table=='accessors':
            item['bufferView']=get('bufferViews',item['bufferView'])
        elif table=='bufferViews':
            ext=item.get('extensions',{}).get('EXT_meshopt_compression')
            if ext is None:
                start=item.get('byteOffset',0)
                item['byteOffset']=len(binary)
                binary.extend(body[start:start+item['byteLength']]);binary.extend(b'\0'*(-len(binary)%4))
                return idx
            start=ext.get('byteOffset',0)
            payload=body[start:start+ext['byteLength']]
            ext['byteOffset']=len(binary)
            binary.extend(payload);binary.extend(b'\0'*(-len(binary)%4))
            item['byteOffset']=virtual
            virtual+=(item['byteLength']+3)//4*4
        elif table=='materials':
            for field in (item,item.get('pbrMetallicRoughness',{})):
                for key,value in field.items():
                    if key.endswith('Texture'):
                        value['index']=get('textures',value['index'])
        elif table=='textures':
            ex=item['extensions']['KHR_texture_basisu']
            ex['source']=get('images',ex['source'])
        elif table=='images':
            view=src['bufferViews'][item.pop('bufferView')]
            start=view.get('byteOffset',0)
            filename=f"{old:02d}-{slug(item['name'])}.ktx2"
            (MAPS/filename).write_bytes(body[start:start+view['byteLength']])
            item['uri']='../../materials/alpstrand/'+filename
        return idx
    names=set(record['nodes'])
    pivot=record['origin_m']
    for node in src['nodes']:
        if node['name'] not in names:continue
        nd=copy.deepcopy(node)
        assert 'children' not in nd and 'matrix' not in nd
        pos=nd.get('translation',[0.,0.,0.])
        nd['translation']=[pos[0]-pivot[0],pos[1]-pivot[2],pos[2]+pivot[1]]
        nd['mesh']=get('meshes',nd['mesh'])
        path=nd.get('extras',{}).get('grindPath')
        if path:nd['extras']['grindPath']=[value-pivot[i%3] for i,value in enumerate(path)]
        tables['nodes'].append(nd)
    assert {n['name'] for n in tables['nodes']}==names
    doc=dict(asset=src['asset'],scene=0,scenes=[{'nodes':list(range(len(names)))}],
             samplers=src['samplers'],extensionsUsed=src['extensionsUsed'],
             extensionsRequired=src['extensionsRequired'],buffers=[{'byteLength':len(binary)},
             {'byteLength':virtual,'extensions':{'EXT_meshopt_compression':{'fallback':True}}}])
    doc.update({k:v for k,v in tables.items() if v})
    return encode(doc,binary)
if __name__=='__main__':
    MODELS.mkdir(exist_ok=True);MAPS.mkdir(exist_ok=True)
    src=(ASSETS/'models/alpstrand.glb').read_bytes()
    size=struct.unpack_from('<I',src,12)[0]
    doc=json.loads(src[20:20+size])
    cat=json.loads(CAT.read_text())
    for entry in cat['modules']:
        filename=slug(entry['collection'])+'.glb'
        (MODELS/filename).write_bytes(subset(doc,src[28+size:],entry))
        entry['glb']='../../models/alpstrand/'+filename
    CAT.write_text(json.dumps(cat,ensure_ascii=False,indent=2)+'\n')
