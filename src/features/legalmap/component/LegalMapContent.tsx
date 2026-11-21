import { Fragment, useEffect, type JSX, type ReactNode } from "react";
import { ErrorBoundary, useTabs } from "aurora-core";
import { legalMapViews, type LegalMapPayload } from "../data/legalData";
import { mergeLotBlocks, normalizeLegalData } from "../data/platData";
import { getMapGroups } from "../data/mapGroups";
import { MetesMap } from "./MetesMap";
import { PlssMap } from "./PlssMap";
import { PlatMap } from "./PlatMap";
import { MetesDetails } from "./MetesDetails";
import { MapSurface } from "./MapSurface";
import { surveyStyles } from "../style/surveyStyles";
import { useMapResize } from "../hook/useMapResize";
import { legalMapCss, legalMapStyles } from "../style/legalMapStyles";

type LegalMapProps = {
  legal: LegalMapPayload | null | undefined;
  addressMaps?: { address: string; content: ReactNode }[];
  onReadyChange?(ready: boolean): void;
};

export function LegalMapContent({ legal, addressMaps, onReadyChange }: LegalMapProps): JSX.Element {
  useEffect(() => {
    onReadyChange?.(true);
  }, [legal, onReadyChange]);

  return <>
    <style>{legalMapCss}</style>
    <div className="legal-map" style={legalMapStyles.shell}>
      <ErrorBoundary title="Map views could not be displayed" resetKey={legal}>
        <LegalMapViews legal={legal} addressMaps={addressMaps} />
      </ErrorBoundary>
    </div>
  </>;
}

function LegalMapViews({ legal, addressMaps }: Pick<LegalMapProps, "legal" | "addressMaps">) {
  const mapGroups = getMapGroups(legal);
  const tabs: string[] = legalMapViews.filter(view => view === "Address" ? Boolean(addressMaps?.length) : mapGroups.some(entry => entry.view === view));
  const { active, controls, panel } = useTabs(tabs, "Map views", {
    className: "legal-map-tabs legal-map-view-tabs", style: legalMapStyles.tabs,
    tabStyle: selected => ({ ...legalMapStyles.tabButton, color: selected ? "var(--primary-dark)" : "var(--body-ink)" }), hideSingle: false,
  });

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
  const metes = entries.flatMap(entry => entry.view === "Metes & Bounds" ? [{ ...entry.scene, title: entry.title }] : []);
  const detailTabs = active === "Metes & Bounds" ? ["Boundary Calls", "Acreage", "Easement"].filter(tab =>
    tab === "Boundary Calls" ? metes.some(scene => scene.courses.length || scene.notes.some(note => note.label === "Bearings" || note.label === "Distances")) : entries.some(entry => entry.notes.some(note => note.label === tab)))
    : (active === "PLSS" || active === "Lot & block") && entries.some(entry => entry.notes.length > 0) ? ["Details"] : [];
  const details = useTabs(detailTabs, "Map details", {
    className: "legal-map-tabs legal-map-detail-tabs", style: legalMapStyles.detailTabs,
    tabStyle: legalMapStyles.detailTab, hideSingle: true,
  });

  const maps = active === "Address" ? addressMaps!.map(entry => ({
    title: entry.address, content: <MapSurface showNorth={false}>{entry.content}</MapSurface>,
  })) : active === "PLSS" || active === "Metes & Bounds" ? (legal?.parcels_num === 1 ? [entries] : entries.map(entry => [entry])).map(parcels => {
    const plssScenes = parcels.flatMap(entry => entry.view === "PLSS" ? [{ ...entry.scene, title: entry.title }] : []);
    const metesScenes = parcels.flatMap(entry => entry.view === "Metes & Bounds" ? [{ ...entry.scene, title: entry.title }] : []);
    const drawable = parcels.some(entry => entry.scene!.items.length > 0);
    return { title: parcels[0].title,
      content: drawable ? active === "PLSS" ? <PlssMap scenes={plssScenes} /> : <MetesMap scenes={metesScenes} />
        : <MapSurface showNorth={false} issues={parcels.map(entry => ({ title: entry.title, issue: entry.scene!.issue! }))} />,
    };
  })
    : platParcels.flatMap((parcel, index) => {
      const title = `Parcel ${index + 1}`;
      if (!parcel) return [{ title, content: <MapSurface showNorth={false} issues={[{ title, issue: "Cannot map: Lot Block legal group is missing for this parcel." }]} /> }];
      const platView = normalizeLegalData({ groups: parcel.sources, parcels_num: parcelCount ? 1 : undefined });
      const issues = groups.filter(entry => parcel.sources.includes(entry.group) && entry.issue).map(entry => entry.issue!);
      return platView.isEmptyStructure && issues.length === 0 ? [] : [{ title,
        content: <PlatMap view={platView} issues={issues} title={title} />,
      }];
    });
  const resize = useMapResize(details.active && maps.length > 0 ? active : undefined);

  return (
    <>
      {tabs.length > 0 ? <div className="legal-map-toolbar" style={legalMapStyles.toolbar}>{controls}</div> : null}
      <div {...(tabs.length > 0 ? panel : {})} ref={resize.bodyRef} className="legal-map-content" style={legalMapStyles.content}>
        {maps.length > 0 ? <div className="legal-map-column" style={legalMapStyles.mapColumn}>
          <div data-map-scroll="true" className="legal-map-surveys" style={legalMapStyles.parcelList}>
            {maps.map((map, index) => <section key={`${active}-${index}`} className="survey-layout" aria-label={map.title}
              style={legalMapStyles.parcelLayout}>
              {active !== "Address" && showParcels ? <h4 style={legalMapStyles.parcelTitle}>{map.title}</h4> : null}
              <ErrorBoundary title={`${map.title} could not be displayed`} resetKey={legal}>{map.content}</ErrorBoundary>
            </section>)}
          </div>
        </div> : null}
        {details.active ? <>
          {maps.length > 0 ? <div {...resize.separator} aria-controls={`${panel.id} ${details.panel.id}`} className="legal-map-divider" style={legalMapStyles.divider}>
            <span aria-hidden="true" style={legalMapStyles.dividerGrip} />
          </div> : null}
          <aside ref={resize.infoRef} className="legal-map-info" data-legal-map-info="true" style={legalMapStyles.infoColumn}>
            {details.controls}
            <div {...details.panel} ref={resize.panelRef} style={{ ...legalMapStyles.infoPanel, height: resize.height }}>
              {details.active === "Details" ? entries.map((entry, index) => {
                return <Fragment key={index}>
                  <table className="legal-map-table" aria-label={showParcels ? `${entry.title} details` : "Details"} style={{ ...surveyStyles.notes, tableLayout: "auto" }}>
                    {showParcels ? <caption style={legalMapStyles.infoTitle}>{entry.title}</caption> : null}
                    <tbody>{entry.notes.map((note, noteIndex) => <tr key={noteIndex}>
                      <th scope="row" style={{ ...surveyStyles.cell, whiteSpace: "nowrap", width: "1%" }}>{note.label}</th>
                      <td style={surveyStyles.cell}>{note.value}</td>
                    </tr>)}</tbody>
                  </table>
                </Fragment>;
              }) : null}
              {active === "Metes & Bounds" ? <MetesDetails scenes={metes} active={details.active} showParcels={showParcels} /> : null}
            </div>
          </aside>
        </> : null}
      </div>
    </>
  );
}
