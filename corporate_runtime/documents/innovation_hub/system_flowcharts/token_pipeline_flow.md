# Token Pipeline Flowchart

## Asset Ingestion
1. Sub-agent generates asset payload
2. Ed25519 signature applied
3. CRYPTO_TREASURY verifies signature
4. Ledger updated

## Minting
1. Reserve ratio calculated
2. Finance approval required
3. Token minted with collateral lock
