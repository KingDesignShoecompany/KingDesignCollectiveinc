# UE Client Examples
## Card Registration
1. Read NFC card via platform bridge
2. POST `/registerCard` with `userId`, `cardUid`, `checksum`
3. Store returned card data locally

## Battle Action
1. Read nonce from `/issueNonce`
2. Build action payload
3. Sign with HMAC
4. POST `/verifyAction` with signature headers
