import { Fragment, useLayoutEffect, useRef, useState, type JSX } from "react";
import { formatLabel } from "aurora-core";
import { isBlank, labelValue } from "../data/legalData";
import { blockKinds, displayLots, divisionKinds, lotKinds, lotLabels, subdivisionKinds } from "../data/platData";
import type { DisplayLot, LegalViewModel, PlatBlock, PlatDivision } from "../type/plat.types";
import { MapIssue, MapSurface } from "./MapSurface";
import { usePlatFit } from "../hook/usePlatFit";
import {
  blockLabelStyle, blockStyle, divisionLabelStyle, divisionStyle, legalMapColors,
  legalMapStyles, legendBoxStyle, lotStyle, rowFillStyle,
} from "../style/legalMapStyles";

const perimeterSlots = [
  [1, 1], [1, 2], [1, 3], [1, 4],
  [2, 4], [3, 4],
  [4, 4], [4, 3], [4, 2], [4, 1],
  [3, 1], [2, 1],
] as const;

const centerSlots = [[2, 2], [2, 3], [3, 2], [3, 3]] as const;

function LotView({ lot, gridColumn, gridRow }: { lot: DisplayLot | null; gridColumn: string; gridRow: number }): JSX.Element {
  const empty = !lot || !lot.filled;
  return (
    <span data-legal-map-lot={empty ? undefined : "true"} data-legal-map-empty={lot && empty ? "true" : undefined} title={lot && !empty ? lot.detail : undefined} data-lot-slot={empty ? undefined : `${gridRow}-${gridColumn}`} style={lotStyle(empty, gridColumn, gridRow)}>
      {lot && !empty ? <span data-map-label="true" style={legalMapStyles.cellLabel}>
        <span>{labelValue(lot.name, lot.kind)}</span>
        <span style={legalMapStyles.lotCaption}>{lot.detail ?? `${lotLabels[lot.kind]}${lot.name.includes("–") ? "s" : ""}`}</span>
      </span> : null}

    </span>
  );
}

