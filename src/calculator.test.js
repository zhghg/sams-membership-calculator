import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rebate,calculate,monthlyThreshold,outsideRebate,withRenewal,annualSpendingThreshold} from './calculator.js';
test('rebate caps and ordinary baseline',()=>{
  for(const [spend,normal,plus] of [[0,0,0],[2000,20,80],[10000,100,400],[15000,100,500],[25000,100,700],[50000,100,700]]) {
    assert.equal(rebate(spend,false),normal); assert.equal(rebate(spend,true),plus);
  }
});
test('annual break even and daily interpolation',()=>{
  const r=calculate(Array(12).fill(2000));
  assert.equal(r.net,300); assert.equal(r.breakEven,212);
  assert.ok(Math.abs(calculate(Array(12).fill(14000/12)).net)<1e-8);
  assert.equal(calculate(Array(12).fill(0)).breakEven,null);
});
test('monthly distribution respects separate caps',()=>{
  assert.equal(calculate([30000,...Array(11).fill(0)]).net,180);
  assert.equal(calculate(Array(12).fill(2500)).net,480);
  assert.equal(calculate(Array(12).fill(0),260,260).breakEven,0);
});

test("break-even threshold respects caps and impossible cases",()=>{
  assert.ok(Math.abs(monthlyThreshold(420)-1166.6666667)<.0001);
  assert.equal(monthlyThreshold(4800),15000);
  assert.equal(monthlyThreshold(7200),25000);
  assert.equal(monthlyThreshold(7201),null);
});

test("daily break even applies caps to actual spending, not prorated monthly rebates",()=>{
  assert.equal(calculate([30000,...Array(11).fill(0)]).breakEven,17);
});

test('daily chart reconciles with monthly results and first break-even day',()=>{
  for (const months of [Array(12).fill(2000), Array(12).fill(0), [30000,...Array(11).fill(0)], [...Array(11).fill(0),30000], Array(12).fill(14000/12)]) {
    const result = calculate(months);
    assert.equal(result.daily.length, 366);
    assert.equal(result.daily[0].value,-420);
    assert.ok(Math.abs(result.daily[365].value-result.net)<1e-8);
    assert.equal(result.daily.find(p=>p.value>=0)?.day??null,result.breakEven);
    let end=0;
    [31,28,31,30,31,30,31,31,30,31,30,31].forEach((days,i)=>{
      end+=days; assert.ok(Math.abs(result.daily[end].value-result.cumulative[i])<1e-8);
    });
  }
});
test('zero spend months stay flat and capped months stop growing',()=>{
  const result=calculate([30000,...Array(11).fill(0)]);
  assert.equal(result.daily[26].value,180);
  assert.equal(result.daily[31].value,180);
  assert.equal(result.daily[365].value,180);
});

test('annual threshold depends on fees and reconciles with capped yearly rebates',()=>{
  for(const cost of [0,300,420,3600,4800,7200]) {
    const threshold=monthlyThreshold(cost);
    assert.ok(Math.abs(calculate(Array(12).fill(threshold),260,260+cost).net)<1e-7);
    if(cost>0) assert.ok(calculate(Array(12).fill(threshold-1),260,260+cost).net<0);
  }
});

test('outside spending has equal rates and different monthly caps',()=>{
  assert.equal(outsideRebate(10000,false),20);
  assert.equal(outsideRebate(10000,true),20);
  assert.equal(outsideRebate(25000,false),50);
  assert.equal(outsideRebate(25000,true),50);
  assert.equal(outsideRebate(30000,false),50);
  assert.equal(outsideRebate(30000,true),60);
  assert.equal(outsideRebate(100000,true),100);
});
test('external rebates affect upgrade benefit only above ordinary cap',()=>{
  const sam=Array(12).fill(2000);
  const base=calculate(sam),same=calculate(sam,260,680,Array(12).fill(25000));
  assert.equal(same.net,base.net);
  const more=calculate(sam,260,680,Array(12).fill(30000));
  assert.equal(more.net,420);
  assert.equal(more.outsideExtra,120);
  assert.equal(monthlyThreshold(420-more.outsideExtra)*12,10000);
  assert.ok(Math.abs(calculate(Array(12).fill(10000/12),260,680,Array(12).fill(30000)).net)<1e-8);
  assert.equal(more.cumulative[11],more.net);
  assert.equal(more.daily[365].value,more.net);
});
test('outside alone can cover fees without double-counting Sam spending',()=>{
  const r=calculate(Array(12).fill(0),260,680,Array(12).fill(50000));
  assert.equal(r.net,180); assert.equal(r.spend,0); assert.equal(r.outsideExtra,600);
  assert.equal(monthlyThreshold(420-r.outsideExtra),0);
  assert.equal(r.daily.find(p=>p.value>=0).day,r.breakEven);
});

test('renewal estimate adds only the unused guarantee and credits it at renewal',()=>{
  const months=Array(12).fill(10000/12),result=withRenewal(calculate(months),months,true);
  assert.ok(Math.abs(result.baseRewards-200)<1e-8);
  assert.ok(Math.abs(result.renewalCredit-220)<1e-8);
  assert.ok(Math.abs(result.net+120)<1e-8);
  assert.ok(Math.abs(result.combinedNet-100)<1e-8);
  assert.deepEqual(result.combinedCumulative.slice(0,11),result.cumulative.slice(0,11));
  assert.equal(result.paybackMonth,12);
});
test('disabled guarantee preserves shopping-only loss',()=>{
  const months=Array(12).fill(10000/12),result=withRenewal(calculate(months),months,false,100);
  assert.equal(result.renewalCredit,0); assert.equal(result.otherBenefits,0);
  assert.equal(result.combinedNet,result.net); assert.equal(result.paybackMonth,null);
});
test('renewal coverage handles no spending, used benefits and member-fee changes',()=>{
  const months=Array(12).fill(0),result=withRenewal(calculate(months),months,true,100);
  assert.equal(result.renewalCredit,320); assert.equal(result.combinedNet,0);
  assert.equal(result.paybackMonth,12);
  assert.equal(withRenewal(calculate(months),months,true,500).renewalCredit,0);
  assert.equal(annualSpendingThreshold(420,0,true),0);
  assert.equal(annualSpendingThreshold(420,0,false),14000);
  assert.equal(annualSpendingThreshold(600,0,true),18000);
  assert.equal(annualSpendingThreshold(10000,0,true),null);
});
test('guarantee uses only base Sam rewards, excludes bank and outside rebates',()=>{
  const months=Array(12).fill(2000),outside=Array(12).fill(30000);
  const result=withRenewal(calculate(months,260,680,outside),months,true);
  assert.equal(result.baseRewards,480); assert.equal(result.renewalCredit,0);
  assert.equal(result.combinedNet,420); assert.equal(result.paybackMonth,6);
});
