# Incorporating large Megascans / Quixel UAsset libraries into a UE project (zero-copy)

## Problem
A Megascans download folder can be 3–4 GB (dozens of `.uasset` files). Copying it into
`Content/` bloats the source tree / repo. You want the engine to *see* the assets without
duplicating them.

## Solution: Windows directory junction
Create a junction (NOT a symlink — junctions are more robust for UE Content mounts on Windows)
from `<Project>/Content/<Name>` -> the asset source folder. The engine follows it transparently.

```
<Project>/Content/Megascans  -->  D:\Users\young\Documents\Megascans Library\Downloaded\UAssets
```

## How (the working recipe)
MSYS/bash mangles `cmd /c "mklink ..."` quoting. Write a `.bat` and run it:

```bat
@echo off
mklink /J "C:\Users\young\agents\corporate_runtime\documents\game_design\ue5_project\auramaxxing\Content\Megascans" "D:\Users\young\Documents\Megascans Library\Downloaded\UAssets"
```

```bash
cmd.exe /c "C:\path\to\mklink_megascans.bat"
```

Verify the junction resolves (find does NOT traverse junctions without `-L`):
```bash
find -L auramaxxing/Content -name "*.uasset" | wc -l   # 80 in the Aura case
```

## Caveats
- The assets are from a Quixel/UE5.0 library. When a UE 5.7 project loads them the engine
  will resave them to 5.7 format on first open — expected, but untestable without the engine.
- A junction points at a fixed local path; if the source drive is unmounted the assets vanish
  from the editor (project still opens, just missing those assets).
- Junctions are NOT copied by git — they are local filesystem objects. That is the point
  (keeps the repo small). Document the junction command in the project README so it is
  reproducible on a fresh checkout.

## auramaxxing specifics
`auramaxxing/Content/Megascans` is a junction to the D: Megascans UAssets folder (80 `.uasset`
files: surfaces, 3D assets, materials). The project `.uproject` (EngineAssociation 5.7) is
re-based on the local `MyProject2` UE 5.0 project (D:\Users\young\Documents\Unreal Projects\MyProject2)
— a real, openable project (NOT a OneDrive cloud stub). Config was copied from MyProject2;
the auramaxxing module + AuraClient plugin were added on top.
