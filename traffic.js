/* GodEyes – traffic.js — Traffic Analyzer + Protocol Breakdown */
'use strict';

const HISTORY_LEN = 60;
const upHistory   = new Array(HISTORY_LEN).fill(0);
const downHistory = new Array(HISTORY_LEN).fill(0);
const protoMap = { TCP:0, UDP:0, HTTP:0, HTTPS:0, DNS:0, ARP:0, ICMP:0 };
let totalUp = 0, totalDown = 0, totalPkts = 0;
let trafRunning = false, trafInterval = null;

const TRAF_DEVS = [
  { ip:'192.168.1.10', host:'DESKTOP-ADMPC01', up:0, down:0, proto:'TCP' },
  { ip:'192.168.1.20', host:'SRV-WEB-PROD',    up:0, down:0, proto:'HTTPS' },
  { ip:'192.168.1.35', host:'PRINTER-FLOOR2',  up:0, down:0, proto:'UDP' },
  { ip:'192.168.1.60', host:'NAS-STORAGE-01',  up:0, down:0, proto:'TCP' },
  { ip:'192.168.1.80', host:'CAMERA-HALL',     up:0, down:0, proto:'HTTP' },
  { ip:'192.168.1.1',  host:'SWITCH-CORE-01',  up:0, down:0, proto:'ARP' },
];

function tickTraffic() {
  const protos = ['TCP','UDP','HTTPS','HTTP','DNS','ARP','ICMP'];
  TRAF_DEVS.forEach(d => {
    const up_b   = Math.floor(Math.random() * 40000 + 500);
    const down_b = Math.floor(Math.random() * 120000 + 1000);
    const pkts   = Math.floor(Math.random() * 80 + 5);
    d.up += up_b; d.down += down_b;
    totalUp += up_b; totalDown += down_b; totalPkts += pkts;
    d.proto = protos[Math.floor(Math.random() * protos.length)];
    protoMap[d.proto] = (protoMap[d.proto] || 0) + pkts;
  });
  upHistory.push(totalUp / 10000); upHistory.shift();
  downHistory.push(totalDown / 10000); downHistory.shift();
  renderTrafficUI();
}

function startTraffic() {
  if (trafRunning) return;
  trafRunning = true;
  trafInterval = setInterval(tickTraffic, 800);
}

function fmtBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
  return (b/1048576).toFixed(2) + ' MB';
}

function drawTrafficChart() {
  const c = document.getElementById('traffic-canvas'); if (!c) return;
  const ctx = c.getContext('2d'), W = c.width, H = c.height;
  ctx.clearRect(0,0,W,H);
  const max = Math.max(...upHistory, ...downHistory, 1);
  const step = W / (HISTORY_LEN - 1);
  [[downHistory,'#00d9f5','▼ Down'],[upHistory,'#00f5a0','▲ Up']].forEach(([data, color, lbl]) => {
    ctx.beginPath();
    data.forEach((v,i) => { const x=i*step, y=H-20-(v/max)*(H-30); i?ctx.lineTo(x,y):ctx.moveTo(x,y); });
    ctx.strokeStyle=color; ctx.lineWidth=2; ctx.shadowColor=color; ctx.shadowBlur=5; ctx.stroke(); ctx.shadowBlur=0;
    ctx.lineTo(W,H-20); ctx.lineTo(0,H-20); ctx.closePath();
    ctx.fillStyle=color+'18'; ctx.fill(); ctx.beginPath();
  });
  for(let i=0;i<=3;i++){ctx.beginPath();ctx.moveTo(0,10+(H-30)/3*i);ctx.lineTo(W,10+(H-30)/3*i);ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=1;ctx.stroke();}
  ctx.font='10px Inter'; ctx.textAlign='left'; ctx.fillStyle='#00d9f5'; ctx.fillText('▼ Download',8,16);
  ctx.fillStyle='#00f5a0'; ctx.fillText('▲ Upload',90,16);
}

