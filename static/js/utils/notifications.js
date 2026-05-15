/* ═══════════════════════════════════════════
   GodEyes – notifications.js
   Toast Notification System
   ═══════════════════════════════════════════ */

class NotificationSystem {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(this.container);
        this.maxToasts = 5;
    }

    show(message, type = 'info', duration = 5000) {
        if (this.container.children.length >= this.maxToasts) {
            this.container.removeChild(this.container.firstChild);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast--${type} animate-fadeInLeft`;
        
        const colors = {
            success: 'var(--neon-green)',
            error: 'var(--neon-red)',
            warning: 'var(--neon-orange)',
            info: 'var(--neon-cyan)',
            hack: 'var(--neon-purple)'
        };

        const color = colors[type] || colors.info;

        toast.style.cssText = `
            background: rgba(10, 14, 26, 0.9);
            border-left: 4px solid ${color};
            color: #fff;
            padding: 12px 20px;
            border-radius: 4px;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            min-width: 280px;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
            font-family: var(--font-body);
            font-size: 0.9rem;
        `;

        if (type === 'hack') {
            this.glitchText(toast, message);
        } else {
            toast.textContent = message;
        }

        const progress = document.createElement('div');
        progress.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            height: 2px;
            background: ${color};
            width: 100%;
            transition: width ${duration}ms linear;
        `;
        toast.appendChild(progress);

        this.container.appendChild(toast);

        // Animate progress bar
        setTimeout(() => progress.style.width = '0%', 10);

        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            toast.style.transition = 'transform 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    glitchText(el, text) {
        const chars = '@#$%&';
        let iterations = 0;
        const interval = setInterval(() => {
            el.textContent = text.split('')
                .map((char, index) => {
                    if (index < iterations) return text[index];
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join('');
            
            if (iterations >= text.length) clearInterval(interval);
            iterations += 1/3;
        }, 30);
    }
}

window.notify = new NotificationSystem();
