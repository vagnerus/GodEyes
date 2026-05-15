from flask import Blueprint, request, jsonify
from backend.services.proxy_service import proxy_service

proxy_bp = Blueprint('proxy', __name__)

@proxy_bp.route('/fetch', methods=['GET'])
def fetch():
    proxies = proxy_service.fetch_proxies()
    return jsonify({"count": len(proxies), "proxies": proxies[:100]}) # Limit to 100 for UI

@proxy_bp.route('/test', methods=['POST'])
def test():
    data = request.get_json()
    proxy_str = data.get('proxy')
    if not proxy_str:
        return jsonify({"error": "No proxy provided"}), 400
    
    result = proxy_service.test_proxy(proxy_str)
    return jsonify(result)

@proxy_bp.route('/set', methods=['POST'])
def set_proxy():
    data = request.get_json()
    enabled = data.get('enabled', True)
    proxy_str = data.get('proxy')
    
    success = proxy_service.set_system_proxy(proxy_str, enabled)
    if success:
        return jsonify({"status": "success", "active": proxy_service.active_proxy})
    else:
        return jsonify({"status": "error", "message": "Failed to set system proxy"}), 500

@proxy_bp.route('/status', methods=['GET'])
def status():
    return jsonify({
        "active": proxy_service.active_proxy,
        "count": len(proxy_service.proxies)
    })