function drawProtoChart() {
  const c = document.getElementById('proto-canvas'); if (!c) return;
  const ctx = c.getContext('2d'), W=c.width, H=c.height;
  ctx.clearRect(0,0,W,H);
  const entries = Object.entries(protoMap).filter(([,v])=>v>0);
  if (!entries.length) { ctx.fillStyle='rgba(255,255,255,.2)';ctx.font='11px Inter';ctx.textAlign='center';ctx.fillText('Aguardando...',W/2,H/2);return; }
  const total = entries.reduce((s,[,v])=>s+v,0);
  const cols = ['#00f5a0','#00d9f5','#ff3b5c','#ff8a00','#ffd000','#a78bfa','#f472b6'];
  const CX=W/2, CY=H/2-10, R=Math.min(W,H)/2-20, IN=R*0.55;
  let ang=-Math.PI/2;
  entries.forEach(([,val],i)=>{
    const sl=(val/total)*Math.PI*2;
    ctx.beginPath();ctx.moveTo(CX,CY);ctx.arc(CX,CY,R,ang,ang+sl);ctx.closePath();
    ctx.fillStyle=cols[i%cols.length];ctx.shadowColor=cols[i%cols.length];ctx.shadowBlur=6;ctx.fill();ctx.shadowBlur=0;
    ang+=sl;
  });
  ctx.beginPath();ctx.arc(CX,CY,IN,0,Math.PI*2);ctx.fillStyle='#0b1121';ctx.fill();
  ctx.fillStyle='#e2e8f0';ctx.font='bold 11px JetBrains Mono';ctx.textAlign='center';ctx.fillText(total.toLocaleString(),CX,CY+4);
  ctx.fillStyle='#64748b';ctx.font='9px Inter';ctx.fillText('pkts',CX,CY+15);
  let ly=H-entries.length*13+4;
  entries.forEach(([lbl,val],i)=>{
    ctx.fillStyle=cols[i%cols.length];ctx.fillRect(4,ly-9,9,9);
    ctx.fillStyle='#94a3b8';ctx.font='10px Inter';ctx.textAlign='left';
    ctx.fillText(lbl+' '+Math.round(val/total*100)+'%',16,ly);ly+=13;
  });
}

function renderTrafficUI() {
  const e = id=>document.getElementById(id);
  if(e('traf-up'))   e('traf-up').textContent   = fmtBytes(totalUp);
  if(e('traf-down')) e('traf-down').textContent = fmtBytes(totalDown);
  if(e('traf-pkts')) e('traf-pkts').textContent = totalPkts.toLocaleString();
  drawTrafficChart(); drawProtoChart();
  const tl = document.getElementById('top-talkers-list');
  if (tl) {
    const sorted = [...TRAF_DEVS].sort((a,b)=>(b.up+b.down)-(a.up+a.down)).slice(0,5);
    const mx = sorted[0]?sorted[0].up+sorted[0].down:1;
    tl.innerHTML = sorted.map(d=>{const t=d.up+d.down,p=Math.round(t/mx*100);return '<div class="talker-row"><div class="talker-info"><span class="talker-host">'+d.host+'</span><span class="talker-ip">'+d.ip+'</span></div><div class="talker-bar-wrap"><div class="talker-bar" style="width:'+p+'%"></div></div><span class="talker-bytes">'+fmtBytes(t)+'</span></div>';}).join('');
  }
  const tb = document.getElementById('traffic-table-body');
  if (tb) {
    tb.innerHTML = TRAF_DEVS.map(d=>'<tr><td>'+d.host+'</td><td class="mono">'+d.ip+'</td><td class="traf-proto">'+d.proto+'</td><td class="traf-down">'+fmtBytes(Math.floor(Math.random()*50000+1000))+'/s</td><td class="traf-up">'+fmtBytes(Math.floor(Math.random()*20000+100))+'/s</td><td class="mono">'+fmtBytes(d.down+d.up)+'</td></tr>').join('');
  }
}
