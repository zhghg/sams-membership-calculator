import React, {useState} from 'react';
import {CalendarDays} from 'lucide-react';
const money = n => n.toLocaleString('zh-CN',{maximumFractionDigits:2});
export default function CumulativeChart({result}) {
  const [selected,setSelected]=useState(null);
  const {daily,breakEven,cost,net}=result;
  const min=Math.min(0,...daily.map(p=>p.value)),max=Math.max(0,...daily.map(p=>p.value));
  const padding=Math.max(40,(max-min)*.16),bottom=min-padding,top=max+padding;
  const X=day=>66+day/365*676,Y=value=>242-(value-bottom)/(top-bottom)*214;
  const path=daily.map(p=>`${p.day?'L':'M'}${X(p.day)},${Y(p.value)}`).join(' ');
  const activeDay=selected??breakEven??365,point=daily[activeDay];
  const labelX=Math.max(68,Math.min(568,X(activeDay)-85));
  const ticks=[bottom,(bottom+top)/2,top];
  return <section className="panel chart-panel cumulative-panel" aria-labelledby="cumulative-title">
    <div className="chart-heading"><div><div className="section-title"><span className="step">03</span><h2 id="cumulative-title">升级费，哪天赚回来？</h2></div><p>从第 0 天付出会费差额开始，看看这一年累计比普通会员多省多少。</p></div><span className="legend"><i/>累计净收益</span></div>
    <div className="cumulative-summary"><span>起点 <b>¥ {money(-cost)}</b></span><span className={breakEven===null?'payback-badge pending':'payback-badge'}><CalendarDays size={13}/>{breakEven===null?'一年内未回本':breakEven===0?'第 0 天即持平':`第 ${breakEven} 天回本`}</span><span>年末 <b>¥ {money(net)}</b></span></div>
    <div className="graph-wrap"><span className="axis-title">相比普通会员累计多省 / 元</span>
    <svg className="graph cumulative-graph" viewBox="0 0 790 300" role="img" aria-label={`按天累计净收益曲线，${breakEven===null?'一年内未回本':`第${breakEven}天回本`}，年末净收益${money(net)}元`} onPointerMove={e=>{const rect=e.currentTarget.getBoundingClientRect();setSelected(Math.round(Math.max(0,Math.min(365,((e.clientX-rect.left)/rect.width*790-66)/676*365))));}} onPointerLeave={()=>setSelected(null)}>
      <defs><linearGradient id="cumulative-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#269578" stopOpacity=".18"/><stop offset="100%" stopColor="#269578" stopOpacity=".02"/></linearGradient></defs>
      {ticks.map((v,i)=><g key={i}><line x1="66" x2="742" y1={Y(v)} y2={Y(v)} stroke="#e6ece4" strokeDasharray="3 5"/><text x="54" y={Y(v)+4} textAnchor="end" className="tick">{Math.round(v).toLocaleString('zh-CN')}</text></g>)}
      <path d={`${path} L742,${Y(0)} L66,${Y(0)} Z`} fill="url(#cumulative-fill)"/>
      <line x1="66" x2="742" y1={Y(0)} y2={Y(0)} stroke="#9bb09d" strokeDasharray="5 4"/>
      <text x="54" y={Y(0)+4} textAnchor="end" className="break-label">0</text>
      <path d={path} stroke="#17846a" strokeWidth="3" fill="none" strokeLinejoin="round"/>
      {[0,60,120,180,240,300,365].map(day=><text key={day} x={X(day)} y="265" textAnchor="middle" className="tick">{day}</text>)}
      {breakEven!==null&&<g><line x1={X(breakEven)} x2={X(breakEven)} y1="25" y2="242" stroke="#c69a48" strokeDasharray="4 4"/><circle cx={X(breakEven)} cy={Y(daily[breakEven].value)} r="6" fill="#f6c977" stroke="white" strokeWidth="2"/><text x={Math.min(680,Math.max(120,X(breakEven)))} y="285" textAnchor="middle" className="payback-label">第 {breakEven} 天回本</text></g>}
      {selected!==null&&<line x1={X(activeDay)} x2={X(activeDay)} y1="25" y2="242" stroke="#9bb6a6" strokeDasharray="4 4"/>}
      <circle cx={X(activeDay)} cy={Y(point.value)} r="5" fill="#176c55" stroke="white" strokeWidth="2"/>
      <g transform={`translate(${labelX},${Math.max(6,Math.min(182,Y(point.value)-60))})`}><rect width="174" height="46" rx="8" fill="#203c33"/><text x="12" y="18" fill="#cbded5" fontSize="10">第 {activeDay} 天{activeDay===breakEven?' · 已收回升级会费':''}</text><text x="12" y="34" fill="white" fontSize="12" fontWeight="600">累计净收益 ¥{money(point.value)}</text></g>
      <text x="742" y="294" textAnchor="end" className="tick">天数</text>
    </svg></div>
    <label className="day-inspector"><span>查看第 {activeDay} 天</span><input aria-label="查看累计收益的天数" type="range" min="0" max="365" step="1" value={activeDay} onChange={e=>setSelected(+e.target.value)}/><button onClick={()=>setSelected(null)}>回到{breakEven===null?'年末':'回本日'}</button></label>
    <p className="cumulative-note">每个月内按均匀消费估算，分别计算返利封顶；无消费或返利封顶后曲线变平。调整逐月花费即可改变走势，未计回馈金到账等待时间。</p>
  </section>;
}
