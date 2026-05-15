/* ═══════════════════════════════════════════
   GodEyes – dashboard.js
   Overview Dashboard, Activity Feed, Scan History
   ═══════════════════════════════════════════ */
'use strict';

// ── Dashboard init ──
function initDashboard() {
  updateDashCards();
  drawRiskChart();
  drawActivityChart();
  startActivityFeed();
  renderScanHistory();
}

// ── Summary Cards ──
function updateDashCards() {
  const devices = (typeof ALL_DEVICES !== 'undefined') ? ALL_DEVICES : [];
  const high = devices.filter(d => d.risk === 'high').length;
  const med  = devices.filter(d => d.risk === 'medium').length;
  const low  = devices.filter(d => d.risk === 'low').length;
  const vpnStatus = (typeof vpnOn !== 'undefined' && vpnOn) ? 'Conectado' : 'Desconectado';
  const satCount = (typeof satVisible !== 'undefined') ? satVisible.filter(Boolean).length : 0;
  const lockCount = (typeof satLockSet !== 'undefined') ? satLockSet.size : 0;

  function set(id, val) { const e = document.getElementById(id); if (e) e.textContent = val; }
  set('dc-total', devices.length);
  set('dc-high', high);
  set('dc-vpn', vpnStatus);
  set('dc-sats', satCount);
  set('dc-locks', lockCount);
  set('dc-uptime', getUptime());
}

