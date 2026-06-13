import urllib.request
import json
import ssl
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("RENDER_API_KEY", "")
service_id = os.getenv("RENDER_SERVICE_ID", "")

headers = {
    "Authorization": f"Bearer {api_key}",
    "Accept": "application/json"
}

url = f"https://api.render.com/v1/services/{service_id}/deploys?limit=5"
req = urllib.request.Request(url, headers=headers)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    with urllib.request.urlopen(req, context=ctx) as response:
        data = json.loads(response.read().decode())
        print("Recent Deploys:")
        for deploy in data:
            d = deploy["deploy"]
            print(f"- ID: {d['id']}, Status: {d['status']}, Trigger: {d['trigger']}, Created: {d['createdAt']}")
except Exception as e:
    print(f"Error fetching deploys: {e}")
