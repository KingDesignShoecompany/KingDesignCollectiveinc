#!/usr/bin/env python3
"""
Ollama to OpenAI-compatible API proxy
Converts OpenAI API calls to Ollama format
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
import json
import logging
from typing import Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
DEFAULT_MODEL = os.getenv("OLLAMA_MODEL", "phi")

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok"}

@app.post("/chat")
async def chat_passthrough(request: Request):
    """Passthrough /chat to the internal agent API"""
    body = await request.json()
    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(
            "http://api:8001/chat",
            json=body,
        )
        return JSONResponse(
            status_code=response.status_code,
            content=response.json(),
            headers={"content-type": "application/json"},
        )


@app.post("/chat")
async def chat_completions(request: Request):
    """OpenAI-compatible chat completions endpoint"""
    try:
        body = await request.json()
        logger.info(f"Request body: {body}")
        
        model = body.get("model", DEFAULT_MODEL)
        messages = body.get("messages", [])
        stream = body.get("stream", False)
        temperature = body.get("temperature", 0.7)
        max_tokens = body.get("max_tokens", 4096)
        
        logger.info(f"Model: {model}, Streaming: {stream}, Messages: {len(messages)}")
        
        # Convert messages to Ollama format
        ollama_payload = {
            "model": model,
            "messages": messages,
            "stream": stream,
            "temperature": temperature,
            "options": {"num_predict": max_tokens},
        }
        
        async with httpx.AsyncClient(timeout=600.0) as client:
            if stream:
                # Streaming response
                async def generate():
                    try:
                        async with client.stream(
                            "POST",
                            f"{OLLAMA_BASE_URL}/api/generate",
                            json=ollama_payload
                        ) as response:
                            logger.info(f"Ollama response status: {response.status_code}")
                            if response.status_code != 200:
                                yield json.dumps({
                                    "error": f"Ollama API error: {response.status_code}"
                                })
                                return
                            
                            async for line in response.aiter_lines():
                                if line:
                                    data = json.loads(line)
                                    chunk = {
                                        "id": "chatcmpl-1",
                                        "object": "chat.completion.chunk",
                                        "created": 0,
                                        "model": model,
                                        "choices": [{
                                            "index": 0,
                                            "delta": {
                                                "content": data.get("message", {}).get("content", data.get("response", ""))
                                            },
                                            "finish_reason": "stop" if data.get("done") else None
                                        }]
                                    }
                                    yield f"data: {json.dumps(chunk)}\n\n"
                    except Exception as e:
                        logger.error(f"Streaming error: {e}")
                        yield f"data: {json.dumps({'error': str(e)})}\n\n"
                
                return StreamingResponse(generate(), media_type="text/event-stream")
            else:
                # Non-streaming response
                logger.info(f"Calling Ollama at {OLLAMA_BASE_URL}/api/generate")
                response = await client.post(
                    f"{OLLAMA_BASE_URL}/api/generate",
                    json=ollama_payload,
                )

                logger.info(f"Ollama response status: {response.status_code}")

                if response.status_code != 200:
                    logger.error(f"Ollama error: {response.text}")
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Ollama API error: {response.text}",
                    )

                data = response.json()
                logger.info(f"Ollama response: {str(data)[:100]}...")

                return {
                    "id": "chatcmpl-1",
                    "object": "chat.completion",
                    "created": 0,
                    "model": model,
                    "choices": [{
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": data.get("response", "")
                        },
                        "finish_reason": "stop"
                    }],
                    "usage": {
                        "prompt_tokens": 0,
                        "completion_tokens": 0,
                        "total_tokens": 0
                    }
                }
    
    except Exception as e:
        logger.exception(f"Error in chat_completions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/models")
async def list_models():
    """List available models"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{OLLAMA_BASE_URL}/api/tags"
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Could not fetch models from Ollama"
                )
            
            data = response.json()
            models = []
            for model in data.get("models", []):
                models.append({
                    "id": model.get("name", "unknown"),
                    "object": "model",
                    "created": 0,
                    "owned_by": "ollama"
                })
            
            return {"object": "list", "data": models}
    
    except Exception as e:
        logger.exception(f"Error in list_models: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
