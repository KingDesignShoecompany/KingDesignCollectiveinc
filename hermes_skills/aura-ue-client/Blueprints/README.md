# UE Client Blueprints
## NFCReadBPLibrary
Exposes NFC read functions to Blueprint:
- `StartNFCSession()`
- `StopNFCSession()`
- `OnCardRead` event with `CardUid`, `SnapshotBase64`, `Checksum`
## RegisterCardFlow
1. Call `StartNFCSession()`
2. On `OnCardRead`, send `POST /registerCard` with `userId`, `cardUid`, `checksum`
3. Handle success/failure and update UI
## BattleSyncFlow
1. Obtain nonce from `POST /issueNonce`
2. Build action payload
3. Compute HMAC signature using shared secret
4. Call `POST /verifyAction` with headers `x-signature`, `x-timestamp`
