# UE 5.7 Installed-Engine First-Build Errors (auramaxxing, 2026-08)

These were all surfaced by the FIRST real `Build.bat` compile of the auramaxxing project
against the installed engine at `C:/UE_5.0/Engine/UE_5.7/Engine/`. Structural checks
(JSON validity, bracket balance, module-class presence) did NOT catch any of them.

## Error -> Fix table

| # | Build error (UBT) | Root cause | Fix |
|---|---|---|---|
| 1 | `auramaxxing.Target.cs(7,68): error CS1503: cannot convert from 'ReadOnlyTargetRules' to 'TargetInfo'` | This installed 5.7 `TargetRules` base ctor still takes `TargetInfo` (older UE5.0-style), even though 5.1+ generally uses `ReadOnlyTargetRules`. Confirmed by the working `Stillalivetopia` project on the same engine. | Change ctor to `public auramaxxingTarget(TargetInfo Target) : base(Target)` (both Game + Editor targets). |
| 2 | `AuraClient.Build.cs(8,33): error CS0117: 'ModuleRules.PCHUsageMode' does not contain a definition for 'UseExplicitOrSharedPCHHeaders'` | Enum value renamed in 5.7. | Use `PCHUsageMode.UseExplicitOrSharedPCHs` (trailing `s`). |
| 3 | `Module 'Http' has incorrect text case. Did you mean 'HTTP'?` | Module name case-sensitive; engine module is `HTTP`. | `"HTTP"` (uppercase) in `PublicDependencyModuleNames`. |
| 4 | `Could not find definition for module 'Crypto'` | This installed engine has NO `Crypto` module (no `Crypto.Build.cs`, no `Crypto.h` anywhere in Source). `FHMAC`/`FEncryption` are also NOT publicly exposed. | Remove `"Crypto"` from deps; remove `#include "Crypto/Crypto.h"`. Implement HMAC per #6 below. |
| 5 | `auramaxxing.cpp(14,2): error C2039: 'IsAvailable': is not a member of 'FAuraClientModule'` + `error C3861: 'IsAvailable': identifier not found` | `IModuleInterface` has NO static `IsAvailable()`. The plugin module class exists, but the game module called `FAuraClientModule::IsAvailable()`. | Use `FModuleManager::Get().IsModuleLoaded(TEXT("AuraClient"))` (returns bool). Never call `FAuraClientModule::IsAvailable()`. |
| 6 | `AuraClient.cpp(45): error C2653: 'FSHA256': is not a class or namespace name` (x3) | **This engine has NO `FSHA256` class.** `Misc/SecureHash.h` ships only `FSHA1` (SHA1, 20-byte), no SHA256 and no SHA256 HMAC. | Implement SHA-256 yourself (portable, zero module dep) — see snippet below. Do NOT use `FSHA256` or `FSHA1::HMACBuffer` (that's SHA1, wrong digest). |

General rule: match engine module names EXACTLY (case-sensitive): `Core`, `CoreUObject`,
`Engine`, `HTTP`, `Json`, `JsonUtilities`. `Projects` is a common private dep.

## Portable HMAC-SHA256 (NO FSHA256 / NO Crypto module)

Drop-in replacement for `FHMAC`/`Crypto/Crypto.h`. Self-contained RFC 6234 SHA-256 +
RFC 2104 HMAC, pure C++, only `CoreMinimal.h` (`FMemory`, `FTCHARToUTF8`, `TArray`) needed.
Block size 64, output 32 bytes — matches the backend `hmacAuth.js` contract
(`HMAC-SHA256( base64(JSON body) + "|" + timestamp )`, hex-encoded).

```cpp
// Self-contained SHA-256 (RFC 6234) + HMAC-SHA256 (RFC 2104).
namespace AuraHash
{
    static uint32 ROR(uint32 V, int N) { return (V >> N) | (V << (32 - N)); }
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
        int32 Total = ((Len + 8) / 64 + 1) * 64;
        TArray<uint8> Buf; Buf.SetNumUninitialized(Total);
        FMemory::Memzero(Buf.GetData(), Total);
        FMemory::Memcpy(Buf.GetData(), Data, Len);
        Buf[Len] = 0x80;
        uint64 BitLen = (uint64)Len * 8;
        for (int32 i = 0; i < 8; ++i) Buf[Total - 1 - i] = (uint8)(BitLen >> (8 * i));
        for (int32 Off = 0; Off < Total; Off += 64)
        {
            uint32 W[64];
            for (int32 i = 0; i < 16; ++i)
                W[i] = ((uint32)Buf[Off+i*4]<<24)|((uint32)Buf[Off+i*4+1]<<16)|((uint32)Buf[Off+i*4+2]<<8)|(uint32)Buf[Off+i*4+3];
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
                h=g; g=f; f=e; e=d+t1; d=c; c=b; b=a; a=t1+t2;
            }
            H[0]+=a; H[1]+=b; H[2]+=c; H[3]+=d; H[4]+=e; H[5]+=f; H[6]+=g; H[7]+=h;
        }
        for (int32 i = 0; i < 8; ++i)
        { Out[i*4]= (uint8)(H[i]>>24); Out[i*4+1]=(uint8)(H[i]>>16); Out[i*4+2]=(uint8)(H[i]>>8); Out[i*4+3]=(uint8)(H[i]); }
    }
}

FString AAuraGameClient::ComputeHmac(const FString& Data, const FString& Secret)
{
    const int32 Bsz = 64; // SHA-256 block size
    TArray<uint8> Key;
    { FTCHARToUTF8 S(*Secret); Key.Append((const uint8*)S.Get(), S.Length()); }
    if (Key.Num() > Bsz)
    { uint8 Hash[32]; AuraHash::SHA256(Key.GetData(), Key.Num(), Hash); Key.Reset(); Key.Append(Hash, 32); }
    TArray<uint8> Kpad; Kpad.SetNumUninitialized(Bsz); FMemory::Memset(Kpad.GetData(), 0x36, Bsz);
    for (int32 i = 0; i < Key.Num(); ++i) Kpad[i] = (uint8)(Kpad[i] ^ Key[i]);
    TArray<uint8> Inner; Inner.Append(Kpad);
    { FTCHARToUTF8 D(*Data); Inner.Append((const uint8*)D.Get(), D.Length()); }
    uint8 H1[32]; AuraHash::SHA256(Inner.GetData(), Inner.Num(), H1);
    TArray<uint8> Opad; Opad.SetNumUninitialized(Bsz); FMemory::Memset(Opad.GetData(), 0x5c, Bsz);
    for (int32 i = 0; i < Key.Num(); ++i) Opad[i] = (uint8)(Opad[i] ^ Key[i]);
    TArray<uint8> Outer; Outer.Append(Opad); Outer.Append(H1, 32);
    uint8 H2[32]; AuraHash::SHA256(Outer.GetData(), Outer.Num(), H2);
    FString Hex; for (uint8 B : H2) Hex += FString::Printf(TEXT("%02x"), B);
    return Hex;
}
```

## Build invocation (installed engine, no GenerateProjectFiles.bat)

`GenerateProjectFiles.bat` does NOT exist in an installed build (source/ZIP only). Build directly:

```
"<ENG>\Engine\Build\BatchFiles\Build.bat" <Target> Win64 Development -project="<proj>.uproject" -NoLiveCoding -progress
```

`<ENG> = C:\UE_5.0\Engine\UE_5.7\Engine`. MSYS path quoting mangles `cmd.exe /c` calls — write a
`.bat` wrapper with real Windows paths and run `cmd.exe /c "C:\path\to\wrapper.bat"`.
If UBT complains about a stale rules DLL, delete `<Proj>/Intermediate/Build` and rebuild.
Add `-NoLiveCoding` so a separate running editor (different project) can't hold the build lock.
