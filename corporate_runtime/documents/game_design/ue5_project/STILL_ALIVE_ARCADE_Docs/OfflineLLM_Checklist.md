# Offline LLM Setup Checklist - StillAliveArcade

## Prereqs
- Windows 10/11
- UE5 installed
- Ollama installer downloaded or present

## Steps
1. Install Ollama
   - Run `Scripts/Setup_Ollama_Local.ps1`
2. Pull Model
   - `ollama pull llama3`
3. Enable UE5 Plugins
   - HTTP Blueprint
   - JSON Blueprint Utilities
4. Configure UE5
   - Run `Scripts/Setup_LLM_Offline.bat`
5. Create Blueprint
   - Follow `BlueprintSetup_LLMClient.md`
6. Test
   - Place `BP_LLM_Client`
   - Trigger `SendPromptToAI` from level
   - Verify text appears

## Troubleshooting
- Port conflict? Check `netstat -ano | findstr 11434`
- Plugin missing? Verify `DefaultEngine.ini` after script
- JSON parse error? Log full response string first
