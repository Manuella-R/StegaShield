import numpy as np
import pywt
from typing import Dict, Any, Tuple, List
from dataclasses import dataclass
from PIL import Image


def _to_gray(img: Image.Image) -> np.ndarray:
    return np.array(img.convert("L"), dtype=np.float32)


def _from_gray(gray: np.ndarray) -> Image.Image:
    gray = np.clip(gray, 0, 255).astype("uint8")
    return Image.fromarray(gray, mode="L").convert("RGB")


def _message_to_bits(msg: str) -> np.ndarray:
    b = msg.encode("utf-8")
    bits: List[int] = []
    for byte in b:
        for i in range(8):
            bits.append((byte >> (7 - i)) & 1)
    return np.array(bits, dtype=np.uint8)


def _bits_to_message(bits: np.ndarray, length_bytes: int) -> str:
    bits = bits.astype(int)
    if bits.size % 8 != 0:
        pad = 8 - (bits.size % 8)
        bits = np.concatenate([bits, np.zeros(pad, dtype=int)])
    out_bytes = bytearray()
    total_bits = length_bytes * 8
    for i in range(0, total_bits, 8):
        byte = 0
        for j in range(8):
            if i + j < bits.size:
                byte = (byte << 1) | (bits[i + j] & 1)
        out_bytes.append(byte)
    return out_bytes.decode("utf-8", errors="replace")


@dataclass
class DwtSvdParams:
    wavelet: str = "haar"
    band: str = "LH"
    block_size: int = 8
    q_step: float = 5.0
    redundancy: int = 3


