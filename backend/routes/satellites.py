from flask import Blueprint, jsonify
import requests
from backend.utils.cache import cache

satellites_bp = Blueprint('satellites', __name__)

@satellites_bp.route('/tle', methods=['GET'])
def get_tle():
    cached_tle = cache.get("satellite_tle")
    if cached_tle:
        return jsonify(cached_tle)

    # Fetch from Celestrak (ISS and others)
    urls = {
        "iss": "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE",
        "starlink": "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=TLE",
        "noaa": "https://celestrak.org/NORAD/elements/gp.php?GROUP=noaa&FORMAT=TLE"
    }
    
    results = []
    for name, url in urls.items():
        try:
            r = requests.get(url, timeout=5)
            lines = r.text.strip().split('\n')
            # Parse TLE triplets
            for i in range(0, len(lines), 3):
                if i + 2 < len(lines):
                    results.append({
                        "name": lines[i].strip(),
                        "tle1": lines[i+1].strip(),
                        "tle2": lines[i+2].strip(),
                        "type": name
                    })
        except:
            continue

    if results:
        cache.set("satellite_tle", results, expire=600) # 10 min
        return jsonify(results)
    
    return jsonify({"error": "Failed to fetch TLE data"}), 500
