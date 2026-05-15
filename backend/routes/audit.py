from flask import Blueprint, request, jsonify, send_from_directory
from backend.services.report_service import report_service
import os

audit_bp = Blueprint('audit', __name__)

@audit_bp.route('/generate-report', methods=['POST'])
def generate_report():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    filename = report_service.generate_pdf(data)
    return jsonify({"status": "success", "report_url": f"/api/audit/download/{filename}"})

@audit_bp.route('/download/<filename>', methods=['GET'])
def download(filename):
    return send_from_directory(os.path.join(os.getcwd(), "backend/data/reports"), filename)

@audit_bp.route('/history', methods=['GET'])
def history():
    # Placeholder for scan history (Function 053)
    reports = os.listdir("backend/data/reports")
    return jsonify({"reports": reports})
