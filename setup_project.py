import os

def create_structure():
    base_dir = "."
    
    folders = [
        "logs",
        "static/css",
        "static/js/core",
        "static/js/modules",
        "static/js/utils",
        "static/assets/textures",
        "static/assets/sounds",
        "static/assets/fonts",
        "static/libs",
        "templates",
        "backend/routes",
        "backend/services",
        "backend/utils",
        "backend/data/blocklists"
    ]
    
    files = [
        "app.py",
        ".env",
        "requirements.txt",
        "config.json",
        "static/css/main.css",
        "static/css/glassmorphism.css",
        "static/css/animations.css",
        "static/css/terminal.css",
        "static/js/core/app.js",
        "static/js/core/socket.js",
        "static/js/core/state.js",
        "templates/index.html",
        "backend/routes/network.py",
        "backend/routes/pentest.py",
        "backend/routes/proxy.py",
        "backend/routes/satellites.py",
        "backend/routes/threat.py",
        "backend/services/nmap_service.py",
        "backend/services/scapy_service.py",
        "backend/services/proxy_service.py",
        "backend/services/dns_service.py",
        "backend/services/tunnel_service.py",
        "backend/utils/logger.py",
        "backend/utils/validator.py",
        "backend/utils/cache.py"
    ]
    
    print("=== Criando Estrutura de Pastas GodEyes ===")
    for folder in folders:
        path = os.path.join(base_dir, folder)
        if not os.path.exists(path):
            os.makedirs(path, exist_ok=True)
            print(f"✅ Pasta criada: {folder}")
        else:
            print(f"ℹ️ Pasta já existe: {folder}")
            
    print("\n=== Inicializando Arquivos Base ===")
    for file in files:
        path = os.path.join(base_dir, file)
        if not os.path.exists(path):
            with open(path, 'a') as f:
                pass
            print(f"✅ Arquivo inicializado: {file}")
        else:
            print(f"ℹ️ Arquivo já existe: {file}")

    print("\n✨ Estrutura de projeto configurada com sucesso.")

if __name__ == "__main__":
    create_structure()
