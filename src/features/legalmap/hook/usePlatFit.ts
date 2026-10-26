import { useLayoutEffect, useRef } from "react";
import { legalMapConstants } from "../style/legalMapStyles";

export function usePlatFit(data: unknown) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;
    const drawing = viewport.parentElement!;
    const fit = () => {
      const width = viewport.clientWidth;
      const height = viewport.clientHeight;
      if (width === 0 || height === 0) return;
      const naturalWidth = legalMapConstants.platWidth * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      const scrolling = width < naturalWidth;
      viewport.dataset.platScroll = String(scrolling);
      viewport.tabIndex = scrolling ? 0 : -1;
      viewport.style.flex = scrolling ? "0 0 auto" : "1 1 0";
      viewport.style.overflowX = scrolling ? "auto" : "hidden";
      viewport.style.overflowY = "hidden";
      content.style.width = `${scrolling ? naturalWidth : width}px`;
      content.style.position = scrolling ? "relative" : "absolute";
      content.style.left = scrolling ? "0" : "50%";
      content.style.top = scrolling ? "0" : "50%";
      if (scrolling) {
        content.style.transform = "none";
        viewport.style.minHeight = `${content.offsetHeight}px`;
        drawing.style.minHeight = `${content.offsetHeight}px`;
        return;
      }
      viewport.style.minHeight = "0";
      drawing.style.minHeight = `${legalMapConstants.drawingMin}rem`;
      viewport.scrollLeft = 0;
      const scale = Math.min(width / content.offsetWidth, height / content.offsetHeight);
      content.style.transform = `translate(-50%, -50%) scale(${scale})`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(viewport);
    observer.observe(content);
    return () => observer.disconnect();
  }, [data]);

  return { viewportRef, contentRef };
}
