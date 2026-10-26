import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QUOTE_FONTS,
  BACKGROUND_PRESETS,
  IG_GRAIN_PRESETS,
  BACKGROUND_TEXTURES,
  EXPORT_FORMATS,
  type BackgroundMode,
  type BackgroundTextureId,
  type ExportFormatId,
} from "@/lib/quote-fonts";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  Eraser,
  ImagePlus,
  Instagram,
  PaintBucket,
  ScanText,
} from "lucide-react";

export type ControlsState = {
  title: string;
  bodyText: string;
  titleFontId: string;
  bodyFontId: string;
  titleSize: number;
  bodySize: number;
  textColor: string;
  titleColor: string;
  highlightColor: string;
  background: string;
  backgroundMode: BackgroundMode;
  backgroundTextureId: BackgroundTextureId;
  backgroundImage: string | null;
  /** Film grain intensity 0–1. Active when backgroundTextureId === "grain". */
  grainIntensity: number;
  align: "left" | "center" | "right";
  /** Vertical placement of the text block inside the card. */
  verticalAlign: "top" | "center" | "bottom";
  format: ExportFormatId;
};

type Props = {
  state: ControlsState;
  onChange: (patch: Partial<ControlsState>) => void;
  onClearHighlights: () => void;
  onResetBody: () => void;
  onUploadBackgroundImage: (file: File) => void;
  onClearBackgroundImage: () => void;
};

/** Vertical align icons mapped to values */
const VERTICAL_ALIGNS = [
  { value: "top" as const, Icon: AlignVerticalJustifyStart, label: "Top" },
  { value: "center" as const, Icon: AlignVerticalJustifyCenter, label: "Middle" },
  { value: "bottom" as const, Icon: AlignVerticalJustifyEnd, label: "Bottom" },
];

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-24 font-mono text-xs"
        />
      </div>
    </div>
  );
}

