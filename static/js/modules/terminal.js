/* ═══════════════════════════════════════════
   GodEyes – terminal.js
   Terminal Emulator & Pen-test Commands
   ═══════════════════════════════════════════ */

class Terminal {
    constructor(bodyId, inputId) {
        this.body = document.getElementById(bodyId);
        this.input = document.getElementById(inputId);
        this.history = [];
        this.historyIndex = -1;
        
        if (this.input) {
            this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
        }
        
        this.append('GODEYES v2.0.0 - SISTEMA DE AUDITORIA', 'success');
        this.append('Digite "help" para ver os comandos disponíveis.', 'dim');
    }

    handleKeydown(e) {
        if (e.key === 'Enter') {
            const cmd = this.input.value.trim();
            if (cmd) {
                this.execute(cmd);
                this.history.push(cmd);
                this.historyIndex = this.history.length;
            }
            this.input.value = '';
        } else if (e.key === 'ArrowUp') {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.input.value = this.history[this.historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            if (this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
                this.input.value = this.history[this.historyIndex];
            } else {
                this.historyIndex = this.history.length;
                this.input.value = '';
            }
        }
    }

    append(text, type = '') {
        const line = document.createElement('div');
        line.className = `console-line ${type}`;
        line.textContent = text;
        this.body.appendChild(line);
        this.body.scrollTop = this.body.scrollHeight;
    }

    async execute(command) {
        this.append(`> ${command}`, 'info');
        
        const [baseCmd, ...args] = command.split(' ');
        
        if (baseCmd === 'help') {
            this.showHelp();
            return;
        }
        
        if (baseCmd === 'clear') {
            this.body.innerHTML = '';
            return;
        }

        // Send to backend
        try {
            const response = await fetch('/api/pentest/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            });
            const data = await response.json();
            
            if (data.error) {
                this.append(`[ERRO] ${data.error}`, 'error');
            }
        } catch (error) {
            this.append('[ERRO] Falha na conexão com o backend.', 'error');
        }
    }

    showHelp() {
        const commands = [
            { name: 'help', desc: 'Mostra esta lista de ajuda.' },
            { name: 'clear', desc: 'Limpa o terminal.' },
            { name: 'ping <ip>', desc: 'Verifica conectividade com um host.' },
            { name: 'traceroute <ip>', desc: 'Rastreia a rota de pacotes.' },
            { name: 'scan <ip>', desc: 'Realiza varredura de portas (Nmap).' },
            { name: 'vuln <ip>', desc: 'Busca por vulnerabilidades conhecidas.' },
            { name: 'whois <dominio>', desc: 'Consulta informações de domínio.' },
            { name: 'exploit <modulo>', desc: 'Executa simulação de exploit.' }
        ];
        
        this.append('\nCOMANDOS DISPONÍVEIS:', 'warn');
        commands.forEach(c => {
            this.append(`${c.name.padEnd(20)} - ${c.desc}`);
        });
        this.append('');
    }
}

window.terminal = new Terminal('terminal-body', 'terminal-input');
