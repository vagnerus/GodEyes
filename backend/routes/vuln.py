from flask import Blueprint, request, jsonify
from backend.services.vuln_service import vuln_service

vuln_bp = Blueprint('vuln', __name__)

@vuln_bp.route('/scan', methods=['POST'])
def scan():
    data = request.get_json()
    target = data.get('target')
    if not target:
        return jsonify({"error": "Target required"}), 400
    
    from app import socketio
    vuln_service.scan_vulnerabilities(target, socketio=socketio)
    return jsonify({"status": "started", "message": f"Varredura de vulnerabilidades iniciada em {target}"})

@vuln_bp.route('/cve/<cpe>', methods=['GET'])
def get_cve(cpe):
    details = vuln_service.get_cve_details(cpe)
    return jsonify(details)
