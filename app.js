/* ═══════════════════════════════════════════
   GodEyes – app.js
   Network Security Dashboard – Full Logic
   ═══════════════════════════════════════════ */

'use strict';

window.realModeActive = true;
window.backendOnline = false;

// ═══ PANEL NAVIGATION ═══
function showPanel(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');
  if (name === 'map') setTimeout(initMap, 100);
}

// ═══ PARTICLE BACKGROUND ═══
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  const PARTICLE_COUNT = 60;

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - .5) * .3,
      vy: (Math.random() - .5) * .3,
      r: Math.random() * 1.5 + .5,
      a: Math.random() * .5 + .1
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,245,160,${p.a})`;
      ctx.fill();
    });
    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,217,245,${0.06 * (1 - dist / 120)})`;
          ctx.lineWidth = .6;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

// ═══ RADAR ANIMATION ═══
const radarCanvas = document.getElementById('radar-canvas');
const rctx = radarCanvas.getContext('2d');
let radarAngle = 0;
let radarBlips = [];

function drawRadar() {
  const W = radarCanvas.width, H = radarCanvas.height;
  const cx = W / 2, cy = H / 2, R = W / 2 - 8;

  rctx.fillStyle = 'rgba(6,10,18,0.25)';
  rctx.fillRect(0, 0, W, H);

  // Grid rings
  [1, .66, .33].forEach(f => {
    rctx.beginPath();
    rctx.arc(cx, cy, R * f, 0, Math.PI * 2);
    rctx.strokeStyle = 'rgba(0,245,160,0.12)';
    rctx.lineWidth = 1;
    rctx.stroke();
  });
  // Crosshairs
  rctx.strokeStyle = 'rgba(0,245,160,0.08)';
  rctx.lineWidth = 1;
  [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(a => {
    rctx.beginPath();
    rctx.moveTo(cx, cy);
    rctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    rctx.stroke();
  });

  // Sweep gradient
  const grad = rctx.createConicalGradient ? null : null;
  // sweep segment
  rctx.save();
  rctx.translate(cx, cy);
  rctx.rotate(radarAngle);
  const sweep = rctx.createLinearGradient(0, 0, R, 0);
  sweep.addColorStop(0, 'rgba(0,245,160,0.0)');
  sweep.addColorStop(1, 'rgba(0,245,160,0.25)');
  rctx.beginPath();
  rctx.moveTo(0, 0);
  rctx.arc(0, 0, R, -Math.PI / 5, 0);
  rctx.closePath();
  rctx.fillStyle = sweep;
  rctx.fill();
  // sweep line
  rctx.beginPath();
  rctx.moveTo(0, 0);
  rctx.lineTo(R, 0);
  rctx.strokeStyle = 'rgba(0,245,160,0.8)';
  rctx.lineWidth = 1.5;
  rctx.shadowColor = '#00f5a0';
  rctx.shadowBlur = 8;
  rctx.stroke();
  rctx.restore();

  radarAngle += 0.025;

  // Blips
  for (let i = radarBlips.length - 1; i >= 0; i--) {
    const b = radarBlips[i];
    b.fade -= .015;
    if (b.fade > 0) {
      rctx.beginPath();
      rctx.arc(cx + b.x, cy + b.y, 4, 0, Math.PI * 2);
      const color = b.risk === 'high' ? '255,59,92' : b.risk === 'medium' ? '255,138,0' : '0,245,160';
      rctx.fillStyle = `rgba(${color},${b.fade})`;
      rctx.shadowColor = `rgb(${color})`;
      rctx.shadowBlur = 8;
      rctx.fill();
      rctx.shadowBlur = 0; // Reset shadow blur after drawing blip
    } else {
      radarBlips.splice(i, 1);
    }
  }

  // Center dot
  rctx.beginPath();
  rctx.arc(cx, cy, 3, 0, Math.PI * 2);
  rctx.fillStyle = '#00f5a0';
  rctx.shadowColor = '#00f5a0';
  rctx.shadowBlur = 10;
  rctx.fill();
  rctx.shadowBlur = 0;

  requestAnimationFrame(drawRadar);
}
drawRadar();

// ═══ DEVICE DATA ═══
let ALL_DEVICES = [
  { id: 1, hostname: 'DESKTOP-ADMPC01',  ip: '192.168.1.10',  mac: 'A4:C3:F0:12:34:56', vendor: 'Dell Inc.',        os: 'Windows 10 Pro',   uptime: '14d 3h',  risk: 'high',   ports: [80, 443, 3389, 135, 445], lat: -23.550, lng: -46.633, vulns: [ { s:'crit', t:'MS17-010 EternalBlue', d:'SMB v1 ativo (porta 445). Alto risco de exploração remota.' }, { s:'warn', t:'RDP Exposto', d:'Porta 3389 acessível sem NLA habilitado.' } ] },
  { id: 2, hostname: 'SRV-WEB-PROD',     ip: '192.168.1.20',  mac: 'B8:27:EB:AB:CD:EF', vendor: 'Raspberry Pi',    os: 'Ubuntu 22.04 LTS', uptime: '62d 12h', risk: 'medium', ports: [80, 443, 22, 8080],       lat: -23.552, lng: -46.638, vulns: [ { s:'warn', t:'OpenSSH 7.2 (desatualizado)', d:'Versão com CVE-2016-6515 - DoS via SSH.' }, { s:'info-v', t:'HTTP sem HSTS', d:'Cabeçalho Strict-Transport-Security ausente.' } ] },
  { id: 3, hostname: 'PRINTER-FLOOR2',   ip: '192.168.1.35',  mac: 'C4:17:FE:55:AA:BB', vendor: 'HP Inc.',          os: 'VxWorks 6.9',      uptime: '190d',    risk: 'high',   ports: [9100, 80, 443, 23],       lat: -23.548, lng: -46.630, vulns: [ { s:'crit', t:'Telnet Habilitado', d:'Protocolo legado sem criptografia na porta 23.' }, { s:'warn', t:'Web Admin sem senha', d:'Interface de administração HTTP sem autenticação.' } ] },
  { id: 4, hostname: 'LAPTOP-DEV-03',    ip: '192.168.1.44',  mac: 'D8:9E:61:23:45:67', vendor: 'Lenovo',           os: 'Windows 11 Pro',   uptime: '2d 6h',   risk: 'low',    ports: [80, 443],                 lat: -23.554, lng: -46.636, vulns: [ { s:'info-v', t:'Firewall pessoal ativo', d:'Apenas portas 80/443 detectadas.' } ] },
  { id: 5, hostname: 'SWITCH-CORE-01',   ip: '192.168.1.1',   mac: '00:1A:A2:FF:BB:01', vendor: 'Cisco Systems',    os: 'IOS 15.2',         uptime: '340d',    risk: 'medium', ports: [22, 23, 80, 161],         lat: -23.549, lng: -46.635, vulns: [ { s:'warn', t:'SNMP v1 habilitado', d:'Comunidade "public" acessível, vazamento de topologia.' }, { s:'info-v', t:'SSH versão 1 ativo', d:'SSHv1 detectado - protocolo obsoleto.' } ] },
  { id: 6, hostname: 'NAS-STORAGE-01',   ip: '192.168.1.60',  mac: 'E4:8D:8C:77:00:A1', vendor: 'Synology',         os: 'DSM 7.1',          uptime: '45d 1h',  risk: 'medium', ports: [5000, 22, 873, 445],      lat: -23.551, lng: -46.641, vulns: [ { s:'warn', t:'Rsync sem autenticação', d:'Porta 873 exposta sem restrição de IP.' } ] },
  { id: 7, hostname: 'CAMERA-HALL',      ip: '192.168.1.80',  mac: 'C8:3A:35:11:22:33', vendor: 'Hikvision',        os: 'Linux (embedded)', uptime: '200d',    risk: 'high',   ports: [80, 554, 8000, 8080],     lat: -23.547, lng: -46.628, vulns: [ { s:'crit', t:'Credenciais padrão ativas', d:'admin:12345 ou admin:admin funcionam neste dispositivo.' }, { s:'crit', t:'CVE-2021-36260 RCE', d:'Vulnerabilidade crítica de execução remota de código.' } ] },
  { id: 8, hostname: 'WORKSTATION-FIN',  ip: '192.168.1.92',  mac: 'F0:1D:BC:44:55:66', vendor: 'ASUS',             os: 'Windows 10 Home',  uptime: '7d 14h',  risk: 'low',    ports: [443],                     lat: -23.553, lng: -46.629, vulns: [ { s:'info-v', t:'Sistema atualizado', d:'Nenhuma vulnerabilidade crítica detectada.' } ] },
];

let visibleDevices = [...ALL_DEVICES];
let mapInstance = null;
let mapInitialized = false;
let currentDevice = null;
let scanDone = false;
let scanInterval = null;

// ═══ SCANNER ═══
async function startScan() {
  if (scanInterval) return;

  // Real Mode Hook – ALWAYS try backend first
  if (typeof isBackendAlive === 'function') {
    try {
      const alive = await isBackendAlive();
      window.backendOnline = alive;
      if (alive && typeof startRealScan === 'function') {
        startRealScan();
        return;
      }
    } catch(e) { /* backend offline, fallback below */ }
  }

  const btn = document.getElementById('scan-btn');
  btn.textContent = '⏳ Escaneando...';
  btn.disabled = true;

  const wrap = document.getElementById('scan-progress-wrap');
  const fill = document.getElementById('scan-progress-fill');
  const label = document.getElementById('scan-progress-label');
  wrap.style.display = 'flex';

  const list = document.getElementById('device-list');
  list.innerHTML = '';
  radarBlips = [];
  setStats(0, 0, 0, 0);

  let progress = 0;
  let deviceIndex = 0;
  const devices = [...ALL_DEVICES];
  const total = devices.length;

  scanInterval = setInterval(() => {
    progress += 100 / (total * 3);
    if (progress > 100) progress = 100;
    fill.style.width = progress + '%';

    const msgs = [
      `Escaneando ${document.getElementById('scan-range').value}...`,
      `Enviando pacotes ARP...`,
      `Detectando serviços...`,
      `Identificando OS...`,
      `Verificando vulnerabilidades...`
    ];
    label.textContent = msgs[Math.floor(progress / 20) % msgs.length];

    if (deviceIndex < total && progress > (deviceIndex + 1) * (100 / total)) {
      const d = devices[deviceIndex++];
      addBlip(d);
      renderDeviceCard(d);
      updateStats();
    }

    if (progress >= 100) {
      clearInterval(scanInterval);
      scanInterval = null;
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Scan Concluído';
      btn.disabled = false;
      label.textContent = `✓ ${total} dispositivos encontrados`;
      scanDone = true;
      if (!mapInitialized) initMap();
      else refreshMapPins();
    }
  }, 280);
}

function renderDeviceCard(d) {
  const list = document.getElementById('device-list');
  const card = document.createElement('div');
  const risk = d.risk || 'low';
  card.className = `device-card ${risk}`;
  card.dataset.risk = risk;
  card.dataset.id = d.id || Math.random().toString(36).substring(7);
  card.onclick = () => openInspector(d);
  card.style.animationDelay = '0ms';
  const safePorts = d.ports || [];
  const portsHtml = safePorts.slice(0, 4).map(p => `<span class="port-pill">${p}</span>`).join('');
  card.innerHTML = `
    <div class="device-card-head">
      <div>
        <div class="device-hostname">${d.hostname}</div>
        <div class="device-ip">${d.ip}</div>
      </div>
      <span class="risk-chip ${d.risk}">${d.risk === 'high' ? 'Alto' : d.risk === 'medium' ? 'Médio' : 'Baixo'}</span>
    </div>
    <div class="device-meta">
      <span>🖥 ${d.os}</span>
      <span>🏭 ${d.vendor}</span>
    </div>
    <div style="margin-top:8px">${portsHtml}${safePorts.length > 4 ? `<span class="port-pill">+${safePorts.length - 4}</span>` : ''}</div>
  `;
  list.appendChild(card);
}

function updateStats() {
  const cards = document.querySelectorAll('.device-card');
  let h = 0, m = 0, l = 0;
  cards.forEach(c => {
    if (c.dataset.risk === 'high') h++;
    else if (c.dataset.risk === 'medium') m++;
    else l++;
  });
  setStats(h + m + l, h, m, l);
}

function setStats(t, h, m, l) {
  document.getElementById('stat-total').textContent = t;
  document.getElementById('stat-high').textContent = h;
  document.getElementById('stat-med').textContent = m;
  document.getElementById('stat-low').textContent = l;
}

function filterDevices(risk, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.device-card').forEach(c => {
    c.style.display = (risk === 'all' || c.dataset.risk === risk) ? 'block' : 'none';
  });
}

