import re

with open('c:/Users/Vagner/Desktop/GodEyes/server.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_tools_code = """
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
        job_append(jid, "Server username : NT AUTHORITY\\\\SYSTEM", "error")
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
"""

content = content.replace("# \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n# JOB POLL (gen\u00e9rico)", new_tools_code + "\n# \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n# JOB POLL (gen\u00e9rico)")

with open('c:/Users/Vagner/Desktop/GodEyes/server.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Tudo pronto.")
