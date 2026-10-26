import assert from "node:assert/strict";
import test from "node:test";
import {
  applySegmentPatch,
  getRangeStyles,
  mergeAdjacent,
  segmentsToText,
  textToSegments,
  toggleRangeStyle,
  toggleRangeHighlight,
  rangeHasHighlight,
  type Segment,
} from "../src/components/quote/types.ts";

test("partial text formatting preserves surrounding text, styles, and highlight colors", () => {
  const original: Segment[] = [{ text: "hello world", highlightColor: "#ffe066", italic: true }];
  const result = toggleRangeStyle(original, 2, 8, "bold");
  assert.deepEqual(
    result.map((s) => s.text),
    ["he", "llo wo", "rld"],
  );
  assert.equal(segmentsToText(result), "hello world");
  assert.ok(result.every((s) => s.italic && s.highlightColor === "#ffe066"));
  assert.equal(result[1].bold, true);
  assert.equal(original[0].bold, undefined);
});

test("all four styles combine and toggle independently across mixed ranges", () => {
  let result = textToSegments("one two three");
  result = toggleRangeStyle(result, 0, 3, "bold");
  for (const style of ["bold", "italic", "underline", "strikethrough"] as const) {
    result = toggleRangeStyle(result, 0, 7, style);
  }
  assert.deepEqual(getRangeStyles(result, 0, 7), {
    bold: true,
    italic: true,
    underline: true,
    strikethrough: true,
  });
  result = toggleRangeStyle(result, 0, 7, "underline");
  assert.deepEqual(getRangeStyles(result, 0, 7), {
    bold: true,
    italic: true,
    underline: false,
    strikethrough: true,
  });
  assert.equal(getRangeStyles(result, 8, 13).bold, false);
});

test("recoloring and clearing highlights retain all text styles", () => {
  let result = toggleRangeStyle(textToSegments("hello world"), 0, 5, "bold");
  result = applySegmentPatch(result, 0, 11, { highlightColor: "#ff0000" });
  result = applySegmentPatch(result, 2, 8, { highlightColor: "#00ff00" });
  assert.equal(getRangeStyles(result, 0, 5).bold, true);
  result = mergeAdjacent(result.map((s) => ({ ...s, highlightColor: null })));
  assert.equal(getRangeStyles(result, 0, 5).bold, true);
  assert.equal(getRangeStyles(result, 6, 11).bold, false);
  assert.ok(result.every((s) => s.highlightColor === null));
});

test("merging respects every style boundary and normalizes absent/false flags", () => {
  const segments: Segment[] = [
    { text: "a", highlightColor: null, bold: true },
    { text: "b", highlightColor: null },
    { text: "c", highlightColor: null, bold: false },
  ];
  assert.deepEqual(
    mergeAdjacent(segments).map((s) => s.text),
    ["a", "bc"],
  );
  assert.equal(segments[1].text, "b");
});

test("bold alone, highlight alone, and both are independent choices", () => {
  const original = textToSegments("hello world");
  const boldOnly = toggleRangeStyle(original, 0, 5, "bold");
  assert.ok(boldOnly.every((seg) => seg.highlightColor === null));
  const highlightOnly = toggleRangeHighlight(original, 0, 5, "#ffe066");
  assert.equal(rangeHasHighlight(highlightOnly, 0, 5, "#ffe066"), true);
  assert.equal(getRangeStyles(highlightOnly, 0, 5).bold, false);
  const both = toggleRangeHighlight(boldOnly, 0, 5, "#ffe066");
  assert.equal(getRangeStyles(both, 0, 5).bold, true);
  assert.equal(rangeHasHighlight(both, 0, 5, "#ffe066"), true);
  const backToBold = toggleRangeHighlight(both, 0, 5, "#ffe066");
  assert.equal(getRangeStyles(backToBold, 0, 5).bold, true);
  assert.ok(backToBold.every((seg) => seg.highlightColor === null));
  const backToHighlight = toggleRangeStyle(both, 0, 5, "bold");
  assert.equal(rangeHasHighlight(backToHighlight, 0, 5, "#ffe066"), true);
  assert.equal(getRangeStyles(backToHighlight, 0, 5).bold, false);
});

test("highlight toggles handle partial ranges, mixed colors, and recoloring without changing styles", () => {
  const original: Segment[] = [
    { text: "hello", highlightColor: "#ffe066", italic: true },
    { text: " world", highlightColor: null },
  ];
  const highlighted = toggleRangeHighlight(original, 2, 8, "#00ff00");
  assert.equal(rangeHasHighlight(highlighted, 2, 8, "#00ff00"), true);
  assert.equal(getRangeStyles(highlighted, 0, 5).italic, true);
  const cleared = toggleRangeHighlight(highlighted, 2, 8, "#00ff00");
  assert.equal(rangeHasHighlight(cleared, 2, 8, "#00ff00"), false);
  assert.equal(rangeHasHighlight(cleared, 0, 2, "#ffe066"), true);
  assert.equal(segmentsToText(cleared), "hello world");
});
