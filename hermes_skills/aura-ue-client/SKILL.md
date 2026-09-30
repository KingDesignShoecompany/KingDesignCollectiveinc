---
name: aura-ue-client
description: "UE5.7 client integration: NFC tap events, HTTP requests, AR spawn animations."
version: 1.0.0
author: Hermes Agent
license: MIT
category: gaming
metadata:
  hermes:
    tags: ["aura-champions", "unreal", "ue5", "ar", "http", "nfc", "client"]
    related_skills: [game-design, aura-champions]
---

# UE Client

## Overview
Provide UE 5.7 client integration for Aura Champions: NFC tap events, HTTP requests to backend, and AR spawn/Trinity animation hooks.

## When to use
Use when you need:
- C++ or Blueprint wrappers for NFC reads
- FHttpModule async JSON requests
- AR calibration and summon/Trinity VFX contracts
- Desync handling and wait-state UX

## Steps
1. Show C++ skeleton for sending `{"cardId","action","target"}` and handling responses.
2. Describe wait-state UX and desync handling.
3. Provide blueprint hooks for AR calibration and Trinity animation.

## Deliverables
- `CardController` blueprint/C++ interface
- `AuraClient.Build.cs` module rules
- Platform NFC bridges: Android `AndroidNfcBridge.java`, iOS `NFCSessionManager.swift`
- HTTP helper: `FHttpModule` request/response wrappers
- AR spawn/Trinity animation event contracts

## Platform Notes
- Android: use `AndroidNfcBridge.java` for foreground dispatch and NDEF reads
- iOS: use `NFCSessionManager.swift` with `CoreNFC`
- Both platforms should surface: `CardUid`, `SnapshotBase64`, `Checksum`

## Templates & Examples
### Migration SQL
```sql
-- Example: add state_version to battles if missing
ALTER TABLE battles ADD COLUMN IF NOT EXISTS state_version INT DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_battles_state_version ON battles(state_version);
```

### Express middleware example (auth + HMAC)
```js
const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { HMAC_MASTER_SECRET } = require('./config');

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'replace-jwt-secret');
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function verifyHmac({ payloadBase64, signature, timestamp }) {
  const expected = crypto.createHmac('sha256', HMAC_MASTER_SECRET).update(payloadBase64 + '|' + timestamp).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
```

### Battle resolver pseudocode
```text
function resolveTurn(state, action):
  validate(state, action)
  apply(state, action)
  advanceInitiative(state)
  applyStatusPhase(state)
  persist(state)
  emit events
```

### Postman collection
- Import `examples/postman_full_collection.json`
- Set `baseUrl`, `port_backend`, `port_anticheat`, `port_trinity`, `port_tournament`, `port_nfc`
- Run Health, RegisterCard, and BattleSync requests

## Notes
- Keep heavy math and authoritative logic server-side.
- Keep responses minimal and deterministic so clients can animate without recalculation.

## C++: GameClient skeleton
```cpp
// AuraGameClient.h
#pragma once
#include "CoreMinimal.h"
#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"

USTRUCT(BlueprintType)
struct FActionPayload {
  UPROPERTY(BlueprintReadWrite) FString battleId;
  UPROPERTY(BlueprintReadWrite) FString userId;
  UPROPERTY(BlueprintReadWrite) FString actor;
  UPROPERTY(BlueprintReadWrite) FString actionType;
  UPROPERTY(BlueprintReadWrite) FString target;
  UPROPERTY(BlueprintReadWrite) FString nonce;
  UPROPERTY(BlueprintReadWrite) int64 timestamp;
  UPROPERTY(BlueprintReadWrite) FString signature;
};

UCLASS()
class AURACHAMPIONS_API AUraGameClient : public AActor {
  GENERATED_BODY()
public:
  UFUNCTION(BlueprintCallable)
  void SendBattleAction(const FActionPayload& payload);
};
```

