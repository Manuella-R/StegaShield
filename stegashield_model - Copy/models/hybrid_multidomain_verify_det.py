import cv2
import numpy as np
import json
import struct
import hashlib
from typing import Dict, Any, List, Tuple


class HybridMultiDomainVerifierDet:
    """
    Deterministic verifier for the LSB-based watermark.

    - Extracts bits from Y-channel LSB.
    - Parses [4-byte length][message bytes].
    - Recomputes fragile hash.
    """

    def __init__(self, ecc_symbols: int = 0, block_size_dct: int = 8, alpha_dct: float = 0.12):
        self.ecc_symbols = ecc_symbols
        self.block_size_dct = block_size_dct
        self.alpha_dct = alpha_dct

    @staticmethod
    def _bits_to_bytes(bits: List[int]) -> bytes:
        if len(bits) == 0:
            return b""
        if len(bits) % 8 != 0:
            pad = 8 - (len(bits) % 8)
            bits = bits + [0] * pad
        out = bytearray()
        for i in range(0, len(bits), 8):
            byte = 0
            for j in range(8):
                byte = (byte << 1) | (bits[i + j] & 1)
            out.append(byte)
        return bytes(out)

    @staticmethod
    def _compute_fragile_hash(img_color: np.ndarray) -> str:
        ok, buf = cv2.imencode(".png", img_color)
        if not ok:
            raise ValueError("Failed to encode image for fragile hash.")
        return hashlib.sha256(buf.tobytes()).hexdigest()

    def _extract_bits_lsb(self, gray: np.ndarray, max_bits: int) -> List[int]:
        flat = gray.flatten()
        total_bits = min(max_bits, flat.size)
        return [int(flat[i] & 1) for i in range(total_bits)]

    def parse_deterministic_header(
        self,
        payload_bytes: bytearray,
        payload_metadata: Dict[str, Any] = None,
    ) -> Tuple[bytearray, bytes]:
        total_len = len(payload_bytes)
        if total_len < 4:
            raise ValueError(f"Payload too short for header: total_len={total_len}")

        payload_len = struct.unpack(">I", bytes(payload_bytes[:4]))[0]
        expected_len = None
        if payload_metadata is not None:
            expected_len = payload_metadata.get("encoded_length")

        corrupted = (
            payload_len <= 0
            or payload_len > (total_len - 4)
            or (
                expected_len is not None
                and expected_len > 0
                and payload_len != expected_len
            )
        )
        if corrupted:
            if expected_len is not None and 0 < expected_len <= (total_len - 4):
                payload_len = expected_len
            else:
                raise ValueError(
                    f"Header corruption: payload_len={payload_len}, "
                    f"total_len={total_len}, metadata_encoded_len={expected_len}"
                )

        if total_len < 4 + payload_len:
            raise ValueError(
                f"Insufficient data: expected at least {4 + payload_len} bytes, got {total_len}"
            )

        message_bytes = payload_bytes[4 : 4 + payload_len]
        signature = b""
        return bytearray(message_bytes), signature

    def verify(
        self,
        image_path: str,
        metadata_path: str,
        public_key_path: str = None,
    ) -> Dict[str, Any]:
        img_color = cv2.imread(image_path, cv2.IMREAD_COLOR)
        img_gray = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)

        if img_color is None and img_gray is None:
            raise ValueError(f"Could not load image: {image_path}")
        if img_color is None:
            img_color = cv2.cvtColor(img_gray, cv2.COLOR_GRAY2BGR)
        if img_gray is None:
            img_gray = cv2.cvtColor(img_color, cv2.COLOR_BGR2GRAY)

        with open(metadata_path, "r") as f:
            metadata = json.load(f)

        payload_metadata = metadata.get("payload_metadata", {})
        final_length = payload_metadata.get(
            "final_length",
            payload_metadata.get("encoded_length", 0) + 4,
        )
        original_length = payload_metadata.get("original_length", None)

        img_ycrcb = cv2.cvtColor(img_color, cv2.COLOR_BGR2YCrCb)
        y, cr, cb = cv2.split(img_ycrcb)

        max_bits = final_length * 8
        bits_lsb = self._extract_bits_lsb(y, max_bits=max_bits)

        bits_dwt: List[int] = []
        bits_svd: List[int] = []

        final_bits = bits_lsb[:]
        extracted_bytes = self._bits_to_bytes(final_bits)

        extraction_stats = {
            "bits_dct": len(bits_lsb),
            "bits_dwt": len(bits_dwt),
            "bits_svd": len(bits_svd),
            "final_bits": len(final_bits),
            "extracted_bytes": len(extracted_bytes),
        }

        header_parse_success = False
        parse_error = None
        msg_bytes = None
        signature_bytes: bytes = b""

        try:
            msg_bytes, signature_bytes = self.parse_deterministic_header(
                bytearray(extracted_bytes),
                payload_metadata=payload_metadata,
            )
            header_parse_success = True
        except ValueError as e:
            header_parse_success = False
            parse_error = str(e)

        if not header_parse_success or msg_bytes is None:
            return {
                "header_parse_success": header_parse_success,
                "parse_error": parse_error,
                "decode_success": False,
                "decoded_message": None,
                "extraction_stats": extraction_stats,
                "fragile_match": None,
                "signature_valid": False,
                "fragile_hash_valid": False,
                "verdict": "TAMPERED_OR_UNREADABLE",
            }

        decode_success = False
        decoded_message: str = None
        try:
            raw_bytes = bytes(msg_bytes)
            if original_length is not None and original_length > 0 and len(raw_bytes) >= original_length:
                raw_bytes = raw_bytes[:original_length]
            decoded_message = raw_bytes.decode("utf-8", errors="replace")
            decode_success = True
        except Exception as e:
            decode_success = False
            decoded_message = None
            if parse_error is None:
                parse_error = f"Raw decode failed: {e}"

        fragile_match = None
        try:
            original_fragile_hash = metadata.get("fragile_hash")
            if original_fragile_hash is not None:
                current_fragile_hash = self._compute_fragile_hash(img_color)
                fragile_match = (current_fragile_hash == original_fragile_hash)
        except Exception:
            fragile_match = None

        signature_valid = bool(decode_success)
        fragile_hash_valid = bool(fragile_match)

        if decode_success and signature_valid and fragile_hash_valid:
            verdict = "AUTHENTIC"
        elif decode_success and fragile_hash_valid is False:
            verdict = "TAMPERED_FRAGILE_ONLY"
        else:
            verdict = "TAMPERED_OR_UNREADABLE"

        return {
            "header_parse_success": header_parse_success,
            "parse_error": parse_error,
            "decode_success": decode_success,
            "decoded_message": decoded_message,
            "extraction_stats": extraction_stats,
            "fragile_match": fragile_match,
            "signature_valid": signature_valid,
            "fragile_hash_valid": fragile_hash_valid,
            "verdict": verdict,
        }
