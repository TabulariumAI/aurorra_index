import { useId, useLayoutEffect, useRef, useState } from "react";
import { labelValue } from "../data/legalData";
import type { PlssItem, PlssScene } from "../type/plss.types";
import { blockStyle, legalMapColors, legalMapConstants, legalMapStyles, legendBoxStyle } from "../style/legalMapStyles";
import { surveyStyles } from "../style/surveyStyles";
import { MapSurface } from "./MapSurface";

export function PlssMap({ scenes }: { scenes: PlssScene[] }) {
  const id = useId();
  const drawingRef = useRef<SVGSVGElement>(null);
  const [scale, setScale] = useState(1);
  const [labelPixels, setLabelPixels] = useState<number>(legalMapConstants.lotBaseFontSize);
  const items = scenes.flatMap(scene => scene.items);
  const sections = new Map<string, PlssItem>();
  for (const item of items) {
    if (item.role !== "section" || !item.highlighted) continue;
    const key = `${item.x}:${item.y}:${item.label}`;
    sections.set(key, item);
  }
  const points = [...sections.values()].flatMap(item => [{ x: item.x, y: item.y }, { x: item.x + item.width, y: item.y + item.height }]);
  const minX = Math.min(...points.map(point => point.x));
  const maxX = Math.max(...points.map(point => point.x));
  const minY = Math.min(...points.map(point => point.y));
  const maxY = Math.max(...points.map(point => point.y));
  const extent = Math.max(maxX - minX, maxY - minY, 1);
  const frameWidth = maxX - minX + extent * 0.32;
  const frameHeight = maxY - minY + extent * 0.32;
  const frame = { x: (minX + maxX - frameWidth) / 2, y: (minY + maxY - frameHeight) / 2, width: frameWidth, height: frameHeight };
  const fontSize = labelPixels / scale;
  const context = [...new Set(scenes.flatMap(scene => scene.notes).filter(note => note.label === "Township" || note.label === "Range").map(note => note.label + " " + labelValue(note.value, note.label === "Township" ? "town(?:ship)?" : "range").replace(/\b(NORTH|SOUTH|EAST|WEST)\b/gi, direction => direction[0].toUpperCase() + direction.slice(1).toLowerCase())))].join(" · ");

  useLayoutEffect(() => {
    const drawing = drawingRef.current!;
    const measure = () => {
      const { width, height } = drawing.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const nextScale = Math.min(width / frame.width, height / frame.height);
      setScale(nextScale);
      setLabelPixels(parseFloat(getComputedStyle(document.documentElement).fontSize));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(drawing);
    return () => observer.disconnect();
  }, [frame.width, frame.height, scenes]);

  return <MapSurface issues={scenes.filter(scene => scene.issue).map(scene => ({ title: scene.title, issue: scene.issue! }))} style={surveyStyles.viewport} footer={<div style={legalMapStyles.plssFooter}>
      {context ? <p id={id + "-context"} data-survey-context="true" style={legalMapStyles.plssContext}>{context}</p> : null}
      <div aria-label="Map legend" className="legal-map-legend" style={legalMapStyles.legendItems}>
      <span style={legalMapStyles.legendItem}><span style={legendBoxStyle("#b6e3f5", legalMapColors.parcelLine)} /><span style={legalMapStyles.legendLabel}>{items.some(item => item.role === "area" && item.partial) ? "Partial area" : "Described area"}</span></span>
      <span style={legalMapStyles.legendItem}><span style={legendBoxStyle(legalMapColors.divisionBg, legalMapColors.blockBorder)} /><span style={legalMapStyles.legendLabel}>Section</span></span>
    </div></div>}>
      <svg ref={drawingRef} role="img" aria-label={scenes[0].title + " schematic"} aria-describedby={context ? id + "-context" : undefined} viewBox={[frame.x, frame.y, frame.width, frame.height].join(" ")} style={surveyStyles.drawing}>
        <defs><pattern id={id + "-partial"} width={fontSize} height={fontSize} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={fontSize} height={fontSize} fill="#cdebf5" />
          <line x1="0" y1="0" x2="0" y2={fontSize} stroke="#369ac2" strokeWidth={fontSize / 6} opacity="0.45" />
        </pattern></defs>
        {[...sections.values()].map(item => <g key={`${item.x}:${item.y}:${item.label}`}>
          <rect data-survey-section-area={item.label} x={item.x} y={item.y} width={item.width} height={item.height} fill={legalMapColors.divisionBg} stroke={legalMapColors.blockBorder} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          <path data-plss-quarter-guide="true" d={`M ${item.x + item.width / 2} ${item.y} v ${item.height} M ${item.x} ${item.y + item.height / 2} h ${item.width}`} fill="none" stroke={legalMapColors.blockBorder} strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
        </g>)}
        {scenes.map((scene, group) => <g key={group} data-survey-group={group + 1}>
            {scene.items.map((item, index) => {
              if (item.role === "section") return null;
              const labelSize = Math.min(fontSize, (item.width - 8 / scale) / 4, (item.height - 8 / scale) / 3);
              const captionSize = item.caption ? Math.min(labelSize * legalMapConstants.amp, (item.width - 8 / scale) / item.caption.length) : labelSize;
              return <g key={index}>
                <title>{item.detail}</title>
                <rect data-survey-area={item.role === "area" ? "true" : undefined} data-survey-partial={item.partial ? "true" : undefined}
                  x={item.x} y={item.y} width={item.width} height={item.height}
                  fill={item.role === "area" ? item.partial ? "url(#" + id + "-partial)" : "#b6e3f5" : "none"}
                  fillOpacity={item.role === "area" ? 0.8 : 0.35} stroke={item.role === "area" ? legalMapColors.parcelLine : "#8c999b"}
                  strokeDasharray={item.role === "area" && !item.partial ? undefined : "4 3"} strokeWidth={item.role === "area" ? 3 : 1} vectorEffect="non-scaling-stroke" />
                {item.role === "area" && Math.min(labelSize, captionSize) * scale >= 12 ? <text x={item.x + item.width / 2} y={item.y + item.height / 2} textAnchor="middle" fontSize={labelSize * legalMapConstants.amp} fill={legalMapColors.text} pointerEvents="none">
                  {item.caption ? <tspan x={item.x + item.width / 2} dy="-0.3em" fontSize={captionSize}>{item.caption}</tspan> : null}
                  <tspan x={item.x + item.width / 2} dy="1.2em" fontSize={labelSize} fontWeight={legalMapStyles.lotCaption.fontWeight}>{item.partial ? "Partial area" : "Described area"}</tspan>
                </text> : null}
              </g>;
            })}
          </g>)}
        {[...sections.values()].map(item => <g key={`${item.x}:${item.y}:${item.label}`}>
          <text data-survey-section={item.label} x={item.x + item.width / 2} y={item.y + item.height * 0.12 + 2 / scale} dominantBaseline="hanging" textAnchor="middle" fontSize={Math.min(fontSize * legalMapConstants.amp, item.height / 4)} fontWeight={blockStyle.fontWeight} fill={legalMapColors.text}>{item.label === "Section" ? item.label : `Section ${item.label}`}</text>
        </g>)}

      </svg>
  </MapSurface>;
}
