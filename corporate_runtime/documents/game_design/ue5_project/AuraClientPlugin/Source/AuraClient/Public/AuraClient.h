// AuraClient.h
// Aura Champions UE 5.7 client integration: NFC-tap -> signed request -> battleSync
// flow with server-authoritative event animation. Matches the live Aura backend
// anti-cheat contract: HMAC-SHA256 over base64(JSON body) + "|" + timestamp.

#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "AuraClient.generated.h"

// One battle action sent to POST /battleSync.
USTRUCT(BlueprintType)
struct FAuraActionPayload
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite) FString BattleId;
    UPROPERTY(BlueprintReadWrite) FString UserId;
    UPROPERTY(BlueprintReadWrite) FString Actor;     // card_uid performing the action
    UPROPERTY(BlueprintReadWrite) FString ActionType; // ATTACK / SUMMON / FUSE / MOVE
    UPROPERTY(BlueprintReadWrite) FString Target;    // card_uid target ("" if self)
    UPROPERTY(BlueprintReadWrite) FString Nonce;     // single-use nonce from /issueNonce
    UPROPERTY(BlueprintReadWrite) int64  StateVersion = 0;
    UPROPERTY(BlueprintReadWrite) FString Signature; // HMAC-SHA256, server-validated
};

// A single server-returned event the client animates (no client-side resolution).
USTRUCT(BlueprintType)
struct FAuraBattleEvent
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite) FString Type;       // DAMAGE / STATUS / TRINITY_ACTIVATED / SUMMON
    UPROPERTY(BlueprintReadWrite) FString Target;
    UPROPERTY(BlueprintReadWrite) int32 Amount = 0;
    UPROPERTY(BlueprintReadWrite) FString Effect;     // Burn / Freeze / ...
    UPROPERTY(BlueprintReadWrite) int32 Duration = 0;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnBattleSynced, const TArray<FAuraBattleEvent>&, Events);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnTrinityActivated, const TArray<FAuraBattleEvent>&, Events);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnBattleError, int32, HttpStatus, const FString&, Message);

UCLASS()
class AURACLIENT_API AAuraGameClient : public AActor
{
    GENERATED_BODY()

public:
    AAuraGameClient();

    // Base URL of the Aura backend (e.g. http://localhost:3100). Set before use.
    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "Aura")
    FString BaseUrl = TEXT("http://localhost:3100");

    // Shared HMAC secret (HMAC_MASTER_SECRET). In production, derive per-session.
    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "Aura")
    FString HmacSecret = TEXT("replace-with-strong-secret");

    // --- Card controller tap contracts (driven by NFC bridge) ---
    UFUNCTION(BlueprintCallable, Category = "Aura|Card")
    void OnSingleTap(const FString& CardUid);   // -> SUMMON request

    UFUNCTION(BlueprintCallable, Category = "Aura|Card")
    void OnDoubleTap(const FString& CardUid);   // -> local stats overlay

    UFUNCTION(BlueprintCallable, Category = "Aura|Card")
    void OnHold(const FString& CardUid);        // -> server-validated upgrade UI

    UFUNCTION(BlueprintCallable, Category = "Aura|Card")
    void OnTwoTap(const FString& CardUidA, const FString& CardUidB); // -> FUSE request

    // Full battle action path: obtain nonce, then battleSync with HMAC signature.
    UFUNCTION(BlueprintCallable, Category = "Aura|Battle")
    void SendBattleAction(const FAuraActionPayload& Payload);

    // AR calibration: map world position to 7x7 logical grid coord.
    UFUNCTION(BlueprintCallable, Category = "Aura|AR")
    FIntPoint WorldToGrid(const FVector& WorldPos, float PlaneSize = 200.f);

    // --- Events the Blueprint/animation layer subscribes to ---
    UPROPERTY(BlueprintAssignable, Category = "Aura")
    FOnBattleSynced OnBattleSynced;

    UPROPERTY(BlueprintAssignable, Category = "Aura")
    FOnTrinityActivated OnTrinityActivated;

    UPROPERTY(BlueprintAssignable, Category = "Aura")
    FOnBattleError OnBattleError;

private:
    // Issue a single-use nonce from the anti-cheat service (port 3101).
    void RequestNonce(const FAuraActionPayload& Payload, const FString& UserId);

    // Sign a JSON body per the backend contract and attach HMAC headers.
    void SignAndPost(const FString& Route, const FString& JsonBody,
                     const TFunction<void(bool, const FString&)>& OnDone);

    static FString ComputeHmac(const FString& Data, const FString& Secret);
};

// Plugin module entry point. Required so UE loads the AuraClient module and
// exposes FAuraClientModule::IsAvailable() to dependent modules (e.g. auramaxxing).
class FAuraClientModule : public IModuleInterface
{
public:
    virtual void StartupModule() override;
    virtual void ShutdownModule() override;
};
