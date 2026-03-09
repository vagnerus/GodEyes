

// ═══════════════════════════════════════════
//  SATELLITE MODULE
// ═══════════════════════════════════════════

const SATELLITES = [
  { id:'USA-326',     name:'USA-326',            norad:'57454', type:'spy', orbit:'LEO', alt:'470 km',    inc:'97.4', period:'94 min',   signal:88, freq:[{f:'X-Band 8.025 GHz',t:'Dados'},{f:'Ka-Band 26.5 GHz',t:'Uplink'}],       op:'NRO (EUA)',     desc:'Satelite de reconhecimento optico de ultima geracao.' },
  { id:'KH-13',       name:'KH-13 KEYHOLE',      norad:'43641', type:'spy', orbit:'LEO', alt:'260 km',    inc:'97.8', period:'89 min',   signal:74, freq:[{f:'X-Band 8.4 GHz',t:'Imagem'},{f:'S-Band 2.2 GHz',t:'Telemetria'}],      op:'CIA / NRO',     desc:'Sistema de imagem de alta resolucao sub-metrica.' },
  { id:'COSMOS-2576', name:'COSMOS-2576',         norad:'59051', type:'spy', orbit:'LEO', alt:'510 km',    inc:'98.0', period:'95 min',   signal:61, freq:[{f:'L-Band 1.5 GHz',t:'Nav'},{f:'Ku-Band 14 GHz',t:'Dados'}],               op:'GRU (RU)',      desc:'Satelite russo de observacao eletronica.' },
  { id:'YAOGAN-41',   name:'YAOGAN-41',           norad:'58400', type:'spy', orbit:'LEO', alt:'490 km',    inc:'97.7', period:'94 min',   signal:55, freq:[{f:'X-Band 9.6 GHz',t:'SAR'},{f:'UHF 400 MHz',t:'Cmd'}],                   op:'PLASSF (CN)',   desc:'Satelite SAR chines de reconhecimento maritimo.' },
  { id:'STARLINK-001',name:'Starlink G6-38',      norad:'60012', type:'leo', orbit:'LEO', alt:'550 km',    inc:'53.0', period:'95 min',   signal:95, freq:[{f:'Ku-Band 12 GHz',t:'Downlink'},{f:'Ka-Band 28 GHz',t:'Uplink'}],        op:'SpaceX',        desc:'Satelite de internet de banda larga de baixa latencia.' },
  { id:'ISS',         name:'ISS (Estacao Esp.)',  norad:'25544', type:'leo', orbit:'LEO', alt:'408 km',    inc:'51.6', period:'92 min',   signal:99, freq:[{f:'VHF 144.490 MHz',t:'APRS'},{f:'UHF 437.550 MHz',t:'VOZ'}],             op:'NASA/Roscosmos',desc:'Estacao Espacial Internacional - transmite APRS continuamente.' },
  { id:'NOAA-19',     name:'NOAA-19',             norad:'33591', type:'leo', orbit:'LEO', alt:'870 km',    inc:'99.0', period:'102 min',  signal:82, freq:[{f:'137.100 MHz',t:'APT Imagem'},{f:'1.7 GHz',t:'HRPT'}],                  op:'NOAA',          desc:'Satelite meteorologico - transmissao publica APT decifravel.' },
  { id:'GPS-IIR-14',  name:'GPS IIR-14 PRN18',   norad:'28190', type:'meo', orbit:'MEO', alt:'20200 km',  inc:'55.0', period:'718 min',  signal:70, freq:[{f:'L1 1575.42 MHz',t:'Civil'},{f:'L2 1227.60 MHz',t:'Militar'}],          op:'US Space Force',desc:'Bloco IIR do GPS - sinal civil aberto, militar criptografado.' },
  { id:'GLONASS-K2',  name:'GLONASS-K2 No.12',   norad:'57166', type:'meo', orbit:'MEO', alt:'19130 km',  inc:'64.8', period:'676 min',  signal:65, freq:[{f:'L1 1602 MHz',t:'FDMA'},{f:'L3 1202 MHz',t:'CDMA'}],                   op:'Roscosmos',     desc:'Satelite de navegacao russo - 24 planos orbitais.' },
  { id:'INTELSAT-37e',name:'Intelsat 37e',        norad:'42814', type:'geo', orbit:'GEO', alt:'35786 km',  inc:'0.0',  period:'1436 min', signal:90, freq:[{f:'C-Band 4 GHz',t:'TV/Data'},{f:'Ku 12 GHz',t:'VSAT'}],                 op:'Intelsat',      desc:'Satelite geoestacionario de comunicacao - cobertura America.' },
  { id:'SBIRS-GEO-5', name:'SBIRS GEO-5',         norad:'49589', type:'spy', orbit:'GEO', alt:'35786 km',  inc:'0.0',  period:'1436 min', signal:40, freq:[{f:'MWIR Sensor',t:'IR Alerta'},{f:'SHF 20 GHz',t:'Link'}],                op:'USAF',          desc:'Sistema de alerta precoce de misseis balisticos.' },
  { id:'BEIDOU-G7',   name:'BeiDou-3 G7',         norad:'56751', type:'geo', orbit:'GEO', alt:'35786 km',  inc:'1.2',  period:'1436 min', signal:78, freq:[{f:'B1I 1561.098 MHz',t:'Civil'},{f:'B3I 1268 MHz',t:'Militar'}],          op:'CNSA',          desc:'Satelite de navegacao chines - componente geoestacionario.' },
];

