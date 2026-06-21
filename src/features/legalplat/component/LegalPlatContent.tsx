import type { JSX } from "react";
import type { LegalPayload } from "../../metdata/type/metadata.types";
import { isBlank, normalizeLegalData, type PlatBlock, type PlatLot, type PlatPhase } from "../data/legalData";
import {
  blockLabelStyle,
  blockStyle,
  legalPlatColors,
  legalPlatConstants,
  legalPlatStyles,
  legendBoxStyle,
  lotStyle,
  phaseLabelStyle,
  phaseStyle,
} from "../style/legalPlatStyles";

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
  const scale = legalPlatConstants.amp * sizeScale(empty ? 1 : countNumbers(block.name) || 1);
  const donorLots = Array.isArray(block.lots) ? block.lots.slice(0, 99) : [];
  const lots = donorLots.length >= 9 ? donorLots : [...donorLots, ...Array.from<null>({ length: 9 - donorLots.length }).fill(null)];

  return (
    <div style={blockStyle(empty, scale)}>
      <div style={blockLabelStyle(scale)}>{empty ? "" : digitsPreferred(block.name)}</div>
      {[0, 1, 2].map((row) => (
        <div key={row} style={{ ...legalPlatStyles.blockRows, marginBottom: row !== 2 ? "3px" : "0" }}>
          {(() => {
            const rowLots: JSX.Element[] = [];
            for (let col = 0; col < 3;) {
              const index = row * 3 + col;
              const lot = lots[index];
              const showRange = Boolean(lot?.condominium_unit && /^\d+\s*-\s*\d+$/.test(lot.condominium_unit));
              const spanCount = showRange ? 2 : 1;
              const perLotScale =
                lot && !isBlank(lot.name)
                  ? legalPlatConstants.amp * sizeScale(countNumbers(lot.name) || 1)
                  : legalPlatConstants.amp;
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
  const scale = legalPlatConstants.amp * sizeScale(empty ? 1 : countNumbers(phase.name) || 1);

  return (
    <div style={phaseStyle(empty, scale)}>
      {!empty ? <div style={phaseLabelStyle(scale)}>{digitsPreferred(phase.name)}</div> : null}
      {phase.blocks.map((block, index) => <BlockView block={block} key={`${block.name}-${index}`} />)}
    </div>
  );
}

function Legend({ matchPlatSubdivision, presentLayers }: { matchPlatSubdivision: boolean; presentLayers: Set<string> }): JSX.Element | null {
  const items = [
    { key: "subdivision", name: "Subdivision", color: "transparent", borderColor: matchPlatSubdivision ? legalPlatColors.subdivisionColor : legalPlatColors.subdivisionBorder },
    { key: "tract", name: "Tract", color: legalPlatColors.tractBg },
    { key: "phase", name: "Phase", color: legalPlatColors.phaseBg },
    { key: "block", name: "Block", color: legalPlatColors.blockBg },
    { key: "lot", name: "Lot", color: legalPlatColors.lotBg },
    { key: "lot_empty", name: "Lot (empty)", color: legalPlatColors.emptyBg },
    { key: "condo_unit", name: "Condominium Unit", color: legalPlatColors.condoBg },
  ].filter((item) => presentLayers.has(item.key));

  if (items.length === 0) return null;

  return (
    <div style={legalPlatStyles.legendRow}>
      <div style={legalPlatStyles.legendItems}>
        {items.map((item) => (
          <span key={item.key} style={legalPlatStyles.legendItem}>
            <span style={legendBoxStyle(item.color, item.borderColor)} />
            <span style={legalPlatStyles.legendLabel}>{item.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function LegalPlatContent({ legal }: { legal: LegalPayload | null | undefined }): JSX.Element {
  const view = normalizeLegalData(legal);

  if (view.isEmptyStructure) {
    return (
      <div style={legalPlatStyles.shell}>
        <div style={legalPlatStyles.emptyMessage}>No valid property hierarchy data found.</div>
      </div>
    );
  }

  return (
    <div style={legalPlatStyles.shell}>
      <div style={legalPlatStyles.grid}>
        <div style={legalPlatStyles.gridContent}>
          {view.subdivisions.map((subdivision, index) => (
            <div key={`${subdivision.subdivision}-${index}`} style={legalPlatStyles.subdivisionWrapper}>
              <div style={legalPlatStyles.subdivisionContent}>
                {!isBlank(subdivision.subdivision) ? <div style={legalPlatStyles.subdivisionLabel}>{subdivision.subdivision}</div> : null}
                {subdivision.tracks.map((track, trackIndex) =>
                  track.phases.map((phase, phaseIndex) => (!isBlank(phase.name) || phase.blocks.length > 0 ? <PhaseView key={`${track.name}-${trackIndex}-${phase.name}-${phaseIndex}`} phase={phase} /> : null)),
                )}
              </div>
            </div>
          ))}
        </div>
        <Legend matchPlatSubdivision={view.matchPlatSubdivision} presentLayers={view.presentLayers} />
        {view.locationLabel ? (
          <div id="plat-location-bottom" style={legalPlatStyles.location}>
            {view.locationLabel}
          </div>
        ) : null}
      </div>
    </div>
  );
}