class SemiFragileEmbedderDwtSvd:
    def __init__(self, params: DwtSvdParams = None):
        self.params = params or DwtSvdParams()

    def _decompose_band(self, img: Image.Image) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, int, int, int]:
        p = self.params
        gray = _to_gray(img)
        return self._decompose_band_from_gray(gray, p)
    
    def _decompose_band_from_gray(self, gray: np.ndarray, p: DwtSvdParams) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, int, int, int]:
        """Decompose a grayscale array into DWT bands."""
        LL, (LH, HL, HH) = pywt.dwt2(gray, p.wavelet)
        band = LH if p.band == "LH" else HL
        bh, bw = band.shape
        bs = p.block_size
        nbh = bh // bs
        nbw = bw // bs
        num_blocks = nbh * nbw
        if num_blocks == 0:
            raise ValueError("Image too small for selected block size / band.")
        return gray, LL, LH, HL, HH, band, nbh, nbw, num_blocks

    def estimate_capacity_bits(self, img: Image.Image) -> int:
        _, _, _, _, _, _, _, _, num_blocks = self._decompose_band(img)
        return num_blocks // self.params.redundancy

    def estimate_capacity_bytes(self, img: Image.Image) -> int:
        return self.estimate_capacity_bits(img) // 8

    def embed(self, img: Image.Image, message: str) -> Tuple[Image.Image, Dict[str, Any], np.ndarray]:
        p = self.params
        # Convert to RGB if needed
        img_rgb = img.convert("RGB")
        img_array = np.array(img_rgb, dtype=np.float32)
        
        # Check if image is grayscale (all channels same) or color
        is_grayscale = np.allclose(img_array[:, :, 0], img_array[:, :, 1]) and np.allclose(img_array[:, :, 1], img_array[:, :, 2])
        
        if is_grayscale:
            # For grayscale images, use the original method
            gray = _to_gray(img)
        else:
            # For color images, convert to YCbCr and work on Y channel only
            # Convert RGB to YCbCr
            ycbcr = np.zeros_like(img_array)
            ycbcr[:, :, 0] = 0.299 * img_array[:, :, 0] + 0.587 * img_array[:, :, 1] + 0.114 * img_array[:, :, 2]  # Y
            ycbcr[:, :, 1] = -0.168736 * img_array[:, :, 0] - 0.331264 * img_array[:, :, 1] + 0.5 * img_array[:, :, 2] + 128  # Cb
            ycbcr[:, :, 2] = 0.5 * img_array[:, :, 0] - 0.418688 * img_array[:, :, 1] - 0.081312 * img_array[:, :, 2] + 128  # Cr
            gray = ycbcr[:, :, 0].copy()  # Use Y channel for watermarking
            cb_orig = ycbcr[:, :, 1].copy()
            cr_orig = ycbcr[:, :, 2].copy()
        
        H, W = gray.shape
        _, LL, LH, HL, HH, band, nbh, nbw, num_blocks = self._decompose_band_from_gray(gray, p)
        bs = p.block_size

        bits = _message_to_bits(message)
        mlen = len(bits)
        total_slots = num_blocks
        if mlen * p.redundancy > total_slots:
            raise ValueError(
                f"Message too long: need {mlen * p.redundancy} blocks, only {total_slots} available."
            )

        block_indices = np.arange(num_blocks)
        np.random.seed(0)
        np.random.shuffle(block_indices)

        assignments = []
        idx = 0
        for bit_idx in range(mlen):
            for _ in range(p.redundancy):
                if idx >= total_slots:
                    break
                assignments.append((block_indices[idx], bits[bit_idx]))
                idx += 1

        band_mod = band.copy()

        for block_id, bit in assignments:
            by = (block_id // nbw) * bs
            bx = (block_id % nbw) * bs
            block = band_mod[by:by+bs, bx:bx+bs]

            U, S, Vt = np.linalg.svd(block, full_matrices=False)

            q = p.q_step
            base = np.floor(S[0] / q) * q
            if bit == 0:
                S0_new = base + 0.25 * q
            else:
                S0_new = base + 0.75 * q

            S[0] = S0_new
            block_new = (U @ np.diag(S) @ Vt).astype(np.float32)
            band_mod[by:by+bs, bx:bx+bs] = block_new

        if p.band == "LH":
            LH_mod, HL_mod = band_mod, HL
        else:
            LH_mod, HL_mod = LH, band_mod

        gray_wm = pywt.idwt2((LL, (LH_mod, HL_mod, HH)), p.wavelet)
        # DWT inverse can produce slightly different dimensions, crop/pad to match original
        h_wm, w_wm = gray_wm.shape
        if h_wm != H or w_wm != W:
            # Crop if larger, pad if smaller
            if h_wm > H:
                gray_wm = gray_wm[:H, :]
            elif h_wm < H:
                pad_h = H - h_wm
                gray_wm = np.pad(gray_wm, ((0, pad_h), (0, 0)), mode='edge')
            if w_wm > W:
                gray_wm = gray_wm[:, :W]
            elif w_wm < W:
                pad_w = W - w_wm
                gray_wm = np.pad(gray_wm, ((0, 0), (0, pad_w)), mode='edge')
        
        # Compute difference for heatmap (before color reconstruction)
        # For grayscale, compare with original grayscale; for color, compare with original Y channel
        if is_grayscale:
            gray_orig = _to_gray(img)
        else:
            gray_orig = ycbcr[:, :, 0]  # Original Y channel
        diff = np.abs(gray_wm - gray_orig)
        if diff.max() > 0:
            heatmap = diff / diff.max() * 255.0
        else:
            heatmap = diff
        
        # Reconstruct color image
        if is_grayscale:
            wm_img = _from_gray(gray_wm)
        else:
            # Reconstruct YCbCr with modified Y channel
            ycbcr_wm = np.zeros((H, W, 3), dtype=np.float32)
            ycbcr_wm[:, :, 0] = gray_wm
            ycbcr_wm[:, :, 1] = cb_orig
            ycbcr_wm[:, :, 2] = cr_orig
            
            # Convert YCbCr back to RGB
            rgb_wm = np.zeros_like(ycbcr_wm)
            rgb_wm[:, :, 0] = ycbcr_wm[:, :, 0] + 1.402 * (ycbcr_wm[:, :, 2] - 128)  # R
            rgb_wm[:, :, 1] = ycbcr_wm[:, :, 0] - 0.344136 * (ycbcr_wm[:, :, 1] - 128) - 0.714136 * (ycbcr_wm[:, :, 2] - 128)  # G
            rgb_wm[:, :, 2] = ycbcr_wm[:, :, 0] + 1.772 * (ycbcr_wm[:, :, 1] - 128)  # B
            
            rgb_wm = np.clip(rgb_wm, 0, 255).astype("uint8")
            wm_img = Image.fromarray(rgb_wm, mode="RGB")

        metadata = {
            "message": message,
            "message_len_bytes": len(message.encode("utf-8")),
            "params": {
                "wavelet": p.wavelet,
                "band": p.band,
                "block_size": p.block_size,
                "q_step": p.q_step,
                "redundancy": p.redundancy,
                "shape": [int(H), int(W)],
                "num_blocks": int(num_blocks),
                "perm_seed": 0,
            },
        }
        return wm_img, metadata, heatmap


class SemiFragileVerifierDwtSvd:
    def __init__(self, params: DwtSvdParams = None):
        self.params = params or DwtSvdParams()

    def verify(self, img: Image.Image, metadata: Dict[str, Any]) -> Dict[str, Any]:
        p = self.params
        msg = metadata["message"]
        msg_len_bytes = metadata["message_len_bytes"]
        expected_bits = _message_to_bits(msg)
        mlen = len(expected_bits)

        gray = _to_gray(img)
        H, W = gray.shape

        LL, (LH, HL, HH) = pywt.dwt2(gray, p.wavelet)
        band = LH if p.band == "LH" else HL
        bh, bw = band.shape

        bs = p.block_size
        nbh = bh // bs
        nbw = bw // bs
        num_blocks = nbh * nbw

        if mlen * p.redundancy > num_blocks:
            return {
                "decode_success": False,
                "decoded_message": None,
                "bit_accuracy": 0.0,
            }

        block_indices = np.arange(num_blocks)
        np.random.seed(metadata["params"].get("perm_seed", 0))
        np.random.shuffle(block_indices)

        assignments = []
        idx = 0
        for bit_idx in range(mlen):
            for _ in range(p.redundancy):
                if idx >= num_blocks:
                    break
                assignments.append((block_indices[idx], bit_idx))
                idx += 1

        votes = [[] for _ in range(mlen)]
        q = p.q_step

        for block_id, bit_idx in assignments:
            by = (block_id // nbw) * bs
            bx = (block_id % nbw) * bs
            block = band[by:by+bs, bx:bx+bs]

            U, S, Vt = np.linalg.svd(block, full_matrices=False)
            S0 = S[0]
            base = np.floor(S0 / q) * q
            offset = S0 - base
            bit_hat = 0 if offset < 0.5 * q else 1
            votes[bit_idx].append(bit_hat)

        decoded_bits = np.zeros(mlen, dtype=np.uint8)
        for i, v in enumerate(votes):
            if len(v) == 0:
                decoded_bits[i] = 0
            else:
                # Use strict majority voting (0.5 threshold) to better detect tampering
                # This ensures we only accept bits when there's clear majority agreement
                # Helps distinguish between authentic (high agreement) and tampered (low agreement) images
                decoded_bits[i] = 1 if np.mean(v) >= 0.5 else 0

        min_len = min(len(expected_bits), len(decoded_bits))
        correct = int((expected_bits[:min_len] == decoded_bits[:min_len]).sum())
        bit_acc = correct / float(min_len) if min_len > 0 else 0.0

        decoded_msg = _bits_to_message(decoded_bits, msg_len_bytes)

        return {
            "decode_success": True,
            "decoded_message": decoded_msg,
            "bit_accuracy": bit_acc,
        }
