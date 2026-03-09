/* ═══════════════════════════════════════════
   GodEyes – cameras.js  (rewrite v2)
   Câmeras ao Vivo – CCTV Canvas Simulation
   ═══════════════════════════════════════════ */
'use strict';

// ── Camera Definitions (REAL PUBLIC TRAFFIC / CITY CAMERAS) ──
const CAM_LIST = [
  { id: 'cam1', name: 'NYC - Times Square',     loc: 'New York, US',    zone: 'Externo', status: 'online', url: 'https://webcams.windy.com/webcams/stream/1659069167/current/preview/1659069167.jpg', type: 'snapshot', interval: 10000 },
  { id: 'cam2', name: 'Jackson Hole - Town Sq',  loc: 'Wyoming, US',     zone: 'Externo', status: 'online', url: 'https://www.seejh.com/cams/JHTC1-live.jpg', type: 'snapshot', interval: 5000 },
  { id: 'cam3', name: 'Atlantic City',           loc:'New Jersey, US',   zone: 'Externo', status: 'online', url: 'https://webcams.windy.com/webcams/stream/1508187288/current/preview/1508187288.jpg', type: 'snapshot', interval: 10000 },
  { id: 'cam4', name: 'London - Abbey Road',     loc: 'London, UK',      zone: 'Externo', status: 'online', url: 'https://webcams.windy.com/webcams/stream/1588084108/current/preview/1588084108.jpg', type: 'snapshot', interval: 10000 },
  { id: 'cam5', name: 'Shibuya Crossing',       loc: 'Tokyo, JP',       zone: 'Externo', status: 'online', url: 'https://webcams.windy.com/webcams/stream/1517479260/current/preview/1517479260.jpg', type: 'snapshot', interval: 10000 },
  { id: 'cam6', name: 'ISS - Earth View',       loc: 'LEO Orbit',       zone: 'Satélite', status: 'online', url: 'https://eol.jsc.nasa.gov/DatabaseCameraFiles/ISSCameraPositions/current.jpg', type: 'snapshot', interval: 15000 },
  { id: 'cam7', name: 'Venice - San Marco',     loc: 'Venice, IT',      zone: 'Externo', status: 'online', url: 'https://webcams.windy.com/webcams/stream/1392658933/current/preview/1392658933.jpg', type: 'snapshot', interval: 10000 },
  { id: 'cam8', name: 'Amsterdam - Dam Sq',     loc: 'Amsterdam, NL',   zone: 'Externo', status: 'online', url: 'https://webcams.windy.com/webcams/stream/1183186252/current/preview/1183186252.jpg', type: 'snapshot', interval: 10000 },
  { id: 'cam9', name: 'Paris - Eiffel Tower',   loc: 'Paris, FR',       zone: 'Externo', status: 'online', url: 'https://webcams.windy.com/webcams/stream/1586548773/current/preview/1586548773.jpg', type: 'snapshot', interval: 12000 },
  { id: 'cam10',name: 'Las Vegas Strip',        loc: 'Nevada, US',      zone: 'Externo', status: 'online', url: 'https://webcams.windy.com/webcams/stream/1210815340/current/preview/1210815340.jpg', type: 'snapshot', interval: 10000 },
  { id: 'cam11',name: 'Moscow - Red Square',    loc: 'Moscow, RU',      zone: 'Externo', status: 'offline',url: '', type: 'none' },
  { id: 'cam12',name: 'Rio - Copacabana',       loc: 'Rio, BR',         zone: 'Externo', status: 'online', url: 'https://webcams.windy.com/webcams/stream/1582046420/current/preview/1582046420.jpg', type: 'snapshot', interval: 15000 },
  { id: 'cam13',name: 'Sydney Opera House',     loc: 'Sydney, AU',      zone: 'Externo', status: 'online', url: 'https://webcams.windy.com/webcams/stream/1453229871/current/preview/1453229871.jpg', type: 'snapshot', interval: 10000 },
  { id: 'cam14',name: 'Dubai - Marina',         loc: 'Dubai, AE',       zone: 'Externo', status: 'online', url: 'https://webcams.windy.com/webcams/stream/1495914614/current/preview/1495914614.jpg', type: 'snapshot', interval: 10000 },
  { id: 'cam15',name: 'Toronto - CN Tower',     loc: 'Toronto, CA',     zone: 'Externo', status: 'online', url: 'https://webcams.windy.com/webcams/stream/1344421118/current/preview/1344421118.jpg', type: 'snapshot', interval: 10000 },
  { id: 'cam16',name: 'SP - Av Paulista',       loc: 'São Paulo, BR',   zone: 'Externo', status: 'online', url: 'https://webcams.windy.com/webcams/stream/1461662999/current/preview/1461662999.jpg', type: 'snapshot', interval: 8000 },
  { id: 'cam17',name: 'SALA DE SERVIDORES',     loc: '192.168.1.85',    zone: 'Interno', status: 'offline',url: '', type: 'none' },
  { id: 'cam18',name: 'LAB INTERNO Q1',         loc: '192.168.1.83',    zone: 'Interno', status: 'online', url: 'https://videos.pexels.com/video-files/855564/855564-sd_640_360_24fps.mp4', type: 'mp4' },
  { id: 'cam19',name: 'DATA CENTER ALPHA',      loc: '10.0.0.12',       zone: 'Interno', status: 'online', url: 'https://videos.pexels.com/video-files/3252157/3252157-sd_640_360_25fps.mp4', type: 'mp4' },
  { id: 'cam20',name: 'ESTACIONAMENTO SUL',     loc: '192.168.2.14',    zone: 'Externo', status: 'motion', url: 'https://webcams.windy.com/webcams/stream/1381229713/current/preview/1381229713.jpg', type: 'snapshot', interval: 6000 },
  { id: 'cam21',name: 'ZONA DE CARGA',          loc: '192.168.2.30',    zone: 'Externo', status: 'offline',url: '', type: 'none' },
  { id: 'cam22',name: 'LOBBY PRINCIPAL',        loc: '10.0.0.50',       zone: 'Interno', status: 'online', url: 'https://videos.pexels.com/video-files/2099049/2099049-sd_640_360_30fps.mp4', type: 'mp4' }
];

