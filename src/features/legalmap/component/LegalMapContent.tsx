import { Fragment, useEffect, useLayoutEffect, useRef, useState, type JSX, type ReactNode } from "react";
import { formatLabel } from "aurora-core";
import { blockKinds, displayLots, divisionKinds, isBlank, labelValue, legalMapViews, lotKinds, lotLabels, mergeLotBlocks, normalizeLegalData, subdivisionKinds, type DisplayLot, type LegalMapPayload, type PlatBlock, type PlatDivision } from "../data/legalData";
import { getMapGroups } from "../data/surveyData";
import { SurveyCourses, SurveyMap } from "./SurveyMap";
import { MapIssue, MapSurface } from "./MapSurface";
import { surveyStyles } from "../style/surveyStyles";
import { useMapTabs } from "../hook/useMapTabs";
import { useMapResize } from "../hook/useMapResize";
import { usePlatFit } from "../hook/usePlatFit";
import {
  blockLabelStyle,
  blockStyle,
  legalMapColors,
  legalMapCss,
  legalMapStyles,
  legendBoxStyle,
  lotStyle,
  divisionLabelStyle,
  divisionStyle,
  rowFillStyle,
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

function PlatMap({ view, issues, title }: {
  view: ReturnType<typeof normalizeLegalData>;
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

export function LegalMapContent({ legal, addressMaps, onReadyChange }: {
  legal: LegalMapPayload | null | undefined;
  addressMaps?: { address: string; content: ReactNode }[];
  onReadyChange?(ready: boolean): void;
}): JSX.Element {
  const view = normalizeLegalData(legal);
  const mapGroups = getMapGroups(legal);
  const tabs: string[] = legalMapViews.filter(view => view === "Address" ? Boolean(addressMaps?.length) : mapGroups.some(entry => entry.view === view));
  const { active, controls, panel } = useMapTabs(tabs, "Map views", "view");

  const groups = mapGroups.filter(entry => entry.view === active);
  const parcelCount = active === "Lot & block" && legal?.parcels_num && legal.parcels_num > 0 ? legal.parcels_num : undefined;
  const mergedParcels = parcelCount ? mergeLotBlocks(groups.map(entry => entry.group), parcelCount) : undefined;
  const platParcels = mergedParcels ? Array.from({ length: parcelCount! }, (_, index) => mergedParcels[index]) : [{ sources: groups.map(entry => entry.group) }];
  const showParcels = (parcelCount ? parcelCount > 1 : groups.length > 1) && legal?.parcels_num !== 1;
  const entries = mergedParcels
    ? mergedParcels.flatMap((parcel, index) => groups.filter(entry => parcel.sources.includes(entry.group))
      .map(entry => ({ ...entry, title: `Parcel ${legal?.parcels_num === 1 ? 1 : index + 1}` })))
    : groups.map((entry, index) => {
      const parcels = [...new Set(entry.notes.flatMap(note => [...(note.explanation ?? "").matchAll(/\bParcel\s+(\d+)\b/gi)].map(match => match[1])))];
      return { ...entry, title: `Parcel ${legal?.parcels_num === 1 ? 1 : parcels.length === 1 ? parcels[0] : index + 1}` };
    });
  const surveys = entries.flatMap(entry => entry.scene ? [{ ...entry.scene, title: entry.title }] : []);
  const detailTabs = active === "Metes & Bounds" ? ["Boundary Calls", "Acreage", "Easement"].filter(tab =>
    tab === "Boundary Calls" ? surveys.some(scene => scene.courses?.length || scene.notes.some(note => note.label === "Bearings" || note.label === "Distances")) : entries.some(entry => entry.notes.some(note => note.label === tab)))
    : (active === "PLSS" || active === "Lot & block") && entries.some(entry => entry.notes.length > 0) ? ["Details"] : [];
  const details = useMapTabs(detailTabs, "Map details", "detail");

  const maps = active === "Address" ? addressMaps!.map(entry => ({
    title: entry.address, drawable: true, content: <MapSurface showNorth={false}>{entry.content}</MapSurface>,
  })) : active === "PLSS" || active === "Metes & Bounds" ? (legal?.parcels_num === 1 ? [surveys] : surveys.map(scene => [scene])).map(scenes => {
    const drawable = scenes.some(scene => scene.items.length > 0);
    return { title: scenes[0].title, drawable,
      content: drawable ? <SurveyMap scenes={scenes} />
        : <>{scenes.map((scene, index) => <MapIssue key={index} title={scene.title} issue={scene.issue!} />)}</>,
    };
  })
    : platParcels.flatMap((parcel, index) => {
      const title = `Parcel ${index + 1}`;
      if (!parcel) return [{ title, drawable: false, content: <MapIssue title={title} issue="Cannot map: Lot Block legal group is missing for this parcel." /> }];
      const platView = normalizeLegalData({ groups: parcel.sources, parcels_num: parcelCount ? 1 : undefined });
      const issues = groups.filter(entry => parcel.sources.includes(entry.group) && entry.issue).map(entry => entry.issue!);
      return platView.isEmptyStructure && issues.length === 0 ? [] : [{ title, drawable: !platView.isEmptyStructure,
        content: <PlatMap view={platView} issues={issues} title={title} />,
      }];
    });
  const hasDrawing = maps.some(map => map.drawable);
  const resize = useMapResize(details.active && hasDrawing ? active : undefined);

  useEffect(() => {
    onReadyChange?.(true);
  }, [legal, onReadyChange]);

  return (
    <>
      <style>{legalMapCss}</style>
      <div className="legal-map" style={legalMapStyles.shell}>
        {view.summary ? <section className="legal-map-summary" style={legalMapStyles.infoSection}>
          <div style={legalMapStyles.infoCard}>{view.summary}</div>
        </section> : null}
        {tabs.length > 0 ? <div className="legal-map-toolbar" style={legalMapStyles.toolbar}>{controls}</div> : null}
        <div {...(tabs.length > 0 ? panel : {})} ref={resize.bodyRef} className="legal-map-content" style={legalMapStyles.content}>
          {maps.length > 0 && (hasDrawing || !details.active) ? <div className="legal-map-column" style={legalMapStyles.mapColumn}>
            <div data-map-scroll="true" className="legal-map-surveys" style={legalMapStyles.parcelList}>
              {maps.map((map, index) => <section key={`${active}-${index}`} className="survey-layout" aria-label={map.title}
                style={map.drawable ? legalMapStyles.parcelLayout : legalMapStyles.issueLayout}>
                {active !== "Address" && showParcels ? <h4 style={legalMapStyles.parcelTitle}>{map.title}</h4> : null}
                {map.content}
              </section>)}
            </div>
          </div> : null}
          {details.active ? <>
            {hasDrawing ? <div {...resize.separator} aria-controls={`${panel.id} ${details.panel.id}`} className="legal-map-divider" style={legalMapStyles.divider}>
              <span aria-hidden="true" style={legalMapStyles.dividerGrip} />
            </div> : null}
            <aside ref={resize.infoRef} className="legal-map-info" data-legal-map-info="true" style={{ ...legalMapStyles.infoColumn, ...(!hasDrawing ? { flex: "1 1 0", minHeight: 0 } : {}) }}>
              {details.controls}
              <div {...details.panel} ref={resize.panelRef} style={{ ...legalMapStyles.infoPanel, height: hasDrawing ? resize.height : "auto", ...(!hasDrawing ? { flex: "1 1 0" } : {}) }}>
                {details.active === "Details" ? entries.map((entry, index) => {
                  const issue = entry.scene?.issue ?? entry.issue;
                  return <Fragment key={index}>
                    {!hasDrawing && showParcels ? <h4 style={legalMapStyles.infoTitle}>{entry.title}</h4> : null}
                    {!hasDrawing && issue ? <MapIssue title={entry.title} issue={issue} /> : null}
                    <table className="legal-map-table" aria-label={showParcels ? `${entry.title} details` : "Details"} style={surveyStyles.notes}>
                      {hasDrawing && showParcels ? <caption style={legalMapStyles.infoTitle}>{entry.title}</caption> : null}
                      <colgroup><col style={{ width: "7rem" }} /><col /></colgroup>
                      <tbody>{entry.notes.map((note, noteIndex) => <tr key={noteIndex}>
                        <th scope="row" style={surveyStyles.cell}>{note.label}</th>
                        <td style={surveyStyles.cell}>{note.value}</td>
                      </tr>)}</tbody>
                    </table>
                  </Fragment>;
                }) : null}
                {details.active === "Boundary Calls" ? surveys.map((scene, index) => <SurveyCourses key={index} scene={scene} showTitle={showParcels} showIssue={!hasDrawing} />) : null}
                {details.active === "Acreage" ? <section className="legal-map-acreage" style={legalMapStyles.infoSection}>
                  {surveys.map((scene, index) => {
                    const acreage = scene.notes.find(note => note.label === "Acreage")?.value;
                    return acreage ? <div key={index} aria-label={showParcels ? `${scene.title} acreage` : "Reported acreage"} style={legalMapStyles.infoCard}>
                      {showParcels ? <h4 style={legalMapStyles.infoTitle}>{scene.title}</h4> : null}
                      {!hasDrawing && scene.issue ? <MapIssue title={scene.title} issue={scene.issue} /> : null}
                      <ul style={legalMapStyles.acreageList}>
                        {acreage.split(";").map((entry, index) => <li key={index}>
                          {index === 0 ? <strong style={legalMapStyles.acreageFirst}>
                            <svg data-survey-swatch="true" aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" style={legalMapStyles.acreageSwatch}>
                              <rect x="0.5" y="0.5" width="11" height="11" fill={legalMapColors.parcelFill} fillOpacity="0.25" stroke={legalMapColors.parcelLine} />
                            </svg>
                            {entry.trim()}
                          </strong> : entry.trim()}
                        </li>)}
                      </ul>
                    </div> : null;
                  })}
                </section> : null}
                {details.active === "Easement" ? <section className="legal-map-easement" style={legalMapStyles.infoSection}>
                  {surveys.map((scene, index) => {
                    const easements = scene.notes.filter(note => note.label === "Easement");
                    return easements.length > 0 ? <div key={index} aria-label={showParcels ? `${scene.title} easement details` : "Easement details"} style={{ ...legalMapStyles.infoCard, ...legalMapStyles.infoSection }}>
                      {showParcels ? <h4 style={legalMapStyles.infoTitle}>{scene.title}</h4> : null}
                      {!hasDrawing && scene.issue ? <MapIssue title={scene.title} issue={scene.issue} /> : null}
                      {easements.map((note, index) => <div key={index}>
                        <div>{note.value}</div>
                        {note.explanation ? <p style={legalMapStyles.infoNote}>{note.explanation}</p> : null}
                      </div>)}
                      <p style={legalMapStyles.infoNote}>Location not specified in this clause — not plotted.</p>
                    </div> : null;
                  })}
                </section> : null}
              </div>
            </aside>
          </> : null}
        </div>
      </div>
    </>
  );
}
