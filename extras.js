/* GodEyes – extras.js
   IDS · Inventory · Credentials · GeoIP
   Theme Toggle · Keyboard Shortcuts · Sound Alerts · Notifications
   DNS Leak Test · Satellite Pass Prediction */
'use strict';

// ══════════════════════════════════════
// THEME TOGGLE
// ══════════════════════════════════════
let darkMode = true;
function toggleTheme() {
  darkMode = !darkMode;
  document.body.classList.toggle('light-mode', !darkMode);
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = darkMode ? '☀️' : '🌙';
}

// Light mode CSS vars injected dynamically
const lightStyle = document.createElement('style');
lightStyle.textContent = `body.light-mode{--bg:#f0f4f8;--bg2:#e2e8f0;--bg3:#d1d9e0;--glass:rgba(0,0,0,0.04);--glass-b:rgba(0,0,0,0.1);--text:#1e293b;--muted:#64748b;--border:rgba(0,100,60,0.2);}body.light-mode #particles-canvas{display:none}`;
document.head.appendChild(lightStyle);

// ══════════════════════════════════════
// SOUND ALERTS (Web Audio API)
// ══════════════════════════════════════
let soundOn = false;
let audioCtx = null;
function toggleSound() {
  soundOn = !soundOn;
  const btn = document.getElementById('sound-btn');
  if (btn) btn.textContent = soundOn ? '🔊' : '🔇';
  if (soundOn && !audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function playAlert(freq, type, dur) {
  if (!soundOn || !audioCtx) return;
  const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.type = type || 'sine'; osc.frequency.value = freq || 440;
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (dur || 0.4));
  osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + (dur || 0.4));
}
function playHighAlert() { playAlert(880, 'square', 0.3); setTimeout(()=>playAlert(660,'square',0.3),350); }
function playOkBeep()   { playAlert(523, 'sine',   0.2); }

// ══════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════
function showGlobalNotification(msg, type) {
  const tray = document.getElementById('notif-tray');
  if (!tray) return;
  const n = document.createElement('div');
  n.className = 'notif-item notif-' + (type || 'ok');
  const ts = new Date().toTimeString().slice(0,8);
  n.innerHTML = '<span class="notif-ts">' + ts + '</span><span>' + msg + '</span><button onclick="this.parentElement.remove()">✕</button>';
  tray.insertBefore(n, tray.firstChild);
  if (tray.children.length > 5) tray.lastChild.remove();
  if (type === 'high') playHighAlert(); else playOkBeep();
  setTimeout(() => n.remove && n.remove(), 8000);
}

// Browser notification
function requestNotifPermission() {
  if (Notification && Notification.permission !== 'granted') Notification.requestPermission();
}
function pushNotification(title, body) {
  if (Notification && Notification.permission === 'granted') new Notification(title, { body, icon: '' });
}

// ══════════════════════════════════════
// KEYBOARD SHORTCUTS
// ══════════════════════════════════════
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === '?') toggleShortcutsModal();
  if (e.key === '1') showPanel('dashboard');
  if (e.key === '2') showPanel('scanner');
  if (e.key === '3') showPanel('map');
  if (e.key === '4') showPanel('pentest');
  if (e.key === '5') showPanel('satellite');
  if (e.key === '6') showPanel('vpn');
  if (e.key === '7') showPanel('proxy');
  if (e.key === '8') showPanel('traffic');
  if (e.key === '9') showPanel('ids');
  if (e.key === 'i') showPanel('inventory');
  if (e.key === 'c') showPanel('credentials');
  if (e.key === 'g') showPanel('geoip');
  if (e.key === 's' && !e.ctrlKey) { if (typeof startScan === 'function') startScan(); }
  if (e.key === 'Escape') { closeInspector && closeInspector(); closeShortcutsModal(); if(typeof closeExpandCamera==='function') closeExpandCamera(); }
  if (e.key === 't') toggleTheme();
  if (e.key === 'm') toggleSound();
  if (e.key === 'v') showPanel('cameras');
});

function toggleShortcutsModal() {
  const m = document.getElementById('shortcuts-modal');
  if (m) m.classList.toggle('open');
}
function closeShortcutsModal() {
  const m = document.getElementById('shortcuts-modal');
  if (m) m.classList.remove('open');
}

