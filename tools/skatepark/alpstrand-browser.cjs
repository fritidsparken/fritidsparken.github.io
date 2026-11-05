// Run with Playwright installed and a local or published game base URL.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME || undefined,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl'],
  });
  const output = process.env.RESULTS || 'skate-qa';
  fs.mkdirSync(output, { recursive: true });
  const base = process.env.SKATE_URL || 'http://127.0.0.1:8173/games/skatepark/';
  try {
    for (const [park, touch] of [[5,false],[5,true],[4,false],[3,false]]) {
      const page = await browser.newPage({ viewport: touch ? {width:812,height:375} : {width:1024,height:576}, hasTouch: touch, isMobile:touch });
      const errors = [], resources = [], label = park + (touch ? '-touch' : '-keys');
      page.on('pageerror', e => errors.push(String(e)));
      page.on('console', m => { if (m.type()==='error') console.error(label,m.text()); });
      page.on('response', r => { if (r.status() >=400) errors.push(r.status()+' '+r.url()); else resources.push(r.url()); });
      await page.goto(base, {waitUntil:'domcontentloaded'});
      await page.locator('#parks button').first().waitFor();
      assert.equal(await page.locator('#parks button').first().getAttribute('data-park'),'5');
      await page.locator('[data-park="'+park+'"]').click();
      if(park===5 && !touch) await page.screenshot({path:output+'/menu.png'});
      await page.locator('#play').click();
      await page.locator('#ride').waitFor({state:'visible',timeout:90000});
      if (park===5) assert(resources.some(u=>u.includes('/models/alpstrand.glb')));
      await page.waitForFunction(()=>document.querySelector('#game').width>0);
      await page.screenshot({path:output+'/'+label+'-start.png'});
      if (touch) {
        const stick=page.locator('#jumpStick');
        await stick.tap();
        assert(await page.locator('#touch').isVisible());
      } else {
        await page.keyboard.down('w');
        await page.waitForTimeout(1600);
        await page.keyboard.press('Space');
        await page.keyboard.press('z');
        await page.waitForTimeout(700);
        await page.keyboard.up('w');
      }
      await page.screenshot({path:output+'/'+label+'-ride.png'});
      await page.locator('#pause').click();
      assert(await page.locator('#dialog').isVisible());
      const issues=errors.filter(x=>!x.includes('favicon.ico'));
      assert.deepEqual(issues,[]);
      console.log('PASS',label,resources.length,'HTTP resources');
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
