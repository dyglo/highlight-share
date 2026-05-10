export type Segment = { text: string; highlighted: boolean };

export function textToSegments(text: string): Segment[] {
  if (!text) return [];
  // Split keeping whitespace as separate tokens so toggling words is intuitive.
  const tokens = text.match(/\S+|\s+/g) ?? [];
  return tokens.map((t) => ({ text: t, highlighted: false }));
}

export function segmentsToText(segs: Segment[]): string {
  return segs.map((s) => s.text).join("");
}

export function mergeAdjacent(segs: Segment[]): Segment[] {
  const out: Segment[] = [];
  for (const s of segs) {
    const last = out[out.length - 1];
    if (last && last.highlighted === s.highlighted) {
      last.text += s.text;
    } else {
      out.push({ ...s });
    }
  }
  return out;
}
