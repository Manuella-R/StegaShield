from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Any, List
import json

import csv
import cv2
import numpy as np
from PIL import Image

from models.hybrid_multidomain_embed_det import HybridMultiDomainEmbedderDet
from models.hybrid_multidomain_verify_det import HybridMultiDomainVerifierDet
from models.semi_fragile_dwt_svd import (
    SemiFragileEmbedderDwtSvd,
    SemiFragileVerifierDwtSvd,
    DwtSvdParams,
)
from training.attacks import AttackSimulator
from utils.visualization import create_watermark_location_map, triple_view


@dataclass
class AttackConfig:
    name: str
    func_name: str
    params: Dict[str, Any]


class TestHarness:
    """
    No-ML StegaShield test harness.

    For each original image:
      - Embed LSB watermark.
      - Embed semi-fragile DWT–SVD watermark.
      - Apply attack suite.
      - Record decode success / bit accuracy.
    """

    def __init__(
        self,
        output_dir: str,
        lsb_message: str = "StegaShield_Dataset2025",
        semi_message: str = "StegaShield_SemiFragile",
    ):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Create subdirectories
        self.watermarked_dir = self.output_dir / "watermarked"
        self.tampered_dir = self.output_dir / "tampered"
        self.watermarked_dir.mkdir(exist_ok=True)
        self.tampered_dir.mkdir(exist_ok=True)

        self.lsb_embedder = HybridMultiDomainEmbedderDet()
        self.lsb_verifier = HybridMultiDomainVerifierDet()

        params = DwtSvdParams()
        self.semi_embedder = SemiFragileEmbedderDwtSvd(params)
        self.semi_verifier = SemiFragileVerifierDwtSvd(params)

        self.lsb_message = lsb_message
        self.semi_message = semi_message

        self.attacks = self._define_attacks()

    def _define_attacks(self) -> List[AttackConfig]:
        A = AttackSimulator
        return [
            AttackConfig("Identity", "jpeg_compression", {"quality": 100}),
            AttackConfig("JPEG_Q95", "jpeg_compression", {"quality": 95}),
            AttackConfig("JPEG_Q85", "jpeg_compression", {"quality": 85}),
            AttackConfig("JPEG_Q70", "jpeg_compression", {"quality": 70}),
            AttackConfig("JPEG_Q50", "jpeg_compression", {"quality": 50}),
            AttackConfig("Crop_5pct", "crop", {"crop_percent": 0.05}),
            AttackConfig("Crop_15pct", "crop", {"crop_percent": 0.15}),
            AttackConfig("Crop_30pct", "crop", {"crop_percent": 0.30}),
            AttackConfig("Resize_0.9x", "resize", {"scale": 0.9}),
            AttackConfig("Resize_0.75x", "resize", {"scale": 0.75}),
            AttackConfig("Resize_0.5x", "resize", {"scale": 0.5}),
            AttackConfig("Rotate_5deg", "rotate", {"angle": 5}),
            AttackConfig("Rotate_15deg", "rotate", {"angle": 15}),
            AttackConfig("Rotate_45deg", "rotate", {"angle": 45}),
            AttackConfig("Rotate_90deg", "rotate", {"angle": 90}),
            AttackConfig("Blur_k3", "blur", {"kernel_size": 3}),
            AttackConfig("Blur_k5", "blur", {"kernel_size": 5}),
            AttackConfig("Blur_k7", "blur", {"kernel_size": 7}),
            AttackConfig("Noise_5", "noise", {"noise_level": 5.0}),
            AttackConfig("Noise_10", "noise", {"noise_level": 10.0}),
            AttackConfig("Noise_20", "noise", {"noise_level": 20.0}),
            AttackConfig("Bright_plus10", "brightness_contrast", {"alpha": 1.0, "beta": 25}),
            AttackConfig("Bright_minus10", "brightness_contrast", {"alpha": 1.0, "beta": -25}),
            AttackConfig("Contrast_plus10", "brightness_contrast", {"alpha": 1.1, "beta": 0}),
            AttackConfig("Contrast_minus10", "brightness_contrast", {"alpha": 0.9, "beta": 0}),
            AttackConfig("Gamma_0.8", "gamma", {"gamma": 0.8}),
            AttackConfig("Gamma_1.2", "gamma", {"gamma": 1.2}),
            AttackConfig("TextOverlay", "text_overlay", {"text": "DEMO", "alpha": 0.8}),
            AttackConfig("StickerOverlay", "sticker_overlay", {"size_frac": 0.2, "alpha": 1.0}),
            AttackConfig("WhatsApp_like", "pipeline_whatsapp", {}),
            AttackConfig("Instagram_like", "pipeline_instagram", {}),
            AttackConfig("Twitter_like", "pipeline_twitter", {}),
            AttackConfig("TikTok_like", "pipeline_tiktok", {}),
        ]

    def _get_attack_func(self, func_name: str):
        return getattr(AttackSimulator, func_name)

    def run_single(self, image_path: str) -> List[Dict[str, Any]]:
        image_path = str(image_path)
        img_pil = Image.open(image_path).convert("RGB")
        image_stem = Path(image_path).stem

        # Save LSB watermarked image and metadata to watermarked folder
        lsb_meta = self.lsb_embedder.embed(
            image_path=image_path,
            message=self.lsb_message,
            output_path=str(self.watermarked_dir / f"{image_stem}_lsb.png"),
            metadata_path=str(self.watermarked_dir / f"{image_stem}_lsb_metadata.json"),
        )
        lsb_img_path = lsb_meta["image_path"]
        lsb_metadata_path = lsb_meta["metadata_path"]

        capacity_bytes = self.semi_embedder.estimate_capacity_bytes(img_pil)
        if capacity_bytes == 0:
            raise ValueError("Image too small for semi-fragile embedding with current DWT/SVD settings.")

        semi_message = self.semi_message
        semi_message_bytes = semi_message.encode("utf-8")
        if len(semi_message_bytes) > capacity_bytes:
            # Truncate at a valid UTF-8 boundary
            truncated_bytes = semi_message_bytes[:capacity_bytes]
            # Find the last valid UTF-8 character boundary
            while truncated_bytes and truncated_bytes[-1] & 0xC0 == 0x80:
                truncated_bytes = truncated_bytes[:-1]
            semi_message = truncated_bytes.decode("utf-8", errors="ignore")
            actual_bytes = len(semi_message.encode("utf-8"))
            print(
                "⚠️ Semi-fragile message trimmed to "
                f"{actual_bytes} bytes "
                f"(capacity {capacity_bytes}) for {Path(image_path).name}."
            )

        semi_wm_img, semi_meta, semi_heat = self.semi_embedder.embed(img_pil, semi_message)
        
        # Save semi-fragile watermarked image to watermarked folder
        semi_wm_path = self.watermarked_dir / f"{image_stem}_semi.png"
        semi_wm_img.save(semi_wm_path)
        
        # Save semi-fragile metadata JSON to watermarked folder
        semi_meta_path = self.watermarked_dir / f"{image_stem}_semi_metadata.json"
        with semi_meta_path.open("w") as f:
            json.dump(semi_meta, f, indent=2)
        
        # Create visualization showing watermark locations
        params = self.semi_embedder.params
        location_map = create_watermark_location_map(
            img_shape=(img_pil.height, img_pil.width),
            metadata=semi_meta,
            block_size=params.block_size,
            band=params.band,
            wavelet=params.wavelet
        )
        
        # Create triple view: original, watermarked, location map
        triple_vis = triple_view(img_pil, semi_wm_img, location_map)
        triple_path = self.watermarked_dir / f"{image_stem}_semi_visualization.png"
        triple_vis.save(triple_path)
        
        # Also save individual location map
        loc_map_path = self.watermarked_dir / f"{image_stem}_semi_locations.png"
        location_map.save(loc_map_path)

        results: List[Dict[str, Any]] = []

        lsb_base = cv2.imread(lsb_img_path, cv2.IMREAD_COLOR)
        semi_base = cv2.cvtColor(np.array(semi_wm_img), cv2.COLOR_RGB2BGR)

        for ac in self.attacks:
            func = self._get_attack_func(ac.func_name)

            # Save attacked LSB images to tampered folder
            attacked_lsb = func(lsb_base.copy(), **ac.params)
            lsb_attacked_path = str(self.tampered_dir / f"{image_stem}_lsb_{ac.name}.png")
            cv2.imwrite(lsb_attacked_path, attacked_lsb)
            lsb_verdict = self.lsb_verifier.verify(lsb_attacked_path, lsb_metadata_path)

            results.append({
                "image_id": Path(image_path).name,
                "layer": "LSB",
                "attack": ac.name,
                "decode_success": lsb_verdict["decode_success"],
                "bit_accuracy": None,
                "fragile_match": lsb_verdict["fragile_match"],
                "verdict": lsb_verdict["verdict"],
            })

            # Save attacked semi-fragile images to tampered folder
            attacked_semi = func(semi_base.copy(), **ac.params)
            attacked_semi_pil = Image.fromarray(cv2.cvtColor(attacked_semi, cv2.COLOR_BGR2RGB))
            semi_attacked_path = self.tampered_dir / f"{image_stem}_semi_{ac.name}.png"
            attacked_semi_pil.save(semi_attacked_path)
            semi_res = self.semi_verifier.verify(attacked_semi_pil, semi_meta)

            results.append({
                "image_id": Path(image_path).name,
                "layer": "SemiFragile",
                "attack": ac.name,
                "decode_success": semi_res["decode_success"],
                "bit_accuracy": semi_res["bit_accuracy"],
                "fragile_match": None,
                "verdict": "N/A",
            })

        return results

    def run_batch(self, image_paths: List[str], csv_name: str = "results.csv") -> Path:
        rows: List[Dict[str, Any]] = []
        for p in image_paths:
            rows.extend(self.run_single(p))

        csv_path = self.output_dir / csv_name
        with csv_path.open("w", newline="") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=[
                    "image_id",
                    "layer",
                    "attack",
                    "decode_success",
                    "bit_accuracy",
                    "fragile_match",
                    "verdict",
                ],
            )
            writer.writeheader()
            for r in rows:
                writer.writerow(r)

        return csv_path
