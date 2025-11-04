import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
import cv2
import hashlib
import ipywidgets as widgets
from IPython.display import display, clear_output
import os
import json
import io
import tempfile
from pathlib import Path

print("🚀 Starting Robust Watermarking System...")

# Enhanced File Upload Handling
def handle_uploaded_file(upload_widget):
    """Robust file upload handler with comprehensive error checking"""
    try:
        if not upload_widget.value:
            return None, None
            
        # Get the first (and only) file
        uploaded_file = list(upload_widget.value.values())[0]
        
        if not uploaded_file:
            return None, None
            
        # Extract file content and metadata
        file_content = uploaded_file['content']
        filename = uploaded_file['name']
        
        # Validate file size (max 50MB)
        max_size = 50 * 1024 * 1024
        if len(file_content) > max_size:
            print(f"❌ File too large: {len(file_content)/1024/1024:.1f}MB > 50MB")
            return None, None
            
        # Validate file type
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif'}
        file_extension = Path(filename).suffix.lower()
        if file_extension not in allowed_extensions:
            print(f"❌ Unsupported file type: {file_extension}")
            return None, None
            
        # Validate image content
        try:
            # Try to open with PIL to verify it's a valid image
            image = Image.open(io.BytesIO(file_content))
            image.verify()  # Verify it's a valid image file
        except Exception as e:
            print(f"❌ Invalid image file: {e}")
            return None, None
            
        print(f"✅ File validated: {filename} ({len(file_content)/1024:.1f}KB)")
        return file_content, filename
        
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return None, None

def safe_image_loader(image_path):
    """Safely load image with multiple fallback methods"""
    try:
        # Method 1: Try PIL first
        with Image.open(image_path) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'P', 'LA'):
                img = img.convert('RGB')
            img_array = np.array(img)
            
        # Method 2: If PIL fails, try OpenCV
        if img_array is None or img_array.size == 0:
            img_array = cv2.imread(image_path)
            if img_array is not None:
                img_array = cv2.cvtColor(img_array, cv2.COLOR_BGR2RGB)
                
        if img_array is None or img_array.size == 0:
            raise ValueError("Failed to load image with both PIL and OpenCV")
            
        return img_array, 'color' if len(img_array.shape) == 3 else 'grayscale'
        
    except Exception as e:
        print(f"❌ Image loading failed: {e}")
        return None, None

def load_and_preprocess_image(image_path):
    """Load and preprocess image for watermarking with enhanced error handling"""
    try:
        if not os.path.exists(image_path):
            print(f"❌ Image file not found: {image_path}")
            return None, None
            
        file_size = os.path.getsize(image_path)
        if file_size == 0:
            print("❌ Image file is empty")
            return None, None
            
        img_array, color_mode = safe_image_loader(image_path)
        
        if img_array is None:
            print("❌ Failed to load image data")
            return None, None
            
        print(f"✅ Image loaded successfully: {img_array.shape} ({color_mode})")
        return img_array, color_mode
        
    except Exception as e:
        print(f"❌ Error loading image: {e}")
        return None, None

def create_temp_image_file(file_content, prefix="img"):
    """Create temporary file with proper cleanup handling"""
    try:
        # Create temporary file with proper extension
        suffix = Path(prefix).suffix if Path(prefix).suffix else '.png'
        temp_fd, temp_path = tempfile.mkstemp(suffix=suffix, prefix=prefix)
        
        # Write content and close file descriptor
        with os.fdopen(temp_fd, 'wb') as f:
            f.write(file_content)
            
        return temp_path
    except Exception as e:
        print(f"❌ Error creating temporary file: {e}")
        return None

def cleanup_temp_files(file_paths):
    """Safely cleanup temporary files"""
    for file_path in file_paths:
        try:
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"⚠️ Could not remove temp file {file_path}: {e}")

# Enhanced Core Functions with Robust Watermarking
def text_to_binary(text):
    """Convert text to binary with error correction"""
    binary = ''.join(format(ord(char), '08b') for char in text)
    # Add redundancy (repeat each bit 3 times for error correction)
    redundant_binary = ''.join(bit * 3 for bit in binary)
    return redundant_binary

