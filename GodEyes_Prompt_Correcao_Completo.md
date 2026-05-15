# 👁️ GodEyes — Prompt Completo de Correção e Implementação
## 100 Funções Divididas em Fases — Sem Resumos

---

# ════════════════════════════════════════════════════════════
# FASE 0 — SETUP, DEPENDÊNCIAS E ESTRUTURA DE PROJETO
# ════════════════════════════════════════════════════════════

## FUNÇÃO 001 — Verificação e instalação automática de dependências Python

Crie um script Python chamado `install_dependencies.py` na raiz do projeto. Esse script deve:
- Verificar se o Python 3.10 ou superior está instalado. Se não estiver, exibir mensagem de erro com link para download e encerrar.
- Verificar se o `pip` está disponível. Se não, tentar instalar via `ensurepip`.
- Instalar automaticamente todos os pacotes Python necessários para o projeto:
  `flask`, `flask-cors`, `flask-socketio`, `python-nmap`, `scapy`, `requests`, `psutil`,
  `dnspython`, `paramiko`, `ftplib` (stdlib), `netifaces`, `manuf`, `python-dotenv`,
  `gevent`, `gevent-websocket`, `schedule`, `shodan`, `colorama`.
- Para cada pacote, verificar se já está instalado via `importlib.util.find_spec()` antes de instalar.
- Registrar o resultado de cada instalação em `logs/install.log` com timestamp.
- Ao final, imprimir um relatório colorido no terminal usando `colorama` com ✅ para sucesso e ❌ para falha.
- Executar automaticamente ao rodar `python app.py` se qualquer dependência estiver ausente.

---

## FUNÇÃO 002 — Verificação e instalação automática do Nmap

No arquivo `install_dependencies.py`, adicionar uma seção separada para verificar e instalar o Nmap no sistema operacional:
- No Windows: verificar se `nmap` está no PATH via `shutil.which("nmap")`. Se não estiver, baixar automaticamente o instalador silencioso do Nmap (`https://nmap.org/dist/nmap-7.94-setup.exe`) via `requests`, salvá-lo em `%TEMP%\nmap_setup.exe` e executá-lo com `/S` (instalação silenciosa) via `subprocess.run`. Após instalação, adicionar o diretório padrão `C:\Program Files (x86)\Nmap` ao PATH da sessão atual via `os.environ["PATH"]`.
- No Linux/Mac: verificar via `shutil.which("nmap")`. Se ausente, tentar instalar via `apt-get install -y nmap` (Linux) ou `brew install nmap` (Mac) usando `subprocess.run` com `sudo`.
- Registrar resultado em `logs/install.log`.
- Testar a instalação executando `nmap --version` via subprocess e capturando a saída para confirmar sucesso.

---

## FUNÇÃO 003 — Estrutura de pastas e arquivos do projeto

Criar um script `setup_project.py` que garanta a existência de toda a estrutura de pastas e arquivos base do GodEyes:

```
GodEyes/
├── app.py                    ← Servidor Flask principal
├── install_dependencies.py   ← Instalador automático
├── setup_project.py          ← Criador de estrutura
├── .env                      ← Variáveis de ambiente
├── requirements.txt          ← Lista de dependências
├── config.json               ← Configurações do app
├── logs/
│   ├── install.log
│   ├── network_scan.log
│   ├── pentest.log
│   └── proxy.log
├── static/
│   ├── css/
│   │   ├── main.css
│   │   ├── glassmorphism.css
│   │   ├── animations.css
│   │   └── terminal.css
│   ├── js/
│   │   ├── core/
│   │   │   ├── app.js
│   │   │   ├── socket.js
│   │   │   └── state.js
│   │   ├── modules/
│   │   │   ├── radar.js
│   │   │   ├── globe3d.js
│   │   │   ├── terminal.js
│   │   │   ├── network_scanner.js
│   │   │   ├── vpn_manager.js
│   │   │   ├── satellite_tracker.js
│   │   │   ├── map.js
│   │   │   └── threat_intel.js
│   │   └── utils/
│   │       ├── helpers.js
│   │       ├── formatters.js
│   │       └── notifications.js
│   ├── assets/
│   │   ├── textures/       ← Texturas do globo 3D
│   │   ├── sounds/         ← Sons de interface
│   │   └── fonts/          ← Fontes locais
│   └── libs/               ← Bibliotecas JS locais (fallback)
├── templates/
│   └── index.html
└── backend/
    ├── routes/
    │   ├── network.py
    │   ├── pentest.py
    │   ├── proxy.py
    │   ├── satellites.py
    │   └── threat.py
    ├── services/
    │   ├── nmap_service.py
    │   ├── scapy_service.py
    │   ├── proxy_service.py
    │   ├── dns_service.py
    │   └── tunnel_service.py
    └── utils/
        ├── logger.py
        ├── validator.py
        └── cache.py
```

O script deve criar cada pasta com `os.makedirs(exist_ok=True)` e criar arquivos vazios com `open(path, 'a').close()` apenas se não existirem.

---

## FUNÇÃO 004 — Arquivo `.env` e `config.json` com configurações padrão

Criar o arquivo `.env` com as seguintes variáveis padrão se não existir:
```
FLASK_ENV=development
FLASK_PORT=5000
SECRET_KEY=godeyes_secret_key_change_in_production
SHODAN_API_KEY=your_shodan_api_key_here
TUNNEL_ENABLED=false
TUNNEL_URL=
PROXY_TEST_TIMEOUT=5
NMAP_PATH=nmap
LOG_LEVEL=INFO
```

Criar o arquivo `config.json` com:
```json
{
  "app_name": "GodEyes",
  "version": "2.0.0",
  "theme": "midnight_cyber",
  "scanner": {
    "timeout": 3,
    "max_devices": 255,
    "ports_quick": "22,80,443,8080,3389,21,23,25,110,143",
    "ports_full": "1-65535"
  },
  "proxy": {
    "sources": ["https://www.proxy-list.download/api/v1/get?type=socks5","https://api.proxyscrape.com/v2/?request=getproxies&protocol=socks5"],
    "test_url": "http://httpbin.org/ip",
    "max_proxies": 50
  },
  "satellite": {
    "tle_source": "https://celestrak.org/SOCRATES/query.php",
    "refresh_interval": 60
  }
}
```

Usar `python-dotenv` para carregar o `.env` no início do `app.py`.

---

## FUNÇÃO 005 — Servidor Flask principal (`app.py`) com todas as rotas registradas

Reescrever o `app.py` completamente com:
- Importação e execução do `install_dependencies.py` antes de qualquer coisa.
- Inicialização do Flask com `flask-cors` habilitado para todas as origens (`origins="*"`).
- Inicialização do `flask-socketio` com `async_mode='gevent'`, `cors_allowed_origins="*"` e `logger=True`.
- Carregamento das variáveis do `.env` via `python-dotenv`.
- Registro de todos os Blueprints: `network_bp`, `pentest_bp`, `proxy_bp`, `satellites_bp`, `threat_bp`.
- Rota raiz `/` servindo `templates/index.html`.
- Rota `/health` retornando JSON com status do servidor, versão, uptime e lista de módulos ativos.
- Handler de erros global para 404 e 500 retornando JSON com mensagem descritiva.
- Inicialização do sistema de logging configurado via `LOG_LEVEL` do `.env`.
- Ao iniciar, exibir no terminal um banner ASCII art do GodEyes com versão e porta.
- Executar com `socketio.run(app, host='0.0.0.0', port=int(os.getenv('FLASK_PORT', 5000)), debug=False)`.

---

# ════════════════════════════════════════════════════════════
# FASE 1 — LAYOUT E INTERFACE (GLASSMORPHISM + CYBERPUNK)
# ════════════════════════════════════════════════════════════

## FUNÇÃO 006 — Reset CSS e variáveis de tema globais

No arquivo `static/css/main.css`, implementar:
- Reset CSS completo (`*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`).
- Definir todas as variáveis CSS no `:root`:
```css
:root {
  --bg-primary: #0a0e1a;
  --bg-secondary: #0d1224;
  --bg-card: rgba(13, 18, 36, 0.7);
  --bg-glass: rgba(20, 30, 60, 0.4);
  --border-glass: rgba(0, 255, 200, 0.15);
  --neon-cyan: #00ffc8;
  --neon-green: #39ff14;
  --neon-blue: #0080ff;
  --neon-red: #ff003c;
  --neon-orange: #ff6b00;
  --neon-purple: #bf00ff;
  --text-primary: #e0f0ff;
  --text-secondary: #7a9abf;
  --text-muted: #3a5070;
  --glow-cyan: 0 0 10px #00ffc8, 0 0 20px rgba(0,255,200,0.3);
  --glow-green: 0 0 10px #39ff14, 0 0 20px rgba(57,255,20,0.3);
  --glow-red: 0 0 10px #ff003c, 0 0 20px rgba(255,0,60,0.3);
  --blur-glass: blur(12px);
  --radius-card: 12px;
  --radius-sm: 6px;
  --transition-fast: 150ms ease;
  --transition-mid: 300ms ease;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  --font-ui: 'Orbitron', 'Rajdhani', sans-serif;
  --font-body: 'Exo 2', 'Rajdhani', sans-serif;
}
```
- Importar as fontes Google Fonts: Orbitron (pesos 400, 700, 900), JetBrains Mono (pesos 300, 400, 700), Exo 2 (pesos 300, 400, 600).
- Estilizar `html, body` com `background: var(--bg-primary)`, `color: var(--text-primary)`, `font-family: var(--font-body)`, `overflow-x: hidden`, `height: 100%`.
- Scrollbar customizada: `width: 6px`, `background: var(--bg-secondary)`, `thumb: var(--neon-cyan)` com `border-radius: 3px`.

---

## FUNÇÃO 007 — Background animado de partículas com canvas

No arquivo `static/js/core/app.js`, implementar um sistema de partículas no `<canvas id="particles-bg">`:
- Criar 120 partículas com posição aleatória, velocidade entre -0.5 e 0.5 em x e y, raio entre 1 e 3, opacidade aleatória entre 0.1 e 0.6.
- Cada partícula deve ser um ponto brilhante em cor `var(--neon-cyan)` ou `var(--neon-blue)` (50% de chance cada).
- Conectar partículas que estejam a menos de 120px de distância com uma linha cuja opacidade diminui com a distância.
- O mouse deve repelir partículas num raio de 80px, empurrando-as na direção oposta com força proporcional à distância.
- O canvas deve cobrir 100% da tela (`position: fixed; top: 0; left: 0; z-index: 0`).
- Usar `requestAnimationFrame` para animação contínua.
- Redimensionar o canvas automaticamente no evento `resize`.

---

## FUNÇÃO 008 — Layout principal em CSS Grid

No `main.css`, definir o layout do `#app-container`:
```css
#app-container {
  display: grid;
  grid-template-areas:
    "sidebar header header"
    "sidebar main    main"
    "sidebar footer  footer";
  grid-template-columns: 280px 1fr;
  grid-template-rows: 64px 1fr 40px;
  min-height: 100vh;
  position: relative;
  z-index: 1;
}
```
- `#sidebar` com `grid-area: sidebar`, `background: rgba(10,14,26,0.95)`, `border-right: 1px solid var(--border-glass)`, `backdrop-filter: var(--blur-glass)`, largura fixa de 280px.
- `#header` com `grid-area: header`, altura 64px, `background: rgba(10,14,26,0.8)`, `border-bottom: 1px solid var(--border-glass)`.
- `#main-content` com `grid-area: main`, `overflow-y: auto`, `padding: 20px`.
- `#footer` com `grid-area: footer`, `height: 40px`, texto de status e versão.
- Media query para mobile (`max-width: 768px`): colapsar sidebar (hambúrguer), grid de 1 coluna.

