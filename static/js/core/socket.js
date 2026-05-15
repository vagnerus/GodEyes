/* ═══════════════════════════════════════════
   GodEyes – socket.js
   Real-time WebSocket Communication
   ═══════════════════════════════════════════ */

const socket = io();

socket.on('connect', () => {
    console.log('Connected to WebSocket server');
    document.getElementById('system-status').className = 'status-online';
});

socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server');
    document.getElementById('system-status').className = 'status-offline';
});

socket.on('scan_complete', (data) => {
    console.log('Scan complete:', data);
    if (window.scanner) {
        data.devices.forEach(device => {
            window.scanner.renderDevice(device);
        });
        window.notify.show(`Varredura concluída. ${data.devices.length} dispositivos encontrados.`, 'success');
    }
});

socket.on('scan_error', (data) => {
    window.notify.show(`Erro no scanner: ${data.error}`, 'error');
});

socket.on('terminal_output', (data) => {
    if (window.terminal) {
        window.terminal.append(data.m, data.l);
    }
});

socket.on('system_stats', (data) => {
    document.getElementById('cpu-usage').textContent = data.cpu + '%';
    document.getElementById('ram-usage').textContent = data.ram + 'GB';
    document.getElementById('ping-ms').textContent = data.ping + 'ms';
});
