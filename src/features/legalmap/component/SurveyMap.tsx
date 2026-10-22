import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { labelValue } from "../data/legalData";
import { parseDistance, type SurveyScene } from "../data/surveyData";
import { placeLabels } from "../data/labelLayout";
import { blockStyle, legalMapColors, legalMapConstants, legalMapStyles, legendBoxStyle } from "../style/legalMapStyles";
import { surveyStyles } from "../style/surveyStyles";
import { MapSurface } from "./MapSurface";

type SurveyPosition = { x: number; y: number; leader: { x: number; y: number } | null };
const contextFont = legalMapConstants.lotBaseFontSize * 1.35;

export function SurveyMap({ scene, controls }: { scene: SurveyScene; controls?: ReactNode }) {
  const id = useId();
  const drawingRef = useRef<SVGSVGElement>(null);
  const [labelScale, setLabelScale] = useState(1);
  const [verticalOffset, setVerticalOffset] = useState(0);
  const [contextSize, setContextSize] = useState(contextFont);
  const [labelPositions, setLabelPositions] = useState<(SurveyPosition & { vertex: number })[]>([]);
  const [badgePositions, setBadgePositions] = useState<SurveyPosition[]>([]);
  const lines = scene.items.filter(item => item.kind === "line");
  const boundary = lines.length > 0;
  const points = scene.items.flatMap(item => item.kind === "line" ? [item.from, item.to] : [{ x: item.x, y: item.y }, { x: item.x + item.width, y: item.y + item.height }]);
  const minX = Math.min(...points.map(point => point.x));
  const maxX = Math.max(...points.map(point => point.x));
  const minY = Math.min(...points.map(point => point.y));
  const maxY = Math.max(...points.map(point => point.y));
  const extent = Math.max(maxX - minX, maxY - minY, 1);
  const inset = legalMapConstants.labelInset / labelScale;
  const frameWidth = boundary ? (maxX - minX) / legalMapConstants.parcelScale + inset * 2 : (maxX - minX + extent * 0.24) / legalMapConstants.plssScale;
  const frameHeight = boundary ? (maxY - minY) / legalMapConstants.parcelScale + inset * 2 : (maxY - minY + extent * 0.24) / legalMapConstants.plssScale;
  const frame = { x: (minX + maxX - frameWidth) / 2, y: (minY + maxY - frameHeight) / 2 + (boundary ? 0 : verticalOffset), width: frameWidth, height: frameHeight };
  const fontSize = boundary ? legalMapConstants.lotBaseFontSize / labelScale : Math.max(frame.width, frame.height) / 24;
  const context = scene.notes.filter(note => note.label === "Township" || note.label === "Range").map(note => `${note.label} ${labelValue(note.value, note.label === "Township" ? "town(?:ship)?" : "range").replace(/\b(NORTH|SOUTH|EAST|WEST)\b/gi, direction => direction[0].toUpperCase() + direction.slice(1).toLowerCase())}`).join(" · ");
  const lengths = lines.map(line => Math.hypot(line.to.x - line.from.x, line.to.y - line.from.y));
  const closures = lines.slice(0, 2).map((line, index) => ({
    gap: Math.hypot(lines.at(-1)!.to.x - line.from.x, lines.at(-1)!.to.y - line.from.y),
    length: lengths.slice(index).reduce((sum, length) => sum + length, 0),
  }));
  const beginning = closures.findIndex(closure => closure.length > 0 && closure.gap <= closure.length * legalMapConstants.closureRatio);
  const tie = beginning === 1;
  const closed = beginning >= 0;
  const parcel = tie ? lines.slice(1) : lines;
  const closure = closures[closed ? beginning : 0];
  const distances = lines.map(line => parseDistance(line.distance)!);
  const distanceScale = Math.max(...distances.map(distance => distance.length));
  const vertices = boundary ? [...lines.map(line => line.from), ...(!closed ? [lines.at(-1)!.to] : [])] : [];

  useLayoutEffect(() => {
    const drawing = drawingRef.current!;
    const measure = () => {
      const { width, height } = drawing.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const scale = boundary
        ? (maxX > minX && maxY > minY ? Math.min((width - legalMapConstants.labelInset * 2) / (maxX - minX), (height - legalMapConstants.labelInset * 2) / (maxY - minY))
          : maxX > minX ? (width - legalMapConstants.labelInset * 2) / (maxX - minX)
            : maxY > minY ? (height - legalMapConstants.labelInset * 2) / (maxY - minY)
              : Math.min(width, height) / (legalMapConstants.labelInset * 2)) * legalMapConstants.parcelScale
        : Math.min(width / frame.width, height / frame.height);
      if (scale !== labelScale) {
        setLabelScale(scale);
        return;
      }
      if (!boundary) setVerticalOffset(height * (0.5 - legalMapConstants.plssCenter) / scale);
      if (!boundary && context) {
        const caption = drawing.querySelector<SVGTextElement>("[data-survey-context]")!;
        const box = caption.getBoundingClientRect();
        if (box.width > 0 && box.height > 0) {
          const captionSize = parseFloat(getComputedStyle(caption).fontSize) * scale;
          setContextSize(Math.min(contextFont, captionSize * (width - legalMapConstants.gridSize) / box.width, captionSize * (extent * 0.12 * scale - 8) / box.height));
        }
      }
      if (!closed) return;
      const matrix = drawing.getScreenCTM()!;
      const labels = [...drawing.querySelectorAll<SVGTextElement>("[data-survey-label]")];
      const bounds = drawing.getBoundingClientRect();
      const obstacles: Parameters<typeof placeLabels>[0]["obstacles"] = [
        ...[...drawing.querySelectorAll("[data-survey-point]")].map(node => node.getBoundingClientRect()),
        drawing.closest("[data-legal-map-surface]")!.querySelector("[data-legal-map-north]")!.getBoundingClientRect(),
      ];
      const segments = [...drawing.querySelectorAll<SVGLineElement>("[data-survey-line], [data-survey-reference], [data-survey-gap]")].map(line => ({
        from: new DOMPoint(line.x1.baseVal.value, line.y1.baseVal.value).matrixTransform(matrix),
        to: new DOMPoint(line.x2.baseVal.value, line.y2.baseVal.value).matrixTransform(matrix),
      }));
      const badges = [];
      for (const point of drawing.querySelectorAll<SVGCircleElement>("[data-survey-point]")) {
        const position = placeLabels({
          targets: [{ point: new DOMPoint(point.cx.baseVal.value, point.cy.baseVal.value).matrixTransform(matrix), width: legalMapConstants.lotBaseFontSize * 1.3, height: legalMapConstants.lotBaseFontSize * 1.3 }],
          bounds: { x: bounds.x + 6, y: bounds.y + 6, width: bounds.width - 12, height: bounds.height - 12 },
          obstacles, segments, parcel: [],
        })[0];
        badges.push(position);
        obstacles.push(position.box);
      }
      const positions = placeLabels({
        targets: labels.map(label => {
          const point = label.parentElement!.querySelector<SVGCircleElement>("[data-survey-point]")!;
          const { width, height } = label.getBoundingClientRect();
          return { point: new DOMPoint(point.cx.baseVal.value, point.cy.baseVal.value).matrixTransform(matrix), width, height };
        }),
        bounds: { x: bounds.x + 6, y: bounds.y + 6, width: bounds.width - 12, height: bounds.height - 12 },
        obstacles,
        segments,
        parcel: [parcel[0].from, ...parcel.map(line => line.to)].map(point => new DOMPoint(point.x, point.y).matrixTransform(matrix)),
      });
      const inverse = matrix.inverse();
      setBadgePositions(badges.map(({ box, leader }) => {
        const center = new DOMPoint(box.x + box.width / 2, box.y + box.height / 2).matrixTransform(inverse);
        const endpoint = leader ? new DOMPoint(leader.x, leader.y).matrixTransform(inverse) : null;
        return { x: center.x, y: center.y, leader: endpoint ? { x: endpoint.x, y: endpoint.y } : null };
      }));
      setLabelPositions(positions.map((position, index) => {
        const label = labels[index];
        const box = label.getBoundingClientRect();
        const origin = new DOMPoint(Number(label.getAttribute("x")), Number(label.getAttribute("y"))).matrixTransform(matrix);
        const text = new DOMPoint(position.box.x + origin.x - box.x, position.box.y + origin.y - box.y).matrixTransform(inverse);
        const leader = position.leader ? new DOMPoint(position.leader.x, position.leader.y).matrixTransform(inverse) : null;
        return { vertex: Number(label.getAttribute("data-survey-label")), x: text.x, y: text.y, leader: leader ? { x: leader.x, y: leader.y } : null };
      }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(drawing);
    return () => observer.disconnect();
  }, [scene, closed, frame.width, frame.height, labelScale]);

  return <section className={`survey-layout${boundary ? " survey-boundary" : ""}`} aria-label={scene.title}>
    <MapSurface controls={controls} style={boundary ? surveyStyles.boundaryViewport : surveyStyles.viewport}
      annotation={tie ? <div role="note" aria-label="Commencement line" data-survey-tie-label="true" style={surveyStyles.tieLabel}>
        <div>{lines[0].bearing}</div>
        <div>{lines[0].distance}</div>
      </div> : undefined}
      footer={!boundary ? <>
        <div className="legal-map-legend" style={legalMapStyles.legendItems}>
          <span style={legalMapStyles.legendItem}><span style={legendBoxStyle("#b6e3f5", "#278eb9")} /><span style={legalMapStyles.legendLabel}>Subject</span></span>
          <span style={legalMapStyles.legendItem}><span style={legendBoxStyle("#f3edcf", "#8c999b")} /><span style={legalMapStyles.legendLabel}>Section</span></span>
        </div>
      </> : undefined}>
        <svg ref={drawingRef} role="img" aria-label={`${scene.title} schematic`} aria-describedby={!boundary && context ? `${id}-context` : undefined} viewBox={`${frame.x} ${frame.y} ${frame.width} ${frame.height}`} style={surveyStyles.drawing}>
          <defs><pattern id={`${id}-partial`} width={fontSize} height={fontSize} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={fontSize} height={fontSize} fill="#cdebf5" />
            <line x1="0" y1="0" x2="0" y2={fontSize} stroke="#369ac2" strokeWidth={fontSize / 6} opacity="0.45" />
          </pattern></defs>
          {boundary ? <g aria-label="North–south reference through point 1" pointerEvents="none">
            <line data-survey-reference="true" x1={lines[0].from.x} y1={frame.y} x2={lines[0].from.x} y2={frame.y + frame.height} stroke={legalMapColors.secondaryText} strokeDasharray="6 4" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </g> : null}
          {closed ? <path data-boundary-fill="true" d={`M ${parcel[0].from.x} ${parcel[0].from.y} ${parcel.map(line => `L ${line.to.x} ${line.to.y}`).join(" ")} Z`} fill={legalMapColors.parcelFill} fillOpacity="0.25" /> : null}
          {scene.items.map((item, index) => {
            if (item.kind === "line") return <g key={index}>
              <title>{item.detail}</title>
              <line data-survey-line="true" x1={item.from.x} y1={item.from.y} x2={item.to.x} y2={item.to.y} stroke={tie && index === 0 ? legalMapColors.gridLine : legalMapColors.parcelLine} strokeDasharray={tie && index === 0 ? "6 4" : undefined} strokeWidth="3" vectorEffect="non-scaling-stroke" />
            </g>;
            const labelSize = Math.min(legalMapConstants.lotBaseFontSize / labelScale, (item.width - 8 / labelScale) / 4, (item.height - 8 / labelScale) / 3);
            const captionSize = item.caption ? Math.min(labelSize * legalMapConstants.amp, (item.width - 8 / labelScale) / item.caption.length) : labelSize;
            return <g key={index}>
              <title>{item.detail}</title>
              <rect data-survey-area={item.role === "area" ? "true" : undefined} data-survey-section-area={item.role === "section" ? item.label : undefined} data-survey-partial={item.partial ? "true" : undefined}
                x={item.x} y={item.y} width={item.width} height={item.height}
                fill={item.role === "area" ? item.partial ? `url(#${id}-partial)` : "#b6e3f5" : item.role === "section" ? item.highlighted ? "#f3edcf" : legalMapColors.blockBg : "none"}
                fillOpacity={item.role === "area" ? 0.8 : 0.35} stroke={item.role === "area" ? "#278eb9" : item.role === "section" && !item.highlighted ? legalMapColors.gridLine : "#8c999b"}
                strokeDasharray={item.role === "section" ? "6 4" : "4 3"} strokeWidth="1" vectorEffect="non-scaling-stroke" />
              {item.role === "area" && Math.min(labelSize, captionSize) * labelScale >= 12 ? <text x={item.x + item.width / 2} y={item.y + item.height / 2} textAnchor="middle" fontSize={labelSize * legalMapConstants.amp} fill={legalMapColors.text} pointerEvents="none">
                {item.caption ? <tspan x={item.x + item.width / 2} dy="-0.3em" fontSize={captionSize}>{item.caption}</tspan> : null}
                <tspan x={item.x + item.width / 2} dy={item.caption ? "1.2em" : 0} fontSize={labelSize} fontWeight={legalMapStyles.lotCaption.fontWeight}>Subject</tspan>
              </text> : null}
            </g>;
          })}
          {boundary && closure.gap > closure.length * Number.EPSILON ? <g pointerEvents="none">
            <title>Closure gap · original endpoint retained</title>
            <line data-survey-gap="true" x1={lines.at(-1)!.to.x} y1={lines.at(-1)!.to.y} x2={parcel[0].from.x} y2={parcel[0].from.y} stroke={legalMapColors.secondaryText} strokeDasharray="3 3" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            {closed ? <circle data-survey-endpoint="true" cx={lines.at(-1)!.to.x} cy={lines.at(-1)!.to.y} r={fontSize / 4} fill="white" stroke={legalMapColors.secondaryText} strokeWidth="1" vectorEffect="non-scaling-stroke" /> : null}
          </g> : null}
          {vertices.map((point, index) => {
            const labelY = point.y + (index === lines.length ? fontSize : -fontSize);
            const poc = tie && index === 0;
            const pob = closed && index === beginning;
            const labelPosition = labelPositions.find(position => position.vertex === index + 1);
            const badge = badgePositions[index];
            return <g key={index}>
              <circle data-survey-point={index + 1} cx={point.x} cy={point.y} r={fontSize / 4} fill={poc ? legalMapColors.secondaryText : pob ? legalMapColors.parcelLine : "white"} stroke={poc ? legalMapColors.secondaryText : legalMapColors.parcelLine} strokeWidth="1" vectorEffect="non-scaling-stroke" />
              {badge?.leader ? <line data-survey-badge-leader={index + 1} x1={point.x} y1={point.y} x2={badge.leader.x} y2={badge.leader.y} stroke={poc ? legalMapColors.secondaryText : legalMapColors.parcelLine} strokeWidth="1" vectorEffect="non-scaling-stroke" pointerEvents="none" /> : null}
              <circle cx={badge ? badge.x : point.x} cy={badge ? badge.y : labelY} r={fontSize * 0.65} fill={poc ? legalMapColors.secondaryText : legalMapColors.text} stroke="white" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <text data-survey-vertex={index + 1} x={badge ? badge.x : point.x} y={badge ? badge.y : labelY} dominantBaseline="central" textAnchor="middle" fontSize={fontSize} fill="white" pointerEvents="none">{index + 1}</text>
              {labelPosition?.leader ? <line data-survey-leader={index + 1} x1={point.x} y1={point.y} x2={labelPosition.leader.x} y2={labelPosition.leader.y} stroke={poc ? legalMapColors.secondaryText : legalMapColors.parcelLine} strokeWidth="1" vectorEffect="non-scaling-stroke" pointerEvents="none" /> : null}
              {poc || pob ? <text data-survey-label={index + 1} x={labelPosition?.x ?? point.x} y={labelPosition?.y ?? point.y} dominantBaseline="central" textAnchor="middle" fontSize={legalMapConstants.lotBaseFontSize / labelScale} fill={poc ? legalMapColors.secondaryText : legalMapColors.parcelLine} pointerEvents="none">{poc ? "POC" : "POB"}</text> : null}
            </g>;
          })}
          {scene.items.map((item, index) => item.kind === "rect" && item.role === "section" ? <g key={index}>
            <text data-survey-section={item.label} x={item.x + item.width / 2} y={item.y + item.height * 0.12} dominantBaseline="central" textAnchor="middle" fontSize={legalMapConstants.blockBaseFontSize * legalMapConstants.amp / labelScale} fontWeight={blockStyle.fontWeight} fill={item.highlighted ? legalMapColors.text : legalMapColors.secondaryText}>{item.label}</text>
          </g> : null)}
          {!boundary && context ? <text id={`${id}-context`} data-survey-context="true" x={(minX + maxX) / 2} y={maxY + extent * 0.06} dominantBaseline="central" textAnchor="middle" fontSize={contextSize / labelScale} style={surveyStyles.context}>{context}</text> : null}
        </svg>
    </MapSurface>
    {boundary && closure.length > 0 ? <div aria-label="Closure details" style={surveyStyles.closure}>
      <span>Closure: {closed ? "Within tolerance" : "Open"}</span>
      <span>Gap: {(closure.gap * distanceScale).toLocaleString("en-US", { maximumFractionDigits: 4 })} {distances[0].specified ? "m" : "units"} ({(closure.gap / closure.length * 100).toLocaleString("en-US", { maximumFractionDigits: 4 })}%)</span>
      <span>Tolerance: {(closure.length * legalMapConstants.closureRatio * distanceScale).toLocaleString("en-US", { maximumFractionDigits: 4 })} {distances[0].specified ? "m" : "units"} ({legalMapConstants.closureRatio * 100}%)</span>
    </div> : null}
    {boundary ? <div className="survey-calls">
      <div role="region" aria-label="Boundary Calls" tabIndex={0} style={surveyStyles.tableScroll}>
        <table aria-label="Boundary Calls" style={surveyStyles.notes}>
          <colgroup><col style={{ width: "1.5rem" }} /><col style={{ width: "5.5rem" }} /><col /><col style={{ width: "8rem" }} /></colgroup>
          <thead><tr><th style={surveyStyles.cell} scope="col">#</th><th style={surveyStyles.cell} scope="col">Boundary</th><th style={surveyStyles.cell} scope="col">Bearing</th><th style={surveyStyles.cell} scope="col">Distance</th></tr></thead>
          <tbody>{lines.map((line, index) => <tr key={index}>
            <td style={surveyStyles.cell}>{index + 1}</td><td style={surveyStyles.cell}>{index + 1} → {closed && index === lines.length - 1 ? beginning + 1 : index + 2}</td><td style={surveyStyles.cell}>{line.bearing}</td><td style={surveyStyles.cell}>{line.distance}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </div> : null}
  </section>;
}