---

## FUNÇÃO 009 — Sidebar de navegação com ícones e indicadores de status

No `templates/index.html` e `main.css`, implementar a sidebar completa:
- Logo do GodEyes no topo: ícone de olho SVG + texto "GOD" em `--neon-cyan` + "EYES" em `--neon-green`, fonte Orbitron 900.
- Status do backend abaixo do logo: ponto verde pulsante + texto "SISTEMA ONLINE" ou "OFFLINE" que atualiza via WebSocket.
- Lista de navegação com os seguintes itens, cada um com ícone SVG único, label e badge de contagem quando relevante:
  - `[👁]` Dashboard Geral
  - `[📡]` Scanner de Rede
  - `[🛡]` Inspetor de Riscos
  - `[🗺]` Mapa de Ameaças
  - `[🛰]` Satélites Globais
  - `[💻]` Terminal Pen-Test
  - `[🔒]` VPN & Proxies
  - `[🌐]` DNS & Leak Test
  - `[🔍]` OSINT & Threat Intel
  - `[⚙]` Configurações
- Item ativo com `background: var(--bg-glass)`, `border-left: 3px solid var(--neon-cyan)`, `color: var(--neon-cyan)`.
- Hover com animação `translateX(4px)` e glow sutil.
- Na parte inferior da sidebar: IP local do usuário, latência para o backend e uptime do servidor.

---

## FUNÇÃO 010 — Header com informações em tempo real

No `templates/index.html` e `main.css`, implementar o header:
- À esquerda: breadcrumb com módulo atual (ex: "GOD EYES > SCANNER DE REDE").
- No centro: relógio digital em tempo real (horas:minutos:segundos) em fonte JetBrains Mono + data.
- À direita: 4 indicadores de status em pílulas coloridas:
  - `CPU: 23%` (verde/amarelo/vermelho conforme uso)
  - `RAM: 1.2GB` (idem)
  - `NET: ↑1.2MB/s ↓3.4MB/s` (velocidade da rede)
  - `PING: 12ms` (latência para o backend)
- Botão hambúrguer para mobile à esquerda do breadcrumb.
- Atualizar os indicadores a cada 2 segundos via WebSocket `system_stats` event.

---

## FUNÇÃO 011 — Cards com efeito Glassmorphism

No `static/css/glassmorphism.css`, implementar a classe `.glass-card`:
```css
.glass-card {
  background: var(--bg-glass);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-card);
  backdrop-filter: var(--blur-glass);
  -webkit-backdrop-filter: var(--blur-glass);
  box-shadow: 0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05);
  transition: border-color var(--transition-mid), box-shadow var(--transition-mid);
}
.glass-card:hover {
  border-color: rgba(0,255,200,0.3);
  box-shadow: 0 4px 30px rgba(0,0,0,0.3), 0 0 20px rgba(0,255,200,0.1), inset 0 1px 0 rgba(255,255,255,0.08);
}
.glass-card__header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-glass);
  display: flex;
  align-items: center;
  gap: 10px;
}
.glass-card__title {
  font-family: var(--font-ui);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--neon-cyan);
}
.glass-card__body { padding: 20px; }
```
Implementar também `.glass-card--danger` (border red), `.glass-card--warning` (border orange), `.glass-card--success` (border green).

---

## FUNÇÃO 012 — Sistema de notificações toast

No `static/js/utils/notifications.js`, implementar `class NotificationSystem`:
- Método `show(message, type, duration)` onde `type` é `'success'|'error'|'warning'|'info'|'hack'`.
- Criar elemento `<div class="toast toast--{type}">` com ícone, mensagem e barra de progresso.
- Injetar no container `#toast-container` (posição: `fixed; bottom: 20px; right: 20px; z-index: 9999`).
- Animação de entrada: `translateX(120%)` → `translateX(0)` em 300ms.
- Barra de progresso animando de 100% para 0% durante `duration` ms.
- Animação de saída: `translateX(120%)` em 300ms ao finalizar ou ao clicar.
- Para o tipo `'hack'`, adicionar efeito de "glitch": o texto deve piscar aleatoriamente com caracteres `@#$%&` por 500ms antes de mostrar o texto real.
- Máximo de 5 toasts simultâneos; ao atingir o limite, remover o mais antigo.
- Exportar instância global `window.notify`.

---

## FUNÇÃO 013 — Animações CSS globais

No `static/css/animations.css`, implementar todos os keyframes necessários:

```css
@keyframes pulse-neon { /* pulso de brilho neon */ }
@keyframes radar-spin { /* rotação contínua do radar */ }
@keyframes scan-line { /* linha de scan se movendo verticalmente */ }
@keyframes glitch { /* efeito glitch com clip-path e translateX */ }
@keyframes data-stream { /* texto caindo tipo matrix */ }
@keyframes fadeInUp { /* fade + translateY(-20px) → 0 */ }
@keyframes fadeInLeft { /* fade + translateX(-20px) → 0 */ }
@keyframes blink { /* piscar 50% opacity */ }
@keyframes loading-bar { /* barra de loading de 0 a 100% */ }
@keyframes orbit { /* rotação orbital */ }
@keyframes wave { /* onda de scan de rede */ }
@keyframes counter-up { /* números subindo */ }
```

Implementar classes utilitárias: `.animate-pulse-neon`, `.animate-glitch`, `.animate-blink`, `.animate-fadeInUp` com `animation-fill-mode: both`.

---

## FUNÇÃO 014 — Dashboard geral com métricas de visão geral

Implementar a view `#view-dashboard` com:
- Grid de 4 KPI cards no topo: "Dispositivos na Rede", "Ameaças Detectadas", "Proxies Ativos", "Satélites Rastreados".
- Cada KPI card com: número grande em `--neon-cyan`, label abaixo, indicador de tendência (seta ▲▼ com porcentagem), sparkline de 10 pontos usando `<canvas>` small.
- Seção central com 2 colunas: esquerda com gráfico de pizza (distribuição de risco da rede), direita com timeline de eventos das últimas 24h.
- Seção inferior com feed "Últimas Atividades" mostrando os 10 eventos mais recentes com timestamp, tipo (scan, threat, proxy, vpn) e descrição.
- Todos os dados alimentados via WebSocket `dashboard_update` event.
- Animação de entrada staggered (cada card com `animation-delay` incremental de 100ms).

---

# ════════════════════════════════════════════════════════════
# FASE 2 — SCANNER DE REDE (RADAR + DISPOSITIVOS)
# ════════════════════════════════════════════════════════════

## FUNÇÃO 015 — Backend: rota de descoberta de rede (`/api/network/scan`)

No `backend/routes/network.py`, implementar a rota `POST /api/network/scan`:
- Receber JSON body com `{ "target": "192.168.1.0/24", "scan_type": "quick|full|stealth" }`.
- Validar o CIDR via `ipaddress.ip_network(target, strict=False)`.
- Chamar `backend/services/nmap_service.py → NmapService.scan_network(target, scan_type)`.
- Retornar imediatamente `{ "status": "started", "scan_id": "uuid4" }` com HTTP 202.
- Executar o scan em thread separada (`threading.Thread`).
- Emitir eventos WebSocket `scan_progress` com `{ "scan_id", "progress": 0-100, "devices_found": N }` durante o scan.
- Ao finalizar, emitir `scan_complete` com a lista completa de dispositivos.
- Registrar em `logs/network_scan.log`.

---

## FUNÇÃO 016 — Backend: serviço Nmap (`NmapService`)

No `backend/services/nmap_service.py`, implementar `class NmapService`:

**Método `scan_network(target, scan_type)`:**
- `quick`: `nmap -sn -T4 --host-timeout 3s {target}` (ping scan, sem portas).
- `full`: `nmap -sV -T4 -O --script=banner -p {ports_quick} {target}`.
- `stealth`: `nmap -sS -T2 -f --mtu 24 -p {ports_quick} {target}` (requer root/admin).
- Usar `python-nmap` (`nmap.PortScanner()`).
- Para cada host encontrado, coletar: IP, hostname, status (up/down), MAC address, fabricante (via `manuf` library), OS detectado (se disponível), portas abertas com serviço e versão, tempo de resposta.
- Calcular nível de risco de cada dispositivo (ver Função 020).
- Retornar lista de dicionários com todos os campos.

**Método `scan_ports(ip, port_range)`:**
- Executar `nmap -sV -T4 -p {port_range} {ip}`.
- Retornar lista de portas com: número, protocolo, estado, serviço, versão, banner.

**Método `os_detection(ip)`:**
- Executar `nmap -O --osscan-limit {ip}`.
- Retornar: OS name, accuracy, type, vendor.

---

## FUNÇÃO 017 — Backend: identificação de fabricante por MAC

No `backend/services/scapy_service.py`, implementar `class ScapyService`:

**Método `get_manufacturer(mac_address)`:**
- Usar a library `manuf.MacParser()` para resolver o fabricante pelo prefixo OUI do MAC.
- Fazer fallback para consulta à API pública `https://api.macvendors.com/{mac}` se `manuf` falhar.
- Cache dos resultados em dicionário em memória por 1 hora.
- Retornar string com nome do fabricante ou "Unknown".

**Método `arp_scan(network_cidr)`:**
- Usar `scapy.srp()` com `Ether(dst="ff:ff:ff:ff:ff:ff")/ARP(pdst=network_cidr)`.
- Retornar lista de `{ip, mac}` de dispositivos que responderam.
- Timeout de 3 segundos.
- Requer privilégios de administrador; verificar e retornar erro descritivo se ausente.

---

## FUNÇÃO 018 — Frontend: radar SVG animado

No `static/js/modules/radar.js`, implementar `class RadarScanner`:
- Renderizar em `<canvas id="radar-canvas">` um radar circular:
  - Fundo preto com 4 círculos concêntricos em `rgba(0,255,200,0.1)`.
  - 2 linhas de grade cruzando o centro em `rgba(0,255,200,0.15)`.
  - Linha de varredura rotacionando 360° em 4 segundos (verde com gradiente que some).
  - "Eco" verde persistindo por 2 segundos onde a linha de varredura passou por um dispositivo.
- Método `addDevice(device)`: posicionar dispositivo como ponto no radar baseado no último octeto do IP (mapeado para posição radial) e no nível de risco (cor: verde=baixo, amarelo=médio, vermelho=alto).
- Ao clicar em um ponto, disparar evento `device:selected` com os dados do dispositivo.
- Ao passar o mouse sobre um ponto, mostrar tooltip com IP, fabricante e risco.
- Pulsar o ponto quando novo dispositivo for adicionado.

---

## FUNÇÃO 019 — Frontend: tabela de dispositivos com filtros

