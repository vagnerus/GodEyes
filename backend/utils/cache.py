import time

class SimpleCache:
    def __init__(self):
        self.data = {}

    def set(self, key, value, expire=300):
        self.data[key] = {
            "value": value,
            "expires": time.time() + expire
        }

    def get(self, key):
        if key in self.data:
            if time.time() < self.data[key]["expires"]:
                return self.data[key]["value"]
            else:
                del self.data[key]
        return None

    def clear(self):
        self.data = {}

cache = SimpleCache()
