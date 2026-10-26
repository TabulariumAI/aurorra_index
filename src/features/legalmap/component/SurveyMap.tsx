import { useId, useLayoutEffect, useRef, useState } from "react";
import { Icon, rowStyles } from "aurora-core";
import * as Tooltip from "@radix-ui/react-tooltip";
import { labelValue } from "../data/legalData";
import { formatMeasure, type SurveyItem, type SurveyScene } from "../data/surveyData";
import { blockStyle, legalMapColors, legalMapConstants, legalMapStyles, legendBoxStyle } from "../style/legalMapStyles";
import { surveyStyles } from "../style/surveyStyles";
import { MapIssue, MapSurface } from "./MapSurface";

const contextFont = legalMapConstants.lotBaseFontSize * 1.35;
const labelGap = 2;

export function SurveyMap({ scenes }: { scenes: SurveyScene[] }) {
  const id = useId();
  const drawingRef = useRef<SVGSVGElement>(null);
  const [scale, setScale] = useState(1);
  const [activePoint, setActivePoint] = useState<SVGCircleElement | null>(null);
  const [verticalOffset, setVerticalOffset] = useState(0);
  const [contextSize, setContextSize] = useState(contextFont);
  const items = scenes.flatMap(scene => scene.items);
  const sections = new Map<string, Extract<SurveyItem, { kind: "rect" }>>();
  for (const item of items) {
    if (item.kind !== "rect" || item.role !== "section") continue;
    const key = `${item.x}:${item.y}:${item.label}`;
    const previous = sections.get(key);
    sections.set(key, { ...item, highlighted: item.highlighted || Boolean(previous?.highlighted) });
  }
  const boundary = scenes.some(scene => scene.courses !== undefined);
  const points = items.flatMap(item => {
    if (item.kind !== "line") return [{ x: item.x, y: item.y }, { x: item.x + item.width, y: item.y + item.height }];
    const points = [item.from, item.to];
    if (item.arc) {
      const { center, radius, sweep, turn } = item.arc;
      const start = Math.atan2(item.from.y - center.y, item.from.x - center.x);
      for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
        if (((turn * (angle - start)) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) <= sweep) points.push({ x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) });
      }
    }
    return points;
  });
  const minX = Math.min(...points.map(point => point.x));
  const maxX = Math.max(...points.map(point => point.x));
  const minY = Math.min(...points.map(point => point.y));
  const maxY = Math.max(...points.map(point => point.y));
  const spanX = Math.max(maxX - minX, maxY === minY ? 1 : 0);
  const spanY = Math.max(maxY - minY, maxX === minX ? 1 : 0);
  const extent = Math.max(maxX - minX, maxY - minY, 1);
  const frameWidth = boundary ? spanX / legalMapConstants.parcelScale + legalMapConstants.labelInset * 2 / scale : (maxX - minX + extent * 0.24) / legalMapConstants.plssScale;
  const frameHeight = boundary ? spanY / legalMapConstants.parcelScale + legalMapConstants.labelInset * 2 / scale : (maxY - minY + extent * 0.24) / legalMapConstants.plssScale;
  const frame = { x: (minX + maxX - frameWidth) / 2, y: (minY + maxY - frameHeight) / 2 + (boundary ? 0 : verticalOffset), width: frameWidth, height: frameHeight };
  const fontSize = legalMapConstants.lotBaseFontSize / scale;
  const context = [...new Set(scenes.flatMap(scene => scene.notes).filter(note => note.label === "Township" || note.label === "Range").map(note => note.label + " " + labelValue(note.value, note.label === "Township" ? "town(?:ship)?" : "range").replace(/\b(NORTH|SOUTH|EAST|WEST)\b/gi, direction => direction[0].toUpperCase() + direction.slice(1).toLowerCase())))].join(" · ");

  useLayoutEffect(() => {
    const drawing = drawingRef.current!;
    const measure = () => {
      const { width, height } = drawing.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const nextScale = boundary
        ? Math.min((width - legalMapConstants.labelInset * 2) / spanX, (height - legalMapConstants.labelInset * 2) / spanY) * legalMapConstants.parcelScale
        : Math.min(width / frame.width, height / frame.height);
      setScale(nextScale);
      const matrix = drawing.getScreenCTM?.();
      if (matrix) {
        const bounds = drawing.getBoundingClientRect();
        const inverse = matrix.inverse();
        const occupied = [...drawing.querySelectorAll("[data-survey-point]")].map(point => point.getBoundingClientRect());
        const segments = [...drawing.querySelectorAll<SVGLineElement>("line[data-survey-line], line[data-survey-reference]")].map(line => ({
          from: new DOMPoint(line.x1.baseVal.value, line.y1.baseVal.value).matrixTransform(matrix),
          to: new DOMPoint(line.x2.baseVal.value, line.y2.baseVal.value).matrixTransform(matrix),
        }));
        const labels = [...drawing.querySelectorAll<SVGTextElement>("[data-survey-label]"), ...drawing.querySelectorAll<SVGTextElement>("[data-survey-vertex]")];
        const activeLabel = activePoint && drawing.contains(activePoint) ? activePoint.parentElement!.querySelector<SVGTextElement>("[data-survey-vertex]") : null;
        if (activeLabel) {
          labels.splice(labels.indexOf(activeLabel), 1);
          labels.unshift(activeLabel);
        }
        for (const label of labels) {
          const leader = label.hasAttribute("data-survey-vertex") ? label.parentElement!.querySelector<SVGLineElement>("[data-survey-leader]") : null;
          label.removeAttribute("transform");
          if (leader) leader.style.visibility = "hidden";
          const box = label.getBoundingClientRect();
          const candidates = [{ x: box.left, y: box.top }];
          for (let y = bounds.top + labelGap; y + box.height <= bounds.bottom - labelGap; y += box.height + labelGap * 2) {
            for (let x = bounds.left + labelGap; x + box.width <= bounds.right - labelGap; x += box.width + labelGap * 2) candidates.push({ x, y });
          }
          candidates.sort((a, b) => Math.hypot(a.x - box.left, a.y - box.top) - Math.hypot(b.x - box.left, b.y - box.top));
          const position = candidates.find(({ x, y }) => x >= bounds.left && y >= bounds.top && x + box.width <= bounds.right && y + box.height <= bounds.bottom
            && !occupied.some(previous => x < previous.right + labelGap && x + box.width > previous.left - labelGap && y < previous.bottom + labelGap && y + box.height > previous.top - labelGap)
            && !segments.some(({ from, to }) => {
              const left = x - labelGap;
              const right = x + box.width + labelGap;
              const top = y - labelGap;
              const bottom = y + box.height + labelGap;
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              return [from, to].some(point => point.x >= left && point.x <= right && point.y >= top && point.y <= bottom)
                || [left, right].some(edge => dx !== 0 && (edge - from.x) / dx >= 0 && (edge - from.x) / dx <= 1 && from.y + (edge - from.x) / dx * dy >= top && from.y + (edge - from.x) / dx * dy <= bottom)
                || [top, bottom].some(edge => dy !== 0 && (edge - from.y) / dy >= 0 && (edge - from.y) / dy <= 1 && from.x + (edge - from.y) / dy * dx >= left && from.x + (edge - from.y) / dy * dx <= right);
            }));
          label.style.visibility = position ? "visible" : "hidden";
          if (!position) continue;
          occupied.push(new DOMRect(position.x, position.y, box.width, box.height));
          if (position.x !== box.left || position.y !== box.top) {
            const offset = new DOMPoint(position.x - box.left, position.y - box.top).matrixTransform(new DOMMatrix([inverse.a, inverse.b, inverse.c, inverse.d, 0, 0]));
            label.setAttribute("transform", `translate(${offset.x} ${offset.y})`);
            if (leader) {
              const point = label.parentElement!.querySelector<SVGCircleElement>("[data-survey-point]")!;
              const anchor = new DOMPoint(point.cx.baseVal.value, point.cy.baseVal.value).matrixTransform(matrix);
              const end = new DOMPoint(Math.max(position.x, Math.min(position.x + box.width, anchor.x)), Math.max(position.y, Math.min(position.y + box.height, anchor.y))).matrixTransform(inverse);
              leader.setAttribute("x2", String(end.x));
              leader.setAttribute("y2", String(end.y));
              leader.style.visibility = "visible";
            }
          }
        }
      }
      if (!boundary) setVerticalOffset(height * (0.5 - legalMapConstants.plssCenter) / nextScale);
      if (!boundary && context) {
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
  }, [boundary, context, extent, frame.width, frame.height, spanX, spanY, fontSize, scenes, activePoint]);

  return <>
    {scenes.filter(scene => scene.issue).map((scene, index) => <div key={index} role="note" style={surveyStyles.warning}><Icon name="info" /><span>{scene.issue}{scene.schematic ? " Dashed segments are schematic." : ""}</span></div>)}
    <MapSurface style={surveyStyles.viewport} footer={<div aria-label="Map legend" className="legal-map-legend" style={legalMapStyles.legendItems}>
      {boundary ? <>
        <span style={legalMapStyles.legendItem}><span style={surveyStyles.legendLine} /><span>Parcel boundary</span></span>
        {items.some(item => item.kind === "line" && !item.confirmed) ? <span style={legalMapStyles.legendItem}><span style={surveyStyles.unconfirmedLine} /><span>Unconfirmed</span></span> : null}
        {scenes.some(scene => scene.beginning !== undefined && scene.beginning > 0) ? <span style={legalMapStyles.legendItem}><span style={surveyStyles.tieLegendLine} /><span>Tie line</span></span> : null}
      </> : <>
        <span style={legalMapStyles.legendItem}><span style={legendBoxStyle("#b6e3f5", legalMapColors.parcelLine)} /><span style={legalMapStyles.legendLabel}>Subject</span></span>
        <span style={legalMapStyles.legendItem}><span style={legendBoxStyle("#f3edcf", legalMapColors.sectionLine)} /><span style={legalMapStyles.legendLabel}>Section</span></span>
      </>}
    </div>}>
      <svg ref={drawingRef} role="img" aria-label={scenes[0].title + " schematic"} aria-describedby={!boundary && context ? id + "-context" : undefined} viewBox={[frame.x, frame.y, frame.width, frame.height].join(" ")} style={surveyStyles.drawing}>
        <defs><pattern id={id + "-partial"} width={fontSize} height={fontSize} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={fontSize} height={fontSize} fill="#cdebf5" />
          <line x1="0" y1="0" x2="0" y2={fontSize} stroke="#369ac2" strokeWidth={fontSize / 6} opacity="0.45" />
        </pattern></defs>
        {[...sections.values()].map(item => <rect key={`${item.x}:${item.y}:${item.label}`} data-survey-section-area={item.label} x={item.x} y={item.y} width={item.width} height={item.height} fill={item.highlighted ? "#f3edcf" : legalMapColors.blockBg} fillOpacity="0.35" stroke={legalMapColors.sectionLine} strokeWidth="2" vectorEffect="non-scaling-stroke" />)}
        {scenes.map((scene, group) => {
          const lines = scene.items.filter(item => item.kind === "line");
          const beginning = scene.beginning;
          const edges = scene.closed ? lines.filter(line => line.sequence > beginning! && line.sequence <= scene.ending!) : [];
          const origin = edges[0]?.from;
          const vertices = lines.flatMap((line, index) => {
            const previous = lines[index - 1];
            return [
              ...(previous && previous.sequence + 1 !== line.sequence ? [{ point: previous.to, number: previous.sequence + 1 }] : []),
              { point: line.from, number: line.sequence },
            ];
          }).concat(lines.length === 0 || lines.at(-1)!.sequence === scene.ending ? [] : [{ point: lines.at(-1)!.to, number: lines.at(-1)!.sequence + 1 }]);
          return <g key={group} data-survey-group={group + 1}>
            {lines.length > 0 ? <line data-survey-reference="true" x1={lines[0].from.x} y1={frame.y} x2={lines[0].from.x} y2={frame.y + frame.height} stroke={legalMapColors.secondaryText} strokeWidth="1" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" /> : null}
            {origin ? <path data-boundary-fill="true" d={"M " + origin.x + " " + origin.y + " " + edges.map((line, index) => "L " + (index === edges.length - 1 ? origin.x : line.to.x) + " " + (index === edges.length - 1 ? origin.y : line.to.y)).join(" ") + " Z"} fill={legalMapColors.parcelFill} fillOpacity="0.25" /> : null}
            {scene.items.map((item, index) => {
              if (item.kind === "line") {
                const tie = beginning !== undefined && item.sequence <= beginning;
                const end = origin && item.sequence === scene.ending ? origin : item.to;
                const stroke = {
                  "data-survey-line": "true",
                  "data-survey-tie": tie ? "true" : undefined,
                  "data-unconfirmed": !item.confirmed ? "true" : undefined,
                  stroke: tie ? legalMapColors.secondaryText : !item.confirmed ? legalMapColors.unconfirmed : legalMapColors.parcelLine,
                  strokeWidth: tie ? 1 : 3,
                  strokeDasharray: tie ? "1 5" : !item.confirmed ? "6 4" : undefined,
                  strokeLinecap: tie ? "round" as const : undefined,
                  strokeOpacity: tie ? 0.25 : undefined,
                  vectorEffect: "non-scaling-stroke",
                };
                return <g key={index}>
                  <title>{item.detail}</title>
                  {item.arc ? <path {...stroke} data-survey-arc="true" d={`M ${item.from.x} ${item.from.y} A ${item.arc.radius} ${item.arc.radius} 0 ${item.arc.sweep > Math.PI ? 1 : 0} ${item.arc.turn === 1 ? 1 : 0} ${item.to.x} ${item.to.y}`} fill="none" />
                    : <line {...stroke} x1={item.from.x} y1={item.from.y} x2={end.x} y2={end.y} />}
                </g>;
              }
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
            {vertices.map(({ point, number }, index) => {
              const right = index === 0 && beginning !== undefined && beginning > 0 && point.x > lines.find(line => line.sequence === beginning)!.to.x;
              return <g key={index}>
                <line data-survey-leader={number} x1={point.x} y1={point.y} x2={point.x} y2={point.y} stroke={legalMapColors.secondaryText} strokeWidth="1" vectorEffect="non-scaling-stroke" style={{ visibility: "hidden", pointerEvents: "none" }} />
                <circle data-survey-point={number} cx={point.x} cy={point.y} r={2.5 / scale} fill={legalMapColors.parcelLine}
                  tabIndex={0} role="img" aria-label={`Group ${group + 1}, point ${number}`} stroke="transparent" strokeWidth={12 / scale}
                  onMouseEnter={event => setActivePoint(event.currentTarget)} onMouseLeave={event => { if (document.activeElement !== event.currentTarget) setActivePoint(null); }}
                  onFocus={event => setActivePoint(event.currentTarget)} onBlur={() => setActivePoint(null)} />
                <text data-survey-vertex={number} x={point.x + fontSize / 2} y={point.y - fontSize / 2} fontSize={fontSize} fill={legalMapColors.text}>{number}</text>
                {beginning !== undefined && (number === beginning + 1 || (index === 0 && beginning > 0)) ? <text data-survey-label="true" x={point.x + (right ? 1 : -1) * fontSize * 0.75} y={point.y + fontSize / 3} fontSize={fontSize} textAnchor={right ? "start" : "end"} fill={legalMapColors.parcelLine}>{number === beginning + 1 ? "POB" : "POC"}</text> : null}
              </g>;
            })}
          </g>;
        })}
        {[...sections.values()].map(item => <g key={`${item.x}:${item.y}:${item.label}`}>
          <text data-survey-section={item.label} x={item.x + item.width / 2} y={item.y + item.height * 0.12 + 2 / scale} dominantBaseline="hanging" textAnchor="middle" fontSize={Math.min(legalMapConstants.blockBaseFontSize * legalMapConstants.amp / scale, item.height / 4)} fontWeight={blockStyle.fontWeight} fill={item.highlighted ? legalMapColors.text : legalMapColors.secondaryText}>{item.label}</text>
        </g>)}
        {!boundary && context ? <text id={id + "-context"} data-survey-context="true" x={(minX + maxX) / 2} y={maxY + extent * 0.06} dominantBaseline="central" textAnchor="middle" fontSize={contextSize / scale} style={surveyStyles.context}>{context}</text> : null}
      </svg>
    </MapSurface>
  </>;
}

export function SurveyCourses({ scene, showTitle, showIssue }: { scene: SurveyScene; showTitle: boolean; showIssue: boolean }) {
  const measurements = scene.notes.filter(note => note.label === "Bearings" || note.label === "Distances");
  const issue = showIssue && scene.issue ? <MapIssue title={scene.title} issue={scene.issue} /> : null;
  if (!scene.courses?.length && measurements.length === 0 && !issue) return null;
  if (!scene.courses?.length) return <section aria-label={`${scene.title} extracted measurements`} style={legalMapStyles.infoCard}>
    {showTitle ? <h4 style={legalMapStyles.infoTitle}>{scene.title}</h4> : null}
    {issue}
    <dl style={surveyStyles.measurements}>{measurements.map((note, index) => <div key={index}>
      <dt style={surveyStyles.measurementLabel}>{note.label}</dt>
      <dd style={surveyStyles.measurementValue}>{formatMeasure(note.value, note.label === "Bearings")}</dd>
    </div>)}</dl>
  </section>;
  return <Tooltip.Provider delayDuration={250}>{issue}<table aria-label="Boundary Calls" className="legal-map-table legal-map-calls" style={{ ...surveyStyles.notes, minWidth: "30rem" }}>
    {showTitle ? <caption style={legalMapStyles.infoTitle}>{scene.title}</caption> : null}
    <colgroup><col style={{ width: "2rem" }} /><col style={{ width: "6rem" }} /><col /><col style={{ width: "7rem" }} /><col style={{ width: "7rem" }} /></colgroup>
    <thead><tr>{["#", "Boundary", "Bearing", "Distance", "Status"].map(label => <th key={label} scope="col" style={surveyStyles.cell}>{label}</th>)}</tr></thead>
    <tbody>{scene.courses!.map((course, index) => <tr key={index} style={course.confirmed ? undefined : surveyStyles.unconfirmedRow}>
      <td style={surveyStyles.cell}>{index + 1}</td>
      <td style={surveyStyles.cell}>{scene.beginning !== undefined && index < scene.beginning ? "Tie" : (index + 1) + " → " + (course.target ?? index + 2)}</td>
      <td style={surveyStyles.cell}>{formatMeasure(course.bearing, true)}</td>
      <td style={surveyStyles.cell}>{course.distance ? formatMeasure(course.distance, false) : "—"}</td>
      <td style={surveyStyles.cell}>{course.confirmed ? "Confirmed" : <Tooltip.Root>
        <Tooltip.Trigger asChild><button type="button" style={surveyStyles.status}>Unconfirmed</button></Tooltip.Trigger>
        <Tooltip.Portal><Tooltip.Content collisionPadding={8} sideOffset={6} style={{ ...rowStyles.tooltip, maxWidth: "min(24rem, calc(100vw - 1rem))", overflowWrap: "anywhere" }}>{course.issue}</Tooltip.Content></Tooltip.Portal>
      </Tooltip.Root>}</td>
    </tr>)}</tbody>
  </table></Tooltip.Provider>;
}
