import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bold, Italic, Underline, Strikethrough, X } from "lucide-react";
import { getRangeStyles, type Segment, type TextStyle } from "./types";

const actions = [
  { style: "bold", label: "Bold", Icon: Bold },
  { style: "italic", label: "Italic", Icon: Italic },
  { style: "underline", label: "Underline", Icon: Underline },
  { style: "strikethrough", label: "Strikethrough", Icon: Strikethrough },
] as const;

export type TextSelection = { start: number; end: number; text: string };

export function FormattingToolbar({
  selection,
  segments,
  container,
  onFormat,
  onDismiss,
}: {
  selection: TextSelection;
  segments: Segment[];
  container: HTMLDivElement;
  onFormat: (style: TextStyle) => void;
  onDismiss: () => void;
}) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const active = getRangeStyles(segments, selection.start, selection.end);

  useLayoutEffect(() => {
    const positionToolbar = () => {
      const toolbar = toolbarRef.current;
      if (!toolbar) return;
      // Rebuild the range after every style change: React may have split or
      // merged the text nodes, but character offsets remain stable.
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      let cursor = 0;
      let started = false;
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const end = cursor + (node.textContent?.length ?? 0);
        if (!started && selection.start < end) {
          range.setStart(node, selection.start - cursor);
          started = true;
        }
        if (started && selection.end <= end) {
          range.setEnd(node, selection.end - cursor);
          break;
        }
        cursor = end;
      }
      if (!started) return;
      const rect = range.getBoundingClientRect();
      const bounds = toolbar.getBoundingClientRect();
      setPosition({
        left: Math.max(
          8,
          Math.min(
            window.innerWidth - bounds.width - 8,
            rect.left + rect.width / 2 - bounds.width / 2,
          ),
        ),
        top: Math.max(
          8,
          Math.min(
            window.innerHeight - bounds.height - 8,
            rect.top > bounds.height + 16 ? rect.top - bounds.height - 10 : rect.bottom + 10,
          ),
        ),
      });
    };
    const dismissOutside = (event: PointerEvent) => {
      if (!toolbarRef.current?.contains(event.target as Node)) onDismiss();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (toolbarRef.current?.contains(document.activeElement)) container.focus();
        onDismiss();
      }
    };
    positionToolbar();
    const observer = new ResizeObserver(positionToolbar);
    observer.observe(container);
    window.addEventListener("resize", positionToolbar);
    window.addEventListener("scroll", positionToolbar, true);
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", escape);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", positionToolbar);
      window.removeEventListener("scroll", positionToolbar, true);
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", escape);
    };
  }, [container, selection, segments, onDismiss]);

  return createPortal(
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Text formatting"
      aria-orientation="horizontal"
      className="fixed z-50 flex items-center gap-1 rounded-xl border border-border bg-background p-1.5 text-foreground shadow-xl"
      style={{ ...position, visibility: position ? "visible" : "hidden" }}
      onPointerDown={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        const buttons = Array.from(event.currentTarget.querySelectorAll("button"));
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? buttons.length - 1
                : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
          buttons[next]?.focus();
        }
      }}
    >
      {actions.map(({ style, label, Icon }) => (
        <button
          key={style}
          type="button"
          aria-label={label}
          aria-pressed={active[style]}
          title={label}
          onClick={() => onFormat(style)}
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-primary aria-pressed:text-primary-foreground"
        >
          <Icon aria-hidden="true" className="h-4 w-4" />
        </button>
      ))}
      <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
      <button
        type="button"
        aria-label="Close formatting toolbar"
        title="Close (Esc)"
        onClick={onDismiss}
        className="flex h-10 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>,
    document.body,
  );
}
