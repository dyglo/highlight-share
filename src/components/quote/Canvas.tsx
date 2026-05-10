import { forwardRef, useEffect, useRef, useState } from "react";
import type { Segment } from "./types";
import { QUOTE_FONTS } from "@/lib/quote-fonts";

export type CanvasProps = {
  width: number;
  height: number;
  background: string;
  title: string;
  titleFontId: string;
  titleSize: number;
  titleColor: string;
  segments: Segment[];
  bodyFontId: string;
  bodySize: number;
  textColor: string;
  highlightColor: string;
  align: "left" | "center" | "right";
  onToggleSegment?: (index: number) => void;
  onHighlightSelection?: (start: number, end: number) => void;
  interactive?: boolean;
  fitToContainer?: boolean;
};

function fontFamily(id: string) {
  return QUOTE_FONTS.find((f) => f.id === id)?.family ?? "serif";
}

export const QuoteCanvas = forwardRef<HTMLDivElement, CanvasProps>(function QuoteCanvas(
  props,
  ref,
) {
  const {
    width,
    height,
    background,
    title,
    titleFontId,
    titleSize,
    titleColor,
    segments,
    bodyFontId,
    bodySize,
    textColor,
    highlightColor,
    align,
    onToggleSegment,
    onHighlightSelection,
    interactive = true,
    fitToContainer = true,
  } = props;

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

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

  const handleMouseUp = () => {
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
    if (end > start) onHighlightSelection(start, end);
    sel.removeAllRanges();
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
          background,
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
        {title && (
          <h1
            style={{
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
          style={{
            fontFamily: fontFamily(bodyFontId),
            fontSize: `${bodySize}px`,
            color: textColor,
            lineHeight: 1.45,
            userSelect: interactive ? "text" : "none",
          }}
        >
          {segments.map((seg, i) => {
            const start = charCursor;
            charCursor += seg.text.length;
            const isWhitespace = /^\s+$/.test(seg.text);
            const baseStyle: React.CSSProperties = seg.highlighted
              ? {
                  background: highlightColor,
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
