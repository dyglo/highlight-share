import { forwardRef, useEffect, useRef, useState } from "react";
import type { Segment } from "./types";
import { QUOTE_FONTS, type BackgroundMode, type BackgroundTextureId } from "@/lib/quote-fonts";

export type CanvasProps = {
  width: number;
  height: number;
  background: string;
  backgroundMode: BackgroundMode;
  backgroundTextureId: BackgroundTextureId;
  backgroundImage: string | null;
  title: string;
  titleFontId: string;
  titleSize: number;
  titleColor: string;
  segments: Segment[];
  bodyFontId: string;
  bodySize: number;
  textColor: string;
  align: "left" | "center" | "right";
  onToggleSegment?: (index: number) => void;
  onHighlightSelection?: (start: number, end: number) => void;
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
    case "graph-paper":
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

export const QuoteCanvas = forwardRef<HTMLDivElement, CanvasProps>(function QuoteCanvas(
  props,
  ref,
) {
  const {
    width,
    height,
    background,
    backgroundMode,
    backgroundTextureId,
    backgroundImage,
    title,
    titleFontId,
    titleSize,
    titleColor,
    segments,
    bodyFontId,
    bodySize,
    textColor,
    align,
    onToggleSegment,
    onHighlightSelection,
    interactive = true,
    fitToContainer = true,
  } = props;

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const suppressNextClickRef = useRef(false);
  const [scale, setScale] = useState(1);
  const backgroundLayerStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundColor: background,
    pointerEvents: "none",
  };

  if (backgroundMode === "texture") {
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

  const commitSelection = () => {
    if (!interactive || !onHighlightSelection) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const container = document.getElementById("quote-body-text");
    if (!container || !container.contains(range.commonAncestorContainer)) return;

    // Compute char offsets within the body text
    const pre = range.cloneRange();
    pre.selectNodeContents(container);
    pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length;
    const end = start + range.toString().length;
    if (end > start) {
      suppressNextClickRef.current = true;
      onHighlightSelection(start, end);
    }
    sel.removeAllRanges();
  };

  const handleMouseUp = () => {
    commitSelection();
  };

  const handleTouchEnd = () => {
    window.setTimeout(() => {
      commitSelection();
    }, 0);
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
          transform: fitToContainer
            ? `translate(-50%, -50%) scale(${scale})`
            : "none",
          transformOrigin: "center center",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
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
          id="quote-body-text"
          onMouseUp={handleMouseUp}
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
            if (isWhitespace) {
              return (
                <span key={i} data-start={start}>
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
                  if (window.matchMedia?.("(pointer: coarse)").matches) return;
                  if (suppressNextClickRef.current) {
                    suppressNextClickRef.current = false;
                    return;
                  }
                  // Only toggle on plain click (no text selection)
                  const sel = window.getSelection();
                  if (sel && !sel.isCollapsed) return;
                  e.stopPropagation();
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
    </div>
  );
});