const CAM_W = 480, CAM_H = 270; // fixed canvas resolution for overlays

// Per-camera render state
const camState = {};
CAM_LIST.forEach(cam => {
  camState[cam.id] = {
    motionX: Math.random() * 0.5 + 0.1,  motionY: Math.random() * 0.5 + 0.1,
    motionW: 0.14 + Math.random() * 0.16, motionH: 0.14 + Math.random() * 0.16,
    motionVX: (Math.random() - 0.5) * 0.003,
    motionVY: (Math.random() - 0.5) * 0.003,
    motionActive: cam.status === 'motion' || Math.random() < 0.25,
    motionAlertTs: cam.status === 'motion' ? Date.now() - 4000 : 0,
    scanLine: Math.random() * CAM_H,
    frameCount: 0,
    recording: cam.status !== 'offline',
    palette: cam.status === 'offline' ? 'offline' : 'live'
  };
});

let camAnimId     = null;
let expandedCam   = null;
let expandLoopId  = null;
let camInitDone   = false;

// ─────────────────────────────
// INIT
// ─────────────────────────────
function initCameras() {
  renderCamListSidebar();
  renderCameraGrid();          // builds DOM + canvases with fixed sizes
  if (!camInitDone) {
    camInitDone = true;
    startCamLoop();
  }
}

// ─────────────────────────────
// GRID
// ─────────────────────────────
function renderCameraGrid() {
  const grid = document.getElementById('cam-grid');
  if (!grid) return;
  grid.innerHTML = CAM_LIST.map(cam => {
    const isOff = cam.status === 'offline';
    const isMov = cam.status === 'motion';
    
    // Use video for MP4, auto-refreshing img for snapshots, img for MJPEG
    let videoStreamHTML = '';
    if (!isOff && cam.type === 'mp4') {
      videoStreamHTML = `<video class="cam-live-video" src="${cam.url}" autoplay loop muted playsinline crossorigin="anonymous" onerror="this.style.display='none';"></video>`;
    } else if (!isOff && cam.type === 'snapshot') {
      videoStreamHTML = `<img class="cam-live-video" id="snap-${cam.id}" src="${cam.url}?t=${Date.now()}" alt="Live" crossorigin="anonymous" onerror="this.src=''; this.alt='Carregando...';"/>`;
    } else if (!isOff && cam.url) {
      videoStreamHTML = `<img class="cam-live-video" src="${cam.url}" alt="Live Feed" onerror="this.style.display='none';"/>`;
    }

    return `
      <div class="cam-cell${isOff?' cam-offline':''}${isMov?' cam-motion-alert':''}" id="cell-${cam.id}">
        ${videoStreamHTML}
        <!-- Canvas now overlays the video entirely -->
        <canvas id="canvas-${cam.id}" width="${CAM_W}" height="${CAM_H}" style="position: absolute; inset: 0; z-index: 2; mix-blend-mode: screen;"></canvas>
        <div class="cam-overlay" style="z-index: 3;">
          <div class="cam-top-row">
            <span class="cam-label">${cam.name}</span>
            <span class="cam-rec${isOff?' cam-rec-off':''}" id="rec-${cam.id}">${isOff?'⊘ OFFLINE':'● REC'}</span>
          </div>
          <div class="cam-bottom-row">
            <span class="cam-ip">${cam.loc}</span>
            <span class="cam-ts" id="ts-${cam.id}"></span>
          </div>
          <div class="cam-motion-badge" id="badge-${cam.id}" style="${isMov?'':'display:none'}">⚠ MOTION DETECTED</div>
        </div>
        <div class="cam-actions" style="z-index: 4;">
          <button class="cam-btn" onclick="expandCamera('${cam.id}')">⛶ Expandir</button>
          <button class="cam-btn" onclick="snapCamera('${cam.id}')"${isOff?' disabled':''}>📷 Snap</button>
        </div>
      </div>`;
  }).join('');
}