// ═══ MAP ═══
function initMap() {
  if (mapInitialized) { refreshMapPins(); return; }
  mapInitialized = true;

  mapInstance = L.map('map', { zoomControl: true, attributionControl: false }).setView([-23.550, -46.633], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(mapInstance);

  refreshMapPins();
}

function refreshMapPins() {
  if (!mapInstance) return;
  const devs = scanDone ? ALL_DEVICES : [];
  devs.forEach(d => {
    const color = d.risk === 'high' ? '#ff3b5c' : d.risk === 'medium' ? '#ff8a00' : '#00f5a0';
    const shadow = d.risk === 'high' ? 'rgba(255,59,92,.7)' : d.risk === 'medium' ? 'rgba(255,138,0,.7)' : 'rgba(0,245,160,.7)';
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};box-shadow:0 0 12px ${shadow},0 0 4px ${shadow};border:2px solid rgba(255,255,255,.3);cursor:pointer;"></div>`,
      iconSize: [16, 16], iconAnchor: [8, 8], popupAnchor: [0, -12]
    });
    const marker = L.marker([d.lat, d.lng], { icon }).addTo(mapInstance);
    marker.bindPopup(`
      <div style="font-family:'Inter',sans-serif;min-width:180px;">
        <strong>${d.hostname}</strong><br/>
        <span style="font-family:monospace;font-size:12px;color:#64748b">${d.ip}</span><br/>
        <span style="color:${color};font-size:11px;font-weight:700;text-transform:uppercase">${d.risk === 'high' ? 'Alto Risco' : d.risk === 'medium' ? 'Médio Risco' : 'Baixo Risco'}</span>
      </div>
    `, { className: 'dark-popup' });
    marker.on('click', () => { openInspector(d); });
  });
}

