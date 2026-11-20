import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { readFileSync, statSync, unlinkSync, readdirSync } from 'node:fs';

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const errors = [];
const external = [];
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => { if (!request.url().startsWith('http://localhost:8080') && !request.url().startsWith('data:') && !request.url().startsWith('blob:')) external.push(request.url()); });
await page.goto('http://localhost:8080');
await page.waitForFunction(() => window.__shotReady === true);
assert.equal(await page.locator('[data-row]').count(), 55);
assert.equal(await page.locator('#gradeProgress progress').count(), 4);
assert.equal(await page.locator('#kindProgress progress').count(), 5);

await page.locator('[data-check="2"]').check();
await page.locator('[data-open="15"]').click();
await page.locator('#counter').fill('57');
await page.locator('#counter').press('Tab');
await page.locator('#note').fill('North bridges first; save slot 04.');
await page.reload();
await page.waitForFunction(() => window.__shotReady);
assert.equal(await page.locator('[data-check="2"]').isChecked(), true);
await page.locator('[data-open="15"]').click();
assert.equal(await page.locator('#counter').inputValue(), '57');
assert.equal(await page.locator('#note').inputValue(), 'North bridges first; save slot 04.');

const downloadPromise = page.waitForEvent('download');
await page.locator('#export').click();
const download = await downloadPromise;
const backup = JSON.parse(readFileSync(await download.path(), 'utf8'));
assert.deepEqual(backup.earned, [2]);
assert.equal(backup.counters[15], 57);
assert.equal(backup.notes[15], 'North bridges first; save slot 04.');
page.on('dialog', dialog => dialog.accept());
await page.locator('#reset').click();
assert.equal(await page.locator('#earned').innerText(), '0');
await page.locator('#importFile').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
await page.waitForFunction(() => document.querySelector('#earned').textContent === '1');
assert.equal(await page.locator('#counter').inputValue(), '57');
await page.locator('#importFile').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"version":1,"earned":[999]}') });
await page.waitForFunction(() => document.querySelector('#toast').textContent.includes('unknown trophy'));
assert.equal(await page.locator('#earned').innerText(), '1');

for (const [kind, count] of [['story',18],['missable',1],['collectibles',4],['activities',32],['online',0],['all',55]]) {
  await page.locator(`[data-kind="${kind}"]`).click();
  assert.equal(await page.locator('[data-row]').count(), count, kind);
}
await page.locator('#search').fill('250');
assert.ok(await page.locator('[data-row]').count() > 0);
await page.locator('#search').fill('nothing-matches-this');
assert.equal(await page.locator('[data-row]').count(), 0);
await page.locator('#search').fill('');
for (const sort of ['grade','difficulty','time','name']) {
  await page.locator('#sort').selectOption(sort);
  assert.equal(await page.locator('[data-row]').count(),55);
}
await page.locator('#spoilers').check();
await page.locator('[data-open="3"]').click();
assert.ok((await page.locator('#detail h2').innerText()).startsWith('Hidden'));
assert.equal(await page.locator('#detail .steps').count(),0);
await page.locator('#search').fill('Paradise Lost');
assert.equal(await page.locator('[data-row]').count(),0,'secret names must not leak through search');
await page.locator('#search').fill('Just Like Paradise');
assert.equal(await page.locator('[data-row]').count(),1,'earned secrets remain visible');
await page.locator('#search').fill('');
await page.locator('[data-view="roadmap"]').click();
assert.equal(await page.locator('.stage-card').count(),6);
assert.equal(await page.locator('#roadmapView').innerText().then(text=>text.includes('The Cartel Heist')),false);

await context.setOffline(true);
await page.locator('[data-route="15"]').click();
await page.locator('[data-check="15"]').check();
assert.equal(await page.locator('#earned').innerText(),'2');
await page.locator('#note').fill('Works with the network disabled.');
assert.equal(external.length,0);
await context.setOffline(false);
await page.setViewportSize({ width:390,height:844 });
assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true,'mobile horizontal overflow');
assert.deepEqual(errors,[]);
console.log('PASS: load, 55 entries, grade/kind bars, persistence, counters, notes, export/import, invalid import, reset, filters, sorts, search, spoilers, roadmap, offline interactions and mobile layout.');
await context.close();

// Capture actual interaction states. No HTML injection, compositing, or image processing.
const shots = await browser.newContext({ viewport:{width:1280,height:800} });
const p = await shots.newPage();
await p.goto('http://localhost:8080');
await p.waitForFunction(()=>window.__shotReady);
for (const id of [2,3,4,5,7,8,9,10,11,12,13,28]) await p.locator(`[data-check="${id}"]`).check();
await p.locator('[data-open="15"]').click();
await p.locator('#counter').fill('174');
await p.locator('#counter').press('Tab');
await p.locator('#note').fill('Finish the bridge route, then continue to 300 for 100%.');
await p.locator('#toast').waitFor({state:'hidden',timeout:100}).catch(()=>{});
await p.waitForTimeout(3700);
await p.locator('[data-kind="all"]').click();
await p.locator('#sort').selectOption('grade');
await p.evaluate(()=>{document.activeElement.blur();document.querySelector('#trophyList').scrollTop=0;document.querySelector('#detail').scrollTop=0;window.scrollTo(0,0);});

// Only remove the old binary screenshots after all functional checks have passed.
for (const file of readdirSync('screenshots')) if (/\.(jpg|jpeg|png)$/i.test(file)) unlinkSync(`screenshots/${file}`);
await p.screenshot({path:'screenshots/1-ledger.jpg',type:'jpeg',quality:88});
await p.locator('#missableLink').click();
await p.locator('[data-reader]').click();
assert.ok(await p.locator('#detail .tip').isVisible());
assert.equal(await p.locator('#detail .sources a').count(),2);
assert.ok(await p.locator('#detail .sources').evaluate(node=>node.getBoundingClientRect().bottom < 800),'source credits fit in guide screenshot');
await p.screenshot({path:'screenshots/2-meditation.jpg',type:'jpeg',quality:88});
await p.locator('[data-reader]').click();
await p.locator('[data-view="roadmap"]').click();
assert.ok(await p.locator('.stage-card').last().evaluate(node=>node.getBoundingClientRect().bottom < 800),'six roadmap stages fit in screenshot');
await p.screenshot({path:'screenshots/3-roadmap.jpg',type:'jpeg',quality:88});
await p.locator('[data-view="ledger"]').click();
await p.locator('[data-kind="story"]').click();
await p.locator('#sort').selectOption('difficulty');
await p.locator('#spoilers').check();
await p.locator('#remaining').check();
await p.locator('#search').fill('hidden');
await p.locator('#nextUp').click();
await p.locator('[data-kind="story"]').click();
await p.locator('#remaining').check();
await p.locator('#search').fill('hidden');
await p.locator('#search').blur();
await p.screenshot({path:'screenshots/4-tracker.jpg',type:'jpeg',quality:88});
for (const file of readdirSync('screenshots')) assert.ok(statSync(`screenshots/${file}`).size <= 262144,`${file} exceeds screenshot cap`);
console.log('PASS: 4 fresh 1280×800 browser screenshots, each below 256 KiB. External requests:',external.length);
await browser.close();
