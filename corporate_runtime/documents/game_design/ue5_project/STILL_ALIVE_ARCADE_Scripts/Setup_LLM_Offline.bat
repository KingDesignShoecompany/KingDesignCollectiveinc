@echo off
setlocal

echo === StillAliveArcade: UE5 Offline LLM Config ===

set "UEConfigDir=C:\Users\young\STILLALIVE ARCADE\STILL_ALIVE_ARCADE\Config"
set "DefaultEngine=%UEConfigDir%\DefaultEngine.ini"

if not exist "%UEConfigDir%" mkdir "%UEConfigDir%"

echo.
echo [URL] >> "%DefaultEngine%"
echo [/Script/Engine.GameEngine] >> "%DefaultEngine%"
echo +NetDriver=HttpNetDriver >> "%DefaultEngine%"
echo. >> "%DefaultEngine%"
echo [OnlineSubsystem] >> "%DefaultEngine%"
echo bHasVoiceEnabled=False >> "%DefaultEngine%"
echo. >> "%DefaultEngine%"
echo [HTTP] >> "%DefaultEngine%"
echo HttpRequestTimeout=60 >> "%DefaultEngine%"
echo HttpConnectionTimeout=30 >> "%DefaultEngine%"
echo HttpMaxConnectionsPerServer=8 >> "%DefaultEngine%"
echo. >> "%DefaultEngine%"
echo [ConsoleVariables] >> "%DefaultEngine%"
echo http.AllowUnverifiedSSL=1 >> "%DefaultEngine%"

echo UE5 HTTP config written to: %DefaultEngine%
echo.
echo Next steps:
echo   - Open UE5 Editor for this project
echo   - Enable: HTTP Blueprint, JSON Blueprint Utilities
echo   - Create BP_LLM_Client per Docs/BlueprintSetup_LLMClient.md
echo.
pause