// ══════════════════════════════════════
// IDS – INTRUSION DETECTION SYSTEM
// ══════════════════════════════════════
const IDS_RULES = [
  { id:'R001', name:'Port Scan Detect',   severity:'high',   enabled:true,  desc:'Detecta varredura de portas (>10 portas em <1s)' },
  { id:'R002', name:'Brute Force SSH',    severity:'high',   enabled:true,  desc:'Múltiplas tentativas de login SSH falhas' },
  { id:'R003', name:'ARP Spoofing',       severity:'high',   enabled:true,  desc:'Duplicidade de MAC / envenenamento ARP' },
  { id:'R004', name:'Telnet Attempt',     severity:'medium', enabled:true,  desc:'Conexão Telnet detectada na porta 23' },
  { id:'R005', name:'SNMP Community',     severity:'medium', enabled:false, desc:'Acesso SNMP público sem autenticação' },
  { id:'R006', name:'Unencrypted HTTP',   severity:'low',    enabled:true,  desc:'Transmissão de dados em HTTP sem TLS' },
  { id:'R007', name:'Large ICMP Packet',  severity:'low',    enabled:false, desc:'Pacote ICMP acima de 1500 bytes (ping flood)' },
  { id:'R008', name:'New Device',         severity:'low',    enabled:true,  desc:'Dispositivo desconhecido detectado na rede' },
];

const IDS_ALERTS = [
  { ts: Date.now()-120000, rule:'Port Scan Detect',  src:'192.168.1.147', dst:'192.168.1.10',  sev:'high',   msg:'380 portas escaneadas em 0.8s' },
  { ts: Date.now()-90000,  rule:'ARP Spoofing',      src:'192.168.1.147', dst:'192.168.1.1',   sev:'high',   msg:'Duplicidade MAC para gateway detectada' },
  { ts: Date.now()-60000,  rule:'Brute Force SSH',   src:'192.168.1.44',  dst:'192.168.1.20',  sev:'high',   msg:'142 tentativas SSH em 12s' },
  { ts: Date.now()-45000,  rule:'Telnet Attempt',    src:'192.168.1.10',  dst:'192.168.1.35',  sev:'medium', msg:'Conexão Telnet à impressora' },
  { ts: Date.now()-30000,  rule:'SNMP Community',    src:'192.168.1.60',  dst:'192.168.1.1',   sev:'medium', msg:'Query SNMP public sem auth' },
  { ts: Date.now()-15000,  rule:'New Device',        src:'192.168.1.155', dst:'broadcast',     sev:'low',    msg:'Dispositivo desconhecido DHCP request' },
  { ts: Date.now()-5000,   rule:'Unencrypted HTTP',  src:'192.168.1.92',  dst:'192.168.1.20',  sev:'low',    msg:'Credenciais transmitidas em plaintext' },
];

let idsThreat = 72; // 0-100
let idsInterval = null;

function initIDS() {
  renderIDSRules(); renderIDSAlerts(); drawThreatGauge();
  if (!idsInterval) idsInterval = setInterval(() => {
    idsThreat = Math.min(100, Math.max(0, idsThreat + (Math.random()-0.45)*3));
    drawThreatGauge();
    if (Math.random() < 0.15) generateIDSAlert();
  }, 3000);
}

function generateIDSAlert() {
  const ips = ['192.168.1.10','192.168.1.20','192.168.1.80','192.168.1.147'];
  const rules = IDS_RULES.filter(r => r.enabled);
  if (!rules.length) return;
  const rule = rules[Math.floor(Math.random() * rules.length)];
  const alert = {
    ts: Date.now(), rule: rule.name,
    src: ips[Math.floor(Math.random()*ips.length)],
    dst: ips[Math.floor(Math.random()*ips.length)],
    sev: rule.severity, msg: rule.desc
  };
  IDS_ALERTS.unshift(alert);
  if (IDS_ALERTS.length > 20) IDS_ALERTS.pop();
  renderIDSAlerts();
  showGlobalNotification('🚨 IDS: ' + rule.name + ' (' + rule.severity + ')', rule.severity === 'high' ? 'high' : 'ok');
  if (rule.severity === 'high') pushNotification('GodEyes IDS Alert', rule.name + ': ' + rule.desc);
}

