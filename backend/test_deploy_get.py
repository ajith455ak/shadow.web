import urllib.request
import json
import ssl

api_key = "rnd_oChEZnH4KJPJk6sILMVt4HfvnENq"
service_id = "srv-d8mecb67r5hc739mkn10"
deploy_id = "dep-d8mg23ho3t8c73bp3atg"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Accept": "application/json"
}

url = f"https://api.render.com/v1/services/{service_id}/deploys/{deploy_id}"
req = urllib.request.Request(url, headers=headers)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    with urllib.request.urlopen(req, context=ctx) as response:
        data = json.loads(response.read().decode())
        print("Deploy GET Response:")
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Error: {e}")
