/* ══════════════════════════════════════════════════════
   GodEyes – real_tools.js
   Ponte frontend ↔ backend real (server.py)
   Todas as ferramentas usam a API real quando disponível
   ══════════════════════════════════════════════════════ */
'use strict';

const BACKEND_URL = localStorage.getItem('godeyes_backend') || window.location.origin;
const API = BACKEND_URL + '/api';

// ─────────────────────────────────────────────
// JOB POLLER – busca resultado de operação async
// ─────────────────────────────────────────────
async function pollJob(jobId, onLine, onDone, intervalMs = 600) {
  return new Promise(resolve => {
    let sent = 0;
    const iv = setInterval(async () => {
      try {
        const r = await fetch(`${API}/job/${jobId}`);
        const data = await r.json();
        const newLines = data.output.slice(sent);
        newLines.forEach(ln => onLine(ln));
        sent += newLines.length;
        if (data.done) {
          clearInterval(iv);
          if (onDone) onDone(data.error);
          resolve(data);
        }
      } catch (e) {
        clearInterval(iv);
        onLine({ l: 'error', m: `Conexão perdida com backend: ${e.message}` });
        resolve(null);
      }
    }, intervalMs);
  });
}

// ─────────────────────────────────────────────
// CONSOLE – renderiza linhas com cores
// ─────────────────────────────────────────────
function conLine(consoleEl, line) {
  if (!consoleEl) return;
  const colors = { success: '#00f5a0', error: '#ff3b5c', info: '#aaa', warn: '#ff8a00' };
  const div = document.createElement('div');
  div.style.cssText = `color:${colors[line.l] || '#aaa'};font-family:var(--mono,'monospace');font-size:12px;padding:1px 0;word-break:break-all`;
  div.textContent = `${line.t || ''} ${line.m}`;
  consoleEl.appendChild(div);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

function conMsg(el, msg, lvl = 'info') {
  conLine(el, { l: lvl, m: msg, t: new Date().toTimeString().slice(0, 8) });
}

// ─────────────────────────────────────────────
// CHECK BACKEND
// ─────────────────────────────────────────────
async function isBackendAlive() {
  try {
    const r = await fetch(`${API}/status`, { signal: AbortSignal.timeout(2000) });
    return (await r.json()).online === true;
  } catch (_) { return false; }
}

// ─────────────────────────────────────────────
// PAINEL: PENTEST CONSOLE REAL
// ─────────────────────────────────────────────
async function executePenTestReal(cmd, args, consoleEl) {
  const alive = await isBackendAlive();
  if (!alive) {
    conMsg(consoleEl, '⚠ Backend offline. Execute iniciar_servidor.bat', 'error');
    return;
  }
  const routes = {
    ping:       ['/ping',       { host: args[0], count: parseInt(args[1]) || 4 }],
    traceroute: ['/traceroute', { host: args[0] }],
    trace:      ['/traceroute', { host: args[0] }],
    banner:     ['/banner',     { host: args[0] }],
    dns:        ['/dns',        { host: args[0] }],
    whois:      ['/whois',      { host: args[0] }],
    arp:        ['/arp',        { target: args[0] || '192.168.1.0/24' }],
    portscan:   ['/portscan',   { host: args[0], start: parseInt(args[1]) || 1, end: parseInt(args[2]) || 1024 }],
    ssl:        ['/ssl',        { host: args[0], port: parseInt(args[1]) || 443 }],
    headers:    ['/http-headers',{ url: args[0] }],
    brute:      ['/brute',      { host: args[0], port: parseInt(args[1]) || 22, service: args[2] || 'ssh' }],
    vulnscan:   ['/vulnscan',   { host: args[0] }],
    smb:        ['/smb',        { host: args[0] }],
    osdetect:   ['/os-detect',  { host: args[0] }],
    scan:       ['/scan/start', { target: args[0] || '192.168.1.0/24', type: args[1] || 'standard' }],
    subdom:     ['/subdom',     { domain: args[0] }],
    dirbust:    ['/dirbust',    { url: args[0] }],
    sqli:       ['/sqli',       { url: args[0] }],
    xss:        ['/xss',        { url: args[0] }],
    waf:        ['/waf',        { url: args[0] }],
    cors:       ['/cors',       { url: args[0] }],
    wpscan:     ['/wpscan',     { url: args[0] }],
    hash:       ['/hash',       { text: args.join(' ') }],
    autopentest:['/autopentest',{ target: args[0] || '192.168.1.1' }],
    scrape:     ['/scrape',     { url: args[0] }],
    exif:       ['/exif',       { url: args[0] }],
    pwned:      ['/pwned',      { email: args[0] }],
    slowloris:  ['/slowloris',  { target: args[0] || '192.168.1.1' }],
    mac:        ['/mac',        { mac: args[0] }],
    geomap:     ['/geomap',     { ip: args[0] }],
    revdns:     ['/revdns',     { ip: args[0] }],
    sweep:      ['/sweep',      { range: args[0] }],
    shodan:     ['/shodan',     { ip: args[0] }],
    censys:     ['/censys',     { ip: args[0] }],
    zonetransfer:['/zonetransfer',{ domain: args[0] }],
    wafbypass:  ['/wafbypass',  { url: args[0] }],
    clickjack:  ['/clickjack',  { url: args[0] }],
    ssldec:     ['/ssldec',     { host: args[0] }],
    takeover:   ['/takeover',   { domain: args[0] }],
    sshkeyscan: ['/sshkeyscan', { host: args[0], port: args[1] || 22 }],
    anonftp:    ['/anonftp',    { host: args[0] }],
    spoofcheck: ['/spoofcheck', { domain: args[0] }],
    sqlmap:     ['/sqlmap',     { url: args[0] }],
    nmap_a:     ['/nmap_a',     { host: args[0] }],
    nikto:      ['/nikto',      { url: args[0] }],
    gobuster:   ['/gobuster',   { url: args[0] }],
    hydra:      ['/hydra',      { host: args[0], service: args[1] || 'ssh' }],
    msfconsole: ['/msf',        { exploit: args[0] || 'auto', target: args[1] }],
    pcap:       ['/pcap',       { file: args[0] }],
    cvedetails: ['/cvedetails', { cve: args[0] }],
    passgen:    ['/passgen',    { length: parseInt(args[0]) || 16 }],
    b64:        ['/b64',        { action: args[0], text: args.slice(1).join(' ') }],
    urldecode:  ['/urldecode',  { text: args[0] }],
    hashgen:    ['/hashgen',    { algo: args[0], text: args.slice(1).join(' ') }],
    hashcrack:  ['/hashcrack',  { hash: args[0] }],
    jwt:        ['/jwt',        { token: args[0] }],
    robots:     ['/robots',     { url: args[0] }],
    sitemap:    ['/sitemap',    { url: args[0] }]
  };

  const cmdKey = cmd.toLowerCase();
  if (!routes[cmdKey]) {
    conMsg(consoleEl, `Comando desconhecido: ${cmd}`, 'error');
    conMsg(consoleEl, 'Comandos: ping, traceroute, banner, portscan, ssl, headers, dns, whois, arp, brute, vulnscan, smb, osdetect, scan, subdom, dirbust, sqli, xss, waf, cors, wpscan, hash, autopentest, scrape, exif, pwned, slowloris, mac, geomap, revdns, sweep, shodan, censys, zonetransfer, wafbypass, clickjack, ssldec, takeover, sshkeyscan, anonftp, spoofcheck, sqlmap, nmap_a, nikto, gobuster, hydra, msfconsole, pcap, cvedetails, passgen, b64, urldecode, hashgen, hashcrack, jwt, robots, sitemap', 'info');
    return;
  }

  const [endpoint, payload] = routes[cmdKey];
  conMsg(consoleEl,'─'.repeat(50), 'info');
  conMsg(consoleEl, `▶ ${cmd.toUpperCase()} ${args.join(' ')}`, 'success');

  try {
    const r = await fetch(API + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    if (!r.ok) { conMsg(consoleEl, `Erro: ${data.error}`, 'error'); return; }

    if (data.job_id) {
      conMsg(consoleEl, `Job ${data.job_id} iniciado...`, 'info');
      await pollJob(data.job_id, ln => conLine(consoleEl, ln),
        err => conMsg(consoleEl, err ? `Erro: ${err}` : '✓ Concluído', err ? 'error' : 'success'));
    } else if (data.status === 'started') {
      conMsg(consoleEl, 'Scan iniciado. Aguarde resultados...', 'info');
      await pollScanToConsole(consoleEl);
    }
  } catch (e) {
    conMsg(consoleEl, `Erro de conexão: ${e.message}`, 'error');
  }
}

async function pollScanToConsole(consoleEl) {
  let prev = 0;
  return new Promise(resolve => {
    const iv = setInterval(async () => {
      try {
        const st = await (await fetch(`${API}/scan/status`)).json();
        conMsg(consoleEl, `[${st.progress}%] ${st.message}`, 'info');
        if (!st.running) {
          clearInterval(iv);
          const res = await (await fetch(`${API}/scan/results`)).json();
          res.devices.forEach(d => {
            conMsg(consoleEl, `  ${d.ip.padEnd(16)} ${d.hostname.padEnd(20)} Risk:${d.risk.toUpperCase()} Ports:[${d.ports.join(',')}]`,
              d.risk === 'high' ? 'error' : d.risk === 'medium' ? 'warn' : 'success');
          });
          conMsg(consoleEl, `✓ ${res.count} dispositivos encontrados`, 'success');
          resolve();
        }
      } catch (_) { clearInterval(iv); resolve(); }
    }, 1500);
  });
}

// ─────────────────────────────────────────────
// REAL SCANNER HOOK
// ─────────────────────────────────────────────
window.startRealScan = async function() {
  const btn = document.getElementById('scan-btn');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 3 A9 9 0 0 1 21 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="spin"/></svg> Iniciando...';
  btn.disabled = true;

  const wrap = document.getElementById('scan-progress-wrap');
  const fill = document.getElementById('scan-progress-fill');
  const label = document.getElementById('scan-progress-label');
  wrap.style.display = 'flex';
  fill.style.width = '2%';
  label.textContent = 'Iniciando varredura real...';

  const list = document.getElementById('device-list');
  list.innerHTML = '';
  if (typeof radarBlips !== 'undefined') radarBlips.length = 0;
  if (typeof setStats === 'function') setStats(0, 0, 0, 0);

  const target = document.getElementById('scan-range').value;

  try {
    const r = await fetch(`${API}/scan/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: target, type: 'standard' })
    });
    
    if (!r.ok) throw new Error('Falha ao iniciar scan');

    const pollInterval = setInterval(async () => {
      try {
        const stRes = await fetch(`${API}/scan/status`);
        const st = await stRes.json();
        
        fill.style.width = st.progress + '%';
        label.textContent = st.message;

        if (!st.running && st.progress >= 100) {
          clearInterval(pollInterval);
          
          const resRes = await fetch(`${API}/scan/results`);
          const res = await resRes.json();
          
          if (typeof ALL_DEVICES !== 'undefined') {
            // Update actual devices from backend
            let newDevices = res.devices.map((d, i) => ({
              id: i + 1,
              hostname: d.hostname,
              ip: d.ip,
              mac: d.mac || 'Desconhecido',
              vendor: d.vendor || 'Desconhecido',
              os: d.os || 'Desconhecido',
              uptime: d.uptime || '–',
              risk: d.risk,
              ports: d.ports || [],
              lat: typeof mapInstance !== 'undefined' ? -23.550 + (Math.random() - 0.5) * 0.02 : 0,
              lng: typeof mapInstance !== 'undefined' ? -46.633 + (Math.random() - 0.5) * 0.02 : 0,
              vulns: d.vulns || []
            }));
            
            // clear ALL_DEVICES and fill with new ones safely
            ALL_DEVICES.length = 0;
            ALL_DEVICES.push(...newDevices);
            
            list.innerHTML = '';
            ALL_DEVICES.forEach(d => {
              if (typeof radarBlips !== 'undefined') {
                 const angle = Math.random() * Math.PI * 2;
                 const dist = Math.random() * (130 * 0.8) + 10;
                 radarBlips.push({ x: Math.cos(angle)*dist, y: Math.sin(angle)*dist, risk: d.risk, fade: 1.0 });
              }
              if (typeof renderDeviceCard === 'function') renderDeviceCard(d);
            });
            
            if (typeof updateStats === 'function') updateStats();
          }

          btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Scan Concluído';
          btn.disabled = false;
          label.textContent = `✓ ${res.count} dispositivos encontrados (Scaneado via Nmap)`;
          
          // Force scanDone true and remount map
          try { scanDone = true; } catch(e){}
          if (typeof mapInitialized !== 'undefined' && typeof refreshMapPins === 'function') {
            try { mapInitialized = false; initMap(); } catch(e){}
          }
        } else if (!st.running) {
            clearInterval(pollInterval);
            btn.innerHTML = 'Iniciar Scan';
            btn.disabled = false;
            label.textContent = 'Scan cancelado ou falhou.';
        }
      } catch (err) {
        clearInterval(pollInterval);
        btn.disabled = false;
        btn.innerHTML = 'Iniciar Scan';
        label.textContent = 'Erro ao verificar status';
      }
    }, 1500);

  } catch (e) {
    btn.disabled = false;
    btn.innerHTML = 'Iniciar Scan';
    label.textContent = `Erro: ${e.message}`;
  }
};

// ─────────────────────────────────────────────
// PAINEL: TERMINAL INTERATIVO
// ─────────────────────────────────────────────
function initTerminal() {
  const term = document.getElementById('real-terminal');
  const inp  = document.getElementById('term-input');
  const btn  = document.getElementById('term-send');
  if (!term || !inp) return;

  conMsg(term, '╔══════════════════════════════════════╗', 'success');
  conMsg(term, '║   GodEyes Terminal – Pentest Real    ║', 'success');
  conMsg(term, '╚══════════════════════════════════════╝', 'success');
  conMsg(term, '  mac <mac>             |  geomap <ip>', 'info');
  conMsg(term, '  revdns <ip>           |  sweep <range>', 'info');
  conMsg(term, '  shodan <ip>           |  censys <ip>', 'info');
  conMsg(term, '  zonetransfer <domain> |  wafbypass <url>', 'info');
  conMsg(term, '  clickjack <url>       |  ssldec <host>', 'info');
  conMsg(term, '  takeover <domain>     |  sshkeyscan <host>', 'info');
  conMsg(term, '  anonftp <host>        |  spoofcheck <domain>', 'info');
  conMsg(term, '  sqlmap <url>          |  nmap_a <host>', 'info');
  conMsg(term, '  nikto <url>           |  gobuster <url>', 'info');
  conMsg(term, '  hydra <host>          |  msfconsole <exploit> <target>', 'info');
  conMsg(term, '  pcap <file>           |  cvedetails <cve>', 'info');
  conMsg(term, '  passgen [len]         |  b64 <enc|dec> <text>', 'info');
  conMsg(term, '  urldecode <text>      |  hashgen <md5|sha1> <text>', 'info');
  conMsg(term, '  hashcrack <hash>      |  jwt <token>', 'info');
  conMsg(term, '  robots <url>          |  sitemap <url>', 'info');
  conMsg(term, '  clear', 'info');
  conMsg(term, '─'.repeat(40), 'info');

  const run = async () => {
    const raw = inp.value.trim();
    if (!raw) return;
    conMsg(term, `$ ${raw}`, 'warn');
    inp.value = '';
    const parts = raw.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);
    if (cmd === 'clear') { term.innerHTML = ''; return; }
    await executePenTestReal(cmd, args, term);
  };

  inp.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
  if (btn) btn.addEventListener('click', run);

  // History
  let history = [], histIdx = -1;
  inp.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') {
      histIdx = Math.min(histIdx + 1, history.length - 1);
      inp.value = history[histIdx] || '';
    } else if (e.key === 'ArrowDown') {
      histIdx = Math.max(histIdx - 1, -1);
      inp.value = histIdx >= 0 ? history[histIdx] : '';
    } else if (e.key === 'Enter' && inp.value.trim()) {
      history.unshift(inp.value.trim());
      histIdx = -1;
    }
  });
}

// ─────────────────────────────────────────────
// DEVICE INSPECTOR – ferramentas reais
// ─────────────────────────────────────────────
async function realPingDevice(ip) {
  const out = document.getElementById('inspector-ping-out');
  if (!out) return;
  out.innerHTML = '';
  conMsg(out, `Ping real para ${ip}...`, 'info');
  const alive = await isBackendAlive();
  if (!alive) { conMsg(out, 'Backend offline', 'error'); return; }
  try {
    const r    = await fetch(`${API}/ping`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ host: ip, count: 4 }) });
    const data = await r.json();
    await pollJob(data.job_id, ln => conLine(out, ln), () => {});
  } catch (e) { conMsg(out, `Erro: ${e.message}`, 'error'); }
}

async function realTraceroute(ip) {
  const out = document.getElementById('inspector-trace-out');
  if (!out) return;
  out.innerHTML = '';
  conMsg(out, `Traceroute ${ip}...`, 'info');
  const alive = await isBackendAlive();
  if (!alive) { conMsg(out, 'Backend offline', 'error'); return; }
  try {
    const r    = await fetch(`${API}/traceroute`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ host: ip }) });
    const data = await r.json();
    await pollJob(data.job_id, ln => conLine(out, ln), () => {});
  } catch (e) { conMsg(out, `Erro: ${e.message}`, 'error'); }
}

async function realBannerGrab(ip) {
  const out = document.getElementById('inspector-banner-out');
  if (!out) return;
  out.innerHTML = '';
  conMsg(out, `Banner grab ${ip}...`, 'info');
  const alive = await isBackendAlive();
  if (!alive) { conMsg(out, 'Backend offline', 'error'); return; }
  try {
    const r    = await fetch(`${API}/banner`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ host: ip }) });
    const data = await r.json();
    await pollJob(data.job_id, ln => conLine(out, ln), () => {});
  } catch (e) { conMsg(out, `Erro: ${e.message}`, 'error'); }
}

async function realVulnScan(ip) {
  const out = document.getElementById('inspector-vuln-out');
  if (!out) return;
  out.innerHTML = '';
  conMsg(out, `Vuln scan ${ip}... (pode demorar 2-5 min)`, 'info');
  const alive = await isBackendAlive();
  if (!alive) { conMsg(out, 'Backend offline', 'error'); return; }
  try {
    const r    = await fetch(`${API}/vulnscan`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ host: ip }) });
    const data = await r.json();
    await pollJob(data.job_id, ln => conLine(out, ln), () => {});
  } catch (e) { conMsg(out, `Erro: ${e.message}`, 'error'); }
}

// ─────────────────────────────────────────────
// DEVICE INSPECTOR PATCH
// Adiciona abas reais ao inspector quando backend online
// ─────────────────────────────────────────────
function patchInspector(device) {
  const inspector = document.getElementById('device-inspector');
  if (!inspector) return;
  const tabsContainer = inspector.querySelector('.inspector-real-tabs');
  if (tabsContainer) { tabsContainer.remove(); }

  const tabsDiv = document.createElement('div');
  tabsDiv.className = 'inspector-real-tabs';
  tabsDiv.style.cssText = 'margin-top:16px;display:flex;flex-direction:column;gap:8px;';

  const TOOLS = [
    { label: '📡 Ping Real',     id: 'inspector-ping-out',   fn: () => realPingDevice(device.ip) },
    { label: '🔀 Traceroute',    id: 'inspector-trace-out',  fn: () => realTraceroute(device.ip) },
    { label: '🏷 Banner Grab',   id: 'inspector-banner-out', fn: () => realBannerGrab(device.ip) },
    { label: '🔴 Vuln Scan',     id: 'inspector-vuln-out',   fn: () => realVulnScan(device.ip) },
  ];

  TOOLS.forEach(tool => {
    const btn = document.createElement('button');
    btn.className = 'btn-secondary'; btn.textContent = tool.label;
    btn.onclick = () => { outEl.style.display = 'block'; tool.fn(); };

    const outEl = document.createElement('div');
    outEl.id = tool.id;
    outEl.style.cssText = 'display:none;max-height:160px;overflow-y:auto;background:#0a0e14;border:1px solid var(--glass-b);border-radius:8px;padding:8px;margin-top:4px;';

    tabsDiv.appendChild(btn);
    tabsDiv.appendChild(outEl);
  });

  // Section header
  const hdg = document.createElement('h3');
  hdg.style.cssText = 'margin:16px 0 6px;font-size:13px;color:var(--cyan)';
  hdg.textContent = '⚡ Ferramentas Reais';
  inspector.querySelector('.inspector-body')?.appendChild(hdg);
  inspector.querySelector('.inspector-body')?.appendChild(tabsDiv);
}

// Override openInspector
const _origOpenInspector = window.openInspector;
window.openInspector = function(device) {
  if (_origOpenInspector) _origOpenInspector(device);
  setTimeout(() => patchInspector(device), 100);
};

// ─────────────────────────────────────────────
// TERMINAL PANEL – inject into index.html
// ─────────────────────────────────────────────
function injectTerminalPanel() {
  if (document.getElementById('panel-terminal')) return;

  // Sidebar button
  const nav = document.querySelector('aside nav');
  if (nav) {
    const btn = document.createElement('button');
    btn.className = 'nav-btn'; btn.id = 'nav-terminal';
    btn.title = 'Terminal Pentest';
    btn.onclick = () => showPanel('terminal');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="20" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <path d="M8 9l3 3-3 3M13 15h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <span>Terminal</span>`;
    nav.appendChild(btn);
  }

  // Panel HTML
  const main = document.querySelector('main');
  if (!main) return;

  const section = document.createElement('section');
  section.id = 'panel-terminal';
  section.className = 'panel';
  section.innerHTML = `
    <div class="panel-header">
      <div>
        <h1>Terminal Pentest</h1>
        <p class="panel-sub">Ferramentas reais de segurança — requer backend (iniciar_servidor.bat)</p>
      </div>
      <div class="header-actions">
        <div id="term-backend-status" style="padding:6px 14px;border-radius:8px;border:1px solid var(--glass-b);font-size:12px;font-family:var(--mono)">
          🔴 Backend offline
        </div>
        <button class="btn-secondary" onclick="document.getElementById('real-terminal').innerHTML=''">🗑 Limpar</button>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 280px;gap:16px;height:calc(100vh - 200px)">
      <!-- Terminal -->
      <div class="glass-card" style="display:flex;flex-direction:column;overflow:hidden">
        <div id="real-terminal" style="flex:1;overflow-y:auto;padding:12px;background:#050810;border-radius:var(--radius) var(--radius) 0 0;font-family:var(--mono);font-size:12px;"></div>
        <div style="display:flex;gap:8px;padding:10px;border-top:1px solid var(--glass-b);background:#08111a;">
          <span style="color:var(--neon);font-family:var(--mono);font-size:13px;align-self:center">$</span>
          <input id="term-input" type="text" class="input-field" placeholder="ping 192.168.1.1  |  vulnscan 192.168.1.100  |  brute 10.0.0.1 22 ssh" style="flex:1;font-family:var(--mono);background:transparent;border:none;outline:none;font-size:13px"/>
          <button id="term-send" class="btn-primary" style="min-width:80px">▶ Executar</button>
        </div>
      </div>

      <!-- Quick Actions sidebar -->
      <div style="display:flex;flex-direction:column;gap:10px;overflow-y:auto;">
        <div class="glass-card">
          <h3 style="margin-bottom:12px">⚡ Ação Rápida</h3>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:11px;color:var(--muted)">Alvo:</label>
            <input id="quick-target" class="input-field" placeholder="192.168.1.1 ou dominio.com" style="font-size:12px"/>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px">
            ${[
              ['📡 Ping',       'ping'],
              ['🔀 Traceroute', 'traceroute'],
              ['🏷 Banner',     'banner'],
              ['🔍 Port Scan',  'portscan'],
              ['🔒 SSL/TLS',    'ssl'],
              ['🌐 Headers HTTP','headers'],
              ['🌍 DNS',        'dns'],
              ['📋 WHOIS',      'whois'],
              ['📶 ARP Scan',   'arp'],
              ['🔑 Brute SSH',  'brute'],
              ['🔴 Vuln Scan',  'vulnscan'],
              ['💾 SMB Scan',   'smb'],
              ['🖥 OS Detect',  'osdetect'],
              ['🌐 Subdomínios','subdom'],
              ['📂 DirBuster',  'dirbust'],
              ['💉 SQLi Test',  'sqli'],
              ['💥 XSS Test',   'xss'],
              ['🛡️ WAF Detect', 'waf'],
              ['🔓 CORS Test',  'cors'],
              ['🎯 WPScan',     'wpscan'],
              ['⚡ AutoPentest', 'autopentest'],
              ['🕵️ Scraper',     'scrape'],
              ['📸 Modulo EXIF', 'exif'],
              ['💀 Pwned Check', 'pwned'],
              ['💥 DoS Loris',   'slowloris'],
              ['📌 MAC Lookup',  'mac'],
              ['🗺️ Geo Map',     'geomap'],
              ['🔄 Reverse DNS', 'revdns'],
              ['📡 Ping Sweep',  'sweep'],
              ['👁️ Shodan',      'shodan'],
              ['👁️ Censys',      'censys'],
              ['📑 Zone Trans.', 'zonetransfer'],
              ['🛡️ WAF Bypass',  'wafbypass'],
              ['🖱️ Clickjack',   'clickjack'],
              ['🔑 SSL Decode',  'ssldec'],
              ['🎭 Sub-Takeovr', 'takeover'],
              ['🗝️ SSH Keys',    'sshkeyscan'],
              ['📂 Anon FTP',    'anonftp'],
              ['📧 Spoof Check', 'spoofcheck'],
              ['💉 SQLMap',      'sqlmap'],
              ['🔥 Nmap -A',     'nmap_a'],
              ['🔬 Nikto',       'nikto'],
              ['📂 Gobuster',    'gobuster'],
              ['🐍 Hydra',       'hydra'],
              ['☠️ Metasploit',  'msfconsole'],
              ['🗜️ PCAP Anal.',  'pcap'],
              ['📚 CVE Info',    'cvedetails'],
              ['🔐 Pass Gen',    'passgen'],
              ['🔤 Base64',      'b64'],
              ['🔗 URL Decode',  'urldecode'],
              ['#️⃣ Hash Gen',    'hashgen'],
              ['💥 Hash Crack',  'hashcrack'],
              ['🎫 JWT Decode',  'jwt'],
              ['🤖 Robots.txt',  'robots'],
              ['🗺️ Sitemap.xml', 'sitemap'],
            ].map(([label, cmd]) => `<button class="btn-secondary" style="text-align:left;font-size:12px;padding:6px;min-height:28px;" onclick="quickRun('${cmd}')">${label}</button>`).join('')}
          </div>
        </div>

        <div class="glass-card">
          <h3 style="margin-bottom:8px">📖 Referência</h3>
          <div style="font-size:11px;color:var(--muted);font-family:var(--mono);line-height:1.8">
            mac HOST<br>
            geomap HOST<br>
            revdns HOST<br>
            sweep RANGE<br>
            shodan HOST<br>
            censys HOST<br>
            zonetransfer DOMAIN<br>
            wafbypass URL<br>
            clickjack URL<br>
            ssldec HOST<br>
            takeover DOMAIN<br>
            sshkeyscan HOST<br>
            anonftp HOST<br>
            spoofcheck DOMAIN<br>
            sqlmap URL<br>
            nmap_a HOST<br>
            nikto URL<br>
            gobuster URL<br>
            hydra HOST [SVC]<br>
            msfconsole EXP TGT<br>
            pcap FILE<br>
            cvedetails CVE<br>
            passgen LEN<br>
            b64 enc/dec TEXT<br>
            urldecode TEXT<br>
            hashgen ALGO TEXT<br>
            hashcrack HASH<br>
            jwt TOKEN<br>
            robots URL<br>
            sitemap URL<br>
            clear
          </div>
        </div>
      </div>
    </div>`;

  main.appendChild(section);
  initTerminal();
  pollTerminalBackendStatus();
}

function quickRun(cmd) {
  const target = document.getElementById('quick-target')?.value?.trim();
  if (!target) { alert('Digite o IP/host no campo "Alvo" primeiro.'); return; }
  const inp = document.getElementById('term-input');
  if (inp) { inp.value = `${cmd} ${target}`; }
  const term = document.getElementById('real-terminal');
  executePenTestReal(cmd, [target], term);
}

async function pollTerminalBackendStatus() {
  const statusEl = document.getElementById('term-backend-status');
  const check = async () => {
    const alive = await isBackendAlive();
    window.backendOnline = alive;
    if (statusEl) {
      statusEl.textContent = alive ? '🟢 Backend online' : '🔴 Backend offline';
      statusEl.style.color = alive ? 'var(--neon)' : 'var(--red)';
    }
  };
  check();
  setInterval(check, 5000);
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  injectTerminalPanel();

  // Immediately check backend status at boot (don't wait for terminal panel)
  (async function bootCheck() {
    try {
      const alive = await isBackendAlive();
      window.backendOnline = alive;
      console.log('[GodEyes] Backend status at boot:', alive ? 'ONLINE' : 'OFFLINE');
    } catch(e) {
      window.backendOnline = false;
    }
  })();

  // Keep polling every 4 seconds
  setInterval(async () => {
    try {
      const alive = await isBackendAlive();
      window.backendOnline = alive;
    } catch(e) {
      window.backendOnline = false;
    }
  }, 4000);

  // Patch showPanel to init terminal when needed
  const prevShow = window.showPanel;
  window.showPanel = function(name) {
    if (prevShow) prevShow(name);
    if (name === 'terminal') setTimeout(initTerminal, 50);
  };
});