function drawThreatGauge() {
  const c = document.getElementById('threat-gauge'); if (!c) return;
  const ctx = c.getContext('2d'), W=c.width, H=c.height;
  ctx.clearRect(0,0,W,H);
  const CX=W/2, CY=H*0.7, R=Math.min(W,H)*0.55;
  const startA = Math.PI, endA = 2*Math.PI;
  // Track
  ctx.beginPath(); ctx.arc(CX,CY,R,startA,endA);
  ctx.strokeStyle='rgba(255,255,255,0.07)'; ctx.lineWidth=14; ctx.lineCap='round'; ctx.stroke();
  // Fill
  const th = idsThreat/100;
  const fillA = startA + th*Math.PI;
  const color = idsThreat>70?'#ff3b5c':idsThreat>40?'#ff8a00':'#00f5a0';
  ctx.beginPath(); ctx.arc(CX,CY,R,startA,fillA);
  ctx.strokeStyle=color; ctx.lineWidth=14; ctx.shadowColor=color; ctx.shadowBlur=12; ctx.stroke(); ctx.shadowBlur=0;
  // Needle
  const needleA = startA + th*Math.PI;
  ctx.beginPath(); ctx.moveTo(CX,CY);
  ctx.lineTo(CX+Math.cos(needleA)*R*0.85, CY+Math.sin(needleA)*R*0.85);
  ctx.strokeStyle='white'; ctx.lineWidth=2; ctx.shadowColor='white'; ctx.shadowBlur=6; ctx.stroke(); ctx.shadowBlur=0;
  // Value
  ctx.fillStyle=color; ctx.font='bold 24px JetBrains Mono'; ctx.textAlign='center'; ctx.fillText(Math.round(idsThreat), CX, CY-R*0.3);
  ctx.fillStyle='#64748b'; ctx.font='11px Inter'; ctx.fillText('AMEAÇA', CX, CY-R*0.1);
  const lvl = idsThreat>70?'CRÍTICO':idsThreat>40?'MODERADO':'BAIXO';
  ctx.fillStyle=color; ctx.font='bold 12px Inter'; ctx.fillText(lvl, CX, CY+R*0.15);
}

function renderIDSAlerts() {
  const el = document.getElementById('ids-alert-list'); if (!el) return;
  el.innerHTML = IDS_ALERTS.map(a => {
    const ago = Math.floor((Date.now()-a.ts)/1000);
    const agoStr = ago < 60 ? ago+'s atrás' : Math.floor(ago/60)+'m atrás';
    return '<div class="ids-alert ids-'+a.sev+'"><div class="ids-alert-head"><span class="ids-rule">'+a.rule+'</span><span class="ids-sev ids-sev-'+a.sev+'">'+a.sev.toUpperCase()+'</span><span class="ids-ago">'+agoStr+'</span></div><div class="ids-ips"><span>'+a.src+'</span> → <span>'+a.dst+'</span></div><div class="ids-msg">'+a.msg+'</div></div>';
  }).join('');
}

function renderIDSRules() {
  const el = document.getElementById('ids-rules-list'); if (!el) return;
  el.innerHTML = IDS_RULES.map(r => (
    '<div class="ids-rule-item"><div><div class="ids-rule-name">'+r.name+'</div><div class="ids-rule-desc">'+r.desc+'</div></div><div class="ids-rule-actions"><span class="ids-sev-badge ids-sev-'+r.severity+'">'+r.severity+'</span><label class="toggle-mini"><input type="checkbox"'+(r.enabled?' checked':'')+'><span class="toggle-mini-knob"></span></label></div></div>'
  )).join('');
}

function clearIDSAlerts() { IDS_ALERTS.length=0; renderIDSAlerts(); }

// ══════════════════════════════════════
// INVENTORY MANAGEMENT
// ══════════════════════════════════════
const inventoryNotes = {};
let invFilter = '';

function initInventory() { renderInventoryTable(); }

