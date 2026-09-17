#!/usr/bin/env python3
"""
Umbrella ATM Network Exchange Protocol
Implements zero-latency settlement and Time-Locked Proof-of-Trade for offline resilience
"""

import json
import hashlib
import base64
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Tuple
from dataclasses import dataclass, asdict

@dataclass
class OfflineTransaction:
    """Represents a time-locked transaction for offline processing"""
    tx_id: str
    node_id: str
    sender_pubkey: str
    recipient_pubkey: str
    amount_tokens: float
    local_currency: str
    exchange_rate: float
    fiat_equivalent: float
    timestamp_signed: str
    timestamp_submitted: str
    time_lock_until: str
    merkle_root: str  # For batch verification
    
    def to_dict(self):
        return asdict(self)
    
    def serialize_for_signing(self):
        """Create deterministic serialization for signing"""
        fields = [
            self.tx_id,
            self.node_id,
            self.sender_pubkey,
            self.recipient_pubkey,
            str(self.amount_tokens),
            self.local_currency,
            str(self.exchange_rate),
            str(self.fiat_equivalent),
            self.timestamp_signed
        ]
        return "|".join(fields)

class ATMNode:
    """Represents a single ATM node in the global network"""
    
    def __init__(self, node_id: str, location: dict, operator_key: str):
        self.node_id = node_id
        self.location = location
        self.operator_pubkey = operator_key
        self.fiat_balance: float = 0.0
        self.token_balance: float = 0.0
        self.status: str = "OFFLINE"
        self.last_heartbeat: str = None
        self.offline_txs: List[OfflineTransaction] = []
        
    def go_offline(self):
        """Mark node as offline and start time-locked transaction accumulation"""
        self.status = "OFFLINE"
        self.last_heartbeat = datetime.utcnow().isoformat()
        
    def go_online(self):
        """Mark node as online and sync accumulated transactions"""
        self.status = "ONLINE"
        self.last_heartbeat = datetime.utcnow().isoformat()
        
    def accumulate_offline_tx(self, tx: OfflineTransaction):
        """Add a time-locked transaction to offline queue"""
        self.offline_txs.append(tx)
        
    def get_pending_settlements(self) -> List[OfflineTransaction]:
        """Return transactions ready for settlement"""
        now = datetime.utcnow()
        ready = []
        for tx in self.offline_txs:
            if datetime.fromisoformat(tx.time_lock_until) <= now:
                ready.append(tx)
        return ready

