from flask import Blueprint, request, jsonify
from backend.services.nmap_service import nmap_service
import ipaddress

network_bp = Blueprint('network', __name__)

@network_bp.route('/scan', methods=['POST'])
def scan():
    data = request.get_json()
    target = data.get('target', '192.168.1.0/24')
    scan_type = data.get('scan_type', 'quick')

    try:
        # Validate CIDR
        ipaddress.ip_network(target, strict=False)
    except ValueError:
        return jsonify({"error": "Invalid target network"}), 400

    # For SocketIO, we need access to the global socketio instance
    # In a real app, you'd use a shared state or extension
    from app import socketio 
    
    scan_id = nmap_service.scan_network(target, scan_type, socketio=socketio)
    
    return jsonify({
        "status": "started",
        "scan_id": scan_id,
        "message": f"Scan {scan_type} iniciado em {target}"
    }), 202
