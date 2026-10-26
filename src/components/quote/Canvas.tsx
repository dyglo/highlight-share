import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Segment, TextStyle } from "./types";
import { FormattingToolbar, type TextSelection } from "./FormattingToolbar";
import { QUOTE_FONTS, type BackgroundMode, type BackgroundTextureId } from "@/lib/quote-fonts";

/**
 * Generate a tiling grain texture as a PNG data URL using the Canvas API.
 *
 * WHY canvas instead of SVG feTurbulence:
 *   html-to-image does NOT support CSS mix-blend-mode or SVG filter primitives
 *   (feTurbulence) when capturing the DOM to canvas — both fail silently.
 *   A canvas-drawn PNG data: URL is just a regular image to html-to-image and
 *   renders byte-for-byte identically in the browser and in PNG exports.
 *
 * The noise is baked directly into the background color pixels so no blend
 * mode is needed at all: each pixel = baseColor ± random delta * intensity.
 */
function generateGrainDataUrl(hexColor: string, intensity: number): string {
  const SIZE = 256;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Normalise hex → RGB (handles both #rgb and #rrggbb)
  let hex = hexColor.replace("#", "");
  if (hex.length === 3)
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  const r = parseInt(hex.slice(0, 2), 16) || 0;
  const g = parseInt(hex.slice(2, 4), 16) || 0;
  const b = parseInt(hex.slice(4, 6), 16) || 0;

  // Solid fill first so alpha is correct even if getImageData fails
  ctx.fillStyle = hexColor;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Per-pixel luminance noise baked into colour — no blend mode required
  const imageData = ctx.getImageData(0, 0, SIZE, SIZE);
  const data = imageData.data;
  const delta = Math.max(0, Math.min(1, intensity)) * 80; // ±80 levels at intensity=1

  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 2 * delta;
    data[i] = Math.max(0, Math.min(255, r + n));
    data[i + 1] = Math.max(0, Math.min(255, g + n));
    data[i + 2] = Math.max(0, Math.min(255, b + n));
    data[i + 3] = 255; // fully opaque — no CSS blend mode needed
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

export type CanvasProps = {
  width: number;
  height: number;
  background: string;
  backgroundMode: BackgroundMode;
  backgroundTextureId: BackgroundTextureId;
  backgroundImage: string | null;
  /** Grain intensity (0–1). Only used when backgroundTextureId === "grain". Default 0.32. */
  grainIntensity?: number;
  title: string;
  titleFontId: string;
  titleSize: number;
  titleColor: string;
  segments: Segment[];
  bodyFontId: string;
  bodySize: number;
  textColor: string;
  align: "left" | "center" | "right";
  /** Vertical alignment of the text block within the card. Default "center". */
  verticalAlign?: "top" | "center" | "bottom";
  onToggleSegment?: (index: number) => void;
  onHighlightSelection?: (start: number, end: number) => void;
  onFormatSelection?: (start: number, end: number, style: TextStyle) => void;
  interactive?: boolean;
  fitToContainer?: boolean;
};

function fontFamily(id: string) {
  return QUOTE_FONTS.find((f) => f.id === id)?.family ?? "serif";
}

function getTextureStyles(textureId: BackgroundTextureId, width: number): React.CSSProperties {
  switch (textureId) {
    case "paper-fiber":
      return {
        backgroundImage: [
          "radial-gradient(circle at 20% 20%, rgba(120, 92, 42, 0.08) 0 1px, transparent 1px)",
          "radial-gradient(circle at 70% 35%, rgba(120, 92, 42, 0.06) 0 1px, transparent 1px)",
          "radial-gradient(circle at 40% 75%, rgba(120, 92, 42, 0.05) 0 1px, transparent 1px)",
          "linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0))",
        ].join(", "),
        backgroundSize: "26px 26px, 34px 34px, 42px 42px, 100% 100%",
      };
    case "dotted-canvas":
      return {
        backgroundImage: [
          "radial-gradient(rgba(17,17,17,0.12) 0.8px, transparent 0.8px)",
          "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0))",
        ].join(", "),
        backgroundSize: "14px 14px, 100% 100%",
        backgroundPosition: "0 0, 0 0",
      };
    case "graph-paper": {
      const cellSize = Math.max(20, Math.round(width / 45));
      const lineWidth = Math.max(2, Math.round(width / 540));
      const marginOffset = Math.round(width * 0.12);
      return {
        backgroundImage: [
          `repeating-linear-gradient(0deg, rgba(97, 173, 255, 0.46) 0 ${lineWidth}px, transparent ${lineWidth}px ${cellSize}px)`,
          `repeating-linear-gradient(90deg, rgba(97, 173, 255, 0.46) 0 ${lineWidth}px, transparent ${lineWidth}px ${cellSize}px)`,
          `linear-gradient(90deg, transparent 0 ${marginOffset}px, rgba(255, 120, 120, 0.62) ${marginOffset}px ${marginOffset + lineWidth}px, transparent ${marginOffset + lineWidth}px 100%)`,
        ].join(", "),
        backgroundSize: "100% 100%, 100% 100%, 100% 100%",
        backgroundPosition: "0 0, 0 0, 0 0",
      };
    }
    case "linen":
      return {
        backgroundImage: [
          "linear-gradient(90deg, rgba(17,17,17,0.06) 0, rgba(17,17,17,0.06) 1px, transparent 1px, transparent 8px)",
          "linear-gradient(rgba(255,255,255,0.14) 0, rgba(255,255,255,0.14) 1px, transparent 1px, transparent 8px)",
        ].join(", "),
        backgroundSize: "9px 9px, 9px 9px",
      };
    default:
      return {};
  }
}

export const QuoteCanvas = forwardRef<HTMLDivElement, CanvasProps>(
  function QuoteCanvas(props, ref) {
    const {
      width,
      height,
      background,
      backgroundMode,
      backgroundTextureId,
      backgroundImage,
      grainIntensity,
      title,
      titleFontId,
      titleSize,
      titleColor,
      segments,
      bodyFontId,
      bodySize,
      textColor,
      align,
      verticalAlign = "center",
      onToggleSegment,
      onHighlightSelection,
      onFormatSelection,
      interactive = true,
      fitToContainer = true,
    } = props;

    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const bodyRef = useRef<HTMLDivElement | null>(null);
    const [selection, setSelection] = useState<TextSelection | null>(null);
    const dismissToolbar = useCallback(() => setSelection(null), []);
    const bodyText = segments.map((seg) => seg.text).join("");
    const suppressNextClickRef = useRef(false);
    const onHighlightSelectionRef = useRef(onHighlightSelection);
    onHighlightSelectionRef.current = onHighlightSelection;
    const touchActiveRef = useRef(false);
    const selectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [scale, setScale] = useState(1);
    // Grain texture: generated via Canvas API so it renders identically
    // in the browser preview AND in html-to-image PNG export.
    // useMemo re-runs only when the background color or intensity changes.
    const grainDataUrl = useMemo(() => {
      if (backgroundMode !== "texture" || backgroundTextureId !== "grain") return null;
      return generateGrainDataUrl(background, grainIntensity ?? 0.32);
    }, [background, grainIntensity, backgroundMode, backgroundTextureId]);

    const backgroundLayerStyle: React.CSSProperties = {
      position: "absolute",
      inset: 0,
      backgroundColor: background,
      pointerEvents: "none",
    };

    if (backgroundMode === "texture" && backgroundTextureId === "grain" && grainDataUrl) {
      // Use the pre-baked PNG tile — no mix-blend-mode, works in html-to-image
      Object.assign(backgroundLayerStyle, {
        backgroundImage: `url(${grainDataUrl})`,
        backgroundSize: "256px 256px",
        backgroundRepeat: "repeat",
      });
    } else if (backgroundMode === "texture" && backgroundTextureId !== "grain") {
      Object.assign(backgroundLayerStyle, getTextureStyles(backgroundTextureId, width));
    }

    if (backgroundMode === "image" && backgroundImage) {
      Object.assign(backgroundLayerStyle, {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      });
    }

    useEffect(() => {
      if (!fitToContainer) return;
      const el = wrapperRef.current;
      if (!el) return;
      const ro = new ResizeObserver(() => {
        const rect = el.getBoundingClientRect();
        const s = Math.min(rect.width / width, rect.height / height);
        setScale(s > 0 ? s : 1);
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, [width, height, fitToContainer]);

    const commitSelection = useCallback(() => {
      if (!interactive) return;
      const cb = onHighlightSelectionRef.current;
      if (!cb) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const range = sel.getRangeAt(0);
      const container = bodyRef.current;
      if (!container || !container.contains(range.commonAncestorContainer)) return;

      // Compute char offsets within the body text
      const pre = range.cloneRange();
      pre.selectNodeContents(container);
      pre.setEnd(range.startContainer, range.startOffset);
      const start = pre.toString().length;
      const end = start + range.toString().length;
      if (end > start) {
        suppressNextClickRef.current = true;
        setSelection({ start, end, text: container.textContent ?? "" });
        cb(start, end);
      }
      sel.removeAllRanges();
    }, [interactive]);

    // On touch devices, use the selectionchange event to reliably detect
    // when the user finishes a long-press text selection. Commits are
    // deferred until the touch ends so the user can drag to extend the
    // selection across a full sentence before the highlight is applied.
    useEffect(() => {
      if (!interactive) return;
      if (!window.matchMedia?.("(pointer: coarse)").matches) return;

      const handle = () => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;
        if (touchActiveRef.current) return;
        if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current);
        selectionTimerRef.current = setTimeout(() => {
          selectionTimerRef.current = null;
          commitSelection();
        }, 200);
      };
      document.addEventListener("selectionchange", handle);
      return () => {
        document.removeEventListener("selectionchange", handle);
        if (selectionTimerRef.current) {
          clearTimeout(selectionTimerRef.current);
          selectionTimerRef.current = null;
        }
      };
    }, [interactive, commitSelection]);

    const handleMouseUp = () => {
      commitSelection();
    };

    const handleTouchStart = () => {
      touchActiveRef.current = true;
      if (selectionTimerRef.current) {
        clearTimeout(selectionTimerRef.current);
        selectionTimerRef.current = null;
      }
    };

    const handleTouchEnd = () => {
      touchActiveRef.current = false;
      if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current);
      selectionTimerRef.current = setTimeout(() => {
        selectionTimerRef.current = null;
        commitSelection();
      }, 400);
    };

    let charCursor = 0;

    return (
      <div
        ref={wrapperRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <div
          ref={ref}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            position: "absolute",
            left: fitToContainer ? "50%" : 0,
            top: fitToContainer ? "50%" : 0,
            transform: fitToContainer ? `translate(-50%, -50%) scale(${scale})` : "none",
            transformOrigin: "center center",
            display: "flex",
            flexDirection: "column",
            justifyContent:
              verticalAlign === "top"
                ? "flex-start"
                : verticalAlign === "bottom"
                  ? "flex-end"
                  : "center",
            padding: `${Math.round(Math.min(width, height) * 0.08)}px`,
            boxSizing: "border-box",
            textAlign: align,
          }}
        >
          <div aria-hidden style={backgroundLayerStyle} />
          {title && (
            <h1
              style={{
                position: "relative",
                fontFamily: fontFamily(titleFontId),
                fontSize: `${titleSize}px`,
                fontWeight: 900,
                color: titleColor,
                margin: 0,
                marginBottom: `${Math.round(titleSize * 0.5)}px`,
                lineHeight: 1.1,
                letterSpacing: "0.01em",
              }}
            >
              {title}
            </h1>
          )}

          <div
            id={interactive ? "quote-body-text" : undefined}
            ref={bodyRef}
            tabIndex={interactive ? 0 : undefined}
            aria-label={
              interactive ? "Quote text. Select text to highlight and format." : undefined
            }
            onPointerDown={() => {
              suppressNextClickRef.current = false;
            }}
            onKeyUp={(event) => {
              if (
                event.shiftKey &&
                ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(
                  event.key,
                )
              )
                commitSelection();
            }}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{
              position: "relative",
              fontFamily: fontFamily(bodyFontId),
              fontSize: `${bodySize}px`,
              color: textColor,
              lineHeight: 1.45,
              userSelect: interactive ? "text" : "none",
              WebkitUserSelect: interactive ? "text" : "none",
            }}
          >
            {segments.map((seg, i) => {
              const start = charCursor;
              charCursor += seg.text.length;
              const isWhitespace = /^\s+$/.test(seg.text);
              const baseStyle: React.CSSProperties = seg.highlightColor
                ? {
                    background: seg.highlightColor,
                    padding: "0.05em 0.18em",
                    borderRadius: "0.08em",
                    boxDecorationBreak: "clone",
                    WebkitBoxDecorationBreak: "clone",
                  }
                : {};
              Object.assign(baseStyle, {
                fontWeight: seg.bold ? 700 : undefined,
                fontStyle: seg.italic ? "italic" : undefined,
                textDecorationLine:
                  [seg.underline ? "underline" : "", seg.strikethrough ? "line-through" : ""]
                    .filter(Boolean)
                    .join(" ") || undefined,
              });
              if (isWhitespace) {
                return (
                  <span
                    key={i}
                    data-start={start}
                    style={{
                      fontWeight: baseStyle.fontWeight,
                      fontStyle: baseStyle.fontStyle,
                      textDecorationLine: baseStyle.textDecorationLine,
                    }}
                  >
                    {seg.text}
                  </span>
                );
              }
              return (
                <span
                  key={i}
                  data-start={start}
                  onClick={(e) => {
                    if (!interactive || !onToggleSegment) return;

                    if (suppressNextClickRef.current) {
                      suppressNextClickRef.current = false;
                      return;
                    }
                    // Only toggle on plain click (no text selection)
                    const sel = window.getSelection();
                    if (sel && !sel.isCollapsed) return;
                    e.stopPropagation();
                    setSelection({ start, end: start + seg.text.length, text: bodyText });
                    onToggleSegment(i);
                  }}
                  style={{
                    ...baseStyle,
                    cursor: interactive ? "pointer" : "default",
                  }}
                >
                  {seg.text}
                </span>
              );
            })}
          </div>
        </div>
        {interactive &&
          onFormatSelection &&
          selection &&
          selection.text === bodyText &&
          bodyRef.current && (
            <FormattingToolbar
              selection={selection}
              segments={segments}
              container={bodyRef.current}
              onFormat={(style) => onFormatSelection(selection.start, selection.end, style)}
              onDismiss={dismissToolbar}
            />
          )}
      </div>
    );
  },
);
