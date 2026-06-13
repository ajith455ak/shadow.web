import urllib.request
import json
import ssl
import time
import sys

api_key = "rnd_oChEZnH4KJPJk6sILMVt4HfvnENq"
service_id = "srv-d8mecb67r5hc739mkn10"
deploy_id = "dep-d8mg537lk1mc738la5fg"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Accept": "application/json"
}

url = f"https://api.render.com/v1/services/{service_id}/deploys/{deploy_id}"
req = urllib.request.Request(url, headers=headers)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

print(f"Waiting for deploy {deploy_id} to complete...")

while True:
    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            data = json.loads(response.read().decode())
            status = data["status"]
            print(f"Current deploy status: {status}")
            if status == "live":
                print("Deploy succeeded!")
                sys.exit(0)
            elif status in ("build_failed", "update_failed", "canceled"):
                print(f"Deploy failed with status: {status}")
                sys.exit(1)
    except Exception as e:
        print(f"Error checking deploy status: {e}")
    
    time.sleep(15)
