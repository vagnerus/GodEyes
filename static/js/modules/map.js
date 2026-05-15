/* ═══════════════════════════════════════════
   GodEyes – map.js
   Leaflet.js Threat Mapping System
   ═══════════════════════════════════════════ */

class ThreatMap {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.markers = null; // For clustering
        this.initMap();
    }

    initMap() {
        if (!document.getElementById(this.containerId)) return;

        // Initialize Leaflet map
        this.map = L.map(this.containerId, {
            zoomControl: true,
            attributionControl: false
        }).setView([-15.78, -47.93], 4); // Centered on Brazil

        // Dark Cyberpunk Tile Layer
        L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
            maxZoom: 18,
        }).addTo(this.map);

        // Apply CSS filter for cyberpunk look
        const tileLayer = document.querySelector('.leaflet-tile-pane');
        if (tileLayer) {
            tileLayer.style.filter = 'hue-rotate(180deg) saturate(150%) brightness(0.8)';
        }
    }

    async plotIP(ip) {
        try {
            const response = await fetch(`/api/threat/geoip/${ip}`);
            const data = await response.json();
            
            if (data.lat && data.lon) {
                const marker = L.circleMarker([data.lat, data.lon], {
                    radius: 8,
                    fillColor: data.is_malicious ? 'var(--neon-red)' : 'var(--neon-cyan)',
                    color: '#fff',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(this.map);

                marker.bindPopup(`
                    <div class="map-popup">
                        <strong>IP:</strong> ${ip}<br>
                        <strong>Local:</strong> ${data.city}, ${data.country_code}<br>
                        <strong>ISP:</strong> ${data.isp}
                    </div>
                `);

                this.map.setView([data.lat, data.lon], 6);
                window.notify.show(`IP ${ip} localizado em ${data.city}`, 'info');
            }
        } catch (error) {
            console.error('Error plotting IP:', error);
        }
    }
}

window.threatMap = new ThreatMap('threat-map');

window.plotIpOnMap = () => {
    const ipInput = document.getElementById('map-search-ip');
    const ip = ipInput.value.trim();
    if (ip) {
        window.threatMap.plotIP(ip);
        ipInput.value = '';
    } else {
        window.notify.show('Por favor, insira um IP válido.', 'warning');
    }
};
