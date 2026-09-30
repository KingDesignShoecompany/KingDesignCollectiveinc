// AuraClient.cpp
#include "AuraClient.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "Serialization/JsonTypes.h"
#include "Misc/Base64.h"
#include "Modules/ModuleManager.h"

DEFINE_LOG_CATEGORY_STATIC(LogAuraClient, Log, All);

void FAuraClientModule::StartupModule()
{
    UE_LOG(LogAuraClient, Log, TEXT("AuraClient module started."));
}

void FAuraClientModule::ShutdownModule()
{
    UE_LOG(LogAuraClient, Log, TEXT("AuraClient module shut down."));
}

IMPLEMENT_MODULE(FAuraClientModule, AuraClient)

AAuraGameClient::AAuraGameClient()
{
    PrimaryActorTick.bCanEverTick = false;
}

// ---------------------------------------------------------------------------
// Self-contained SHA-256 (RFC 6234) + HMAC-SHA256 (RFC 2104).
// Pure C++, no engine Crypto module / FSHA256 dependency (this engine ships only FSHA1).
// ---------------------------------------------------------------------------
namespace AuraHash
{
    static uint32 ROR(uint32 V, int N) { return (V >> N) | (V << (32 - N)); }
    static uint32 ROL(uint32 V, int N) { return (V << N) | (V >> (32 - N)); }
    static const uint32 K[64] = {
        0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
        0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
        0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
        0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
        0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
        0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
        0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
        0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2 };

    static void SHA256(const uint8* Data, int32 Len, uint8 Out[32])
    {
        uint32 H[8] = {0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19};
        // padded length = Len + 1 (0x80) + pad + 8-byte length, multiple of 64
        int32 Total = ((Len + 8) / 64 + 1) * 64;
        TArray<uint8> Buf; Buf.SetNumUninitialized(Total);
        FMemory::Memzero(Buf.GetData(), Total);
        FMemory::Memcpy(Buf.GetData(), Data, Len);
        Buf[Len] = 0x80;
        uint64 BitLen = (uint64)Len * 8;
        for (int32 i = 0; i < 8; ++i)
            Buf[Total - 1 - i] = (uint8)(BitLen >> (8 * i));

        for (int32 Off = 0; Off < Total; Off += 64)
        {
            uint32 W[64];
            for (int32 i = 0; i < 16; ++i)
            {
                W[i] = ((uint32)Buf[Off + i*4] << 24) | ((uint32)Buf[Off + i*4+1] << 16) |
                       ((uint32)Buf[Off + i*4+2] << 8) | (uint32)Buf[Off + i*4+3];
            }
            for (int32 i = 16; i < 64; ++i)
            {
                uint32 s0 = ROR(W[i-15],7) ^ ROR(W[i-15],18) ^ (W[i-15] >> 3);
                uint32 s1 = ROR(W[i-2],17) ^ ROR(W[i-2],19) ^ (W[i-2] >> 10);
                W[i] = W[i-16] + s0 + W[i-7] + s1;
            }
            uint32 a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
            for (int32 i = 0; i < 64; ++i)
            {
                uint32 S1 = ROR(e,6) ^ ROR(e,11) ^ ROR(e,25);
                uint32 ch = (e & f) ^ ((~e) & g);
                uint32 t1 = h + S1 + ch + K[i] + W[i];
                uint32 S0 = ROR(a,2) ^ ROR(a,13) ^ ROR(a,22);
                uint32 maj = (a & b) ^ (a & c) ^ (b & c);
                uint32 t2 = S0 + maj;
                h=g; g=f; f=e; e=d + t1; d=c; c=b; b=a; a=t1 + t2;
            }
            H[0]+=a; H[1]+=b; H[2]+=c; H[3]+=d; H[4]+=e; H[5]+=f; H[6]+=g; H[7]+=h;
        }
        for (int32 i = 0; i < 8; ++i)
        {
            Out[i*4]   = (uint8)(H[i] >> 24);
            Out[i*4+1] = (uint8)(H[i] >> 16);
            Out[i*4+2] = (uint8)(H[i] >> 8);
            Out[i*4+3] = (uint8)(H[i]);
        }
    }
}

