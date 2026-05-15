import os
import zipfile
import datetime

class SystemUtils:
    @staticmethod
    def create_backup():
        backup_dir = "backups"
        os.makedirs(backup_dir, exist_ok=True)
        
        filename = f"godeyes_backup_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
        filepath = os.path.join(backup_dir, filename)
        
        with zipfile.ZipFile(filepath, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk("."):
                if "backups" in root or ".git" in root or "__pycache__" in root:
                    continue
                for file in files:
                    zipf.write(os.path.join(root, file))
        return filename

    @staticmethod
    def get_credits():
        return """
        ====================================================
               G O D E Y E S   v 2 . 0 . 0
        ====================================================
        Developer: Antigravity AI
        Status: Core Rebuild Complete
        Framework: Flask + Vanilla JS + Cyberpunk CSS
        
        Auditoria de seguranca em tempo real.
        ====================================================
        """

system_utils = SystemUtils()