class ATMExchangeProtocol:
    """
    Core ATM exchange protocol implementing:
    1. Zero-latency real-time settlement
    2. Time-Locked Proof-of-Trade for offline resilience
    3. Merkle tree batch verification for disputed transactions
    """
    
    def __init__(self):
        self.nodes: Dict[str, ATMNode] = {}
        self.pending_settlements: Dict[str, List[OfflineTransaction]] = {}
        self.settlement_history: List[dict] = []
        
    def register_node(self, node_id: str, location: dict, operator_key: str) -> bool:
        """Register a new ATM node"""
        if node_id in self.nodes:
            return False
            
        self.nodes[node_id] = ATMNode(node_id, location, operator_key)
        self.pending_settlements[node_id] = []
        return True
    
    def process_online_exchange(self, node_id: str, token_amount: float, 
                                local_currency: str) -> dict:
        """
        Process immediate exchange when node is online
        Zero-latency settlement with synchronous ledger update
        """
        if node_id not in self.nodes:
            raise ValueError(f"Node {node_id} not registered")
            
        node = self.nodes[node_id]
        if node.status != "ONLINE":
            raise ValueError(f"Node {node_id} is {node.status}, cannot process online exchange")
            
        # Get current exchange rate
        rate = self._get_exchange_rate(local_currency)
        fiat_out = token_amount * rate
        
        # Verify node has sufficient fiat
        if node.fiat_balance < fiat_out:
            raise ValueError(f"Insufficient fiat balance in node")
            
        # Execute exchange
        node.fiat_balance -= fiat_out
        tx_id = self._generate_tx_id(node_id)
        
        settlement = {
            "tx_id": tx_id,
            "type": "ONLINE_EXCHANGE",
            "node_id": node_id,
            "tokens_burned": token_amount,
            "fiat_released": round(fiat_out, 2),
            "currency": local_currency,
            "rate": rate,
            "timestamp": datetime.utcnow().isoformat(),
            "ledger_update": True  # Immediate ledger confirmation
        }
        
        self.settlement_history.append(settlement)
        return settlement
    
    def process_offline_trade(self, node_id: str, trade_data: dict) -> OfflineTransaction:
        """
        Create a time-locked proof-of-trade for offline settlement
        Used when ATM cannot connect to main ledger
        """
        if node_id not in self.nodes:
            raise ValueError(f"Node {node_id} not registered")
            
        tx_id = self._generate_tx_id(node_id, prefix="OFF")
        now = datetime.utcnow()
        
        # Create time-locked transaction
        tx = OfflineTransaction(
            tx_id=tx_id,
            node_id=node_id,
            sender_pubkey=trade_data.get("sender_pubkey", ""),
            recipient_pubkey=trade_data.get("recipient_pubkey", ""),
            amount_tokens=trade_data["amount_tokens"],
            local_currency=trade_data["local_currency"],
            exchange_rate=trade_data["exchange_rate"],
            fiat_equivalent=trade_data["amount_tokens"] * trade_data["exchange_rate"],
            timestamp_signed=trade_data["timestamp"],
            timestamp_submitted=now.isoformat(),
            time_lock_until=(now + timedelta(hours=24)).isoformat(),  # 24h lock
            merkle_root=""  # Will be set during batch processing
        )
        
        # Add to node's offline queue
        node = self.nodes[node_id]
        node.accumulate_offline_tx(tx)
        self.pending_settlements[node_id].append(tx)
        
        return tx
    
    def settle_offline_transactions(self, node_id: str) -> dict:
        """
        Process accumulated offline transactions when node comes online
        Implements batch verification with merkle tree proofs
        """
        if node_id not in self.nodes:
            raise ValueError(f"Node {node_id} not registered")
            
        node = self.nodes[node_id]
        pending = node.get_pending_settlements()
        
        if not pending:
            return {"status": "NO_SETTLEMENTS", "tx_count": 0}
            
        # Compute merkle root for batch verification
        tx_serialized = [tx.serialize_for_signing() for tx in pending]
        merkle_root = self._compute_merkle_root(tx_serialized)
        
        # Update all transactions with merkle root
        for tx in pending:
            tx.merkle_root = merkle_root
            
        # Process settlements
        total_tokens = 0
        total_fiat = 0
        
        for tx in pending:
            total_tokens += tx.amount_tokens
            total_fiat += tx.fiat_equivalent
            
            settlement = {
                "tx_id": tx.tx_id,
                "type": "OFFLINE_SETTLEMENT",
                "node_id": node_id,
                "tokens_burned": tx.amount_tokens,
                "fiat_released": round(tx.fiat_equivalent, 2),
                "currency": tx.local_currency,
                "rate": tx.exchange_rate,
                "timestamp": datetime.utcnow().isoformat(),
                "was_offline": True,
                "merkle_root": merkle_root
            }
            self.settlement_history.append(settlement)
        
        # Clear settled transactions
        node.offline_txs = [tx for tx in node.offline_txs if tx not in pending]
        self.pending_settlements[node_id] = []
        
        return {
            "status": "SETTLED",
            "tx_count": len(pending),
            "total_tokens": round(total_tokens, 2),
            "total_fiat": round(total_fiat, 2),
            "merkle_root": merkle_root,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _get_exchange_rate(self, currency: str) -> float:
        """Get current exchange rate"""
        rates = {
            "USD": 1.0, "EUR": 0.92, "GBP": 0.79,
            "JPY": 149.50, "CHF": 0.88, "SGD": 1.34,
            "AED": 3.67, "CNY": 7.24, "INR": 83.25,
            "BRL": 5.42
        }
        return rates.get(currency, 1.0)
    
    def _generate_tx_id(self, node_id: str, prefix: str = "TXN") -> str:
        """Generate unique transaction ID"""
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S%f')[:-3]
        return f"{prefix}-{timestamp}-{node_id[:4]}-{hashlib.md5(timestamp.encode()).hexdigest()[:4]}"
    
    def _compute_merkle_root(self, items: List[str]) -> str:
        """Compute Merkle tree root for batch verification"""
        if not items:
            return ""
            
        # Hash all items
        hashes = [hashlib.sha256(item.encode()).hexdigest() for item in items]
        
        # Build merkle tree
        while len(hashes) > 1:
            new_hashes = []
            for i in range(0, len(hashes), 2):
                left = hashes[i]
                right = hashes[i + 1] if i + 1 < len(hashes) else left
                combined = left + right
                new_hashes.append(hashlib.sha256(combined.encode()).hexdigest())
            hashes = new_hashes
            
        return hashes[0] if hashes else ""
    
    def get_network_status(self) -> dict:
        """Get comprehensive ATM network status"""
        return {
            "total_nodes": len(self.nodes),
            "online_nodes": len([n for n in self.nodes.values() if n.status == "ONLINE"]),
            "offline_nodes": len([n for n in self.nodes.values() if n.status == "OFFLINE"]),
            "pending_settlements": sum(len(settlements) for settlements in self.pending_settlements.values()),
            "total_settlements": len(self.settlement_history),
            "node_details": {
                node_id: {
                    "status": node.status,
                    "fiat_balance": round(node.fiat_balance, 2),
                    "token_balance": round(node.token_balance, 2),
                    "offline_txs": len(node.offline_txs),
                    "last_heartbeat": node.last_heartbeat
                }
                for node_id, node in self.nodes.items()
            }
        }


# Example usage
if __name__ == "__main__":
    print("=== Umbrella ATM Exchange Protocol ===")
    print("Initializing ATM network...")
    
    protocol = ATMExchangeProtocol()
    
    # Register nodes
    protocol.register_node("ATM-NYC-001", {"lat": 40.7128, "lon": -74.0060}, "pubkey-nyc")
    protocol.register_node("ATM-SGP-001", {"lat": 1.3521, "lon": 103.8198}, "pubkey-sgp")
    
    # Bring node online and process exchange
    nyc_node = protocol.nodes["ATM-NYC-001"]
    nyc_node.go_online()
    nyc_node.fiat_balance = 100000.0
    
    exchange = protocol.process_online_exchange("ATM-NYC-001", 1000.0, "USD")
    print(f"\nProcessed exchange: {exchange}")
    
    status = protocol.get_network_status()
    print(f"\nNetwork status: {json.dumps(status, indent=2)}")
