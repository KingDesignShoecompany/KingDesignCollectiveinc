#!/usr/bin/env python3
"""
FastAPI web server for local multi-agent system
Provides REST API for agent interactions with Ollama
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import logging
from typing import Optional
import httpx
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Local Multi-Agent API", version="1.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
model_name = os.getenv("OLLAMA_MODEL", "phi")

logger.info(f"Initializing agent with Ollama at {ollama_base_url}, model: {model_name}")

# Request/Response models
class QueryRequest(BaseModel):
    message: str
    max_tokens: int = 512

class QueryResponse(BaseModel):
    message: str
    response: str
    model: str
    tokens_used: int = 0

# Routes
@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok", "model": model_name, "ollama_url": ollama_base_url}

@app.get("/info")
async def info():
    """Get system information"""
    return {
        "model": model_name,
        "ollama_url": ollama_base_url,
        "status": "ready"
    }

@app.post("/chat")
async def chat(request: QueryRequest):
    """Chat with the agent (direct Ollama call)"""
    try:
        logger.info(f"Processing query: {request.message[:50]}...")
        
        # Call Ollama directly
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{ollama_base_url}/api/generate",
                json={
                    "model": model_name,
                    "prompt": request.message,
                    "stream": False,
                    "temperature": 0.7,
                    "num_predict": request.max_tokens
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Ollama error: {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Ollama error: {response.text}"
                )
            
            result = response.json()
            response_text = result.get("response", "No response generated")
            
            logger.info(f"Response generated: {response_text[:50]}...")
            
            return QueryResponse(
                message=request.message,
                response=response_text,
                model=model_name,
                tokens_used=0
            )
    
    except httpx.ConnectError:
        logger.error("Cannot connect to Ollama")
        raise HTTPException(
            status_code=503,
            detail="Ollama service not available"
        )
    except Exception as e:
        logger.exception(f"Error processing query: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models")
async def list_models():
    """List available models from Ollama"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{ollama_base_url}/api/tags")
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Could not fetch models from Ollama"
                )
            
            data = response.json()
            return {"models": data.get("models", [])}
    
    except Exception as e:
        logger.error(f"Error fetching models: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pull-model")
async def pull_model(model: str):
    """Pull a new model from Ollama"""
    try:
        logger.info(f"Pulling model: {model}")
        
        async with httpx.AsyncClient(timeout=3600.0) as client:
            response = await client.post(
                f"{ollama_base_url}/api/pull",
                json={"name": model},
                timeout=3600.0
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Error pulling model: {response.text}"
                )
            
            return {"status": "success", "model": model}
    
    except Exception as e:
        logger.error(f"Error pulling model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
