import { useEffect, useId, useState, type JSX, type ReactNode } from "react";
import { formatLabel, hasPlatMap } from "aurora-core";
import { displayLots, divisionKinds, isBlank, normalizeLegalData, type DisplayLot, type LegalMapPayload, type PlatBlock, type PlatDivision } from "../data/legalData";
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

function labelValue(value: string, kind: string): string {
  return value.replace(new RegExp(`(^|[,/])\\s*${kind}\\b\\s*(?:no\\.?\\s*)?`, "gi"), "$1").trim();
}

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
  const id = useId();
  const tabs = [...(hasPlatMap(legal) ? ["Plat"] : []), ...(addressMap ? ["Address"] : [])];
  const [selected, setSelected] = useState(tabs[0]);
  const active = tabs.includes(selected) ? selected : tabs[0];

  useEffect(() => {
    onReadyChange?.(true);
  }, [legal, onReadyChange]);

  return (
    <>
      <style>{legalMapCss}</style>
      <div className="legal-map" style={legalMapStyles.shell}>
        <div className="legal-map-column" style={legalMapStyles.mapColumn}>
          {tabs.length > 0 ? (
            <>
              <div role="tablist" aria-label="Map views" className="legal-map-tabs" style={legalMapStyles.tabs}>
                {tabs.map((tab, index) => <button
                  key={tab}
                  type="button"
                  role="tab"
                  id={`${id}-${tab}`}
                  aria-controls={`${id}-panel`}
                  aria-selected={active === tab}
                  style={{ ...legalMapStyles.tabButton, color: active === tab ? "var(--primary-dark)" : "var(--body-ink)" }}
                  tabIndex={active === tab ? 0 : -1}
                  onClick={() => setSelected(tab)}
                  onKeyDown={event => {
                    let next: number;
                    switch (event.key) {
                      case "ArrowRight": next = (index + 1) % tabs.length; break;
                      case "ArrowLeft": next = (index + tabs.length - 1) % tabs.length; break;
                      case "Home": next = 0; break;
                      case "End": next = tabs.length - 1; break;
                      default: return;
                    }
                    event.preventDefault();
                    setSelected(tabs[next]);
                    document.getElementById(`${id}-${tabs[next]}`)?.focus();
                  }}
                >{tab}</button>)}
              </div>
              <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${active}`} tabIndex={0} style={legalMapStyles.panel}>
                {active === "Address" && addressMap ? addressMap.content : !view.isEmptyStructure ? <div data-legal-map-surface="true" style={legalMapStyles.mapSurface}>
                  <div data-legal-map-grid="true" style={legalMapStyles.grid}>
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
                  <div data-legal-map-footer="true" style={legalMapStyles.mapFooter}>
                    <div data-legal-map-north="true" aria-hidden="true" style={legalMapStyles.northMarker}>
                      <svg width="16" height="20" viewBox="0 0 24 28" fill="currentColor">
                        <path d="M12 1 3 24l9-5 9 5z" />
                      </svg>
                      <span>N</span>
                    </div>
                    <Legend presentLayers={view.presentLayers} />
                  </div>
                </div> : null}
              </div>
            </>
          ) : null}
        </div>
        <aside className="legal-map-info" data-legal-map-info="true" style={legalMapStyles.infoColumn}>
          {view.summary ? <section className="legal-map-summary" style={legalMapStyles.infoSection}>
            <h3 style={legalMapStyles.infoHeading}>Summary</h3>
            <div style={legalMapStyles.infoCard}>{view.summary}</div>
          </section> : null}
          {addressMap ? <section className="legal-map-address" style={legalMapStyles.infoSection}>
            <h3 style={legalMapStyles.infoHeading}>Address</h3>
            <div style={legalMapStyles.infoCard}>{addressMap.address}</div>
          </section> : null}
          {view.references.length > 0 ? <section className="legal-map-reference" style={legalMapStyles.infoSection}>
            <h3 style={legalMapStyles.infoHeading}>Reference</h3>
            <div style={legalMapStyles.infoCard}>
              <table aria-label="Reference" style={legalMapStyles.referenceTable}>
                <tbody>
                  {view.references.map((element, index) => (
                    <tr key={index}>
                      <th scope="row" style={{ ...legalMapStyles.referenceCell, fontWeight: 600, paddingLeft: 0, whiteSpace: "nowrap", width: "1%" }}>{formatLabel(element.aspect?.replace(/^plat_/, ""))}</th>
                      <td style={legalMapStyles.referenceCell}>{element.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section> : null}
        </aside>
      </div>
    </>
  );
}