function recenterMap() {
  if (mapInstance) mapInstance.setView([-23.550, -46.633], 14);
}

// ═══ DEVICE INSPECTOR ═══
function openInspector(d) {
  currentDevice = d;
  document.getElementById('insp-hostname').textContent = d.hostname;
  document.getElementById('insp-ip').textContent = d.ip;
  const riskLabel = d.risk === 'high' ? 'Alto Risco' : d.risk === 'medium' ? 'Médio Risco' : 'Baixo Risco';
  const badge = document.getElementById('insp-risk');
  badge.textContent = riskLabel;
  badge.className = 'risk-badge ' + d.risk;
  document.getElementById('insp-mac').textContent = d.mac;
  document.getElementById('insp-vendor').textContent = d.vendor;
  document.getElementById('insp-os').textContent = d.os;
  document.getElementById('insp-uptime').textContent = d.uptime;

  const portEl = document.getElementById('insp-ports');
  portEl.innerHTML = d.ports.map(p => `<span class="port-pill">${p}</span>`).join('');

  const vulnEl = document.getElementById('insp-vulns');
  vulnEl.innerHTML = d.vulns.map(v => `
    <div class="vuln-item ${v.s}">
      <div class="vuln-title">${v.t}</div>
      <div class="vuln-desc">${v.d}</div>
    </div>
  `).join('');

  document.getElementById('device-inspector').classList.add('open');
  document.getElementById('overlay').classList.add('show');
}

