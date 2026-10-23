import { useEffect, type JSX, type ReactNode } from "react";
import { Icon } from "aurora-core";
import { displayLots, divisionKinds, isBlank, labelValue, legalMapViews, normalizeLegalData, type DisplayLot, type LegalMapPayload, type PlatBlock, type PlatDivision } from "../data/legalData";
import { getMapGroups } from "../data/surveyData";
import { SurveyCalls, SurveyMap } from "./SurveyMap";
import { MapSurface } from "./MapSurface";
import { surveyStyles } from "../style/surveyStyles";
import { useMapTabs } from "../hook/useMapTabs";
import { usePlatFit } from "../hook/usePlatFit";
import { useMapResize } from "../hook/useMapResize";
import {
  blockLabelStyle,
  blockStyle,
  legalMapColors,
  legalMapConstants,
  legalMapCss,
  legalMapStyles,
  legendBoxStyle,
  lotStyle,
  divisionLabelStyle,
  divisionStyle,
  rowFillStyle,
} from "../style/legalMapStyles";

function countNumbers(value: unknown): number {
  const nums = String(value || "").match(/\d+/g);
  return nums ? nums.length : value ? 1 : 0;
}

function sizeScale(count: number): number {
  if (count <= 1) return 1;
  if (count === 2) return 0.75;
  if (count === 3) return 0.5;
  return 0.25;
}

const perimeterSlots = [
  [1, 1], [1, 2], [1, 3], [1, 4],
  [2, 4], [3, 4],
  [4, 4], [4, 3], [4, 2], [4, 1],
  [3, 1], [2, 1],
] as const;

function LotView({ lot, scale, gridColumn, gridRow }: { lot: DisplayLot | null; scale: number; gridColumn: string; gridRow: number }): JSX.Element {
  const empty = !lot || !lot.filled;
  return (
    <span data-legal-map-lot={empty ? undefined : "true"} data-legal-map-empty={lot && empty ? "true" : undefined} title={lot && !empty ? lot.detail : undefined} style={lotStyle(empty, scale, gridColumn, gridRow)}>
      {lot && !empty ? <span>{labelValue(lot.name, "lot")}</span> : null}
      {lot && !empty ? <span style={legalMapStyles.lotCaption}>{lot.detail ?? (lot.name.includes("–") ? "Lots" : "Lot")}</span> : null}
    </span>
  );
}

function BlockView({ block }: { block: PlatBlock }): JSX.Element {
  const empty = isBlank(block.name);
  const scale = legalMapConstants.amp * sizeScale(countNumbers(block.name));
  const displayed = displayLots(block.lots);
  const tiles = perimeterSlots.map(([row, column], index) => {
    const lot = displayed[index] ?? null;
    return <LotView key={index} lot={lot} scale={lot?.detail ? 0.75 : legalMapConstants.amp * sizeScale(countNumbers(lot?.name))} gridColumn={String(column)} gridRow={row} />;
  });

  return (
    <div data-legal-map-block="true" style={legalMapStyles.blockGrid}>
      <div style={blockStyle}>
        <div data-legal-map-block-label="true" style={blockLabelStyle(scale)}>{labelValue(block.name, "block")}</div>
        {!empty ? <span style={legalMapStyles.blockCaption}>Block</span> : null}
      </div>
      {tiles}
    </div>
  );
}

