import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { QuoteCanvas } from "@/components/quote/Canvas";
import { ControlsPanel, type ControlsState } from "@/components/quote/ControlsPanel";
import { exportQuotePng } from "@/components/quote/exportImage";
import { mergeAdjacent, textToSegments, type Segment, segmentsToText } from "@/components/quote/types";
import { EXPORT_FORMATS, GOOGLE_FONTS_HREF } from "@/lib/quote-fonts";
import { Button } from "@/components/ui/button";
import { Download, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quote Highlight Studio — Design shareable quote graphics" },
      {
        name: "description",
        content:
          "Compose beautiful quote graphics with custom fonts, highlights, and one-click export to Instagram, Threads, and more.",
      },
      { property: "og:title", content: "Quote Highlight Studio" },
      {
        property: "og:description",
        content: "Design shareable quote graphics with highlights and curated fonts.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: GOOGLE_FONTS_HREF },
    ],
  }),
  component: Index,
});

const DEFAULT_BODY =
  '"I have come that you may have life and have it more abundantly. The enemy comes to steal but God comes to give."';

function applyHighlightToRange(segs: Segment[], start: number, end: number, value: boolean): Segment[] {
  const out: Segment[] = [];
  let cursor = 0;
  for (const seg of segs) {
    const segStart = cursor;
    const segEnd = cursor + seg.text.length;
    cursor = segEnd;

    if (segEnd <= start || segStart >= end) {
      out.push({ ...seg });
      continue;
    }
    const a = Math.max(segStart, start) - segStart;
    const b = Math.min(segEnd, end) - segStart;
    if (a > 0) out.push({ text: seg.text.slice(0, a), highlighted: seg.highlighted });
    out.push({ text: seg.text.slice(a, b), highlighted: value });
    if (b < seg.text.length) out.push({ text: seg.text.slice(b), highlighted: seg.highlighted });
  }
  return mergeAdjacent(out);
}

function Index() {
  const [state, setState] = useState<ControlsState>({
    title: "JOHN 10:10",
    bodyText: DEFAULT_BODY,
    titleFontId: "anton",
    bodyFontId: "playfair",
    titleSize: 110,
    bodySize: 56,
    textColor: "#111111",
    titleColor: "#111111",
    highlightColor: "#ffe066",
    background: "#f7f1e6",
    align: "center",
    format: "ig-square",
  });

  const [segments, setSegments] = useState<Segment[]>(() => textToSegments(DEFAULT_BODY));
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);

  const format = useMemo(
    () => EXPORT_FORMATS.find((f) => f.id === state.format) ?? EXPORT_FORMATS[0],
    [state.format],
  );

  const update = (patch: Partial<ControlsState>) => setState((s) => ({ ...s, ...patch }));

  const applyBodyText = () => {
    // Try to preserve highlighting on words that still exist in the same order.
    const newSegs = textToSegments(state.bodyText);
    const oldHighlightedWords = new Set(
      segments.filter((s) => s.highlighted && !/^\s+$/.test(s.text)).map((s) => s.text),
    );
    setSegments(
      newSegs.map((s) =>
        !/^\s+$/.test(s.text) && oldHighlightedWords.has(s.text) ? { ...s, highlighted: true } : s,
      ),
    );
  };

  const toggleSegment = (index: number) => {
    setSegments((prev) => {
      const next = prev.map((s, i) => (i === index ? { ...s, highlighted: !s.highlighted } : s));
      return mergeAdjacent(next);
    });
  };

  const highlightSelection = (start: number, end: number) => {
    setSegments((prev) => {
      // Decide whether to highlight or unhighlight based on whether the
      // selected range is mostly already highlighted.
      let highlightedChars = 0;
      let cursor = 0;
      for (const seg of prev) {
        const segStart = cursor;
        const segEnd = cursor + seg.text.length;
        cursor = segEnd;
        if (segEnd <= start || segStart >= end) continue;
        const overlap = Math.min(segEnd, end) - Math.max(segStart, start);
        if (seg.highlighted) highlightedChars += overlap;
      }
      const total = end - start;
      const shouldUnhighlight = highlightedChars / total > 0.5;
      return applyHighlightToRange(prev, start, end, !shouldUnhighlight);
    });
  };

  const clearHighlights = () => {
    setSegments((prev) => mergeAdjacent(prev.map((s) => ({ ...s, highlighted: false }))));
  };

  const handleDownload = async () => {
    setExporting(true);
    try {
      await exportQuotePng(
        {
          width: format.width,
          height: format.height,
          background: state.background,
          title: state.title,
          titleFontId: state.titleFontId,
          titleSize: state.titleSize,
          titleColor: state.titleColor,
          segments,
          bodyFontId: state.bodyFontId,
          bodySize: state.bodySize,
          textColor: state.textColor,
          highlightColor: state.highlightColor,
          align: state.align,
        },
        `quote-${format.id}-${Date.now()}.png`,
      );
      toast.success(`Downloaded ${format.name}`);
    } catch (e) {
      console.error(e);
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  // Sync body text → segments only on first mount or when user clicks Apply.
  // (handled by applyBodyText)
  // Make sure segments are in sync with current text length when text wasn't applied yet:
  const liveSegments = useMemo(() => {
    if (segmentsToText(segments) === state.bodyText) return segments;
    return segments;
  }, [segments, state.bodyText]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <Toaster />
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold tracking-tight">Quote Highlight Studio</h1>
        </div>
        <Button onClick={handleDownload} disabled={exporting}>
          <Download className="mr-2 h-4 w-4" />
          {exporting ? "Rendering…" : `Download ${format.name}`}
        </Button>
      </header>

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_360px]">
        <main className="relative min-h-0 overflow-hidden bg-muted/40 p-6">
          <div className="mx-auto h-full w-full max-w-4xl">
            <div
              className="h-full w-full"
              style={{
                aspectRatio: `${format.width} / ${format.height}`,
              }}
            >
              <div className="relative mx-auto h-full" style={{ aspectRatio: `${format.width} / ${format.height}`, maxHeight: "100%" }}>
                <div className="absolute inset-0 rounded-lg shadow-xl ring-1 ring-border overflow-hidden">
                  <QuoteCanvas
                    ref={canvasRef}
                    width={format.width}
                    height={format.height}
                    background={state.background}
                    title={state.title}
                    titleFontId={state.titleFontId}
                    titleSize={state.titleSize}
                    titleColor={state.titleColor}
                    segments={liveSegments}
                    bodyFontId={state.bodyFontId}
                    bodySize={state.bodySize}
                    textColor={state.textColor}
                    highlightColor={state.highlightColor}
                    align={state.align}
                    onToggleSegment={toggleSegment}
                    onHighlightSelection={highlightSelection}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>

        <aside className="overflow-y-auto border-t border-border p-5 lg:border-l lg:border-t-0">
          <ControlsPanel
            state={state}
            onChange={update}
            onClearHighlights={clearHighlights}
            onResetBody={applyBodyText}
          />
        </aside>
      </div>
    </div>
  );
}
