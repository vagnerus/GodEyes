from http.server import BaseHTTPRequestHandler
import json
import socket
from urllib.parse import urlparse, parse_qs

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(json.dumps({"error": "No data received"}).encode())
                return

            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            target = data.get('target', '8.8.8.8').strip()
            
            # Remove protocol or CIDR if mistakenly passed for cloud scan
            target = target.split('/')[0].replace('http://', '').replace('https://', '')
            
            try:
                ip = socket.gethostbyname(target)
            except:
                ip = target

            # Common ports to check (keep it small for serverless timeout safety)
            ports_to_scan = [21, 22, 23, 25, 53, 80, 110, 139, 143, 443, 445, 1433, 3306, 3389, 5432, 8080, 8443]
            
            open_ports = []
            for port in ports_to_scan:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(0.4) # Slightly more timeout for reliability
                result = s.connect_ex((ip, port))
                if result == 0:
                    open_ports.append(port)
                s.close()
                
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                "target": target,
                "ip": ip,
                "open_ports": open_ports,
                "scan_type": "cloud-serverless",
                "status": "success",
                "message": f"Scan concluído para {target}"
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"status": "active", "mode": "cloud-scanner"}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