function renderCamListSidebar() {
  const list = document.getElementById('cam-sidebar-list');
  if (!list) return;
  list.innerHTML = CAM_LIST.map(cam => `
    <div class="cam-list-item" onclick="expandCamera('${cam.id}')">
      <span class="cam-status-dot ${cam.status}"></span>
      <div>
        <div class="cam-list-name">${cam.name}</div>
        <div class="cam-list-ip">${cam.loc} · ${cam.zone}</div>
      </div>
      <span class="cam-list-badge ${cam.status}">${cam.status.toUpperCase()}</span>
    </div>`).join('');
}

// ─────────────────────────────
// ANIMATION LOOP
// ─────────────────────────────
function startCamLoop() {
  if (camAnimId) cancelAnimationFrame(camAnimId);

  function loop() {
    camAnimId = requestAnimationFrame(loop);

    const panelActive = document.getElementById('panel-cameras')?.classList.contains('active');
    if (!panelActive && !expandedCam) return;

    CAM_LIST.forEach(cam => {
      const canvas = document.getElementById('canvas-' + cam.id);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = CAM_W, H = CAM_H;
      const st = camState[cam.id];
      st.frameCount++;

      // Timestamp overlay text
      const tEl = document.getElementById('ts-' + cam.id);
      if (tEl) tEl.textContent = new Date().toTimeString().slice(0,8);

      // CLEAR CANVAS because the real video is behind it now
      ctx.clearRect(0,0,W,H);

      if (st.palette === 'offline' || canvas.dataset.failed === 'true') { 
          drawOffline(ctx, W, H, st); 
          return; 
      }

      // Snapshot auto-refresh logic
      if (cam.type === 'snapshot' && cam.interval) {
        if (!st.lastSnapFetch) st.lastSnapFetch = Date.now();
        if (Date.now() - st.lastSnapFetch > cam.interval) {
          const img = document.getElementById(`snap-${cam.id}`);
          if (img) {
            img.src = `${cam.url}?t=${Date.now()}`;
          }
          st.lastSnapFetch = Date.now();
        }
      }

      // We no longer draw entire fake 3D scenes (drawIndoor, etc).
      // We only draw the HUD/Hacker Overlays on top of the transparent canvas!
      
      drawScanLine(ctx, W, H, st);
      updateMotion(st, W, H, cam.id);
      if (st.motionActive) drawMotionBox(ctx, W, H, st, cam.id);
      drawVignette(ctx, W, H);
      
      // Slight green tint over the video to make it look like CCTV
      ctx.fillStyle = 'rgba(0, 245, 160, 0.05)';
      ctx.fillRect(0, 0, W, H);
    });
  }

  camAnimId = requestAnimationFrame(loop);
}



function drawOffline(ctx, W, H, st) {
  // TV static
  const img=ctx.createImageData(W,H);
  for(let i=0;i<img.data.length;i+=4){
    const v=Math.random()*28;
    img.data[i]=v; img.data[i+1]=v; img.data[i+2]=v; img.data[i+3]=255;
  }
  ctx.putImageData(img,0,0);
  ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(0,0,W,H);
  ctx.textAlign='center';
  ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.font=`bold ${Math.floor(W/14)}px JetBrains Mono,monospace`;
  ctx.fillText('SINAL PERDIDO', W/2, H/2-10);
  ctx.fillStyle='rgba(255,59,92,0.8)';  ctx.font=`${Math.floor(W/22)}px JetBrains Mono,monospace`;
  ctx.fillText('⊘ CÂMERA OFFLINE', W/2, H/2+18);
  ctx.textAlign='left';
}

