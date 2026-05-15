from flask import Blueprint, jsonify
from backend.services.wireless_service import wireless_service

wireless_bp = Blueprint('wireless', __name__)

@wireless_bp.route('/interfaces', methods=['GET'])
def interfaces():
    return jsonify({"interfaces": wireless_service.get_interfaces()})

@wireless_bp.route('/scan', methods=['GET'])
def scan():
    return jsonify({"networks": wireless_service.scan_wifi()})