No `static/js/modules/network_scanner.js`, implementar a tabela de dispositivos:
- Tabela `<table id="devices-table">` com colunas: `#`, `IP`, `MAC`, `Fabricante`, `Hostname`, `OS`, `Portas Abertas`, `Risco`, `Ações`.
- Cada linha com cor de fundo sutil baseada no nível de risco (vermelho escuro, amarelo escuro, verde escuro).
- Badge de risco colorido com ícone na coluna "Risco".
- Coluna "Ações" com botões: `[SCAN PORTAS]`, `[DETALHES]`, `[BLOQUEAR]`.
- Filtros acima da tabela: campo de busca por IP/MAC/fabricante, dropdown de risco (Todos/Alto/Médio/Baixo), dropdown de OS.
- Ordenação por clique no cabeçalho de qualquer coluna (ascendente/descendente).
- Paginação de 10 itens por página com controles de navegação.
- Ao receber evento `scan_complete`, popular a tabela com animação de entrada linha por linha (stagger 50ms).
- Contador de dispositivos por categoria no topo da tabela.

---

## FUNÇÃO 020 — Backend: cálculo de nível de risco por dispositivo

No `backend/utils/validator.py`, implementar `class RiskCalculator`:

**Método `calculate_risk(device_data)`:**
Retornar `"HIGH" | "MEDIUM" | "LOW"` baseado nas seguintes regras:

**Alto Risco (qualquer uma):**
- Porta 23 (Telnet) aberta.
- Porta 21 (FTP) aberta sem TLS.
- Porta 3389 (RDP) aberta.
- Porta 22 (SSH) aberta com versão < OpenSSH 8.0.
- Mais de 10 portas abertas.
- OS é Windows XP, Windows 7 ou Windows Server 2008.
- Dispositivo tem IP terminado em .1 ou .254 (roteador/gateway).

**Médio Risco (qualquer uma):**
- Porta 80 (HTTP sem HTTPS) aberta.
- Porta 8080 aberta.
- Porta 25 (SMTP) aberta.
- OS não identificado mas com 5+ portas abertas.
- MAC de fabricante desconhecido.

**Baixo Risco:**
- Dispositivo só responde a ping.
- Apenas portas 443, 8443, 53 abertas.
- Nenhuma porta aberta detectada.

Adicionar campo `risk_reason: []` com lista de strings explicando cada fator de risco detectado.

---

## FUNÇÃO 021 — Backend: rota de detalhes do dispositivo (`/api/network/device/<ip>`)

No `backend/routes/network.py`, implementar `GET /api/network/device/<ip>`:
- Validar formato de IP com `ipaddress.ip_address(ip)`.
- Executar scan completo no IP específico: `nmap -sV -T4 -O -A -p 1-1024 {ip}`.
- Buscar informações adicionais: PTR record via `dnspython`, geolocalização via `ip-api.com`.
- Verificar CVEs conhecidos para cada serviço/versão detectado consultando `https://cve.circl.lu/api/search/{vendor}/{product}`.
- Retornar JSON completo com: info básica, portas detalhadas, OS, geolocalização, CVEs encontrados, score de risco calculado.
- Cache do resultado por 5 minutos.

---

## FUNÇÃO 022 — Frontend: modal de detalhes do dispositivo

No HTML/JS, implementar `class DeviceModal`:
- Modal `<div id="device-modal" class="glass-modal">` com overlay escuro.
- Header com IP grande, hostname, badge de risco e botão fechar.
- 3 abas: "VISÃO GERAL", "PORTAS & SERVIÇOS", "VULNERABILIDADES".
- Aba "Visão Geral": cards com OS, fabricante, MAC, tempo online, geolocalização num mini-mapa Leaflet.
- Aba "Portas & Serviços": tabela com todas as portas, protocolo, serviço, versão, banner.
- Aba "Vulnerabilidades": lista de CVEs encontrados com: ID, severidade (CVSS score + cor), descrição, link para detalhes.
- Animação de abertura: scale 0.8 + opacity 0 → scale 1 + opacity 1 em 300ms.
- Fechar ao clicar no overlay ou pressionar Escape.

---

# ════════════════════════════════════════════════════════════
# FASE 3 — MAPA DE AMEAÇAS (LEAFLET.JS + GEOLOCALIZAÇÃO)
# ════════════════════════════════════════════════════════════

## FUNÇÃO 023 — Frontend: inicialização do mapa Leaflet

No `static/js/modules/map.js`, implementar `class ThreatMap`:
- Inicializar mapa Leaflet em `<div id="threat-map">` centrado em `[-15.78, -47.93]` (Brasil) zoom 4.
- Usar tile layer dark: `https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png` (CartoDB Dark Matter).
- Adicionar controles: zoom, fullscreen (plugin `Leaflet.fullscreen`), escala.
- Aplicar filtro CSS no tile layer: `filter: hue-rotate(180deg) saturate(150%) brightness(0.8)` para efeito cyberpunk.
- Customizar cursor do mapa para crosshair.

---

## FUNÇÃO 024 — Frontend: plotagem de IPs no mapa com clustering

Na `class ThreatMap`:

**Método `plotIP(ip, data)`:**
- Consultar geolocalização via backend `GET /api/threat/geoip/{ip}`.
- Criar marcador customizado SVG com cor baseada no tipo: vermelho (ameaça), ciano (dispositivo local), laranja (suspeito).
- Marcador com pulso animado (círculo expandindo e desaparecendo continuamente).
- Popup do marcador com: IP, país, cidade, ISP, nível de ameaça, timestamp.

**Método `addCluster()`:**
- Usar `Leaflet.markercluster` para agrupar marcadores próximos.
- Clusters com estilo customizado cyberpunk (círculo com número, cor baseada na maioria de ameaças no cluster).

**Método `drawConnectionLine(from_ip, to_ip, type)`:**
- Desenhar linha animada entre dois pontos (para simular ataques/conexões).
- Tipo `'attack'`: linha vermelha tracejada com animação de dash-offset.
- Tipo `'connection'`: linha ciana sólida.
- Linhas desaparecem após 10 segundos com fade-out.

---

## FUNÇÃO 025 — Backend: geolocalização de IPs (`/api/threat/geoip/<ip>`)

No `backend/routes/threat.py`, implementar `GET /api/threat/geoip/<ip>`:
- Verificar se IP é privado via `ipaddress.ip_address(ip).is_private`. Se sim, retornar dados locais.
- Consultar `http://ip-api.com/json/{ip}?fields=status,country,countryCode,region,regionName,city,zip,lat,lon,isp,org,as,query` com timeout de 5s.
- Fallback para `https://ipinfo.io/{ip}/json` se ip-api falhar.
- Cache dos resultados em `backend/utils/cache.py` por 24 horas.
- Retornar JSON normalizado: `{ip, country, country_code, city, region, lat, lon, isp, org, asn, is_private}`.

---

## FUNÇÃO 026 — Backend: threat intelligence básica

No `backend/routes/threat.py`, implementar `GET /api/threat/check/<ip>`:
- Consultar `https://www.abuseipdb.com/api/v2/check` (usar chave gratuita do AbuseIPDB se configurada, caso contrário pular).
- Consultar lista de IPs maliciosos conhecidos do `https://lists.blocklist.de/lists/all.txt` (cachear por 6 horas).
- Verificar se IP está em qualquer blocklist local (`backend/data/blocklists/`).
- Retornar: `{ip, is_malicious, confidence_score, reports_count, categories, last_reported, sources}`.

---

## FUNÇÃO 027 — Frontend: painel lateral do mapa com estatísticas

Na view do mapa, adicionar painel lateral direito `.map-stats-panel`:
- Contador animado de "IPs plotados hoje".
- Top 5 países de origem de ameaças (barras horizontais).
- Feed ao vivo de "Últimas Conexões" (scroll automático, máximo 20 entradas visíveis).
- Botões de filtro: "Mostrar Apenas Ameaças", "Mostrar Dispositivos Locais", "Mostrar Todos".
- Toggle "AUTO-TRACK": quando ativo, plotar automaticamente qualquer novo IP detectado pelo scanner.
- Botão "LIMPAR MAPA" com confirmação.

---

# ════════════════════════════════════════════════════════════
# FASE 4 — RASTREAMENTO DE SATÉLITES (GLOBO 3D + TLE)
# ════════════════════════════════════════════════════════════

## FUNÇÃO 028 — Frontend: inicialização do globo 3D com Three.js

