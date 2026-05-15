from http.server import BaseHTTPRequestHandler
import json
import urllib.request

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Pega o IP da query string ou do cabeçalho
        path = self.path
        if '?' in path:
            params = path.split('?')[1]
            ip = params.split('=')[1] if 'ip=' in params else ""
        else:
            ip = ""

        try:
            with urllib.request.urlopen(f"http://ip-api.com/json/{ip}") as url:
                data = json.loads(url.read().decode())
                
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(data).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))
