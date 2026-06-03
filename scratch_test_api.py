import urllib.request
import json

url = 'https://moresave-sacco-system-production.up.railway.app/api/auth/login'
headers = {
    'Content-Type': 'application/json',
    'Origin': 'https://moresave-sacco.web.app'
}
data = json.dumps({'username': 'admin', 'password': 'password'}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers=headers, method='POST')

try:
    with urllib.request.urlopen(req) as response:
        print("Status Code:", response.getcode())
        print("Headers:")
        for k, v in response.getheaders():
            print(f"  {k}: {v}")
        print("Body:", response.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