function closeInspector() {
  document.getElementById('device-inspector').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

function pingDevice() {
  if (!currentDevice) return;
  showPanel('pentest');
  closeInspector();
  document.getElementById('pt-target').value = currentDevice.ip;
  document.getElementById('pt-type').value = 'port';
  setTimeout(() => appendConsole(`$ ping -c 4 ${currentDevice.ip}`, 'info'), 200);
  setTimeout(() => simulatePing(currentDevice.ip), 400);
}

function simulatePing(ip) {
  const times = Array.from({length:4}, () => (Math.random()*20+1).toFixed(2));
  times.forEach((t, i) => {
    setTimeout(() => appendConsole(`64 bytes from ${ip}: icmp_seq=${i+1} ttl=64 time=${t} ms`), i * 300);
  });
  setTimeout(() => appendConsole(`\n--- ${ip} ping statistics ---`), 1400);
  setTimeout(() => appendConsole(`4 packets transmitted, 4 received, 0% packet loss`, 'success'), 1700);
}

function tracerouteDevice() {
  if (!currentDevice) return;
  showPanel('pentest');
  closeInspector();
  document.getElementById('pt-target').value = currentDevice.ip;
  setTimeout(() => appendConsole(`$ traceroute ${currentDevice.ip}`, 'info'), 200);
  setTimeout(() => runTraceroute(currentDevice.ip), 400);
}

function runTraceroute(ip) {
  const hops = Math.floor(Math.random() * 5) + 3;
  appendConsole(`traceroute to ${ip} (${ip}), 30 hops max`);
  for (let i = 1; i <= hops; i++) {
    const ms1 = (Math.random() * 15 + 1).toFixed(2);
    const ms2 = (Math.random() * 15 + 1).toFixed(2);
    const ms3 = (Math.random() * 15 + 1).toFixed(2);
    const hop_ip = i < hops ? `192.168.1.${i}` : ip;
    setTimeout(() => appendConsole(` ${i}  ${hop_ip}  ${ms1} ms  ${ms2} ms  ${ms3} ms`), i * 250);
  }
}

function launchPenTest() {
  if (!currentDevice) return;
  showPanel('pentest');
  closeInspector();
  document.getElementById('pt-target').value = currentDevice.ip;
  setTimeout(runPenTest, 300);
}

// ═══ PEN-TEST CONSOLE ═══
const penTestScripts = {
  port: (ip, ports) => [
    { t:0,   cls:'info',    txt:`Starting Nmap 7.94 ( https://nmap.org )` },
    { t:300, cls:'',        txt:`Nmap scan report for ${ip}` },
    { t:500, cls:'',        txt:`Host is up (0.0012s latency).` },
    { t:700, cls:'',        txt:`PORT      STATE  SERVICE    VERSION` },
    ...ports.map((p, i) => ({ t: 900 + i * 200, cls: p === 23 || p === 3389 ? 'warn' : 'success', txt: `${String(p).padEnd(9)} open   ${getService(p).padEnd(10)} ${getBanner(p)}` })),
    { t: 900 + ports.length * 200 + 200, cls:'success', txt:`\nNmap done: 1 IP address (1 host up) scanned in ${(Math.random()*4+1).toFixed(2)}s` }
  ],
  vuln: (ip) => [
    { t:0,   cls:'info',  txt:`[*] Iniciando varredura de vulnerabilidades em ${ip}` },
    { t:400, cls:'',      txt:`[*] Carregando base CVE...` },
    { t:900, cls:'warn',  txt:`[!] CVE-2021-44228 Log4Shell – CRÍTICO (score 10.0)` },
    { t:1200,cls:'warn',  txt:`[!] CVE-2022-30216 Windows Server – ALTO (score 8.1)` },
    { t:1600,cls:'',      txt:`[*] Verificando serviços web...` },
    { t:2000,cls:'warn',  txt:`[!] Cabeçalhos de segurança ausentes: X-Frame-Options, CSP` },
    { t:2400,cls:'success',txt:`[+] Relatório salvo em report_${ip.replace(/\./g,'_')}.json` }
  ],
  brute: (ip, ports) => [
    { t:0,   cls:'info',  txt:`[*] Iniciando ataque de dicionário em ${ip}` },
    { t:300, cls:'',      txt:`[*] Wordlist: rockyou.txt (14M senhas)` },
    { t:600, cls:'',      txt:`[*] Tentando SSH (porta ${ports.includes(22)?22:'21'})...` },
    { t:1000,cls:'',      txt:`[-] admin:admin       FALHOU` },
    { t:1200,cls:'',      txt:`[-] admin:password    FALHOU` },
    { t:1400,cls:'',      txt:`[-] root:123456       FALHOU` },
    { t:1800,cls:'warn',  txt:`[+] ACESSO ENCONTRADO: guest:guest123   ← FRACO` },
    { t:2200,cls:'success',txt:`[+] Login obtido via ${ports.includes(22)?'SSH':'FTP'}!` }
  ],
  arp: (ip) => [
    { t:0,   cls:'info',  txt:`[*] Monitorando ARP na rede...` },
    { t:500, cls:'',      txt:`[*] Gateway detectado: 192.168.1.1 (00:1A:A2:FF:BB:01)` },
    { t:1000,cls:'',      txt:`[*] Analisando tabela ARP...` },
    { t:1500,cls:'warn',  txt:`[!] Duplicidade MAC detectada para 192.168.1.1` },
    { t:2000,cls:'warn',  txt:`[!] Possível ARP Spoofing em andamento!` },
    { t:2400,cls:'',      txt:`[*] IP suspeito: 192.168.1.147 → mesmo MAC que gateway` }
  ],
  sniff: (ip) => [
    { t:0,   cls:'info',  txt:`[*] Iniciando captura de pacotes (interface: eth0)` },
    { t:400, cls:'',      txt:`[*] Filtro: host ${ip}` },
    { t:800, cls:'',      txt:`14:22:01 192.168.1.1 → ${ip}   TCP 443 → 49152` },
    { t:1000,cls:'',      txt:`14:22:01 ${ip} → 8.8.8.8       DNS Query: api.example.com` },
    { t:1200,cls:'warn',  txt:`14:22:02 ${ip} → 192.168.1.35  TCP 9100 (RAW PRINT UNENCRYPTED)` },
    { t:1600,cls:'success',txt:`[+] Captura concluída: 47 pacotes analisados` }
  ],
  exploit: (ip, ports) => [
    { t:0,   cls:'info',  txt:`msf6 > use exploit/multi/handler` },
    { t:300, cls:'',      txt:`msf6 exploit(multi/handler) > set RHOSTS ${ip}` },
    { t:600, cls:'',      txt:`RHOSTS => ${ip}` },
    { t:900, cls:'',      txt:`msf6 exploit(multi/handler) > set PAYLOAD windows/x64/meterpreter/reverse_tcp` },
    { t:1200,cls:'',      txt:`PAYLOAD => windows/x64/meterpreter/reverse_tcp` },
    { t:1500,cls:'info',  txt:`msf6 exploit(multi/handler) > run` },
    { t:2000,cls:'warn',  txt:`[*] Started reverse TCP handler on 0.0.0.0:4444` },
    { t:2500,cls:'success',txt:`[*] Meterpreter session 1 opened (simulação)` },
    { t:2900,cls:'success',txt:`meterpreter > sysinfo\nComputer: ${ip}\nOS: Windows 10\nArch: x64` }
  ]
};

function getService(port) {
  const s = {22:'ssh',80:'http',443:'https',3389:'ms-wbt-server',135:'msrpc',445:'microsoft-ds',8080:'http-proxy',21:'ftp',23:'telnet',9100:'jetdirect',554:'rtsp',8000:'http-alt',5000:'upnp',161:'snmp',873:'rsync'};
  return s[port] || 'unknown';
}
function getBanner(port) {
  const b = {22:'OpenSSH 7.4p1',80:'Apache/2.4.41',443:'nginx/1.18.0',3389:'Microsoft RDP',445:'Samba 4.9',23:'Linux telnetd',9100:'HP LaserJet 4200',22:'OpenSSH_7.4',161:'Net-SNMP 5.7.3'};
  return b[port] || '';
}

let intensity = 'stealth';
function setIntensity(btn, val) {
  intensity = val;
  document.querySelectorAll('.intensity-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function runPenTest() {
  const target = document.getElementById('pt-target').value.trim();
  const type = document.getElementById('pt-type').value;
  if (!target) { appendConsole('[ERRO] Defina um alvo.', 'error'); return; }

  const device = ALL_DEVICES.find(d => d.ip === target) || { ports: [80, 443, 22], ip: target };
  const script = penTestScripts[type] ? penTestScripts[type](target, device.ports) : [];

  appendConsole(`\n$ godeyes --target ${target} --scan ${type} --intensity ${intensity}`, 'info');
  script.forEach(line => {
    setTimeout(() => appendConsole(line.txt, line.cls || ''), line.t + 200);
  });
}

function clearConsole() {
  document.getElementById('console-output').innerHTML = '<div class="console-line dim">Console limpo.</div>';
}

function appendConsole(text, cls = '') {
  const out = document.getElementById('console-output');
  const div = document.createElement('div');
  div.className = 'console-line' + (cls ? ' ' + cls : '');
  div.textContent = text;
  out.appendChild(div);
  out.scrollTop = out.scrollHeight;
}

function consoleKeydown(e) {
  if (e.key === 'Enter') {
    const cmd = document.getElementById('console-cmd').value.trim();
    if (!cmd) return;
    appendConsole('$ ' + cmd, 'info');
    document.getElementById('console-cmd').value = '';
    setTimeout(() => appendConsole('Comando registrado: ' + cmd + '\n(Aguardando backend para execução real.)', 'dim'), 200);
  }
}

// ═══ VPN ═══
const VPN_SERVERS = [
  { flag:'🇧🇷', name:'São Paulo, BR',   ping:12,  proto:'WireGuard', enc:'ChaCha20', ip:'177.53.44.12'  },
  { flag:'🇺🇸', name:'Nova York, US',   ping:98,  proto:'OpenVPN',   enc:'AES-256',  ip:'157.230.12.77' },
  { flag:'🇩🇪', name:'Frankfurt, DE',   ping:140, proto:'WireGuard', enc:'ChaCha20', ip:'188.34.187.99' },
  { flag:'🇳🇱', name:'Amsterdã, NL',    ping:145, proto:'IKEv2',     enc:'AES-128',  ip:'94.23.45.102'  },
  { flag:'🇯🇵', name:'Tóquio, JP',      ping:210, proto:'WireGuard', enc:'ChaCha20', ip:'45.76.55.90'   },
  { flag:'🇸🇬', name:'Singapura, SG',   ping:185, proto:'OpenVPN',   enc:'AES-256',  ip:'128.199.77.44' },
  { flag:'🇨🇭', name:'Zurique, CH',     ping:155, proto:'WireGuard', enc:'ChaCha20', ip:'185.94.192.12' },
];

let vpnOn = false;
let selectedServer = VPN_SERVERS[0];

(function renderVPNServers() {
  const list = document.getElementById('vpn-server-list');
  VPN_SERVERS.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'server-item' + (i === 0 ? ' active' : '');
    el.dataset.i = i;
    el.onclick = () => selectServer(i);
    const pingClass = s.ping < 50 ? 'fast' : s.ping < 150 ? 'med' : '';
    el.innerHTML = `
      <span class="server-flag">${s.flag}</span>
      <div class="server-info">
        <div class="server-name">${s.name}</div>
        <div class="server-ping ${pingClass}">Ping: ${s.ping}ms · ${s.proto}</div>
      </div>
    `;
    list.appendChild(el);
  });
})();

