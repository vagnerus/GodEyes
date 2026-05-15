from scapy.all import sniff, IP, TCP, UDP
import threading
import time
from app import socketio

class SnifferService:
    def __init__(self):
        self.is_sniffing = False
        self.thread = None
        self.stats = {"http": 0, "dns": 0, "tcp": 0, "udp": 0, "total": 0}

    def start(self, interface=None):
        if self.is_sniffing: return
        self.is_sniffing = True
        self.thread = threading.Thread(target=self._sniff_loop, args=(interface,))
        self.thread.daemon = True
        self.thread.start()

    def stop(self):
        self.is_sniffing = False

    def _sniff_loop(self, interface):
        def packet_callback(pkt):
            if not self.is_sniffing: return
            self.stats["total"] += 1
            
            p_info = {"proto": "OTHER", "src": "N/A", "dst": "N/A", "size": len(pkt)}
            
            if IP in pkt:
                p_info["src"] = pkt[IP].src
                p_info["dst"] = pkt[IP].dst
                
                if TCP in pkt:
                    p_info["proto"] = "TCP"
                    self.stats["tcp"] += 1
                    if pkt[TCP].dport == 80 or pkt[TCP].sport == 80:
                        self.stats["http"] += 1
                elif UDP in pkt:
                    p_info["proto"] = "UDP"
                    self.stats["udp"] += 1
                    if pkt[UDP].dport == 53 or pkt[UDP].sport == 53:
                        self.stats["dns"] += 1
            
            socketio.emit('new_packet', p_info)
            
        sniff(iface=interface, prn=packet_callback, store=0, stop_filter=lambda x: not self.is_sniffing)

    def get_stats(self):
        return self.stats

sniffer_service = SnifferService()