### GameClient.h (concise)
```cpp
// GameClient.h
#pragma once
#include "CoreMinimal.h"
#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"

USTRUCT(BlueprintType)
struct FActionPayload {
  UPROPERTY(BlueprintReadWrite) FString battleId;
  UPROPERTY(BlueprintReadWrite) FString actor;
  UPROPERTY(BlueprintReadWrite) FString target;
  UPROPERTY(BlueprintReadWrite) FString nonce;
  UPROPERTY(BlueprintReadWrite) int64 timestamp;
  UPROPERTY(BlueprintReadWrite) FString signature;
};

UCLASS()
class AURACHAMPIONS_API AUraGameClient : public AActor {
  GENERATED_BODY()
public:
  UFUNCTION(BlueprintCallable)
  void SendBattleAction(const FActionPayload& payload);
};
```

### FGameClient
```cpp
class FGameClient {
public:
  FGameClient(const FString& InBaseUrl, const FString& InApiKey);
  void PostJsonAsync(const FString& Route, const FString& JsonPayload, TFunction<void(FHttpResponsePtr)> Callback);
private:
  FString BaseUrl;
  FString ApiKey;
};
```

### GameClient.cpp (concise)
```cpp
void FGameClient::PostJsonAsync(const FString& Route, const FString& JsonPayload, TFunction<void(FHttpResponsePtr)> Callback) {
  TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = FHttpModule::Get().CreateRequest();
  Request->SetURL(BaseUrl + Route);
  Request->SetVerb("POST");
  Request->SetHeader("Content-Type","application/json");
  Request->SetHeader("Authorization", FString::Printf(TEXT("Bearer %s"), *ApiKey));
  Request->SetContentAsString(JsonPayload);
  Request->OnProcessRequestComplete().BindLambda([Callback](FHttpRequestPtr Req, FHttpResponsePtr Resp, bool bSuccess){
    Callback(Resp);
  });
  Request->ProcessRequest();
}
```

### CardController (concept)
Events:
- `OnSingleTap(cardUid)` → send Summon request.
- `OnDoubleTap(cardUid)` → show stats overlay (local read).
- `OnHold(cardUid)` → open upgrade UI (requires server validation).
- `OnTwoTap(cardUidA, cardUidB)` → request fusion (server-side validation).

Flow: NFC read → local minimal validation → send signed request to backend → show wait-state overlay → on success play spawn animation.

### AR & Grid mapping
- Calibrate a 2m x 2m plane; map to a 7x7 logical grid.
- Provide blueprint function `WorldToGrid(FVector WorldPos) -> GridCoord`.

### Trinity animation
- When server returns `TRINITY_ACTIVATED` event, play special VFX and lock input for animation duration.

### Desync & Wait-state UX
- When sending an action, disable input for that actor and show a subtle spinner on the actor.
- On failure, show error and offer retry.
- On desync, prompt refresh from server state.

### Optimistic UI
- Do not apply authoritative changes locally; only play predicted animation (e.g., attack windup) and apply final result when server responds.

### Timeout
- If server doesn't respond in X seconds, show "Reconnecting" and request state resync.

### Example JSON (client -> server)
```json
{
  "cardId":"UID_ABC",
  "action":"SUMMON",
  "position":{"x":2,"y":1},
  "timestamp":1680000000,
  "nonce":"n-123"
}
```

### Blueprint hooks
- `BP_CardController` exposes `OnSummonValidated(events)` to drive spawn animations.
- `BP_AR_Calibrator` exposes `StartCalibration`, `ConfirmCalibration`, `SwitchToTabletopMode`.

### Notes
- Never compute damage or resolve abilities on client.
- Keep network payloads minimal; server returns event list for client to animate.
### Request
```json
{
  "battleId":"<battle-uuid>",
  "userId":"<user-uuid>",
  "action": {
    "actor":"<card_uid>",
    "type":"ATTACK",
    "target":"<card_uid>",
    "nonce":"<nonce>",
    "timestamp": 1680000000
  },
  "signature":"<hmac>"
}
```

### Response
```json
{
  "status":"SUCCESS",
  "events":[
    {"type":"DAMAGE","target":"<card_uid>","amount":45,"newHp":135},
    {"type":"STATUS","target":"<card_uid>","effect":"Burn","duration":3}
  ],
  "stateVersion": 42
}
```

### Client Behavior
- Send signed action payload to `POST /battleSync`
- On success, animate `events` in order
- On failure, show error and offer retry
- Maintain local `stateVersion` and reconcile with server

### Wait-State UX
- Show spinner while awaiting server resolution
- Disable input during resolution
- On desync, prompt refresh from server state