No `static/js/modules/globe3d.js`, implementar `class Globe3D`:
- Renderizar em `<canvas id="globe-canvas">` usando Three.js r128.
- Criar esfera com raio 200 e segmentos 64x64.
- Textura da Terra: `static/assets/textures/earth_daymap.jpg` (baixar de https://www.solarsystemscope.com/textures/).
- Normal map: `earth_normal_map.jpg` para relevo.
- Especular: `earth_specular_map.jpg` para brilho nos oceanos.
- Atmosfera: segunda esfera maior com material `MeshPhongMaterial` transparente em azul, `opacity: 0.1`, `transparent: true`, `side: THREE.FrontSide`.
- Luz ambiente `0x333333`, luz direcional `0xffffff` simulando o Sol.
- Rotação automática lenta (0.002 rad/frame) em Y.
- Controle de mouse: drag para rotacionar (implementar `OrbitControls` manualmente já que `THREE.OrbitControls` não está em r128, usando `mousedown`, `mousemove`, `mouseup`).
- Resize automático do canvas.

---

## FUNÇÃO 029 — Backend: busca e parse de dados TLE de satélites

No `backend/routes/satellites.py`, implementar `GET /api/satellites/tle`:
- Buscar dados TLE (Two-Line Element) de satélites da Celestrak:
  - ISS: `https://celestrak.org/SOCRATES/query.php` ou `https://celestrak.org/satcat/tle.php?INTDES=1998-067A`
  - Starlink: `https://celestrak.org/SOCRATES/query.php?catalog=STARLINK`
  - Satélites de interesse: ISS, Starlink (top 20), NOAA-15, NOAA-18, NOAA-19, Terra, Aqua, Landsat-9.
- Fazer fallback para `https://celestrak.org/SOCRATES/query.php` direto.
- Parsear cada TLE (3 linhas) extraindo: nome, NORAD ID, época, inclinação, RAAN, excentricidade, argumento do perigeu, anomalia média, movimento médio.
- Cachear resultado por 10 minutos.
- Retornar array de objetos TLE normalizados.

---

## FUNÇÃO 030 — Frontend: cálculo de posição orbital e plotagem de satélites

Na `class Globe3D`:

**Método `calculateSatellitePosition(tle_data, timestamp)`:**
- Implementar SGP4 simplificado em JavaScript para calcular latitude/longitude/altitude a partir do TLE e timestamp.
- Usar a biblioteca `satellite.js` (importar de CDN ou local).
- Converter ECI coordinates para geographic coordinates.

**Método `addSatellite(sat_data)`:**
- Criar objeto 3D para o satélite: `SphereGeometry(2, 8, 8)` com material emissivo em cor baseada no tipo (ISS=ciano, Starlink=branco, espionagem=vermelho, NOAA=verde).
- Posicionar na superfície da esfera + altitude em escala.
- Adicionar órbita: `LineLoop` com `RingGeometry` inclinado conforme inclinação orbital.
- Label com nome do satélite visível ao passar o mouse (raycasting).
- Atualizar posição a cada segundo.

---

## FUNÇÃO 031 — Frontend: sistema de "lock-on" em satélites

Na `class Globe3D`:

**Método `lockOnSatellite(satellite_id)`:**
- Ao clicar em um satélite, a câmera suavemente se move para focar nele (`TWEEN.js` para interpolação).
- Mostrar painel lateral `#sat-details-panel` com:
  - Nome, NORAD ID, país de origem, propósito.
  - Posição atual: lat, lon, altitude (km), velocidade (km/s).
  - Próximas passagens sobre a sua localização (calcular para as próximas 24h).
  - "Frequências de comunicação" (simuladas para satélites militares, reais para NOAA via `satnogs`).
- Botão "INTERCEPTAR SINAL": abre modal com simulação de telemetria (dados fictícios realistas).
- Botão "RASTREAR": manter câmera seguindo o satélite em tempo real.
- Raio vermelho pulsante saindo do globo em direção ao satélite selecionado.

---

## FUNÇÃO 032 — Frontend: painel de informações de satélites

Na view de satélites, implementar `#satellites-panel`:
- Lista scrollável de todos os satélites rastreados com: nome, altitude, velocidade, status (ativo/inativo).
- Campo de busca por nome ou NORAD ID.
- Filtros por categoria: ISS, Starlink, Clima, Espionagem, GPS, Comunicação.
- Botão "ATUALIZAR TLE" que força nova busca na Celestrak.
- Indicador de última atualização com countdown para próximo refresh.
- Card especial para a ISS com link para posição ao vivo e próximas passagens.

---

# ════════════════════════════════════════════════════════════
# FASE 5 — TERMINAL DE PEN-TEST
# ════════════════════════════════════════════════════════════

## FUNÇÃO 033 — Frontend: terminal emulador completo

No `static/css/terminal.css` e `static/js/modules/terminal.js`, implementar `class Terminal`:

**Estilo CSS:**
- Fundo `#000` com `opacity: 0.95`, borda `1px solid var(--neon-green)`, `border-radius: 8px`.
- Fonte `JetBrains Mono 13px`, cor padrão `var(--neon-green)`.
- Scrollbar invisível mas funcional.
- Header com 3 círculos (vermelho, amarelo, verde) estilo macOS + título "GODEYES-TERMINAL v2.0".
- Linha de scan animada (pseudo-elemento horizontal se movendo de cima para baixo).
- Efeito CRT: `text-shadow: 0 0 5px currentColor` e `filter: contrast(1.1) brightness(0.9)`.

**Funcionalidades JS:**
- Histórico de comandos (seta ↑↓ para navegar).
- Autocompletar com Tab (lista de comandos disponíveis).
- Comando `help` listando todos os comandos disponíveis com descrições.
- Comando `clear` limpando o terminal.
- Digitação com efeito typewriter (opcional, toggle com `set typewriter on/off`).
- Copiar saída com Ctrl+C (linha atual ou seleção).
- Exportar histórico do terminal com `export log`.

---

## FUNÇÃO 034 — Backend: endpoint de execução de comandos do terminal (`/api/pentest/execute`)

No `backend/routes/pentest.py`, implementar `POST /api/pentest/execute`:
- Receber `{ "command": "nmap 192.168.1.1", "session_id": "uuid" }`.
- Parser de comando: extrair ferramenta (`nmap`, `scan`, `vuln`, `brute`, `exploit`, `ping`, `traceroute`, `whois`, `dig`) e argumentos.
- Validar que o alvo é IP/domínio privado/local (não permitir escanear IPs públicos sem confirmação explícita).
- Executar via subprocess com timeout de 60 segundos.
- Streamar a saída linha por linha via WebSocket `terminal_output` event.
- Registrar em `logs/pentest.log` com timestamp, comando, usuário (IP do cliente) e resultado resumido.
- Nunca executar comandos que não estejam na whitelist de ferramentas permitidas.

---

## FUNÇÃO 035 — Terminal: comando `scan` (port scanner)

Implementar o comando `scan` no terminal:

**Sintaxe:** `scan <ip/cidr> [--ports <range>] [--type quick|full|stealth] [--output table|json]`

- `scan 192.168.1.1` → scan rápido das portas principais.
- `scan 192.168.1.0/24` → descoberta de hosts na rede.
- `scan 192.168.1.1 --ports 1-1024` → scan de intervalo específico.
- `scan 192.168.1.1 --type full` → scan completo com detecção de versão e OS.

Saída formatada:
```
[*] Iniciando scan em 192.168.1.1...
[+] Host: 192.168.1.1 (router.local) - ONLINE
    PORT     STATE  SERVICE   VERSION
    22/tcp   open   ssh       OpenSSH 8.4
    80/tcp   open   http      nginx 1.18
    443/tcp  open   https     nginx 1.18
[+] 3 portas abertas encontradas em 4.2s
```

---

## FUNÇÃO 036 — Terminal: comando `vuln` (vulnerability scanner)

Implementar o comando `vuln` no terminal:

**Sintaxe:** `vuln <ip> [--service <service_name>] [--cve <cve_id>]`

- Chamar backend `POST /api/pentest/vuln_scan` com IP e lista de serviços detectados.
- Backend consultar CVE database `https://cve.circl.lu/api/search/{product}` para cada serviço.
- Também executar `nmap --script=vuln {ip}` para detecção automática.
- Saída formatada com severidade colorida:
  - `[CRÍTICO]` em vermelho piscante.
  - `[ALTO]` em laranja.
  - `[MÉDIO]` em amarelo.
  - `[BAIXO]` em verde.
  - Cada CVE com: ID, CVSS score, descrição curta, solução recomendada.

---

## FUNÇÃO 037 — Terminal: comando `brute` (simulação de brute force)

Implementar o comando `brute` no terminal:

**Sintaxe:** `brute <ip> --proto ssh|ftp|http --user <username> [--wordlist common|full]`

- Executar simulação visual apenas (sem ataque real a sistemas não autorizados).
- Mostrar tentativas de senha uma por uma com efeito de digitação rápida.
- Usar lista de senhas comuns: `admin`, `123456`, `password`, `root`, etc.
- Mostrar contagem de tentativas, tempo decorrido e "taxa de tentativas/s".
- Simular encontrar a senha após N tentativas com: `[!!!] CREDENCIAIS ENCONTRADAS: user:password`.
- Para SSH real (na rede local), usar `paramiko` para testar credenciais com timeout de 2s por tentativa.
- Implementar rate limiting de 1 tentativa por segundo para não bloquear dispositivos.
- Exibir aviso ético antes de executar: `[!] USO PERMITIDO APENAS EM REDES PRÓPRIAS`.

---

## FUNÇÃO 038 — Terminal: comando `exploit` (framework de exploits simulado)

Implementar o comando `exploit` no terminal estilo Metasploit:

- `exploit list` → listar módulos disponíveis (simulados).
- `exploit use <module_name>` → selecionar módulo.
- `exploit set TARGET <ip>` → definir alvo.
- `exploit set PAYLOAD <payload_name>` → selecionar payload.
- `exploit run` → executar (simulação visual).

Módulos simulados disponíveis:
- `ms17-010/eternalblue` (Windows SMB).
- `vsftpd-2.3.4/backdoor` (FTP backdoor).
- `ssh/ssh_login` (SSH brute force real).
- `http/apache_struts2_rce` (Apache Struts).

Cada execução deve mostrar output realista de exploitation com progress bars, erros simulados, conexões de "meterpreter" fictícias, e sempre ao final: `[SIMULAÇÃO] Este módulo é apenas demonstrativo.`

---

## FUNÇÃO 039 — Terminal: comandos de rede básicos

Implementar os seguintes comandos de rede no terminal:

**`ping <host> [--count N]`:** Executar ping real via subprocess (`ping -n {count} {host}` no Windows, `ping -c {count} {host}` no Linux). Formatar saída com RTT colorido (verde<50ms, amarelo<200ms, vermelho>200ms).

**`traceroute <host>`:** Executar `tracert` (Windows) ou `traceroute` (Linux) via subprocess. Formatar com numeração e RTTs coloridos.

**`whois <domain/ip>`:** Consultar `https://whois.domaintools.com/api/v1/whois/{target}` ou usar `python-whois` library.

**`dig <domain> [type]`:** Usar `dnspython` para resolver registros DNS (A, AAAA, MX, NS, TXT, CNAME). Formatar saída estilo `dig` original.

**`netstat`:** Mostrar conexões ativas no sistema local via `psutil.net_connections()`. Formatar tabela com: protocolo, endereço local, endereço remoto, estado, PID, processo.

---

## FUNÇÃO 040 — Terminal: histórico de sessão e exportação

Implementar no terminal:

**Histórico persistente em `localStorage`:**
- Salvar últimos 1000 comandos com timestamps.
- `history` → listar todos os comandos da sessão atual.
- `history clear` → limpar histórico.
- `!!` → repetir último comando.
- `!<N>` → executar comando número N do histórico.

**Exportação:**
- `export log` → baixar arquivo `.txt` com todo o output do terminal atual.
- `export report` → gerar relatório HTML formatado com todas as descobertas da sessão (chamando backend `POST /api/pentest/generate_report`).

**Sessões:**
- Múltiplas abas de terminal (máximo 4), cada uma com histórico independente.
- Botão `+` para nova aba, `×` para fechar.

---

# ════════════════════════════════════════════════════════════
# FASE 6 — VPN, PROXIES E ANONIMATO
# ════════════════════════════════════════════════════════════

## FUNÇÃO 041 — Backend: buscador de proxies reais (`ProxyService`)

No `backend/services/proxy_service.py`, implementar `class ProxyService`:

**Método `fetch_proxies()`:**
- Buscar proxies de múltiplas fontes em paralelo usando `threading.Thread`:
  - `https://www.proxy-list.download/api/v1/get?type=socks5`
  - `https://api.proxyscrape.com/v2/?request=getproxies&protocol=socks5&timeout=10000`
  - `https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks5.txt`
  - `https://raw.githubusercontent.com/hookzof/socks5_list/master/proxy.txt`
- Parsear cada lista (formato `ip:porta` uma por linha).
- Desduplicar e retornar lista unificada.

**Método `test_proxy(ip, port, timeout=5)`:**
- Tentar requisição GET para `http://httpbin.org/ip` via proxy SOCKS5.
- Usar `requests` com `proxies={'https': f'socks5://{ip}:{port}', 'http': f'socks5://{ip}:{port}'}`.
- Medir latência (tempo da requisição).
- Verificar se o IP retornado é diferente do IP real (anonimato confirmado).
- Retornar: `{ip, port, latency_ms, country, is_working, anonymity_level}`.

**Método `test_all_proxies(proxy_list, max_workers=50)`:**
- Testar todos os proxies em paralelo usando `ThreadPoolExecutor`.
- Emitir progresso via WebSocket `proxy_test_progress`.
- Retornar apenas proxies funcionais ordenados por latência.

---

## FUNÇÃO 042 — Backend: configuração de proxy no sistema (`/api/proxy/set`)

No `backend/routes/proxy.py`, implementar `POST /api/proxy/set`:
- Receber `{ "ip": "...", "port": "...", "type": "socks5|http" }`.
- No Windows: modificar o registro `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Internet Settings`:
  - `ProxyEnable` = 1
  - `ProxyServer` = `{type}={ip}:{port}`
  - `ProxyOverride` = `localhost;127.0.0.1;<local>`
  - Usar `winreg` module.
  - Notificar o sistema via `ctypes.windll.Wininet.InternetSetOptionW` com flags `INTERNET_OPTION_SETTINGS_CHANGED` e `INTERNET_OPTION_REFRESH`.
- No Linux: modificar `~/.bashrc` adicionando variáveis `http_proxy`, `https_proxy`, `ALL_PROXY`.
- Retornar: `{ "status": "success", "proxy_set": "{ip}:{port}", "system_notified": true }`.

---

## FUNÇÃO 043 — Backend: remoção de proxy do sistema (`/api/proxy/clear`)

No `backend/routes/proxy.py`, implementar `POST /api/proxy/clear`:
- No Windows: via `winreg`, setar `ProxyEnable = 0` e limpar `ProxyServer`.
- Notificar sistema via `ctypes`.
- No Linux: remover entradas de proxy do `~/.bashrc`.
- Retornar confirmação com IP atual (deve ser o IP real novamente).

---

## FUNÇÃO 044 — Backend: DNS Leak Test (`/api/proxy/dns_leak`)

No `backend/routes/proxy.py`, implementar `GET /api/proxy/dns_leak`:
- Fazer 5 requisições DNS para subdomínios únicos de `dnsleaktest.com` (ex: `uid-{random}.dnsleaktest.com`).
- Consultar `https://bash.ws/dnsleak/test/{random}/result` para obter lista de servidores DNS que responderam.
- Comparar com o IP do proxy configurado.
- Detectar leak: se algum servidor DNS for do ISP real do usuário enquanto proxy está ativo → LEAK DETECTADO.
- Retornar: `{ "leak_detected": bool, "dns_servers": [{ip, isp, country, is_suspicious}], "recommendation": "..." }`.

---

## FUNÇÃO 045 — Backend: IP Leak Test e WebRTC (`/api/proxy/ip_check`)

No `backend/routes/proxy.py`, implementar `GET /api/proxy/ip_check`:
- Consultar múltiplos serviços de detecção de IP:
  - `https://api.ipify.org?format=json`
  - `https://api4.my-ip.io/ip.json`
  - `https://api64.ipify.org?format=json`
- Verificar se os 3 retornam o mesmo IP (consistência).
- Geolocalizar o IP retornado.
- Retornar: `{ "detected_ip": "...", "geo": {...}, "is_proxy_active": bool, "consistency": bool }`.

Frontend deve também implementar WebRTC leak test em JavaScript (abre RTCPeerConnection e verifica se IP local vaza via ICE candidates).

---

## FUNÇÃO 046 — Frontend: painel de VPN e proxies

Na view `#view-vpn`, implementar:
- Botão grande "BUSCAR PROXIES" com spinner animado durante a busca.
- Progress bar durante o teste de proxies com `X/Y testados`.
- Tabela de proxies funcionais: IP, porta, país (bandeira), latência (barra visual), anonimato (Transparent/Anonymous/Elite), uptime %, ações.
- Ordenar por latência por padrão.
- Filtros: por país, por latência máxima, apenas Elite.
- Botão "ATIVAR" em cada proxy que chama o backend para configurar o sistema.
- Indicador de status do proxy ativo (IP, latência em tempo real, uptime).
- Seção "Testes de Segurança" com botões: DNS Leak Test, IP Leak Test, WebRTC Test.
- Cada teste mostra resultado visual: ✅ SEGURO ou ❌ VAZAMENTO com detalhes.

---

# ════════════════════════════════════════════════════════════
# FASE 7 — DNS, OSINT E THREAT INTELLIGENCE
# ════════════════════════════════════════════════════════════

## FUNÇÃO 047 — Backend: serviço DNS completo

No `backend/services/dns_service.py`, implementar `class DNSService` usando `dnspython`:

**Método `resolve_all(domain)`:**
- Consultar todos os tipos de registro: A, AAAA, MX, NS, TXT, SOA, CNAME, PTR, SRV.
- Para cada tipo, retornar lista de valores com TTL.
- Usar resolver configurável (padrão: 8.8.8.8, 1.1.1.1).

**Método `reverse_lookup(ip)`:**
- Resolver PTR record para o IP.
- Retornar hostname ou None.

**Método `check_blacklists(domain_or_ip)`:**
- Verificar em 10+ DNSBL populares: `zen.spamhaus.org`, `bl.spamcop.net`, `b.barracudacentral.org`, `dnsbl.sorbs.net`, `ix.dnsbl.manitu.net`, etc.
- Retornar lista de blacklists onde está listado.

**Método `zone_transfer_attempt(domain)`:**
- Tentar AXFR em cada nameserver do domínio.
- Retornar registros se bem-sucedido (vulnerabilidade grave) ou erro específico.

---

## FUNÇÃO 048 — Backend: OSINT - coleta de informações de domínio

No `backend/routes/threat.py`, implementar `POST /api/threat/osint`:
- Receber `{ "target": "domain.com", "type": "domain|ip|email" }`.
- Para domínio, coletar em paralelo:
  - Registros DNS (via DNSService).
  - WHOIS (via `python-whois`).
  - Certificados SSL: consultar `https://crt.sh/?q={domain}&output=json` para histórico de certificados.
  - Subdomínios: consultar `https://api.hackertarget.com/hostsearch/?q={domain}`.
  - Tecnologias: consultar `https://api.wappalyzer.com/lookup/v2/?urls=https://{domain}` (se API key disponível).
  - Shodan: `https://api.shodan.io/shodan/host/search?key={key}&query=hostname:{domain}` (se API key disponível).
- Emitir progresso via WebSocket `osint_progress`.
- Retornar relatório completo JSON.

---

## FUNÇÃO 049 — Frontend: view OSINT com visualização de resultados

Na view `#view-osint`, implementar:
- Campo de busca com ícone e placeholder `"Digite um domínio, IP ou email..."`.
- Seletor de tipo: `[DOMÍNIO] [IP] [EMAIL]`.
- Botão "INVESTIGAR" com efeito de "scanning" (varredura visual na tela durante 2s antes de mostrar resultados).
- Resultados organizados em abas colapsáveis:
  - DNS Records (tabela formatada por tipo).
  - WHOIS (dados de registro do domínio).
  - Subdomínios encontrados (lista com IPs resolvidos).
  - Certificados SSL (timeline visual de emissões).
  - Shodan (se disponível).
- Botão "EXPORTAR RELATÓRIO" gerando PDF do relatório OSINT.
- Campo de busca com histórico de pesquisas recentes.

---

## FUNÇÃO 050 — Backend: monitoramento contínuo de rede (`/api/network/monitor`)

No `backend/routes/network.py`, implementar WebSocket handler `monitor_network`:
- Ao receber evento `start_monitor` do frontend, iniciar loop em thread separada.
- A cada 30 segundos, executar ARP scan na rede local.
- Detectar novos dispositivos (não vistos antes) → emitir `new_device_detected`.
- Detectar dispositivos que saíram da rede → emitir `device_left`.
- Detectar mudança de MAC em IP existente (possível ARP spoofing) → emitir `arp_spoof_alert`.
- Monitorar tráfego via `psutil.net_io_counters()` e emitir `network_stats` a cada 2s.
- Emitir `monitor_heartbeat` a cada 10s para confirmar que o monitor está ativo.
- Ao receber `stop_monitor`, encerrar o loop graciosamente.

---

# ════════════════════════════════════════════════════════════
# FASE 8 — SISTEMA DE TUNNEL E CONECTIVIDADE REMOTA
# ════════════════════════════════════════════════════════════

## FUNÇÃO 051 — Backend: serviço de tunnel (`TunnelService`)

No `backend/services/tunnel_service.py`, implementar `class TunnelService`:

**Método `start_localhost_run(port)`:**
- Executar `ssh -R 80:localhost:{port} nokey@localhost.run` via `subprocess.Popen`.
- Capturar stdout para extrair a URL pública gerada (regex: `https://[a-z0-9]+\.lhr\.life`).
- Salvar URL em `TUNNEL_URL` no `.env` e em memória.
- Retornar URL ou None em caso de falha.

**Método `start_ngrok(port)`:**
- Verificar se `ngrok` está instalado.
- Se não, baixar de `https://ngrok.com/download` e extrair.
- Executar `ngrok http {port}` e consultar `http://localhost:4040/api/tunnels` para obter a URL pública.
- Retornar URL.

**Método `get_status()`:**
- Retornar se algum tunnel está ativo, qual URL pública, latência do tunnel.

**Método `stop()`:**
- Encerrar processo do tunnel graciosamente.

---

## FUNÇÃO 052 — Backend: rota de gerenciamento do tunnel (`/api/tunnel/*`)

Implementar rotas:
- `POST /api/tunnel/start` → iniciar tunnel (localhost.run ou ngrok, configurável).
- `POST /api/tunnel/stop` → parar tunnel.
- `GET /api/tunnel/status` → retornar status, URL pública, uptime, bytes transferidos.
- `GET /api/tunnel/qrcode` → gerar QR code da URL pública (usar biblioteca `qrcode`).

---

## FUNÇÃO 053 — Frontend: painel de configurações de tunnel

Na view `#view-settings`, seção "Conectividade Remota":
- Toggle "TUNNEL ATIVO" com switch animado.
- Ao ativar, mostrar spinner e mensagem "Estabelecendo túnel...".
- Ao conectar, mostrar URL pública em caixa de código com botão "COPIAR".
- QR Code da URL para acesso mobile.
- Status: latência do tunnel, bytes up/down, tempo conectado.
- Seletor de provedor: `[LOCALHOST.RUN] [NGROK]`.
- Aviso de segurança: "⚠️ O tunnel expõe este servidor para a internet. Use apenas em redes confiáveis."

---

# ════════════════════════════════════════════════════════════
# FASE 9 — SISTEMA DE WEBSOCKET E TEMPO REAL
# ════════════════════════════════════════════════════════════

## FUNÇÃO 054 — Backend: handlers WebSocket (`flask-socketio`)

No `app.py`, implementar todos os handlers WebSocket:

```python
@socketio.on('connect')
def handle_connect():
    emit('server_ready', {'version': '2.0', 'modules': get_active_modules()})

@socketio.on('subscribe')
def handle_subscribe(data):
    room = data.get('room')
    join_room(room)

@socketio.on('start_scan')
def handle_start_scan(data): ...

@socketio.on('start_monitor')
def handle_start_monitor(data): ...

@socketio.on('stop_monitor')
def handle_stop_monitor(): ...

@socketio.on('ping_backend')
def handle_ping():
    emit('pong', {'timestamp': time.time()})
```

Implementar sistema de rooms para múltiplos clientes: cada cliente entra no room `'client_{session_id}'` e recebe apenas eventos direcionados a ele.

---

## FUNÇÃO 055 — Frontend: cliente WebSocket com reconexão automática

No `static/js/core/socket.js`, implementar `class SocketManager`:
- Conectar via `socket.io-client` ao servidor Flask.
- Reconexão exponencial: tentar a cada 1s, 2s, 4s, 8s, 16s (máximo 5 tentativas).
- Ao reconectar, re-subscribir em todos os rooms que estava.
- Indicador visual na sidebar: ponto verde pulsante (conectado) ou vermelho piscando (desconectado).
- Fila de mensagens: armazenar eventos emitidos enquanto desconectado e reenviar ao reconectar.
- Medir latência: enviar `ping_backend` a cada 5s, calcular RTT.
- Método `on(event, callback)` com suporte a wildcards (ex: `on('scan_*', callback)`).
- Log de todos os eventos no console em modo desenvolvimento.

---

## FUNÇÃO 056 — Backend: emissão de stats do sistema em tempo real

No `app.py`, criar background thread que emite a cada 2 segundos:

```python
def emit_system_stats():
    while True:
        stats = {
            'cpu_percent': psutil.cpu_percent(interval=1),
            'ram_used_gb': psutil.virtual_memory().used / 1e9,
            'ram_percent': psutil.virtual_memory().percent,
            'net_bytes_sent': psutil.net_io_counters().bytes_sent,
            'net_bytes_recv': psutil.net_io_counters().bytes_recv,
            'disk_percent': psutil.disk_usage('/').percent,
            'timestamp': time.time()
        }
        socketio.emit('system_stats', stats)
        time.sleep(2)
```

Iniciar essa thread com `threading.Thread(target=emit_system_stats, daemon=True).start()`.

---

# ════════════════════════════════════════════════════════════
# FASE 10 — CONFIGURAÇÕES E PERSONALIZAÇÃO
# ════════════════════════════════════════════════════════════

## FUNÇÃO 057 — Frontend: view de configurações

Na view `#view-settings`, implementar 5 seções em abas:

**Aba "Geral":**
- Campo: Tema (Midnight Cyber / Neon Green / Blood Red / Ice Blue).
- Campo: Idioma (PT-BR / EN / ES).
- Toggle: Animações reduzidas.
- Toggle: Sons de interface.
- Campo: Atualização automática do dashboard (intervalo em segundos).

**Aba "Scanner":**
- Campo: Range de portas padrão.
- Campo: Timeout de scan.
- Campo: Threads paralelas.
- Toggle: Detecção de OS.
- Toggle: Detecção de versão de serviço.

**Aba "APIs":**
- Campo: Shodan API Key (com botão de teste).
- Campo: AbuseIPDB API Key.
- Campo: VirusTotal API Key.
- Indicador de status para cada API (válida/inválida/não configurada).

**Aba "Rede":**
- Toggle: Tunnel automático na inicialização.
- Seletor de provedor de tunnel.
- Campo: Interface de rede padrão (dropdown com interfaces do sistema).

**Aba "Segurança":**
- Toggle: Modo stealth (minimizar logs no sistema).
- Toggle: Criptografar logs locais.
- Botão: Limpar todos os logs.
- Botão: Resetar configurações padrão.

---

## FUNÇÃO 058 — Backend: persistência de configurações (`/api/settings/*`)

Implementar rotas:
- `GET /api/settings` → ler `config.json` e `.env` e retornar configurações mescladas.
- `POST /api/settings` → receber objeto com configurações, validar cada campo, salvar em `config.json` e `.env`.
- `POST /api/settings/test-api` → receber `{service: 'shodan', key: 'xxx'}` e testar a chave de API fazendo uma requisição de teste.
- `POST /api/settings/reset` → restaurar `config.json` e `.env` para valores padrão (Função 004).

---

## FUNÇÃO 059 — Backend: sistema de logging estruturado

No `backend/utils/logger.py`, implementar `class GodEyesLogger`:
- Usar `logging` module do Python com handlers customizados.
- `FileHandler` para `logs/app.log` (rotation: máximo 5MB, manter 3 arquivos).
- `StreamHandler` para console com cores via `colorama`.
- Formato: `[TIMESTAMP] [LEVEL] [MODULE] mensagem`.
- Método `log_scan(ip, scan_type, result_count)`.
- Método `log_threat(ip, threat_type, severity)`.
- Método `log_proxy(action, ip, port, latency)`.
- Método `log_terminal(session_id, command, result_summary)`.
- Nível configurável via `LOG_LEVEL` no `.env`.

---

## FUNÇÃO 060 — Frontend: view de logs em tempo real

Na view `#view-settings`, sub-seção "Logs do Sistema":
- Tabela de logs em tempo real alimentada via WebSocket `log_entry` event.
- Filtros: por nível (DEBUG/INFO/WARN/ERROR), por módulo, por texto.
- Auto-scroll para novo conteúdo (toggle on/off).
- Máximo 500 entradas na view (as mais antigas são removidas do DOM).
- Cada entrada com: timestamp, badge de nível colorido, módulo, mensagem.
- Botão "EXPORTAR LOGS" para download do arquivo de log completo.
- Botão "LIMPAR VIEW" (não apaga o arquivo, apenas a visualização).

---

# ════════════════════════════════════════════════════════════
# FASE 11 — GERAÇÃO DE RELATÓRIOS
# ════════════════════════════════════════════════════════════

## FUNÇÃO 061 — Backend: geração de relatório HTML de scan de rede

No `backend/routes/network.py`, implementar `POST /api/network/report`:
- Receber `{ "scan_id": "...", "format": "html|json|pdf" }`.
- Para formato `html`: gerar relatório HTML completo com:
  - Cabeçalho com logo, data/hora, rede escaneada.
  - Sumário executivo: total de dispositivos, distribuição de risco, recomendações principais.
  - Tabela completa de dispositivos com todos os detalhes.
  - Seção de vulnerabilidades ordenadas por severidade.
  - Seção de recomendações.
  - Footer com versão do GodEyes.
- Para formato `json`: retornar o JSON completo do scan.
- Para formato `pdf`: usar `weasyprint` ou `pdfkit` para converter o HTML em PDF.
- Salvar arquivo em `reports/` com nome `scan_{date}_{time}.{format}`.
- Retornar URL de download.

---

## FUNÇÃO 062 — Backend: geração de relatório de pen-test

No `backend/routes/pentest.py`, implementar `POST /api/pentest/generate_report`:
- Receber `{ "session_id": "..." }` com histórico de comandos e resultados da sessão.
- Gerar relatório HTML/PDF com:
  - Seção "Escopo": alvos testados, datas, metodologia.
  - Seção "Descobertas": por dispositivo, listando portas, serviços e CVEs.
  - Seção "Evidências": output relevante do terminal (formatado).
  - Seção "Recomendações": por severidade.
  - Seção "Conclusão".
- Incluir gráficos SVG inline: pizza de severidades, barras de portas mais abertas.

---

# ════════════════════════════════════════════════════════════
# FASE 12 — MELHORIAS VISUAIS AVANÇADAS
# ════════════════════════════════════════════════════════════

## FUNÇÃO 063 — Frontend: efeito Matrix/data stream no background

Implementar efeito Matrix como camada decorativa (atrás das partículas mas à frente do fundo puro):
- `<canvas id="matrix-canvas">` em `position: fixed; z-index: -1; opacity: 0.03`.
- Colunas de caracteres caindo: mix de números binários e caracteres katakana.
- Cor base: `var(--neon-green)`.
- Primeira letra de cada coluna em branco (destaque).
- Velocidade e densidade configuráveis.
- Pausa quando a aba não está visível (Page Visibility API).

---

## FUNÇÃO 064 — Frontend: animação de "boot sequence" na inicialização

Ao carregar o app pela primeira vez (ou após F5):
- Mostrar `<div id="boot-screen">` sobreposto em fullscreen com fundo preto.
- Sequência de texto animado estilo terminal:
  ```
  GODEYES SECURITY FRAMEWORK v2.0
  > Inicializando módulos de segurança...
  > [████████████] 100% - Core loaded
  > Conectando ao backend...
  > [████████████] 100% - Backend online
  > Carregando inteligência de ameaças...
  > Sistema pronto.
  ```
- Cada linha aparece com efeito typewriter (30ms por caractere).
- Barra de progresso animada.
- Após 3-4 segundos (ou ao pressionar qualquer tecla), fazer fade-out do boot screen revelando o dashboard.
- Salvar flag `booted: true` no `sessionStorage` para não mostrar novamente na mesma sessão.

---

## FUNÇÃO 065 — Frontend: micro-interações e feedback tátil

Implementar micro-interações em todos os elementos interativos:
- Botões: `transform: scale(0.96)` no `:active` + ripple effect ao clicar (círculo se expandindo).
- Links de nav: underline animado da esquerda para a direita.
- Inputs: borda animada colorida ao focar, sombra neon sutil.
- Checkboxes e toggles: animação de slide suave.
- Cards: leve `translateY(-2px)` no hover.
- Ícones de ação: rotação de 15° ao hover.
- Números contadores: animação de "roll up" (os dígitos rolam como slot machine).
- Tabelas: highlight suave na linha ao hover, fade-in linha por linha ao popular.

---

## FUNÇÃO 066 — Frontend: tema dinâmico com CSS variables

Implementar sistema de temas via JavaScript:
- Quatro temas: `midnight_cyber` (padrão), `neon_green`, `blood_red`, `ice_blue`.
- Cada tema é um objeto JS com overrides das CSS variables.
- Ao trocar de tema: aplicar transição CSS suave (`transition: color 300ms, background-color 300ms` em todos os elementos).
- Salvar preferência no `localStorage`.
- Aplicar tema antes do primeiro render para evitar flash.
- Preview dos temas nas configurações com miniaturas.

---

## FUNÇÃO 067 — Frontend: sons de interface (opcional, ativável)

Implementar sistema de áudio com Web Audio API:
- Ao clicar em botões principais: som de "beep" eletrônico curto.
- Ao receber alerta de ameaça: som de alarme (3 beeps ascendentes).
- Ao completar um scan: som de "chime" positivo.
- Ao abrir o terminal: som de "startup" (teclado mecânico).
- Ao escrever no terminal: clique suave de teclado (pode ser desativado).
- Ao detectar novo dispositivo: ping de radar.
- Todos os sons gerados via Web Audio API (sem arquivos externos).
- Volume controlável e toggle on/off nas configurações.

---

## FUNÇÃO 068 — Frontend: tooltips informativos

Implementar sistema de tooltips personalizado:
- Atributo `data-tooltip="texto"` em qualquer elemento.
- Tooltip aparece após 500ms de hover.
- Posicionamento automático (evitar sair da viewport): top, bottom, left, right.
- Estilo: glassmorphism com seta, fonte mono, max-width 280px.
- Suporte a HTML no tooltip (para tooltips ricos com títulos e listas).
- Tooltips específicos:
  - Cada ícone da sidebar com nome do módulo.
  - Cada métrica do header com explicação.
  - Cada CVE com resumo da vulnerabilidade.
  - Cada tipo de scan com descrição do que faz.

---

## FUNÇÃO 069 — Frontend: painel de alertas e notificações

Implementar `#alerts-panel` (acessível via ícone de sino no header):
- Badge com contagem de alertas não lidos.
- Dropdown com lista de alertas recentes (máximo 50).
- Cada alerta com: ícone de tipo, título, descrição, timestamp, badge de severidade.
- Tipos de alerta: `threat_detected`, `new_device`, `scan_complete`, `proxy_changed`, `vuln_found`, `arp_spoof`, `dns_leak`.
- Botão "Marcar todos como lidos".
- Filtro por tipo.
- Alertas críticos piscam no badge e tocam som (se ativo).
- Persistir alertas no `localStorage` por 24 horas.

---

## FUNÇÃO 070 — Frontend: responsividade mobile completa

Implementar breakpoints e adaptações mobile:
- `max-width: 768px`: sidebar vira drawer (overlay) com botão hambúrguer.
- Drawer abre/fecha com animação `translateX(-100%)` ↔ `translateX(0)`.
- Overlay escuro ao abrir o drawer (fechar ao clicar).
- Header simplificado: apenas logo e hambúrguer.
- Stats do header ocultados ou em dropdown.
- Cards em coluna única.
- Terminal em fullscreen ao focar.
- Radar menor (200px em vez de 400px).
- Globo 3D desativado em favor de mapa 2D no mobile.
- Tabelas com scroll horizontal.
- Touch gestures: swipe para fechar sidebar, swipe em cards para ações rápidas.

---

# ════════════════════════════════════════════════════════════
# FASE 13 — SEGURANÇA E ROBUSTEZ DO BACKEND
# ════════════════════════════════════════════════════════════

## FUNÇÃO 071 — Backend: rate limiting nas rotas da API

Usar `flask-limiter` para implementar rate limiting:
- Instalar: `pip install flask-limiter`.
- Rate limits globais: 200 requisições por minuto por IP.
- Rate limits específicos:
  - `POST /api/pentest/execute`: 10 req/minuto (evitar abuso do terminal).
  - `POST /api/network/scan`: 5 req/minuto.
  - `GET /api/threat/geoip/<ip>`: 60 req/minuto.
  - `POST /api/proxy/set`: 10 req/minuto.
- Quando limite atingido, retornar HTTP 429 com JSON: `{"error": "rate_limit", "retry_after": N}`.
- Frontend deve tratar 429 mostrando toast de aviso com countdown.

---

## FUNÇÃO 072 — Backend: validação de entrada e sanitização

No `backend/utils/validator.py`, implementar `class InputValidator`:

**Método `validate_ip(ip)`:**
- Verificar formato via `ipaddress.ip_address()`.
- Rejeitar IPs de ranges reservados para funções que só devem operar em rede local (exceto quando explicitamente permitido).

**Método `validate_cidr(cidr)`:**
- Verificar via `ipaddress.ip_network(cidr, strict=False)`.
- Rejeitar redes com máscara menor que /16 (mais de 65k hosts).

**Método `validate_domain(domain)`:**
- Regex: `^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$`.
- Máximo 253 caracteres.

**Método `sanitize_command(command)`:**
- Rejeitar pipes (`|`), redirecionamentos (`>`, `<`), ponto e vírgula (`;`), `&&`, `||`.
- Rejeitar path traversal (`../`, `..\\`).
- Apenas permitir caracteres: `a-z A-Z 0-9 . - _ / : @` e espaços.

---

## FUNÇÃO 073 — Backend: sistema de cache com TTL

No `backend/utils/cache.py`, implementar `class CacheManager`:
- Dicionário em memória: `{key: {value, expires_at}}`.
- Método `get(key)` → retorna valor se não expirado, None caso contrário.
- Método `set(key, value, ttl_seconds)` → armazena com timestamp de expiração.
- Método `delete(key)`.
- Método `clear_expired()` → remover entradas expiradas (executar a cada 60s em thread separada).
- Decorador `@cache(ttl=300)` para usar em funções do serviço.
- Estatísticas: hit rate, total keys, memória estimada.

---

## FUNÇÃO 074 — Backend: tratamento de erros de subprocess

Em todas as funções que usam `subprocess.run` ou `Popen`:
- Envolver em try/except capturando: `subprocess.TimeoutExpired`, `FileNotFoundError` (ferramenta não instalada), `PermissionError`, `subprocess.CalledProcessError`.
- Para `FileNotFoundError`: retornar erro específico `{"error": "tool_not_found", "tool": "nmap", "install_hint": "Execute install_dependencies.py"}`.
- Para `TimeoutExpired`: matar o processo, retornar `{"error": "timeout", "timeout_seconds": N}`.
- Para `PermissionError`: retornar `{"error": "permission_denied", "hint": "Execute como administrador"}`.
- Logar todos os erros com stack trace no `logs/app.log`.
- Nunca retornar stack traces para o frontend (apenas mensagem descritiva).

---

## FUNÇÃO 075 — Backend: autenticação básica opcional

Implementar autenticação opcional (ativável nas configurações):
- Se `AUTH_ENABLED=true` no `.env`, proteger todas as rotas `/api/*`.
- Sistema simples de token: `POST /api/auth/login` recebe `{password: "..."}` e retorna `{token: "jwt_token"}`.
- Senha configurada em `AUTH_PASSWORD` no `.env` (hash bcrypt).
- JWT com expiração de 8 horas.
- Frontend: verificar token no `localStorage`, redirecionar para tela de login se ausente/expirado.
- Tela de login: campo de senha único, botão "AUTENTICAR", estética cyberpunk com o logo do GodEyes.

---

# ════════════════════════════════════════════════════════════
# FASE 14 — FUNCIONALIDADES ADICIONAIS
# ════════════════════════════════════════════════════════════

## FUNÇÃO 076 — Frontend: network topology graph

Na view `#view-network`, adicionar aba "TOPOLOGIA":
- Visualização de grafo da rede usando `D3.js` force-directed graph.
- Cada dispositivo é um nó: cor por risco, tamanho por número de portas abertas.
- Gateway/roteador ao centro como nó principal.
- Arestas entre dispositivos que se comunicaram (detectado via Scapy packet sniffing, se ativo).
- Hover no nó: tooltip com IP, fabricante, risco.
- Clique no nó: abrir modal de detalhes (Função 022).
- Drag para reposicionar nós.
- Zoom com scroll.
- Botão "REORGANIZAR" para re-executar simulação de força.

---

## FUNÇÃO 077 — Backend: packet sniffer passivo

No `backend/services/scapy_service.py`, adicionar:

**Método `start_sniffer(interface, callback)`:**
- Usar `scapy.sniff(iface=interface, prn=callback, store=False)` em thread separada.
- Capturar apenas metadados (não payload): IP src, IP dst, protocolo, porta src, porta dst, tamanho.
- Para cada pacote, emitir via WebSocket `packet_captured` com os metadados.
- Manter contagem por protocolo, por IP de origem, por IP de destino.
- Emitir `traffic_stats` a cada 5 segundos com as contagens acumuladas.

**Método `stop_sniffer()`:**
- Parar a thread de sniffing graciosamente.

**Método `get_interface_list()`:**
- Usar `scapy.get_if_list()` para listar interfaces disponíveis.
- Retornar lista com: nome, IP, MAC, bytes enviados/recebidos via `psutil`.

---

## FUNÇÃO 078 — Frontend: monitor de tráfego em tempo real

Na view `#view-network`, adicionar aba "TRÁFEGO":
- Gráfico de linha em tempo real (últimos 60 segundos) mostrando bytes/s de upload e download.
- Implementar com `<canvas>` e atualização via WebSocket `network_stats`.
- Tabela "Top Talkers": top 10 IPs por volume de tráfego.
- Tabela "Conexões Ativas": feed em tempo real de `packet_captured` events.
- Toggle para ativar/desativar o packet sniffer (botão "INICIAR CAPTURA" / "PARAR CAPTURA").
- Seletor de interface de rede.
- Contador de pacotes capturados total.

---

## FUNÇÃO 079 — Backend: CVE lookup e correlação de vulnerabilidades

No `backend/routes/threat.py`, implementar `GET /api/threat/cve/<product>/<version>`:
- Consultar `https://cve.circl.lu/api/search/{product}/{version}`.
- Filtrar CVEs com CVSS >= 7.0 (High e Critical).
- Para cada CVE, buscar detalhes em `https://cve.circl.lu/api/cve/{cve_id}`.
- Retornar lista ordenada por CVSS decrescente com: ID, descrição, CVSS, vector, CPE, referências, data de publicação.
- Cache por 24 horas.
- Também implementar `GET /api/threat/cve/latest` que retorna os 20 CVEs mais recentes (CVSS >= 9.0) consultando `https://cve.circl.lu/api/last`.

---

## FUNÇÃO 080 — Frontend: painel de CVEs recentes

Adicionar widget "CVEs Recentes" no Dashboard Geral:
- Lista dos 10 CVEs mais críticos e recentes.
- Cada item: ID em vermelho pulsante (se CVSS 10.0), score colorido, produto afetado, data, descrição curta.
- Botão "VER TODOS" que abre modal com lista completa e filtros.
- Atualização automática a cada hora.
- Badge no ícone do módulo de Threat Intel quando há novos CVEs.

---

## FUNÇÃO 081 — Backend: análise de segurança Wi-Fi (modo informativo)

No `backend/routes/network.py`, implementar `GET /api/network/wifi`:
- Usar `subprocess` para executar:
  - Windows: `netsh wlan show networks mode=bssid` para listar redes.
  - Linux: `iwlist scan` ou `nmcli device wifi list`.
- Parsear saída para obter: SSID, BSSID, força do sinal, canal, segurança (WPA2/WPA3/WEP/Open).
- Para cada rede, calcular risco:
  - Open (sem senha): ALTO.
  - WEP: ALTO (criptografia quebrada).
  - WPA/WPA2-TKIP: MÉDIO.
  - WPA2-AES/WPA3: BAIXO.
- Retornar lista de redes com análise de risco.

---

## FUNÇÃO 082 — Frontend: scanner de redes Wi-Fi

Na view `#view-network`, adicionar aba "WI-FI":
- Botão "ESCANEAR REDES WI-FI" com radar animado durante o scan.
- Resultado em tabela com: SSID, sinal (barra visual), segurança (badge colorido), canal, risco.
- Rede atual marcada com ★.
- Redes abertas destacadas com fundo vermelho sutil.
- Explicação dos riscos ao passar o mouse na coluna de segurança.

---

## FUNÇÃO 083 — Backend: subdomain enumeration

No `backend/routes/threat.py`, implementar `POST /api/threat/subdomains`:
- Receber `{ "domain": "example.com", "method": "passive|active" }`.
- Modo passivo: consultar Certificate Transparency logs em `https://crt.sh/?q=%25.{domain}&output=json`.
- Modo ativo: tentar resolver subdomínios de uma wordlist (top 100 subdomínios comuns: www, mail, ftp, ssh, api, dev, test, etc.) via `dnspython`.
- Para cada subdomínio encontrado, tentar resolver A/AAAA record e registrar o IP.
- Retornar lista de subdomínios com IPs e status.

---

## FUNÇÃO 084 — Frontend: visualização de subdomínios em árvore

Na view OSINT, para resultados de subdomínios:
- Visualização em árvore (tree diagram) usando D3.js.
- Domínio raiz como nó pai, subdomínios como filhos.
- Cor dos nós: verde (resolve), vermelho (NXDOMAIN), cinza (timeout).
- Expandir/colapsar ao clicar.
- Clicar num subdomínio: abrir nova aba de OSINT investigando aquele subdomínio.

---

## FUNÇÃO 085 — Backend: password strength checker

No `backend/routes/pentest.py`, implementar `POST /api/pentest/password_check`:
- Receber `{ "password": "..." }`.
- Calcular entropia: `length * log2(charset_size)`.
- Verificar critérios: comprimento, maiúsculas, minúsculas, números, especiais.
- Verificar se está nas top 10k senhas mais comuns (carregar lista de `backend/data/common_passwords.txt`).
- Verificar se está no formato de padrões comuns: `word+digits`, `word+year`, `word+!`.
- Calcular tempo de crack estimado (com GPU moderna, 10 bilhões tentativas/s).
- Retornar: `{score: 0-100, strength: 'weak|fair|strong|very_strong', entropy, time_to_crack, recommendations[]}`.

---

## FUNÇÃO 086 — Frontend: ferramenta de análise de senha no terminal

Implementar comando `passcheck <senha>` no terminal:
- Exibir análise visual da senha:
  ```
  [*] Analisando senha: ******* (7 chars)
  [+] Entropia: 34.5 bits
  [-] NÃO passou nos critérios:
      ✗ Comprimento mínimo (8 chars)
      ✗ Caracteres especiais ausentes
  [+] Força: FRACA
  [!] Tempo estimado de crack: 3 minutos (GPU)
  [*] Esta senha aparece em listas de senhas comuns!
  ```
- Barra visual de força com cores.
- Sugestão de senha forte gerada automaticamente.

---

## FUNÇÃO 087 — Backend: gerador de relatório OSINT em PDF

No `backend/routes/threat.py`, implementar `POST /api/threat/osint/export`:
- Receber JSON com resultado completo de uma investigação OSINT.
- Gerar HTML formatado do relatório usando template Jinja2.
- Converter para PDF via `weasyprint` (instalar: `pip install weasyprint`).
- Retornar arquivo PDF para download.
- Incluir no PDF: capa com logo GodEyes, sumário, seções por tipo de dado, appendices com dados brutos.

---

## FUNÇÃO 088 — Frontend: keyboard shortcuts

Implementar atalhos de teclado globais:
- `Ctrl+1` a `Ctrl+9`: navegar para módulo correspondente na sidebar.
- `Ctrl+T`: abrir nova aba no terminal.
- `Ctrl+K`: abrir barra de busca global (busca em dispositivos, logs, satélites).
- `Ctrl+S`: abrir configurações.
- `Escape`: fechar modal/drawer aberto.
- `Ctrl+Shift+L`: alternar sidebar (expandir/colapsar).
- `Ctrl+Shift+D`: alternar tema dark/darker.
- `F11`: fullscreen.
- Exibir painel de atalhos via `?` key.

---

## FUNÇÃO 089 — Frontend: busca global (Command Palette)

Implementar `<div id="command-palette">` ativado com `Ctrl+K`:
- Input de busca com placeholder "Buscar dispositivos, módulos, comandos...".
- Resultados categorizados: Módulos, Dispositivos, Comandos do Terminal, Satélites, Configurações.
- Navegação por seta ↑↓ e Enter para selecionar.
- Filtro em tempo real enquanto digita.
- Ações rápidas: "Scan rápido", "Novo terminal", "Testar proxies", "Atualizar satélites".
- Fechar com Escape ou clique fora.
- Animação de abertura: scale 0.95 + opacity 0 → scale 1 + opacity 1 em 150ms.

---

## FUNÇÃO 090 — Backend: API de sistema (`/api/system/*`)

Implementar rotas de informações do sistema:
- `GET /api/system/info` → retornar: OS, Python version, Flask version, IP local, hostname, interfaces de rede.
- `GET /api/system/tools` → verificar disponibilidade de cada ferramenta: nmap, scapy, paramiko, etc. Retornar `{tool: name, available: bool, version: "..."}`.
- `GET /api/system/stats` → CPU, RAM, disco, rede (snapshot único, não stream).
- `GET /api/system/network_interfaces` → lista de interfaces com IP, MAC, bytes enviados/recebidos, MTU.

---

# ════════════════════════════════════════════════════════════
# FASE 15 — POLIMENTO E ENTREGA FINAL
# ════════════════════════════════════════════════════════════

## FUNÇÃO 091 — Frontend: estado de loading e skeleton screens

Para cada view que carrega dados assincronamente:
- Implementar skeleton screens: placeholders animados com shimmer effect (`background: linear-gradient(90deg, ...)` se movendo) que aparecem enquanto os dados carregam.
- Skeleton específico para: tabela de dispositivos (linhas), cards de KPI (retângulos), mapa (placeholder cinza), terminal (linhas de texto).
- Transição suave do skeleton para o conteúdo real (fade).
- Estado de erro: mostrar card com ícone de alerta, mensagem descritiva e botão "TENTAR NOVAMENTE".
- Estado vazio: illustração SVG temática com mensagem amigável (ex: radar girando com "Nenhum dispositivo encontrado. Execute um scan.").

---

## FUNÇÃO 092 — Frontend: tutorial interativo para primeiro uso

Implementar tutorial guiado (onboarding):
- Detectar primeiro acesso via `localStorage.getItem('tutorial_complete')`.
- Mostrar sequência de tooltips/popovers destacando elementos:
  1. "Este é o scanner de rede. Clique aqui para iniciar um scan."
  2. "Aqui você verá os dispositivos encontrados."
  3. "O terminal permite executar ferramentas de segurança."
  4. "Configure suas API keys aqui para mais funcionalidades."
- Highlight do elemento atual com overlay e "spotlight" circular.
- Botões "PRÓXIMO", "ANTERIOR", "PULAR TUTORIAL".
- Ao completar, salvar `tutorial_complete: true` no localStorage.
- Acessível novamente via "Ajuda > Ver Tutorial" nas configurações.

---

## FUNÇÃO 093 — Backend: endpoint de health check detalhado

Melhorar `GET /health` para retornar:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "uptime_seconds": 3600,
  "modules": {
    "nmap": {"available": true, "version": "7.94"},
    "scapy": {"available": true, "version": "2.5.0"},
    "flask_socketio": {"available": true},
    "tunnel": {"active": false, "url": null}
  },
  "system": {
    "cpu_percent": 12.3,
    "ram_percent": 45.2,
    "disk_percent": 67.1
  },
  "api_keys": {
    "shodan": "configured",
    "abuseipdb": "not_configured"
  }
}
```

---

## FUNÇÃO 094 — Frontend: indicadores de saúde do sistema no dashboard

No Dashboard Geral, adicionar widget "SAÚDE DO SISTEMA":
- Chamar `GET /health` ao carregar e a cada 30s.
- Para cada módulo: ícone verde (disponível) ou vermelho (indisponível) + nome.
- Para módulos indisponíveis: link/botão "INSTALAR" que executa `GET /api/system/install/{tool}`.
- Gauge chart para CPU, RAM e Disco (arcos semicirculares coloridos).
- Histórico de uptime das últimas 24h (barras verticais, verde=online, vermelho=offline).

---

## FUNÇÃO 095 — Backend: instalação de ferramentas em runtime

No `backend/routes/network.py` (ou `backend/routes/system.py`), implementar `POST /api/system/install`:
- Receber `{ "tool": "nmap|scapy|paramiko|..." }`.
- Executar o processo de instalação correspondente (mesma lógica do `install_dependencies.py`).
- Streamar progresso via WebSocket `install_progress`.
- Verificar instalação ao final.
- Retornar `{ "success": bool, "message": "..." }`.

---

## FUNÇÃO 096 — Frontend: modo apresentação

Implementar `Modo Apresentação` ativável via menu ou `Ctrl+P`:
- Ocultar todos os controles e formulários.
- Mostrar apenas visualizações em tela cheia em rotação automática (5s cada):
  1. Globo 3D com satélites.
  2. Radar de rede com dispositivos.
  3. Mapa de ameaças.
  4. Dashboard com métricas.
- Fundo completamente preto, elementos maximizados.
- Banner sutil "GOD EYES" no canto inferior direito.
- Sair com Escape.

---

## FUNÇÃO 097 — Backend: backup e restauração de dados

Implementar `POST /api/system/backup`:
- Criar arquivo `.zip` contendo: `config.json`, `.env` (com senhas mascaradas), `logs/`, `reports/`, lista de proxies testados.
- Retornar arquivo para download.

Implementar `POST /api/system/restore`:
- Receber arquivo `.zip` de backup.
- Extrair e restaurar configurações.
- Reiniciar servidor automaticamente se necessário (via `os.execv`).

---

## FUNÇÃO 098 — Frontend: widget de velocidade de internet

Adicionar widget "VELOCIDADE" no Dashboard:
- Botão "TESTAR VELOCIDADE".
- Ao clicar: chamar `POST /api/network/speedtest` no backend.
- Backend executar teste de velocidade via `speedtest-cli` (`pip install speedtest-cli`).
- Mostrar resultado: Download (Mbps), Upload (Mbps), Latência (ms), Jitter.
- Gauge animado mostrando velocidade em tempo real durante o teste.
- Histórico dos últimos 5 testes em mini-gráfico.

---

## FUNÇÃO 099 — Frontend e Backend: modo offline com dados demo

Implementar modo demo/offline:
- Se o backend não estiver disponível, mostrar dados fictícios realistas em todas as views.
- Banner "MODO DEMO - Backend offline" no topo.
- Dados demo: 12 dispositivos fictícios na rede, 3 ameaças detectadas, 5 proxies funcionando, 20 satélites rastreados.
- Terminal em modo demo: simular outputs de comandos com dados fictícios.
- Botão "RECONECTAR" que tenta reconectar ao backend a cada 5 segundos.
- Ao reconectar, substituir dados demo por dados reais com animação de atualização.

---

## FUNÇÃO 100 — Documentação inline, README e script de inicialização

**`README.md` completo:**
- Descrição do projeto com screenshot.
- Requisitos: Python 3.10+, Windows/Linux/Mac.
- Instalação em 3 passos:
  ```bash
  git clone https://github.com/usuario/godeyes
  cd godeyes
  python app.py
  ```
- Descrição de cada módulo.
- Como configurar API keys.
- Troubleshooting de problemas comuns.
- Aviso legal: "Para uso exclusivo em redes próprias ou com autorização explícita."

**`start.bat` (Windows):**
```bat
@echo off
title GodEyes Security Framework
cd /d "%~dp0"
python install_dependencies.py
python app.py
pause
```

**`start.sh` (Linux/Mac):**
```bash
#!/bin/bash
cd "$(dirname "$0")"
python3 install_dependencies.py
python3 app.py
```

**Docstrings** em todas as funções Python com: descrição, parâmetros, retorno, exemplo de uso.

**Comentários JSDoc** em todas as classes e métodos JavaScript principais.

---

# ════════════════════════════════════════════════════════════
# ÍNDICE DE FASES
# ════════════════════════════════════════════════════════════

| Fase | Funções | Descrição |
|------|---------|-----------|
| Fase 0 | 001–005 | Setup, dependências e estrutura |
| Fase 1 | 006–014 | Layout e interface Glassmorphism/Cyberpunk |
| Fase 2 | 015–022 | Scanner de rede (Radar + Dispositivos) |
| Fase 3 | 023–027 | Mapa de ameaças (Leaflet.js) |
| Fase 4 | 028–032 | Rastreamento de satélites (Three.js) |
| Fase 5 | 033–040 | Terminal de pen-test |
| Fase 6 | 041–046 | VPN, proxies e anonimato |
| Fase 7 | 047–050 | DNS, OSINT e threat intelligence |
| Fase 8 | 051–053 | Sistema de tunnel e conectividade |
| Fase 9 | 054–056 | WebSocket e tempo real |
| Fase 10 | 057–060 | Configurações e personalização |
| Fase 11 | 061–062 | Geração de relatórios |
| Fase 12 | 063–070 | Melhorias visuais avançadas |
| Fase 13 | 071–075 | Segurança e robustez do backend |
| Fase 14 | 076–090 | Funcionalidades adicionais |
| Fase 15 | 091–100 | Polimento e entrega final |

---

*GodEyes Security Framework v2.0 — Prompt de Implementação Completa*
*Gerado para uso em redes próprias e testes autorizados de segurança.*
