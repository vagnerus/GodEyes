import requests
import time
import json

try:
    print("Starting scan...")
    res = requests.post("http://localhost:5000/api/scan/start", json={"target": "127.0.0.1", "type": "fast"})
    print("Start:", res.json())
    
    while True:
        status_res = requests.get("http://localhost:5000/api/scan/status")
        status = status_res.json()
        print(f"Status: {status['progress']}% - {status['message']}")
        
        if not status['running']:
            break
        time.sleep(1)
        
    print("\nFetching results...")
    results_res = requests.get("http://localhost:5000/api/scan/results")
    data = results_res.json()
    print("Devices Found:", len(data.get('devices', [])))
    print(json.dumps(data, indent=2))
except Exception as e:
    print("Error:", e)
