import { useLayoutEffect, useRef } from "react";

export function usePlatFit(enabled: boolean, data: unknown) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!enabled || !viewport || !content) return;
    const fit = () => {
      const width = viewport.clientWidth;
      const height = viewport.clientHeight;
      if (width === 0 || height === 0) return;
      content.style.width = `${Math.max(384, width - 32)}px`;
      const scale = Math.min(1, (width - 32) / content.offsetWidth, (height - 32) / content.offsetHeight);
      content.style.transform = `translate(-50%, -50%) scale(${Math.max(0, scale)})`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(viewport);
    observer.observe(content);
    return () => {
      observer.disconnect();
      content.style.removeProperty("width");
      content.style.removeProperty("transform");
    };
  }, [enabled, data]);

  return { viewportRef, contentRef };
}
