import * as Tooltip from "@radix-ui/react-tooltip";
import { rowStyles } from "aurora-core";
import { formatMeasure } from "../data/metesData";
import type { MetesScene } from "../type/metes.types";
import { legalMapColors, legalMapStyles } from "../style/legalMapStyles";
import { surveyStyles } from "../style/surveyStyles";
import { MapIssue } from "./MapSurface";

export function MetesDetails({ scenes, active, showParcels, hasDrawing }: {
  scenes: MetesScene[];
  active: string | undefined;
  showParcels: boolean;
  hasDrawing: boolean;
}) {
  return <>
    {active === "Boundary Calls" ? scenes.map((scene, index) => <MetesCourses key={index} scene={scene} showTitle={showParcels} showIssue={!hasDrawing} />) : null}
    {active === "Acreage" ? <section className="legal-map-acreage" style={legalMapStyles.infoSection}>
      {scenes.map((scene, index) => {
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
    {active === "Easement" ? <section className="legal-map-easement" style={legalMapStyles.infoSection}>
      {scenes.map((scene, index) => {
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
  </>;
}

function MetesCourses({ scene, showTitle, showIssue }: { scene: MetesScene; showTitle: boolean; showIssue: boolean }) {
  const measurements = scene.notes.filter(note => note.label === "Bearings" || note.label === "Distances");
  const issue = showIssue && scene.issue ? <MapIssue title={scene.title} issue={scene.issue} /> : null;
  if (!scene.courses.length && measurements.length === 0 && !issue) return null;
  if (!scene.courses.length) return <section aria-label={`${scene.title} extracted measurements`} style={legalMapStyles.infoCard}>
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
    <tbody>{scene.courses.map((course, index) => <tr key={index} style={course.confirmed ? undefined : surveyStyles.unconfirmedRow}>
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
