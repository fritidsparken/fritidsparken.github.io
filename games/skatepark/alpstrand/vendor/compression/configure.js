import { MeshoptDecoder } from './meshopt_decoder.module.js';
import { KTX2Loader } from './KTX2Loader.js';

const texturesByRenderer = new WeakMap();

export function configureAlpstrandLoader(loader, renderer) {
    let textures = texturesByRenderer.get(renderer);
    if (!textures) {
        textures = new KTX2Loader(loader.manager)
            .setTranscoderPath(new URL('./', import.meta.url).href)
            .setWorkerLimit(2)
            .detectSupport(renderer);
        texturesByRenderer.set(renderer, textures);
    }
    return loader.setKTX2Loader(textures).setMeshoptDecoder(MeshoptDecoder);
}
