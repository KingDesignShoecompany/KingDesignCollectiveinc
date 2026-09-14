# UE 5.7 Build & First-Compile Pitfalls (auramaxxing / AuraClient)

## Engine location (local, installed build)
- Engine root: `C:/UE_5.0/Engine/UE_5.7/Engine/`  (the outer `UE_5.7` + inner `Engine`).
- Editor Base Directory seen in logs: `C:/UE_5.0/Engine/UE_5.7/Engine/Binaries/Win64/`
- Build tool: `C:/UE_5.0/Engine/UE_5.7/Engine/Binaries/DotNET/UnrealBuildTool/UnrealBuildTool.dll`
  (invoked via `Build.bat`, which runs it under bundled dotnet 8).
- Build.bat path: `C:/UE_5.0/Engine/UE_5.7/Engine/Build/BatchFiles/Build.bat`
- NOTE: an *installed* engine has **no `GenerateProjectFiles.bat`** (that's source/ZIP only).
  Do NOT try to run it — just build the target directly.

## Build recipe (avoid MSYS path-mangling)
MSYS path translation breaks `cmd.exe /c "C:\...\Build.bat ..."` calls (the `.bat` becomes
"not recognized"). Write a wrapper `.bat` with literal Windows paths and run it:

```
@echo off
set ENG=C:\UE_5.0\Engine\UE_5.7\Engine
set PROJ=C:\Users\young\agents\corporate_runtime\documents\game_design\ue5_project\auramaxxing\auramaxxing.uproject
echo BUILD_START %date% %time%
call "%ENG%\Build\BatchFiles\Build.bat" auramaxxingEditor Win64 Development -project="%PROJ%" -progress 2>&1
set RC=%errorlevel%
echo BUILD_DONE rc=%RC% %date% %time%
if %RC%==0 (echo AURA_BUILD_OK) else (echo AURA_BUILD_FAILED)
```
Run: `cmd.exe /c "C:\Users\young\AppData\Local\Temp\build_aura.bat" > C:\...\aura_build.log 2>&1`
First compile is slow (compiles the whole engine graph). Run in background + notify.
UBT log (authoritative errors): `C:/Users/young/AppData/Local/UnrealBuildTool/Log.txt`

## First-build errors that structural checks miss (real, 2026-08)
| # | Error | File | Fix |
|---|-------|------|-----|
| 1 | `error CS1503: cannot convert from 'UnrealBuildTool.ReadOnlyTargetRules' to 'UnrealBuildTool.TargetInfo'` | `Source/<Mod>/<Mod>.Target.cs` and `<Mod>Editor.Target.cs` line 7 | This installed 5.7 engine's `TargetRules` base STILL takes `TargetInfo` (older signature). The working `Stillalivetopia` project on the same engine uses `TargetInfo Target` and compiles. Change `ReadOnlyTargetRules Target` -> `TargetInfo Target`. |
| 2 | `error CS0117: 'ModuleRules.PCHUsageMode' does not contain a definition for 'UseExplicitOrSharedPCHHeaders'` | `<Plugin>/Source/<Mod>/<Mod>.Build.cs` | `UseExplicitOrSharedPCHHeaders` was renamed/removed. Use `PCHUsageMode.UseExplicitOrSharedPCHs` (trailing **s**). |

After fixing, re-run the build. The C# rules stage passes, then UBT compiles the actual C++
module graph (the real test of `AAuraGameClient` / `FAuraClientModule` / HMAC code).

## Parity note
`AuraClient.Build.cs` lives in 4 places — keep them identical:
- `corporate_runtime/.../ue5_project/auramaxxing/Plugins/AuraClient/Source/AuraClient/AuraClient.Build.cs`
- `corporate_runtime/.../ue5_project/AuraClientPlugin/Source/AuraClient/AuraClient.Build.cs` (canonical)
- `hermes_skills/aura-ue-client/plugin/Source/AuraClient/AuraClient.Build.cs`
- `corporate_runtime/.../cpp_scripts/AuraClient.Build.cs`
Target.cs files are project-specific (only in auramaxxing/Source/auramaxxing/).

## Megascans zero-copy (for reference)
`mklink /J "C:\...\auramaxxing\Content\Megascans" "D:\Users\young\Documents\Megascans Library\Downloaded\UAssets"`
Junction so the editor sees 80+ .uasset files without copying 3.6 GB. `find` won't traverse
junctions by default — use `find -L` or `ls` the subfolder to verify. See megascans-junction.md.
