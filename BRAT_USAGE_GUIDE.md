# Text Extractor - BRAT Installation & Usage Guide

## Installation via BRAT

### 1. Install BRAT
1. Open Obsidian Settings
2. Navigate to **Community Plugins**
3. Click **Browse** and search for "BRAT"
4. Install **Obsidian42 - BRAT**
5. Enable BRAT

### 2. Add Text Extractor
1. Open **Settings → BRAT**
2. Click **Add Beta Plugin**
3. Enter: `brian604/obsidian-text-extractor`
4. (Optional) Specify branch: `claude/obsidian-text-extractor-011CUpHng8iTXrn62SXuHocz`
5. Click **Add Plugin**
6. Enable "Text Extractor" in **Settings → Community Plugins**

### 3. BRAT Updates
BRAT will automatically check for updates. To manually update:
- Open **Settings → BRAT**
- Click **Check for updates**
- Click **Update** next to Text Extractor

---

## Use Case 1: Extract Text from Screenshots (VLM)

**Scenario:** You take screenshots of articles, tweets, or code snippets and want to make them searchable in Obsidian.

### Setup:
1. Open **Settings → Text Extractor**
2. Enable **Use VLM**
3. Select provider (recommend: **Google Gemini** for free tier)
4. Get API key:
   - Visit https://aistudio.google.com/apikey
   - Click **Create API Key**
   - Copy and paste into Text Extractor settings
5. Leave other settings as default

### Usage:
1. Add a screenshot to your vault (e.g., `screenshots/article.png`)
2. Right-click the image in file explorer
3. Select **Text Extractor → Extract text to clipboard**
4. Wait 2-5 seconds
5. Paste the extracted text anywhere!

**Result:** VLM extracts text with better accuracy than traditional OCR, especially for:
- Stylized fonts
- Handwriting
- Complex layouts
- Low resolution images
- Code screenshots with syntax highlighting

### Example:
```markdown
## My Notes
![[screenshot-article.png]]

Extracted text:
[Paste here - VLM will extract the article text perfectly]
```

---

## Use Case 2: Describe Diagrams and Charts (VLM + Custom Prompt)

**Scenario:** You have diagrams, flowcharts, or infographics that you want to convert into searchable descriptions.

### Setup:
1. Same VLM setup as Use Case 1
2. In Text Extractor settings, set **Custom Prompt**:
   ```
   Describe this diagram in detail. Include all labels, arrows,
   connections, and explain the relationships between components.
   Organize your description with bullet points.
   ```

### Usage:
1. Add diagram to vault (e.g., `diagrams/system-architecture.png`)
2. Right-click → **Text Extractor → Extract text into a new note**
3. VLM creates a detailed description
4. The new note includes both the image and description

**Result:** You get a detailed textual description of visual information that's now searchable!

### Example Output:
```markdown
# system-architecture Description

## Components:
- Frontend Layer: React application with Redux state management
- API Gateway: Node.js Express server handling authentication
- Backend Services:
  - User Service (connects to PostgreSQL)
  - Payment Service (connects to Stripe API)
  - Notification Service (uses WebSockets)
- Database Layer: PostgreSQL for user data, Redis for caching

## Connections:
- Frontend communicates with API Gateway via HTTPS
- API Gateway routes requests to appropriate backend services
- Services share Redis cache for session management
...

![[diagrams/system-architecture.png]]
```

---

## Use Case 3: Catalog Objects in Photos (YOLO)

**Scenario:** You have photos of your workspace, bookshelves, or collections and want to catalog what's in them.

### Setup:
1. Open **Settings → Text Extractor**
2. Enable **Use YOLO**
3. Set **Confidence Threshold** to `0.5` (default)
4. Model will download automatically (~6MB) on first use

### Usage:
1. Add photo to vault (e.g., `photos/desk-setup.jpg`)
2. Right-click → **Text Extractor → Extract text to clipboard**
3. Wait 1-2 seconds for local processing
4. Paste the object list

**Result:** Fast, local object detection with no API costs!

### Example Output:
```
This image contains: a laptop, a keyboard, a mouse, 2 books,
a cup, a potted plant, a clock.
```

**Perfect for:**
- Documenting workspace setups
- Cataloging book collections
- Inventory tracking
- Photo organization

---

## Use Case 4: Rich Image Descriptions (YOLO + VLM Combined)

**Scenario:** You want both object detection AND detailed contextual descriptions.

### Setup:
1. Enable both **VLM** and **YOLO** in settings
2. Enable **Combine YOLO with VLM**
3. Configure both API key and YOLO settings

### Usage:
1. Add image to vault (e.g., `travel/paris-cafe.jpg`)
2. Right-click → **Text Extractor → Extract text into a new note**
3. Wait 3-7 seconds
4. Get detailed, context-aware description

**Result:** YOLO quickly identifies objects, then VLM provides rich context!

### Example Output:
```markdown
# paris-cafe Description

This image captures a charming Parisian café scene. In the foreground,
there's a small round table with two chairs positioned on the sidewalk.
On the table sits a cup of coffee and a croissant on a plate. Behind
the seating area, the café's large windows reveal a cozy interior with
warm lighting. A bicycle is parked against the building's facade. The
architecture features classic Parisian elements with cream-colored
walls and ornate details. Pedestrians can be seen walking along the
street in the background, and there's a potted plant adding greenery
to the scene.

Objects detected: person, bicycle, chair, cup, potted plant, dining table

![[travel/paris-cafe.jpg]]
```

---

## Use Case 5: Extract Math Equations (VLM with Custom Prompt)

**Scenario:** You photograph whiteboard notes with equations and want them in LaTeX format.

