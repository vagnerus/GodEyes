import os
import sys
from flask import Flask, render_template, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from dotenv import load_dotenv

# 1. Run dependency installer before starting
import install_dependencies
install_dependencies.main()

# 2. Load environment variables
load_dotenv()
import time
START_TIME = time.time()

# 3. Initialize Flask App
app = Flask(__name__, static_folder='static', template_folder='templates')
app.secret_key = os.getenv("SECRET_KEY", "godeyes_dev_key")
CORS(app, resources={r"/api/*": {"origins": "*"}})

# 4. Initialize SocketIO
socketio = SocketIO(app, async_mode='gevent', cors_allowed_origins="*", logger=True, engineio_logger=True)

# 5. Register Blueprints
from backend.routes.network import network_bp
from backend.routes.pentest import pentest_bp
from backend.routes.proxy import proxy_bp
from backend.routes.satellites import satellites_bp
from backend.routes.threat import threat_bp
from backend.routes.vuln import vuln_bp
from backend.routes.audit import audit_bp
from backend.routes.auth import auth_bp
from backend.routes.traffic import traffic_bp
from backend.routes.wireless import wireless_bp
from backend.services.health_service import HealthService

health_service = HealthService(START_TIME)

app.register_blueprint(network_bp, url_prefix='/api/network')
app.register_blueprint(pentest_bp, url_prefix='/api/pentest')
app.register_blueprint(proxy_bp, url_prefix='/api/proxy')
app.register_blueprint(satellites_bp, url_prefix='/api/satellites')
app.register_blueprint(threat_bp, url_prefix='/api/threat')
app.register_blueprint(vuln_bp, url_prefix='/api/vuln')
app.register_blueprint(audit_bp, url_prefix='/api/audit')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(traffic_bp, url_prefix='/api/traffic')
app.register_blueprint(wireless_bp, url_prefix='/api/wireless')

# 6. Basic Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/health')
def health():
    return jsonify(health_service.get_stats())

# 7. Real-time stats broadcasting
def broadcast_stats():
    while True:
        stats = health_service.get_stats()
        socketio.emit('system_stats', {
            "cpu": stats['cpu'],
            "ram": stats['ram'],
            "ping": 10 # Placeholder for ping
        })
        time.sleep(2)

import threading
threading.Thread(target=broadcast_stats, daemon=True).start()

# 7. Global Error Handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500

# 8. Start Server
if __name__ == '__main__':
    banner = """
    \033[96m
     _______  _______  ______   _______  __   __  _______  _______ 
    |       ||       ||      | |       ||  | |  ||       ||       |
    |    ___||   _   ||  _    ||    ___||  |_|  ||    ___||  _____|
    |   | __ |  | |  || | |   ||   |___ |       ||   |___ | |_____ 
    |   ||  ||  |_|  || |_|   ||    ___||_     _||    ___||_____  |
    |   |_| ||       ||       ||   |___   |   |  |   |___  _____| |
    |_______||_______||______| |_______|  |___|  |_______||_______|
    \033[92m
    [ GodEyes v2.0.0 - Cyber Security Dashboard ]
    [ Server running on http://0.0.0.0:5000 ]
    \033[0m
    """
    print(banner)
    socketio.run(app, host='0.0.0.0', port=int(os.getenv('FLASK_PORT', 5000)), debug=False)
