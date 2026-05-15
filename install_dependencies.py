import sys
import subprocess
import importlib.util
import os
import shutil
import platform
import time
import datetime
import urllib.request

# Configuration
REQUIRED_PACKAGES = [
    'flask', 'flask-cors', 'flask-socketio', 'python-nmap', 'scapy', 'requests', 
    'psutil', 'dnspython', 'paramiko', 'netifaces', 'manuf', 'python-dotenv',
    'gevent', 'gevent-websocket', 'schedule', 'shodan', 'colorama', 'fpdf2'
]

LOG_DIR = "logs"
INSTALL_LOG = os.path.join(LOG_DIR, "install.log")

def log_message(message):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] {message}\n"
    os.makedirs(LOG_DIR, exist_ok=True)
    with open(INSTALL_LOG, "a", encoding="utf-8") as f:
        f.write(log_entry)
    print(message)

def check_python_version():
    if sys.version_info < (3, 10):
        log_message("❌ ERRO: Python 3.10 ou superior é necessário.")
        log_message("Baixe em: https://www.python.org/downloads/")
        sys.exit(1)
    log_message("✅ Python 3.10+ detectado.")

def ensure_pip():
    try:
        import pip
    except ImportError:
        log_message("⚠️ Pip não encontrado. Tentando instalar via ensurepip...")
        try:
            subprocess.run([sys.executable, "-m", "ensurepip", "--default-pip"], check=True)
            log_message("✅ Pip instalado com sucesso.")
        except Exception as e:
            log_message(f"❌ Falha ao instalar pip: {e}")
            sys.exit(1)

def check_package(package_name):
    # Some packages have different import names
    import_mapping = {
        'python-nmap': 'nmap',
        'python-dotenv': 'dotenv',
        'flask-socketio': 'flask_socketio',
        'flask-cors': 'flask_cors'
    }
    import_name = import_mapping.get(package_name, package_name)
    spec = importlib.util.find_spec(import_name)
    return spec is not None

def install_packages():
    from colorama import init, Fore, Style
    init()
    
    log_message(f"\n{Fore.CYAN}=== Verificando Dependências Python ==={Style.RESET_ALL}")
    
    for pkg in REQUIRED_PACKAGES:
        if check_package(pkg):
            log_message(f"✅ {pkg}: Já instalado.")
        else:
            log_message(f"⏳ {pkg}: Instalando...")
            try:
                subprocess.run([sys.executable, "-m", "pip", "install", pkg], check=True, capture_output=True)
                log_message(f"✅ {pkg}: Instalado com sucesso.")
            except Exception as e:
                log_message(f"❌ {pkg}: Falha na instalação. {e}")

def check_nmap():
    from colorama import Fore, Style
    log_message(f"\n{Fore.CYAN}=== Verificando Nmap ==={Style.RESET_ALL}")
    
    nmap_path = shutil.which("nmap")
    
    if nmap_path:
        log_message(f"✅ Nmap detectado em: {nmap_path}")
        try:
            res = subprocess.run(["nmap", "--version"], capture_output=True, text=True)
            log_message(f"ℹ️ {res.stdout.splitlines()[0]}")
        except:
            pass
        return True

    log_message("⚠️ Nmap não encontrado no PATH.")
    
    system = platform.system()
    if system == "Windows":
        nmap_url = "https://nmap.org/dist/nmap-7.94-setup.exe"
        temp_exe = os.path.join(os.environ.get("TEMP", "C:\\Temp"), "nmap_setup.exe")
        
        log_message(f"⏳ Baixando instalador silencioso do Nmap ({nmap_url})...")
        try:
            urllib.request.urlretrieve(nmap_url, temp_exe)
            log_message("✅ Download concluído. Iniciando instalação silenciosa...")
            
            # Run silent install
            subprocess.run([temp_exe, "/S"], check=True)
            log_message("✅ Instalação do Nmap concluída.")
            
            # Add to path for current session
            default_path = "C:\\Program Files (x86)\\Nmap"
            if os.path.exists(default_path):
                os.environ["PATH"] += os.pathsep + default_path
                log_message(f"✅ Diretório {default_path} adicionado ao PATH da sessão.")
            
            return True
        except Exception as e:
            log_message(f"❌ Falha ao instalar Nmap: {e}")
            return False
            
    elif system == "Linux":
        log_message("⏳ Tentando instalar nmap via apt-get...")
        try:
            subprocess.run(["sudo", "apt-get", "update"], check=True)
            subprocess.run(["sudo", "apt-get", "install", "-y", "nmap"], check=True)
            log_message("✅ Nmap instalado via apt-get.")
            return True
        except:
            log_message("❌ Falha ao instalar via apt-get. Instale o nmap manualmente.")
            return False
            
    elif system == "Darwin": # Mac
        log_message("⏳ Tentando instalar nmap via brew...")
        try:
            subprocess.run(["brew", "install", "nmap"], check=True)
            log_message("✅ Nmap instalado via brew.")
            return True
        except:
            log_message("❌ Falha ao instalar via brew. Instale o nmap manualmente.")
            return False

    return False

def main():
    check_python_version()
    ensure_pip()
    
    # Need colorama for the rest of the report
    try:
        import colorama
    except ImportError:
        subprocess.run([sys.executable, "-m", "pip", "install", "colorama"], check=True, capture_output=True)
    
    install_packages()
    check_nmap()
    
    log_message("\n✨ Processo de configuração de dependências concluído.")

if __name__ == "__main__":
    main()
