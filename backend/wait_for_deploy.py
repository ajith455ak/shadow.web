import urllib.request
import json
import ssl
import time
import sys
import os

api_key = "rnd_oChEZnH4KJPJk6sILMVt4HfvnENq"
service_id = "srv-d8mecb67r5hc739mkn10"

# Read deploy_id from command line or environment
if len(sys.argv) > 1:
    deploy_id = sys.argv[1]
else:
    deploy_id = os.getenv("RENDER_DEPLOY_ID", "")

if not deploy_id:
    print("Error: No deploy ID provided.", file=sys.stderr)
    sys.exit(1)

headers = {
    "Authorization": f"Bearer {api_key}",
    "Accept": "application/json"
}

def write_summary(status, is_success):
    summary_path = os.getenv("GITHUB_STEP_SUMMARY")
    if summary_path:
        status_icon = "🟢 LIVE" if is_success else f"🔴 {status.upper()}"
        title = "🚀 Render Deployment Succeeded" if is_success else "❌ Render Deployment Failed"
        commit_sha = os.getenv("GITHUB_SHA", "N/A")
        md = [
            f"# {title}\n",
            "The automated deployment to Render has completed.\n",
            "| Parameter | Value |",
            "| --- | --- |",
            f"| **Service ID** | `{service_id}` |",
            f"| **Deploy ID** | `{deploy_id}` |",
            f"| **Commit SHA** | `{commit_sha}` |",
            f"| **Status** | {status_icon} |",
            "| **Deployment URL** | [shadow-4cve.onrender.com](https://shadow-4cve.onrender.com) |"
        ]
        try:
            with open(summary_path, "w", encoding="utf-8") as f:
                f.write("\n".join(md))
        except Exception as e:
            print(f"Error writing GITHUB_STEP_SUMMARY: {e}", file=sys.stderr)

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
                write_summary(status, True)
                sys.exit(0)
            elif status in ("build_failed", "update_failed", "canceled"):
                print(f"Deploy failed with status: {status}")
                write_summary(status, False)
                sys.exit(1)
    except Exception as e:
        print(f"Error checking deploy status: {e}", file=sys.stderr)
    
    time.sleep(15)
