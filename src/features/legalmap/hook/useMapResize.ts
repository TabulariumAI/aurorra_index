import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { legalMapConstants, legalMapStyles } from "../style/legalMapStyles";
import { useMapStore } from "../store/mapStore";

type MapLayout = { total: number; header: number; initial: number; min: number; max: number };

function mapSize(height: number, layout: MapLayout) {
  const limited = Math.min(layout.max, Math.max(layout.min, height));
  return { height: limited, ratio: (limited + layout.header) / layout.total };
}

export function useMapResize(view: string | undefined) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; y: number; height: number } | null>(null);
  const savedRatio = useMapStore((state) => state.detailsRatio);
  const saveRatio = useMapStore((state) => state.setDetailsRatio);
  const [layout, setLayout] = useState<MapLayout | null>(null);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const size = layout ? mapSize(dragHeight !== null ? dragHeight
    : savedRatio !== null ? savedRatio * layout.total - layout.header : layout.initial, layout) : null;

  useLayoutEffect(() => {
    if (!view) return;
    const body = bodyRef.current!;
    const info = infoRef.current!;
    const panel = panelRef.current!;
    const handle = handleRef.current!;
    const observer = new ResizeObserver(() => {
      const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      const total = body.getBoundingClientRect().height - handle.getBoundingClientRect().height;
      if (total <= 0) return;
      const header = info.getBoundingClientRect().height - panel.getBoundingClientRect().height;
      const available = Math.max(0, total - header);
      const mapMin = Math.min(available, legalMapConstants.mapMin * rem);
      const min = Math.max(Math.min(legalMapConstants.detailsMin * rem, Math.max(0, available - mapMin)), available - legalMapConstants.mapMax * rem);
      setLayout({ total, header, initial: legalMapConstants.detailsHeight * rem, min, max: Math.max(min, available - mapMin) });
    });
    observer.observe(body);
    observer.observe(info);
    return () => {
      observer.disconnect();
      drag.current = null;
    };
  }, [view]);

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    saveRatio(size!.ratio);
    setDragHeight(null);
    drag.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return {
    bodyRef,
    infoRef,
    panelRef,
    height: size ? size.height : legalMapStyles.infoPanel.height,
    separator: {
      ref: handleRef,
      role: "separator",
      "aria-label": "Resize map and details",
      "aria-orientation": "horizontal" as const,
      "aria-valuemin": layout ? Math.round(layout.min) : undefined,
      "aria-valuemax": layout ? Math.round(layout.max) : undefined,
      "aria-valuenow": size ? Math.round(size.height) : undefined,
      "aria-valuetext": size ? `${Math.round(size.ratio * 100)}% for details` : undefined,
      title: "Drag up or down to resize map and details",
      tabIndex: 0,
      onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0 || !size) return;
        drag.current = { pointerId: event.pointerId, y: event.clientY, height: size.height };
        event.currentTarget.setPointerCapture(event.pointerId);
      },
      onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
        if (drag.current?.pointerId !== event.pointerId) return;
        setDragHeight(drag.current.height + drag.current.y - event.clientY);
      },
      onPointerUp: finishDrag,
      onPointerCancel: finishDrag,
      onLostPointerCapture: () => { drag.current = null; setDragHeight(null); },
      onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
        if (!size) return;
        let height: number;
        switch (event.key) {
          case "ArrowUp": height = size.height + Number.parseFloat(getComputedStyle(document.documentElement).fontSize); break;
          case "ArrowDown": height = size.height - Number.parseFloat(getComputedStyle(document.documentElement).fontSize); break;
          case "Home": height = layout!.min; break;
          case "End": height = layout!.max; break;
          default: return;
        }
        event.preventDefault();
        saveRatio(mapSize(height, layout!).ratio);
      },
    },
  };
}
