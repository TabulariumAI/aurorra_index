import { useEffect, type JSX } from "react";
import type { LegalPayload } from "../../metdataview/type/metadataView.types";
import { isBlank, normalizeLegalData, type PlatBlock, type PlatLot, type PlatPhase } from "../data/legalData";
import {
  blockLabelStyle,
  blockStyle,
  legalMapColors,
  legalMapConstants,
  legalMapStyles,
  legendBoxStyle,
  lotStyle,
  phaseLabelStyle,
  phaseStyle,
} from "../style/legalMapStyles";

function stripCommonPrefixes(value: string): string {
  return value.replace(/^\s*(lot|block|phase|tract|unit|no\.?|#)\s*/i, "").trim();
}

function digitsPreferred(value: unknown): string {
  const source = stripCommonPrefixes(String(value || ""));
  const nums = source.match(/\d+/g);
  return nums && nums.length > 0 ? nums.join(",") : source;
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

function LotView({ index, lot, spanCount = 1, rangeText = null, scale }: { index: number; lot: PlatLot | null; spanCount?: number; rangeText?: string | null; scale: number }): JSX.Element {
  const empty = !lot || isBlank(lot.name);
  const showCondo = Boolean(lot?.condominium_unit && !isBlank(lot.condominium_unit));

  return (
    <span style={lotStyle(empty, showCondo, scale, spanCount)} title={showCondo ? "Condominium Unit" : undefined}>
      {showCondo ? digitsPreferred(rangeText || lot?.condominium_unit) : empty ? "" : digitsPreferred(lot?.name || index + 1)}
    </span>
  );
}

function BlockView({ block }: { block: PlatBlock }): JSX.Element {
  const empty = isBlank(block.name);
  const scale = legalMapConstants.amp * sizeScale(empty ? 1 : countNumbers(block.name) || 1);
  const donorLots = Array.isArray(block.lots) ? block.lots.slice(0, 99) : [];
  const lots = donorLots.length >= 9 ? donorLots : [...donorLots, ...Array.from<null>({ length: 9 - donorLots.length }).fill(null)];

  return (
    <div style={blockStyle(empty, scale)}>
      <div style={blockLabelStyle(scale)}>{empty ? "" : digitsPreferred(block.name)}</div>
      {[0, 1, 2].map((row) => (
        <div key={row} style={{ ...legalMapStyles.blockRows, marginBottom: row !== 2 ? "3px" : "0" }}>
          {(() => {
            const rowLots: JSX.Element[] = [];
            for (let col = 0; col < 3;) {
              const index = row * 3 + col;
              const lot = lots[index];
              const showRange = Boolean(lot?.condominium_unit && /^\d+\s*-\s*\d+$/.test(lot.condominium_unit));
              const spanCount = showRange ? 2 : 1;
              const perLotScale =
                lot && !isBlank(lot.name)
                  ? legalMapConstants.amp * sizeScale(countNumbers(lot.name) || 1)
                  : legalMapConstants.amp;
              rowLots.push(
                <LotView
                  index={index}
                  key={index}
                  lot={lot}
                  rangeText={showRange ? lot?.condominium_unit : null}
                  scale={perLotScale}
                  spanCount={spanCount}
                />,
              );
              col += spanCount;
            }
            return rowLots;
          })()}
        </div>
      ))}
    </div>
  );
}

function PhaseView({ phase }: { phase: PlatPhase }): JSX.Element {
  const empty = isBlank(phase.name);
  const scale = legalMapConstants.amp * sizeScale(empty ? 1 : countNumbers(phase.name) || 1);

  return (
    <div style={phaseStyle(empty, scale)}>
      {!empty ? <div style={phaseLabelStyle(scale)}>{digitsPreferred(phase.name)}</div> : null}
      {phase.blocks.map((block, index) => <BlockView block={block} key={`${block.name}-${index}`} />)}
    </div>
  );
}

function Legend({ matchPlatSubdivision, presentLayers }: { matchPlatSubdivision: boolean; presentLayers: Set<string> }): JSX.Element | null {
  const items = [
    { key: "subdivision", name: "Subdivision", color: "transparent", borderColor: matchPlatSubdivision ? legalMapColors.subdivisionColor : legalMapColors.subdivisionBorder },
    { key: "tract", name: "Tract", color: legalMapColors.tractBg },
    { key: "phase", name: "Phase", color: legalMapColors.phaseBg },
    { key: "block", name: "Block", color: legalMapColors.blockBg },
    { key: "lot", name: "Lot", color: legalMapColors.lotBg },
    { key: "lot_empty", name: "Lot (empty)", color: legalMapColors.emptyBg },
    { key: "condo_unit", name: "Condominium Unit", color: legalMapColors.condoBg },
  ].filter((item) => presentLayers.has(item.key));

  if (items.length === 0) return null;

  return (
    <div style={legalMapStyles.legendRow}>
      <div style={legalMapStyles.legendItems}>
        {items.map((item) => (
          <span key={item.key} style={legalMapStyles.legendItem}>
            <span style={legendBoxStyle(item.color, item.borderColor)} />
            <span style={legalMapStyles.legendLabel}>{item.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function LegalMapContent({ legal, onReadyChange }: { legal: LegalPayload | null | undefined; onReadyChange(ready: boolean): void }): JSX.Element {
  const view = normalizeLegalData(legal);

  useEffect(() => {
    onReadyChange(true);
  }, [legal, onReadyChange]);

  if (view.isEmptyStructure) {
    return (
      <div style={legalMapStyles.shell}>
        <div style={legalMapStyles.emptyMessage}>No valid property hierarchy data found.</div>
      </div>
    );
  }

  return (
    <div style={legalMapStyles.shell}>
      <div data-legal-map-grid="true" style={legalMapStyles.grid}>
        <div style={legalMapStyles.gridContent}>
          {view.subdivisions.map((subdivision, index) => (
            <div key={`${subdivision.subdivision}-${index}`} style={legalMapStyles.subdivisionWrapper}>
              <div style={legalMapStyles.subdivisionContent}>
                {!isBlank(subdivision.subdivision) ? <div style={legalMapStyles.subdivisionLabel}>{subdivision.subdivision}</div> : null}
                {subdivision.tracks.map((track, trackIndex) =>
                  track.phases.map((phase, phaseIndex) => (!isBlank(phase.name) || phase.blocks.length > 0 ? <PhaseView key={`${track.name}-${trackIndex}-${phase.name}-${phaseIndex}`} phase={phase} /> : null)),
                )}
              </div>
            </div>
          ))}
        </div>
        <Legend matchPlatSubdivision={view.matchPlatSubdivision} presentLayers={view.presentLayers} />
        {view.locationLabel ? (
          <div id="plat-location-bottom" style={legalMapStyles.location}>
            {view.locationLabel}
          </div>
        ) : null}
      </div>
    </div>
  );
}
