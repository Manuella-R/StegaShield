# Deep Learning Architecture & Learning Paradigm

## Summary

**Yes, Phase 3 uses Deep Learning (CNNs), and it uses Supervised Learning.**

## Architecture Breakdown

### Phase 3: ML-Based Watermarking (Deep Learning)

#### 1. **Encoder Network** - U-Net Architecture
- **Type**: Deep Convolutional Neural Network (CNN)
- **Architecture**: U-Net style encoder-decoder
  - **Encoder path**: Downsampling with convolutional blocks (64→128→256→512 channels)
  - **Bottleneck**: Feature compression layer
  - **Decoder path**: Upsampling with skip connections
  - **Residual connection**: Adds watermark to original image
- **Layers**: 
  - Convolutional layers (`nn.Conv2d`)
  - Batch normalization (`nn.BatchNorm2d`)
  - ReLU activations
  - Max pooling and upsampling
- **Purpose**: Learns to embed binary messages into images invisibly

#### 2. **Decoder Network** - CNN
- **Type**: Lightweight Convolutional Neural Network
- **Architecture**: Sequential CNN
  - Convolutional layers: 64→128→256 channels
  - Adaptive average pooling
  - Final layer outputs message bits
- **Purpose**: Learns to extract embedded messages from watermarked images

#### 3. **Discriminator Network** - PatchGAN
- **Type**: Convolutional Neural Network (PatchGAN style)
- **Architecture**: 
  - Convolutional blocks with InstanceNorm
  - LeakyReLU activations
  - Outputs patch-level real/fake scores
- **Purpose**: Adversarial training to make watermarks visually undetectable

### Phase 1 & 2: Traditional Signal Processing (NOT Deep Learning)

- **DWT (Discrete Wavelet Transform)**: Mathematical transform
- **DCT (Discrete Cosine Transform)**: Mathematical transform  
- **SVD (Singular Value Decomposition)**: Linear algebra operation
- **ORB Keypoints**: Feature detection algorithm
- **No neural networks** - uses fixed mathematical operations

## Learning Paradigm: Supervised Learning

### Why Supervised?

The training uses **supervised learning** because:

1. **Clear Input-Output Pairs**:
   ```python
   Input:  (image, message)           # Known input
   Output: (watermarked_image, extracted_message)  # Known target
   ```

2. **Ground Truth Labels**:
   - **Message accuracy loss**: Compares extracted message to original message
   ```python
   message_loss = BCE_loss(decoded_messages, true_messages)
   ```
   - **Image fidelity loss**: Compares watermarked image to original
   ```python
   image_loss = MSE_loss(stego_images, original_images)
   ```

3. **Training Process**:
   ```python
   # For each training sample:
   - Input image: Known
   - Target message: Known (randomly generated but known)
   - Encoder embeds message → watermarked image
   - Decoder extracts message → predicted message
   - Loss = difference between predicted and true message
   - Backpropagation updates weights
   ```

4. **Loss Functions** (all require ground truth):
   - **BCE Loss**: Binary Cross-Entropy for message bits (needs true message)
   - **MSE Loss**: Mean Squared Error for image quality (needs original image)
   - **LPIPS Loss**: Perceptual loss (needs original image)
   - **Adversarial Loss**: Discriminator provides supervision signal

### Training Data Structure

```python
# Supervised learning setup:
for image in dataset:
    # Generate known message (ground truth)
    message = create_random_message()  # Known target
    
    # Forward pass
    watermarked = encoder(image, message)
    extracted = decoder(watermarked)
    
    # Compute loss (requires ground truth)
    loss = BCE_loss(extracted, message)  # Compare to true message
    loss += MSE_loss(watermarked, image)  # Compare to original image
    
    # Backpropagation (supervised)
    loss.backward()
    optimizer.step()
```

## Comparison: Phases 1-2 vs Phase 3

| Aspect | Phase 1-2 | Phase 3 |
|--------|-----------|---------|
| **Method** | Traditional signal processing | Deep learning (CNN) |
| **Architecture** | Fixed algorithms (DWT, DCT, SVD) | Neural networks (U-Net, CNN) |
| **Learning** | No learning (rule-based) | Supervised learning |
| **Training** | Not required | Requires training data |
| **Flexibility** | Fixed embedding rules | Learns optimal embedding |
| **Robustness** | Hand-crafted | Learned from attacks |

## Key Deep Learning Components

### 1. Convolutional Layers
```python
nn.Conv2d(in_channels, out_channels, kernel_size, padding)
```
- Learn spatial patterns for embedding/extraction
- Shared weights across spatial locations

### 2. Batch Normalization
```python
nn.BatchNorm2d(channels)
```
- Stabilizes training
- Speeds up convergence

### 3. Skip Connections (U-Net)
- Preserves fine details during upsampling
- Helps with image reconstruction quality

### 4. Adversarial Training
- Discriminator provides supervision signal
- Encoder learns to fool discriminator
- Improves visual quality

## Training Details

### Curriculum Learning
- **Early epochs**: Few/no attacks (easy)
- **Later epochs**: More attacks (hard)
- Gradually increases difficulty

### Loss Functions
1. **Message Loss** (BCE): Ensures correct extraction
2. **Image Loss** (MSE): Maintains visual quality
3. **Perceptual Loss** (LPIPS): Human-perceived quality
4. **Adversarial Loss**: Makes watermark invisible
5. **TV Loss**: Smoothness regularization

### Attack Augmentation
- JPEG compression
- Gaussian blur
- Gaussian noise
- Random resize
- Random crop

## Summary

✅ **Deep Learning**: Yes - Uses CNNs (U-Net, PatchGAN)  
✅ **Supervised Learning**: Yes - Requires ground truth (messages and images)  
❌ **Unsupervised Learning**: No - Not used  
❌ **Reinforcement Learning**: No - Not used  

The system learns from examples: given an image and a message, it learns to embed the message invisibly and extract it reliably, even after attacks.

