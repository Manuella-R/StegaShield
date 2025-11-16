# Dataset Generation Guide

## Overview

The dataset generation system automatically creates:
1. **Watermarked images** - Original images with embedded watermarks
2. **Tampered images** - Watermarked images with various attacks applied
3. **Metadata** - JSON files containing embedding parameters and verification data

## How Dataset Generation Works

### Step 1: Original Images
- Place your images in `dataset/originals/`
- Supported formats: `.jpg`, `.jpeg`, `.png`, `.bmp`, `.tif`
- Images are automatically converted to grayscale for processing

### Step 2: Watermarked Generation
The system processes each original image:

1. **Loads the image** → Converts to grayscale
2. **Extracts ORB keypoints** → For geometric anchoring (typically 50-100 keypoints)
3. **Prepares payload**:
   - Converts message to bytes
   - Encodes with Reed-Solomon ECC (adds error correction)
   - Creates deterministic header (if Phase 2)
   - Signs with RSA (if Phase 2)
4. **Embeds in multiple domains**:
   - **DCT domain**: Embeds in mid-frequency DCT coefficients (8×8 blocks)
   - **DWT domain**: Embeds in LH band using quantization (16×16 blocks)
   - **SVD domain**: Embeds in singular values (8×8 blocks)
5. **Anchors to keypoints**: Embeds around ORB keypoints first for geometric resilience
6. **Computes fragile hash**: SHA-256 hash of high-frequency DCT coefficients
7. **Saves**:
   - Watermarked image → `dataset/watermarked/{image_name}_watermarked.png`
   - Metadata → `dataset/metadata/{image_name}_metadata.json`

### Step 3: Tampered Generation
For each watermarked image, the system:

1. **Selects random attacks** (default: 3 per image)
2. **Applies attacks** from the enhanced attack library:
   - **Removing**: `crop_corner`, `remove_region`
   - **Cropping**: `crop`
   - **Adding Content**: `add_text`, `add_logo`, `add_noise_patch`, `draw_rectangle`, `draw_circle`
   - **Image Processing**: `jpeg_compression`, `blur`, `rotate`, `noise`, `resize`, etc.
3. **Saves attacked images** → `dataset/tampered/{image_name}_{attack_name}.png`
4. **Creates tampered metadata** → `dataset/tampered_metadata.json`

### Step 4: Verification
The system verifies:
- **Watermarked images**: Should pass (decode success + fragile hash valid)
- **Tampered images**: Should detect tampering (decode may fail or fragile hash invalid)
- **Generates report** → `dataset/verification_results.json`

## Example Workflow

```python
from models.hybrid_multidomain_embed import HybridMultiDomainEmbedder
from training.utils_data import DatasetGenerator

# Initialize embedder
embedder = HybridMultiDomainEmbedder(
    ecc_symbols=20,
    alpha_dct=8,
    alpha_dwt=8,
    alpha_svd=10,
    redundancy=3
)

# Create dataset generator
dataset_gen = DatasetGenerator(
    originals_dir='dataset/originals',
    output_dir='dataset',
    embedder=embedder
)

# Generate watermarked dataset
message = "Copyright: My Dataset 2024"
metadata = dataset_gen.generate_watermarked_dataset(message=message)
# Result: Creates dataset/watermarked/ and dataset/metadata/

# Generate tampered dataset
attacks = [
    ('remove_region', {'x': 100, 'y': 100, 'width': 150, 'height': 150}),
    ('add_text', {'text': 'TAMPERED'}),
    ('crop_corner', {'crop_percent': 0.1}),
    # ... more attacks
]
tampered_metadata = dataset_gen.generate_tampered_dataset(
    attacks=attacks,
    num_attacks_per_image=3
)
# Result: Creates dataset/tampered/ with attacked images

# Verify dataset
results = dataset_gen.verify_dataset(verify_tampered=True)
# Result: Creates dataset/verification_results.json
```

## Enhanced Attacks Available

### Removing Attacks
- **`crop_corner`**: Removes corner of image (fills with white)
- **`remove_region`**: Removes specific rectangular region

### Cropping Attacks
- **`crop`**: Crops image from center (keeps center portion)

### Adding Content Attacks
- **`add_text`**: Adds text overlay (e.g., "WATERMARK", "TAMPERED")
- **`add_logo`**: Adds logo/watermark overlay
- **`add_noise_patch`**: Adds random noise patch
- **`draw_rectangle`**: Draws rectangle on image
- **`draw_circle`**: Draws circle on image