let selectedSatellite = null;
const satLockSet = new Set();
const satInterceptSet = new Set();
let satVisible = new Array(SATELLITES.length).fill(false);
let satScanRunning = false;
let globeRotY = 0;
let globeDragging = false;
let globeDragX = 0;

let satMap = null;
let nasaLayer = null;

function initSatelliteMap() {
  if (satMap) return;
  const mapEl = document.getElementById('sat-map');
  if (!mapEl) return;

  satMap = L.map('sat-map', {
    center: [0, 0],
    zoom: 2,
    minZoom: 1,
    maxZoom: 8,
    worldCopyJump: true,
    zoomControl: false,
    attributionControl: false
  });

  // Base Dark Layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
    maxZoom: 20
  }).addTo(satMap);

  // NASA GIBS Satellite Imagery Layer (MODIS Terra True Color)
  // We use the current date (UTC) to fetch the latest available true color satellite image of the Earth
  const d = new Date();
  d.setDate(d.getDate() - 1); // Often the current day isn't fully processed yet, use yesterday
  const dateStr = d.toISOString().split('T')[0];
  
  nasaLayer = L.tileLayer(`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${dateStr}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`, {
    minZoom: 1,
    maxZoom: 9,
    opacity: 0.65,
    bounds: [[-85.0511287776, -179.99999], [85.0511287776, 179.99999]]
  }).addTo(satMap);
  
  if (document.getElementById('sat-date-label')) {
    document.getElementById('sat-date-label').textContent = `NASA GIBS (${dateStr})`;
  }

  // Add dummy markers for the satellites on the map
  SATELLITES.forEach(sat => {
    const lat = (Math.random() - 0.5) * 140;
    const lng = (Math.random() - 0.5) * 360;
    
    // Custom icon based on type
    const color = sat.type === 'spy' ? '#ff3b5c' : sat.type === 'geo' ? '#00d9f5' : '#00f5a0';
    const iconHtml = `<div style="width:12px; height:12px; background:${color}; border-radius:50%; box-shadow: 0 0 10px ${color}"></div>`;
    
    const icon = L.divIcon({
      className: 'sat-marker',
      html: iconHtml,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
    
    const marker = L.marker([lat, lng], {icon: icon}).addTo(satMap);
    marker.bindPopup(`<b>${sat.name}</b><br>${sat.op} (${sat.orbit})`);
  });
}

// Ensure map is resized correctly when panel is shown
// We hook into the global panel activation logic if possible
// Instead of a continuous animation loop, we just rely on Leaflet
function drawGlobe() {}
// Defer initialization until panel is shown

// globeCanvas removed in favor of leaflet satMap

const sigCanvas = document.getElementById('signal-canvas');
const sctx = sigCanvas.getContext('2d');
const SW = sigCanvas.width, SH = sigCanvas.height;
let sigData = new Array(SW).fill(SH / 2);
let sigActive = false, sigFrequency = 0.05, sigAmplitude = 0;

function drawSignal() {
  sctx.fillStyle = 'rgba(6,10,18,0.4)'; sctx.fillRect(0, 0, SW, SH);
  sctx.beginPath();
  sigData.unshift(sigActive ? (SH / 2) + sigAmplitude * Math.sin(Date.now() * sigFrequency) * (0.8 + 0.2 * Math.random()) : SH / 2 + (Math.random() - 0.5) * 4);
  sigData = sigData.slice(0, SW);
  sctx.moveTo(0, sigData[0]);
  sigData.forEach(function(y, x) { sctx.lineTo(x, y); });
  sctx.strokeStyle = sigActive ? 'rgba(0,245,160,0.85)' : 'rgba(100,116,139,0.3)'; sctx.lineWidth = 1.5;
  sctx.shadowColor = sigActive ? '#00f5a0' : 'transparent'; sctx.shadowBlur = sigActive ? 6 : 0;
  sctx.stroke(); sctx.shadowBlur = 0;
  requestAnimationFrame(drawSignal);
}
drawSignal();

function startSatScan() {
  if (satScanRunning) return;
  satScanRunning = true;
  const btn = document.getElementById('sat-scan-btn');
  btn.textContent = 'Rastreando...'; btn.disabled = true;
  satVisible.fill(false);
  document.getElementById('sat-list').innerHTML = '';
  satLockSet.clear(); satInterceptSet.clear(); updateSatStats();
  const filt = document.getElementById('sat-filter').value;
  const filtered = SATELLITES.filter(function(s) {
    return filt === 'all' || s.type === filt || (filt === 'leo' && s.orbit === 'LEO') || (filt === 'meo' && s.orbit === 'MEO') || (filt === 'geo' && s.orbit === 'GEO');
  });
  let idx = 0;
  const timer = setInterval(function() {
    if (idx >= filtered.length) {
      clearInterval(timer); satScanRunning = false;
      btn.textContent = 'Concluido';
      setTimeout(function() { btn.textContent = 'Rastrear'; btn.disabled = false; }, 2000);
      return;
    }
    const sat = filtered[idx]; satVisible[SATELLITES.indexOf(sat)] = true;
    renderSatItem(sat); updateSatStats(); idx++;
  }, 350);
}

function filterSatellites(val) {
  document.querySelectorAll('.sat-item').forEach(function(el) {
    const match = val === 'all' || el.dataset.type === val || (val === 'leo' && el.dataset.orbit === 'LEO') || (val === 'meo' && el.dataset.orbit === 'MEO') || (val === 'geo' && el.dataset.orbit === 'GEO');
    el.style.display = match ? 'block' : 'none';
  });
}

function renderSatItem(sat) {
  const list = document.getElementById('sat-list');
  const el = document.createElement('div');
  const sigClass = sat.signal >= 80 ? 'strong' : sat.signal >= 55 ? 'medium' : 'weak';
  el.className = 'sat-item ' + sat.type; el.dataset.id = sat.id; el.dataset.type = sat.type; el.dataset.orbit = sat.orbit;
  el.onclick = function() { selectSatellite(sat); };
  el.innerHTML = '<div class="sat-item-head"><div><div class="sat-name">' + sat.name + '</div><div class="sat-norad">NORAD #' + sat.norad + '</div></div><span class="sat-type-chip ' + sat.type + '">' + sat.type.toUpperCase() + '</span></div><div class="sat-meta"><span>S ' + sat.orbit + '</span><span>@ ' + sat.alt + '</span><span>' + sat.period + '</span><span>' + sat.op + '</span></div><div class="sat-signal-bar-wrap"><div class="sat-signal-bar ' + sigClass + '" style="width:' + sat.signal + '%"></div></div>';
  list.appendChild(el);
}

function updateSatStats() {
  document.getElementById('gs-total').textContent = satVisible.filter(Boolean).length;
  document.getElementById('gs-lock').textContent = satLockSet.size;
  document.getElementById('gs-int').textContent = satInterceptSet.size;
}

function selectSatellite(sat) {
  selectedSatellite = sat;
  document.querySelectorAll('.sat-item').forEach(function(el) { el.classList.toggle('selected', el.dataset.id === sat.id); });
  renderSatDetail(sat); activateSignal(sat);
}

function renderSatDetail(sat) {
  document.getElementById('sat-detail-card').querySelector('h3').textContent = sat.name;
  const sc = sat.signal >= 80 ? 'strong' : sat.signal >= 55 ? 'medium' : 'weak';
  const colMap = { strong: '#00f5a0', medium: '#ff8a00', weak: '#ff3b5c' };
  const freqHTML = sat.freq.map(function(f) { return '<div class="freq-row"><span class="freq-val">' + f.f + '</span><span class="freq-type">' + f.t + '</span></div>'; }).join('');
  
  let videoEmbed = '';
  if (sat.id === 'ISS') {
      videoEmbed = `<div style="margin-bottom:14px;border-radius:8px;overflow:hidden;border:1px solid var(--glass-b);position:relative;padding-bottom:56.25%;height:0;">
        <iframe src="https://www.youtube.com/embed/21X5lGlDOfg?autoplay=1&mute=1&controls=0&playsinline=1" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allow="autoplay; encrypted-media" allowfullscreen></iframe>
        <div style="position:absolute;top:4px;right:6px;background:rgba(255,59,92,0.8);color:#fff;font-size:9px;padding:2px 6px;border-radius:4px;font-weight:bold;letter-spacing:1px;box-shadow:0 0 8px rgba(255,59,92,0.5);">LIVE HD FEED</div>
      </div>`;
  } else if (sat.id === 'NOAA-19' || sat.name.includes('EOS')) {
       videoEmbed = `<div style="margin-bottom:14px;border-radius:8px;overflow:hidden;border:1px solid var(--glass-b);position:relative;">
        <img src="https://cdn.star.nesdis.noaa.gov/GOES16/ABI/CONUS/GEOCOLOR/latest.jpg" style="width:100%;height:auto;display:block;" />
        <div style="position:absolute;top:4px;right:6px;background:rgba(0,245,160,0.8);color:#111;font-size:9px;padding:2px 6px;border-radius:4px;font-weight:bold;letter-spacing:1px;">NOAA SENSOR</div>
      </div>`;
  } else if (sat.type === 'spy') {
       videoEmbed = `<div style="margin-bottom:14px;border-radius:8px;overflow:hidden;border:1px solid rgba(255,59,92,0.3);position:relative;background:#050810;padding:20px;text-align:center;">
        <div style="font-family:'JetBrains Mono', monospace; color:var(--red); font-size:12px; margin-bottom:8px">MILITARY ENCRYPTED STREAM</div>
        <svg viewBox="0 0 24 24" fill="none" width="32" height="32" style="opacity:0.6;margin:auto;"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--red)" stroke-width="1.5"/></svg>
        <div style="font-size:10px;color:var(--muted);margin-top:8px">Requires NSA/NRO Level-6 Clearance Key</div>
      </div>`;
  } else {
        videoEmbed = `<div style="margin-bottom:14px;border-radius:8px;overflow:hidden;border:1px solid var(--glass-b);position:relative;background:#050810;padding:20px;text-align:center;">
        <div style="font-family:'JetBrains Mono', monospace; color:var(--cyan); font-size:12px; margin-bottom:8px">NO VISUAL PAYLOAD DETECTED</div>
        <div style="font-size:10px;color:var(--muted);margin-top:8px">Receiving telemetry data only on this band</div>
      </div>`;
  }

  document.getElementById('sat-detail-body').innerHTML =
    videoEmbed +
    '<p style="font-size:12px;color:var(--muted);margin-bottom:14px">' + sat.desc + '</p>' +
    '<div class="sat-info-grid">' +
    '<div class="sat-info-field"><span class="sat-info-key">Operador</span><span class="sat-info-val">' + sat.op + '</span></div>' +
    '<div class="sat-info-field"><span class="sat-info-key">Orbita</span><span class="sat-info-val">' + sat.orbit + '</span></div>' +
    '<div class="sat-info-field"><span class="sat-info-key">Altitude</span><span class="sat-info-val">' + sat.alt + '</span></div>' +
    '<div class="sat-info-field"><span class="sat-info-key">Inclinacao</span><span class="sat-info-val">' + sat.inc + ' deg</span></div>' +
    '<div class="sat-info-field"><span class="sat-info-key">Periodo</span><span class="sat-info-val">' + sat.period + '</span></div>' +
    '<div class="sat-info-field"><span class="sat-info-key">Sinal</span><span class="sat-info-val" style="color:' + colMap[sc] + '">' + sat.signal + '% ' + sc + '</span></div>' +
    '</div>' +
    '<h4 style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px">Frequencias</h4>' +
    '<div class="sat-freq-list">' + freqHTML + '</div>' +
    '<div class="sat-action-row">' +
    '<button class="btn-sat-lock" onclick="lockSatellite(\'' + sat.id + '\')">Lock Orbital</button>' +
    '<button class="btn-sat-intercept" onclick="interceptSatellite(\'' + sat.id + '\')">Interceptar Sinal</button>' +
    '<button class="btn-sat-log" onclick="logSatellite(\'' + sat.id + '\')">Log TLE</button>' +
    '</div>';
}

function activateSignal(sat) {
  sigActive = true; sigAmplitude = sat.signal * 0.35; sigFrequency = 0.03 + Math.random() * 0.04;
  const sc = sat.signal >= 80 ? 'strong' : sat.signal >= 55 ? 'medium' : 'weak';
  const colMap = { strong: '#00f5a0', medium: '#ff8a00', weak: '#ff3b5c' };
  document.getElementById('signal-info').innerHTML =
    '<span class="sig-pill">SNR: ' + (sat.signal * 0.4).toFixed(1) + ' dB</span>' +
    '<span class="sig-pill">BER: ' + (0.001 * (100 - sat.signal)).toFixed(4) + '</span>' +
    '<span class="sig-pill">' + sat.freq[0].f + '</span>' +
    '<span class="sig-pill" style="color:' + colMap[sc] + '">' + sat.orbit + '</span>';
}

function lockSatellite(id) {
  const sat = SATELLITES.find(function(s) { return s.id === id; }); if (!sat) return;
  if (satLockSet.has(id)) { satLockSet.delete(id); showToast('Lock liberado: ' + sat.name); }
  else { satLockSet.add(id); showToast('Lock OK: ' + sat.name, true); }
  updateSatStats();
}

function interceptSatellite(id) {
  const sat = SATELLITES.find(function(s) { return s.id === id; }); if (!sat) return;
  satInterceptSet.add(id); satLockSet.add(id); updateSatStats();
  showToast('Interceptando ' + sat.name + '...', true);
  showPanel('pentest');
  setTimeout(function() {
    appendConsole('\n[SAT] Interceptando: ' + sat.name + ' (NORAD #' + sat.norad + ')', 'info');
    appendConsole('[SAT] Freq: ' + sat.freq[0].f + ' | ' + sat.orbit + ' | Alt: ' + sat.alt, 'info');
    appendConsole('[SAT] Aguardando passagem orbital...', '');
    setTimeout(function() {
      appendConsole('[SAT] Sinal adquirido - SNR: ' + (sat.signal * 0.4).toFixed(1) + ' dB', 'success');
      appendConsole('[SAT] Decodificando downlink...', '');
      setTimeout(function() {
        if (sat.type === 'spy') appendConsole('[SAT] Sinal criptografado (AES-256 gov). Metadata only.', 'warn');
        else appendConsole('[SAT] Dados decodificados - capture_' + id + '_' + Date.now() + '.bin', 'success');
      }, 1800);
    }, 2200);
  }, 300);
}

function logSatellite(id) {
  const sat = SATELLITES.find(function(s) { return s.id === id; }); if (!sat) return;
  showPanel('pentest');
  setTimeout(function() {
    appendConsole('\n[TLE] ' + sat.name, 'info');
    appendConsole('1 ' + sat.norad + 'U 24001A   26067.50000000  .00001000  00000-0  10000-3 0  9993', '');
    appendConsole('2 ' + sat.norad + '  ' + sat.inc + '  60.0000 0001500  60.0000   0.0000 15.' + Math.floor(Math.random() * 9) + '0000 00012', '');
    appendConsole('[TLE] Alt: ' + sat.alt + ' | Periodo: ' + sat.period + ' | Inc: ' + sat.inc + ' deg', 'success');
  }, 200);
}

function showToast(msg, ok) {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;background:' + (ok ? 'rgba(0,245,160,.15)' : 'rgba(255,59,92,.15)') + ';border:1px solid ' + (ok ? 'rgba(0,245,160,.4)' : 'rgba(255,59,92,.4)') + ';color:' + (ok ? '#00f5a0' : '#ff3b5c') + ';padding:10px 18px;border-radius:10px;font-size:13px;font-family:JetBrains Mono,monospace;backdrop-filter:blur(10px);box-shadow:0 4px 20px rgba(0,0,0,.4);';
  t.textContent = msg; document.body.appendChild(t);
  setTimeout(function() { t.remove(); }, 3000);
}

// Patch showPanel to auto-start scan on first visit and fix map size
const _origShowPanelSat = window.showPanel;
window.showPanel = function(name) {
  if (_origShowPanelSat) _origShowPanelSat(name);
  if (name === 'satellite') {
    setTimeout(() => {
      console.log("[satellite.js] Panel opened. satScanRunning:", satScanRunning, "satVisible:", satVisible);
      if (!satMap) {
        initSatelliteMap();
      } else {
        satMap.invalidateSize();
      }
      
      if (!satScanRunning && satVisible.filter(Boolean).length === 0) {
        console.log("[satellite.js] Auto-starting scan...");
        startSatScan();
      }
    }, 450);
  }
};
