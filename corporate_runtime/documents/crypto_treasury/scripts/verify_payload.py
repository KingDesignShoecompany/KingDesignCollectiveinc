#!/usr/bin/env python3.13
"""
Ed25519 Payload Verification System
=====================================
Crypto Treasury Agent - Umbrella Corporation

Verifies cross-agent JSON payloads using Ed25519 signatures.
Each subsidiary has a persistent key pair stored in the keys/ directory.
Incoming payloads must carry a ``signature`` field; the signature is
verified against the emitting subsidiary's public key.

Workflow:
  1. Generate / load key pairs for each known subsidiary.
  2. Verify incoming JSON payloads with the ``signature`` field.
  3. Reject payloads with invalid signatures (quarantine).
  4. Log all verification attempts to keys/../logs/verification.log

Known subsidiaries (from subsidiaries/backing_asset_registry.json):
    vagary_index, shoes, gamedev, kids, innovation, ewaste, quantum

Usage:
    python verify_payload.py --payload sample_payload.json
    python verify_payload.py --payload sample_payload.json --emit test_sub --payload-type ASSET_VALUATION
    python verify_payload.py --generate-keys
    python verify_payload.py --list-keys

Security notes:
    - Private keys are stored as hex strings in PEM-like files with 0600
      permissions.  Never commit these to shared storage.
    - The payload that is signed / verified does **not** include the
      ``signature`` field itself.  The canonical message is the JSON
      with the signature field removed, key-sorted, and serialised with
      no extraneous whitespace.
"""

from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import logging
import os
import secrets
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from nacl.signing import SigningKey, VerifyKey
from nacl.exceptions import CryptoError, BadSignatureError
from nacl.encoding import RawEncoder

# ---------------------------------------------------------------------------
# Paths & constants
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent            # crypto_treasury/
KEYS_DIR = PROJECT_ROOT / "keys"
LOG_FILE = PROJECT_ROOT / "logs" / "verification.log"

# Canonical list of subsidiaries recognised by the treasury.
KNOWN_SUBSIDIARIES = [
    "vagary_index",
    "shoes",
    "gamedev",
    "kids",
    "innovation",
    "ewaste",
    "quantum",
]

# Payload types recognised by the treasury (extensible).
KNOWN_PAYLOAD_TYPES = [
    "ASSET_VALUATION",
    "LIQUIDITY_REBALANCE",
    "SETTLEMENT_REPORT",
    "RESERVE_UPDATE",
]

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

