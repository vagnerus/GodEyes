/* ═══════════════════════════════════════════
   GodEyes – radar.js
   Animated Radar Canvas System
   ═══════════════════════════════════════════ */

class RadarScanner {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.angle = 0;
        this.blips = [];
        this.devices = [];
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = Math.min(this.centerX, this.centerY) - 10;
    }

    addDevice(device) {
        // Map IP last octet to radial distance
        const lastOctet = parseInt(device.ip.split('.').pop());
        const distRatio = (lastOctet % 100) / 100;
        const dist = this.radius * (0.2 + distRatio * 0.7);
        const angle = Math.random() * Math.PI * 2;
        
        const blip = {
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            risk: device.risk || 'low',
            opacity: 0,
            life: 1.0,
            device: device
        };
        
        this.blips.push(blip);
        this.devices.push(device);
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 255, 200, 0.1)';
        this.ctx.lineWidth = 1;

        // Concentric circles
        for (let i = 1; i <= 4; i++) {
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, (this.radius / 4) * i, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // Crosshairs
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX - this.radius, this.centerY);
        this.ctx.lineTo(this.centerX + this.radius, this.centerY);
        this.ctx.moveTo(this.centerX, this.centerY - this.radius);
        this.ctx.lineTo(this.centerX, this.centerY + this.radius);
        this.ctx.stroke();
    }

    drawSweep() {
        this.ctx.save();
        this.ctx.translate(this.centerX, this.centerY);
        this.ctx.rotate(this.angle);

        const gradient = this.ctx.createConicGradient(0, 0, 0);
        gradient.addColorStop(0, 'rgba(0, 255, 200, 0.4)');
        gradient.addColorStop(0.1, 'rgba(0, 255, 200, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.arc(0, 0, this.radius, -0.5, 0);
        this.ctx.closePath();
        this.ctx.fill();

        // Leading line
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(this.radius, 0);
        this.ctx.strokeStyle = 'rgba(0, 255, 200, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.restore();
        this.angle += 0.02;
    }

    drawBlips() {
        this.blips.forEach((blip, index) => {
            const colors = {
                high: '255, 0, 60',
                medium: '255, 107, 0',
                low: '0, 255, 200'
            };
            
            const color = colors[blip.risk] || colors.low;
            
            // Pulse logic
            const sweepAngle = (this.angle % (Math.PI * 2));
            const blipAngle = Math.atan2(blip.y, blip.x);
            const normalizedBlipAngle = blipAngle < 0 ? blipAngle + Math.PI * 2 : blipAngle;
            
            if (Math.abs(sweepAngle - normalizedBlipAngle) < 0.1) {
                blip.opacity = 1.0;
            } else {
                blip.opacity *= 0.98;
            }

            if (blip.opacity > 0.05) {
                this.ctx.beginPath();
                this.ctx.arc(this.centerX + blip.x, this.centerY + blip.y, 4, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(${color}, ${blip.opacity})`;
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = `rgb(${color})`;
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this.drawBlips();
        this.drawSweep();
        requestAnimationFrame(() => this.animate());
    }
}
