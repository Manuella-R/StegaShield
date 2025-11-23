import json
import hashlib
from pathlib import Path
from typing import Tuple, Dict, Any, Optional

import cv2
import numpy as np
from PIL import Image


def _split_ycbcr(img: Image.Image) -> Tuple[np.ndarray, Image.Image, Image.Image]:
    """
    Return (Y_channel_array, cb_img, cr_img)
    """
    ycbcr = img.convert("YCbCr")
    y, cb, cr = ycbcr.split()
    return np.array(y, dtype=np.uint8), cb, cr


def _merge_ycbcr(y_channel: np.ndarray, cb: Image.Image, cr: Image.Image) -> Image.Image:
    """
    Merge modified Y with original chroma channels and convert back to RGB.
    """
    y_img = Image.fromarray(y_channel.astype("uint8"), mode="L")
    return Image.merge("YCbCr", (y_img, cb, cr)).convert("RGB")


class HybridMultiDomainEmbedderDet:
    """
    Deterministic LSB-based embedder (no ML).
    Embeds a small UTF-8 message into the LSBs of the luminance channel.

    Payload layout:
        [4 bytes big-endian: payload_len_bytes][raw message bytes]
    """

    def __init__(self, ecc_symbols: int = 0, alpha_dct: float = 0.12):
        self.ecc_symbols = ecc_symbols
        self.alpha_dct = alpha_dct

    def _bytes_to_bits(self, payload_bytes: bytes) -> np.ndarray:
        bits = []
        for byte in payload_bytes:
            for i in range(8):
                bits.append((byte >> (7 - i)) & 1)
        return np.array(bits, dtype=np.uint8)

    def _embed_lsb(self, img: Image.Image, message: str) -> Tuple[Image.Image, Dict[str, Any]]:
        y_channel, cb_img, cr_img = _split_ycbcr(img)
        h, w = y_channel.shape
        capacity = h * w

        msg_bytes = message.encode("utf-8")
        msg_len = len(msg_bytes)

        # header: 4 bytes big-endian payload length
        header = msg_len.to_bytes(4, byteorder="big", signed=False)
        payload_bytes = header + msg_bytes
        payload_bits = self._bytes_to_bits(payload_bytes)

        if payload_bits.size > capacity:
            raise ValueError(
                f"Message too long for image capacity: need {payload_bits.size} bits, have {capacity}."
            )

        flat = y_channel.flatten()
        flat[: payload_bits.size] = (flat[: payload_bits.size] & 0xFE) | payload_bits
        y_wm = flat.reshape(h, w)

        wm_img = _merge_ycbcr(y_wm, cb_img, cr_img)

        # Fragile hash over watermarked PNG bytes (BGR via cv2)
        rgb = np.array(wm_img.convert("RGB"), dtype=np.uint8)
        bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
        ok, buf = cv2.imencode(".png", bgr)
        if not ok:
            raise ValueError("Failed to encode watermarked image for fragile hash.")
        fragile_hash = hashlib.sha256(buf.tobytes()).hexdigest()

        payload_metadata = {
            "original_length": msg_len,
            "encoded_length": msg_len,
            "final_length": msg_len + 4,
            "ecc_symbols": self.ecc_symbols,
            "header_structure": {"payload_len_bytes": 4, "sig_len_bytes": 0},
        }

        metadata: Dict[str, Any] = {
            "payload_metadata": payload_metadata,
            "fragile_hash": fragile_hash,
            "embedding_params": {
                "alpha_dct": self.alpha_dct,
                "redundancy": 1,
                "block_size_dct": 8,
            },
            "original_shape": list(rgb.shape),
            "public_key_path": None,
            "has_deterministic_header": True,
            "domains_used": ["lsb"],
            "message": message,
        }
        return wm_img, metadata

    def embed(
        self,
        image_path: str,
        message: str,
        output_path: Optional[str] = None,
        metadata_path: Optional[str] = None,
        save_metadata: bool = True,
    ) -> Dict[str, Any]:
        """
        Embed message into image at image_path and write watermarked PNG + metadata JSON.

        Args:
            image_path: path to input image.
            message: watermark text.
            output_path: path to write watermarked PNG. If None, adds '_watermarked.png'.
            metadata_path: path to write metadata JSON. If None, uses '*_metadata.json'.
        """
        image_path = str(image_path)
        img = Image.open(image_path).convert("RGB")

        wm_img, metadata = self._embed_lsb(img, message)

        if output_path is None:
            p = Path(image_path)
            output_path = str(p.with_name(p.stem + "_watermarked.png"))
        if metadata_path is None:
            metadata_path = str(Path(output_path).with_name(Path(output_path).stem + "_metadata.json"))

        wm_img.save(output_path)

        if save_metadata:
            with open(metadata_path, "w") as f:
                json.dump(metadata, f, indent=2)

        metadata["image_path"] = output_path
        metadata["metadata_path"] = metadata_path
        return metadata
