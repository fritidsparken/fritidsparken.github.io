import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {models} from '../origami/js/models.mjs';

// A newly enabled Blender view must never ship with missing steps or posters.
for(const model of models) {
  test(`${model.id}: both views have a complete, matching step sequence`,()=>{
    assert.ok(model.blender,'Every model offers Blender and the ordinary folding view');
    const dir=new URL(`../origami/${model.blender.base}`,import.meta.url);
    const manifest=JSON.parse(readFileSync(new URL('manifest.json',dir),'utf8'));
    assert.equal(manifest.steps,model.steps.length);
    assert.equal(manifest.model,model.name);
    assert.equal(manifest.fps,model.blender.fps);
    assert.equal(manifest.framesPerStep,model.blender.frames);
    for(let i=0;i<=model.steps.length;i++) {
      const suffix=String(i).padStart(2,'0');
      const poster=readFileSync(new URL(`state-${suffix}.webp`,dir));
      assert.equal(poster.toString('ascii',0,4),'RIFF');
      assert.equal(poster.toString('ascii',8,12),'WEBP');
      if(i)assert.equal(readFileSync(new URL(`step-${suffix}.mp4`,dir)).toString('ascii',4,8),'ftyp');
    }
    assert.ok(existsSync(new URL(`../origami/blender/${model.id}.blend`,import.meta.url)),'Editable Blender source exists');
  });
}
