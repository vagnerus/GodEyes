import logging
import os
from datetime import datetime

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)

def setup_logger(name, log_file, level=logging.INFO):
    formatter = logging.Formatter('[%(asctime)s] %(levelname)s: %(message)s')
    handler = logging.FileHandler(os.path.join(LOG_DIR, log_file))
    handler.setFormatter(formatter)

    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.addHandler(handler)
    return logger

network_logger = setup_logger('network', 'network_scan.log')
pentest_logger = setup_logger('pentest', 'pentest.log')
proxy_logger = setup_logger('proxy', 'proxy.log')

def log_network(msg): network_logger.info(msg)
def log_pentest(msg): pentest_logger.info(msg)
def log_proxy(msg): proxy_logger.info(msg)