export function ControlsPanel({
  state,
  onChange,
  onClearHighlights,
  onResetBody,
  onUploadBackgroundImage,
  onClearBackgroundImage,
}: Props) {
  return (
    <div className="space-y-6">
      {/* ── Instagram Card quick-preset ─────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Instagram Card</h3>
        <button
          onClick={() =>
            onChange({
              backgroundMode: "texture",
              backgroundTextureId: "grain",
              background: state.background.startsWith("#f") || state.background === "#ffffff"
                ? "#1a5c38"
                : state.background,
            })
          }
          className="group relative w-full overflow-hidden rounded-xl border border-border p-0 transition-all hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* Gradient preview strip */}
          <div className="flex h-14 w-full">
            {["#1a5c38", "#22527a", "#9c4423", "#b07818", "#5a2467", "#2a2e35"].map((c) => (
              <div key={c} className="flex-1" style={{ background: c }} />
            ))}
          </div>
          <div className="flex items-center gap-2 bg-muted/60 px-3 py-2 text-left text-xs font-medium">
            <Instagram className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            Apply Instagram Grain Card
          </div>
        </button>

        {/* IG-tuned color swatches — includes white so it's always accessible */}
        <div className="grid grid-cols-6 gap-1.5">
          {/* White & black first so they're always visible */}
          {[
            { id: "white-ig", name: "White", color: "#ffffff" },
            { id: "black-ig", name: "Black", color: "#111111" },
            ...IG_GRAIN_PRESETS,
          ].map((p) => (
            <button
              key={p.id}
              title={p.name}
              onClick={() => onChange({ background: p.color })}
              className={`group relative h-8 w-full rounded-md border-2 transition-all ${
                state.background === p.color
                  ? "border-foreground ring-1 ring-foreground/30 scale-105"
                  : "border-border hover:scale-105 hover:border-foreground/40"
              }`}
              style={{ background: p.color }}
            >
              <span className="sr-only">{p.name}</span>
            </button>
          ))}
        </div>

        {/* Custom background color picker inline */}
        <div className="flex items-center justify-between gap-3">
          <Label className="text-xs shrink-0">Custom color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={state.background}
              onChange={(e) => onChange({ background: e.target.value })}
              className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
            />
            <Input
              value={state.background}
              onChange={(e) => onChange({ background: e.target.value })}
              className="h-8 w-24 font-mono text-xs"
              placeholder="#1a5c38"
            />
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Hover a swatch to see the color name.
        </p>

        {/* Text color quick-switch: Black / White */}
        <div>
          <Label className="text-xs">Text color</Label>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <button
              onClick={() => onChange({ textColor: "#111111", titleColor: "#111111" })}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 py-2 text-xs font-medium transition-all ${
                state.textColor === "#111111"
                  ? "border-foreground bg-black text-white"
                  : "border-border bg-white text-black hover:border-foreground/50"
              }`}
            >
              <span className="h-3 w-3 rounded-full border border-border bg-black inline-block" />
              Black
            </button>
            <button
              onClick={() => onChange({ textColor: "#ffffff", titleColor: "#ffffff" })}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 py-2 text-xs font-medium transition-all ${
                state.textColor === "#ffffff"
                  ? "border-foreground bg-white text-black"
                  : "border-border bg-black text-white hover:border-foreground/50"
              }`}
            >
              <span className="h-3 w-3 rounded-full border border-border bg-white inline-block" />
              White
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Format</h3>
        <Select value={state.format} onValueChange={(v) => onChange({ format: v as ExportFormatId })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {EXPORT_FORMATS.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name} · {f.width}×{f.height}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</h3>
        <Input
          value={state.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="JOHN 10:10"
        />
        <div>
          <Label className="text-xs">Title font</Label>
          <Select value={state.titleFontId} onValueChange={(v) => onChange({ titleFontId: v })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {QUOTE_FONTS.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  <span style={{ fontFamily: f.family }}>{f.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Title size: {state.titleSize}px</Label>
          <Slider
            min={40}
            max={220}
            step={2}
            value={[state.titleSize]}
            onValueChange={([v]) => onChange({ titleSize: v })}
            className="mt-2"
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Body</h3>
          <Button variant="ghost" size="sm" onClick={onClearHighlights} className="h-7 text-xs">
            <Eraser className="mr-1 h-3 w-3" /> Clear highlights
          </Button>
        </div>
        <Textarea
          value={state.bodyText}
          onChange={(e) => onChange({ bodyText: e.target.value })}
          rows={5}
          placeholder="Type your quote..."
        />
        <Button variant="outline" size="sm" onClick={onResetBody} className="w-full">
          Apply text changes
        </Button>
        <p className="text-xs text-muted-foreground">
          Edit then apply. Click a word or drag-select a phrase to open the toolbar. Choose Highlight, Bold, Italic, Underline, or Strikethrough independently. Turn on Highlight and a text style to use both.
        </p>
        <p className="text-xs text-muted-foreground">
          On phones and tablets, long-press the quote, adjust the selection handles, then choose a style from the toolbar. Selecting text does not apply color.
        </p>
        <div>
          <Label className="text-xs">Body font</Label>
          <Select value={state.bodyFontId} onValueChange={(v) => onChange({ bodyFontId: v })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {QUOTE_FONTS.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  <span style={{ fontFamily: f.family }}>{f.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Body size: {state.bodySize}px</Label>
          <Slider
            min={24}
            max={120}
            step={1}
            value={[state.bodySize]}
            onValueChange={([v]) => onChange({ bodySize: v })}
            className="mt-2"
          />
        </div>
        <div>
          <Label className="text-xs">Alignment</Label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {(["left", "center", "right"] as const).map((a) => (
              <Button
                key={a}
                variant={state.align === a ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ align: a })}
              >
                {a === "left" && <AlignLeft className="h-4 w-4" />}
                {a === "center" && <AlignCenter className="h-4 w-4" />}
                {a === "right" && <AlignRight className="h-4 w-4" />}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs">Vertical position</Label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {VERTICAL_ALIGNS.map(({ value, Icon, label }) => (
              <Button
                key={value}
                variant={state.verticalAlign === value ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ verticalAlign: value })}
                title={label}
              >
                <Icon className="mr-1 h-4 w-4" />{label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Colors</h3>
        <ColorRow label="Title color" value={state.titleColor} onChange={(v) => onChange({ titleColor: v })} />
        <ColorRow label="Body text" value={state.textColor} onChange={(v) => onChange({ textColor: v })} />
        <ColorRow label="Highlight" value={state.highlightColor} onChange={(v) => onChange({ highlightColor: v })} />
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Background</h3>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={state.backgroundMode === "color" ? "default" : "outline"}
            size="sm"
            onClick={() => onChange({ backgroundMode: "color" })}
          >
            <PaintBucket className="mr-2 h-4 w-4" /> Color
          </Button>
          <Button
            variant={state.backgroundMode === "texture" ? "default" : "outline"}
            size="sm"
            onClick={() => onChange({ backgroundMode: "texture" })}
          >
            <ScanText className="mr-2 h-4 w-4" /> Texture
          </Button>
          <Button
            variant={state.backgroundMode === "image" ? "default" : "outline"}
            size="sm"
            onClick={() => onChange({ backgroundMode: "image" })}
          >
            <ImagePlus className="mr-2 h-4 w-4" /> Image
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {BACKGROUND_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => onChange({ background: p.color })}
              className={`group flex flex-col items-center gap-1 rounded-md border p-2 transition ${
                state.background === p.color ? "border-foreground" : "border-border hover:border-foreground/50"
              }`}
            >
              <div className="h-8 w-full rounded" style={{ background: p.color }} />
              <span className="text-[10px] text-muted-foreground">{p.name}</span>
            </button>
          ))}
        </div>
        <ColorRow label="Custom" value={state.background} onChange={(v) => onChange({ background: v })} />

        {state.backgroundMode === "texture" && (
          <div className="space-y-2">
            <Label className="text-xs">Texture style</Label>
            <div className="grid grid-cols-2 gap-2">
              {BACKGROUND_TEXTURES.filter((texture) => texture.id !== "none").map((texture) => (
                <Button
                  key={texture.id}
                  variant={state.backgroundTextureId === texture.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onChange({ backgroundTextureId: texture.id as BackgroundTextureId })}
                  className="justify-start"
                >
                  {texture.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Grain intensity slider — only visible when grain texture is selected */}
        {state.backgroundMode === "texture" && state.backgroundTextureId === "grain" && (
          <div className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Grain intensity</Label>
              <span className="font-mono text-[10px] text-muted-foreground">
                {Math.round(state.grainIntensity * 100)}%
              </span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[state.grainIntensity]}
              onValueChange={([v]) => onChange({ grainIntensity: v })}
            />
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>None</span>
              <span>Reference ≈ 32%</span>
              <span>Heavy</span>
            </div>
          </div>
        )}

        {state.backgroundMode === "image" && (
          <div className="space-y-3 rounded-md border border-border p-3">
            <div className="space-y-1">
              <Label className="text-xs">Background image</Label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadBackgroundImage(file);
                  e.currentTarget.value = "";
                }}
                className="block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground"
              />
            </div>
            {state.backgroundImage ? (
              <div className="space-y-2">
                <img
                  src={state.backgroundImage}
                  alt="Background preview"
                  className="h-24 w-full rounded-md object-cover ring-1 ring-border"
                />
                <Button variant="outline" size="sm" onClick={onClearBackgroundImage} className="w-full">
                  Remove background image
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Upload an image to fill the quote card background.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