function DivisionView({ division }: { division: PlatDivision }): JSX.Element {
  const kinds = divisionKinds.filter(kind => !isBlank(division[kind]));
  return (
    <div data-legal-map-division="true" style={divisionStyle(kinds.length === 0)}>
      {kinds.length > 0 ? <div style={legalMapStyles.divisionLabels}>
        {kinds.map(kind => <div key={kind} style={divisionLabelStyle}>
          {`${kind[0].toUpperCase()}${kind.slice(1)} ${labelValue(division[kind], kind)}`}
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
    { key: "subdivision", name: "Subdivision", color: "transparent", borderColor: legalMapColors.subdivisionBorder },
    { key: "right_of_way", name: "Right Of Way", color: legalMapColors.rowBg, borderColor: legalMapColors.subdivisionBorder },
    ...divisionKinds.map(kind => ({ key: kind, name: `${kind[0].toUpperCase()}${kind.slice(1)}`, color: legalMapColors.divisionBg, borderColor: legalMapColors.divisionBorder })),
    { key: "block", name: "Block", color: legalMapColors.blockBg, borderColor: legalMapColors.blockBorder },
    { key: "lot", name: "Lot", color: legalMapColors.lotBg, borderColor: legalMapColors.lotBorder },
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

export function LegalMapContent({ legal, addressMap, onReadyChange }: {
  legal: LegalMapPayload | null | undefined;
  addressMap?: { address: string; content: ReactNode };
  onReadyChange?(ready: boolean): void;
}): JSX.Element {
  const view = normalizeLegalData(legal);
  const mapGroups = getMapGroups(legal);
  const tabs: string[] = legalMapViews.filter(view => view === "Address" ? Boolean(addressMap) : mapGroups.some(entry => entry.view === view));
  const { active, controls, panel } = useMapTabs(tabs, "Map views", "view");

  const groups = mapGroups.filter(entry => entry.view === active);
  const showParcels = groups.length > 1 && legal?.parcels_num !== 1;
  const entries = groups.map((entry, index) => ({ ...entry, title: showParcels ? `Parcel ${index + 1}` : active }));
  const fitSingle = active === "Lot & block" && view.subdivisions.length === 1 && (legal?.parcels_num === 1 || groups.length === 1);
  const fit = usePlatFit(fitSingle, legal);
  const surveys = entries.flatMap(entry => entry.scene ? [{ ...entry.scene, title: entry.title }] : []);
  const detailTabs = active === "Metes & Bounds" ? ["Boundary Calls", "Acreage", "Easement"].filter(tab =>
    tab === "Boundary Calls" ? surveys.some(scene => scene.items.length > 0) : entries.some(entry => entry.notes.some(note => note.label === tab)))
    : (active === "PLSS" || active === "Lot & block") && entries.some(entry => entry.notes.length > 0) ? ["Details"] : [];
  const details = useMapTabs(detailTabs, "Map details", "detail");
  const resize = useMapResize(details.active ? active : undefined);

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
        <div ref={resize.bodyRef} className="legal-map-content" style={legalMapStyles.content}>
          <div ref={resize.mapRef} className="legal-map-column" style={legalMapStyles.mapColumn}>
            {tabs.length > 0 ? (
              <div {...panel} style={legalMapStyles.panel}>
                {active === "Address" && addressMap ? <MapSurface controls={controls} showNorth={false}>{addressMap.content}</MapSurface> : active === "PLSS" || active === "Metes & Bounds" ? <div className="legal-map-surveys" style={surveyStyles.list}>
                  {surveys.map((scene, index) => scene.items.length > 0
                    ? <SurveyMap key={`${active}-${index}-${JSON.stringify(scene)}`} scene={scene} showTitle={showParcels} controls={index === 0 ? controls : undefined} />
                    : <div key={`${active}-${index}`} className="legal-map-header legal-map-incomplete" style={legalMapStyles.mapHeader}>
                      <div role="alert" aria-label={scene.title}>
                        {showParcels ? <h4 style={legalMapStyles.infoTitle}>{scene.title}</h4> : null}
                        <p style={legalMapStyles.mapError}><Icon name="alert" /><span>{scene.issue}</span></p>
                      </div>
                      {index === 0 ? controls : null}
                    </div>)}
                </div> : !view.isEmptyStructure ? <MapSurface controls={controls} footer={<Legend presentLayers={view.presentLayers} />}>
                  <div ref={fit.viewportRef} data-legal-map-grid="true" style={{ ...legalMapStyles.grid, ...(fitSingle ? legalMapStyles.fittedGrid : {}) }}>
                    <div ref={fit.contentRef} data-legal-map-fit={fitSingle ? "true" : undefined} style={fitSingle ? legalMapStyles.fittedContent : undefined}>
                    <div style={legalMapStyles.gridContent}>
                      {view.subdivisions.map((subdivision, index) => (
                        <div key={`${subdivision.subdivision}-${index}`} style={legalMapStyles.subdivisionWrapper}>
                          {!isBlank(subdivision.subdivision) ? <div style={legalMapStyles.subdivisionLabel}>{subdivision.subdivision}</div> : null}
                          <div data-legal-map-subdivision="true" style={legalMapStyles.subdivisionBoundary}>
                            <div style={{ ...legalMapStyles.subdivisionContent, ...(subdivision.rightsOfWay.length > 0 ? legalMapStyles.rowContent : {}) }}>
                              {subdivision.divisions.map((division, divisionIndex) => <DivisionView key={divisionIndex} division={division} />)}
                              {subdivision.rightsOfWay.map((value, rowIndex) => (
                                <div key={value} data-legal-map-row="true" style={{ ...legalMapStyles.rowBand, top: `${(rowIndex + 1) * 100 / (subdivision.rightsOfWay.length + 1)}%` }}>
                                  {value}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {view.locationLabel ? (
                      <div id="plat-location-bottom" style={legalMapStyles.location}>
                        {view.locationLabel}
                      </div>
                    ) : null}
                    </div>
                  </div>
                </MapSurface> : <div className="legal-map-header" style={legalMapStyles.mapHeader}>{controls}</div>}
              </div>
            ) : null}
          </div>
          {details.active ? <>
            <div {...resize.separator} aria-controls={`${panel.id} ${details.panel.id}`} className="legal-map-divider" style={legalMapStyles.divider}>
              <span aria-hidden="true" style={legalMapStyles.dividerGrip} />
            </div>
            <aside ref={resize.infoRef} className="legal-map-info" data-legal-map-info="true" style={legalMapStyles.infoColumn}>
              {details.controls}
              <div {...details.panel} ref={resize.panelRef} style={{ ...legalMapStyles.infoPanel, height: resize.height }}>
                {details.active === "Details" ? entries.map((entry, index) => <table key={index} className="legal-map-table" aria-label={showParcels ? `${entry.title} details` : "Details"} style={surveyStyles.notes}>
                  {showParcels ? <caption style={legalMapStyles.infoTitle}>{entry.title}</caption> : null}
                  <colgroup><col style={{ width: "7rem" }} /><col /></colgroup>
                  <tbody>{entry.notes.map((note, noteIndex) => <tr key={noteIndex}>
                    <th scope="row" style={surveyStyles.cell}>{note.label}</th>
                    <td style={surveyStyles.cell}>{note.value}</td>
                  </tr>)}</tbody>
                </table>) : null}
                {details.active === "Boundary Calls" ? surveys.filter(scene => scene.items.length > 0).map((scene, index) => <SurveyCalls key={index} scene={scene} showTitle={showParcels} />) : null}
                {details.active === "Acreage" ? <section className="legal-map-acreage" style={legalMapStyles.infoSection}>
                  {surveys.map((scene, index) => {
                    const acreage = scene.notes.find(note => note.label === "Acreage")?.value;
                    return acreage ? <div key={index} aria-label={showParcels ? `${scene.title} acreage` : "Reported acreage"} style={legalMapStyles.infoCard}>
                      {showParcels ? <h4 style={legalMapStyles.infoTitle}>{scene.title}</h4> : null}
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
