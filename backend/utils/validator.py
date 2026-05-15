class RiskCalculator:
    @staticmethod
    def calculate_risk(device_data):
        ports = [p['port'] for p in device_data.get('ports', [])]
        vulns = device_data.get('vulns', [])
        os_info = device_data.get('os', '').lower()
        ip = device_data.get('ip', '')

        reasons = []
        risk_level = "low"

        # High Risk Rules
        if 23 in ports:
            reasons.append("Porta 23 (Telnet) aberta - Protocolo inseguro.")
            risk_level = "high"
        if 21 in ports:
            reasons.append("Porta 21 (FTP) aberta - Risco de interceptação.")
            risk_level = "high"
        if 3389 in ports:
            reasons.append("Porta 3389 (RDP) aberta - Vetor comum de ataque.")
            risk_level = "high"
        if len(ports) > 10:
            reasons.append("Grande número de portas abertas (>10).")
            risk_level = "high"
        if any(old_os in os_info for old_os in ["windows xp", "windows 7", "server 2008"]):
            reasons.append(f"OS Obsoleto detectado: {os_info}")
            risk_level = "high"
        if ip.endswith(".1") or ip.endswith(".254"):
            reasons.append("Possível Gateway/Roteador detectado.")
            risk_level = "high"

        # Medium Risk Rules (if not already high)
        if risk_level != "high":
            if 80 in ports:
                reasons.append("Porta 80 (HTTP) aberta sem criptografia.")
                risk_level = "medium"
            if 8080 in ports:
                reasons.append("Porta 8080 (HTTP-Alt) aberta.")
                risk_level = "medium"
            if device_data.get('vendor') == 'Unknown' and len(ports) > 0:
                reasons.append("Fabricante desconhecido com serviços ativos.")
                risk_level = "medium"

        return {
            "level": risk_level,
            "reasons": reasons
        }
