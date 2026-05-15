from flask import Blueprint, jsonify
import requests
import ipaddress
from backend.utils.cache import cache

threat_bp = Blueprint('threat', __name__)

@threat_bp.route('/geoip/<ip>', methods=['GET'])
def geoip(ip):
    # Check if IP is private
    try:
        addr = ipaddress.ip_address(ip)
        if addr.is_private:
            return jsonify({
                "ip": ip,
                "country": "Local Network",
                "country_code": "LAN",
                "city": "Private",
                "lat": 0,
                "lon": 0,
                "isp": "Internal",
                "is_private": True
            })
    except ValueError:
        return jsonify({"error": "Invalid IP address"}), 400

    # Check cache
    cached_data = cache.get(f"geoip_{ip}")
    if cached_data:
        return jsonify(cached_data)

    # Real GeoIP Lookup
    try:
        r = requests.get(f"http://ip-api.com/json/{ip}?fields=status,country,countryCode,regionName,city,lat,lon,isp,query", timeout=5)
        data = r.json()
        
        if data.get('status') == 'success':
            normalized = {
                "ip": ip,
                "country": data.get('country'),
                "country_code": data.get('countryCode'),
                "city": data.get('city'),
                "lat": data.get('lat'),
                "lon": data.get('lon'),
                "isp": data.get('isp'),
                "is_private": False
            }
            cache.set(f"geoip_{ip}", normalized, expire=86400) # 24h
            return jsonify(normalized)
        else:
            return jsonify({"error": "GeoIP lookup failed"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@threat_bp.route('/check/<ip>', methods=['GET'])
def check_threat(ip):
    # Placeholder for threat intel logic (Function 026)
    # In a real implementation, you'd check AbuseIPDB, blocklists, etc.
    return jsonify({
        "ip": ip,
        "is_malicious": False,
        "confidence_score": 0,
        "reports": 0
    })