def _setup_logger() -> logging.Logger:
    """Configure a logger that writes to both file and stdout."""
    KEYS_DIR.mkdir(parents=True, exist_ok=True)
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

    logger = logging.getLogger("treasury.verify")
    logger.setLevel(logging.DEBUG)
    logger.propagate = False
    # Avoid duplicate handlers if called repeatedly.
    if logger.handlers:
        return logger

    fmt = logging.Formatter(
        "%(asctime)sZ | %(levelname)-8s | %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    # Force UTC timestamps.
    fmt.converter = time.gmtime

    fh = logging.FileHandler(str(LOG_FILE), encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)
    logger.addHandler(fh)

    sh = logging.StreamHandler(sys.stdout)
    sh.setLevel(logging.INFO)
    sh.setFormatter(fmt)
    logger.addHandler(sh)

    return logger


log = _setup_logger()


# ---------------------------------------------------------------------------
# Key management
# ---------------------------------------------------------------------------

def _key_paths(subsidiary: str) -> tuple[Path, Path]:
    """Return (private_path, public_path) for a subsidiary."""
    priv = KEYS_DIR / f"{subsidiary}.ed25519.sk"
    pub = KEYS_DIR / f"{subsidiary}.ed25519.pk"
    return priv, pub


def _restrict_permissions(path: Path) -> None:
    """Best-effort chmod 600 on POSIX systems."""
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass  # Windows / non-POSIX — permissions handled differently.


def generate_keypair(subsidiary: str) -> tuple[str, str]:
    """
    Generate a fresh Ed25519 key pair for *subsidiary* and persist it.

    Returns ``(private_hex, public_hex)``.
    """
    signing_key = SigningKey.generate()
    verify_key = signing_key.verify_key

    priv_hex = signing_key.encode(encoder=RawEncoder).hex()
    pub_hex = verify_key.encode(encoder=RawEncoder).hex()

    priv_path, pub_path = _key_paths(subsidiary)
    priv_path.write_text(priv_hex, encoding="utf-8")
    pub_path.write_text(pub_hex, encoding="utf-8")
    _restrict_permissions(priv_path)
    _restrict_permissions(pub_path)

    log.info("Generated key pair for subsidiary '%s' -> %s, %s",
             subsidiary, priv_path.name, pub_path.name)
    return priv_hex, pub_hex


def load_keypair(subsidiary: str) -> tuple[str, str]:
    """
    Load the Ed25519 key pair for *subsidiary*.

    If either file is missing a new pair is generated.
    Returns ``(private_hex, public_hex)``.
    """
    priv_path, pub_path = _key_paths(subsidiary)
    if not priv_path.exists() or not pub_path.exists():
        log.info("Key pair missing for '%s' — generating new pair.", subsidiary)
        return generate_keypair(subsidiary)

    priv_hex = priv_path.read_text(encoding="utf-8").strip()
    pub_hex = pub_path.read_text(encoding="utf-8").strip()
    return priv_hex, pub_hex


def load_verify_key(subsidiary: str) -> VerifyKey:
    """Return a ready-to-use :class:`VerifyKey` for *subsidiary*."""
    _priv_hex, pub_hex = load_keypair(subsidiary)
    return VerifyKey(bytes.fromhex(pub_hex), encoder=RawEncoder)


def load_signing_key(subsidiary: str) -> SigningKey:
    """Return a ready-to-use :class:`SigningKey` for *subsidiary*."""
    priv_hex, _pub_hex = load_keypair(subsidiary)
    return SigningKey(bytes.fromhex(priv_hex), encoder=RawEncoder)


def ensure_all_keys() -> dict[str, str]:
    """Ensure key pairs exist for every known subsidiary."""
    pub_keys: dict[str, str] = {}
    for sub in KNOWN_SUBSIDIARIES:
        priv, pub = load_keypair(sub)
        pub_keys[sub] = pub
    return pub_keys


def list_known_keys() -> list[dict[str, str]]:
    """Return metadata about every key pair on disk."""
    results: list[dict[str, str]] = []
    for sub in KNOWN_SUBSIDIARIES:
        priv_path, pub_path = _key_paths(sub)
        results.append({
            "subsidiary": sub,
            "private_key_exists": priv_path.exists(),
            "public_key_exists": pub_path.exists(),
            "private_key_file": str(priv_path),
            "public_key_file": str(pub_path),
        })
    return results


# ---------------------------------------------------------------------------
# Signature helpers
# ---------------------------------------------------------------------------

def canonical_message(payload: dict) -> bytes:
    """
    Build the canonical message that was signed / will be verified.

    The ``signature`` field itself is removed from *payload* so that the
    signature is never part of the verified data.
    """
    stripped = {k: v for k, v in payload.items() if k != "signature"}
    return json.dumps(stripped, sort_keys=True, separators=(",", ":")).encode("utf-8")


def sign_payload(payload: dict, subsidiary: str) -> str:
    """
    Sign *payload* (in-place) for *subsidiary* and return the hex signature.

    A ``signature`` field is inserted into the payload dict.
    """
    signing_key = load_signing_key(subsidiary)
    message = canonical_message(payload)
    signed = signing_key.sign(message, encoder=RawEncoder)
    signature_hex = signed.signature.hex()
    payload["signature"] = signature_hex
    log.debug("Signed payload for '%s' (msg_hash=%s, sig=%s...)",
              subsidiary,
              hashlib.sha256(message).hexdigest()[:12],
              signature_hex[:12])
    return signature_hex


def verify_signature(payload: dict) -> tuple[bool, str, str]:
    """
    Verify the ``signature`` field on *payload*.

    Returns ``(valid, reason, subsidiary)``.
    *reason* is a human-readable status string.
    """
    # --- structural checks ---
    if not isinstance(payload, dict):
        return False, "payload is not a JSON object", ""

    subsidiary = payload.get("subsidiary", "")
    if not subsidiary:
        return False, "missing 'subsidiary' field", ""

    signature = payload.get("signature")
    if not signature:
        return False, "missing 'signature' field", subsidiary

    if subsidiary not in KNOWN_SUBSIDIARIES:
        return False, f"unknown subsidiary '{subsidiary}'", subsidiary

    try:
        signature_bytes = bytes.fromhex(signature)
    except ValueError:
        return False, "signature is not valid hex", subsidiary

    # --- signature verification ---
    try:
        verify_key = load_verify_key(subsidiary)
        message = canonical_message(payload)
        verify_key.verify(message, signature_bytes, encoder=RawEncoder)
    except BadSignatureError:
        return False, "signature does not match payload", subsidiary
    except CryptoError as exc:
        return False, f"crypto error: {exc}", subsidiary

    return True, "signature valid", subsidiary


# ---------------------------------------------------------------------------
# Payload logging
# ---------------------------------------------------------------------------

def record_ledger_entry(payload: dict, valid: bool, reason: str, subsidiary: str) -> None:
    """
    Record every verification attempt as a structured JSON line in the log.

    This satisfies the treasury audit-trail requirement (Rule 4 of the
    verification protocol).
    """
    entry = {
        "ts_utc": datetime.now(timezone.utc).isoformat(),
        "subsidiary": subsidiary,
        "payload_type": payload.get("payload_type", ""),
        "timestamp": payload.get("timestamp", ""),
        "signature_present": bool(payload.get("signature")),
        "valid": valid,
        "reason": reason,
        # Truncated content hash for deduplication without leaking assets.
        "payload_sha256": hashlib.sha256(
            json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
        ).hexdigest()[:32],
    }
    log.info("VERIFY_RESULT | %s", json.dumps(entry, sort_keys=True))


# ---------------------------------------------------------------------------
# Quarantine helpers
# ---------------------------------------------------------------------------

QUARANTINE_DIR = PROJECT_ROOT / "quarantine"


def quarantine_payload(payload: dict, reason: str) -> Path:
    """Persist a rejected payload to the quarantine directory."""
    if not isinstance(payload, dict):
        payload = {"raw": str(payload)}

    QUARANTINE_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    # Hash to prevent filename collisions.
    digest = hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()[:16]
    fname = f"quarantined_{ts}_{digest}.json"
    qpath = QUARANTINE_DIR / fname
    payload["_quarantine_reason"] = reason
    payload["_quarantined_at"] = ts
    qpath.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")
    log.warning("Payload quarantined -> %s (reason: %s)", qpath.name, reason)
    return qpath


# ---------------------------------------------------------------------------
# Core verification entry point
# ---------------------------------------------------------------------------

def verify_payload(payload: dict) -> dict:
    """
    Full verification pipeline for a single payload.

    Steps:
      1. Validate the payload is a dict.
      2. Verify the Ed25519 signature.
      3. Log the attempt.
      4. Quarantine if invalid; accept if valid.

    Returns a result dict:
        { valid: bool, reason: str, subsidiary: str, payload_type: str }
    """
    valid, reason, subsidiary = verify_signature(payload)
    payload_type = payload.get("payload_type", "") if isinstance(payload, dict) else ""

    record_ledger_entry(payload, valid, reason, subsidiary)

    if valid:
        log.info("[ACCEPT] payload from '%s' (type=%s)", subsidiary, payload_type)
    else:
        log.warning("[REJECT] payload — %s (subsidiary=%s)", reason, subsidiary)
        quarantine_payload(payload, reason)

    return {
        "valid": valid,
        "reason": reason,
        "subsidiary": subsidiary,
        "payload_type": payload_type,
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _load_payload_from_file(path: str) -> dict:
    """Load JSON from a file path (or stdin if path is ``-``)."""
    if path == "-":
        raw = sys.stdin.read()
    else:
        raw = Path(path).read_text(encoding="utf-8")
    return json.loads(raw)


def _print_keys_table() -> None:
    """Pretty-print the known key pairs."""
    log.info("Known subsidiaries: %s", ", ".join(KNOWN_SUBSIDIARIES))
    keys = list_known_keys()
    if not keys:
        print("No key pairs found.")
        return
    print(f"\n{'Subsidiary':<18} {'Priv':<6} {'Pub':<6}  Private Key File")
    print("-" * 70)
    for k in keys:
        priv = "yes" if k["private_key_exists"] else "NO"
        pub = "yes" if k["public_key_exists"] else "NO"
        print(f"{k['subsidiary']:<18} {priv:<6} {pub:<6}  {k['private_key_file']}")
    print()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Ed25519 payload verification for the Crypto Treasury Agent.",
    )
    parser.add_argument(
        "--payload",
        help="Path to a JSON payload file to verify (use '-' for stdin).",
    )
    parser.add_argument(
        "--generate-keys",
        action="store_true",
        help="Generate / ensure key pairs for all known subsidiaries.",
    )
    parser.add_argument(
        "--list-keys",
        action="store_true",
        help="List all known key pairs on disk.",
    )
    parser.add_argument(
        "--emit",
        help="Subsidiary to sign a test payload with (requires --payload-type).",
    )
    parser.add_argument(
        "--payload-type",
        choices=KNOWN_PAYLOAD_TYPES,
        help="Payload type for a self-signed test payload.",
    )
    parser.add_argument(
        "--asset-value",
        type=float,
        default=100000.0,
        help="Estimated spot value in USD for self-signed test payload (default 100000).",
    )
    args = parser.parse_args(argv)

    # --- ensure keys always exist ---
    ensure_all_keys()

    # --- mode: list keys ---
    if args.list_keys:
        _print_keys_table()
        return 0

    # --- mode: generate keys ---
    if args.generate_keys:
        for sub in KNOWN_SUBSIDIARIES:
            load_keypair(sub)
        print(f"[OK] Key pairs ensured for {len(KNOWN_SUBSIDIARIES)} subsidiaries.")
        _print_keys_table()
        return 0

    # --- mode: sign a test payload ---
    if args.emit and args.payload_type:
        test_payload = {
            "subsidiary": args.emit,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload_type": args.payload_type,
            "assets": {
                "test_asset_oz": 1.0,
            },
            "estimated_spot_value_usd": args.asset_value,
        }
        sign_payload(test_payload, args.emit)
        out_path = SCRIPT_DIR / "test_signed_payload.json"
        out_path.write_text(json.dumps(test_payload, indent=2, sort_keys=True), encoding="utf-8")
        log.info("Self-signed test payload written -> %s", out_path)

        # Immediately verify it to prove the round-trip.
        test_payload2 = json.loads(out_path.read_text(encoding="utf-8"))
        result = verify_payload(test_payload2)
        print(f"\nTest round-trip verification: {'PASS' if result['valid'] else 'FAIL'}")
        print(f"  Reason: {result['reason']}")
        print(f"  Subsidiary: {result['subsidiary']}")
        print(f"  Payload type: {result['payload_type']}")
        print(f"\nTest payload at: {out_path}")
        return 0 if result["valid"] else 1

    # --- mode: verify a payload ---
    if args.payload:
        try:
            payload = _load_payload_from_file(args.payload)
        except json.JSONDecodeError as exc:
            log.error("Invalid JSON in payload file: %s", exc)
            return 2
        except OSError as exc:
            log.error("Cannot read payload file: %s", exc)
            return 2

        result = verify_payload(payload)
        print(json.dumps(result, indent=2, sort_keys=True))
        return 0 if result["valid"] else 1

    # --- no args: print help ---
    parser.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
