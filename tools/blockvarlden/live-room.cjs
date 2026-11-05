const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const origin='https://fritidsparken.se';
const host='fritidsparken-github-io.th8kdfmyr7.workers.dev';
async function run(){
 const response=await fetch('https://'+host+'/create',{headers:{Origin:origin}});
 console.log('Worker HTTP probe',response.status,(await response.text()).slice(0,250));
 assert.equal(response.status,426,'Blockvärldens server ska begära WebSocket');
 const browser=await chromium.launch({channel:'chrome'});
 try{
  async function open(code){
   const page=await browser.newPage();
   await page.route(origin+'/rumstest',r=>r.fulfill({contentType:'text/html',body:'Blockvärldens anslutningstest'}));
   await page.goto(origin+'/rumstest');
   await page.evaluate(({host,code})=>{
    window.events=[];
    window.ws=new WebSocket('wss://'+host+'/'+(code||'create'));
    ws.onmessage=e=>{const msg=JSON.parse(e.data);events.push(msg);if(msg.type==='welcome')ws.send(JSON.stringify({type:'join',owner:msg.owner}))};
   },{host,code});
   await page.waitForFunction(()=>events.some(m=>m.type==='joined'));
   return page;
  }
  const a=await open(),code=await a.evaluate(()=>events.find(m=>m.type==='welcome').code);
  const b=await open(code),cell=[2,38,2,4];
  await a.evaluate(cell=>ws.send(JSON.stringify({type:'edit',cell})),cell);
  await b.waitForFunction(cell=>events.some(m=>m.type==='edit'&&String(m.cell)===String(cell)),cell);
  await a.close();await b.close();
  const c=await open(code);
  await c.waitForFunction(cell=>events.some(m=>m.cells?.some(v=>String(v)===String(cell))),cell);
  console.log('Two browser sessions shared a block; the saved block survived reconnection.');
 }finally{await browser.close()}
}
run().catch(e=>{console.error(e);process.exitCode=1});
