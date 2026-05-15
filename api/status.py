from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        # Este é o sinal para o GodEyes ativar o MODO REAL na nuvem
        response = {
            "online": True,
            "mode": "cloud",
            "provider": "Vercel Edge Computing",
            "capabilities": ["portscan", "geoip", "dns", "whois"]
        }
        
        self.wfile.write(json.dumps(response).encode('utf-8'))
