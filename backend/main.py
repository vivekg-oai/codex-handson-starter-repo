import base64
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .utils import create_image, edit_image


class GenerateImageRequest(BaseModel):
    prompt: str
    size: str = "1024x1024"


app = FastAPI(title="Image Generation Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _encode_image(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode("utf-8")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/generate")
async def generate_image(request: GenerateImageRequest):
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt is required.")
    try:
        image_bytes = create_image(request.prompt, request.size)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc))
    return {"image": _encode_image(image_bytes)}


@app.post("/api/edit")
async def edit_image_endpoint(
    prompt: str = Form(...),
    image: UploadFile = File(...),
):
    if not prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt is required.")

    try:
        original_bytes = await image.read()
        edited_bytes = edit_image(prompt, original_bytes)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc))

    return {"image": _encode_image(edited_bytes)}