### Image Processing Attacks
- **`jpeg_compression`**: JPEG compression (quality 50-95)
- **`blur`**: Gaussian blur (kernel 3-7)
- **`rotate`**: Rotation (-15° to +15°)
- **`noise`**: Gaussian noise (various levels)
- **`resize`**: Downscale then upscale
- **`brightness`**: Brightness adjustment
- **`contrast`**: Contrast adjustment
- **`flip_horizontal`**: Horizontal flip
- **`flip_vertical`**: Vertical flip
- **`sharpen`**: Sharpening filter
- **`histogram_equalization`**: Histogram equalization

## Metadata Structure

### Watermarked Image Metadata
```json
{
  "payload_metadata": {
    "original_length": 25,
    "encoded_length": 45,
    "ecc_symbols": 20
  },
  "num_keypoints": 87,
  "keypoints": [[x, y, angle, response], ...],
  "fragile_hash": "abc123...",
  "embedding_params": {
    "alpha_dct": 8,
    "alpha_dwt": 8,
    "alpha_svd": 10,
    "redundancy": 3
  },
  "original_shape": [512, 512]
}
```

### Phase 2 Metadata (with header)
```json
{
  "payload_metadata": {
    "original_length": 25,
    "encoded_length": 45,
    "final_length": 309,  // With header + signature
    "signature_length": 256
  },
  "public_key_path": "path/to/public_key.pem",
  "has_deterministic_header": true,
  // ... same as above
}
```

## Output Structure

```
dataset/
├── originals/              # Your input images
│   ├── img01.jpg
│   ├── img02.jpg
│   └── ...
│
├── watermarked/            # Generated watermarked images
│   ├── img01_watermarked.png
│   ├── img02_watermarked.png
│   └── ...
│
├── tampered/               # Generated attacked images
│   ├── img01_remove_region.png
│   ├── img01_add_text.png
│   ├── img01_crop_corner.png
│   └── ...
│
├── metadata/               # Metadata for each image
│   ├── img01_metadata.json
│   ├── img02_metadata.json
│   └── ...
│
├── metadata.json           # Overall dataset metadata
├── tampered_metadata.json  # Tampered dataset metadata
└── verification_results.json  # Verification results
```

## Usage in Colab

```python
# In main.ipynb

# 1. Mount Drive
from google.colab import drive
drive.mount('/content/drive')
BASE_DIR = '/content/drive/MyDrive/project2'

# 2. Generate dataset
from training.utils_data import DatasetGenerator
from models.hybrid_multidomain_embed import HybridMultiDomainEmbedder

embedder = HybridMultiDomainEmbedder(ecc_symbols=20)
dataset_gen = DatasetGenerator(
    originals_dir=f'{BASE_DIR}/dataset/originals',
    output_dir=f'{BASE_DIR}/dataset',
    embedder=embedder
)

# Generate watermarked images
metadata = dataset_gen.generate_watermarked_dataset(
    message="Copyright: Dataset 2024"
)

# Generate tampered images (with enhanced attacks)
from training.attacks import AttackSimulator

attacks = [
    ('remove_region', {'x': 100, 'y': 100, 'width': 150, 'height': 150}),
    ('crop_corner', {'crop_percent': 0.1}),
    ('add_text', {'text': 'TAMPERED', 'position': (50, 50)}),
    ('add_noise_patch', {'patch_size': (50, 50)}),
    ('draw_rectangle', {'pt1': (50, 50), 'pt2': (200, 200)}),
    ('draw_circle', {'center': (150, 150), 'radius': 50}),
    # ... plus all image processing attacks
]

tampered_metadata = dataset_gen.generate_tampered_dataset(
    attacks=attacks,
    num_attacks_per_image=3
)
```

## Key Points

1. **Automatic Processing**: Just place images in `originals/` and run the generator
2. **Multiple Attacks**: Each image gets multiple random attacks applied
3. **Metadata Tracking**: All parameters and results are saved in JSON
4. **Verification**: Automatic verification of watermarked and tampered images
5. **Scalable**: Handles any number of images

## Tips

- **Image Size**: Works best with images 256×256 or larger
- **Message Length**: Keep messages under 50 characters for best results
- **Attack Selection**: More attacks = more comprehensive testing but longer processing time
- **Storage**: Ensure sufficient space for watermarked + tampered images (2-3x original size)