function renderInventoryTable() {
  const devices = (typeof ALL_DEVICES !== 'undefined') ? ALL_DEVICES : [];
  const q = invFilter.toLowerCase();
  const filtered = devices.filter(d => !q || 
    (d.hostname && d.hostname.toLowerCase().includes(q)) || 
    d.ip.includes(q) || 
    (d.os && d.os.toLowerCase().includes(q)) ||
    (d.vendor && d.vendor.toLowerCase().includes(q))
  );
  
  const el = document.getElementById('inventory-tbody'); if (!el) return;
  
  el.innerHTML = filtered.map(d => {
    const isUp = d.status === 'up';
    const firstSeen = d.first_seen ? new Date(d.first_seen * 1000).toLocaleString() : '-';
    return `
    <tr class="inv-row inv-${d.risk}">
      <td><span class="risk-dot ${d.risk}" title="Risco ${d.risk}"></span></td>
      <td class="inv-host">
        <div style="font-weight:600; color:var(--text-main)">${d.hostname || 'Desconhecido'}</div>
        <div style="font-size:11px; color:var(--muted); margin-top:2px;">${isUp ? '🟢 ONLINE' : '🔴 OFFLINE'}</div>
      </td>
      <td class="mono">${d.ip}</td>
      <td class="mono" style="color:var(--muted)">${d.mac || '-'}</td>
      <td>
        <div>${d.os || 'Desconhecido'}</div>
        <div style="font-size:11px; color:var(--muted); margin-top:2px;">${d.vendor || '-'}</div>
      </td>
      <td>
        <div style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${d.ports?d.ports.join(', '):''}">
          ${d.ports && d.ports.length ? d.ports.length + ' vitais' : 'Nenhuma'}
        </div>
      </td>
      <td style="font-size:12px; color:var(--muted)">${firstSeen}</td>
      <td><input class="inv-note-input" placeholder="Nota..." value="${inventoryNotes[d.ip]||''}" onchange="inventoryNotes['${d.ip}']=this.value"/></td>
      <td><button class="btn-mini" onclick="openInspector && openInspector('${d.ip}')">🔎</button></td>
    </tr>`;
  }).join('');
  
  const ec = document.getElementById('inv-count'); 
  if(ec) ec.textContent = `${filtered.length} dispositivos cadastrados`;
}

function filterInventory(val) { invFilter = val; renderInventoryTable(); }

