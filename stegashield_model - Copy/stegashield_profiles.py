import hashlib
import json
from pathlib import Path
from typing import Any, Dict, Optional

from PIL import Image

from models.hybrid_multidomain_embed_det import HybridMultiDomainEmbedderDet
from models.hybrid_multidomain_verify_det import HybridMultiDomainVerifierDet
from models.semi_fragile_dwt_svd import (
    SemiFragileEmbedderDwtSvd,
    SemiFragileVerifierDwtSvd,
    DwtSvdParams,
)


VALID_MODES = ("robust", "semi_fragile", "fragile", "hybrid")


def _normalize_mode(mode: str) -> str:
    if mode is None:
        return "hybrid"
    norm = mode.strip().lower()
    if norm not in VALID_MODES:
        raise ValueError(f"Unsupported mode '{mode}'. Choose from {VALID_MODES}.")
    return norm


def _derive_payload(message: str, user_key: Optional[str]) -> Dict[str, Optional[str]]:
    message = (message or "").strip()
    if not message and not user_key:
        raise ValueError("Provide at least one of message or user_key.")

    key_hash = hashlib.sha256(user_key.encode("utf-8")).hexdigest() if user_key else None
    if user_key and message:
        payload = f"{message}|{key_hash[:32]}"
    elif user_key:
        payload = key_hash
    else:
        payload = message
    return {"payload": payload, "key_hash": key_hash}


def _write_metadata(
    metadata_path: Path,
    base_payload: Dict[str, Optional[str]],
    profile_mode: str,
    extra: Dict[str, Any],
) -> Dict[str, Any]:
    metadata = {
        "profile_mode": profile_mode,
        "user_payload": base_payload["payload"],
        "user_key_hash": base_payload["key_hash"],
    }
    metadata.update(extra)

    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    return metadata


def embed_image(
    image_path: str,
    message: str = "",
    mode: str = "hybrid",
    user_key: Optional[str] = None,
    output_dir: Optional[str] = None,
) -> Dict[str, Any]:
    """
    High-level embed wrapper that routes to the correct pipeline based on `mode`.
    """

    mode = _normalize_mode(mode)
    payload_info = _derive_payload(message, user_key)

    image_path = Path(image_path).expanduser().resolve()
    if not image_path.exists():
        raise FileNotFoundError(f"Input image not found: {image_path}")

    out_dir = Path(output_dir).expanduser().resolve() if output_dir else image_path.parent
    out_dir.mkdir(parents=True, exist_ok=True)

    base_name = f"{image_path.stem}_{mode}"
    final_image_path = out_dir / f"{base_name}.png"
    metadata_path = out_dir / f"{base_name}_metadata.json"

    if mode == "robust":
        embedder = HybridMultiDomainEmbedderDet()
        embedder.embed(
            str(image_path),
            payload_info["payload"],
            output_path=str(final_image_path),
            metadata_path=str(metadata_path),
            save_metadata=True,
        )

        with open(metadata_path, "r", encoding="utf-8") as f:
            raw_meta = json.load(f)

        raw_meta.update(
            {
                "profile_mode": "robust",
                "user_payload": payload_info["payload"],
                "user_key_hash": payload_info["key_hash"],
            }
        )

        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(raw_meta, f, indent=2)

        return {
            "mode": "robust",
            "image_path": str(final_image_path),
            "metadata_path": str(metadata_path),
        }

    if mode == "semi_fragile":
        # Use significantly more robust parameters for better survival through re-encoding
        # Higher redundancy = more copies of each bit (better error correction)
        # Higher q_step = larger quantization bins (more tolerant to compression)
        # Larger block_size = more stable embedding (less affected by small changes)
        robust_params = DwtSvdParams(
            redundancy=8,   # Increased from 5 to 8 (each bit embedded 8 times for better error correction)
            q_step=9.0,     # Increased from 7.0 to 9.0 (larger quantization bins = more robust to compression)
            block_size=12,  # Increased from 8 to 12 (larger blocks = more stable, less sensitive to minor changes)
            wavelet="haar",
            band="LH"
        )
        embedder = SemiFragileEmbedderDwtSvd(params=robust_params)
        img = Image.open(image_path).convert("RGB")
        wm_img, semi_metadata, heatmap = embedder.embed(img, payload_info["payload"])
        wm_img.save(final_image_path)

        heatmap_path = out_dir / f"{base_name}_heatmap.png"
        Image.fromarray(heatmap.astype("uint8")).save(heatmap_path)

        _write_metadata(
            metadata_path,
            payload_info,
            "semi_fragile",
            {
                "semi_metadata": semi_metadata,
                "heatmap_path": str(heatmap_path),
                "params": robust_params.__dict__,  # Store params in metadata for verification
            },
        )

        return {
            "mode": "semi_fragile",
            "image_path": str(final_image_path),
            "metadata_path": str(metadata_path),
            "heatmap_path": str(heatmap_path),
        }

    if mode == "fragile":
        raise NotImplementedError(
            "Fragile profile is reserved for future work. Tune SemiFragileEmbedderDwtSvd "
            "parameters (e.g., higher redundancy, tighter thresholds) before enabling."
        )

    # Hybrid mode: semi-fragile embed first, robust embed second
    # Use significantly more robust parameters for hybrid mode as well
    robust_params = DwtSvdParams(
        redundancy=8,   # Increased from 5 to 8 for better error correction
        q_step=9.0,     # Increased from 7.0 to 9.0 for more robust quantization
        block_size=12, # Increased from 8 to 12 for more stable embedding
        wavelet="haar",
        band="LH"
    )
    semi_embedder = SemiFragileEmbedderDwtSvd(params=robust_params)
    img = Image.open(image_path).convert("RGB")
    semi_wm_img, semi_metadata, heatmap = semi_embedder.embed(img, payload_info["payload"])

    intermediate_path = out_dir / f"{base_name}_stage.png"
    semi_wm_img.save(intermediate_path)

    heatmap_path = out_dir / f"{base_name}_heatmap.png"
    Image.fromarray(heatmap.astype("uint8")).save(heatmap_path)

    robust_embedder = HybridMultiDomainEmbedderDet()
    robust_metadata_path = out_dir / f"{base_name}_robust.json"
    robust_embedder.embed(
        str(intermediate_path),
        payload_info["payload"],
        output_path=str(final_image_path),
        metadata_path=str(robust_metadata_path),
        save_metadata=True,
    )

    if intermediate_path.exists():
        intermediate_path.unlink()

    combined_metadata = _write_metadata(
        metadata_path,
        payload_info,
        "hybrid",
        {
            "semi_metadata": semi_metadata,
            "heatmap_path": str(heatmap_path),
            "robust_metadata_path": str(robust_metadata_path),
            "params": robust_params.__dict__,  # Store params in metadata for verification
        },
    )

    return {
        "mode": "hybrid",
        "image_path": str(final_image_path),
        "metadata_path": str(metadata_path),
        "heatmap_path": str(heatmap_path),
        "robust_metadata_path": combined_metadata["robust_metadata_path"],
    }