function selectServer(i) {
  selectedServer = VPN_SERVERS[i];
  document.querySelectorAll('.server-item').forEach((el, j) => {
    el.classList.toggle('active', j === i);
  });
  if (vpnOn) {
    logVPN(`Trocando para ${selectedServer.name}...`, 'vpn-log-line');
    setTimeout(() => { 
      logVPN(`Conectado a ${selectedServer.name}`, 'vpn-log-line ok'); 
      updateVPNInfo(); 
    }, 800);
    if (window.backendOnline) {
      // In real mode, configure the backend to use this proxy
      // VPN format: Use a generic SOCKS or HTTP endpoint if this were a true system tunnel,
      // Here we map the simulated VPN directly to our proxy tool backend for IP routing
      // For demonstration in real mode, we will format it as http proxy using the ip if it supports it,
      // but typically we'll rely on the dedicated proxy panel. We will hit /api/proxy/set.
      // E.g., pretend it's a wireguard/socks proxy at that IP on port 1080
      fetch(API + '/proxy/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxy: `socks5://${selectedServer.ip}:1080` })
      }).catch(e=>console.error);
    }
  }
}

async function toggleVPN() {
  vpnOn = !vpnOn;
  const toggle = document.getElementById('vpn-toggle');
  const label = document.getElementById('vpn-toggle-label');
  const badge = document.getElementById('vpn-badge');
  toggle.classList.toggle('on', vpnOn);
  label.textContent = vpnOn ? 'ON' : 'OFF';

  if (vpnOn) {
    badge.textContent = 'CONECTANDO...';
    badge.className = 'vpn-status-badge';
    logVPN('Iniciando túnel VPN...', 'vpn-log-line');
    logVPN('Buscando proxies reais verificados...', 'vpn-log-line');

    try {
      // Step 1: Fetch real working proxies
      const fetchRes = await fetch(API + '/proxy/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protocol: 'socks5', max_test: 30 })
      });
      const fetchData = await fetchRes.json();
      
      if (!fetchData.proxies || fetchData.proxies.length === 0) {
        // Try HTTP proxies as fallback
        logVPN('SOCKS5 vazio, tentando HTTP...', 'vpn-log-line');
        const fetchRes2 = await fetch(API + '/proxy/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ protocol: 'http', max_test: 30 })
        });
        const fetchData2 = await fetchRes2.json();
        if (!fetchData2.proxies || fetchData2.proxies.length === 0) {
          throw new Error('Nenhum proxy funcional encontrado');
        }
        fetchData.proxies = fetchData2.proxies;
      }

      const proxies = fetchData.proxies;
      logVPN(`${proxies.length} proxies funcionais encontrados!`, 'vpn-log-line ok');

      // Step 2: Connect through the first working proxy  
      const chosen = proxies[0];
      logVPN(`Conectando via ${chosen.proto}://${chosen.addr}...`, 'vpn-log-line');

      const connRes = await fetch(API + '/proxy/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addr: chosen.addr, proto: chosen.proto })
      });
      const connData = await connRes.json();

      if (connData.connected) {
        logVPN(`Handshake concluído`, 'vpn-log-line ok');
        logVPN(`IP REAL ROTEADO: ${connData.ip}`, 'vpn-log-line ok');
        logVPN(`Localização: ${connData.loc}`, 'vpn-log-line ok');

        // Step 3: Set SYSTEM proxy (HTTP only — SOCKS breaks browser)
        // Find an HTTP proxy for system proxy, or use current if HTTP
        let httpProxy = null;
        if (chosen.proto === 'http') {
          httpProxy = chosen.addr;
        } else {
          // Try to find an HTTP proxy from the fetched list
          const httpOnes = proxies.filter(p => p.proto === 'http');
          if (httpOnes.length > 0) httpProxy = httpOnes[0].addr;
        }

        if (httpProxy) {
          logVPN('Configurando proxy HTTP do sistema Windows...', 'vpn-log-line');
          try {
            const sysRes = await fetch(API + '/proxy/system', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ enable: true, proxy: httpProxy })
            });
            const sysData = await sysRes.json();
            if (sysData.success) {
              logVPN(`Proxy sistema: ${httpProxy} ✓`, 'vpn-log-line ok');
              logVPN('Recarregue o navegador (F5) para aplicar', 'vpn-log-line ok');
            } else {
              logVPN(`Aviso: ${sysData.error}`, 'vpn-log-line err');
            }
          } catch(sysErr) {
            logVPN('Aviso: proxy sistema indisponível', 'vpn-log-line err');
          }
        } else {
          logVPN('Proxy SOCKS ativo (backend apenas)', 'vpn-log-line');
          logVPN('Sistema proxy requer HTTP - não disponível', 'vpn-log-line');
        }

        logVPN(`Túnel estabelecido ✓`, 'vpn-log-line ok');
        badge.textContent = 'CONECTADO';
        badge.className = 'vpn-status-badge connected';

        // Update VPN info with REAL data
        document.getElementById('vpn-ext-ip').textContent = connData.ip;
        document.getElementById('vpn-proto').textContent = chosen.proto.toUpperCase();
        document.getElementById('vpn-enc').textContent = 'AES-256';
        document.getElementById('vpn-lat').textContent = '~' + selectedServer.ping + ' ms';

        // Update the selected server visual to match real proxy
        selectedServer = { ...selectedServer, ip: connData.ip };
      } else {
        throw new Error(connData.error || 'Falha na conexão');
      }

    } catch(e) {
      logVPN(`Erro: ${e.message}`, 'vpn-log-line err');
      badge.textContent = 'ERRO';
      badge.className = 'vpn-status-badge';
      vpnOn = false;
      toggle.classList.remove('on');
      label.textContent = 'OFF';
    }

  } else {
    // Disconnect: clear proxy
    badge.textContent = 'DESCONECTADO';
    badge.className = 'vpn-status-badge';
    logVPN('Desconectando VPN...', 'vpn-log-line');

    try {
      // Disable system proxy first
      await fetch(API + '/proxy/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: false })
      });
      logVPN('Proxy do sistema desativado', 'vpn-log-line');
    } catch(e) {}

    try {
      await fetch(API + '/proxy/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxy: null })
      });
    } catch(e) {}

    // Verify real IP restored
    try {
      const ipRes = await fetch(API + '/ip/check');
      const ipData = await ipRes.json();
      logVPN(`IP restaurado: ${ipData.ip} (${ipData.loc})`, 'vpn-log-line');
    } catch(e) {}

    logVPN('Desconectado da VPN', 'vpn-log-line err');
    document.getElementById('vpn-ext-ip').textContent = '–';
    document.getElementById('vpn-proto').textContent = '–';
    document.getElementById('vpn-enc').textContent = '–';
    document.getElementById('vpn-lat').textContent = '–';
  }
}

