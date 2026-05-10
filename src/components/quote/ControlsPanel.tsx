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
import { QUOTE_FONTS, BACKGROUND_PRESETS, EXPORT_FORMATS, type ExportFormatId } from "@/lib/quote-fonts";
import { AlignCenter, AlignLeft, AlignRight, Eraser } from "lucide-react";

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
  align: "left" | "center" | "right";
  format: ExportFormatId;
};

type Props = {
  state: ControlsState;
  onChange: (patch: Partial<ControlsState>) => void;
  onClearHighlights: () => void;
  onResetBody: () => void;
};

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

export function ControlsPanel({ state, onChange, onClearHighlights, onResetBody }: Props) {
  return (
    <div className="space-y-6">
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
          Edit then apply. In the preview, click any word to toggle highlight, or drag-select and release to highlight a phrase.
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
      </section>
    </div>
  );
}
