from fpdf import FPDF
import datetime
import json
import os

class ReportService:
    def __init__(self):
        self.report_dir = "backend/data/reports"
        os.makedirs(self.report_dir, exist_ok=True)

    def generate_pdf(self, scan_data):
        pdf = FPDF()
        pdf.add_page()
        
        # Header
        pdf.set_font("Arial", 'B', 16)
        pdf.cell(0, 10, "GodEyes - Relatorio de Auditoria de Seguranca", ln=True, align='C')
        pdf.set_font("Arial", size=10)
        pdf.cell(0, 10, f"Data: {datetime.datetime.now().strftime('%d/%m/%Y %H:%M:%S')}", ln=True, align='C')
        pdf.ln(10)

        # Summary
        pdf.set_font("Arial", 'B', 12)
        pdf.cell(0, 10, "1. Resumo Executivo", ln=True)
        pdf.set_font("Arial", size=10)
        pdf.multi_cell(0, 10, f"Foram analisados {len(scan_data.get('devices', []))} dispositivos na rede {scan_data.get('target', 'N/A')}.")
        pdf.ln(5)

        # Device Details
        pdf.set_font("Arial", 'B', 12)
        pdf.cell(0, 10, "2. Detalhes dos Dispositivos", ln=True)
        
        for dev in scan_data.get('devices', []):
            pdf.set_font("Arial", 'B', 10)
            pdf.cell(0, 10, f"IP: {dev['ip']} ({dev.get('hostname', 'Desconhecido')})", ln=True)
            pdf.set_font("Arial", size=9)
            pdf.cell(0, 8, f"  MAC: {dev.get('mac')} | Fabricante: {dev.get('vendor')}", ln=True)
            pdf.cell(0, 8, f"  Status: {dev.get('status')} | Risco: {dev.get('risk', 'low').upper()}", ln=True)
            
            if dev.get('ports'):
                pdf.cell(0, 8, "  Portas Abertas:", ln=True)
                for port in dev['ports']:
                    pdf.cell(0, 6, f"    - {port['port']}/{port.get('service')} ({port.get('version', '')})", ln=True)
            pdf.ln(5)

        # Recommendations
        pdf.set_font("Arial", 'B', 12)
        pdf.cell(0, 10, "3. Recomendacoes", ln=True)
        pdf.set_font("Arial", size=10)
        pdf.multi_cell(0, 10, "Com base na analise, recomenda-se: \n- Fechar portas desnecessarias.\n- Atualizar servicos obsoletos.\n- Utilizar VPN para conexoes externas.")

        filename = f"report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = os.path.join(self.report_dir, filename)
        pdf.output(filepath)
        return filename

report_service = ReportService()