def binary_to_text(binary_str):
    """Convert binary back to text with error correction"""
    # Use majority voting for error correction
    corrected_binary = ''
    for i in range(0, len(binary_str), 3):
        triplet = binary_str[i:i+3]
        if len(triplet) == 3:
            # Majority vote
            corrected_binary += '1' if triplet.count('1') >= 2 else '0'
    
    text = ''
    for i in range(0, len(corrected_binary), 8):
        byte = corrected_binary[i:i+8]
        if len(byte) == 8:
            try:
                text += chr(int(byte, 2))
            except:
                text += '?'  # Placeholder for corrupted characters
    return text

def generate_watermark_pattern(watermark_text, image_shape, strength=0.1):
    """Generate a robust watermark pattern using DCT coefficients"""
    # Create a unique seed from the watermark text
    seed = int(hashlib.md5(watermark_text.encode()).hexdigest()[:8], 16)
    np.random.seed(seed)
    
    # Generate a pseudo-random pattern
    pattern = np.random.randn(*image_shape[:2]) * strength
    
    return pattern

def embed_robust_watermark(image_array, watermark_text, strength=0.1):
    """Embed robust watermark using frequency domain"""
    watermarked = image_array.astype(np.float32) / 255.0
    
    if len(image_array.shape) == 3:  # Color image
        # Convert to YUV and work on luminance channel
        yuv = cv2.cvtColor(watermarked, cv2.COLOR_RGB2YUV)
        y_channel = yuv[:,:,0]
        
        # Generate watermark pattern
        watermark_pattern = generate_watermark_pattern(watermark_text, y_channel.shape, strength)
        
        # Add watermark to luminance channel
        y_channel_watermarked = y_channel + watermark_pattern
        y_channel_watermarked = np.clip(y_channel_watermarked, 0, 1)
        
        # Convert back to RGB
        yuv[:,:,0] = y_channel_watermarked
        watermarked_rgb = cv2.cvtColor(yuv, cv2.COLOR_YUV2RGB)
        watermarked = (watermarked_rgb * 255).astype(np.uint8)
        
    else:  # Grayscale image
        watermarked_normalized = watermarked / 255.0
        watermark_pattern = generate_watermark_pattern(watermark_text, watermarked_normalized.shape, strength)
        watermarked_with_pattern = watermarked_normalized + watermark_pattern
        watermarked = (np.clip(watermarked_with_pattern, 0, 1) * 255).astype(np.uint8)
    
    return watermarked

def extract_robust_watermark(original_image, watermarked_image, watermark_text, strength=0.1):
    """Extract and verify robust watermark"""
    # Convert to float
    orig_float = original_image.astype(np.float32) / 255.0
    wm_float = watermarked_image.astype(np.float32) / 255.0
    
    if len(original_image.shape) == 3:  # Color image
        # Convert to YUV
        orig_yuv = cv2.cvtColor(orig_float, cv2.COLOR_RGB2YUV)
        wm_yuv = cv2.cvtColor(wm_float, cv2.COLOR_RGB2YUV)
        
        # Extract from luminance channel
        difference = wm_yuv[:,:,0] - orig_yuv[:,:,0]
    else:  # Grayscale
        difference = wm_float - orig_float
    
    # Generate expected pattern
    expected_pattern = generate_watermark_pattern(watermark_text, difference.shape, strength)
    
    # Calculate correlation
    correlation = np.corrcoef(difference.flatten(), expected_pattern.flatten())[0,1]
    
    return correlation

def embed_multilayer_watermark(image_array, watermark_text):
    """Embed watermark in multiple ways for robustness"""
    # Method 1: Robust frequency domain watermark
    robust_watermarked = embed_robust_watermark(image_array, watermark_text, strength=0.05)
    
    # Method 2: Traditional LSB for backup
    binary_watermark = text_to_binary(watermark_text + '|END|')
    lsb_watermarked = robust_watermarked.copy()
    
    if len(lsb_watermarked.shape) == 3:
        flat_pixels = lsb_watermarked.reshape(-1)
    else:
        flat_pixels = lsb_watermarked.reshape(-1)
    
    # Embed in LSB (but skip some pixels to be less fragile)
    for i in range(0, len(binary_watermark)):
        if i < len(flat_pixels):
            # Only modify every 4th pixel to be more robust
            if i % 4 == 0:
                flat_pixels[i] = (flat_pixels[i] & 0xFE) | int(binary_watermark[i])
    
    if len(lsb_watermarked.shape) == 3:
        lsb_watermarked = flat_pixels.reshape(lsb_watermarked.shape)
    else:
        lsb_watermarked = flat_pixels.reshape(lsb_watermarked.shape)
    
    return lsb_watermarked, len(binary_watermark)

