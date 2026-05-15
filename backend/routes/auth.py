from flask import Blueprint, request, jsonify, session
from backend.services.auth_service import auth_service

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    ip = request.remote_addr
    
    result, status_code = auth_service.login(username, password, ip)
    if status_code == 200:
        session['user'] = username
        session['token'] = result['token']
    
    return jsonify(result), status_code

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"status": "success"})

@auth_bp.route('/status', methods=['GET'])
def status():
    if 'user' in session:
        return jsonify({"logged_in": True, "user": session['user']})
    return jsonify({"logged_in": False})
