import json
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from stegashield_profiles import embed_image, verify_image


def _make_test_image(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    h, w = 256, 256
    gradient = np.tile(np.linspace(0, 255, w, dtype=np.uint8), (h, 1))
    img = np.stack([gradient, gradient, gradient], axis=-1)
    Image.fromarray(img, mode="RGB").save(path)


def _assert(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def run_smoke_tests() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    artifacts = repo_root / "tests" / "artifacts"
    if artifacts.exists():
        shutil.rmtree(artifacts)
    artifacts.mkdir(parents=True, exist_ok=True)

    base_image = artifacts / "smoke_input.png"
    _make_test_image(base_image)

    summary = {}
    for mode in ("robust", "semi_fragile", "hybrid"):
        # Use a short payload to satisfy semi-fragile capacity (~10 bytes max at 256x256).
        payload_message = f"Smoke{mode[0].upper()}"
        embed_info = embed_image(
            image_path=str(base_image),
            message=payload_message,
            user_key=None,
            mode=mode,
            output_dir=str(artifacts / mode),
        )
        verify_report = verify_image(
            embed_info["image_path"],
            embed_info["metadata_path"],
            mode=mode,
        )

        if mode == "robust":
            robust_report = verify_report["robust_report"]
            _assert(
                robust_report["verdict"] == "AUTHENTIC",
                f"Robust verdict not AUTHENTIC: {robust_report['verdict']}",
            )
            summary[mode] = {
                "verdict": robust_report["verdict"],
                "decoded_message": robust_report.get("decoded_message"),
            }
        elif mode == "semi_fragile":
            semi_report = verify_report["semi_fragile_report"]
            _assert(semi_report["decode_success"], "Semi-fragile decode failed")
            _assert(
                semi_report["bit_accuracy"] >= 0.98,
                f"Semi-fragile bit accuracy too low: {semi_report['bit_accuracy']}",
            )

            heatmap_path = Path(embed_info["heatmap_path"])
            _assert(heatmap_path.exists(), "Semi-fragile heatmap missing")

            summary[mode] = {
                "bit_accuracy": semi_report["bit_accuracy"],
                "heatmap": str(heatmap_path),
            }
        else:  # hybrid
            semi_report = verify_report["semi_fragile_report"]
            robust_report = verify_report["robust_report"]
            _assert(semi_report["decode_success"], "Hybrid: semi decode failed")
            _assert(
                semi_report["bit_accuracy"] >= 0.98,
                f"Hybrid: semi bit accuracy too low ({semi_report['bit_accuracy']})",
            )
            _assert(
                robust_report["verdict"] == "AUTHENTIC",
                f"Hybrid: robust verdict not AUTHENTIC ({robust_report['verdict']})",
            )

            heatmap_path = Path(embed_info["heatmap_path"])
            _assert(heatmap_path.exists(), "Hybrid heatmap missing")
            combined_meta = Path(embed_info["metadata_path"])
            _assert(combined_meta.exists(), "Hybrid metadata missing")

            summary[mode] = {
                "bit_accuracy": semi_report["bit_accuracy"],
                "robust_verdict": robust_report["verdict"],
                "heatmap": str(heatmap_path),
            }

    summary_path = artifacts / "smoke_summary.json"
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print("✅ Smoke tests passed for profiles:")
    for mode, stats in summary.items():
        print(f"  - {mode}: {stats}")
    print(f"Summary saved to {summary_path}")


if __name__ == "__main__":
    run_smoke_tests()

