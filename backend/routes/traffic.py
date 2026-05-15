from flask import Blueprint, request, jsonify
from backend.services.sniffer_service import sniffer_service

traffic_bp = Blueprint('traffic', __name__)

@traffic_bp.route('/start', methods=['POST'])
def start():
    data = request.get_json()
    interface = data.get('interface')
    sniffer_service.start(interface)
    return jsonify({"status": "started"})

@traffic_bp.route('/stop', methods=['POST'])
def stop():
    sniffer_service.stop()
    return jsonify({"status": "stopped"})

@traffic_bp.route('/stats', methods=['GET'])
def stats():
    return jsonify(sniffer_service.get_stats())
