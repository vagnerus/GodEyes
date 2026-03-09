# GodEyes 👁️ — Network Security Dashboard

> **Ferramenta de auditoria de segurança corporativa** — varredura de rede, pen-test simulado, acesso VPN, roteamento de IP/proxy e rastreamento de satélites.

---

## 📁 Estrutura do Projeto

```
GodEyes/
├── index.html       # Shell principal da aplicação
├── style.css        # Tema dark cyberpunk + glassmorphism
├── app.js           # Lógica principal (scanner, mapa, VPN, proxy, pen-test)
└── satellite.js     # Módulo de rastreamento de satélites
```

---

## 🚀 Como Executar

Abra diretamente no navegador:

```
C:\Users\Vagner\Desktop\GodEyes\index.html
```

> Não requer servidor, instalação ou dependências. Funciona 100% offline (exceto mapa, que usa OpenStreetMap).

---

## 🧭 Módulos

### 🔭 Scanner de Rede

Simula varredura ARP/TCP na sub-rede configurada.

- **Iniciar Scan** → detecta dispositivos com IP, MAC, OS e portas abertas
- Cada dispositivo recebe um **nível de risco**: Alto / Médio / Baixo
- Radar animado com blips coloridos por risco
- Filtro por categoria de risco
- Clique em qualquer card para abrir o **Inspector**

#### Inspector de Dispositivo
| Campo | Descrição |
|-------|-----------|
| Hostname | Nome do host na rede |
| IP / MAC | Endereços de rede |
| OS | Sistema operacional detectado |
| Fabricante | Vendor da placa de rede |
| Portas abertas | Lista de serviços expostos |
| Vulnerabilidades | CVEs e problemas detectados |

Ações disponíveis no Inspector: **Ping**, **Traceroute**, **Pen-Test direto**.

---

### 🗺️ Mapa de Dispositivos

- Mapa interativo via **Leaflet.js + OpenStreetMap**
- Pins coloridos por risco (vermelho / laranja / verde)
- Clique no pin → abre o Inspector do dispositivo
- Botão **Centralizar** reposiciona a câmera

---

### 💻 Console de Pen-Test

Terminal estilo hacker com output simulado de ferramentas reais.

| Modo | Descrição |
|------|-----------|
| `Port Scan` | nmap com detecção de serviços e versões |
| `Vulnerability Scan` | verificação de CVEs críticos |
| `Brute Force SSH/FTP` | ataque de dicionário com rockyou.txt |
| `ARP Spoofing Detect` | detecção de envenenamento ARP |
| `Packet Sniff` | captura e análise de pacotes |
| `Exploit Framework` | simulação Metasploit/Meterpreter |

**Intensidade:** Furtivo · Normal · Agressivo  
**Opções:** Detecção de OS, Banner Grab, NSE Scripts, CVE Check  
**Input manual** via linha de comando no rodapé do terminal

---

### 🔒 VPN

| Função | Detalhe |
|--------|---------|
| Toggle ON/OFF | Conecta/desconecta com animação de handshake |
| Servidores disponíveis | 🇧🇷 BR · 🇺🇸 US · 🇩🇪 DE · 🇳🇱 NL · 🇯🇵 JP · 🇸🇬 SG · 🇨🇭 CH |
| Protocolos | WireGuard · OpenVPN · IKEv2 |
| Criptografia | ChaCha20 · AES-256 · AES-128 |
| IP externo | Exibido após conexão |
| Log de conexão | Timestamped em tempo real |

---

### 🔄 Roteador de IP / Proxy

#### IP Atual
- Mostra IP aparente, localização e nível de anonimato
- **Rotacionar IP** → alterna entre pool de IPs internacionais
- Medidor de anonimato visual (50-100%)

#### Cadeia de Proxy
```
Sua Máquina → Proxy #1 (SOCKS5) → Proxy #2 (HTTP) → TOR Exit → Destino
```
- **Embaralhar Cadeia** → reordena os nós intermediários

#### Pool de Proxies
| Protocolo | Países cobertos |
|-----------|----------------|
| SOCKS5 | 🇷🇺 🇮🇳 🇹🇭 🇺🇸 🇫🇷 🇫🇮 🇩🇪 |
| HTTP   | 🇭🇰 🇫🇷 🇨🇱 🇩🇪 |
| TOR    | Nós de saída anonimizados |

---

### 🛰️ Satélites

#### Globo 3D Interativo
- Renderizado em Canvas com atmosfera, grades lat/lon e continentes
- **Arraste para girar** o globo
- Satélites em órbita animada (velocidade proporcional à altitude)
- Feixe de lock animado em dashed cyan
- Flash vermelho pulsante em interceptação ativa

#### Catálogo — 12 Satélites Reais
| ID NORAD | Nome | Tipo | Órbita |
|----------|------|------|--------|
| 57454 | USA-326 | Espionagem | LEO |
| 43641 | KH-13 KEYHOLE | Espionagem | LEO |
| 59051 | COSMOS-2576 | Espionagem | LEO |
| 58400 | YAOGAN-41 | Espionagem | LEO |
| 49589 | SBIRS GEO-5 | Espionagem | GEO |
| 25544 | ISS | Civil | LEO |
| 60012 | Starlink G6-38 | Civil | LEO |
| 33591 | NOAA-19 | Meteorologia | LEO |
| 28190 | GPS IIR-14 | Navegação | MEO |
| 57166 | GLONASS-K2 | Navegação | MEO |
| 42814 | Intelsat 37e | Comunicação | GEO |
| 56751 | BeiDou-3 G7 | Navegação | GEO |

#### Ações por Satélite
| Botão | Efeito |
|-------|--------|
| **Lock Orbital** | Traça feixe do centro do globo até o satélite |
| **Interceptar Sinal** | Abre console pen-test com output de interceptação |
| **Log TLE** | Exibe dados TLE (Two-Line Element) no console |

#### Monitor de Sinal
- Forma de onda em tempo real via Canvas
- Exibe: SNR (dB), BER, frequência ativa, tipo de órbita

---

## 🎨 Design

| Elemento | Detalhe |
|----------|---------|
| Tema | Dark cyberpunk, midnight blue |
| Acento | Neon verde `#00f5a0` + cyan `#00d9f5` |
| Estilo | Glassmorphism: `backdrop-filter: blur(12px)` |
| Fontes | `JetBrains Mono` (terminal/código) + `Inter` (UI) |
| Fundo | Canvas animado com partículas e conexões |
| Animações | Radar sweep, globe rotation, pulse, typewriter |

---

## ⚙️ Dependências Externas (CDN)

| Biblioteca | Versão | Uso |
|------------|--------|-----|
| Leaflet.js | 1.9.4 | Mapa interativo |
| OpenStreetMap | — | Tiles de mapa |
| Google Fonts | — | Inter + JetBrains Mono |

> Nenhuma dependência local. Tudo via CDN.

---

## ⚠️ Aviso Legal

Esta ferramenta foi desenvolvida **exclusivamente para auditorias de segurança autorizadas em ambientes corporativos próprios**.

- Todas as ações de scan, exploit e interceptação são **simulações de UI**
- Operações reais de rede requerem um **agente backend** com permissões adequadas
- O uso em redes sem autorização explícita é **ilegal**

---

*GodEyes v1.0 · 2026 · Segurança corporativa interna*