FString AAuraGameClient::ComputeHmac(const FString& Data, const FString& Secret)
{
    // HMAC-SHA256 (RFC 2104) over the UTF-8 body, hex-encoded. Matches backend hmacAuth.js.
    const int32 Bsz = 64; // SHA-256 block size
    TArray<uint8> Key;
    {
        FTCHARToUTF8 S(*Secret);
        Key.Append((const uint8*)S.Get(), S.Length());
    }
    if (Key.Num() > Bsz)
    {
        uint8 Hash[32];
        AuraHash::SHA256(Key.GetData(), Key.Num(), Hash);
        Key.Reset(); Key.Append(Hash, 32);
    }
    TArray<uint8> Kpad; Kpad.SetNumUninitialized(Bsz);
    FMemory::Memset(Kpad.GetData(), 0x36, Bsz);
    for (int32 i = 0; i < Key.Num(); ++i) Kpad[i] = (uint8)(Kpad[i] ^ Key[i]);

    TArray<uint8> Inner; Inner.Append(Kpad);
    {
        FTCHARToUTF8 D(*Data);
        Inner.Append((const uint8*)D.Get(), D.Length());
    }
    uint8 H1[32];
    AuraHash::SHA256(Inner.GetData(), Inner.Num(), H1);

    TArray<uint8> Opad; Opad.SetNumUninitialized(Bsz);
    FMemory::Memset(Opad.GetData(), 0x5c, Bsz);
    for (int32 i = 0; i < Key.Num(); ++i) Opad[i] = (uint8)(Opad[i] ^ Key[i]);

    TArray<uint8> Outer; Outer.Append(Opad); Outer.Append(H1, 32);
    uint8 H2[32];
    AuraHash::SHA256(Outer.GetData(), Outer.Num(), H2);

    FString Hex;
    for (uint8 B : H2) Hex += FString::Printf(TEXT("%02x"), B);
    return Hex;
}

void AAuraGameClient::SignAndPost(const FString& Route, const FString& JsonBody,
                                  const TFunction<void(bool, const FString&)>& OnDone)
{
    const int64 Ts = FDateTime::Now().ToUnixTimestamp();
    const FString Signed = JsonBody + TEXT("|") + FString::FromInt(Ts);
    const FString Sig = ComputeHmac(Signed, HmacSecret);

    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Req = FHttpModule::Get().CreateRequest();
    Req->SetURL(BaseUrl + Route);
    Req->SetVerb(TEXT("POST"));
    Req->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    Req->SetHeader(TEXT("x-timestamp"), FString::FromInt(Ts));
    Req->SetHeader(TEXT("x-signature"), Sig);
    Req->SetContentAsString(JsonBody);

    Req->OnProcessRequestComplete().BindLambda(
        [OnDone](FHttpRequestPtr, FHttpResponsePtr Resp, bool bSuccess)
        {
            if (!bSuccess || !Resp.IsValid())
            {
                OnDone(false, TEXT("Network error"));
                return;
            }
            OnDone(Resp->GetResponseCode() < 400, Resp->GetContentAsString());
        });
    Req->ProcessRequest();
}

// ---------------------------------------------------------------------------
// Card controller tap contracts
// ---------------------------------------------------------------------------
void AAuraGameClient::OnSingleTap(const FString& CardUid)
{
    UE_LOG(LogAuraClient, Log, TEXT("OnSingleTap: %s -> SUMMON"), *CardUid);
    // Build a SUMMON action; real BattleId/UserId supplied by game session.
    FAuraActionPayload P;
    P.Actor = CardUid;
    P.ActionType = TEXT("SUMMON");
    SendBattleAction(P);
}

void AAuraGameClient::OnDoubleTap(const FString& CardUid)
{
    UE_LOG(LogAuraClient, Log, TEXT("OnDoubleTap: %s -> stats overlay (local)"), *CardUid);
    // Local-only read; no server call.
}

void AAuraGameClient::OnHold(const FString& CardUid)
{
    UE_LOG(LogAuraClient, Log, TEXT("OnHold: %s -> upgrade UI (server-validated)"), *CardUid);
}

void AAuraGameClient::OnTwoTap(const FString& CardUidA, const FString& CardUidB)
{
    UE_LOG(LogAuraClient, Log, TEXT("OnTwoTap: %s + %s -> FUSE"), *CardUidA, *CardUidB);
    FAuraActionPayload P;
    P.Actor = CardUidA;
    P.Target = CardUidB;
    P.ActionType = TEXT("FUSE");
    SendBattleAction(P);
}

// ---------------------------------------------------------------------------
// Battle action path: issueNonce -> battleSync (signed)
// ---------------------------------------------------------------------------
void AAuraGameClient::SendBattleAction(const FAuraActionPayload& Payload)
{
    if (Payload.BattleId.IsEmpty() || Payload.UserId.IsEmpty())
    {
        OnBattleError.Broadcast(400, TEXT("BattleId/UserId required"));
        return;
    }
    RequestNonce(Payload, Payload.UserId);
}

