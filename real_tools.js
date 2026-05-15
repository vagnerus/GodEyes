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
    conMsg(consoleEl, '⚠ Backend offline. Ative o Modo Real para usar o Terminal.', 'error');
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
  const target = document.getElementById('scan-range').value;
  const isCloudEnv = window.location.hostname.includes('vercel.app') || 
                    (window.location.hostname !== 'localhost' && !window.location.hostname.startsWith('192.168.'));
  
  // Decide if we use Vercel Serverless API or Local Backend API
  const useCloudAPI = isCloudEnv && !backendOnline;
  
  if (useCloudAPI && (target.includes('/') || target.includes('*'))) {
    showGlobalNotification('☁️ Cloud Mode só suporta IP único. Use o Modo Real para redes inteiras.', 'high');
    return;
  }

  btn.innerHTML = '🛰️ ' + (useCloudAPI ? 'Cloud Scanning...' : 'Real Scanning...');
  btn.disabled = true;

  const wrap = document.getElementById('scan-progress-wrap');
  const fill = document.getElementById('scan-progress-fill');
  const label = document.getElementById('scan-progress-label');
  wrap.style.display = 'flex';
  fill.style.width = '2%';
  label.textContent = useCloudAPI ? 'Iniciando varredura via Cloud...' : 'Iniciando varredura via Nmap...';

  const list = document.getElementById('device-list');
  list.innerHTML = '';
  if (typeof radarBlips !== 'undefined') radarBlips.length = 0;
  if (typeof setStats === 'function') setStats(0, 0, 0, 0);

  try {
    const scanUrl = useCloudAPI ? '/api/scan.py' : `${API}/scan/start`;
    const r = await fetch(scanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: target, type: 'standard' })
    });
    
    if (!r.ok) throw new Error('Falha ao iniciar scan');
    const startData = await r.json();

    if (useCloudAPI) {
      // Logic for CLOUD SCAN (Serverless) - One IP only, fast socket check
      let p = 5;
      const iv = setInterval(() => {
        p += 10;
        if (fill) fill.style.width = p + '%';
        if (p >= 95) {
          clearInterval(iv);
          const devices = [{
            hostname: target,
            ip: target,
            risk: startData.open_ports.length > 2 ? 'high' : 'medium',
            ports: startData.open_ports,
            os: 'Detected via Cloud',
            vendor: 'External Target',
            vulns: startData.open_ports.includes(23) ? [{t:'Telnet Open', d:'Insecure protocol detected', s:'crit'}] : []
          }];
          renderRealDevices(devices);
          finishScanUI(1);
        }
      }, 100);
    } else {
      // Logic for LOCAL SCAN (Backend server.py) - Full Nmap support
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
            renderRealDevices(res.devices);
            finishScanUI(res.count);
          } else if (!st.running) {
              clearInterval(pollInterval);
              finishScanUI();
          }
        } catch (err) {
          clearInterval(pollInterval);
          finishScanUI();
        }
      }, 1500);
    }

  } catch (e) {
    showGlobalNotification(`Erro: ${e.message}`, 'high');
    finishScanUI();
  }
};

function finishScanUI(count) {
  const btn = document.getElementById('scan-btn');
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 3 A9 9 0 0 1 21 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="spin"/></svg> Iniciar Scan';
  }
  document.getElementById('scan-progress-wrap').style.display = 'none';
  if (count !== undefined && typeof showGlobalNotification === 'function')
    showGlobalNotification(`✅ Scan concluído: ${count} dispositivo(s) encontrado(s)`, 'ok');
}

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
  conMsg(term, '  Exemplos: ping 8.8.8.8 | scan 192.168.1.1', 'info');
  conMsg(term, '  clear para limpar o terminal.', 'info');
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
}

// ─────────────────────────────────────────────
// DEVICE INSPECTOR TOOLS
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

  const hdg = document.createElement('h3');
  hdg.style.cssText = 'margin:16px 0 6px;font-size:13px;color:var(--cyan)';
  hdg.textContent = '⚡ Ferramentas Reais';
  inspector.querySelector('.inspector-body')?.appendChild(hdg);
  inspector.querySelector('.inspector-body')?.appendChild(tabsDiv);
}

const _origOpenInspector = window.openInspector;
window.openInspector = function(device) {
  if (_origOpenInspector) _origOpenInspector(device);
  setTimeout(() => patchInspector(device), 100);
};

function injectTerminalPanel() {
  if (document.getElementById('panel-terminal')) return;
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

  const main = document.querySelector('main');
  if (!main) return;
  const section = document.createElement('section');
  section.id = 'panel-terminal';
  section.className = 'panel';
  section.innerHTML = `
    <div class="panel-header">
      <div>
        <h1>Terminal Pentest</h1>
        <p class="panel-sub">Ferramentas reais de segurança — requer backend bridge</p>
      </div>
      <div class="header-actions">
        <div id="term-backend-status" style="padding:6px 14px;border-radius:8px;border:1px solid var(--glass-b);font-size:12px;font-family:var(--mono)">
          🔴 Backend offline
        </div>
        <button class="btn-secondary" onclick="document.getElementById('real-terminal').innerHTML=''">🗑 Limpar</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr;gap:16px;height:calc(100vh - 200px)">
      <div class="glass-card" style="display:flex;flex-direction:column;overflow:hidden">
        <div id="real-terminal" style="flex:1;overflow-y:auto;padding:12px;background:#050810;border-radius:var(--radius) var(--radius) 0 0;font-family:var(--mono);font-size:12px;"></div>
        <div style="display:flex;gap:8px;padding:10px;border-top:1px solid var(--glass-b);background:#08111a;">
          <span style="color:var(--neon);font-family:var(--mono);font-size:13px;align-self:center">$</span>
          <input id="term-input" type="text" class="input-field" placeholder="ping 1.1.1.1  |  banner 192.168.1.1" style="flex:1;font-family:var(--mono);background:transparent;border:none;outline:none;font-size:13px"/>
          <button id="term-send" class="btn-primary" style="min-width:80px">▶ Executar</button>
        </div>
      </div>
    </div>`;
  main.appendChild(section);
  initTerminal();
}

function pollTerminalBackendStatus() {
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

document.addEventListener('DOMContentLoaded', () => {
  injectTerminalPanel();
  pollTerminalBackendStatus();
});
