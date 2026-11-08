import React,{useState} from 'react';
const fmt=n=>(Math.abs(n)<1e-8?0:n).toLocaleString('zh-CN',{maximumFractionDigits:2});
export default function MonthlyChart({result}){
  const [selected,setSelected]=useState(null);
  const remaining=[-result.cost,...result.combinedCumulative];
  const first=result.paybackMonth??-1;
  const repaid=first>=0;
  const month=selected??(repaid?first:12);
  const paybackLabel=repaid?first===0?'会费已持平':`第 ${first} 个月回本${result.renewalEnabled?'（分摊口径）':''}`:'一年内未回本';
  const x=m=>66+m/12*676;
  const lower=Math.min(0,...remaining),upper=Math.max(0,...remaining),pad=Math.max(30,(upper-lower)*.15);
  const y=v=>225-(v-(lower-pad))/(upper-lower+pad*2)*195;
  const line=(arr,X,Y)=>arr.map((v,i)=>`${i?'L':'M'}${X(i)},${Y(v)}`).join(' ');
  const choose=e=>{const r=e.currentTarget.getBoundingClientRect();setSelected(Math.max(1,Math.min(12,Math.round(((e.clientX-r.left)/r.width*790-66)/676*12))));};
  return <div className="panel monthly-panel">
    <div className="balance-heading"><div className="section-title"><span className="step">02</span><h2>升级后，逐月净赚多少？</h2></div><p>从扣除升级会费差额开始，逐月累加新增回馈金；到 0 即回本。{result.renewalEnabled?'续费补差与其他已用权益均摊至12个月，按分摊后的综合收益测算回本。':'超过 0 就是净赚。'}</p></div>
    <div className="remaining-status"><span>初始净赚 <b>¥{fmt(-result.cost)}</b></span><b>{repaid?paybackLabel:`一年后仍差 ¥${fmt(-result.combinedNet)}`}</b><span>{result.renewalEnabled?'综合收益':'一年净收益'} <b>¥{fmt(result.combinedNet)}</b></span></div>
    <svg className="graph" viewBox="0 0 790 275" role="img" aria-label={`逐月累计净赚金额折线图，${paybackLabel}`} onPointerMove={choose} onPointerLeave={()=>setSelected(null)}>
      <defs><linearGradient id="balance-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c8a96b" stopOpacity=".13"/><stop offset="1" stopColor="#17846a" stopOpacity=".1"/></linearGradient></defs>
      <text x="10" y="16" className="tick">{result.renewalEnabled?'累计综合收益 / 元':'累计净赚 / 元'}</text>
      {[lower-pad,upper+pad].map((v,i)=><g key={i}><line x1="66" x2="742" y1={y(v)} y2={y(v)} stroke="#e7ece3" strokeDasharray="3 5"/><text x="54" y={y(v)+4} textAnchor="end" className="tick">{fmt(Math.round(v))}</text></g>)}
      <path d={`${line(remaining,x,y)} L742,${y(0)} L66,${y(0)} Z`} fill="url(#balance-area)"/>
      <line x1="66" x2="742" y1={y(0)} y2={y(0)} stroke="#adbb9f" strokeDasharray="5 4"/><text x="54" y={y(0)+4} textAnchor="end" className="break-label">0</text>
      <path d={line(remaining,x,y)} stroke="#17846a" strokeWidth="3" fill="none"/>
      {remaining.map((v,i)=><g key={i}><circle cx={x(i)} cy={y(v)} r={i===month?5:3} fill={v<0?'#c3a162':'#17846a'}/><text x={x(i)} y="247" textAnchor="middle" className="tick">{i===0?'升级时':`${i}月`}</text></g>)}
      {repaid&&<g><line x1={x(first)} x2={x(first)} y1="28" y2="225" stroke="#b89045" strokeDasharray="4 4"/><text x={Math.min(683,Math.max(118,x(first)))} y="268" textAnchor="middle" className="payback-label">{first===0?'会费已持平':`第 ${first} 个月回本`}</text></g>}
      <g transform={`translate(${Math.max(72,Math.min(562,x(month)-90))},${Math.max(22,Math.min(170,y(remaining[month])-57))})`}><rect width="180" height="45" rx="7" fill="#203c33"/><text x="12" y="18" fill="#d1dfd0" fontSize="10">{month===0?'升级时':`第 ${month} 月末${result.renewalEnabled?'（含分摊补差）':''}`}</text><text x="12" y="34" fill="white" fontSize="12">{remaining[month]<-1e-8?'距回本还差':result.renewalEnabled?'综合收益':'累计净赚'} ¥{fmt(Math.abs(remaining[month]))}</text></g>
    </svg>
    <p className="cumulative-note">累计净赚 ＝ 截至当月累计新增回馈金 − 升级会费差额。{result.renewalEnabled?'预计续费抵扣与其他已用权益按12个月均摊，逐月计入综合收益；实际抵扣仍在续费时兑现，图示回本不代表当月收到现金。':'负数表示尚未回本，正数表示已经净赚。'}调整消费后曲线同步更新。</p>
  </div>
}
