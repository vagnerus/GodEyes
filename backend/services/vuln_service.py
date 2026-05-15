import requests
import nmap
import threading
from backend.utils.logger import log_network
from backend.utils.cache import cache

class VulnService:
    def __init__(self):
        try:
            self.nm = nmap.PortScanner()
        except:
            self.nm = None

    def get_cve_details(self, cpe):
        """ Fetch CVEs from a public API based on CPE """
        cached = cache.get(f"cve_{cpe}")
        if cached: return cached

        try:
            # Using a public CVE API (placeholder, real ones often need API keys)
            url = f"https://cve.circl.lu/api/cvefor/{cpe}"
            r = requests.get(url, timeout=10)
            if r.status_code == 200:
                data = r.json()
                cache.set(f"cve_{cpe}", data, expire=3600) # 1h
                return data
        except:
            pass
        return []

    def scan_vulnerabilities(self, target, socketio=None):
        def run():
            if not self.nm: return
            log_network(f"Starting vuln scan on {target}")
            
            # Use Nmap scripts for vulnerability detection
            args = "-sV --script=vuln,banner -T4"
            try:
                self.nm.scan(hosts=target, arguments=args)
                results = []
                for host in self.nm.all_hosts():
                    host_vulns = []
                    for proto in self.nm[host].all_protocols():
                        for port in self.nm[host][proto].keys():
                            scripts = self.nm[host][proto][port].get('script', {})
                            for script_id, output in scripts.items():
                                host_vulns.append({
                                    "port": port,
                                    "id": script_id,
                                    "output": output,
                                    "severity": "high" if "VULNERABLE" in output.upper() else "info"
                                })
                    results.append({"ip": host, "vulnerabilities": host_vulns})
                
                if socketio:
                    socketio.emit('vuln_scan_complete', results)
            except Exception as e:
                log_network(f"Vuln scan failed: {e}")

        threading.Thread(target=run).start()

vuln_service = VulnService()
