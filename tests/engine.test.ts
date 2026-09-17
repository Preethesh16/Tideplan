import {test} from 'node:test';
import assert from 'node:assert/strict';
import {borrowers} from '../src/data';
import {analyze,buildPlans,validateHistory,sum} from '../src/engine';
import {append,verify,digest} from '../src/trust';

test('seasonality is not mistaken for a sustained decline',()=>{
 assert.equal(analyze(borrowers[0],2000,0).signal,'Seasonal pattern');
 assert.equal(analyze(borrowers[2],2000,0).signal,'Sustained decline');
});
test('aligned schedule preserves obligation and protects monthly buffer',()=>{
 const b=borrowers[0],a=analyze(b,2000,0),[fixed,p]=buildPlans(b,a,2000);
 assert.equal(p.total,b.principal+b.interest);assert.equal(p.unmet,0);
 assert.equal(p.stress,0);assert.ok(fixed.stress>p.stress);
 p.payments.forEach((v,i)=>{assert.ok(Number.isInteger(v));assert.ok(v>=0&&v<=a.forecast[i].capacity);});
});
test('unaffordable shock reports unmet debt rather than inventing capacity',()=>{
 const b=borrowers[0],a=analyze(b,2000,60),[,p]=buildPlans(b,a,2000);
 assert.equal(p.feasible,false);assert.ok(p.unmet>0);assert.equal(p.total+p.unmet,b.principal);
});
test('more buffer or more shock cannot increase safe capacity',()=>{
 for(const b of borrowers){const base=analyze(b,2000,0);for(const a of [analyze(b,3000,0),analyze(b,2000,20)])a.forecast.forEach((f,i)=>assert.ok(f.capacity<=base.forecast[i].capacity));}
});
test('integer allocations are bounded across every demo scenario',()=>{
 for(const b of borrowers)for(let buffer=0;buffer<=6000;buffer+=500)for(let shock=0;shock<=60;shock+=5){
  const a=analyze(b,buffer,shock),[,p]=buildPlans(b,a,buffer);
  assert.equal(p.total,Math.min(b.principal,sum(a.forecast.map(f=>f.capacity))));
  p.payments.forEach((v,i)=>assert.ok(Number.isInteger(v)&&v>=0&&v<=a.forecast[i].capacity));
 }
});
test('CSV history rejects gaps, duplicates, negatives and incomplete history',()=>{
 const h=borrowers[0].history;assert.doesNotThrow(()=>validateHistory(h));
 assert.throws(()=>validateHistory(h.slice(0,5)));
 assert.throws(()=>validateHistory([...h.slice(0,23),h[22]]));
 assert.throws(()=>validateHistory(h.filter((_,i)=>i!==5)));
 assert.throws(()=>validateHistory(h.map((r,i)=>i? r:{...r,income:-1})));
 assert.throws(()=>validateHistory(h.map((r,i)=>i? r:{...r,income:NaN})));
});
test('canonical hashes are independent of object key order',async()=>assert.equal(await digest({b:2,a:1}),await digest({a:1,b:2})));
test('audit verifies originals and rejects edited, reordered and deleted events',async()=>{
 const a=await append([],'approved','lender',{total:18000});
 const events=await append(a,'consent','borrower',{accepted:true});assert.equal(await verify(events),true);
 const edited=structuredClone(events);edited[0].payload.total=1;assert.equal(await verify(edited),false);
 assert.equal(await verify([...events].reverse()),false);assert.equal(await verify(events.slice(1)),false);
});