function updateVPNInfo() {
  document.getElementById('vpn-ext-ip').textContent = selectedServer.ip;
  document.getElementById('vpn-proto').textContent = selectedServer.proto;
  document.getElementById('vpn-enc').textContent = selectedServer.enc;
  document.getElementById('vpn-lat').textContent = selectedServer.ping + ' ms';
  
  if (window.backendOnline) {
      checkIP(); // Force an IP verification against the real backend
  }
}

function logVPN(msg, cls) {
  const log = document.getElementById('vpn-log');
  const now = new Date();
  const ts = now.toTimeString().slice(0,8);
  const line = document.createElement('div');
  line.className = cls;
  line.textContent = `[${ts}] ${msg}`;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

// ═══ PROXY / IP ROUTER (REAL) ═══
// Live proxy pool — populated from backend
let PROXY_POOL = { socks5: [], http: [], socks4: [] };
let _fetchedProxies = []; // raw from backend

const PROXY_CHAIN_NODES = [
  { icon:'🖥️', label:'Sua Máquina',     sub:'192.168.1.114 (local)' },
  { icon:'🔒', label:'Proxy Anônimo',    sub:'Aguardando conexão...' },
  { icon:'🎯', label:'Destino',          sub:'Alvo da conexão' }
];

let currentProxyType = 'socks5';
let activeProxyIndex = -1;

(async function initProxy() {
  renderProxyChain();
  renderProxyPoolUI('socks5');
  // Show real IP on load
  checkIP();
  // Fetch real proxies in background
  fetchRealProxies();
})();

async function fetchRealProxies() {
  const list = document.getElementById('proxy-pool-list');
  if (list) list.innerHTML = '<div style="color:#0ff;padding:8px;font-size:11px">⏳ Buscando proxies reais...</div>';
  try {
    const r = await fetch(API + '/proxy/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ max_test: 60 })
    });
    const data = await r.json();
    _fetchedProxies = data.proxies || [];

    // Split into protocol groups
    PROXY_POOL = { socks5: [], http: [], socks4: [] };
    _fetchedProxies.forEach(p => {
      const proto = p.proto || 'http';
      if (!PROXY_POOL[proto]) PROXY_POOL[proto] = [];
      PROXY_POOL[proto].push({
        ip: p.addr,
        country: '🌐',
        ping: '?',
        status: 'online',
        proto: proto,
        realIp: p.ip
      });
    });

    // Auto-select the first non-empty type
    if (PROXY_POOL.socks5.length) currentProxyType = 'socks5';
    else if (PROXY_POOL.http.length) currentProxyType = 'http';
    else if (PROXY_POOL.socks4.length) currentProxyType = 'socks4';

    // Update tab counts
    document.querySelectorAll('.proxy-type-row .filter-btn').forEach(btn => {
      const type = btn.getAttribute('onclick')?.match(/switchProxyType\('(\w+)'/)?.[1];
      if (type && PROXY_POOL[type]) {
        btn.textContent = `${type.toUpperCase()} (${PROXY_POOL[type].length})`;
      }
    });

    renderProxyPoolUI(currentProxyType);
    // Auto-highlight the active tab
    document.querySelectorAll('.proxy-type-row .filter-btn').forEach(btn => {
      const type = btn.getAttribute('onclick')?.match(/switchProxyType\('(\w+)'/)?.[1];
      btn.classList.toggle('active', type === currentProxyType);
    });

  } catch(e) {
    if (list) list.innerHTML = '<div style="color:#f55;padding:8px;font-size:11px">❌ Backend offline</div>';
  }
}

function renderProxyChain() {
  const el = document.getElementById('proxy-chain');
  if (!el) return;
  el.innerHTML = PROXY_CHAIN_NODES.map((n, i) => `
    <div class="chain-node">
      <div class="chain-icon">${n.icon}</div>
      <div>
        <div class="chain-label">${n.label}</div>
        <div class="chain-sub">${n.sub}</div>
      </div>
      ${i > 0 && i < PROXY_CHAIN_NODES.length -1 ? '<span class="chain-status"></span>' : ''}
    </div>
  `).join('');
}

function renderProxyPoolUI(type) {
  const list = document.getElementById('proxy-pool-list');
  if (!list) return;
  const pool = PROXY_POOL[type] || [];
  if (pool.length === 0) {
    list.innerHTML = '<div style="color:#888;padding:8px;font-size:11px">Nenhum proxy disponível</div>';
    return;
  }
  list.innerHTML = '';
  pool.forEach((p, i) => {
    const el = document.createElement('div');
    el.className = 'proxy-item' + (i === activeProxyIndex ? ' active' : '');
    el.onclick = () => connectProxy(i, type);
    el.innerHTML = `
      <span class="proxy-dot ${p.status}"></span>
      <span class="proxy-item-addr">${p.country} ${p.ip}</span>
      <span class="proxy-item-ping" style="font-size:10px;color:#0f8">${p.realIp || ''}</span>
    `;
    list.appendChild(el);
  });
}

async function connectProxy(i, type) {
  const pool = PROXY_POOL[type] || [];
  const proxy = pool[i];
  if (!proxy) return;

  activeProxyIndex = i;
  renderProxyPoolUI(type);

  const ipEl = document.getElementById('current-ip');
  const locEl = document.getElementById('current-ip-loc');
  const anonEl = document.getElementById('anon-level');
  const barEl = document.getElementById('ip-meter-bar');

  ipEl.textContent = 'Conectando...';
  locEl.textContent = '';

  try {
    const r = await fetch(API + '/proxy/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addr: proxy.ip, proto: proxy.proto })
    });
    const data = await r.json();

    if (data.connected) {
      ipEl.textContent = data.ip;
      locEl.textContent = data.loc || 'Desconhecido';
      anonEl.textContent = 'Alto (Proxy Real)';
      barEl.style.width = '85%';

      // Update chain visual
      PROXY_CHAIN_NODES[1] = {
        icon: '🔒',
        label: `Proxy ${proxy.proto.toUpperCase()}`,
        sub: `${proxy.ip} → IP: ${data.ip}`
      };
      renderProxyChain();
      appendConsole(`[Proxy] Conectado via ${proxy.proto}://${proxy.ip} → IP: ${data.ip} (${data.loc})`, 'success');
    } else {
      ipEl.textContent = 'Falhou';
      locEl.textContent = data.error || 'Proxy offline';
      anonEl.textContent = 'Falha';
      barEl.style.width = '5%';
      appendConsole(`[Proxy] Falha: ${data.error}`, 'error');
    }
  } catch(e) {
    ipEl.textContent = 'Erro';
    locEl.textContent = e.message;
    appendConsole(`[Proxy] Erro: ${e.message}`, 'error');
  }
}

function selectProxy(i, type) {
  connectProxy(i, type);
}

function switchProxyType(type, btn) {
  currentProxyType = type;
  activeProxyIndex = -1;
  document.querySelectorAll('.proxy-type-row .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderProxyPoolUI(type);
}

function setRandomIP() {
  checkIP();
}

function rotateIP() {
  const pool = PROXY_POOL[currentProxyType] || [];
  if (pool.length === 0) { checkIP(); return; }
  activeProxyIndex = (activeProxyIndex + 1) % pool.length;
  connectProxy(activeProxyIndex, currentProxyType);
}

async function checkIP() {
  const el = document.getElementById('current-ip');
  if (!el) return;
  el.style.animation = 'none';
  setTimeout(() => { el.style.animation = ''; }, 10);

  try {
    el.textContent = 'Verificando...';
    const r = await fetch(API + '/ip/check');
    const data = await r.json();
    if (data.ip) {
      el.textContent = data.ip;
      document.getElementById('current-ip-loc').textContent = data.loc || 'Desconhecido';
      const isProxied = data.proxy === true;
      document.getElementById('anon-level').textContent = isProxied ? 'Alto (Proxy Real)' : 'Baixo (Transparente)';
      document.getElementById('ip-meter-bar').style.width = isProxied ? '85%' : '15%';
      appendConsole(`[IP Check] ${data.ip} · ${data.loc} · ${data.proxy_note || ''}`, 'success');
    } else {
      el.textContent = 'Erro';
      appendConsole(`[IP Check] ${data.error}`, 'error');
    }
  } catch(e) {
    el.textContent = 'Offline';
    appendConsole(`[IP Check] ${e.message}`, 'error');
  }
}

async function shuffleChain() {
  // Fetch new proxies from backend
  appendConsole('[Proxy] Buscando novos proxies...', 'info');
  await fetchRealProxies();
  // Auto-connect to first available
  const pool = PROXY_POOL[currentProxyType] || [];
  if (pool.length > 0) {
    const randomIdx = Math.floor(Math.random() * pool.length);
    connectProxy(randomIdx, currentProxyType);
  }
}

/* ════════════════════════════════════════════════════
   BACKEND REAL – Integração com server.py (nmap real)
   ════════════════════════════════════════════════════ */
const BACKEND_URL = localStorage.getItem('godeyes_backend') || window.location.origin;
const API_BASE = BACKEND_URL + '/api';

window.setBackend = function(url) {
    if(url) {
        localStorage.setItem('godeyes_backend', url.replace(/\/$/, ''));
        alert('Backend configurado com sucesso! A página será recarregada.');
        location.reload();
    }
};

// Se estiver rodando na Nuvem (Vercel, Netlify, Github Pages), solicita o Link do Túnel.
if (window.location.hostname.includes('vercel.app') || window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !window.location.hostname.startsWith('192.168.') && !window.location.hostname.startsWith('10.')) {
    if (!localStorage.getItem('godeyes_backend')) {
        setTimeout(() => {
            let url = prompt("☁️ VERCEL / NUVEM DETECTADO:\n\nPara o terminal e scanner funcionarem, o painel precisa se conectar ao Backend Local.\n\nCole aqui o link do Túnel (ex: https://xxxx.lhr.life):");
            if (url) window.setBackend(url);
        }, 1500);
    }
}
let backendOnline = false;
let realModeActive = true; // Default to TRUE - The real tool gets priority!
let scanPollInterval = null;

// ── Check if backend server is running ──
async function checkBackendStatus() {
  try {
    const res = await fetch(API_BASE + '/status', { signal: AbortSignal.timeout(2000) });
    const data = await res.json();
    backendOnline = data.online === true;
  } catch (_) {
    backendOnline = false;
    realModeActive = false; // Fall back to mocked behavior if server stops
  }
  updateBackendIndicator();
}

function updateBackendIndicator() {
  const btn = document.getElementById('real-mode-btn');
  const dot = document.getElementById('backend-status-dot');
  if (dot) {
    dot.style.background = backendOnline ? 'var(--neon)' : 'var(--red)';
    dot.title = backendOnline ? 'Backend online' : 'Backend offline';
  }
  if (btn) {
    btn.style.borderColor = realModeActive && backendOnline
      ? 'rgba(0,245,160,.5)' : '';
    btn.style.color = realModeActive && backendOnline
      ? 'var(--neon)' : '';
  }
}

// Poll backend every 5s
setInterval(checkBackendStatus, 5000);
checkBackendStatus();

// ── Toggle Real Mode ──
function toggleRealMode() {
  if (!backendOnline) {
    if (typeof showGlobalNotification === 'function') {
      showGlobalNotification('⚠ Backend offline. Execute iniciar_servidor.bat primeiro.', 'high');
    }
    return;
  }
  realModeActive = !realModeActive;
  const btn = document.getElementById('real-mode-btn');
  if (btn) btn.textContent = realModeActive ? '🟢 REAL' : '🔵 SIM';
  updateBackendIndicator();
  if (typeof showGlobalNotification === 'function') {
    showGlobalNotification(
      realModeActive ? '🟢 Modo Real ativo – próximo scan usará nmap real' : '🔵 Modo Simulação ativo',
      realModeActive ? 'ok' : 'ok'
    );
  }
}

// ── Real Scan via Backend ──
async function startRealScan() {
  const range   = document.getElementById('scan-range')?.value || '127.0.0.1';
  const ptType  = document.getElementById('pt-type')?.value;
  const scanType = ptType === 'vuln' ? 'vuln' : 'fast'; // Use 'fast' (-sn) to avoid nmap privilege errors in standard mode

  // Reset UI
  document.getElementById('device-list').innerHTML = '';
  document.getElementById('scan-progress-wrap').style.display = 'flex';
  const fillEl   = document.getElementById('scan-progress-fill');
  const labelEl  = document.getElementById('scan-progress-label');
  const scanBtn  = document.getElementById('scan-btn');
  if (scanBtn) { scanBtn.disabled = true; scanBtn.textContent = 'Escaneando...'; }

  try {
    // Start scan
    const startRes = await fetch(API_BASE + '/scan/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: range, type: scanType })
    });
    const startData = await startRes.json();
    if (!startRes.ok) {
      if (typeof showGlobalNotification === 'function')
        showGlobalNotification('❌ ' + (startData.error || 'Erro ao iniciar scan'), 'high');
      finishScanUI();
      return;
    }

    // Poll for progress
    scanPollInterval = setInterval(async () => {
      try {
        const statusRes = await fetch(API_BASE + '/scan/status');
        const status = await statusRes.json();
        if (fillEl) fillEl.style.width = (status.progress || 0) + '%';
        if (labelEl) labelEl.textContent = status.message || 'Escaneando...';

        if (!status.running) {
          clearInterval(scanPollInterval);
          // Fetch results
          const resultRes = await fetch(API_BASE + '/scan/results');
          const resultData = await resultRes.json();
          renderRealDevices(resultData.devices || []);
          finishScanUI(resultData.devices?.length || 0);
          if (typeof saveScanToHistory === 'function') saveScanToHistory();
        }
      } catch (_) {
        clearInterval(scanPollInterval);
        finishScanUI();
      }
    }, 1500);

  } catch (err) {
    if (typeof showGlobalNotification === 'function')
      showGlobalNotification('❌ Erro de conexão com backend: ' + err.message, 'high');
    finishScanUI();
  }
}

function finishScanUI(count) {
  const scanBtn = document.getElementById('scan-btn');
  if (scanBtn) { scanBtn.disabled = false; scanBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 3 A9 9 0 0 1 21 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="spin"/></svg> Iniciar Scan'; }
  document.getElementById('scan-progress-wrap').style.display = 'none';
  const labelEl = document.getElementById('scan-progress-label');
  if (labelEl) labelEl.textContent = 'Escaneando...';
  if (count !== undefined && typeof showGlobalNotification === 'function')
    showGlobalNotification(`✅ Scan real concluído: ${count} dispositivos encontrados`, 'ok');
}

// ── Render Real Devices (reuses existing device renderer) ──
function renderRealDevices(devices) {
  // Normalize to match ALL_DEVICES format expected by existing render
  ALL_DEVICES = devices.map(d => ({
    hostname: d.hostname || d.ip,
    ip:       d.ip,
    mac:      d.mac || '–',
    vendor:   d.vendor || '–',
    os:       d.os || 'Desconhecido',
    risk:     d.risk || 'low',
    ports:    d.ports || [],
    services: d.services || [],
    uptime:   d.uptime || '–',
    vulns:    (d.vulns || []).map(v => ({
      t: v.id,
      d: v.desc,
      s: v.sev,
      c: v.cvss,
    })),
    lat: d.lat || -23.5 + (Math.random() - 0.5) * 0.1,
    lng: d.lng || -46.6 + (Math.random() - 0.5) * 0.1,
  }));

  // Clear container
  const c = document.getElementById('device-list');
  c.innerHTML = '';
  
  // Stagger rendering to create the scanning visual effect with blips
  ALL_DEVICES.forEach((d, idx) => {
      setTimeout(() => {
          addBlip(d);
          renderDeviceCard(d);
          updateStats();
      }, idx * 100);
  });

  // Update map
  if (typeof updateMap === 'function') updateMap();
}

// Override removed; startScan now natively handles realMode fallbacks.

// Inject "Modo Real" button into sidebar after DOM loads
document.addEventListener('DOMContentLoaded', () => {
  const navContainer = document.querySelector('.nav') || document.body;
  if (navContainer) {
    // Status dot
    const dot = document.createElement('span');
    dot.id = 'backend-status-dot';
    dot.style.cssText = 'width:7px;height:7px;border-radius:50%;background:var(--red);display:inline-block;flex-shrink:0';
    dot.title = 'Backend offline';

    // Toggle button
    const btn = document.createElement('button');
    btn.id = 'real-mode-btn';
    btn.className = 'nav-btn'; // Use consistent class
    btn.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:5px;border:1px solid rgba(0,245,160,0.3);padding:10px;font-size:12px;margin-top:auto;color:var(--neon);font-weight:bold;background:rgba(0,245,160,0.1)';
    btn.onclick = toggleRealMode;
    btn.innerHTML = '<span>MODO REAL</span>';
    btn.title = 'Alternar entre Simulação e Scan Real (requer server.py)';
    btn.prepend(dot);

    navContainer.appendChild(btn);
  }
  checkBackendStatus();
});
