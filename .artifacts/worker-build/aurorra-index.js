import { A as e, C as t, D as n, E as r, F as i, I as a, L as o, M as s, N as c, O as l, P as u, R as d, S as f, _ as p, a as m, b as h, c as g, d as _, f as v, g as y, h as ee, i as te, j as ne, k as re, l as ie, m as ae, n as b, p as oe, r as x, s as S, t as se, u as ce, v as C, x as le, y as ue } from "./loadImagePackage-MZXAHWne.js";
import { Fragment as de, lazy as fe, useCallback as w, useEffect as T, useId as E, useLayoutEffect as pe, useMemo as me, useRef as D, useState as O } from "react";
import { ActionButton as he, ChangeRecovery as ge, ChoicesTable as _e, ConfButton as ve, CreditValue as ye, EmptyRow as be, ErrorBadge as xe, ErrorBoundary as Se, Icon as Ce, IndexValue as we, LoadError as Te, LoadPlaceholder as Ee, MetadataGroups as De, MetadataList as Oe, MetadataRow as ke, MetadataSegment as Ae, ProgressView as je, SuccessIcon as Me, TextDisclosure as Ne, choicesStyles as Pe, cleanText as Fe, composeMetadataJSON as Ie, formStyles as Le, formatCredits as Re, formatLabel as ze, getPanelData as Be, getParcelOptions as Ve, getSegmentItems as He, iconButtonStyle as Ue, indexSegments as We, isAmbiguous as Ge, metadataRowCss as Ke, metadataSpinnerCss as qe, metadataStyles as Je, progressStyles as Ye, rowStyles as k, segmentStyles as Xe, skeletonStyle as A, useTabs as Ze } from "aurora-core";
import * as Qe from "@radix-ui/react-popover";
import * as $e from "@radix-ui/react-tooltip";
//#region src/features/usage/data/usageData.ts
var et = {
	extraction: "Index Extraction",
	iq_refinement: "IQ Refinement",
	refinement: "User Refinement",
	model_generation: "Model Refinement"
};
function tt(e) {
	let t = new Date(e);
	return {
		from: new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - 1, 1)).toISOString().slice(0, 10),
		to: new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).toISOString().slice(0, 10)
	};
}
function nt(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let r of e) {
		let e = new Date(r.timestamp), i = e.toISOString().slice(0, 10);
		if (t && (i < t.from || i > t.to || !t.services.includes(r.name))) continue;
		t?.period === "weekly" && (e.setUTCDate(e.getUTCDate() - (e.getUTCDay() + 6) % 7), i = e.toISOString().slice(0, 10));
		let a = n.get(r.name);
		a || (a = {
			name: r.name,
			cost: 0,
			time: null,
			pages: 0,
			sessions: /* @__PURE__ */ new Set(),
			average: null,
			points: /* @__PURE__ */ new Map()
		}, n.set(r.name, a)), a.cost += r.cost, r.time !== void 0 && (a.time = a.time === null ? r.time : a.time + r.time), a.pages += r.page_num, a.sessions.add(r.session);
		let o = a.points.get(i);
		o ? (o.cost += r.cost, o.pages += r.page_num) : a.points.set(i, {
			date: i,
			cost: r.cost,
			pages: r.page_num
		});
	}
	return [...n.values()].map((e) => ({
		...e,
		sessions: e.sessions.size,
		average: e.pages === 0 ? null : e.cost / e.pages,
		points: [...e.points.values()].sort((e, t) => e.date.localeCompare(t.date))
	})).sort((e, t) => Object.keys(et).indexOf(e.name) - Object.keys(et).indexOf(t.name));
}
//#endregion
//#region src/features/usage/style/usageStyles.ts
var rt = {
	extraction: "var(--primary)",
	iq_refinement: "var(--primary-light)",
	refinement: "#d97706",
	model_generation: "#0284c7",
	total: "#dc2626"
}, j = {
	root: {
		color: "var(--title-ink)",
		fontFamily: "var(--font-ui)",
		padding: "1rem var(--panel-content-padding)",
		overflow: "auto",
		minHeight: 0,
		width: "100%",
		boxSizing: "border-box"
	},
	filters: {
		display: "flex",
		flexWrap: "wrap",
		alignItems: "end",
		gap: "0.75rem",
		marginBottom: "1rem"
	},
	label: {
		display: "flex",
		flexDirection: "column",
		gap: "0.25rem",
		fontSize: "0.8125rem",
		fontWeight: 500
	},
	input: {
		background: "var(--white)",
		border: "1px solid var(--border-card)",
		borderRadius: "var(--radius-control)",
		color: "inherit",
		font: "inherit",
		lineHeight: "inherit",
		padding: "0.375rem 0.5rem",
		height: "2.25rem",
		minHeight: "2.25rem",
		boxSizing: "border-box",
		boxShadow: "none",
		transform: "none"
	},
	select: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		gap: "0.75rem",
		minWidth: "10rem",
		cursor: "pointer"
	},
	options: {
		background: "var(--white)",
		border: "1px solid var(--border-card)",
		borderRadius: "var(--radius-control)",
		boxShadow: "none",
		padding: "0.25rem",
		minWidth: "13rem",
		maxWidth: "calc(100vw - 1rem)",
		maxHeight: "var(--radix-popover-content-available-height)",
		overflowY: "auto",
		color: "var(--title-ink)",
		fontFamily: "var(--font-ui)",
		zIndex: 1
	},
	option: {
		display: "flex",
		alignItems: "center",
		gap: "0.5rem",
		padding: "0.5rem",
		minHeight: "2.75rem",
		boxSizing: "border-box",
		fontSize: "0.8125rem",
		cursor: "pointer"
	},
	swatch: {
		display: "inline-block",
		flexShrink: 0,
		width: "0.75rem",
		height: "0.75rem",
		borderRadius: "2px"
	},
	card: {
		border: "1px solid var(--border-card)",
		borderRadius: "var(--radius-card)",
		padding: "1rem",
		marginBottom: "1rem"
	},
	summaries: {
		display: "flex",
		flexWrap: "wrap",
		alignItems: "start",
		gap: "1rem",
		marginTop: "1rem"
	},
	serviceSummary: {
		flex: "1 1 18rem",
		minWidth: 0
	},
	total: {
		flex: "0 1 auto",
		minWidth: 0,
		borderRight: "1px solid var(--border-card)",
		paddingRight: "1rem"
	},
	title: {
		display: "flex",
		alignItems: "center",
		gap: "0.5rem",
		fontSize: "1rem",
		fontWeight: 600,
		margin: "0 0 0.75rem"
	},
	metrics: {
		display: "flex",
		flexWrap: "wrap",
		gap: "1.25rem",
		margin: "0 0 0.75rem"
	},
	metric: {
		display: "flex",
		flexDirection: "column",
		gap: "0.25rem"
	},
	value: {
		fontSize: "1.125rem",
		fontWeight: 600,
		margin: 0,
		fontVariantNumeric: "tabular-nums"
	},
	caption: {
		fontSize: "0.75rem",
		color: "#64748b"
	},
	chart: { overflowX: "auto" },
	svg: {
		display: "block",
		minWidth: "30rem",
		width: "100%",
		height: "auto"
	},
	empty: {
		color: "#64748b",
		padding: "1rem 0",
		textAlign: "center"
	}
}, M = a(), N = "C:/GitHub/Tabularium/aurorra_index/src/features/usage/component/UsagePanel.tsx";
function it({ records: e }) {
	let t = E(), n = tt(Date.now()), [r, i] = O(() => ({
		...n,
		services: Object.keys(et),
		period: "daily"
	})), a = me(() => nt(e, {
		...r,
		services: Object.keys(et)
	}), [e, r]), s = a.filter((e) => r.services.includes(e.name)), c = [s.filter((e) => e.name === "extraction" || e.name === "iq_refinement"), ...s.filter((e) => e.name === "refinement" || e.name === "model_generation").map((e) => [e])].filter((e) => e.length > 0);
	return /* @__PURE__ */ (0, M.jsxDEV)("div", {
		style: j.root,
		children: [
			/* @__PURE__ */ (0, M.jsxDEV)("div", {
				style: j.filters,
				children: [
					/* @__PURE__ */ (0, M.jsxDEV)("div", {
						style: j.label,
						children: [/* @__PURE__ */ (0, M.jsxDEV)("label", {
							htmlFor: t,
							children: "Service"
						}, void 0, !1, {
							fileName: N,
							lineNumber: 23,
							columnNumber: 11
						}, this), /* @__PURE__ */ (0, M.jsxDEV)(Qe.Root, { children: [/* @__PURE__ */ (0, M.jsxDEV)(Qe.Trigger, {
							asChild: !0,
							children: /* @__PURE__ */ (0, M.jsxDEV)("button", {
								id: t,
								"aria-label": "Service",
								type: "button",
								style: {
									...j.input,
									...j.select
								},
								children: [/* @__PURE__ */ (0, M.jsxDEV)("span", { children: r.services.length === Object.keys(et).length ? "All services" : r.services.length === 1 ? et[r.services[0]] : `${r.services.length} services` }, void 0, !1, {
									fileName: N,
									lineNumber: 27,
									columnNumber: 17
								}, this), /* @__PURE__ */ (0, M.jsxDEV)("svg", {
									"aria-hidden": "true",
									width: "12",
									height: "12",
									viewBox: "0 0 16 16",
									fill: "none",
									stroke: "currentColor",
									strokeWidth: "1.5",
									children: /* @__PURE__ */ (0, M.jsxDEV)("path", { d: "m4 6 4 4 4-4" }, void 0, !1, {
										fileName: N,
										lineNumber: 28,
										columnNumber: 136
									}, this)
								}, void 0, !1, {
									fileName: N,
									lineNumber: 28,
									columnNumber: 17
								}, this)]
							}, void 0, !0, {
								fileName: N,
								lineNumber: 26,
								columnNumber: 15
							}, this)
						}, void 0, !1, {
							fileName: N,
							lineNumber: 25,
							columnNumber: 13
						}, this), /* @__PURE__ */ (0, M.jsxDEV)(Qe.Content, {
							"aria-label": "Services",
							role: "group",
							align: "start",
							sideOffset: 6,
							collisionPadding: 8,
							style: j.options,
							children: Object.keys(et).map((e) => {
								let n = r.services.includes(e), a = n && r.services.length === 1;
								return /* @__PURE__ */ (0, M.jsxDEV)("label", {
									htmlFor: `${t}-${e}`,
									style: j.option,
									children: [/* @__PURE__ */ (0, M.jsxDEV)(o, {
										id: `${t}-${e}`,
										checked: n,
										disabled: a,
										style: Le.checkbox(a, n),
										onCheckedChange: (t) => i({
											...r,
											services: t === !0 ? [...r.services, e] : r.services.filter((t) => t !== e)
										}),
										children: /* @__PURE__ */ (0, M.jsxDEV)(d, {
											"aria-hidden": !0,
											style: {
												fontSize: "0.75rem",
												lineHeight: 1
											},
											children: "✓"
										}, void 0, !1, {
											fileName: N,
											lineNumber: 38,
											columnNumber: 21
										}, this)
									}, void 0, !1, {
										fileName: N,
										lineNumber: 36,
										columnNumber: 19
									}, this), et[e]]
								}, e, !0, {
									fileName: N,
									lineNumber: 35,
									columnNumber: 24
								}, this);
							})
						}, void 0, !1, {
							fileName: N,
							lineNumber: 31,
							columnNumber: 13
						}, this)] }, void 0, !0, {
							fileName: N,
							lineNumber: 24,
							columnNumber: 11
						}, this)]
					}, void 0, !0, {
						fileName: N,
						lineNumber: 22,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ (0, M.jsxDEV)("label", {
						style: j.label,
						children: ["From", /* @__PURE__ */ (0, M.jsxDEV)("input", {
							"aria-label": "From",
							type: "date",
							style: j.input,
							min: n.from,
							max: r.to,
							value: r.from,
							onChange: (e) => i({
								...r,
								from: e.target.value
							})
						}, void 0, !1, {
							fileName: N,
							lineNumber: 47,
							columnNumber: 11
						}, this)]
					}, void 0, !0, {
						fileName: N,
						lineNumber: 46,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ (0, M.jsxDEV)("label", {
						style: j.label,
						children: ["To", /* @__PURE__ */ (0, M.jsxDEV)("input", {
							"aria-label": "To",
							type: "date",
							style: j.input,
							min: r.from,
							max: n.to,
							value: r.to,
							onChange: (e) => i({
								...r,
								to: e.target.value
							})
						}, void 0, !1, {
							fileName: N,
							lineNumber: 50,
							columnNumber: 11
						}, this)]
					}, void 0, !0, {
						fileName: N,
						lineNumber: 49,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ (0, M.jsxDEV)("label", {
						style: j.label,
						children: ["Period", /* @__PURE__ */ (0, M.jsxDEV)("select", {
							"aria-label": "Period",
							style: j.input,
							value: r.period,
							onChange: (e) => i({
								...r,
								period: e.target.value
							}),
							children: [/* @__PURE__ */ (0, M.jsxDEV)("option", {
								value: "daily",
								children: "Daily"
							}, void 0, !1, {
								fileName: N,
								lineNumber: 54,
								columnNumber: 13
							}, this), /* @__PURE__ */ (0, M.jsxDEV)("option", {
								value: "weekly",
								children: "Weekly"
							}, void 0, !1, {
								fileName: N,
								lineNumber: 54,
								columnNumber: 49
							}, this)]
						}, void 0, !0, {
							fileName: N,
							lineNumber: 53,
							columnNumber: 11
						}, this)]
					}, void 0, !0, {
						fileName: N,
						lineNumber: 52,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ (0, M.jsxDEV)("span", {
						style: j.caption,
						children: "UTC"
					}, void 0, !1, {
						fileName: N,
						lineNumber: 57,
						columnNumber: 9
					}, this)
				]
			}, void 0, !0, {
				fileName: N,
				lineNumber: 21,
				columnNumber: 7
			}, this),
			c.length === 0 ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
				style: j.empty,
				children: "No usage in the selected period."
			}, void 0, !1, {
				fileName: N,
				lineNumber: 59,
				columnNumber: 30
			}, this) : c.map((e) => {
				let t = e.some((e) => e.name === "extraction" || e.name === "iq_refinement"), n = t ? `${et.extraction} and ${et.iq_refinement}` : et[e[0].name], i = [...new Set(e.flatMap((e) => e.points.map((e) => e.date)))].sort().map((n) => {
					let r = e.map((e) => e.points.reduce((e, t) => t.date === n ? {
						cost: e.cost + t.cost,
						pages: e.pages + t.pages
					} : e, {
						cost: 0,
						pages: 0
					}));
					return {
						date: n,
						values: t ? [{
							cost: r.reduce((e, t) => e + t.cost, 0),
							pages: null
						}, ...r] : r
					};
				}), a = [...t ? [{
					label: "Total",
					color: rt.total
				}] : [], ...e.map((e) => ({
					label: et[e.name],
					color: rt[e.name]
				}))], o = Math.max(...i.flatMap((e) => e.values.map((e) => e.cost))), s = 600 / i.length;
				return /* @__PURE__ */ (0, M.jsxDEV)("section", {
					"aria-label": `${n} usage`,
					style: j.card,
					children: [/* @__PURE__ */ (0, M.jsxDEV)("div", {
						style: j.chart,
						children: /* @__PURE__ */ (0, M.jsxDEV)("svg", {
							role: "img",
							"aria-label": `${n} ${r.period} credits chart`,
							viewBox: "0 0 680 210",
							style: j.svg,
							children: [
								/* @__PURE__ */ (0, M.jsxDEV)("text", {
									x: "0",
									y: "14",
									fill: "#64748b",
									fontSize: "12",
									children: [`${Re(o).slice(0, -3)} `, /* @__PURE__ */ (0, M.jsxDEV)("tspan", {
										fontSize: "smaller",
										children: "CR"
									}, void 0, !1, {
										fileName: N,
										lineNumber: 72,
										columnNumber: 102
									}, this)]
								}, void 0, !0, {
									fileName: N,
									lineNumber: 72,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ (0, M.jsxDEV)("line", {
									x1: "60",
									x2: "660",
									y1: "24",
									y2: "24",
									stroke: "#e2e8f0"
								}, void 0, !1, {
									fileName: N,
									lineNumber: 73,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ (0, M.jsxDEV)("line", {
									x1: "60",
									x2: "660",
									y1: "178",
									y2: "178",
									stroke: "#cbd5e1"
								}, void 0, !1, {
									fileName: N,
									lineNumber: 74,
									columnNumber: 15
								}, this),
								i.map((e, t) => /* @__PURE__ */ (0, M.jsxDEV)("g", { children: [e.values.map((n, r) => {
									let i = o === 0 ? 0 : n.cost / o * 146, c = s * .7;
									return /* @__PURE__ */ (0, M.jsxDEV)("rect", {
										x: 60 + t * s + (s - c) / 2,
										y: 178 - i,
										width: c,
										height: i,
										rx: "2",
										fill: a[r].color,
										children: /* @__PURE__ */ (0, M.jsxDEV)("title", { children: `${a[r].label} ${e.date}: ${Re(n.cost)}${n.pages === null ? "" : `, ${n.pages} pages`}` }, void 0, !1, {
											fileName: N,
											lineNumber: 80,
											columnNumber: 21
										}, this)
									}, a[r].label, !1, {
										fileName: N,
										lineNumber: 79,
										columnNumber: 26
									}, this);
								}), t % Math.ceil(i.length / 8) === 0 ? /* @__PURE__ */ (0, M.jsxDEV)("text", {
									x: 60 + t * s + s / 2,
									y: "199",
									textAnchor: "middle",
									fill: "#64748b",
									fontSize: "12",
									children: e.date.slice(5)
								}, void 0, !1, {
									fileName: N,
									lineNumber: 83,
									columnNumber: 63
								}, this) : null] }, e.date, !0, {
									fileName: N,
									lineNumber: 75,
									columnNumber: 45
								}, this)),
								/* @__PURE__ */ (0, M.jsxDEV)("text", {
									x: "16",
									y: "181",
									fill: "#64748b",
									fontSize: "12",
									children: [`${Re(0).slice(0, -3)} `, /* @__PURE__ */ (0, M.jsxDEV)("tspan", {
										fontSize: "smaller",
										children: "CR"
									}, void 0, !1, {
										fileName: N,
										lineNumber: 85,
										columnNumber: 102
									}, this)]
								}, void 0, !0, {
									fileName: N,
									lineNumber: 85,
									columnNumber: 15
								}, this)
							]
						}, void 0, !0, {
							fileName: N,
							lineNumber: 71,
							columnNumber: 13
						}, this)
					}, void 0, !1, {
						fileName: N,
						lineNumber: 70,
						columnNumber: 11
					}, this), /* @__PURE__ */ (0, M.jsxDEV)("div", {
						style: j.summaries,
						children: [t && /* @__PURE__ */ (0, M.jsxDEV)("section", {
							"aria-label": "Totals usage",
							style: j.total,
							children: [/* @__PURE__ */ (0, M.jsxDEV)("h3", {
								style: j.title,
								children: "Totals"
							}, void 0, !1, {
								fileName: N,
								lineNumber: 90,
								columnNumber: 15
							}, this), /* @__PURE__ */ (0, M.jsxDEV)("dl", {
								style: j.metrics,
								children: [/* @__PURE__ */ (0, M.jsxDEV)("div", {
									style: j.metric,
									children: [/* @__PURE__ */ (0, M.jsxDEV)("dt", {
										style: j.caption,
										children: "Credits"
									}, void 0, !1, {
										fileName: N,
										lineNumber: 92,
										columnNumber: 44
									}, this), /* @__PURE__ */ (0, M.jsxDEV)("dd", {
										style: j.value,
										children: /* @__PURE__ */ (0, M.jsxDEV)(ye, { value: e.reduce((e, t) => e + t.cost, 0) }, void 0, !1, {
											fileName: N,
											lineNumber: 92,
											columnNumber: 108
										}, this)
									}, void 0, !1, {
										fileName: N,
										lineNumber: 92,
										columnNumber: 83
									}, this)]
								}, void 0, !0, {
									fileName: N,
									lineNumber: 92,
									columnNumber: 17
								}, this), /* @__PURE__ */ (0, M.jsxDEV)("div", {
									style: j.metric,
									children: [/* @__PURE__ */ (0, M.jsxDEV)("dt", {
										style: j.caption,
										children: "Average page credits"
									}, void 0, !1, {
										fileName: N,
										lineNumber: 93,
										columnNumber: 44
									}, this), /* @__PURE__ */ (0, M.jsxDEV)("dd", {
										style: j.value,
										children: e.every((e) => e.average === null) ? "No pages used" : /* @__PURE__ */ (0, M.jsxDEV)(ye, { value: e.reduce((e, t) => t.average === null ? e : e + t.average, 0) }, void 0, !1, {
											fileName: N,
											lineNumber: 93,
											columnNumber: 191
										}, this)
									}, void 0, !1, {
										fileName: N,
										lineNumber: 93,
										columnNumber: 96
									}, this)]
								}, void 0, !0, {
									fileName: N,
									lineNumber: 93,
									columnNumber: 17
								}, this)]
							}, void 0, !0, {
								fileName: N,
								lineNumber: 91,
								columnNumber: 15
							}, this)]
						}, void 0, !0, {
							fileName: N,
							lineNumber: 89,
							columnNumber: 26
						}, this), e.map((e) => /* @__PURE__ */ (0, M.jsxDEV)("section", {
							"aria-label": t ? `${et[e.name]} usage` : void 0,
							style: j.serviceSummary,
							children: [/* @__PURE__ */ (0, M.jsxDEV)("h3", {
								style: j.title,
								children: [/* @__PURE__ */ (0, M.jsxDEV)("span", {
									"aria-hidden": "true",
									style: {
										...j.swatch,
										background: rt[e.name]
									}
								}, void 0, !1, {
									fileName: N,
									lineNumber: 97,
									columnNumber: 40
								}, this), et[e.name]]
							}, void 0, !0, {
								fileName: N,
								lineNumber: 97,
								columnNumber: 15
							}, this), /* @__PURE__ */ (0, M.jsxDEV)("dl", {
								style: j.metrics,
								children: [/* @__PURE__ */ (0, M.jsxDEV)("div", {
									style: j.metric,
									children: [/* @__PURE__ */ (0, M.jsxDEV)("dt", {
										style: j.caption,
										children: "Credits"
									}, void 0, !1, {
										fileName: N,
										lineNumber: 99,
										columnNumber: 44
									}, this), /* @__PURE__ */ (0, M.jsxDEV)("dd", {
										style: j.value,
										children: /* @__PURE__ */ (0, M.jsxDEV)(ye, { value: e.cost }, void 0, !1, {
											fileName: N,
											lineNumber: 99,
											columnNumber: 108
										}, this)
									}, void 0, !1, {
										fileName: N,
										lineNumber: 99,
										columnNumber: 83
									}, this)]
								}, void 0, !0, {
									fileName: N,
									lineNumber: 99,
									columnNumber: 17
								}, this), e.name !== "model_generation" && /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [
									/* @__PURE__ */ (0, M.jsxDEV)("div", {
										style: j.metric,
										children: [/* @__PURE__ */ (0, M.jsxDEV)("dt", {
											style: j.caption,
											children: "Sessions"
										}, void 0, !1, {
											fileName: N,
											lineNumber: 101,
											columnNumber: 46
										}, this), /* @__PURE__ */ (0, M.jsxDEV)("dd", {
											style: j.value,
											children: e.sessions
										}, void 0, !1, {
											fileName: N,
											lineNumber: 101,
											columnNumber: 86
										}, this)]
									}, void 0, !0, {
										fileName: N,
										lineNumber: 101,
										columnNumber: 19
									}, this),
									/* @__PURE__ */ (0, M.jsxDEV)("div", {
										style: j.metric,
										children: [/* @__PURE__ */ (0, M.jsxDEV)("dt", {
											style: j.caption,
											children: "Pages used"
										}, void 0, !1, {
											fileName: N,
											lineNumber: 102,
											columnNumber: 46
										}, this), /* @__PURE__ */ (0, M.jsxDEV)("dd", {
											style: j.value,
											children: e.pages
										}, void 0, !1, {
											fileName: N,
											lineNumber: 102,
											columnNumber: 88
										}, this)]
									}, void 0, !0, {
										fileName: N,
										lineNumber: 102,
										columnNumber: 19
									}, this),
									/* @__PURE__ */ (0, M.jsxDEV)("div", {
										style: j.metric,
										children: [/* @__PURE__ */ (0, M.jsxDEV)("dt", {
											style: j.caption,
											children: "Average page credits"
										}, void 0, !1, {
											fileName: N,
											lineNumber: 103,
											columnNumber: 46
										}, this), /* @__PURE__ */ (0, M.jsxDEV)("dd", {
											style: j.value,
											children: e.average === null ? "No pages used" : /* @__PURE__ */ (0, M.jsxDEV)(ye, { value: e.average }, void 0, !1, {
												fileName: N,
												lineNumber: 103,
												columnNumber: 169
											}, this)
										}, void 0, !1, {
											fileName: N,
											lineNumber: 103,
											columnNumber: 98
										}, this)]
									}, void 0, !0, {
										fileName: N,
										lineNumber: 103,
										columnNumber: 19
									}, this)
								] }, void 0, !0, {
									fileName: N,
									lineNumber: 100,
									columnNumber: 57
								}, this)]
							}, void 0, !0, {
								fileName: N,
								lineNumber: 98,
								columnNumber: 15
							}, this)]
						}, e.name, !0, {
							fileName: N,
							lineNumber: 96,
							columnNumber: 35
						}, this))]
					}, void 0, !0, {
						fileName: N,
						lineNumber: 88,
						columnNumber: 11
					}, this)]
				}, n, !0, {
					fileName: N,
					lineNumber: 69,
					columnNumber: 16
				}, this);
			}),
			/* @__PURE__ */ (0, M.jsxDEV)("section", {
				"aria-label": "Total Credits",
				style: {
					...j.metrics,
					alignItems: "baseline"
				},
				children: [/* @__PURE__ */ (0, M.jsxDEV)("h3", {
					style: {
						...j.title,
						margin: 0
					},
					children: "Total Credits"
				}, void 0, !1, {
					fileName: N,
					lineNumber: 111,
					columnNumber: 9
				}, this), /* @__PURE__ */ (0, M.jsxDEV)("p", {
					style: j.value,
					children: /* @__PURE__ */ (0, M.jsxDEV)(ye, { value: a.reduce((e, t) => e + t.cost, 0) }, void 0, !1, {
						fileName: N,
						lineNumber: 112,
						columnNumber: 33
					}, this)
				}, void 0, !1, {
					fileName: N,
					lineNumber: 112,
					columnNumber: 9
				}, this)]
			}, void 0, !0, {
				fileName: N,
				lineNumber: 110,
				columnNumber: 7
			}, this)
		]
	}, void 0, !0, {
		fileName: N,
		lineNumber: 20,
		columnNumber: 5
	}, this);
}
//#endregion
//#region src/features/usage/hook/useUsage.ts
function at(e) {
	let [t, n] = O({
		owner: null,
		records: [],
		error: null,
		loading: !1
	});
	return T(() => {
		if (e === null) return;
		let t = !0, r, i = new Worker(new URL(
			/* @vite-ignore */
			"/assets/UsageWorker-DABY2sFP.js",
			"" + import.meta.url
		), { type: "module" });
		i.onmessage = (r) => {
			t && (r.data.ok ? n({
				owner: e,
				records: r.data.data,
				error: null,
				loading: !1
			}) : n({
				owner: e,
				records: [],
				error: r.data.error,
				loading: !1
			}));
		}, i.onerror = (r) => {
			t && n({
				owner: e,
				records: [],
				error: r,
				loading: !1
			});
		};
		function a() {
			let t = c.getState();
			i.postMessage({
				owner: e,
				now: Date.now(),
				services: t.activeSession === null ? [] : (t.report?.usage?.services ?? []).map((e) => ({
					...e,
					session: t.activeSession
				}))
			});
		}
		function o() {
			let e = /* @__PURE__ */ new Date();
			r = setTimeout(() => {
				a(), o();
			}, Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate() + 1) - e.getTime());
		}
		a(), o();
		let s = c.subscribe((e, t) => {
			(e.activeSession !== t.activeSession || e.report?.usage?.services !== t.report?.usage?.services) && a();
		});
		return () => {
			t = !1, clearTimeout(r), s(), i.terminate();
		};
	}, [e]), t.owner === e ? t : {
		owner: e,
		records: [],
		error: null,
		loading: e !== null
	};
}
//#endregion
//#region src/features/queue/component/QueueActions.tsx
var ot = "C:/GitHub/Tabularium/aurorra_index/src/features/queue/component/QueueActions.tsx";
function st({ id: e, code: t }) {
	let n = re((t) => t.tasks.find((t) => t.id === e)), r = re((e) => e.retry), i = re((e) => e.cancel);
	return !n || n.status !== "failed" ? null : /* @__PURE__ */ (0, M.jsxDEV)(ge, {
		error: n.error,
		onRetry: () => void r(e),
		onCancel: n.changes.slice(n.cursor).some((e) => "segment" in e ? t === void 0 : e.code === t) ? () => i(e, t) : void 0
	}, void 0, !1, {
		fileName: ot,
		lineNumber: 9,
		columnNumber: 10
	}, this);
}
//#endregion
//#region src/features/choices/worker/choicesWorkerClient.ts
function ct(e, t) {
	let n = Error(e);
	if (typeof t == "object" && t) {
		let e = t;
		typeof e.code == "string" && (n.code = e.code), typeof e.status == "number" && (n.status = e.status), typeof e.retryAfter == "string" && (n.retryAfter = e.retryAfter), typeof e.retryAt == "number" && (n.retryAt = e.retryAt), Object.prototype.hasOwnProperty.call(e, "details") && (n.details = e.details);
	}
	return n;
}
function lt(e) {
	return { load(t, n) {
		return new Promise((r, i) => {
			let a = new Worker(new URL(
				/* @vite-ignore */
				"/assets/ChoicesWorker-DanR3L2R.js",
				"" + import.meta.url
			), { type: "module" }), o = !1;
			a.onmessage = (e) => {
				if (o) return;
				o = !0, a.terminate();
				let t = e.data;
				if (t.ok) {
					r(t.data);
					return;
				}
				i(ct(t.error, t));
			}, a.onerror = (e) => {
				o || (o = !0, a.terminate(), i(e));
			}, a.postMessage({
				type: "load",
				token: t,
				session: n,
				config: e
			});
		});
	} };
}
//#endregion
//#region src/features/choices/data/loadChoices.ts
async function ut(e) {
	let t = l.getState().generation, n = await lt({ apiBaseUrl: e.apiGatewayUrl }).load(e.authToken, e.session), r = n === null ? null : {
		source: n.source,
		items: n.items,
		jurisdiction: n.jurisdiction ?? null
	};
	return t === l.getState().generation && l.getState().session === e.session && oe.setState({ choices: structuredClone(r) }), r;
}
//#endregion
//#region src/features/metdataview/hook/useMetadata.ts
function dt(e) {
	let t = e;
	return {
		...e instanceof ErrorEvent ? { cause: e } : {},
		code: t.code,
		details: t.details,
		error: typeof t.error == "string" ? t.error : t.message || "Metadata request failed.",
		status: t.status
	};
}
function ft({ authToken: t, batchCode: n, apiGatewayUrl: r, callbacks: i, deferredState: a, intervalMs: o, onQueueChange: s, formatError: c, refresh: u, retryIntervalMs: d, retryLimit: f, segments: p, session: m, workerClient: h }) {
	let _ = D(i), y = ee(), te = ne((e) => e.getJSON(m)), re = me(() => Ie(te), [te]), ie = me(() => re ? Be(re) : null, [re]), ae = y.openSegment, [b, x] = O(a.selectedIndex), S = D(null), se = D(0), C = me(() => h || g({
		apiBaseUrl: r,
		onRetry: (e) => oe.getState().setRetryAttempt(e),
		retryIntervalMs: d,
		retryLimit: f
	}), [
		r,
		d,
		f,
		h
	]);
	T(() => {
		_.current = i;
	}, [i]), T(() => () => _.current.onViewCanceled?.(), []);
	let le = w((e) => {
		oe.getState().setLoaded(m), i.onView?.(e), i.onMetadataLoaded?.(e, m);
	}, [i, m]), ue = w(async (n) => {
		oe.getState().activeSession !== m && oe.getState().setLoading(m), ut({
			apiGatewayUrl: r,
			authToken: t ?? "",
			session: m
		}).catch(() => void 0);
		let a = n ? null : Ie(e.getState().getJSON(m));
		if (a) return le(a), v({
			authToken: t ?? "",
			session: m,
			background: !0,
			workerClient: ce({
				apiBaseUrl: r,
				retryIntervalMs: d,
				retryLimit: f
			})
		}), a;
		let o = ++se.current, s = l.getState().generation;
		oe.getState().setLoading(m), i.onViewStarted?.();
		try {
			let e = await C.indexData(t ?? "", m, n), r = oe.getState();
			return s !== l.getState().generation || o !== se.current || r.activeSession !== m || r.status === "idle" ? void 0 : (l.getState().setMetadata(m, e), le(e), n && i.onRefresh?.(e), e);
		} catch (e) {
			let t = dt(e), n = oe.getState();
			throw s === l.getState().generation && o === se.current && n.activeSession === m && n.status !== "idle" && (n.setError(t), i.onViewError?.(t), i.onMetadataError?.(t)), t;
		}
	}, [
		r,
		t,
		i,
		C,
		le,
		d,
		f,
		m
	]);
	T(() => {
		ue(!1).catch(() => void 0);
	}, [ue]), T(() => {
		!u || u.session !== m || u.id === S.current || (S.current = u.id, ue(!0).then((e) => {
			e && oe.setState({ openSegment: u.segment });
		}).catch(() => void 0));
	}, [
		ue,
		u,
		m
	]), T(() => {
		oe.setState({ openSegment: a.segment || p.TITLE }), x(a.selectedIndex);
	}, [
		a.segment,
		a.selectedIndex,
		p.TITLE,
		m
	]), T(() => {
		let e = oe.getState().openSegment;
		e && _.current.onSegmentExpand?.(e);
	}, [ae, m]);
	let de = w((e, t) => {
		t && oe.setState({ openSegment: e });
	}, []), fe = w(async (e) => {
		await l.getState().enqueue({
			action: "drop",
			code: e.code,
			session: m,
			segment: e.segment,
			batch: n
		}, {
			authToken: t,
			client: C,
			intervalMs: o,
			formatError: c,
			onChange: s
		}), b?.code === e.code && (x(null), i.onIndexFocus?.(null));
	}, [
		s,
		c,
		t,
		n,
		i,
		C,
		o,
		b?.code,
		m
	]), E = w(async (e) => {
		await l.getState().enqueue({
			action: "confirm",
			code: e.code,
			session: m,
			segment: e.segment,
			batch: n
		}, {
			authToken: t,
			client: C,
			intervalMs: o,
			formatError: c,
			onChange: s
		});
	}, [
		s,
		c,
		t,
		n,
		C,
		o,
		m
	]), pe = w(async (e) => {
		await l.getState().enqueue({
			action: "reprocess",
			session: m,
			segment: e,
			batch: n
		}, {
			authToken: t,
			client: C,
			intervalMs: o,
			formatError: c,
			onChange: s
		});
	}, [
		s,
		c,
		t,
		n,
		C,
		o,
		m
	]), he = w(async (e) => {
		await l.getState().enqueue({
			action: "clear",
			session: m,
			segment: e,
			batch: n
		}, {
			authToken: t,
			client: C,
			intervalMs: o,
			formatError: c,
			onChange: s
		}), (b?.segment === e || e === p.PROPERTY && b?.segment === p.LEGAL || e === p.ACKNOWLEDGMENT && b?.segment === We.EXECUTION) && (x(null), i.onIndexFocus?.(null));
	}, [
		s,
		c,
		t,
		n,
		i,
		C,
		o,
		b?.segment,
		p,
		m
	]);
	return {
		choices: y.choices?.items ?? null,
		loadMetadata: ue,
		metadata: re,
		onConfirm: E,
		onDrop: fe,
		onReprocess: pe,
		onClear: he,
		openSegment: ae,
		pageError: y.activeSession === m ? y.pageError : null,
		retryAttempt: y.retryAttempt,
		selectedIndex: b,
		setSectionOpen: de,
		store: y,
		panelData: ie
	};
}
//#endregion
//#region src/features/legalmap/data/legalData.ts
function pt(e, t) {
	return e.replace(RegExp(`(^|[,/])\\s*(?:${t})\\b\\s*(?:no\\.?\\s*)?`, "gi"), "$1").trim();
}
var mt = [
	"Lot & block",
	"Address",
	"Metes & Bounds",
	"PLSS"
];
function ht(e) {
	return !!(e && typeof e == "object" && !Array.isArray(e));
}
function gt(e) {
	return !e || typeof e == "string" && e.trim().length === 0;
}
function _t(e) {
	if (!e || typeof e != "object") return [];
	if (Array.isArray(e)) return e;
	let t = e;
	return Array.isArray(t.elements) ? t.elements : Array.isArray(t.Elements) ? t.Elements : Array.isArray(t.legalElements) ? t.legalElements : Array.isArray(t.LegalElements) ? t.LegalElements : [];
}
function vt(e, t) {
	let n = String(t || "").toLowerCase();
	return e.find((e) => typeof e.aspect == "string" && e.aspect.toLowerCase() === n)?.value || "";
}
function yt(e) {
	return Array.isArray(e) ? e : ht(e) && [
		e.LegalGroups,
		e.legalGroups,
		e.groups,
		e.items
	].find(Array.isArray) || [];
}
function bt(e) {
	return e.map((e) => ({
		label: ze(e.aspect),
		value: e.value,
		explanation: e.explanation
	}));
}
//#endregion
//#region src/features/legalmap/data/platData.ts
var xt = {
	AL: "Alabama",
	AK: "Alaska",
	AZ: "Arizona",
	AR: "Arkansas",
	CA: "California",
	CO: "Colorado",
	CT: "Connecticut",
	DE: "Delaware",
	FL: "Florida",
	GA: "Georgia",
	HI: "Hawaii",
	ID: "Idaho",
	IL: "Illinois",
	IN: "Indiana",
	IA: "Iowa",
	KS: "Kansas",
	KY: "Kentucky",
	LA: "Louisiana",
	ME: "Maine",
	MD: "Maryland",
	MA: "Massachusetts",
	MI: "Michigan",
	MN: "Minnesota",
	MS: "Mississippi",
	MO: "Missouri",
	MT: "Montana",
	NE: "Nebraska",
	NV: "Nevada",
	NH: "New Hampshire",
	NJ: "New Jersey",
	NM: "New Mexico",
	NY: "New York",
	NC: "North Carolina",
	ND: "North Dakota",
	OH: "Ohio",
	OK: "Oklahoma",
	OR: "Oregon",
	PA: "Pennsylvania",
	RI: "Rhode Island",
	SC: "South Carolina",
	SD: "South Dakota",
	TN: "Tennessee",
	TX: "Texas",
	UT: "Utah",
	VT: "Vermont",
	VA: "Virginia",
	WA: "Washington",
	WV: "West Virginia",
	WI: "Wisconsin",
	WY: "Wyoming",
	DC: "District of Columbia"
}, St = ["subdivision", "condominium"], Ct = [
	"phase",
	"unit",
	"section"
], wt = [
	"block",
	"tract",
	"building"
], Tt = [
	"lot",
	"condominium_unit",
	"parcel"
], Et = {
	lot: "Lot",
	condominium_unit: "Condo Unit",
	parcel: "Parcel"
}, Dt = Object.values(xt), Ot = RegExp(`\\b(${Dt.map((e) => e.replace(/ /g, "\\s+")).join("|")})\\b`, "i");
function kt(e) {
	let t = e.replace(/(^|,|&|\band\b)\s*lots?\b\s*(?:no\.?\s*)?/gi, "$1").trim().replace(/,\s*(?=&|\band\b)/gi, "");
	if (!/^\d+(?:\s*[-–]\s*\d+)?(?:\s*(?:,|&|\band\b)\s*\d+(?:\s*[-–]\s*\d+)?)*$/i.test(t)) return null;
	let n = /* @__PURE__ */ new Set();
	for (let e of t.split(/\s*(?:,|&|\band\b)\s*/i)) {
		let [t, r = t] = e.split(/\s*[-–]\s*/).map(Number);
		if (!Number.isSafeInteger(t) || !Number.isSafeInteger(r) || r < t || r - t > 1e4) return null;
		for (let e = t; e <= r; e += 1) n.add(e);
	}
	return [...n];
}
function At(e) {
	let t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Map(), r = [];
	for (let i of e) {
		let e = i.kind === "lot" ? kt(i.name) : null;
		e ? (e.forEach((e) => t.add(e)), e.length === 1 && i.acreage && n.set(e[0], [...n.get(e[0]) ?? [], ...i.acreage])) : r.push({
			...i,
			filled: !0
		});
	}
	if (!t.size) return r.length <= 12 ? r : jt(e);
	let i = [...t].sort((e, t) => e - t), a = i[0], o = i[i.length - 1], s = (e, t) => e === t ? String(e) : `${e}–${t}`, c = [];
	if (o - a + 1 <= 12 - r.length) for (let e = a; e <= o; e += 1) c.push({
		kind: "lot",
		name: String(e),
		filled: t.has(e)
	});
	else {
		let e = a, t = a;
		for (let n of i.slice(1)) {
			if (n === t + 1) {
				t = n;
				continue;
			}
			c.push({
				kind: "lot",
				name: s(e, t),
				filled: !0
			}), c.push({
				kind: "lot",
				name: s(t + 1, n - 1),
				filled: !1
			}), e = t = n;
		}
		c.push({
			kind: "lot",
			name: s(e, t),
			filled: !0
		});
		let n = 12 - r.length;
		for (; c.length < n;) {
			let e = -1, t = 1;
			if (c.forEach((n, r) => {
				if (!n.filled) return;
				let [i, a = i] = n.name.split("–").map(Number);
				a - i + 1 > t && (e = r, t = a - i + 1);
			}), e < 0) break;
			let [n, r] = c[e].name.split("–").map(Number), i = Math.floor((n + r) / 2);
			c.splice(e, 1, {
				kind: "lot",
				name: s(n, i),
				filled: !0
			}, {
				kind: "lot",
				name: s(i + 1, r),
				filled: !0
			});
		}
		if (c.length > 12 - r.length) {
			let e = Math.max(1, 12 - r.length), t = o - a + 1;
			c = Array.from({ length: e }, (n, r) => {
				let o = a + Math.floor(t * r / e), c = a + Math.floor(t * (r + 1) / e) - 1, l = i.filter((e) => e >= o && e <= c).length;
				return {
					kind: "lot",
					name: s(o, c),
					filled: l > 0,
					detail: `${l} filled, ${c - o + 1 - l} empty`
				};
			});
		}
	}
	if (r.length + c.length > 12) return jt(e);
	for (let e of c) {
		if (!e.filled) continue;
		let [t, r = t] = e.name.split("–").map(Number), i = [...n].filter(([e]) => e >= t && e <= r).flatMap(([, e]) => e);
		i.length > 0 && (e.acreage = i);
	}
	return [...c, ...r];
}
function jt(e) {
	return Tt.flatMap((t) => {
		let n = e.filter((e) => e.kind === t);
		if (n.length === 0) return [];
		if (n.length === 1) return [{
			...n[0],
			filled: !0
		}];
		let r = n.flatMap((e) => e.acreage ?? []);
		return [{
			kind: t,
			name: `${n.length} ${Et[t].toLowerCase()}s`,
			filled: !0,
			detail: n.map((e) => e.name).join(", "),
			...r.length > 0 ? { acreage: r } : {}
		}];
	});
}
function Mt(e) {
	return String(e || "").toLowerCase().split(/\s+/).map((e) => e && e[0].toUpperCase() + e.slice(1)).join(" ");
}
function Nt(e) {
	return Mt(String(e || "").replace(/\s+/g, " ").replace(/[.;:]$/g, "").trim());
}
function Pt(e) {
	let t = String(e || "").trim();
	return t ? xt[t.toUpperCase()] || Dt.find((e) => e.toLowerCase() === t.toLowerCase()) : void 0;
}
function Ft(e) {
	return String(e || "").replace(/\s+/g, " ").trim().toLowerCase();
}
var It = new Intl.Collator(void 0, {
	numeric: !0,
	sensitivity: "base"
});
function Lt(e, t) {
	let n = (e) => (e.name || e.tract || e.building || "").replace(/^\s*(?:block|tract|building)\b\s*(?:no\.?\s*)?/i, "").trim(), r = n(e), i = n(t);
	return r ? i ? It.compare(r, i) : -1 : +!!i;
}
function Rt(e) {
	let t = [], n = (e) => {
		if (e) {
			if (Array.isArray(e)) {
				e.forEach(n);
				return;
			}
			if (ht(e)) {
				String(e.type || e.Type || e.groupType || e.GroupType || "").toLowerCase() === "lot_block" && _t(e).length > 0 && t.push(e);
				for (let t of Object.keys(e)) n(e[t]);
			}
		}
	};
	return n(e), t;
}
function zt(e, t) {
	if (e.length <= t) return e.map((e) => ({
		group: e,
		sources: [e]
	}));
	let n = e.map((e) => [e]), r = e.map((e) => {
		let t = /* @__PURE__ */ new Map();
		for (let n of _t(e)) {
			let e = Ft(n.aspect), r = e === "acreage" ? n.value : n.value?.trim();
			if (!e || !r?.trim()) continue;
			let i = t.get(e) || [];
			(e === "acreage" || !i.some((e) => Ft(e) === Ft(r))) && i.push(r), t.set(e, i);
		}
		return t;
	});
	for (; r.length > t;) {
		let e = 0, t = 1, i = -1;
		for (let n = 0; n < r.length - 1; n += 1) for (let a = n + 1; a < r.length; a += 1) {
			let o = 0;
			for (let [e, t] of r[n]) for (let n of new Set(t.map(Ft))) r[a].get(e)?.some((e) => Ft(e) === n) && (o += 1);
			o > i && (e = n, t = a, i = o);
		}
		for (let [n, i] of r[t]) {
			let t = r[e].get(n) || [];
			for (let e of i) (n === "acreage" || !t.some((t) => Ft(t) === Ft(e))) && t.push(e);
			r[e].set(n, t);
		}
		n[e].push(...n[t]), n.splice(t, 1), r.splice(t, 1);
	}
	return r.map((e, t) => ({
		sources: n[t],
		group: {
			type: "lot_block",
			elements: [...e].flatMap(([e, t]) => (e === "right_of_way" || e === "acreage" ? t : [t.join(wt.some((t) => t === e) ? "/" : ",")]).map((t) => ({
				aspect: e,
				value: t
			})))
		}
	}));
}
function Bt(e) {
	let t = yt(e), n = Rt(t.length ? t : e), r = ht(e) && typeof e.parcels_num == "number" && e.parcels_num > 0 ? e.parcels_num : n.length, i = /* @__PURE__ */ new Map();
	for (let { group: e } of zt(n, r)) {
		let t = _t(e), n = vt(t, "state").trim(), r = vt(t, "county").trim(), a = vt(t, "city").trim(), o = vt(t, "subdivision").trim(), s = vt(t, "condominium").trim(), c = vt(t, "unit").trim(), l = vt(t, "phase").trim(), u = vt(t, "section").trim(), d = vt(t, "block").trim(), f = vt(t, "tract").trim(), p = vt(t, "building").trim(), m = Tt.flatMap((e) => {
			let n = vt(t, e).trim();
			return n ? [{
				kind: e,
				name: n
			}] : [];
		}), h = t.filter((e) => e.aspect?.toLowerCase() === "right_of_way").map((e) => e.value?.trim()).filter((e) => !!e);
		if (![
			o,
			s,
			c,
			l,
			u,
			d,
			f,
			p,
			...m,
			...h
		].some(Boolean)) continue;
		let g = JSON.stringify([
			n,
			r,
			a,
			o,
			s
		].map(Ft)), _ = i.get(g);
		_ || (_ = {
			state: n,
			county: r,
			subdivision: o,
			...s ? { condominium: s } : {},
			...a ? { city: a } : {},
			rightsOfWay: [],
			divisions: /* @__PURE__ */ new Map()
		}, i.set(g, _));
		for (let e of h) _.rightsOfWay.some((t) => Ft(t) === Ft(e)) || _.rightsOfWay.push(e);
		let v = JSON.stringify([
			c,
			l,
			u
		].map(Ft)), y = _.divisions.get(v);
		if (y || (y = {
			unit: c,
			phase: l,
			section: u,
			blocks: /* @__PURE__ */ new Map()
		}, _.divisions.set(v, y)), !d && !f && !p && m.length === 0) continue;
		let ee = JSON.stringify([
			d,
			f,
			p
		].map(Ft)), te = y.blocks.get(ee);
		te || (te = {
			name: d,
			...f ? { tract: f } : {},
			...p ? { building: p } : {},
			lots: []
		}, y.blocks.set(ee, te));
		for (let e of m) {
			let n = te.lots.find((t) => t.kind === e.kind && Ft(t.name) === Ft(e.name));
			n || (n = e, te.lots.push(n));
			let r = e.kind === "lot" ? t.filter((e) => e.aspect?.toLowerCase() === "acreage" && e.value?.trim()).map((e) => e.value) : [];
			r.length > 0 && (n.acreage ??= []).push(...r);
		}
	}
	return Array.from(i.values(), ({ divisions: e, ...t }) => ({
		...t,
		divisions: Array.from(e.values(), ({ blocks: e, ...t }) => ({
			...t,
			blocks: Array.from(e.values()).sort(Lt)
		}))
	}));
}
function Vt(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) {
		for (let e of St) gt(n[e]) || t.add(e);
		n.rightsOfWay.length > 0 && t.add("right_of_way");
		for (let e of n.divisions) {
			for (let n of Ct) gt(e[n]) || t.add(n);
			for (let n of e.blocks) {
				gt(n.name) || t.add("block"), n.tract && t.add("tract"), n.building && t.add("building");
				for (let e of n.lots) gt(e.name) || t.add(e.kind);
			}
		}
	}
	return t;
}
function Ht(e) {
	return Vt(e).size === 0;
}
function Ut(e) {
	let t = [];
	return e.state && t.push(Pt(e.state) || ""), e.county && t.push(`${Nt(e.county)} County`), e.city && t.push(Nt(e.city)), t.filter(Boolean).join(" | ");
}
function Wt(e) {
	let t = e.find((e) => !gt(e.subdivision));
	return t ? Nt(t.subdivision) : void 0;
}
function Gt(e) {
	let t = {};
	if (ht(e)) {
		let n = ht(e.plat) ? e.plat : ht(e.location) ? e.location : null;
		n && (typeof n.city == "string" && n.city.trim() && (t.city = Nt(n.city)), typeof n.county == "string" && n.county.trim() && (t.county = Nt(n.county.replace(/\bCounty\b/i, "").trim())), typeof n.state == "string" && n.state.trim() && (t.state = Pt(n.state)));
	}
	let n = [...yt(e), ...e ? [e] : []];
	for (let e of n) {
		for (let n of _t(e)) {
			let e = String(n.aspect || "").toLowerCase(), r = typeof n.value == "string" ? n.value.trim() : "";
			r && (!t.city && (e === "city" || e === "municipality" || e === "locality") && (t.city = Nt(r)), !t.county && (e === "county" || e === "parish" || e === "borough") && (t.county = Nt(r.replace(/\bCounty\b/i, "").trim())), !t.state && (e === "state" || e === "province") && (t.state = Pt(r)));
		}
		if (t.city && t.county && t.state) break;
	}
	if (t.city && t.county && t.state) return t;
	let r = [], i = (e) => {
		typeof e == "string" && e.trim() && r.push(e);
	};
	if (ht(e) && (i(e.text), i(e.header), i(e.location_text)), Array.isArray(e)) for (let t of e) ht(t) && (i(t.text), i(t.header));
	let a = r.join(" | ");
	if (!a) return t;
	if (!t.county) {
		let e = a.match(/\b([A-Z][A-Za-z' .-]+)\s+County\b/i);
		e && (t.county = Nt(e[1]));
	}
	if (t.state ||= Pt((a.match(/\bCounty,\s*([A-Z]{2}|[A-Z][a-zA-Z' .-]+)\b/) || a.match(Ot) || a.match(/\b([A-Z]{2})\b/))?.[1] || ""), !t.city) {
		let e = a.match(/\bCity of\s+([A-Z][A-Za-z' .-]+)\b/i);
		e && (t.city = Nt(e[1]));
	}
	return t;
}
function Kt(e, t) {
	if (!t) return !1;
	let n = Ft(t), r = !1;
	for (let t of e) if (!gt(t.subdivision) && (r = !0, Ft(t.subdivision) !== n)) return !1;
	return r;
}
function qt(e) {
	let t = Bt(e), n = Gt(e), r = Wt(t), i = Vt(t);
	return {
		references: yt(e).filter((e) => ht(e) && e.type === "plat_reference").flatMap(_t),
		subdivisions: t,
		location: n,
		platName: r,
		presentLayers: i,
		matchPlatSubdivision: Kt(t, r),
		isEmptyStructure: Ht(t),
		locationLabel: Ut(n)
	};
}
function Jt(e) {
	let t = _t(e).filter((e) => e.value?.trim()), n = Bt([e]), r = Vt(n);
	n.some((e) => e.divisions.some((e) => e.blocks.some((e) => At(e.lots).some((e) => e.acreage)))) && r.add("acreage");
	let i = t.filter((e) => e.aspect?.trim() && !r.has(e.aspect.toLowerCase()) && ![
		"state",
		"county",
		"city"
	].includes(e.aspect.toLowerCase())), a;
	return t.some((e) => !e.aspect?.trim()) ? a = "Cannot map: extracted values without aspect labels cannot be drawn." : r.size === 0 && (a = i.length === 0 ? "Cannot map: only location fields were provided; no drawable identifiers are available." : "No drawable property identifiers could be resolved."), {
		notes: bt(t),
		aspects: i,
		issue: a
	};
}
//#endregion
//#region src/features/legalmap/data/metesData.ts
var Yt = {
	NORTH: "N",
	SOUTH: "S",
	EAST: "E",
	WEST: "W",
	NORTHEAST: "NE",
	NORTHWEST: "NW",
	SOUTHEAST: "SE",
	SOUTHWEST: "SW",
	NORTHERLY: "N",
	SOUTHERLY: "S",
	EASTERLY: "E",
	WESTERLY: "W",
	FEET: "ft",
	FOOT: "ft",
	FT: "ft",
	METERS: "m",
	METER: "m",
	METRES: "m",
	METRE: "m",
	INCHES: "in",
	INCH: "in",
	YARDS: "yd",
	YARD: "yd",
	CHAINS: "ch",
	CHAIN: "ch",
	RODS: "rd",
	ROD: "rd",
	LINKS: "lk",
	LINK: "lk",
	MILES: "mi",
	MILE: "mi"
}, Xt = RegExp("\\b(?:" + Object.keys(Yt).join("|") + ")\\b", "gi");
function Zt(e, t, n) {
	let r = (n ? e.replace(/\d+\.\d+/g, (e) => String(+Number(e).toFixed(2))) : e).replace(Xt, (e) => Yt[e.toUpperCase()]).replace(/\b(?:DEGREES?|DEG)\b\.?/gi, "°").replace(/\b(?:MINUTES?|MIN)\b\.?/gi, "′").replace(/\b(?:SECONDS?|SEC)\b\.?/gi, "″");
	return t ? r.replace(/''|[″”"]/g, "″").replace(/[′’']/g, "′").replace(/[º˚]/g, "°").replace(/(\d)\s*O(?=\s*\d)/gi, "$1°").replace(/\s*([°′″])/g, "$1").replace(/([°′″])\s+(?=\d)/g, "$1") : r.replace(/(\d)\s*'/g, "$1 ft").replace(/(\d)\s*"/g, "$1 in");
}
function Qt(e) {
	let t = Zt(e, !0).trim().toUpperCase().replace(/,/g, " ").replace(/′/g, "'").replace(/″/g, "\""), n = {
		N: 0,
		NE: 45,
		E: 90,
		SE: 135,
		S: 180,
		SW: 225,
		W: 270,
		NW: 315
	};
	if (Object.hasOwn(n, t)) return n[t];
	let r = t.match(/^([NS])\s*(\d+(?:\.\d+)?)(?:\s+(\d+)\s*\/\s*(\d+))?\s*°?\s*(?:(\d+(?:\.\d+)?)\s*')?\s*(?:(\d+(?:\.\d+)?)\s*")?\s*([EW])$/);
	if (!r) return null;
	let i = Number(r[3] ?? 0), a = Number(r[4] ?? 1), o = Number(r[5] ?? 0), s = Number(r[6] ?? 0);
	if (a === 0 || i >= a || o >= 60 || s >= 60) return null;
	let c = Number(r[2]) + i / a + o / 60 + s / 3600;
	return c > 90 ? null : r[1] === "N" ? r[7] === "E" ? c : (360 - c) % 360 : r[7] === "E" ? 180 - c : 180 + c;
}
var $t = {
	feet: .3048,
	foot: .3048,
	ft: .3048,
	"'": .3048,
	meters: 1,
	meter: 1,
	metres: 1,
	metre: 1,
	m: 1,
	inches: .0254,
	inch: .0254,
	in: .0254,
	"\"": .0254,
	yards: .9144,
	yard: .9144,
	yd: .9144,
	chains: 20.1168,
	chain: 20.1168,
	ch: 20.1168,
	rods: 5.0292,
	rod: 5.0292,
	rd: 5.0292,
	links: .201168,
	link: .201168,
	lk: .201168,
	miles: 1609.344,
	mile: 1609.344,
	mi: 1609.344
}, en = /* @__PURE__ */ RegExp("(?<![-\\w.,])-?(?:\\d+(?:,\\d{3})*(?:\\.\\d+)?|\\.\\d+)\\s*(?:FEET|FOOT|FT\\.?|METERS?|METRES?|M|INCH(?:ES)?|IN|YARDS?|YD|CHAINS?|CH|RODS?|RD|LINKS?|LK|MILES?|MI|['\"])(?![A-Z])(?:\\s*-?(?:\\d+(?:,\\d{3})*(?:\\.\\d+)?|\\.\\d+)\\s*(?:FEET|FOOT|FT\\.?|METERS?|METRES?|M|INCH(?:ES)?|IN|YARDS?|YD|CHAINS?|CH|RODS?|RD|LINKS?|LK|MILES?|MI|['\"])(?![A-Z]))*", "i"), tn = /* @__PURE__ */ RegExp("^(?:\\d+(?:,\\d{3})*(?:\\.\\d+)?|\\.\\d+)\\s*(?:(?:FEET|FOOT|FT\\.?|')\\s*(?:\\d+(?:,\\d{3})*(?:\\.\\d+)?|\\.\\d+)\\s*(?:INCH(?:ES)?|IN|\")(?![A-Z])|(?:FEET|FOOT|FT\\.?|METERS?|METRES?|M|INCH(?:ES)?|IN|YARDS?|YD|CHAINS?|CH|RODS?|RD|LINKS?|LK|MILES?|MI|['\"])(?![A-Z]))$", "i"), nn = /* @__PURE__ */ RegExp("(?<![\\w'’])(?:NORTH|SOUTH|N|S)\\.?\\s*\\d+(?:\\.\\d+)?(?:\\s+\\d+\\s*\\/\\s*\\d+)?\\s*(?:DEGREES?|DEG\\.?|[°º˚]|O(?=\\s*\\d))?(?:\\s*\\d+(?:\\.\\d+)?\\s*(?:MINUTES?|MIN\\.?|['′’:]))?(?:\\s*\\d+(?:\\.\\d+)?\\s*(?:SECONDS?|SEC\\.?|[\"″”]|''))?\\s*,?\\s*(?:EAST|WEST|E|W)\\b|(?<![\\w'’])(?:NORTH|SOUTH|EAST|WEST|[NSEW])(?=\\s+-?(?:\\d+(?:,\\d{3})*(?:\\.\\d+)?|\\.\\d+)(?![\\d.]|\\s*/)(?!\\s*(?:DEGREES?|DEG\\.?|[°º˚])))", "gi"), rn = /^\s*(?:NORTH|SOUTH|[NS])\s*\d/i;
function an(e) {
	if (!tn.test(e.trim())) return null;
	let t = [...e.matchAll(/* @__PURE__ */ RegExp("((?:\\d+(?:,\\d{3})*(?:\\.\\d+)?|\\.\\d+))\\s*((?:FEET|FOOT|FT\\.?|METERS?|METRES?|M|INCH(?:ES)?|IN|YARDS?|YD|CHAINS?|CH|RODS?|RD|LINKS?|LK|MILES?|MI|['\"])(?![A-Z]))", "gi"))].reduce((e, t) => e + Number(t[1].replaceAll(",", "")) * $t[t[2].toLowerCase().replace(/\.$/, "")], 0);
	return Number.isFinite(t) ? t : null;
}
function on(e, t) {
	return e !== null && t !== null && Math.abs(e - t) <= 2 ** -52 * Math.max(1, Math.abs(e), Math.abs(t)) * 4;
}
function sn(e, t) {
	let n = [];
	for (let r of e) if (r.trim().startsWith("[")) {
		let e;
		try {
			e = JSON.parse(r);
		} catch {
			n.push(r);
			continue;
		}
		if (!Array.isArray(e) || e.some((e) => typeof e != "string" && !(t && typeof e == "number"))) {
			n.push(r);
			continue;
		}
		n.push(...e.map(String));
	} else {
		let e = [...r.matchAll(nn), ...r.matchAll(new RegExp(en.source, "gi"))], t = 0;
		for (let i of r.matchAll(/,(?!\s*\d+(?:\.\d+)?\s*(?:MIN(?:UTES)?|SEC(?:ONDS)?|[\x27\x22′″]))|[;\n|]|\band\b/gi)) e.some((e) => i.index > e.index && i.index < e.index + e[0].length) || (n.push(r.slice(t, i.index).trim()), t = i.index + i[0].length);
		n.push(r.slice(t).trim());
	}
	return n;
}
function cn(e, t = nn) {
	let n = [...e.matchAll(/\([^)]*\)/g)], r = [...[...e.matchAll(t)].map((t) => {
		if (/^(?:NORTH|SOUTH|N|S)$/i.test(t[0]) && /^\s*\d+(?:\.\d+)?\s*["°º˚'′″]/.test(e.slice(t.index + t[0].length))) {
			let n = /^(?:NORTH|SOUTH|N|S)\s*\d[^;\n]*?\b(?:EAST|WEST|E|W)\b/i.exec(e.slice(t.index));
			n && (n.index = t.index, t = n);
		}
		return {
			kind: "bearing",
			match: t
		};
	}), ...[...e.matchAll(/\b(?:THENCE\s+)?(?:CONTINUING\s+ALONG|ALONG)\s+(?:SAID|A)\s+CURVE\b/gi)].map((e) => ({
		kind: "curve",
		match: e
	}))];
	for (let t of e.matchAll(/(?:\bTHENCE\s+|(?:^|[;\n])\s*(?:SUBSTANTIALLY\s+)?)(?:DUE\s+)?(NORTH|SOUTH|EAST|WEST)\b/gi)) {
		let n = t.index + t[0].lastIndexOf(t[1]);
		if (r.some((e) => e.match.index <= n && e.match.index + e.match[0].length > n)) continue;
		let i = e.slice(n).split(/[;\n]/)[0].match(/^(?:NORTH|SOUTH)\s*\d.*?\b(?:EAST|WEST|[EW])\b/i), a = /^[\s\S]+/.exec(i?.[0] ?? t[1]);
		a.index = n, r.push({
			kind: "bearing",
			match: a
		});
	}
	let i = r.filter((e) => !n.some((t) => e.match.index > t.index && e.match.index < t.index + t[0].length)).sort((e, t) => e.match.index - t.match.index), a = i.flatMap((t, n) => {
		let r = e.slice(n === 0 ? 0 : i[n - 1].match.index + i[n - 1].match[0].length, t.match.index).split(/[;\n]|\bTHENCE\b/i).at(-1);
		if (/\b(?:BEARS|BEARING|SAID\s+LINE\s+BEING)\s*(?:DUE\s*)?$/i.test(r) || /\bFROM\s+WHICH\b.*\bBEARS\b/i.test(r)) return [];
		let a = i[n + 1]?.match.index ?? e.length, o = e.slice(t.match.index + t.match[0].length, a), s = o.split(/[;\n]|\bTHENCE\b/i)[0].match(en)?.[0];
		return [{
			start: t.match.index,
			kind: t.kind,
			bearing: t.match[0],
			distance: s,
			clause: o,
			detail: e.slice(t.match.index, a)
		}];
	}), o = e.slice(0, i[0]?.match.index ?? e.length).match(/* @__PURE__ */ RegExp("((?:\\d+(?:,\\d{3})*(?:\\.\\d+)?|\\.\\d+)\\s*(?:FEET|FOOT|FT\\.?|METERS?|METRES?|M|INCH(?:ES)?|IN|YARDS?|YD|CHAINS?|CH|RODS?|RD|LINKS?|LK|MILES?|MI|['\"])(?![A-Z]))\\s+(EASTERLY|WESTERLY|NORTHERLY|SOUTHERLY)\\s+FROM\\b", "i"));
	return o ? [{
		start: o.index,
		kind: "bearing",
		bearing: o[2],
		distance: o[1],
		clause: "",
		detail: o[0],
		issue: "Commencement offset; not a boundary course."
	}, ...a] : a;
}
function ln(e) {
	let t = [...new Set(sn([e.source ?? "", ..._t(e).filter((e) => e.aspect === "bearings" || e.aspect === "distances").map((e) => e.value ?? "")], !1).map((e) => e.replace(/\s+/g, " ").trim().replace(/\.$/, "")))], n = t.map((e) => e.match(/^(NORTH|SOUTH|EAST|WEST)(?:WARD|ERLY)\s+AT\s+RIGHT\s+ANGLES\s+TO\s+(.+)$/i)).filter((e) => e !== null), r = n[0];
	if (!r) return null;
	let i = Qt(r[1]);
	if (n.some((e) => Qt(e[1]) !== i || e[2].toUpperCase() !== r[2].toUpperCase())) return null;
	let a = t.map((e) => e.match(/^(NORTH|SOUTH|EAST|WEST|[NSEW])(?:ERLY)?\s+SIDE\s+OF\s+(.+)$/i)).filter((e) => e !== null && e[2].toUpperCase() === r[2].toUpperCase());
	if (!a.length || a.some((e) => Qt(e[1]) !== i)) return null;
	let o = {
		frontage: /* @__PURE__ */ new Map(),
		depth: /* @__PURE__ */ new Map()
	}, s = RegExp("^(" + en.source + ")\\s+(FRONTAGE|FRONT|DEPTH|DEEP)$", "i");
	for (let e of t.filter((e) => /\b(?:FRONTAGE|FRONT|DEPTH|DEEP)$/i.test(e))) {
		let t = e.match(s);
		if (!t) return null;
		let n = an(t[1]);
		if (n === null || n <= 0) return null;
		o[/^FRONT/i.test(t[2]) ? "frontage" : "depth"].set(n, t[1]);
	}
	if (o.frontage.size !== 1 || o.depth.size !== 1) return null;
	let c = [...o.frontage.values(), ...o.depth.values()];
	return [
		0,
		1,
		2,
		3
	].map((e) => ({
		kind: "bearing",
		bearing: [
			"N",
			"E",
			"S",
			"W"
		][(i / 90 + e + 3) % 4],
		distance: c[e % 2],
		clause: "",
		detail: `${c[0]} frontage · ${c[1]} depth · ${r[0]}`
	}));
}
function un(e) {
	return Qt(e.replace(/\b(?:SUBSTANTIALLY|DUE)\b/gi, "").replace(/\s+/g, " ").trim());
}
function dn(e) {
	let t = e.match(/\b(?:NORTH|SOUTH|[NS])\s*\d[^;]*?\b(?:EAST|WEST|[EW])\b/i), n = [...e.matchAll(new RegExp(en.source, "gi"))].find((e) => !t || e.index < t.index || e.index >= t.index + t[0].length), r = (n ? (e.slice(0, n.index).trim() + " " + e.slice(n.index + n[0].length).trim()).trim() : e.trim()).replace(/^APPROXIMATELY\s*$/i, "").trim(), i = un(r), a = n?.[0] ?? (i === null && /^\s*-?(?:\d|\.\d)/.test(e) ? e.trim() : void 0), o = a === void 0 ? null : an(a);
	return {
		kind: "bearing",
		bearing: a === e.trim() ? "" : r,
		distance: a,
		clause: "",
		detail: e,
		angle: i,
		metres: o,
		paired: i !== null && a !== void 0,
		missingBearing: r === "" && o !== null,
		missingDistance: a === void 0 && i !== null
	};
}
function fn(e, t, n = "") {
	let r = [e, t].map((e, t) => sn(e, t === 1).map(dn)).map((e) => {
		let t = new Set(e.flatMap((e) => e.metres !== null && e.distance ? [e.distance.match(/* @__PURE__ */ RegExp("(?:FEET|FOOT|FT\\.?|METERS?|METRES?|M|INCH(?:ES)?|IN|YARDS?|YD|CHAINS?|CH|RODS?|RD|LINKS?|LK|MILES?|MI|['\"])(?![A-Z])$", "i"))?.[0].toUpperCase().replace(/\.$/, "")] : []).filter(Boolean)), n = t.size === 1 ? [...t][0] : void 0, r = n ? e.map((e) => e.distance && (/* @__PURE__ */ RegExp("^(?:\\d+(?:,\\d{3})*(?:\\.\\d+)?|\\.\\d+)$", "i")).test(e.distance) ? {
			...e,
			distance: `${e.distance} ${n}`,
			metres: an(`${e.distance} ${n}`)
		} : e) : e;
		return r.some((e) => e.angle !== null || e.distance !== void 0 || rn.test(e.bearing)) ? r : [];
	});
	if (r.every((e) => e.every((e) => e.angle === null && !rn.test(e.bearing)))) return [];
	let i = [], a = r.findIndex((e) => e.length > 0 && e.every((e) => e.angle !== null && e.distance === void 0)), o = /* @__PURE__ */ new Set(), s = cn(n, RegExp(nn.source + "|(?<![\\w'’])(?:NORTH|SOUTH|EAST|WEST)(?![\\w'’])", "gi"));
	for (let [e, t] of r.entries()) for (let [n, c] of t.entries()) {
		if (o.has(c)) continue;
		let t = r[1 - e], l;
		if (c.angle !== null && c.distance === void 0) {
			let e = s.filter((e) => un(e.bearing) === c.angle && e.distance !== void 0).flatMap((e) => t.filter((t) => !o.has(t) && on(t.metres, an(e.distance)) && (t.bearing === "" || t.angle === c.angle)));
			new Set(e).size === 1 && (l = e[0]);
		}
		let u = t[n];
		!l && u && !o.has(u) && (c.bearing === "" || u.bearing === "" || c.angle !== null && c.angle === u.angle) && (c.distance === void 0 || u.distance === void 0 || on(c.metres, u.metres)) && (l = u), !l && c.distance === void 0 && c.angle !== null && (l = t.find((e) => !o.has(e) && e.bearing === "" && e.distance !== void 0)), !l && c.bearing === "" && c.distance !== void 0 && (l = t.find((e) => !o.has(e) && e.angle !== null && e.distance === void 0)), o.add(c);
		let d = a < 0 ? e === 0 ? n : r[0].length + n : e === a && l ? t.indexOf(l) : n;
		if (l) {
			o.add(l);
			let e = c.bearing === "" ? l : c, t = c.distance === void 0 ? l : c, n = s.find((n) => un(n.bearing) === e.angle && n.distance !== void 0 && on(an(n.distance), t.metres));
			i.push({
				order: d,
				course: {
					...e,
					distance: t.distance,
					metres: t.metres,
					paired: e.paired || t.paired || n !== void 0,
					missingBearing: e.bearing === "",
					missingDistance: t.distance === void 0,
					detail: `${c.detail} · ${l.detail}`,
					clause: n?.clause ?? ""
				}
			});
		} else i.push({
			order: d,
			course: { ...c }
		});
	}
	return i.sort((e, t) => e.order - t.order).map((e) => e.course);
}
function pn(e) {
	return e.kind === "bearing" && e.angle !== null && e.metres !== null && e.metres > 0;
}
function mn(e) {
	let t = [], n = [];
	for (let { start: r, ...i } of cn(e)) {
		let e = {
			...i,
			angle: i.kind === "bearing" ? Qt(i.bearing) : null,
			metres: i.distance === void 0 ? null : an(i.distance),
			paired: !0,
			missingBearing: !1,
			missingDistance: !1
		};
		pn(e) && (t.push(e), n.push(r));
	}
	let r = +(t[0]?.issue === "Commencement offset; not a boundary course."), i = /\bTHENCE\s+FROM\s+(?:SAID|THIS|THE)\s*["“]?(?:TRUE\s+)?(?:(?:PLACE|POINT)\s+OF\s+)?BEGINNING\b/i.exec(e)?.index, a = [...e.matchAll(/\b(?:TRUE\s+)?(?:PLACE|POINT)\s+OF\s+BEGINNING\b/gi)].map((e) => e.index);
	for (let e of [...i === void 0 ? [] : [i], ...a].sort((e, t) => e - t)) {
		let i = n.filter((t) => t < e).length;
		if (!(i === 0 || i === t.length)) {
			if (yn(t.slice(r, i), 1 / 5e3).closed) {
				t.splice(i);
				break;
			}
			r = i;
		}
	}
	return {
		courses: t,
		beginning: r
	};
}
function hn(e) {
	let t = fn(e.bearings, e.distances);
	return {
		bearings: t.filter((e) => e.angle !== null).length,
		distances: t.filter((e) => e.metres !== null).length
	};
}
function gn(e) {
	let t = [{
		x: 0,
		y: 0
	}];
	for (let n of e) {
		let e = n.angle * Math.PI / 180, r = t[t.length - 1];
		t.push({
			x: r.x + n.metres * Math.sin(e),
			y: r.y - n.metres * Math.cos(e)
		});
	}
	return t;
}
function _n(e, t, n) {
	return (t.x - e.x) * (n.y - e.y) - (t.y - e.y) * (n.x - e.x);
}
function vn(e, t, n, r, i) {
	let a = _n(e, t, n), o = _n(e, t, r), s = _n(n, r, e), c = _n(n, r, t), l = (e, t, n) => Math.abs(_n(e, t, n)) <= i && n.x >= Math.min(e.x, t.x) - 1e-8 && n.x <= Math.max(e.x, t.x) + 1e-8 && n.y >= Math.min(e.y, t.y) - 1e-8 && n.y <= Math.max(e.y, t.y) + 1e-8;
	return (a > i && o < -i || a < -i && o > i) && (s > i && c < -i || s < -i && c > i) || l(e, t, n) || l(e, t, r) || l(n, r, e) || l(n, r, t);
}
function yn(e, t, n) {
	let r = gn(e), i = r[r.length - 1], a = Math.hypot(i.x, i.y), o = e.reduce((e, t) => e + t.metres, 0), s = Math.abs(r.slice(0, -1).reduce((e, t, n) => e + t.x * r[n + 1].y - r[n + 1].x * t.y, 0) / 2), c = s / 4046.8564224, l = Math.max(1e-12, o * o * 1e-12), u = s <= l, d = r.length - 1, f = !1;
	for (let e = 0; e < d; e++) for (let t = e + 2; t < d; t++) e === 0 && t === d - 1 || vn(r[e], r[e + 1], r[t], r[t + 1], l) && (f = !0);
	let p = Math.max(.006096, o * Math.min(Math.max(t, 0), 1 / 2e3));
	return {
		residual: a,
		perimeter: o,
		areaAcres: c,
		acreageDeviation: n && n > 0 ? Math.abs(c / n - 1) : 0,
		valid: e.length >= 3 && !u && !f,
		closed: e.length >= 3 && !u && !f && a <= p
	};
}
function bn(e) {
	let t = [...(e ?? "").matchAll(/(?<![\d.,-])((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\s*(?:ACRES?|AC\b)/gi)].map((e) => Number(e[1].replaceAll(",", ""))).filter((e) => e > 0 && Number.isFinite(e));
	return new Set(t).size === 1 ? t[0] : void 0;
}
function xn(e, t, n, r, i) {
	let a = [], o = Math.min(12, Math.max(0, e.length - 3));
	for (let s = 0; s <= o; s++) {
		if (r !== void 0 && s !== r) continue;
		let o = e.slice(), c = (e, r, i = []) => {
			let o = yn(e.slice(s), t, n);
			if (!o.closed) return;
			let c = o.acreageDeviation > .2 ? 50 * o.acreageDeviation : o.acreageDeviation, l = r * 4 + i.length * 6 + s * .2 + c + o.residual / Math.max(.001, o.perimeter);
			a.push({
				courses: e,
				beginning: s,
				edits: r,
				omitted: i,
				calculatedAcres: o.areaAcres,
				residual: o.residual,
				score: l
			});
		};
		if (c(o, 0), !(!i || r !== void 0)) {
			if (o.length <= 16 && o.length - s >= 5) for (let e = s; e < o.length; e++) {
				let t = o.filter((t, n) => n !== e);
				if (t.length - s >= 3 && c(t, 0, [e]), !(o.length - s < 6)) for (let t = e + 1; t < o.length; t++) {
					let n = o.filter((n, r) => r !== e && r !== t);
					n.length - s >= 3 && c(n, 0, [e, t]);
				}
			}
			if (!a.some((e) => e.beginning === s && e.edits === 0) && !(o.length > 16)) for (let e = s; e < o.length; e++) for (let t = e + 1; t < o.length; t++) {
				if (o[e].metres === o[t].metres) continue;
				let n = o.map((e) => ({ ...e })), r = n[e].distance, i = n[e].metres;
				n[e].distance = n[t].distance, n[e].metres = n[t].metres, n[t].distance = r, n[t].metres = i, n[e].issue = n[t].issue = "Distance association inferred geometrically; verify source.", c(n, 1);
			}
		}
	}
	a.sort((e, t) => e.score - t.score || e.beginning - t.beginning);
	let s = a[0];
	return !s || s.edits > 0 && a.some((e) => e !== s && e.edits === s.edits && Math.abs(e.score - s.score) < .01) ? null : s;
}
function Sn(e, t, n) {
	let r = Math.hypot(e, t);
	if (r < 1e-10 || !Number.isFinite(r)) return null;
	let i = t <= 0 ? "N" : "S", a = e >= 0 ? "E" : "W", o = `${i} ${(Math.atan2(Math.abs(e), Math.abs(t)) * 180 / Math.PI).toFixed(12)}° ${a}`, s = Qt(o);
	return s === null ? null : {
		kind: "bearing",
		bearing: o,
		distance: `${r.toFixed(12)} m`,
		angle: s,
		metres: r,
		detail: n,
		clause: "",
		paired: !1,
		missingBearing: !1,
		missingDistance: !1,
		synthetic: !0,
		issue: n
	};
}
function Cn(e, t, n, r) {
	let i = [], a = Math.min(12, Math.max(0, e.length - 2));
	for (let o = 0; o <= a; o++) {
		if (r !== void 0 && o !== r) continue;
		let a = e.slice(o);
		if (a.length < 2) continue;
		let s = gn(a), c = s[s.length - 1], l = Math.hypot(c.x, c.y), u = a.reduce((e, t) => e + t.metres, 0);
		if (!Number.isFinite(u) || u <= 0 || l >= u * .95) continue;
		let d = Sn(-c.x, -c.y, "UNCONFIRMED: Synthetic closing border; no source measurement supports this line.");
		if (!d) continue;
		let f = yn([...a, d], t, n);
		if (!f.closed) continue;
		let p = n && n > 0 ? f.acreageDeviation : 0;
		if (n && p > .35) continue;
		let m = p * 8 + l / u * 2 + o * .025 + 1 / a.length;
		i.push({
			courses: [...e, d],
			beginning: o,
			residual: l,
			areaAcres: f.areaAcres,
			deviation: p,
			score: m
		});
	}
	return i.sort((e, t) => e.score - t.score || e.beginning - t.beginning), i[0] ?? null;
}
function wn(e, t) {
	if (!Number.isFinite(e.metres) || e.metres <= 0 || !Number.isFinite(t) || t <= 0) return null;
	let n = gn([e])[1], r = t * 4046.8564224 / e.metres;
	if (!Number.isFinite(r) || r <= 0) return null;
	let i = n.x, a = n.y, o = a / e.metres * r, s = -i / e.metres * r, c = "UNCONFIRMED: Area-derived side; no bearing or distance in the source supports this line.", l = [
		Sn(o, s, c),
		Sn(-i, -a, c),
		Sn(-o, -s, c)
	];
	if (l.some((e) => e === null)) return null;
	let u = [e, ...l.filter((e) => e !== null)], d = yn(u, 1 / 5e3, t);
	return !d.valid || d.residual > 1e-6 ? null : {
		courses: u,
		beginning: 0,
		closed: !0,
		method: "source",
		completion: "partial",
		closureMetres: void 0,
		calculatedAcres: d.areaAcres,
		issue: "PARTIALLY UNCONFIRMED: Only one source-supported border; the other three are fabricated using stated acreage."
	};
}
function Tn(e, t, n) {
	if (!e || !Number.isFinite(e) || e <= 0) return null;
	let r = Math.sqrt(e * 4046.8564224);
	if (!Number.isFinite(r) || r <= 0) return null;
	let i = [
		[r, 0],
		[0, r],
		[-r, 0],
		[0, -r]
	].map(([e, t]) => Sn(e, t, "UNCONFIRMED: Area-derived schematic border; not a measured course.")).filter((e) => e !== null);
	if (!yn(i, 1 / 5e3, e).closed) return null;
	let a = hn(t);
	return {
		courses: i,
		beginning: 0,
		closed: !0,
		method: "synthetic",
		completion: "synthetic",
		closureMetres: void 0,
		calculatedAcres: e,
		issue: `Entire polygon is Unconfirmed - acreage-based illustration, NOT a source-verified boundary. ${n}${a.bearings || a.distances ? ` Extracted measurements: ${a.bearings} bearings, ${a.distances} distances; association unresolved.` : ""}`
	};
}
function En(e) {
	let t = e.closureRatio ?? 1 / 5e3, n = bn(e.acreage), r = e.source ?? "", i = mn(r), a = fn(e.bearings, e.distances, r).filter(pn), o = i.courses.length >= 3, s = o ? i.courses : a, c = o ? "source" : a.length ? "extracted" : "none", l = e.allowSchematic !== !1, u = o && i.beginning > 0 ? i.beginning : void 0;
	if (s.length) {
		let r = xn(s, t, n, u, !o);
		if (r) {
			let e;
			return o ? r.beginning > 0 && u === void 0 && (e = "Tie inferred from closure; source did not explicitly identify its position.") : e = "Boundary inferred from extracted measurements; source pairing and tie lines unverified.", r.edits && (e = "Bearing-distance associations inferred from geometry; verification required."), r.omitted.length && (e = (e ? e + " " : "") + `${r.omitted.length} extracted course(s) were excluded as unassigned; source review required.`), o && a.some((e) => !i.courses.some((t) => Math.abs(t.angle - e.angle) < 1e-7 && Math.abs(t.metres - e.metres) < .001)) && (e = "Extracted bearing-distance association contradicts the legal description; source measurements used."), (n && n > 0 ? Math.abs(r.calculatedAcres / n - 1) : 0) > .1 && (e = (e ? e + " " : "") + "Calculated acreage differs materially from stated acreage."), {
				courses: r.courses.map((e, t) => o ? t < r.beginning && u === void 0 ? {
					...e,
					issue: e.issue ?? "Unconfirmed tie: inferred from closure, not source-supported."
				} : e : {
					...e,
					issue: e.issue ?? (t < r.beginning ? "Unconfirmed tie: inferred from closure, not source-supported." : "Unconfirmed extracted association: source evidence not available.")
				}),
				beginning: r.beginning,
				closed: !0,
				issue: e,
				method: c,
				completion: "measured",
				closureMetres: r.residual,
				calculatedAcres: r.calculatedAcres
			};
		}
		let d = yn(s.slice(u ?? 0), t, n);
		if (l) {
			let r = Cn(s, t, n, u);
			if (r) {
				let e = r.courses.map((e, t) => o || e.synthetic ? e : {
					...e,
					issue: e.issue ?? (t < r.beginning ? "Unconfirmed: tie inferred from geometry." : "Unconfirmed: extracted pairing not source-verified.")
				}), t = `PARTIALLY UNCONFIRMED: Synthetic closing border inserted; measured misclosure ${r.residual.toFixed(4)} m. ` + (o ? "Source courses unchanged." : "Extracted bearing-distance associations require verification.");
				return {
					courses: e,
					beginning: r.beginning,
					closed: !0,
					method: c,
					completion: "partial",
					issue: t,
					closureMetres: r.residual,
					calculatedAcres: r.areaAcres
				};
			}
			let i = Tn(n, e, "Measured courses cannot form a credible simple polygon.");
			if (i) return i;
		}
		return {
			courses: s,
			beginning: u ?? 0,
			closed: !1,
			method: c,
			completion: "open",
			closureMetres: d.residual,
			calculatedAcres: d.areaAcres,
			issue: "Boundary remains open or geometrically invalid; source measurements preserved without forced closure."
		};
	}
	if (l) {
		if (i.courses.length === 1 && /\bTHENCE\b/i.test(r) && n && !/\b(?:TO|AT|AND)\s+(?:THE\s+)?TRUE\s+(?:PLACE|POINT)\s+OF\s+BEGINNING\b/i.test(r)) {
			let e = wn(i.courses[0], n);
			if (e) return e;
		}
		let t = Tn(n, e, "Source-supported course pairing is missing or incomplete.");
		if (t) return t;
	}
	return {
		courses: [],
		beginning: 0,
		closed: !1,
		method: c,
		completion: "open",
		issue: "Insufficient paired boundary measurements and acreage for a schematic."
	};
}
function Dn(e, t, n) {
	let { courses: r, ...i } = n, a = {
		...i,
		title: t,
		items: [],
		notes: bt(_t(e).filter((e) => e.value?.trim())),
		courses: []
	}, o = {
		x: 0,
		y: 0
	}, s, c, l, u = o;
	for (let [e, t] of r.entries()) {
		if (t.unassigned) {
			a.courses.push({
				bearing: t.bearing,
				distance: t.distance,
				confirmed: !1,
				issue: t.issue,
				unassigned: !0
			});
			continue;
		}
		let { clause: n, metres: r, angle: i } = t, d = l ? [t.issue, "Position depends on an earlier unconfirmed course: " + l].filter(Boolean).join(" ") : t.issue, f, p;
		if (t.kind === "curve") {
			if (c && s !== void 0 && r !== null) {
				d = "Curve-based position requires review.";
				let e = r / c.radius, t = {
					x: o.x + c.turn * c.radius * Math.cos(s),
					y: o.y + c.turn * c.radius * Math.sin(s)
				};
				s += c.turn * e, f = {
					x: t.x - c.turn * c.radius * Math.cos(s),
					y: t.y - c.turn * c.radius * Math.sin(s)
				}, p = {
					...c,
					center: t,
					sweep: e
				}, a.issue ??= "Unconfirmed boundary: curve-based positions require review.";
			} else d = "Curve geometry is incomplete.", a.issue ??= "Boundary needs review: a curve requires source geometry.";
			l = d;
		} else i === null || r === null ? (a.issue ??= i === null ? "Boundary needs review: a bearing is unreadable." : "Boundary needs review: a distance is missing or unreadable.", d = i === null ? "Bearing is unreadable." : "Distance is missing or unreadable.", r !== null && /\b(?:PLACE|POINT)\s+OF\s+BEGINNING\b/i.test(n) && (f = u), l = d) : (s = i * Math.PI / 180, f = {
			x: o.x + Math.sin(s) * r,
			y: o.y - Math.cos(s) * r
		});
		r === 0 && (d = "Distance is zero.");
		let m = t.kind === "curve" ? c ? "Curve " + (c.turn === 1 ? "right" : "left") : "Curve" : t.bearing, h = d === void 0;
		if (a.courses.push({
			bearing: m,
			distance: t.distance,
			confirmed: h,
			...t.synthetic ? { synthetic: t.synthetic } : {},
			...d ? { issue: d } : {},
			...f === u ? { target: a.beginning === void 0 ? 1 : a.beginning + 1 } : {}
		}), f && t.distance ? (a.items.push({
			kind: "line",
			label: "Course " + a.courses.length,
			detail: t.detail,
			sequence: a.courses.length,
			from: o,
			to: f,
			bearing: m,
			distance: t.distance,
			confirmed: h,
			...p ? { arc: p } : {}
		}), o = f) : a.schematic = !0, e + 1 === a.beginning && (u = o), t.kind === "bearing") {
			let e = n.match(/\bCURVE\s+TO\s+THE\s+(LEFT|RIGHT)\b/i), t = n.match(/* @__PURE__ */ RegExp("\\bRADIUS\\s+OF\\s+((?:\\d+(?:,\\d{3})*(?:\\.\\d+)?|\\.\\d+)\\s*(?:FEET|FOOT|FT\\.?|METERS?|METRES?|M|INCH(?:ES)?|IN|YARDS?|YD|CHAINS?|CH|RODS?|RD|LINKS?|LK|MILES?|MI|['\"])(?![A-Z]))", "i")), r = t ? an(t[1]) : null;
			c = e && r !== null && r > 0 ? {
				radius: r,
				turn: e[1].toUpperCase() === "RIGHT" ? 1 : -1
			} : void 0;
		}
	}
	return a.ending !== void 0 && (a.courses[a.ending - 1].target = (a.beginning ?? 0) + 1), a;
}
function On(e, t, n = {}) {
	let r = _t(e).filter((e) => e.value?.trim()), i = e.source ?? "", a = r.filter((e) => e.aspect === "bearings").map((e) => e.value), o = r.filter((e) => e.aspect === "distances").map((e) => e.value), s = cn(i).map((e) => ({
		...e,
		angle: e.kind === "bearing" ? Qt(e.bearing) : null,
		metres: e.distance === void 0 ? null : an(e.distance),
		paired: !0,
		missingBearing: !1,
		missingDistance: !1
	}));
	if (s.some((e) => e.kind === "curve")) {
		let r = s.findIndex((e, t) => {
			if (t === s.length - 1 || !/\b(?:TRUE\s+)?(?:PLACE|POINT)\s+OF\s+BEGINNING\b|\bTHENCE\s+FROM\s+(?:SAID|THIS|THE)\s*(?:(?:PLACE|POINT)\s+OF\s+)?BEGINNING\b/i.test(e.clause)) return !1;
			let r = s.slice(0, t + 1);
			if (!r.every(pn)) return !0;
			let i = yn(r, n.closureRatio ?? 1 / 5e3);
			return i.residual > Math.max(.006096, i.perimeter * Math.min(Math.max(n.closureRatio ?? 1 / 5e3, 0), 1 / 2e3));
		});
		return Dn(e, t, {
			courses: s,
			beginning: r < 0 ? void 0 : r + 1,
			closed: !1,
			method: "source",
			completion: "open",
			schematic: s.some((e) => e.issue !== void 0)
		});
	}
	let c = fn(a, o, i), l = s.length ? s : c;
	if (l.length === 0) {
		let n = ln(e);
		if (n) {
			let r = "Unconfirmed boundary: street-relative schematic requires review.";
			return Dn(e, t, {
				courses: n.map((e) => ({
					...e,
					angle: Qt(e.bearing),
					metres: an(e.distance),
					paired: !1,
					missingBearing: !1,
					missingDistance: !1,
					issue: r
				})),
				ending: n.length,
				closed: !1,
				method: "extracted",
				completion: "synthetic",
				schematic: !0,
				issue: r
			});
		}
	}
	let u = En({
		source: i,
		bearings: a,
		distances: o,
		acreage: r.filter((e) => e.aspect === "acreage").map((e) => e.value).join("; "),
		...n
	});
	if (!u.closed) {
		let n = (u.method === "source" ? s : u.method === "extracted" ? c : l).map((e) => ({
			...e,
			issue: e.issue ?? (s.length ? void 0 : "Unconfirmed extracted association: source evidence not available.")
		}));
		return Dn(e, t, {
			...u,
			courses: n,
			beginning: u.courses.length ? u.beginning : void 0,
			schematic: n.some((e) => e.issue !== void 0),
			issue: u.courses.length ? u.issue : l.length ? void 0 : "Sorry, this parcel’s boundary couldn’t be drawn from the available details."
		});
	}
	let d = [...u.method === "source" ? s : u.method === "synthetic" ? l : c], f = -1;
	for (let e of u.courses) {
		if (e.synthetic) continue;
		let t = d.findIndex((t) => t.detail === e.detail && t.bearing === e.bearing);
		t >= 0 && (f = Math.max(f, s.indexOf(d[t])), d.splice(t, 1));
	}
	let p = u.courses.length, m = [...u.courses, ...d.map((e) => u.method === "source" && pn(e) && s.indexOf(e) > f ? {
		...e,
		issue: "Course follows the closed parcel."
	} : {
		...e,
		unassigned: !0,
		issue: e.issue ?? (e.angle === null ? "Bearing is unreadable." : e.metres === null ? "Distance is missing or unreadable." : e.metres === 0 ? "Distance is zero." : "Unassigned source or extracted measurement; excluded from the illustrated outline.")
	})], h = m.slice(p).some((e) => !e.unassigned);
	return Dn(e, t, {
		...u,
		courses: m,
		ending: p,
		issue: h ? [u.issue, "Boundary needs review: additional courses follow the closed parcel."].filter(Boolean).join(" ") : u.issue,
		schematic: u.completion === "partial" || u.completion === "synthetic" || m.some((e) => e.issue !== void 0)
	});
}
//#endregion
//#region src/features/legalmap/data/plssData.ts
function kn(e) {
	return e.toUpperCase().replace(/NORTHEAST/g, "NE").replace(/NORTHWEST/g, "NW").replace(/SOUTHEAST/g, "SE").replace(/SOUTHWEST/g, "SW").replace(/NORTH/g, "N").replace(/SOUTH/g, "S").replace(/EAST/g, "E").replace(/WEST/g, "W").replace(/QUARTER/g, "1/4").replace(/HALF/g, "1/2");
}
function An(e, t, n, r) {
	let i = kn(t), a = i.trim() ? i.split(/\s*(?:,|\bAND\b|&)\s*/).filter((e) => e.trim()) : [""], o = [];
	for (let t of a) {
		let s = [...t.matchAll(/\b(NE|NW|SE|SW|N|S|E|W)\s*(?:1\s*\/\s*([24])|([¼½]))/g)];
		if (!s.length && !/\b(NE|NW|SE|SW|N|S|E|W)\s*\d+\s*\//.test(t) && a.some((e) => /\b(NE|NW|SE|SW|N|S|E|W)\s*(?:1\s*\/|[¼½])/.test(e))) continue;
		let c = /\b(EXCEPT|LESS|EXCLUDING|OR)\b/.test(t) || s.some((e) => e[1].length === 2 != ((e[2] ?? (e[3] === "¼" ? "4" : "2")) === "4")) || !s.length && /[NSWE]\s*\d+\s*\//.test(t), l = n || c || /\b(PARTS?|PORTIONS?|EXCEPT|LESS|EXCLUDING|OR)\b/.test(i), u = {
			x: e.x,
			y: e.y,
			width: e.width,
			height: e.height
		};
		for (let t of c ? [] : [...s].reverse()) {
			let n = t[1], r = /[EW]/.test(n) ? u.width / 2 : u.width, i = /[NS]/.test(n) ? u.height / 2 : u.height;
			u = {
				x: u.x + (n.includes("E") ? u.width - r : 0),
				y: u.y + (n.includes("S") ? u.height - i : 0),
				width: r,
				height: i
			}, o.push({
				...u,
				kind: "rect",
				role: "division",
				label: "Aliquot",
				detail: `${t[0]} of ${e.detail}`,
				highlighted: !1,
				partial: !1
			});
		}
		o.push({
			...u,
			kind: "rect",
			role: "area",
			label: e.detail,
			detail: r,
			highlighted: !0,
			partial: l,
			caption: c ? void 0 : s.map((e) => e[0]).join(" of ")
		});
	}
	return o;
}
function jn(e, t) {
	let n = _t(e).filter((e) => e.value?.trim()), r = bt(n), i = Array.from({ length: 36 }, (e, t) => {
		let n = Math.floor(t / 6), r = t % 6, i = n * 6 + (n % 2 == 0 ? 6 - r : r + 1);
		return {
			kind: "rect",
			role: "section",
			label: String(i),
			detail: `Section ${i}`,
			x: r * 100,
			y: n * 100,
			width: 100,
			height: 100,
			highlighted: !1,
			partial: !1
		};
	}), a = n.some((e) => /\b(?:sections?|secs?\.?)\s+\d+/i.test(e.value)), o = n.find((e) => e.aspect?.toLowerCase() === "section" && /^\d+$/.test(e.value.trim()) && Number(e.value) >= 1 && Number(e.value) <= 36)?.value?.trim(), s = o ? [...n, {
		aspect: "description",
		value: `${n.filter((e) => e.aspect === "aliquots").map((e) => e.value).join("; ")} of Section ${o}`
	}] : n, c = e.type?.trim() === "government_lot" || e.type?.trim() === "fractional_section";
	for (let e of s) for (let t of e.value.split(/[;\n]/)) {
		let e = [...t.matchAll(/\b(?:sections?|secs?\.?)\s+(\d+(?:\s*(?:,|and|&|[-–])\s*\d+)*)/gi)];
		for (let n = 0; n < e.length; n += 1) {
			let r = e[n], a = [];
			for (let e of r[1].split(/\s*(?:,|and|&)\s*/i)) {
				let t = e.split(/\s*[-–]\s*/).map(Number);
				if (!(t.some((e) => e < 1 || e > 36) || t.length === 2 && t[1] < t[0])) for (let e = t[0]; e <= (t[1] ?? t[0]); e += 1) a.push(e);
			}
			let o = t.slice(n === 0 ? 0 : e[n - 1].index + e[n - 1][0].length, r.index).trim() || (e.length === 1 ? t.slice(r.index + r[0].length) : "");
			for (let e of a) {
				let n = i.find((t) => t.role === "section" && t.label === String(e));
				n !== void 0 && i.push(...An(n, o, c, t.trim()));
			}
		}
	}
	let l = i.filter((e) => e.role === "area");
	if (!l.length) {
		let e = n.filter((e) => e.aspect === "aliquots").map((e) => e.value).join("; ");
		if (/\b(NE|NW|SE|SW|N|S|E|W)\s*(?:1\s*\/\s*[24]|[¼½])/.test(kn(e)) && !a) {
			let t = {
				kind: "rect",
				role: "section",
				label: "Section",
				detail: "Section",
				x: 0,
				y: 0,
				width: 100,
				height: 100,
				highlighted: !1,
				partial: !1
			};
			i.splice(0, i.length, t, ...An(t, e, c, e)), l = i.filter((e) => e.role === "area");
		} else return {
			title: t,
			notes: r,
			items: [],
			issue: "Cannot map: no section or aliquot could be resolved."
		};
	}
	let u = i.filter((e) => e.role === "section" && l.some((t) => t.label === e.detail)), d = Math.min(...u.map((e) => e.y - e.height)), f = Math.max(...u.map((e) => e.y + e.height * 2));
	return {
		title: t,
		notes: r,
		items: i.filter((e) => e.role !== "section" || e.y >= d && e.y + e.height <= f).map((e) => e.role === "section" ? {
			...e,
			highlighted: u.includes(e)
		} : e)
	};
}
//#endregion
//#region src/features/legalmap/data/mapGroups.ts
function Mn(e) {
	let t = {
		lot_block: "Lot & block",
		plss: "PLSS",
		government_lot: "PLSS",
		fractional_section: "PLSS",
		metes_bounds: "Metes & Bounds"
	};
	return yt(e).filter((e) => typeof e == "object" && !!e).flatMap((e) => {
		let n = e.type?.trim() ?? "";
		if (!Object.hasOwn(t, n) || _t(e).filter((e) => e.value?.trim()).length === 0 && !e.source?.trim()) return [];
		let r = t[n];
		if (r === "PLSS") {
			let t = jn(e, r);
			return [{
				view: r,
				group: e,
				scene: t,
				notes: t.notes,
				aspects: [],
				issue: void 0
			}];
		}
		if (r === "Metes & Bounds") {
			let t = On(e, r);
			return [{
				view: r,
				group: e,
				scene: t,
				notes: t.notes,
				aspects: [],
				issue: void 0
			}];
		}
		return [{
			view: r,
			group: e,
			scene: void 0,
			...Jt({
				...e,
				type: n
			})
		}];
	});
}
//#endregion
//#region src/features/pagesegments/data/pageSegmentsData.ts
var Nn = Object.freeze({
	reference: "RecitalIndexing",
	property: "ExhibitIndexing",
	endorsement: "EndorsementIndexing",
	transaction: "TransactionIndexing",
	party: "PartyClauseIndexing",
	secrets: "ConfidentialIndexing",
	monetary: "MonetaryInfoIndexing",
	acknowledgment: "AcknowledgmentIndexing",
	judgment: "CourtIndexing",
	vital: "VitalIndexing"
}), Pn = Object.freeze([
	"reference",
	"property",
	"endorsement",
	"transaction",
	"party",
	"secrets",
	"monetary",
	"acknowledgment",
	"judgment",
	"vital"
]), Fn = Object.freeze({
	reference: "Reference (Recital)",
	property: "Property(Exhibit)",
	endorsement: "Endorsements",
	transaction: "Transaction",
	party: "Party (Party Clause)",
	secrets: "Confidential",
	monetary: "Monetary",
	acknowledgment: "Acknowledgment",
	judgment: "Judgment",
	vital: "Vital"
});
function In(e) {
	let t = e;
	for (; typeof t == "string";) t = JSON.parse(t);
	return Array.isArray(t) ? t : [];
}
function Ln(e, t) {
	try {
		let n = In(e).find((e) => e && typeof e == "object" && e.service === t);
		return n ? Number(n.level) : 0;
	} catch {
		return 0;
	}
}
function Rn(e) {
	return Pn.includes(e);
}
function zn(e) {
	let t = new Set(e.map((e) => String(e ?? "").trim()).filter(Rn));
	return Pn.filter((e) => t.has(e));
}
//#endregion
//#region src/features/metdataview/component/MetadataPanel.tsx
var P = "C:/GitHub/Tabularium/aurorra_index/src/features/metdataview/component/MetadataPanel.tsx", Bn = new Set([
	"reference",
	"property",
	"endorsement",
	"transaction",
	"party",
	"secrets",
	"monetary",
	"acknowledgment",
	"judgment",
	"vital"
]);
function Vn(e) {
	let t = [], n = e.heading?.title?.trim();
	n && t.push({
		label: "Primary Title",
		value: n
	});
	let r = Array.isArray(e.heading?.secondary_titles) ? e.heading.secondary_titles : [];
	for (let e of r) e?.trim() && t.push({
		label: "Secondary Title",
		value: e
	});
	return t;
}
function Hn(e) {
	let t = e.pages?.recordables || [], n = e.pages?.nonrecordables || [];
	return [...t.map((e) => ({
		page: e,
		recordable: !0
	})), ...n.map((e) => ({
		page: e,
		recordable: !1
	}))].map((t) => ({
		...t,
		isTitle: t.page.class === "Title" || t.page.class === "TITLE" || !!(t.page.class && t.page.class === e.heading?.class)
	}));
}
function Un({ children: e }) {
	let t = E(), n = D(null), r = D(null), i = D(null), [a, o] = O({
		overflow: !1,
		right: !1
	});
	return pe(() => {
		let e = r.current, t = () => o({
			overflow: i.current.scrollWidth > n.current.clientWidth,
			right: e.scrollWidth - e.clientWidth - e.scrollLeft > 1
		}), a = new ResizeObserver(t);
		return a.observe(n.current), a.observe(e), a.observe(i.current), e.addEventListener("scroll", t), t(), () => {
			a.disconnect(), e.removeEventListener("scroll", t);
		};
	}, [a.overflow]), /* @__PURE__ */ (0, M.jsxDEV)("div", {
		ref: n,
		style: Xe.actionFrame,
		children: [/* @__PURE__ */ (0, M.jsxDEV)("div", {
			"aria-label": "Section actions",
			id: t,
			ref: r,
			role: "group",
			style: Xe.actionViewport,
			tabIndex: 0,
			children: /* @__PURE__ */ (0, M.jsxDEV)("div", {
				ref: i,
				style: Xe.actionGroup,
				children: e
			}, void 0, !1, {
				fileName: P,
				lineNumber: 150,
				columnNumber: 7
			}, this)
		}, void 0, !1, {
			fileName: P,
			lineNumber: 149,
			columnNumber: 5
		}, this), a.overflow ? /* @__PURE__ */ (0, M.jsxDEV)("button", {
			"aria-controls": t,
			"aria-label": "Scroll section actions right",
			disabled: !a.right,
			onClick: () => r.current.scrollBy({ left: r.current.clientWidth }),
			style: {
				...Ue,
				...a.right ? {} : { opacity: .56 }
			},
			type: "button",
			children: /* @__PURE__ */ (0, M.jsxDEV)("svg", {
				"aria-hidden": "true",
				fill: "none",
				stroke: "currentColor",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				strokeWidth: "2",
				viewBox: "0 0 24 24",
				style: Xe.chevron(!1),
				children: /* @__PURE__ */ (0, M.jsxDEV)("path", { d: "m9 6 6 6-6 6" }, void 0, !1, {
					fileName: P,
					lineNumber: 155,
					columnNumber: 183
				}, this)
			}, void 0, !1, {
				fileName: P,
				lineNumber: 155,
				columnNumber: 7
			}, this)
		}, void 0, !1, {
			fileName: P,
			lineNumber: 152,
			columnNumber: 24
		}, this) : null]
	}, void 0, !0, {
		fileName: P,
		lineNumber: 148,
		columnNumber: 10
	}, this);
}
function Wn(e) {
	let { callbacks: t, children: n, choices: r, pageScope: i, confirmedCodes: a, actions: o, metadata: s, onConfirm: c, onDrop: l, onAddIndex: u, onEditIndex: d, onReprocess: f, onClear: p, openSegment: m, removedCodes: h, sections: g, showContext: _, segments: v, selectedIndex: y, session: ee, setSectionOpen: te, shortcuts: ne, status: re, panelData: ie, pageError: ae, pendingSegments: b } = e, oe = g.hiddenSegments, x = (e) => !oe.has(e), se = new Set(r?.filter((e) => Number(e.level) > 0).map((e) => e.service)), ce = new Map([
		[v.ACKNOWLEDGMENT, "AcknowledgmentIndexing"],
		[v.ENDORSEMENT, "EndorsementIndexing"],
		[v.MONETARY, "MonetaryInfoIndexing"],
		[v.PARTY, "PartyClauseIndexing"],
		[v.PROPERTY, "ExhibitIndexing"],
		[v.LEGAL, "LegalEnrichment"],
		[v.REFERENCE, "RecitalIndexing"],
		[v.SECRETS, "ConfidentialIndexing"],
		[v.TRANSACTION, "TransactionIndexing"],
		[v.VITAL, "VitalIndexing"],
		[v.JUDGMENT, Nn.judgment]
	]), C = new Set(g.filterByChoices && r !== null ? [...ce].filter(([, e]) => !se.has(e)).map(([e]) => e) : []), le = x(v.PROPERTY) && !C.has(v.PROPERTY), ue = x(v.LEGAL) && !C.has(v.LEGAL), de = (e) => ne?.get(e) ?? null, fe = m === v.LEGAL ? v.PROPERTY : m, w = (n, r, i, s = "index", u = r) => {
		let f = n.filter((e) => !h.has(String(e.code || "")));
		return /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [r === We.EXECUTION && f.length > 0 ? /* @__PURE__ */ (0, M.jsxDEV)("h4", {
			style: Je.pageTitle,
			children: "Visual Verification"
		}, void 0, !1, {
			fileName: P,
			lineNumber: 211,
			columnNumber: 73
		}, this) : null, /* @__PURE__ */ (0, M.jsxDEV)(Oe, {
			ungrouped: r === v.ENDORSEMENT || r === We.EXECUTION,
			empty: i,
			rows: f.map((n) => {
				let i = String(n.code || "");
				return /* @__PURE__ */ (0, M.jsxDEV)(ke, {
					callbacks: t,
					confirmed: a.has(i),
					busy: e.pendingChanges?.get(i)?.busy,
					pending: e.pendingChanges?.get(i)?.kind,
					recovery: e.pendingChanges?.get(i)?.actions,
					item: n,
					onConfirm: o.confirm ? c : void 0,
					onDrop: o.drop ? l : void 0,
					onEdit: d,
					selected: !!(i && y?.code === i && (!y.segment || y.segment === r)),
					segment: r,
					session: ee,
					type: s
				}, i, !1, {
					fileName: P,
					lineNumber: 215,
					columnNumber: 11
				}, this);
			})
		}, `${ee}-${u}`, !1, {
			fileName: P,
			lineNumber: 212,
			columnNumber: 7
		}, this)] }, void 0, !0, {
			fileName: P,
			lineNumber: 210,
			columnNumber: 12
		}, this);
	}, T = (e, n, i, a = e) => {
		let c = e === v.PROPERTY ? !le && !ue : C.has(e), l = g.filterByChoices ? r === null ? "Processing choices are unavailable for this session." : D.get(e) : void 0;
		return /* @__PURE__ */ (0, M.jsxDEV)(Ae, {
			collapsible: !1,
			disabled: c,
			disabledReason: "Not selected for this session.",
			error: e === v.PAGE ? ae?.error : void 0,
			note: e === v.TITLE || r === null ? void 0 : l,
			pending: a ? b?.get(a) : void 0,
			progressLabel: a ? b?.get(a)?.label : void 0,
			headerAction: (n) => a && fe === e && (e === v.PROPERTY && E.hasMap || u || o.reprocess && f || o.drop && p) ? /* @__PURE__ */ (0, M.jsxDEV)(Un, { children: [
				e === v.PROPERTY && E.hasMap ? /* @__PURE__ */ (0, M.jsxDEV)(he, {
					label: "Open legal view",
					lineAligned: !1,
					text: !0,
					onClick: () => t.onLegalView?.(),
					children: [/* @__PURE__ */ (0, M.jsxDEV)(Ce, { name: "address" }, void 0, !1, {
						fileName: P,
						lineNumber: 263,
						columnNumber: 19
					}, this), "Show Map"]
				}, void 0, !0, {
					fileName: P,
					lineNumber: 262,
					columnNumber: 17
				}, this) : null,
				u ? /* @__PURE__ */ (0, M.jsxDEV)(he, {
					label: "Add Index",
					lineAligned: !1,
					text: !0,
					onClick: (e) => u(a, e.currentTarget),
					children: "Add Index"
				}, void 0, !1, {
					fileName: P,
					lineNumber: 268,
					columnNumber: 17
				}, this) : null,
				o.reprocess && f ? /* @__PURE__ */ (0, M.jsxDEV)(ve, {
					flat: !0,
					size: "sm",
					label: "Reprocess",
					style: k.actionButton(!1, !1, !0),
					onConfirm: () => f(a),
					children: "Reprocess"
				}, void 0, !1, {
					fileName: P,
					lineNumber: 273,
					columnNumber: 17
				}, this) : null,
				o.drop && p ? /* @__PURE__ */ (0, M.jsxDEV)(ve, {
					disabled: n === 0,
					flat: !0,
					size: "sm",
					label: "Clear indexes",
					variant: "danger",
					style: k.actionButton(!1, !1, !0),
					onConfirm: () => p(a)
				}, void 0, !1, {
					fileName: P,
					lineNumber: 278,
					columnNumber: 17
				}, this) : null
			] }, void 0, !0, {
				fileName: P,
				lineNumber: 260,
				columnNumber: 13
			}, this) : null,
			resetKey: s,
			render: () => {
				let t = i();
				return {
					...t,
					children: /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [t.children, l && (e === v.TITLE || r === null) ? /* @__PURE__ */ (0, M.jsxDEV)("p", {
						role: "note",
						style: Je.muted,
						children: l
					}, void 0, !1, {
						fileName: P,
						lineNumber: 286,
						columnNumber: 122
					}, this) : null] }, void 0, !0, {
						fileName: P,
						lineNumber: 286,
						columnNumber: 42
					}, this)
				};
			},
			onOpenChange: (t) => te(e, t),
			open: fe === e,
			shortcutKey: de(e),
			title: n,
			children: null
		}, void 0, !1, {
			fileName: P,
			lineNumber: 247,
			columnNumber: 7
		}, this);
	};
	if ((re === "loading" || re === "error") && !s) return null;
	if (!s || !ie) return /* @__PURE__ */ (0, M.jsxDEV)("section", {
		"aria-label": "Metadata",
		style: Je.sectionShell,
		children: /* @__PURE__ */ (0, M.jsxDEV)(be, { message: "No metadata found." }, void 0, !1, {
			fileName: P,
			lineNumber: 305,
			columnNumber: 9
		}, this)
	}, void 0, !1, {
		fileName: P,
		lineNumber: 304,
		columnNumber: 7
	}, this);
	let E = {
		get sideItems() {
			return S(s.parties ? ie.parties : []);
		},
		get partyItems() {
			let e = E.sideItems;
			return S([...e, ...He(s.indexes, [v.PARTY])]).slice(e.length);
		},
		get executionIndexes() {
			return S(ie.execution?.indexes ?? []).sort((e, t) => String(e.aspect).localeCompare(String(t.aspect)));
		},
		get endorsements() {
			return S(ie.endorsements);
		},
		get references() {
			return S(ie.references);
		},
		get monetaryItems() {
			return S(ie.monetarys);
		},
		get notary() {
			return S(ie.notary);
		},
		get transactions() {
			return S(ie.transactions);
		},
		get vitals() {
			return S(ie.vitals);
		},
		get judgments() {
			return S(ie.judgments);
		},
		get headingItems() {
			return Vn(s);
		},
		get pageItems() {
			return ae ? [] : Hn(s);
		},
		get legalGroups() {
			return (s.legals?.groups || s.legals?.legalGroups || s.legals?.LegalGroups || s.legals?.items || []).filter((e) => Array.isArray(e.elements) && e.elements.length > 0);
		},
		get propertyItems() {
			return le ? S(ie.properties.filter((e) => !E.legalGroups.length || e.aspect !== "legal_description")) : [];
		},
		get legalCount() {
			return ue ? E.legalGroups.length : 0;
		},
		get hasMap() {
			return ue && Mn(s.legals).length > 0 || le && !!Ve(E.propertyItems).property_address?.trim();
		},
		get secretItems() {
			return S((s.secrets || []).filter((e) => Fe(e.value) && !Fe(e.value).startsWith("xxx") && !Fe(e.value).includes("Not explicitly provided")));
		}
	}, pe = "Processing scope is unavailable for this session.", me = s.pages?.num_of_pages;
	if (i && me !== void 0) {
		let e = me === 1 ? "page" : "pages";
		pe = "all" in i ? `Processing scope for this session: all ${me} ${e}.` : `Processing scope for this session: ${i.last === 0 ? i.first === 1 ? "first page" : `first ${i.first} pages` : `first ${i.first} and last ${i.last === 1 ? "page" : `${i.last} pages`}`} — ${Math.min(me, i.first + i.last)} of ${me} ${e}.`;
	}
	let D = new Map([
		[v.PAGE, pe],
		[v.ACKNOWLEDGMENT, se.has("ExecutionEnrichment") ? void 0 : "Acknowledgment verification was not selected for this session."],
		[v.PARTY, se.has("PartyEnrichment") ? void 0 : "Party enrichment was not selected for this session."],
		[v.PROPERTY, se.has("LegalEnrichment") ? void 0 : "Legal description enrichment was not selected for this session."]
	]);
	return /* @__PURE__ */ (0, M.jsxDEV)($e.Provider, {
		delayDuration: 250,
		children: /* @__PURE__ */ (0, M.jsxDEV)("section", {
			"aria-label": "Metadata",
			style: Je.root,
			children: [
				/* @__PURE__ */ (0, M.jsxDEV)("style", { children: [qe, Ke] }, void 0, !0, {
					fileName: P,
					lineNumber: 354,
					columnNumber: 9
				}, this),
				_ ? /* @__PURE__ */ (0, M.jsxDEV)("header", {
					"data-metadata-context": "true",
					style: Je.header,
					children: [/* @__PURE__ */ (0, M.jsxDEV)("h2", {
						style: Je.title,
						children: ze(s.heading?.class || "")
					}, void 0, !1, {
						fileName: P,
						lineNumber: 357,
						columnNumber: 13
					}, this), /* @__PURE__ */ (0, M.jsxDEV)("div", {
						style: Je.statistics,
						children: e.headerActions
					}, void 0, !1, {
						fileName: P,
						lineNumber: 358,
						columnNumber: 13
					}, this)]
				}, void 0, !0, {
					fileName: P,
					lineNumber: 356,
					columnNumber: 11
				}, this) : null,
				/* @__PURE__ */ (0, M.jsxDEV)("div", {
					"aria-label": "Metadata accordion",
					"data-panel-scroll": "true",
					role: "region",
					style: Je.accordion,
					children: [
						x(v.PAGE) ? T(v.PAGE, "Pages", () => ({
							count: E.pageItems.length,
							children: ae ? null : E.pageItems.length ? E.pageItems.map(({ page: n, recordable: r, isTitle: i }, a) => {
								let s = String(n.name || ""), u = String(n.code ?? s), d = String(n.class || "").trim().toLowerCase(), f = (Array.isArray(n.segments) ? n.segments : []).map((e) => String(e || "").toLowerCase()).filter((e) => Bn.has(e)), p = {
									code: u,
									explanation: n.explanation,
									label: r ? "Recordable" : "Attachment",
									page: s,
									page_number: s,
									segment: v.PAGE,
									source: f.map(ze).join(", "),
									value: `${s} : ${i ? "Title" : ze(d)} page`
								};
								return /* @__PURE__ */ (0, M.jsxDEV)(ke, {
									callbacks: t,
									confirmed: !1,
									item: p,
									onConfirm: o.confirm ? c : void 0,
									onDrop: o.drop ? l : void 0,
									pageClass: d,
									pageSegments: f,
									details: f.length ? [{
										label: "Segments",
										value: p.source
									}] : void 0,
									selected: !!(u && y?.code === u),
									segment: v.PAGE,
									session: ee,
									busy: e.pendingChanges?.get(u)?.busy,
									pending: e.pendingChanges?.get(u)?.kind,
									recovery: e.pendingChanges?.get(u)?.actions,
									type: "page"
								}, `${u}-${a}`, !1, {
									fileName: P,
									lineNumber: 383,
									columnNumber: 15
								}, this);
							}) : /* @__PURE__ */ (0, M.jsxDEV)(be, { message: "No recordable pages found." }, void 0, !1, {
								fileName: P,
								lineNumber: 402,
								columnNumber: 16
							}, this)
						}), null) : null,
						x(v.TITLE) ? T(v.TITLE, "Titles", () => {
							let e = E.headingItems, n = e.map((e, n) => {
								let r = {
									item: e,
									metadata: s,
									pageError: !!ae,
									callbacks: t,
									session: ee,
									segment: v.TITLE
								};
								return /* @__PURE__ */ (0, M.jsxDEV)(Se, {
									title: "Title page",
									resetKey: s,
									fallback: () => /* @__PURE__ */ (0, M.jsxDEV)(Gn, {
										...r,
										pageError: !0
									}, void 0, !1, {
										fileName: P,
										lineNumber: 413,
										columnNumber: 33
									}, this),
									children: /* @__PURE__ */ (0, M.jsxDEV)(Gn, { ...r }, void 0, !1, {
										fileName: P,
										lineNumber: 414,
										columnNumber: 17
									}, this)
								}, `${e.label}-${e.value}-${n}`, !1, {
									fileName: P,
									lineNumber: 412,
									columnNumber: 22
								}, this);
							});
							return {
								count: e.length,
								children: n.length ? n : /* @__PURE__ */ (0, M.jsxDEV)(be, { message: "No titles found." }, void 0, !1, {
									fileName: P,
									lineNumber: 417,
									columnNumber: 84
								}, this)
							};
						}, null) : null,
						x(v.ENDORSEMENT) ? T(v.ENDORSEMENT, "Endorsements", () => ({
							count: E.endorsements.length,
							children: w(E.endorsements, v.ENDORSEMENT, "No endorsements found.")
						})) : null,
						x(v.PARTY) ? T(v.PARTY, "Parties(Party Clause)", () => ({
							count: E.sideItems.length + E.partyItems.length,
							children: /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [s.parties ? w(E.sideItems, v.PARTY, E.partyItems.length ? void 0 : "No parties found.", "index", "sides") : null, w(E.partyItems, v.PARTY, s.parties ? void 0 : "No parties found.")] }, void 0, !0, {
								fileName: P,
								lineNumber: 422,
								columnNumber: 167
							}, this)
						})) : null,
						x(v.REFERENCE) ? T(v.REFERENCE, "References(Recital)", () => ({
							count: E.references.length,
							children: w(E.references, v.REFERENCE, "No references found.")
						})) : null,
						x(v.PROPERTY) || x(v.LEGAL) ? T(v.PROPERTY, "Property Info", () => ({
							count: E.propertyItems.length + E.legalCount,
							children: /* @__PURE__ */ (0, M.jsxDEV)("div", {
								className: "metadata-property",
								children: [
									E.propertyItems.length ? w(E.propertyItems, v.PROPERTY, "No property info found.") : null,
									E.legalCount > 0 ? /* @__PURE__ */ (0, M.jsxDEV)(De, {
										items: E.legalGroups,
										page: (e) => e.page,
										hidePages: !0,
										children: (n, r) => {
											let i = String(n.code || ""), a = n.page || 0, o = !!(i && y?.code === i && (!y.segment || y.segment === v.LEGAL)), s = {
												code: i,
												page: a,
												segment: v.LEGAL,
												session: ee,
												type: String(n.type || "legal"),
												value: ze(n.type || ""),
												...n.original == null ? {} : { metadataIndex: {
													label: "legal",
													value: n.original,
													source: Fe(n.source),
													ambiguous: ""
												} }
											}, c = a && i ? t.onPageClick : void 0;
											return /* @__PURE__ */ (0, M.jsxDEV)("article", {
												className: "metadata-row",
												"data-active": o ? "true" : "false",
												"aria-disabled": e.pendingChanges?.has(i) ? "true" : void 0,
												"data-index-code": i || void 0,
												"data-index-segment": v.LEGAL,
												style: {
													...k.row(o),
													...k.indexRow
												},
												children: [
													/* @__PURE__ */ (0, M.jsxDEV)("div", {
														className: "metadata-legal-header",
														inert: e.pendingChanges?.has(i),
														onClick: c && !e.pendingChanges?.has(i) ? () => c(s) : void 0,
														style: {
															display: "grid",
															gridColumn: "1 / -1",
															gridRow: "1",
															gridTemplateColumns: "subgrid",
															alignItems: "start",
															cursor: c ? "pointer" : void 0
														},
														children: [
															/* @__PURE__ */ (0, M.jsxDEV)("span", {
																"aria-label": "OK",
																role: "img",
																title: "OK",
																style: k.statusIcon,
																children: /* @__PURE__ */ (0, M.jsxDEV)(Me, {}, void 0, !1, {
																	fileName: P,
																	lineNumber: 458,
																	columnNumber: 98
																}, this)
															}, void 0, !1, {
																fileName: P,
																lineNumber: 458,
																columnNumber: 25
															}, this),
															/* @__PURE__ */ (0, M.jsxDEV)("div", {
																inert: e.pendingChanges?.has(i),
																style: {
																	...k.aspects,
																	...k.body
																},
																children: "Legal Description"
															}, void 0, !1, {
																fileName: P,
																lineNumber: 459,
																columnNumber: 25
															}, this),
															/* @__PURE__ */ (0, M.jsxDEV)("div", {
																className: "metadata-row-value",
																inert: e.pendingChanges?.has(i),
																style: {
																	...k.valueWithViewer,
																	...k.indexValueWithViewer
																},
																children: /* @__PURE__ */ (0, M.jsxDEV)(we, {
																	plain: !0,
																	value: s.value,
																	onClick: c ? () => c(s) : void 0
																}, void 0, !1, {
																	fileName: P,
																	lineNumber: 463,
																	columnNumber: 27
																}, this)
															}, void 0, !1, {
																fileName: P,
																lineNumber: 462,
																columnNumber: 25
															}, this)
														]
													}, void 0, !0, {
														fileName: P,
														lineNumber: 452,
														columnNumber: 23
													}, this),
													(n.elements || []).map((t, n) => /* @__PURE__ */ (0, M.jsxDEV)("div", {
														inert: e.pendingChanges?.has(i),
														style: Je.legalElement,
														children: /* @__PURE__ */ (0, M.jsxDEV)("div", {
															style: k.content,
															children: [/* @__PURE__ */ (0, M.jsxDEV)("div", { children: [
																/* @__PURE__ */ (0, M.jsxDEV)("strong", { children: [ze(t.aspect || ""), ":"] }, void 0, !0, {
																	fileName: P,
																	lineNumber: 469,
																	columnNumber: 34
																}, this),
																" ",
																Fe(t.value)
															] }, void 0, !0, {
																fileName: P,
																lineNumber: 469,
																columnNumber: 29
															}, this), t.explanation ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
																style: Je.muted,
																children: t.explanation
															}, void 0, !1, {
																fileName: P,
																lineNumber: 470,
																columnNumber: 52
															}, this) : null]
														}, void 0, !0, {
															fileName: P,
															lineNumber: 468,
															columnNumber: 27
														}, this)
													}, `${t.aspect}-${n}`, !1, {
														fileName: P,
														lineNumber: 467,
														columnNumber: 25
													}, this)),
													e.pendingChanges?.get(i)?.actions ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
														"aria-disabled": "false",
														style: k.recovery,
														children: e.pendingChanges.get(i)?.actions
													}, void 0, !1, {
														fileName: P,
														lineNumber: 474,
														columnNumber: 67
													}, this) : null
												]
											}, `${i}-${r}`, !0, {
												fileName: P,
												lineNumber: 443,
												columnNumber: 21
											}, this);
										}
									}, void 0, !1, {
										fileName: P,
										lineNumber: 433,
										columnNumber: 15
									}, this) : null,
									!E.propertyItems.length && !E.legalCount ? /* @__PURE__ */ (0, M.jsxDEV)(be, { message: "No property info found." }, void 0, !1, {
										fileName: P,
										lineNumber: 480,
										columnNumber: 63
									}, this) : null
								]
							}, void 0, !0, {
								fileName: P,
								lineNumber: 430,
								columnNumber: 82
							}, this)
						})) : null,
						x(v.MONETARY) ? T(v.MONETARY, "Monetary", () => ({
							count: E.monetaryItems.length,
							children: w(E.monetaryItems, v.MONETARY, "No monetary info found.")
						})) : null,
						x(v.ACKNOWLEDGMENT) ? T(v.ACKNOWLEDGMENT, "Acknowledgment", () => ({
							count: E.notary.length + E.executionIndexes.length,
							children: /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [E.executionIndexes.length ? w(E.executionIndexes, We.EXECUTION, "No execution results found.") : null, E.notary.length || !E.executionIndexes.length ? w(E.notary, v.ACKNOWLEDGMENT, "No notary info found.") : null] }, void 0, !0, {
								fileName: P,
								lineNumber: 484,
								columnNumber: 181
							}, this)
						})) : null,
						x(v.TRANSACTION) ? T(v.TRANSACTION, "Transactional", () => ({
							count: E.transactions.length,
							children: w(E.transactions, v.TRANSACTION, "No transaction indexes found.")
						})) : null,
						x(v.VITAL) ? T(v.VITAL, "Vital", () => ({
							count: E.vitals.length,
							children: w(E.vitals, v.VITAL, "Vital information not found.")
						})) : null,
						x(v.JUDGMENT) ? T(v.JUDGMENT, "Judgment", () => ({
							count: E.judgments.filter((e) => !h.has(String(e.code || ""))).length,
							children: w(E.judgments, v.JUDGMENT, "No judgment indexes found.")
						})) : null,
						x(v.SECRETS) ? T(v.SECRETS, "Confidential", () => ({
							count: E.secretItems.length,
							children: w(E.secretItems, v.SECRETS, "No confidential info found.", "secret")
						})) : null,
						n
					]
				}, void 0, !0, {
					fileName: P,
					lineNumber: 363,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, M.jsxDEV)("footer", {
					"aria-label": "Metadata actions",
					"data-metadata-footer": "true",
					style: Je.footerEmpty
				}, void 0, !1, {
					fileName: P,
					lineNumber: 494,
					columnNumber: 9
				}, this)
			]
		}, void 0, !0, {
			fileName: P,
			lineNumber: 353,
			columnNumber: 7
		}, this)
	}, void 0, !1, {
		fileName: P,
		lineNumber: 352,
		columnNumber: 5
	}, this);
}
function Gn({ item: e, metadata: t, pageError: n, callbacks: r, session: i, segment: a }) {
	let o = n ? void 0 : Hn(t).find((e) => e.isTitle)?.page;
	return /* @__PURE__ */ (0, M.jsxDEV)(ke, {
		callbacks: r,
		confirmed: !1,
		selected: !1,
		session: i,
		segment: a,
		type: "title",
		item: {
			label: e.label,
			value: e.value,
			code: o?.code,
			page: o?.name
		}
	}, void 0, !1, {
		fileName: P,
		lineNumber: 502,
		columnNumber: 10
	}, this);
}
//#endregion
//#region src/features/editindex/component/EditIndexPanel.tsx
var Kn = "C:/GitHub/Tabularium/aurorra_index/src/features/editindex/component/EditIndexPanel.tsx";
function qn({ apiGatewayUrl: e, authToken: t, batchCode: n, intervalMs: r, onQueueChange: i, formatError: a, retryIntervalMs: o, retryLimit: s, request: c, onClose: u, onError: d, onReadyChange: f, onResource: p, workerClient: h }) {
	let [_, v] = O({
		index: "",
		label: "",
		page: "",
		source: ""
	}), [y, ee] = O([]), [ne, re] = O(!1), { aspects: ie, ready: ae } = x(c, c.session, p, f, d), b = D(null);
	pe(() => {
		let e = b.current;
		e && (e.style.height = "auto", ae && (e.style.height = `${e.getBoundingClientRect().height}px`));
	}, [ae, c]);
	let oe = me(() => h || g({
		apiBaseUrl: e,
		retryIntervalMs: o,
		retryLimit: s
	}), [
		e,
		o,
		s,
		h
	]), S = D(!1), [se, ce] = O(!1), C = me(() => {
		let { index: e, segment: t } = c;
		return {
			fields: {
				index: e.value ?? "",
				label: e.label ?? "",
				page: String(e.page ?? e.page_number ?? ""),
				source: e.source ?? ""
			},
			selected: (e.aspect ?? "").split(",").map((e) => e.trim()).filter(Boolean).map((e) => JSON.stringify([t, e]))
		};
	}, [c]), le = y.map((e) => JSON.parse(e)[1]), ue = C.selected.map((e) => JSON.parse(e)[1]), de = {
		action: "update",
		allow_enrichment: ne,
		explanation: `P ${_.page.trim()}  ${_.source}`,
		new_index_value: _.index.trim() && _.index.trim() !== C.fields.index.trim() ? _.index : null,
		new_index_label: _.label.trim() && _.label.trim() !== C.fields.label.trim() ? _.label : null,
		new_index_aspect: le.slice().sort().join(",") === ue.sort().join(",") ? null : le.join(","),
		new_index_ambiguous: null,
		old_index_label: c.index.label ?? null,
		old_index_aspect: c.index.aspect ?? null,
		old_index_value: c.index.value ?? null
	}, fe = de.new_index_value !== null || de.new_index_label !== null || de.new_index_aspect !== null;
	T(() => {
		S.current = !1, ce(!1), v(C.fields), ee(C.selected), re(!1);
	}, [C]);
	async function w() {
		if (!(!fe || !ae || !y.length || !_.index.trim() || S.current)) {
			S.current = !0, ce(!0);
			try {
				await l.getState().enqueue({
					batch: n,
					session: c.session,
					segment: c.segment,
					data: JSON.stringify([de])
				}, {
					authToken: t,
					client: oe,
					intervalMs: r,
					formatError: a,
					onChange: i
				}), u();
			} catch (e) {
				let t = e;
				d({
					code: t.code,
					details: t.details,
					error: t.message,
					status: t.status
				});
			} finally {
				S.current = !1, ce(!1);
			}
		}
	}
	return /* @__PURE__ */ (0, M.jsxDEV)("section", {
		"aria-label": "Edit index form",
		style: {
			...Le.root,
			flex: "1 1 auto",
			overflow: "hidden"
		},
		children: [/* @__PURE__ */ (0, M.jsxDEV)("div", {
			inert: se,
			style: {
				...Le.fields,
				alignContent: "start",
				boxSizing: "border-box",
				flex: "1 1 auto",
				minHeight: 0,
				overflowY: "auto",
				padding: "0.35rem"
			},
			children: [/* @__PURE__ */ (0, M.jsxDEV)("div", {
				ref: b,
				style: {
					...Le.fields,
					alignContent: "start",
					boxSizing: "border-box",
					minHeight: 0,
					overflowY: "auto",
					padding: "0.35rem"
				},
				children: /* @__PURE__ */ (0, M.jsxDEV)(m, {
					value: _.index,
					aspects: ie,
					segment: c.segment,
					selected: y,
					onChange: (e) => v({
						..._,
						index: e
					}),
					onSelect: ee,
					allowEnrichment: ne,
					onEnrichmentChange: re
				}, c.session, !1, {
					fileName: Kn,
					lineNumber: 74,
					columnNumber: 9
				}, this)
			}, void 0, !1, {
				fileName: Kn,
				lineNumber: 73,
				columnNumber: 7
			}, this), /* @__PURE__ */ (0, M.jsxDEV)(te, {
				fields: _,
				onChange: v
			}, void 0, !1, {
				fileName: Kn,
				lineNumber: 76,
				columnNumber: 7
			}, this)]
		}, void 0, !0, {
			fileName: Kn,
			lineNumber: 72,
			columnNumber: 5
		}, this), /* @__PURE__ */ (0, M.jsxDEV)("div", {
			style: Le.actions,
			children: /* @__PURE__ */ (0, M.jsxDEV)(ve, {
				disabled: !fe || se || !ae || !y.length || !_.index.trim(),
				label: "Update",
				onConfirm: () => void w(),
				style: Le.button,
				variant: "primary"
			}, void 0, !1, {
				fileName: Kn,
				lineNumber: 79,
				columnNumber: 7
			}, this)
		}, void 0, !1, {
			fileName: Kn,
			lineNumber: 78,
			columnNumber: 5
		}, this)]
	}, void 0, !0, {
		fileName: Kn,
		lineNumber: 71,
		columnNumber: 10
	}, this);
}
//#endregion
//#region src/features/indexing/component/IndexPlaceholder.tsx
var Jn = "C:/GitHub/Tabularium/aurorra_index/src/features/indexing/component/IndexPlaceholder.tsx";
function Yn({ attempt: e, retryLimit: t }) {
	return /* @__PURE__ */ (0, M.jsxDEV)("section", {
		"aria-label": "Metadata",
		style: Je.root,
		children: /* @__PURE__ */ (0, M.jsxDEV)("div", {
			"data-panel-scroll": "true",
			style: Je.accordion,
			children: /* @__PURE__ */ (0, M.jsxDEV)(Ee, {
				label: "Loading metadata",
				children: [/* @__PURE__ */ (0, M.jsxDEV)("div", {
					style: Xe.header(),
					children: [/* @__PURE__ */ (0, M.jsxDEV)("span", {
						style: Je.muted,
						children: "Loading metadata…"
					}, void 0, !1, {
						fileName: Jn,
						lineNumber: 9,
						columnNumber: 13
					}, this), e > 1 ? /* @__PURE__ */ (0, M.jsxDEV)("span", {
						style: Je.muted,
						children: [
							"Attempt ",
							e,
							" of ",
							t
						]
					}, void 0, !0, {
						fileName: Jn,
						lineNumber: 10,
						columnNumber: 28
					}, this) : null]
				}, void 0, !0, {
					fileName: Jn,
					lineNumber: 8,
					columnNumber: 11
				}, this), /* @__PURE__ */ (0, M.jsxDEV)("div", {
					"aria-hidden": "true",
					children: [
						"65%",
						"45%",
						"55%"
					].map((e) => /* @__PURE__ */ (0, M.jsxDEV)("div", {
						style: Xe.root,
						children: [/* @__PURE__ */ (0, M.jsxDEV)("div", {
							style: Xe.header(),
							children: [/* @__PURE__ */ (0, M.jsxDEV)("span", { style: {
								...A,
								width: "1.125rem",
								height: "1.125rem"
							} }, void 0, !1, {
								fileName: Jn,
								lineNumber: 16,
								columnNumber: 19
							}, this), /* @__PURE__ */ (0, M.jsxDEV)("span", { style: {
								...A,
								width: e
							} }, void 0, !1, {
								fileName: Jn,
								lineNumber: 17,
								columnNumber: 19
							}, this)]
						}, void 0, !0, {
							fileName: Jn,
							lineNumber: 15,
							columnNumber: 17
						}, this), /* @__PURE__ */ (0, M.jsxDEV)("div", {
							style: Xe.content,
							children: [
								"90%",
								"70%",
								"80%"
							].map((e) => /* @__PURE__ */ (0, M.jsxDEV)("span", { style: {
								...A,
								width: e
							} }, e, !1, {
								fileName: Jn,
								lineNumber: 20,
								columnNumber: 55
							}, this))
						}, void 0, !1, {
							fileName: Jn,
							lineNumber: 19,
							columnNumber: 17
						}, this)]
					}, e, !0, {
						fileName: Jn,
						lineNumber: 14,
						columnNumber: 15
					}, this))
				}, void 0, !1, {
					fileName: Jn,
					lineNumber: 12,
					columnNumber: 11
				}, this)]
			}, void 0, !0, {
				fileName: Jn,
				lineNumber: 7,
				columnNumber: 9
			}, this)
		}, void 0, !1, {
			fileName: Jn,
			lineNumber: 6,
			columnNumber: 7
		}, this)
	}, void 0, !1, {
		fileName: Jn,
		lineNumber: 5,
		columnNumber: 5
	}, this);
}
//#endregion
//#region src/features/indexing/component/IndexContainer.tsx
var Xn = "C:/GitHub/Tabularium/aurorra_index/src/features/indexing/component/IndexContainer.tsx", Zn = /* @__PURE__ */ new Set();
function Qn(e) {
	let { callbacks: t, children: n, segments: r, session: i } = e, a = ft(e), o = re((e) => e.tasks), s = new Map(o.filter((e) => e.session === i).flatMap((e) => e.changes.filter((e) => "code" in e).map((t) => [t.code, {
		kind: t.action === "drop" || t.patch?.action === "remove" ? "delete" : "update",
		busy: e.status !== "failed",
		actions: e.status === "failed" ? /* @__PURE__ */ (0, M.jsxDEV)(st, {
			id: e.id,
			code: t.code
		}, void 0, !1, {
			fileName: Xn,
			lineNumber: 19,
			columnNumber: 358
		}, this) : null
	}]))), c = new Map(o.filter((e) => e.session === i && e.changes.some((e) => "segment" in e)).map((e) => [e.segment, {
		busy: e.status !== "failed",
		actions: e.status === "failed" ? /* @__PURE__ */ (0, M.jsxDEV)(st, { id: e.id }, void 0, !1, {
			fileName: Xn,
			lineNumber: 21,
			columnNumber: 103
		}, this) : null,
		label: `${e.changes[0].action === "clear" ? "Clearing" : "Reprocessing"} ${e.segment}`
	}])), l = {
		...t,
		onPageClick: t.onPageClick ? (e) => {
			let n = { scroll: !1 };
			f.getState().setRequest({
				code: e.code,
				highlightOptions: n,
				index: e.type,
				metadataIndex: e.metadataIndex ?? null,
				page: e.page,
				quote: e.quote ?? "",
				segment: e.segment,
				session: e.session,
				value: e.value ?? ""
			}), t.onPageClick?.({
				...e,
				highlightOptions: n
			});
		} : void 0
	};
	return /* @__PURE__ */ (0, M.jsxDEV)("div", {
		style: Je.rootShell,
		children: !a.metadata && (a.store.status === "idle" || a.store.status === "loading") ? /* @__PURE__ */ (0, M.jsxDEV)(Yn, {
			attempt: a.retryAttempt,
			retryLimit: e.retryLimit
		}, i, !1, {
			fileName: Xn,
			lineNumber: 47,
			columnNumber: 9
		}, this) : /* @__PURE__ */ (0, M.jsxDEV)(Wn, {
			onAddIndex: (e, n) => {
				C.getState().open({ segment: e }), t.onAddIndex?.(n);
			},
			onEditIndex: (e, n, r) => {
				h.getState().open({
					index: e,
					segment: n,
					session: i
				}), t.onEditIndex?.(e, n, r);
			},
			actions: {
				confirm: !0,
				drop: !0,
				reprocess: !0
			},
			callbacks: l,
			children: n,
			headerActions: e.headerActions,
			confirmedCodes: Zn,
			removedCodes: Zn,
			pendingChanges: s,
			pendingSegments: c,
			sections: {
				filterByChoices: !0,
				hiddenSegments: /* @__PURE__ */ new Set(),
				showEmpty: !1
			},
			showContext: !0,
			pageScope: e.pageScope,
			segments: r,
			session: i,
			shortcuts: null,
			status: a.store.status,
			...a
		}, void 0, !1, {
			fileName: Xn,
			lineNumber: 48,
			columnNumber: 11
		}, this)
	}, void 0, !1, {
		fileName: Xn,
		lineNumber: 45,
		columnNumber: 5
	}, this);
}
//#endregion
//#region src/features/legalmap/assets/survey-grid.svg?url
var $n = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='48'%20height='48'%20viewBox='0%200%2048%2048'%3e%3cpath%20d='M0%20.5H48M.5%200V48'%20fill='none'%20stroke='%23d5dee2'%20stroke-opacity='0.65'%20stroke-width='1'%20stroke-dasharray='3%205'/%3e%3c/svg%3e", F = {
	blockBg: "#e8f0f4",
	blockBorder: "#91aebe",
	blockText: "#294d60",
	divisionBg: "#f4f1ea",
	divisionBorder: "#c8bdaa",
	divisionText: "#6b6256",
	gridLine: "#d5dee2",
	mapBg: "#f7f8f6",
	parcelFill: "#63b5d5",
	parcelLine: "#2496c8",
	secondaryText: "#62727d",
	unconfirmed: "#b45309",
	sectionLine: "#62727d",
	lotBg: "#fbe9e3",
	lotBorder: "#cf7258",
	lotText: "#9d4934",
	rowBg: "rgba(58, 124, 140, 0.06)",
	subdivisionBorder: "#3a7c8c",
	subdivisionColor: "#274f59",
	text: "#183247"
}, I = {
	amp: 1.15,
	blockBaseFontSize: 16,
	closureRatio: .001,
	gridSize: 24,
	lotBaseFontSize: 16,
	labelInset: 32,
	parcelScale: .675,
	mapMin: 16,
	platWidth: 30,
	mapMax: 56,
	detailsMin: 8,
	detailsHeight: 9.2,
	dividerHeight: 6,
	drawingMin: 6
}, er = {
	backgroundColor: F.rowBg,
	backgroundImage: "repeating-linear-gradient(135deg, transparent 0, transparent 7px, rgba(58, 124, 140, 0.15) 7px, rgba(58, 124, 140, 0.15) 8px)"
}, tr = `
.legal-map-view-tabs button[aria-selected="true"] { --icon-surface: var(--accent-surface); }
.legal-map-tabs button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.legal-map-detail-tabs button:focus-visible { outline-color: var(--primary-dark); outline-offset: -2px; }
.legal-map [role="tabpanel"]:focus-visible, .legal-map [role="region"]:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }
.legal-map details[open] > summary > svg { transform: rotate(180deg); }
.legal-map-column:empty { display: none; }
.legal-map-divider:hover, .legal-map-divider:focus-visible { border-color: var(--primary-dark); }
.legal-map-divider:focus-visible { outline: 2px solid var(--primary-dark); outline-offset: -2px; }
.legal-map-divider:hover span, .legal-map-divider:focus-visible span { background: var(--primary-dark); }
.survey-layout { display: flex; flex: 1 1 0; flex-direction: column; min-height: ${I.mapMin}rem; min-width: 0; }
.survey-layout:has([data-plat-scroll="true"]) { min-height: min-content; }
.legal-map-column { flex: 1 0 auto; }
.legal-map-column:has([data-plat-scroll="true"]) { flex: 1 1 0; }
.legal-map-table { flex: 0 0 auto; min-width: 0; }
@media (max-width: 40rem) { .legal-map-calls > caption { text-align: left; } }
.legal-map-table thead th { background: var(--white); position: sticky; top: 0; z-index: 1; }
.legal-map-acreage li + li { border-top: 1px solid var(--border-subtle); margin-top: 0.5rem; padding-top: 0.5rem; }
`, L = {
	shell: {
		alignItems: "stretch",
		boxSizing: "border-box",
		color: F.text,
		display: "flex",
		flexDirection: "column",
		gap: "0.75rem",
		fontFamily: "var(--font-ui)",
		textAlign: "left",
		height: "100%",
		maxHeight: "100%",
		minHeight: 0,
		minWidth: 0,
		overflow: "hidden",
		width: "100%"
	},
	content: {
		display: "flex",
		flex: "1 1 0",
		flexDirection: "column",
		minHeight: 0,
		minWidth: 0
	},
	mapColumn: {
		boxSizing: "border-box",
		display: "flex",
		flexDirection: "column",
		minWidth: 0,
		minHeight: `${I.mapMin}rem`,
		maxHeight: `${I.mapMax}rem`,
		overflow: "hidden",
		position: "relative"
	},
	tabs: {
		background: "var(--white)",
		border: "1px solid var(--border-subtle)",
		borderRadius: "var(--radius-control)",
		display: "flex",
		flexWrap: "wrap",
		gap: "0.125rem",
		justifyContent: "flex-end",
		maxWidth: "100%",
		padding: "0.125rem",
		zIndex: 2
	},
	unavailable: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		gap: "0.75rem",
		minWidth: 0,
		maxWidth: "30rem",
		padding: "1.25rem",
		textAlign: "center",
		color: "var(--body-ink)",
		background: "var(--white)",
		border: "1px solid var(--border-card)",
		borderRadius: "var(--radius-control)"
	},
	surfaceMessages: {
		display: "flex",
		flex: "1 1 0",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "safe center",
		gap: "0.75rem",
		padding: "1rem",
		minWidth: 0,
		overflowY: "auto"
	},
	surfaceNotices: {
		flex: "0 0 auto",
		maxHeight: "35%",
		overflowY: "auto",
		padding: "0.5rem",
		minWidth: 0
	},
	plssFooter: {
		display: "flex",
		flexDirection: "column",
		gap: "0.5rem",
		minWidth: 0
	},
	plssContext: {
		margin: 0,
		color: "var(--body-ink)",
		fontSize: "0.875rem",
		fontWeight: 600,
		lineHeight: 1.5,
		overflowWrap: "anywhere"
	},
	messageTitle: {
		color: "var(--title-ink)",
		fontSize: "1.125rem",
		lineHeight: 1.3,
		margin: 0
	},
	messageContent: {
		minWidth: 0,
		maxWidth: "100%"
	},
	messageText: {
		color: "var(--body-ink)",
		fontSize: "0.875rem",
		lineHeight: 1.5,
		margin: "0.5rem 0 0",
		maxWidth: "28rem"
	},
	messageDetails: {
		marginTop: "0.5rem",
		minWidth: 0,
		maxWidth: "100%"
	},
	messageSummary: {
		alignItems: "center",
		boxSizing: "border-box",
		color: "var(--primary-dark)",
		cursor: "pointer",
		display: "inline-flex",
		gap: "0.45rem",
		listStyle: "none",
		fontSize: "0.875rem",
		minHeight: "2.75rem",
		minWidth: "2.75rem",
		padding: "0.625rem 0",
		textDecoration: "underline",
		textUnderlineOffset: "0.2em",
		maxWidth: "100%"
	},
	messageReason: {
		color: "var(--body-ink)",
		fontSize: "0.875rem",
		lineHeight: 1.5,
		margin: "0.5rem 0 0",
		overflowWrap: "anywhere",
		textAlign: "left",
		whiteSpace: "pre-wrap"
	},
	notice: {
		display: "grid",
		gridTemplateColumns: "minmax(0, 1fr)",
		alignItems: "start",
		gap: "0.5rem",
		background: "var(--accent-surface)",
		border: "1px solid var(--primary)",
		borderRadius: "var(--radius-control)",
		color: "var(--body-ink)",
		fontSize: "0.875rem",
		lineHeight: 1.5,
		padding: "0.5rem 0.75rem",
		minWidth: 0
	},
	mapDrawing: {
		display: "flex",
		flex: "1 1 0",
		minHeight: `${I.drawingMin}rem`,
		minWidth: 0,
		position: "relative"
	},
	toolbar: {
		display: "flex",
		flex: "0 0 auto",
		justifyContent: "flex-end",
		minWidth: 0
	},
	parcelTitle: {
		flex: "0 0 auto",
		fontSize: "1rem",
		fontWeight: 600,
		margin: "0 0 0.5rem",
		overflowWrap: "anywhere",
		textAlign: "center"
	},
	cellLabel: {
		display: "flex",
		flexDirection: "column",
		maxWidth: "100%",
		overflowWrap: "anywhere"
	},
	infoTitle: {
		fontSize: "inherit",
		margin: "0 0 0.5rem"
	},
	infoNote: {
		color: F.secondaryText,
		fontSize: "0.875em",
		lineHeight: 1.4,
		margin: "0.5rem 0 0",
		whiteSpace: "pre-wrap"
	},
	acreageList: {
		listStyle: "none",
		margin: 0,
		padding: 0,
		textAlign: "left"
	},
	acreageFirst: {
		display: "flex",
		alignItems: "baseline",
		gap: "0.5rem",
		fontWeight: 600
	},
	acreageSwatch: {
		flex: "0 0 auto",
		alignSelf: "center"
	},
	tabButton: {
		...Ue,
		fontFamily: "inherit",
		fontSize: "0.875rem",
		fontWeight: 600,
		padding: "0.25rem 0.65rem",
		width: "auto"
	},
	detailTabs: {
		borderBottom: "1px solid var(--border-card)",
		display: "flex",
		flex: "0 0 auto",
		flexWrap: "nowrap",
		gap: "0.75rem",
		minWidth: 0,
		overflowX: "auto",
		overflowY: "hidden",
		padding: "0.125rem 0",
		scrollbarWidth: "none"
	},
	detailTab(e) {
		return {
			alignItems: "center",
			appearance: "none",
			background: "transparent",
			border: 0,
			borderBottom: `2px solid ${e ? "var(--primary-dark)" : "transparent"}`,
			borderRadius: 0,
			boxShadow: "none",
			color: e ? "var(--primary-dark)" : "var(--text-muted)",
			cursor: "pointer",
			display: "inline-flex",
			fontFamily: "inherit",
			fontSize: "0.86rem",
			fontWeight: 700,
			gap: "0.45rem",
			lineHeight: 1.35,
			flex: "0 0 auto",
			whiteSpace: "nowrap",
			minHeight: "2.75rem",
			minWidth: 0,
			padding: "0.5rem 0.1rem",
			textAlign: "center",
			transform: "none"
		};
	},
	infoColumn: {
		boxSizing: "border-box",
		display: "flex",
		flexDirection: "column",
		gap: "0.75rem",
		minHeight: 0,
		minWidth: 0,
		flex: "0 1 auto",
		overflowWrap: "anywhere",
		textAlign: "left"
	},
	infoPanel: {
		boxSizing: "border-box",
		display: "flex",
		flex: "0 1 auto",
		flexDirection: "column",
		gap: "0.75rem",
		height: `${I.detailsHeight}rem`,
		minHeight: 0,
		overflowY: "auto",
		overflowX: "auto",
		overscrollBehavior: "contain"
	},
	divider: {
		alignItems: "center",
		background: "var(--accent-surface)",
		border: "1px solid var(--border-card)",
		borderRadius: "var(--radius-control)",
		boxSizing: "border-box",
		cursor: "row-resize",
		display: "flex",
		flex: `0 0 ${I.dividerHeight}px`,
		justifyContent: "center",
		minHeight: `${I.dividerHeight}px`,
		touchAction: "none",
		userSelect: "none"
	},
	dividerGrip: {
		background: "var(--primary-dark)",
		borderRadius: "var(--radius-pill)",
		height: "4px",
		width: "4rem"
	},
	infoCard: {
		background: "#f3f9fe",
		border: "none",
		borderRadius: "var(--radius-card)",
		color: F.text,
		fontSize: "clamp(0.875rem, 1.2vw, 1.125rem)",
		lineHeight: 1.55,
		overflowWrap: "anywhere",
		padding: "clamp(0.5rem, 1.4vw, 1.25rem)"
	},
	infoSection: {
		display: "flex",
		flex: "0 0 auto",
		flexDirection: "column",
		gap: "0.75rem",
		minWidth: 0
	},
	mapSurface: {
		backgroundColor: F.mapBg,
		backgroundImage: `url("${$n}")`,
		backgroundPosition: "center",
		backgroundRepeat: "repeat",
		backgroundSize: "48px 48px",
		border: "none",
		borderRadius: "var(--radius-card)",
		boxSizing: "border-box",
		display: "flex",
		flex: "1 1 auto",
		flexDirection: "column",
		minHeight: "min-content",
		minWidth: 0,
		overflow: "hidden",
		position: "relative",
		width: "100%"
	},
	mapFooter: {
		alignItems: "center",
		display: "flex",
		flex: "0 0 auto",
		gap: "0.75rem",
		minWidth: 0,
		padding: "0.75rem"
	},
	grid: {
		alignItems: "stretch",
		boxSizing: "border-box",
		color: F.text,
		display: "flex",
		flex: "1 1 auto",
		flexDirection: "column",
		fontFamily: "var(--font-ui)",
		fontSize: "15px",
		justifyContent: "center",
		margin: "0",
		left: "50%",
		minHeight: 0,
		overflow: "visible",
		padding: "1rem 1rem 2rem",
		position: "absolute",
		top: "50%",
		transformOrigin: "center",
		width: "100%"
	},
	northMarker: {
		alignItems: "center",
		background: "#fff",
		borderRadius: "var(--radius-control)",
		boxShadow: "var(--shadow-card)",
		color: F.text,
		display: "flex",
		flexDirection: "column",
		flexShrink: 0,
		fontSize: "1rem",
		fontWeight: 700,
		justifyContent: "center",
		minHeight: "3.25rem",
		width: "2.5rem"
	},
	parcelList: {
		boxSizing: "border-box",
		display: "flex",
		flex: "1 1 0",
		flexDirection: "column",
		gap: "1rem",
		minHeight: 0,
		minWidth: 0,
		overflow: "auto",
		overscrollBehavior: "contain",
		width: "100%"
	},
	parcelLayout: {
		boxSizing: "border-box",
		flex: "0 0 100%"
	},
	fitViewport: {
		position: "relative",
		flex: "1 1 0",
		minHeight: 0,
		minWidth: 0,
		overflow: "hidden",
		width: "100%"
	},
	annotatedBlock: {
		boxSizing: "border-box",
		paddingLeft: "1.5rem",
		position: "relative",
		width: "100%"
	},
	acreageLabels: {
		display: "flex",
		flexDirection: "column",
		gap: "0.75rem",
		marginBottom: "1.5rem",
		minWidth: 0
	},
	lotAcreage: {
		color: F.lotText,
		fontSize: I.lotBaseFontSize,
		fontWeight: 500,
		lineHeight: 1.25,
		minWidth: 0,
		overflowWrap: "anywhere",
		textAlign: "left",
		whiteSpace: "break-spaces"
	},
	acreageLeaders: {
		height: "100%",
		inset: 0,
		overflow: "visible",
		pointerEvents: "none",
		position: "absolute",
		width: "100%"
	},
	gridContent: {
		alignItems: "center",
		display: "flex",
		flex: "0 0 auto",
		flexWrap: "wrap",
		gap: `${I.gridSize * 2}px`,
		justifyContent: "center",
		minHeight: 0,
		minWidth: 0,
		overflow: "visible",
		paddingRight: "2px",
		textAlign: "center",
		width: "100%"
	},
	subdivisionWrapper: {
		boxSizing: "border-box",
		display: "inline-block",
		maxWidth: "100%",
		minWidth: 0,
		position: "relative",
		verticalAlign: "middle",
		width: `min(100%, ${I.platWidth}rem)`
	},
	subdivisionBoundary: {
		border: `2px dashed ${F.subdivisionBorder}`,
		borderRadius: "var(--radius-card)",
		boxSizing: "border-box",
		padding: "1.25rem"
	},
	subdivisionContent: {
		alignItems: "center",
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		maxWidth: "100%",
		minWidth: 0,
		position: "relative",
		width: "100%",
		gap: "0.75rem"
	},
	rowContent: { minHeight: "24rem" },
	rowBand: {
		...er,
		alignItems: "center",
		borderBottom: `1px solid ${F.subdivisionBorder}`,
		borderRadius: 0,
		borderTop: `1px solid ${F.subdivisionBorder}`,
		boxSizing: "border-box",
		color: F.text,
		display: "flex",
		fontSize: "1rem",
		fontWeight: 600,
		height: "3rem",
		justifyContent: "center",
		left: 0,
		lineHeight: 1.2,
		overflowWrap: "anywhere",
		padding: "0.25rem",
		position: "absolute",
		textAlign: "center",
		transform: "translateY(-50%)",
		width: "100%"
	},
	divisionLabels: {
		alignSelf: "center",
		display: "flex",
		flexDirection: "column",
		gap: "0.5rem",
		maxWidth: "5rem",
		overflowWrap: "anywhere"
	},
	divisionBlocks: {
		display: "flex",
		flexDirection: "column",
		gap: "0.75rem",
		minWidth: 0
	},
	blockGrid: {
		alignItems: "stretch",
		background: F.gridLine,
		border: `1px solid ${F.gridLine}`,
		borderRadius: "2px",
		boxSizing: "border-box",
		display: "grid",
		gap: "1px",
		gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
		overflow: "hidden",
		width: "100%"
	},
	blockCaption: {
		color: F.blockText,
		fontSize: "1rem",
		fontWeight: 500
	},
	lotCaption: {
		color: F.lotText,
		fontSize: "1rem",
		fontWeight: 500
	},
	subdivisionLabel: {
		color: F.subdivisionColor,
		fontSize: "1.35em",
		fontWeight: 700,
		marginBottom: "0.75rem",
		textAlign: "center"
	},
	legendFrame: {
		marginLeft: "auto",
		minWidth: 0,
		padding: "0.6rem 0.75rem",
		background: "var(--white)",
		border: `1px solid ${F.gridLine}`,
		borderRadius: "var(--radius-control)",
		boxShadow: "var(--shadow-card)",
		color: F.text,
		fontSize: "0.875rem",
		fontWeight: 400,
		maxWidth: "100%",
		boxSizing: "border-box"
	},
	legendItems: {
		display: "flex",
		flexDirection: "row",
		flexWrap: "wrap",
		gap: "0.35rem 0.75rem",
		lineHeight: "1.25rem",
		maxHeight: "2.85rem",
		overflow: "hidden"
	},
	legendItem: {
		display: "flex",
		alignItems: "center",
		flexShrink: 0,
		gap: "0.6rem",
		whiteSpace: "nowrap"
	},
	legendLabel: {
		color: F.text,
		fontSize: "0.875rem",
		fontWeight: 400
	},
	legendBox: {
		borderRadius: "0.25rem",
		flexShrink: 0,
		display: "inline-block",
		height: "0.875rem",
		verticalAlign: "middle",
		width: "0.875rem"
	},
	location: {
		boxSizing: "border-box",
		padding: "0.75rem 0.75rem 0",
		alignItems: "center",
		color: F.text,
		display: "flex",
		flex: "0 0 auto",
		fontSize: "1.35em",
		fontWeight: 600,
		minHeight: "2.5rem",
		justifyContent: "center",
		opacity: .9,
		overflow: "visible",
		overflowWrap: "anywhere",
		textAlign: "center"
	}
};
function nr(e) {
	return {
		background: e ? "transparent" : F.divisionBg,
		border: `2px solid ${F.divisionBorder}`,
		borderRadius: "var(--radius-card)",
		boxSizing: "border-box",
		display: "grid",
		gridTemplateColumns: e ? "minmax(0, 1fr)" : "auto minmax(0, 1fr)",
		gap: "0.75rem",
		minWidth: 0,
		padding: e ? 0 : "0.75rem",
		width: "100%"
	};
}
var rr = {
	color: F.divisionText,
	fontSize: "1rem",
	fontWeight: 600,
	textAlign: "left"
}, ir = {
	alignItems: "center",
	background: F.blockBg,
	border: `1px solid ${F.blockBorder}`,
	boxSizing: "border-box",
	boxShadow: "none",
	color: F.blockText,
	display: "flex",
	flexDirection: "column",
	fontWeight: 700,
	gridColumn: "2 / 4",
	gridRow: "2 / 4",
	justifyContent: "center",
	textAlign: "center"
}, ar = {
	fontSize: `${I.blockBaseFontSize}px`,
	maxWidth: "100%",
	overflowWrap: "anywhere",
	textAlign: "center"
};
function or(e, t, n) {
	return {
		alignItems: "center",
		aspectRatio: "1",
		minWidth: 0,
		minHeight: 0,
		background: e ? F.blockBg : F.lotBg,
		border: `1px solid ${e ? F.blockBorder : F.lotBorder}`,
		borderRadius: e ? 0 : "2px",
		boxSizing: "border-box",
		color: e ? F.secondaryText : F.lotText,
		display: "flex",
		flexDirection: "column",
		fontSize: `${I.lotBaseFontSize}px`,
		fontWeight: 600,
		gridColumn: t,
		gridRow: n,
		justifyContent: "center",
		lineHeight: "1.1",
		overflowWrap: "anywhere",
		overflow: "hidden",
		padding: "0.25rem",
		textAlign: "center",
		userSelect: "none"
	};
}
function sr(e, t) {
	return {
		...L.legendBox,
		background: e,
		border: `1px solid ${t}`,
		borderStyle: e === "transparent" ? "dashed" : "solid"
	};
}
var R = {
	unconfirmedRow: { background: "#fff7ed" },
	status: {
		appearance: "none",
		background: "transparent",
		border: 0,
		borderRadius: 0,
		boxShadow: "none",
		color: "inherit",
		cursor: "help",
		font: "inherit",
		minHeight: 0,
		minWidth: 0,
		padding: 0,
		transform: "none"
	},
	viewport: {
		flex: "1 1 0",
		minHeight: "min-content"
	},
	legendLine: {
		width: "2.5rem",
		flexShrink: 0,
		borderTop: `3px solid ${F.parcelLine}`
	},
	unconfirmedLine: {
		width: "2.5rem",
		flexShrink: 0,
		borderTop: `3px dashed ${F.unconfirmed}`
	},
	tieLegendLine: {
		width: "2.5rem",
		flexShrink: 0,
		borderTop: `1px dotted ${F.secondaryText}`,
		opacity: .25
	},
	drawing: {
		display: "block",
		height: "100%",
		width: "100%",
		position: "absolute",
		inset: 0,
		userSelect: "none"
	},
	notes: {
		background: L.infoCard.background,
		borderCollapse: "collapse",
		fontSize: L.lotCaption.fontSize,
		tableLayout: "fixed",
		textAlign: "left",
		width: "100%"
	},
	cell: {
		borderBottom: `1px solid ${F.gridLine}`,
		overflowWrap: "anywhere",
		padding: "0.4rem 0.25rem",
		verticalAlign: "top"
	},
	measurements: {
		display: "grid",
		gap: "0.75rem",
		margin: 0
	},
	measurementLabel: { fontWeight: 600 },
	measurementValue: {
		margin: "0.25rem 0 0",
		overflowWrap: "anywhere"
	}
}, z = "C:/GitHub/Tabularium/aurorra_index/src/features/legalmap/component/MapSurface.tsx";
function cr({ title: e, issue: t, compact: n = !1 }) {
	return /* @__PURE__ */ (0, M.jsxDEV)("section", {
		role: "note",
		"aria-label": e,
		className: n ? "legal-map-notice" : "legal-map-incomplete",
		style: n ? L.notice : L.unavailable,
		children: /* @__PURE__ */ (0, M.jsxDEV)("div", {
			style: L.messageContent,
			children: [n ? null : /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [/* @__PURE__ */ (0, M.jsxDEV)("h3", {
				style: L.messageTitle,
				children: "Map preview unavailable"
			}, void 0, !1, {
				fileName: z,
				lineNumber: 9,
				columnNumber: 9
			}, this), /* @__PURE__ */ (0, M.jsxDEV)("p", {
				style: L.messageText,
				children: "The extracted description does not contain enough information to draw this property."
			}, void 0, !1, {
				fileName: z,
				lineNumber: 10,
				columnNumber: 9
			}, this)] }, void 0, !0, {
				fileName: z,
				lineNumber: 8,
				columnNumber: 19
			}, this), /* @__PURE__ */ (0, M.jsxDEV)("details", {
				style: {
					...L.messageDetails,
					...n ? { marginTop: 0 } : {}
				},
				children: [/* @__PURE__ */ (0, M.jsxDEV)("summary", {
					style: {
						...L.messageSummary,
						...n ? {
							color: "inherit",
							textDecoration: "none"
						} : {}
					},
					children: [/* @__PURE__ */ (0, M.jsxDEV)("span", { children: n ? "Map preview is incomplete." : "Details" }, void 0, !1, {
						fileName: z,
						lineNumber: 13,
						columnNumber: 129
					}, this), /* @__PURE__ */ (0, M.jsxDEV)(Ce, { name: "expand" }, void 0, !1, {
						fileName: z,
						lineNumber: 13,
						columnNumber: 194
					}, this)]
				}, void 0, !0, {
					fileName: z,
					lineNumber: 13,
					columnNumber: 9
				}, this), /* @__PURE__ */ (0, M.jsxDEV)("p", {
					style: L.messageReason,
					children: t
				}, void 0, !1, {
					fileName: z,
					lineNumber: 14,
					columnNumber: 9
				}, this)]
			}, void 0, !0, {
				fileName: z,
				lineNumber: 12,
				columnNumber: 7
			}, this)]
		}, void 0, !0, {
			fileName: z,
			lineNumber: 7,
			columnNumber: 5
		}, this)
	}, void 0, !1, {
		fileName: z,
		lineNumber: 6,
		columnNumber: 10
	}, this);
}
function lr({ children: e, footer: t, style: n, drawingStyle: r, showNorth: i = !0, issues: a = [] }) {
	return /* @__PURE__ */ (0, M.jsxDEV)("div", {
		"data-legal-map-surface": "true",
		style: {
			...L.mapSurface,
			...n
		},
		children: [
			e && a.length > 0 ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
				style: L.surfaceNotices,
				children: a.map((e, t) => /* @__PURE__ */ (0, M.jsxDEV)(cr, {
					...e,
					compact: !0
				}, t, !1, {
					fileName: z,
					lineNumber: 29,
					columnNumber: 111
				}, this))
			}, void 0, !1, {
				fileName: z,
				lineNumber: 29,
				columnNumber: 38
			}, this) : null,
			/* @__PURE__ */ (0, M.jsxDEV)("div", {
				"data-legal-map-drawing": "true",
				style: {
					...L.mapDrawing,
					...r
				},
				children: e || /* @__PURE__ */ (0, M.jsxDEV)("div", {
					style: L.surfaceMessages,
					children: a.map((e, t) => /* @__PURE__ */ (0, M.jsxDEV)(cr, { ...e }, t, !1, {
						fileName: z,
						lineNumber: 31,
						columnNumber: 94
					}, this))
				}, void 0, !1, {
					fileName: z,
					lineNumber: 31,
					columnNumber: 20
				}, this)
			}, void 0, !1, {
				fileName: z,
				lineNumber: 30,
				columnNumber: 5
			}, this),
			i || t ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
				"data-legal-map-footer": "true",
				style: L.mapFooter,
				children: [i ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
					"data-legal-map-north": "true",
					"aria-hidden": "true",
					style: L.northMarker,
					children: [/* @__PURE__ */ (0, M.jsxDEV)("svg", {
						width: "16",
						height: "20",
						viewBox: "0 0 24 28",
						fill: "currentColor",
						children: /* @__PURE__ */ (0, M.jsxDEV)("path", { d: "M12 1 3 24l9-5 9 5z" }, void 0, !1, {
							fileName: z,
							lineNumber: 36,
							columnNumber: 11
						}, this)
					}, void 0, !1, {
						fileName: z,
						lineNumber: 35,
						columnNumber: 9
					}, this), /* @__PURE__ */ (0, M.jsxDEV)("span", { children: "N" }, void 0, !1, {
						fileName: z,
						lineNumber: 38,
						columnNumber: 9
					}, this)]
				}, void 0, !0, {
					fileName: z,
					lineNumber: 34,
					columnNumber: 20
				}, this) : null, t ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
					style: L.legendFrame,
					children: t
				}, void 0, !1, {
					fileName: z,
					lineNumber: 40,
					columnNumber: 17
				}, this) : null]
			}, void 0, !0, {
				fileName: z,
				lineNumber: 33,
				columnNumber: 28
			}, this) : null
		]
	}, void 0, !0, {
		fileName: z,
		lineNumber: 28,
		columnNumber: 10
	}, this);
}
//#endregion
//#region src/features/legalmap/component/MetesMap.tsx
var B = "C:/GitHub/Tabularium/aurorra_index/src/features/legalmap/component/MetesMap.tsx", ur = 2;
function dr({ scenes: e }) {
	let t = D(null), [n, r] = O(1), [i, a] = O(null), o = e.flatMap((e) => e.items), s = [{
		x: 0,
		y: 0
	}, ...o.flatMap((e) => {
		let t = [e.from, e.to];
		if (e.arc) {
			let { center: n, radius: r, sweep: i, turn: a } = e.arc, o = Math.atan2(e.from.y - n.y, e.from.x - n.x);
			for (let e of [
				0,
				Math.PI / 2,
				Math.PI,
				Math.PI * 1.5
			]) (a * (e - o) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) <= i && t.push({
				x: n.x + r * Math.cos(e),
				y: n.y + r * Math.sin(e)
			});
		}
		return t;
	})], c = Math.min(...s.map((e) => e.x)), l = Math.max(...s.map((e) => e.x)), u = Math.min(...s.map((e) => e.y)), d = Math.max(...s.map((e) => e.y)), f = Math.max(l - c, +(d === u)), p = Math.max(d - u, +(l === c)), m = f / I.parcelScale + I.labelInset * 2 / n, h = p / I.parcelScale + I.labelInset * 2 / n, g = {
		x: (c + l - m) / 2,
		y: (u + d - h) / 2,
		width: m,
		height: h
	}, _ = I.lotBaseFontSize / n;
	return pe(() => {
		let e = t.current, n = () => {
			let { width: t, height: n } = e.getBoundingClientRect();
			if (t === 0 || n === 0) return;
			r(Math.min((t - I.labelInset * 2) / f, (n - I.labelInset * 2) / p) * I.parcelScale);
			let a = e.getScreenCTM?.();
			if (a) {
				let t = e.getBoundingClientRect(), n = a.inverse(), r = [...e.querySelectorAll("[data-survey-point], [data-survey-arrow]")].map((e) => e.getBoundingClientRect()), o = [...e.querySelectorAll("line[data-survey-line], line[data-survey-reference]")].map((e) => ({
					from: new DOMPoint(e.x1.baseVal.value, e.y1.baseVal.value).matrixTransform(a),
					to: new DOMPoint(e.x2.baseVal.value, e.y2.baseVal.value).matrixTransform(a)
				})), s = [...e.querySelectorAll("[data-survey-label]"), ...e.querySelectorAll("[data-survey-vertex]")], c = i && e.contains(i) ? i.parentElement.querySelector("[data-survey-vertex]") : null;
				c && (s.splice(s.indexOf(c), 1), s.unshift(c));
				for (let e of s) {
					let i = e.hasAttribute("data-survey-vertex") ? e.parentElement.querySelector("[data-survey-leader]") : null;
					e.removeAttribute("transform"), i && (i.style.visibility = "hidden");
					let s = e.getBoundingClientRect(), c = [{
						x: s.left,
						y: s.top
					}];
					for (let e = t.top + ur; e + s.height <= t.bottom - ur; e += s.height + ur * 2) for (let n = t.left + ur; n + s.width <= t.right - ur; n += s.width + ur * 2) c.push({
						x: n,
						y: e
					});
					c.sort((e, t) => Math.hypot(e.x - s.left, e.y - s.top) - Math.hypot(t.x - s.left, t.y - s.top));
					let l = c.find(({ x: e, y: n }) => e >= t.left && n >= t.top && e + s.width <= t.right && n + s.height <= t.bottom && !r.some((t) => e < t.right + ur && e + s.width > t.left - ur && n < t.bottom + ur && n + s.height > t.top - ur) && !o.some(({ from: t, to: r }) => {
						let i = e - ur, a = e + s.width + ur, o = n - ur, c = n + s.height + ur, l = r.x - t.x, u = r.y - t.y;
						return [t, r].some((e) => e.x >= i && e.x <= a && e.y >= o && e.y <= c) || [i, a].some((e) => l !== 0 && (e - t.x) / l >= 0 && (e - t.x) / l <= 1 && t.y + (e - t.x) / l * u >= o && t.y + (e - t.x) / l * u <= c) || [o, c].some((e) => u !== 0 && (e - t.y) / u >= 0 && (e - t.y) / u <= 1 && t.x + (e - t.y) / u * l >= i && t.x + (e - t.y) / u * l <= a);
					}));
					if (e.style.visibility = l ? "visible" : "hidden", l && (r.push(new DOMRect(l.x, l.y, s.width, s.height)), l.x !== s.left || l.y !== s.top)) {
						let t = new DOMPoint(l.x - s.left, l.y - s.top).matrixTransform(new DOMMatrix([
							n.a,
							n.b,
							n.c,
							n.d,
							0,
							0
						]));
						if (e.setAttribute("transform", `translate(${t.x} ${t.y})`), i) {
							let t = e.parentElement.querySelector("[data-survey-point]"), r = new DOMPoint(t.cx.baseVal.value, t.cy.baseVal.value).matrixTransform(a), o = new DOMPoint(Math.max(l.x, Math.min(l.x + s.width, r.x)), Math.max(l.y, Math.min(l.y + s.height, r.y))).matrixTransform(n);
							i.setAttribute("x2", String(o.x)), i.setAttribute("y2", String(o.y)), i.style.visibility = "visible";
						}
					}
				}
			}
		};
		n();
		let a = new ResizeObserver(n);
		return a.observe(e), () => a.disconnect();
	}, [
		g.width,
		g.height,
		f,
		p,
		_,
		e,
		i
	]), /* @__PURE__ */ (0, M.jsxDEV)(lr, {
		issues: e.filter((e) => e.issue).map((e) => ({
			title: e.title,
			issue: e.issue
		})),
		style: R.viewport,
		footer: /* @__PURE__ */ (0, M.jsxDEV)("div", {
			"aria-label": "Map legend",
			className: "legal-map-legend",
			style: L.legendItems,
			children: [
				/* @__PURE__ */ (0, M.jsxDEV)("span", {
					style: L.legendItem,
					children: [/* @__PURE__ */ (0, M.jsxDEV)("span", { style: R.legendLine }, void 0, !1, {
						fileName: B,
						lineNumber: 106,
						columnNumber: 47
					}, this), /* @__PURE__ */ (0, M.jsxDEV)("span", { children: "Parcel boundary" }, void 0, !1, {
						fileName: B,
						lineNumber: 106,
						columnNumber: 87
					}, this)]
				}, void 0, !0, {
					fileName: B,
					lineNumber: 106,
					columnNumber: 7
				}, this),
				o.some((e) => !e.confirmed) ? /* @__PURE__ */ (0, M.jsxDEV)("span", {
					style: L.legendItem,
					children: [/* @__PURE__ */ (0, M.jsxDEV)("span", { style: R.unconfirmedLine }, void 0, !1, {
						fileName: B,
						lineNumber: 107,
						columnNumber: 86
					}, this), /* @__PURE__ */ (0, M.jsxDEV)("span", { children: "Unconfirmed" }, void 0, !1, {
						fileName: B,
						lineNumber: 107,
						columnNumber: 131
					}, this)]
				}, void 0, !0, {
					fileName: B,
					lineNumber: 107,
					columnNumber: 46
				}, this) : null,
				e.some((e) => e.beginning !== void 0 && e.beginning > 0) ? /* @__PURE__ */ (0, M.jsxDEV)("span", {
					style: L.legendItem,
					children: [/* @__PURE__ */ (0, M.jsxDEV)("span", { style: R.tieLegendLine }, void 0, !1, {
						fileName: B,
						lineNumber: 108,
						columnNumber: 125
					}, this), /* @__PURE__ */ (0, M.jsxDEV)("span", { children: "Tie line" }, void 0, !1, {
						fileName: B,
						lineNumber: 108,
						columnNumber: 168
					}, this)]
				}, void 0, !0, {
					fileName: B,
					lineNumber: 108,
					columnNumber: 85
				}, this) : null
			]
		}, void 0, !0, {
			fileName: B,
			lineNumber: 105,
			columnNumber: 165
		}, this),
		children: /* @__PURE__ */ (0, M.jsxDEV)("svg", {
			ref: t,
			role: "img",
			"aria-label": e[0].title + " schematic",
			viewBox: [
				g.x,
				g.y,
				g.width,
				g.height
			].join(" "),
			style: R.drawing,
			children: e.map((e, t) => {
				let r = e.items, i = e.beginning, o = e.closed ? r.filter((t) => t.sequence > i && t.sequence <= e.ending) : [], s = o[0]?.from, c = r.flatMap((e, t) => {
					let n = r[t - 1];
					return [...n && n.sequence + 1 !== e.sequence ? [{
						point: n.to,
						number: n.sequence + 1
					}] : [], {
						point: e.from,
						number: e.sequence
					}];
				}).concat(r.length === 0 || r.at(-1).sequence === e.ending ? [] : [{
					point: r.at(-1).to,
					number: r.at(-1).sequence + 1
				}]);
				return /* @__PURE__ */ (0, M.jsxDEV)("g", {
					"data-survey-group": t + 1,
					children: [
						r.length > 0 ? /* @__PURE__ */ (0, M.jsxDEV)("line", {
							"data-survey-reference": "true",
							x1: r[0].from.x,
							y1: g.y,
							x2: r[0].from.x,
							y2: g.y + g.height,
							stroke: F.secondaryText,
							strokeWidth: "1",
							strokeDasharray: "6 4",
							vectorEffect: "non-scaling-stroke"
						}, void 0, !1, {
							fileName: B,
							lineNumber: 124,
							columnNumber: 33
						}, this) : null,
						s ? /* @__PURE__ */ (0, M.jsxDEV)("path", {
							"data-boundary-fill": "true",
							d: "M " + s.x + " " + s.y + " " + o.map((e) => "L " + e.to.x + " " + e.to.y).join(" ") + " Z",
							fill: F.parcelFill,
							fillOpacity: e.schematic ? "0.12" : "0.25"
						}, void 0, !1, {
							fileName: B,
							lineNumber: 125,
							columnNumber: 23
						}, this) : null,
						e.items.map((e, t) => {
							let r = i !== void 0 && e.sequence <= i, a = e.arc ? Math.atan2(e.from.y - e.arc.center.y, e.from.x - e.arc.center.x) + e.arc.turn * e.arc.sweep / 2 : Math.atan2(e.to.y - e.from.y, e.to.x - e.from.x), o = e.arc ? {
								x: e.arc.center.x + e.arc.radius * Math.cos(a),
								y: e.arc.center.y + e.arc.radius * Math.sin(a)
							} : {
								x: (e.from.x + e.to.x) / 2,
								y: (e.from.y + e.to.y) / 2
							}, s = Math.min(8 / n, (e.arc ? e.arc.radius * e.arc.sweep : Math.hypot(e.to.x - e.from.x, e.to.y - e.from.y)) / 4), c = {
								"data-survey-line": "true",
								"data-survey-tie": r ? "true" : void 0,
								"data-unconfirmed": e.confirmed ? void 0 : "true",
								stroke: r ? F.secondaryText : e.confirmed ? F.parcelLine : F.unconfirmed,
								strokeWidth: r ? 1 : 3,
								strokeDasharray: r ? "1 5" : e.confirmed ? void 0 : "6 4",
								strokeLinecap: r ? "round" : void 0,
								strokeOpacity: r ? .25 : void 0,
								vectorEffect: "non-scaling-stroke"
							};
							return /* @__PURE__ */ (0, M.jsxDEV)("g", { children: [
								/* @__PURE__ */ (0, M.jsxDEV)("title", { children: e.detail }, void 0, !1, {
									fileName: B,
									lineNumber: 147,
									columnNumber: 17
								}, this),
								e.arc ? /* @__PURE__ */ (0, M.jsxDEV)("path", {
									...c,
									"data-survey-arc": "true",
									d: `M ${e.from.x} ${e.from.y} A ${e.arc.radius} ${e.arc.radius} 0 ${+(e.arc.sweep > Math.PI)} ${+(e.arc.turn === 1)} ${e.to.x} ${e.to.y}`,
									fill: "none"
								}, void 0, !1, {
									fileName: B,
									lineNumber: 148,
									columnNumber: 29
								}, this) : /* @__PURE__ */ (0, M.jsxDEV)("line", {
									...c,
									x1: e.from.x,
									y1: e.from.y,
									x2: e.to.x,
									y2: e.to.y
								}, void 0, !1, {
									fileName: B,
									lineNumber: 149,
									columnNumber: 21
								}, this),
								/* @__PURE__ */ (0, M.jsxDEV)("path", {
									"data-survey-arrow": e.sequence,
									d: "M -1 -0.6 L 0 0 L -1 0.6",
									fill: "none",
									transform: `translate(${o.x} ${o.y}) rotate(${(a + (e.arc ? e.arc.turn * Math.PI / 2 : 0)) * 180 / Math.PI}) scale(${s})`,
									stroke: c.stroke,
									strokeWidth: c.strokeWidth,
									strokeOpacity: c.strokeOpacity,
									strokeLinecap: "round",
									vectorEffect: "non-scaling-stroke",
									"aria-hidden": "true",
									pointerEvents: "none"
								}, void 0, !1, {
									fileName: B,
									lineNumber: 150,
									columnNumber: 17
								}, this)
							] }, t, !0, {
								fileName: B,
								lineNumber: 146,
								columnNumber: 22
							}, this);
						}),
						c.map(({ point: e, number: o }, s) => {
							let c = s === 0 && i !== void 0 && i > 0 && r.some((t) => t.sequence === i && e.x > t.to.x);
							return /* @__PURE__ */ (0, M.jsxDEV)("g", { children: [
								/* @__PURE__ */ (0, M.jsxDEV)("line", {
									"data-survey-leader": o,
									x1: e.x,
									y1: e.y,
									x2: e.x,
									y2: e.y,
									stroke: F.secondaryText,
									strokeWidth: "1",
									vectorEffect: "non-scaling-stroke",
									style: {
										visibility: "hidden",
										pointerEvents: "none"
									}
								}, void 0, !1, {
									fileName: B,
									lineNumber: 159,
									columnNumber: 17
								}, this),
								/* @__PURE__ */ (0, M.jsxDEV)("circle", {
									"data-survey-point": o,
									cx: e.x,
									cy: e.y,
									r: 2.5 / n,
									fill: F.parcelLine,
									tabIndex: 0,
									role: "img",
									"aria-label": `Group ${t + 1}, point ${o}`,
									stroke: "transparent",
									strokeWidth: 12 / n,
									onMouseEnter: (e) => a(e.currentTarget),
									onMouseLeave: (e) => {
										document.activeElement !== e.currentTarget && a(null);
									},
									onFocus: (e) => a(e.currentTarget),
									onBlur: () => a(null)
								}, void 0, !1, {
									fileName: B,
									lineNumber: 160,
									columnNumber: 17
								}, this),
								/* @__PURE__ */ (0, M.jsxDEV)("text", {
									"data-survey-vertex": o,
									x: e.x + _ / 2,
									y: e.y - _ / 2,
									fontSize: _,
									fill: F.text,
									children: o
								}, void 0, !1, {
									fileName: B,
									lineNumber: 164,
									columnNumber: 17
								}, this),
								i !== void 0 && (o === i + 1 || s === 0 && i > 0) ? /* @__PURE__ */ (0, M.jsxDEV)("text", {
									"data-survey-label": "true",
									x: e.x + (c ? 1 : -1) * _ * .75,
									y: e.y + _ / 3,
									fontSize: _,
									textAnchor: c ? "start" : "end",
									fill: F.parcelLine,
									children: o === i + 1 ? "POB" : "POC"
								}, void 0, !1, {
									fileName: B,
									lineNumber: 165,
									columnNumber: 108
								}, this) : null
							] }, s, !0, {
								fileName: B,
								lineNumber: 158,
								columnNumber: 22
							}, this);
						})
					]
				}, t, !0, {
					fileName: B,
					lineNumber: 123,
					columnNumber: 18
				}, this);
			})
		}, void 0, !1, {
			fileName: B,
			lineNumber: 110,
			columnNumber: 7
		}, this)
	}, void 0, !1, {
		fileName: B,
		lineNumber: 105,
		columnNumber: 10
	}, this);
}
//#endregion
//#region src/features/legalmap/component/PlssMap.tsx
var V = "C:/GitHub/Tabularium/aurorra_index/src/features/legalmap/component/PlssMap.tsx";
function fr({ scenes: e }) {
	let t = E(), n = D(null), [r, i] = O(1), [a, o] = O(I.lotBaseFontSize), s = e.flatMap((e) => e.items), c = /* @__PURE__ */ new Map();
	for (let e of s) {
		if (e.role !== "section" || !e.highlighted) continue;
		let t = `${e.x}:${e.y}:${e.label}`;
		c.set(t, e);
	}
	let l = [...c.values()].flatMap((e) => [{
		x: e.x,
		y: e.y
	}, {
		x: e.x + e.width,
		y: e.y + e.height
	}]), u = Math.min(...l.map((e) => e.x)), d = Math.max(...l.map((e) => e.x)), f = Math.min(...l.map((e) => e.y)), p = Math.max(...l.map((e) => e.y)), m = Math.max(d - u, p - f, 1), h = d - u + m * .32, g = p - f + m * .32, _ = {
		x: (u + d - h) / 2,
		y: (f + p - g) / 2,
		width: h,
		height: g
	}, v = a / r, y = [...new Set(e.flatMap((e) => e.notes).filter((e) => e.label === "Township" || e.label === "Range").map((e) => e.label + " " + pt(e.value, e.label === "Township" ? "town(?:ship)?" : "range").replace(/\b(NORTH|SOUTH|EAST|WEST)\b/gi, (e) => e[0].toUpperCase() + e.slice(1).toLowerCase())))].join(" · ");
	return pe(() => {
		let e = n.current, t = () => {
			let { width: t, height: n } = e.getBoundingClientRect();
			t === 0 || n === 0 || (i(Math.min(t / _.width, n / _.height)), o(parseFloat(getComputedStyle(document.documentElement).fontSize)));
		};
		t();
		let r = new ResizeObserver(t);
		return r.observe(e), () => r.disconnect();
	}, [
		_.width,
		_.height,
		e
	]), /* @__PURE__ */ (0, M.jsxDEV)(lr, {
		issues: e.filter((e) => e.issue).map((e) => ({
			title: e.title,
			issue: e.issue
		})),
		style: R.viewport,
		footer: /* @__PURE__ */ (0, M.jsxDEV)("div", {
			style: L.plssFooter,
			children: [y ? /* @__PURE__ */ (0, M.jsxDEV)("p", {
				id: t + "-context",
				"data-survey-context": "true",
				style: L.plssContext,
				children: y
			}, void 0, !1, {
				fileName: V,
				lineNumber: 48,
				columnNumber: 18
			}, this) : null, /* @__PURE__ */ (0, M.jsxDEV)("div", {
				"aria-label": "Map legend",
				className: "legal-map-legend",
				style: L.legendItems,
				children: [/* @__PURE__ */ (0, M.jsxDEV)("span", {
					style: L.legendItem,
					children: [/* @__PURE__ */ (0, M.jsxDEV)("span", { style: sr("#b6e3f5", F.parcelLine) }, void 0, !1, {
						fileName: V,
						lineNumber: 50,
						columnNumber: 47
					}, this), /* @__PURE__ */ (0, M.jsxDEV)("span", {
						style: L.legendLabel,
						children: s.some((e) => e.role === "area" && e.partial) ? "Partial area" : "Described area"
					}, void 0, !1, {
						fileName: V,
						lineNumber: 50,
						columnNumber: 116
					}, this)]
				}, void 0, !0, {
					fileName: V,
					lineNumber: 50,
					columnNumber: 7
				}, this), /* @__PURE__ */ (0, M.jsxDEV)("span", {
					style: L.legendItem,
					children: [/* @__PURE__ */ (0, M.jsxDEV)("span", { style: sr(F.divisionBg, F.blockBorder) }, void 0, !1, {
						fileName: V,
						lineNumber: 51,
						columnNumber: 47
					}, this), /* @__PURE__ */ (0, M.jsxDEV)("span", {
						style: L.legendLabel,
						children: "Section"
					}, void 0, !1, {
						fileName: V,
						lineNumber: 51,
						columnNumber: 133
					}, this)]
				}, void 0, !0, {
					fileName: V,
					lineNumber: 51,
					columnNumber: 7
				}, this)]
			}, void 0, !0, {
				fileName: V,
				lineNumber: 49,
				columnNumber: 7
			}, this)]
		}, void 0, !0, {
			fileName: V,
			lineNumber: 47,
			columnNumber: 165
		}, this),
		children: /* @__PURE__ */ (0, M.jsxDEV)("svg", {
			ref: n,
			role: "img",
			"aria-label": e[0].title + " schematic",
			"aria-describedby": y ? t + "-context" : void 0,
			viewBox: [
				_.x,
				_.y,
				_.width,
				_.height
			].join(" "),
			style: R.drawing,
			children: [
				/* @__PURE__ */ (0, M.jsxDEV)("defs", { children: /* @__PURE__ */ (0, M.jsxDEV)("pattern", {
					id: t + "-partial",
					width: v,
					height: v,
					patternUnits: "userSpaceOnUse",
					patternTransform: "rotate(45)",
					children: [/* @__PURE__ */ (0, M.jsxDEV)("rect", {
						width: v,
						height: v,
						fill: "#cdebf5"
					}, void 0, !1, {
						fileName: V,
						lineNumber: 55,
						columnNumber: 11
					}, this), /* @__PURE__ */ (0, M.jsxDEV)("line", {
						x1: "0",
						y1: "0",
						x2: "0",
						y2: v,
						stroke: "#369ac2",
						strokeWidth: v / 6,
						opacity: "0.45"
					}, void 0, !1, {
						fileName: V,
						lineNumber: 56,
						columnNumber: 11
					}, this)]
				}, void 0, !0, {
					fileName: V,
					lineNumber: 54,
					columnNumber: 15
				}, this) }, void 0, !1, {
					fileName: V,
					lineNumber: 54,
					columnNumber: 9
				}, this),
				[...c.values()].map((e) => /* @__PURE__ */ (0, M.jsxDEV)("g", { children: [/* @__PURE__ */ (0, M.jsxDEV)("rect", {
					"data-survey-section-area": e.label,
					x: e.x,
					y: e.y,
					width: e.width,
					height: e.height,
					fill: F.divisionBg,
					stroke: F.blockBorder,
					strokeWidth: "1.5",
					vectorEffect: "non-scaling-stroke"
				}, void 0, !1, {
					fileName: V,
					lineNumber: 59,
					columnNumber: 11
				}, this), /* @__PURE__ */ (0, M.jsxDEV)("path", {
					"data-plss-quarter-guide": "true",
					d: `M ${e.x + e.width / 2} ${e.y} v ${e.height} M ${e.x} ${e.y + e.height / 2} h ${e.width}`,
					fill: "none",
					stroke: F.blockBorder,
					strokeWidth: "1",
					strokeDasharray: "4 4",
					vectorEffect: "non-scaling-stroke"
				}, void 0, !1, {
					fileName: V,
					lineNumber: 60,
					columnNumber: 11
				}, this)] }, `${e.x}:${e.y}:${e.label}`, !0, {
					fileName: V,
					lineNumber: 58,
					columnNumber: 45
				}, this)),
				e.map((e, n) => /* @__PURE__ */ (0, M.jsxDEV)("g", {
					"data-survey-group": n + 1,
					children: e.items.map((e, n) => {
						if (e.role === "section") return null;
						let i = Math.min(v, (e.width - 8 / r) / 4, (e.height - 8 / r) / 3), a = e.caption ? Math.min(i * I.amp, (e.width - 8 / r) / e.caption.length) : i;
						return /* @__PURE__ */ (0, M.jsxDEV)("g", { children: [
							/* @__PURE__ */ (0, M.jsxDEV)("title", { children: e.detail }, void 0, !1, {
								fileName: V,
								lineNumber: 68,
								columnNumber: 17
							}, this),
							/* @__PURE__ */ (0, M.jsxDEV)("rect", {
								"data-survey-area": e.role === "area" ? "true" : void 0,
								"data-survey-partial": e.partial ? "true" : void 0,
								x: e.x,
								y: e.y,
								width: e.width,
								height: e.height,
								fill: e.role === "area" ? e.partial ? "url(#" + t + "-partial)" : "#b6e3f5" : "none",
								fillOpacity: e.role === "area" ? .8 : .35,
								stroke: e.role === "area" ? F.parcelLine : "#8c999b",
								strokeDasharray: e.role === "area" && !e.partial ? void 0 : "4 3",
								strokeWidth: e.role === "area" ? 3 : 1,
								vectorEffect: "non-scaling-stroke"
							}, void 0, !1, {
								fileName: V,
								lineNumber: 69,
								columnNumber: 17
							}, this),
							e.role === "area" && Math.min(i, a) * r >= 12 ? /* @__PURE__ */ (0, M.jsxDEV)("text", {
								x: e.x + e.width / 2,
								y: e.y + e.height / 2,
								textAnchor: "middle",
								fontSize: i * I.amp,
								fill: F.text,
								pointerEvents: "none",
								children: [e.caption ? /* @__PURE__ */ (0, M.jsxDEV)("tspan", {
									x: e.x + e.width / 2,
									dy: "-0.3em",
									fontSize: a,
									children: e.caption
								}, void 0, !1, {
									fileName: V,
									lineNumber: 75,
									columnNumber: 35
								}, this) : null, /* @__PURE__ */ (0, M.jsxDEV)("tspan", {
									x: e.x + e.width / 2,
									dy: "1.2em",
									fontSize: i,
									fontWeight: L.lotCaption.fontWeight,
									children: e.partial ? "Partial area" : "Described area"
								}, void 0, !1, {
									fileName: V,
									lineNumber: 76,
									columnNumber: 19
								}, this)]
							}, void 0, !0, {
								fileName: V,
								lineNumber: 74,
								columnNumber: 91
							}, this) : null
						] }, n, !0, {
							fileName: V,
							lineNumber: 67,
							columnNumber: 22
						}, this);
					})
				}, n, !1, {
					fileName: V,
					lineNumber: 62,
					columnNumber: 39
				}, this)),
				[...c.values()].map((e) => /* @__PURE__ */ (0, M.jsxDEV)("g", { children: /* @__PURE__ */ (0, M.jsxDEV)("text", {
					"data-survey-section": e.label,
					x: e.x + e.width / 2,
					y: e.y + e.height * .12 + 2 / r,
					dominantBaseline: "hanging",
					textAnchor: "middle",
					fontSize: Math.min(v * I.amp, e.height / 4),
					fontWeight: ir.fontWeight,
					fill: F.text,
					children: e.label === "Section" ? e.label : `Section ${e.label}`
				}, void 0, !1, {
					fileName: V,
					lineNumber: 82,
					columnNumber: 11
				}, this) }, `${e.x}:${e.y}:${e.label}`, !1, {
					fileName: V,
					lineNumber: 81,
					columnNumber: 45
				}, this))
			]
		}, void 0, !0, {
			fileName: V,
			lineNumber: 53,
			columnNumber: 7
		}, this)
	}, void 0, !1, {
		fileName: V,
		lineNumber: 47,
		columnNumber: 10
	}, this);
}
//#endregion
//#region src/features/legalmap/hook/usePlatFit.ts
function pr(e) {
	let t = D(null), n = D(null);
	return pe(() => {
		let e = t.current, r = n.current;
		if (!e || !r) return;
		let i = e.parentElement, a = () => {
			let t = e.clientWidth, n = e.clientHeight;
			if (t === 0 || n === 0) return;
			let a = I.platWidth * Number.parseFloat(getComputedStyle(document.documentElement).fontSize), o = t < a;
			if (e.dataset.platScroll = String(o), e.tabIndex = o ? 0 : -1, e.style.flex = o ? "0 0 auto" : "1 1 0", e.style.overflowX = o ? "auto" : "hidden", e.style.overflowY = "hidden", r.style.width = `${o ? a : t}px`, r.style.position = o ? "relative" : "absolute", r.style.left = o ? "0" : "50%", r.style.top = o ? "0" : "50%", o) {
				r.style.transform = "none", e.style.minHeight = `${r.offsetHeight}px`, i.style.minHeight = `${r.offsetHeight}px`;
				return;
			}
			e.style.minHeight = "0", i.style.minHeight = `${I.drawingMin}rem`, e.scrollLeft = 0;
			let s = Math.min(t / r.offsetWidth, n / r.offsetHeight);
			r.style.transform = `translate(-50%, -50%) scale(${s})`;
		};
		a();
		let o = new ResizeObserver(a);
		return o.observe(e), o.observe(r), () => o.disconnect();
	}, [e]), {
		viewportRef: t,
		contentRef: n
	};
}
//#endregion
//#region src/features/legalmap/component/PlatMap.tsx
var H = "C:/GitHub/Tabularium/aurorra_index/src/features/legalmap/component/PlatMap.tsx", mr = [
	[1, 1],
	[1, 2],
	[1, 3],
	[1, 4],
	[2, 4],
	[3, 4],
	[4, 4],
	[4, 3],
	[4, 2],
	[4, 1],
	[3, 1],
	[2, 1]
], hr = [
	[2, 2],
	[2, 3],
	[3, 2],
	[3, 3]
];
function gr({ lot: e, gridColumn: t, gridRow: n }) {
	let r = !e || !e.filled;
	return /* @__PURE__ */ (0, M.jsxDEV)("span", {
		"data-legal-map-lot": r ? void 0 : "true",
		"data-legal-map-empty": e && r ? "true" : void 0,
		title: e && !r ? e.detail : void 0,
		"data-lot-slot": r ? void 0 : `${n}-${t}`,
		style: or(r, t, n),
		children: e && !r ? /* @__PURE__ */ (0, M.jsxDEV)("span", {
			"data-map-label": "true",
			style: L.cellLabel,
			children: [/* @__PURE__ */ (0, M.jsxDEV)("span", { children: pt(e.name, e.kind) }, void 0, !1, {
				fileName: H,
				lineNumber: 27,
				columnNumber: 9
			}, this), /* @__PURE__ */ (0, M.jsxDEV)("span", {
				style: L.lotCaption,
				children: e.detail ?? `${Et[e.kind]}${e.name.includes("–") ? "s" : ""}`
			}, void 0, !1, {
				fileName: H,
				lineNumber: 28,
				columnNumber: 9
			}, this)]
		}, void 0, !0, {
			fileName: H,
			lineNumber: 26,
			columnNumber: 24
		}, this) : null
	}, void 0, !1, {
		fileName: H,
		lineNumber: 25,
		columnNumber: 5
	}, this);
}
function _r({ block: e }) {
	let t = D(null), [n, r] = O([]), i = wt.flatMap((t) => {
		let n = t === "block" ? e.name : e[t];
		return n ? [{
			kind: t,
			value: n
		}] : [];
	}), a = At(e.lots), o = a.flatMap((e, t) => e.acreage?.map((e) => ({
		value: e,
		slot: mr[t].join("-")
	})) ?? []);
	return pe(() => {
		let e = t.current, n = () => {
			let t = e.getBoundingClientRect();
			if (t.width === 0 || t.height === 0) return;
			for (let t of e.querySelectorAll("[data-map-label]")) {
				let e = t.parentElement.getBoundingClientRect(), n = t.getBoundingClientRect();
				t.style.visibility = n.width <= e.width && n.height <= e.height ? "visible" : "hidden";
			}
			let n = [...e.querySelectorAll("[data-lot-acreage]")];
			n.length > 0 && r(n.map((r, i) => {
				let a = t.width / e.offsetWidth, o = e.querySelector(`[data-lot-slot="${r.dataset.acreageSlot}"]`).getBoundingClientRect(), s = r.getBoundingClientRect(), c = (o.x + o.width / 8 - t.x) / a, l = (o.y + o.height / 4 - t.y) / a, u = (s.x - t.x) / a, d = (s.y + s.height / 2 - t.y) / a, f = u * (i + 1) / (n.length + 1);
				return {
					x: c,
					y: l,
					points: `${u - 4},${d} ${f},${d} ${f},${l} ${c},${l}`
				};
			}));
		};
		n();
		let i = new ResizeObserver(n);
		i.observe(e);
		for (let t of e.querySelectorAll("[data-map-label]")) i.observe(t);
		return () => i.disconnect();
	}, [e]), /* @__PURE__ */ (0, M.jsxDEV)("div", {
		ref: t,
		style: o.length > 0 ? L.annotatedBlock : void 0,
		children: [o.length > 0 ? /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [/* @__PURE__ */ (0, M.jsxDEV)("div", {
			style: L.acreageLabels,
			children: o.map(({ value: e, slot: t }, n) => /* @__PURE__ */ (0, M.jsxDEV)("span", {
				"data-lot-acreage": "true",
				"data-acreage-slot": t,
				style: L.lotAcreage,
				children: e
			}, n, !1, {
				fileName: H,
				lineNumber: 78,
				columnNumber: 51
			}, this))
		}, void 0, !1, {
			fileName: H,
			lineNumber: 77,
			columnNumber: 7
		}, this), /* @__PURE__ */ (0, M.jsxDEV)("svg", {
			"aria-hidden": "true",
			style: L.acreageLeaders,
			children: o.map((e, t) => /* @__PURE__ */ (0, M.jsxDEV)("g", { children: [/* @__PURE__ */ (0, M.jsxDEV)("polyline", {
				"data-acreage-leader": "true",
				points: n[t]?.points,
				fill: "none",
				stroke: F.lotBorder,
				strokeWidth: "1",
				vectorEffect: "non-scaling-stroke"
			}, void 0, !1, {
				fileName: H,
				lineNumber: 82,
				columnNumber: 11
			}, this), n[t] ? /* @__PURE__ */ (0, M.jsxDEV)("circle", {
				"data-acreage-point": "true",
				cx: n[t].x,
				cy: n[t].y,
				r: "2.5",
				fill: F.lotBorder
			}, void 0, !1, {
				fileName: H,
				lineNumber: 83,
				columnNumber: 29
			}, this) : null] }, t, !0, {
				fileName: H,
				lineNumber: 81,
				columnNumber: 37
			}, this))
		}, void 0, !1, {
			fileName: H,
			lineNumber: 80,
			columnNumber: 7
		}, this)] }, void 0, !0, {
			fileName: H,
			lineNumber: 76,
			columnNumber: 28
		}, this) : null, /* @__PURE__ */ (0, M.jsxDEV)("div", {
			"data-legal-map-block": "true",
			style: L.blockGrid,
			children: [i.length > 0 ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
				style: ir,
				children: /* @__PURE__ */ (0, M.jsxDEV)("div", {
					"data-map-label": "true",
					style: L.cellLabel,
					children: i.map((e) => /* @__PURE__ */ (0, M.jsxDEV)(de, { children: [/* @__PURE__ */ (0, M.jsxDEV)("div", {
						"data-legal-map-block-label": e.kind === "block" ? "true" : void 0,
						"data-legal-map-tract-label": e.kind === "tract" ? "true" : void 0,
						"data-legal-map-building-label": e.kind === "building" ? "true" : void 0,
						style: ar,
						children: pt(e.value, e.kind)
					}, void 0, !1, {
						fileName: H,
						lineNumber: 91,
						columnNumber: 13
					}, this), /* @__PURE__ */ (0, M.jsxDEV)("span", {
						style: L.blockCaption,
						children: ze(e.kind)
					}, void 0, !1, {
						fileName: H,
						lineNumber: 92,
						columnNumber: 13
					}, this)] }, e.kind, !0, {
						fileName: H,
						lineNumber: 90,
						columnNumber: 32
					}, this))
				}, void 0, !1, {
					fileName: H,
					lineNumber: 89,
					columnNumber: 9
				}, this)
			}, void 0, !1, {
				fileName: H,
				lineNumber: 88,
				columnNumber: 28
			}, this) : null, [...mr, ...i.length === 0 ? hr : []].map(([e, t], n) => /* @__PURE__ */ (0, M.jsxDEV)(gr, {
				lot: a[n] ?? null,
				gridColumn: String(t),
				gridRow: e
			}, n, !1, {
				fileName: H,
				lineNumber: 98,
				columnNumber: 16
			}, this))]
		}, void 0, !0, {
			fileName: H,
			lineNumber: 87,
			columnNumber: 5
		}, this)]
	}, void 0, !0, {
		fileName: H,
		lineNumber: 75,
		columnNumber: 10
	}, this);
}
function vr({ division: e }) {
	let t = Ct.filter((t) => !gt(e[t]));
	return /* @__PURE__ */ (0, M.jsxDEV)("div", {
		"data-legal-map-division": "true",
		style: nr(t.length === 0),
		children: [t.length > 0 ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
			style: L.divisionLabels,
			children: t.map((t) => /* @__PURE__ */ (0, M.jsxDEV)("div", {
				style: rr,
				children: `${ze(t)} ${pt(e[t], t)}`
			}, t, !1, {
				fileName: H,
				lineNumber: 109,
				columnNumber: 28
			}, this))
		}, void 0, !1, {
			fileName: H,
			lineNumber: 108,
			columnNumber: 27
		}, this) : null, /* @__PURE__ */ (0, M.jsxDEV)("div", {
			style: L.divisionBlocks,
			children: e.blocks.map((e, t) => /* @__PURE__ */ (0, M.jsxDEV)(_r, { block: e }, `${e.name}-${t}`, !1, {
				fileName: H,
				lineNumber: 114,
				columnNumber: 48
			}, this))
		}, void 0, !1, {
			fileName: H,
			lineNumber: 113,
			columnNumber: 7
		}, this)]
	}, void 0, !0, {
		fileName: H,
		lineNumber: 107,
		columnNumber: 5
	}, this);
}
function yr({ presentLayers: e }) {
	let t = [
		...St.map((e) => ({
			key: e,
			name: ze(e),
			color: "transparent",
			borderColor: F.subdivisionBorder
		})),
		{
			key: "right_of_way",
			name: "Right Of Way",
			color: F.rowBg,
			borderColor: F.subdivisionBorder
		},
		...Ct.map((e) => ({
			key: e,
			name: ze(e),
			color: F.divisionBg,
			borderColor: F.divisionBorder
		})),
		...wt.map((e) => ({
			key: e,
			name: ze(e),
			color: F.blockBg,
			borderColor: F.blockBorder
		})),
		...Tt.map((e) => ({
			key: e,
			name: Et[e],
			color: F.lotBg,
			borderColor: F.lotBorder
		}))
	].filter((t) => e.has(t.key));
	return t.length === 0 ? null : /* @__PURE__ */ (0, M.jsxDEV)("div", {
		className: "legal-map-legend",
		style: L.legendItems,
		children: t.map((e) => /* @__PURE__ */ (0, M.jsxDEV)("span", {
			style: L.legendItem,
			children: [/* @__PURE__ */ (0, M.jsxDEV)("span", { style: {
				...sr(e.color, e.borderColor),
				...e.key === "right_of_way" ? er : {}
			} }, void 0, !1, {
				fileName: H,
				lineNumber: 135,
				columnNumber: 11
			}, this), /* @__PURE__ */ (0, M.jsxDEV)("span", {
				style: L.legendLabel,
				children: e.name
			}, void 0, !1, {
				fileName: H,
				lineNumber: 136,
				columnNumber: 11
			}, this)]
		}, e.key, !0, {
			fileName: H,
			lineNumber: 134,
			columnNumber: 9
		}, this))
	}, void 0, !1, {
		fileName: H,
		lineNumber: 132,
		columnNumber: 5
	}, this);
}
function br({ view: e, issues: t, title: n }) {
	let r = pr(e);
	return /* @__PURE__ */ (0, M.jsxDEV)(lr, {
		showNorth: !e.isEmptyStructure,
		issues: t.map((e) => ({
			title: n,
			issue: e
		})),
		footer: e.isEmptyStructure ? void 0 : /* @__PURE__ */ (0, M.jsxDEV)(yr, { presentLayers: e.presentLayers }, void 0, !1, {
			fileName: H,
			lineNumber: 149,
			columnNumber: 139
		}, this),
		children: e.isEmptyStructure ? null : /* @__PURE__ */ (0, M.jsxDEV)("div", {
			ref: r.viewportRef,
			"data-legal-map-fit": "true",
			role: "region",
			"aria-label": `${n} drawing`,
			tabIndex: -1,
			style: L.fitViewport,
			children: /* @__PURE__ */ (0, M.jsxDEV)("div", {
				ref: r.contentRef,
				"data-legal-map-grid": "true",
				style: L.grid,
				children: [/* @__PURE__ */ (0, M.jsxDEV)("div", {
					style: L.gridContent,
					children: e.subdivisions.map((e, t) => /* @__PURE__ */ (0, M.jsxDEV)("div", {
						style: L.subdivisionWrapper,
						children: [St.filter((t) => !gt(e[t])).map((t) => /* @__PURE__ */ (0, M.jsxDEV)("div", {
							"data-legal-map-heading": t,
							style: L.subdivisionLabel,
							children: e[t]
						}, t, !1, {
							fileName: H,
							lineNumber: 155,
							columnNumber: 91
						}, this)), /* @__PURE__ */ (0, M.jsxDEV)("div", {
							"data-legal-map-subdivision": "true",
							style: L.subdivisionBoundary,
							children: /* @__PURE__ */ (0, M.jsxDEV)("div", {
								style: {
									...L.subdivisionContent,
									...e.rightsOfWay.length > 0 ? L.rowContent : {}
								},
								children: [e.divisions.map((e, t) => /* @__PURE__ */ (0, M.jsxDEV)(vr, { division: e }, t, !1, {
									fileName: H,
									lineNumber: 158,
									columnNumber: 77
								}, this)), e.rightsOfWay.map((t, n) => /* @__PURE__ */ (0, M.jsxDEV)("div", {
									"data-legal-map-row": "true",
									style: {
										...L.rowBand,
										top: `${(n + 1) * 100 / (e.rightsOfWay.length + 1)}%`
									},
									children: t
								}, t, !1, {
									fileName: H,
									lineNumber: 160,
									columnNumber: 23
								}, this))]
							}, void 0, !0, {
								fileName: H,
								lineNumber: 157,
								columnNumber: 19
							}, this)
						}, void 0, !1, {
							fileName: H,
							lineNumber: 156,
							columnNumber: 17
						}, this)]
					}, `${e.subdivision}-${t}`, !0, {
						fileName: H,
						lineNumber: 154,
						columnNumber: 15
					}, this))
				}, void 0, !1, {
					fileName: H,
					lineNumber: 152,
					columnNumber: 11
				}, this), e.locationLabel ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
					"data-legal-map-location": "true",
					style: L.location,
					children: e.locationLabel
				}, void 0, !1, {
					fileName: H,
					lineNumber: 167,
					columnNumber: 33
				}, this) : null]
			}, void 0, !0, {
				fileName: H,
				lineNumber: 151,
				columnNumber: 9
			}, this)
		}, void 0, !1, {
			fileName: H,
			lineNumber: 150,
			columnNumber: 33
		}, this)
	}, void 0, !1, {
		fileName: H,
		lineNumber: 149,
		columnNumber: 10
	}, this);
}
//#endregion
//#region src/features/legalmap/component/MetesDetails.tsx
var U = "C:/GitHub/Tabularium/aurorra_index/src/features/legalmap/component/MetesDetails.tsx";
function xr({ scenes: e, active: t, showParcels: n }) {
	return /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [
		t === "Boundary Calls" ? e.map((e, t) => /* @__PURE__ */ (0, M.jsxDEV)(Sr, {
			scene: e,
			showTitle: n
		}, t, !1, {
			fileName: U,
			lineNumber: 14,
			columnNumber: 65
		}, this)) : null,
		t === "Acreage" ? /* @__PURE__ */ (0, M.jsxDEV)("section", {
			className: "legal-map-acreage",
			style: L.infoSection,
			children: e.map((e, t) => {
				let r = e.notes.find((e) => e.label === "Acreage")?.value;
				return r || e.calculatedAcres !== void 0 ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
					"aria-label": n ? `${e.title} acreage` : "Reported acreage",
					style: L.infoCard,
					children: [
						n ? /* @__PURE__ */ (0, M.jsxDEV)("h4", {
							style: L.infoTitle,
							children: e.title
						}, void 0, !1, {
							fileName: U,
							lineNumber: 19,
							columnNumber: 26
						}, this) : null,
						r ? /* @__PURE__ */ (0, M.jsxDEV)("ul", {
							style: L.acreageList,
							children: r.split(";").map((e, t) => /* @__PURE__ */ (0, M.jsxDEV)("li", { children: t === 0 ? /* @__PURE__ */ (0, M.jsxDEV)("strong", {
								style: L.acreageFirst,
								children: [/* @__PURE__ */ (0, M.jsxDEV)("svg", {
									"data-survey-swatch": "true",
									"aria-hidden": "true",
									width: "12",
									height: "12",
									viewBox: "0 0 12 12",
									style: L.acreageSwatch,
									children: /* @__PURE__ */ (0, M.jsxDEV)("rect", {
										x: "0.5",
										y: "0.5",
										width: "11",
										height: "11",
										fill: F.parcelFill,
										fillOpacity: "0.25",
										stroke: F.parcelLine
									}, void 0, !1, {
										fileName: U,
										lineNumber: 24,
										columnNumber: 19
									}, this)
								}, void 0, !1, {
									fileName: U,
									lineNumber: 23,
									columnNumber: 17
								}, this), e.trim()]
							}, void 0, !0, {
								fileName: U,
								lineNumber: 22,
								columnNumber: 30
							}, this) : e.trim() }, t, !1, {
								fileName: U,
								lineNumber: 21,
								columnNumber: 55
							}, this))
						}, void 0, !1, {
							fileName: U,
							lineNumber: 20,
							columnNumber: 22
						}, this) : null,
						e.calculatedAcres === void 0 ? null : /* @__PURE__ */ (0, M.jsxDEV)("p", {
							style: L.infoNote,
							children: [
								e.completion === "synthetic" ? "Illustrated area" : "Calculated area",
								": ",
								e.calculatedAcres.toFixed(4),
								" acres."
							]
						}, void 0, !0, {
							fileName: U,
							lineNumber: 30,
							columnNumber: 50
						}, this),
						e.closureMetres === void 0 ? null : /* @__PURE__ */ (0, M.jsxDEV)("p", {
							style: L.infoNote,
							children: [
								"Measured misclosure: ",
								e.closureMetres.toFixed(4),
								" m",
								e.completion === "partial" ? " before completion" : "",
								"."
							]
						}, void 0, !0, {
							fileName: U,
							lineNumber: 31,
							columnNumber: 48
						}, this)
					]
				}, t, !0, {
					fileName: U,
					lineNumber: 18,
					columnNumber: 65
				}, this) : null;
			})
		}, void 0, !1, {
			fileName: U,
			lineNumber: 15,
			columnNumber: 29
		}, this) : null,
		t === "Easement" ? /* @__PURE__ */ (0, M.jsxDEV)("section", {
			className: "legal-map-easement",
			style: L.infoSection,
			children: e.map((e, t) => {
				let r = e.notes.filter((e) => e.label === "Easement");
				return r.length > 0 ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
					"aria-label": n ? `${e.title} easement details` : "Easement details",
					style: {
						...L.infoCard,
						...L.infoSection
					},
					children: [
						n ? /* @__PURE__ */ (0, M.jsxDEV)("h4", {
							style: L.infoTitle,
							children: e.title
						}, void 0, !1, {
							fileName: U,
							lineNumber: 39,
							columnNumber: 26
						}, this) : null,
						r.map((e, t) => /* @__PURE__ */ (0, M.jsxDEV)("div", { children: [/* @__PURE__ */ (0, M.jsxDEV)("div", { children: e.value }, void 0, !1, {
							fileName: U,
							lineNumber: 41,
							columnNumber: 13
						}, this), e.explanation ? /* @__PURE__ */ (0, M.jsxDEV)("p", {
							style: L.infoNote,
							children: e.explanation
						}, void 0, !1, {
							fileName: U,
							lineNumber: 42,
							columnNumber: 33
						}, this) : null] }, t, !0, {
							fileName: U,
							lineNumber: 40,
							columnNumber: 43
						}, this)),
						/* @__PURE__ */ (0, M.jsxDEV)("p", {
							style: L.infoNote,
							children: "Location not specified in this clause — not plotted."
						}, void 0, !1, {
							fileName: U,
							lineNumber: 44,
							columnNumber: 11
						}, this)
					]
				}, t, !0, {
					fileName: U,
					lineNumber: 38,
					columnNumber: 39
				}, this) : null;
			})
		}, void 0, !1, {
			fileName: U,
			lineNumber: 35,
			columnNumber: 30
		}, this) : null
	] }, void 0, !0, {
		fileName: U,
		lineNumber: 13,
		columnNumber: 10
	}, this);
}
function Sr({ scene: e, showTitle: t }) {
	let n = e.notes.filter((e) => e.label === "Bearings" || e.label === "Distances");
	return !e.courses.length && n.length === 0 ? null : e.courses.length ? /* @__PURE__ */ (0, M.jsxDEV)($e.Provider, {
		delayDuration: 250,
		children: /* @__PURE__ */ (0, M.jsxDEV)("table", {
			"aria-label": "Boundary Calls",
			className: "legal-map-table legal-map-calls",
			style: {
				...R.notes,
				minWidth: "30rem"
			},
			children: [
				t ? /* @__PURE__ */ (0, M.jsxDEV)("caption", {
					style: L.infoTitle,
					children: e.title
				}, void 0, !1, {
					fileName: U,
					lineNumber: 62,
					columnNumber: 18
				}, this) : null,
				/* @__PURE__ */ (0, M.jsxDEV)("colgroup", { children: [
					/* @__PURE__ */ (0, M.jsxDEV)("col", { style: { width: "2rem" } }, void 0, !1, {
						fileName: U,
						lineNumber: 63,
						columnNumber: 15
					}, this),
					/* @__PURE__ */ (0, M.jsxDEV)("col", { style: { width: "8rem" } }, void 0, !1, {
						fileName: U,
						lineNumber: 63,
						columnNumber: 48
					}, this),
					/* @__PURE__ */ (0, M.jsxDEV)("col", {}, void 0, !1, {
						fileName: U,
						lineNumber: 63,
						columnNumber: 81
					}, this),
					/* @__PURE__ */ (0, M.jsxDEV)("col", { style: { width: "7rem" } }, void 0, !1, {
						fileName: U,
						lineNumber: 63,
						columnNumber: 88
					}, this),
					/* @__PURE__ */ (0, M.jsxDEV)("col", { style: { width: "7rem" } }, void 0, !1, {
						fileName: U,
						lineNumber: 63,
						columnNumber: 121
					}, this)
				] }, void 0, !0, {
					fileName: U,
					lineNumber: 63,
					columnNumber: 5
				}, this),
				/* @__PURE__ */ (0, M.jsxDEV)("thead", { children: /* @__PURE__ */ (0, M.jsxDEV)("tr", { children: [
					"#",
					"Boundary",
					"Bearing",
					"Distance",
					"Status"
				].map((e) => /* @__PURE__ */ (0, M.jsxDEV)("th", {
					scope: "col",
					style: R.cell,
					children: e
				}, e, !1, {
					fileName: U,
					lineNumber: 64,
					columnNumber: 81
				}, this)) }, void 0, !1, {
					fileName: U,
					lineNumber: 64,
					columnNumber: 12
				}, this) }, void 0, !1, {
					fileName: U,
					lineNumber: 64,
					columnNumber: 5
				}, this),
				/* @__PURE__ */ (0, M.jsxDEV)("tbody", { children: e.courses.map((t, n) => /* @__PURE__ */ (0, M.jsxDEV)("tr", {
					style: t.confirmed ? void 0 : R.unconfirmedRow,
					children: [
						/* @__PURE__ */ (0, M.jsxDEV)("td", {
							style: R.cell,
							children: n + 1
						}, void 0, !1, {
							fileName: U,
							lineNumber: 66,
							columnNumber: 7
						}, this),
						/* @__PURE__ */ (0, M.jsxDEV)("td", {
							style: R.cell,
							children: t.unassigned ? "Unassigned" : e.beginning !== void 0 && n < e.beginning ? "Tie" : n + 1 + " → " + (t.target ?? n + 2)
						}, void 0, !1, {
							fileName: U,
							lineNumber: 67,
							columnNumber: 7
						}, this),
						/* @__PURE__ */ (0, M.jsxDEV)("td", {
							style: R.cell,
							children: Zt(t.bearing, !0, t.synthetic)
						}, void 0, !1, {
							fileName: U,
							lineNumber: 68,
							columnNumber: 7
						}, this),
						/* @__PURE__ */ (0, M.jsxDEV)("td", {
							style: R.cell,
							children: t.distance ? Zt(t.distance, !1, t.synthetic) : "—"
						}, void 0, !1, {
							fileName: U,
							lineNumber: 69,
							columnNumber: 7
						}, this),
						/* @__PURE__ */ (0, M.jsxDEV)("td", {
							style: R.cell,
							children: t.confirmed ? "Confirmed" : /* @__PURE__ */ (0, M.jsxDEV)($e.Root, { children: [/* @__PURE__ */ (0, M.jsxDEV)($e.Trigger, {
								asChild: !0,
								children: /* @__PURE__ */ (0, M.jsxDEV)("button", {
									type: "button",
									style: R.status,
									children: "Unconfirmed"
								}, void 0, !1, {
									fileName: U,
									lineNumber: 71,
									columnNumber: 34
								}, this)
							}, void 0, !1, {
								fileName: U,
								lineNumber: 71,
								columnNumber: 9
							}, this), /* @__PURE__ */ (0, M.jsxDEV)($e.Portal, { children: /* @__PURE__ */ (0, M.jsxDEV)($e.Content, {
								collisionPadding: 8,
								sideOffset: 6,
								style: {
									...k.tooltip,
									maxWidth: "min(24rem, calc(100vw - 1rem))",
									overflowWrap: "anywhere"
								},
								children: t.issue
							}, void 0, !1, {
								fileName: U,
								lineNumber: 72,
								columnNumber: 25
							}, this) }, void 0, !1, {
								fileName: U,
								lineNumber: 72,
								columnNumber: 9
							}, this)] }, void 0, !0, {
								fileName: U,
								lineNumber: 70,
								columnNumber: 71
							}, this)
						}, void 0, !1, {
							fileName: U,
							lineNumber: 70,
							columnNumber: 7
						}, this)
					]
				}, n, !0, {
					fileName: U,
					lineNumber: 65,
					columnNumber: 50
				}, this)) }, void 0, !1, {
					fileName: U,
					lineNumber: 65,
					columnNumber: 5
				}, this)
			]
		}, void 0, !0, {
			fileName: U,
			lineNumber: 61,
			columnNumber: 48
		}, this)
	}, void 0, !1, {
		fileName: U,
		lineNumber: 61,
		columnNumber: 10
	}, this) : /* @__PURE__ */ (0, M.jsxDEV)("section", {
		"aria-label": `${e.title} extracted measurements`,
		style: L.infoCard,
		children: [t ? /* @__PURE__ */ (0, M.jsxDEV)("h4", {
			style: L.infoTitle,
			children: e.title
		}, void 0, !1, {
			fileName: U,
			lineNumber: 55,
			columnNumber: 18
		}, this) : null, /* @__PURE__ */ (0, M.jsxDEV)("dl", {
			style: R.measurements,
			children: n.map((e, t) => /* @__PURE__ */ (0, M.jsxDEV)("div", { children: [/* @__PURE__ */ (0, M.jsxDEV)("dt", {
				style: R.measurementLabel,
				children: e.label
			}, void 0, !1, {
				fileName: U,
				lineNumber: 57,
				columnNumber: 7
			}, this), /* @__PURE__ */ (0, M.jsxDEV)("dd", {
				style: R.measurementValue,
				children: Zt(e.value, e.label === "Bearings")
			}, void 0, !1, {
				fileName: U,
				lineNumber: 58,
				columnNumber: 7
			}, this)] }, t, !0, {
				fileName: U,
				lineNumber: 56,
				columnNumber: 78
			}, this))
		}, void 0, !1, {
			fileName: U,
			lineNumber: 56,
			columnNumber: 5
		}, this)]
	}, void 0, !0, {
		fileName: U,
		lineNumber: 54,
		columnNumber: 37
	}, this);
}
//#endregion
//#region src/features/legalmap/store/mapStore.ts
var Cr = i(), wr = s(), Tr = (0, Cr.create)()((0, wr.persist)((e) => ({
	detailsRatio: null,
	setDetailsRatio: (t) => e({ detailsRatio: t })
}), {
	name: "aurorra-index:map",
	partialize: (e) => ({ detailsRatio: e.detailsRatio })
}));
//#endregion
//#region src/features/legalmap/hook/useMapResize.ts
function Er(e, t) {
	let n = Math.min(t.max, Math.max(t.min, e));
	return {
		height: n,
		ratio: (n + t.header) / t.total
	};
}
function Dr(e) {
	let t = D(null), n = D(null), r = D(null), i = D(null), a = D(null), o = Tr((e) => e.detailsRatio), s = Tr((e) => e.setDetailsRatio), [c, l] = O(null), [u, d] = O(null), f = c ? Er(u === null ? o === null ? c.initial : o * c.total - c.header : u, c) : null;
	pe(() => {
		if (!e) return;
		let o = t.current, s = n.current, c = r.current, u = i.current, d = new ResizeObserver(() => {
			let e = Number.parseFloat(getComputedStyle(document.documentElement).fontSize), t = o.getBoundingClientRect().height - u.getBoundingClientRect().height;
			if (t <= 0) return;
			let n = s.getBoundingClientRect().height - c.getBoundingClientRect().height, r = Math.max(0, t - n), i = Math.min(r, I.mapMin * e), a = Math.max(Math.min(I.detailsMin * e, Math.max(0, r - i)), r - I.mapMax * e);
			l({
				total: t,
				header: n,
				initial: I.detailsHeight * e,
				min: a,
				max: Math.max(a, r - i)
			});
		});
		return d.observe(o), d.observe(s), () => {
			d.disconnect(), a.current = null;
		};
	}, [e]);
	let p = (e) => {
		a.current?.pointerId === e.pointerId && (s(f.ratio), d(null), a.current = null, e.currentTarget.releasePointerCapture(e.pointerId));
	};
	return {
		bodyRef: t,
		infoRef: n,
		panelRef: r,
		height: f ? f.height : L.infoPanel.height,
		separator: {
			ref: i,
			role: "separator",
			"aria-label": "Resize map and details",
			"aria-orientation": "horizontal",
			"aria-valuemin": c ? Math.round(c.min) : void 0,
			"aria-valuemax": c ? Math.round(c.max) : void 0,
			"aria-valuenow": f ? Math.round(f.height) : void 0,
			"aria-valuetext": f ? `${Math.round(f.ratio * 100)}% for details` : void 0,
			title: "Drag up or down to resize map and details",
			tabIndex: 0,
			onPointerDown: (e) => {
				e.button !== 0 || !f || (a.current = {
					pointerId: e.pointerId,
					y: e.clientY,
					height: f.height
				}, e.currentTarget.setPointerCapture(e.pointerId));
			},
			onPointerMove: (e) => {
				a.current?.pointerId === e.pointerId && d(a.current.height + a.current.y - e.clientY);
			},
			onPointerUp: p,
			onPointerCancel: p,
			onLostPointerCapture: () => {
				a.current = null, d(null);
			},
			onKeyDown: (e) => {
				if (!f) return;
				let t;
				switch (e.key) {
					case "ArrowUp":
						t = f.height + Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
						break;
					case "ArrowDown":
						t = f.height - Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
						break;
					case "Home":
						t = c.min;
						break;
					case "End":
						t = c.max;
						break;
					default: return;
				}
				e.preventDefault(), s(Er(t, c).ratio);
			}
		}
	};
}
//#endregion
//#region src/features/legalmap/component/LegalMapContent.tsx
var W = "C:/GitHub/Tabularium/aurorra_index/src/features/legalmap/component/LegalMapContent.tsx";
function Or({ legal: e, addressMaps: t, onReadyChange: n }) {
	return T(() => {
		n?.(!0);
	}, [e, n]), /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [/* @__PURE__ */ (0, M.jsxDEV)("style", { children: tr }, void 0, !1, {
		fileName: W,
		lineNumber: 27,
		columnNumber: 5
	}, this), /* @__PURE__ */ (0, M.jsxDEV)("div", {
		className: "legal-map",
		style: L.shell,
		children: /* @__PURE__ */ (0, M.jsxDEV)(Se, {
			title: "Map views could not be displayed",
			resetKey: e,
			children: /* @__PURE__ */ (0, M.jsxDEV)(kr, {
				legal: e,
				addressMaps: t
			}, void 0, !1, {
				fileName: W,
				lineNumber: 30,
				columnNumber: 9
			}, this)
		}, void 0, !1, {
			fileName: W,
			lineNumber: 29,
			columnNumber: 7
		}, this)
	}, void 0, !1, {
		fileName: W,
		lineNumber: 28,
		columnNumber: 5
	}, this)] }, void 0, !0, {
		fileName: W,
		lineNumber: 26,
		columnNumber: 10
	}, this);
}
function kr({ legal: e, addressMaps: t }) {
	let n = Mn(e), r = mt.filter((e) => e === "Address" ? !!t?.length : n.some((t) => t.view === e)), { active: i, controls: a, panel: o } = Ze(r, "Map views", {
		className: "legal-map-tabs legal-map-view-tabs",
		style: L.tabs,
		tabStyle: (e) => ({
			...L.tabButton,
			color: e ? "var(--primary-dark)" : "var(--body-ink)"
		}),
		hideSingle: !1
	}), s = n.filter((e) => e.view === i), c = i === "Lot & block" && e?.parcels_num && e.parcels_num > 0 ? e.parcels_num : void 0, l = c ? zt(s.map((e) => e.group), c) : void 0, u = l ? Array.from({ length: c }, (e, t) => l[t]) : [{ sources: s.map((e) => e.group) }], d = (c ? c > 1 : s.length > 1) && e?.parcels_num !== 1, f = l ? l.flatMap((t, n) => s.filter((e) => t.sources.includes(e.group)).map((t) => ({
		...t,
		title: `Parcel ${e?.parcels_num === 1 ? 1 : n + 1}`
	}))) : s.map((t, n) => {
		let r = [...new Set(t.notes.flatMap((e) => [...(e.explanation ?? "").matchAll(/\bParcel\s+(\d+)\b/gi)].map((e) => e[1])))];
		return {
			...t,
			title: `Parcel ${e?.parcels_num === 1 ? 1 : r.length === 1 ? r[0] : n + 1}`
		};
	}), p = f.flatMap((e) => e.view === "Metes & Bounds" ? [{
		...e.scene,
		title: e.title
	}] : []), m = Ze(i === "Metes & Bounds" ? [
		"Boundary Calls",
		"Acreage",
		"Easement"
	].filter((e) => e === "Boundary Calls" ? p.some((e) => e.courses.length || e.notes.some((e) => e.label === "Bearings" || e.label === "Distances")) : f.some((t) => t.notes.some((t) => t.label === e))) : (i === "PLSS" || i === "Lot & block") && f.some((e) => e.notes.length > 0) ? ["Details"] : [], "Map details", {
		className: "legal-map-tabs legal-map-detail-tabs",
		style: L.detailTabs,
		tabStyle: L.detailTab,
		hideSingle: !0
	}), h = i === "Address" ? t.map((e) => ({
		title: e.address,
		content: /* @__PURE__ */ (0, M.jsxDEV)(lr, {
			showNorth: !1,
			children: e.content
		}, void 0, !1, {
			fileName: W,
			lineNumber: 66,
			columnNumber: 36
		}, this)
	})) : i === "PLSS" || i === "Metes & Bounds" ? (e?.parcels_num === 1 ? [f] : f.map((e) => [e])).map((e) => {
		let t = e.flatMap((e) => e.view === "PLSS" ? [{
			...e.scene,
			title: e.title
		}] : []), n = e.flatMap((e) => e.view === "Metes & Bounds" ? [{
			...e.scene,
			title: e.title
		}] : []), r = e.some((e) => e.scene.items.length > 0);
		return {
			title: e[0].title,
			content: r ? i === "PLSS" ? /* @__PURE__ */ (0, M.jsxDEV)(fr, { scenes: t }, void 0, !1, {
				fileName: W,
				lineNumber: 72,
				columnNumber: 47
			}, this) : /* @__PURE__ */ (0, M.jsxDEV)(dr, { scenes: n }, void 0, !1, {
				fileName: W,
				lineNumber: 72,
				columnNumber: 81
			}, this) : /* @__PURE__ */ (0, M.jsxDEV)(lr, {
				showNorth: !1,
				issues: e.map((e) => ({
					title: e.title,
					issue: e.scene.issue
				}))
			}, void 0, !1, {
				fileName: W,
				lineNumber: 73,
				columnNumber: 11
			}, this)
		};
	}) : u.flatMap((e, t) => {
		let n = `Parcel ${t + 1}`;
		if (!e) return [{
			title: n,
			content: /* @__PURE__ */ (0, M.jsxDEV)(lr, {
				showNorth: !1,
				issues: [{
					title: n,
					issue: "Cannot map: Lot Block legal group is missing for this parcel."
				}]
			}, void 0, !1, {
				fileName: W,
				lineNumber: 78,
				columnNumber: 46
			}, this)
		}];
		let r = qt({
			groups: e.sources,
			parcels_num: c ? 1 : void 0
		}), i = s.filter((t) => e.sources.includes(t.group) && t.issue).map((e) => e.issue);
		return r.isEmptyStructure && i.length === 0 ? [] : [{
			title: n,
			content: /* @__PURE__ */ (0, M.jsxDEV)(br, {
				view: r,
				issues: i,
				title: n
			}, void 0, !1, {
				fileName: W,
				lineNumber: 82,
				columnNumber: 18
			}, this)
		}];
	}), g = Dr(m.active && h.length > 0 ? i : void 0);
	return /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [r.length > 0 ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
		className: "legal-map-toolbar",
		style: L.toolbar,
		children: a
	}, void 0, !1, {
		fileName: W,
		lineNumber: 89,
		columnNumber: 26
	}, this) : null, /* @__PURE__ */ (0, M.jsxDEV)("div", {
		...r.length > 0 ? o : {},
		ref: g.bodyRef,
		className: "legal-map-content",
		style: L.content,
		children: [h.length > 0 ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
			className: "legal-map-column",
			style: L.mapColumn,
			children: /* @__PURE__ */ (0, M.jsxDEV)("div", {
				"data-map-scroll": "true",
				className: "legal-map-surveys",
				style: L.parcelList,
				children: h.map((t, n) => /* @__PURE__ */ (0, M.jsxDEV)("section", {
					className: "survey-layout",
					"aria-label": t.title,
					style: L.parcelLayout,
					children: [i !== "Address" && d ? /* @__PURE__ */ (0, M.jsxDEV)("h4", {
						style: L.parcelTitle,
						children: t.title
					}, void 0, !1, {
						fileName: W,
						lineNumber: 95,
						columnNumber: 54
					}, this) : null, /* @__PURE__ */ (0, M.jsxDEV)(Se, {
						title: `${t.title} could not be displayed`,
						resetKey: e,
						children: t.content
					}, void 0, !1, {
						fileName: W,
						lineNumber: 96,
						columnNumber: 15
					}, this)]
				}, `${i}-${n}`, !0, {
					fileName: W,
					lineNumber: 93,
					columnNumber: 39
				}, this))
			}, void 0, !1, {
				fileName: W,
				lineNumber: 92,
				columnNumber: 11
			}, this)
		}, void 0, !1, {
			fileName: W,
			lineNumber: 91,
			columnNumber: 28
		}, this) : null, m.active ? /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [h.length > 0 ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
			...g.separator,
			"aria-controls": `${o.id} ${m.panel.id}`,
			className: "legal-map-divider",
			style: L.divider,
			children: /* @__PURE__ */ (0, M.jsxDEV)("span", {
				"aria-hidden": "true",
				style: L.dividerGrip
			}, void 0, !1, {
				fileName: W,
				lineNumber: 102,
				columnNumber: 13
			}, this)
		}, void 0, !1, {
			fileName: W,
			lineNumber: 101,
			columnNumber: 30
		}, this) : null, /* @__PURE__ */ (0, M.jsxDEV)("aside", {
			ref: g.infoRef,
			className: "legal-map-info",
			"data-legal-map-info": "true",
			style: L.infoColumn,
			children: [m.controls, /* @__PURE__ */ (0, M.jsxDEV)("div", {
				...m.panel,
				ref: g.panelRef,
				style: {
					...L.infoPanel,
					height: g.height
				},
				children: [m.active === "Details" ? f.map((e, t) => /* @__PURE__ */ (0, M.jsxDEV)(de, { children: /* @__PURE__ */ (0, M.jsxDEV)("table", {
					className: "legal-map-table",
					"aria-label": d ? `${e.title} details` : "Details",
					style: {
						...R.notes,
						tableLayout: "auto"
					},
					children: [d ? /* @__PURE__ */ (0, M.jsxDEV)("caption", {
						style: L.infoTitle,
						children: e.title
					}, void 0, !1, {
						fileName: W,
						lineNumber: 110,
						columnNumber: 36
					}, this) : null, /* @__PURE__ */ (0, M.jsxDEV)("tbody", { children: e.notes.map((e, t) => /* @__PURE__ */ (0, M.jsxDEV)("tr", { children: [/* @__PURE__ */ (0, M.jsxDEV)("th", {
						scope: "row",
						style: {
							...R.cell,
							whiteSpace: "nowrap",
							width: "1%"
						},
						children: e.label
					}, void 0, !1, {
						fileName: W,
						lineNumber: 112,
						columnNumber: 23
					}, this), /* @__PURE__ */ (0, M.jsxDEV)("td", {
						style: R.cell,
						children: e.value
					}, void 0, !1, {
						fileName: W,
						lineNumber: 113,
						columnNumber: 23
					}, this)] }, t, !0, {
						fileName: W,
						lineNumber: 111,
						columnNumber: 66
					}, this)) }, void 0, !1, {
						fileName: W,
						lineNumber: 111,
						columnNumber: 21
					}, this)]
				}, void 0, !0, {
					fileName: W,
					lineNumber: 109,
					columnNumber: 19
				}, this) }, t, !1, {
					fileName: W,
					lineNumber: 108,
					columnNumber: 24
				}, this)) : null, i === "Metes & Bounds" ? /* @__PURE__ */ (0, M.jsxDEV)(xr, {
					scenes: p,
					active: m.active,
					showParcels: d
				}, void 0, !1, {
					fileName: W,
					lineNumber: 118,
					columnNumber: 46
				}, this) : null]
			}, void 0, !0, {
				fileName: W,
				lineNumber: 106,
				columnNumber: 13
			}, this)]
		}, void 0, !0, {
			fileName: W,
			lineNumber: 104,
			columnNumber: 11
		}, this)] }, void 0, !0, {
			fileName: W,
			lineNumber: 100,
			columnNumber: 27
		}, this) : null]
	}, void 0, !0, {
		fileName: W,
		lineNumber: 90,
		columnNumber: 7
	}, this)] }, void 0, !0, {
		fileName: W,
		lineNumber: 88,
		columnNumber: 5
	}, this);
}
//#endregion
//#region src/features/indexing/data/deferredState.ts
function Ar(e = {}) {
	return {
		pageMap: new Map(e.pageMap || []),
		segment: e.segment ?? null,
		selectedIndex: e.selectedIndex ?? null
	};
}
//#endregion
//#region src/features/addressmap/data/addressMap.ts
var jr = 14;
function Mr(e) {
	return `https://www.google.com/maps?q=${encodeURIComponent(e)}&output=embed&maptype=roadmap`;
}
function Nr(e, t) {
	return `${e}&z=${t}`;
}
//#endregion
//#region src/features/addressmap/style/addressMapStyles.ts
var Pr = {
	contentShell: {
		alignItems: "stretch",
		boxSizing: "border-box",
		display: "flex",
		height: "100%",
		minHeight: 0,
		position: "relative",
		width: "100%"
	},
	iframe: {
		background: "transparent",
		border: "none",
		height: "100%",
		width: "100%"
	},
	timeout: {
		alignItems: "center",
		boxSizing: "border-box",
		color: "var(--body-ink)",
		display: "flex",
		flexDirection: "column",
		fontSize: "0.875rem",
		gap: "0.5rem",
		inset: 0,
		justifyContent: "center",
		padding: "1rem",
		position: "absolute",
		textAlign: "center"
	},
	link: {
		alignItems: "center",
		color: "var(--primary-dark)",
		display: "inline-flex",
		fontWeight: 600,
		minHeight: "2rem",
		textDecoration: "underline"
	}
}, Fr = "C:/GitHub/Tabularium/aurorra_index/src/features/addressmap/component/AddressMapContent.tsx";
function Ir({ onLoaderChange: e, onReadyChange: t, source: n, zoom: r }) {
	let [i, a] = O("loading"), o = D(void 0);
	if (pe(() => {
		if (a("loading"), n) return o.current = window.setTimeout(() => a("timeout"), 1e4), () => window.clearTimeout(o.current);
	}, [n, r]), T(() => {
		t(!!n && i !== "loading"), e(n && i === "loading" ? ["Loading map…"] : null);
	}, [
		e,
		t,
		n,
		i
	]), !n) return /* @__PURE__ */ (0, M.jsxDEV)("div", { style: Pr.contentShell }, void 0, !1, {
		fileName: Fr,
		lineNumber: 29,
		columnNumber: 23
	}, this);
	let s = Nr(n, r), c = new URL(n);
	return c.searchParams.delete("output"), /* @__PURE__ */ (0, M.jsxDEV)("div", {
		style: Pr.contentShell,
		children: [/* @__PURE__ */ (0, M.jsxDEV)("iframe", {
			allowFullScreen: !0,
			"data-address-map-iframe": "true",
			"data-testid": "address-map-iframe",
			loading: "eager",
			onLoad: () => {
				window.clearTimeout(o.current), a("loaded");
			},
			referrerPolicy: "no-referrer",
			src: s,
			frameBorder: "0",
			style: {
				...Pr.iframe,
				visibility: i === "loaded" ? "visible" : "hidden"
			},
			title: "Address map"
		}, s, !1, {
			fileName: Fr,
			lineNumber: 37,
			columnNumber: 7
		}, this), i === "timeout" ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
			role: "status",
			style: Pr.timeout,
			children: [/* @__PURE__ */ (0, M.jsxDEV)("span", { children: "The map is taking longer than expected." }, void 0, !1, {
				fileName: Fr,
				lineNumber: 55,
				columnNumber: 11
			}, this), /* @__PURE__ */ (0, M.jsxDEV)("a", {
				href: c.href,
				rel: "noopener noreferrer",
				style: Pr.link,
				target: "_blank",
				children: "Open Google Maps"
			}, void 0, !1, {
				fileName: Fr,
				lineNumber: 56,
				columnNumber: 11
			}, this)]
		}, void 0, !0, {
			fileName: Fr,
			lineNumber: 54,
			columnNumber: 9
		}, this) : null]
	}, void 0, !0, {
		fileName: Fr,
		lineNumber: 36,
		columnNumber: 5
	}, this);
}
//#endregion
//#region src/features/metdataview/data/metadataResource.ts
async function Lr(e, t) {
	if (e.resource === "session_choices") {
		let e = oe.getState();
		return l.getState().session === t ? structuredClone(e.choices) : null;
	}
	if (e.resource !== "metadata_etag") throw Error(`Unknown resource: ${e.resource}`);
	let n = l.getState();
	return n.session === t && n.etag !== null ? n.etag : null;
}
//#endregion
//#region src/features/pagesegments/style/pageSegmentsStyles.ts
var Rr = {
	root: {
		alignItems: "stretch",
		boxSizing: "border-box",
		color: "var(--title-ink)",
		display: "flex",
		flexDirection: "column",
		gap: "1rem",
		height: "auto",
		justifyContent: "flex-start",
		width: "100%"
	},
	blankRow: {
		alignItems: "center",
		color: "var(--title-ink)",
		cursor: "pointer",
		display: "flex",
		fontSize: "0.95rem",
		gap: "0.55rem",
		padding: "0.85rem 1rem 1rem"
	},
	checkboxIndicator: {
		fontSize: "0.75rem",
		lineHeight: 1
	},
	checkboxRoot(e, t) {
		return {
			alignItems: "center",
			appearance: "none",
			background: t ? "var(--primary-dark)" : "var(--white)",
			border: "1px solid var(--slate-500)",
			borderRadius: 0,
			boxShadow: "none",
			color: "var(--white)",
			cursor: e ? "not-allowed" : "pointer",
			display: "inline-flex",
			flex: "0 0 auto",
			height: "1rem",
			justifyContent: "center",
			margin: 0,
			minHeight: "1rem",
			minWidth: "1rem",
			opacity: e ? .65 : 1,
			padding: 0,
			width: "1rem"
		};
	},
	sectionTitle: {
		color: "var(--slate-500)",
		display: "inline-flex",
		fontSize: "0.85rem",
		fontWeight: 700,
		letterSpacing: 0,
		padding: "0 1rem"
	},
	grid: {
		display: "grid",
		gap: "0.75rem",
		gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 12rem), 1fr))",
		padding: "0 1rem 1rem"
	},
	item: {
		alignItems: "center",
		background: "var(--white)",
		border: "1px solid var(--border-card)",
		borderRadius: "var(--radius-card)",
		boxSizing: "border-box",
		display: "flex",
		gap: "0.55rem",
		padding: "0.6rem 0.75rem"
	},
	itemText(e) {
		return {
			color: e ? "var(--slate-500)" : "var(--title-ink)",
			fontSize: "0.92rem"
		};
	},
	message: {
		background: "#FEF2F2",
		borderRadius: "var(--radius-card)",
		color: "#991B1B",
		display: "block",
		font: "500 0.875rem/1.45 var(--font-ui)",
		padding: "0.625rem 0.75rem",
		textAlign: "left"
	},
	footer: {
		alignItems: "center",
		background: "var(--white)",
		borderTop: "1px solid var(--border-subtle)",
		display: "flex",
		flex: "0 0 auto",
		flexWrap: "wrap",
		gap: "0.5rem",
		justifyContent: "center",
		marginTop: 0,
		padding: "0.75rem 1rem",
		position: "static",
		zIndex: 2
	},
	button(e) {
		return {
			alignItems: "center",
			backgroundColor: e === "secondary" ? "var(--white)" : "var(--primary-dark)",
			border: e === "secondary" ? "1px solid var(--border-card)" : "1px solid var(--primary)",
			borderRadius: "var(--radius-control)",
			boxShadow: e === "secondary" ? "none" : "var(--shadow-action)",
			color: e === "secondary" ? "var(--title-ink)" : "var(--white)",
			cursor: "pointer",
			display: "inline-flex",
			fontWeight: 600,
			height: "2.75rem",
			justifyContent: "center",
			minWidth: "7rem",
			padding: ".5rem 1rem",
			position: "relative",
			scrollMarginBottom: "6rem",
			textAlign: "center",
			userSelect: "none",
			whiteSpace: "nowrap"
		};
	}
}, zr = "C:/GitHub/Tabularium/aurorra_index/src/features/pagesegments/component/PageSegmentsPanel.tsx";
function Br(e) {
	let t = e;
	return {
		code: t.code,
		details: t.details,
		error: t.error ?? t.message ?? "Page segment update failed.",
		status: t.status
	};
}
function Vr(e, t) {
	return e.join("|") === t.join("|");
}
function Hr({ apiGatewayUrl: e, authToken: t, choices: n, onClose: r, batchCode: i, intervalMs: a, onQueueChange: s, formatError: c, retryIntervalMs: u, retryLimit: f, onError: m, onReadyChange: h, pageClass: _, pageCode: v, segments: ee, session: te, workerClient: ne }) {
	let re = p((e) => e.committed), ie = p((e) => e.error), ae = p((e) => e.selected), b = p((e) => e.status), oe = me(() => ne ?? g({
		apiBaseUrl: e,
		retryIntervalMs: u,
		retryLimit: f
	}), [
		e,
		u,
		f,
		ne
	]), x = zn(ee).join("|"), S = !Vr(re, ae), se = _ === "blank" && ae.length === 0;
	T(() => {
		h(b !== "saving");
	}, [h, b]), T(() => (y.getState().reset(x ? x.split("|") : []), () => {
		y.getState().reset([]);
	}), [x, v]);
	let ce = (e, t) => {
		let n = t ? zn([...ae, e]) : ae.filter((t) => t !== e);
		y.getState().setSelected(n);
	}, C = async () => {
		if (y.getState().status === "saving" || !S) return;
		let e = [...ae];
		y.getState().setSaving();
		try {
			await l.getState().enqueue({
				action: "page",
				code: v,
				segments: e,
				session: te,
				batch: i,
				segment: "page"
			}, {
				authToken: t,
				client: oe,
				intervalMs: a,
				formatError: c,
				onChange: s
			}), r();
		} catch (e) {
			let t = Br(e);
			y.getState().setError(t), m({
				error: t,
				pageCode: v,
				session: te
			});
			return;
		}
	};
	return /* @__PURE__ */ (0, M.jsxDEV)("section", {
		"aria-label": "Page Segments",
		style: Rr.root,
		children: [
			/* @__PURE__ */ (0, M.jsxDEV)("label", {
				htmlFor: "pageBlankToggle",
				style: Rr.blankRow,
				children: [/* @__PURE__ */ (0, M.jsxDEV)(o, {
					checked: se,
					disabled: b === "saving",
					id: "pageBlankToggle",
					onCheckedChange: (e) => {
						e === !0 && y.getState().setSelected([]);
					},
					style: Rr.checkboxRoot(b === "saving", se),
					children: /* @__PURE__ */ (0, M.jsxDEV)(d, {
						"aria-hidden": !0,
						style: Rr.checkboxIndicator,
						children: "✓"
					}, void 0, !1, {
						fileName: zr,
						lineNumber: 106,
						columnNumber: 11
					}, this)
				}, void 0, !1, {
					fileName: zr,
					lineNumber: 95,
					columnNumber: 9
				}, this), /* @__PURE__ */ (0, M.jsxDEV)("span", { children: "This page is blank" }, void 0, !1, {
					fileName: zr,
					lineNumber: 108,
					columnNumber: 9
				}, this)]
			}, void 0, !0, {
				fileName: zr,
				lineNumber: 94,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ (0, M.jsxDEV)("span", {
				id: "pageSegmentsSectionTitle",
				style: Rr.sectionTitle,
				children: "Segments"
			}, void 0, !1, {
				fileName: zr,
				lineNumber: 110,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ (0, M.jsxDEV)("div", {
				style: Rr.grid,
				children: Pn.map((e) => {
					let t = Ln(n, Nn[e]) <= 0;
					return /* @__PURE__ */ (0, M.jsxDEV)("label", {
						htmlFor: `segment-${e}`,
						style: Rr.item,
						children: [/* @__PURE__ */ (0, M.jsxDEV)(o, {
							checked: ae.includes(e),
							disabled: t || b === "saving",
							id: `segment-${e}`,
							onCheckedChange: (t) => ce(e, t === !0),
							style: Rr.checkboxRoot(t || b === "saving", ae.includes(e)),
							value: e,
							children: /* @__PURE__ */ (0, M.jsxDEV)(d, {
								"aria-hidden": !0,
								style: Rr.checkboxIndicator,
								children: "✓"
							}, void 0, !1, {
								fileName: zr,
								lineNumber: 124,
								columnNumber: 17
							}, this)
						}, void 0, !1, {
							fileName: zr,
							lineNumber: 116,
							columnNumber: 15
						}, this), /* @__PURE__ */ (0, M.jsxDEV)("span", {
							style: Rr.itemText(t),
							children: Fn[e]
						}, void 0, !1, {
							fileName: zr,
							lineNumber: 126,
							columnNumber: 15
						}, this)]
					}, e, !0, {
						fileName: zr,
						lineNumber: 115,
						columnNumber: 13
					}, this);
				})
			}, void 0, !1, {
				fileName: zr,
				lineNumber: 111,
				columnNumber: 7
			}, this),
			b === "error" && ie ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
				id: "pageSegmentsMessage",
				style: Rr.message,
				children: "Page segment changes could not be saved. Please try again."
			}, void 0, !1, {
				fileName: zr,
				lineNumber: 132,
				columnNumber: 9
			}, this) : null,
			/* @__PURE__ */ (0, M.jsxDEV)("footer", {
				id: "pageSegmentsFooter",
				style: Rr.footer,
				children: /* @__PURE__ */ (0, M.jsxDEV)(ve, {
					disabled: !S || b === "saving",
					id: "pageSegmentsSubmitBtn",
					label: "Update",
					onConfirm: () => void C(),
					requireConfirmation: !1,
					style: Rr.button("primary"),
					variant: "primary"
				}, void 0, !1, {
					fileName: zr,
					lineNumber: 135,
					columnNumber: 9
				}, this)
			}, void 0, !1, {
				fileName: zr,
				lineNumber: 134,
				columnNumber: 7
			}, this)
		]
	}, void 0, !0, {
		fileName: zr,
		lineNumber: 93,
		columnNumber: 5
	}, this);
}
//#endregion
//#region src/features/audit/hook/useAuditReport.ts
function Ur({ apiGatewayUrl: e, authToken: t, callbacks: n, retryLimit: r, retryIntervalMs: i, session: a, workerClient: o }) {
	let s = D(n), l = me(() => o || ce({
		apiBaseUrl: e,
		onRetry: (e) => c.getState().setRetryAttempt(e),
		retryIntervalMs: i,
		retryLimit: r
	}), [
		e,
		i,
		r,
		o
	]), d = u();
	return T(() => {
		s.current = n;
	}, [n]), T(() => () => s.current.onAuditCanceled?.(), []), T(() => {
		v({
			authToken: t ?? "",
			session: a,
			background: !1,
			workerClient: l
		}).then((e) => {
			e && ("error" in e ? s.current.onAuditError?.(e) : s.current.onAuditLoaded?.(e));
		});
	}, [
		t,
		l,
		a
	]), {
		error: d.activeSession === a ? d.error : null,
		report: d.activeSession === a ? d.report : null,
		retryAttempt: d.retryAttempt,
		status: d.status
	};
}
//#endregion
//#region src/features/audit/style/auditStyles.ts
var Wr = {
	header: "var(--title-ink)",
	border: "var(--border-card)",
	muted: "var(--slate-500)"
}, Gr = "\n.audit-tabs button:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }\n.audit-panel [role=\"tabpanel\"]:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }\n", G = {
	tabs: {
		borderBottom: "1px solid var(--border-card)",
		display: "flex",
		flex: "0 0 auto",
		margin: "0 var(--panel-content-padding) 0.45rem",
		minWidth: 0
	},
	tab(e) {
		return {
			appearance: "none",
			background: "transparent",
			border: 0,
			borderBottom: `3px solid ${e ? "var(--primary)" : "transparent"}`,
			borderRadius: 0,
			boxShadow: "none",
			color: e ? "var(--primary-dark)" : "var(--body-ink)",
			cursor: "pointer",
			fontFamily: "inherit",
			fontSize: "0.9rem",
			fontWeight: 500,
			minHeight: "2.75rem",
			padding: "0.5rem 1rem",
			textAlign: "center",
			transform: "none",
			transition: "none",
			width: "8rem"
		};
	},
	root: {
		alignItems: "stretch",
		boxSizing: "border-box",
		color: "var(--title-ink)",
		display: "flex",
		flexDirection: "column",
		fontFamily: "var(--font-ui)",
		height: "100%",
		justifyContent: "flex-start",
		minHeight: 0,
		overflow: "hidden",
		position: "relative",
		textAlign: "left",
		width: "100%"
	},
	body: {
		boxSizing: "border-box",
		flex: "1 1 auto",
		minHeight: 0,
		overflowX: "hidden",
		overflowY: "auto",
		padding: "0 var(--panel-content-padding) 0.85rem",
		position: "relative",
		textAlign: "left",
		width: "100%"
	},
	summary: {
		display: "flex",
		flex: "0 0 auto",
		flexDirection: "column",
		marginLeft: 0,
		minWidth: "3.5rem",
		gridColumn: "2"
	},
	summaryRow: {
		display: "flex",
		justifyContent: "flex-end",
		width: "100%"
	},
	usage: {
		display: "grid",
		gap: "1rem",
		margin: "0.85rem 0",
		minWidth: 0
	},
	choices: {
		display: "grid",
		gap: "1rem",
		margin: "0.85rem 0",
		minWidth: 0
	},
	choiceValue: {
		...Pe.service,
		margin: 0,
		lineHeight: 1.45,
		overflowWrap: "anywhere",
		minWidth: 0
	},
	usageTable: { ...Pe.table },
	serviceCell: {
		...Pe.cell,
		...Pe.service,
		textAlign: "left"
	},
	usageCell: {
		...Pe.cell,
		...Pe.level,
		width: "4.75rem"
	},
	summaryBadge: {
		alignItems: "center",
		boxSizing: "border-box",
		display: "flex",
		flexDirection: "column",
		gap: "0.1rem",
		justifyContent: "center",
		height: "4rem",
		marginLeft: "auto",
		padding: "0.35rem 0.5rem",
		whiteSpace: "nowrap",
		width: "max-content"
	},
	summaryBadgeCount: {
		color: Wr.header,
		fontSize: "1.5rem",
		fontWeight: 700,
		lineHeight: 1
	},
	summaryBadgeLabel: {
		color: Wr.muted,
		fontSize: "0.75rem",
		fontWeight: 500
	},
	controlsRow: {
		alignItems: "end",
		display: "grid",
		gap: "0.75rem",
		gridTemplateColumns: "minmax(0, 1fr) auto",
		minWidth: 0,
		width: "100%"
	},
	filterFailure: {
		gridColumn: "1 / -1",
		minWidth: 0
	},
	filters: {
		display: "flex",
		flex: "1 1 auto",
		flexDirection: "column",
		gap: "0.35rem",
		minWidth: 0
	},
	filterRow: {
		alignItems: "flex-start",
		display: "flex",
		flexWrap: "wrap",
		gap: "0.75rem",
		width: "100%"
	},
	filterLabel: {
		display: "flex",
		flexDirection: "column",
		gap: "0.25rem",
		fontSize: "0.9rem",
		color: Wr.muted
	},
	filterSelect: {
		boxSizing: "border-box",
		border: `0.0625rem solid ${Wr.border}`,
		borderRadius: "var(--radius-control)",
		minHeight: "2.5rem",
		minWidth: "8rem",
		padding: "0.45rem 0.6rem",
		width: "100%"
	},
	filterSelectGroup: {
		flex: "1 1 10rem",
		minWidth: "10rem"
	},
	filterError: {
		background: "#FEF2F2",
		borderRadius: "var(--radius-control)",
		color: "var(--error-text-color-light)",
		padding: "0.45rem 0.6rem"
	},
	empty: { color: Wr.muted },
	gaps: {
		boxSizing: "border-box",
		display: "flex",
		flexDirection: "column",
		gap: "0.9rem",
		marginTop: "0.45rem"
	},
	gapCard: {
		background: "var(--white)",
		border: `1px solid ${Wr.border}`,
		borderRadius: "var(--radius-card)",
		boxShadow: "var(--shadow-card)",
		boxSizing: "border-box",
		display: "flex",
		flexDirection: "column",
		gap: "0.35rem",
		padding: "0.7rem 0.75rem"
	},
	gapHeader: {
		alignItems: "center",
		display: "flex",
		flexWrap: "wrap",
		gap: "0.35rem 0.75rem",
		justifyContent: "space-between"
	},
	gapAspect: {
		color: Wr.header,
		fontSize: "1rem",
		fontWeight: 700
	},
	gapDate: {
		color: Wr.muted,
		fontSize: "0.8rem"
	},
	gapMessage: {
		color: "var(--body-ink)",
		fontSize: "0.92rem",
		lineHeight: 1.45,
		whiteSpace: "pre-wrap",
		wordBreak: "break-word"
	},
	details: {
		display: "flex",
		flexDirection: "column",
		gap: "0.25rem",
		margin: 0,
		fontSize: "0.92rem",
		lineHeight: 1.45
	},
	detailRow: {
		display: "grid",
		gridTemplateColumns: "6rem minmax(0, 1fr)",
		gap: "0.5rem"
	},
	detailLabel: { color: Wr.muted },
	detailValue: {
		color: "var(--body-ink)",
		margin: 0,
		whiteSpace: "pre-wrap",
		overflowWrap: "anywhere",
		minWidth: 0
	},
	gapFooter: {
		alignItems: "baseline",
		display: "flex",
		flexWrap: "wrap",
		gap: "0.35rem 0.75rem",
		justifyContent: "space-between"
	},
	gapSegment: {
		color: Wr.muted,
		fontSize: "0.8rem",
		marginLeft: "auto",
		minWidth: 0,
		overflowWrap: "anywhere",
		textAlign: "right"
	},
	gapProcess: {
		color: Wr.muted,
		fontSize: "0.8rem",
		fontStyle: "italic"
	},
	toggle: {
		color: "var(--primary-dark)",
		cursor: "pointer",
		textDecoration: "underline"
	}
}, Kr = "REMOVE", qr = "CORRECTION", Jr = "VERIFICATION", Yr = "CORRECTION", Xr = "ENRICHMENT", Zr = "Reprocess |", Qr = "USER", $r = "OTHER";
function ei(e) {
	return !!e && typeof e == "object" && !Array.isArray(e);
}
function ti(e) {
	return String(e ?? "").trim();
}
function ni(e) {
	let t = Date.parse(e);
	return Number.isFinite(t) ? t : -Infinity;
}
function ri(e) {
	let t = ti(e).toUpperCase();
	return t === "ADD" || t === "ADDITION" ? "ADD" : t === "REMOVE" || t === "REMOVAL" ? Kr : t === "UPDATE" || t === "CORRECTION" ? qr : t || "OTHER";
}
function ii(e) {
	let t = ti(e).toLowerCase();
	return t === "indexing" || t === "verification" ? Jr : t === "correction" ? Yr : t === "formatting" || t === "enrichment" ? Xr : t === "refinement" || t === "reprocess |" ? Zr : t === "user" ? Qr : $r;
}
function ai(e) {
	return !ei(e) || !Array.isArray(e.services) ? {} : { usage: { services: e.services } };
}
function oi(e) {
	if (!ei(e)) return null;
	let t = e;
	if (typeof t.solution != "string" || typeof t.explanation != "string" || typeof t.page != "string" || typeof t.owner != "string" || typeof t.timestamp != "string" || typeof t.segment != "string" && t.segment !== null) return null;
	let n = ti(t.solution), r = ti(t.explanation);
	if (!n && !r) return null;
	if (t.patch != null) {
		if (!ei(t.patch)) return null;
		let e = t.patch;
		if (![
			"solution",
			"field",
			"explanation",
			"owner"
		].every((t) => typeof e[t] == "string") || ![
			"code",
			"value",
			"label",
			"aspect",
			"ambiguous",
			"source",
			"page",
			"segment"
		].every((t) => e[t] === null || typeof e[t] == "string")) return null;
		if (e.identifier !== null) {
			if (!ei(e.identifier)) return null;
			let t = e.identifier;
			if (![
				"value",
				"label",
				"aspect"
			].every((e) => t[e] === null || typeof t[e] == "string")) return null;
		}
	}
	return {
		solution: ri(n),
		explanation: r,
		page: ti(t.page),
		owner: ii(t.owner),
		timestamp: ti(t.timestamp),
		segment: t.segment === null ? null : ti(t.segment),
		...t.patch == null ? {} : { patch: t.patch }
	};
}
function si(e) {
	return e === "ADD" ? "add" : e === "REMOVE" ? "remove" : e === "CORRECTION" ? "correction" : "other";
}
function ci(e) {
	return e === "CORRECTION" ? "correction" : e === "ENRICHMENT" ? "enrichment" : e === "Reprocess |" ? "reprocess" : e === "USER" ? "user" : e === "VERIFICATION" ? "verification" : "other";
}
function li(e) {
	return e === "ADD" ? "Addition" : e === "REMOVE" ? "Remove" : e === "CORRECTION" ? "Correction" : "Other";
}
function ui(e) {
	return e === "ADD" ? "Addition" : e === "REMOVE" ? "Remove" : e === "CORRECTION" ? "Correction" : "Other";
}
function di(e) {
	return e === "VERIFICATION" ? "Verification" : e === "CORRECTION" ? "Correction" : e === "ENRICHMENT" ? "Enrichment" : e === "Reprocess |" ? "Reprocess" : e === "USER" ? "User change" : "Other";
}
function fi(e) {
	if (!e) return "N/A";
	let t = new Date(e);
	if (Number.isNaN(t.getTime())) return "N/A";
	try {
		return t.toLocaleString("en-US", {
			year: "numeric",
			month: "short",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			timeZoneName: "short"
		});
	} catch {
		return "N/A";
	}
}
function pi(e) {
	return {
		aspect: e.solution,
		aspectLabel: li(e.solution),
		changeType: e.solution,
		changeTypeLabel: ui(e.solution),
		date: e.timestamp,
		dateLabel: fi(e.timestamp),
		message: e.explanation,
		page: e.page,
		process: e.owner,
		processLabel: di(e.owner),
		segment: e.segment,
		...e.patch ? { patch: e.patch } : {}
	};
}
function mi(e) {
	if (!ei(e)) return [];
	let t = e;
	return (Array.isArray(t.gaps) ? t.gaps : []).map(oi).filter((e) => e !== null).map((e) => ({
		entry: e,
		rawDate: ni(e.timestamp)
	})).sort((e, t) => {
		let n = t.rawDate - e.rawDate;
		if (n !== 0) return n;
		let r = e.entry.solution.localeCompare(t.entry.solution);
		return r === 0 ? String(e.entry.page).localeCompare(String(t.entry.page)) : r;
	}).map((e) => e.entry);
}
function hi(e) {
	let t = ei(e) ? e : {}, n = { gaps: mi(t) }, r = ai(t.usage);
	return r.usage && (n.usage = r.usage), n;
}
function gi(e, t, n) {
	let r = mi(e), i = t.changeType ? ri(t.changeType) : "", a = t.process ? ii(t.process) : "", o = i.length > 0, s = a.length > 0, c = {
		add: 0,
		correction: 0,
		other: 0,
		remove: 0
	}, l = {
		correction: 0,
		enrichment: 0,
		other: 0,
		reprocess: 0,
		user: 0,
		verification: 0
	}, u = Object.fromEntries(n.map((e) => [e, 0])), d = 0, f = r.filter((e) => {
		let n = !s || e.owner === a, r = !o || e.solution === i, f = !t.segment || e.segment === t.segment;
		if (n && f) {
			let t = si(e.solution);
			c[t] += 1;
		}
		if (r && f) {
			let t = ci(e.owner);
			l[t] += 1;
		}
		return n && r && (d += 1, e.segment !== null && Object.hasOwn(u, e.segment) && (u[e.segment] += 1)), n && r && f;
	});
	return {
		changeCounts: c,
		filtered: f.length,
		gaps: f.map(pi),
		processCounts: l,
		segmentCounts: u,
		segmentTotal: d,
		total: r.length
	};
}
//#endregion
//#region src/features/audit/component/AuditFilters.tsx
var K = "C:/GitHub/Tabularium/aurorra_index/src/features/audit/component/AuditFilters.tsx", _i = [
	["", "All"],
	["ADD", "Addition"],
	["REMOVE", "Remove"],
	["CORRECTION", "Correction"]
], vi = [
	["", "All"],
	["VERIFICATION", "Verification"],
	["CORRECTION", "Correction"],
	["ENRICHMENT", "Enrichment"],
	["Reprocess |", "Reprocess"],
	["USER", "User change"],
	["OTHER", "Other"]
];
function yi({ filters: e, onFiltersChange: t, report: n, session: r, onResource: i }) {
	let a = me(() => ({ session: r }), [r]), [o, s] = O(!1), [c, l] = O(null), { aspects: u, ready: d } = x(a, r, i, s, l);
	if (n === null) return /* @__PURE__ */ (0, M.jsxDEV)("div", {
		style: G.filters,
		children: /* @__PURE__ */ (0, M.jsxDEV)(Ee, {
			label: "Loading audit filters",
			children: /* @__PURE__ */ (0, M.jsxDEV)("div", {
				style: G.filterRow,
				children: [
					"Change type",
					"Process",
					"Segment"
				].map((e) => /* @__PURE__ */ (0, M.jsxDEV)("div", {
					style: {
						...G.filterLabel,
						...G.filterSelectGroup
					},
					children: [/* @__PURE__ */ (0, M.jsxDEV)("span", { children: e }, void 0, !1, {
						fileName: K,
						lineNumber: 39,
						columnNumber: 147
					}, this), /* @__PURE__ */ (0, M.jsxDEV)("span", {
						"aria-hidden": "true",
						style: {
							...A,
							...G.filterSelect
						}
					}, void 0, !1, {
						fileName: K,
						lineNumber: 39,
						columnNumber: 167
					}, this)]
				}, e, !0, {
					fileName: K,
					lineNumber: 39,
					columnNumber: 57
				}, this))
			}, void 0, !1, {
				fileName: K,
				lineNumber: 38,
				columnNumber: 109
			}, this)
		}, void 0, !1, {
			fileName: K,
			lineNumber: 38,
			columnNumber: 62
		}, this)
	}, void 0, !1, {
		fileName: K,
		lineNumber: 38,
		columnNumber: 29
	}, this);
	let f = gi(n, e, Object.keys(u)), p = Object.values(f.changeCounts).reduce((e, t) => e + t, 0), m = Object.values(f.processCounts).reduce((e, t) => e + t, 0);
	return /* @__PURE__ */ (0, M.jsxDEV)("div", {
		style: G.filters,
		children: /* @__PURE__ */ (0, M.jsxDEV)("div", {
			style: G.filterRow,
			children: [
				/* @__PURE__ */ (0, M.jsxDEV)("label", {
					style: {
						...G.filterLabel,
						...G.filterSelectGroup
					},
					children: [/* @__PURE__ */ (0, M.jsxDEV)("span", { children: "Change type" }, void 0, !1, {
						fileName: K,
						lineNumber: 49,
						columnNumber: 11
					}, this), /* @__PURE__ */ (0, M.jsxDEV)("select", {
						"aria-label": "Change type",
						onChange: (n) => t({
							...e,
							changeType: n.target.value
						}),
						style: G.filterSelect,
						value: e.changeType,
						children: _i.map(([e, t]) => /* @__PURE__ */ (0, M.jsxDEV)("option", {
							value: e,
							children: `${t} (${e === "" ? p : f.changeCounts[e === "ADD" ? "add" : e === "REMOVE" ? "remove" : e === "CORRECTION" ? "correction" : "other"]})`
						}, `change-${e || "all"}`, !1, {
							fileName: K,
							lineNumber: 57,
							columnNumber: 15
						}, this))
					}, void 0, !1, {
						fileName: K,
						lineNumber: 50,
						columnNumber: 11
					}, this)]
				}, void 0, !0, {
					fileName: K,
					lineNumber: 48,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, M.jsxDEV)("label", {
					style: {
						...G.filterLabel,
						...G.filterSelectGroup
					},
					children: [/* @__PURE__ */ (0, M.jsxDEV)("span", { children: "Process" }, void 0, !1, {
						fileName: K,
						lineNumber: 69,
						columnNumber: 11
					}, this), /* @__PURE__ */ (0, M.jsxDEV)("select", {
						"aria-label": "Process",
						onChange: (n) => t({
							...e,
							process: n.target.value
						}),
						style: G.filterSelect,
						value: e.process,
						children: vi.map(([e, t]) => /* @__PURE__ */ (0, M.jsxDEV)("option", {
							value: e,
							children: `${t} (${e === "" ? m : f.processCounts[e === "VERIFICATION" ? "verification" : e === "CORRECTION" ? "correction" : e === "ENRICHMENT" ? "enrichment" : e === "Reprocess |" ? "reprocess" : e === "USER" ? "user" : "other"]})`
						}, `process-${e || "all"}`, !1, {
							fileName: K,
							lineNumber: 77,
							columnNumber: 15
						}, this))
					}, void 0, !1, {
						fileName: K,
						lineNumber: 70,
						columnNumber: 11
					}, this)]
				}, void 0, !0, {
					fileName: K,
					lineNumber: 68,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, M.jsxDEV)("label", {
					style: {
						...G.filterLabel,
						...G.filterSelectGroup
					},
					children: [/* @__PURE__ */ (0, M.jsxDEV)("span", { children: "Segment" }, void 0, !1, {
						fileName: K,
						lineNumber: 89,
						columnNumber: 11
					}, this), o ? c ? /* @__PURE__ */ (0, M.jsxDEV)("span", {
						role: "alert",
						style: G.filterError,
						children: "Segment options could not be loaded. Refresh the Audit & Usage to try again."
					}, void 0, !1, {
						fileName: K,
						lineNumber: 91,
						columnNumber: 13
					}, this) : d ? /* @__PURE__ */ (0, M.jsxDEV)("select", {
						"aria-label": "Segment",
						onChange: (n) => t({
							...e,
							segment: n.target.value
						}),
						style: G.filterSelect,
						value: e.segment,
						children: [/* @__PURE__ */ (0, M.jsxDEV)("option", {
							value: "",
							children: `All (${f.segmentTotal})`
						}, void 0, !1, {
							fileName: K,
							lineNumber: 98,
							columnNumber: 13
						}, this), Object.entries(f.segmentCounts).map(([e, t]) => /* @__PURE__ */ (0, M.jsxDEV)("option", {
							value: e,
							children: `${ze(e)} (${t})`
						}, e, !1, {
							fileName: K,
							lineNumber: 100,
							columnNumber: 15
						}, this))]
					}, void 0, !0, {
						fileName: K,
						lineNumber: 92,
						columnNumber: 23
					}, this) : null : /* @__PURE__ */ (0, M.jsxDEV)(Ee, { label: "Loading segment options" }, void 0, !1, {
						fileName: K,
						lineNumber: 90,
						columnNumber: 29
					}, this)]
				}, void 0, !0, {
					fileName: K,
					lineNumber: 88,
					columnNumber: 9
				}, this)
			]
		}, void 0, !0, {
			fileName: K,
			lineNumber: 47,
			columnNumber: 7
		}, this)
	}, void 0, !1, {
		fileName: K,
		lineNumber: 46,
		columnNumber: 5
	}, this);
}
//#endregion
//#region src/features/audit/component/AuditGaps.tsx
var q = "C:/GitHub/Tabularium/aurorra_index/src/features/audit/component/AuditGaps.tsx", bi = 200;
function xi(e, t) {
	return `${e.aspect}|${e.page}|${e.date}|${t}`;
}
function Si({ isOpen: e, message: t, onToggle: n }) {
	let r = t.replace(/\s+/g, " ").trim();
	return r.length <= bi ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
		style: G.gapMessage,
		children: r
	}, void 0, !1, {
		fileName: q,
		lineNumber: 27,
		columnNumber: 12
	}, this) : /* @__PURE__ */ (0, M.jsxDEV)("div", {
		style: G.gapMessage,
		children: [e ? r : `${r.slice(0, bi)}...`, /* @__PURE__ */ (0, M.jsxDEV)("a", {
			href: "#",
			onClick: (e) => {
				e.preventDefault(), n();
			},
			style: {
				...G.toggle,
				whiteSpace: "nowrap",
				marginLeft: "0.25rem"
			},
			children: e ? "[Show less]" : "[Show more]"
		}, void 0, !1, {
			fileName: q,
			lineNumber: 33,
			columnNumber: 7
		}, this)]
	}, void 0, !0, {
		fileName: q,
		lineNumber: 31,
		columnNumber: 5
	}, this);
}
function Ci({ report: e, filters: t }) {
	let [n, r] = O({}), i = e ? gi(e, t, []).gaps : null;
	function a(e) {
		r((t) => ({
			...t,
			[e]: !t[e]
		}));
	}
	return i === null ? /* @__PURE__ */ (0, M.jsxDEV)(Ee, {
		label: "Loading audit gaps",
		children: /* @__PURE__ */ (0, M.jsxDEV)("div", {
			"aria-hidden": "true",
			style: G.gaps,
			children: [
				0,
				1,
				2
			].map((e) => /* @__PURE__ */ (0, M.jsxDEV)("article", {
				style: G.gapCard,
				children: [
					/* @__PURE__ */ (0, M.jsxDEV)("div", {
						style: G.gapHeader,
						children: [/* @__PURE__ */ (0, M.jsxDEV)("span", { style: {
							...A,
							width: "35%"
						} }, void 0, !1, {
							fileName: q,
							lineNumber: 58,
							columnNumber: 44
						}, this), /* @__PURE__ */ (0, M.jsxDEV)("span", { style: {
							...A,
							width: "20%"
						} }, void 0, !1, {
							fileName: q,
							lineNumber: 58,
							columnNumber: 95
						}, this)]
					}, void 0, !0, {
						fileName: q,
						lineNumber: 58,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ (0, M.jsxDEV)("dl", {
						style: G.details,
						children: [0, 1].map((e) => /* @__PURE__ */ (0, M.jsxDEV)("div", {
							style: G.detailRow,
							children: [/* @__PURE__ */ (0, M.jsxDEV)("dt", {
								style: G.detailLabel,
								children: /* @__PURE__ */ (0, M.jsxDEV)("span", { style: {
									...A,
									width: "80%"
								} }, void 0, !1, {
									fileName: q,
									lineNumber: 59,
									columnNumber: 141
								}, this)
							}, void 0, !1, {
								fileName: q,
								lineNumber: 59,
								columnNumber: 105
							}, this), /* @__PURE__ */ (0, M.jsxDEV)("dd", {
								style: G.detailValue,
								children: /* @__PURE__ */ (0, M.jsxDEV)("span", { style: {
									...A,
									width: "65%"
								} }, void 0, !1, {
									fileName: q,
									lineNumber: 59,
									columnNumber: 233
								}, this)
							}, void 0, !1, {
								fileName: q,
								lineNumber: 59,
								columnNumber: 197
							}, this)]
						}, e, !0, {
							fileName: q,
							lineNumber: 59,
							columnNumber: 60
						}, this))
					}, void 0, !1, {
						fileName: q,
						lineNumber: 59,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ (0, M.jsxDEV)("div", {
						style: G.gapMessage,
						children: [/* @__PURE__ */ (0, M.jsxDEV)("span", { style: {
							...A,
							width: "95%"
						} }, void 0, !1, {
							fileName: q,
							lineNumber: 60,
							columnNumber: 45
						}, this), /* @__PURE__ */ (0, M.jsxDEV)("span", { style: {
							...A,
							width: "75%"
						} }, void 0, !1, {
							fileName: q,
							lineNumber: 60,
							columnNumber: 96
						}, this)]
					}, void 0, !0, {
						fileName: q,
						lineNumber: 60,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ (0, M.jsxDEV)("div", {
						style: G.gapFooter,
						children: [/* @__PURE__ */ (0, M.jsxDEV)("span", { style: {
							...A,
							width: "25%"
						} }, void 0, !1, {
							fileName: q,
							lineNumber: 61,
							columnNumber: 44
						}, this), /* @__PURE__ */ (0, M.jsxDEV)("span", { style: {
							...A,
							width: "20%"
						} }, void 0, !1, {
							fileName: q,
							lineNumber: 61,
							columnNumber: 95
						}, this)]
					}, void 0, !0, {
						fileName: q,
						lineNumber: 61,
						columnNumber: 9
					}, this)
				]
			}, e, !0, {
				fileName: q,
				lineNumber: 57,
				columnNumber: 31
			}, this))
		}, void 0, !1, {
			fileName: q,
			lineNumber: 56,
			columnNumber: 5
		}, this)
	}, void 0, !1, {
		fileName: q,
		lineNumber: 55,
		columnNumber: 29
	}, this) : i.length === 0 ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
		style: G.empty,
		children: "No gaps found."
	}, void 0, !1, {
		fileName: q,
		lineNumber: 67,
		columnNumber: 12
	}, this) : /* @__PURE__ */ (0, M.jsxDEV)("section", {
		"aria-label": "Audit gaps",
		style: G.gaps,
		children: i.map((e, t) => {
			let r = xi(e, t), i = n[r] === !0, o = e.patch, s = o?.value != null && o.value.trim() !== "", c = [
				["Target label", o?.identifier?.label],
				["Target aspect", o?.identifier?.aspect],
				["Target index", o?.identifier?.value],
				["Index", s && o?.field.trim() ? `${o.value} (${o.field})` : o?.value],
				["Field", s ? null : o?.field],
				["Page", e.page],
				["Source", o?.source]
			].filter(([, e]) => e != null && String(e).trim() !== "");
			return /* @__PURE__ */ (0, M.jsxDEV)("article", {
				style: G.gapCard,
				children: [
					/* @__PURE__ */ (0, M.jsxDEV)("div", {
						style: G.gapHeader,
						children: [/* @__PURE__ */ (0, M.jsxDEV)("div", {
							style: G.gapAspect,
							children: e.aspectLabel
						}, void 0, !1, {
							fileName: q,
							lineNumber: 90,
							columnNumber: 15
						}, this), /* @__PURE__ */ (0, M.jsxDEV)("div", {
							style: G.gapDate,
							children: e.dateLabel
						}, void 0, !1, {
							fileName: q,
							lineNumber: 91,
							columnNumber: 15
						}, this)]
					}, void 0, !0, {
						fileName: q,
						lineNumber: 89,
						columnNumber: 13
					}, this),
					c.length > 0 && /* @__PURE__ */ (0, M.jsxDEV)("dl", {
						style: G.details,
						children: c.map(([e, t]) => /* @__PURE__ */ (0, M.jsxDEV)("div", {
							style: G.detailRow,
							children: [/* @__PURE__ */ (0, M.jsxDEV)("dt", {
								style: G.detailLabel,
								children: e
							}, void 0, !1, {
								fileName: q,
								lineNumber: 97,
								columnNumber: 21
							}, this), /* @__PURE__ */ (0, M.jsxDEV)("dd", {
								style: G.detailValue,
								children: t
							}, void 0, !1, {
								fileName: q,
								lineNumber: 98,
								columnNumber: 21
							}, this)]
						}, e, !0, {
							fileName: q,
							lineNumber: 96,
							columnNumber: 19
						}, this))
					}, void 0, !1, {
						fileName: q,
						lineNumber: 94,
						columnNumber: 15
					}, this),
					/* @__PURE__ */ (0, M.jsxDEV)(Si, {
						isOpen: i,
						message: e.message,
						onToggle: () => a(r)
					}, void 0, !1, {
						fileName: q,
						lineNumber: 103,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ (0, M.jsxDEV)("div", {
						style: G.gapFooter,
						children: [/* @__PURE__ */ (0, M.jsxDEV)("div", {
							style: G.gapProcess,
							children: e.processLabel
						}, void 0, !1, {
							fileName: q,
							lineNumber: 109,
							columnNumber: 15
						}, this), e.segment && /* @__PURE__ */ (0, M.jsxDEV)("div", {
							style: G.gapSegment,
							children: e.segment
						}, void 0, !1, {
							fileName: q,
							lineNumber: 110,
							columnNumber: 31
						}, this)]
					}, void 0, !0, {
						fileName: q,
						lineNumber: 108,
						columnNumber: 13
					}, this)
				]
			}, r, !0, {
				fileName: q,
				lineNumber: 88,
				columnNumber: 11
			}, this);
		})
	}, void 0, !1, {
		fileName: q,
		lineNumber: 71,
		columnNumber: 5
	}, this);
}
//#endregion
//#region src/features/audit/component/AuditSummary.tsx
var wi = "C:/GitHub/Tabularium/aurorra_index/src/features/audit/component/AuditSummary.tsx";
function Ti({ report: e, filters: t, error: n }) {
	let r = !n && e ? gi(e, t, []) : null;
	return /* @__PURE__ */ (0, M.jsxDEV)("div", {
		style: G.summary,
		children: /* @__PURE__ */ (0, M.jsxDEV)("div", {
			style: G.summaryRow,
			children: /* @__PURE__ */ (0, M.jsxDEV)("div", {
				style: G.summaryBadge,
				children: n ? /* @__PURE__ */ (0, M.jsxDEV)(xe, {
					label: "Audit summary",
					error: n
				}, void 0, !1, {
					fileName: wi,
					lineNumber: 19,
					columnNumber: 20
				}, this) : r === null ? /* @__PURE__ */ (0, M.jsxDEV)(Ee, {
					compact: !0,
					label: "Loading audit summary",
					children: /* @__PURE__ */ (0, M.jsxDEV)("div", {
						"aria-hidden": "true",
						style: {
							display: "flex",
							flexDirection: "column",
							gap: "0.25rem"
						},
						children: [/* @__PURE__ */ (0, M.jsxDEV)("span", { style: {
							...A,
							width: "2rem",
							height: G.summaryBadgeCount.fontSize
						} }, void 0, !1, {
							fileName: wi,
							lineNumber: 19,
							columnNumber: 237
						}, this), /* @__PURE__ */ (0, M.jsxDEV)("span", { style: {
							...A,
							width: "3.5rem",
							height: G.summaryBadgeLabel.fontSize
						} }, void 0, !1, {
							fileName: wi,
							lineNumber: 19,
							columnNumber: 337
						}, this)]
					}, void 0, !0, {
						fileName: wi,
						lineNumber: 19,
						columnNumber: 144
					}, this)
				}, void 0, !1, {
					fileName: wi,
					lineNumber: 19,
					columnNumber: 89
				}, this) : /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [/* @__PURE__ */ (0, M.jsxDEV)("span", {
					style: G.summaryBadgeCount,
					children: r.filtered
				}, void 0, !1, {
					fileName: wi,
					lineNumber: 20,
					columnNumber: 13
				}, this), /* @__PURE__ */ (0, M.jsxDEV)("span", {
					style: G.summaryBadgeLabel,
					children: ["Out of ", r.total]
				}, void 0, !0, {
					fileName: wi,
					lineNumber: 21,
					columnNumber: 13
				}, this)] }, void 0, !0, {
					fileName: wi,
					lineNumber: 19,
					columnNumber: 466
				}, this)
			}, void 0, !1, {
				fileName: wi,
				lineNumber: 18,
				columnNumber: 9
			}, this)
		}, void 0, !1, {
			fileName: wi,
			lineNumber: 17,
			columnNumber: 7
		}, this)
	}, void 0, !1, {
		fileName: wi,
		lineNumber: 16,
		columnNumber: 5
	}, this);
}
//#endregion
//#region src/features/audit/component/AuditUsage.tsx
var J = "C:/GitHub/Tabularium/aurorra_index/src/features/audit/component/AuditUsage.tsx";
function Ei({ report: e, session: t }) {
	if (e === null) return /* @__PURE__ */ (0, M.jsxDEV)(Ee, {
		label: "Loading service usage",
		children: /* @__PURE__ */ (0, M.jsxDEV)("section", {
			style: G.usage,
			children: [/* @__PURE__ */ (0, M.jsxDEV)("h3", {
				style: Pe.heading,
				children: "Service usage"
			}, void 0, !1, {
				fileName: J,
				lineNumber: 8,
				columnNumber: 5
			}, this), /* @__PURE__ */ (0, M.jsxDEV)("div", {
				"aria-label": "Service usage table",
				role: "region",
				tabIndex: 0,
				style: Pe.tableFrame,
				children: /* @__PURE__ */ (0, M.jsxDEV)("table", {
					"aria-label": "Audit service usage",
					style: G.usageTable,
					children: [/* @__PURE__ */ (0, M.jsxDEV)("thead", {
						style: Pe.tableHead,
						children: /* @__PURE__ */ (0, M.jsxDEV)("tr", { children: [/* @__PURE__ */ (0, M.jsxDEV)("th", {
							scope: "col",
							style: Pe.cell,
							children: "Service"
						}, void 0, !1, {
							fileName: J,
							lineNumber: 11,
							columnNumber: 50
						}, this), [
							"Credits",
							"Time",
							"Pages"
						].map((e) => /* @__PURE__ */ (0, M.jsxDEV)("th", {
							scope: "col",
							style: G.usageCell,
							children: e
						}, e, !1, {
							fileName: J,
							lineNumber: 11,
							columnNumber: 148
						}, this))] }, void 0, !0, {
							fileName: J,
							lineNumber: 11,
							columnNumber: 46
						}, this)
					}, void 0, !1, {
						fileName: J,
						lineNumber: 11,
						columnNumber: 7
					}, this), /* @__PURE__ */ (0, M.jsxDEV)("tbody", {
						"aria-hidden": "true",
						children: [
							0,
							1,
							2
						].map((e) => /* @__PURE__ */ (0, M.jsxDEV)("tr", { children: [
							0,
							1,
							2,
							3
						].map((e) => /* @__PURE__ */ (0, M.jsxDEV)("td", {
							style: e === 0 ? G.serviceCell : G.usageCell,
							children: /* @__PURE__ */ (0, M.jsxDEV)("span", { style: {
								...A,
								width: e === 0 ? "70%" : "2rem"
							} }, void 0, !1, {
								fileName: J,
								lineNumber: 12,
								columnNumber: 185
							}, this)
						}, e, !1, {
							fileName: J,
							lineNumber: 12,
							columnNumber: 97
						}, this)) }, e, !1, {
							fileName: J,
							lineNumber: 12,
							columnNumber: 55
						}, this))
					}, void 0, !1, {
						fileName: J,
						lineNumber: 12,
						columnNumber: 7
					}, this)]
				}, void 0, !0, {
					fileName: J,
					lineNumber: 10,
					columnNumber: 5
				}, this)
			}, void 0, !1, {
				fileName: J,
				lineNumber: 9,
				columnNumber: 5
			}, this)]
		}, void 0, !0, {
			fileName: J,
			lineNumber: 7,
			columnNumber: 78
		}, this)
	}, void 0, !1, {
		fileName: J,
		lineNumber: 7,
		columnNumber: 31
	}, this);
	if (!e.usage?.services?.length) return null;
	let n = nt(e.usage.services.map((e) => ({
		...e,
		session: t
	})));
	return /* @__PURE__ */ (0, M.jsxDEV)("section", {
		"aria-label": "Audit usage",
		style: G.usage,
		children: [/* @__PURE__ */ (0, M.jsxDEV)("h3", {
			style: Pe.heading,
			children: "Service usage"
		}, void 0, !1, {
			fileName: J,
			lineNumber: 19,
			columnNumber: 5
		}, this), /* @__PURE__ */ (0, M.jsxDEV)("div", {
			"aria-label": "Service usage table",
			role: "region",
			tabIndex: 0,
			style: Pe.tableFrame,
			children: /* @__PURE__ */ (0, M.jsxDEV)("table", {
				"aria-label": "Audit service usage",
				style: G.usageTable,
				children: [/* @__PURE__ */ (0, M.jsxDEV)("thead", {
					style: Pe.tableHead,
					children: /* @__PURE__ */ (0, M.jsxDEV)("tr", { children: [/* @__PURE__ */ (0, M.jsxDEV)("th", {
						scope: "col",
						style: Pe.cell,
						children: "Service"
					}, void 0, !1, {
						fileName: J,
						lineNumber: 22,
						columnNumber: 50
					}, this), [
						"Credits",
						"Time",
						"Pages"
					].map((e) => /* @__PURE__ */ (0, M.jsxDEV)("th", {
						scope: "col",
						style: G.usageCell,
						children: e
					}, e, !1, {
						fileName: J,
						lineNumber: 23,
						columnNumber: 52
					}, this))] }, void 0, !0, {
						fileName: J,
						lineNumber: 22,
						columnNumber: 46
					}, this)
				}, void 0, !1, {
					fileName: J,
					lineNumber: 22,
					columnNumber: 7
				}, this), /* @__PURE__ */ (0, M.jsxDEV)("tbody", { children: n.map((e) => /* @__PURE__ */ (0, M.jsxDEV)("tr", { children: [
					/* @__PURE__ */ (0, M.jsxDEV)("th", {
						scope: "row",
						style: G.serviceCell,
						children: et[e.name]
					}, void 0, !1, {
						fileName: J,
						lineNumber: 26,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ (0, M.jsxDEV)("td", {
						style: G.usageCell,
						children: /* @__PURE__ */ (0, M.jsxDEV)(ye, { value: e.cost }, void 0, !1, {
							fileName: J,
							lineNumber: 27,
							columnNumber: 43
						}, this)
					}, void 0, !1, {
						fileName: J,
						lineNumber: 27,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ (0, M.jsxDEV)("td", {
						style: G.usageCell,
						children: e.time === null ? null : `${e.time.toFixed(2)} s`
					}, void 0, !1, {
						fileName: J,
						lineNumber: 28,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ (0, M.jsxDEV)("td", {
						style: G.usageCell,
						children: e.pages
					}, void 0, !1, {
						fileName: J,
						lineNumber: 29,
						columnNumber: 9
					}, this)
				] }, e.name, !0, {
					fileName: J,
					lineNumber: 25,
					columnNumber: 36
				}, this)) }, void 0, !1, {
					fileName: J,
					lineNumber: 25,
					columnNumber: 7
				}, this)]
			}, void 0, !0, {
				fileName: J,
				lineNumber: 21,
				columnNumber: 5
			}, this)
		}, void 0, !1, {
			fileName: J,
			lineNumber: 20,
			columnNumber: 5
		}, this)]
	}, void 0, !0, {
		fileName: J,
		lineNumber: 18,
		columnNumber: 10
	}, this);
}
//#endregion
//#region src/features/audit/component/AuditChoices.tsx
var Di = "C:/GitHub/Tabularium/aurorra_index/src/features/audit/component/AuditChoices.tsx";
function Oi({ session: e, sourceDownload: t }) {
	let n = ee((e) => e.choices);
	return re((e) => e.session) !== e || n === null ? /* @__PURE__ */ (0, M.jsxDEV)("p", {
		style: G.empty,
		children: "Session choices are unavailable."
	}, void 0, !1, {
		fileName: Di,
		lineNumber: 10,
		columnNumber: 56
	}, this) : /* @__PURE__ */ (0, M.jsxDEV)("section", {
		"aria-label": "Session choices",
		style: G.choices,
		children: [
			t,
			/* @__PURE__ */ (0, M.jsxDEV)("h3", {
				style: Pe.heading,
				children: "Jurisdiction"
			}, void 0, !1, {
				fileName: Di,
				lineNumber: 13,
				columnNumber: 5
			}, this),
			/* @__PURE__ */ (0, M.jsxDEV)("p", {
				style: G.choiceValue,
				children: n.jurisdiction?.trim() || "No jurisdiction selected"
			}, void 0, !1, {
				fileName: Di,
				lineNumber: 14,
				columnNumber: 5
			}, this),
			/* @__PURE__ */ (0, M.jsxDEV)(_e, {
				items: n.items,
				columns: 1
			}, void 0, !1, {
				fileName: Di,
				lineNumber: 15,
				columnNumber: 5
			}, this)
		]
	}, void 0, !0, {
		fileName: Di,
		lineNumber: 11,
		columnNumber: 10
	}, this);
}
//#endregion
//#region src/features/audit/component/AuditPanel.tsx
var Y = "C:/GitHub/Tabularium/aurorra_index/src/features/audit/component/AuditPanel.tsx", ki = {
	changeType: "",
	process: "",
	segment: ""
}, Ai = [
	"Changes",
	"Usage",
	"Choices"
];
function ji(e) {
	let { report: t, error: n } = Ur(e), [r, i] = O(ki), { active: a, controls: o, panel: s } = Ze(Ai, "Audit views", {
		storageKey: `aurorra-index:audit-tab:${e.session}`,
		className: "audit-tabs",
		style: G.tabs,
		tabStyle: G.tab,
		hideSingle: !1
	});
	return /* @__PURE__ */ (0, M.jsxDEV)("section", {
		"aria-label": "Audit panel",
		className: "audit-panel",
		style: G.root,
		children: [
			/* @__PURE__ */ (0, M.jsxDEV)("style", { children: Gr }, void 0, !1, {
				fileName: Y,
				lineNumber: 23,
				columnNumber: 5
			}, this),
			o,
			/* @__PURE__ */ (0, M.jsxDEV)("div", {
				"aria-label": "Audit & Usage body",
				"data-panel-scroll": "true",
				role: "region",
				style: G.body,
				children: /* @__PURE__ */ (0, M.jsxDEV)("div", {
					...s,
					children: [
						/* @__PURE__ */ (0, M.jsxDEV)("div", {
							hidden: a !== "Changes",
							children: /* @__PURE__ */ (0, M.jsxDEV)("div", {
								"data-audit-controls": !0,
								style: G.controlsRow,
								children: [/* @__PURE__ */ (0, M.jsxDEV)(Se, {
									title: "Audit filters",
									resetKey: t,
									fallback: (e, t) => /* @__PURE__ */ (0, M.jsxDEV)("div", {
										style: G.filterFailure,
										children: /* @__PURE__ */ (0, M.jsxDEV)(Te, {
											title: "Audit filters",
											detail: e.message,
											onRetry: t
										}, void 0, !1, {
											fileName: Y,
											lineNumber: 29,
											columnNumber: 135
										}, this)
									}, void 0, !1, {
										fileName: Y,
										lineNumber: 29,
										columnNumber: 96
									}, this),
									children: /* @__PURE__ */ (0, M.jsxDEV)(yi, {
										filters: r,
										onFiltersChange: i,
										report: t,
										session: e.session,
										onResource: e.onResource
									}, e.session, !1, {
										fileName: Y,
										lineNumber: 29,
										columnNumber: 217
									}, this)
								}, void 0, !1, {
									fileName: Y,
									lineNumber: 29,
									columnNumber: 13
								}, this), /* @__PURE__ */ (0, M.jsxDEV)(Se, {
									title: "Audit summary",
									resetKey: t,
									fallback: (n) => /* @__PURE__ */ (0, M.jsxDEV)(Ti, {
										report: t,
										filters: r,
										error: n.message
									}, e.session, !1, {
										fileName: Y,
										lineNumber: 31,
										columnNumber: 87
									}, this),
									children: /* @__PURE__ */ (0, M.jsxDEV)(Ti, {
										report: t,
										filters: r
									}, e.session, !1, {
										fileName: Y,
										lineNumber: 31,
										columnNumber: 181
									}, this)
								}, void 0, !1, {
									fileName: Y,
									lineNumber: 31,
									columnNumber: 13
								}, this)]
							}, void 0, !0, {
								fileName: Y,
								lineNumber: 28,
								columnNumber: 11
							}, this)
						}, void 0, !1, {
							fileName: Y,
							lineNumber: 27,
							columnNumber: 9
						}, this),
						n && t === null ? null : /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [/* @__PURE__ */ (0, M.jsxDEV)("div", {
							hidden: a !== "Changes",
							children: /* @__PURE__ */ (0, M.jsxDEV)(Se, {
								title: "Audit gaps",
								resetKey: t,
								children: /* @__PURE__ */ (0, M.jsxDEV)(Ci, {
									report: t,
									filters: r
								}, e.session, !1, {
									fileName: Y,
									lineNumber: 36,
									columnNumber: 65
								}, this)
							}, void 0, !1, {
								fileName: Y,
								lineNumber: 36,
								columnNumber: 13
							}, this)
						}, void 0, !1, {
							fileName: Y,
							lineNumber: 35,
							columnNumber: 11
						}, this), /* @__PURE__ */ (0, M.jsxDEV)("div", {
							hidden: a !== "Usage",
							children: /* @__PURE__ */ (0, M.jsxDEV)(Se, {
								title: "Audit usage",
								resetKey: t,
								children: /* @__PURE__ */ (0, M.jsxDEV)(Ei, {
									report: t,
									session: e.session
								}, e.session, !1, {
									fileName: Y,
									lineNumber: 39,
									columnNumber: 66
								}, this)
							}, void 0, !1, {
								fileName: Y,
								lineNumber: 39,
								columnNumber: 13
							}, this)
						}, void 0, !1, {
							fileName: Y,
							lineNumber: 38,
							columnNumber: 11
						}, this)] }, void 0, !0, {
							fileName: Y,
							lineNumber: 34,
							columnNumber: 44
						}, this),
						/* @__PURE__ */ (0, M.jsxDEV)("div", {
							hidden: a !== "Choices",
							children: /* @__PURE__ */ (0, M.jsxDEV)(Se, {
								title: "Session choices",
								resetKey: e.session,
								children: /* @__PURE__ */ (0, M.jsxDEV)(Oi, {
									session: e.session,
									sourceDownload: e.sourceDownload
								}, e.session, !1, {
									fileName: Y,
									lineNumber: 43,
									columnNumber: 75
								}, this)
							}, void 0, !1, {
								fileName: Y,
								lineNumber: 43,
								columnNumber: 11
							}, this)
						}, void 0, !1, {
							fileName: Y,
							lineNumber: 42,
							columnNumber: 9
						}, this)
					]
				}, void 0, !0, {
					fileName: Y,
					lineNumber: 26,
					columnNumber: 7
				}, this)
			}, void 0, !1, {
				fileName: Y,
				lineNumber: 25,
				columnNumber: 5
			}, this)
		]
	}, void 0, !0, {
		fileName: Y,
		lineNumber: 22,
		columnNumber: 10
	}, this);
}
//#endregion
//#region src/features/iq/data/iqData.ts
function Mi(e, t, n) {
	return t && t !== e && t.class === n?.class && t.jurisdiction === n.jurisdiction ? t : n;
}
function Ni(e) {
	let t = e;
	return {
		...e instanceof ErrorEvent ? { cause: e } : {},
		code: typeof t?.code == "string" ? t.code : void 0,
		details: t?.details,
		error: typeof t?.error == "string" ? t.error : typeof t?.message == "string" ? t.message : "IQ request failed.",
		status: typeof t?.status == "number" ? t.status : void 0
	};
}
var Pi = "PASS", Fi = "FAIL", Ii = "WARNING", Li = "INFO", Ri = "success", zi = "fail", Bi = "warning";
function Vi(e) {
	let t = Number(e);
	return Number.isFinite(t) ? t : 0;
}
function Hi(e) {
	return Math.min(100, Math.max(0, Vi(e)));
}
function Ui(e) {
	let t = Hi(e);
	return t >= 96 ? "green" : t >= 82 ? "amber" : "red";
}
function Wi(e) {
	return e === "PASS" || e === "FAIL" || e === "WARNING";
}
function Gi(e) {
	switch (e) {
		case Pi: return Ri;
		case Fi: return zi;
		case Ii: return Bi;
	}
}
function Ki(e) {
	return Vi(e).toFixed(2);
}
function qi(e) {
	let t = String(e || "").replace(/[_-]+/g, " ").trim().toLowerCase();
	return t ? t.replace(/\b([a-z])/g, (e, t) => t.toUpperCase()) : "";
}
function Ji(e) {
	return e == null ? "" : String(e);
}
function Yi(e) {
	let t = e && typeof e == "object" ? e : {};
	return {
		get iq_doc() {
			return Vi(t.iq_doc);
		},
		get gates() {
			return Array.isArray(t.gates) ? t.gates.map((e) => {
				let t = e && typeof e == "object" ? e : {};
				return {
					code: Ji(t.code),
					status: Ji(t.status),
					description: typeof t.description == "string" ? t.description : "Detailed values are unavailable for this saved result."
				};
			}) : [];
		},
		get segments() {
			return Array.isArray(t.segments) ? t.segments.map((e) => {
				let t = e && typeof e == "object" ? e : {};
				return {
					segment_name: Ji(t.segment_name),
					expected_weight: Vi(t.expected_weight),
					actual_weight: Vi(t.actual_weight),
					iq: Vi(t.iq),
					get cues() {
						if (!Array.isArray(t.cues)) throw Error("IQ cue findings are missing.");
						return t.cues;
					},
					get explanations() {
						let e = t.explanations;
						return Array.isArray(e) ? e.map(Ji) : [];
					}
				};
			}) : [];
		},
		get notes() {
			return Array.isArray(t.notes) ? t.notes.map((e) => ({
				segment: e.segment,
				message: e.message
			})) : [];
		}
	};
}
function Xi(e) {
	try {
		return {
			data: e(),
			error: null
		};
	} catch (e) {
		return {
			data: null,
			error: e instanceof Error ? e.message : String(e)
		};
	}
}
function Zi(e) {
	let t = Yi(e), n = Xi(() => t.gates);
	return {
		iq: Xi(() => {
			let e = Hi(t.iq_doc);
			return {
				value: e,
				displayInt: Math.round(e),
				bucket: Ui(e)
			};
		}),
		gates: n.error === null ? Xi(() => {
			let e = n.data.filter((e) => Wi(e.status)).map((e) => ({
				code: e.code,
				status: Gi(e.status),
				description: e.description,
				isFailure: e.status === Fi,
				label: e.status,
				clearable: e.status === "FAIL" || e.status === "WARNING"
			})), t = e.filter((e) => e.isFailure === !1).length, r = e.length > 0 ? t / e.length * 100 : 0;
			return {
				items: e,
				total: e.length,
				success: t,
				ratio: r,
				displayPercent: Math.round(r),
				bucket: Ui(r)
			};
		}) : n,
		segments: Xi(() => t.segments.sort((e, t) => t.expected_weight - e.expected_weight).map((e) => ({
			id: e.segment_name,
			displayId: qi(e.segment_name),
			expectedWeight: e.expected_weight,
			expectedDisplay: Ki(e.expected_weight),
			actualWeight: e.actual_weight,
			actualDisplay: Ki(e.actual_weight),
			iq: e.iq,
			iqDisplay: `${Math.round(e.iq)}%`,
			explanations: Xi(() => e.explanations),
			cues: Xi(() => e.cues)
		}))),
		notes: Xi(() => t.notes.filter(({ message: e }) => !e.startsWith("Compliance gates") && !e.startsWith("Indexing quality")).map(({ segment: e, message: t }) => ({
			segment: e === null ? null : qi(e),
			message: t,
			status: /^Unclassified indexes: (Optimal|Satisfied)\b/.test(t) ? Ri : t.startsWith("WARNING:") || t.startsWith("Unclassified indexes") || t.startsWith("Missing indexes") ? Bi : "neutral"
		})))
	};
}
//#endregion
//#region src/features/iq/worker/iqWorkerClient.ts
function Qi(e, t) {
	let n = Error(e);
	if (t && typeof t == "object") {
		let e = t;
		typeof e.code == "string" && (n.code = e.code), typeof e.status == "number" && (n.status = e.status), typeof e.retryAfter == "string" && (n.retryAfter = e.retryAfter), typeof e.retryAt == "number" && (n.retryAt = e.retryAt), Object.prototype.hasOwnProperty.call(e, "details") && (n.details = e.details);
	}
	return n;
}
async function $i(e, t) {
	return new Promise((n, r) => {
		let i = new Worker(new URL(
			/* @vite-ignore */
			"/assets/IqWorker-UKFtbat7.js",
			"" + import.meta.url
		), { type: "module" }), a = !1;
		i.onmessage = (e) => {
			if (a) return;
			let o = e?.data;
			if (o && "type" in o) {
				t?.();
				return;
			}
			if (a = !0, i.terminate(), o && o.ok === !0) {
				n(o.data);
				return;
			}
			r(Qi(typeof o?.error == "string" ? o.error : "IQ worker request failed", o));
		}, i.onerror = (e) => {
			a || (a = !0, i.terminate(), r(e));
		}, i.postMessage(e);
	});
}
async function ea(e) {
	return (await $i({
		apiBaseUrl: e.apiGatewayUrl,
		session: e.session,
		token: e.authToken,
		type: "iqData",
		etag: null
	})).report;
}
function ta(e) {
	let { apiBaseUrl: t, onDownload: n, onRetry: r, retryIntervalMs: i, retryLimit: a } = e;
	return {
		ackGate(e, n, r) {
			return $i({
				apiBaseUrl: t,
				code: r,
				session: n,
				token: e,
				type: "iqAck"
			});
		},
		ackCue(e, n, r) {
			return $i({
				apiBaseUrl: t,
				code: r,
				session: n,
				token: e,
				type: "iqCueAck"
			});
		},
		loadReport(e, o, s) {
			return _(() => $i({
				apiBaseUrl: t,
				session: o,
				token: e,
				type: "iqData",
				etag: s
			}, n), i, a, r);
		}
	};
}
//#endregion
//#region src/features/iq/data/loadIqReport.ts
var na = null;
async function ra(e, t, n) {
	let i = e.workerClient || ta({
		apiBaseUrl: e.apiGatewayUrl,
		retryIntervalMs: e.retryIntervalMs,
		retryLimit: e.retryLimit,
		onDownload: () => {
			r.getState().generation === t && r.getState().activeSession === e.session && r.setState({ status: "loading" });
		},
		onRetry: (i) => {
			r.getState().generation === t && r.getState().activeSession === e.session && (r.setState({ status: n ? "refreshing" : "loading" }), r.getState().setRetryAttempt(i));
		}
	});
	r.getState().setLoading(e.session, n);
	try {
		let a = n ? null : await Lr({ resource: "metadata_etag" }, e.session) ?? "";
		if (r.getState().generation !== t || r.getState().activeSession !== e.session) return;
		let o = r.getState().verificationModel, s = await i.loadReport(e.authToken, e.session, a);
		if (r.getState().generation !== t || r.getState().activeSession !== e.session) return;
		let { report: c, metadataEtag: l, verificationEtag: u, verificationModel: d } = s, f = r.getState().verificationModel;
		return r.getState().setLoaded(e.session, c, l, u, Mi(o, f, d), s), c;
	} catch (n) {
		if (r.getState().generation !== t || r.getState().activeSession !== e.session) return;
		let i = Ni(n);
		return r.getState().setError(i), i;
	}
}
async function ia(e, t) {
	let n = r.getState().generation, i = na?.session === e.session ? na : null;
	i && (i.generation !== n || r.getState().activeSession !== e.session) && (i = null);
	let a = i && !t ? i.load : i ? i.load.then(() => {
		if (r.getState().generation === n && r.getState().activeSession === e.session) return ra(e, n, t);
	}) : ra(e, n, t);
	na = {
		session: e.session,
		generation: n,
		load: a
	};
	try {
		let t = await a;
		if (!t || r.getState().generation !== n || r.getState().activeSession !== e.session) return;
		"error" in t ? e.onError(t) : e.onComplete?.(t);
	} finally {
		na?.load === a && (na = null);
	}
}
function aa(e) {
	return ia(e, !1);
}
function oa(e) {
	return ia(e, !0);
}
//#endregion
//#region src/features/iq/store/iqQueueStore.ts
var sa = (0, Cr.create)()((0, wr.persist)((e, t) => {
	let n = null, i = 0, a = !1;
	function o() {
		if (n === null) return;
		let r = t().tasks.map(({ runtime: e, ...t }) => t);
		e((e) => ({ snapshots: {
			...e.snapshots,
			[n]: {
				tasks: r,
				queues: e.queues
			}
		} }));
	}
	function s(t, n) {
		e((e) => {
			let r = n === "completed" || n === "canceled" ? e.tasks.filter((e) => e.id !== t.id) : [...e.tasks];
			return {
				tasks: r,
				queues: e.queues.map((e) => e.session === t.session ? {
					...e,
					pending: r.filter((e) => e.session === t.session && e.status !== "failed").length,
					failed: r.filter((e) => e.session === t.session && e.status === "failed").length,
					completed: e.completed + +(n === "completed")
				} : e)
			};
		}), o(), t.runtime.onChange({
			id: t.id,
			session: t.session,
			kind: t.kind,
			code: t.code,
			error: t.error,
			status: n
		});
	}
	async function c() {
		if (a) return;
		a = !0;
		let e = i;
		try {
			for (;;) {
				let n = t().tasks[0];
				if (n?.status !== "queued") break;
				n.status = "processing", n.error = null;
				let a = r.getState();
				s(n, "processing");
				let { authToken: o, client: c } = n.runtime;
				try {
					let t = await c[n.kind === "gates" ? "ackGate" : "ackCue"](o, n.session, n.code);
					if (e !== i) return;
					let l = r.getState();
					l.activeSession === n.session && l.reportGeneration === a.reportGeneration && (l.setAcknowledged(n.code, t.etag), n.runtime.onComplete?.(n.code)), s(n, "completed");
				} catch (t) {
					if (e !== i) return;
					n.status = "failed", n.error = Ni(t).error, s(n, "failed");
					break;
				}
			}
		} finally {
			e === i && (a = !1);
		}
	}
	return {
		tasks: [],
		queues: [],
		snapshots: {},
		restore(r, o) {
			if (n === r) {
				for (let e of t().tasks) e.runtime = o;
				return;
			}
			i += 1, a = !1, n = r;
			let l = t().snapshots[r], u = (l?.tasks ?? []).map((e) => ({
				...e,
				runtime: o,
				...e.status === "processing" ? {
					status: "failed",
					error: "The page closed before acknowledgment completed. Retry to check the saved result."
				} : {}
			}));
			e({
				tasks: u,
				queues: l?.queues ?? []
			});
			for (let e of u) s(e, e.status);
			c();
		},
		enqueue(n, r, i, a) {
			if (t().tasks.some((e) => e.session === n && e.kind === r && e.code === i)) return;
			let o = {
				id: crypto.randomUUID(),
				session: n,
				kind: r,
				code: i,
				runtime: a,
				status: "queued",
				error: null
			};
			e((e) => ({
				tasks: [...e.tasks, o],
				queues: e.queues.some((e) => e.session === n) ? e.queues : [...e.queues, {
					id: "iq",
					session: n,
					batch: null,
					pending: 0,
					failed: 0,
					completed: 0
				}]
			})), s(o, "queued"), c();
		},
		retry(e) {
			let n = t().tasks.find((t) => t.id === e && t.status === "failed");
			n && (n.status = "queued", n.error = null, s(n, "retried"), c());
		},
		cancel(e) {
			let n = t().tasks.find((t) => t.id === e && t.status !== "processing");
			n && (s(n, "canceled"), c());
		},
		getBlockers(e) {
			let n = t().tasks;
			return n.length ? [{
				id: "iq",
				title: "IQ acknowledgments",
				items: n.map((e) => `${e.session} · ${e.kind === "cues" ? "Cue dismissal" : "Compliance acknowledgment"} · ${ze(e.status)}`),
				cancel: () => t().reset()
			}] : [];
		},
		reset() {
			i += 1, a = !1;
			for (let e of t().tasks) s(e, "canceled");
			e({
				tasks: [],
				queues: []
			}), o(), n = null;
		}
	};
}, {
	name: "aurorra-index:iq-queue",
	version: 1,
	partialize: (e) => ({ snapshots: e.snapshots })
}));
//#endregion
//#region src/features/iq/hook/useIqReport.ts
function ca({ apiGatewayUrl: e, authToken: t, callbacks: r, retryLimit: i, retryIntervalMs: a, session: o, workerClient: s }) {
	let c = D(r), l = n(), u = me(() => s || ta({
		apiBaseUrl: e,
		retryIntervalMs: a,
		retryLimit: i
	}), [
		e,
		a,
		i,
		s
	]), d = l.report, f = me(() => {
		if (!d) return null;
		let e = Zi(d);
		if (e.gates.error === null && (e.gates.data.items = e.gates.data.items.filter((e) => !l.removedCodes.has(e.code))), e.segments.error === null) for (let t of e.segments.data) t.cues.error === null && (t.cues.data = t.cues.data.filter((e) => !l.removedCodes.has(e.code)));
		return e;
	}, [d, l.removedCodes]);
	T(() => {
		c.current = r;
	}, [r]), T(() => () => c.current.onIqCanceled?.(), []);
	let p = w(async () => {
		await aa({
			apiGatewayUrl: e,
			authToken: t ?? "",
			session: o,
			retryLimit: i,
			retryIntervalMs: a,
			workerClient: s,
			onComplete(e) {
				c.current.onIqLoaded?.(e);
			},
			onError(e) {
				c.current.onIqError?.(e);
			}
		});
	}, [
		e,
		t,
		s,
		a,
		i,
		o
	]), m = w(async () => {
		await oa({
			apiGatewayUrl: e,
			authToken: t ?? "",
			session: o,
			retryLimit: i,
			retryIntervalMs: a,
			workerClient: s,
			onComplete(e) {
				c.current.onIqLoaded?.(e), c.current.onIqRefresh?.(e);
			},
			onError(e) {
				c.current.onIqError?.(e);
			}
		});
	}, [
		e,
		t,
		s,
		a,
		i,
		o
	]);
	T(() => {
		p();
	}, [p]);
	let h = w(async (e, n) => {
		sa.getState().enqueue(o, n ? "cues" : "gates", e, {
			authToken: t ?? "",
			client: u,
			onChange: (e) => c.current.onIqChange?.(e),
			onComplete: (e) => c.current.onIqAck?.(e)
		});
	}, [
		t,
		u,
		o
	]), g = w((e) => h(e, !1), [h]);
	return {
		ackCue: w((e) => h(e, !0), [h]),
		error: l.error,
		loadReport: p,
		refreshReport: m,
		report: d,
		retryAttempt: l.retryAttempt,
		ackGate: g,
		status: l.status,
		view: f
	};
}
//#endregion
//#region src/features/iq/style/iqStyles.ts
var la = {
	green: {
		fg: "#065f46",
		bar: "#16a34a"
	},
	amber: {
		fg: "#92400e",
		bar: "#f59e0b"
	},
	red: {
		fg: "#991b1b",
		bar: "#ef4444"
	}
}, ua = {
	warning: "#f59e0b",
	fail: "#ef4444"
}, da = ".iq-note[data-state=\"open\"] { background: #F6FCFB; } .iq-tabs button:focus-visible, .iq-content:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }", X = {
	recovery: { gridColumn: "1 / -1" },
	tabs: {
		borderBottom: "1px solid var(--border-card)",
		display: "flex",
		flex: "0 0 auto",
		margin: "0 var(--panel-content-padding) 0.45rem",
		minWidth: 0
	},
	tab(e) {
		return {
			appearance: "none",
			background: "transparent",
			border: 0,
			borderBottom: `3px solid ${e ? "var(--primary)" : "transparent"}`,
			borderRadius: 0,
			boxShadow: "none",
			color: e ? "var(--primary-dark)" : "var(--body-ink)",
			cursor: "pointer",
			fontFamily: "inherit",
			fontSize: "0.9rem",
			fontWeight: 500,
			minHeight: "2.75rem",
			padding: "0.5rem 1rem",
			textAlign: "center",
			transform: "none",
			transition: "none",
			width: "8rem"
		};
	},
	root: {
		alignItems: "stretch",
		boxSizing: "border-box",
		color: "var(--title-ink)",
		display: "flex",
		flexDirection: "column",
		fontFamily: "var(--font-ui)",
		height: "100%",
		justifyContent: "flex-start",
		minHeight: 0,
		overflow: "hidden",
		position: "relative",
		textAlign: "left",
		width: "100%"
	},
	content: {
		boxSizing: "border-box",
		display: "block",
		flex: "1 1 auto",
		minHeight: 0,
		overflowX: "hidden",
		overflowY: "auto",
		padding: "0.85rem var(--panel-content-padding)",
		position: "relative",
		textAlign: "left",
		width: "100%"
	},
	panelHeader: {
		alignItems: "flex-start",
		display: "flex",
		gap: "0.75rem",
		justifyContent: "space-between",
		width: "100%"
	},
	summaryCard: {
		alignItems: "center",
		background: "var(--white)",
		border: "1px solid var(--border-card)",
		borderRadius: "var(--radius-card)",
		boxSizing: "border-box",
		boxShadow: "var(--shadow-card)",
		display: "grid",
		gap: "0.75rem",
		gridTemplateColumns: "auto 1fr",
		margin: "0 0 1rem",
		maxWidth: "34rem",
		padding: "0.8rem 1rem",
		width: "100%"
	},
	metricNumber: {
		fontVariantNumeric: "tabular-nums",
		fontSize: "2.85rem",
		fontWeight: 800,
		letterSpacing: 0,
		lineHeight: 1
	},
	metricSubtext: {
		color: "var(--slate-500)",
		fontSize: "0.85rem",
		marginTop: "0.125rem"
	},
	metricLabel: {
		color: "var(--title-ink)",
		fontSize: "1.1rem",
		fontWeight: 700,
		marginBottom: "0.375rem"
	},
	metricTrack: {
		background: "var(--gray-100)",
		border: "1px solid var(--border-card)",
		borderRadius: "var(--radius-pill)",
		height: "0.625rem",
		overflow: "hidden"
	},
	metricFill(e, t) {
		return {
			background: la[e].bar,
			height: "100%",
			transition: "width 350ms ease",
			width: `${t}%`
		};
	},
	divider: {
		background: "var(--gray-300)",
		height: "0.0625rem",
		margin: "0.35rem 0 0.8rem"
	},
	segmentTable: {
		borderCollapse: "separate",
		borderSpacing: 0,
		fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
		fontSize: "0.95rem",
		marginBottom: "0.6rem",
		width: "100%"
	},
	segmentHeaderCell(e) {
		return {
			background: "var(--white)",
			borderBottom: "1px solid var(--border-subtle)",
			color: "var(--title-ink)",
			fontWeight: 700,
			padding: "0.65rem 0.7rem",
			position: "sticky",
			textAlign: e,
			top: 0
		};
	},
	segmentCell(e, t) {
		return {
			borderBottom: "1px solid var(--border-subtle)",
			color: t ? "var(--title-ink)" : "var(--body-ink)",
			fontWeight: t ? 700 : 400,
			padding: "0.65rem 0.7rem",
			textAlign: e
		};
	},
	explanationBlock: {
		background: "#FFFCF5",
		border: `1px solid ${la.amber.fg}`,
		borderRadius: "var(--radius-card)",
		boxSizing: "border-box",
		color: "var(--body-ink)",
		fontSize: "0.9rem",
		lineHeight: 1.65,
		margin: 0,
		marginTop: "0.5rem",
		minWidth: 0,
		overflowWrap: "anywhere",
		padding: "1rem"
	},
	explanationTitle: {
		color: "var(--title-ink)",
		fontWeight: 400,
		marginBottom: "0.15rem"
	},
	explanationList: {
		margin: "0 0 0 1rem",
		paddingLeft: "1rem"
	},
	gateList: {
		listStyle: "none",
		margin: 0,
		paddingLeft: 0
	},
	gateRow: {
		alignItems: "start",
		borderBottom: "1px dashed var(--border-card)",
		boxSizing: "border-box",
		display: "grid",
		gap: "0.75rem",
		gridTemplateColumns: "7.5rem minmax(0, 1fr) auto",
		padding: "0.55rem 0.5rem"
	},
	gateStatus: {
		alignItems: "center",
		color: "var(--title-ink)",
		display: "inline-flex",
		fontSize: "0.8rem",
		fontWeight: 700,
		gap: "0.375rem",
		letterSpacing: "0.01em",
		textTransform: "uppercase"
	},
	gateFlag(e) {
		return {
			background: ua[e],
			borderRadius: "999px",
			display: "inline-block",
			flex: "0 0 auto",
			height: "0.7rem",
			width: "0.7rem"
		};
	},
	cueRow: {
		alignItems: "start",
		display: "grid",
		gap: "0.75rem",
		gridTemplateColumns: "minmax(0, 1fr) auto",
		padding: "0.5rem 0"
	},
	gateText: {
		color: "var(--title-ink)",
		fontSize: "0.92rem",
		lineHeight: 1.45,
		wordBreak: "break-word"
	},
	gateAction: {
		alignItems: "center",
		display: "inline-flex",
		justifyContent: "flex-end",
		justifySelf: "end"
	},
	empty: { color: "var(--slate-500)" },
	notes: {
		display: "grid",
		minWidth: 0
	},
	noteRow: {
		alignItems: "start",
		borderBottom: "1px solid var(--border-card)",
		display: "grid",
		gridTemplateColumns: "2.25rem minmax(0, 1fr)",
		padding: "1.25rem 0",
		minWidth: 0
	},
	noteText: {
		color: "var(--title-ink)",
		display: "grid",
		fontSize: "0.9rem",
		gap: "0.25rem",
		gridColumn: 2,
		lineHeight: 1.65,
		margin: 0,
		minWidth: 0,
		overflowWrap: "anywhere",
		padding: "0 1rem"
	}
}, fa = "C:/GitHub/Tabularium/aurorra_index/src/features/iq/component/IqAckButton.tsx";
function pa({ label: e, disabled: t, onConfirm: n }) {
	return /* @__PURE__ */ (0, M.jsxDEV)($e.Provider, {
		delayDuration: 250,
		children: /* @__PURE__ */ (0, M.jsxDEV)($e.Root, { children: [/* @__PURE__ */ (0, M.jsxDEV)($e.Trigger, {
			asChild: !0,
			children: /* @__PURE__ */ (0, M.jsxDEV)(ve, {
				"aria-label": e,
				disabled: t,
				onConfirm: n,
				size: "icon",
				variant: "danger",
				label: /* @__PURE__ */ (0, M.jsxDEV)("svg", {
					"aria-hidden": "true",
					viewBox: "0 0 24 24",
					width: "1.15rem",
					height: "1.15rem",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: 1.7,
					strokeLinecap: "round",
					strokeLinejoin: "round",
					children: [/* @__PURE__ */ (0, M.jsxDEV)("path", { d: "m16 3 5 5a2 2 0 0 1 0 3l-9 9H7l-4-4a2 2 0 0 1 0-3L13 3a2 2 0 0 1 3 0Z" }, void 0, !1, {
						fileName: fa,
						lineNumber: 14,
						columnNumber: 13
					}, this), /* @__PURE__ */ (0, M.jsxDEV)("path", { d: "m8 8 8 8M12 20h9" }, void 0, !1, {
						fileName: fa,
						lineNumber: 15,
						columnNumber: 13
					}, this)]
				}, void 0, !0, {
					fileName: fa,
					lineNumber: 13,
					columnNumber: 18
				}, this)
			}, void 0, !1, {
				fileName: fa,
				lineNumber: 12,
				columnNumber: 9
			}, this)
		}, void 0, !1, {
			fileName: fa,
			lineNumber: 11,
			columnNumber: 7
		}, this), /* @__PURE__ */ (0, M.jsxDEV)($e.Portal, { children: /* @__PURE__ */ (0, M.jsxDEV)($e.Content, {
			sideOffset: 6,
			style: {
				background: "#0f172a",
				borderRadius: "0.2rem",
				color: "#fff",
				fontSize: "0.75rem",
				padding: "0.35rem 0.5rem",
				zIndex: 60
			},
			children: e
		}, void 0, !1, {
			fileName: fa,
			lineNumber: 19,
			columnNumber: 9
		}, this) }, void 0, !1, {
			fileName: fa,
			lineNumber: 18,
			columnNumber: 7
		}, this)] }, void 0, !0, {
			fileName: fa,
			lineNumber: 10,
			columnNumber: 5
		}, this)
	}, void 0, !1, {
		fileName: fa,
		lineNumber: 9,
		columnNumber: 10
	}, this);
}
//#endregion
//#region src/features/iq/component/IqRow.tsx
var ma = "C:/GitHub/Tabularium/aurorra_index/src/features/iq/component/IqRow.tsx";
function ha({ code: e, cue: t, pending: n, status: r, children: i, onAck: a }) {
	let o = !!n;
	return /* @__PURE__ */ (0, M.jsxDEV)("li", {
		"data-cue-code": t ? e : void 0,
		"data-gate-code": t ? void 0 : e,
		"aria-busy": n?.busy === !0,
		"aria-disabled": n ? "true" : void 0,
		style: {
			...t ? X.cueRow : X.gateRow,
			position: "relative",
			...n ? k.disabledRow : {},
			...n?.actions ? k.failedRow : {}
		},
		children: [
			r ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
				inert: o,
				style: {
					...X.gateStatus,
					...n ? k.disabledContent : {}
				},
				children: r
			}, void 0, !1, {
				fileName: ma,
				lineNumber: 20,
				columnNumber: 15
			}, this) : null,
			/* @__PURE__ */ (0, M.jsxDEV)("span", {
				inert: o,
				style: {
					...X.gateText,
					...n ? k.disabledContent : {}
				},
				children: i
			}, void 0, !1, {
				fileName: ma,
				lineNumber: 21,
				columnNumber: 5
			}, this),
			/* @__PURE__ */ (0, M.jsxDEV)("div", {
				inert: o && !n?.actions,
				style: {
					...X.gateAction,
					...n?.actions ? X.recovery : n ? k.disabledContent : {}
				},
				children: n?.actions ?? (a ? /* @__PURE__ */ (0, M.jsxDEV)(pa, {
					label: t ? "Dismiss cue" : "Clear gate",
					disabled: o,
					onConfirm: () => a(e)
				}, void 0, !1, {
					fileName: ma,
					lineNumber: 24,
					columnNumber: 37
				}, this) : null)
			}, void 0, !1, {
				fileName: ma,
				lineNumber: 22,
				columnNumber: 5
			}, this),
			n?.busy ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
				role: "progressbar",
				"aria-label": "Processing acknowledgment",
				style: k.progress,
				children: /* @__PURE__ */ (0, M.jsxDEV)("span", {
					className: "metadata-row-progress",
					style: k.progressFill
				}, void 0, !1, {
					fileName: ma,
					lineNumber: 27,
					columnNumber: 7
				}, this)
			}, void 0, !1, {
				fileName: ma,
				lineNumber: 26,
				columnNumber: 22
			}, this) : null
		]
	}, void 0, !0, {
		fileName: ma,
		lineNumber: 16,
		columnNumber: 10
	}, this);
}
//#endregion
//#region src/features/iq/component/IqNote.tsx
var ga = "C:/GitHub/Tabularium/aurorra_index/src/features/iq/component/IqNote.tsx";
function _a({ note: e }) {
	let t = e.message.startsWith("WARNING: ");
	return /* @__PURE__ */ (0, M.jsxDEV)(Ne, {
		className: "iq-note",
		label: "note",
		text: t ? e.message.slice(9) : e.message,
		style: X.noteRow,
		children: (n) => /* @__PURE__ */ (0, M.jsxDEV)("p", {
			"data-status": e.status,
			style: X.noteText,
			children: [e.segment === null ? null : /* @__PURE__ */ (0, M.jsxDEV)("strong", { children: e.segment }, void 0, !1, {
				fileName: ga,
				lineNumber: 10,
				columnNumber: 32
			}, this), /* @__PURE__ */ (0, M.jsxDEV)("span", { children: [t ? /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [/* @__PURE__ */ (0, M.jsxDEV)("span", {
				style: {
					color: la.amber.fg,
					fontWeight: 700
				},
				children: "WARNING:"
			}, void 0, !1, {
				fileName: ga,
				lineNumber: 11,
				columnNumber: 26
			}, this), " "] }, void 0, !0, {
				fileName: ga,
				lineNumber: 11,
				columnNumber: 24
			}, this) : null, n] }, void 0, !0, {
				fileName: ga,
				lineNumber: 11,
				columnNumber: 7
			}, this)]
		}, void 0, !0, {
			fileName: ga,
			lineNumber: 9,
			columnNumber: 14
		}, this)
	}, void 0, !1, {
		fileName: ga,
		lineNumber: 8,
		columnNumber: 10
	}, this);
}
//#endregion
//#region src/features/iq/component/IqNotes.tsx
var va = "C:/GitHub/Tabularium/aurorra_index/src/features/iq/component/IqNotes.tsx";
function ya({ notes: e, onRetry: t }) {
	return /* @__PURE__ */ (0, M.jsxDEV)(Se, {
		title: "IQ notes",
		resetKey: e,
		children: e.error === null ? e.data.length > 0 ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
			style: X.notes,
			children: [...e.data].reverse().map((e, t) => /* @__PURE__ */ (0, M.jsxDEV)(_a, { note: e }, t, !1, {
				fileName: va,
				lineNumber: 9,
				columnNumber: 83
			}, this))
		}, void 0, !1, {
			fileName: va,
			lineNumber: 9,
			columnNumber: 7
		}, this) : null : /* @__PURE__ */ (0, M.jsxDEV)(Te, {
			title: "IQ notes",
			detail: e.error,
			onRetry: t
		}, void 0, !1, {
			fileName: va,
			lineNumber: 8,
			columnNumber: 29
		}, this)
	}, void 0, !1, {
		fileName: va,
		lineNumber: 7,
		columnNumber: 10
	}, this);
}
//#endregion
//#region src/features/iq/component/IqPlaceholder.tsx
var Z = "C:/GitHub/Tabularium/aurorra_index/src/features/iq/component/IqPlaceholder.tsx";
function ba({ margin: e, title: t }) {
	return /* @__PURE__ */ (0, M.jsxDEV)("div", {
		style: {
			...X.summaryCard,
			margin: e
		},
		children: [/* @__PURE__ */ (0, M.jsxDEV)("div", {
			"aria-hidden": "true",
			children: [/* @__PURE__ */ (0, M.jsxDEV)("span", { style: {
				...A,
				width: "6rem",
				height: X.metricNumber.fontSize
			} }, void 0, !1, {
				fileName: Z,
				lineNumber: 9,
				columnNumber: 9
			}, this), /* @__PURE__ */ (0, M.jsxDEV)("span", { style: {
				...A,
				...X.metricSubtext,
				width: "4.5rem",
				height: "1lh"
			} }, void 0, !1, {
				fileName: Z,
				lineNumber: 10,
				columnNumber: 9
			}, this)]
		}, void 0, !0, {
			fileName: Z,
			lineNumber: 8,
			columnNumber: 7
		}, this), /* @__PURE__ */ (0, M.jsxDEV)("div", { children: [/* @__PURE__ */ (0, M.jsxDEV)("div", {
			style: X.metricLabel,
			children: t
		}, void 0, !1, {
			fileName: Z,
			lineNumber: 13,
			columnNumber: 9
		}, this), /* @__PURE__ */ (0, M.jsxDEV)("div", {
			"aria-hidden": "true",
			style: {
				...A,
				...X.metricTrack
			}
		}, void 0, !1, {
			fileName: Z,
			lineNumber: 14,
			columnNumber: 9
		}, this)] }, void 0, !0, {
			fileName: Z,
			lineNumber: 12,
			columnNumber: 7
		}, this)]
	}, void 0, !0, {
		fileName: Z,
		lineNumber: 7,
		columnNumber: 5
	}, this);
}
function xa({ tab: e }) {
	return e === "Notes" ? /* @__PURE__ */ (0, M.jsxDEV)(Ee, {
		label: "Loading IQ notes",
		children: /* @__PURE__ */ (0, M.jsxDEV)("div", {
			"aria-hidden": "true",
			style: X.notes,
			children: ["90%", "70%"].map((e) => /* @__PURE__ */ (0, M.jsxDEV)("div", {
				style: X.noteRow,
				children: /* @__PURE__ */ (0, M.jsxDEV)("p", {
					style: X.noteText,
					children: /* @__PURE__ */ (0, M.jsxDEV)("span", { style: {
						...A,
						width: e
					} }, void 0, !1, {
						fileName: Z,
						lineNumber: 21,
						columnNumber: 220
					}, this)
				}, void 0, !1, {
					fileName: Z,
					lineNumber: 21,
					columnNumber: 191
				}, this)
			}, e, !1, {
				fileName: Z,
				lineNumber: 21,
				columnNumber: 149
			}, this))
		}, void 0, !1, {
			fileName: Z,
			lineNumber: 21,
			columnNumber: 73
		}, this)
	}, void 0, !1, {
		fileName: Z,
		lineNumber: 21,
		columnNumber: 31
	}, this) : /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [e === "Quality" && /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [/* @__PURE__ */ (0, M.jsxDEV)(Ee, {
		label: "Loading IQ summary",
		children: [/* @__PURE__ */ (0, M.jsxDEV)("div", {
			style: X.panelHeader,
			children: /* @__PURE__ */ (0, M.jsxDEV)(ba, {
				margin: X.summaryCard.margin,
				title: "Indexing Quality (IQ)"
			}, void 0, !1, {
				fileName: Z,
				lineNumber: 26,
				columnNumber: 43
			}, this)
		}, void 0, !1, {
			fileName: Z,
			lineNumber: 26,
			columnNumber: 9
		}, this), /* @__PURE__ */ (0, M.jsxDEV)("div", { style: X.divider }, void 0, !1, {
			fileName: Z,
			lineNumber: 27,
			columnNumber: 9
		}, this)]
	}, void 0, !0, {
		fileName: Z,
		lineNumber: 25,
		columnNumber: 7
	}, this), /* @__PURE__ */ (0, M.jsxDEV)(Ee, {
		label: "Loading indexing segments",
		children: /* @__PURE__ */ (0, M.jsxDEV)("table", {
			style: X.segmentTable,
			children: [/* @__PURE__ */ (0, M.jsxDEV)("thead", { children: /* @__PURE__ */ (0, M.jsxDEV)("tr", { children: [
				"Segment",
				"Expected",
				"Actual",
				"IQ"
			].map((e, t) => /* @__PURE__ */ (0, M.jsxDEV)("th", {
				style: X.segmentHeaderCell(t === 0 ? "left" : "right"),
				children: e
			}, e, !1, {
				fileName: Z,
				lineNumber: 33,
				columnNumber: 15
			}, this)) }, void 0, !1, {
				fileName: Z,
				lineNumber: 31,
				columnNumber: 18
			}, this) }, void 0, !1, {
				fileName: Z,
				lineNumber: 31,
				columnNumber: 11
			}, this), /* @__PURE__ */ (0, M.jsxDEV)("tbody", {
				"aria-hidden": "true",
				children: [
					"75%",
					"55%",
					"65%"
				].map((e) => /* @__PURE__ */ (0, M.jsxDEV)("tr", { children: [
					0,
					1,
					2,
					3
				].map((t) => /* @__PURE__ */ (0, M.jsxDEV)("td", {
					style: X.segmentCell(t === 0 ? "left" : "right"),
					children: /* @__PURE__ */ (0, M.jsxDEV)("span", {
						style: {
							alignItems: "center",
							display: "flex",
							height: "1lh",
							justifyContent: t === 0 ? "flex-start" : "flex-end"
						},
						children: /* @__PURE__ */ (0, M.jsxDEV)("span", { style: {
							...A,
							width: t === 0 ? e : "2rem"
						} }, void 0, !1, {
							fileName: Z,
							lineNumber: 42,
							columnNumber: 23
						}, this)
					}, void 0, !1, {
						fileName: Z,
						lineNumber: 41,
						columnNumber: 21
					}, this)
				}, t, !1, {
					fileName: Z,
					lineNumber: 40,
					columnNumber: 19
				}, this)) }, e, !1, {
					fileName: Z,
					lineNumber: 38,
					columnNumber: 15
				}, this))
			}, void 0, !1, {
				fileName: Z,
				lineNumber: 36,
				columnNumber: 11
			}, this)]
		}, void 0, !0, {
			fileName: Z,
			lineNumber: 30,
			columnNumber: 9
		}, this)
	}, void 0, !1, {
		fileName: Z,
		lineNumber: 29,
		columnNumber: 7
	}, this)] }, void 0, !0, {
		fileName: Z,
		lineNumber: 24,
		columnNumber: 29
	}, this), e === "Compliance" && /* @__PURE__ */ (0, M.jsxDEV)(Ee, {
		label: "Loading IQ gates",
		children: [/* @__PURE__ */ (0, M.jsxDEV)(ba, {
			margin: X.summaryCard.margin,
			title: "Compliance Gates"
		}, void 0, !1, {
			fileName: Z,
			lineNumber: 53,
			columnNumber: 9
		}, this), /* @__PURE__ */ (0, M.jsxDEV)("ul", {
			"aria-hidden": "true",
			style: X.gateList,
			children: ["90%", "70%"].map((e) => /* @__PURE__ */ (0, M.jsxDEV)("li", {
				style: X.gateRow,
				children: [/* @__PURE__ */ (0, M.jsxDEV)("span", { style: {
					...A,
					width: "5rem"
				} }, void 0, !1, {
					fileName: Z,
					lineNumber: 57,
					columnNumber: 15
				}, this), /* @__PURE__ */ (0, M.jsxDEV)("span", { style: {
					...A,
					width: e
				} }, void 0, !1, {
					fileName: Z,
					lineNumber: 58,
					columnNumber: 15
				}, this)]
			}, e, !0, {
				fileName: Z,
				lineNumber: 56,
				columnNumber: 13
			}, this))
		}, void 0, !1, {
			fileName: Z,
			lineNumber: 54,
			columnNumber: 9
		}, this)]
	}, void 0, !0, {
		fileName: Z,
		lineNumber: 52,
		columnNumber: 32
	}, this)] }, void 0, !0, {
		fileName: Z,
		lineNumber: 23,
		columnNumber: 5
	}, this);
}
//#endregion
//#region src/features/iq/component/IqView.tsx
var Q = "C:/GitHub/Tabularium/aurorra_index/src/features/iq/component/IqView.tsx", Sa = [
	"Quality",
	"Compliance",
	"Notes"
];
function Ca({ view: e, pendingChanges: t, onAck: n, onAckCue: r, onRetry: i }) {
	let { active: a, controls: o, panel: s } = Ze(Sa, "IQ views", {
		storageKey: "aurorra-index:iq-tab",
		className: "iq-tabs",
		style: X.tabs,
		tabStyle: X.tab,
		hideSingle: !1
	});
	if (e === null) return /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [
		/* @__PURE__ */ (0, M.jsxDEV)("style", { children: da }, void 0, !1, {
			fileName: Q,
			lineNumber: 25,
			columnNumber: 5
		}, this),
		o,
		/* @__PURE__ */ (0, M.jsxDEV)("div", {
			"data-panel-scroll": "true",
			style: X.content,
			children: /* @__PURE__ */ (0, M.jsxDEV)("div", {
				...s,
				className: "iq-content",
				children: Sa.map((e) => /* @__PURE__ */ (0, M.jsxDEV)("div", {
					hidden: a !== e,
					children: /* @__PURE__ */ (0, M.jsxDEV)(xa, { tab: e }, void 0, !1, {
						fileName: Q,
						lineNumber: 29,
						columnNumber: 67
					}, this)
				}, e, !1, {
					fileName: Q,
					lineNumber: 29,
					columnNumber: 28
				}, this))
			}, void 0, !1, {
				fileName: Q,
				lineNumber: 28,
				columnNumber: 7
			}, this)
		}, void 0, !1, {
			fileName: Q,
			lineNumber: 27,
			columnNumber: 5
		}, this)
	] }, void 0, !0, {
		fileName: Q,
		lineNumber: 24,
		columnNumber: 29
	}, this);
	let { iq: c, gates: l, segments: u, notes: d } = e;
	return /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [
		/* @__PURE__ */ (0, M.jsxDEV)("style", { children: [da, qe] }, void 0, !0, {
			fileName: Q,
			lineNumber: 35,
			columnNumber: 5
		}, this),
		o,
		/* @__PURE__ */ (0, M.jsxDEV)("div", {
			"data-panel-scroll": "true",
			style: X.content,
			children: /* @__PURE__ */ (0, M.jsxDEV)("div", {
				...s,
				className: "iq-content",
				children: [
					/* @__PURE__ */ (0, M.jsxDEV)("div", {
						hidden: a !== "Quality",
						children: [
							/* @__PURE__ */ (0, M.jsxDEV)("div", {
								style: X.panelHeader,
								children: /* @__PURE__ */ (0, M.jsxDEV)(Se, {
									title: "IQ summary",
									resetKey: e,
									children: c.error === null ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
										style: X.summaryCard,
										children: [/* @__PURE__ */ (0, M.jsxDEV)("div", { children: [/* @__PURE__ */ (0, M.jsxDEV)("div", {
											style: {
												...X.metricNumber,
												color: la[c.data.bucket].fg
											},
											children: [c.data.displayInt, "%"]
										}, void 0, !0, {
											fileName: Q,
											lineNumber: 45,
											columnNumber: 21
										}, this), /* @__PURE__ */ (0, M.jsxDEV)("div", {
											style: X.metricSubtext,
											children: "out of 100"
										}, void 0, !1, {
											fileName: Q,
											lineNumber: 46,
											columnNumber: 21
										}, this)] }, void 0, !0, {
											fileName: Q,
											lineNumber: 44,
											columnNumber: 19
										}, this), /* @__PURE__ */ (0, M.jsxDEV)("div", { children: [/* @__PURE__ */ (0, M.jsxDEV)("div", {
											style: X.metricLabel,
											children: "Indexing Quality (IQ)"
										}, void 0, !1, {
											fileName: Q,
											lineNumber: 49,
											columnNumber: 21
										}, this), /* @__PURE__ */ (0, M.jsxDEV)("div", {
											style: X.metricTrack,
											children: /* @__PURE__ */ (0, M.jsxDEV)("div", { style: X.metricFill(c.data.bucket, c.data.value) }, void 0, !1, {
												fileName: Q,
												lineNumber: 50,
												columnNumber: 55
											}, this)
										}, void 0, !1, {
											fileName: Q,
											lineNumber: 50,
											columnNumber: 21
										}, this)] }, void 0, !0, {
											fileName: Q,
											lineNumber: 48,
											columnNumber: 19
										}, this)]
									}, void 0, !0, {
										fileName: Q,
										lineNumber: 43,
										columnNumber: 17
									}, this) : /* @__PURE__ */ (0, M.jsxDEV)(Te, {
										title: "IQ summary",
										detail: c.error,
										onRetry: i
									}, void 0, !1, {
										fileName: Q,
										lineNumber: 42,
										columnNumber: 36
									}, this)
								}, void 0, !1, {
									fileName: Q,
									lineNumber: 41,
									columnNumber: 13
								}, this)
							}, void 0, !1, {
								fileName: Q,
								lineNumber: 40,
								columnNumber: 11
							}, this),
							/* @__PURE__ */ (0, M.jsxDEV)("div", { style: X.divider }, void 0, !1, {
								fileName: Q,
								lineNumber: 56,
								columnNumber: 7
							}, this),
							/* @__PURE__ */ (0, M.jsxDEV)(Se, {
								title: "Indexing segments",
								resetKey: e,
								children: u.error === null ? /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [/* @__PURE__ */ (0, M.jsxDEV)("table", {
									style: X.segmentTable,
									children: [/* @__PURE__ */ (0, M.jsxDEV)("thead", { children: /* @__PURE__ */ (0, M.jsxDEV)("tr", { children: [
										/* @__PURE__ */ (0, M.jsxDEV)("th", {
											style: X.segmentHeaderCell("left"),
											children: "Segment"
										}, void 0, !1, {
											fileName: Q,
											lineNumber: 61,
											columnNumber: 15
										}, this),
										/* @__PURE__ */ (0, M.jsxDEV)("th", {
											style: X.segmentHeaderCell("right"),
											children: "Expected"
										}, void 0, !1, {
											fileName: Q,
											lineNumber: 62,
											columnNumber: 15
										}, this),
										/* @__PURE__ */ (0, M.jsxDEV)("th", {
											style: X.segmentHeaderCell("right"),
											children: "Actual"
										}, void 0, !1, {
											fileName: Q,
											lineNumber: 63,
											columnNumber: 15
										}, this),
										/* @__PURE__ */ (0, M.jsxDEV)("th", {
											style: X.segmentHeaderCell("right"),
											children: "IQ"
										}, void 0, !1, {
											fileName: Q,
											lineNumber: 64,
											columnNumber: 15
										}, this)
									] }, void 0, !0, {
										fileName: Q,
										lineNumber: 60,
										columnNumber: 20
									}, this) }, void 0, !1, {
										fileName: Q,
										lineNumber: 60,
										columnNumber: 13
									}, this), /* @__PURE__ */ (0, M.jsxDEV)("tbody", { children: u.data.map((e) => /* @__PURE__ */ (0, M.jsxDEV)("tr", { children: [
										/* @__PURE__ */ (0, M.jsxDEV)("td", {
											style: X.segmentCell("left"),
											children: e.displayId
										}, void 0, !1, {
											fileName: Q,
											lineNumber: 68,
											columnNumber: 17
										}, this),
										/* @__PURE__ */ (0, M.jsxDEV)("td", {
											style: X.segmentCell("right"),
											children: e.expectedDisplay
										}, void 0, !1, {
											fileName: Q,
											lineNumber: 69,
											columnNumber: 17
										}, this),
										/* @__PURE__ */ (0, M.jsxDEV)("td", {
											style: X.segmentCell("right"),
											children: e.actualDisplay
										}, void 0, !1, {
											fileName: Q,
											lineNumber: 70,
											columnNumber: 17
										}, this),
										/* @__PURE__ */ (0, M.jsxDEV)("td", {
											style: X.segmentCell("right", !0),
											children: e.iqDisplay
										}, void 0, !1, {
											fileName: Q,
											lineNumber: 71,
											columnNumber: 17
										}, this)
									] }, e.id, !0, {
										fileName: Q,
										lineNumber: 67,
										columnNumber: 45
									}, this)) }, void 0, !1, {
										fileName: Q,
										lineNumber: 66,
										columnNumber: 13
									}, this)]
								}, void 0, !0, {
									fileName: Q,
									lineNumber: 59,
									columnNumber: 11
								}, this), u.data.map((e) => /* @__PURE__ */ (0, M.jsxDEV)(Se, {
									title: e.displayId,
									resetKey: e,
									fallback: (t) => /* @__PURE__ */ (0, M.jsxDEV)(xe, {
										label: e.displayId,
										error: t.message
									}, void 0, !1, {
										fileName: Q,
										lineNumber: 76,
										columnNumber: 32
									}, this),
									children: e.explanations.error !== null || e.cues.error !== null || e.explanations.data.length > 0 || e.cues.data.length > 0 ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
										"data-status": "warning",
										style: X.explanationBlock,
										children: [
											/* @__PURE__ */ (0, M.jsxDEV)("div", {
												style: X.explanationTitle,
												children: ["Segment: ", e.displayId]
											}, void 0, !0, {
												fileName: Q,
												lineNumber: 79,
												columnNumber: 17
											}, this),
											e.explanations.error === null ? e.explanations.data.length > 0 ? /* @__PURE__ */ (0, M.jsxDEV)("ul", {
												style: X.explanationList,
												children: e.explanations.data.map((e, t) => /* @__PURE__ */ (0, M.jsxDEV)("li", { children: e }, t, !1, {
													fileName: Q,
													lineNumber: 82,
													columnNumber: 76
												}, this))
											}, void 0, !1, {
												fileName: Q,
												lineNumber: 81,
												columnNumber: 19
											}, this) : null : /* @__PURE__ */ (0, M.jsxDEV)(xe, {
												label: e.displayId,
												error: e.explanations.error
											}, void 0, !1, {
												fileName: Q,
												lineNumber: 80,
												columnNumber: 56
											}, this),
											e.cues.error === null ? /* @__PURE__ */ (0, M.jsxDEV)("ul", {
												style: X.gateList,
												children: e.cues.data.map((e) => /* @__PURE__ */ (0, M.jsxDEV)(ha, {
													code: e.code,
													cue: !0,
													pending: t.get(e.code),
													onAck: r,
													children: e.description
												}, e.code, !1, {
													fileName: Q,
													lineNumber: 87,
													columnNumber: 51
												}, this))
											}, void 0, !1, {
												fileName: Q,
												lineNumber: 86,
												columnNumber: 19
											}, this) : /* @__PURE__ */ (0, M.jsxDEV)(xe, {
												label: `${e.displayId} cues`,
												error: e.cues.error
											}, void 0, !1, {
												fileName: Q,
												lineNumber: 85,
												columnNumber: 48
											}, this)
										]
									}, void 0, !0, {
										fileName: Q,
										lineNumber: 78,
										columnNumber: 15
									}, this) : null
								}, e.id, !1, {
									fileName: Q,
									lineNumber: 75,
									columnNumber: 41
								}, this))] }, void 0, !0, {
									fileName: Q,
									lineNumber: 58,
									columnNumber: 120
								}, this) : /* @__PURE__ */ (0, M.jsxDEV)(Te, {
									title: "Indexing segments",
									detail: u.error,
									onRetry: i
								}, void 0, !1, {
									fileName: Q,
									lineNumber: 58,
									columnNumber: 36
								}, this)
							}, void 0, !1, {
								fileName: Q,
								lineNumber: 57,
								columnNumber: 7
							}, this)
						]
					}, void 0, !0, {
						fileName: Q,
						lineNumber: 39,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ (0, M.jsxDEV)("div", {
						hidden: a !== "Compliance",
						children: /* @__PURE__ */ (0, M.jsxDEV)(Se, {
							title: "Compliance gates",
							resetKey: e,
							children: l.error === null ? /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [/* @__PURE__ */ (0, M.jsxDEV)("div", {
								style: X.summaryCard,
								children: [/* @__PURE__ */ (0, M.jsxDEV)("div", { children: [/* @__PURE__ */ (0, M.jsxDEV)("div", {
									style: {
										...X.metricNumber,
										color: la[l.data.bucket].fg
									},
									children: [l.data.displayPercent, "%"]
								}, void 0, !0, {
									fileName: Q,
									lineNumber: 103,
									columnNumber: 21
								}, this), /* @__PURE__ */ (0, M.jsxDEV)("div", {
									style: X.metricSubtext,
									children: [
										"out of ",
										l.data.total,
										" gates"
									]
								}, void 0, !0, {
									fileName: Q,
									lineNumber: 104,
									columnNumber: 21
								}, this)] }, void 0, !0, {
									fileName: Q,
									lineNumber: 102,
									columnNumber: 19
								}, this), /* @__PURE__ */ (0, M.jsxDEV)("div", { children: [/* @__PURE__ */ (0, M.jsxDEV)("div", {
									style: X.metricLabel,
									children: "Compliance Gates"
								}, void 0, !1, {
									fileName: Q,
									lineNumber: 107,
									columnNumber: 21
								}, this), /* @__PURE__ */ (0, M.jsxDEV)("div", {
									style: X.metricTrack,
									children: /* @__PURE__ */ (0, M.jsxDEV)("div", { style: X.metricFill(l.data.bucket, l.data.displayPercent) }, void 0, !1, {
										fileName: Q,
										lineNumber: 108,
										columnNumber: 55
									}, this)
								}, void 0, !1, {
									fileName: Q,
									lineNumber: 108,
									columnNumber: 21
								}, this)] }, void 0, !0, {
									fileName: Q,
									lineNumber: 106,
									columnNumber: 19
								}, this)]
							}, void 0, !0, {
								fileName: Q,
								lineNumber: 101,
								columnNumber: 17
							}, this), l.data.items.length === 0 ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
								style: X.empty,
								children: "None"
							}, void 0, !1, {
								fileName: Q,
								lineNumber: 111,
								columnNumber: 50
							}, this) : /* @__PURE__ */ (0, M.jsxDEV)("ul", {
								style: X.gateList,
								children: l.data.items.map((e) => /* @__PURE__ */ (0, M.jsxDEV)(ha, {
									code: e.code,
									cue: !1,
									pending: t.get(e.code),
									onAck: e.clearable ? n : void 0,
									status: /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [e.status === "success" ? /* @__PURE__ */ (0, M.jsxDEV)(Me, {}, void 0, !1, {
										fileName: Q,
										lineNumber: 115,
										columnNumber: 54
									}, this) : /* @__PURE__ */ (0, M.jsxDEV)("span", {
										"aria-hidden": "true",
										style: X.gateFlag(e.status)
									}, void 0, !1, {
										fileName: Q,
										lineNumber: 115,
										columnNumber: 72
									}, this), /* @__PURE__ */ (0, M.jsxDEV)("span", { children: e.label }, void 0, !1, {
										fileName: Q,
										lineNumber: 116,
										columnNumber: 25
									}, this)] }, void 0, !0, {
										fileName: Q,
										lineNumber: 114,
										columnNumber: 114
									}, this),
									children: e.description.split(/(?<=^Compliance is (?:not )?satisfied\.)(?=\s*\S)/).map((e, t) => /* @__PURE__ */ (0, M.jsxDEV)(de, { children: [t > 0 ? /* @__PURE__ */ (0, M.jsxDEV)("br", {}, void 0, !1, {
										fileName: Q,
										lineNumber: 119,
										columnNumber: 60
									}, this) : null, e] }, t, !0, {
										fileName: Q,
										lineNumber: 119,
										columnNumber: 25
									}, this))
								}, e.code, !1, {
									fileName: Q,
									lineNumber: 113,
									columnNumber: 51
								}, this))
							}, void 0, !1, {
								fileName: Q,
								lineNumber: 112,
								columnNumber: 19
							}, this)] }, void 0, !0, {
								fileName: Q,
								lineNumber: 100,
								columnNumber: 15
							}, this) : /* @__PURE__ */ (0, M.jsxDEV)(Te, {
								title: "Compliance gates",
								detail: l.error,
								onRetry: i
							}, void 0, !1, {
								fileName: Q,
								lineNumber: 99,
								columnNumber: 37
							}, this)
						}, void 0, !1, {
							fileName: Q,
							lineNumber: 98,
							columnNumber: 11
						}, this)
					}, void 0, !1, {
						fileName: Q,
						lineNumber: 97,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ (0, M.jsxDEV)("div", {
						hidden: a !== "Notes",
						children: /* @__PURE__ */ (0, M.jsxDEV)(ya, {
							notes: d,
							onRetry: i
						}, void 0, !1, {
							fileName: Q,
							lineNumber: 129,
							columnNumber: 11
						}, this)
					}, void 0, !1, {
						fileName: Q,
						lineNumber: 128,
						columnNumber: 9
					}, this)
				]
			}, void 0, !0, {
				fileName: Q,
				lineNumber: 38,
				columnNumber: 7
			}, this)
		}, void 0, !1, {
			fileName: Q,
			lineNumber: 37,
			columnNumber: 5
		}, this)
	] }, void 0, !0, {
		fileName: Q,
		lineNumber: 34,
		columnNumber: 10
	}, this);
}
//#endregion
//#region src/features/iq/component/IqProgress.tsx
var wa = "C:/GitHub/Tabularium/aurorra_index/src/features/iq/component/IqProgress.tsx", Ta = [
	{
		jobId: "iq-segments",
		message: "Checking segment quality…"
	},
	{
		jobId: "iq-gates",
		message: "Checking compliance gates…"
	},
	{
		jobId: "iq-generation",
		message: "Generating IQ report…"
	}
];
function Ea({ intervalMs: e }) {
	let [t, n] = O(0);
	return T(() => {
		if (t === Ta.length - 1) return;
		let r = window.setTimeout(() => n(t + 1), e);
		return () => window.clearTimeout(r);
	}, [e, t]), /* @__PURE__ */ (0, M.jsxDEV)(je, {
		autoScroll: !0,
		highlightLast: !0,
		fillCompletion: !1,
		intro: "I’ll keep you updated as I generate the IQ report.",
		jobs: Ta.slice(0, t + 1).map((e, n) => ({
			...e,
			phase: n < t ? "completed" : "started"
		})),
		process: "GENERATING IQ REPORT"
	}, void 0, !1, {
		fileName: wa,
		lineNumber: 20,
		columnNumber: 5
	}, this);
}
//#endregion
//#region src/features/iq/component/IqPanel.tsx
var Da = "C:/GitHub/Tabularium/aurorra_index/src/features/iq/component/IqPanel.tsx";
function Oa(e) {
	let { ackCue: t, ackGate: n, loadReport: r, report: i, retryAttempt: a, status: o, view: s } = ca(e), c = o === "idle" || o === "loading", l = sa((e) => e.tasks), u = new Map(l.filter((t) => t.session === e.session).map((e) => [e.code, {
		busy: e.status !== "failed",
		actions: e.status === "failed" ? /* @__PURE__ */ (0, M.jsxDEV)(ge, {
			error: e.error,
			onRetry: () => sa.getState().retry(e.id),
			onCancel: () => sa.getState().cancel(e.id)
		}, void 0, !1, {
			fileName: Da,
			lineNumber: 16,
			columnNumber: 41
		}, this) : null
	}]));
	return o === "refreshing" ? /* @__PURE__ */ (0, M.jsxDEV)(Ea, { intervalMs: e.retryIntervalMs }, `${e.session}-${a}-generate`, !1, {
		fileName: Da,
		lineNumber: 21,
		columnNumber: 12
	}, this) : o === "error" && i === null ? null : /* @__PURE__ */ (0, M.jsxDEV)("section", {
		"aria-label": "Indexing Quality",
		style: X.root,
		children: !c && s === null ? /* @__PURE__ */ (0, M.jsxDEV)("div", {
			style: X.empty,
			children: "No IQ report found."
		}, void 0, !1, {
			fileName: Da,
			lineNumber: 31,
			columnNumber: 9
		}, this) : /* @__PURE__ */ (0, M.jsxDEV)(Ca, {
			view: c ? null : s,
			pendingChanges: u,
			onAck: n,
			onAckCue: t,
			onRetry: r
		}, e.session, !1, {
			fileName: Da,
			lineNumber: 33,
			columnNumber: 9
		}, this)
	}, void 0, !1, {
		fileName: Da,
		lineNumber: 29,
		columnNumber: 5
	}, this);
}
//#endregion
//#region src/features/iq/hook/useIqRefresh.ts
function ka() {
	let e = n((e) => e.etag), t = n((e) => e.reportEtag), r = n((e) => e.metadataEtag), i = n((e) => e.verificationEtag), a = n((e) => e.verificationModel?.etag), o = n((e) => e.activeSession), s = re((e) => e.session === o ? e.etag : void 0);
	return typeof e == "string" && typeof t == "string" && e !== t || typeof r == "string" && s !== void 0 && r !== s || typeof i == "string" && typeof a == "string" && i !== a;
}
//#endregion
//#region src/features/queue/data/queueBlockers.ts
function Aa(e) {
	let { tasks: t } = l.getState();
	return t.length ? [{
		id: "index",
		title: "Index changes",
		items: t.map((e) => {
			let t = e.changes.slice(e.cursor).map((e) => "segment" in e ? ze(e.action) : `${ze(e.patch?.action ?? e.action)} · ${ze(e.index.aspect)} · ${e.index.value}`);
			return `${e.session} · ${ze(e.segment)} · ${ze(e.status)} · ${t.length ? t.join("; ") : "Refreshing metadata"}`;
		}),
		cancel: () => l.getState().reset()
	}] : [];
}
//#endregion
//#region src/features/indexing/style/summaryStyles.ts
var ja = "\n.index-summary-counts { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n.index-summary-metric { flex-direction: row; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; }\n.index-summary-score { padding: 0.8rem 1rem; }\n@media (max-width: 36rem) {\n  .index-summary-counts { grid-template-columns: minmax(0, 1fr); }\n}\n@container summary (max-width: 22rem) {\n  .index-summary-score { padding: 0.6rem 0.375rem; }\n}\n", Ma = {
	root: {
		containerName: "summary",
		containerType: "inline-size",
		display: "grid",
		gap: "0.75rem",
		minWidth: 0,
		marginTop: "0.75rem"
	},
	counts: {
		display: "grid",
		gap: "0.75rem",
		margin: 0
	},
	scores: {
		display: "grid",
		gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
		gap: "0.75rem",
		margin: 0
	},
	metric: {
		display: "flex",
		gap: "0.375rem",
		minWidth: 0,
		border: "1px solid var(--border-card)",
		borderRadius: "var(--radius-card)",
		background: "var(--white)",
		boxShadow: "var(--shadow-card)"
	},
	score: {
		containerType: "inline-size",
		flexDirection: "column",
		alignItems: "stretch"
	},
	label: {
		fontSize: "0.75rem",
		lineHeight: 1.4,
		fontWeight: 500,
		color: "var(--body-ink)",
		overflowWrap: "anywhere"
	},
	scoreLabel: {
		fontSize: "clamp(0.75rem, 13cqi, 1.1rem)",
		fontWeight: 700,
		color: "var(--title-ink)"
	},
	value: {
		display: "flex",
		alignItems: "center",
		minHeight: "2rem",
		margin: 0,
		fontSize: "1.5rem",
		lineHeight: 1.1,
		fontWeight: 700,
		letterSpacing: "-0.04em",
		fontVariantNumeric: "tabular-nums",
		color: "var(--title-ink)"
	},
	percent: {
		flexDirection: "column",
		alignItems: "stretch",
		gap: "0.5rem",
		minHeight: "2.85rem",
		fontSize: "clamp(1.25rem, 16cqi, 2.85rem)",
		lineHeight: 1,
		letterSpacing: 0,
		color: "var(--primary-dark)"
	},
	meter: {
		width: "100%",
		height: "0.625rem",
		marginTop: 0,
		backgroundColor: "var(--gray-100)",
		border: "1px solid var(--border-card)"
	}
}, $ = "C:/GitHub/Tabularium/aurorra_index/src/features/indexing/component/IndexSummary.tsx";
function Na({ label: e, value: t, error: n, score: r, bucket: i }) {
	return /* @__PURE__ */ (0, M.jsxDEV)("div", {
		className: `index-summary-metric${r ? " index-summary-score" : ""}`,
		style: {
			...Ma.metric,
			...r ? Ma.score : {}
		},
		children: [/* @__PURE__ */ (0, M.jsxDEV)("dt", {
			style: {
				...Ma.label,
				...r ? Ma.scoreLabel : {}
			},
			children: e
		}, void 0, !1, {
			fileName: $,
			lineNumber: 14,
			columnNumber: 5
		}, this), /* @__PURE__ */ (0, M.jsxDEV)("dd", {
			style: {
				...Ma.value,
				...r ? Ma.percent : {},
				...i ? { color: la[i].fg } : {}
			},
			children: n === null ? t === null ? /* @__PURE__ */ (0, M.jsxDEV)(Ee, {
				label: `Loading ${e}`,
				children: /* @__PURE__ */ (0, M.jsxDEV)("span", {
					"aria-hidden": "true",
					style: {
						...A,
						height: "1em",
						width: "3ch"
					}
				}, void 0, !1, {
					fileName: $,
					lineNumber: 16,
					columnNumber: 131
				}, this)
			}, void 0, !1, {
				fileName: $,
				lineNumber: 16,
				columnNumber: 87
			}, this) : /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [
				t,
				r ? "%" : null,
				r ? /* @__PURE__ */ (0, M.jsxDEV)("span", {
					role: "meter",
					"aria-label": e,
					"aria-valuemin": 0,
					"aria-valuemax": 100,
					"aria-valuenow": t,
					"aria-valuetext": `${t}%`,
					style: {
						...Ye.bar,
						...Ma.meter
					},
					children: /* @__PURE__ */ (0, M.jsxDEV)("span", { style: {
						...Ye.fill,
						...i ? { backgroundColor: la[i].bar } : {},
						width: `${t}%`
					} }, void 0, !1, {
						fileName: $,
						lineNumber: 18,
						columnNumber: 203
					}, this)
				}, void 0, !1, {
					fileName: $,
					lineNumber: 18,
					columnNumber: 18
				}, this) : null
			] }, void 0, !0, {
				fileName: $,
				lineNumber: 16,
				columnNumber: 237
			}, this) : /* @__PURE__ */ (0, M.jsxDEV)(xe, {
				label: e,
				error: n
			}, void 0, !1, {
				fileName: $,
				lineNumber: 16,
				columnNumber: 25
			}, this)
		}, void 0, !1, {
			fileName: $,
			lineNumber: 15,
			columnNumber: 5
		}, this)]
	}, void 0, !0, {
		fileName: $,
		lineNumber: 13,
		columnNumber: 10
	}, this);
}
function Pa({ data: e, error: t }) {
	let n = e, r = n ? Be(n) : null, i = n && r ? S([
		...n.parties ? r.parties : [],
		...n.indexes ?? [],
		...r.execution?.indexes ?? []
	]) : null;
	return /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [/* @__PURE__ */ (0, M.jsxDEV)(Na, {
		label: "Indexes",
		value: i?.length ?? null,
		error: t
	}, void 0, !1, {
		fileName: $,
		lineNumber: 33,
		columnNumber: 5
	}, this), /* @__PURE__ */ (0, M.jsxDEV)(Na, {
		label: "Ambiguities",
		value: i ? i.filter((e) => Ge(e.ambiguous)).length : null,
		error: t
	}, void 0, !1, {
		fileName: $,
		lineNumber: 34,
		columnNumber: 5
	}, this)] }, void 0, !0, {
		fileName: $,
		lineNumber: 32,
		columnNumber: 10
	}, this);
}
function Fa({ data: e, error: t }) {
	let n = e ? Zi(e) : null;
	return /* @__PURE__ */ (0, M.jsxDEV)(M.Fragment, { children: [/* @__PURE__ */ (0, M.jsxDEV)(Na, {
		label: "IQ",
		value: n?.iq.data?.displayInt ?? null,
		error: t ?? n?.iq.error ?? null,
		bucket: n?.iq.data?.bucket,
		score: !0
	}, void 0, !1, {
		fileName: $,
		lineNumber: 41,
		columnNumber: 5
	}, this), /* @__PURE__ */ (0, M.jsxDEV)(Na, {
		label: "Compliance",
		value: n?.gates.data?.displayPercent ?? null,
		error: t ?? n?.gates.error ?? null,
		bucket: n?.gates.data?.bucket,
		score: !0
	}, void 0, !1, {
		fileName: $,
		lineNumber: 42,
		columnNumber: 5
	}, this)] }, void 0, !0, {
		fileName: $,
		lineNumber: 40,
		columnNumber: 10
	}, this);
}
function Ia({ metadata: e, iq: t }) {
	return /* @__PURE__ */ (0, M.jsxDEV)("section", {
		"aria-label": "Indexing results",
		style: Ma.root,
		children: [
			/* @__PURE__ */ (0, M.jsxDEV)("style", { children: ja }, void 0, !1, {
				fileName: $,
				lineNumber: 48,
				columnNumber: 5
			}, this),
			/* @__PURE__ */ (0, M.jsxDEV)("dl", {
				className: "index-summary-counts",
				style: Ma.counts,
				children: /* @__PURE__ */ (0, M.jsxDEV)(Se, {
					title: "Index counts",
					resetKey: e.data,
					fallback: (e) => /* @__PURE__ */ (0, M.jsxDEV)(Pa, {
						data: null,
						error: e.message
					}, void 0, !1, {
						fileName: $,
						lineNumber: 50,
						columnNumber: 87
					}, this),
					children: /* @__PURE__ */ (0, M.jsxDEV)(Pa, { ...e }, void 0, !1, {
						fileName: $,
						lineNumber: 51,
						columnNumber: 9
					}, this)
				}, void 0, !1, {
					fileName: $,
					lineNumber: 50,
					columnNumber: 7
				}, this)
			}, void 0, !1, {
				fileName: $,
				lineNumber: 49,
				columnNumber: 5
			}, this),
			/* @__PURE__ */ (0, M.jsxDEV)("dl", {
				style: Ma.scores,
				children: /* @__PURE__ */ (0, M.jsxDEV)(Se, {
					title: "IQ scores",
					resetKey: t.data,
					fallback: (e) => /* @__PURE__ */ (0, M.jsxDEV)(Fa, {
						data: null,
						error: e.message
					}, void 0, !1, {
						fileName: $,
						lineNumber: 55,
						columnNumber: 78
					}, this),
					children: /* @__PURE__ */ (0, M.jsxDEV)(Fa, { ...t }, void 0, !1, {
						fileName: $,
						lineNumber: 56,
						columnNumber: 9
					}, this)
				}, void 0, !1, {
					fileName: $,
					lineNumber: 55,
					columnNumber: 7
				}, this)
			}, void 0, !1, {
				fileName: $,
				lineNumber: 54,
				columnNumber: 5
			}, this)
		]
	}, void 0, !0, {
		fileName: $,
		lineNumber: 47,
		columnNumber: 10
	}, this);
}
//#endregion
//#region src/public-api.ts
var La = fe(async () => ({ default: (await import("./ImageViewerPanel-BWUdbk0u.js")).ImageViewerPanel }));
//#endregion
export { b as AddIndexPanel, Ir as AddressMapContent, ji as AuditPanel, jr as DEFAULT_ADDRESS_MAP_ZOOM, qn as EditIndexPanel, Fi as GATE_FAIL, Li as GATE_INFO, Pi as GATE_PASS, Ii as GATE_WARNING, La as ImageViewerPanel, Qn as IndexContainer, Qn as IndexMetadata, Ia as IndexSummary, Oa as IqPanel, Or as LegalMapContent, Wn as MetadataPanel, Hr as PageSegmentsPanel, zi as UI_FAIL, Ri as UI_PASS, Bi as UI_WARNING, it as UsagePanel, C as addIndexStoreApi, Nr as appendAddressMapZoom, c as auditStoreApi, Mr as buildAddressMapEmbedUrl, ce as createAuditWorkerClient, Ar as createDeferredState, ta as createIqWorkerClient, g as createMetadataClient, ie as createPageSegmentsWorkerClient, h as editIndexStoreApi, Ut as formatLocation, ea as generateIqReport, Aa as getBlockers, _t as getElements, Mn as getMapGroups, Vt as getPresentLayers, vt as getVal, f as imageViewerStoreApi, oe as indexStoreApi, sa as iqQueueStore, r as iqStoreApi, Ht as isAllEmptyStructure, gt as isBlank, ut as loadChoices, se as loadImagePackage, aa as loadIqReport, hi as normalizeAuditReport, Yi as normalizeIqReport, qt as normalizeLegalData, y as pageSegmentsStoreApi, gi as prepareAuditReport, Zi as prepareIqReport, l as queueStoreApi, oa as refreshIqReport, Lr as requestResource, ae as selectSession, e as storeApi, Bt as toPlatJSON, ue as useAddIndexStore, Ur as useAuditReport, u as useAuditStore, le as useEditIndexStore, t as useImageViewerStore, ee as useIndexStore, ka as useIqRefresh, ca as useIqReport, n as useIqStore, p as usePageSegmentsStore, re as useQueueStore, ne as useStore, at as useUsage };
