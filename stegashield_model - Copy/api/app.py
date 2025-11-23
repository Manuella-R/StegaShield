from __future__ import annotations

import os
import traceback
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from stegashield_profiles import embed_image, verify_image


app = FastAPI(title="StegaShield Model Service", version="1.0.0")

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT_ROOT = PROJECT_ROOT / "artifacts"
DEFAULT_OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)


def _resolve_existing(path_str: str, description: str) -> Path:
    try:
        path = Path(path_str).expanduser().resolve()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid {description} path: {exc}") from exc

    if not path.exists():
        raise HTTPException(status_code=400, detail=f"{description} not found: {path}")
    return path


def _resolve_output_dir(path_str: Optional[str]) -> Path:
    if not path_str:
        return DEFAULT_OUTPUT_ROOT

    try:
        output_dir = Path(path_str).expanduser().resolve()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid output directory: {exc}") from exc

    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir


class EmbedRequest(BaseModel):
    image_path: str = Field(..., description="Absolute path to the uploaded media file.")
    mode: str = Field("hybrid", description="Watermark profile mode.")
    message: str = Field("", description="Optional payload to embed.")
    user_key: Optional[str] = Field(None, description="Tenant/user key for payload derivation.")
    output_dir: Optional[str] = Field(
        None, description="Directory where watermarked artifacts should be written."
    )


class VerifyRequest(BaseModel):
    image_path: str = Field(..., description="Absolute path to the suspect media.")
    metadata_path: str = Field(..., description="Path to the metadata JSON generated at embed time.")
    mode: Optional[str] = Field(None, description="Override profile mode.")


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "StegaShield FastAPI service is running"}


@app.post("/embed")
def embed_media(payload: EmbedRequest):
    image_path = _resolve_existing(payload.image_path, "image")
    output_dir = _resolve_output_dir(payload.output_dir)

    try:
        result = embed_image(
            image_path=str(image_path),
            message=payload.message or "",
            mode=payload.mode,
            user_key=payload.user_key,
            output_dir=str(output_dir),
        )
        return {"success": True, "data": result}
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Embed failed: {exc}"
        ) from exc


@app.post("/verify")
def verify_media(payload: VerifyRequest):
    image_path = _resolve_existing(payload.image_path, "image")
    metadata_path = _resolve_existing(payload.metadata_path, "metadata")

    try:
        result = verify_image(
            image_path=str(image_path),
            metadata_path=str(metadata_path),
            mode=payload.mode,
        )
        return {"success": True, "data": result}
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Verification failed: {exc}"
        ) from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "api.app:app",
        host=os.environ.get("MODEL_SERVICE_HOST", "0.0.0.0"),
        port=int(os.environ.get("MODEL_SERVICE_PORT", "8001")),
        reload=os.environ.get("MODEL_SERVICE_RELOAD", "false").lower() == "true",
    )

