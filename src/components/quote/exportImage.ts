import { toPng } from "html-to-image";
import { createRoot } from "react-dom/client";
import { createElement } from "react";
import { QuoteCanvas, type CanvasProps } from "./Canvas";

export async function exportQuotePng(
  props: Omit<CanvasProps, "onToggleSegment" | "onHighlightSelection" | "interactive" | "fitToContainer">,
  filename: string,
) {
  // Mount an off-screen, true-size canvas
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-99999px";
  host.style.top = "0";
  host.style.width = `${props.width}px`;
  host.style.height = `${props.height}px`;
  host.style.pointerEvents = "none";
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(
    createElement(QuoteCanvas, {
      ...props,
      interactive: false,
      fitToContainer: false,
    }),
  );

  // Wait for fonts + render
  await (document as any).fonts?.ready;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const target = host.firstElementChild?.firstElementChild as HTMLElement;
  if (!target) {
    root.unmount();
    host.remove();
    throw new Error("Render target not found");
  }

  const dataUrl = await toPng(target, {
    width: props.width,
    height: props.height,
    pixelRatio: 1,
    cacheBust: true,
  });

  root.unmount();
  host.remove();

  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
