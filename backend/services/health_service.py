import psutil
import time
import socket
import platform

class HealthService:
    def __init__(self, start_time):
        self.start_time = start_time

    def get_stats(self):
        uptime = time.time() - self.start_time
        cpu = psutil.cpu_percent()
        ram = psutil.virtual_memory().percent
        
        # Disk usage
        disk = psutil.disk_usage('/').percent
        
        # Network info
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        
        return {
            "uptime": self.format_uptime(uptime),
            "cpu": cpu,
            "ram": ram,
            "disk": disk,
            "os": platform.system(),
            "hostname": hostname,
            "local_ip": local_ip,
            "status": "online" if cpu < 90 else "heavy_load"
        }

    def format_uptime(self, seconds):
        days = int(seconds // (24 * 3600))
        hours = int((seconds % (24 * 3600)) // 3600)
        minutes = int((seconds % 3600) // 60)
        return f"{days}d {hours}h {minutes}m"

# Initialized in app.py
