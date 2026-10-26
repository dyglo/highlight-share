export const TEXT_STYLES = ["bold", "italic", "underline", "strikethrough"] as const;
export type TextStyle = (typeof TEXT_STYLES)[number];
export type Segment = { text: string; highlightColor: string | null } & Partial<
  Record<TextStyle, boolean>
>;

/** Split at character boundaries while preserving all unrelated attributes. */
export function applySegmentPatch(
  segs: Segment[],
  start: number,
  end: number,
  patch: Partial<Omit<Segment, "text">>,
): Segment[] {
  const out: Segment[] = [];
  let cursor = 0;
  for (const seg of segs) {
    const segStart = cursor;
    cursor += seg.text.length;
    if (cursor <= start || segStart >= end) {
      out.push({ ...seg });
      continue;
    }
    const a = Math.max(segStart, start) - segStart;
    const b = Math.min(cursor, end) - segStart;
    if (a > 0) out.push({ ...seg, text: seg.text.slice(0, a) });
    out.push({ ...seg, ...patch, text: seg.text.slice(a, b) });
    if (b < seg.text.length) out.push({ ...seg, text: seg.text.slice(b) });
  }
  return mergeAdjacent(out);
}

function selectedSegments(segs: Segment[], start: number, end: number): Segment[] {
  let cursor = 0;
  return segs.filter((seg) => {
    const from = cursor;
    cursor += seg.text.length;
    return from < end && cursor > start;
  });
}

export function rangeHasHighlight(
  segs: Segment[],
  start: number,
  end: number,
  color: string,
): boolean {
  const selected = selectedSegments(segs, start, end);
  return selected.length > 0 && selected.every((seg) => seg.highlightColor === color);
}

export function toggleRangeHighlight(
  segs: Segment[],
  start: number,
  end: number,
  color: string,
): Segment[] {
  return applySegmentPatch(segs, start, end, {
    highlightColor: rangeHasHighlight(segs, start, end, color) ? null : color,
  });
}

export function getRangeStyles(
  segs: Segment[],
  start: number,
  end: number,
): Record<TextStyle, boolean> {
  const selected = selectedSegments(segs, start, end);
  return Object.fromEntries(
    TEXT_STYLES.map((style) => [
      style,
      selected.length > 0 && selected.every((seg) => !!seg[style]),
    ]),
  ) as Record<TextStyle, boolean>;
}

export function toggleRangeStyle(
  segs: Segment[],
  start: number,
  end: number,
  style: TextStyle,
): Segment[] {
  return applySegmentPatch(segs, start, end, { [style]: !getRangeStyles(segs, start, end)[style] });
}

export function textToSegments(text: string): Segment[] {
  if (!text) return [];
  // Split keeping whitespace as separate tokens so toggling words is intuitive.
  const tokens = text.match(/\S+|\s+/g) ?? [];
  return tokens.map((t) => ({ text: t, highlightColor: null }));
}

export function segmentsToText(segs: Segment[]): string {
  return segs.map((s) => s.text).join("");
}

export function mergeAdjacent(segs: Segment[]): Segment[] {
  const out: Segment[] = [];
  for (const s of segs) {
    const last = out[out.length - 1];
    if (
      last &&
      last.highlightColor === s.highlightColor &&
      TEXT_STYLES.every((style) => !!last[style] === !!s[style])
    ) {
      last.text += s.text;
    } else {
      out.push({ ...s });
    }
  }
  return out;
}
