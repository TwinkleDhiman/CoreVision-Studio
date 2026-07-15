import asyncio
from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import uvicorn
import psutil
import os
import cv2
import numpy as np
import base64
import json
import torch

try:
    import ollama as ollama_client
    _OLLAMA_AVAILABLE = True
except ImportError:
    _OLLAMA_AVAILABLE = False

OLLAMA_MODEL = "llama3.2"

try:
    from ultralytics import YOLO
    has_yolo = True
except ImportError:
    has_yolo = False

app = FastAPI(title="CoreVision Studio AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Keep track of uploaded model paths (in memory for demo)
current_model_path = "yolo11n.pt" 
current_model = None

# Attempt to load default model
if has_yolo and os.path.exists(current_model_path):
    try:
        current_model = YOLO(current_model_path)
        print(f"Loaded default model: {current_model_path}")
    except Exception as e:
        print(f"Failed to load default YOLO: {e}")

@app.get("/")
def read_root():
    return {"status": "CoreVision Studio Backend is running!"}


# ──────────────────────────────────────────────────────────────────────────────
# Ollama / Llama endpoints
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/api/ollama/health")
def ollama_health():
    """Returns whether Ollama is running and llama3.2 is available."""
    if not _OLLAMA_AVAILABLE:
        return {"available": False, "reason": "ollama Python package not installed"}
    try:
        models_resp = ollama_client.list()
        # models_resp.models is a list of ModelResponse objects
        names = [m.model for m in models_resp.models]
        model_ready = any(OLLAMA_MODEL in n for n in names)
        return {"available": model_ready, "models": names}
    except Exception as e:
        return {"available": False, "reason": str(e)}


class CopilotPayload(BaseModel):
    name: str
    framework: str
    size_mb: float
    baseStats: dict
    simStats: dict
    opts: dict


class DeployPayload(BaseModel):
    name: str
    framework: str
    size_mb: float
    totalScore: int
    breakdown: dict


def _sse(text: str) -> str:
    """Wrap a token as an SSE data line."""
    return f"data: {text}\n\n"


@app.post("/api/copilot/insight")
async def copilot_insight(payload: CopilotPayload):
    """
    Streams Llama 3.2 insights for the Performance Copilot.
    Explains what each active optimization does and gives tailored advice.
    """
    active = []
    if payload.opts.get("quantize"): active.append("INT8 Quantization")
    if payload.opts.get("coreml"):   active.append("CoreML ANE Conversion")
    if payload.opts.get("resize"):   active.append("Input Resize 640→320")
    active_str = ", ".join(active) if active else "None selected"

    b, s = payload.baseStats, payload.simStats
    prompt = f"""You are an expert Apple Silicon on-device ML optimization engineer.
Respond ONLY with structured markdown. Use ## for section headers, - for bullet points, and numbered lists for steps. Do NOT write long paragraphs.

## Model Info
- Name: {payload.name}
- Framework: {payload.framework}
- Size: {payload.size_mb} MB

## Performance Change
- FPS: {b.get('fps', 0)} → {s.get('fps', 0)}
- Latency: {b.get('latency', 0)} ms → {s.get('latency', 0)} ms
- Memory: {b.get('memory', 0)} MB → {s.get('memory', 0)} MB
- Disk Size: {b.get('size', 0)} MB → {s.get('size', 0)} MB

## Active Optimizations
{active_str}

Now provide your analysis using this EXACT structure:

## Combined Effect
- [bullet: what the active optimizations do together on this model]

## Risks & Trade-offs
- [bullet per risk]

## Next Step
1. [single most impactful next action]

## Recommendation
- [if no opts active, which to start with and why]

Be concise. Max 2–3 bullets per section. No long paragraphs."""

    async def generate():
        if not _OLLAMA_AVAILABLE:
            yield _sse("[ERROR] ollama package not installed on the backend.")
            yield _sse("[DONE]")
            return
        try:
            stream = ollama_client.generate(model=OLLAMA_MODEL, prompt=prompt, stream=True)
            for chunk in stream:
                token = chunk.get("response", "") if isinstance(chunk, dict) else getattr(chunk, "response", "")
                if token:
                    yield _sse(token)
            yield _sse("[DONE]")
        except Exception as e:
            yield _sse(f"[ERROR] {e}")
            yield _sse("[DONE]")

    return StreamingResponse(generate(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.post("/api/deploy/insight")
async def deploy_insight(payload: DeployPayload):
    """
    Streams Llama 3.2 deployment assessment.
    Explains why the readiness score is where it is and how to improve it.
    """
    bd = payload.breakdown
    prompt = f"""You are an expert Apple on-device AI deployment engineer.
Respond ONLY with structured markdown. Use ## for section headers, - for bullet points, and numbered lists for steps. Do NOT write long paragraphs.

## Model Profile
- Name: {payload.name}
- Framework: {payload.framework}
- Size: {payload.size_mb} MB
- Overall Readiness Score: {payload.totalScore}/100

## Score Breakdown
- CoreML Compatibility: {bd.get('compatibility', 0)}/100
- Neural Engine Performance: {bd.get('performance', 0)}/100
- Memory Footprint: {bd.get('memory', 0)}/100
- Optimization Level: {bd.get('optimization', 0)}/100

Now provide your analysis using this EXACT structure:

## Why This Score
- [2–3 bullets explaining what drives the score up or down]

## Weakest Area
- [name the lowest-scoring dimension and explain why in 1–2 bullets]

## Improvement Steps
1. [highest-priority action]
2. [second action]
3. [third action]

## Platform Pitfalls
- [1–2 bullets on Apple-specific gotchas for this framework/size]

Be direct and actionable. No long paragraphs."""

    async def generate():
        if not _OLLAMA_AVAILABLE:
            yield _sse("[ERROR] ollama package not installed on the backend.")
            yield _sse("[DONE]")
            return
        try:
            stream = ollama_client.generate(model=OLLAMA_MODEL, prompt=prompt, stream=True)
            for chunk in stream:
                token = chunk.get("response", "") if isinstance(chunk, dict) else getattr(chunk, "response", "")
                if token:
                    yield _sse(token)
            yield _sse("[DONE]")
        except Exception as e:
            yield _sse(f"[ERROR] {e}")
            yield _sse("[DONE]")

    return StreamingResponse(generate(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

@app.post("/api/analyze")
async def analyze_model(file: UploadFile = File(...)):
    global current_model_path, current_model
    
    # Save uploaded file
    file_path = f"models_uploaded/{file.filename}"
    os.makedirs("models_uploaded", exist_ok=True)
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
        
    current_model_path = file_path
    
    # Attempt to load if it's YOLO
    if has_yolo and file.filename.endswith(".pt") and "yolo" in file.filename.lower():
        try:
            current_model = YOLO(file_path)
        except Exception:
            pass
            
    size_mb = round(len(content) / (1024 * 1024), 2)
    framework = "PyTorch" if file.filename.endswith(".pt") else "ONNX" if file.filename.endswith(".onnx") else "CoreML"
    
    # Generate mock layers so the UI graph updates
    mock_layers = []
    if framework == "PyTorch":
        mock_layers = [
            {"name": "Conv2d (Input)", "type": "Convolutional", "output_shape": [1, 64, 640, 640]},
            {"name": "BatchNorm2d", "type": "Normalization", "output_shape": [1, 64, 640, 640]},
            {"name": "SiLU (Activation)", "type": "Activation", "output_shape": [1, 64, 640, 640]},
            {"name": "MaxPool2d", "type": "Pooling", "output_shape": [1, 64, 320, 320]},
            {"name": "C2f (Bottleneck)", "type": "Convolutional", "output_shape": [1, 128, 320, 320]},
            {"name": "Detect (Head)", "type": "Linear", "output_shape": [1, 84, 8400]},
        ]
    elif framework == "ONNX":
        mock_layers = [
            {"name": "Conv_0", "type": "Convolutional", "output_shape": [1, 32, 224, 224]},
            {"name": "Relu_1", "type": "Activation", "output_shape": [1, 32, 224, 224]},
            {"name": "MaxPool_2", "type": "Pooling", "output_shape": [1, 32, 112, 112]},
            {"name": "Conv_3", "type": "Convolutional", "output_shape": [1, 64, 112, 112]},
            {"name": "GlobalAveragePool", "type": "Pooling", "output_shape": [1, 64, 1, 1]},
            {"name": "Gemm_Out", "type": "Linear", "output_shape": [1, 1000]},
        ]
    else:
        mock_layers = [
            {"name": "convolution", "type": "Convolutional", "output_shape": [1, 16, 256, 256]},
            {"name": "activation (ReLU)", "type": "Activation", "output_shape": [1, 16, 256, 256]},
            {"name": "pooling (Max)", "type": "Pooling", "output_shape": [1, 16, 128, 128]},
            {"name": "innerProduct", "type": "Linear", "output_shape": [1, 100]},
        ]

    return {
        "name": file.filename,
        "size_mb": size_mb,
        "parameters": "2.6M" if size_mb < 15 else ("11.4M" if size_mb < 50 else "25.1M"),
        "input_shape": "[1, 3, 640, 640]",
        "output_shape": "[1, 84, 8400]",
        "framework": framework,
        "layers": mock_layers,
        "total_layers": len(mock_layers) * 15 # Just to show a realistic total count
    }

@app.get("/api/profile")
def profile_hardware():
    cpu_usage = psutil.cpu_percent(interval=0.1)
    memory_info = psutil.virtual_memory()
    return {
        "cpu_usage_percent": cpu_usage,
        "memory_usage_percent": memory_info.percent,
        "memory_used_gb": round(memory_info.used / (1024**3), 2),
        "memory_total_gb": round(memory_info.total / (1024**3), 2)
    }

@app.websocket("/api/profile/stream")
async def profile_stream(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            cpu_usage = psutil.cpu_percent(interval=0.1)
            memory_info = psutil.virtual_memory()
            data = {
                "cpu_usage_percent": cpu_usage,
                "memory_used_mb": round(memory_info.used / (1024**2), 2),
            }
            await websocket.send_json(data)
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass

@app.websocket("/api/inference/stream")
async def inference_stream(websocket: WebSocket):
    await websocket.accept()
    global current_model
    try:
        while True:
            data = await websocket.receive_text()
            # data is base64 encoded image: "data:image/jpeg;base64,..."
            if "," in data:
                encoded_data = data.split(",")[1]
            else:
                encoded_data = data
                
            nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Run inference if model loaded
            if current_model is not None and has_yolo:
                results = current_model(img, verbose=False)
                # Draw boxes
                annotated_img = results[0].plot()
            else:
                # If unsupported model, just draw a dummy box to indicate backend processing
                annotated_img = img.copy()
                cv2.rectangle(annotated_img, (50, 50), (200, 200), (0, 255, 0), 2)
                cv2.putText(annotated_img, f"Model: {os.path.basename(current_model_path)} (Unsupported for auto-draw)", (60, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                
            # Encode back to base64
            _, buffer = cv2.imencode('.jpg', annotated_img)
            b64_img = base64.b64encode(buffer).decode('utf-8')
            
            await websocket.send_text(f"data:image/jpeg;base64,{b64_img}")
            
    except WebSocketDisconnect:
        pass

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
