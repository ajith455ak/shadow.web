import urllib.request
import json
import ssl

api_key = "rnd_oChEZnH4KJPJk6sILMVt4HfvnENq"
service_id = "srv-d8mecb67r5hc739mkn10"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Accept": "application/json",
    "Content-Type": "application/json"
}

url = f"https://api.render.com/v1/services/{service_id}/deploys"
req = urllib.request.Request(
    url, 
    data=json.dumps({}).encode(),
    headers=headers,
    method="POST"
)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    with urllib.request.urlopen(req, context=ctx) as response:
        data = json.loads(response.read().decode())
        print("Deploy Triggered Successfully:")
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Error triggering deploy: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode())
