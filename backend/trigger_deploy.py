import urllib.request
import json
import ssl
import sys

api_key = "rnd_oChEZnH4KJPJk6sILMVt4HfvnENq"
service_id = "srv-d8mecb67r5hc739mkn10"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Accept": "application/json",
    "Content-Type": "application/json"
}

def get_latest_deploy_id():
    url = f"https://api.render.com/v1/services/{service_id}/deploys?limit=1"
    req = urllib.request.Request(url, headers=headers)
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            data = json.loads(response.read().decode())
            if data:
                return data[0]["deploy"]["id"]
    except Exception as e:
        print(f"Error fetching latest deploy ID: {e}", file=sys.stderr)
    return None

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
        raw_body = response.read().decode().strip()
        try:
            data = json.loads(raw_body) if raw_body else {}
        except json.JSONDecodeError:
            data = {}
            
        if not data or "id" not in data:
            deploy_id = get_latest_deploy_id()
            if deploy_id:
                print(json.dumps({"id": deploy_id, "status": "no_content_fallback"}, indent=2))
                sys.exit(0)
            else:
                print(f"Error: Invalid response body '{raw_body}' and failed to fetch latest deploy ID", file=sys.stderr)
                sys.exit(1)
                
        print(json.dumps(data, indent=2))
except Exception as e:
    # 400/409 represents conflict when deploy is already in progress
    is_conflict = False
    if hasattr(e, 'code') and e.code in (400, 409):
        is_conflict = True
    elif '409' in str(e) or '400' in str(e):
        is_conflict = True
        
    if is_conflict:
        deploy_id = get_latest_deploy_id()
        if deploy_id:
            print(json.dumps({"id": deploy_id, "status": "already_in_progress"}, indent=2))
            sys.exit(0)
            
    print(f"Error triggering deploy: {e}", file=sys.stderr)
    if hasattr(e, 'read'):
        print(e.read().decode(), file=sys.stderr)
    sys.exit(1)
