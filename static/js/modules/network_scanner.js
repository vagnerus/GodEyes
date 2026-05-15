/* ═══════════════════════════════════════════
   GodEyes – network_scanner.js
   Frontend Scanner Logic & Table Management
   ═══════════════════════════════════════════ */

class NetworkScanner {
    constructor() {
        this.tableBody = document.getElementById('devices-body');
        this.radar = new RadarScanner('radar-canvas');
        this.devices = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        const filterInput = document.getElementById('device-filter');
        filterInput.addEventListener('input', (e) => this.filterTable(e.target.value));
    }

    async startScan(target = '192.168.1.0/24', type = 'quick') {
        window.notify.show(`Iniciando varredura ${type} em ${target}...`, 'info');
        
        try {
            const response = await fetch('/api/network/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target, scan_type: type })
            });
            const data = await response.json();
            
            if (data.status === 'started') {
                window.notify.show('Scan em andamento no backend.', 'success');
            } else {
                window.notify.show(data.error || 'Erro ao iniciar scan', 'error');
            }
        } catch (error) {
            window.notify.show('Falha na comunicação com o servidor.', 'error');
        }
    }

    renderDevice(device) {
        const row = document.createElement('tr');
        row.className = 'animate-fadeInUp';
        
        const riskClass = `risk-${device.risk || 'low'}`;
        const riskLabel = device.risk === 'high' ? 'Crítico' : (device.risk === 'medium' ? 'Médio' : 'Baixo');

        row.innerHTML = `
            <td class="terminal-font">${device.ip}</td>
            <td>${device.hostname || '--'}</td>
            <td class="terminal-font">${device.mac}</td>
            <td>${device.vendor}</td>
            <td><span class="risk-badge ${riskClass}">${riskLabel}</span></td>
            <td>
                <button class="btn btn-neon" style="padding: 4px 8px; font-size: 0.6rem;">DETALHES</button>
            </td>
        `;
        
        this.tableBody.appendChild(row);
        this.radar.addDevice(device);
    }

    filterTable(query) {
        const q = query.toLowerCase();
        const rows = this.tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(q) ? '' : 'none';
        });
    }

    clear() {
        this.tableBody.innerHTML = '';
        this.radar.blips = [];
        this.devices = [];
    }
}

window.scanner = new NetworkScanner();

window.startNetworkScan = () => {
    window.scanner.clear();
    window.scanner.startScan();
};