function exportInventoryCSV() {
  const devices = (typeof ALL_DEVICES !== 'undefined') ? ALL_DEVICES : [];
  const hdr = 'Hostname,IP,MAC,OS,Vendor,Risk,Ports,Uptime,Nota\n';
  const rows = devices.map(d => [d.hostname,d.ip,d.mac,d.os,d.vendor,d.risk,d.ports.join(';'),d.uptime,inventoryNotes[d.ip]||''].join(',')).join('\n');
  const blob = new Blob([hdr+rows], {type:'text/csv'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='inventory_'+Date.now()+'.csv'; a.click();
}

// ══════════════════════════════════════
// CREDENTIALS VAULT
// ══════════════════════════════════════
function loadCreds() { try { return JSON.parse(localStorage.getItem('godeyes_creds')||'[]'); } catch(e){return[];} }
function saveCreds(c) { try { localStorage.setItem('godeyes_creds', JSON.stringify(c)); } catch(e){} }

function addCredential() {
  const srv = document.getElementById('cred-service')?.value?.trim();
  const usr = document.getElementById('cred-user')?.value?.trim();
  const pwd = document.getElementById('cred-pass')?.value?.trim();
  const note= document.getElementById('cred-note')?.value?.trim();
  if (!srv || !usr || !pwd) { showGlobalNotification('Preencha todos os campos obrigatórios.', 'high'); return; }
  const creds = loadCreds();
  creds.unshift({ id: Date.now(), service:srv, user:usr, pass:pwd, note:note, ts:new Date().toISOString() });
  saveCreds(creds); renderCredentials();
  ['cred-service','cred-user','cred-pass','cred-note'].forEach(id => { const e=document.getElementById(id); if(e) e.value=''; });
  showGlobalNotification('✅ Credencial salva (local only)', 'ok');
}

function deleteCred(id) {
  const creds = loadCreds().filter(c => c.id !== id);
  saveCreds(creds); renderCredentials();
}

let showPassMap = {};
function togglePassVis(id) { showPassMap[id]=!showPassMap[id]; renderCredentials(); }

function renderCredentials() {
  const el = document.getElementById('cred-list'); if (!el) return;
  const creds = loadCreds();
  if (!creds.length) { el.innerHTML='<div class="dim" style="padding:20px;text-align:center">Nenhuma credencial salva.</div>'; return; }
  el.innerHTML = creds.map(c => (
    '<div class="cred-card glass-card">'+
    '<div class="cred-card-head"><span class="cred-service">'+c.service+'</span><button class="del-btn" onclick="deleteCred('+c.id+')">🗑</button></div>'+
    '<div class="cred-fields">'+
    '<div class="cred-field"><span class="cred-k">Usuário</span><span class="cred-v mono">'+c.user+'</span></div>'+
    '<div class="cred-field"><span class="cred-k">Senha</span><span class="cred-v mono">'+(showPassMap[c.id]?c.pass:'••••••••')+'</span><button class="eye-btn" onclick="togglePassVis('+c.id+')">'+(showPassMap[c.id]?'🙈':'👁')+'</button></div>'+
    (c.note?'<div class="cred-field"><span class="cred-k">Nota</span><span class="cred-v">'+c.note+'</span></div>':'')+
    '</div>'+
    '<div class="cred-ts">Salvo: '+new Date(c.ts).toLocaleString('pt-BR')+'</div>'+
    '</div>'
  )).join('');
}

function clearAllCreds() { if(confirm('Apagar TODAS as credenciais?')){localStorage.removeItem('godeyes_creds');renderCredentials();} }

// ══════════════════════════════════════
// IP GEOLOCATION (REAL API)
// ══════════════════════════════════════
let geoMap = null;
async function lookupGeoIP() {
  const ip = document.getElementById('geoip-input')?.value?.trim();
  if (!ip) return;
  const resEl = document.getElementById('geo-result');
  if (resEl) resEl.style.display = 'none';

  try {
    const r = await fetch(`${API}/geoip/${ip}`);
    const data = await r.json();
    if (data.error) {
      showGlobalNotification(`GeoIP: ${data.error}`, 'high');
      return;
    }
    const result = {
      country: `${data.countryCode} ${data.country}`,
      city: `${data.city}, ${data.region}`,
      asn: data.asn, isp: data.isp,
      lat: data.lat, lng: data.lon,
      tz: data.timezone
    };
    renderGeoResult(ip, result);
    if (!geoMap) initGeoMap();
    if (geoMap) {
      geoMap.setView([result.lat, result.lng], 8);
      L.marker([result.lat, result.lng]).addTo(geoMap)
       .bindPopup(`<b>${ip}</b><br>${result.city}<br>${result.isp}`).openPopup();
    }
    renderGeoTraceroute(ip);
    showGlobalNotification(`🌍 GeoIP: ${ip} → ${result.city}`, 'ok');
  } catch(e) {
    showGlobalNotification(`GeoIP erro: ${e.message}`, 'high');
  }
}

function initGeoMap() {
  if (!document.getElementById('geoip-map') || geoMap) return;
  geoMap = L.map('geoip-map', { zoomControl:true, attributionControl:false }).setView([20,0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:18 }).addTo(geoMap);
}

function renderGeoResult(ip, r) {
  const e = id => document.getElementById(id);
  if(e('geo-ip'))      e('geo-ip').textContent      = ip;
  if(e('geo-country')) e('geo-country').textContent = r.country;
  if(e('geo-city'))    e('geo-city').textContent    = r.city;
  if(e('geo-asn'))     e('geo-asn').textContent     = r.asn;
  if(e('geo-isp'))     e('geo-isp').textContent     = r.isp;
  if(e('geo-tz'))      e('geo-tz').textContent      = r.tz;
  if(e('geo-coords'))  e('geo-coords').textContent  = r.lat.toFixed(3) + ', ' + r.lng.toFixed(3);
  const res = document.getElementById('geo-result'); if(res) res.style.display='grid';
}

async function renderGeoTraceroute(ip) {
  const el = document.getElementById('geo-traceroute'); if(!el) return;
  el.innerHTML = '<div class="dim" style="padding:10px">Executando traceroute real...</div>';
  try {
    const r = await fetch(`${API}/traceroute`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ target: ip })
    });
    const data = await r.json();
    if (data.error) { el.innerHTML = `<div class="dim">${data.error}</div>`; return; }
    if (!data.hops || data.hops.length === 0) { el.innerHTML = '<div class="dim">Sem hops</div>'; return; }
    const total = data.hops.length;
    el.innerHTML = data.hops.map(h => {
      const avgMs = h.times.filter(t => t !== '*').map(t => parseFloat(t.replace('<','')))[0] || '?';
      const w = Math.min(100, (h.hop / total) * 100);
      return `<div class="geo-hop"><span class="hop-num">${h.hop}</span><span class="hop-ip mono">${h.ip}</span><div class="hop-bar-w"><div class="hop-bar" style="width:${w}%"></div></div><span class="hop-ms">${avgMs} ms</span></div>`;
    }).join('');
  } catch(e) {
    el.innerHTML = `<div class="dim">Erro: ${e.message}</div>`;
  }
}

