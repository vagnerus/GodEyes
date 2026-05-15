import requests
import threading
import time
import winreg
from backend.utils.logger import log_proxy

class ProxyService:
    def __init__(self):
        self.proxies = []
        self.active_proxy = None
        self.sources = [
            "https://www.proxy-list.download/api/v1/get?type=socks5",
            "https://api.proxyscrape.com/v2/?request=getproxies&protocol=socks5"
        ]

    def fetch_proxies(self):
        log_proxy("Fetching new proxies...")
        new_proxies = []
        for url in self.sources:
            try:
                r = requests.get(url, timeout=10)
                if r.status_code == 200:
                    lines = r.text.strip().split('\n')
                    for line in lines:
                        if ':' in line:
                            new_proxies.append(line.strip())
            except Exception as e:
                log_proxy(f"Error fetching from {url}: {e}")
        
        self.proxies = list(set(new_proxies))
        log_proxy(f"Found {len(self.proxies)} proxies.")
        return self.proxies

    def test_proxy(self, proxy_str):
        proxies = {
            "http": f"socks5://{proxy_str}",
            "https": f"socks5://{proxy_str}"
        }
        try:
            start_time = time.time()
            r = requests.get("http://httpbin.org/ip", proxies=proxies, timeout=5)
            latency = (time.time() - start_time) * 1000
            if r.status_code == 200:
                return {"status": "online", "latency": round(latency), "ip": r.json().get('origin')}
        except:
            pass
        return {"status": "offline", "latency": None}

    def set_system_proxy(self, proxy_str=None, enabled=True):
        """ Configures proxy in Windows Registry (Function 043) """
        try:
            internet_settings = winreg.OpenKey(winreg.HKEY_CURRENT_USER,
                r'Software\Microsoft\Windows\CurrentVersion\Internet Settings',
                0, winreg.KEY_ALL_ACCESS)

            if enabled and proxy_str:
                winreg.SetValueEx(internet_settings, 'ProxyEnable', 0, winreg.REG_DWORD, 1)
                winreg.SetValueEx(internet_settings, 'ProxyServer', 0, winreg.REG_SZ, proxy_str)
            else:
                winreg.SetValueEx(internet_settings, 'ProxyEnable', 0, winreg.REG_DWORD, 0)

            winreg.CloseKey(internet_settings)
            self.active_proxy = proxy_str if enabled else None
            log_proxy(f"System proxy {'enabled: ' + proxy_str if enabled else 'disabled'}")
            return True
        except Exception as e:
            log_proxy(f"Error setting system proxy: {e}")
            return False

proxy_service = ProxyService()
