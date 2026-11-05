// Usage: BASISU=/path/to/basisu node pack.mjs blender-export.glb web.glb
// Requires Basis Universal 1.16.3+ and ImageMagick. Meshoptimizer 0.23 is vendored.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { MeshoptEncoder } from './pack-encoder.mjs';

const [source, destination] = process.argv.slice(2);
if (!source || !destination || source === destination) throw Error('Supply separate input and output GLB paths.');
const input = readFileSync(source);
const jsonSize = input.readUInt32LE(12);
if (input.toString('ascii', 0, 4) !== 'glTF' || input.readUInt32LE(4) !== 2) throw Error('Expected GLB 2.');
const gltf = JSON.parse(input.toString('utf8', 20, 20 + jsonSize));
if (gltf.buffers.length !== 1 || gltf.buffers[0].uri) throw Error('Expected a single embedded GLB buffer.');
const binary = input.subarray(28 + jsonSize);
const work = mkdtempSync(join(tmpdir(), 'alpstrand-'));
const chunks = [];
let byteOffset = 0;
let virtualSize = 0;
let compressedViews = 0;
let textureCount = 0;

function append(bytes) {
    const offset = byteOffset;
    const padding = Buffer.alloc((4 - bytes.length % 4) % 4);
    chunks.push(bytes, padding);
    byteOffset += bytes.length + padding.length;
    return offset;
}
function requireExtension(name) {
    for (const key of ['extensionsRequired', 'extensionsUsed']) {
        gltf[key] ||= [];
        if (!gltf[key].includes(name)) gltf[key].push(name);
    }
}
function textureUses() {
    const roles = new Map();
    const mark = (info, role) => {
        if (!info) return;
        const image = gltf.textures[info.index].source;
        const previous = roles.get(image);
        if (previous && previous !== role) throw Error('One bitmap has conflicting color-space usages: ' + image);
        roles.set(image, role);
    };
    for (const mat of gltf.materials || []) {
        mark(mat.pbrMetallicRoughness?.baseColorTexture, 'color');
        mark(mat.emissiveTexture, 'color');
        mark(mat.pbrMetallicRoughness?.metallicRoughnessTexture, 'linear');
        mark(mat.occlusionTexture, 'linear');
        mark(mat.normalTexture, 'normal');
    }
    return roles;
}
function convertImage(bytes, role, index) {
    const cache = process.env.KTX_CACHE;
    const key = createHash('sha256').update('alpstrand-ktx-v1-' + role).update(bytes).digest('hex');
    const cached = cache && join(cache, key + '.ktx2');
    if (cached && existsSync(cached)) return readFileSync(cached);
    const bitmap = join(work, 'input');
    const png = join(work, 'image.png');
    const output = join(work, 'image.ktx2');
    writeFileSync(bitmap, bytes);
    const size = execFileSync('identify', ['-format', '%w %h', bitmap], { encoding:'utf8' }).split(' ').map(Number);
    const factor = Math.min(1, 2048 / Math.max(...size));
    const [width,height] = size.map(n => Math.max(4, Math.round(n * factor / 4) * 4));
    execFileSync('convert', [bitmap, '-resize', width + 'x' + height + '!', '-strip', 'PNG32:' + png]);
    const options = role === 'color' ? ['-q','180'] : ['-uastc','-uastc_level','1','-linear'];
    if (role === 'normal') options.push('-normal_map');
    execFileSync(process.env.BASISU || 'basisu', ['-file',png,'-output_file',output,'-ktx2','-mipmap','-no_multithreading', ...options]);
    const encoded = readFileSync(output);
    if (cached) writeFileSync(cached, encoded);
    console.log('KTX2', index, role, width + 'x' + height, encoded.length);
    return encoded;
}
function attributeStride(accessor) {
    const widths = {5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
    const counts = { SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16 };
    return widths[accessor.componentType] * counts[accessor.type];
}
try {
    await MeshoptEncoder.ready;
    const roles = textureUses();
    const imagesByView = new Map((gltf.images || []).map((im,i) => [im.bufferView, i]));
    const accessorsByView = new Map();
    for (const a of gltf.accessors || []) {
        if (!accessorsByView.has(a.bufferView)) accessorsByView.set(a.bufferView, []);
        accessorsByView.get(a.bufferView).push(a);
    }
    for (const [index,view] of gltf.bufferViews.entries()) {
        if (view.buffer !== 0 || view.extensions?.EXT_meshopt_compression) throw Error('Expected unpacked input.');
        const start = view.byteOffset || 0;
        const bytes = binary.subarray(start, start + view.byteLength);
        if (imagesByView.has(index)) {
            const image = imagesByView.get(index);
            const packed = convertImage(bytes, roles.get(image) || 'color', image);
            view.byteOffset = append(packed);
            view.byteLength = packed.length;
            gltf.images[image].mimeType = 'image/ktx2';
            textureCount++;
            continue;
        }
        const accessors = accessorsByView.get(index) || [];
        const stride = view.byteStride || (accessors.length === 1 && attributeStride(accessors[0]));
        const mode = view.target === 34963 ? 'INDICES' : 'ATTRIBUTES';
        const supported = mode === 'INDICES' ? [2,4].includes(stride) : stride > 0 && stride % 4 === 0 && stride <= 256;
        if (accessors.length && supported && bytes.length % stride === 0) {
            const count = bytes.length / stride;
            const encoded = MeshoptEncoder.encodeGltfBuffer(bytes, count, stride, mode);
            if (encoded.length < bytes.length) {
                const offset = append(encoded);
                view.extensions ||= {};
                view.extensions.EXT_meshopt_compression = {
                    buffer:0, byteOffset:offset, byteLength:encoded.length, count, byteStride:stride, mode
                };
                view.buffer = 1;
                view.byteOffset = virtualSize;
                virtualSize += Math.ceil(bytes.length / 4) * 4;
                compressedViews++;
                continue;
            }
        }
        view.byteOffset = append(bytes);
    }
    if (textureCount) {
        for (const tex of gltf.textures) {
            tex.extensions ||= {};
            tex.extensions.KHR_texture_basisu = { source:tex.source };
            delete tex.source;
        }
        requireExtension('KHR_texture_basisu');
    }
    if (compressedViews) {
        gltf.buffers.push({byteLength:virtualSize, extensions:{EXT_meshopt_compression:{fallback:true}}});
        requireExtension('EXT_meshopt_compression');
    }
    gltf.buffers[0].byteLength = byteOffset;
    const json = Buffer.from(JSON.stringify(gltf));
    const padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 32);
    json.copy(padded);
    const header = Buffer.alloc(20);
    header.write('glTF'); header.writeUInt32LE(2,4); header.writeUInt32LE(28+padded.length+byteOffset,8);
    header.writeUInt32LE(padded.length,12); header.write('JSON',16);
    const binHeader = Buffer.alloc(8);
    binHeader.writeUInt32LE(byteOffset); binHeader.write('BIN\0',4);
    writeFileSync(destination + '.tmp', Buffer.concat([header,padded,binHeader,...chunks]));
    renameSync(destination + '.tmp',destination);
    console.log('Packed',compressedViews,'mesh buffers and',textureCount,'textures.',input.length,'->',header.readUInt32LE(8),'bytes.');
} finally {
    rmSync(work,{recursive:true,force:true});
}