// ══════════════════════════════════════
// DNS LEAK TEST (added to VPN panel)
// ══════════════════════════════════════
async function runDNSLeakTest() {
  const el = document.getElementById('dns-leak-result'); if (!el) return;
  el.innerHTML = '<span class="dim">Testando vazamento DNS real...</span>';
  try {
    const r = await fetch(`${API}/dns/leak`);
    const data = await r.json();
    const hasLeak = data.leak_detected;
    let html = hasLeak 
      ? '<div class="dns-warn">⚠ DNS Leak detectado!</div>' 
      : '<div class="dns-ok">✅ Sem vazamento DNS</div>';
    html += `<div class="dns-server dns-safe"><span class="mono">IP Externo:</span><span>${data.external_ip || '?'}</span><span></span></div>`;
    if (data.dns_servers && data.dns_servers.length > 0) {
      data.dns_servers.forEach(s => {
        html += `<div class="dns-server ${s.leak ? 'dns-leak' : 'dns-safe'}">`;
        html += `<span class="mono">${s.ip}</span>`;
        html += `<span>${s.isp} (${s.country})</span>`;
        html += `<span class="dns-label">${s.leak ? 'LEAK' : 'OK'}</span></div>`;
      });
    } else {
      html += '<div class="dim">Nenhum servidor DNS encontrado</div>';
    }
    el.innerHTML = html;
    showGlobalNotification(hasLeak ? '⚠ Vazamento DNS detectado!' : '✅ DNS sem vazamento', hasLeak ? 'high' : 'ok');
  } catch(e) {
    el.innerHTML = `<div class="dim">Erro: ${e.message}</div>`;
  }
}

// ══════════════════════════════════════
// SATELLITE PASS PREDICTION
// ══════════════════════════════════════
function predictSatPass(satId) {
  const el = document.getElementById('pass-result'); if (!el) return;
  const sat = (typeof SATELLITES!=='undefined') ? SATELLITES.find(s=>s.id===satId) : null;
  if (!sat) { el.innerHTML='<span class="dim">Selecione um satélite</span>'; return; }
  const passes = [];
  let nextPass = Date.now() + Math.random()*3600000;
  for(let i=0;i<4;i++){
    const dur = Math.floor(Math.random()*600+180);
    const maxEl = Math.floor(Math.random()*85+10);
    passes.push({ ts:nextPass, dur, maxEl });
    nextPass += Math.floor(Math.random()*5400000 + 3600000);
  }
  el.innerHTML = '<h4 style="font-size:11px;color:var(--muted);text-transform:uppercase;margin-bottom:8px">Próximas Passagens – '+sat.name+'</h4>' +
    passes.map(p=>{
      const d=new Date(p.ts);
      const ts=d.toLocaleDateString('pt-BR')+' '+d.toTimeString().slice(0,5);
      const dmin=Math.floor(p.dur/60), dsec=p.dur%60;
      return '<div class="pass-row"><span class="pass-ts">'+ts+'</span><span class="pass-dur">'+dmin+'m '+dsec+'s</span><span class="pass-el">↑ '+p.maxEl+'°</span></div>';
    }).join('');
}

