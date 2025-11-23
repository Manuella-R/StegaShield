import argparse
import json
import sys
import traceback
from pathlib import Path

from stegashield_profiles import embed_image, verify_image


def _resolve(path_str: str) -> str:
    return str(Path(path_str).expanduser().resolve())


def _read_json(path_str: str):
    path = Path(path_str)
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def handle_embed(args):
    result = embed_image(
        image_path=_resolve(args.image),
        message=args.message or "",
        mode=args.mode,
        user_key=args.user_key,
        output_dir=_resolve(args.output_dir) if args.output_dir else None,
    )

    metadata = {}
    metadata_path = result.get("metadata_path")
    if metadata_path:
        metadata = _read_json(metadata_path)

    payload = {
        "mode": result.get("mode"),
        "image_path": result.get("image_path"),
        "metadata_path": metadata_path,
        "heatmap_path": result.get("heatmap_path"),
        "robust_metadata_path": result.get("robust_metadata_path"),
        "metadata": metadata,
    }
    return payload


def handle_verify(args):
    result = verify_image(
        image_path=_resolve(args.image),
        metadata_path=_resolve(args.metadata),
        mode=args.mode,
    )
    return result


def main():
    parser = argparse.ArgumentParser(description="StegaShield watermark CLI interface")
    subparsers = parser.add_subparsers(dest="command", required=True)

    embed_parser = subparsers.add_parser("embed", help="Embed watermark")
    embed_parser.add_argument("--image", required=True, help="Path to the input image")
    embed_parser.add_argument("--mode", default="hybrid", choices=["robust", "semi_fragile", "fragile", "hybrid"])
    embed_parser.add_argument("--message", default="", help="Payload message to embed")
    embed_parser.add_argument("--user-key", dest="user_key", help="Optional tenant key for payload derivation")
    embed_parser.add_argument("--output-dir", dest="output_dir", help="Directory to write generated artifacts")

    verify_parser = subparsers.add_parser("verify", help="Verify watermark")
    verify_parser.add_argument("--image", required=True, help="Path to the watermarked image")
    verify_parser.add_argument("--metadata", required=True, help="Path to the metadata JSON produced at embed time")
    verify_parser.add_argument("--mode", choices=["robust", "semi_fragile", "fragile", "hybrid"], help="Override profile mode")

    args = parser.parse_args()

    try:
        if args.command == "embed":
            data = handle_embed(args)
        elif args.command == "verify":
            data = handle_verify(args)
        else:
            raise ValueError(f"Unknown command: {args.command}")

        sys.stdout.write(json.dumps({"success": True, "data": data}))
        sys.exit(0)
    except Exception as exc:
        error_payload = {
            "success": False,
            "error": str(exc),
            "trace": traceback.format_exc(),
        }
        sys.stdout.write(json.dumps(error_payload))
        sys.exit(1)


if __name__ == "__main__":
    main()

