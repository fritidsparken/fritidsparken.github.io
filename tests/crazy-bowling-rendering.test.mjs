import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
globalThis.window={THREE:require('../js/vendor/three.min.js')};
const {BowlingView}=await import('../games/crazy-bowling/world.mjs');
const {FinishPass}=await import('../games/crazy-bowling/post.mjs');
test('Medium and Low retain direct rendering; High falls back without float targets',()=>{
 const v={renderer:{shadowMap:{},capabilities:{isWebGL2:true},extensions:{has:()=>false}},materials:new Set(),host:{dataset:{}},resize(){},auto:true};
 for(const tier of ['high','medium','low']){BowlingView.prototype.setQuality.call(v,tier,true);assert.equal(v.post,null);assert.equal(v.host.dataset.quality,tier);}
});
test('Optional finish shader does not redeclare Three.js built-in uv attribute',()=>{
 const pass=new FinishPass({});assert.ok(pass.material.vertexShader.includes('varying vec2 vScreenUV;'));assert.doesNotMatch(pass.material.vertexShader,/varying\s+vec2\s+uv\b/);assert.ok(pass.material.fragmentShader.includes('varying vec2 vScreenUV;'));pass.dispose();
});