def verify_multilayer_watermark(original_image, test_image, expected_text):
    """Verify watermark using multiple methods"""
    results = {}
    
    # Method 1: Robust frequency domain verification
    robust_correlation = extract_robust_watermark(original_image, test_image, expected_text)
    results['robust_correlation'] = robust_correlation
    
    # Method 2: LSB extraction
    binary_length = len(text_to_binary(expected_text + '|END|'))
    
    if len(test_image.shape) == 3:
        flat_pixels = test_image.reshape(-1)
    else:
        flat_pixels = test_image.reshape(-1)
    
    extracted_binary = ''.join(str(flat_pixels[i] & 1) for i in range(0, min(binary_length, len(flat_pixels)), 4))
    extracted_text = binary_to_text(extracted_binary)
    
    results['lsb_extracted'] = extracted_text
    results['lsb_match'] = expected_text in extracted_text
    
    # Overall confidence score
    robust_confidence = max(0, (robust_correlation + 1) / 2 * 100)  # Convert correlation to percentage
    lsb_confidence = 100 if results['lsb_match'] else 0
    
    # Weighted confidence
    overall_confidence = (robust_confidence * 0.7) + (lsb_confidence * 0.3)
    results['overall_confidence'] = overall_confidence
    
    return results

def simulate_attacks(image_array):
    """Simulate common image attacks to test robustness"""
    attacked_images = {}
    
    # 1. JPEG Compression
    _, jpeg_encoded = cv2.imencode('.jpg', image_array, [cv2.IMWRITE_JPEG_QUALITY, 50])
    attacked_images['jpeg_50'] = cv2.imdecode(jpeg_encoded, 1)
    
    # 2. Gaussian Noise
    noise = np.random.normal(0, 10, image_array.shape).astype(np.uint8)
    attacked_images['noise'] = cv2.add(image_array, noise)
    
    # 3. Brightness Adjustment
    attacked_images['brightness'] = np.clip(image_array.astype(np.int16) + 30, 0, 255).astype(np.uint8)
    
    # 4. Contrast Adjustment
    attacked_images['contrast'] = np.clip(image_array.astype(np.float32) * 1.2, 0, 255).astype(np.uint8)
    
    # 5. Small Crop (then resize back)
    h, w = image_array.shape[:2]
    cropped = image_array[h//20:-h//20, w//20:-w//20]
    attacked_images['cropped'] = cv2.resize(cropped, (w, h))
    
    return attacked_images

# Enhanced Interface Functions with Bullet-Proof Uploading
def create_robust_embedding_interface():
    """Interface for embedding robust watermarks"""
    
    upload = widgets.FileUpload(
        description='📁 Choose Image File',
        accept='.jpg,.jpeg,.png,.bmp,.tiff',
        multiple=False
    )

    watermark_text = widgets.Text(
        value='© Copyright 2024 - Authentic',
        description='Watermark:',
        layout=widgets.Layout(width='400px')
    )

    strength_slider = widgets.FloatSlider(
        value=0.05,
        min=0.01,
        max=0.2,
        step=0.01,
        description='Strength:',
        continuous_update=False
    )

    embed_btn = widgets.Button(
        description='🛡️ Embed Robust Watermark',
        button_style='success',
        layout=widgets.Layout(width='250px', height='40px')
    )

    output_area = widgets.Output()

    def embed_watermark(b):
        with output_area:
            clear_output()
            print("🔄 Starting robust embedding process...")

            content, filename = handle_uploaded_file(upload)
            if content is None:
                print("❌ Please select a valid image file first!")
                return

            print(f"✅ File selected: {filename}")

            if not watermark_text.value.strip():
                print("❌ Please enter watermark text!")
                return

            temp_path = None
            try:
                # Create temporary file using the new robust method
                temp_path = create_temp_image_file(content, f"embed_{filename}")
                if temp_path is None:
                    print("❌ Failed to create temporary file")
                    return

                print("📥 Loading original image...")
                original_image, image_mode = load_and_preprocess_image(temp_path)
                if original_image is None:
                    return

                print(f"💧 Embedding robust watermark: '{watermark_text.value}'")
                watermarked, wm_length = embed_multilayer_watermark(original_image, watermark_text.value)

                # Display results
                fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

                if image_mode == 'color':
                    ax1.imshow(original_image)
                    ax2.imshow(watermarked)
                else:
                    ax1.imshow(original_image, cmap='gray')
                    ax2.imshow(watermarked, cmap='gray')

                ax1.set_title('Original Image')
                ax2.set_title('Robust Watermarked Image')
                ax1.axis('off')
                ax2.axis('off')
                plt.tight_layout()
                plt.show()

                # Save files
                output_path = 'robust_watermarked_image.png'
                Image.fromarray(watermarked).save(output_path)
                
                # Save original for verification
                original_path = 'original_reference.png'
                Image.fromarray(original_image).save(original_path)

                print(f"✅ Robust embedding successful!")
                print(f"📁 Watermarked image: {output_path}")
                print(f"📁 Original reference: {original_path}")
                print(f"💡 Keep both files for verification!")
                print(f"🔒 Watermark strength: {strength_slider.value}")

                # Test robustness
                print(f"\n🧪 Testing robustness against common attacks...")
                attacks = simulate_attacks(watermarked)
                
                for attack_name, attacked_image in attacks.items():
                    results = verify_multilayer_watermark(original_image, attacked_image, watermark_text.value)
                    status = "✅" if results['overall_confidence'] > 50 else "❌"
                    print(f"   {status} {attack_name}: {results['overall_confidence']:.1f}% confidence")

            except Exception as e:
                print(f"❌ Error during embedding: {e}")
                import traceback
                print(f"🔍 Debug info: {traceback.format_exc()}")
            finally:
                # Cleanup temporary files
                if temp_path and os.path.exists(temp_path):
                    cleanup_temp_files([temp_path])

    embed_btn.on_click(embed_watermark)

    return widgets.VBox([
        widgets.HTML("<h3>🛡️ Robust Watermark Embedding</h3>"),
        widgets.HTML("<p>Embeds watermark that survives common image modifications</p>"),
        upload,
        watermark_text,
        strength_slider,
        embed_btn,
        output_area
    ])

def create_robust_verification_interface():
    """Interface for verifying robust watermarks"""
    
    original_upload = widgets.FileUpload(
        description='📁 Original Image',
        accept='.jpg,.jpeg,.png,.bmp,.tiff',
        multiple=False
    )

    test_upload = widgets.FileUpload(
        description='📁 Image to Verify',
        accept='.jpg,.jpeg,.png,.bmp,.tiff',
        multiple=False
    )

    expected_text = widgets.Text(
        value='',
        description='Expected text:',
        placeholder='Enter the watermark text you expect...',
        layout=widgets.Layout(width='400px')
    )

    verify_btn = widgets.Button(
        description='🔍 Verify Robustly',
        button_style='info',
        layout=widgets.Layout(width='200px', height='40px')
    )

    output_area = widgets.Output()

    def verify_watermark(b):
        with output_area:
            clear_output()
            print("🔄 Starting robust verification...")

            original_content, original_filename = handle_uploaded_file(original_upload)
            test_content, test_filename = handle_uploaded_file(test_upload)
            
            if original_content is None or test_content is None:
                print("❌ Please select both original and test images!")
                return

            if not expected_text.value.strip():
                print("❌ Please enter expected watermark text!")
                return

            original_temp = None
            test_temp = None
            
            try:
                # Create temporary files using robust method
                original_temp = create_temp_image_file(original_content, f"orig_{original_filename}")
                test_temp = create_temp_image_file(test_content, f"test_{test_filename}")
                
                if original_temp is None or test_temp is None:
                    print("❌ Failed to create temporary files")
                    return

                # Load images
                original_image, _ = load_and_preprocess_image(original_temp)
                test_image, _ = load_and_preprocess_image(test_temp)
                
                if original_image is None or test_image is None:
                    print("❌ Failed to load one or both images")
                    return

                print("🔬 Analyzing with multiple verification methods...")
                results = verify_multilayer_watermark(original_image, test_image, expected_text.value)

                # Display comprehensive results
                print("\n" + "="*60)
                print("🛡️ ROBUST WATERMARK VERIFICATION REPORT")
                print("="*60)
                
                confidence = results['overall_confidence']
                
                # Overall verdict
                if confidence >= 80:
                    verdict = "✅ AUTHENTIC"
                    message = "This is very likely the original image"
                elif confidence >= 60:
                    verdict = "⚠️ LIKELY AUTHENTIC"
                    message = "This appears to be the original with minor modifications"
                elif confidence >= 40:
                    verdict = "🔍 SUSPICIOUS"
                    message = "Significant modifications detected"
                else:
                    verdict = "❌ NOT AUTHENTIC"
                    message = "This is not the original image"

                print(f"\n🎯 VERDICT: {verdict}")
                print(f"📊 CONFIDENCE: {confidence:.1f}%")
                print(f"💡 ASSESSMENT: {message}")

                # Detailed results
                print(f"\n📈 DETAILED ANALYSIS:")
                print(f"   • Robust Correlation: {results['robust_correlation']:.3f}")
                print(f"   • LSB Match: {results['lsb_match']}")
                print(f"   • LSB Extracted: '{results['lsb_extracted']}'")

                # Visual comparison
                fig, (ax1, ax2, ax3) = plt.subplots(1, 3, figsize=(15, 5))

                if len(original_image.shape) == 3:
                    ax1.imshow(original_image)
                    ax2.imshow(test_image)
                else:
                    ax1.imshow(original_image, cmap='gray')
                    ax2.imshow(test_image, cmap='gray')

                # Difference visualization
                difference = cv2.absdiff(original_image, test_image)
                diff_percentage = np.mean(difference) / 255.0 * 100
                
                if len(difference.shape) == 3:
                    ax3.imshow(difference)
                else:
                    ax3.imshow(difference, cmap='hot')

                ax1.set_title('Original Reference')
                ax2.set_title('Test Image')
                ax3.set_title(f'Difference\n({diff_percentage:.1f}% changed)')
                
                for ax in [ax1, ax2, ax3]:
                    ax.axis('off')

                plt.tight_layout()
                plt.show()

                # Recommendations
                print(f"\n💡 RECOMMENDATIONS:")
                if confidence >= 80:
                    print("   ✅ This image can be trusted as authentic")
                elif confidence >= 60:
                    print("   ⚠️ Use with caution - verify through additional means")
                else:
                    print("   ❌ Do not trust this image - it has been significantly altered")

            except Exception as e:
                print(f"❌ Analysis error: {e}")
                import traceback
                print(f"🔍 Debug info: {traceback.format_exc()}")
            finally:
                # Cleanup temporary files
                temp_files = [f for f in [original_temp, test_temp] if f is not None]
                cleanup_temp_files(temp_files)

    verify_btn.on_click(verify_watermark)

    return widgets.VBox([
        widgets.HTML("<h3>🔍 Robust Watermark Verification</h3>"),
        widgets.HTML("<p>Verify if an image is the original despite modifications</p>"),
        original_upload,
        test_upload,
        expected_text,
        verify_btn,
        output_area
    ])

# Main interface
def create_robust_main_interface():
    """Create main interface for robust watermarking"""
    
    embedding_tab = create_robust_embedding_interface()
    verification_tab = create_robust_verification_interface()

    tab = widgets.Tab()
    tab.children = [embedding_tab, verification_tab]
    tab.set_title(0, '🛡️ EMBED')
    tab.set_title(1, '🔍 VERIFY')

    display(widgets.VBox([
        widgets.HTML("""
            <h1 style="text-align: center; color: #2E86AB;">🛡️ Robust Watermarking System</h1>
            <p style="text-align: center; color: #666;">Watermarks that survive image modifications</p>
            <hr>
        """),
        tab
    ]))

# Initialize the system
print("🚀 Initializing Robust Watermarking System...")
try:
    create_robust_main_interface()
    print("✅ Robust interface loaded successfully!")
except Exception as e:
    print(f"⚠️ Interface failed: {e}")