def verify_image(
    image_path: str,
    metadata_path: str,
    mode: Optional[str] = None,
) -> Dict[str, Any]:
    """
    High-level verify wrapper that routes to the correct pipeline based on `mode`.
    """

    image_path = Path(image_path).expanduser().resolve()
    metadata_path = Path(metadata_path).expanduser().resolve()
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")
    if not metadata_path.exists():
        raise FileNotFoundError(f"Metadata not found: {metadata_path}")

    with open(metadata_path, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    resolved_mode = _normalize_mode(mode or metadata.get("profile_mode", "hybrid"))

    if resolved_mode == "robust":
        verifier = HybridMultiDomainVerifierDet()
        report = verifier.verify(str(image_path), str(metadata_path))
        return {"mode": "robust", "robust_report": report}

    if resolved_mode == "semi_fragile":
        semi_metadata = metadata.get("semi_metadata")
        if semi_metadata is None:
            raise ValueError("Semi-fragile metadata missing from metadata file.")
        
        # Use parameters from metadata if available, otherwise use improved robust defaults
        # This ensures backward compatibility with old watermarks
        params_dict = semi_metadata.get("params", {})
        verify_params = DwtSvdParams(
            redundancy=params_dict.get("redundancy", 8),  # Default to 8 for new watermarks (improved from 5)
            q_step=params_dict.get("q_step", 9.0),        # Default to 9.0 for new watermarks (improved from 7.0)
            block_size=params_dict.get("block_size", 12),  # Default to 12 for new watermarks (improved from 8)
            wavelet=params_dict.get("wavelet", "haar"),
            band=params_dict.get("band", "LH")
        )
        verifier = SemiFragileVerifierDwtSvd(params=verify_params)
        img = Image.open(image_path).convert("RGB")

        report = verifier.verify(img, semi_metadata)
        return {"mode": "semi_fragile", "semi_fragile_report": report}

    if resolved_mode == "fragile":
        raise NotImplementedError(
            "Fragile profile verification hooks are not implemented yet. "
            "Tighten semi-fragile thresholds to emulate fragile behaviour."
        )

    # Hybrid
    semi_metadata = metadata.get("semi_metadata")
    robust_metadata_path = metadata.get("robust_metadata_path")
    if semi_metadata is None or robust_metadata_path is None:
        raise ValueError("Hybrid metadata must include semi and robust components.")

    img = Image.open(image_path).convert("RGB")
    # Use parameters from metadata for hybrid verification (backward compatible)
    # Check both semi_metadata.params and top-level params for backward compatibility
    params_dict = semi_metadata.get("params", {})
    if not params_dict and "params" in metadata:
        params_dict = metadata.get("params", {})
    verify_params = DwtSvdParams(
        redundancy=params_dict.get("redundancy", 8),  # Default to 8 (improved from 5)
        q_step=params_dict.get("q_step", 9.0),        # Default to 9.0 (improved from 7.0)
        block_size=params_dict.get("block_size", 12), # Default to 12 (improved from 8)
        wavelet=params_dict.get("wavelet", "haar"),
        band=params_dict.get("band", "LH")
    )
    semi_report = SemiFragileVerifierDwtSvd(params=verify_params).verify(img, semi_metadata)

    robust_report = HybridMultiDomainVerifierDet().verify(
        str(image_path),
        str(robust_metadata_path),
    )

    return {
        "mode": "hybrid",
        "semi_fragile_report": semi_report,
        "robust_report": robust_report,
    }

