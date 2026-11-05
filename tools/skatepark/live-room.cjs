const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
 try{
  const origin='https://fritidsparken.se';
  async function player(){
   const page=await browser.newPage({viewport:{width:640,height:400}});
   const errors=[],received=[];page.on('pageerror',e=>errors.push(e.message));
   page.on('websocket',ws=>ws.on('framereceived',f=>received.push(JSON.parse(f.payload))));
   await page.route(origin+'/**',async r=>{
    let file=new URL(r.request().url()).pathname;if(file.endsWith('/'))file+='index.html';
    const local=path.join(process.cwd(),decodeURIComponent(file));
    if(fs.existsSync(local))return r.fulfill({path:local});return r.abort();
   });
   await page.addInitScript(()=>localStorage.setItem('fp-skatepark-v1',JSON.stringify({quality:'låg'})));
   await page.goto(origin+'/games/skatepark/');
   return {page,errors,received};
  }
  const a=await player();await a.page.locator('[data-park="3"]').click();await a.page.getByText('Spela tillsammans',{exact:true}).click();await a.page.getByText('Skapa rum',{exact:true}).click();
  await a.page.locator('#room-code').waitFor({timeout:90000});
  const code=(await a.page.locator('#room-code').innerText()).split(' ')[1];
  const b=await player();await b.page.locator('[data-park="0"]').click();await b.page.getByText('Spela tillsammans',{exact:true}).click();await b.page.getByLabel('Rumskod').fill(code);await b.page.getByText('Gå med',{exact:true}).click();
  await b.page.locator('#room-code').filter({hasText:'2/8'}).waitFor({timeout:90000});
  await a.page.bringToFront();if(await a.page.locator('#dialog').isVisible())await a.page.locator('#back').click();
  await a.page.keyboard.down('w');
  for(let i=0;i<60;i++){const rides=b.received.filter(m=>m.kind==='ride');if(rides.length>1&&rides.some(m=>m.pose[0]!==rides[0].pose[0]||m.pose[2]!==rides[0].pose[2]))break;await a.page.waitForTimeout(500)}
  await a.page.keyboard.press('Space');await a.page.waitForTimeout(1400);await a.page.keyboard.up('w');
  const poses=b.received.filter(m=>m.kind==='ride').map(m=>m.pose);
  console.log('Received poses',poses.length,'errors',a.errors,b.errors,'host modal',await a.page.locator('#dialog').isVisible());
  assert.ok(new Set(poses.map(p=>p[0]+','+p[2])).size>1,'remote rider moved');
  assert.equal(b.received.find(m=>m.kind==='room').park,3);
  assert.deepEqual([...a.errors,...b.errors],[]);
  console.log('Both skaters joined the host park through the menu and shared movement.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
