// Run from repository root with a local static server on 8124 and Playwright installed.
const {chromium,webkit,devices}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const out=path.join(process.env.RUNNER_TEMP||require('node:os').tmpdir(),'blockvarlden-results');
fs.mkdirSync(out,{recursive:true});
const entry='';
const linuxRuns=[
 ['desktop',chromium,{viewport:{width:1100,height:680}}],
 ['touch-landscape',chromium,{...devices['Pixel 7'],viewport:{width:850,height:393}}],
 ['touch-portrait',webkit,{...devices['iPhone 13'],viewport:{width:390,height:844}}]
];
const native=process.env.BLOCKVARLDEN_PLATFORM;
const runs=native==='windows'?[['windows-chrome',chromium,{viewport:{width:1100,height:680}}]]:native==='macos'?[['macos-webkit',webkit,{viewport:{width:1100,height:680}}]]:linuxRuns;
async function test([name,type,device]){
 const browser=await type.launch(native==='windows'?{channel:'chrome'}:type===chromium?{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{});
 const page=await browser.newPage(device),errors=[];page.setDefaultTimeout(25000);
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&/shader|WebGL|THREE|Uncaught/i.test(m.text()))errors.push(m.text())});
 try{
  await page.goto('http://127.0.0.1:8124/games/blockvarlden/'+entry);
  await page.getByRole('button',{name:'Spela',exact:false}).first().click();
  const seedField=page.getByLabel('Världsfrö');
  await seedField.fill('Expedition');
  assert.equal(await seedField.evaluate(e=>e.dispatchEvent(new Event('selectstart',{bubbles:true,cancelable:true}))),true);
  const createButton=page.getByRole('button',{name:'Skapa värld'});
  assert.equal(await createButton.evaluate(e=>getComputedStyle(e).userSelect||getComputedStyle(e).webkitUserSelect),'none');
  assert.equal(await createButton.evaluate(e=>e.dispatchEvent(new Event('contextmenu',{bubbles:true,cancelable:true}))),false);
  await page.getByRole('button',{name:'Skapa värld'}).click();
  await page.locator('#stats').filter({hasText:'Kreativt'}).waitFor();
  await page.getByRole('button',{name:'Byt kameravy'}).click();
  await page.waitForTimeout(700);
  const fps=await page.evaluate(()=>new Promise(resolve=>{let start=performance.now(),frames=0;function step(now){frames++;if(now-start>=2500)resolve(+(frames*1000/(now-start)).toFixed(1));else requestAnimationFrame(step)}requestAnimationFrame(step)}));
  await page.screenshot({path:out+'/'+name+'.png'});
  if(device.hasTouch){const bounds=await page.locator('#stick,#actions,#bar').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1}));assert.ok(bounds.every(Boolean),'Touch controls within viewport')}
  await page.getByRole('button',{name:'Ryggsäck'}).click();
  const slots=page.locator('.pack-slots button');
  assert.equal(await slots.count(),9);await slots.nth(8).click();
  assert.ok(await page.locator('#panel').evaluate(e=>e.scrollHeight<=e.clientHeight+1),'Outer backpack stays fixed');
  assert.ok(await page.locator('.pack-list').evaluate(e=>e.scrollHeight>e.clientHeight),'Inventory scrolls independently');
  await page.getByPlaceholder('Sök block eller föremål').fill('Tegel');
  assert.ok(await page.locator('.item').count()>0);
  await page.locator('.item').first().click();
  assert.ok(await page.locator('#bar button').nth(8).evaluate(e=>e.classList.contains('active')));
  await page.getByRole('button',{name:'Pausa'}).click();
  await page.getByRole('button',{name:'Byt spelläge'}).click();
  await page.locator('#stats').filter({hasText:'Mat'}).waitFor();
  await page.getByRole('button',{name:'Ryggsäck'}).click();
  await page.getByRole('button',{name:'Tillverka'}).click();
  const recipe=page.getByRole('button',{name:'Skapa',exact:true}).and(page.locator(':enabled')).first();
  await recipe.click();await page.getByRole('button',{name:'Stäng'}).click();
  await page.getByRole('button',{name:'Pausa'}).click();await page.getByRole('button',{name:'Till startmenyn'}).click();
  await page.locator('#home').waitFor({state:'visible'});
  await page.reload();await page.getByRole('button',{name:'Fortsätt'}).click();
  await page.locator('#stats').filter({hasText:'Mat'}).waitFor();
  assert.deepEqual(errors,[]);console.log(JSON.stringify({name,fps,renderer:native?'hosted runner':'CI software graphics',flow:'pass'}));
 }catch(e){await page.screenshot({path:out+'/'+name+'-failure.png'}).catch(()=>{});console.error(name,errors,await page.locator('body').innerText().catch(()=>''));throw e}finally{await browser.close()}
}
async function waitForServer(){
 for(let i=0;i<45;i++){
  try{const r=await fetch('http://127.0.0.1:8124/games/blockvarlden/');if(r.ok)return}catch{}
  await new Promise(resolve=>setTimeout(resolve,1000));
 }
 throw Error('The static test server did not start on port 8124');
}
(async()=>{await waitForServer();let failed=false;for(const r of runs)try{await test(r)}catch(e){failed=true;console.error(e)}if(failed)process.exitCode=1})();