function drawScanLine(ctx, W, H, st) {
  st.scanLine = (st.scanLine + 1.8) % H;
  const sg=ctx.createLinearGradient(0,st.scanLine-4,0,st.scanLine+3);
  sg.addColorStop(0,'rgba(255,255,255,0)');
  sg.addColorStop(0.5,'rgba(255,255,255,0.05)');
  sg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=sg; ctx.fillRect(0,st.scanLine-4,W,7);
  // CRT interlace
  ctx.fillStyle='rgba(0,0,0,0.15)';
  for(let y=0;y<H;y+=3) ctx.fillRect(0,y,W,1);
}

function drawVignette(ctx, W, H) {
  const vg=ctx.createRadialGradient(W/2,H/2,W*0.25,W/2,H/2,W*0.75);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.6)');
  ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
}

function drawMotionBox(ctx, W, H, st, camId) {
  const bx=st.motionX*W, by=st.motionY*H, bw=st.motionW*W, bh=st.motionH*H;
  const fl=Math.sin(Date.now()/180)>0;
  const col=fl?'#ff3b5c':'#ff8a00';
  const cl=12;
  ctx.strokeStyle=col; ctx.lineWidth=2; ctx.shadowColor=col; ctx.shadowBlur=8;
  [[bx,by+cl,bx,by,bx+cl,by],[bx+bw-cl,by,bx+bw,by,bx+bw,by+cl],
   [bx+bw,by+bh-cl,bx+bw,by+bh,bx+bw-cl,by+bh],[bx+cl,by+bh,bx,by+bh,bx,by+bh-cl]
  ].forEach(([x1,y1,x2,y2,x3,y3])=>{
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.stroke();
  });
  ctx.shadowBlur=0;
  if(fl){
    ctx.fillStyle='rgba(255,59,92,0.9)'; ctx.font=`bold 10px JetBrains Mono,monospace`;
    ctx.textAlign='left'; ctx.fillText('MOTION',bx+2,by-4);
  }
  const badge=document.getElementById('badge-'+camId);
  if(badge) badge.style.display=fl?'':'none';
  const cell=document.getElementById('cell-'+camId);
  if(cell) cell.classList.toggle('cam-motion-alert',fl);
}

function updateMotion(st, W, H, camId) {
  st.motionX+=st.motionVX; st.motionY+=st.motionVY;
  if(st.motionX<0.05||st.motionX+st.motionW>0.95) st.motionVX*=-1;
  if(st.motionY<0.05||st.motionY+st.motionH>0.90) st.motionVY*=-1;
  if(Math.random()<0.0006&&!st.motionActive){
    st.motionActive=true; st.motionAlertTs=Date.now();
    const cam=CAM_LIST.find(c=>c.id===camId);
    if(typeof showGlobalNotification==='function')
      showGlobalNotification(`📹 Movimento: ${cam?.name||camId}`, 'high');
  }
  if(st.motionActive&&Date.now()-st.motionAlertTs>14000+Math.random()*8000){
    st.motionActive=false;
    const badge=document.getElementById('badge-'+camId);
    if(badge) badge.style.display='none';
    const cell=document.getElementById('cell-'+camId);
    if(cell) cell.classList.remove('cam-motion-alert');
  }
}

// ─────────────────────────────
// EXPAND MODAL
// ─────────────────────────────
function expandCamera(camId) {
  const modal=document.getElementById('cam-expand-modal');
  const canvas=document.getElementById('cam-expand-canvas');
  if(!modal||!canvas) return;
  expandedCam=camId;
  const cam=CAM_LIST.find(c=>c.id===camId);
  document.getElementById('cam-expand-title').textContent=cam?cam.name:camId;
  
  // Real video behind modal canvas
  let bgVideo = document.getElementById('cam-expand-video');
  if(!bgVideo) {
    // Use video tag for MP4 cameras
    if (cam.type === 'mp4') {
      bgVideo = document.createElement('video');
      bgVideo.autoplay = true;
      bgVideo.loop = true;
      bgVideo.muted = true;
      bgVideo.playsInline = true;
    } else {
      bgVideo = document.createElement('img');
    }
    bgVideo.id = 'cam-expand-video';
    bgVideo.style.position = 'absolute';
    bgVideo.style.inset = '0';
    bgVideo.style.width = '100%';
    bgVideo.style.height = '100%';
    bgVideo.style.objectFit = 'cover';
    bgVideo.style.zIndex = '1';
    canvas.parentElement.insertBefore(bgVideo, canvas);
    canvas.style.position = 'relative';
    canvas.style.zIndex = '2';
    canvas.style.mixBlendMode = 'screen';
  }
  
  if(cam.status === 'offline') {
    bgVideo.style.display = 'none';
  } else {
    bgVideo.style.display = 'block';
    bgVideo.src = cam.url;
  }

  const W=Math.min(Math.floor(window.innerWidth*0.9),1280);
  canvas.width=W; canvas.height=Math.floor(W*9/16);
  modal.classList.add('open');
  runExpandLoop();
}

