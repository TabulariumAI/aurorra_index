import { useLayoutEffect, useRef, useState } from "react";
import { Icon } from "aurora-core";
import type { MetesScene } from "../type/metes.types";
import { legalMapColors, legalMapConstants, legalMapStyles } from "../style/legalMapStyles";
import { surveyStyles } from "../style/surveyStyles";
import { MapSurface } from "./MapSurface";

const labelGap = 2;

export function MetesMap({ scenes }: { scenes: MetesScene[] }) {
  const drawingRef = useRef<SVGSVGElement>(null);
  const [scale, setScale] = useState(1);
  const [activePoint, setActivePoint] = useState<SVGCircleElement | null>(null);
  const items = scenes.flatMap(scene => scene.items);
  const points = items.flatMap(item => {
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
  const frameWidth = spanX / legalMapConstants.parcelScale + legalMapConstants.labelInset * 2 / scale;
  const frameHeight = spanY / legalMapConstants.parcelScale + legalMapConstants.labelInset * 2 / scale;
  const frame = { x: (minX + maxX - frameWidth) / 2, y: (minY + maxY - frameHeight) / 2, width: frameWidth, height: frameHeight };
  const fontSize = legalMapConstants.lotBaseFontSize / scale;

  useLayoutEffect(() => {
    const drawing = drawingRef.current!;
    const measure = () => {
      const { width, height } = drawing.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const nextScale = Math.min((width - legalMapConstants.labelInset * 2) / spanX, (height - legalMapConstants.labelInset * 2) / spanY) * legalMapConstants.parcelScale;
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
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(drawing);
    return () => observer.disconnect();
  }, [frame.width, frame.height, spanX, spanY, fontSize, scenes, activePoint]);

  return <>
    {scenes.filter(scene => scene.issue).map((scene, index) => <div key={index} role="note" style={surveyStyles.warning}><Icon name="info" /><span>{scene.issue}{scene.schematic ? " Dashed segments are schematic." : ""}</span></div>)}
    <MapSurface style={surveyStyles.viewport} footer={<div aria-label="Map legend" className="legal-map-legend" style={legalMapStyles.legendItems}>
      <span style={legalMapStyles.legendItem}><span style={surveyStyles.legendLine} /><span>Parcel boundary</span></span>
      {items.some(item => !item.confirmed) ? <span style={legalMapStyles.legendItem}><span style={surveyStyles.unconfirmedLine} /><span>Unconfirmed</span></span> : null}
      {scenes.some(scene => scene.beginning !== undefined && scene.beginning > 0) ? <span style={legalMapStyles.legendItem}><span style={surveyStyles.tieLegendLine} /><span>Tie line</span></span> : null}
    </div>}>
      <svg ref={drawingRef} role="img" aria-label={scenes[0].title + " schematic"} viewBox={[frame.x, frame.y, frame.width, frame.height].join(" ")} style={surveyStyles.drawing}>
        {scenes.map((scene, group) => {
          const lines = scene.items;
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
      </svg>
    </MapSurface>
  </>;
}
