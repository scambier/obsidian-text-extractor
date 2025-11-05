# VLM and YOLO Integration Guide

This document describes the new Vision Language Model (VLM) and YOLO object detection features added to the Obsidian Text Extractor plugin.

## Overview

The plugin now supports three advanced extraction methods in addition to the existing Tesseract OCR:

1. **Vision Language Models (VLM)** - API-based text extraction using state-of-the-art vision models
2. **YOLO Object Detection** - Local object detection running in the browser
3. **Combined YOLO + VLM** - Use YOLO to detect objects, then enhance descriptions with VLM

## Features

### Vision Language Models (VLM)

VLM provides superior text extraction and image understanding compared to traditional OCR. It can:
- Extract text from complex layouts
- Understand context and relationships
- Handle handwriting and stylized fonts better
- Provide descriptions of image content

**Supported Providers:**
- **OpenAI GPT-4 Vision** (gpt-4o, gpt-4-turbo, etc.)
- **Anthropic Claude** (claude-3-5-sonnet, claude-3-opus, etc.)
- **Google Gemini** (gemini-1.5-flash, gemini-1.5-pro)

**Configuration:**
- Enable/disable VLM in settings
- Choose your preferred provider
- Enter your API key (stored locally)
- Customize the model name (optional)
- Customize the prompt (optional)
- Set max tokens for response

### YOLO Object Detection

YOLO provides fast, accurate object detection running entirely in your browser using ONNX Runtime Web. Features include:
- Local processing (no API calls)
- Detection of 80 object classes (COCO dataset)
- Adjustable confidence threshold
- Option to combine with VLM for richer descriptions

**Configuration:**
- Enable/disable YOLO in settings
- Provide custom model URL (optional, defaults to YOLOv8n)
- Adjust confidence threshold (0.0 - 1.0)
- Enable "Combine with VLM" for enhanced descriptions

### Extraction Priority

When multiple extraction methods are enabled, the priority order is:
1. YOLO (if enabled)
2. VLM (if enabled and API key provided)
3. System OCR (if enabled on macOS)
4. Tesseract (default fallback)

## Architecture

### New Files

#### Library (`lib/src/`)
- `vlm/vlm-manager.ts` - VLM API client and manager
- `yolo/yolo-manager.ts` - YOLO inference and object detection
- `types.ts` - Updated with VLM and YOLO types

#### Plugin (`plugin/src/`)
- `settings.ts` - Extended with VLM and YOLO settings UI
- `main.ts` - Updated to pass settings to extraction functions

### Data Flow

```
User triggers extraction
    ↓
Plugin checks enabled extraction methods
    ↓
Settings converted to extraction options
    ↓
extractText() routes to appropriate manager
    ↓
Manager checks cache
    ↓
If not cached:
  - VLM: API call to provider
  - YOLO: ONNX inference in browser
  - YOLO+VLM: Detect objects → enhance with VLM
    ↓
Result cached with extraction method tag
    ↓
Text returned to user
```

### Cache Strategy

Each extraction method stores results with a unique identifier:
- `vlm-openai`, `vlm-anthropic`, `vlm-google`
- `yolo`
- `yolo+vlm-{provider}`

This allows switching between methods without losing cached results.

## API Keys

### Getting API Keys

**OpenAI:**
1. Visit https://platform.openai.com/api-keys
2. Create a new API key
3. Copy and paste into Text Extractor settings

**Anthropic:**
1. Visit https://console.anthropic.com/settings/keys
2. Create a new API key
3. Copy and paste into Text Extractor settings

**Google:**
1. Visit https://aistudio.google.com/apikey
2. Create a new API key
3. Copy and paste into Text Extractor settings

### API Key Security

- API keys are stored in Obsidian's data.json file
- Keys are not synced if you exclude the `.obsidian` folder from sync
- Consider using environment variables for shared vaults
- Never commit API keys to version control

## Cost Considerations

### VLM API Costs (Approximate)

**OpenAI GPT-4 Vision (gpt-4o):**
- Input: ~$2.50 per 1M tokens
- Images: ~$0.00425 per image (at 512x512)

**Anthropic Claude (claude-3-5-sonnet):**
- Input: ~$3.00 per 1M tokens
- Images: ~$0.00048 per image (at 512x512)

**Google Gemini (gemini-1.5-flash):**
- Input: Free tier available
- Images: ~$0.00013 per image

### YOLO Costs