function runExpandLoop() {
  if(expandLoopId) cancelAnimationFrame(expandLoopId);
  function loop() {
    if(!expandedCam){expandLoopId=null;return;}
    expandLoopId=requestAnimationFrame(loop);
    const canvas=document.getElementById('cam-expand-canvas');
    if(!canvas) return;
    const ctx=canvas.getContext('2d');
    const W=canvas.width, H=canvas.height;
    const cam=CAM_LIST.find(c=>c.id===expandedCam);
    if(!cam) return;
    const st=camState[expandedCam];
    st.frameCount++;
    if(st.palette==='offline' || (document.getElementById('cam-expand-video') && document.getElementById('cam-expand-video').style.display === 'none')) {
        drawOffline(ctx,W,H,st);
    } else {
      drawScanLine(ctx,W,H,st);
      updateMotion(st,W,H,expandedCam);
      if(st.motionActive) drawMotionBox(ctx,W,H,st,expandedCam);
      drawVignette(ctx,W,H);
      ctx.fillStyle = 'rgba(0, 245, 160, 0.05)';
      ctx.fillRect(0, 0, W, H);
    }
    // HUD timestamp
    const ts=new Date().toLocaleString('pt-BR');
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(W-240,H-28,240,28);
    ctx.fillStyle='#00f5a0'; ctx.font='12px JetBrains Mono,monospace';
    ctx.textAlign='right'; ctx.fillText(ts,W-8,H-8); ctx.textAlign='left';
    // Camera name HUD
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,250,28);
    ctx.fillStyle='#fff'; ctx.font='bold 11px JetBrains Mono,monospace';
    ctx.fillText(cam.name+'  '+cam.loc, 10, 18);
  }
  expandLoopId=requestAnimationFrame(loop);
}

function closeExpandCamera() {
  expandedCam=null;
  const modal=document.getElementById('cam-expand-modal');
  if(modal) modal.classList.remove('open');
}

// ─────────────────────────────
// SNAPSHOT
// ─────────────────────────────
function snapCamera(camId) {
  const canvas=document.getElementById('canvas-'+camId);
  if(!canvas) return;
  const a=document.createElement('a');
  a.download='snapshot_'+camId+'_'+Date.now()+'.png';
  a.href=canvas.toDataURL('image/png'); a.click();
  const cam=CAM_LIST.find(c=>c.id===camId);
  if(typeof showGlobalNotification==='function')
    showGlobalNotification(`📷 Snapshot: ${cam?.name||camId}`, 'ok');
}

function toggleCamRec(camId) {
  const st=camState[camId];
  const cam=CAM_LIST.find(c=>c.id===camId);
  if(!cam||cam.status==='offline') return;
  st.recording=!st.recording;
  const el=document.getElementById('rec-'+camId);
  if(el){el.textContent=st.recording?'● REC':'◎ PAUSED'; el.style.color=st.recording?'':'var(--orange)';}
}

// Stats ticker
setInterval(()=>{
  const onl=CAM_LIST.filter(c=>c.status!=='offline').length;
  const mot=Object.values(camState).filter(s=>s.motionActive).length;
  const tEl=document.getElementById('cam-stat-online');
  const mEl=document.getElementById('cam-stat-motion');
  if(tEl) tEl.textContent=onl+'/'+CAM_LIST.length;
  if(mEl) mEl.textContent=mot;
},1000);

// showPanel patch
document.addEventListener('DOMContentLoaded',()=>{
  const prev=window.showPanel;
  window.showPanel=function(name){
    if(prev) prev(name);
    if(name==='cameras') setTimeout(initCameras,50);
  };
});