### Setup:
1. Enable VLM
2. Set **Custom Prompt**:
   ```
   Extract all mathematical equations and formulas from this image.
   Format them in LaTeX. Preserve the equation structure and numbering.
   ```
3. (Optional) Use **Anthropic Claude** for better math understanding

### Usage:
1. Take photo of whiteboard/textbook
2. Add to vault: `notes/calculus-lecture.jpg`
3. Extract text
4. Paste into note with LaTeX rendering

**Result:** Equations extracted in proper LaTeX format!

### Example Output:
```latex
$$\int_{a}^{b} f(x) \, dx = F(b) - F(a)$$

$$\frac{d}{dx}[f(g(x))] = f'(g(x)) \cdot g'(x)$$

$$\lim_{x \to \infty} \frac{1}{x} = 0$$
```

---

## Use Case 6: Batch Process Meeting Notes

**Scenario:** You photographed multiple whiteboard sessions and want to create notes for all.

### Setup:
1. Configure VLM (recommended: GPT-4o for complex layouts)
2. Set prompt:
   ```
   Extract all text, bullet points, diagrams, and action items
   from this whiteboard. Organize by sections.
   ```

### Usage:
1. Add all photos to `meetings/2024-01-15/` folder
2. For each photo:
   - Right-click → Extract text into a new note
3. VLM creates separate note for each board

**Result:** Searchable meeting notes with embedded images!

### Folder Structure:
```
meetings/
  └─ 2024-01-15/
      ├─ board-1.jpg
      ├─ board-1 Description.md
      ├─ board-2.jpg
      ├─ board-2 Description.md
      └─ board-3.jpg
      └─ board-3 Description.md
```

---

## Use Case 7: Traditional OCR (Tesseract - Free, No API)

**Scenario:** Simple text extraction without API costs.

### Setup:
1. In Text Extractor settings, ensure VLM and YOLO are **disabled**
2. Select OCR Languages (e.g., `eng`, `fra`)
3. (macOS only) Enable **Use system OCR** for better performance

### Usage:
1. Add scanned document: `receipts/grocery-2024-01.jpg`
2. Right-click → Extract text
3. Traditional OCR extracts the text

**Result:** Free, local text extraction!

**Best for:**
- Clean, high-resolution scans
- Printed text (not handwritten)
- Simple layouts
- Privacy-sensitive documents

---

## Comparison: When to Use Which Method

| Feature | Tesseract | System OCR | YOLO | VLM |
|---------|-----------|------------|------|-----|
| **Cost** | Free | Free | Free | Paid |
| **Speed** | Slow (2-10s) | Fast (1-3s) | Fast (1-2s) | Medium (2-5s) |
| **Accuracy** | Good | Good | N/A | Excellent |
| **Use Case** | Printed text | Printed text | Objects | Everything |
| **Internet** | Yes (first use) | No | First download | Yes |
| **Platform** | All | macOS only | All | All |
| **Privacy** | Local | Local | Local | API call |

### Recommendations:

**For text extraction:**
- Simple documents → **Tesseract** or **System OCR** (free)
- Complex layouts → **VLM** (OpenAI or Claude)
- Handwriting → **VLM** (Claude or GPT-4)
- Quick scans → **System OCR** (macOS)

**For descriptions:**
- Object listing → **YOLO** (free, fast)
- Rich context → **VLM** (best quality)
- Both → **YOLO + VLM** (comprehensive)

**For batch processing:**
- Budget-friendly → **Gemini** (free tier)
- Best quality → **Claude** or **GPT-4**

---

## Advanced Tips

### 1. Custom YOLO Models
If you have specific objects to detect:
1. Train custom YOLOv8 model
2. Export to ONNX format
3. Host model file online
4. Enter URL in Text Extractor settings

### 2. API Cost Optimization
- Use **Gemini Flash** for routine tasks (cheapest)
- Use **Claude** for complex documents
- Use **GPT-4o** for mixed content
- Enable YOLO first to pre-filter images

### 3. Caching
- Text Extractor caches all results
- Re-extracting same file uses cache (free)
- Clear cache in settings if you change methods

### 4. Omnisearch Integration
Text Extractor integrates with Omnisearch plugin:
1. Install Omnisearch
2. Omnisearch automatically uses Text Extractor
3. All images become searchable in your vault

---

## Troubleshooting

### "API key not provided"
- Check API key is entered in settings
- No extra spaces or line breaks
- Verify key is valid (test in provider console)

### "Failed to load YOLO model"
- Check internet connection
- Clear browser cache
- Try different model URL

### Slow extraction
- VLM: Try faster model (Gemini Flash)
- YOLO: Normal on slower devices
- Tesseract: Use System OCR instead (macOS)

### Poor accuracy
- Tesseract: Increase image resolution
- YOLO: Lower confidence threshold
- VLM: Try Claude for better understanding

---

## Cost Estimates (1000 Images)

### VLM Costs:
- **Gemini Flash**: ~$0.13 (or FREE with free tier)
- **GPT-4o**: ~$4.25
- **Claude Sonnet**: ~$0.48

### Free Alternatives:
- **YOLO**: $0 (runs locally)
- **Tesseract**: $0 (runs locally)
- **System OCR**: $0 (macOS built-in)

---

## Getting Help

- **Issues**: https://github.com/brian604/obsidian-text-extractor/issues
- **Documentation**: See VLM_YOLO_INTEGRATION.md
- **Updates**: BRAT checks automatically

---

## Next Steps

1. ✅ Install via BRAT
2. ✅ Choose your extraction method
3. ✅ Configure API keys (if using VLM)
4. ✅ Test with a few images
5. ✅ Adjust settings based on results
6. ✅ Enjoy searchable images in Obsidian!
