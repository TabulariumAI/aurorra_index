import { A as e, C as t, D as n, E as r, F as i, I as a, L as o, M as s, N as c, O as l, P as u, R as d, S as f, _ as p, a as m, b as h, c as g, d as _, f as v, g as y, h as b, i as ee, j as te, k as x, l as S, m as C, n as w, p as T, r as E, s as D, t as ne, u as re, v as O, x as ie, y as ae } from "./loadImagePackage-C5yEQy-S.js";
import { Fragment as oe, lazy as se, useCallback as k, useEffect as A, useId as j, useLayoutEffect as ce, useMemo as M, useRef as N, useState as P } from "react";
import { ActionButton as le, ChangeRecovery as ue, ChoicesTable as de, ConfButton as fe, CreditValue as pe, EmptyRow as me, ErrorBadge as he, ErrorBoundary as F, Icon as ge, IndexValue as _e, LoadError as ve, LoadPlaceholder as ye, MetadataGroups as be, MetadataList as xe, MetadataRow as Se, MetadataSegment as Ce, ProgressView as we, SuccessIcon as Te, TextDisclosure as Ee, choicesStyles as I, cleanText as De, composeMetadataJSON as Oe, formStyles as ke, formatCredits as Ae, formatLabel as L, getPanelData as je, getParcelOptions as Me, getSegmentItems as Ne, iconButtonStyle as Pe, indexSegments as Fe, isAmbiguous as Ie, metadataRowCss as Le, metadataSpinnerCss as Re, metadataStyles as R, progressStyles as ze, rowStyles as z, segmentStyles as Be, skeletonStyle as B, useTabs as Ve } from "aurora-core";
import * as He from "@radix-ui/react-popover";
import * as Ue from "@radix-ui/react-tooltip";
//#region src/features/usage/data/usageData.ts
var V = {
	extraction: "Index Extraction",
	iq_refinement: "IQ Refinement",
	refinement: "User Refinement",
	model_generation: "Model Refinement"
};
function We(e) {
	let t = new Date(e);
	return {
		from: new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - 1, 1)).toISOString().slice(0, 10),
		to: new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).toISOString().slice(0, 10)
	};
}
function Ge(e, t) {
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
	})).sort((e, t) => Object.keys(V).indexOf(e.name) - Object.keys(V).indexOf(t.name));
}
//#endregion
//#region src/features/usage/style/usageStyles.ts
var Ke = {
	extraction: "var(--primary)",
	iq_refinement: "var(--primary-light)",
	refinement: "#d97706",
	model_generation: "#0284c7",
	total: "#dc2626"
}, H = {
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
}, U = d();
function qe({ records: e }) {
	let t = j(), n = We(Date.now()), [r, i] = P(() => ({
		...n,
		services: Object.keys(V),
		period: "daily"
	})), s = M(() => Ge(e, {
		...r,
		services: Object.keys(V)
	}), [e, r]), c = s.filter((e) => r.services.includes(e.name)), l = [c.filter((e) => e.name === "extraction" || e.name === "iq_refinement"), ...c.filter((e) => e.name === "refinement" || e.name === "model_generation").map((e) => [e])].filter((e) => e.length > 0);
	return /* @__PURE__ */ (0, U.jsxs)("div", {
		style: H.root,
		children: [
			/* @__PURE__ */ (0, U.jsxs)("div", {
				style: H.filters,
				children: [
					/* @__PURE__ */ (0, U.jsxs)("div", {
						style: H.label,
						children: [/* @__PURE__ */ (0, U.jsx)("label", {
							htmlFor: t,
							children: "Service"
						}), /* @__PURE__ */ (0, U.jsxs)(He.Root, { children: [/* @__PURE__ */ (0, U.jsx)(He.Trigger, {
							asChild: !0,
							children: /* @__PURE__ */ (0, U.jsxs)("button", {
								id: t,
								"aria-label": "Service",
								type: "button",
								style: {
									...H.input,
									...H.select
								},
								children: [/* @__PURE__ */ (0, U.jsx)("span", { children: r.services.length === Object.keys(V).length ? "All services" : r.services.length === 1 ? V[r.services[0]] : `${r.services.length} services` }), /* @__PURE__ */ (0, U.jsx)("svg", {
									"aria-hidden": "true",
									width: "12",
									height: "12",
									viewBox: "0 0 16 16",
									fill: "none",
									stroke: "currentColor",
									strokeWidth: "1.5",
									children: /* @__PURE__ */ (0, U.jsx)("path", { d: "m4 6 4 4 4-4" })
								})]
							})
						}), /* @__PURE__ */ (0, U.jsx)(He.Content, {
							"aria-label": "Services",
							role: "group",
							align: "start",
							sideOffset: 6,
							collisionPadding: 8,
							style: H.options,
							children: Object.keys(V).map((e) => {
								let n = r.services.includes(e), s = n && r.services.length === 1;
								return /* @__PURE__ */ (0, U.jsxs)("label", {
									htmlFor: `${t}-${e}`,
									style: H.option,
									children: [/* @__PURE__ */ (0, U.jsx)(a, {
										id: `${t}-${e}`,
										checked: n,
										disabled: s,
										style: ke.checkbox(s, n),
										onCheckedChange: (t) => i({
											...r,
											services: t === !0 ? [...r.services, e] : r.services.filter((t) => t !== e)
										}),
										children: /* @__PURE__ */ (0, U.jsx)(o, {
											"aria-hidden": !0,
											style: {
												fontSize: "0.75rem",
												lineHeight: 1
											},
											children: "✓"
										})
									}), V[e]]
								}, e);
							})
						})] })]
					}),
					/* @__PURE__ */ (0, U.jsxs)("label", {
						style: H.label,
						children: ["From", /* @__PURE__ */ (0, U.jsx)("input", {
							"aria-label": "From",
							type: "date",
							style: H.input,
							min: n.from,
							max: r.to,
							value: r.from,
							onChange: (e) => i({
								...r,
								from: e.target.value
							})
						})]
					}),
					/* @__PURE__ */ (0, U.jsxs)("label", {
						style: H.label,
						children: ["To", /* @__PURE__ */ (0, U.jsx)("input", {
							"aria-label": "To",
							type: "date",
							style: H.input,
							min: r.from,
							max: n.to,
							value: r.to,
							onChange: (e) => i({
								...r,
								to: e.target.value
							})
						})]
					}),
					/* @__PURE__ */ (0, U.jsxs)("label", {
						style: H.label,
						children: ["Period", /* @__PURE__ */ (0, U.jsxs)("select", {
							"aria-label": "Period",
							style: H.input,
							value: r.period,
							onChange: (e) => i({
								...r,
								period: e.target.value
							}),
							children: [/* @__PURE__ */ (0, U.jsx)("option", {
								value: "daily",
								children: "Daily"
							}), /* @__PURE__ */ (0, U.jsx)("option", {
								value: "weekly",
								children: "Weekly"
							})]
						})]
					}),
					/* @__PURE__ */ (0, U.jsx)("span", {
						style: H.caption,
						children: "UTC"
					})
				]
			}),
			l.length === 0 ? /* @__PURE__ */ (0, U.jsx)("div", {
				style: H.empty,
				children: "No usage in the selected period."
			}) : l.map((e) => {
				let t = e.some((e) => e.name === "extraction" || e.name === "iq_refinement"), n = t ? `${V.extraction} and ${V.iq_refinement}` : V[e[0].name], i = [...new Set(e.flatMap((e) => e.points.map((e) => e.date)))].sort().map((n) => {
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
					color: Ke.total
				}] : [], ...e.map((e) => ({
					label: V[e.name],
					color: Ke[e.name]
				}))], o = Math.max(...i.flatMap((e) => e.values.map((e) => e.cost))), s = 600 / i.length;
				return /* @__PURE__ */ (0, U.jsxs)("section", {
					"aria-label": `${n} usage`,
					style: H.card,
					children: [/* @__PURE__ */ (0, U.jsx)("div", {
						style: H.chart,
						children: /* @__PURE__ */ (0, U.jsxs)("svg", {
							role: "img",
							"aria-label": `${n} ${r.period} credits chart`,
							viewBox: "0 0 680 210",
							style: H.svg,
							children: [
								/* @__PURE__ */ (0, U.jsxs)("text", {
									x: "0",
									y: "14",
									fill: "#64748b",
									fontSize: "12",
									children: [`${Ae(o).slice(0, -3)} `, /* @__PURE__ */ (0, U.jsx)("tspan", {
										fontSize: "smaller",
										children: "CR"
									})]
								}),
								/* @__PURE__ */ (0, U.jsx)("line", {
									x1: "60",
									x2: "660",
									y1: "24",
									y2: "24",
									stroke: "#e2e8f0"
								}),
								/* @__PURE__ */ (0, U.jsx)("line", {
									x1: "60",
									x2: "660",
									y1: "178",
									y2: "178",
									stroke: "#cbd5e1"
								}),
								i.map((e, t) => /* @__PURE__ */ (0, U.jsxs)("g", { children: [e.values.map((n, r) => {
									let i = o === 0 ? 0 : n.cost / o * 146, c = s * .7;
									return /* @__PURE__ */ (0, U.jsx)("rect", {
										x: 60 + t * s + (s - c) / 2,
										y: 178 - i,
										width: c,
										height: i,
										rx: "2",
										fill: a[r].color,
										children: /* @__PURE__ */ (0, U.jsx)("title", { children: `${a[r].label} ${e.date}: ${Ae(n.cost)}${n.pages === null ? "" : `, ${n.pages} pages`}` })
									}, a[r].label);
								}), t % Math.ceil(i.length / 8) === 0 ? /* @__PURE__ */ (0, U.jsx)("text", {
									x: 60 + t * s + s / 2,
									y: "199",
									textAnchor: "middle",
									fill: "#64748b",
									fontSize: "12",
									children: e.date.slice(5)
								}) : null] }, e.date)),
								/* @__PURE__ */ (0, U.jsxs)("text", {
									x: "16",
									y: "181",
									fill: "#64748b",
									fontSize: "12",
									children: [`${Ae(0).slice(0, -3)} `, /* @__PURE__ */ (0, U.jsx)("tspan", {
										fontSize: "smaller",
										children: "CR"
									})]
								})
							]
						})
					}), /* @__PURE__ */ (0, U.jsxs)("div", {
						style: H.summaries,
						children: [t && /* @__PURE__ */ (0, U.jsxs)("section", {
							"aria-label": "Totals usage",
							style: H.total,
							children: [/* @__PURE__ */ (0, U.jsx)("h3", {
								style: H.title,
								children: "Totals"
							}), /* @__PURE__ */ (0, U.jsxs)("dl", {
								style: H.metrics,
								children: [/* @__PURE__ */ (0, U.jsxs)("div", {
									style: H.metric,
									children: [/* @__PURE__ */ (0, U.jsx)("dt", {
										style: H.caption,
										children: "Credits"
									}), /* @__PURE__ */ (0, U.jsx)("dd", {
										style: H.value,
										children: /* @__PURE__ */ (0, U.jsx)(pe, { value: e.reduce((e, t) => e + t.cost, 0) })
									})]
								}), /* @__PURE__ */ (0, U.jsxs)("div", {
									style: H.metric,
									children: [/* @__PURE__ */ (0, U.jsx)("dt", {
										style: H.caption,
										children: "Average page credits"
									}), /* @__PURE__ */ (0, U.jsx)("dd", {
										style: H.value,
										children: e.every((e) => e.average === null) ? "No pages used" : /* @__PURE__ */ (0, U.jsx)(pe, { value: e.reduce((e, t) => t.average === null ? e : e + t.average, 0) })
									})]
								})]
							})]
						}), e.map((e) => /* @__PURE__ */ (0, U.jsxs)("section", {
							"aria-label": t ? `${V[e.name]} usage` : void 0,
							style: H.serviceSummary,
							children: [/* @__PURE__ */ (0, U.jsxs)("h3", {
								style: H.title,
								children: [/* @__PURE__ */ (0, U.jsx)("span", {
									"aria-hidden": "true",
									style: {
										...H.swatch,
										background: Ke[e.name]
									}
								}), V[e.name]]
							}), /* @__PURE__ */ (0, U.jsxs)("dl", {
								style: H.metrics,
								children: [/* @__PURE__ */ (0, U.jsxs)("div", {
									style: H.metric,
									children: [/* @__PURE__ */ (0, U.jsx)("dt", {
										style: H.caption,
										children: "Credits"
									}), /* @__PURE__ */ (0, U.jsx)("dd", {
										style: H.value,
										children: /* @__PURE__ */ (0, U.jsx)(pe, { value: e.cost })
									})]
								}), e.name !== "model_generation" && /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [
									/* @__PURE__ */ (0, U.jsxs)("div", {
										style: H.metric,
										children: [/* @__PURE__ */ (0, U.jsx)("dt", {
											style: H.caption,
											children: "Sessions"
										}), /* @__PURE__ */ (0, U.jsx)("dd", {
											style: H.value,
											children: e.sessions
										})]
									}),
									/* @__PURE__ */ (0, U.jsxs)("div", {
										style: H.metric,
										children: [/* @__PURE__ */ (0, U.jsx)("dt", {
											style: H.caption,
											children: "Pages used"
										}), /* @__PURE__ */ (0, U.jsx)("dd", {
											style: H.value,
											children: e.pages
										})]
									}),
									/* @__PURE__ */ (0, U.jsxs)("div", {
										style: H.metric,
										children: [/* @__PURE__ */ (0, U.jsx)("dt", {
											style: H.caption,
											children: "Average page credits"
										}), /* @__PURE__ */ (0, U.jsx)("dd", {
											style: H.value,
											children: e.average === null ? "No pages used" : /* @__PURE__ */ (0, U.jsx)(pe, { value: e.average })
										})]
									})
								] })]
							})]
						}, e.name))]
					})]
				}, n);
			}),
			/* @__PURE__ */ (0, U.jsxs)("section", {
				"aria-label": "Total Credits",
				style: {
					...H.metrics,
					alignItems: "baseline"
				},
				children: [/* @__PURE__ */ (0, U.jsx)("h3", {
					style: {
						...H.title,
						margin: 0
					},
					children: "Total Credits"
				}), /* @__PURE__ */ (0, U.jsx)("p", {
					style: H.value,
					children: /* @__PURE__ */ (0, U.jsx)(pe, { value: s.reduce((e, t) => e + t.cost, 0) })
				})]
			})
		]
	});
}
//#endregion
//#region src/features/usage/hook/useUsage.ts
function Je(e) {
	let [t, n] = P({
		owner: null,
		records: [],
		error: null,
		loading: !1
	});
	return A(() => {
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
function Ye({ id: e, code: t }) {
	let n = x((t) => t.tasks.find((t) => t.id === e)), r = x((e) => e.retry), i = x((e) => e.cancel);
	return !n || n.status !== "failed" ? null : /* @__PURE__ */ (0, U.jsx)(ue, {
		error: n.error,
		onRetry: () => void r(e),
		onCancel: n.changes.slice(n.cursor).some((e) => "segment" in e ? t === void 0 : e.code === t) ? () => i(e, t) : void 0
	});
}
//#endregion
//#region src/features/choices/worker/choicesWorkerClient.ts
function Xe(e, t) {
	let n = Error(e);
	if (typeof t == "object" && t) {
		let e = t;
		typeof e.code == "string" && (n.code = e.code), typeof e.status == "number" && (n.status = e.status), typeof e.retryAfter == "string" && (n.retryAfter = e.retryAfter), typeof e.retryAt == "number" && (n.retryAt = e.retryAt), Object.prototype.hasOwnProperty.call(e, "details") && (n.details = e.details);
	}
	return n;
}
function Ze(e) {
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
				i(Xe(t.error, t));
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
async function Qe(e) {
	let t = l.getState().generation, n = await Ze({ apiBaseUrl: e.apiGatewayUrl }).load(e.authToken, e.session), r = n === null ? null : {
		source: n.source,
		items: n.items,
		jurisdiction: n.jurisdiction ?? null
	};
	return t === l.getState().generation && l.getState().session === e.session && T.setState({ choices: structuredClone(r) }), r;
}
//#endregion
//#region src/features/metdataview/hook/useMetadata.ts
function $e(e) {
	let t = e;
	return {
		...e instanceof ErrorEvent ? { cause: e } : {},
		code: t.code,
		details: t.details,
		error: typeof t.error == "string" ? t.error : t.message || "Metadata request failed.",
		status: t.status
	};
}
function et({ authToken: t, batchCode: n, apiGatewayUrl: r, callbacks: i, deferredState: a, intervalMs: o, onQueueChange: s, formatError: c, refresh: u, retryIntervalMs: d, retryLimit: f, segments: p, session: m, workerClient: h }) {
	let _ = N(i), y = b(), ee = te((e) => e.getJSON(m)), x = M(() => Oe(ee), [ee]), S = M(() => x ? je(x) : null, [x]), C = y.openSegment, [w, E] = P(a.selectedIndex), D = N(null), ne = N(0), O = M(() => h || g({
		apiBaseUrl: r,
		onRetry: (e) => T.getState().setRetryAttempt(e),
		retryIntervalMs: d,
		retryLimit: f
	}), [
		r,
		d,
		f,
		h
	]);
	A(() => {
		_.current = i;
	}, [i]), A(() => () => _.current.onViewCanceled?.(), []);
	let ie = k((e) => {
		T.getState().setLoaded(m), i.onView?.(e), i.onMetadataLoaded?.(e, m);
	}, [i, m]), ae = k(async (n) => {
		T.getState().activeSession !== m && T.getState().setLoading(m), Qe({
			apiGatewayUrl: r,
			authToken: t ?? "",
			session: m
		}).catch(() => void 0);
		let a = n ? null : Oe(e.getState().getJSON(m));
		if (a) return ie(a), v({
			authToken: t ?? "",
			session: m,
			background: !0,
			workerClient: re({
				apiBaseUrl: r,
				retryIntervalMs: d,
				retryLimit: f
			})
		}), a;
		let o = ++ne.current, s = l.getState().generation;
		T.getState().setLoading(m), i.onViewStarted?.();
		try {
			let e = await O.indexData(t ?? "", m, n), r = T.getState();
			return s !== l.getState().generation || o !== ne.current || r.activeSession !== m || r.status === "idle" ? void 0 : (l.getState().setMetadata(m, e), ie(e), n && i.onRefresh?.(e), e);
		} catch (e) {
			let t = $e(e), n = T.getState();
			throw s === l.getState().generation && o === ne.current && n.activeSession === m && n.status !== "idle" && (n.setError(t), i.onViewError?.(t), i.onMetadataError?.(t)), t;
		}
	}, [
		r,
		t,
		i,
		O,
		ie,
		d,
		f,
		m
	]);
	A(() => {
		ae(!1).catch(() => void 0);
	}, [ae]), A(() => {
		!u || u.session !== m || u.id === D.current || (D.current = u.id, ae(!0).then((e) => {
			e && T.setState({ openSegment: u.segment });
		}).catch(() => void 0));
	}, [
		ae,
		u,
		m
	]), A(() => {
		T.setState({ openSegment: a.segment || p.TITLE }), E(a.selectedIndex);
	}, [
		a.segment,
		a.selectedIndex,
		p.TITLE,
		m
	]), A(() => {
		let e = T.getState().openSegment;
		e && _.current.onSegmentExpand?.(e);
	}, [C, m]);
	let oe = k((e, t) => {
		t && T.setState({ openSegment: e });
	}, []), se = k(async (e) => {
		await l.getState().enqueue({
			action: "drop",
			code: e.code,
			session: m,
			segment: e.segment,
			batch: n
		}, {
			authToken: t,
			client: O,
			intervalMs: o,
			formatError: c,
			onChange: s
		}), w?.code === e.code && (E(null), i.onIndexFocus?.(null));
	}, [
		s,
		c,
		t,
		n,
		i,
		O,
		o,
		w?.code,
		m
	]), j = k(async (e) => {
		await l.getState().enqueue({
			action: "confirm",
			code: e.code,
			session: m,
			segment: e.segment,
			batch: n
		}, {
			authToken: t,
			client: O,
			intervalMs: o,
			formatError: c,
			onChange: s
		});
	}, [
		s,
		c,
		t,
		n,
		O,
		o,
		m
	]), ce = k(async (e) => {
		await l.getState().enqueue({
			action: "reprocess",
			session: m,
			segment: e,
			batch: n
		}, {
			authToken: t,
			client: O,
			intervalMs: o,
			formatError: c,
			onChange: s
		});
	}, [
		s,
		c,
		t,
		n,
		O,
		o,
		m
	]), le = k(async (e) => {
		await l.getState().enqueue({
			action: "clear",
			session: m,
			segment: e,
			batch: n
		}, {
			authToken: t,
			client: O,
			intervalMs: o,
			formatError: c,
			onChange: s
		}), (w?.segment === e || e === p.PROPERTY && w?.segment === p.LEGAL || e === p.ACKNOWLEDGMENT && w?.segment === Fe.EXECUTION) && (E(null), i.onIndexFocus?.(null));
	}, [
		s,
		c,
		t,
		n,
		i,
		O,
		o,
		w?.segment,
		p,
		m
	]);
	return {
		choices: y.choices?.items ?? null,
		loadMetadata: ae,
		metadata: x,
		onConfirm: j,
		onDrop: se,
		onReprocess: ce,
		onClear: le,
		openSegment: C,
		pageError: y.activeSession === m ? y.pageError : null,
		retryAttempt: y.retryAttempt,
		selectedIndex: w,
		setSectionOpen: oe,
		store: y,
		panelData: S
	};
}
//#endregion
//#region src/features/legalmap/data/legalData.ts
function tt(e, t) {
	return e.replace(RegExp(`(^|[,/])\\s*(?:${t})\\b\\s*(?:no\\.?\\s*)?`, "gi"), "$1").trim();
}
var nt = [
	"Lot & block",
	"Address",
	"Metes & Bounds",
	"PLSS"
];
function rt(e) {
	return !!(e && typeof e == "object" && !Array.isArray(e));
}
function it(e) {
	return !e || typeof e == "string" && e.trim().length === 0;
}
function at(e) {
	if (!e || typeof e != "object") return [];
	if (Array.isArray(e)) return e;
	let t = e;
	return Array.isArray(t.elements) ? t.elements : Array.isArray(t.Elements) ? t.Elements : Array.isArray(t.legalElements) ? t.legalElements : Array.isArray(t.LegalElements) ? t.LegalElements : [];
}
function W(e, t) {
	let n = String(t || "").toLowerCase();
	return e.find((e) => typeof e.aspect == "string" && e.aspect.toLowerCase() === n)?.value || "";
}
function ot(e) {
	return Array.isArray(e) ? e : rt(e) && [
		e.LegalGroups,
		e.legalGroups,
		e.groups,
		e.items
	].find(Array.isArray) || [];
}
function st(e) {
	return e.map((e) => ({
		label: L(e.aspect),
		value: e.value,
		explanation: e.explanation
	}));
}
//#endregion
//#region src/features/legalmap/data/platData.ts
var ct = {
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
}, lt = ["subdivision", "condominium"], ut = [
	"phase",
	"unit",
	"section"
], dt = [
	"block",
	"tract",
	"building"
], ft = [
	"lot",
	"condominium_unit",
	"parcel"
], pt = {
	lot: "Lot",
	condominium_unit: "Condo Unit",
	parcel: "Parcel"
}, mt = Object.values(ct), ht = RegExp(`\\b(${mt.map((e) => e.replace(/ /g, "\\s+")).join("|")})\\b`, "i");
function gt(e) {
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
function _t(e) {
	let t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Map(), r = [];
	for (let i of e) {
		let e = i.kind === "lot" ? gt(i.name) : null;
		e ? (e.forEach((e) => t.add(e)), e.length === 1 && i.acreage && n.set(e[0], [...n.get(e[0]) ?? [], ...i.acreage])) : r.push({
			...i,
			filled: !0
		});
	}
	if (!t.size) return r.length <= 12 ? r : vt(e);
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
	if (r.length + c.length > 12) return vt(e);
	for (let e of c) {
		if (!e.filled) continue;
		let [t, r = t] = e.name.split("–").map(Number), i = [...n].filter(([e]) => e >= t && e <= r).flatMap(([, e]) => e);
		i.length > 0 && (e.acreage = i);
	}
	return [...c, ...r];
}
function vt(e) {
	return ft.flatMap((t) => {
		let n = e.filter((e) => e.kind === t);
		if (n.length === 0) return [];
		if (n.length === 1) return [{
			...n[0],
			filled: !0
		}];
		let r = n.flatMap((e) => e.acreage ?? []);
		return [{
			kind: t,
			name: `${n.length} ${pt[t].toLowerCase()}s`,
			filled: !0,
			detail: n.map((e) => e.name).join(", "),
			...r.length > 0 ? { acreage: r } : {}
		}];
	});
}
function yt(e) {
	return String(e || "").toLowerCase().split(/\s+/).map((e) => e && e[0].toUpperCase() + e.slice(1)).join(" ");
}
function bt(e) {
	return yt(String(e || "").replace(/\s+/g, " ").replace(/[.;:]$/g, "").trim());
}
function xt(e) {
	let t = String(e || "").trim();
	return t ? ct[t.toUpperCase()] || mt.find((e) => e.toLowerCase() === t.toLowerCase()) : void 0;
}
function G(e) {
	return String(e || "").replace(/\s+/g, " ").trim().toLowerCase();
}
var St = new Intl.Collator(void 0, {
	numeric: !0,
	sensitivity: "base"
});
function Ct(e, t) {
	let n = (e) => (e.name || e.tract || e.building || "").replace(/^\s*(?:block|tract|building)\b\s*(?:no\.?\s*)?/i, "").trim(), r = n(e), i = n(t);
	return r ? i ? St.compare(r, i) : -1 : +!!i;
}
function wt(e) {
	let t = [], n = (e) => {
		if (e) {
			if (Array.isArray(e)) {
				e.forEach(n);
				return;
			}
			if (rt(e)) {
				String(e.type || e.Type || e.groupType || e.GroupType || "").toLowerCase() === "lot_block" && at(e).length > 0 && t.push(e);
				for (let t of Object.keys(e)) n(e[t]);
			}
		}
	};
	return n(e), t;
}
function Tt(e, t) {
	if (e.length <= t) return e.map((e) => ({
		group: e,
		sources: [e]
	}));
	let n = e.map((e) => [e]), r = e.map((e) => {
		let t = /* @__PURE__ */ new Map();
		for (let n of at(e)) {
			let e = G(n.aspect), r = e === "acreage" ? n.value : n.value?.trim();
			if (!e || !r?.trim()) continue;
			let i = t.get(e) || [];
			(e === "acreage" || !i.some((e) => G(e) === G(r))) && i.push(r), t.set(e, i);
		}
		return t;
	});
	for (; r.length > t;) {
		let e = 0, t = 1, i = -1;
		for (let n = 0; n < r.length - 1; n += 1) for (let a = n + 1; a < r.length; a += 1) {
			let o = 0;
			for (let [e, t] of r[n]) for (let n of new Set(t.map(G))) r[a].get(e)?.some((e) => G(e) === n) && (o += 1);
			o > i && (e = n, t = a, i = o);
		}
		for (let [n, i] of r[t]) {
			let t = r[e].get(n) || [];
			for (let e of i) (n === "acreage" || !t.some((t) => G(t) === G(e))) && t.push(e);
			r[e].set(n, t);
		}
		n[e].push(...n[t]), n.splice(t, 1), r.splice(t, 1);
	}
	return r.map((e, t) => ({
		sources: n[t],
		group: {
			type: "lot_block",
			elements: [...e].flatMap(([e, t]) => (e === "right_of_way" || e === "acreage" ? t : [t.join(dt.some((t) => t === e) ? "/" : ",")]).map((t) => ({
				aspect: e,
				value: t
			})))
		}
	}));
}
function Et(e) {
	let t = ot(e), n = wt(t.length ? t : e), r = rt(e) && typeof e.parcels_num == "number" && e.parcels_num > 0 ? e.parcels_num : n.length, i = /* @__PURE__ */ new Map();
	for (let { group: e } of Tt(n, r)) {
		let t = at(e), n = W(t, "state").trim(), r = W(t, "county").trim(), a = W(t, "city").trim(), o = W(t, "subdivision").trim(), s = W(t, "condominium").trim(), c = W(t, "unit").trim(), l = W(t, "phase").trim(), u = W(t, "section").trim(), d = W(t, "block").trim(), f = W(t, "tract").trim(), p = W(t, "building").trim(), m = ft.flatMap((e) => {
			let n = W(t, e).trim();
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
		].map(G)), _ = i.get(g);
		_ || (_ = {
			state: n,
			county: r,
			subdivision: o,
			...s ? { condominium: s } : {},
			...a ? { city: a } : {},
			rightsOfWay: [],
			divisions: /* @__PURE__ */ new Map()
		}, i.set(g, _));
		for (let e of h) _.rightsOfWay.some((t) => G(t) === G(e)) || _.rightsOfWay.push(e);
		let v = JSON.stringify([
			c,
			l,
			u
		].map(G)), y = _.divisions.get(v);
		if (y || (y = {
			unit: c,
			phase: l,
			section: u,
			blocks: /* @__PURE__ */ new Map()
		}, _.divisions.set(v, y)), !d && !f && !p && m.length === 0) continue;
		let b = JSON.stringify([
			d,
			f,
			p
		].map(G)), ee = y.blocks.get(b);
		ee || (ee = {
			name: d,
			...f ? { tract: f } : {},
			...p ? { building: p } : {},
			lots: []
		}, y.blocks.set(b, ee));
		for (let e of m) {
			let n = ee.lots.find((t) => t.kind === e.kind && G(t.name) === G(e.name));
			n || (n = e, ee.lots.push(n));
			let r = e.kind === "lot" ? t.filter((e) => e.aspect?.toLowerCase() === "acreage" && e.value?.trim()).map((e) => e.value) : [];
			r.length > 0 && (n.acreage ??= []).push(...r);
		}
	}
	return Array.from(i.values(), ({ divisions: e, ...t }) => ({
		...t,
		divisions: Array.from(e.values(), ({ blocks: e, ...t }) => ({
			...t,
			blocks: Array.from(e.values()).sort(Ct)
		}))
	}));
}
function Dt(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) {
		for (let e of lt) it(n[e]) || t.add(e);
		n.rightsOfWay.length > 0 && t.add("right_of_way");
		for (let e of n.divisions) {
			for (let n of ut) it(e[n]) || t.add(n);
			for (let n of e.blocks) {
				it(n.name) || t.add("block"), n.tract && t.add("tract"), n.building && t.add("building");
				for (let e of n.lots) it(e.name) || t.add(e.kind);
			}
		}
	}
	return t;
}
function Ot(e) {
	return Dt(e).size === 0;
}
function kt(e) {
	let t = [];
	return e.state && t.push(xt(e.state) || ""), e.county && t.push(`${bt(e.county)} County`), e.city && t.push(bt(e.city)), t.filter(Boolean).join(" | ");
}
function At(e) {
	let t = e.find((e) => !it(e.subdivision));
	return t ? bt(t.subdivision) : void 0;
}
function jt(e) {
	let t = {};
	if (rt(e)) {
		let n = rt(e.plat) ? e.plat : rt(e.location) ? e.location : null;
		n && (typeof n.city == "string" && n.city.trim() && (t.city = bt(n.city)), typeof n.county == "string" && n.county.trim() && (t.county = bt(n.county.replace(/\bCounty\b/i, "").trim())), typeof n.state == "string" && n.state.trim() && (t.state = xt(n.state)));
	}
	let n = [...ot(e), ...e ? [e] : []];
	for (let e of n) {
		for (let n of at(e)) {
			let e = String(n.aspect || "").toLowerCase(), r = typeof n.value == "string" ? n.value.trim() : "";
			r && (!t.city && (e === "city" || e === "municipality" || e === "locality") && (t.city = bt(r)), !t.county && (e === "county" || e === "parish" || e === "borough") && (t.county = bt(r.replace(/\bCounty\b/i, "").trim())), !t.state && (e === "state" || e === "province") && (t.state = xt(r)));
		}
		if (t.city && t.county && t.state) break;
	}
	if (t.city && t.county && t.state) return t;
	let r = [], i = (e) => {
		typeof e == "string" && e.trim() && r.push(e);
	};
	if (rt(e) && (i(e.text), i(e.header), i(e.location_text)), Array.isArray(e)) for (let t of e) rt(t) && (i(t.text), i(t.header));
	let a = r.join(" | ");
	if (!a) return t;
	if (!t.county) {
		let e = a.match(/\b([A-Z][A-Za-z' .-]+)\s+County\b/i);
		e && (t.county = bt(e[1]));
	}
	if (t.state ||= xt((a.match(/\bCounty,\s*([A-Z]{2}|[A-Z][a-zA-Z' .-]+)\b/) || a.match(ht) || a.match(/\b([A-Z]{2})\b/))?.[1] || ""), !t.city) {
		let e = a.match(/\bCity of\s+([A-Z][A-Za-z' .-]+)\b/i);
		e && (t.city = bt(e[1]));
	}
	return t;
}
function Mt(e, t) {
	if (!t) return !1;
	let n = G(t), r = !1;
	for (let t of e) if (!it(t.subdivision) && (r = !0, G(t.subdivision) !== n)) return !1;
	return r;
}
function Nt(e) {
	let t = Et(e), n = jt(e), r = At(t), i = Dt(t);
	return {
		references: ot(e).filter((e) => rt(e) && e.type === "plat_reference").flatMap(at),
		subdivisions: t,
		location: n,
		platName: r,
		presentLayers: i,
		matchPlatSubdivision: Mt(t, r),
		isEmptyStructure: Ot(t),
		locationLabel: kt(n)
	};
}
function Pt(e) {
	let t = at(e).filter((e) => e.value?.trim()), n = Et([e]), r = Dt(n);
	n.some((e) => e.divisions.some((e) => e.blocks.some((e) => _t(e.lots).some((e) => e.acreage)))) && r.add("acreage");
	let i = t.filter((e) => e.aspect?.trim() && !r.has(e.aspect.toLowerCase()) && ![
		"state",
		"county",
		"city"
	].includes(e.aspect.toLowerCase())), a;
	return t.some((e) => !e.aspect?.trim()) ? a = "Cannot map: extracted values without aspect labels cannot be drawn." : r.size === 0 && (a = i.length === 0 ? "Cannot map: only location fields were provided; no drawable identifiers are available." : "No drawable property identifiers could be resolved."), {
		notes: st(t),
		aspects: i,
		issue: a
	};
}
//#endregion
//#region src/features/legalmap/data/metesData.ts
var Ft = {
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
}, It = RegExp("\\b(?:" + Object.keys(Ft).join("|") + ")\\b", "gi");
function Lt(e, t, n) {
	let r = (n ? e.replace(/\d+\.\d+/g, (e) => String(+Number(e).toFixed(2))) : e).replace(It, (e) => Ft[e.toUpperCase()]).replace(/\b(?:DEGREES?|DEG)\b\.?/gi, "°").replace(/\b(?:MINUTES?|MIN)\b\.?/gi, "′").replace(/\b(?:SECONDS?|SEC)\b\.?/gi, "″");
	return t ? r.replace(/''|[″”"]/g, "″").replace(/[′’']/g, "′").replace(/[º˚]/g, "°").replace(/(\d)\s*O(?=\s*\d)/gi, "$1°").replace(/\s*([°′″])/g, "$1").replace(/([°′″])\s+(?=\d)/g, "$1") : r.replace(/(\d)\s*'/g, "$1 ft").replace(/(\d)\s*"/g, "$1 in");
}
function Rt(e) {
	let t = Lt(e, !0).trim().toUpperCase().replace(/,/g, " ").replace(/′/g, "'").replace(/″/g, "\""), n = {
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
var zt = {
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
}, Bt = /* @__PURE__ */ RegExp("(?<![-\\w.,])-?(?:\\d+(?:,\\d{3})*(?:\\.\\d+)?|\\.\\d+)\\s*(?:FEET|FOOT|FT\\.?|METERS?|METRES?|M|INCH(?:ES)?|IN|YARDS?|YD|CHAINS?|CH|RODS?|RD|LINKS?|LK|MILES?|MI|['\"])(?![A-Z])(?:\\s*-?(?:\\d+(?:,\\d{3})*(?:\\.\\d+)?|\\.\\d+)\\s*(?:FEET|FOOT|FT\\.?|METERS?|METRES?|M|INCH(?:ES)?|IN|YARDS?|YD|CHAINS?|CH|RODS?|RD|LINKS?|LK|MILES?|MI|['\"])(?![A-Z]))*", "i"), Vt = /* @__PURE__ */ RegExp("^(?:\\d+(?:,\\d{3})*(?:\\.\\d+)?|\\.\\d+)\\s*(?:(?:FEET|FOOT|FT\\.?|')\\s*(?:\\d+(?:,\\d{3})*(?:\\.\\d+)?|\\.\\d+)\\s*(?:INCH(?:ES)?|IN|\")(?![A-Z])|(?:FEET|FOOT|FT\\.?|METERS?|METRES?|M|INCH(?:ES)?|IN|YARDS?|YD|CHAINS?|CH|RODS?|RD|LINKS?|LK|MILES?|MI|['\"])(?![A-Z]))$", "i"), Ht = /* @__PURE__ */ RegExp("(?<![\\w'’])(?:NORTH|SOUTH|N|S)\\.?\\s*\\d+(?:\\.\\d+)?(?:\\s+\\d+\\s*\\/\\s*\\d+)?\\s*(?:DEGREES?|DEG\\.?|[°º˚]|O(?=\\s*\\d))?(?:\\s*\\d+(?:\\.\\d+)?\\s*(?:MINUTES?|MIN\\.?|['′’:]))?(?:\\s*\\d+(?:\\.\\d+)?\\s*(?:SECONDS?|SEC\\.?|[\"″”]|''))?\\s*,?\\s*(?:EAST|WEST|E|W)\\b|(?<![\\w'’])(?:NORTH|SOUTH|EAST|WEST|[NSEW])(?=\\s+-?(?:\\d+(?:,\\d{3})*(?:\\.\\d+)?|\\.\\d+)(?![\\d.]|\\s*/)(?!\\s*(?:DEGREES?|DEG\\.?|[°º˚])))", "gi"), Ut = /^\s*(?:NORTH|SOUTH|[NS])\s*\d/i;
function Wt(e) {
	if (!Vt.test(e.trim())) return null;
	let t = [...e.matchAll(/* @__PURE__ */ RegExp("((?:\\d+(?:,\\d{3})*(?:\\.\\d+)?|\\.\\d+))\\s*((?:FEET|FOOT|FT\\.?|METERS?|METRES?|M|INCH(?:ES)?|IN|YARDS?|YD|CHAINS?|CH|RODS?|RD|LINKS?|LK|MILES?|MI|['\"])(?![A-Z]))", "gi"))].reduce((e, t) => e + Number(t[1].replaceAll(",", "")) * zt[t[2].toLowerCase().replace(/\.$/, "")], 0);
	return Number.isFinite(t) ? t : null;
}
function Gt(e, t) {
	return e !== null && t !== null && Math.abs(e - t) <= 2 ** -52 * Math.max(1, Math.abs(e), Math.abs(t)) * 4;
}
function Kt(e, t) {
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
		let e = [...r.matchAll(Ht), ...r.matchAll(new RegExp(Bt.source, "gi"))], t = 0;
		for (let i of r.matchAll(/,(?!\s*\d+(?:\.\d+)?\s*(?:MIN(?:UTES)?|SEC(?:ONDS)?|[\x27\x22′″]))|[;\n|]|\band\b/gi)) e.some((e) => i.index > e.index && i.index < e.index + e[0].length) || (n.push(r.slice(t, i.index).trim()), t = i.index + i[0].length);
		n.push(r.slice(t).trim());
	}
	return n;
}
function qt(e, t = Ht) {
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
		let a = i[n + 1]?.match.index ?? e.length, o = e.slice(t.match.index + t.match[0].length, a), s = o.split(/[;\n]|\bTHENCE\b/i)[0].match(Bt)?.[0];
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
function Jt(e) {
	let t = [...new Set(Kt([e.source ?? "", ...at(e).filter((e) => e.aspect === "bearings" || e.aspect === "distances").map((e) => e.value ?? "")], !1).map((e) => e.replace(/\s+/g, " ").trim().replace(/\.$/, "")))], n = t.map((e) => e.match(/^(NORTH|SOUTH|EAST|WEST)(?:WARD|ERLY)\s+AT\s+RIGHT\s+ANGLES\s+TO\s+(.+)$/i)).filter((e) => e !== null), r = n[0];
	if (!r) return null;
	let i = Rt(r[1]);
	if (n.some((e) => Rt(e[1]) !== i || e[2].toUpperCase() !== r[2].toUpperCase())) return null;
	let a = t.map((e) => e.match(/^(NORTH|SOUTH|EAST|WEST|[NSEW])(?:ERLY)?\s+SIDE\s+OF\s+(.+)$/i)).filter((e) => e !== null && e[2].toUpperCase() === r[2].toUpperCase());
	if (!a.length || a.some((e) => Rt(e[1]) !== i)) return null;
	let o = {
		frontage: /* @__PURE__ */ new Map(),
		depth: /* @__PURE__ */ new Map()
	}, s = RegExp("^(" + Bt.source + ")\\s+(FRONTAGE|FRONT|DEPTH|DEEP)$", "i");
	for (let e of t.filter((e) => /\b(?:FRONTAGE|FRONT|DEPTH|DEEP)$/i.test(e))) {
		let t = e.match(s);
		if (!t) return null;
		let n = Wt(t[1]);
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
function Yt(e) {
	return Rt(e.replace(/\b(?:SUBSTANTIALLY|DUE)\b/gi, "").replace(/\s+/g, " ").trim());
}
function Xt(e) {
	let t = e.match(/\b(?:NORTH|SOUTH|[NS])\s*\d[^;]*?\b(?:EAST|WEST|[EW])\b/i), n = [...e.matchAll(new RegExp(Bt.source, "gi"))].find((e) => !t || e.index < t.index || e.index >= t.index + t[0].length), r = (n ? (e.slice(0, n.index).trim() + " " + e.slice(n.index + n[0].length).trim()).trim() : e.trim()).replace(/^APPROXIMATELY\s*$/i, "").trim(), i = Yt(r), a = n?.[0] ?? (i === null && /^\s*-?(?:\d|\.\d)/.test(e) ? e.trim() : void 0), o = a === void 0 ? null : Wt(a);
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
function Zt(e, t, n = "") {
	let r = [e, t].map((e, t) => Kt(e, t === 1).map(Xt)).map((e) => {
		let t = new Set(e.flatMap((e) => e.metres !== null && e.distance ? [e.distance.match(/* @__PURE__ */ RegExp("(?:FEET|FOOT|FT\\.?|METERS?|METRES?|M|INCH(?:ES)?|IN|YARDS?|YD|CHAINS?|CH|RODS?|RD|LINKS?|LK|MILES?|MI|['\"])(?![A-Z])$", "i"))?.[0].toUpperCase().replace(/\.$/, "")] : []).filter(Boolean)), n = t.size === 1 ? [...t][0] : void 0, r = n ? e.map((e) => e.distance && (/* @__PURE__ */ RegExp("^(?:\\d+(?:,\\d{3})*(?:\\.\\d+)?|\\.\\d+)$", "i")).test(e.distance) ? {
			...e,
			distance: `${e.distance} ${n}`,
			metres: Wt(`${e.distance} ${n}`)
		} : e) : e;
		return r.some((e) => e.angle !== null || e.distance !== void 0 || Ut.test(e.bearing)) ? r : [];
	});
	if (r.every((e) => e.every((e) => e.angle === null && !Ut.test(e.bearing)))) return [];
	let i = [], a = r.findIndex((e) => e.length > 0 && e.every((e) => e.angle !== null && e.distance === void 0)), o = /* @__PURE__ */ new Set(), s = qt(n, RegExp(Ht.source + "|(?<![\\w'’])(?:NORTH|SOUTH|EAST|WEST)(?![\\w'’])", "gi"));
	for (let [e, t] of r.entries()) for (let [n, c] of t.entries()) {
		if (o.has(c)) continue;
		let t = r[1 - e], l;
		if (c.angle !== null && c.distance === void 0) {
			let e = s.filter((e) => Yt(e.bearing) === c.angle && e.distance !== void 0).flatMap((e) => t.filter((t) => !o.has(t) && Gt(t.metres, Wt(e.distance)) && (t.bearing === "" || t.angle === c.angle)));
			new Set(e).size === 1 && (l = e[0]);
		}
		let u = t[n];
		!l && u && !o.has(u) && (c.bearing === "" || u.bearing === "" || c.angle !== null && c.angle === u.angle) && (c.distance === void 0 || u.distance === void 0 || Gt(c.metres, u.metres)) && (l = u), !l && c.distance === void 0 && c.angle !== null && (l = t.find((e) => !o.has(e) && e.bearing === "" && e.distance !== void 0)), !l && c.bearing === "" && c.distance !== void 0 && (l = t.find((e) => !o.has(e) && e.angle !== null && e.distance === void 0)), o.add(c);
		let d = a < 0 ? e === 0 ? n : r[0].length + n : e === a && l ? t.indexOf(l) : n;
		if (l) {
			o.add(l);
			let e = c.bearing === "" ? l : c, t = c.distance === void 0 ? l : c, n = s.find((n) => Yt(n.bearing) === e.angle && n.distance !== void 0 && Gt(Wt(n.distance), t.metres));
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
function Qt(e) {
	return e.kind === "bearing" && e.angle !== null && e.metres !== null && e.metres > 0;
}
function $t(e) {
	let t = [], n = [];
	for (let { start: r, ...i } of qt(e)) {
		let e = {
			...i,
			angle: i.kind === "bearing" ? Rt(i.bearing) : null,
			metres: i.distance === void 0 ? null : Wt(i.distance),
			paired: !0,
			missingBearing: !1,
			missingDistance: !1
		};
		Qt(e) && (t.push(e), n.push(r));
	}
	let r = +(t[0]?.issue === "Commencement offset; not a boundary course."), i = /\bTHENCE\s+FROM\s+(?:SAID|THIS|THE)\s*["“]?(?:TRUE\s+)?(?:(?:PLACE|POINT)\s+OF\s+)?BEGINNING\b/i.exec(e)?.index, a = [...e.matchAll(/\b(?:TRUE\s+)?(?:PLACE|POINT)\s+OF\s+BEGINNING\b/gi)].map((e) => e.index);
	for (let e of [...i === void 0 ? [] : [i], ...a].sort((e, t) => e - t)) {
		let i = n.filter((t) => t < e).length;
		if (!(i === 0 || i === t.length)) {
			if (an(t.slice(r, i), 1 / 5e3).closed) {
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
function en(e) {
	let t = Zt(e.bearings, e.distances);
	return {
		bearings: t.filter((e) => e.angle !== null).length,
		distances: t.filter((e) => e.metres !== null).length
	};
}
function tn(e) {
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
function nn(e, t, n) {
	return (t.x - e.x) * (n.y - e.y) - (t.y - e.y) * (n.x - e.x);
}
function rn(e, t, n, r, i) {
	let a = nn(e, t, n), o = nn(e, t, r), s = nn(n, r, e), c = nn(n, r, t), l = (e, t, n) => Math.abs(nn(e, t, n)) <= i && n.x >= Math.min(e.x, t.x) - 1e-8 && n.x <= Math.max(e.x, t.x) + 1e-8 && n.y >= Math.min(e.y, t.y) - 1e-8 && n.y <= Math.max(e.y, t.y) + 1e-8;
	return (a > i && o < -i || a < -i && o > i) && (s > i && c < -i || s < -i && c > i) || l(e, t, n) || l(e, t, r) || l(n, r, e) || l(n, r, t);
}
function an(e, t, n) {
	let r = tn(e), i = r[r.length - 1], a = Math.hypot(i.x, i.y), o = e.reduce((e, t) => e + t.metres, 0), s = Math.abs(r.slice(0, -1).reduce((e, t, n) => e + t.x * r[n + 1].y - r[n + 1].x * t.y, 0) / 2), c = s / 4046.8564224, l = Math.max(1e-12, o * o * 1e-12), u = s <= l, d = r.length - 1, f = !1;
	for (let e = 0; e < d; e++) for (let t = e + 2; t < d; t++) e === 0 && t === d - 1 || rn(r[e], r[e + 1], r[t], r[t + 1], l) && (f = !0);
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
function on(e) {
	let t = [...(e ?? "").matchAll(/(?<![\d.,-])((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\s*(?:ACRES?|AC\b)/gi)].map((e) => Number(e[1].replaceAll(",", ""))).filter((e) => e > 0 && Number.isFinite(e));
	return new Set(t).size === 1 ? t[0] : void 0;
}
function sn(e, t, n, r, i) {
	let a = [], o = Math.min(12, Math.max(0, e.length - 3));
	for (let s = 0; s <= o; s++) {
		if (r !== void 0 && s !== r) continue;
		let o = e.slice(), c = (e, r, i = []) => {
			let o = an(e.slice(s), t, n);
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
function cn(e, t, n) {
	let r = Math.hypot(e, t);
	if (r < 1e-10 || !Number.isFinite(r)) return null;
	let i = t <= 0 ? "N" : "S", a = e >= 0 ? "E" : "W", o = `${i} ${(Math.atan2(Math.abs(e), Math.abs(t)) * 180 / Math.PI).toFixed(12)}° ${a}`, s = Rt(o);
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
function ln(e, t, n, r) {
	let i = [], a = Math.min(12, Math.max(0, e.length - 2));
	for (let o = 0; o <= a; o++) {
		if (r !== void 0 && o !== r) continue;
		let a = e.slice(o);
		if (a.length < 2) continue;
		let s = tn(a), c = s[s.length - 1], l = Math.hypot(c.x, c.y), u = a.reduce((e, t) => e + t.metres, 0);
		if (!Number.isFinite(u) || u <= 0 || l >= u * .95) continue;
		let d = cn(-c.x, -c.y, "UNCONFIRMED: Synthetic closing border; no source measurement supports this line.");
		if (!d) continue;
		let f = an([...a, d], t, n);
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
function un(e, t) {
	if (!Number.isFinite(e.metres) || e.metres <= 0 || !Number.isFinite(t) || t <= 0) return null;
	let n = tn([e])[1], r = t * 4046.8564224 / e.metres;
	if (!Number.isFinite(r) || r <= 0) return null;
	let i = n.x, a = n.y, o = a / e.metres * r, s = -i / e.metres * r, c = "UNCONFIRMED: Area-derived side; no bearing or distance in the source supports this line.", l = [
		cn(o, s, c),
		cn(-i, -a, c),
		cn(-o, -s, c)
	];
	if (l.some((e) => e === null)) return null;
	let u = [e, ...l.filter((e) => e !== null)], d = an(u, 1 / 5e3, t);
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
function dn(e, t, n) {
	if (!e || !Number.isFinite(e) || e <= 0) return null;
	let r = Math.sqrt(e * 4046.8564224);
	if (!Number.isFinite(r) || r <= 0) return null;
	let i = [
		[r, 0],
		[0, r],
		[-r, 0],
		[0, -r]
	].map(([e, t]) => cn(e, t, "UNCONFIRMED: Area-derived schematic border; not a measured course.")).filter((e) => e !== null);
	if (!an(i, 1 / 5e3, e).closed) return null;
	let a = en(t);
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
function fn(e) {
	let t = e.closureRatio ?? 1 / 5e3, n = on(e.acreage), r = e.source ?? "", i = $t(r), a = Zt(e.bearings, e.distances, r).filter(Qt), o = i.courses.length >= 3, s = o ? i.courses : a, c = o ? "source" : a.length ? "extracted" : "none", l = e.allowSchematic !== !1, u = o && i.beginning > 0 ? i.beginning : void 0;
	if (s.length) {
		let r = sn(s, t, n, u, !o);
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
		let d = an(s.slice(u ?? 0), t, n);
		if (l) {
			let r = ln(s, t, n, u);
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
			let i = dn(n, e, "Measured courses cannot form a credible simple polygon.");
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
			let e = un(i.courses[0], n);
			if (e) return e;
		}
		let t = dn(n, e, "Source-supported course pairing is missing or incomplete.");
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
function pn(e, t, n) {
	let { courses: r, ...i } = n, a = {
		...i,
		title: t,
		items: [],
		notes: st(at(e).filter((e) => e.value?.trim())),
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
			let e = n.match(/\bCURVE\s+TO\s+THE\s+(LEFT|RIGHT)\b/i), t = n.match(/* @__PURE__ */ RegExp("\\bRADIUS\\s+OF\\s+((?:\\d+(?:,\\d{3})*(?:\\.\\d+)?|\\.\\d+)\\s*(?:FEET|FOOT|FT\\.?|METERS?|METRES?|M|INCH(?:ES)?|IN|YARDS?|YD|CHAINS?|CH|RODS?|RD|LINKS?|LK|MILES?|MI|['\"])(?![A-Z]))", "i")), r = t ? Wt(t[1]) : null;
			c = e && r !== null && r > 0 ? {
				radius: r,
				turn: e[1].toUpperCase() === "RIGHT" ? 1 : -1
			} : void 0;
		}
	}
	return a.ending !== void 0 && (a.courses[a.ending - 1].target = (a.beginning ?? 0) + 1), a;
}
function mn(e, t, n = {}) {
	let r = at(e).filter((e) => e.value?.trim()), i = e.source ?? "", a = r.filter((e) => e.aspect === "bearings").map((e) => e.value), o = r.filter((e) => e.aspect === "distances").map((e) => e.value), s = qt(i).map((e) => ({
		...e,
		angle: e.kind === "bearing" ? Rt(e.bearing) : null,
		metres: e.distance === void 0 ? null : Wt(e.distance),
		paired: !0,
		missingBearing: !1,
		missingDistance: !1
	}));
	if (s.some((e) => e.kind === "curve")) {
		let r = s.findIndex((e, t) => {
			if (t === s.length - 1 || !/\b(?:TRUE\s+)?(?:PLACE|POINT)\s+OF\s+BEGINNING\b|\bTHENCE\s+FROM\s+(?:SAID|THIS|THE)\s*(?:(?:PLACE|POINT)\s+OF\s+)?BEGINNING\b/i.test(e.clause)) return !1;
			let r = s.slice(0, t + 1);
			if (!r.every(Qt)) return !0;
			let i = an(r, n.closureRatio ?? 1 / 5e3);
			return i.residual > Math.max(.006096, i.perimeter * Math.min(Math.max(n.closureRatio ?? 1 / 5e3, 0), 1 / 2e3));
		});
		return pn(e, t, {
			courses: s,
			beginning: r < 0 ? void 0 : r + 1,
			closed: !1,
			method: "source",
			completion: "open",
			schematic: s.some((e) => e.issue !== void 0)
		});
	}
	let c = Zt(a, o, i), l = s.length ? s : c;
	if (l.length === 0) {
		let n = Jt(e);
		if (n) {
			let r = "Unconfirmed boundary: street-relative schematic requires review.";
			return pn(e, t, {
				courses: n.map((e) => ({
					...e,
					angle: Rt(e.bearing),
					metres: Wt(e.distance),
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
	let u = fn({
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
		return pn(e, t, {
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
	let p = u.courses.length, m = [...u.courses, ...d.map((e) => u.method === "source" && Qt(e) && s.indexOf(e) > f ? {
		...e,
		issue: "Course follows the closed parcel."
	} : {
		...e,
		unassigned: !0,
		issue: e.issue ?? (e.angle === null ? "Bearing is unreadable." : e.metres === null ? "Distance is missing or unreadable." : e.metres === 0 ? "Distance is zero." : "Unassigned source or extracted measurement; excluded from the illustrated outline.")
	})], h = m.slice(p).some((e) => !e.unassigned);
	return pn(e, t, {
		...u,
		courses: m,
		ending: p,
		issue: h ? [u.issue, "Boundary needs review: additional courses follow the closed parcel."].filter(Boolean).join(" ") : u.issue,
		schematic: u.completion === "partial" || u.completion === "synthetic" || m.some((e) => e.issue !== void 0)
	});
}
//#endregion
//#region src/features/legalmap/data/plssData.ts
function hn(e) {
	return e.toUpperCase().replace(/NORTHEAST/g, "NE").replace(/NORTHWEST/g, "NW").replace(/SOUTHEAST/g, "SE").replace(/SOUTHWEST/g, "SW").replace(/NORTH/g, "N").replace(/SOUTH/g, "S").replace(/EAST/g, "E").replace(/WEST/g, "W").replace(/QUARTER/g, "1/4").replace(/HALF/g, "1/2");
}
function gn(e, t, n, r) {
	let i = hn(t), a = i.trim() ? i.split(/\s*(?:,|\bAND\b|&)\s*/).filter((e) => e.trim()) : [""], o = [];
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
function _n(e, t) {
	let n = at(e).filter((e) => e.value?.trim()), r = st(n), i = Array.from({ length: 36 }, (e, t) => {
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
				n !== void 0 && i.push(...gn(n, o, c, t.trim()));
			}
		}
	}
	let l = i.filter((e) => e.role === "area");
	if (!l.length) {
		let e = n.filter((e) => e.aspect === "aliquots").map((e) => e.value).join("; ");
		if (/\b(NE|NW|SE|SW|N|S|E|W)\s*(?:1\s*\/\s*[24]|[¼½])/.test(hn(e)) && !a) {
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
			i.splice(0, i.length, t, ...gn(t, e, c, e)), l = i.filter((e) => e.role === "area");
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
function vn(e) {
	let t = {
		lot_block: "Lot & block",
		plss: "PLSS",
		government_lot: "PLSS",
		fractional_section: "PLSS",
		metes_bounds: "Metes & Bounds"
	};
	return ot(e).filter((e) => typeof e == "object" && !!e).flatMap((e) => {
		let n = e.type?.trim() ?? "";
		if (!Object.hasOwn(t, n) || at(e).filter((e) => e.value?.trim()).length === 0 && !e.source?.trim()) return [];
		let r = t[n];
		if (r === "PLSS") {
			let t = _n(e, r);
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
			let t = mn(e, r);
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
			...Pt({
				...e,
				type: n
			})
		}];
	});
}
//#endregion
//#region src/features/pagesegments/data/pageSegmentsData.ts
var yn = Object.freeze({
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
}), bn = Object.freeze([
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
]), xn = Object.freeze({
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
function Sn(e) {
	let t = e;
	for (; typeof t == "string";) t = JSON.parse(t);
	return Array.isArray(t) ? t : [];
}
function Cn(e, t) {
	try {
		let n = Sn(e).find((e) => e && typeof e == "object" && e.service === t);
		return n ? Number(n.level) : 0;
	} catch {
		return 0;
	}
}
function wn(e) {
	return bn.includes(e);
}
function Tn(e) {
	let t = new Set(e.map((e) => String(e ?? "").trim()).filter(wn));
	return bn.filter((e) => t.has(e));
}
//#endregion
//#region src/features/metdataview/component/MetadataPanel.tsx
var En = new Set([
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
function Dn(e) {
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
function On(e) {
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
function kn({ children: e }) {
	let t = j(), n = N(null), r = N(null), i = N(null), [a, o] = P({
		overflow: !1,
		right: !1
	});
	return ce(() => {
		let e = r.current, t = () => o({
			overflow: i.current.scrollWidth > n.current.clientWidth,
			right: e.scrollWidth - e.clientWidth - e.scrollLeft > 1
		}), a = new ResizeObserver(t);
		return a.observe(n.current), a.observe(e), a.observe(i.current), e.addEventListener("scroll", t), t(), () => {
			a.disconnect(), e.removeEventListener("scroll", t);
		};
	}, [a.overflow]), /* @__PURE__ */ (0, U.jsxs)("div", {
		ref: n,
		style: Be.actionFrame,
		children: [/* @__PURE__ */ (0, U.jsx)("div", {
			"aria-label": "Section actions",
			id: t,
			ref: r,
			role: "group",
			style: Be.actionViewport,
			tabIndex: 0,
			children: /* @__PURE__ */ (0, U.jsx)("div", {
				ref: i,
				style: Be.actionGroup,
				children: e
			})
		}), a.overflow ? /* @__PURE__ */ (0, U.jsx)("button", {
			"aria-controls": t,
			"aria-label": "Scroll section actions right",
			disabled: !a.right,
			onClick: () => r.current.scrollBy({ left: r.current.clientWidth }),
			style: {
				...Pe,
				...a.right ? {} : { opacity: .56 }
			},
			type: "button",
			children: /* @__PURE__ */ (0, U.jsx)("svg", {
				"aria-hidden": "true",
				fill: "none",
				stroke: "currentColor",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				strokeWidth: "2",
				viewBox: "0 0 24 24",
				style: Be.chevron(!1),
				children: /* @__PURE__ */ (0, U.jsx)("path", { d: "m9 6 6 6-6 6" })
			})
		}) : null]
	});
}
function An(e) {
	let { callbacks: t, children: n, choices: r, pageScope: i, confirmedCodes: a, actions: o, metadata: s, onConfirm: c, onDrop: l, onAddIndex: u, onEditIndex: d, onReprocess: f, onClear: p, openSegment: m, removedCodes: h, sections: g, showContext: _, segments: v, selectedIndex: y, session: b, setSectionOpen: ee, shortcuts: te, status: x, panelData: S, pageError: C, pendingSegments: w } = e, T = g.hiddenSegments, E = (e) => !T.has(e), ne = new Set(r?.filter((e) => Number(e.level) > 0).map((e) => e.service)), re = new Map([
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
		[v.JUDGMENT, yn.judgment]
	]), O = new Set(g.filterByChoices && r !== null ? [...re].filter(([, e]) => !ne.has(e)).map(([e]) => e) : []), ie = E(v.PROPERTY) && !O.has(v.PROPERTY), ae = E(v.LEGAL) && !O.has(v.LEGAL), oe = (e) => te?.get(e) ?? null, se = m === v.LEGAL ? v.PROPERTY : m, k = (n, r, i, s = "index", u = r) => {
		let f = n.filter((e) => !h.has(String(e.code || "")));
		return /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [r === Fe.EXECUTION && f.length > 0 ? /* @__PURE__ */ (0, U.jsx)("h4", {
			style: R.pageTitle,
			children: "Visual Verification"
		}) : null, /* @__PURE__ */ (0, U.jsx)(xe, {
			ungrouped: r === v.ENDORSEMENT || r === Fe.EXECUTION,
			empty: i,
			rows: f.map((n) => {
				let i = String(n.code || "");
				return /* @__PURE__ */ (0, U.jsx)(Se, {
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
					session: b,
					type: s
				}, i);
			})
		}, `${b}-${u}`)] });
	}, A = (e, n, i, a = e) => {
		let c = e === v.PROPERTY ? !ie && !ae : O.has(e), l = g.filterByChoices ? r === null ? "Processing choices are unavailable for this session." : N.get(e) : void 0;
		return /* @__PURE__ */ (0, U.jsx)(Ce, {
			collapsible: !1,
			disabled: c,
			disabledReason: "Not selected for this session.",
			error: e === v.PAGE ? C?.error : void 0,
			note: e === v.TITLE || r === null ? void 0 : l,
			pending: a ? w?.get(a) : void 0,
			progressLabel: a ? w?.get(a)?.label : void 0,
			headerAction: (n) => a && se === e && (e === v.PROPERTY && j.hasMap || u || o.reprocess && f || o.drop && p) ? /* @__PURE__ */ (0, U.jsxs)(kn, { children: [
				e === v.PROPERTY && j.hasMap ? /* @__PURE__ */ (0, U.jsxs)(le, {
					label: "Open legal view",
					lineAligned: !1,
					text: !0,
					onClick: () => t.onLegalView?.(),
					children: [/* @__PURE__ */ (0, U.jsx)(ge, { name: "address" }), "Show Map"]
				}) : null,
				u ? /* @__PURE__ */ (0, U.jsx)(le, {
					label: "Add Index",
					lineAligned: !1,
					text: !0,
					onClick: (e) => u(a, e.currentTarget),
					children: "Add Index"
				}) : null,
				o.reprocess && f ? /* @__PURE__ */ (0, U.jsx)(fe, {
					flat: !0,
					size: "sm",
					label: "Reprocess",
					style: z.actionButton(!1, !1, !0),
					onConfirm: () => f(a),
					children: "Reprocess"
				}) : null,
				o.drop && p ? /* @__PURE__ */ (0, U.jsx)(fe, {
					disabled: n === 0,
					flat: !0,
					size: "sm",
					label: "Clear indexes",
					variant: "danger",
					style: z.actionButton(!1, !1, !0),
					onConfirm: () => p(a)
				}) : null
			] }) : null,
			resetKey: s,
			render: () => {
				let t = i();
				return {
					...t,
					children: /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [t.children, l && (e === v.TITLE || r === null) ? /* @__PURE__ */ (0, U.jsx)("p", {
						role: "note",
						style: R.muted,
						children: l
					}) : null] })
				};
			},
			onOpenChange: (t) => ee(e, t),
			open: se === e,
			shortcutKey: oe(e),
			title: n,
			children: null
		});
	};
	if ((x === "loading" || x === "error") && !s) return null;
	if (!s || !S) return /* @__PURE__ */ (0, U.jsx)("section", {
		"aria-label": "Metadata",
		style: R.sectionShell,
		children: /* @__PURE__ */ (0, U.jsx)(me, { message: "No metadata found." })
	});
	let j = {
		get sideItems() {
			return D(s.parties ? S.parties : []);
		},
		get partyItems() {
			let e = j.sideItems;
			return D([...e, ...Ne(s.indexes, [v.PARTY])]).slice(e.length);
		},
		get executionIndexes() {
			return D(S.execution?.indexes ?? []).sort((e, t) => String(e.aspect).localeCompare(String(t.aspect)));
		},
		get endorsements() {
			return D(S.endorsements);
		},
		get references() {
			return D(S.references);
		},
		get monetaryItems() {
			return D(S.monetarys);
		},
		get notary() {
			return D(S.notary);
		},
		get transactions() {
			return D(S.transactions);
		},
		get vitals() {
			return D(S.vitals);
		},
		get judgments() {
			return D(S.judgments);
		},
		get headingItems() {
			return Dn(s);
		},
		get pageItems() {
			return C ? [] : On(s);
		},
		get legalGroups() {
			return (s.legals?.groups || s.legals?.legalGroups || s.legals?.LegalGroups || s.legals?.items || []).filter((e) => Array.isArray(e.elements) && e.elements.length > 0);
		},
		get propertyItems() {
			return ie ? D(S.properties.filter((e) => !j.legalGroups.length || e.aspect !== "legal_description")) : [];
		},
		get legalCount() {
			return ae ? j.legalGroups.length : 0;
		},
		get hasMap() {
			return ae && vn(s.legals).length > 0 || ie && !!Me(j.propertyItems).property_address?.trim();
		},
		get secretItems() {
			return D((s.secrets || []).filter((e) => De(e.value) && !De(e.value).startsWith("xxx") && !De(e.value).includes("Not explicitly provided")));
		}
	}, ce = "Processing scope is unavailable for this session.", M = s.pages?.num_of_pages;
	if (i && M !== void 0) {
		let e = M === 1 ? "page" : "pages";
		ce = "all" in i ? `Processing scope for this session: all ${M} ${e}.` : `Processing scope for this session: ${i.last === 0 ? i.first === 1 ? "first page" : `first ${i.first} pages` : `first ${i.first} and last ${i.last === 1 ? "page" : `${i.last} pages`}`} — ${Math.min(M, i.first + i.last)} of ${M} ${e}.`;
	}
	let N = new Map([
		[v.PAGE, ce],
		[v.ACKNOWLEDGMENT, ne.has("ExecutionEnrichment") ? void 0 : "Acknowledgment verification was not selected for this session."],
		[v.PARTY, ne.has("PartyEnrichment") ? void 0 : "Party enrichment was not selected for this session."],
		[v.PROPERTY, ne.has("LegalEnrichment") ? void 0 : "Legal description enrichment was not selected for this session."]
	]);
	return /* @__PURE__ */ (0, U.jsx)(Ue.Provider, {
		delayDuration: 250,
		children: /* @__PURE__ */ (0, U.jsxs)("section", {
			"aria-label": "Metadata",
			style: R.root,
			children: [
				/* @__PURE__ */ (0, U.jsxs)("style", { children: [Re, Le] }),
				_ ? /* @__PURE__ */ (0, U.jsxs)("header", {
					"data-metadata-context": "true",
					style: R.header,
					children: [/* @__PURE__ */ (0, U.jsx)("h2", {
						style: R.title,
						children: L(s.heading?.class || "")
					}), /* @__PURE__ */ (0, U.jsx)("div", {
						style: R.statistics,
						children: e.headerActions
					})]
				}) : null,
				/* @__PURE__ */ (0, U.jsxs)("div", {
					"aria-label": "Metadata accordion",
					"data-panel-scroll": "true",
					role: "region",
					style: R.accordion,
					children: [
						E(v.PAGE) ? A(v.PAGE, "Pages", () => ({
							count: j.pageItems.length,
							children: C ? null : j.pageItems.length ? j.pageItems.map(({ page: n, recordable: r, isTitle: i }, a) => {
								let s = String(n.name || ""), u = String(n.code ?? s), d = String(n.class || "").trim().toLowerCase(), f = (Array.isArray(n.segments) ? n.segments : []).map((e) => String(e || "").toLowerCase()).filter((e) => En.has(e)), p = {
									code: u,
									explanation: n.explanation,
									label: r ? "Recordable" : "Attachment",
									page: s,
									page_number: s,
									segment: v.PAGE,
									source: f.map(L).join(", "),
									value: `${s} : ${i ? "Title" : L(d)} page`
								};
								return /* @__PURE__ */ (0, U.jsx)(Se, {
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
									session: b,
									busy: e.pendingChanges?.get(u)?.busy,
									pending: e.pendingChanges?.get(u)?.kind,
									recovery: e.pendingChanges?.get(u)?.actions,
									type: "page"
								}, `${u}-${a}`);
							}) : /* @__PURE__ */ (0, U.jsx)(me, { message: "No recordable pages found." })
						}), null) : null,
						E(v.TITLE) ? A(v.TITLE, "Titles", () => {
							let e = j.headingItems, n = e.map((e, n) => {
								let r = {
									item: e,
									metadata: s,
									pageError: !!C,
									callbacks: t,
									session: b,
									segment: v.TITLE
								};
								return /* @__PURE__ */ (0, U.jsx)(F, {
									title: "Title page",
									resetKey: s,
									fallback: () => /* @__PURE__ */ (0, U.jsx)(jn, {
										...r,
										pageError: !0
									}),
									children: /* @__PURE__ */ (0, U.jsx)(jn, { ...r })
								}, `${e.label}-${e.value}-${n}`);
							});
							return {
								count: e.length,
								children: n.length ? n : /* @__PURE__ */ (0, U.jsx)(me, { message: "No titles found." })
							};
						}, null) : null,
						E(v.ENDORSEMENT) ? A(v.ENDORSEMENT, "Endorsements", () => ({
							count: j.endorsements.length,
							children: k(j.endorsements, v.ENDORSEMENT, "No endorsements found.")
						})) : null,
						E(v.PARTY) ? A(v.PARTY, "Parties(Party Clause)", () => ({
							count: j.sideItems.length + j.partyItems.length,
							children: /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [s.parties ? k(j.sideItems, v.PARTY, j.partyItems.length ? void 0 : "No parties found.", "index", "sides") : null, k(j.partyItems, v.PARTY, s.parties ? void 0 : "No parties found.")] })
						})) : null,
						E(v.REFERENCE) ? A(v.REFERENCE, "References(Recital)", () => ({
							count: j.references.length,
							children: k(j.references, v.REFERENCE, "No references found.")
						})) : null,
						E(v.PROPERTY) || E(v.LEGAL) ? A(v.PROPERTY, "Property Info", () => ({
							count: j.propertyItems.length + j.legalCount,
							children: /* @__PURE__ */ (0, U.jsxs)("div", {
								className: "metadata-property",
								children: [
									j.propertyItems.length ? k(j.propertyItems, v.PROPERTY, "No property info found.") : null,
									j.legalCount > 0 ? /* @__PURE__ */ (0, U.jsx)(be, {
										items: j.legalGroups,
										page: (e) => e.page,
										hidePages: !0,
										children: (n, r) => {
											let i = String(n.code || ""), a = n.page || 0, o = !!(i && y?.code === i && (!y.segment || y.segment === v.LEGAL)), s = {
												code: i,
												page: a,
												segment: v.LEGAL,
												session: b,
												type: String(n.type || "legal"),
												value: L(n.type || ""),
												...n.original == null ? {} : { metadataIndex: {
													label: "legal",
													value: n.original,
													source: De(n.source),
													ambiguous: ""
												} }
											}, c = a && i ? t.onPageClick : void 0;
											return /* @__PURE__ */ (0, U.jsxs)("article", {
												className: "metadata-row",
												"data-active": o ? "true" : "false",
												"aria-disabled": e.pendingChanges?.has(i) ? "true" : void 0,
												"data-index-code": i || void 0,
												"data-index-segment": v.LEGAL,
												style: {
													...z.row(o),
													...z.indexRow
												},
												children: [
													/* @__PURE__ */ (0, U.jsxs)("div", {
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
															/* @__PURE__ */ (0, U.jsx)("span", {
																"aria-label": "OK",
																role: "img",
																title: "OK",
																style: z.statusIcon,
																children: /* @__PURE__ */ (0, U.jsx)(Te, {})
															}),
															/* @__PURE__ */ (0, U.jsx)("div", {
																inert: e.pendingChanges?.has(i),
																style: {
																	...z.aspects,
																	...z.body
																},
																children: "Legal Description"
															}),
															/* @__PURE__ */ (0, U.jsx)("div", {
																className: "metadata-row-value",
																inert: e.pendingChanges?.has(i),
																style: {
																	...z.valueWithViewer,
																	...z.indexValueWithViewer
																},
																children: /* @__PURE__ */ (0, U.jsx)(_e, {
																	plain: !0,
																	value: s.value,
																	onClick: c ? () => c(s) : void 0
																})
															})
														]
													}),
													(n.elements || []).map((t, n) => /* @__PURE__ */ (0, U.jsx)("div", {
														inert: e.pendingChanges?.has(i),
														style: R.legalElement,
														children: /* @__PURE__ */ (0, U.jsxs)("div", {
															style: z.content,
															children: [/* @__PURE__ */ (0, U.jsxs)("div", { children: [
																/* @__PURE__ */ (0, U.jsxs)("strong", { children: [L(t.aspect || ""), ":"] }),
																" ",
																De(t.value)
															] }), t.explanation ? /* @__PURE__ */ (0, U.jsx)("div", {
																style: R.muted,
																children: t.explanation
															}) : null]
														})
													}, `${t.aspect}-${n}`)),
													e.pendingChanges?.get(i)?.actions ? /* @__PURE__ */ (0, U.jsx)("div", {
														"aria-disabled": "false",
														style: z.recovery,
														children: e.pendingChanges.get(i)?.actions
													}) : null
												]
											}, `${i}-${r}`);
										}
									}) : null,
									!j.propertyItems.length && !j.legalCount ? /* @__PURE__ */ (0, U.jsx)(me, { message: "No property info found." }) : null
								]
							})
						})) : null,
						E(v.MONETARY) ? A(v.MONETARY, "Monetary", () => ({
							count: j.monetaryItems.length,
							children: k(j.monetaryItems, v.MONETARY, "No monetary info found.")
						})) : null,
						E(v.ACKNOWLEDGMENT) ? A(v.ACKNOWLEDGMENT, "Acknowledgment", () => ({
							count: j.notary.length + j.executionIndexes.length,
							children: /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [j.executionIndexes.length ? k(j.executionIndexes, Fe.EXECUTION, "No execution results found.") : null, j.notary.length || !j.executionIndexes.length ? k(j.notary, v.ACKNOWLEDGMENT, "No notary info found.") : null] })
						})) : null,
						E(v.TRANSACTION) ? A(v.TRANSACTION, "Transactional", () => ({
							count: j.transactions.length,
							children: k(j.transactions, v.TRANSACTION, "No transaction indexes found.")
						})) : null,
						E(v.VITAL) ? A(v.VITAL, "Vital", () => ({
							count: j.vitals.length,
							children: k(j.vitals, v.VITAL, "Vital information not found.")
						})) : null,
						E(v.JUDGMENT) ? A(v.JUDGMENT, "Judgment", () => ({
							count: j.judgments.filter((e) => !h.has(String(e.code || ""))).length,
							children: k(j.judgments, v.JUDGMENT, "No judgment indexes found.")
						})) : null,
						E(v.SECRETS) ? A(v.SECRETS, "Confidential", () => ({
							count: j.secretItems.length,
							children: k(j.secretItems, v.SECRETS, "No confidential info found.", "secret")
						})) : null,
						n
					]
				}),
				/* @__PURE__ */ (0, U.jsx)("footer", {
					"aria-label": "Metadata actions",
					"data-metadata-footer": "true",
					style: R.footerEmpty
				})
			]
		})
	});
}
function jn({ item: e, metadata: t, pageError: n, callbacks: r, session: i, segment: a }) {
	let o = n ? void 0 : On(t).find((e) => e.isTitle)?.page;
	return /* @__PURE__ */ (0, U.jsx)(Se, {
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
	});
}
//#endregion
//#region src/features/editindex/component/EditIndexPanel.tsx
function Mn({ apiGatewayUrl: e, authToken: t, batchCode: n, intervalMs: r, onQueueChange: i, formatError: a, retryIntervalMs: o, retryLimit: s, request: c, onClose: u, onError: d, onReadyChange: f, onResource: p, workerClient: h }) {
	let [_, v] = P({
		index: "",
		label: "",
		page: "",
		source: ""
	}), [y, b] = P([]), [te, x] = P(!1), { aspects: S, ready: C } = E(c, c.session, p, f, d), w = N(null);
	ce(() => {
		let e = w.current;
		e && (e.style.height = "auto", C && (e.style.height = `${e.getBoundingClientRect().height}px`));
	}, [C, c]);
	let T = M(() => h || g({
		apiBaseUrl: e,
		retryIntervalMs: o,
		retryLimit: s
	}), [
		e,
		o,
		s,
		h
	]), D = N(!1), [ne, re] = P(!1), O = M(() => {
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
	}, [c]), ie = y.map((e) => JSON.parse(e)[1]), ae = O.selected.map((e) => JSON.parse(e)[1]), oe = {
		action: "update",
		allow_enrichment: te,
		explanation: `P ${_.page.trim()}  ${_.source}`,
		new_index_value: _.index.trim() && _.index.trim() !== O.fields.index.trim() ? _.index : null,
		new_index_label: _.label.trim() && _.label.trim() !== O.fields.label.trim() ? _.label : null,
		new_index_aspect: ie.slice().sort().join(",") === ae.sort().join(",") ? null : ie.join(","),
		new_index_ambiguous: null,
		old_index_label: c.index.label ?? null,
		old_index_aspect: c.index.aspect ?? null,
		old_index_value: c.index.value ?? null
	}, se = oe.new_index_value !== null || oe.new_index_label !== null || oe.new_index_aspect !== null;
	A(() => {
		D.current = !1, re(!1), v(O.fields), b(O.selected), x(!1);
	}, [O]);
	async function k() {
		if (!(!se || !C || !y.length || !_.index.trim() || D.current)) {
			D.current = !0, re(!0);
			try {
				await l.getState().enqueue({
					batch: n,
					session: c.session,
					segment: c.segment,
					data: JSON.stringify([oe])
				}, {
					authToken: t,
					client: T,
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
				D.current = !1, re(!1);
			}
		}
	}
	return /* @__PURE__ */ (0, U.jsxs)("section", {
		"aria-label": "Edit index form",
		style: {
			...ke.root,
			flex: "1 1 auto",
			overflow: "hidden"
		},
		children: [/* @__PURE__ */ (0, U.jsxs)("div", {
			inert: ne,
			style: {
				...ke.fields,
				alignContent: "start",
				boxSizing: "border-box",
				flex: "1 1 auto",
				minHeight: 0,
				overflowY: "auto",
				padding: "0.35rem"
			},
			children: [/* @__PURE__ */ (0, U.jsx)("div", {
				ref: w,
				style: {
					...ke.fields,
					alignContent: "start",
					boxSizing: "border-box",
					minHeight: 0,
					overflowY: "auto",
					padding: "0.35rem"
				},
				children: /* @__PURE__ */ (0, U.jsx)(m, {
					value: _.index,
					aspects: S,
					segment: c.segment,
					selected: y,
					onChange: (e) => v({
						..._,
						index: e
					}),
					onSelect: b,
					allowEnrichment: te,
					onEnrichmentChange: x
				}, c.session)
			}), /* @__PURE__ */ (0, U.jsx)(ee, {
				fields: _,
				onChange: v
			})]
		}), /* @__PURE__ */ (0, U.jsx)("div", {
			style: ke.actions,
			children: /* @__PURE__ */ (0, U.jsx)(fe, {
				disabled: !se || ne || !C || !y.length || !_.index.trim(),
				label: "Update",
				onConfirm: () => void k(),
				style: ke.button,
				variant: "primary"
			})
		})]
	});
}
//#endregion
//#region src/features/indexing/component/IndexPlaceholder.tsx
function Nn({ attempt: e, retryLimit: t }) {
	return /* @__PURE__ */ (0, U.jsx)("section", {
		"aria-label": "Metadata",
		style: R.root,
		children: /* @__PURE__ */ (0, U.jsx)("div", {
			"data-panel-scroll": "true",
			style: R.accordion,
			children: /* @__PURE__ */ (0, U.jsxs)(ye, {
				label: "Loading metadata",
				children: [/* @__PURE__ */ (0, U.jsxs)("div", {
					style: Be.header(),
					children: [/* @__PURE__ */ (0, U.jsx)("span", {
						style: R.muted,
						children: "Loading metadata…"
					}), e > 1 ? /* @__PURE__ */ (0, U.jsxs)("span", {
						style: R.muted,
						children: [
							"Attempt ",
							e,
							" of ",
							t
						]
					}) : null]
				}), /* @__PURE__ */ (0, U.jsx)("div", {
					"aria-hidden": "true",
					children: [
						"65%",
						"45%",
						"55%"
					].map((e) => /* @__PURE__ */ (0, U.jsxs)("div", {
						style: Be.root,
						children: [/* @__PURE__ */ (0, U.jsxs)("div", {
							style: Be.header(),
							children: [/* @__PURE__ */ (0, U.jsx)("span", { style: {
								...B,
								width: "1.125rem",
								height: "1.125rem"
							} }), /* @__PURE__ */ (0, U.jsx)("span", { style: {
								...B,
								width: e
							} })]
						}), /* @__PURE__ */ (0, U.jsx)("div", {
							style: Be.content,
							children: [
								"90%",
								"70%",
								"80%"
							].map((e) => /* @__PURE__ */ (0, U.jsx)("span", { style: {
								...B,
								width: e
							} }, e))
						})]
					}, e))
				})]
			})
		})
	});
}
//#endregion
//#region src/features/indexing/component/IndexContainer.tsx
var Pn = /* @__PURE__ */ new Set();
function Fn(e) {
	let { callbacks: t, children: n, segments: r, session: i } = e, a = et(e), o = x((e) => e.tasks), s = new Map(o.filter((e) => e.session === i).flatMap((e) => e.changes.filter((e) => "code" in e).map((t) => [t.code, {
		kind: t.action === "drop" || t.patch?.action === "remove" ? "delete" : "update",
		busy: e.status !== "failed",
		actions: e.status === "failed" ? /* @__PURE__ */ (0, U.jsx)(Ye, {
			id: e.id,
			code: t.code
		}) : null
	}]))), c = new Map(o.filter((e) => e.session === i && e.changes.some((e) => "segment" in e)).map((e) => [e.segment, {
		busy: e.status !== "failed",
		actions: e.status === "failed" ? /* @__PURE__ */ (0, U.jsx)(Ye, { id: e.id }) : null,
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
	return /* @__PURE__ */ (0, U.jsx)("div", {
		style: R.rootShell,
		children: !a.metadata && (a.store.status === "idle" || a.store.status === "loading") ? /* @__PURE__ */ (0, U.jsx)(Nn, {
			attempt: a.retryAttempt,
			retryLimit: e.retryLimit
		}, i) : /* @__PURE__ */ (0, U.jsx)(An, {
			onAddIndex: (e, n) => {
				O.getState().open({ segment: e }), t.onAddIndex?.(n);
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
			confirmedCodes: Pn,
			removedCodes: Pn,
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
		})
	});
}
//#endregion
//#region src/features/legalmap/assets/survey-grid.svg?url
var In = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='48'%20height='48'%20viewBox='0%200%2048%2048'%3e%3cpath%20d='M0%20.5H48M.5%200V48'%20fill='none'%20stroke='%23d5dee2'%20stroke-opacity='0.65'%20stroke-width='1'%20stroke-dasharray='3%205'/%3e%3c/svg%3e", K = {
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
}, q = {
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
}, Ln = {
	backgroundColor: K.rowBg,
	backgroundImage: "repeating-linear-gradient(135deg, transparent 0, transparent 7px, rgba(58, 124, 140, 0.15) 7px, rgba(58, 124, 140, 0.15) 8px)"
}, Rn = `
.legal-map-view-tabs button[aria-selected="true"] { --icon-surface: var(--accent-surface); }
.legal-map-tabs button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.legal-map-detail-tabs button:focus-visible { outline-color: var(--primary-dark); outline-offset: -2px; }
.legal-map [role="tabpanel"]:focus-visible, .legal-map [role="region"]:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }
.legal-map details[open] > summary > svg { transform: rotate(180deg); }
.legal-map-column:empty { display: none; }
.legal-map-divider:hover, .legal-map-divider:focus-visible { border-color: var(--primary-dark); }
.legal-map-divider:focus-visible { outline: 2px solid var(--primary-dark); outline-offset: -2px; }
.legal-map-divider:hover span, .legal-map-divider:focus-visible span { background: var(--primary-dark); }
.survey-layout { display: flex; flex: 1 1 0; flex-direction: column; min-height: ${q.mapMin}rem; min-width: 0; }
.survey-layout:has([data-plat-scroll="true"]) { min-height: min-content; }
.legal-map-column { flex: 1 0 auto; }
.legal-map-column:has([data-plat-scroll="true"]) { flex: 1 1 0; }
.legal-map-table { flex: 0 0 auto; min-width: 0; }
@media (max-width: 40rem) { .legal-map-calls > caption { text-align: left; } }
.legal-map-table thead th { background: var(--white); position: sticky; top: 0; z-index: 1; }
.legal-map-acreage li + li { border-top: 1px solid var(--border-subtle); margin-top: 0.5rem; padding-top: 0.5rem; }
`, J = {
	shell: {
		alignItems: "stretch",
		boxSizing: "border-box",
		color: K.text,
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
		minHeight: `${q.mapMin}rem`,
		maxHeight: `${q.mapMax}rem`,
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
		minHeight: `${q.drawingMin}rem`,
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
		color: K.secondaryText,
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
		...Pe,
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
		height: `${q.detailsHeight}rem`,
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
		flex: `0 0 ${q.dividerHeight}px`,
		justifyContent: "center",
		minHeight: `${q.dividerHeight}px`,
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
		color: K.text,
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
		backgroundColor: K.mapBg,
		backgroundImage: `url("${In}")`,
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
		color: K.text,
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
		color: K.text,
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
		color: K.lotText,
		fontSize: q.lotBaseFontSize,
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
		gap: `${q.gridSize * 2}px`,
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
		width: `min(100%, ${q.platWidth}rem)`
	},
	subdivisionBoundary: {
		border: `2px dashed ${K.subdivisionBorder}`,
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
		...Ln,
		alignItems: "center",
		borderBottom: `1px solid ${K.subdivisionBorder}`,
		borderRadius: 0,
		borderTop: `1px solid ${K.subdivisionBorder}`,
		boxSizing: "border-box",
		color: K.text,
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
		background: K.gridLine,
		border: `1px solid ${K.gridLine}`,
		borderRadius: "2px",
		boxSizing: "border-box",
		display: "grid",
		gap: "1px",
		gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
		overflow: "hidden",
		width: "100%"
	},
	blockCaption: {
		color: K.blockText,
		fontSize: "1rem",
		fontWeight: 500
	},
	lotCaption: {
		color: K.lotText,
		fontSize: "1rem",
		fontWeight: 500
	},
	subdivisionLabel: {
		color: K.subdivisionColor,
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
		border: `1px solid ${K.gridLine}`,
		borderRadius: "var(--radius-control)",
		boxShadow: "var(--shadow-card)",
		color: K.text,
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
		color: K.text,
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
		color: K.text,
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
function zn(e) {
	return {
		background: e ? "transparent" : K.divisionBg,
		border: `2px solid ${K.divisionBorder}`,
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
var Bn = {
	color: K.divisionText,
	fontSize: "1rem",
	fontWeight: 600,
	textAlign: "left"
}, Vn = {
	alignItems: "center",
	background: K.blockBg,
	border: `1px solid ${K.blockBorder}`,
	boxSizing: "border-box",
	boxShadow: "none",
	color: K.blockText,
	display: "flex",
	flexDirection: "column",
	fontWeight: 700,
	gridColumn: "2 / 4",
	gridRow: "2 / 4",
	justifyContent: "center",
	textAlign: "center"
}, Hn = {
	fontSize: `${q.blockBaseFontSize}px`,
	maxWidth: "100%",
	overflowWrap: "anywhere",
	textAlign: "center"
};
function Un(e, t, n) {
	return {
		alignItems: "center",
		aspectRatio: "1",
		minWidth: 0,
		minHeight: 0,
		background: e ? K.blockBg : K.lotBg,
		border: `1px solid ${e ? K.blockBorder : K.lotBorder}`,
		borderRadius: e ? 0 : "2px",
		boxSizing: "border-box",
		color: e ? K.secondaryText : K.lotText,
		display: "flex",
		flexDirection: "column",
		fontSize: `${q.lotBaseFontSize}px`,
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
function Wn(e, t) {
	return {
		...J.legendBox,
		background: e,
		border: `1px solid ${t}`,
		borderStyle: e === "transparent" ? "dashed" : "solid"
	};
}
var Y = {
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
		borderTop: `3px solid ${K.parcelLine}`
	},
	unconfirmedLine: {
		width: "2.5rem",
		flexShrink: 0,
		borderTop: `3px dashed ${K.unconfirmed}`
	},
	tieLegendLine: {
		width: "2.5rem",
		flexShrink: 0,
		borderTop: `1px dotted ${K.secondaryText}`,
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
		background: J.infoCard.background,
		borderCollapse: "collapse",
		fontSize: J.lotCaption.fontSize,
		tableLayout: "fixed",
		textAlign: "left",
		width: "100%"
	},
	cell: {
		borderBottom: `1px solid ${K.gridLine}`,
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
};
//#endregion
//#region src/features/legalmap/component/MapSurface.tsx
function Gn({ title: e, issue: t, compact: n = !1 }) {
	return /* @__PURE__ */ (0, U.jsx)("section", {
		role: "note",
		"aria-label": e,
		className: n ? "legal-map-notice" : "legal-map-incomplete",
		style: n ? J.notice : J.unavailable,
		children: /* @__PURE__ */ (0, U.jsxs)("div", {
			style: J.messageContent,
			children: [n ? null : /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [/* @__PURE__ */ (0, U.jsx)("h3", {
				style: J.messageTitle,
				children: "Map preview unavailable"
			}), /* @__PURE__ */ (0, U.jsx)("p", {
				style: J.messageText,
				children: "The extracted description does not contain enough information to draw this property."
			})] }), /* @__PURE__ */ (0, U.jsxs)("details", {
				style: {
					...J.messageDetails,
					...n ? { marginTop: 0 } : {}
				},
				children: [/* @__PURE__ */ (0, U.jsxs)("summary", {
					style: {
						...J.messageSummary,
						...n ? {
							color: "inherit",
							textDecoration: "none"
						} : {}
					},
					children: [/* @__PURE__ */ (0, U.jsx)("span", { children: n ? "Map preview is incomplete." : "Details" }), /* @__PURE__ */ (0, U.jsx)(ge, { name: "expand" })]
				}), /* @__PURE__ */ (0, U.jsx)("p", {
					style: J.messageReason,
					children: t
				})]
			})]
		})
	});
}
function Kn({ children: e, footer: t, style: n, drawingStyle: r, showNorth: i = !0, issues: a = [] }) {
	return /* @__PURE__ */ (0, U.jsxs)("div", {
		"data-legal-map-surface": "true",
		style: {
			...J.mapSurface,
			...n
		},
		children: [
			e && a.length > 0 ? /* @__PURE__ */ (0, U.jsx)("div", {
				style: J.surfaceNotices,
				children: a.map((e, t) => /* @__PURE__ */ (0, U.jsx)(Gn, {
					...e,
					compact: !0
				}, t))
			}) : null,
			/* @__PURE__ */ (0, U.jsx)("div", {
				"data-legal-map-drawing": "true",
				style: {
					...J.mapDrawing,
					...r
				},
				children: e || /* @__PURE__ */ (0, U.jsx)("div", {
					style: J.surfaceMessages,
					children: a.map((e, t) => /* @__PURE__ */ (0, U.jsx)(Gn, { ...e }, t))
				})
			}),
			i || t ? /* @__PURE__ */ (0, U.jsxs)("div", {
				"data-legal-map-footer": "true",
				style: J.mapFooter,
				children: [i ? /* @__PURE__ */ (0, U.jsxs)("div", {
					"data-legal-map-north": "true",
					"aria-hidden": "true",
					style: J.northMarker,
					children: [/* @__PURE__ */ (0, U.jsx)("svg", {
						width: "16",
						height: "20",
						viewBox: "0 0 24 28",
						fill: "currentColor",
						children: /* @__PURE__ */ (0, U.jsx)("path", { d: "M12 1 3 24l9-5 9 5z" })
					}), /* @__PURE__ */ (0, U.jsx)("span", { children: "N" })]
				}) : null, t ? /* @__PURE__ */ (0, U.jsx)("div", {
					style: J.legendFrame,
					children: t
				}) : null]
			}) : null
		]
	});
}
//#endregion
//#region src/features/legalmap/component/MetesMap.tsx
var X = 2;
function qn({ scenes: e }) {
	let t = N(null), [n, r] = P(1), [i, a] = P(null), o = e.flatMap((e) => e.items), s = [{
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
	})], c = Math.min(...s.map((e) => e.x)), l = Math.max(...s.map((e) => e.x)), u = Math.min(...s.map((e) => e.y)), d = Math.max(...s.map((e) => e.y)), f = Math.max(l - c, +(d === u)), p = Math.max(d - u, +(l === c)), m = f / q.parcelScale + q.labelInset * 2 / n, h = p / q.parcelScale + q.labelInset * 2 / n, g = {
		x: (c + l - m) / 2,
		y: (u + d - h) / 2,
		width: m,
		height: h
	}, _ = q.lotBaseFontSize / n;
	return ce(() => {
		let e = t.current, n = () => {
			let { width: t, height: n } = e.getBoundingClientRect();
			if (t === 0 || n === 0) return;
			r(Math.min((t - q.labelInset * 2) / f, (n - q.labelInset * 2) / p) * q.parcelScale);
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
					for (let e = t.top + X; e + s.height <= t.bottom - X; e += s.height + X * 2) for (let n = t.left + X; n + s.width <= t.right - X; n += s.width + X * 2) c.push({
						x: n,
						y: e
					});
					c.sort((e, t) => Math.hypot(e.x - s.left, e.y - s.top) - Math.hypot(t.x - s.left, t.y - s.top));
					let l = c.find(({ x: e, y: n }) => e >= t.left && n >= t.top && e + s.width <= t.right && n + s.height <= t.bottom && !r.some((t) => e < t.right + X && e + s.width > t.left - X && n < t.bottom + X && n + s.height > t.top - X) && !o.some(({ from: t, to: r }) => {
						let i = e - X, a = e + s.width + X, o = n - X, c = n + s.height + X, l = r.x - t.x, u = r.y - t.y;
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
	]), /* @__PURE__ */ (0, U.jsx)(Kn, {
		issues: e.filter((e) => e.issue).map((e) => ({
			title: e.title,
			issue: e.issue
		})),
		style: Y.viewport,
		footer: /* @__PURE__ */ (0, U.jsxs)("div", {
			"aria-label": "Map legend",
			className: "legal-map-legend",
			style: J.legendItems,
			children: [
				/* @__PURE__ */ (0, U.jsxs)("span", {
					style: J.legendItem,
					children: [/* @__PURE__ */ (0, U.jsx)("span", { style: Y.legendLine }), /* @__PURE__ */ (0, U.jsx)("span", { children: "Parcel boundary" })]
				}),
				o.some((e) => !e.confirmed) ? /* @__PURE__ */ (0, U.jsxs)("span", {
					style: J.legendItem,
					children: [/* @__PURE__ */ (0, U.jsx)("span", { style: Y.unconfirmedLine }), /* @__PURE__ */ (0, U.jsx)("span", { children: "Unconfirmed" })]
				}) : null,
				e.some((e) => e.beginning !== void 0 && e.beginning > 0) ? /* @__PURE__ */ (0, U.jsxs)("span", {
					style: J.legendItem,
					children: [/* @__PURE__ */ (0, U.jsx)("span", { style: Y.tieLegendLine }), /* @__PURE__ */ (0, U.jsx)("span", { children: "Tie line" })]
				}) : null
			]
		}),
		children: /* @__PURE__ */ (0, U.jsx)("svg", {
			ref: t,
			role: "img",
			"aria-label": e[0].title + " schematic",
			viewBox: [
				g.x,
				g.y,
				g.width,
				g.height
			].join(" "),
			style: Y.drawing,
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
				return /* @__PURE__ */ (0, U.jsxs)("g", {
					"data-survey-group": t + 1,
					children: [
						r.length > 0 ? /* @__PURE__ */ (0, U.jsx)("line", {
							"data-survey-reference": "true",
							x1: r[0].from.x,
							y1: g.y,
							x2: r[0].from.x,
							y2: g.y + g.height,
							stroke: K.secondaryText,
							strokeWidth: "1",
							strokeDasharray: "6 4",
							vectorEffect: "non-scaling-stroke"
						}) : null,
						s ? /* @__PURE__ */ (0, U.jsx)("path", {
							"data-boundary-fill": "true",
							d: "M " + s.x + " " + s.y + " " + o.map((e) => "L " + e.to.x + " " + e.to.y).join(" ") + " Z",
							fill: K.parcelFill,
							fillOpacity: e.schematic ? "0.12" : "0.25"
						}) : null,
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
								stroke: r ? K.secondaryText : e.confirmed ? K.parcelLine : K.unconfirmed,
								strokeWidth: r ? 1 : 3,
								strokeDasharray: r ? "1 5" : e.confirmed ? void 0 : "6 4",
								strokeLinecap: r ? "round" : void 0,
								strokeOpacity: r ? .25 : void 0,
								vectorEffect: "non-scaling-stroke"
							};
							return /* @__PURE__ */ (0, U.jsxs)("g", { children: [
								/* @__PURE__ */ (0, U.jsx)("title", { children: e.detail }),
								e.arc ? /* @__PURE__ */ (0, U.jsx)("path", {
									...c,
									"data-survey-arc": "true",
									d: `M ${e.from.x} ${e.from.y} A ${e.arc.radius} ${e.arc.radius} 0 ${+(e.arc.sweep > Math.PI)} ${+(e.arc.turn === 1)} ${e.to.x} ${e.to.y}`,
									fill: "none"
								}) : /* @__PURE__ */ (0, U.jsx)("line", {
									...c,
									x1: e.from.x,
									y1: e.from.y,
									x2: e.to.x,
									y2: e.to.y
								}),
								/* @__PURE__ */ (0, U.jsx)("path", {
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
								})
							] }, t);
						}),
						c.map(({ point: e, number: o }, s) => {
							let c = s === 0 && i !== void 0 && i > 0 && r.some((t) => t.sequence === i && e.x > t.to.x);
							return /* @__PURE__ */ (0, U.jsxs)("g", { children: [
								/* @__PURE__ */ (0, U.jsx)("line", {
									"data-survey-leader": o,
									x1: e.x,
									y1: e.y,
									x2: e.x,
									y2: e.y,
									stroke: K.secondaryText,
									strokeWidth: "1",
									vectorEffect: "non-scaling-stroke",
									style: {
										visibility: "hidden",
										pointerEvents: "none"
									}
								}),
								/* @__PURE__ */ (0, U.jsx)("circle", {
									"data-survey-point": o,
									cx: e.x,
									cy: e.y,
									r: 2.5 / n,
									fill: K.parcelLine,
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
								}),
								/* @__PURE__ */ (0, U.jsx)("text", {
									"data-survey-vertex": o,
									x: e.x + _ / 2,
									y: e.y - _ / 2,
									fontSize: _,
									fill: K.text,
									children: o
								}),
								i !== void 0 && (o === i + 1 || s === 0 && i > 0) ? /* @__PURE__ */ (0, U.jsx)("text", {
									"data-survey-label": "true",
									x: e.x + (c ? 1 : -1) * _ * .75,
									y: e.y + _ / 3,
									fontSize: _,
									textAnchor: c ? "start" : "end",
									fill: K.parcelLine,
									children: o === i + 1 ? "POB" : "POC"
								}) : null
							] }, s);
						})
					]
				}, t);
			})
		})
	});
}
//#endregion
//#region src/features/legalmap/component/PlssMap.tsx
function Jn({ scenes: e }) {
	let t = j(), n = N(null), [r, i] = P(1), [a, o] = P(q.lotBaseFontSize), s = e.flatMap((e) => e.items), c = /* @__PURE__ */ new Map();
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
	}, v = a / r, y = [...new Set(e.flatMap((e) => e.notes).filter((e) => e.label === "Township" || e.label === "Range").map((e) => e.label + " " + tt(e.value, e.label === "Township" ? "town(?:ship)?" : "range").replace(/\b(NORTH|SOUTH|EAST|WEST)\b/gi, (e) => e[0].toUpperCase() + e.slice(1).toLowerCase())))].join(" · ");
	return ce(() => {
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
	]), /* @__PURE__ */ (0, U.jsx)(Kn, {
		issues: e.filter((e) => e.issue).map((e) => ({
			title: e.title,
			issue: e.issue
		})),
		style: Y.viewport,
		footer: /* @__PURE__ */ (0, U.jsxs)("div", {
			style: J.plssFooter,
			children: [y ? /* @__PURE__ */ (0, U.jsx)("p", {
				id: t + "-context",
				"data-survey-context": "true",
				style: J.plssContext,
				children: y
			}) : null, /* @__PURE__ */ (0, U.jsxs)("div", {
				"aria-label": "Map legend",
				className: "legal-map-legend",
				style: J.legendItems,
				children: [/* @__PURE__ */ (0, U.jsxs)("span", {
					style: J.legendItem,
					children: [/* @__PURE__ */ (0, U.jsx)("span", { style: Wn("#b6e3f5", K.parcelLine) }), /* @__PURE__ */ (0, U.jsx)("span", {
						style: J.legendLabel,
						children: s.some((e) => e.role === "area" && e.partial) ? "Partial area" : "Described area"
					})]
				}), /* @__PURE__ */ (0, U.jsxs)("span", {
					style: J.legendItem,
					children: [/* @__PURE__ */ (0, U.jsx)("span", { style: Wn(K.divisionBg, K.blockBorder) }), /* @__PURE__ */ (0, U.jsx)("span", {
						style: J.legendLabel,
						children: "Section"
					})]
				})]
			})]
		}),
		children: /* @__PURE__ */ (0, U.jsxs)("svg", {
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
			style: Y.drawing,
			children: [
				/* @__PURE__ */ (0, U.jsx)("defs", { children: /* @__PURE__ */ (0, U.jsxs)("pattern", {
					id: t + "-partial",
					width: v,
					height: v,
					patternUnits: "userSpaceOnUse",
					patternTransform: "rotate(45)",
					children: [/* @__PURE__ */ (0, U.jsx)("rect", {
						width: v,
						height: v,
						fill: "#cdebf5"
					}), /* @__PURE__ */ (0, U.jsx)("line", {
						x1: "0",
						y1: "0",
						x2: "0",
						y2: v,
						stroke: "#369ac2",
						strokeWidth: v / 6,
						opacity: "0.45"
					})]
				}) }),
				[...c.values()].map((e) => /* @__PURE__ */ (0, U.jsxs)("g", { children: [/* @__PURE__ */ (0, U.jsx)("rect", {
					"data-survey-section-area": e.label,
					x: e.x,
					y: e.y,
					width: e.width,
					height: e.height,
					fill: K.divisionBg,
					stroke: K.blockBorder,
					strokeWidth: "1.5",
					vectorEffect: "non-scaling-stroke"
				}), /* @__PURE__ */ (0, U.jsx)("path", {
					"data-plss-quarter-guide": "true",
					d: `M ${e.x + e.width / 2} ${e.y} v ${e.height} M ${e.x} ${e.y + e.height / 2} h ${e.width}`,
					fill: "none",
					stroke: K.blockBorder,
					strokeWidth: "1",
					strokeDasharray: "4 4",
					vectorEffect: "non-scaling-stroke"
				})] }, `${e.x}:${e.y}:${e.label}`)),
				e.map((e, n) => /* @__PURE__ */ (0, U.jsx)("g", {
					"data-survey-group": n + 1,
					children: e.items.map((e, n) => {
						if (e.role === "section") return null;
						let i = Math.min(v, (e.width - 8 / r) / 4, (e.height - 8 / r) / 3), a = e.caption ? Math.min(i * q.amp, (e.width - 8 / r) / e.caption.length) : i;
						return /* @__PURE__ */ (0, U.jsxs)("g", { children: [
							/* @__PURE__ */ (0, U.jsx)("title", { children: e.detail }),
							/* @__PURE__ */ (0, U.jsx)("rect", {
								"data-survey-area": e.role === "area" ? "true" : void 0,
								"data-survey-partial": e.partial ? "true" : void 0,
								x: e.x,
								y: e.y,
								width: e.width,
								height: e.height,
								fill: e.role === "area" ? e.partial ? "url(#" + t + "-partial)" : "#b6e3f5" : "none",
								fillOpacity: e.role === "area" ? .8 : .35,
								stroke: e.role === "area" ? K.parcelLine : "#8c999b",
								strokeDasharray: e.role === "area" && !e.partial ? void 0 : "4 3",
								strokeWidth: e.role === "area" ? 3 : 1,
								vectorEffect: "non-scaling-stroke"
							}),
							e.role === "area" && Math.min(i, a) * r >= 12 ? /* @__PURE__ */ (0, U.jsxs)("text", {
								x: e.x + e.width / 2,
								y: e.y + e.height / 2,
								textAnchor: "middle",
								fontSize: i * q.amp,
								fill: K.text,
								pointerEvents: "none",
								children: [e.caption ? /* @__PURE__ */ (0, U.jsx)("tspan", {
									x: e.x + e.width / 2,
									dy: "-0.3em",
									fontSize: a,
									children: e.caption
								}) : null, /* @__PURE__ */ (0, U.jsx)("tspan", {
									x: e.x + e.width / 2,
									dy: "1.2em",
									fontSize: i,
									fontWeight: J.lotCaption.fontWeight,
									children: e.partial ? "Partial area" : "Described area"
								})]
							}) : null
						] }, n);
					})
				}, n)),
				[...c.values()].map((e) => /* @__PURE__ */ (0, U.jsx)("g", { children: /* @__PURE__ */ (0, U.jsx)("text", {
					"data-survey-section": e.label,
					x: e.x + e.width / 2,
					y: e.y + e.height * .12 + 2 / r,
					dominantBaseline: "hanging",
					textAnchor: "middle",
					fontSize: Math.min(v * q.amp, e.height / 4),
					fontWeight: Vn.fontWeight,
					fill: K.text,
					children: e.label === "Section" ? e.label : `Section ${e.label}`
				}) }, `${e.x}:${e.y}:${e.label}`))
			]
		})
	});
}
//#endregion
//#region src/features/legalmap/hook/usePlatFit.ts
function Yn(e) {
	let t = N(null), n = N(null);
	return ce(() => {
		let e = t.current, r = n.current;
		if (!e || !r) return;
		let i = e.parentElement, a = () => {
			let t = e.clientWidth, n = e.clientHeight;
			if (t === 0 || n === 0) return;
			let a = q.platWidth * Number.parseFloat(getComputedStyle(document.documentElement).fontSize), o = t < a;
			if (e.dataset.platScroll = String(o), e.tabIndex = o ? 0 : -1, e.style.flex = o ? "0 0 auto" : "1 1 0", e.style.overflowX = o ? "auto" : "hidden", e.style.overflowY = "hidden", r.style.width = `${o ? a : t}px`, r.style.position = o ? "relative" : "absolute", r.style.left = o ? "0" : "50%", r.style.top = o ? "0" : "50%", o) {
				r.style.transform = "none", e.style.minHeight = `${r.offsetHeight}px`, i.style.minHeight = `${r.offsetHeight}px`;
				return;
			}
			e.style.minHeight = "0", i.style.minHeight = `${q.drawingMin}rem`, e.scrollLeft = 0;
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
var Xn = [
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
], Zn = [
	[2, 2],
	[2, 3],
	[3, 2],
	[3, 3]
];
function Qn({ lot: e, gridColumn: t, gridRow: n }) {
	let r = !e || !e.filled;
	return /* @__PURE__ */ (0, U.jsx)("span", {
		"data-legal-map-lot": r ? void 0 : "true",
		"data-legal-map-empty": e && r ? "true" : void 0,
		title: e && !r ? e.detail : void 0,
		"data-lot-slot": r ? void 0 : `${n}-${t}`,
		style: Un(r, t, n),
		children: e && !r ? /* @__PURE__ */ (0, U.jsxs)("span", {
			"data-map-label": "true",
			style: J.cellLabel,
			children: [/* @__PURE__ */ (0, U.jsx)("span", { children: tt(e.name, e.kind) }), /* @__PURE__ */ (0, U.jsx)("span", {
				style: J.lotCaption,
				children: e.detail ?? `${pt[e.kind]}${e.name.includes("–") ? "s" : ""}`
			})]
		}) : null
	});
}
function $n({ block: e }) {
	let t = N(null), [n, r] = P([]), i = dt.flatMap((t) => {
		let n = t === "block" ? e.name : e[t];
		return n ? [{
			kind: t,
			value: n
		}] : [];
	}), a = _t(e.lots), o = a.flatMap((e, t) => e.acreage?.map((e) => ({
		value: e,
		slot: Xn[t].join("-")
	})) ?? []);
	return ce(() => {
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
	}, [e]), /* @__PURE__ */ (0, U.jsxs)("div", {
		ref: t,
		style: o.length > 0 ? J.annotatedBlock : void 0,
		children: [o.length > 0 ? /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [/* @__PURE__ */ (0, U.jsx)("div", {
			style: J.acreageLabels,
			children: o.map(({ value: e, slot: t }, n) => /* @__PURE__ */ (0, U.jsx)("span", {
				"data-lot-acreage": "true",
				"data-acreage-slot": t,
				style: J.lotAcreage,
				children: e
			}, n))
		}), /* @__PURE__ */ (0, U.jsx)("svg", {
			"aria-hidden": "true",
			style: J.acreageLeaders,
			children: o.map((e, t) => /* @__PURE__ */ (0, U.jsxs)("g", { children: [/* @__PURE__ */ (0, U.jsx)("polyline", {
				"data-acreage-leader": "true",
				points: n[t]?.points,
				fill: "none",
				stroke: K.lotBorder,
				strokeWidth: "1",
				vectorEffect: "non-scaling-stroke"
			}), n[t] ? /* @__PURE__ */ (0, U.jsx)("circle", {
				"data-acreage-point": "true",
				cx: n[t].x,
				cy: n[t].y,
				r: "2.5",
				fill: K.lotBorder
			}) : null] }, t))
		})] }) : null, /* @__PURE__ */ (0, U.jsxs)("div", {
			"data-legal-map-block": "true",
			style: J.blockGrid,
			children: [i.length > 0 ? /* @__PURE__ */ (0, U.jsx)("div", {
				style: Vn,
				children: /* @__PURE__ */ (0, U.jsx)("div", {
					"data-map-label": "true",
					style: J.cellLabel,
					children: i.map((e) => /* @__PURE__ */ (0, U.jsxs)(oe, { children: [/* @__PURE__ */ (0, U.jsx)("div", {
						"data-legal-map-block-label": e.kind === "block" ? "true" : void 0,
						"data-legal-map-tract-label": e.kind === "tract" ? "true" : void 0,
						"data-legal-map-building-label": e.kind === "building" ? "true" : void 0,
						style: Hn,
						children: tt(e.value, e.kind)
					}), /* @__PURE__ */ (0, U.jsx)("span", {
						style: J.blockCaption,
						children: L(e.kind)
					})] }, e.kind))
				})
			}) : null, [...Xn, ...i.length === 0 ? Zn : []].map(([e, t], n) => /* @__PURE__ */ (0, U.jsx)(Qn, {
				lot: a[n] ?? null,
				gridColumn: String(t),
				gridRow: e
			}, n))]
		})]
	});
}
function er({ division: e }) {
	let t = ut.filter((t) => !it(e[t]));
	return /* @__PURE__ */ (0, U.jsxs)("div", {
		"data-legal-map-division": "true",
		style: zn(t.length === 0),
		children: [t.length > 0 ? /* @__PURE__ */ (0, U.jsx)("div", {
			style: J.divisionLabels,
			children: t.map((t) => /* @__PURE__ */ (0, U.jsx)("div", {
				style: Bn,
				children: `${L(t)} ${tt(e[t], t)}`
			}, t))
		}) : null, /* @__PURE__ */ (0, U.jsx)("div", {
			style: J.divisionBlocks,
			children: e.blocks.map((e, t) => /* @__PURE__ */ (0, U.jsx)($n, { block: e }, `${e.name}-${t}`))
		})]
	});
}
function tr({ presentLayers: e }) {
	let t = [
		...lt.map((e) => ({
			key: e,
			name: L(e),
			color: "transparent",
			borderColor: K.subdivisionBorder
		})),
		{
			key: "right_of_way",
			name: "Right Of Way",
			color: K.rowBg,
			borderColor: K.subdivisionBorder
		},
		...ut.map((e) => ({
			key: e,
			name: L(e),
			color: K.divisionBg,
			borderColor: K.divisionBorder
		})),
		...dt.map((e) => ({
			key: e,
			name: L(e),
			color: K.blockBg,
			borderColor: K.blockBorder
		})),
		...ft.map((e) => ({
			key: e,
			name: pt[e],
			color: K.lotBg,
			borderColor: K.lotBorder
		}))
	].filter((t) => e.has(t.key));
	return t.length === 0 ? null : /* @__PURE__ */ (0, U.jsx)("div", {
		className: "legal-map-legend",
		style: J.legendItems,
		children: t.map((e) => /* @__PURE__ */ (0, U.jsxs)("span", {
			style: J.legendItem,
			children: [/* @__PURE__ */ (0, U.jsx)("span", { style: {
				...Wn(e.color, e.borderColor),
				...e.key === "right_of_way" ? Ln : {}
			} }), /* @__PURE__ */ (0, U.jsx)("span", {
				style: J.legendLabel,
				children: e.name
			})]
		}, e.key))
	});
}
function nr({ view: e, issues: t, title: n }) {
	let r = Yn(e);
	return /* @__PURE__ */ (0, U.jsx)(Kn, {
		showNorth: !e.isEmptyStructure,
		issues: t.map((e) => ({
			title: n,
			issue: e
		})),
		footer: e.isEmptyStructure ? void 0 : /* @__PURE__ */ (0, U.jsx)(tr, { presentLayers: e.presentLayers }),
		children: e.isEmptyStructure ? null : /* @__PURE__ */ (0, U.jsx)("div", {
			ref: r.viewportRef,
			"data-legal-map-fit": "true",
			role: "region",
			"aria-label": `${n} drawing`,
			tabIndex: -1,
			style: J.fitViewport,
			children: /* @__PURE__ */ (0, U.jsxs)("div", {
				ref: r.contentRef,
				"data-legal-map-grid": "true",
				style: J.grid,
				children: [/* @__PURE__ */ (0, U.jsx)("div", {
					style: J.gridContent,
					children: e.subdivisions.map((e, t) => /* @__PURE__ */ (0, U.jsxs)("div", {
						style: J.subdivisionWrapper,
						children: [lt.filter((t) => !it(e[t])).map((t) => /* @__PURE__ */ (0, U.jsx)("div", {
							"data-legal-map-heading": t,
							style: J.subdivisionLabel,
							children: e[t]
						}, t)), /* @__PURE__ */ (0, U.jsx)("div", {
							"data-legal-map-subdivision": "true",
							style: J.subdivisionBoundary,
							children: /* @__PURE__ */ (0, U.jsxs)("div", {
								style: {
									...J.subdivisionContent,
									...e.rightsOfWay.length > 0 ? J.rowContent : {}
								},
								children: [e.divisions.map((e, t) => /* @__PURE__ */ (0, U.jsx)(er, { division: e }, t)), e.rightsOfWay.map((t, n) => /* @__PURE__ */ (0, U.jsx)("div", {
									"data-legal-map-row": "true",
									style: {
										...J.rowBand,
										top: `${(n + 1) * 100 / (e.rightsOfWay.length + 1)}%`
									},
									children: t
								}, t))]
							})
						})]
					}, `${e.subdivision}-${t}`))
				}), e.locationLabel ? /* @__PURE__ */ (0, U.jsx)("div", {
					"data-legal-map-location": "true",
					style: J.location,
					children: e.locationLabel
				}) : null]
			})
		})
	});
}
//#endregion
//#region src/features/legalmap/component/MetesDetails.tsx
function rr({ scenes: e, active: t, showParcels: n }) {
	return /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [
		t === "Boundary Calls" ? e.map((e, t) => /* @__PURE__ */ (0, U.jsx)(ir, {
			scene: e,
			showTitle: n
		}, t)) : null,
		t === "Acreage" ? /* @__PURE__ */ (0, U.jsx)("section", {
			className: "legal-map-acreage",
			style: J.infoSection,
			children: e.map((e, t) => {
				let r = e.notes.find((e) => e.label === "Acreage")?.value;
				return r || e.calculatedAcres !== void 0 ? /* @__PURE__ */ (0, U.jsxs)("div", {
					"aria-label": n ? `${e.title} acreage` : "Reported acreage",
					style: J.infoCard,
					children: [
						n ? /* @__PURE__ */ (0, U.jsx)("h4", {
							style: J.infoTitle,
							children: e.title
						}) : null,
						r ? /* @__PURE__ */ (0, U.jsx)("ul", {
							style: J.acreageList,
							children: r.split(";").map((e, t) => /* @__PURE__ */ (0, U.jsx)("li", { children: t === 0 ? /* @__PURE__ */ (0, U.jsxs)("strong", {
								style: J.acreageFirst,
								children: [/* @__PURE__ */ (0, U.jsx)("svg", {
									"data-survey-swatch": "true",
									"aria-hidden": "true",
									width: "12",
									height: "12",
									viewBox: "0 0 12 12",
									style: J.acreageSwatch,
									children: /* @__PURE__ */ (0, U.jsx)("rect", {
										x: "0.5",
										y: "0.5",
										width: "11",
										height: "11",
										fill: K.parcelFill,
										fillOpacity: "0.25",
										stroke: K.parcelLine
									})
								}), e.trim()]
							}) : e.trim() }, t))
						}) : null,
						e.calculatedAcres === void 0 ? null : /* @__PURE__ */ (0, U.jsxs)("p", {
							style: J.infoNote,
							children: [
								e.completion === "synthetic" ? "Illustrated area" : "Calculated area",
								": ",
								e.calculatedAcres.toFixed(4),
								" acres."
							]
						}),
						e.closureMetres === void 0 ? null : /* @__PURE__ */ (0, U.jsxs)("p", {
							style: J.infoNote,
							children: [
								"Measured misclosure: ",
								e.closureMetres.toFixed(4),
								" m",
								e.completion === "partial" ? " before completion" : "",
								"."
							]
						})
					]
				}, t) : null;
			})
		}) : null,
		t === "Easement" ? /* @__PURE__ */ (0, U.jsx)("section", {
			className: "legal-map-easement",
			style: J.infoSection,
			children: e.map((e, t) => {
				let r = e.notes.filter((e) => e.label === "Easement");
				return r.length > 0 ? /* @__PURE__ */ (0, U.jsxs)("div", {
					"aria-label": n ? `${e.title} easement details` : "Easement details",
					style: {
						...J.infoCard,
						...J.infoSection
					},
					children: [
						n ? /* @__PURE__ */ (0, U.jsx)("h4", {
							style: J.infoTitle,
							children: e.title
						}) : null,
						r.map((e, t) => /* @__PURE__ */ (0, U.jsxs)("div", { children: [/* @__PURE__ */ (0, U.jsx)("div", { children: e.value }), e.explanation ? /* @__PURE__ */ (0, U.jsx)("p", {
							style: J.infoNote,
							children: e.explanation
						}) : null] }, t)),
						/* @__PURE__ */ (0, U.jsx)("p", {
							style: J.infoNote,
							children: "Location not specified in this clause — not plotted."
						})
					]
				}, t) : null;
			})
		}) : null
	] });
}
function ir({ scene: e, showTitle: t }) {
	let n = e.notes.filter((e) => e.label === "Bearings" || e.label === "Distances");
	return !e.courses.length && n.length === 0 ? null : e.courses.length ? /* @__PURE__ */ (0, U.jsx)(Ue.Provider, {
		delayDuration: 250,
		children: /* @__PURE__ */ (0, U.jsxs)("table", {
			"aria-label": "Boundary Calls",
			className: "legal-map-table legal-map-calls",
			style: {
				...Y.notes,
				minWidth: "30rem"
			},
			children: [
				t ? /* @__PURE__ */ (0, U.jsx)("caption", {
					style: J.infoTitle,
					children: e.title
				}) : null,
				/* @__PURE__ */ (0, U.jsxs)("colgroup", { children: [
					/* @__PURE__ */ (0, U.jsx)("col", { style: { width: "2rem" } }),
					/* @__PURE__ */ (0, U.jsx)("col", { style: { width: "8rem" } }),
					/* @__PURE__ */ (0, U.jsx)("col", {}),
					/* @__PURE__ */ (0, U.jsx)("col", { style: { width: "7rem" } }),
					/* @__PURE__ */ (0, U.jsx)("col", { style: { width: "7rem" } })
				] }),
				/* @__PURE__ */ (0, U.jsx)("thead", { children: /* @__PURE__ */ (0, U.jsx)("tr", { children: [
					"#",
					"Boundary",
					"Bearing",
					"Distance",
					"Status"
				].map((e) => /* @__PURE__ */ (0, U.jsx)("th", {
					scope: "col",
					style: Y.cell,
					children: e
				}, e)) }) }),
				/* @__PURE__ */ (0, U.jsx)("tbody", { children: e.courses.map((t, n) => /* @__PURE__ */ (0, U.jsxs)("tr", {
					style: t.confirmed ? void 0 : Y.unconfirmedRow,
					children: [
						/* @__PURE__ */ (0, U.jsx)("td", {
							style: Y.cell,
							children: n + 1
						}),
						/* @__PURE__ */ (0, U.jsx)("td", {
							style: Y.cell,
							children: t.unassigned ? "Unassigned" : e.beginning !== void 0 && n < e.beginning ? "Tie" : n + 1 + " → " + (t.target ?? n + 2)
						}),
						/* @__PURE__ */ (0, U.jsx)("td", {
							style: Y.cell,
							children: Lt(t.bearing, !0, t.synthetic)
						}),
						/* @__PURE__ */ (0, U.jsx)("td", {
							style: Y.cell,
							children: t.distance ? Lt(t.distance, !1, t.synthetic) : "—"
						}),
						/* @__PURE__ */ (0, U.jsx)("td", {
							style: Y.cell,
							children: t.confirmed ? "Confirmed" : /* @__PURE__ */ (0, U.jsxs)(Ue.Root, { children: [/* @__PURE__ */ (0, U.jsx)(Ue.Trigger, {
								asChild: !0,
								children: /* @__PURE__ */ (0, U.jsx)("button", {
									type: "button",
									style: Y.status,
									children: "Unconfirmed"
								})
							}), /* @__PURE__ */ (0, U.jsx)(Ue.Portal, { children: /* @__PURE__ */ (0, U.jsx)(Ue.Content, {
								collisionPadding: 8,
								sideOffset: 6,
								style: {
									...z.tooltip,
									maxWidth: "min(24rem, calc(100vw - 1rem))",
									overflowWrap: "anywhere"
								},
								children: t.issue
							}) })] })
						})
					]
				}, n)) })
			]
		})
	}) : /* @__PURE__ */ (0, U.jsxs)("section", {
		"aria-label": `${e.title} extracted measurements`,
		style: J.infoCard,
		children: [t ? /* @__PURE__ */ (0, U.jsx)("h4", {
			style: J.infoTitle,
			children: e.title
		}) : null, /* @__PURE__ */ (0, U.jsx)("dl", {
			style: Y.measurements,
			children: n.map((e, t) => /* @__PURE__ */ (0, U.jsxs)("div", { children: [/* @__PURE__ */ (0, U.jsx)("dt", {
				style: Y.measurementLabel,
				children: e.label
			}), /* @__PURE__ */ (0, U.jsx)("dd", {
				style: Y.measurementValue,
				children: Lt(e.value, e.label === "Bearings")
			})] }, t))
		})]
	});
}
//#endregion
//#region src/features/legalmap/store/mapStore.ts
var ar = i(), or = s(), sr = (0, ar.create)()((0, or.persist)((e) => ({
	detailsRatio: null,
	setDetailsRatio: (t) => e({ detailsRatio: t })
}), {
	name: "aurorra-index:map",
	partialize: (e) => ({ detailsRatio: e.detailsRatio })
}));
//#endregion
//#region src/features/legalmap/hook/useMapResize.ts
function cr(e, t) {
	let n = Math.min(t.max, Math.max(t.min, e));
	return {
		height: n,
		ratio: (n + t.header) / t.total
	};
}
function lr(e) {
	let t = N(null), n = N(null), r = N(null), i = N(null), a = N(null), o = sr((e) => e.detailsRatio), s = sr((e) => e.setDetailsRatio), [c, l] = P(null), [u, d] = P(null), f = c ? cr(u === null ? o === null ? c.initial : o * c.total - c.header : u, c) : null;
	ce(() => {
		if (!e) return;
		let o = t.current, s = n.current, c = r.current, u = i.current, d = new ResizeObserver(() => {
			let e = Number.parseFloat(getComputedStyle(document.documentElement).fontSize), t = o.getBoundingClientRect().height - u.getBoundingClientRect().height;
			if (t <= 0) return;
			let n = s.getBoundingClientRect().height - c.getBoundingClientRect().height, r = Math.max(0, t - n), i = Math.min(r, q.mapMin * e), a = Math.max(Math.min(q.detailsMin * e, Math.max(0, r - i)), r - q.mapMax * e);
			l({
				total: t,
				header: n,
				initial: q.detailsHeight * e,
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
		height: f ? f.height : J.infoPanel.height,
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
				e.preventDefault(), s(cr(t, c).ratio);
			}
		}
	};
}
//#endregion
//#region src/features/legalmap/component/LegalMapContent.tsx
function ur({ legal: e, addressMaps: t, onReadyChange: n }) {
	return A(() => {
		n?.(!0);
	}, [e, n]), /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [/* @__PURE__ */ (0, U.jsx)("style", { children: Rn }), /* @__PURE__ */ (0, U.jsx)("div", {
		className: "legal-map",
		style: J.shell,
		children: /* @__PURE__ */ (0, U.jsx)(F, {
			title: "Map views could not be displayed",
			resetKey: e,
			children: /* @__PURE__ */ (0, U.jsx)(dr, {
				legal: e,
				addressMaps: t
			})
		})
	})] });
}
function dr({ legal: e, addressMaps: t }) {
	let n = vn(e), r = nt.filter((e) => e === "Address" ? !!t?.length : n.some((t) => t.view === e)), { active: i, controls: a, panel: o } = Ve(r, "Map views", {
		className: "legal-map-tabs legal-map-view-tabs",
		style: J.tabs,
		tabStyle: (e) => ({
			...J.tabButton,
			color: e ? "var(--primary-dark)" : "var(--body-ink)"
		}),
		hideSingle: !1
	}), s = n.filter((e) => e.view === i), c = i === "Lot & block" && e?.parcels_num && e.parcels_num > 0 ? e.parcels_num : void 0, l = c ? Tt(s.map((e) => e.group), c) : void 0, u = l ? Array.from({ length: c }, (e, t) => l[t]) : [{ sources: s.map((e) => e.group) }], d = (c ? c > 1 : s.length > 1) && e?.parcels_num !== 1, f = l ? l.flatMap((t, n) => s.filter((e) => t.sources.includes(e.group)).map((t) => ({
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
	}] : []), m = Ve(i === "Metes & Bounds" ? [
		"Boundary Calls",
		"Acreage",
		"Easement"
	].filter((e) => e === "Boundary Calls" ? p.some((e) => e.courses.length || e.notes.some((e) => e.label === "Bearings" || e.label === "Distances")) : f.some((t) => t.notes.some((t) => t.label === e))) : (i === "PLSS" || i === "Lot & block") && f.some((e) => e.notes.length > 0) ? ["Details"] : [], "Map details", {
		className: "legal-map-tabs legal-map-detail-tabs",
		style: J.detailTabs,
		tabStyle: J.detailTab,
		hideSingle: !0
	}), h = i === "Address" ? t.map((e) => ({
		title: e.address,
		content: /* @__PURE__ */ (0, U.jsx)(Kn, {
			showNorth: !1,
			children: e.content
		})
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
			content: r ? i === "PLSS" ? /* @__PURE__ */ (0, U.jsx)(Jn, { scenes: t }) : /* @__PURE__ */ (0, U.jsx)(qn, { scenes: n }) : /* @__PURE__ */ (0, U.jsx)(Kn, {
				showNorth: !1,
				issues: e.map((e) => ({
					title: e.title,
					issue: e.scene.issue
				}))
			})
		};
	}) : u.flatMap((e, t) => {
		let n = `Parcel ${t + 1}`;
		if (!e) return [{
			title: n,
			content: /* @__PURE__ */ (0, U.jsx)(Kn, {
				showNorth: !1,
				issues: [{
					title: n,
					issue: "Cannot map: Lot Block legal group is missing for this parcel."
				}]
			})
		}];
		let r = Nt({
			groups: e.sources,
			parcels_num: c ? 1 : void 0
		}), i = s.filter((t) => e.sources.includes(t.group) && t.issue).map((e) => e.issue);
		return r.isEmptyStructure && i.length === 0 ? [] : [{
			title: n,
			content: /* @__PURE__ */ (0, U.jsx)(nr, {
				view: r,
				issues: i,
				title: n
			})
		}];
	}), g = lr(m.active && h.length > 0 ? i : void 0);
	return /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [r.length > 0 ? /* @__PURE__ */ (0, U.jsx)("div", {
		className: "legal-map-toolbar",
		style: J.toolbar,
		children: a
	}) : null, /* @__PURE__ */ (0, U.jsxs)("div", {
		...r.length > 0 ? o : {},
		ref: g.bodyRef,
		className: "legal-map-content",
		style: J.content,
		children: [h.length > 0 ? /* @__PURE__ */ (0, U.jsx)("div", {
			className: "legal-map-column",
			style: J.mapColumn,
			children: /* @__PURE__ */ (0, U.jsx)("div", {
				"data-map-scroll": "true",
				className: "legal-map-surveys",
				style: J.parcelList,
				children: h.map((t, n) => /* @__PURE__ */ (0, U.jsxs)("section", {
					className: "survey-layout",
					"aria-label": t.title,
					style: J.parcelLayout,
					children: [i !== "Address" && d ? /* @__PURE__ */ (0, U.jsx)("h4", {
						style: J.parcelTitle,
						children: t.title
					}) : null, /* @__PURE__ */ (0, U.jsx)(F, {
						title: `${t.title} could not be displayed`,
						resetKey: e,
						children: t.content
					})]
				}, `${i}-${n}`))
			})
		}) : null, m.active ? /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [h.length > 0 ? /* @__PURE__ */ (0, U.jsx)("div", {
			...g.separator,
			"aria-controls": `${o.id} ${m.panel.id}`,
			className: "legal-map-divider",
			style: J.divider,
			children: /* @__PURE__ */ (0, U.jsx)("span", {
				"aria-hidden": "true",
				style: J.dividerGrip
			})
		}) : null, /* @__PURE__ */ (0, U.jsxs)("aside", {
			ref: g.infoRef,
			className: "legal-map-info",
			"data-legal-map-info": "true",
			style: J.infoColumn,
			children: [m.controls, /* @__PURE__ */ (0, U.jsxs)("div", {
				...m.panel,
				ref: g.panelRef,
				style: {
					...J.infoPanel,
					height: g.height
				},
				children: [m.active === "Details" ? f.map((e, t) => /* @__PURE__ */ (0, U.jsx)(oe, { children: /* @__PURE__ */ (0, U.jsxs)("table", {
					className: "legal-map-table",
					"aria-label": d ? `${e.title} details` : "Details",
					style: {
						...Y.notes,
						tableLayout: "auto"
					},
					children: [d ? /* @__PURE__ */ (0, U.jsx)("caption", {
						style: J.infoTitle,
						children: e.title
					}) : null, /* @__PURE__ */ (0, U.jsx)("tbody", { children: e.notes.map((e, t) => /* @__PURE__ */ (0, U.jsxs)("tr", { children: [/* @__PURE__ */ (0, U.jsx)("th", {
						scope: "row",
						style: {
							...Y.cell,
							whiteSpace: "nowrap",
							width: "1%"
						},
						children: e.label
					}), /* @__PURE__ */ (0, U.jsx)("td", {
						style: Y.cell,
						children: e.value
					})] }, t)) })]
				}) }, t)) : null, i === "Metes & Bounds" ? /* @__PURE__ */ (0, U.jsx)(rr, {
					scenes: p,
					active: m.active,
					showParcels: d
				}) : null]
			})]
		})] }) : null]
	})] });
}
//#endregion
//#region src/features/indexing/data/deferredState.ts
function fr(e = {}) {
	return {
		pageMap: new Map(e.pageMap || []),
		segment: e.segment ?? null,
		selectedIndex: e.selectedIndex ?? null
	};
}
//#endregion
//#region src/features/addressmap/data/addressMap.ts
var pr = 14;
function mr(e) {
	return `https://www.google.com/maps?q=${encodeURIComponent(e)}&output=embed&maptype=roadmap`;
}
function hr(e, t) {
	return `${e}&z=${t}`;
}
//#endregion
//#region src/features/addressmap/style/addressMapStyles.ts
var gr = {
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
};
//#endregion
//#region src/features/addressmap/component/AddressMapContent.tsx
function _r({ onLoaderChange: e, onReadyChange: t, source: n, zoom: r }) {
	let [i, a] = P("loading"), o = N(void 0);
	if (ce(() => {
		if (a("loading"), n) return o.current = window.setTimeout(() => a("timeout"), 1e4), () => window.clearTimeout(o.current);
	}, [n, r]), A(() => {
		t(!!n && i !== "loading"), e(n && i === "loading" ? ["Loading map…"] : null);
	}, [
		e,
		t,
		n,
		i
	]), !n) return /* @__PURE__ */ (0, U.jsx)("div", { style: gr.contentShell });
	let s = hr(n, r), c = new URL(n);
	return c.searchParams.delete("output"), /* @__PURE__ */ (0, U.jsxs)("div", {
		style: gr.contentShell,
		children: [/* @__PURE__ */ (0, U.jsx)("iframe", {
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
				...gr.iframe,
				visibility: i === "loaded" ? "visible" : "hidden"
			},
			title: "Address map"
		}, s), i === "timeout" ? /* @__PURE__ */ (0, U.jsxs)("div", {
			role: "status",
			style: gr.timeout,
			children: [/* @__PURE__ */ (0, U.jsx)("span", { children: "The map is taking longer than expected." }), /* @__PURE__ */ (0, U.jsx)("a", {
				href: c.href,
				rel: "noopener noreferrer",
				style: gr.link,
				target: "_blank",
				children: "Open Google Maps"
			})]
		}) : null]
	});
}
//#endregion
//#region src/features/metdataview/data/metadataResource.ts
async function vr(e, t) {
	if (e.resource === "session_choices") {
		let e = T.getState();
		return l.getState().session === t ? structuredClone(e.choices) : null;
	}
	if (e.resource !== "metadata_etag") throw Error(`Unknown resource: ${e.resource}`);
	let n = l.getState();
	return n.session === t && n.etag !== null ? n.etag : null;
}
//#endregion
//#region src/features/pagesegments/style/pageSegmentsStyles.ts
var Z = {
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
};
//#endregion
//#region src/features/pagesegments/component/PageSegmentsPanel.tsx
function yr(e) {
	let t = e;
	return {
		code: t.code,
		details: t.details,
		error: t.error ?? t.message ?? "Page segment update failed.",
		status: t.status
	};
}
function br(e, t) {
	return e.join("|") === t.join("|");
}
function xr({ apiGatewayUrl: e, authToken: t, choices: n, onClose: r, batchCode: i, intervalMs: s, onQueueChange: c, formatError: u, retryIntervalMs: d, retryLimit: f, onError: m, onReadyChange: h, pageClass: _, pageCode: v, segments: b, session: ee, workerClient: te }) {
	let x = p((e) => e.committed), S = p((e) => e.error), C = p((e) => e.selected), w = p((e) => e.status), T = M(() => te ?? g({
		apiBaseUrl: e,
		retryIntervalMs: d,
		retryLimit: f
	}), [
		e,
		d,
		f,
		te
	]), E = Tn(b).join("|"), D = !br(x, C), ne = _ === "blank" && C.length === 0;
	A(() => {
		h(w !== "saving");
	}, [h, w]), A(() => (y.getState().reset(E ? E.split("|") : []), () => {
		y.getState().reset([]);
	}), [E, v]);
	let re = (e, t) => {
		let n = t ? Tn([...C, e]) : C.filter((t) => t !== e);
		y.getState().setSelected(n);
	}, O = async () => {
		if (y.getState().status === "saving" || !D) return;
		let e = [...C];
		y.getState().setSaving();
		try {
			await l.getState().enqueue({
				action: "page",
				code: v,
				segments: e,
				session: ee,
				batch: i,
				segment: "page"
			}, {
				authToken: t,
				client: T,
				intervalMs: s,
				formatError: u,
				onChange: c
			}), r();
		} catch (e) {
			let t = yr(e);
			y.getState().setError(t), m({
				error: t,
				pageCode: v,
				session: ee
			});
			return;
		}
	};
	return /* @__PURE__ */ (0, U.jsxs)("section", {
		"aria-label": "Page Segments",
		style: Z.root,
		children: [
			/* @__PURE__ */ (0, U.jsxs)("label", {
				htmlFor: "pageBlankToggle",
				style: Z.blankRow,
				children: [/* @__PURE__ */ (0, U.jsx)(a, {
					checked: ne,
					disabled: w === "saving",
					id: "pageBlankToggle",
					onCheckedChange: (e) => {
						e === !0 && y.getState().setSelected([]);
					},
					style: Z.checkboxRoot(w === "saving", ne),
					children: /* @__PURE__ */ (0, U.jsx)(o, {
						"aria-hidden": !0,
						style: Z.checkboxIndicator,
						children: "✓"
					})
				}), /* @__PURE__ */ (0, U.jsx)("span", { children: "This page is blank" })]
			}),
			/* @__PURE__ */ (0, U.jsx)("span", {
				id: "pageSegmentsSectionTitle",
				style: Z.sectionTitle,
				children: "Segments"
			}),
			/* @__PURE__ */ (0, U.jsx)("div", {
				style: Z.grid,
				children: bn.map((e) => {
					let t = Cn(n, yn[e]) <= 0;
					return /* @__PURE__ */ (0, U.jsxs)("label", {
						htmlFor: `segment-${e}`,
						style: Z.item,
						children: [/* @__PURE__ */ (0, U.jsx)(a, {
							checked: C.includes(e),
							disabled: t || w === "saving",
							id: `segment-${e}`,
							onCheckedChange: (t) => re(e, t === !0),
							style: Z.checkboxRoot(t || w === "saving", C.includes(e)),
							value: e,
							children: /* @__PURE__ */ (0, U.jsx)(o, {
								"aria-hidden": !0,
								style: Z.checkboxIndicator,
								children: "✓"
							})
						}), /* @__PURE__ */ (0, U.jsx)("span", {
							style: Z.itemText(t),
							children: xn[e]
						})]
					}, e);
				})
			}),
			w === "error" && S ? /* @__PURE__ */ (0, U.jsx)("div", {
				id: "pageSegmentsMessage",
				style: Z.message,
				children: "Page segment changes could not be saved. Please try again."
			}) : null,
			/* @__PURE__ */ (0, U.jsx)("footer", {
				id: "pageSegmentsFooter",
				style: Z.footer,
				children: /* @__PURE__ */ (0, U.jsx)(fe, {
					disabled: !D || w === "saving",
					id: "pageSegmentsSubmitBtn",
					label: "Update",
					onConfirm: () => void O(),
					requireConfirmation: !1,
					style: Z.button("primary"),
					variant: "primary"
				})
			})
		]
	});
}
//#endregion
//#region src/features/audit/hook/useAuditReport.ts
function Sr({ apiGatewayUrl: e, authToken: t, callbacks: n, retryLimit: r, retryIntervalMs: i, session: a, workerClient: o }) {
	let s = N(n), l = M(() => o || re({
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
	return A(() => {
		s.current = n;
	}, [n]), A(() => () => s.current.onAuditCanceled?.(), []), A(() => {
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
var Cr = {
	header: "var(--title-ink)",
	border: "var(--border-card)",
	muted: "var(--slate-500)"
}, wr = "\n.audit-tabs button:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }\n.audit-panel [role=\"tabpanel\"]:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }\n", Q = {
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
		...I.service,
		margin: 0,
		lineHeight: 1.45,
		overflowWrap: "anywhere",
		minWidth: 0
	},
	usageTable: { ...I.table },
	serviceCell: {
		...I.cell,
		...I.service,
		textAlign: "left"
	},
	usageCell: {
		...I.cell,
		...I.level,
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
		color: Cr.header,
		fontSize: "1.5rem",
		fontWeight: 700,
		lineHeight: 1
	},
	summaryBadgeLabel: {
		color: Cr.muted,
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
		color: Cr.muted
	},
	filterSelect: {
		boxSizing: "border-box",
		border: `0.0625rem solid ${Cr.border}`,
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
	empty: { color: Cr.muted },
	gaps: {
		boxSizing: "border-box",
		display: "flex",
		flexDirection: "column",
		gap: "0.9rem",
		marginTop: "0.45rem"
	},
	gapCard: {
		background: "var(--white)",
		border: `1px solid ${Cr.border}`,
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
		color: Cr.header,
		fontSize: "1rem",
		fontWeight: 700
	},
	gapDate: {
		color: Cr.muted,
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
	detailLabel: { color: Cr.muted },
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
		color: Cr.muted,
		fontSize: "0.8rem",
		marginLeft: "auto",
		minWidth: 0,
		overflowWrap: "anywhere",
		textAlign: "right"
	},
	gapProcess: {
		color: Cr.muted,
		fontSize: "0.8rem",
		fontStyle: "italic"
	},
	toggle: {
		color: "var(--primary-dark)",
		cursor: "pointer",
		textDecoration: "underline"
	}
}, Tr = "REMOVE", Er = "CORRECTION", Dr = "VERIFICATION", Or = "CORRECTION", kr = "ENRICHMENT", Ar = "Reprocess |", jr = "USER", Mr = "OTHER";
function Nr(e) {
	return !!e && typeof e == "object" && !Array.isArray(e);
}
function Pr(e) {
	return String(e ?? "").trim();
}
function Fr(e) {
	let t = Date.parse(e);
	return Number.isFinite(t) ? t : -Infinity;
}
function Ir(e) {
	let t = Pr(e).toUpperCase();
	return t === "ADD" || t === "ADDITION" ? "ADD" : t === "REMOVE" || t === "REMOVAL" ? Tr : t === "UPDATE" || t === "CORRECTION" ? Er : t || "OTHER";
}
function Lr(e) {
	let t = Pr(e).toLowerCase();
	return t === "indexing" || t === "verification" ? Dr : t === "correction" ? Or : t === "formatting" || t === "enrichment" ? kr : t === "refinement" || t === "reprocess |" ? Ar : t === "user" ? jr : Mr;
}
function Rr(e) {
	return !Nr(e) || !Array.isArray(e.services) ? {} : { usage: { services: e.services } };
}
function zr(e) {
	if (!Nr(e)) return null;
	let t = e;
	if (typeof t.solution != "string" || typeof t.explanation != "string" || typeof t.page != "string" || typeof t.owner != "string" || typeof t.timestamp != "string" || typeof t.segment != "string" && t.segment !== null) return null;
	let n = Pr(t.solution), r = Pr(t.explanation);
	if (!n && !r) return null;
	if (t.patch != null) {
		if (!Nr(t.patch)) return null;
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
			if (!Nr(e.identifier)) return null;
			let t = e.identifier;
			if (![
				"value",
				"label",
				"aspect"
			].every((e) => t[e] === null || typeof t[e] == "string")) return null;
		}
	}
	return {
		solution: Ir(n),
		explanation: r,
		page: Pr(t.page),
		owner: Lr(t.owner),
		timestamp: Pr(t.timestamp),
		segment: t.segment === null ? null : Pr(t.segment),
		...t.patch == null ? {} : { patch: t.patch }
	};
}
function Br(e) {
	return e === "ADD" ? "add" : e === "REMOVE" ? "remove" : e === "CORRECTION" ? "correction" : "other";
}
function Vr(e) {
	return e === "CORRECTION" ? "correction" : e === "ENRICHMENT" ? "enrichment" : e === "Reprocess |" ? "reprocess" : e === "USER" ? "user" : e === "VERIFICATION" ? "verification" : "other";
}
function Hr(e) {
	return e === "ADD" ? "Addition" : e === "REMOVE" ? "Remove" : e === "CORRECTION" ? "Correction" : "Other";
}
function Ur(e) {
	return e === "ADD" ? "Addition" : e === "REMOVE" ? "Remove" : e === "CORRECTION" ? "Correction" : "Other";
}
function Wr(e) {
	return e === "VERIFICATION" ? "Verification" : e === "CORRECTION" ? "Correction" : e === "ENRICHMENT" ? "Enrichment" : e === "Reprocess |" ? "Reprocess" : e === "USER" ? "User change" : "Other";
}
function Gr(e) {
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
function Kr(e) {
	return {
		aspect: e.solution,
		aspectLabel: Hr(e.solution),
		changeType: e.solution,
		changeTypeLabel: Ur(e.solution),
		date: e.timestamp,
		dateLabel: Gr(e.timestamp),
		message: e.explanation,
		page: e.page,
		process: e.owner,
		processLabel: Wr(e.owner),
		segment: e.segment,
		...e.patch ? { patch: e.patch } : {}
	};
}
function qr(e) {
	if (!Nr(e)) return [];
	let t = e;
	return (Array.isArray(t.gaps) ? t.gaps : []).map(zr).filter((e) => e !== null).map((e) => ({
		entry: e,
		rawDate: Fr(e.timestamp)
	})).sort((e, t) => {
		let n = t.rawDate - e.rawDate;
		if (n !== 0) return n;
		let r = e.entry.solution.localeCompare(t.entry.solution);
		return r === 0 ? String(e.entry.page).localeCompare(String(t.entry.page)) : r;
	}).map((e) => e.entry);
}
function Jr(e) {
	let t = Nr(e) ? e : {}, n = { gaps: qr(t) }, r = Rr(t.usage);
	return r.usage && (n.usage = r.usage), n;
}
function Yr(e, t, n) {
	let r = qr(e), i = t.changeType ? Ir(t.changeType) : "", a = t.process ? Lr(t.process) : "", o = i.length > 0, s = a.length > 0, c = {
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
			let t = Br(e.solution);
			c[t] += 1;
		}
		if (r && f) {
			let t = Vr(e.owner);
			l[t] += 1;
		}
		return n && r && (d += 1, e.segment !== null && Object.hasOwn(u, e.segment) && (u[e.segment] += 1)), n && r && f;
	});
	return {
		changeCounts: c,
		filtered: f.length,
		gaps: f.map(Kr),
		processCounts: l,
		segmentCounts: u,
		segmentTotal: d,
		total: r.length
	};
}
//#endregion
//#region src/features/audit/component/AuditFilters.tsx
var Xr = [
	["", "All"],
	["ADD", "Addition"],
	["REMOVE", "Remove"],
	["CORRECTION", "Correction"]
], Zr = [
	["", "All"],
	["VERIFICATION", "Verification"],
	["CORRECTION", "Correction"],
	["ENRICHMENT", "Enrichment"],
	["Reprocess |", "Reprocess"],
	["USER", "User change"],
	["OTHER", "Other"]
];
function Qr({ filters: e, onFiltersChange: t, report: n, session: r, onResource: i }) {
	let a = M(() => ({ session: r }), [r]), [o, s] = P(!1), [c, l] = P(null), { aspects: u, ready: d } = E(a, r, i, s, l);
	if (n === null) return /* @__PURE__ */ (0, U.jsx)("div", {
		style: Q.filters,
		children: /* @__PURE__ */ (0, U.jsx)(ye, {
			label: "Loading audit filters",
			children: /* @__PURE__ */ (0, U.jsx)("div", {
				style: Q.filterRow,
				children: [
					"Change type",
					"Process",
					"Segment"
				].map((e) => /* @__PURE__ */ (0, U.jsxs)("div", {
					style: {
						...Q.filterLabel,
						...Q.filterSelectGroup
					},
					children: [/* @__PURE__ */ (0, U.jsx)("span", { children: e }), /* @__PURE__ */ (0, U.jsx)("span", {
						"aria-hidden": "true",
						style: {
							...B,
							...Q.filterSelect
						}
					})]
				}, e))
			})
		})
	});
	let f = Yr(n, e, Object.keys(u)), p = Object.values(f.changeCounts).reduce((e, t) => e + t, 0), m = Object.values(f.processCounts).reduce((e, t) => e + t, 0);
	return /* @__PURE__ */ (0, U.jsx)("div", {
		style: Q.filters,
		children: /* @__PURE__ */ (0, U.jsxs)("div", {
			style: Q.filterRow,
			children: [
				/* @__PURE__ */ (0, U.jsxs)("label", {
					style: {
						...Q.filterLabel,
						...Q.filterSelectGroup
					},
					children: [/* @__PURE__ */ (0, U.jsx)("span", { children: "Change type" }), /* @__PURE__ */ (0, U.jsx)("select", {
						"aria-label": "Change type",
						onChange: (n) => t({
							...e,
							changeType: n.target.value
						}),
						style: Q.filterSelect,
						value: e.changeType,
						children: Xr.map(([e, t]) => /* @__PURE__ */ (0, U.jsx)("option", {
							value: e,
							children: `${t} (${e === "" ? p : f.changeCounts[e === "ADD" ? "add" : e === "REMOVE" ? "remove" : e === "CORRECTION" ? "correction" : "other"]})`
						}, `change-${e || "all"}`))
					})]
				}),
				/* @__PURE__ */ (0, U.jsxs)("label", {
					style: {
						...Q.filterLabel,
						...Q.filterSelectGroup
					},
					children: [/* @__PURE__ */ (0, U.jsx)("span", { children: "Process" }), /* @__PURE__ */ (0, U.jsx)("select", {
						"aria-label": "Process",
						onChange: (n) => t({
							...e,
							process: n.target.value
						}),
						style: Q.filterSelect,
						value: e.process,
						children: Zr.map(([e, t]) => /* @__PURE__ */ (0, U.jsx)("option", {
							value: e,
							children: `${t} (${e === "" ? m : f.processCounts[e === "VERIFICATION" ? "verification" : e === "CORRECTION" ? "correction" : e === "ENRICHMENT" ? "enrichment" : e === "Reprocess |" ? "reprocess" : e === "USER" ? "user" : "other"]})`
						}, `process-${e || "all"}`))
					})]
				}),
				/* @__PURE__ */ (0, U.jsxs)("label", {
					style: {
						...Q.filterLabel,
						...Q.filterSelectGroup
					},
					children: [/* @__PURE__ */ (0, U.jsx)("span", { children: "Segment" }), o ? c ? /* @__PURE__ */ (0, U.jsx)("span", {
						role: "alert",
						style: Q.filterError,
						children: "Segment options could not be loaded. Refresh the Audit & Usage to try again."
					}) : d ? /* @__PURE__ */ (0, U.jsxs)("select", {
						"aria-label": "Segment",
						onChange: (n) => t({
							...e,
							segment: n.target.value
						}),
						style: Q.filterSelect,
						value: e.segment,
						children: [/* @__PURE__ */ (0, U.jsx)("option", {
							value: "",
							children: `All (${f.segmentTotal})`
						}), Object.entries(f.segmentCounts).map(([e, t]) => /* @__PURE__ */ (0, U.jsx)("option", {
							value: e,
							children: `${L(e)} (${t})`
						}, e))]
					}) : null : /* @__PURE__ */ (0, U.jsx)(ye, { label: "Loading segment options" })]
				})
			]
		})
	});
}
//#endregion
//#region src/features/audit/component/AuditGaps.tsx
var $r = 200;
function ei(e, t) {
	return `${e.aspect}|${e.page}|${e.date}|${t}`;
}
function ti({ isOpen: e, message: t, onToggle: n }) {
	let r = t.replace(/\s+/g, " ").trim();
	return r.length <= $r ? /* @__PURE__ */ (0, U.jsx)("div", {
		style: Q.gapMessage,
		children: r
	}) : /* @__PURE__ */ (0, U.jsxs)("div", {
		style: Q.gapMessage,
		children: [e ? r : `${r.slice(0, $r)}...`, /* @__PURE__ */ (0, U.jsx)("a", {
			href: "#",
			onClick: (e) => {
				e.preventDefault(), n();
			},
			style: {
				...Q.toggle,
				whiteSpace: "nowrap",
				marginLeft: "0.25rem"
			},
			children: e ? "[Show less]" : "[Show more]"
		})]
	});
}
function ni({ report: e, filters: t }) {
	let [n, r] = P({}), i = e ? Yr(e, t, []).gaps : null;
	function a(e) {
		r((t) => ({
			...t,
			[e]: !t[e]
		}));
	}
	return i === null ? /* @__PURE__ */ (0, U.jsx)(ye, {
		label: "Loading audit gaps",
		children: /* @__PURE__ */ (0, U.jsx)("div", {
			"aria-hidden": "true",
			style: Q.gaps,
			children: [
				0,
				1,
				2
			].map((e) => /* @__PURE__ */ (0, U.jsxs)("article", {
				style: Q.gapCard,
				children: [
					/* @__PURE__ */ (0, U.jsxs)("div", {
						style: Q.gapHeader,
						children: [/* @__PURE__ */ (0, U.jsx)("span", { style: {
							...B,
							width: "35%"
						} }), /* @__PURE__ */ (0, U.jsx)("span", { style: {
							...B,
							width: "20%"
						} })]
					}),
					/* @__PURE__ */ (0, U.jsx)("dl", {
						style: Q.details,
						children: [0, 1].map((e) => /* @__PURE__ */ (0, U.jsxs)("div", {
							style: Q.detailRow,
							children: [/* @__PURE__ */ (0, U.jsx)("dt", {
								style: Q.detailLabel,
								children: /* @__PURE__ */ (0, U.jsx)("span", { style: {
									...B,
									width: "80%"
								} })
							}), /* @__PURE__ */ (0, U.jsx)("dd", {
								style: Q.detailValue,
								children: /* @__PURE__ */ (0, U.jsx)("span", { style: {
									...B,
									width: "65%"
								} })
							})]
						}, e))
					}),
					/* @__PURE__ */ (0, U.jsxs)("div", {
						style: Q.gapMessage,
						children: [/* @__PURE__ */ (0, U.jsx)("span", { style: {
							...B,
							width: "95%"
						} }), /* @__PURE__ */ (0, U.jsx)("span", { style: {
							...B,
							width: "75%"
						} })]
					}),
					/* @__PURE__ */ (0, U.jsxs)("div", {
						style: Q.gapFooter,
						children: [/* @__PURE__ */ (0, U.jsx)("span", { style: {
							...B,
							width: "25%"
						} }), /* @__PURE__ */ (0, U.jsx)("span", { style: {
							...B,
							width: "20%"
						} })]
					})
				]
			}, e))
		})
	}) : i.length === 0 ? /* @__PURE__ */ (0, U.jsx)("div", {
		style: Q.empty,
		children: "No gaps found."
	}) : /* @__PURE__ */ (0, U.jsx)("section", {
		"aria-label": "Audit gaps",
		style: Q.gaps,
		children: i.map((e, t) => {
			let r = ei(e, t), i = n[r] === !0, o = e.patch, s = o?.value != null && o.value.trim() !== "", c = [
				["Target label", o?.identifier?.label],
				["Target aspect", o?.identifier?.aspect],
				["Target index", o?.identifier?.value],
				["Index", s && o?.field.trim() ? `${o.value} (${o.field})` : o?.value],
				["Field", s ? null : o?.field],
				["Page", e.page],
				["Source", o?.source]
			].filter(([, e]) => e != null && String(e).trim() !== "");
			return /* @__PURE__ */ (0, U.jsxs)("article", {
				style: Q.gapCard,
				children: [
					/* @__PURE__ */ (0, U.jsxs)("div", {
						style: Q.gapHeader,
						children: [/* @__PURE__ */ (0, U.jsx)("div", {
							style: Q.gapAspect,
							children: e.aspectLabel
						}), /* @__PURE__ */ (0, U.jsx)("div", {
							style: Q.gapDate,
							children: e.dateLabel
						})]
					}),
					c.length > 0 && /* @__PURE__ */ (0, U.jsx)("dl", {
						style: Q.details,
						children: c.map(([e, t]) => /* @__PURE__ */ (0, U.jsxs)("div", {
							style: Q.detailRow,
							children: [/* @__PURE__ */ (0, U.jsx)("dt", {
								style: Q.detailLabel,
								children: e
							}), /* @__PURE__ */ (0, U.jsx)("dd", {
								style: Q.detailValue,
								children: t
							})]
						}, e))
					}),
					/* @__PURE__ */ (0, U.jsx)(ti, {
						isOpen: i,
						message: e.message,
						onToggle: () => a(r)
					}),
					/* @__PURE__ */ (0, U.jsxs)("div", {
						style: Q.gapFooter,
						children: [/* @__PURE__ */ (0, U.jsx)("div", {
							style: Q.gapProcess,
							children: e.processLabel
						}), e.segment && /* @__PURE__ */ (0, U.jsx)("div", {
							style: Q.gapSegment,
							children: e.segment
						})]
					})
				]
			}, r);
		})
	});
}
//#endregion
//#region src/features/audit/component/AuditSummary.tsx
function ri({ report: e, filters: t, error: n }) {
	let r = !n && e ? Yr(e, t, []) : null;
	return /* @__PURE__ */ (0, U.jsx)("div", {
		style: Q.summary,
		children: /* @__PURE__ */ (0, U.jsx)("div", {
			style: Q.summaryRow,
			children: /* @__PURE__ */ (0, U.jsx)("div", {
				style: Q.summaryBadge,
				children: n ? /* @__PURE__ */ (0, U.jsx)(he, {
					label: "Audit summary",
					error: n
				}) : r === null ? /* @__PURE__ */ (0, U.jsx)(ye, {
					compact: !0,
					label: "Loading audit summary",
					children: /* @__PURE__ */ (0, U.jsxs)("div", {
						"aria-hidden": "true",
						style: {
							display: "flex",
							flexDirection: "column",
							gap: "0.25rem"
						},
						children: [/* @__PURE__ */ (0, U.jsx)("span", { style: {
							...B,
							width: "2rem",
							height: Q.summaryBadgeCount.fontSize
						} }), /* @__PURE__ */ (0, U.jsx)("span", { style: {
							...B,
							width: "3.5rem",
							height: Q.summaryBadgeLabel.fontSize
						} })]
					})
				}) : /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [/* @__PURE__ */ (0, U.jsx)("span", {
					style: Q.summaryBadgeCount,
					children: r.filtered
				}), /* @__PURE__ */ (0, U.jsxs)("span", {
					style: Q.summaryBadgeLabel,
					children: ["Out of ", r.total]
				})] })
			})
		})
	});
}
//#endregion
//#region src/features/audit/component/AuditUsage.tsx
function ii({ report: e, session: t }) {
	if (e === null) return /* @__PURE__ */ (0, U.jsx)(ye, {
		label: "Loading service usage",
		children: /* @__PURE__ */ (0, U.jsxs)("section", {
			style: Q.usage,
			children: [/* @__PURE__ */ (0, U.jsx)("h3", {
				style: I.heading,
				children: "Service usage"
			}), /* @__PURE__ */ (0, U.jsx)("div", {
				"aria-label": "Service usage table",
				role: "region",
				tabIndex: 0,
				style: I.tableFrame,
				children: /* @__PURE__ */ (0, U.jsxs)("table", {
					"aria-label": "Audit service usage",
					style: Q.usageTable,
					children: [/* @__PURE__ */ (0, U.jsx)("thead", {
						style: I.tableHead,
						children: /* @__PURE__ */ (0, U.jsxs)("tr", { children: [/* @__PURE__ */ (0, U.jsx)("th", {
							scope: "col",
							style: I.cell,
							children: "Service"
						}), [
							"Credits",
							"Time",
							"Pages"
						].map((e) => /* @__PURE__ */ (0, U.jsx)("th", {
							scope: "col",
							style: Q.usageCell,
							children: e
						}, e))] })
					}), /* @__PURE__ */ (0, U.jsx)("tbody", {
						"aria-hidden": "true",
						children: [
							0,
							1,
							2
						].map((e) => /* @__PURE__ */ (0, U.jsx)("tr", { children: [
							0,
							1,
							2,
							3
						].map((e) => /* @__PURE__ */ (0, U.jsx)("td", {
							style: e === 0 ? Q.serviceCell : Q.usageCell,
							children: /* @__PURE__ */ (0, U.jsx)("span", { style: {
								...B,
								width: e === 0 ? "70%" : "2rem"
							} })
						}, e)) }, e))
					})]
				})
			})]
		})
	});
	if (!e.usage?.services?.length) return null;
	let n = Ge(e.usage.services.map((e) => ({
		...e,
		session: t
	})));
	return /* @__PURE__ */ (0, U.jsxs)("section", {
		"aria-label": "Audit usage",
		style: Q.usage,
		children: [/* @__PURE__ */ (0, U.jsx)("h3", {
			style: I.heading,
			children: "Service usage"
		}), /* @__PURE__ */ (0, U.jsx)("div", {
			"aria-label": "Service usage table",
			role: "region",
			tabIndex: 0,
			style: I.tableFrame,
			children: /* @__PURE__ */ (0, U.jsxs)("table", {
				"aria-label": "Audit service usage",
				style: Q.usageTable,
				children: [/* @__PURE__ */ (0, U.jsx)("thead", {
					style: I.tableHead,
					children: /* @__PURE__ */ (0, U.jsxs)("tr", { children: [/* @__PURE__ */ (0, U.jsx)("th", {
						scope: "col",
						style: I.cell,
						children: "Service"
					}), [
						"Credits",
						"Time",
						"Pages"
					].map((e) => /* @__PURE__ */ (0, U.jsx)("th", {
						scope: "col",
						style: Q.usageCell,
						children: e
					}, e))] })
				}), /* @__PURE__ */ (0, U.jsx)("tbody", { children: n.map((e) => /* @__PURE__ */ (0, U.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, U.jsx)("th", {
						scope: "row",
						style: Q.serviceCell,
						children: V[e.name]
					}),
					/* @__PURE__ */ (0, U.jsx)("td", {
						style: Q.usageCell,
						children: /* @__PURE__ */ (0, U.jsx)(pe, { value: e.cost })
					}),
					/* @__PURE__ */ (0, U.jsx)("td", {
						style: Q.usageCell,
						children: e.time === null ? null : `${e.time.toFixed(2)} s`
					}),
					/* @__PURE__ */ (0, U.jsx)("td", {
						style: Q.usageCell,
						children: e.pages
					})
				] }, e.name)) })]
			})
		})]
	});
}
//#endregion
//#region src/features/audit/component/AuditChoices.tsx
function ai({ session: e, sourceDownload: t }) {
	let n = b((e) => e.choices);
	return x((e) => e.session) !== e || n === null ? /* @__PURE__ */ (0, U.jsx)("p", {
		style: Q.empty,
		children: "Session choices are unavailable."
	}) : /* @__PURE__ */ (0, U.jsxs)("section", {
		"aria-label": "Session choices",
		style: Q.choices,
		children: [
			t,
			/* @__PURE__ */ (0, U.jsx)("h3", {
				style: I.heading,
				children: "Jurisdiction"
			}),
			/* @__PURE__ */ (0, U.jsx)("p", {
				style: Q.choiceValue,
				children: n.jurisdiction?.trim() || "No jurisdiction selected"
			}),
			/* @__PURE__ */ (0, U.jsx)(de, {
				items: n.items,
				columns: 1
			})
		]
	});
}
//#endregion
//#region src/features/audit/component/AuditPanel.tsx
var oi = {
	changeType: "",
	process: "",
	segment: ""
}, si = [
	"Changes",
	"Usage",
	"Choices"
];
function ci(e) {
	let { report: t, error: n } = Sr(e), [r, i] = P(oi), { active: a, controls: o, panel: s } = Ve(si, "Audit views", {
		storageKey: `aurorra-index:audit-tab:${e.session}`,
		className: "audit-tabs",
		style: Q.tabs,
		tabStyle: Q.tab,
		hideSingle: !1
	});
	return /* @__PURE__ */ (0, U.jsxs)("section", {
		"aria-label": "Audit panel",
		className: "audit-panel",
		style: Q.root,
		children: [
			/* @__PURE__ */ (0, U.jsx)("style", { children: wr }),
			o,
			/* @__PURE__ */ (0, U.jsx)("div", {
				"aria-label": "Audit & Usage body",
				"data-panel-scroll": "true",
				role: "region",
				style: Q.body,
				children: /* @__PURE__ */ (0, U.jsxs)("div", {
					...s,
					children: [
						/* @__PURE__ */ (0, U.jsx)("div", {
							hidden: a !== "Changes",
							children: /* @__PURE__ */ (0, U.jsxs)("div", {
								"data-audit-controls": !0,
								style: Q.controlsRow,
								children: [/* @__PURE__ */ (0, U.jsx)(F, {
									title: "Audit filters",
									resetKey: t,
									fallback: (e, t) => /* @__PURE__ */ (0, U.jsx)("div", {
										style: Q.filterFailure,
										children: /* @__PURE__ */ (0, U.jsx)(ve, {
											title: "Audit filters",
											detail: e.message,
											onRetry: t
										})
									}),
									children: /* @__PURE__ */ (0, U.jsx)(Qr, {
										filters: r,
										onFiltersChange: i,
										report: t,
										session: e.session,
										onResource: e.onResource
									}, e.session)
								}), /* @__PURE__ */ (0, U.jsx)(F, {
									title: "Audit summary",
									resetKey: t,
									fallback: (n) => /* @__PURE__ */ (0, U.jsx)(ri, {
										report: t,
										filters: r,
										error: n.message
									}, e.session),
									children: /* @__PURE__ */ (0, U.jsx)(ri, {
										report: t,
										filters: r
									}, e.session)
								})]
							})
						}),
						n && t === null ? null : /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [/* @__PURE__ */ (0, U.jsx)("div", {
							hidden: a !== "Changes",
							children: /* @__PURE__ */ (0, U.jsx)(F, {
								title: "Audit gaps",
								resetKey: t,
								children: /* @__PURE__ */ (0, U.jsx)(ni, {
									report: t,
									filters: r
								}, e.session)
							})
						}), /* @__PURE__ */ (0, U.jsx)("div", {
							hidden: a !== "Usage",
							children: /* @__PURE__ */ (0, U.jsx)(F, {
								title: "Audit usage",
								resetKey: t,
								children: /* @__PURE__ */ (0, U.jsx)(ii, {
									report: t,
									session: e.session
								}, e.session)
							})
						})] }),
						/* @__PURE__ */ (0, U.jsx)("div", {
							hidden: a !== "Choices",
							children: /* @__PURE__ */ (0, U.jsx)(F, {
								title: "Session choices",
								resetKey: e.session,
								children: /* @__PURE__ */ (0, U.jsx)(ai, {
									session: e.session,
									sourceDownload: e.sourceDownload
								}, e.session)
							})
						})
					]
				})
			})
		]
	});
}
//#endregion
//#region src/features/iq/data/iqData.ts
function li(e, t, n) {
	return t && t !== e && t.class === n?.class && t.jurisdiction === n.jurisdiction ? t : n;
}
function ui(e) {
	let t = e;
	return {
		...e instanceof ErrorEvent ? { cause: e } : {},
		code: typeof t?.code == "string" ? t.code : void 0,
		details: t?.details,
		error: typeof t?.error == "string" ? t.error : typeof t?.message == "string" ? t.message : "IQ request failed.",
		status: typeof t?.status == "number" ? t.status : void 0
	};
}
var di = "PASS", fi = "FAIL", pi = "WARNING", mi = "INFO", hi = "success", gi = "fail", _i = "warning";
function vi(e) {
	let t = Number(e);
	return Number.isFinite(t) ? t : 0;
}
function yi(e) {
	return Math.min(100, Math.max(0, vi(e)));
}
function bi(e) {
	let t = yi(e);
	return t >= 96 ? "green" : t >= 82 ? "amber" : "red";
}
function xi(e) {
	return e === "PASS" || e === "FAIL" || e === "WARNING";
}
function Si(e) {
	switch (e) {
		case di: return hi;
		case fi: return gi;
		case pi: return _i;
	}
}
function Ci(e) {
	return vi(e).toFixed(2);
}
function wi(e) {
	let t = String(e || "").replace(/[_-]+/g, " ").trim().toLowerCase();
	return t ? t.replace(/\b([a-z])/g, (e, t) => t.toUpperCase()) : "";
}
function Ti(e) {
	return e == null ? "" : String(e);
}
function Ei(e) {
	let t = e && typeof e == "object" ? e : {};
	return {
		get iq_doc() {
			return vi(t.iq_doc);
		},
		get gates() {
			return Array.isArray(t.gates) ? t.gates.map((e) => {
				let t = e && typeof e == "object" ? e : {};
				return {
					code: Ti(t.code),
					status: Ti(t.status),
					description: typeof t.description == "string" ? t.description : "Detailed values are unavailable for this saved result."
				};
			}) : [];
		},
		get segments() {
			return Array.isArray(t.segments) ? t.segments.map((e) => {
				let t = e && typeof e == "object" ? e : {};
				return {
					segment_name: Ti(t.segment_name),
					expected_weight: vi(t.expected_weight),
					actual_weight: vi(t.actual_weight),
					iq: vi(t.iq),
					get cues() {
						if (!Array.isArray(t.cues)) throw Error("IQ cue findings are missing.");
						return t.cues;
					},
					get explanations() {
						let e = t.explanations;
						return Array.isArray(e) ? e.map(Ti) : [];
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
function Di(e) {
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
function Oi(e) {
	let t = Ei(e), n = Di(() => t.gates);
	return {
		iq: Di(() => {
			let e = yi(t.iq_doc);
			return {
				value: e,
				displayInt: Math.round(e),
				bucket: bi(e)
			};
		}),
		gates: n.error === null ? Di(() => {
			let e = n.data.filter((e) => xi(e.status)).map((e) => ({
				code: e.code,
				status: Si(e.status),
				description: e.description,
				isFailure: e.status === fi,
				label: e.status,
				clearable: e.status === "FAIL" || e.status === "WARNING"
			})), t = e.filter((e) => e.isFailure === !1).length, r = e.length > 0 ? t / e.length * 100 : 0;
			return {
				items: e,
				total: e.length,
				success: t,
				ratio: r,
				displayPercent: Math.round(r),
				bucket: bi(r)
			};
		}) : n,
		segments: Di(() => t.segments.sort((e, t) => t.expected_weight - e.expected_weight).map((e) => ({
			id: e.segment_name,
			displayId: wi(e.segment_name),
			expectedWeight: e.expected_weight,
			expectedDisplay: Ci(e.expected_weight),
			actualWeight: e.actual_weight,
			actualDisplay: Ci(e.actual_weight),
			iq: e.iq,
			iqDisplay: `${Math.round(e.iq)}%`,
			explanations: Di(() => e.explanations),
			cues: Di(() => e.cues)
		}))),
		notes: Di(() => t.notes.filter(({ message: e }) => !e.startsWith("Compliance gates") && !e.startsWith("Indexing quality")).map(({ segment: e, message: t }) => ({
			segment: e === null ? null : wi(e),
			message: t,
			status: /^Unclassified indexes: (Optimal|Satisfied)\b/.test(t) ? hi : t.startsWith("WARNING:") || t.startsWith("Unclassified indexes") || t.startsWith("Missing indexes") ? _i : "neutral"
		})))
	};
}
//#endregion
//#region src/features/iq/worker/iqWorkerClient.ts
function ki(e, t) {
	let n = Error(e);
	if (t && typeof t == "object") {
		let e = t;
		typeof e.code == "string" && (n.code = e.code), typeof e.status == "number" && (n.status = e.status), typeof e.retryAfter == "string" && (n.retryAfter = e.retryAfter), typeof e.retryAt == "number" && (n.retryAt = e.retryAt), Object.prototype.hasOwnProperty.call(e, "details") && (n.details = e.details);
	}
	return n;
}
async function Ai(e, t) {
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
			r(ki(typeof o?.error == "string" ? o.error : "IQ worker request failed", o));
		}, i.onerror = (e) => {
			a || (a = !0, i.terminate(), r(e));
		}, i.postMessage(e);
	});
}
async function ji(e) {
	return (await Ai({
		apiBaseUrl: e.apiGatewayUrl,
		session: e.session,
		token: e.authToken,
		type: "iqData",
		etag: null
	})).report;
}
function Mi(e) {
	let { apiBaseUrl: t, onDownload: n, onRetry: r, retryIntervalMs: i, retryLimit: a } = e;
	return {
		ackGate(e, n, r) {
			return Ai({
				apiBaseUrl: t,
				code: r,
				session: n,
				token: e,
				type: "iqAck"
			});
		},
		ackCue(e, n, r) {
			return Ai({
				apiBaseUrl: t,
				code: r,
				session: n,
				token: e,
				type: "iqCueAck"
			});
		},
		loadReport(e, o, s) {
			return _(() => Ai({
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
var Ni = null;
async function Pi(e, t, n) {
	let i = e.workerClient || Mi({
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
		let a = n ? null : await vr({ resource: "metadata_etag" }, e.session) ?? "";
		if (r.getState().generation !== t || r.getState().activeSession !== e.session) return;
		let o = r.getState().verificationModel, s = await i.loadReport(e.authToken, e.session, a);
		if (r.getState().generation !== t || r.getState().activeSession !== e.session) return;
		let { report: c, metadataEtag: l, verificationEtag: u, verificationModel: d } = s, f = r.getState().verificationModel;
		return r.getState().setLoaded(e.session, c, l, u, li(o, f, d), s), c;
	} catch (n) {
		if (r.getState().generation !== t || r.getState().activeSession !== e.session) return;
		let i = ui(n);
		return r.getState().setError(i), i;
	}
}
async function Fi(e, t) {
	let n = r.getState().generation, i = Ni?.session === e.session ? Ni : null;
	i && (i.generation !== n || r.getState().activeSession !== e.session) && (i = null);
	let a = i && !t ? i.load : i ? i.load.then(() => {
		if (r.getState().generation === n && r.getState().activeSession === e.session) return Pi(e, n, t);
	}) : Pi(e, n, t);
	Ni = {
		session: e.session,
		generation: n,
		load: a
	};
	try {
		let t = await a;
		if (!t || r.getState().generation !== n || r.getState().activeSession !== e.session) return;
		"error" in t ? e.onError(t) : e.onComplete?.(t);
	} finally {
		Ni?.load === a && (Ni = null);
	}
}
function Ii(e) {
	return Fi(e, !1);
}
function Li(e) {
	return Fi(e, !0);
}
//#endregion
//#region src/features/iq/store/iqQueueStore.ts
var Ri = (0, ar.create)()((0, or.persist)((e, t) => {
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
					n.status = "failed", n.error = ui(t).error, s(n, "failed");
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
				items: n.map((e) => `${e.session} · ${e.kind === "cues" ? "Cue dismissal" : "Compliance acknowledgment"} · ${L(e.status)}`),
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
function zi({ apiGatewayUrl: e, authToken: t, callbacks: r, retryLimit: i, retryIntervalMs: a, session: o, workerClient: s }) {
	let c = N(r), l = n(), u = M(() => s || Mi({
		apiBaseUrl: e,
		retryIntervalMs: a,
		retryLimit: i
	}), [
		e,
		a,
		i,
		s
	]), d = l.report, f = M(() => {
		if (!d) return null;
		let e = Oi(d);
		if (e.gates.error === null && (e.gates.data.items = e.gates.data.items.filter((e) => !l.removedCodes.has(e.code))), e.segments.error === null) for (let t of e.segments.data) t.cues.error === null && (t.cues.data = t.cues.data.filter((e) => !l.removedCodes.has(e.code)));
		return e;
	}, [d, l.removedCodes]);
	A(() => {
		c.current = r;
	}, [r]), A(() => () => c.current.onIqCanceled?.(), []);
	let p = k(async () => {
		await Ii({
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
	]), m = k(async () => {
		await Li({
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
	A(() => {
		p();
	}, [p]);
	let h = k(async (e, n) => {
		Ri.getState().enqueue(o, n ? "cues" : "gates", e, {
			authToken: t ?? "",
			client: u,
			onChange: (e) => c.current.onIqChange?.(e),
			onComplete: (e) => c.current.onIqAck?.(e)
		});
	}, [
		t,
		u,
		o
	]), g = k((e) => h(e, !1), [h]);
	return {
		ackCue: k((e) => h(e, !0), [h]),
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
var Bi = {
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
}, Vi = {
	warning: "#f59e0b",
	fail: "#ef4444"
}, Hi = ".iq-note[data-state=\"open\"] { background: #F6FCFB; } .iq-tabs button:focus-visible, .iq-content:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }", $ = {
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
			background: Bi[e].bar,
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
		border: `1px solid ${Bi.amber.fg}`,
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
			background: Vi[e],
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
};
//#endregion
//#region src/features/iq/component/IqAckButton.tsx
function Ui({ label: e, disabled: t, onConfirm: n }) {
	return /* @__PURE__ */ (0, U.jsx)(Ue.Provider, {
		delayDuration: 250,
		children: /* @__PURE__ */ (0, U.jsxs)(Ue.Root, { children: [/* @__PURE__ */ (0, U.jsx)(Ue.Trigger, {
			asChild: !0,
			children: /* @__PURE__ */ (0, U.jsx)(fe, {
				"aria-label": e,
				disabled: t,
				onConfirm: n,
				size: "icon",
				variant: "danger",
				label: /* @__PURE__ */ (0, U.jsxs)("svg", {
					"aria-hidden": "true",
					viewBox: "0 0 24 24",
					width: "1.15rem",
					height: "1.15rem",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: 1.7,
					strokeLinecap: "round",
					strokeLinejoin: "round",
					children: [/* @__PURE__ */ (0, U.jsx)("path", { d: "m16 3 5 5a2 2 0 0 1 0 3l-9 9H7l-4-4a2 2 0 0 1 0-3L13 3a2 2 0 0 1 3 0Z" }), /* @__PURE__ */ (0, U.jsx)("path", { d: "m8 8 8 8M12 20h9" })]
				})
			})
		}), /* @__PURE__ */ (0, U.jsx)(Ue.Portal, { children: /* @__PURE__ */ (0, U.jsx)(Ue.Content, {
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
		}) })] })
	});
}
//#endregion
//#region src/features/iq/component/IqRow.tsx
function Wi({ code: e, cue: t, pending: n, status: r, children: i, onAck: a }) {
	let o = !!n;
	return /* @__PURE__ */ (0, U.jsxs)("li", {
		"data-cue-code": t ? e : void 0,
		"data-gate-code": t ? void 0 : e,
		"aria-busy": n?.busy === !0,
		"aria-disabled": n ? "true" : void 0,
		style: {
			...t ? $.cueRow : $.gateRow,
			position: "relative",
			...n ? z.disabledRow : {},
			...n?.actions ? z.failedRow : {}
		},
		children: [
			r ? /* @__PURE__ */ (0, U.jsx)("div", {
				inert: o,
				style: {
					...$.gateStatus,
					...n ? z.disabledContent : {}
				},
				children: r
			}) : null,
			/* @__PURE__ */ (0, U.jsx)("span", {
				inert: o,
				style: {
					...$.gateText,
					...n ? z.disabledContent : {}
				},
				children: i
			}),
			/* @__PURE__ */ (0, U.jsx)("div", {
				inert: o && !n?.actions,
				style: {
					...$.gateAction,
					...n?.actions ? $.recovery : n ? z.disabledContent : {}
				},
				children: n?.actions ?? (a ? /* @__PURE__ */ (0, U.jsx)(Ui, {
					label: t ? "Dismiss cue" : "Clear gate",
					disabled: o,
					onConfirm: () => a(e)
				}) : null)
			}),
			n?.busy ? /* @__PURE__ */ (0, U.jsx)("div", {
				role: "progressbar",
				"aria-label": "Processing acknowledgment",
				style: z.progress,
				children: /* @__PURE__ */ (0, U.jsx)("span", {
					className: "metadata-row-progress",
					style: z.progressFill
				})
			}) : null
		]
	});
}
//#endregion
//#region src/features/iq/component/IqNote.tsx
function Gi({ note: e }) {
	let t = e.message.startsWith("WARNING: ");
	return /* @__PURE__ */ (0, U.jsx)(Ee, {
		className: "iq-note",
		label: "note",
		text: t ? e.message.slice(9) : e.message,
		style: $.noteRow,
		children: (n) => /* @__PURE__ */ (0, U.jsxs)("p", {
			"data-status": e.status,
			style: $.noteText,
			children: [e.segment === null ? null : /* @__PURE__ */ (0, U.jsx)("strong", { children: e.segment }), /* @__PURE__ */ (0, U.jsxs)("span", { children: [t ? /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [/* @__PURE__ */ (0, U.jsx)("span", {
				style: {
					color: Bi.amber.fg,
					fontWeight: 700
				},
				children: "WARNING:"
			}), " "] }) : null, n] })]
		})
	});
}
//#endregion
//#region src/features/iq/component/IqNotes.tsx
function Ki({ notes: e, onRetry: t }) {
	return /* @__PURE__ */ (0, U.jsx)(F, {
		title: "IQ notes",
		resetKey: e,
		children: e.error === null ? e.data.length > 0 ? /* @__PURE__ */ (0, U.jsx)("div", {
			style: $.notes,
			children: [...e.data].reverse().map((e, t) => /* @__PURE__ */ (0, U.jsx)(Gi, { note: e }, t))
		}) : null : /* @__PURE__ */ (0, U.jsx)(ve, {
			title: "IQ notes",
			detail: e.error,
			onRetry: t
		})
	});
}
//#endregion
//#region src/features/iq/component/IqPlaceholder.tsx
function qi({ margin: e, title: t }) {
	return /* @__PURE__ */ (0, U.jsxs)("div", {
		style: {
			...$.summaryCard,
			margin: e
		},
		children: [/* @__PURE__ */ (0, U.jsxs)("div", {
			"aria-hidden": "true",
			children: [/* @__PURE__ */ (0, U.jsx)("span", { style: {
				...B,
				width: "6rem",
				height: $.metricNumber.fontSize
			} }), /* @__PURE__ */ (0, U.jsx)("span", { style: {
				...B,
				...$.metricSubtext,
				width: "4.5rem",
				height: "1lh"
			} })]
		}), /* @__PURE__ */ (0, U.jsxs)("div", { children: [/* @__PURE__ */ (0, U.jsx)("div", {
			style: $.metricLabel,
			children: t
		}), /* @__PURE__ */ (0, U.jsx)("div", {
			"aria-hidden": "true",
			style: {
				...B,
				...$.metricTrack
			}
		})] })]
	});
}
function Ji({ tab: e }) {
	return e === "Notes" ? /* @__PURE__ */ (0, U.jsx)(ye, {
		label: "Loading IQ notes",
		children: /* @__PURE__ */ (0, U.jsx)("div", {
			"aria-hidden": "true",
			style: $.notes,
			children: ["90%", "70%"].map((e) => /* @__PURE__ */ (0, U.jsx)("div", {
				style: $.noteRow,
				children: /* @__PURE__ */ (0, U.jsx)("p", {
					style: $.noteText,
					children: /* @__PURE__ */ (0, U.jsx)("span", { style: {
						...B,
						width: e
					} })
				})
			}, e))
		})
	}) : /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [e === "Quality" && /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [/* @__PURE__ */ (0, U.jsxs)(ye, {
		label: "Loading IQ summary",
		children: [/* @__PURE__ */ (0, U.jsx)("div", {
			style: $.panelHeader,
			children: /* @__PURE__ */ (0, U.jsx)(qi, {
				margin: $.summaryCard.margin,
				title: "Indexing Quality (IQ)"
			})
		}), /* @__PURE__ */ (0, U.jsx)("div", { style: $.divider })]
	}), /* @__PURE__ */ (0, U.jsx)(ye, {
		label: "Loading indexing segments",
		children: /* @__PURE__ */ (0, U.jsxs)("table", {
			style: $.segmentTable,
			children: [/* @__PURE__ */ (0, U.jsx)("thead", { children: /* @__PURE__ */ (0, U.jsx)("tr", { children: [
				"Segment",
				"Expected",
				"Actual",
				"IQ"
			].map((e, t) => /* @__PURE__ */ (0, U.jsx)("th", {
				style: $.segmentHeaderCell(t === 0 ? "left" : "right"),
				children: e
			}, e)) }) }), /* @__PURE__ */ (0, U.jsx)("tbody", {
				"aria-hidden": "true",
				children: [
					"75%",
					"55%",
					"65%"
				].map((e) => /* @__PURE__ */ (0, U.jsx)("tr", { children: [
					0,
					1,
					2,
					3
				].map((t) => /* @__PURE__ */ (0, U.jsx)("td", {
					style: $.segmentCell(t === 0 ? "left" : "right"),
					children: /* @__PURE__ */ (0, U.jsx)("span", {
						style: {
							alignItems: "center",
							display: "flex",
							height: "1lh",
							justifyContent: t === 0 ? "flex-start" : "flex-end"
						},
						children: /* @__PURE__ */ (0, U.jsx)("span", { style: {
							...B,
							width: t === 0 ? e : "2rem"
						} })
					})
				}, t)) }, e))
			})]
		})
	})] }), e === "Compliance" && /* @__PURE__ */ (0, U.jsxs)(ye, {
		label: "Loading IQ gates",
		children: [/* @__PURE__ */ (0, U.jsx)(qi, {
			margin: $.summaryCard.margin,
			title: "Compliance Gates"
		}), /* @__PURE__ */ (0, U.jsx)("ul", {
			"aria-hidden": "true",
			style: $.gateList,
			children: ["90%", "70%"].map((e) => /* @__PURE__ */ (0, U.jsxs)("li", {
				style: $.gateRow,
				children: [/* @__PURE__ */ (0, U.jsx)("span", { style: {
					...B,
					width: "5rem"
				} }), /* @__PURE__ */ (0, U.jsx)("span", { style: {
					...B,
					width: e
				} })]
			}, e))
		})]
	})] });
}
//#endregion
//#region src/features/iq/component/IqView.tsx
var Yi = [
	"Quality",
	"Compliance",
	"Notes"
];
function Xi({ view: e, pendingChanges: t, onAck: n, onAckCue: r, onRetry: i }) {
	let { active: a, controls: o, panel: s } = Ve(Yi, "IQ views", {
		storageKey: "aurorra-index:iq-tab",
		className: "iq-tabs",
		style: $.tabs,
		tabStyle: $.tab,
		hideSingle: !1
	});
	if (e === null) return /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [
		/* @__PURE__ */ (0, U.jsx)("style", { children: Hi }),
		o,
		/* @__PURE__ */ (0, U.jsx)("div", {
			"data-panel-scroll": "true",
			style: $.content,
			children: /* @__PURE__ */ (0, U.jsx)("div", {
				...s,
				className: "iq-content",
				children: Yi.map((e) => /* @__PURE__ */ (0, U.jsx)("div", {
					hidden: a !== e,
					children: /* @__PURE__ */ (0, U.jsx)(Ji, { tab: e })
				}, e))
			})
		})
	] });
	let { iq: c, gates: l, segments: u, notes: d } = e;
	return /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [
		/* @__PURE__ */ (0, U.jsxs)("style", { children: [Hi, Re] }),
		o,
		/* @__PURE__ */ (0, U.jsx)("div", {
			"data-panel-scroll": "true",
			style: $.content,
			children: /* @__PURE__ */ (0, U.jsxs)("div", {
				...s,
				className: "iq-content",
				children: [
					/* @__PURE__ */ (0, U.jsxs)("div", {
						hidden: a !== "Quality",
						children: [
							/* @__PURE__ */ (0, U.jsx)("div", {
								style: $.panelHeader,
								children: /* @__PURE__ */ (0, U.jsx)(F, {
									title: "IQ summary",
									resetKey: e,
									children: c.error === null ? /* @__PURE__ */ (0, U.jsxs)("div", {
										style: $.summaryCard,
										children: [/* @__PURE__ */ (0, U.jsxs)("div", { children: [/* @__PURE__ */ (0, U.jsxs)("div", {
											style: {
												...$.metricNumber,
												color: Bi[c.data.bucket].fg
											},
											children: [c.data.displayInt, "%"]
										}), /* @__PURE__ */ (0, U.jsx)("div", {
											style: $.metricSubtext,
											children: "out of 100"
										})] }), /* @__PURE__ */ (0, U.jsxs)("div", { children: [/* @__PURE__ */ (0, U.jsx)("div", {
											style: $.metricLabel,
											children: "Indexing Quality (IQ)"
										}), /* @__PURE__ */ (0, U.jsx)("div", {
											style: $.metricTrack,
											children: /* @__PURE__ */ (0, U.jsx)("div", { style: $.metricFill(c.data.bucket, c.data.value) })
										})] })]
									}) : /* @__PURE__ */ (0, U.jsx)(ve, {
										title: "IQ summary",
										detail: c.error,
										onRetry: i
									})
								})
							}),
							/* @__PURE__ */ (0, U.jsx)("div", { style: $.divider }),
							/* @__PURE__ */ (0, U.jsx)(F, {
								title: "Indexing segments",
								resetKey: e,
								children: u.error === null ? /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [/* @__PURE__ */ (0, U.jsxs)("table", {
									style: $.segmentTable,
									children: [/* @__PURE__ */ (0, U.jsx)("thead", { children: /* @__PURE__ */ (0, U.jsxs)("tr", { children: [
										/* @__PURE__ */ (0, U.jsx)("th", {
											style: $.segmentHeaderCell("left"),
											children: "Segment"
										}),
										/* @__PURE__ */ (0, U.jsx)("th", {
											style: $.segmentHeaderCell("right"),
											children: "Expected"
										}),
										/* @__PURE__ */ (0, U.jsx)("th", {
											style: $.segmentHeaderCell("right"),
											children: "Actual"
										}),
										/* @__PURE__ */ (0, U.jsx)("th", {
											style: $.segmentHeaderCell("right"),
											children: "IQ"
										})
									] }) }), /* @__PURE__ */ (0, U.jsx)("tbody", { children: u.data.map((e) => /* @__PURE__ */ (0, U.jsxs)("tr", { children: [
										/* @__PURE__ */ (0, U.jsx)("td", {
											style: $.segmentCell("left"),
											children: e.displayId
										}),
										/* @__PURE__ */ (0, U.jsx)("td", {
											style: $.segmentCell("right"),
											children: e.expectedDisplay
										}),
										/* @__PURE__ */ (0, U.jsx)("td", {
											style: $.segmentCell("right"),
											children: e.actualDisplay
										}),
										/* @__PURE__ */ (0, U.jsx)("td", {
											style: $.segmentCell("right", !0),
											children: e.iqDisplay
										})
									] }, e.id)) })]
								}), u.data.map((e) => /* @__PURE__ */ (0, U.jsx)(F, {
									title: e.displayId,
									resetKey: e,
									fallback: (t) => /* @__PURE__ */ (0, U.jsx)(he, {
										label: e.displayId,
										error: t.message
									}),
									children: e.explanations.error !== null || e.cues.error !== null || e.explanations.data.length > 0 || e.cues.data.length > 0 ? /* @__PURE__ */ (0, U.jsxs)("div", {
										"data-status": "warning",
										style: $.explanationBlock,
										children: [
											/* @__PURE__ */ (0, U.jsxs)("div", {
												style: $.explanationTitle,
												children: ["Segment: ", e.displayId]
											}),
											e.explanations.error === null ? e.explanations.data.length > 0 ? /* @__PURE__ */ (0, U.jsx)("ul", {
												style: $.explanationList,
												children: e.explanations.data.map((e, t) => /* @__PURE__ */ (0, U.jsx)("li", { children: e }, t))
											}) : null : /* @__PURE__ */ (0, U.jsx)(he, {
												label: e.displayId,
												error: e.explanations.error
											}),
											e.cues.error === null ? /* @__PURE__ */ (0, U.jsx)("ul", {
												style: $.gateList,
												children: e.cues.data.map((e) => /* @__PURE__ */ (0, U.jsx)(Wi, {
													code: e.code,
													cue: !0,
													pending: t.get(e.code),
													onAck: r,
													children: e.description
												}, e.code))
											}) : /* @__PURE__ */ (0, U.jsx)(he, {
												label: `${e.displayId} cues`,
												error: e.cues.error
											})
										]
									}) : null
								}, e.id))] }) : /* @__PURE__ */ (0, U.jsx)(ve, {
									title: "Indexing segments",
									detail: u.error,
									onRetry: i
								})
							})
						]
					}),
					/* @__PURE__ */ (0, U.jsx)("div", {
						hidden: a !== "Compliance",
						children: /* @__PURE__ */ (0, U.jsx)(F, {
							title: "Compliance gates",
							resetKey: e,
							children: l.error === null ? /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [/* @__PURE__ */ (0, U.jsxs)("div", {
								style: $.summaryCard,
								children: [/* @__PURE__ */ (0, U.jsxs)("div", { children: [/* @__PURE__ */ (0, U.jsxs)("div", {
									style: {
										...$.metricNumber,
										color: Bi[l.data.bucket].fg
									},
									children: [l.data.displayPercent, "%"]
								}), /* @__PURE__ */ (0, U.jsxs)("div", {
									style: $.metricSubtext,
									children: [
										"out of ",
										l.data.total,
										" gates"
									]
								})] }), /* @__PURE__ */ (0, U.jsxs)("div", { children: [/* @__PURE__ */ (0, U.jsx)("div", {
									style: $.metricLabel,
									children: "Compliance Gates"
								}), /* @__PURE__ */ (0, U.jsx)("div", {
									style: $.metricTrack,
									children: /* @__PURE__ */ (0, U.jsx)("div", { style: $.metricFill(l.data.bucket, l.data.displayPercent) })
								})] })]
							}), l.data.items.length === 0 ? /* @__PURE__ */ (0, U.jsx)("div", {
								style: $.empty,
								children: "None"
							}) : /* @__PURE__ */ (0, U.jsx)("ul", {
								style: $.gateList,
								children: l.data.items.map((e) => /* @__PURE__ */ (0, U.jsx)(Wi, {
									code: e.code,
									cue: !1,
									pending: t.get(e.code),
									onAck: e.clearable ? n : void 0,
									status: /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [e.status === "success" ? /* @__PURE__ */ (0, U.jsx)(Te, {}) : /* @__PURE__ */ (0, U.jsx)("span", {
										"aria-hidden": "true",
										style: $.gateFlag(e.status)
									}), /* @__PURE__ */ (0, U.jsx)("span", { children: e.label })] }),
									children: e.description.split(/(?<=^Compliance is (?:not )?satisfied\.)(?=\s*\S)/).map((e, t) => /* @__PURE__ */ (0, U.jsxs)(oe, { children: [t > 0 ? /* @__PURE__ */ (0, U.jsx)("br", {}) : null, e] }, t))
								}, e.code))
							})] }) : /* @__PURE__ */ (0, U.jsx)(ve, {
								title: "Compliance gates",
								detail: l.error,
								onRetry: i
							})
						})
					}),
					/* @__PURE__ */ (0, U.jsx)("div", {
						hidden: a !== "Notes",
						children: /* @__PURE__ */ (0, U.jsx)(Ki, {
							notes: d,
							onRetry: i
						})
					})
				]
			})
		})
	] });
}
//#endregion
//#region src/features/iq/component/IqProgress.tsx
var Zi = [
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
function Qi({ intervalMs: e }) {
	let [t, n] = P(0);
	return A(() => {
		if (t === Zi.length - 1) return;
		let r = window.setTimeout(() => n(t + 1), e);
		return () => window.clearTimeout(r);
	}, [e, t]), /* @__PURE__ */ (0, U.jsx)(we, {
		autoScroll: !0,
		highlightLast: !0,
		fillCompletion: !1,
		intro: "I’ll keep you updated as I generate the IQ report.",
		jobs: Zi.slice(0, t + 1).map((e, n) => ({
			...e,
			phase: n < t ? "completed" : "started"
		})),
		process: "GENERATING IQ REPORT"
	});
}
//#endregion
//#region src/features/iq/component/IqPanel.tsx
function $i(e) {
	let { ackCue: t, ackGate: n, loadReport: r, report: i, retryAttempt: a, status: o, view: s } = zi(e), c = o === "idle" || o === "loading", l = Ri((e) => e.tasks), u = new Map(l.filter((t) => t.session === e.session).map((e) => [e.code, {
		busy: e.status !== "failed",
		actions: e.status === "failed" ? /* @__PURE__ */ (0, U.jsx)(ue, {
			error: e.error,
			onRetry: () => Ri.getState().retry(e.id),
			onCancel: () => Ri.getState().cancel(e.id)
		}) : null
	}]));
	return o === "refreshing" ? /* @__PURE__ */ (0, U.jsx)(Qi, { intervalMs: e.retryIntervalMs }, `${e.session}-${a}-generate`) : o === "error" && i === null ? null : /* @__PURE__ */ (0, U.jsx)("section", {
		"aria-label": "Indexing Quality",
		style: $.root,
		children: !c && s === null ? /* @__PURE__ */ (0, U.jsx)("div", {
			style: $.empty,
			children: "No IQ report found."
		}) : /* @__PURE__ */ (0, U.jsx)(Xi, {
			view: c ? null : s,
			pendingChanges: u,
			onAck: n,
			onAckCue: t,
			onRetry: r
		}, e.session)
	});
}
//#endregion
//#region src/features/iq/hook/useIqRefresh.ts
function ea() {
	let e = n((e) => e.etag), t = n((e) => e.reportEtag), r = n((e) => e.metadataEtag), i = n((e) => e.verificationEtag), a = n((e) => e.verificationModel?.etag), o = n((e) => e.activeSession), s = x((e) => e.session === o ? e.etag : void 0);
	return typeof e == "string" && typeof t == "string" && e !== t || typeof r == "string" && s !== void 0 && r !== s || typeof i == "string" && typeof a == "string" && i !== a;
}
//#endregion
//#region src/features/queue/data/queueBlockers.ts
function ta(e) {
	let { tasks: t } = l.getState();
	return t.length ? [{
		id: "index",
		title: "Index changes",
		items: t.map((e) => {
			let t = e.changes.slice(e.cursor).map((e) => "segment" in e ? L(e.action) : `${L(e.patch?.action ?? e.action)} · ${L(e.index.aspect)} · ${e.index.value}`);
			return `${e.session} · ${L(e.segment)} · ${L(e.status)} · ${t.length ? t.join("; ") : "Refreshing metadata"}`;
		}),
		cancel: () => l.getState().reset()
	}] : [];
}
//#endregion
//#region src/features/indexing/style/summaryStyles.ts
var na = "\n.index-summary-counts { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n.index-summary-metric { flex-direction: row; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; }\n.index-summary-score { padding: 0.8rem 1rem; }\n@media (max-width: 36rem) {\n  .index-summary-counts { grid-template-columns: minmax(0, 1fr); }\n}\n@container summary (max-width: 22rem) {\n  .index-summary-score { padding: 0.6rem 0.375rem; }\n}\n", ra = {
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
};
//#endregion
//#region src/features/indexing/component/IndexSummary.tsx
function ia({ label: e, value: t, error: n, score: r, bucket: i }) {
	return /* @__PURE__ */ (0, U.jsxs)("div", {
		className: `index-summary-metric${r ? " index-summary-score" : ""}`,
		style: {
			...ra.metric,
			...r ? ra.score : {}
		},
		children: [/* @__PURE__ */ (0, U.jsx)("dt", {
			style: {
				...ra.label,
				...r ? ra.scoreLabel : {}
			},
			children: e
		}), /* @__PURE__ */ (0, U.jsx)("dd", {
			style: {
				...ra.value,
				...r ? ra.percent : {},
				...i ? { color: Bi[i].fg } : {}
			},
			children: n === null ? t === null ? /* @__PURE__ */ (0, U.jsx)(ye, {
				label: `Loading ${e}`,
				children: /* @__PURE__ */ (0, U.jsx)("span", {
					"aria-hidden": "true",
					style: {
						...B,
						height: "1em",
						width: "3ch"
					}
				})
			}) : /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [
				t,
				r ? "%" : null,
				r ? /* @__PURE__ */ (0, U.jsx)("span", {
					role: "meter",
					"aria-label": e,
					"aria-valuemin": 0,
					"aria-valuemax": 100,
					"aria-valuenow": t,
					"aria-valuetext": `${t}%`,
					style: {
						...ze.bar,
						...ra.meter
					},
					children: /* @__PURE__ */ (0, U.jsx)("span", { style: {
						...ze.fill,
						...i ? { backgroundColor: Bi[i].bar } : {},
						width: `${t}%`
					} })
				}) : null
			] }) : /* @__PURE__ */ (0, U.jsx)(he, {
				label: e,
				error: n
			})
		})]
	});
}
function aa({ data: e, error: t }) {
	let n = e, r = n ? je(n) : null, i = n && r ? D([
		...n.parties ? r.parties : [],
		...n.indexes ?? [],
		...r.execution?.indexes ?? []
	]) : null;
	return /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [/* @__PURE__ */ (0, U.jsx)(ia, {
		label: "Indexes",
		value: i?.length ?? null,
		error: t
	}), /* @__PURE__ */ (0, U.jsx)(ia, {
		label: "Ambiguities",
		value: i ? i.filter((e) => Ie(e.ambiguous)).length : null,
		error: t
	})] });
}
function oa({ data: e, error: t }) {
	let n = e ? Oi(e) : null;
	return /* @__PURE__ */ (0, U.jsxs)(U.Fragment, { children: [/* @__PURE__ */ (0, U.jsx)(ia, {
		label: "IQ",
		value: n?.iq.data?.displayInt ?? null,
		error: t ?? n?.iq.error ?? null,
		bucket: n?.iq.data?.bucket,
		score: !0
	}), /* @__PURE__ */ (0, U.jsx)(ia, {
		label: "Compliance",
		value: n?.gates.data?.displayPercent ?? null,
		error: t ?? n?.gates.error ?? null,
		bucket: n?.gates.data?.bucket,
		score: !0
	})] });
}
function sa({ metadata: e, iq: t }) {
	return /* @__PURE__ */ (0, U.jsxs)("section", {
		"aria-label": "Indexing results",
		style: ra.root,
		children: [
			/* @__PURE__ */ (0, U.jsx)("style", { children: na }),
			/* @__PURE__ */ (0, U.jsx)("dl", {
				className: "index-summary-counts",
				style: ra.counts,
				children: /* @__PURE__ */ (0, U.jsx)(F, {
					title: "Index counts",
					resetKey: e.data,
					fallback: (e) => /* @__PURE__ */ (0, U.jsx)(aa, {
						data: null,
						error: e.message
					}),
					children: /* @__PURE__ */ (0, U.jsx)(aa, { ...e })
				})
			}),
			/* @__PURE__ */ (0, U.jsx)("dl", {
				style: ra.scores,
				children: /* @__PURE__ */ (0, U.jsx)(F, {
					title: "IQ scores",
					resetKey: t.data,
					fallback: (e) => /* @__PURE__ */ (0, U.jsx)(oa, {
						data: null,
						error: e.message
					}),
					children: /* @__PURE__ */ (0, U.jsx)(oa, { ...t })
				})
			})
		]
	});
}
//#endregion
//#region src/public-api.ts
var ca = se(async () => ({ default: (await import("./ImageViewerPanel-C61tf3HX.js")).ImageViewerPanel }));
//#endregion
export { w as AddIndexPanel, _r as AddressMapContent, ci as AuditPanel, pr as DEFAULT_ADDRESS_MAP_ZOOM, Mn as EditIndexPanel, fi as GATE_FAIL, mi as GATE_INFO, di as GATE_PASS, pi as GATE_WARNING, ca as ImageViewerPanel, Fn as IndexContainer, Fn as IndexMetadata, sa as IndexSummary, $i as IqPanel, ur as LegalMapContent, An as MetadataPanel, xr as PageSegmentsPanel, gi as UI_FAIL, hi as UI_PASS, _i as UI_WARNING, qe as UsagePanel, O as addIndexStoreApi, hr as appendAddressMapZoom, c as auditStoreApi, mr as buildAddressMapEmbedUrl, re as createAuditWorkerClient, fr as createDeferredState, Mi as createIqWorkerClient, g as createMetadataClient, S as createPageSegmentsWorkerClient, h as editIndexStoreApi, kt as formatLocation, ji as generateIqReport, ta as getBlockers, at as getElements, vn as getMapGroups, Dt as getPresentLayers, W as getVal, f as imageViewerStoreApi, T as indexStoreApi, Ri as iqQueueStore, r as iqStoreApi, Ot as isAllEmptyStructure, it as isBlank, Qe as loadChoices, ne as loadImagePackage, Ii as loadIqReport, Jr as normalizeAuditReport, Ei as normalizeIqReport, Nt as normalizeLegalData, y as pageSegmentsStoreApi, Yr as prepareAuditReport, Oi as prepareIqReport, l as queueStoreApi, Li as refreshIqReport, vr as requestResource, C as selectSession, e as storeApi, Et as toPlatJSON, ae as useAddIndexStore, Sr as useAuditReport, u as useAuditStore, ie as useEditIndexStore, t as useImageViewerStore, b as useIndexStore, ea as useIqRefresh, zi as useIqReport, n as useIqStore, p as usePageSegmentsStore, x as useQueueStore, te as useStore, Je as useUsage };
