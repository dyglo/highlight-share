## Quote Highlight Studio

A single-page app to compose styled quote graphics (like the John 10:10 reference) and export them in multiple social media sizes.

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Header: Logo · Export dropdown (4 sizes) · Download│
├──────────────────────┬──────────────────────────────┤
│                      │  Controls panel (scrollable) │
│   Live Canvas        │  ─ Title text + size         │
│   (preview, scaled   │  ─ Body text                 │
│    to chosen format) │  ─ Font picker (title/body)  │
│                      │  ─ Font size + alignment     │
│                      │  ─ Text color                │
│                      │  ─ Highlight color           │
│                      │  ─ Background color/texture  │
│                      │  ─ Aspect ratio selector     │
└──────────────────────┴──────────────────────────────┘
```

### Core features

1. **Editable title + body** — separate fields, like "JOHN 10:10" header above the quote.
2. **Highlighting (dual mode)**:
   - Drag-select any text → click "Highlight" button to wrap selection.
   - Word toggle mode → click any word in preview to toggle highlight on/off.
   - "Clear all highlights" action.
3. **Font picker** — curated ~12 Google Fonts, mixing serif (Playfair Display, Lora, Merriweather, EB Garamond), sans (Inter, Bebas Neue, Anton, Oswald), display (Archivo Black, Abril Fatface), script (Caveat, Dancing Script). Independent fonts for title and body.
4. **Customization**: font size sliders, alignment (left/center/right), text color, highlight color (with paper-yellow default), background — solid color picker + 4 paper/texture presets.
5. **Export sizes** (toggle to switch canvas + download):
   - Instagram Square 1080×1080
   - Instagram Story/Reel 1080×1920
   - Threads/Twitter 1200×1200
   - Facebook Post 1200×630
6. **Download** — render canvas to PNG via `html-to-image`, filename includes format.

### Technical approach

- **Stack**: existing TanStack Start + Tailwind v4 + shadcn. Fully client-side, no backend.
- **Route**: replace placeholder `src/routes/index.tsx` with the editor.
- **State**: single `useState` store for `{ title, body, segments[], titleFont, bodyFont, fontSize, align, textColor, highlightColor, background, format }`. Body text stored as an array of segments `{ text, highlighted }` so word-toggle and selection both produce the same shape.
- **Canvas**: a fixed-resolution div (e.g. 1080×1080) absolutely positioned and CSS-scaled to fit the preview pane (scale transform), so export always renders at true pixel size regardless of preview zoom.
- **Highlight rendering**: each segment rendered as an inline `<span>` with `box-decoration-break: clone` and padding so highlights wrap across lines like the reference image.
- **Selection highlight**: capture `window.getSelection()` over the body element, map back to segment indices, split segments at boundaries, mark range highlighted.
- **Word toggle**: click handler on each word-segment toggles its `highlighted` flag.
- **Fonts**: load via Google Fonts `<link>` injected in route `head()` (only the curated set).
- **Export**: install `html-to-image`, call `toPng(canvasRef, { pixelRatio: 1, width, height })` on the unscaled node, then trigger download. Hidden export node renders at true size off-screen to guarantee resolution.
- **Components**:
  - `src/routes/index.tsx` — page shell + state
  - `src/components/quote/Canvas.tsx` — renders title + segmented body
  - `src/components/quote/ControlsPanel.tsx` — all inputs (uses shadcn Select, Slider, Input, Button, Tabs)
  - `src/components/quote/FontPicker.tsx`
  - `src/components/quote/exportImage.ts` — html-to-image wrapper
  - `src/lib/quote-fonts.ts` — curated font list + Google Fonts URL builder
- **Design tokens**: add a warm paper background + highlight yellow as semantic tokens in `src/styles.css` for the app chrome; canvas itself uses user-chosen colors.

### Out of scope (v1)
- No accounts, no saving multiple quotes, no image backgrounds/uploads, no emoji picker, no multi-page export.
