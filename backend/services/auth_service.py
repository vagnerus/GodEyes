import os
import time
from werkzeug.security import generate_password_hash, check_password_hash
from backend.utils.cache import cache

class AuthService:
    def __init__(self):
        # Default admin:admin (User should change this in .env)
        self.admin_user = os.getenv("ADMIN_USER", "admin")
        self.admin_pass_hash = generate_password_hash(os.getenv("ADMIN_PASS", "admin"))
        self.login_attempts = {}

    def login(self, username, password, ip):
        # Brute-force protection
        attempts = cache.get(f"login_attempts_{ip}") or 0
        if attempts >= 5:
            return {"error": "Muitas tentativas. Bloqueado por 15 minutos."}, 429

        if username == self.admin_user and check_password_hash(self.admin_pass_hash, password):
            # Reset attempts on success
            cache.set(f"login_attempts_{ip}", 0)
            return {"status": "success", "token": "godeyes_session_token_placeholder"}, 200
        else:
            # Increment attempts
            cache.set(f"login_attempts_{ip}", attempts + 1, expire=900)
            return {"error": "Credenciais invalidas"}, 401

    def is_authenticated(self, token):
        # Basic token check
        return token == "godeyes_session_token_placeholder"

auth_service = AuthService()
