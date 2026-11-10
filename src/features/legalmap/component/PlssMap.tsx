import { useId, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "aurora-core";
import { labelValue } from "../data/legalData";
import type { PlssItem, PlssScene } from "../type/plss.types";
import { blockStyle, legalMapColors, legalMapConstants, legalMapStyles, legendBoxStyle } from "../style/legalMapStyles";
import { surveyStyles } from "../style/surveyStyles";
import { MapSurface } from "./MapSurface";

const contextFont = legalMapConstants.lotBaseFontSize * 1.35;

export function PlssMap({ scenes }: { scenes: PlssScene[] }) {
  const id = useId();
  const drawingRef = useRef<SVGSVGElement>(null);
  const [scale, setScale] = useState(1);
  const [verticalOffset, setVerticalOffset] = useState(0);
  const [contextSize, setContextSize] = useState(contextFont);
  const items = scenes.flatMap(scene => scene.items);
  const sections = new Map<string, PlssItem>();
  for (const item of items) {
    if (item.role !== "section") continue;
    const key = `${item.x}:${item.y}:${item.label}`;
    const previous = sections.get(key);
    sections.set(key, { ...item, highlighted: item.highlighted || Boolean(previous?.highlighted) });
  }
  const points = items.flatMap(item => [{ x: item.x, y: item.y }, { x: item.x + item.width, y: item.y + item.height }]);
  const minX = Math.min(...points.map(point => point.x));
  const maxX = Math.max(...points.map(point => point.x));
  const minY = Math.min(...points.map(point => point.y));
  const maxY = Math.max(...points.map(point => point.y));
  const extent = Math.max(maxX - minX, maxY - minY, 1);
  const frameWidth = (maxX - minX + extent * 0.24) / legalMapConstants.plssScale;
  const frameHeight = (maxY - minY + extent * 0.24) / legalMapConstants.plssScale;
  const frame = { x: (minX + maxX - frameWidth) / 2, y: (minY + maxY - frameHeight) / 2 + verticalOffset, width: frameWidth, height: frameHeight };
  const fontSize = legalMapConstants.lotBaseFontSize / scale;
  const context = [...new Set(scenes.flatMap(scene => scene.notes).filter(note => note.label === "Township" || note.label === "Range").map(note => note.label + " " + labelValue(note.value, note.label === "Township" ? "town(?:ship)?" : "range").replace(/\b(NORTH|SOUTH|EAST|WEST)\b/gi, direction => direction[0].toUpperCase() + direction.slice(1).toLowerCase())))].join(" · ");

  useLayoutEffect(() => {
    const drawing = drawingRef.current!;
    const measure = () => {
      const { width, height } = drawing.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const nextScale = Math.min(width / frame.width, height / frame.height);
      setScale(nextScale);
      setVerticalOffset(height * (0.5 - legalMapConstants.plssCenter) / nextScale);
      if (context) {
        const caption = drawing.querySelector<SVGTextElement>("[data-survey-context]")!;
        const box = caption.getBoundingClientRect();
        if (box.width > 0 && box.height > 0) {
          const captionSize = parseFloat(getComputedStyle(caption).fontSize) * nextScale;
          setContextSize(Math.min(contextFont, captionSize * (width - legalMapConstants.gridSize) / box.width, captionSize * (extent * 0.12 * nextScale - 8) / box.height));
        }
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(drawing);
    return () => observer.disconnect();
  }, [context, extent, frame.width, frame.height, fontSize, scenes]);

  return <>
    {scenes.filter(scene => scene.issue).map((scene, index) => <div key={index} role="note" style={surveyStyles.warning}><Icon name="info" /><span>{scene.issue}</span></div>)}
    <MapSurface style={surveyStyles.viewport} footer={<div aria-label="Map legend" className="legal-map-legend" style={legalMapStyles.legendItems}>
      <span style={legalMapStyles.legendItem}><span style={legendBoxStyle("#b6e3f5", legalMapColors.parcelLine)} /><span style={legalMapStyles.legendLabel}>Subject</span></span>
      <span style={legalMapStyles.legendItem}><span style={legendBoxStyle("#f3edcf", legalMapColors.sectionLine)} /><span style={legalMapStyles.legendLabel}>Section</span></span>
    </div>}>
      <svg ref={drawingRef} role="img" aria-label={scenes[0].title + " schematic"} aria-describedby={context ? id + "-context" : undefined} viewBox={[frame.x, frame.y, frame.width, frame.height].join(" ")} style={surveyStyles.drawing}>
        <defs><pattern id={id + "-partial"} width={fontSize} height={fontSize} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={fontSize} height={fontSize} fill="#cdebf5" />
          <line x1="0" y1="0" x2="0" y2={fontSize} stroke="#369ac2" strokeWidth={fontSize / 6} opacity="0.45" />
        </pattern></defs>
        {[...sections.values()].map(item => <rect key={`${item.x}:${item.y}:${item.label}`} data-survey-section-area={item.label} x={item.x} y={item.y} width={item.width} height={item.height} fill={item.highlighted ? "#f3edcf" : legalMapColors.blockBg} fillOpacity="0.35" stroke={legalMapColors.sectionLine} strokeWidth="2" vectorEffect="non-scaling-stroke" />)}
        {scenes.map((scene, group) => <g key={group} data-survey-group={group + 1}>
            {scene.items.map((item, index) => {
              if (item.role === "section") return null;
              const labelSize = Math.min(legalMapConstants.lotBaseFontSize / scale, (item.width - 8 / scale) / 4, (item.height - 8 / scale) / 3);
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
                  <tspan x={item.x + item.width / 2} dy="1.2em" fontSize={labelSize} fontWeight={legalMapStyles.lotCaption.fontWeight}>Subject</tspan>
                </text> : null}
              </g>;
            })}
          </g>)}
        {[...sections.values()].map(item => <g key={`${item.x}:${item.y}:${item.label}`}>
          <text data-survey-section={item.label} x={item.x + item.width / 2} y={item.y + item.height * 0.12 + 2 / scale} dominantBaseline="hanging" textAnchor="middle" fontSize={Math.min(legalMapConstants.blockBaseFontSize * legalMapConstants.amp / scale, item.height / 4)} fontWeight={blockStyle.fontWeight} fill={item.highlighted ? legalMapColors.text : legalMapColors.secondaryText}>{item.label}</text>
        </g>)}
        {context ? <text id={id + "-context"} data-survey-context="true" x={(minX + maxX) / 2} y={maxY + extent * 0.06} dominantBaseline="central" textAnchor="middle" fontSize={contextSize / scale} style={surveyStyles.context}>{context}</text> : null}
      </svg>
    </MapSurface>
  </>;
}
