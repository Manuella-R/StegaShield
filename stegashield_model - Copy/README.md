# StegaShield No-ML Prototype

This project contains:

- LSB-based robust-ish watermark (HybridMultiDomainEmbedderDet / VerifierDet)
- Semi-fragile DWT–SVD watermark (SemiFragileEmbedderDwtSvd / VerifierDwtSvd)
- Rich attack suite (JPEG, crop, rotate, blur, noise, tonal, overlays, social media pipelines)
- Heatmaps to visualize watermark regions
- A Colab-ready `main.ipynb` to run evaluation on your image set.

## Profile-Based API

`stegashield_profiles.py` exposes two high-level helpers:

```python
from stegashield_profiles import embed_image, verify_image

embed_image("input.png", message="owner123", mode="robust")
verify_image("input_robust.png", "input_robust_metadata.json")
```

Supported modes:

| Profile Name              | `mode` value     | Description                                                                                   |
| ------------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| StegaShield Robust        | `robust`         | LSB-based watermark for survivability across compression and reposts.                         |
| StegaShield Guard         | `semi_fragile`   | DWT–SVD watermark that tolerates light processing but flags malicious edits with a heatmap.   |
| StegaShield Forensic      | `hybrid`         | Sequentially applies semi-fragile + robust layers to balance survivability and localization.  |
| StegaShield Fragile (R&D) | `fragile`        | Reserved future preset with stricter DWT/SVD thresholds for signature-like guarantees.        |

Each profile shares the same user payload derivation: provide a `message`, a per-tenant `user_key`, or both. The key is hashed (SHA-256) so that the same tenant ID can be embedded using different robustness presets.

## Wrapper Outputs

- All profiles emit `*_metadata.json` files that record the selected mode, derived payload hash, and pipeline-specific metadata.
- Semi-fragile and hybrid presets also emit `*_heatmap.png` to visualize where energy was injected and later detected.
- Hybrid mode stores both the combined metadata and the inner robust metadata so downstream verification can be chained automatically.

## Smoke Testing

- `tests/profile_smoke_test.py` builds a synthetic input image and runs the `embed_image`/`verify_image` pipeline for `robust`, `semi_fragile`, and `hybrid`.
- The script asserts hybrid BER ≈ 1.0 after the sequential embed, ensures heatmaps exist, and writes `tests/artifacts/smoke_summary.json`.
- `main_test.ipynb` wraps the same routine for Colab/notebook workflows and highlights how to extend the upcoming `fragile` preset by tightening `DwtSvdParams`.

## Future Work

- Finalize the `fragile` profile by tightening DWT/SVD thresholds, enabling tamper masks that flip with any single-pixel edit.
- Promote the profile table to your UI/report so each stakeholder (photographers, hospitals, universities, law firms) can pick a preset confidently.
- Extend `verify_image` to emit structured JSON verdicts suitable for dashboards or REST responses.
