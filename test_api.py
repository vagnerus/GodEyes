import requests

def test_api(url):
    try:
        r = requests.get(url, timeout=5)
        print(f"{url} -> {r.status_code}")
        print(r.text[:200])
    except Exception as e:
        print(f"{url} -> ERROR: {e}")

test_api("https://api.proxynova.com/comb?query=test@gmail.com")
test_api("https://leakcheck.net/api/public?check=test@gmail.com")
