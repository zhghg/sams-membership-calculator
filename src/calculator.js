export const DAYS = [31,28,31,30,31,30,31,31,30,31,30,31];
export function rebate(spend, premium) {
  const amount = Math.max(0, Number(spend) || 0);
  return premium ? Math.min(amount * .02, 500) + Math.min(amount * .02, 200) : Math.min(amount * .01, 100);
}
export function outsideRebate(spend, premium) {
  return Math.min(Math.max(0,Number(spend)||0)*.002,premium?100:50);
}
function combinedRebate(spend,outside,premium) {
  return rebate(spend,premium)+outsideRebate(outside,premium);
}
export function calculate(months, ordinaryFee = 260, premiumFee = 680, outsideMonths = []) {
  const cost = premiumFee - ordinaryFee;
  const ordinary = months.map((x,i) => combinedRebate(x,outsideMonths[i],false));
  const premium = months.map((x,i) => combinedRebate(x,outsideMonths[i],true));
  const extra = premium.map((x, i) => x - ordinary[i]);
  let balance = -cost, elapsed = 0, breakEven = cost <= 0 ? 0 : null;
  const cumulative = extra.map((value, i) => {
    if (breakEven === null && value > 0 && balance + value >= -1e-8) {
      let low = 0, high = 1;
      for (let iteration = 0; iteration < 60; iteration++) {
        const fraction = (low + high) / 2;
        const partialSpend = months[i] * fraction, partialOutside = (outsideMonths[i]||0)*fraction;
        if (combinedRebate(partialSpend,partialOutside,true) - combinedRebate(partialSpend,partialOutside,false) >= -balance - 1e-8) high = fraction;
        else low = fraction;
      }
      breakEven = Math.ceil(elapsed + high * DAYS[i] - 1e-8);
    }
    balance += value;
    elapsed += DAYS[i];
    return balance;
  });
  const total = arr => arr.reduce((a,b) => a+b, 0);
  const samOrdinary=total(months.map(x=>rebate(x,false))),samPremium=total(months.map(x=>rebate(x,true)));
  const outsideOrdinary=total(months.map((_,i)=>outsideRebate(outsideMonths[i],false)));
  const outsidePremium=total(months.map((_,i)=>outsideRebate(outsideMonths[i],true)));
  return { daily: dailySavings(months, cost, outsideMonths), cost, ordinary: total(ordinary), premium: total(premium), extra: total(extra), net: balance, cumulative, breakEven, spend: total(months),samOrdinary,samPremium,outsideOrdinary,outsidePremium,outsideExtra:outsidePremium-outsideOrdinary };
}
export function monthlyThreshold(cost) {
  const target = cost / 12;
  if (target <= 0) return 0;
  if (target <= 300) return target / .03;
  if (target <= 600) return (target - 100) / .02;
  return null;
}
// Month-internal uniform spending; caps apply to actual accumulated spending.
export function dailySavings(months, cost, outsideMonths = []) {
  const points = [{ day: 0, value: -cost }];
  let elapsed = 0, balance = -cost;
  months.forEach((spend, index) => {
    for (let day = 1; day <= DAYS[index]; day++) {
      const partial = spend * day / DAYS[index],partialOutside=(outsideMonths[index]||0)*day/DAYS[index];
      const value = balance + combinedRebate(partial,partialOutside,true) - combinedRebate(partial,partialOutside,false);
      points.push({ day: elapsed + day, value: Math.abs(value) < 1e-8 ? 0 : value });
    }
    balance += combinedRebate(spend,outsideMonths[index],true) - combinedRebate(spend,outsideMonths[index],false);
    elapsed += DAYS[index];
  });
  return points;
}

// The renewal benefit is a next-term discount, not a cash refund.
export function renewalEstimate(baseRewards, otherBenefits = 0, enabled = true) {
  return enabled ? Math.max(0,420-baseRewards-Math.max(0,Number(otherBenefits)||0)) : 0;
}
export function withRenewal(result, months, enabled = true, otherBenefits = 0) {
  const baseRewards=months.reduce((sum,value)=>sum+Math.min(Math.max(0,Number(value)||0)*.02,500),0);
  const includedBenefits=enabled?Math.max(0,Number(otherBenefits)||0):0;
  const renewalCredit=renewalEstimate(baseRewards,includedBenefits,enabled);
  const combinedNet=result.net+renewalCredit+includedBenefits;
  // Spread annual renewal credit and other benefits evenly for the monthly projection.
  const monthlyRenewalCredit=renewalCredit/12,monthlyOtherBenefits=includedBenefits/12;
  const combinedCumulative=result.cumulative.map((value,i)=>value+(monthlyRenewalCredit+monthlyOtherBenefits)*(i+1));
  const paybackMonth=result.cost<=0?0:combinedCumulative.findIndex(value=>value>=-1e-8)+1;
  return {...result,renewalEnabled:enabled,baseRewards,renewalCredit,otherBenefits:includedBenefits,combinedNet,combinedCumulative,monthlyRenewalCredit,monthlyOtherBenefits,paybackMonth:result.cost<=0?0:paybackMonth||null};
}
export function annualSpendingThreshold(cost, outsideExtra = 0, renewalEnabled = false, otherBenefits = 0) {
  const other=renewalEnabled?Math.max(0,Number(otherBenefits)||0):0;
  const net=annual=>{
    const monthly=annual/12;
    const base=Math.min(monthly*.02,500)*12;
    return (rebate(monthly,true)-rebate(monthly,false))*12+outsideExtra+other+renewalEstimate(base,other,renewalEnabled)-cost;
  };
  if(net(0)>=-1e-8)return 0;
  if(net(300000)<-1e-8)return null;
  let low=0,high=300000;
  for(let i=0;i<60;i++){
    const mid=(low+high)/2;
    if(net(mid)>=-1e-8)high=mid;else low=mid;
  }
  return Math.ceil(high*100-1e-6)/100;
}
