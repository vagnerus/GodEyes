import nmap
import threading
import uuid
import time
from backend.utils.logger import log_network
from backend.utils.validator import RiskCalculator

class NmapService:
    def __init__(self):
        try:
            self.nm = nmap.PortScanner()
            self.active_scans = {}
        except Exception as e:
            print(f"Error initializing Nmap: {e}")
            self.nm = None

    def scan_network(self, target, scan_type='quick', socketio=None):
        scan_id = str(uuid.uuid4())
        
        def run_scan():
            if not self.nm:
                if socketio:
                    socketio.emit('scan_error', {"scan_id": scan_id, "error": "Nmap not installed"})
                return

            log_network(f"Starting {scan_type} scan on {target}")
            
            arguments = "-sn -T4" # quick
            if scan_type == 'full':
                arguments = "-sV -T4 -O --script=banner"
            elif scan_type == 'stealth':
                arguments = "-sS -T2 -f --mtu 24"

            try:
                # This is a blocking call, but it's running in a thread
                self.nm.scan(hosts=target, arguments=arguments)
                
                devices = []
                for host in self.nm.all_hosts():
                    device = {
                        "ip": host,
                        "hostname": self.nm[host].hostname(),
                        "status": self.nm[host].state(),
                        "mac": self.nm[host]['addresses'].get('mac', 'Unknown'),
                        "vendor": self.nm[host].get('vendor', {}).get(self.nm[host]['addresses'].get('mac', ''), 'Unknown'),
                        "os": "Unknown", # Requires -O
                        "ports": []
                    }
                    
                    if 'osmatch' in self.nm[host] and self.nm[host]['osmatch']:
                        device['os'] = self.nm[host]['osmatch'][0]['name']

                    for proto in self.nm[host].all_protocols():
                        lport = self.nm[host][proto].keys()
                        for port in lport:
                            device['ports'].append({
                                "port": port,
                                "state": self.nm[host][proto][port]['state'],
                                "service": self.nm[host][proto][port]['name'],
                                "version": self.nm[host][proto][port].get('version', '')
                            })
                    
                    # Calculate Risk
                    risk_info = RiskCalculator.calculate_risk(device)
                    device['risk'] = risk_info['level']
                    device['risk_reasons'] = risk_info['reasons']
                    
                    devices.append(device)
                
                log_network(f"Scan {scan_id} complete. Found {len(devices)} devices.")
                if socketio:
                    socketio.emit('scan_complete', {"scan_id": scan_id, "devices": devices})
                
            except Exception as e:
                log_network(f"Scan {scan_id} failed: {e}")
                if socketio:
                    socketio.emit('scan_error', {"scan_id": scan_id, "error": str(e)})

        thread = threading.Thread(target=run_scan)
        thread.start()
        return scan_id

nmap_service = NmapService()