let dashStartTime = Date.now();
function getUptime() {
  const s = Math.floor((Date.now() - dashStartTime) / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return (h > 0 ? h + 'h ' : '') + m + 'm ' + sec + 's';
}

setInterval(() => {
  const e = document.getElementById('dc-uptime');
  if (e) e.textContent = getUptime();
}, 1000);

// ── Risk Bar Chart ──
function drawRiskChart() {
  const canvas = document.getElementById('risk-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const devices = (typeof ALL_DEVICES !== 'undefined') ? ALL_DEVICES : [];
  const cats = [
    { label: 'Alto',   count: devices.filter(d => d.risk === 'high').length,   color: '#ff3b5c' },
    { label: 'Médio',  count: devices.filter(d => d.risk === 'medium').length,  color: '#ff8a00' },
    { label: 'Baixo',  count: devices.filter(d => d.risk === 'low').length,     color: '#00f5a0' },
  ];
  const maxVal = Math.max(...cats.map(c => c.count), 1);
  const PAD = 28, barW = (W - PAD * 2 - 20) / cats.length;

  function frame(progress) {
    ctx.clearRect(0, 0, W, H);
    // Grid
    for (let i = 0; i <= 4; i++) {
      const y = PAD + (H - PAD * 2) * (1 - i / 4);
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; ctx.stroke();
    }
    cats.forEach((c, i) => {
      const bH = ((H - PAD * 2) * (c.count / maxVal)) * Math.min(progress, 1);
      const x = PAD + i * (barW + 10);
      const y = H - PAD - bH;
      // Glow
      ctx.shadowColor = c.color; ctx.shadowBlur = 10;
      // Bar
      const grad = ctx.createLinearGradient(0, y, 0, H - PAD);
      grad.addColorStop(0, c.color); grad.addColorStop(1, c.color + '33');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, barW, bH, [4, 4, 0, 0]) : ctx.rect(x, y, barW, bH);
      ctx.fill(); ctx.shadowBlur = 0;
      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '11px Inter,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(c.label, x + barW / 2, H - 8);
      ctx.fillStyle = c.color; ctx.font = 'bold 13px JetBrains Mono,monospace';
      ctx.fillText(c.count, x + barW / 2, y - 6);
    });
  }

  let prog = 0;
  const anim = setInterval(() => {
    prog += 0.07;
    frame(prog);
    if (prog >= 1) clearInterval(anim);
  }, 16);
}

// ── Activity Line Chart ──
const actHistory = [];
let actChartInterval = null;

function drawActivityChart() {
  const canvas = document.getElementById('act-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const POINTS = 20;

  if (!actHistory.length) {
    for (let i = 0; i < POINTS; i++) actHistory.push(Math.floor(Math.random() * 60 + 20));
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    const max = Math.max(...actHistory, 1);
    const step = W / (actHistory.length - 1);
    // Fill
    ctx.beginPath();
    ctx.moveTo(0, H);
    actHistory.forEach((v, i) => ctx.lineTo(i * step, H - (v / max) * (H - 16) - 8));
    ctx.lineTo(W, H); ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(0,217,245,0.25)'); grad.addColorStop(1, 'rgba(0,217,245,0)');
    ctx.fillStyle = grad; ctx.fill();
    // Line
    ctx.beginPath();
    actHistory.forEach((v, i) => {
      const x = i * step, y = H - (v / max) * (H - 16) - 8;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#00d9f5'; ctx.lineWidth = 2;
    ctx.shadowColor = '#00d9f5'; ctx.shadowBlur = 6; ctx.stroke(); ctx.shadowBlur = 0;
  }

  render();
  if (actChartInterval) clearInterval(actChartInterval);
  actChartInterval = setInterval(() => {
    actHistory.push(Math.floor(Math.random() * 80 + 10));
    if (actHistory.length > POINTS) actHistory.shift();
    render();
  }, 2000);
}

// ── Activity Feed ──
const FEED_EVENTS = [
  { icon:'🔴', msg:'Alto risco: CAMERA-HALL acessível sem autenticação', time:0,   cls:'high' },
  { icon:'🟡', msg:'Dispositivo novo detectado: 192.168.1.155',          time:3000, cls:'med'  },
  { icon:'🔒', msg:'VPN conectada ao servidor São Paulo (BR)',            time:6000, cls:'ok'   },
  { icon:'🛰', msg:'Lock orbital: ISS (NORAD #25544)',                   time:9000, cls:'ok'   },
  { icon:'⚡', msg:'Tentativa de brute-force em DESKTOP-ADMPC01',        time:12000,cls:'high' },
  { icon:'📡', msg:'SNMP v1 exposto: SWITCH-CORE-01 (comunidade public)',time:15000,cls:'med'  },
  { icon:'🔴', msg:'CVE-2021-36260 detectado: CAMERA-HALL',             time:18000,cls:'high' },
  { icon:'✅', msg:'Scan concluído: 8 dispositivos, 3 críticos',         time:21000,cls:'ok'   },
  { icon:'🌍', msg:'IP rotacionado: 45.141.152.18 (Moscou, RU)',        time:24000,cls:'ok'   },
  { icon:'⚠️', msg:'ARP Spoofing detectado na sub-rede 192.168.1.0/24', time:27000,cls:'high' },
];

function startActivityFeed() {
  const feed = document.getElementById('activity-feed');
  if (!feed) return;
  feed.innerHTML = '';

  FEED_EVENTS.forEach(ev => {
    setTimeout(() => {
      const line = document.createElement('div');
      line.className = 'feed-line feed-' + ev.cls;
      const ts = new Date().toTimeString().slice(0, 8);
      line.innerHTML = '<span class="feed-time">' + ts + '</span><span class="feed-icon">' + ev.icon + '</span><span>' + ev.msg + '</span>';
      feed.insertBefore(line, feed.firstChild);
      if (feed.children.length > 12) feed.lastChild.remove();
    }, ev.time + 500);
  });
}

// ── Scan History ──
function saveScanToHistory() {
  const devices = (typeof ALL_DEVICES !== 'undefined') ? ALL_DEVICES : [];
  const history = getScanHistory();
  const entry = {
    ts: Date.now(),
    total: devices.length,
    high: devices.filter(d => d.risk === 'high').length,
    med: devices.filter(d => d.risk === 'medium').length,
    low: devices.filter(d => d.risk === 'low').length,
    range: document.getElementById('scan-range') ? document.getElementById('scan-range').value : '192.168.1.0/24'
  };
  history.unshift(entry);
  if (history.length > 10) history.pop();
  try { localStorage.setItem('godeyes_scan_history', JSON.stringify(history)); } catch(e) {}
  renderScanHistory();
}

function getScanHistory() {
  try { return JSON.parse(localStorage.getItem('godeyes_scan_history') || '[]'); } catch(e) { return []; }
}

function renderScanHistory() {
  const el = document.getElementById('scan-history-list');
  if (!el) return;
  const history = getScanHistory();
  if (!history.length) { el.innerHTML = '<div class="dim" style="font-size:12px;padding:8px">Nenhum scan anterior.</div>'; return; }
  el.innerHTML = history.map(h => {
    const d = new Date(h.ts);
    const ts = d.toLocaleDateString('pt-BR') + ' ' + d.toTimeString().slice(0, 5);
    return '<div class="history-row"><span class="history-ts">' + ts + '</span><span class="history-range">' + h.range + '</span><span class="history-counts"><span style="color:#ff3b5c">' + h.high + '</span> · <span style="color:#ff8a00">' + h.med + '</span> · <span style="color:#00f5a0">' + h.low + '</span></span></div>';
  }).join('');
}

// ── JSON Export ──
function exportJSON() {
  const devices = (typeof ALL_DEVICES !== 'undefined') ? ALL_DEVICES : [];
  const report = {
    generated: new Date().toISOString(),
    tool: 'GodEyes v1.0',
    summary: { total: devices.length, high: devices.filter(d => d.risk === 'high').length, medium: devices.filter(d => d.risk === 'medium').length, low: devices.filter(d => d.risk === 'low').length },
    devices: devices.map(d => ({ hostname: d.hostname, ip: d.ip, mac: d.mac, os: d.os, vendor: d.vendor, risk: d.risk, ports: d.ports, vulns: d.vulns.map(v => v.t) }))
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'godeyes_report_' + Date.now() + '.json'; a.click();
}

// ── Print PDF ──
function exportPDF() {
  window.print();
}

// ── Scheduled Scan ──
let scheduleTimer = null;
function scheduleStartScan(minutes) {
  if (scheduleTimer) { clearTimeout(scheduleTimer); scheduleTimer = null; }
  if (!minutes) return;
  scheduleTimer = setTimeout(() => {
    if (typeof startScan === 'function') startScan();
    if (typeof showGlobalNotification === 'function') showGlobalNotification('🔭 Scan agendado iniciado!', 'ok');
  }, minutes * 60 * 1000);
  if (typeof showGlobalNotification === 'function') showGlobalNotification('⏱ Scan agendado em ' + minutes + ' min', 'ok');
}

// Patch startScan to save history
document.addEventListener('DOMContentLoaded', () => {
  const origBtn = document.getElementById('scan-btn');
  if (origBtn) {
    origBtn.addEventListener('click', () => {
      // Prioritize Real/Cloud Scan over Simulation
      if (typeof window.startRealScan === 'function') {
        window.startRealScan();
      } else if (typeof startScan === 'function') {
        startScan();
      }
      setTimeout(saveScanToHistory, 8000);
    });
  }
  setTimeout(initDashboard, 300);
});
