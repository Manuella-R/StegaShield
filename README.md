# Watermarking System - Project Structure

## Quick Start for Google Colab

1. **Upload your dataset** to `dataset/originals/` in Google Drive
2. **Open `notebooks/main.ipynb`** in Colab
3. **Run all cells** - it will:
   - Install dependencies
   - Generate watermarked dataset
   - Generate tampered dataset with attacks
   - Run robustness tests
   - Generate reports

## Project Structure

```
project2/
├── models/                    # Core watermarking models
│   ├── hybrid_multidomain_embed.py
│   ├── hybrid_multidomain_verify.py
│   ├── hybrid_multidomain_embed_det.py
│   ├── hybrid_multidomain_verify_det.py
│   ├── ml_watermark_models.py
│   └── __init__.py
│
├── training/                  # Training and utilities
│   ├── train_ml_watermark.py
│   ├── test_harness_md_det.py
│   ├── attacks.py             # Enhanced attack simulator
│   ├── utils_data.py          # Dataset generation utilities
│   └── __init__.py
│
├── notebooks/                 # Jupyter notebooks
│   ├── main.ipynb            # Main Colab notebook
│   └── ...
│
├── configs/                   # Configuration files
│   ├── default.yaml
│   └── model_config.yaml
│
├── outputs/                   # Output directories
│   ├── checkpoints/          # Model checkpoints
│   ├── logs/                 # Training logs
│   ├── eval_reports/         # Test results
│   └── visual_results/       # Visualizations
│
└── dataset/                  # Dataset directory
    ├── originals/            # ← PUT YOUR IMAGES HERE
    ├── watermarked/          # Generated watermarked images
    ├── tampered/             # Generated attacked images
    └── metadata/             # Metadata files
```

## Dataset Generation Workflow

### Step 1: Prepare Original Images
- Place your images in `dataset/originals/`
- Supported formats: `.jpg`, `.jpeg`, `.png`, `.bmp`, `.tif`

### Step 2: Generate Watermarked Dataset
The system will:
1. Read all images from `originals/`
2. Embed watermark in each image using:
   - DCT (Discrete Cosine Transform)
   - DWT (Discrete Wavelet Transform)  
   - SVD (Singular Value Decomposition)
   - ORB keypoint anchoring
3. Save watermarked images to `dataset/watermarked/`
4. Save metadata to `dataset/metadata/`

### Step 3: Generate Tampered Dataset
The system applies various attacks:
- **Removing**: `crop_corner`, `remove_region`
- **Cropping**: `crop`
- **Adding Content**: `add_text`, `add_logo`, `add_noise_patch`, `draw_rectangle`, `draw_circle`
- **Image Processing**: `jpeg_compression`, `blur`, `rotate`, `noise`, `resize`, `brightness`, `contrast`

Each watermarked image gets 3 random attacks applied.

### Step 4: Verification
- Verifies watermarked images (should pass)
- Verifies tampered images (should detect tampering)
- Generates `verification_results.json`

## Enhanced Attacks Available

### Removing Attacks
- `crop_corner`: Removes corner of image
- `remove_region`: Removes specific region (fills with color)

### Cropping Attacks
- `crop`: Crops image from center

### Adding Content Attacks
- `add_text`: Adds text overlay
- `add_logo`: Adds logo/watermark overlay
- `add_noise_patch`: Adds noisy patch
- `draw_rectangle`: Draws rectangle
- `draw_circle`: Draws circle

### Image Processing Attacks
- `jpeg_compression`: JPEG compression (quality 50-95)
- `blur`: Gaussian blur (kernel 3-7)
- `rotate`: Rotation (-15° to +15°)
- `noise`: Gaussian noise
- `resize`: Downscale then upscale
- `brightness`: Brightness adjustment
- `contrast`: Contrast adjustment
- `flip_horizontal`: Horizontal flip
- `flip_vertical`: Vertical flip
- `sharpen`: Sharpening filter
- `histogram_equalization`: Histogram equalization

## Usage in Colab

```python
# 1. Mount Drive
from google.colab import drive
drive.mount('/content/drive')

# 2. Set base directory
BASE_DIR = '/content/drive/MyDrive/project2'

# 3. Install dependencies
!pip install -q numpy opencv-python pillow scipy pywavelets reedsolo cryptography torch torchvision

# 4. Run main notebook
# Open notebooks/main.ipynb and run all cells
```

## Configuration

Edit `configs/default.yaml` to customize:
- Embedding parameters (alpha values, redundancy)
- Attack types and parameters
- Dataset generation settings
- Output directories

## Output Files

After running:
- `dataset/watermarked/`: All watermarked images
- `dataset/tampered/`: All attacked images
- `dataset/metadata/`: Metadata for each image
- `dataset/verification_results.json`: Verification results
- `outputs/eval_reports/`: Test harness results (CSV, JSON)
- `outputs/checkpoints/`: ML model checkpoints (if training)

## Troubleshooting

### Issue: "No module named 'models'"
**Solution**: Make sure you're running from project root and `models/` directory exists

### Issue: "Dataset directory not found"
**Solution**: Create `dataset/originals/` and add your images

### Issue: Import errors in Colab
**Solution**: Add project root to path:
```python
import sys
sys.path.insert(0, '/content/drive/MyDrive/project2')
```

## Next Steps

1. Upload your images to `dataset/originals/`
2. Open `notebooks/main.ipynb` in Colab
3. Run all cells
4. Check results in `outputs/eval_reports/`