function BlockView({ block }: { block: PlatBlock }): JSX.Element {
  const blockRef = useRef<HTMLDivElement>(null);
  const [leaders, setLeaders] = useState<{ points: string; x: number; y: number }[]>([]);
  const labels = blockKinds.flatMap(kind => {
    const value = kind === "block" ? block.name : block[kind];
    return value ? [{ kind, value }] : [];
  });
  const displayed = displayLots(block.lots);
  const acreages = displayed.flatMap((lot, index) => lot.acreage?.map(value => ({ value, slot: perimeterSlots[index].join("-") })) ?? []);

  useLayoutEffect(() => {
    const root = blockRef.current!;
    const measure = () => {
      const bounds = root.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) return;
      for (const label of root.querySelectorAll<HTMLElement>("[data-map-label]")) {
        const cell = label.parentElement!.getBoundingClientRect();
        const box = label.getBoundingClientRect();
        label.style.visibility = box.width <= cell.width && box.height <= cell.height ? "visible" : "hidden";
      }
      const labels = [...root.querySelectorAll<HTMLElement>("[data-lot-acreage]")];
      if (labels.length > 0) setLeaders(labels.map((label, index) => {
        const scale = bounds.width / root.offsetWidth;
        const lot = root.querySelector<HTMLElement>(`[data-lot-slot="${label.dataset.acreageSlot}"]`)!.getBoundingClientRect();
        const box = label.getBoundingClientRect();
        const x = (lot.x + lot.width / 8 - bounds.x) / scale;
        const y = (lot.y + lot.height / 4 - bounds.y) / scale;
        const labelX = (box.x - bounds.x) / scale;
        const labelY = (box.y + box.height / 2 - bounds.y) / scale;
        const gutter = labelX * (index + 1) / (labels.length + 1);
        return { x, y, points: `${labelX - 4},${labelY} ${gutter},${labelY} ${gutter},${y} ${x},${y}` };
      }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    for (const label of root.querySelectorAll("[data-map-label]")) observer.observe(label);
    return () => observer.disconnect();
  }, [block]);

  return <div ref={blockRef} style={acreages.length > 0 ? legalMapStyles.annotatedBlock : undefined}>
    {acreages.length > 0 ? <>
      <div style={legalMapStyles.acreageLabels}>
        {acreages.map(({ value, slot }, index) => <span key={index} data-lot-acreage="true" data-acreage-slot={slot} style={legalMapStyles.lotAcreage}>{value}</span>)}
      </div>
      <svg aria-hidden="true" style={legalMapStyles.acreageLeaders}>
        {acreages.map((_, index) => <g key={index}>
          <polyline data-acreage-leader="true" points={leaders[index]?.points} fill="none" stroke={legalMapColors.lotBorder} strokeWidth="1" vectorEffect="non-scaling-stroke" />
          {leaders[index] ? <circle data-acreage-point="true" cx={leaders[index].x} cy={leaders[index].y} r="2.5" fill={legalMapColors.lotBorder} /> : null}
        </g>)}
      </svg>
    </> : null}
    <div data-legal-map-block="true" style={legalMapStyles.blockGrid}>
      {labels.length > 0 ? <div style={blockStyle}>
        <div data-map-label="true" style={legalMapStyles.cellLabel}>
          {labels.map(entry => <Fragment key={entry.kind}>
            <div data-legal-map-block-label={entry.kind === "block" ? "true" : undefined} data-legal-map-tract-label={entry.kind === "tract" ? "true" : undefined} data-legal-map-building-label={entry.kind === "building" ? "true" : undefined} style={blockLabelStyle}>{labelValue(entry.value, entry.kind)}</div>
            <span style={legalMapStyles.blockCaption}>{formatLabel(entry.kind)}</span>
          </Fragment>)}
        </div>
      </div> : null}
      {[...perimeterSlots, ...(labels.length === 0 ? centerSlots : [])].map(([row, column], index) => {
        const lot = displayed[index] ?? null;
        return <LotView key={index} lot={lot} gridColumn={String(column)} gridRow={row} />;
      })}
    </div>
  </div>;
}

function DivisionView({ division }: { division: PlatDivision }): JSX.Element {
  const kinds = divisionKinds.filter(kind => !isBlank(division[kind]));
  return (
    <div data-legal-map-division="true" style={divisionStyle(kinds.length === 0)}>
      {kinds.length > 0 ? <div style={legalMapStyles.divisionLabels}>
        {kinds.map(kind => <div key={kind} style={divisionLabelStyle}>
          {`${formatLabel(kind)} ${labelValue(division[kind], kind)}`}
        </div>)}
      </div> : null}
      <div style={legalMapStyles.divisionBlocks}>
        {division.blocks.map((block, index) => <BlockView block={block} key={`${block.name}-${index}`} />)}
      </div>
    </div>
  );
}

function Legend({ presentLayers }: { presentLayers: Set<string> }): JSX.Element | null {
  const items = [
    ...subdivisionKinds.map(kind => ({ key: kind, name: formatLabel(kind), color: "transparent", borderColor: legalMapColors.subdivisionBorder })),
    { key: "right_of_way", name: "Right Of Way", color: legalMapColors.rowBg, borderColor: legalMapColors.subdivisionBorder },
    ...divisionKinds.map(kind => ({ key: kind, name: formatLabel(kind), color: legalMapColors.divisionBg, borderColor: legalMapColors.divisionBorder })),
    ...blockKinds.map(kind => ({ key: kind, name: formatLabel(kind), color: legalMapColors.blockBg, borderColor: legalMapColors.blockBorder })),
    ...lotKinds.map(kind => ({ key: kind, name: lotLabels[kind], color: legalMapColors.lotBg, borderColor: legalMapColors.lotBorder })),
  ].filter((item) => presentLayers.has(item.key));

  if (items.length === 0) return null;

  return (
    <div className="legal-map-legend" style={legalMapStyles.legendItems}>
      {items.map((item) => (
        <span key={item.key} style={legalMapStyles.legendItem}>
          <span style={{ ...legendBoxStyle(item.color, item.borderColor), ...(item.key === "right_of_way" ? rowFillStyle : {}) }} />
          <span style={legalMapStyles.legendLabel}>{item.name}</span>
        </span>
      ))}
    </div>
  );
}

export function PlatMap({ view, issues, title }: {
  view: LegalViewModel;
  issues: string[];
  title: string;
}): JSX.Element {
  const fit = usePlatFit(view);
  return <>
    {!view.isEmptyStructure ? <MapSurface footer={<Legend presentLayers={view.presentLayers} />}>
      <div ref={fit.viewportRef} data-legal-map-fit="true" role="region" aria-label={`${title} drawing`} tabIndex={-1} style={legalMapStyles.fitViewport}>
        <div ref={fit.contentRef} data-legal-map-grid="true" style={legalMapStyles.grid}>
          <div style={legalMapStyles.gridContent}>
            {view.subdivisions.map((subdivision, index) => (
              <div key={`${subdivision.subdivision}-${index}`} style={legalMapStyles.subdivisionWrapper}>
                {subdivisionKinds.filter(kind => !isBlank(subdivision[kind])).map(kind => <div key={kind} data-legal-map-heading={kind} style={legalMapStyles.subdivisionLabel}>{subdivision[kind]}</div>)}
                <div data-legal-map-subdivision="true" style={legalMapStyles.subdivisionBoundary}>
                  <div style={{ ...legalMapStyles.subdivisionContent, ...(subdivision.rightsOfWay.length > 0 ? legalMapStyles.rowContent : {}) }}>
                    {subdivision.divisions.map((division, divisionIndex) => <DivisionView key={divisionIndex} division={division} />)}
                    {subdivision.rightsOfWay.map((value, rowIndex) => (
                      <div key={value} data-legal-map-row="true" style={{ ...legalMapStyles.rowBand, top: `${(rowIndex + 1) * 100 / (subdivision.rightsOfWay.length + 1)}%` }}>{value}</div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {view.locationLabel ? <div data-legal-map-location="true" style={legalMapStyles.location}>{view.locationLabel}</div> : null}
        </div>
      </div>
    </MapSurface> : null}
    {issues.map((issue, index) => <MapIssue key={index} title={title} issue={issue} />)}
  </>;
}
