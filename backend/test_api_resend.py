import urllib.request
import json
import ssl
import random

rand_id = random.randint(100000, 999999)
email = f"test_verify_{rand_id}@nexus.io"
username = f"test_{rand_id}"
password = "SecurePassword123!"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# 1. Register
url_reg = "https://shadow-4cve.onrender.com/api/auth/register"
data_reg = {
    "username": username,
    "email": email,
    "password": password
}
req_reg = urllib.request.Request(
    url_reg, 
    data=json.dumps(data_reg).encode(),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req_reg, context=ctx) as response:
        res_reg = json.loads(response.read().decode())
        print("Register Response:")
        print(json.dumps(res_reg, indent=2))
except Exception as e:
    print(f"Register Error: {e}")
    # Read response body on error
    if hasattr(e, 'read'):
        print(e.read().decode())

# 2. Resend OTP
url_resend = "https://shadow-4cve.onrender.com/api/auth/resend-verification"
data_resend = {
    "email": email
}
req_resend = urllib.request.Request(
    url_resend,
    data=json.dumps(data_resend).encode(),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req_resend, context=ctx) as response:
        res_resend = json.loads(response.read().decode())
        print("\nResend Response:")
        print(json.dumps(res_resend, indent=2))
except Exception as e:
    print(f"\nResend Error: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode())
