import { A as e, C as t, I as n, S as r, T as i, o as a, s as o, t as s, v as c, w as l } from "./loadImagePackage-MZXAHWne.js";
import { useCallback as u, useEffect as d, useLayoutEffect as f, useMemo as p, useRef as m, useState as h } from "react";
import { ConfButton as g, composeMetadataJSON as ee, iconButtonStyle as _, rowStyles as v } from "aurora-core";
import * as y from "@radix-ui/react-popover";
import * as b from "@radix-ui/react-tooltip";
//#region src/features/imageviewer/data/matchSelection.ts
var x = 80;
function S(e, t) {
	let n = e.toLowerCase().match(/[a-z0-9#]+/g) ?? [], r = t.toLowerCase().match(/[a-z0-9#]+/g) ?? [];
	if (!n.length || !r.length) return 0;
	let i = Array.from({ length: r.length + 1 }, () => 0);
	for (let e of n) {
		let t = [i[0] + 1];
		for (let n = 1; n <= r.length; n += 1) t[n] = Math.min(t[n - 1] + 1, i[n] + 1, i[n - 1] + Number(e !== r[n - 1]));
		i = t;
	}
	return Math.max(0, (n.length - i.reduce((e, t) => Math.min(e, t), n.length)) * 100 / n.length);
}
function C(e, t) {
	let { values: n, context: r } = a(e), i = null, s = -1, c = -1, l = !1, u = t.parties ? t.indexes?.filter((e) => e.segment !== "party") : t.indexes, d = t.parties ? o([...t.parties.indexes, ...t.indexes?.filter((e) => e.segment === "party") ?? []]) : [], f = t.legals?.groups || t.legals?.legalGroups || t.legals?.LegalGroups || t.legals?.items || [];
	for (let [a, o] of [
		[u ?? [], null],
		[d, "party"],
		[t.secrets ?? [], "secrets"],
		[f.filter((e) => e.elements?.length).map((e) => ({
			...e,
			value: e.type
		})), "legal"]
	]) for (let t of a) {
		let a = o ?? (t.segment === "loan" ? "monetary" : t.segment);
		if (!t.code || !a) continue;
		let u = S(n, t.original ?? t.value ?? ""), d = S(r, t.source ?? ""), f = Math.max(u, d);
		if (f < x) continue;
		let p = Math.min(u, d), m = String(t.page ?? t.page_number) === e.pageName;
		(f > s || f === s && (p > c || p === c && m && !l)) && (i = {
			code: t.code,
			segment: a
		}, s = f, c = p, l = m);
	}
	return i;
}
//#endregion
//#region src/features/imageviewer/hook/useImageViewer.ts
function w(e, t) {
	let n = e.metadataIndex ? `${e.metadataIndex.label}:${e.metadataIndex.value}:${e.metadataIndex.source}:${e.metadataIndex.ambiguous}` : `${e.value}:${e.quote}`;
	return `${e.session}:${t}:${e.page}:${e.code}:${e.index}:${e.segment}:${n}:${e.highlightOptions.scroll}`;
}
function T(e, t) {
	return t.metadataIndex ? (console.info("imageviewer lens highlight index request", {
		page: t.page,
		session: t.session,
		sourceLength: t.metadataIndex.source.length,
		valueLength: t.metadataIndex.value.length
	}), e.highlightIndex(t.page, t.metadataIndex, { additive: !1 })) : t.value ? (console.info("imageviewer lens search request", {
		contextLength: t.quote.length,
		page: t.page,
		session: t.session,
		valueLength: t.value.length
	}), e.search(t.value, {
		additive: !1,
		context: t.quote || null
	})) : t.quote ? (console.info("imageviewer lens search request", {
		contextLength: 0,
		page: t.page,
		session: t.session,
		valueLength: t.quote.length
	}), e.search(t.quote, {
		additive: !1,
		context: null
	})) : (e.clearSelection(), null);
}
function E() {
	let e = t((e) => e.pageSize), [n, a] = h(null), [o, s] = h(null), [c, g] = h(!1), ee = m(null), _ = m(null), v = m(null), y = m(null), b = m(0), x = m(0), S = m(""), C = m(0), E = m(0), [D, O] = h(0), [k, A] = h(!1), [j, M] = h(null), [N, P] = h(!1), [F, I] = h(0), [L, te] = h(!1), [R, z] = h(!1), B = t((e) => e.packageVersion), V = t((e) => e.fitPageVersion), H = t((e) => e.request), U = t((e) => e.error), W = t((e) => e.requestVersion), G = t((e) => e.session), K = t((e) => e.packageMetadata), q = t((e) => e.searchText), ne = t((e) => e.tiffBytes), re = t((e) => e.tiffType), J = t((e) => e.viewerState), ie = t((e) => e.viewerStatus), ae = t((e) => e.status), oe = n?.session === G && n.base === e ? n.config : e, Y = u((e, t) => {
		let n = i(e, t);
		if (n.code === "page_size" && n.details) {
			s(n.details), g(!0), A(!1), r.getState().setViewerStatus("idle");
			return;
		}
		r.getState().setError(n);
	}, []), se = u(() => {
		!o || !e || !G || r.getState().session !== G || a({
			session: G,
			base: e,
			config: {
				...e,
				tolerance: o.requiredTolerance
			}
		});
	}, [
		e,
		G,
		o
	]), ce = u(() => {
		s(null);
	}, []), X = p(() => {
		if (!H || H.session !== G || !k || !_.current) return {
			page: null,
			error: null
		};
		try {
			return {
				page: _.current.resolvePage(H.page),
				error: null
			};
		} catch (e) {
			return {
				page: null,
				error: i(e, "Document page is unavailable.")
			};
		}
	}, [
		k,
		H,
		G,
		J?.pageCount
	]), Z = X.page, Q = !!(!X.error && k && J?.status === "ready" && J.pageIndex >= 0), $ = !!(Q && J?.pageInfo);
	d(() => {
		let e = r.getState();
		e.request !== H || e.packageMetadata !== K || e.session !== G || X.error && (S.current = "", U !== X.error && e.setError(X.error));
	}, [
		U,
		K,
		H,
		X,
		G
	]), f(() => {
		a(null);
	}, [e, G]), f(() => {
		let e = ee.current;
		if (!e || !G || !oe) return;
		s(null), g(!1);
		let t = e, n = G, i = !1, a = null, o = null;
		async function c(e) {
			let { AuroraLens: s, IndexedDbViewerSessionStore: c } = await import("./dist-CfPlmbH5.js");
			i || (console.info("imageviewer lens create", { session: G }), a = new s(t, {
				pageSize: e,
				allowEdit: !1,
				selectionTheme: { intelligence: {
					fill: "rgba(0, 128, 128, 0.12)",
					stroke: "#008080"
				} },
				sessionStore: new c(),
				sessionId: n,
				onError: (e) => {
					i || _.current !== o || Y(e, "Image viewer failed.");
				},
				onStateChange: (e) => {
					i || _.current !== o || r.getState().setViewerState(e);
				},
				onStatusChange: (e) => {
					i || _.current !== o || r.getState().setViewerStatus(e);
				}
			}), o = a, _.current = a, P(!0));
		}
		return c(oe).catch((e) => {
			i || Y(e, "Image viewer could not be initialized.");
		}), () => {
			console.info("imageviewer lens close", {
				decodedPackageVersion: b.current,
				decodedSession: y.current,
				session: G
			}), i = !0, a?.close(), r.getState().resetLens(), _.current = null, A(!1), P(!1), te(!1), z(!1), v.current = null, y.current = null, b.current = 0, x.current = 0, S.current = "", C.current = 0, E.current = 0, O(0), I(0);
		};
	}, [
		oe,
		Y,
		G
	]), d(() => {
		let e = _.current;
		if (!N || !e || !G) return;
		let t = e, n = G, i = !1;
		async function a() {
			try {
				console.info("imageviewer lens restore start", { session: n });
				let e = await t.restoreSession();
				if (console.info("imageviewer lens restore done", {
					restored: e,
					session: n
				}), i || _.current !== t) return;
				let a = r.getState(), o = !!(a.packageMetadata && a.tiffBytes && a.tiffType !== null);
				e && !o && (A(!0), z(!0), a.setReady());
			} catch (e) {
				!i && _.current === t && Y(e, "Image session could not be restored.");
			} finally {
				!i && _.current === t && te(!0);
			}
		}
		return a(), () => {
			i = !0;
		};
	}, [
		N,
		Y,
		G
	]), d(() => {
		let e = _.current, t = r.getState().request;
		if (c || !L || !N || !e || !t || !K || !ne || re === null || y.current === t.session && b.current === B) return;
		let n = `${t.session}:${B}`;
		if (v.current === n) return;
		let i = e, a = t, o = K, s = B, u = ne, d = re;
		async function f() {
			v.current = n;
			try {
				A(!1), S.current = "", i.clear(), console.info("imageviewer lens metadata load", {
					metadataPages: o.pages.length,
					packageVersion: s,
					session: a.session
				}), i.loadMetadata(o);
				let e = new File([u], "document-image-package.tiff", { type: d });
				console.info("imageviewer lens decode start", {
					page: a.page,
					packageVersion: s,
					previousDecodedPackageVersion: b.current,
					previousDecodedSession: y.current,
					session: a.session,
					tiffBytes: u.byteLength,
					tiffType: d
				}), await i.decodeDoc(e, {
					page: a.page,
					viewMode: "page"
				});
				let t = r.getState();
				if (_.current !== i || t.session !== a.session || t.packageVersion !== s) return;
				y.current = a.session, b.current = s, O(s), A(!0), console.info("imageviewer lens ready", {
					page: a.page,
					packageVersion: s,
					session: a.session
				}), l(t.error) || t.setReady();
			} catch (e) {
				console.info("imageviewer lens error", {
					packageVersion: s,
					session: a.session
				});
				let t = r.getState();
				_.current === i && t.session === a.session && t.packageVersion === s && Y(e, "Image package failed to load.");
			} finally {
				v.current === n && (v.current = null);
			}
		}
		f();
	}, [
		N,
		K,
		B,
		Y,
		H,
		L,
		c,
		ne,
		re
	]), d(() => {
		if (!(!Q || ae !== "ready" || !H || Z === null || W === 0 || J?.pageIndex !== Z || J.pageInfo)) {
			if (E.current !== W) {
				E.current = W, C.current = D, console.info("imageviewer lens package reload requested", {
					decodedVersion: D,
					packageVersion: B,
					page: H.page,
					requestVersion: W,
					session: H.session,
					viewerPageIndex: J.pageIndex
				}), I(W);
				return;
			}
			D > C.current && r.getState().setError({
				code: "image_metadata_unavailable",
				error: "Image package metadata is unavailable for this page."
			});
		}
	}, [
		D,
		Z,
		Q,
		H,
		W,
		ae,
		J
	]), d(() => {
		let e = _.current;
		if (!e || !Q || !H || Z === null || v.current) return;
		let t = `${w(H, W)}:${Z}`;
		if (S.current === t) return;
		if (J?.viewMode !== "page" || J.pageIndex !== Z) {
			console.info("imageviewer lens sync request", {
				code: H.code,
				page: H.page,
				segment: H.segment,
				session: H.session
			}), e.goToPage(H.page).catch(() => void 0);
			return;
		}
		S.current = t, l(r.getState().error) && r.getState().setReady();
		let n = T(e, H);
		M(H.metadataIndex && n === !1 ? t : null);
	}, [
		Z,
		Q,
		H,
		W,
		J?.pageIndex,
		J?.viewMode
	]), d(() => {
		let e = _.current;
		!e || !Q || !J?.canFitPage || V === 0 || x.current === V || (x.current = V, console.info("imageviewer lens action", { action: "fitPage" }), e.fitPage());
	}, [
		V,
		Q,
		J?.canFitPage
	]);
	let le = u(() => {
		!Q || !J?.canGoPrevious || (console.info("imageviewer lens action", { action: "previousPage" }), _.current?.previousPage().catch(() => void 0));
	}, [Q, J?.canGoPrevious]), ue = u(() => {
		!Q || !J?.canGoNext || (console.info("imageviewer lens action", { action: "nextPage" }), _.current?.nextPage().catch(() => void 0));
	}, [Q, J?.canGoNext]), de = u(() => {
		!Q || !J?.canGoFirst || (console.info("imageviewer lens action", { action: "firstPage" }), _.current?.firstPage().catch(() => void 0));
	}, [Q, J?.canGoFirst]), fe = u(() => {
		!Q || !J?.canGoLast || (console.info("imageviewer lens action", { action: "lastPage" }), _.current?.lastPage().catch(() => void 0));
	}, [Q, J?.canGoLast]), pe = u(() => {
		!$ || !q.trim() || !J?.canSearch || (console.info("imageviewer lens action", {
			action: "search",
			length: q.length
		}), _.current?.search(q, {
			additive: !1,
			context: null
		}));
	}, [
		$,
		q,
		J?.canSearch
	]), me = u(() => {
		console.info("imageviewer lens action", { action: "clearSearch" }), r.getState().setSearchText(""), !(!Q || !J?.canClearSelection) && _.current?.clearSelection();
	}, [Q, J?.canClearSelection]), he = u(async () => {
		if (!Q || !J?.canCopy) return null;
		console.info("imageviewer lens action", { action: "exportSelection" });
		try {
			let e = _.current?.exportSelection();
			if (!e?.length) return null;
			let t = _.current?.readPageName();
			if (!t) throw Error("Document page name is unavailable.");
			return {
				groups: e,
				pageName: t
			};
		} catch (e) {
			return r.getState().setError(i(e, "Could not export selected values.")), null;
		}
	}, [Q, J?.canCopy]), ge = u(async () => {
		if (!(!Q || !J?.canCopy)) {
			console.info("imageviewer lens action", { action: "copySelection" });
			try {
				await _.current?.copySelection();
			} catch (e) {
				r.getState().setError(i(e, "Could not copy selected values."));
			}
		}
	}, [Q, J?.canCopy]), _e = u(() => {
		!$ || !J?.canDraw || (console.info("imageviewer lens action", {
			action: "select",
			enabled: !J.drawMode
		}), _.current?.setDrawMode(!J.drawMode));
	}, [
		$,
		J?.canDraw,
		J?.drawMode
	]), ve = u(() => {
		!Q || !J?.canShowThumbnails || (console.info("imageviewer lens action", { action: "showThumbnails" }), r.getState().setThumbsOpen(!0), _.current?.showThumbnails().catch(() => void 0));
	}, [Q, J?.canShowThumbnails]), ye = u(() => {
		!Q || !J?.canZoomIn || (console.info("imageviewer lens action", { action: "zoomIn" }), _.current?.zoomIn());
	}, [Q, J?.canZoomIn]), be = u(() => {
		!Q || !J?.canZoomOut || (console.info("imageviewer lens action", { action: "zoomOut" }), _.current?.zoomOut());
	}, [Q, J?.canZoomOut]), xe = u(() => {
		!Q || !J?.canFitWidth || (console.info("imageviewer lens action", { action: "fitWidth" }), _.current?.fitWidth());
	}, [Q, J?.canFitWidth]), Se = u(() => {
		!Q || !J?.canFitHeight || (console.info("imageviewer lens action", { action: "fitHeight" }), _.current?.fitHeight());
	}, [Q, J?.canFitHeight]), Ce = u(() => {
		!Q || !J?.canFitPage || (console.info("imageviewer lens action", { action: "fitPage" }), _.current?.fitPage());
	}, [Q, J?.canFitPage]);
	return {
		acceptSize: se,
		cancelSize: ce,
		sizeFailure: o,
		actualSize: u(() => {
			!Q || !J?.canActualSize || (console.info("imageviewer lens action", { action: "actualSize" }), _.current?.actualSize());
		}, [Q, J?.canActualSize]),
		canActualSize: !!(Q && J?.canActualSize),
		canClearSearch: !!(q || Q && J?.canClearSelection),
		canExport: !!(Q && J?.canCopy),
		canFitHeight: !!(Q && J?.canFitHeight),
		canFitPage: !!(Q && J?.canFitPage),
		canFitWidth: !!(Q && J?.canFitWidth),
		canGoFirst: !!(Q && J?.canGoFirst),
		canGoLast: !!(Q && J?.canGoLast),
		canGoNext: !!(Q && J?.canGoNext),
		canGoPrevious: !!(Q && J?.canGoPrevious),
		canSearch: !!($ && J?.canSearch),
		canSelect: !!($ && J?.canDraw),
		canShowThumbnails: !!(Q && J?.canShowThumbnails),
		canZoomIn: !!(Q && J?.canZoomIn),
		canZoomOut: !!(Q && J?.canZoomOut),
		clearSearch: me,
		exportSelection: he,
		copySelection: ge,
		firstPage: de,
		fitHeight: Se,
		fitPage: Ce,
		fitWidth: xe,
		isLoading: !!(!c && !X.error && !Q && J?.status !== "copyingSelection" && H && K && ne && re !== null),
		hasRequestError: !!(c || X.error),
		isNavigating: !c && k && (ie === "loadingPage" || J?.status === "loadingPage"),
		isRestoredSession: R,
		isRestoring: !!(G && (!N || !L)),
		isThumbs: J?.viewMode === "thumbnails",
		lastPage: fe,
		lensHostRef: ee,
		nextPage: ue,
		noMatch: !!(j && H && H.session === G && Q && j === `${w(H, W)}:${Z}`),
		setNoMatch: M,
		page: J && J.pageIndex >= 0 ? J.pageIndex + 1 : 0,
		pageName: J?.pageName,
		pageCount: J?.pageCount ?? 0,
		previousPage: le,
		reloadId: F,
		search: pe,
		selecting: !!J?.drawMode,
		select: _e,
		showThumbnails: ve,
		zoom: J?.zoom,
		zoomIn: ye,
		zoomOut: be
	};
}
//#endregion
//#region src/features/imageviewer/style/imageViewerStyles.ts
var D = {
	sizePrompt: {
		padding: "1rem",
		display: "flex",
		flexDirection: "column",
		gap: "1rem",
		textAlign: "left",
		overflowWrap: "anywhere"
	},
	sizeMessage: {
		margin: 0,
		lineHeight: 1.5
	},
	sizeActions: {
		display: "flex",
		justifyContent: "center",
		gap: "0.75rem",
		width: "100%"
	},
	root: {
		display: "flex",
		flexDirection: "column",
		width: "100%",
		height: "100%",
		minHeight: 0,
		color: "var(--title-ink)",
		boxSizing: "border-box"
	},
	topToolbar: {
		display: "grid",
		position: "relative",
		gridTemplateColumns: "auto minmax(0, 1fr)",
		alignItems: "center",
		gap: "0.6rem",
		flex: "0 0 auto",
		minHeight: "var(--panel-header-height)",
		padding: "var(--panel-header-padding)",
		borderBottom: "1px solid var(--border-card)",
		background: "var(--gray-50)",
		boxSizing: "border-box"
	},
	topToolbarCompact: { gap: "0.3rem" },
	viewGroup: {
		flexWrap: "nowrap",
		display: "flex",
		alignItems: "center",
		justifyContent: "flex-start",
		gap: "0.125rem",
		flex: "0 0 auto",
		minWidth: 0
	},
	scaleGroup: {
		display: "flex",
		alignItems: "center",
		gap: "0.125rem"
	},
	scaleValue: {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		minWidth: "3.5rem",
		height: "2.75rem",
		color: "var(--body-ink)",
		fontSize: "0.82rem",
		fontWeight: 800
	},
	compactScaleValue: { minWidth: "2.25rem" },
	compactButton: {
		width: "2rem",
		minWidth: "2rem",
		height: "2rem",
		minHeight: "2rem"
	},
	compactSelectionGroup: {
		borderLeft: 0,
		marginLeft: 0,
		paddingLeft: 0
	},
	compactSearchSubmit: { flexBasis: "2rem" },
	activeButton: {
		background: "var(--white)",
		boxShadow: "inset 0 0 0 2px var(--primary)",
		color: "var(--primary-dark)"
	},
	menuButton: {
		..._,
		width: "2.75rem"
	},
	menuPopover: {
		display: "grid",
		gap: "0.125rem",
		minWidth: "8rem",
		padding: "0.35rem",
		border: "1px solid var(--border-card)",
		borderRadius: "var(--radius-card)",
		background: "var(--white)",
		boxShadow: "var(--shadow-card)",
		zIndex: 1
	},
	selectionGroup: {
		display: "flex",
		alignItems: "center",
		gap: "0.125rem",
		marginLeft: "0.2rem",
		paddingLeft: "0.5rem",
		borderLeft: "1px solid var(--border-subtle)"
	},
	footerToolbar: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		gap: "0.125rem",
		flex: "0 0 auto",
		minHeight: "2.35rem",
		padding: "0.55rem",
		borderTop: "1px solid var(--border-subtle)",
		background: "var(--gray-50)",
		boxSizing: "border-box"
	},
	icon: {
		display: "block",
		width: "1.15rem",
		height: "1.15rem",
		fill: "none",
		stroke: "currentColor",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		strokeWidth: 1.7
	},
	pageText: {
		minWidth: "6.2rem",
		fontSize: "0.82rem",
		fontWeight: 800,
		color: "var(--body-ink)",
		textAlign: "center"
	},
	searchForm: {
		display: "grid",
		gridTemplateColumns: "minmax(0, 1fr) auto",
		alignItems: "center",
		gap: "0.125rem",
		maxWidth: "none",
		minWidth: 0,
		width: "100%"
	},
	hiddenSearchForm: {
		position: "absolute",
		top: 0,
		left: 0,
		width: 0,
		height: 0,
		overflow: "hidden",
		visibility: "hidden",
		pointerEvents: "none"
	},
	searchBox: {
		display: "flex",
		alignItems: "center",
		minWidth: 0,
		minHeight: "2.75rem",
		border: "1px solid var(--border-card)",
		borderRadius: "var(--radius-control)",
		background: "var(--white)"
	},
	searchInput: {
		width: "100%",
		minWidth: "7rem",
		minHeight: "2.75rem",
		padding: "0 0.5rem",
		border: 0,
		background: "var(--white)",
		color: "var(--title-ink)",
		boxSizing: "border-box"
	},
	searchSubmit: {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		flex: "0 0 2.5rem",
		height: "2.5rem",
		border: 0,
		background: "transparent",
		color: "var(--body-ink)",
		cursor: "pointer"
	},
	lensHost: {
		flex: "1 1 auto",
		width: "100%",
		height: "100%",
		minHeight: "12rem",
		background: "var(--gray-50)"
	},
	body: {
		position: "relative",
		flex: "1 1 auto",
		display: "flex",
		minHeight: "18rem",
		overflow: "hidden"
	},
	matchStatus: {
		position: "absolute",
		top: "0.75rem",
		left: "50%",
		transform: "translateX(-50%)",
		zIndex: 1,
		padding: "0.5rem 0.75rem",
		border: "1px solid var(--border-card)",
		borderRadius: "var(--radius-control)",
		background: "var(--white)",
		boxShadow: "var(--shadow-card)",
		color: "var(--body-ink)",
		fontSize: "0.82rem",
		fontWeight: 700,
		pointerEvents: "none"
	}
}, O = n(), k = "C:/GitHub/Tabularium/aurorra_index/src/features/imageviewer/component/ImageViewerToolbar.tsx";
function A({ name: e }) {
	let t = {
		actualSize: /* @__PURE__ */ (0, O.jsxDEV)(O.Fragment, { children: [
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M7 7h10v10H7z" }, void 0, !1, {
				fileName: k,
				lineNumber: 48,
				columnNumber: 19
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M4 4h4" }, void 0, !1, {
				fileName: k,
				lineNumber: 48,
				columnNumber: 45
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M4 4v4" }, void 0, !1, {
				fileName: k,
				lineNumber: 48,
				columnNumber: 64
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M20 20h-4" }, void 0, !1, {
				fileName: k,
				lineNumber: 48,
				columnNumber: 83
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M20 20v-4" }, void 0, !1, {
				fileName: k,
				lineNumber: 48,
				columnNumber: 105
			}, this)
		] }, void 0, !0, {
			fileName: k,
			lineNumber: 48,
			columnNumber: 17
		}, this),
		clearSearch: /* @__PURE__ */ (0, O.jsxDEV)(O.Fragment, { children: [
			/* @__PURE__ */ (0, O.jsxDEV)("rect", {
				x: "4",
				y: "4",
				width: "16",
				height: "16",
				rx: "2",
				strokeDasharray: "3 2"
			}, void 0, !1, {
				fileName: k,
				lineNumber: 49,
				columnNumber: 20
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "m9 9 6 6" }, void 0, !1, {
				fileName: k,
				lineNumber: 49,
				columnNumber: 92
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "m15 9-6 6" }, void 0, !1, {
				fileName: k,
				lineNumber: 49,
				columnNumber: 113
			}, this)
		] }, void 0, !0, {
			fileName: k,
			lineNumber: 49,
			columnNumber: 18
		}, this),
		copy: /* @__PURE__ */ (0, O.jsxDEV)(O.Fragment, { children: [/* @__PURE__ */ (0, O.jsxDEV)("rect", {
			x: "8",
			y: "8",
			width: "11",
			height: "12",
			rx: "1"
		}, void 0, !1, {
			fileName: k,
			lineNumber: 50,
			columnNumber: 13
		}, this), /* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M16 8V5a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h2" }, void 0, !1, {
			fileName: k,
			lineNumber: 50,
			columnNumber: 63
		}, this)] }, void 0, !0, {
			fileName: k,
			lineNumber: 50,
			columnNumber: 11
		}, this),
		export: /* @__PURE__ */ (0, O.jsxDEV)(O.Fragment, { children: [
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M12 3v12" }, void 0, !1, {
				fileName: k,
				lineNumber: 51,
				columnNumber: 15
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "m8 7 4-4 4 4" }, void 0, !1, {
				fileName: k,
				lineNumber: 51,
				columnNumber: 36
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" }, void 0, !1, {
				fileName: k,
				lineNumber: 51,
				columnNumber: 61
			}, this)
		] }, void 0, !0, {
			fileName: k,
			lineNumber: 51,
			columnNumber: 13
		}, this),
		fitHeight: /* @__PURE__ */ (0, O.jsxDEV)(O.Fragment, { children: [
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M12 4v16" }, void 0, !1, {
				fileName: k,
				lineNumber: 52,
				columnNumber: 18
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "m8 8 4-4 4 4" }, void 0, !1, {
				fileName: k,
				lineNumber: 52,
				columnNumber: 39
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "m8 16 4 4 4-4" }, void 0, !1, {
				fileName: k,
				lineNumber: 52,
				columnNumber: 64
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M6 4h12" }, void 0, !1, {
				fileName: k,
				lineNumber: 52,
				columnNumber: 90
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M6 20h12" }, void 0, !1, {
				fileName: k,
				lineNumber: 52,
				columnNumber: 110
			}, this)
		] }, void 0, !0, {
			fileName: k,
			lineNumber: 52,
			columnNumber: 16
		}, this),
		fitPage: /* @__PURE__ */ (0, O.jsxDEV)(O.Fragment, { children: [
			/* @__PURE__ */ (0, O.jsxDEV)("rect", {
				x: "6",
				y: "4",
				width: "12",
				height: "16",
				rx: "1"
			}, void 0, !1, {
				fileName: k,
				lineNumber: 53,
				columnNumber: 16
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M9 8h6" }, void 0, !1, {
				fileName: k,
				lineNumber: 53,
				columnNumber: 66
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M9 12h6" }, void 0, !1, {
				fileName: k,
				lineNumber: 53,
				columnNumber: 85
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M9 16h4" }, void 0, !1, {
				fileName: k,
				lineNumber: 53,
				columnNumber: 105
			}, this)
		] }, void 0, !0, {
			fileName: k,
			lineNumber: 53,
			columnNumber: 14
		}, this),
		fitWidth: /* @__PURE__ */ (0, O.jsxDEV)(O.Fragment, { children: [
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M4 12h16" }, void 0, !1, {
				fileName: k,
				lineNumber: 54,
				columnNumber: 17
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "m8 8-4 4 4 4" }, void 0, !1, {
				fileName: k,
				lineNumber: 54,
				columnNumber: 38
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "m16 8 4 4-4 4" }, void 0, !1, {
				fileName: k,
				lineNumber: 54,
				columnNumber: 63
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M4 6v12" }, void 0, !1, {
				fileName: k,
				lineNumber: 54,
				columnNumber: 89
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M20 6v12" }, void 0, !1, {
				fileName: k,
				lineNumber: 54,
				columnNumber: 109
			}, this)
		] }, void 0, !0, {
			fileName: k,
			lineNumber: 54,
			columnNumber: 15
		}, this),
		first: /* @__PURE__ */ (0, O.jsxDEV)(O.Fragment, { children: [/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M6 5v14" }, void 0, !1, {
			fileName: k,
			lineNumber: 55,
			columnNumber: 14
		}, this), /* @__PURE__ */ (0, O.jsxDEV)("path", { d: "m18 5-8 7 8 7" }, void 0, !1, {
			fileName: k,
			lineNumber: 55,
			columnNumber: 34
		}, this)] }, void 0, !0, {
			fileName: k,
			lineNumber: 55,
			columnNumber: 12
		}, this),
		last: /* @__PURE__ */ (0, O.jsxDEV)(O.Fragment, { children: [/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M18 5v14" }, void 0, !1, {
			fileName: k,
			lineNumber: 56,
			columnNumber: 13
		}, this), /* @__PURE__ */ (0, O.jsxDEV)("path", { d: "m6 5 8 7-8 7" }, void 0, !1, {
			fileName: k,
			lineNumber: 56,
			columnNumber: 34
		}, this)] }, void 0, !0, {
			fileName: k,
			lineNumber: 56,
			columnNumber: 11
		}, this),
		match: /* @__PURE__ */ (0, O.jsxDEV)(O.Fragment, { children: [
			/* @__PURE__ */ (0, O.jsxDEV)("circle", {
				cx: "10.5",
				cy: "10.5",
				r: "5"
			}, void 0, !1, {
				fileName: k,
				lineNumber: 57,
				columnNumber: 14
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "m14.5 14.5 4.5 4.5" }, void 0, !1, {
				fileName: k,
				lineNumber: 57,
				columnNumber: 50
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "m8.5 10.5 1.5 1.5 3-3" }, void 0, !1, {
				fileName: k,
				lineNumber: 57,
				columnNumber: 81
			}, this)
		] }, void 0, !0, {
			fileName: k,
			lineNumber: 57,
			columnNumber: 12
		}, this),
		more: /* @__PURE__ */ (0, O.jsxDEV)(O.Fragment, { children: [
			/* @__PURE__ */ (0, O.jsxDEV)("circle", {
				cx: "5",
				cy: "12",
				r: "1"
			}, void 0, !1, {
				fileName: k,
				lineNumber: 58,
				columnNumber: 13
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("circle", {
				cx: "12",
				cy: "12",
				r: "1"
			}, void 0, !1, {
				fileName: k,
				lineNumber: 58,
				columnNumber: 44
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("circle", {
				cx: "19",
				cy: "12",
				r: "1"
			}, void 0, !1, {
				fileName: k,
				lineNumber: 58,
				columnNumber: 76
			}, this)
		] }, void 0, !0, {
			fileName: k,
			lineNumber: 58,
			columnNumber: 11
		}, this),
		next: /* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M9 5l8 7-8 7" }, void 0, !1, {
			fileName: k,
			lineNumber: 59,
			columnNumber: 11
		}, this),
		previous: /* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M15 5l-8 7 8 7" }, void 0, !1, {
			fileName: k,
			lineNumber: 60,
			columnNumber: 15
		}, this),
		search: /* @__PURE__ */ (0, O.jsxDEV)(O.Fragment, { children: [/* @__PURE__ */ (0, O.jsxDEV)("circle", {
			cx: "10.5",
			cy: "10.5",
			r: "5"
		}, void 0, !1, {
			fileName: k,
			lineNumber: 61,
			columnNumber: 15
		}, this), /* @__PURE__ */ (0, O.jsxDEV)("path", { d: "m14.5 14.5 4.5 4.5" }, void 0, !1, {
			fileName: k,
			lineNumber: 61,
			columnNumber: 51
		}, this)] }, void 0, !0, {
			fileName: k,
			lineNumber: 61,
			columnNumber: 13
		}, this),
		select: /* @__PURE__ */ (0, O.jsxDEV)(O.Fragment, { children: [/* @__PURE__ */ (0, O.jsxDEV)("rect", {
			x: "4",
			y: "4",
			width: "16",
			height: "16",
			rx: "2",
			strokeDasharray: "3 2"
		}, void 0, !1, {
			fileName: k,
			lineNumber: 62,
			columnNumber: 15
		}, this), /* @__PURE__ */ (0, O.jsxDEV)("path", { d: "m9 11 2 2 4-4" }, void 0, !1, {
			fileName: k,
			lineNumber: 62,
			columnNumber: 87
		}, this)] }, void 0, !0, {
			fileName: k,
			lineNumber: 62,
			columnNumber: 13
		}, this),
		thumbs: /* @__PURE__ */ (0, O.jsxDEV)(O.Fragment, { children: [
			/* @__PURE__ */ (0, O.jsxDEV)("rect", {
				x: "4",
				y: "4",
				width: "6",
				height: "6",
				rx: "1"
			}, void 0, !1, {
				fileName: k,
				lineNumber: 63,
				columnNumber: 15
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("rect", {
				x: "14",
				y: "4",
				width: "6",
				height: "6",
				rx: "1"
			}, void 0, !1, {
				fileName: k,
				lineNumber: 63,
				columnNumber: 63
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("rect", {
				x: "4",
				y: "14",
				width: "6",
				height: "6",
				rx: "1"
			}, void 0, !1, {
				fileName: k,
				lineNumber: 63,
				columnNumber: 112
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("rect", {
				x: "14",
				y: "14",
				width: "6",
				height: "6",
				rx: "1"
			}, void 0, !1, {
				fileName: k,
				lineNumber: 63,
				columnNumber: 161
			}, this)
		] }, void 0, !0, {
			fileName: k,
			lineNumber: 63,
			columnNumber: 13
		}, this),
		zoomIn: /* @__PURE__ */ (0, O.jsxDEV)(O.Fragment, { children: [
			/* @__PURE__ */ (0, O.jsxDEV)("circle", {
				cx: "10.5",
				cy: "10.5",
				r: "5.25"
			}, void 0, !1, {
				fileName: k,
				lineNumber: 64,
				columnNumber: 15
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "m14.5 14.5 4.5 4.5" }, void 0, !1, {
				fileName: k,
				lineNumber: 64,
				columnNumber: 54
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M10.5 7.5v6" }, void 0, !1, {
				fileName: k,
				lineNumber: 64,
				columnNumber: 85
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M7.5 10.5h6" }, void 0, !1, {
				fileName: k,
				lineNumber: 64,
				columnNumber: 109
			}, this)
		] }, void 0, !0, {
			fileName: k,
			lineNumber: 64,
			columnNumber: 13
		}, this),
		zoomOut: /* @__PURE__ */ (0, O.jsxDEV)(O.Fragment, { children: [
			/* @__PURE__ */ (0, O.jsxDEV)("circle", {
				cx: "10.5",
				cy: "10.5",
				r: "5.25"
			}, void 0, !1, {
				fileName: k,
				lineNumber: 65,
				columnNumber: 16
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "m14.5 14.5 4.5 4.5" }, void 0, !1, {
				fileName: k,
				lineNumber: 65,
				columnNumber: 55
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("path", { d: "M7.5 10.5h6" }, void 0, !1, {
				fileName: k,
				lineNumber: 65,
				columnNumber: 86
			}, this)
		] }, void 0, !0, {
			fileName: k,
			lineNumber: 65,
			columnNumber: 14
		}, this)
	};
	return /* @__PURE__ */ (0, O.jsxDEV)("svg", {
		"aria-hidden": "true",
		style: D.icon,
		viewBox: "0 0 24 24",
		children: t[e]
	}, void 0, !1, {
		fileName: k,
		lineNumber: 67,
		columnNumber: 10
	}, this);
}
function j({ compact: e, disabled: t, label: n, name: r, onClick: i, pressed: a }) {
	return /* @__PURE__ */ (0, O.jsxDEV)(b.Root, { children: [/* @__PURE__ */ (0, O.jsxDEV)(b.Trigger, {
		asChild: !0,
		children: /* @__PURE__ */ (0, O.jsxDEV)(g, {
			"aria-label": n,
			"aria-pressed": a,
			disabled: t,
			label: /* @__PURE__ */ (0, O.jsxDEV)(A, { name: r }, void 0, !1, {
				fileName: k,
				lineNumber: 91,
				columnNumber: 14
			}, this),
			onConfirm: i,
			requireConfirmation: !1,
			size: "icon",
			style: {
				...e ? D.compactButton : {},
				...a ? D.activeButton : {}
			},
			variant: "secondary"
		}, void 0, !1, {
			fileName: k,
			lineNumber: 87,
			columnNumber: 5
		}, this)
	}, void 0, !1, {
		fileName: k,
		lineNumber: 86,
		columnNumber: 19
	}, this), /* @__PURE__ */ (0, O.jsxDEV)(b.Portal, { children: /* @__PURE__ */ (0, O.jsxDEV)(b.Content, {
		sideOffset: 6,
		style: v.tooltip,
		children: n
	}, void 0, !1, {
		fileName: k,
		lineNumber: 98,
		columnNumber: 39
	}, this) }, void 0, !1, {
		fileName: k,
		lineNumber: 98,
		columnNumber: 23
	}, this)] }, void 0, !0, {
		fileName: k,
		lineNumber: 86,
		columnNumber: 5
	}, this);
}
function M({ canActualSize: e, canClearSearch: t, canExport: n, canFitHeight: r, canFitPage: i, canFitWidth: a, canSearch: o, canSelect: s, canZoomIn: c, canZoomOut: l, compact: u, selecting: d, onAction: p, onSearchText: ee, searchText: _, scaleRef: x, exportRef: S, zoom: C }) {
	let [w, T] = h(!1), [E, M] = h(!1), [N, P] = h(!0), F = m(!1), I = m(null), L = m(null), te = m(null), R = m(null), z = m(null), B = m(null), V = o && !!_.trim();
	f(() => {
		let e = I.current, t = L.current, n = te.current, r = R.current, i = z.current, a = B.current, o = r.parentElement, s = () => {
			if (e.clientWidth === 0) return;
			let s = getComputedStyle(e), c = getComputedStyle(n), l = getComputedStyle(o), u = getComputedStyle(a), d = e.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight) >= t.getBoundingClientRect().width + parseFloat(s.columnGap) + parseFloat(getComputedStyle(r).minWidth) + i.getBoundingClientRect().width + parseFloat(l.borderLeftWidth) + parseFloat(l.borderRightWidth) + parseFloat(c.columnGap) + a.getBoundingClientRect().width + parseFloat(u.marginLeft) + parseFloat(u.marginRight);
			P(d), d || M(!1);
		};
		s();
		let c = new ResizeObserver(s);
		for (let n of [
			e,
			t,
			i,
			a
		]) c.observe(n);
		return () => c.disconnect();
	}, [u]);
	let H = (e) => {
		e.preventDefault(), V && (console.info("imageviewer toolbar action", {
			action: "search",
			source: "submit"
		}), p("search"));
	}, U = /* @__PURE__ */ (0, O.jsxDEV)("div", {
		"aria-label": "Image view controls",
		ref: L,
		style: D.viewGroup,
		children: /* @__PURE__ */ (0, O.jsxDEV)("div", {
			"aria-label": "Scale controls",
			style: D.scaleGroup,
			children: [
				/* @__PURE__ */ (0, O.jsxDEV)(j, {
					compact: u,
					disabled: !l,
					label: "Zoom out",
					name: "zoomOut",
					onClick: () => {
						console.info("imageviewer toolbar action", { action: "zoomOut" }), p("zoomOut");
					}
				}, void 0, !1, {
					fileName: k,
					lineNumber: 179,
					columnNumber: 11
				}, this),
				C === void 0 ? null : /* @__PURE__ */ (0, O.jsxDEV)("output", {
					"aria-label": "Current scale",
					"aria-live": "polite",
					style: {
						...D.scaleValue,
						...u ? D.compactScaleValue : {}
					},
					children: [Math.round(C * 100), "%"]
				}, void 0, !0, {
					fileName: k,
					lineNumber: 183,
					columnNumber: 40
				}, this),
				/* @__PURE__ */ (0, O.jsxDEV)(j, {
					compact: u,
					disabled: !c,
					label: "Zoom in",
					name: "zoomIn",
					onClick: () => {
						console.info("imageviewer toolbar action", { action: "zoomIn" }), p("zoomIn");
					}
				}, void 0, !1, {
					fileName: k,
					lineNumber: 184,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ (0, O.jsxDEV)(y.Root, {
					onOpenChange: T,
					open: w,
					children: [/* @__PURE__ */ (0, O.jsxDEV)(b.Root, { children: [/* @__PURE__ */ (0, O.jsxDEV)(b.Trigger, {
						asChild: !0,
						children: /* @__PURE__ */ (0, O.jsxDEV)(y.Trigger, {
							asChild: !0,
							children: /* @__PURE__ */ (0, O.jsxDEV)("button", {
								ref: x,
								"aria-controls": "image-viewer-scale-options",
								"aria-expanded": w,
								"aria-haspopup": "dialog",
								"aria-label": "Scale options",
								disabled: !e && !r && !i && !a,
								style: {
									...D.menuButton,
									...u ? D.compactButton : {}
								},
								type: "button",
								children: /* @__PURE__ */ (0, O.jsxDEV)(A, { name: "more" }, void 0, !1, {
									fileName: k,
									lineNumber: 201,
									columnNumber: 17
								}, this)
							}, void 0, !1, {
								fileName: k,
								lineNumber: 191,
								columnNumber: 15
							}, this)
						}, void 0, !1, {
							fileName: k,
							lineNumber: 190,
							columnNumber: 13
						}, this)
					}, void 0, !1, {
						fileName: k,
						lineNumber: 189,
						columnNumber: 27
					}, this), /* @__PURE__ */ (0, O.jsxDEV)(b.Portal, { children: /* @__PURE__ */ (0, O.jsxDEV)(b.Content, {
						sideOffset: 6,
						style: v.tooltip,
						children: "Scale options"
					}, void 0, !1, {
						fileName: k,
						lineNumber: 204,
						columnNumber: 47
					}, this) }, void 0, !1, {
						fileName: k,
						lineNumber: 204,
						columnNumber: 31
					}, this)] }, void 0, !0, {
						fileName: k,
						lineNumber: 189,
						columnNumber: 13
					}, this), /* @__PURE__ */ (0, O.jsxDEV)(y.Portal, { children: /* @__PURE__ */ (0, O.jsxDEV)(y.Content, {
						"aria-label": "Scale options",
						id: "image-viewer-scale-options",
						role: "group",
						side: "bottom",
						align: "start",
						sideOffset: 6,
						style: D.menuPopover,
						onCloseAutoFocus: (e) => {
							F.current && e.preventDefault(), F.current = !1;
						},
						children: [
							/* @__PURE__ */ (0, O.jsxDEV)(g, {
								disabled: !i,
								label: "Fit page",
								onConfirm: () => {
									T(!1), console.info("imageviewer toolbar action", { action: "fitPage" }), p("fitPage");
								},
								requireConfirmation: !1,
								size: "sm",
								variant: "secondary"
							}, void 0, !1, {
								fileName: k,
								lineNumber: 212,
								columnNumber: 17
							}, this),
							/* @__PURE__ */ (0, O.jsxDEV)(g, {
								disabled: !a,
								label: "Fit width",
								onConfirm: () => {
									T(!1), console.info("imageviewer toolbar action", { action: "fitWidth" }), p("fitWidth");
								},
								requireConfirmation: !1,
								size: "sm",
								variant: "secondary"
							}, void 0, !1, {
								fileName: k,
								lineNumber: 217,
								columnNumber: 17
							}, this),
							/* @__PURE__ */ (0, O.jsxDEV)(g, {
								disabled: !r,
								label: "Fit height",
								onConfirm: () => {
									T(!1), console.info("imageviewer toolbar action", { action: "fitHeight" }), p("fitHeight");
								},
								requireConfirmation: !1,
								size: "sm",
								variant: "secondary"
							}, void 0, !1, {
								fileName: k,
								lineNumber: 222,
								columnNumber: 17
							}, this),
							/* @__PURE__ */ (0, O.jsxDEV)(g, {
								disabled: !e,
								label: "Actual size",
								onConfirm: () => {
									T(!1), console.info("imageviewer toolbar action", { action: "actualSize" }), p("actualSize");
								},
								requireConfirmation: !1,
								size: "sm",
								variant: "secondary"
							}, void 0, !1, {
								fileName: k,
								lineNumber: 227,
								columnNumber: 17
							}, this)
						]
					}, void 0, !0, {
						fileName: k,
						lineNumber: 208,
						columnNumber: 15
					}, this) }, void 0, !1, {
						fileName: k,
						lineNumber: 207,
						columnNumber: 13
					}, this)]
				}, void 0, !0, {
					fileName: k,
					lineNumber: 188,
					columnNumber: 11
				}, this)
			]
		}, void 0, !0, {
			fileName: k,
			lineNumber: 178,
			columnNumber: 9
		}, this)
	}, void 0, !1, {
		fileName: k,
		lineNumber: 177,
		columnNumber: 5
	}, this), W = /* @__PURE__ */ (0, O.jsxDEV)("form", {
		"aria-hidden": !N,
		"aria-label": "Image text search",
		inert: !N,
		onSubmit: H,
		ref: te,
		style: {
			...D.searchForm,
			...N ? {} : D.hiddenSearchForm
		},
		children: [/* @__PURE__ */ (0, O.jsxDEV)("div", {
			style: D.searchBox,
			children: [/* @__PURE__ */ (0, O.jsxDEV)("input", {
				"aria-label": "Search image text",
				ref: R,
				onChange: (e) => {
					console.info("imageviewer toolbar search text", { length: e.target.value.length }), ee(e.target.value);
				},
				placeholder: "Search image text",
				style: D.searchInput,
				type: "search",
				value: _
			}, void 0, !1, {
				fileName: k,
				lineNumber: 241,
				columnNumber: 9
			}, this), /* @__PURE__ */ (0, O.jsxDEV)(b.Root, { children: [/* @__PURE__ */ (0, O.jsxDEV)(b.Trigger, {
				asChild: !0,
				children: /* @__PURE__ */ (0, O.jsxDEV)("button", {
					"aria-label": "Search",
					disabled: !V,
					ref: z,
					style: {
						...D.searchSubmit,
						...u ? D.compactSearchSubmit : {}
					},
					type: "button",
					onClick: () => {
						console.info("imageviewer toolbar action", {
							action: "search",
							source: "click"
						}), p("search");
					},
					children: /* @__PURE__ */ (0, O.jsxDEV)(A, { name: "search" }, void 0, !1, {
						fileName: k,
						lineNumber: 257,
						columnNumber: 12
					}, this)
				}, void 0, !1, {
					fileName: k,
					lineNumber: 254,
					columnNumber: 9
				}, this)
			}, void 0, !1, {
				fileName: k,
				lineNumber: 253,
				columnNumber: 23
			}, this), /* @__PURE__ */ (0, O.jsxDEV)(b.Portal, { children: /* @__PURE__ */ (0, O.jsxDEV)(b.Content, {
				sideOffset: 6,
				style: v.tooltip,
				children: "Search"
			}, void 0, !1, {
				fileName: k,
				lineNumber: 258,
				columnNumber: 43
			}, this) }, void 0, !1, {
				fileName: k,
				lineNumber: 258,
				columnNumber: 27
			}, this)] }, void 0, !0, {
				fileName: k,
				lineNumber: 253,
				columnNumber: 9
			}, this)]
		}, void 0, !0, {
			fileName: k,
			lineNumber: 240,
			columnNumber: 9
		}, this), /* @__PURE__ */ (0, O.jsxDEV)("div", {
			"aria-label": "Selection controls",
			ref: B,
			style: {
				...D.selectionGroup,
				...u ? D.compactSelectionGroup : {}
			},
			children: [
				/* @__PURE__ */ (0, O.jsxDEV)(j, {
					compact: u,
					disabled: !s,
					label: d ? "Exit select mode" : "Select",
					name: "select",
					onClick: () => {
						console.info("imageviewer toolbar action", { action: "select" }), p("select");
					},
					pressed: d
				}, void 0, !1, {
					fileName: k,
					lineNumber: 263,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ (0, O.jsxDEV)(j, {
					compact: u,
					disabled: !t,
					label: "Clear selections",
					name: "clearSearch",
					onClick: () => {
						console.info("imageviewer toolbar action", { action: "clearSearch" }), p("clearSearch");
					}
				}, void 0, !1, {
					fileName: k,
					lineNumber: 267,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ (0, O.jsxDEV)(y.Root, {
					onOpenChange: M,
					open: E,
					children: [/* @__PURE__ */ (0, O.jsxDEV)(b.Root, { children: [/* @__PURE__ */ (0, O.jsxDEV)(b.Trigger, {
						asChild: !0,
						children: /* @__PURE__ */ (0, O.jsxDEV)(y.Trigger, {
							asChild: !0,
							children: /* @__PURE__ */ (0, O.jsxDEV)("button", {
								ref: S,
								"aria-controls": "image-viewer-more-options",
								"aria-expanded": E,
								"aria-haspopup": "dialog",
								"aria-label": "More",
								disabled: !n,
								style: {
									...D.menuButton,
									...u ? D.compactButton : {}
								},
								type: "button",
								children: /* @__PURE__ */ (0, O.jsxDEV)(A, { name: "more" }, void 0, !1, {
									fileName: k,
									lineNumber: 275,
									columnNumber: 17
								}, this)
							}, void 0, !1, {
								fileName: k,
								lineNumber: 274,
								columnNumber: 15
							}, this)
						}, void 0, !1, {
							fileName: k,
							lineNumber: 273,
							columnNumber: 13
						}, this)
					}, void 0, !1, {
						fileName: k,
						lineNumber: 272,
						columnNumber: 27
					}, this), /* @__PURE__ */ (0, O.jsxDEV)(b.Portal, { children: /* @__PURE__ */ (0, O.jsxDEV)(b.Content, {
						sideOffset: 6,
						style: v.tooltip,
						children: "More"
					}, void 0, !1, {
						fileName: k,
						lineNumber: 278,
						columnNumber: 47
					}, this) }, void 0, !1, {
						fileName: k,
						lineNumber: 278,
						columnNumber: 31
					}, this)] }, void 0, !0, {
						fileName: k,
						lineNumber: 272,
						columnNumber: 13
					}, this), /* @__PURE__ */ (0, O.jsxDEV)(y.Portal, { children: /* @__PURE__ */ (0, O.jsxDEV)(y.Content, {
						"aria-label": "Selection actions",
						id: "image-viewer-more-options",
						role: "group",
						side: "bottom",
						align: "end",
						sideOffset: 6,
						style: D.menuPopover,
						onCloseAutoFocus: (e) => {
							F.current && e.preventDefault(), F.current = !1;
						},
						children: [
							"export",
							"copy",
							"match"
						].map((e) => /* @__PURE__ */ (0, O.jsxDEV)(g, {
							label: e[0].toUpperCase() + e.slice(1),
							onConfirm: () => {
								F.current = e === "export", M(!1), console.info("imageviewer toolbar action", { action: e }), p(e);
							},
							requireConfirmation: !1,
							size: "sm",
							variant: "secondary"
						}, e, !1, {
							fileName: k,
							lineNumber: 286,
							columnNumber: 73
						}, this))
					}, void 0, !1, {
						fileName: k,
						lineNumber: 282,
						columnNumber: 15
					}, this) }, void 0, !1, {
						fileName: k,
						lineNumber: 281,
						columnNumber: 13
					}, this)]
				}, void 0, !0, {
					fileName: k,
					lineNumber: 271,
					columnNumber: 11
				}, this)
			]
		}, void 0, !0, {
			fileName: k,
			lineNumber: 262,
			columnNumber: 9
		}, this)]
	}, void 0, !0, {
		fileName: k,
		lineNumber: 239,
		columnNumber: 5
	}, this);
	return /* @__PURE__ */ (0, O.jsxDEV)(b.Provider, { children: /* @__PURE__ */ (0, O.jsxDEV)("div", {
		"aria-label": "Image viewer top toolbar",
		ref: I,
		style: {
			...D.topToolbar,
			...u ? D.topToolbarCompact : {}
		},
		children: [U, W]
	}, void 0, !0, {
		fileName: k,
		lineNumber: 300,
		columnNumber: 5
	}, this) }, void 0, !1, {
		fileName: k,
		lineNumber: 299,
		columnNumber: 5
	}, this);
}
function N({ canGoFirst: e, canGoLast: t, canGoNext: n, canGoPrevious: r, canShowThumbnails: i, onAction: a, page: o, pageName: s, pageCount: c }) {
	return /* @__PURE__ */ (0, O.jsxDEV)(b.Provider, { children: /* @__PURE__ */ (0, O.jsxDEV)("div", {
		"aria-label": "Image viewer footer toolbar",
		style: D.footerToolbar,
		children: [
			/* @__PURE__ */ (0, O.jsxDEV)(j, {
				disabled: !i,
				label: "Thumbnails",
				name: "thumbs",
				onClick: () => {
					console.info("imageviewer toolbar action", {
						action: "thumbs",
						page: o,
						pageCount: c
					}), a("thumbs");
				}
			}, void 0, !1, {
				fileName: k,
				lineNumber: 322,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)(j, {
				disabled: !e,
				label: "First page",
				name: "first",
				onClick: () => {
					console.info("imageviewer toolbar action", {
						action: "first",
						page: o,
						pageCount: c
					}), a("first");
				}
			}, void 0, !1, {
				fileName: k,
				lineNumber: 326,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)(j, {
				disabled: !r,
				label: "Previous page",
				name: "previous",
				onClick: () => {
					console.info("imageviewer toolbar action", {
						action: "previous",
						page: o,
						pageCount: c
					}), a("previous");
				}
			}, void 0, !1, {
				fileName: k,
				lineNumber: 330,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)("span", {
				style: D.pageText,
				children: [
					"Page ",
					o,
					s ? ` (${s})` : "",
					" of ",
					c
				]
			}, void 0, !0, {
				fileName: k,
				lineNumber: 334,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)(j, {
				disabled: !n,
				label: "Next page",
				name: "next",
				onClick: () => {
					console.info("imageviewer toolbar action", {
						action: "next",
						page: o,
						pageCount: c
					}), a("next");
				}
			}, void 0, !1, {
				fileName: k,
				lineNumber: 335,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ (0, O.jsxDEV)(j, {
				disabled: !t,
				label: "Last page",
				name: "last",
				onClick: () => {
					console.info("imageviewer toolbar action", {
						action: "last",
						page: o,
						pageCount: c
					}), a("last");
				}
			}, void 0, !1, {
				fileName: k,
				lineNumber: 339,
				columnNumber: 7
			}, this)
		]
	}, void 0, !0, {
		fileName: k,
		lineNumber: 321,
		columnNumber: 5
	}, this) }, void 0, !1, {
		fileName: k,
		lineNumber: 320,
		columnNumber: 5
	}, this);
}
//#endregion
//#region src/features/imageviewer/component/ImageViewerPanel.tsx
var P = "C:/GitHub/Tabularium/aurorra_index/src/features/imageviewer/component/ImageViewerPanel.tsx";
function F(e) {
	return e === "downloading" ? "Loading image package" : "Generating the image package";
}
function I(e) {
	return e === "loadingPage" ? "Decoding document page..." : "Loading...";
}
function L({ compact: n, hostInput: i, renderTolerance: a, onAddIndex: o, onIndexFocus: u, onLoaderChange: p, onReadyChange: _ }) {
	f(() => {
		i && r.getState().setHostInput(i);
	}, [i]);
	let v = t((e) => e.pageSize), y = t((e) => e.apiGatewayUrl), b = t((e) => e.authToken), x = t((e) => e.searchText), S = t((e) => e.session), w = t((e) => e.requestVersion), T = t((e) => e.status), k = t((e) => e.viewerStatus), A = t((e) => e.workerClient), j = E(), [L, te] = h(null), R = m(null), z = m(0), [B, V] = h(null);
	d(() => {
		if (!v || !y || !b || !S || j.isRestoring || j.hasRequestError) return;
		let e = r.getState(), t = !!(e.packageMetadata && e.tiffBytes && e.tiffType !== null), n = e.status === "ready" && e.viewerState?.status === "ready" && !t;
		if (e.status === "packaging" || e.status === "downloading" || !e.onError) return;
		let i = j.reloadId > z.current;
		!i && j.isRestoredSession || !i && (t && (e.status === "ready" || l(e.error)) || n) || (i && (z.current = j.reloadId), console.info("imageviewer package load start", {
			hasPackage: t,
			page: e.request?.page ?? null,
			reason: i ? "lens_page_metadata_missing" : "initial_or_missing_package",
			reloadId: j.reloadId,
			requestVersion: w,
			session: S,
			status: e.status
		}), s({
			pageSize: v,
			apiGatewayUrl: y,
			authToken: b,
			onError: e.onError,
			restart: i,
			session: S,
			workerClient: A ?? void 0
		}));
	}, [
		v,
		y,
		b,
		w,
		S,
		j.hasRequestError,
		j.isRestoredSession,
		j.isRestoring,
		j.reloadId,
		A
	]);
	let H = T === "packaging" || T === "downloading", U = !j.isNavigating && (j.isRestoring || j.isLoading || k === "addingPages" || k === "loadingPage"), W = H || U;
	return d(() => {
		_(T === "ready" && !U);
	}, [
		U,
		_,
		T
	]), d(() => {
		p?.(W ? [H ? F(T) : I(k)] : null);
	}, [
		H,
		p,
		W,
		T,
		k
	]), /* @__PURE__ */ (0, O.jsxDEV)("section", {
		"aria-label": "Image viewer",
		style: D.root,
		children: [
			L && j.sizeFailure ? a({
				anchor: L,
				onClose: j.cancelSize,
				children: /* @__PURE__ */ (0, O.jsxDEV)("section", {
					style: D.sizePrompt,
					children: [
						/* @__PURE__ */ (0, O.jsxDEV)("p", {
							style: D.sizeMessage,
							children: /* @__PURE__ */ (0, O.jsxDEV)("strong", { children: j.sizeFailure.sourceName }, void 0, !1, {
								fileName: P,
								lineNumber: 94,
								columnNumber: 54
							}, this)
						}, void 0, !1, {
							fileName: P,
							lineNumber: 94,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ (0, O.jsxDEV)("p", {
							style: D.sizeMessage,
							children: [
								"Page ",
								j.sizeFailure.pageNumber,
								": ",
								j.sizeFailure.width,
								" × ",
								j.sizeFailure.height,
								" px"
							]
						}, void 0, !0, {
							fileName: P,
							lineNumber: 95,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ (0, O.jsxDEV)("p", {
							style: D.sizeMessage,
							children: [
								"This page exceeds the configured size tolerance of ",
								Number((j.sizeFailure.tolerance * 100).toFixed(2)),
								"%. Processing requires a higher tolerance of ",
								Number((j.sizeFailure.requiredTolerance * 100).toFixed(2)),
								"%. This change applies only to this preview."
							]
						}, void 0, !0, {
							fileName: P,
							lineNumber: 96,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ (0, O.jsxDEV)("div", {
							style: D.sizeActions,
							children: [/* @__PURE__ */ (0, O.jsxDEV)(g, {
								label: "Cancel",
								variant: "secondary",
								requireConfirmation: !1,
								onConfirm: j.cancelSize
							}, void 0, !1, {
								fileName: P,
								lineNumber: 102,
								columnNumber: 15
							}, this), /* @__PURE__ */ (0, O.jsxDEV)(g, {
								label: "Process anyway",
								variant: "primary",
								requireConfirmation: !1,
								onConfirm: j.acceptSize
							}, void 0, !1, {
								fileName: P,
								lineNumber: 103,
								columnNumber: 15
							}, this)]
						}, void 0, !0, {
							fileName: P,
							lineNumber: 101,
							columnNumber: 13
						}, this)
					]
				}, void 0, !0, {
					fileName: P,
					lineNumber: 93,
					columnNumber: 11
				}, this)
			}) : null,
			j.sizeFailure || !j.isThumbs || n ? /* @__PURE__ */ (0, O.jsxDEV)(M, {
				scaleRef: te,
				exportRef: R,
				canActualSize: j.canActualSize,
				canClearSearch: j.canClearSearch,
				canExport: j.canExport,
				canFitHeight: j.canFitHeight,
				canFitPage: j.canFitPage,
				canFitWidth: j.canFitWidth,
				canSearch: j.canSearch,
				canSelect: j.canSelect,
				canZoomIn: j.canZoomIn,
				canZoomOut: j.canZoomOut,
				compact: n,
				selecting: j.selecting,
				onAction: (t) => {
					j.setNoMatch(null), t !== "match" && V(null), t === "actualSize" && j.actualSize(), t === "clearSearch" && j.clearSearch(), t === "copy" && j.copySelection(), t === "export" && j.exportSelection().then((e) => {
						e && (R.current.focus({ preventScroll: !0 }), c.getState().open(e), o?.(R.current));
					}), t === "fitHeight" && j.fitHeight(), t === "fitPage" && j.fitPage(), t === "fitWidth" && j.fitWidth(), t === "match" && j.exportSelection().then((t) => {
						let n = r.getState();
						if (!t || !S || n.session !== S || n.requestVersion !== w) return;
						let i = ee(e.getState().getJSON(S)), a = i ? C(t, i) : null;
						V(a ? null : {
							session: S,
							version: w
						}), a && u?.(a);
					}), t === "search" && j.search(), t === "select" && j.select(), t === "zoomIn" && j.zoomIn(), t === "zoomOut" && j.zoomOut();
				},
				onSearchText: (e) => r.getState().setSearchText(e),
				searchText: x,
				zoom: j.zoom
			}, void 0, !1, {
				fileName: P,
				lineNumber: 109,
				columnNumber: 9
			}, this) : null,
			/* @__PURE__ */ (0, O.jsxDEV)("div", {
				style: D.body,
				children: [/* @__PURE__ */ (0, O.jsxDEV)("div", {
					"data-document-lens-host": "true",
					ref: j.lensHostRef,
					style: D.lensHost
				}, void 0, !1, {
					fileName: P,
					lineNumber: 163,
					columnNumber: 9
				}, this), j.noMatch || B !== null && B.session === S && B.version === w ? /* @__PURE__ */ (0, O.jsxDEV)("div", {
					role: "status",
					"aria-label": "Index match result",
					style: D.matchStatus,
					children: j.noMatch ? "Cant match the requested text." : "No matching index found"
				}, void 0, !1, {
					fileName: P,
					lineNumber: 165,
					columnNumber: 11
				}, this) : null]
			}, void 0, !0, {
				fileName: P,
				lineNumber: 162,
				columnNumber: 7
			}, this),
			W || j.isThumbs ? null : /* @__PURE__ */ (0, O.jsxDEV)(N, {
				canGoFirst: j.canGoFirst,
				canGoLast: j.canGoLast,
				canGoNext: j.canGoNext,
				canGoPrevious: j.canGoPrevious,
				canShowThumbnails: j.canShowThumbnails,
				onAction: (e) => {
					j.setNoMatch(null), V(null), e === "first" && j.firstPage(), e === "last" && j.lastPage(), e === "next" && j.nextPage(), e === "previous" && j.previousPage(), e === "thumbs" && j.showThumbnails();
				},
				page: j.page,
				pageName: j.pageName,
				pageCount: j.pageCount
			}, void 0, !1, {
				fileName: P,
				lineNumber: 171,
				columnNumber: 9
			}, this)
		]
	}, void 0, !0, {
		fileName: P,
		lineNumber: 88,
		columnNumber: 5
	}, this);
}
//#endregion
export { L as ImageViewerPanel };