void AAuraGameClient::RequestNonce(const FAuraActionPayload& Payload, const FString& UserId)
{
    // POST /issueNonce to anti-cheat (port 3101). Use the configured BaseUrl host.
    TSharedRef<FJsonObject> Obj = MakeShared<FJsonObject>();
    Obj->SetStringField(TEXT("battleId"), Payload.BattleId);
    FString Body;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&Body);
    FJsonSerializer::Serialize(Obj, Writer);

    // Temporarily point at anti-cheat port for nonce issuance.
    const FString SavedBase = BaseUrl;
    BaseUrl = BaseUrl.Replace(TEXT(":3100"), TEXT(":3101"));

    SignAndPost(TEXT("/issueNonce"), Body, [this, Payload, SavedBase](bool bOk, const FString& Resp)
    {
        BaseUrl = SavedBase; // restore backend base
        if (!bOk)
        {
            OnBattleError.Broadcast(401, Resp);
            return;
        }
        TSharedPtr<FJsonObject> Json;
        TSharedRef<TJsonReader<>> R = TJsonReaderFactory<>::Create(Resp);
        if (!FJsonSerializer::Deserialize(R, Json) || !Json.IsValid())
        {
            OnBattleError.Broadcast(500, TEXT("Bad nonce response"));
            return;
        }
        const FString Nonce = Json->GetStringField(TEXT("nonce"));

        // Build battleSync body and sign it.
        TSharedRef<FJsonObject> Sync = MakeShared<FJsonObject>();
        Sync->SetStringField(TEXT("battleId"), Payload.BattleId);
        Sync->SetStringField(TEXT("userId"), Payload.UserId);
        Sync->SetStringField(TEXT("action"), Payload.ActionType);
        Sync->SetStringField(TEXT("nonce"), Nonce);
        Sync->SetNumberField(TEXT("stateVersion"), Payload.StateVersion);
        FString SyncBody;
        TSharedRef<TJsonWriter<>> W = TJsonWriterFactory<>::Create(&SyncBody);
        FJsonSerializer::Serialize(Sync, W);

        SignAndPost(TEXT("/battleSync"), SyncBody, [this](bool bOk2, const FString& Resp2)
        {
            if (!bOk2)
            {
                OnBattleError.Broadcast(403, Resp2);
                return;
            }
            TSharedPtr<FJsonObject> R2;
            TSharedRef<TJsonReader<>> Rr = TJsonReaderFactory<>::Create(Resp2);
            if (!FJsonSerializer::Deserialize(Rr, R2) || !R2.IsValid())
            {
                OnBattleError.Broadcast(500, TEXT("Bad battleSync response"));
                return;
            }
            // Parse server-returned events for client animation.
            TArray<FAuraBattleEvent> Events;
            const TArray<TSharedPtr<FJsonValue>>* Arr = nullptr;
            if (R2->TryGetArrayField(TEXT("events"), Arr))
            {
                for (const TSharedPtr<FJsonValue>& V : *Arr)
                {
                    const TSharedPtr<FJsonObject>* E = nullptr;
                    if (V->TryGetObject(E))
                    {
                        FAuraBattleEvent Ev;
                        Ev.Type = (*E)->GetStringField(TEXT("type"));
                        Ev.Target = (*E)->GetStringField(TEXT("target"));
                        Ev.Amount = (int32)(*E)->GetNumberField(TEXT("amount"));
                        Ev.Effect = (*E)->GetStringField(TEXT("effect"));
                        Ev.Duration = (int32)(*E)->GetNumberField(TEXT("duration"));
                        Events.Add(Ev);
                    }
                }
            }
            OnBattleSynced.Broadcast(Events);
            // Trinity activation is a special event the animation layer locks input for.
            for (const FAuraBattleEvent& E : Events)
            {
                if (E.Type == TEXT("TRINITY_ACTIVATED"))
                {
                    OnTrinityActivated.Broadcast(Events);
                    break;
                }
            }
        });
    });
}

// ---------------------------------------------------------------------------
// AR calibration helper
// ---------------------------------------------------------------------------
FIntPoint AAuraGameClient::WorldToGrid(const FVector& WorldPos, float PlaneSize)
{
    const float Half = PlaneSize * 0.5f;
    const int32 X = FMath::Clamp((int32)(((WorldPos.X + Half) / PlaneSize) * 7.f), 0, 6);
    const int32 Y = FMath::Clamp((int32)(((WorldPos.Y + Half) / PlaneSize) * 7.f), 0, 6);
    return FIntPoint(X, Y);
}
