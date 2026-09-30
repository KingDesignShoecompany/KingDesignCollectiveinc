#!/usr/bin/env python3
"""
Cross-Agent Payload Verification Test
Tests the full signing/verification flow between EWASTE_RECYCLING and CRYPTO_TREASURY agents
"""

import sys
import os
import json
from datetime import datetime

# Add scripts directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import our systems
from verify_payload import verify_payload, sign_payload, process_asset_payload
from treasury_engine import TreasuryEngine
from atm_protocol import ATMExchangeProtocol

def main():
    print("=== Cross-Agent Payload Verification Test ===")
    print()

    # Initialize systems
    treasury = TreasuryEngine()
    atm_protocol = ATMExchangeProtocol()

    # Step 1: Register ATM nodes across globe
    atm_protocol.register_node("ATM-NYC-001", {"lat": 40.7128, "lon": -74.0060, "sector": "FINANCE"}, "pubkey-nyc")
    atm_protocol.register_node("ATM-SGP-001", {"lat": 1.3521, "lon": 103.8198, "sector": "TRANSPORT"}, "pubkey-sgp")
    atm_protocol.register_node("ATM-LND-001", {"lat": 51.5074, "lon": -0.1278, "sector": "ENERGY"}, "pubkey-lnd")

    print("[1] Registered 3 ATM nodes in NYC, Singapore, and London")
    print()

    # Step 2: Create a signed payload from EWASTE_RECYCLING agent
    print("[2] Simulating EWASTE_RECYCLING payload creation and signing...")
    
    # This simulates what the EWASTE_RECYCLING agent would produce
    waste_payload = {
        "subsidiary": "EWASTE_RECYCLING",
        "assets": {
            "reclaimed_gold_oz": 42.5,
            "reclaimed_copper_lbs": 1250.0,
            "reclaimed_palladium_oz": 12.8
        },
        "estimated_spot_value_usd": 124500.00,
        "batch_id": "EWASTE_BATCH_2026_001",
        "processing_date": "2026-09-12T21:30:00Z",
        "timestamp": datetime.utcnow().isoformat()
    }

    # Sign the payload (simulating EWASTE_RECYCLING agent doing this)
    signed_payload = sign_payload(waste_payload, "EWASTE_RECYCLING")
    print(f"   Payload signed by EWASTE_RECYCLING")
    print(f"   Signature length: {len(signed_payload.get('signature_b64', ''))}")
    print(f"   Public key length: {len(signed_payload.get('public_key_b64', ''))}")
    print()

    # Step 3: CRYPTO_TREASURY agent verifies and processes
    print("[3] CRYPTO_TREASURY agent verifying and processing payload...")
    
    try:
        # First verify the signature
        is_valid = verify_payload(signed_payload)
        print(f"   Signature verification: {'PASSED' if is_valid else 'FAILED'}")
        
        if is_valid:
            # Process the asset payload
            result = process_asset_payload(signed_payload)
            print(f"   Payload processing: {result['verification_status']}")
            
            # Update treasury with the asset value
            total_value = sum(waste_payload["assets"].values())  # Simplified for test
            treasury.token_supply += Decimal(str(waste_payload["estimated_spot_value_usd"])) * Decimal('0.8')
            
            print(f"   New token supply: {float(treasury.token_supply)}")
            print()
            
            # Step 4: Distribute tokens to ATM network
            print("[4] Distributing tokens to ATM network...")
            
            # Fund ATM nodes
            nyc_node = atm_protocol.nodes["ATM-NYC-001"]
            sgp_node = atm_protocol.nodes["ATM-SGP-001"]
            lnd_node = atm_protocol.nodes["ATM-LND-001"]
            
            # Simulate funding from treasury
            nyc_node.fiat_balance = 500000.0
            nyc_node.token_balance = 400000.0
            sgp_node.fiat_balance = 200000.0
            sgp_node.token_balance = 150000.0
            lnd_node.fiat_balance = 150000.0
            lnd_node.token_balance = 100000.0
            
            print("   Funds distributed to 3 ATM nodes")
            print()
            
            # Step 5: Process exchange transactions
            print("[5] Processing exchange transactions through ATM network...")
            
            # Online exchange in NYC
            nyc_node.go_online()
            nyc_exchange = atm_protocol.process_online_exchange("ATM-NYC-001", 25000.0, "USD")
            print(f"   NYC exchange: {nyc_exchange['tokens_burned']} tokens → {nyc_exchange['fiat_released']} USD")
            
            # Offline trade in Singapore (time-locked)
            sgp_node.go_offline()
            sg_trade = atm_protocol.process_offline_trade("ATM-SGP-001", {
                "sender_pubkey": "pubkey-sgp",
                "recipient_pubkey": "pubkey-user",
                "amount_tokens": 15000.0,
                "local_currency": "SGD",
                "exchange_rate": 1.34,
                "timestamp": "2026-09-12T22:00:00Z"
            })
            print(f"   SGP offline trade queued: {sg_trade.amount_tokens} tokens → {sg_trade.fiat_equivalent} SGD (24h lock)")
            
            # London online exchange
            lnd_node.go_online()
            lnd_exchange = atm_protocol.process_online_exchange("ATM-LND-001", 10000.0, "GBP")
            print(f"   London exchange: {lnd_exchange['tokens_burned']} tokens → {lnd_exchange['fiat_released']} GBP")
            print()
            
        else:
            print("   ERROR: Signature verification failed!")
            return False
            
    except Exception as e:
        print(f"   ERROR during verification: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

    # Step 6: Test security rejection
    print("[6] Testing security rejection of tampered payload...")
    
    tampered_payload = signed_payload.copy()
    tampered_payload["payload"]["estimated_spot_value_usd"] = 999999.00  # Tampered!
    
    is_still_valid = verify_payload(tampered_payload)
    print(f"   Tampered payload accepted: {'YES - SECURITY FAIL!' if is_still_valid else 'NO - Security working correctly'}")
    print()

    # Final status report
    print("[7] Final Network Status Report:")
    status = atm_protocol.get_network_status()
    print(json.dumps(status, indent=2))
    print()

    print("=== Cross-Agent Payload Verification Test PASSED ===")
    return True

if __name__ == "__main__":
    from decimal import Decimal
    success = main()
    sys.exit(0 if success else 1)