YOLO runs locally in your browser, so there are:
- **No API costs**
- **No data sent externally**
- Minimal compute requirements (runs on CPU)

## Performance

### VLM Performance
- **Latency:** 1-5 seconds per image (network dependent)
- **Accuracy:** Superior for complex layouts and handwriting
- **Internet:** Required

### YOLO Performance
- **Latency:** 0.5-2 seconds per image (hardware dependent)
- **Accuracy:** 80+ object classes from COCO dataset
- **Internet:** Only for initial model download

## Model Information

### YOLO Model

**Default Model:** YOLOv8n (nano)
- Size: ~6MB
- Speed: Very fast
- Accuracy: Good for most use cases
- Classes: 80 COCO object classes

**Custom Models:**
You can provide your own ONNX model URL in settings. Requirements:
- Model must be in ONNX format
- Input shape: [1, 3, 640, 640] (batch, RGB channels, height, width)
- Output format: YOLO detection format

**Converting Models:**
Use Ultralytics to export custom YOLO models:
```python
from ultralytics import YOLO
model = YOLO('yolov8n.pt')
model.export(format='onnx')
```

## Usage Examples

### Basic VLM Extraction

1. Open settings
2. Enable "Use VLM"
3. Select provider (e.g., OpenAI)
4. Enter API key
5. Right-click an image → Text Extractor → Extract text

### YOLO Object Detection

1. Open settings
2. Enable "Use YOLO"
3. Adjust confidence threshold if needed
4. Right-click an image → Text Extractor → Extract text
5. Receive object list description

### Combined YOLO + VLM

1. Enable both VLM and YOLO in settings
2. Enable "Combine YOLO with VLM"
3. Extract text from image
4. YOLO detects objects → VLM provides rich description

### Custom Prompts

Customize the VLM prompt for specific use cases:

**For math equations:**
```
Extract all mathematical equations and formulas from this image in LaTeX format.
```

**For diagrams:**
```
Describe this diagram in detail, including all labels, arrows, and relationships between components.
```

**For screenshots:**
```
Extract all visible text from this screenshot, preserving the layout and structure.
```

## Troubleshooting

### VLM Issues

**"API key not provided" error:**
- Verify API key is entered in settings
- Check for extra spaces or characters

**"Forbidden - 403" error:**
- API key may be invalid or expired
- Check your API provider account status

**Slow extraction:**
- Network latency can vary
- Consider using a faster model (e.g., gemini-1.5-flash)

### YOLO Issues

**"Failed to load YOLO model":**
- Check internet connection for initial download
- Verify model URL is correct (if using custom model)
- Clear browser cache and retry

**Low detection accuracy:**
- Adjust confidence threshold in settings
- Try a larger model (e.g., YOLOv8m or YOLOv8l)

**Slow inference:**
- YOLO runs on CPU in browser
- Performance varies by device
- Consider using smaller images

## Development

### Building

The project requires the following tools:
- Node.js and pnpm
- Rust and cargo (for PDF extraction WASM)
- wasm-pack (for building WASM modules)

**Install dependencies:**
```bash
cd lib
pnpm install
```

**Build library:**
```bash
cd lib
pnpm run build
```

**Build plugin:**
```bash
cd plugin
pnpm run build
```

### Testing VLM Integration

To test VLM without API costs:
1. Use Google Gemini Flash (free tier)
2. Start with small test images
3. Monitor API usage in provider dashboard

### Testing YOLO

To test YOLO locally:
1. Enable YOLO in settings
2. Use sample images with common objects
3. Check browser console for inference logs

## Future Enhancements

Potential improvements for future versions:
- Support for additional VLM providers (e.g., Replicate, Together AI)
- Custom YOLO training for specific object classes
- Batch processing for multiple images
- OCR + YOLO hybrid mode
- Model caching for faster YOLO startup
- WebGPU acceleration for YOLO
- Streaming responses for VLM

## License

This integration maintains the same AGPL-3.0 license as the base plugin.

## Contributing

Contributions are welcome! Areas for improvement:
- Additional VLM providers
- Better error handling
- Performance optimizations
- UI/UX enhancements
- Documentation improvements

Please open an issue before starting major work to discuss the approach.

## Credits

- **VLM Providers:** OpenAI, Anthropic, Google
- **YOLO:** Ultralytics YOLOv8
- **ONNX Runtime:** Microsoft ONNX Runtime Web
- **Original Plugin:** Simon Cambier (scambier)
