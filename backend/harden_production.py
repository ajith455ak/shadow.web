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
    "Accept": "application/json",
    "Content-Type": "application/json"
}

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# 1. Get current env vars
url_env = f"https://api.render.com/v1/services/{service_id}/env-vars"
req_get = urllib.request.Request(url_env, headers=headers)

try:
    with urllib.request.urlopen(req_get, context=ctx) as response:
        env_vars_raw = json.loads(response.read().decode())
        print("Fetched current environment variables.")
except Exception as e:
    print(f"Error fetching env vars: {e}")
    exit(1)

# 2. Modify ENABLE_DEMO_TOKENS to "false"
payload = []
for item in env_vars_raw:
    ev = item["envVar"]
    key = ev["key"]
    value = ev["value"]
    if key == "ENABLE_DEMO_TOKENS":
        value = "false"
        print("Updating ENABLE_DEMO_TOKENS to 'false'.")
    payload.append({"key": key, "value": value})

# 3. PUT updated list
req_put = urllib.request.Request(
    url_env,
    data=json.dumps(payload).encode(),
    headers=headers,
    method="PUT"
)

try:
    with urllib.request.urlopen(req_put, context=ctx) as response:
        res_put = json.loads(response.read().decode())
        print("\nSuccessfully updated env vars on Render:")
        print(json.dumps(res_put, indent=2))
except Exception as e:
    print(f"Error updating env vars: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode())
    exit(1)

# 4. Trigger deploy to apply the updated env vars
url_deploy = f"https://api.render.com/v1/services/{service_id}/deploys"
req_deploy = urllib.request.Request(
    url_deploy,
    data=json.dumps({}).encode(),
    headers=headers,
    method="POST"
)

try:
    with urllib.request.urlopen(req_deploy, context=ctx) as response:
        res_deploy = json.loads(response.read().decode())
        print("\nSuccessfully triggered hardening deployment:")
        print(f"New deploy ID: {res_deploy['id']}")
except Exception as e:
    print(f"Error triggering deploy: {e}")
