# auramaxxing — UE 5.7 project scaffold (AuraClient plugin enabled)

Reference tree for a functioning UE 5.7 game project that integrates the AuraClient
plugin. Built from the local `Stillalivetopia` template (OneDrive `MyProject5` was an
un-readable cloud stub — see SKILL.md "OneDrive cloud stubs" pitfall).

## File tree
```
auramaxxing/
  auramaxxing.uproject
  Config/                         (copied from Stillalivetopia_Config/)
    DefaultEngine.ini, DefaultGame.ini, DefaultInput.ini, DefaultEditor.ini, ...
  Plugins/
    AuraClient/
      AuraClient.uplugin          (Modules: [{Name:"AuraClient", Type:"Runtime", LoadingPhase:"Default"}])
      Source/AuraClient/
        Public/AuraClient.h       (AAuraGameClient actor + FAuraClientModule class)
        Private/AuraClient.cpp    (actor impl + module Startup/Shutdown + IMPLEMENT_MODULE)
        AuraClient.Build.cs       (deps: Core, CoreUObject, Engine, HTTP, JsonUtilities; NO Crypto)
  Source/auramaxxing/
    auramaxxing.Target.cs         (TargetType.Game; ExtraModuleNames.Add("auramaxxing"))
    auramaxxingEditor.Target.cs   (TargetType.Editor)
    auramaxxing.Build.cs          (deps include "AuraClient")
    auramaxxing.h                 (FauramaxxingModule : IModuleInterface)
    auramaxxing.cpp               (IMPLEMENT_PRIMARY_GAME_MODULE; calls FAuraClientModule::IsAvailable())
```

## Key invariants (if any break, the project won't build/load)
1. `.uplugin` MUST declare `"Modules":[{"Name":"AuraClient",...}]` — matches Build.cs dep name.
2. Plugin `.cpp` MUST have `IMPLEMENT_MODULE(FAuraClientModule, AuraClient)` or the plugin is
   unloadable and dependents calling `FAuraClientModule::IsAvailable()` fail to compile.
3. `.uproject` enables the plugin by `FriendlyName` ("AuraClient") and declares the game module.
4. Game `Build.cs` adds "AuraClient" to `PublicDependencyModuleNames`.
5. `DefaultBuildSettings = BuildSettingsVersion.V6;` + `IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_7;`
   (UE 5.7 style — the older `TargetInfo Target` ctor is pre-5.7 and will not build on 5.7).

## Caution on .Target.cs constructor (ENGINE-SPECIFIC — read before copying)
On THIS installed engine (C:/UE_5.0/Engine/UE_5.7, build 5.7.3-50162420), the `TargetRules`
base ctor still takes `TargetInfo` (older UE5.0-style), so you MUST use
`public XxxTarget(TargetInfo Target) : base(Target)`. Using `ReadOnlyTargetRules` → CS1503
"cannot convert from ReadOnlyTargetRules to TargetInfo" (this was the #1 first-build error).
NOTE: this contradicts what generic UE 5.1+ docs say (they use `ReadOnlyTargetRules`), but the
installed binary is what matters. If you ever build against a different 5.7 install that uses
`ReadOnlyTargetRules`, flip it back. Always confirm against a known-working project on the same
engine (here: `Stillalivetopia`).

## Verification
- `json.load` both .uproject and .uplugin; confirm EngineAssociation=="5.7", plugin enabled,
  module declared, plugin module Name matches Build.cs dep.
- Bracket/paren balance across all .cs/.cpp/.h.
- Grep: `IMPLEMENT_MODULE(FAuraClientModule, AuraClient)` present; `class FAuraClientModule`
  declared; `FAuraClientModule::IsAvailable()` resolves (module implemented).
- Protocol correctness: replicate HMAC in Python vs live backend (see ue-client-hmac-contract.md).
- REAL GATE: run a UBT build against the installed engine
  (`<ENG>\Engine\Build\BatchFiles\Build.bat auramaxxingEditor Win64 Development -project=...`).
  See `references/ue5-build.md` and `references/ue5-build-errors.md`. Structural checks alone
  miss the four first-build compile errors (TargetInfo, UseExplicitOrSharedPCHs, HTTP case,
  Crypto module absence).
