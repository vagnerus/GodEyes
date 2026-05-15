# ════════════════════════════════════════════════════════════
#  GodEyes – Automated Real Mode Installer
#  https://godeyes.vagner.life
# ════════════════════════════════════════════════════════════

$Host.UI.RawUI.WindowTitle = "GodEyes - Setup Wizard"

function Write-Neon($msg) { Write-Host "[🚀] $msg" -ForegroundColor Cyan }
function Write-Success($msg) { Write-Host "[✅] $msg" -ForegroundColor Green }
function Write-Error-God($msg) { Write-Host "[❌] $msg" -ForegroundColor Red }
function Write-Banner($msg) { Write-Host "`n$msg" -ForegroundColor Yellow }

Clear-Host
Write-Banner "╔══════════════════════════════════════════════════╗"
Write-Banner "║       GodEyes – Network Security Setup           ║"
Write-Banner "╚══════════════════════════════════════════════════╝"
Write-Host "Iniciando instalação de dependências reais...`n"

# 1. Check Python
Write-Neon "Verificando Python 3..."
if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Success "Python detectado: $(python --version)"
} else {
    Write-Neon "Python não encontrado. Instalando via Winget..."
    winget install Python.Python.3.10 --silent --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
        Write-Error-God "Falha ao instalar Python. Por favor, instale manualmente em python.org"
        pause; exit
    }
}

# 2. Check Nmap
Write-Neon "Verificando Nmap (Scanner de Rede)..."
if (Get-Command nmap -ErrorAction SilentlyContinue) {
    Write-Success "Nmap detectado!"
} else {
    Write-Neon "Nmap não encontrado. Instalando motor de scan..."
    winget install Insecure.Nmap --silent --accept-package-agreements --accept-source-agreements
    Write-Success "Nmap instalado. Reinicie o terminal após concluir se o scan falhar."
}

# 3. Download / Prepare Backend
$destDir = "$HOME\GodEyes-Backend"
if (!(Test-Path $destDir)) {
    Write-Neon "Criando diretório do backend em $destDir..."
    New-Item -ItemType Directory -Path $destDir | Out-Null
}

Set-Location $destDir

# Note: In a real scenario, we'd git clone or download a zip. 
# For this task, we assume the user is running this script to fix the current folder.
Write-Neon "Instalando bibliotecas Python (Flask, Nmap, etc)..."
python -m pip install --upgrade pip
python -m pip install flask flask-cors python-nmap requests paramiko dnspython python-whois

# 4. Finalizing
Write-Banner "══════════════════════════════════════════════════"
Write-Success "INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
Write-Banner "══════════════════════════════════════════════════"
Write-Host "`nO servidor backend será iniciado agora."
Write-Host "Mantenha esta janela aberta para o Modo Real funcionar.`n"

# Start the server (assuming server.py is in the current folder or destDir)
if (Test-Path "server.py") {
    python server.py
} else {
    Write-Error-God "server.py não encontrado na pasta atual."
    Write-Host "Certifique-se de que os arquivos do backend estão em: $destDir"
}

Pause
