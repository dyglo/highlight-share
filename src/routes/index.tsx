import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { QuoteCanvas } from "@/components/quote/Canvas";
import { ControlsPanel, type ControlsState } from "@/components/quote/ControlsPanel";
import { exportQuotePng } from "@/components/quote/exportImage";
import { mergeAdjacent, textToSegments, type Segment, segmentsToText } from "@/components/quote/types";
import { EXPORT_FORMATS, GOOGLE_FONTS_HREF } from "@/lib/quote-fonts";
import { Button } from "@/components/ui/button";
import { Download, Moon, SunMedium } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

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

function applyHighlightToRange(
  segs: Segment[],
  start: number,
  end: number,
  color: string | null,
): Segment[] {
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
    if (a > 0) out.push({ text: seg.text.slice(0, a), highlightColor: seg.highlightColor });
    out.push({ text: seg.text.slice(a, b), highlightColor: color });
    if (b < seg.text.length) out.push({ text: seg.text.slice(b), highlightColor: seg.highlightColor });
  }
  return mergeAdjacent(out);
}

function Index() {
  const [isPureDark, setIsPureDark] = useState(false);
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
    backgroundMode: "color",
    backgroundTextureId: "paper-fiber",
    backgroundImage: null,
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
  const previewMaxWidth =
    format.height > format.width ? 420 : format.width > format.height ? 900 : 760;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isPureDark);
    root.classList.toggle("pure-dark", isPureDark);
  }, [isPureDark]);

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove("dark", "pure-dark");
    };
  }, []);

  const update = (patch: Partial<ControlsState>) => setState((s) => ({ ...s, ...patch }));

  const applyBodyText = () => {
    const newSegs = textToSegments(state.bodyText);
    const savedHighlights = segments.filter((s) => s.highlightColor && !/^\s+$/.test(s.text));
    let nextMatch = 0;
    setSegments(
      newSegs.map((seg) => {
        if (/^\s+$/.test(seg.text)) return seg;
        const match = savedHighlights[nextMatch];
        if (match && match.text === seg.text) {
          nextMatch += 1;
          return { ...seg, highlightColor: match.highlightColor };
        }
        return seg;
      }),
    );
  };

  const toggleSegment = (index: number, color: string) => {
    setSegments((prev) => {
      const next = prev.map((s, i) =>
        i === index ? { ...s, highlightColor: s.highlightColor ? null : color } : s,
      );
      return mergeAdjacent(next);
    });
  };

  const highlightSelection = (start: number, end: number, color: string) => {
    setSegments((prev) => applyHighlightToRange(prev, start, end, color));
  };

  const clearHighlights = () => {
    setSegments((prev) => mergeAdjacent(prev.map((s) => ({ ...s, highlightColor: null }))));
  };

  const uploadBackgroundImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result;
      if (typeof imageData !== "string") return;
      setState((prev) => ({
        ...prev,
        backgroundMode: "image",
        backgroundImage: imageData,
      }));
    };
    reader.readAsDataURL(file);
  };

  const clearBackgroundImage = () => {
    setState((prev) => ({
      ...prev,
      backgroundImage: null,
      backgroundMode: "color",
    }));
  };

  const handleDownload = async () => {
    setExporting(true);
    try {
      await exportQuotePng(
        {
          width: format.width,
          height: format.height,
          background: state.background,
          backgroundMode: state.backgroundMode,
          backgroundTextureId: state.backgroundTextureId,
          backgroundImage: state.backgroundImage,
          title: state.title,
          titleFontId: state.titleFontId,
          titleSize: state.titleSize,
          titleColor: state.titleColor,
          segments,
          bodyFontId: state.bodyFontId,
          bodySize: state.bodySize,
          textColor: state.textColor,
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
    <div className={cn("min-h-screen bg-background lg:h-screen lg:overflow-hidden")}>
      <Toaster />
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <img src="/logo-mark.svg" alt="" className="h-9 w-9 shrink-0 rounded-xl ring-1 ring-border" />
            <div>
              <h1 className="text-base font-semibold tracking-tight sm:text-lg">Quote Highlight Studio</h1>
              <p className="text-xs text-muted-foreground">Highlight, texture, export, and install.</p>
            </div>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setIsPureDark((value) => !value)}
              size="icon"
              className="shrink-0 bg-background/70"
              aria-label={isPureDark ? "Switch to light theme" : "Switch to pure dark theme"}
              title={isPureDark ? "Switch to light theme" : "Switch to pure dark theme"}
            >
              {isPureDark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              onClick={handleDownload}
              disabled={exporting}
              className="flex-1 rounded-xl px-4 sm:flex-none sm:px-5"
              variant="secondary"
            >
              <Download className="mr-2 h-4 w-4" />
              {exporting ? "Rendering…" : `Download ${format.name}`}
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:h-[calc(100vh-77px)] lg:grid-cols-[minmax(0,1fr)_360px] lg:overflow-hidden">
        <main className="bg-muted/40 px-4 py-4 sm:px-6 sm:py-6 lg:min-h-0 lg:overflow-hidden">
          <div className="mx-auto flex min-h-[320px] w-full max-w-6xl justify-center lg:h-full lg:items-center">
            <div
              className="relative w-full shrink"
              style={{
                aspectRatio: `${format.width} / ${format.height}`,
                maxWidth: `${previewMaxWidth}px`,
                maxHeight: "min(100%, calc(100vh - 160px))",
              }}
            >
              <QuoteCanvas
                ref={canvasRef}
                width={format.width}
                height={format.height}
                background={state.background}
                backgroundMode={state.backgroundMode}
                backgroundTextureId={state.backgroundTextureId}
                backgroundImage={state.backgroundImage}
                title={state.title}
                titleFontId={state.titleFontId}
                titleSize={state.titleSize}
                titleColor={state.titleColor}
                segments={liveSegments}
                bodyFontId={state.bodyFontId}
                bodySize={state.bodySize}
                textColor={state.textColor}
                align={state.align}
                onToggleSegment={(index) => toggleSegment(index, state.highlightColor)}
                onHighlightSelection={(start, end) => highlightSelection(start, end, state.highlightColor)}
              />
            </div>
          </div>
        </main>

        <aside className="border-t border-border bg-background/98 p-4 sm:p-5 lg:min-h-0 lg:overflow-y-auto lg:border-l lg:border-t-0">
          <ControlsPanel
            state={state}
            onChange={update}
            onClearHighlights={clearHighlights}
            onResetBody={applyBodyText}
            onUploadBackgroundImage={uploadBackgroundImage}
            onClearBackgroundImage={clearBackgroundImage}
          />
        </aside>
      </div>
    </div>
  );
}
