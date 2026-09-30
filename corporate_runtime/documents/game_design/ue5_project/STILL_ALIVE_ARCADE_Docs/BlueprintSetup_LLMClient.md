# Blueprint Setup: LLM Client

1. Create Blueprint Actor: `BP_LLM_Client`
2. Add Variables
   - EndpointURL (String) = `http://localhost:11434/api/generate`
   - ModelName (String) = `llama3`
   - PromptInput (String)
3. Function `BuildLLMPayload`
   - Input: Prompt (String)
   - Body:
     - Create JSON Object
     - Set String Field `model` = ModelName
     - Set String Field `prompt` = Prompt
     - Set Boolean Field `stream` = false
     - Return JSON Object
4. Event `SendPromptToAI`
   - Input: Prompt
   - Call `BuildLLMPayload`
   - Stringify JSON
   - Make HTTP Request: POST, URL=EndpointURL, Content=Stringified JSON
   - On Completed:
     - Get Content as String
     - Load JSON from String
     - Get String Field `response`
     - Print String / dispatch game event

Notes:
- HTTP plugin must be enabled in Edit > Plugins.
- If requests drop early, increase timeout in Project Settings.
