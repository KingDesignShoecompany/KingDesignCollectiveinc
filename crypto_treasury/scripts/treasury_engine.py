#!/usr/bin/env python3
"""
Umbrella Treasury Engine
Core cryptocurrency valuation and ATM exchange protocol logic
"""

import json
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime
from typing import Dict, List, Optional
from collections import defaultdict

# Import verification system
from verify_payload import verify_payload, process_asset_payload

class TreasuryEngine:
    """
    Core treasury logic for asset-backed utility token
    Maintains reserve backing and ATM exchange protocols
    """
    
    def __init__(self):
        # Asset-backed reserve tracking
        self.reserve_assets: Dict[str, Dict] = defaultdict(lambda: defaultdict(float))
        self.reserve_values: Dict[str, float] = defaultdict(float)
        self.token_supply: Decimal = Decimal('0')
        self.reserve_ratio: Decimal = Decimal('0')
        self.atms: Dict[str, Dict] = {}
        self.exchange_rates: Dict[str, float] = {}
        
    def process_subsidiary_payload(self, signed_payload: dict) -> dict:
        """Process inbound asset valuation from subsidiary agents"""
        # Verify signature first
        verification_result = process_asset_payload(signed_payload)
        
        if verification_result["verification_status"] != "PASSED":
            raise SecurityError("Payload verification failed")
            
        subsidiary = verification_result["subsidiary"]
        assets = verification_result["assets"]
        value_usd = verification_result["value_usd"]
        
        # Update reserve tracking
        for asset_type, amount in assets.items():
            self.reserve_assets[subsidiary][asset_type] += amount
            
        self.reserve_values[subsidiary] += value_usd
        
        # Mint tokens at 0.8 ratio (conservative asset backing)
        tokens_minted = Decimal(str(value_usd)) * Decimal('0.8')
        self.token_supply += tokens_minted
        
        # Update reserve ratio
        total_reserves = sum(self.reserve_values.values())
        if self.token_supply > 0:
            self.reserve_ratio = Decimal(str(total_reserves)) / self.token_supply
            
        return {
            "status": "ACCEPTED",
            "subsidiary": subsidiary,
            "assets_added": assets,
            "value_added_usd": value_usd,
            "tokens_minted": float(tokens_minted.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
            "new_total_supply": float(self.token_supply.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
            "new_reserve_ratio": float(self.reserve_ratio.quantize(Decimal('0.02'), rounding=ROUND_HALF_UP))
        }
    
    def register_atm_node(self, node_id: str, location: dict, initial_fiat: float) -> dict:
        """Register a new ATM node in the exchange network"""
        self.atms[node_id] = {
            "node_id": node_id,
            "location": location,
            "fiat_balance": initial_fiat,
            "token_balance": 0.0,
            "last_sync": datetime.utcnow().isoformat(),
            "status": "ACTIVE"
        }
        
        return {
            "status": "REGISTERED",
            "node_id": node_id,
            "atm_count": len(self.atms)
        }
    
    def execute_exchange(self, node_id: str, token_amount: float, local_currency: str) -> dict:
        """
        Execute ATM exchange protocol: Token -> Local Fiat
        Follows 3-step verification: BALANCE -> CALCULATE -> SETTLE
        """
        if node_id not in self.atms:
            raise ValueError(f"ATM node {node_id} not registered")
            
        atm = self.atms[node_id]
        
        if atm["status"] != "ACTIVE":
            raise ValueError(f"ATM node {node_id} is not active")
            
        # Step 1: Verify Balance
        if atm["token_balance"] < token_amount:
            raise ValueError(f"Insufficient token balance in ATM node")
            
        # Calculate exchange rate
        rate = self._get_exchange_rate(local_currency)
        fiat_out = token_amount * rate
        
        # Step 2: Calculate Swap (with zero-latency pricing)
        if atm["fiat_balance"] < fiat_out:
            raise ValueError(f"Insufficient fiat balance in ATM node")
            
        # Step 3: Settle & Record
        atm["token_balance"] -= token_amount
        atm["fiat_balance"] -= fiat_out
        
        # Burn exchanged tokens (remove from circulation)
        self.token_supply -= Decimal(str(token_amount))
        
        # Update reserve ratio
        total_reserves = sum(self.reserve_values.values())
        if self.token_supply > 0:
            self.reserve_ratio = Decimal(str(total_reserves)) / self.token_supply
            
        transaction_id = f"TXN-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{node_id[:4]}"
        
        return {
            "status": "COMPLETED",
            "transaction_id": transaction_id,
            "node_id": node_id,
            "tokens_exchanged": token_amount,
            "fiat_released": round(fiat_out, 2),
            "exchange_rate": rate,
            "currency": local_currency,
            "remaining_supply": float(self.token_supply),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def rebalance_node(self, node_id: str, regional_revenue: float) -> dict:
        """
        Rebalance ATM node liquidity based on regional revenue/corporate allocation
        Called when node experiences high cash-out volume
        """
        if node_id not in self.atms:
            raise ValueError(f"ATM node {node_id} not registered")
            
        atm = self.atms[node_id]
        
        # Add incoming revenue to the node's reserves
        atm["fiat_balance"] += regional_revenue
        
        # Calculate new token allocation based on reserve ratio target
        target_token_balance = regional_revenue / 1.25  # 80% reserve ratio target
        
        tokens_added = target_token_balance - atm["token_balance"]
        if tokens_added > 0:
            # Mint new tokens backed by incoming revenue
            self.token_supply += Decimal(str(tokens_added))
            atm["token_balance"] = target_token_balance
            
        return {
            "status": "REBALANCED",
            "node_id": node_id,
            "revenue_added": regional_revenue,
            "tokens_replenished": round(tokens_added, 2) if tokens_added > 0 else 0,
            "new_fiat_balance": round(atm["fiat_balance"], 2),
            "new_token_balance": round(atm["token_balance"], 2)
        }
    
    def _get_exchange_rate(self, currency: str) -> float:
        """Get current exchange rate for currency"""
        # In production: integrate with real-time FX feeds
        rates = {
            "USD": 1.0,
            "EUR": 0.92,
            "GBP": 0.79,
            "JPY": 149.50,
            "CHF": 0.88,
            "SGD": 1.34,
            "AED": 3.67,
            "CNY": 7.24,
            "INR": 83.25,
            "BRL": 5.42
        }
        return rates.get(currency, rates["USD"])
    
    def get_treasury_report(self) -> dict:
        """Generate comprehensive treasury status report"""
        total_reserves = sum(self.reserve_values.values())
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "token_supply": float(self.token_supply),
            "total_reserves_usd": round(total_reserves, 2),
            "reserve_ratio": float(self.reserve_ratio.quantize(Decimal('0.02'), rounding=ROUND_HALF_UP)),
            "atm_nodes": len(self.atms),
            "reserve_breakdown": {
                subsidiary: {
                    "total_value": round(value, 2),
                    "assets": dict(assets)
                }
                for subsidiary, (value, assets) in zip(
                    self.reserve_values.keys(),
                    [(self.reserve_values[s], self.reserve_assets[s]) for s in self.reserve_values.keys()]
                )
            } if self.reserve_values else {},
            "atm_status": {
                node: {
                    "fiat_balance": round(atm["fiat_balance"], 2),
                    "token_balance": round(atm["token_balance"], 2),
                    "status": atm["status"]
                }
                for node, atm in self.atms.items()
            }
        }


class SecurityError(Exception):
    """Raised when security verification fails"""
    pass


# Example usage
if __name__ == "__main__":
    print("=== Umbrella Treasury Engine ===")
    print("Initializing treasury system...")
    
    treasury = TreasuryEngine()
    
    # Register sample ATM nodes
    treasury.register_atm_node("ATM-NYC-001", {"lat": 40.7128, "lon": -74.0060}, 100000.0)
    treasury.register_atm_node("ATM-SGP-001", {"lat": 1.3521, "lon": 103.8198}, 50000.0)
    
    print("Treasury initialized successfully!")
    print(f"ATM Nodes registered: {len(treasury.atms)}")
    print(f"Initial token supply: {treasury.token_supply}")
    
    print("\nUsage:")
    print("  from treasury_engine import TreasuryEngine")
    print("  treasury = TreasuryEngine()")
    print("  treasury.process_subsidiary_payload(signed_payload)")
    print("  treasury.execute_exchange('ATM-NYC-001', 1000.0, 'USD')")
    print("  report = treasury.get_treasury_report()")
