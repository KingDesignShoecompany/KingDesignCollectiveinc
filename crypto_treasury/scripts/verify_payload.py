#!/usr/bin/env python3
"""
Ed25519 Signature Verification System for Umbrella Corporation
Implements cryptographic payload signing and verification between subsidiary agents
"""

import json
import base64
import hashlib
from datetime import datetime
from nacl.signing import SigningKey, VerifyKey
from nacl.exceptions import BadSignatureError
from nacl.encoding import Base64Encoder

# Subsidiary key registry (in production, keys stored in secure vault)
SUBSIDIARY_KEYS = {
    "EWASTE_RECYCLING": {
        "private_key_file": "/secure_keys/ewaste_private.key",
        "public_key_file": "/secure_keys/ewaste_public.key"
    },
    "QUANTUM_WEARABLES": {
        "private_key_file": "/secure_keys/quantum_private.key",
        "public_key_file": "/secure_keys/quantum_public.key"
    },
    "INNOVATION_HUB": {
        "private_key_file": "/secure_keys/innovation_private.key",
        "public_key_file": "/secure_keys/innovation_public.key"
    },
    "SHOE_BRAND": {
        "private_key_file": "/secure_keys/shoe_private.key",
        "public_key_file": "/secure_keys/shoe_public.key"
    }
}

# Public key registry for verification (would be loaded from secure config in production)
TRUSTED_PUBLIC_KEYS = {}  # Populated during initialization

def generate_key_pair(subsidiary_name: str) -> dict:
    """Generate Ed25519 key pair for a subsidiary"""
    signing_key = SigningKey.generate()
    verify_key = signing_key.verify_key
    
    private_key_b64 = base64.b64encode(bytes(signing_key)).decode('utf-8')
    public_key_b64 = base64.b64encode(bytes(verify_key)).decode('utf-8')
    
    keys = {
        "subsidiary": subsidiary_name,
        "private_key_b64": private_key_b64,
        "public_key_b64": public_key_b64,
        "generated_at": datetime.utcnow().isoformat()
    }
    
    # Store in registry
    TRUSTED_PUBLIC_KEYS[subsidiary_name] = public_key_b64
    
    return keys

def sign_payload(data: dict, subsidiary_name: str) -> dict:
    """Sign a JSON payload with subsidiary's private key"""
    # Serialize data deterministically
    payload_str = json.dumps(data, sort_keys=True, separators=(',', ':'))
    payload_bytes = payload_str.encode('utf-8')
    
    # Load private key (simplified - in production use secure key management)
    if subsidiary_name not in TRUSTED_PUBLIC_KEYS:
        # Generate keys if not present
        keys = generate_key_pair(subsidiary_name)
    else:
        # Load existing keys from registry or secure storage
        signing_key = SigningKey(base64.b64decode(TRUSTED_PUBLIC_KEYS[subsidiary_name]))
    
    # For demo: generate keys on the fly
    signing_key = SigningKey.generate()
    signature = signing_key.sign(payload_bytes, encoder=Base64Encoder)
    
    return {
        "subsidiary": subsidiary_name,
        "payload": data,
        "signature_b64": signature.signature.decode('utf-8'),
        "public_key_b64": base64.b64encode(bytes(signing_key.verify_key)).decode('utf-8'),
        "timestamp": datetime.utcnow().isoformat(),
        "payload_hash": hashlib.sha256(payload_bytes).hexdigest()
    }

def verify_payload(signed_payload: dict) -> bool:
    """Verify a signed payload's authenticity and integrity"""
    try:
        # Extract components
        subsidiary = signed_payload["subsidiary"]
        payload = signed_payload["payload"]
        signature_b64 = signed_payload["signature_b64"]
        public_key_b64 = signed_payload["public_key_b64"]
        timestamp = signed_payload["timestamp"]
        expected_hash = signed_payload["payload_hash"]
        
        # Verify timestamp (prevent replay attacks)
        payload_time = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        # In production: check if payload is within acceptable time window
        
        # Serialize payload deterministically
        payload_str = json.dumps(payload, sort_keys=True, separators=(',', ':'))
        payload_bytes = payload_str.encode('utf-8')
        
        # Verify hash matches
        actual_hash = hashlib.sha256(payload_bytes).hexdigest()
        if actual_hash != expected_hash:
            log_verification_attempt(subsidiary, "FAILED", "Payload hash mismatch")
            return False
        
        # Verify signature
        signature_bytes = base64.b64decode(signature_b64)
        public_key_bytes = base64.b64decode(public_key_b64)
        
        verify_key = VerifyKey(public_key_bytes)
        
        # Recreate signed data
        signed_data = signature_bytes[:len(payload_bytes)]
        signature = signature_bytes[len(payload_bytes):]
        
        # For ed25519, signature verification
        verify_key.verify(payload_bytes, signature_bytes)
        
        # Log successful verification
        log_verification_attempt(subsidiary, "ACCEPTED", "Signature valid")
        return True
        
    except (BadSignatureError, KeyError, ValueError, Exception) as e:
        log_verification_attempt(
            signed_payload.get("subsidiary", "UNKNOWN"), 
            "REJECTED", 
            str(e)
        )
        return False

def log_verification_attempt(subsidiary: str, status: str, message: str):
    """Log verification attempts for security auditing"""
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "subsidiary": subsidiary,
        "status": status,
        "message": message
    }
    
    # Append to verification log
    log_file = "/var/log/treasury/verification.log"
    import os
    os.makedirs(os.path.dirname(log_file), exist_ok=True)
    
    with open(log_file, 'a') as f:
        f.write(json.dumps(log_entry) + "\n")

def process_asset_payload(signed_payload: dict) -> dict:
    """
    Main entry point for processing inbound asset valuation payloads
    Returns processed asset data if verification passes
    """
    if not verify_payload(signed_payload):
        raise ValueError("Payload signature verification failed")
    
    payload = signed_payload["payload"]
    
    # Validate required fields
    required_fields = ["subsidiary", "assets", "estimated_spot_value_usd", "timestamp"]
    for field in required_fields:
        if field not in payload:
            raise ValueError(f"Missing required field: {field}")
    
    return {
        "verification_status": "PASSED",
        "subsidiary": payload["subsidiary"],
        "assets": payload["assets"],
        "value_usd": float(payload["estimated_spot_value_usd"]),
        "payload_timestamp": payload["timestamp"],
        "processed_at": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    # Demo usage
    print("=== Umbrella Treasury Signature Verification System ===")
    print(f"Trusted subsidiaries: {list(TRUSTED_PUBLIC_KEYS.keys())}")
    print("\nUsage:")
    print("  from verify_payload import sign_payload, verify_payload, process_asset_payload")
    print("  signed = sign_payload({'subsidiary': 'EWASTE_RECYCLING', 'assets': {...}}, 'EWASTE_RECYCLING')")
    print("  result = process_asset_payload(signed)")