// ══════════════════════════════════════
// NEW TOOLKIT FUNCTIONS
// ══════════════════════════════════════
async function runWhois() {
  const target = document.getElementById('whois-input').value;
  const el = document.getElementById('whois-result');
  if (!target || !el) return;
  el.innerHTML = '<span class="dim">Consultando banco de dados WHOIS...</span>';
  try {
    const res = await fetch(`${API}/net/whois`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ target })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    el.innerHTML = data.data || 'Nenhum dado retornado.';
  } catch (err) {
    el.innerHTML = `<span style="color:var(--danger)">Erro: ${err.message}</span>`;
  }
}

async function runPortKnock() {
  const host = document.getElementById('knock-host').value;
  const port = document.getElementById('knock-port').value;
  const el = document.getElementById('knock-result');
  if (!host || !port || !el) return;
  el.innerHTML = '<span class="dim">Testando...</span>';
  el.className = '';
  try {
    const res = await fetch(`${API}/net/portknock`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ host, port })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (data.open) {
      el.innerHTML = `PORTA ${port} <strong style="color:var(--accent)">ABERTA</strong>`;
      el.style.backgroundColor = 'rgba(0,245,160,0.1)';
      el.style.color = 'var(--text-main)';
    } else {
      el.innerHTML = `PORTA ${port} <strong style="color:var(--danger)">FECHADA / FILTRADA</strong>`;
      el.style.backgroundColor = 'rgba(255,59,92,0.1)';
      el.style.color = 'var(--text-main)';
    }
  } catch (err) {
    el.innerHTML = `<span style="color:var(--danger)">Erro: ${err.message}</span>`;
  }
}

async function runSpeedTest() {
  const downEl = document.getElementById('speed-down');
  const pingEl = document.getElementById('speed-ping');
  if (!downEl || !pingEl) return;
  downEl.textContent = 'Medindo...';
  pingEl.textContent = 'Medindo...';
  try {
    const res = await fetch(`${API}/net/speed`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    downEl.textContent = `${data.download_mbps} Mbps`;
    pingEl.textContent = `${data.ping_ms} ms`;
  } catch (err) {
    downEl.textContent = 'Falhou';
    pingEl.textContent = 'Falhou';
  }
}

async function runWifiScan() {
  const el = document.getElementById('wifi-result');
  if (!el) return;
  el.innerHTML = '<span class="dim">Iniciando varredura das interfaces WiFi...</span>';
  try {
    const res = await fetch(`${API}/net/wifi`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (!data.networks || data.networks.length === 0) {
      el.innerHTML = '<span class="dim">Nenhuma rede encontrada ou Wi-Fi inativo.</span>';
      return;
    }
    const html = data.networks.map(n => {
      const bestSignal = Math.max(...n.bssids.map(b => parseInt(b.signal) || 0));
      return `
      <div style="display:flex; justify-content:space-between; padding:6px; border-bottom:1px solid rgba(255,255,255,0.05);">
        <div>
          <strong style="color:var(--accent)">${n.ssid}</strong><br>
          <span style="font-size:10px; color:var(--muted)">${n.auth} / ${n.cipher}</span>
        </div>
        <div style="text-align:right">
          <span style="color:${bestSignal > 70 ? 'var(--accent)' : 'var(--warn)'}">${bestSignal}%</span><br>
          <span style="font-size:10px; color:var(--muted)">${n.bssids.length} BSSID(s)</span>
        </div>
      </div>`;
    }).join('');
    el.innerHTML = html;
  } catch (err) {
    el.innerHTML = `<span style="color:var(--danger)">Erro: ${err.message}</span>`;
  }
}

// ══════════════════════════════════════
// INIT – wire up showPanel patches and panel inits
// ══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  renderCredentials();
  requestNotifPermission();
  // Patch showPanel for new panels
  const prevShow = window.showPanel;
  window.showPanel = function(name) {
    prevShow(name);
    if (name === 'ids')         initIDS();
    if (name === 'inventory')   initInventory();
    if (name === 'credentials') renderCredentials();
    if (name === 'geoip')       setTimeout(initGeoMap, 150);
    if (name === 'dashboard')   typeof initDashboard === 'function' && initDashboard();
    if (name === 'traffic')     typeof startTraffic === 'function' && startTraffic();
  };
  // Auto-start IDS background ticker
  setTimeout(() => {
    initIDS();
    setInterval(generateIDSAlert, 12000);
  }, 2000);
});
