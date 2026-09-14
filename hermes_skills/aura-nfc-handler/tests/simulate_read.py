# simulate_read.py
# Simulate sending a card snapshot to the backend for registration/fusion testing.
# Requires: pip install requests
import requests
import base64
import json
import hashlib
import time

API = "http://localhost:3000/registerCard"  # adjust to your backend
USER_ID = "user-uuid-sample"
CARD_UID = "DEADBEEFCAFEBABE"
# Simulated snapshot bytes
snapshot = b'\x00' * 888
checksum = base64.b64encode(hashlib.sha256(snapshot).digest()).decode()
payload = {
"userId": USER_ID,
"cardUid": CARD_UID,
"checksum": checksum,
"snapshot": base64.b64encode(snapshot).decode()
}
resp = requests.post(API, json=payload)
print(resp.status_code, resp.text)
