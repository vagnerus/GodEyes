/* ═══════════════════════════════════════════
   GodEyes – vpn.js
   Proxy Management & System Configuration
   ═══════════════════════════════════════════ */

class VPNManager {
    constructor() {
        this.proxyTable = document.getElementById('proxy-body');
        this.statusDisplay = document.getElementById('system-proxy-status');
        this.ipDisplay = document.getElementById('current-ip-display');
        this.init();
    }

    async init() {
        this.updateStatus();
        this.updatePublicIP();
    }

    async updateStatus() {
        try {
            const r = await fetch('/api/proxy/status');
            const data = await r.json();
            if (data.active) {
                this.statusDisplay.textContent = `ATIVO: ${data.active}`;
                this.statusDisplay.className = 'status-online';
            } else {
                this.statusDisplay.textContent = 'DESATIVADO';
                this.statusDisplay.className = 'status-offline';
            }
        } catch {}
    }

    async updatePublicIP() {
        try {
            const r = await fetch('https://api.ipify.org?format=json');
            const data = await r.json();
            this.ipDisplay.textContent = data.ip;
        } catch {
            this.ipDisplay.textContent = 'Erro ao buscar IP';
        }
    }

    async fetchNewProxies() {
        window.notify.show('Buscando novos proxies...', 'info');
        try {
            const r = await fetch('/api/proxy/fetch');
            const data = await r.json();
            this.renderProxies(data.proxies);
            window.notify.show(`${data.count} proxies encontrados.`, 'success');
        } catch {
            window.notify.show('Erro ao buscar proxies.', 'error');
        }
    }

    renderProxies(proxies) {
        this.proxyTable.innerHTML = '';
        proxies.forEach(proxy => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="terminal-font">${proxy}</td>
                <td id="lat-${proxy.replace(/[:.]/g, '')}">--</td>
                <td><span class="status-offline" id="stat-${proxy.replace(/[:.]/g, '')}">TESTAR</span></td>
                <td>
                    <button class="btn btn-neon" onclick="testProxy('${proxy}')" style="padding: 4px 8px;">TESTAR</button>
                    <button class="btn btn-neon" onclick="toggleSystemProxy(true, '${proxy}')" style="padding: 4px 8px; background: var(--neon-purple); box-shadow: 0 0 10px rgba(191, 0, 255, 0.4);">ATIVAR</button>
                </td>
            `;
            this.proxyTable.appendChild(row);
        });
    }

    async testProxy(proxy) {
        const id = proxy.replace(/[:.]/g, '');
        const latEl = document.getElementById(`lat-${id}`);
        const statEl = document.getElementById(`stat-${id}`);
        
        latEl.textContent = '...';
        
        try {
            const r = await fetch('/api/proxy/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proxy })
            });
            const data = await r.json();
            
            if (data.status === 'online') {
                latEl.textContent = `${data.latency}ms`;
                latEl.style.color = 'var(--neon-green)';
                statEl.textContent = 'ONLINE';
                statEl.className = 'status-online';
            } else {
                latEl.textContent = 'TIMED OUT';
                latEl.style.color = 'var(--neon-red)';
                statEl.textContent = 'OFFLINE';
                statEl.className = 'status-offline';
            }
        } catch {
            latEl.textContent = 'ERROR';
        }
    }

    async setProxy(enabled, proxy = null) {
        window.notify.show(enabled ? `Ativando proxy: ${proxy}` : 'Desativando proxy do sistema...', 'info');
        try {
            const r = await fetch('/api/proxy/set', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled, proxy })
            });
            const data = await r.json();
            if (data.status === 'success') {
                window.notify.show(enabled ? 'Proxy ativado com sucesso.' : 'Proxy desativado.', 'success');
                this.updateStatus();
                this.updatePublicIP();
            } else {
                window.notify.show('Erro ao configurar proxy.', 'error');
            }
        } catch {
            window.notify.show('Falha na comunicação com o servidor.', 'error');
        }
    }
}

window.vpnManager = new VPNManager();

window.fetchNewProxies = () => window.vpnManager.fetchNewProxies();
window.testProxy = (proxy) => window.vpnManager.testProxy(proxy);
window.toggleSystemProxy = (enabled, proxy) => window.vpnManager.setProxy(enabled, proxy);
