# StillAliveArcade — Offline LLM Architecture
## 1. Conceptual Overview
- LLM Backend: Ollama or LM Studio on localhost:11434
- Request: UE5 sends JSON prompt + params
- Response: JSON response back to UE5
## 2. Plugins
Enable inside UE5 Editor:
- HTTP Blueprint
- JSON Blueprint Utilities
## 3. UE5 Actor Blueprint: BP_LLM_Client
Variables:
- EndpointURL (String): `http://localhost:11434/api/generate`
- ModelName (String): `llama3`
- PromptInput (String)
## 4. Graph Recipe
- Make JSON Object
- Set `model`, `prompt`, `stream=false`
- Make HTTP Request -> On Completed
- Break JSON -> Get `response` field
## 5. Performance
- Always async: show “thinking” UI
- Parse JSON on completed path only
- Timeout: raise in Project Settings > HTTP if needed
