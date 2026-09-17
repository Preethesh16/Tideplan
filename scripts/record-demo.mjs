import {chromium} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const scenes=JSON.parse(await readFile('scripts/demo-scenes.json','utf8'));
for(let i=0;i<scenes.length;i++)scenes[i].duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',`work/voice/${String(i).padStart(2,'0')}.mp3`],{encoding:'utf8'}).trim())+1.2;
await mkdir('work/recording',{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,recordVideo:{dir:'work/recording',size:{width:1440,height:1000}}});
const page=await context.newPage();
await page.goto(process.env.BASE_URL||'http://localhost:4180');
await page.getByRole('heading',{name:'See the person behind the payment.'}).waitFor();
await page.evaluate(()=>{const c=document.createElement('div');c.id='demo-pointer';c.style.cssText='position:fixed;width:18px;height:18px;border:2px solid #416f50;background:#cbdca577;border-radius:50%;pointer-events:none;z-index:99999;left:-50px;top:-50px;box-shadow:0 0 0 5px #cbdca522';document.body.append(c);document.addEventListener('mousemove',e=>{c.style.left=(e.clientX-9)+'px';c.style.top=(e.clientY-9)+'px';});});
const pause=ms=>page.waitForTimeout(ms);
async function click(locator){await locator.scrollIntoViewIfNeeded();const b=await locator.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:20});await pause(200);await locator.click();await pause(400);}
async function scroll(y){await page.evaluate(y=>window.scrollTo({top:y,behavior:'smooth'}),y);await pause(900);}
const nav=name=>click(page.getByRole('button',{name,exact:true}));
const person=name=>click(page.getByRole('button',{name:new RegExp(name)}));
await pause(1300);
// Keep the opening still briefly; no artificial zoom, stretch or slideshow.
const actions={
 intro:async()=>{await page.mouse.move(780,160,{steps:20});await pause(6000);await scroll(250);},
 asha:async()=>{await scroll(0);await pause(4500);await page.mouse.move(820,670,{steps:30});await pause(4500);await scroll(390);},
 profiles:async()=>{await scroll(0);await person('Meera Shah');await pause(5500);await person('Ravi Kumar');await pause(6000);},
 studio:async()=>{await person('Asha Devi');await nav('Plan studio');await pause(2000);await page.locator('#buffer').fill('3000');await pause(3000);await page.locator('#buffer').fill('2000');await page.locator('#shock').fill('10');await pause(3000);},
 failure:async()=>{await page.locator('#shock').fill('60');await pause(2200);await scroll(660);await pause(3000);await page.getByRole('button',{name:'Approve as demo lender'}).scrollIntoViewIfNeeded();},
 calendar:async()=>{await scroll(0);await page.locator('#shock').fill('5');await scroll(600);await pause(4500);await scroll(1020);await pause(2500);await click(page.getByRole('button',{name:/Download CSV/}));},
 consent:async()=>{await click(page.getByRole('button',{name:'Approve as demo lender'}));await pause(2200);await page.getByRole('checkbox').scrollIntoViewIfNeeded();await pause(3000);await click(page.getByRole('checkbox'));await pause(1800);await click(page.getByRole('button',{name:/Accept as demo borrower/}));},
 reserve:async()=>{await click(page.getByRole('button',{name:/Trust ledger/}));await pause(3500);await click(page.getByRole('button',{name:/Authorize ₹1,000/}));await pause(4500);},
 verify:async()=>{await click(page.getByRole('button',{name:'Verify chain',exact:true}));await scroll(460);await pause(2000);await click(page.getByText('Inspect recorded evidence').first());await pause(2800);await click(page.getByText('Inspect recorded evidence').first());await click(page.getByRole('button',{name:/Test a tampered copy/}));await pause(2500);},
 method:async()=>{await nav('How it works');await pause(5000);await scroll(500);await pause(4500);await nav('Overview');}
};
for(const scene of scenes){const start=Date.now();await actions[scene.id]();const elapsed=(Date.now()-start)/1000;if(elapsed>scene.duration)console.warn('Scene exceeded voice timing',scene.id,elapsed,scene.duration);await pause(Math.max(0,(scene.duration-elapsed)*1000));console.log('Recorded',scene.id,scene.duration.toFixed(1));}
const video=page.video();await context.close();await video.saveAs('work/recording/tideplan-screen.webm');await browser.close();
await writeFile('work/recording/scenes.json',JSON.stringify(scenes,null,2));
console.log('Recording complete.');
