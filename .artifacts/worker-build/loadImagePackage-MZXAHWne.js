import * as e from "react";
import { useEffect as t, useId as n, useMemo as r, useRef as i, useState as a } from "react";
import { ConfButton as o, composeMetadataJSON as s, formStyles as c, formatLabel as l, getPanelData as u, replaceMetadataPageSegments as d, splitMetadataJSON as f } from "aurora-core";
import "react-dom";
import * as p from "@radix-ui/react-collapsible";
//#region \0rolldown/runtime.js
var m = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), h = /* @__PURE__ */ ((e) => typeof require < "u" ? require : typeof Proxy < "u" ? new Proxy(e, { get: (e, t) => (typeof require < "u" ? require : e)[t] }) : e)(function(e) {
	if (typeof require < "u") return require.apply(this, arguments);
	throw Error("Calling `require` for \"" + e + "\" in an environment that doesn't expose the `require` function. See https://rolldown.rs/in-depth/bundling-cjs#require-external-modules for more details.");
});
//#endregion
//#region node_modules/@radix-ui/react-compose-refs/dist/index.mjs
function g(e, t) {
	if (typeof e == "function") return e(t);
	e != null && (e.current = t);
}
function _(...e) {
	return (t) => {
		let n = !1, r = e.map((e) => {
			let r = g(e, t);
			return !n && typeof r == "function" && (n = !0), r;
		});
		if (n) return () => {
			for (let t = 0; t < r.length; t++) {
				let n = r[t];
				typeof n == "function" ? n() : g(e[t], null);
			}
		};
	};
}
function v(...t) {
	return e.useCallback(_(...t), t);
}
//#endregion
//#region node_modules/react/cjs/react-jsx-runtime.production.js
var y = /* @__PURE__ */ m(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.fragment");
	function r(e, n, r) {
		var i = null;
		if (r !== void 0 && (i = "" + r), n.key !== void 0 && (i = "" + n.key), "key" in n) for (var a in r = {}, n) a !== "key" && (r[a] = n[a]);
		else r = n;
		return n = r.ref, {
			$$typeof: t,
			type: e,
			key: i,
			ref: n === void 0 ? null : n,
			props: r
		};
	}
	e.Fragment = n, e.jsx = r, e.jsxs = r;
})), b = /* @__PURE__ */ m(((e) => {
	process.env.NODE_ENV !== "production" && (function() {
		function t(e) {
			if (e == null) return null;
			if (typeof e == "function") return e.$$typeof === k ? null : e.displayName || e.name || null;
			if (typeof e == "string") return e;
			switch (e) {
				case v: return "Fragment";
				case b: return "Profiler";
				case y: return "StrictMode";
				case w: return "Suspense";
				case T: return "SuspenseList";
				case O: return "Activity";
			}
			if (typeof e == "object") switch (typeof e.tag == "number" && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), e.$$typeof) {
				case _: return "Portal";
				case S: return e.displayName || "Context";
				case x: return (e._context.displayName || "Context") + ".Consumer";
				case C:
					var n = e.render;
					return e = e.displayName, e ||= (e = n.displayName || n.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
				case E: return n = e.displayName || null, n === null ? t(e.type) || "Memo" : n;
				case D:
					n = e._payload, e = e._init;
					try {
						return t(e(n));
					} catch {}
			}
			return null;
		}
		function n(e) {
			return "" + e;
		}
		function r(e) {
			try {
				n(e);
				var t = !1;
			} catch {
				t = !0;
			}
			if (t) {
				t = console;
				var r = t.error, i = typeof Symbol == "function" && Symbol.toStringTag && e[Symbol.toStringTag] || e.constructor.name || "Object";
				return r.call(t, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", i), n(e);
			}
		}
		function i(e) {
			if (e === v) return "<>";
			if (typeof e == "object" && e && e.$$typeof === D) return "<...>";
			try {
				var n = t(e);
				return n ? "<" + n + ">" : "<...>";
			} catch {
				return "<...>";
			}
		}
		function a() {
			var e = A.A;
			return e === null ? null : e.getOwner();
		}
		function o() {
			return Error("react-stack-top-frame");
		}
		function s(e) {
			if (j.call(e, "key")) {
				var t = Object.getOwnPropertyDescriptor(e, "key").get;
				if (t && t.isReactWarning) return !1;
			}
			return e.key !== void 0;
		}
		function c(e, t) {
			function n() {
				P || (P = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", t));
			}
			n.isReactWarning = !0, Object.defineProperty(e, "key", {
				get: n,
				configurable: !0
			});
		}
		function l() {
			var e = t(this.type);
			return F[e] || (F[e] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release.")), e = this.props.ref, e === void 0 ? null : e;
		}
		function u(e, t, n, r, i, a) {
			var o = n.ref;
			return e = {
				$$typeof: g,
				type: e,
				key: t,
				props: n,
				_owner: r
			}, (o === void 0 ? null : o) === null ? Object.defineProperty(e, "ref", {
				enumerable: !1,
				value: null
			}) : Object.defineProperty(e, "ref", {
				enumerable: !1,
				get: l
			}), e._store = {}, Object.defineProperty(e._store, "validated", {
				configurable: !1,
				enumerable: !1,
				writable: !0,
				value: 0
			}), Object.defineProperty(e, "_debugInfo", {
				configurable: !1,
				enumerable: !1,
				writable: !0,
				value: null
			}), Object.defineProperty(e, "_debugStack", {
				configurable: !1,
				enumerable: !1,
				writable: !0,
				value: i
			}), Object.defineProperty(e, "_debugTask", {
				configurable: !1,
				enumerable: !1,
				writable: !0,
				value: a
			}), Object.freeze && (Object.freeze(e.props), Object.freeze(e)), e;
		}
		function d(e, n, i, o, l, d) {
			var p = n.children;
			if (p !== void 0) if (o) if (M(p)) {
				for (o = 0; o < p.length; o++) f(p[o]);
				Object.freeze && Object.freeze(p);
			} else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
			else f(p);
			if (j.call(n, "key")) {
				p = t(e);
				var m = Object.keys(n).filter(function(e) {
					return e !== "key";
				});
				o = 0 < m.length ? "{key: someKey, " + m.join(": ..., ") + ": ...}" : "{key: someKey}", te[p + o] || (m = 0 < m.length ? "{" + m.join(": ..., ") + ": ...}" : "{}", console.error("A props object containing a \"key\" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />", o, p, m, p), te[p + o] = !0);
			}
			if (p = null, i !== void 0 && (r(i), p = "" + i), s(n) && (r(n.key), p = "" + n.key), "key" in n) for (var h in i = {}, n) h !== "key" && (i[h] = n[h]);
			else i = n;
			return p && c(i, typeof e == "function" ? e.displayName || e.name || "Unknown" : e), u(e, p, i, a(), l, d);
		}
		function f(e) {
			p(e) ? e._store && (e._store.validated = 1) : typeof e == "object" && e && e.$$typeof === D && (e._payload.status === "fulfilled" ? p(e._payload.value) && e._payload.value._store && (e._payload.value._store.validated = 1) : e._store && (e._store.validated = 1));
		}
		function p(e) {
			return typeof e == "object" && !!e && e.$$typeof === g;
		}
		var m = h("react"), g = Symbol.for("react.transitional.element"), _ = Symbol.for("react.portal"), v = Symbol.for("react.fragment"), y = Symbol.for("react.strict_mode"), b = Symbol.for("react.profiler"), x = Symbol.for("react.consumer"), S = Symbol.for("react.context"), C = Symbol.for("react.forward_ref"), w = Symbol.for("react.suspense"), T = Symbol.for("react.suspense_list"), E = Symbol.for("react.memo"), D = Symbol.for("react.lazy"), O = Symbol.for("react.activity"), k = Symbol.for("react.client.reference"), A = m.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, j = Object.prototype.hasOwnProperty, M = Array.isArray, N = console.createTask ? console.createTask : function() {
			return null;
		};
		m = { react_stack_bottom_frame: function(e) {
			return e();
		} };
		var P, F = {}, ee = m.react_stack_bottom_frame.bind(m, o)(), I = N(i(o)), te = {};
		e.Fragment = v, e.jsx = function(e, t, n) {
			var r = 1e4 > A.recentlyCreatedOwnerStacks++;
			return d(e, t, n, !1, r ? Error("react-stack-top-frame") : ee, r ? N(i(e)) : I);
		}, e.jsxs = function(e, t, n) {
			var r = 1e4 > A.recentlyCreatedOwnerStacks++;
			return d(e, t, n, !0, r ? Error("react-stack-top-frame") : ee, r ? N(i(e)) : I);
		};
	})();
})), x = (/* @__PURE__ */ m(((e, t) => {
	process.env.NODE_ENV === "production" ? t.exports = y() : t.exports = b();
})))();
function S(t, n = []) {
	let r = [];
	function i(n, i) {
		let a = e.createContext(i);
		a.displayName = n + "Context";
		let o = r.length;
		r = [...r, i];
		let s = (n) => {
			let { scope: r, children: i, ...s } = n, c = r?.[t]?.[o] || a, l = e.useMemo(() => s, Object.values(s));
			return /* @__PURE__ */ (0, x.jsx)(c.Provider, {
				value: l,
				children: i
			});
		};
		s.displayName = n + "Provider";
		function c(r, s, c = {}) {
			let { optional: l = !1 } = c, u = s?.[t]?.[o] || a, d = e.useContext(u);
			if (d) return d;
			if (i !== void 0) return i;
			if (!l) throw Error(`\`${r}\` must be used within \`${n}\``);
		}
		return [s, c];
	}
	let a = () => {
		let n = r.map((t) => e.createContext(t));
		return function(r) {
			let i = r?.[t] || n;
			return e.useMemo(() => ({ [`__scope${t}`]: {
				...r,
				[t]: i
			} }), [r, i]);
		};
	};
	return a.scopeName = t, [i, C(a, ...n)];
}
function C(...t) {
	let n = t[0];
	if (t.length === 1) return n;
	let r = () => {
		let r = t.map((e) => ({
			useScope: e(),
			scopeName: e.scopeName
		}));
		return function(t) {
			let i = r.reduce((e, { useScope: n, scopeName: r }) => {
				let i = n(t)[`__scope${r}`];
				return {
					...e,
					...i
				};
			}, {});
			return e.useMemo(() => ({ [`__scope${n.scopeName}`]: i }), [i]);
		};
	};
	return r.scopeName = n.scopeName, r;
}
typeof window < "u" && window.document && window.document.createElement;
function w(e, t, { checkForDefaultPrevented: n = !0 } = {}) {
	return function(r) {
		if (e?.(r), n === !1 || !r || !r.defaultPrevented) return t?.(r);
	};
}
//#endregion
//#region node_modules/@radix-ui/react-use-layout-effect/dist/index.mjs
var T = globalThis?.document ? e.useLayoutEffect : () => {}, E = e.useInsertionEffect || T;
function D({ prop: t, defaultProp: n, onChange: r = () => {}, caller: i }) {
	let [a, o, s] = O({
		defaultProp: n,
		onChange: r
	}), c = t !== void 0, l = c ? t : a;
	{
		let n = e.useRef(t !== void 0);
		e.useEffect(() => {
			let e = n.current;
			e !== c && console.warn(`${i} is changing from ${e ? "controlled" : "uncontrolled"} to ${c ? "controlled" : "uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`), n.current = c;
		}, [c, i]);
	}
	return [l, e.useCallback((e) => {
		if (c) {
			let n = k(e) ? e(t) : e;
			n !== t && s.current?.(n);
		} else o(e);
	}, [
		c,
		t,
		o,
		s
	])];
}
function O({ defaultProp: t, onChange: n }) {
	let [r, i] = e.useState(t), a = e.useRef(r), o = e.useRef(n);
	return E(() => {
		o.current = n;
	}, [n]), e.useEffect(() => {
		a.current !== r && (o.current?.(r), a.current = r);
	}, [r, a]), [
		r,
		i,
		o
	];
}
function k(e) {
	return typeof e == "function";
}
//#endregion
//#region node_modules/@radix-ui/react-use-previous/dist/index.mjs
function A(t) {
	let n = e.useRef({
		value: t,
		previous: t
	});
	return e.useMemo(() => (n.current.value !== t && (n.current.previous = n.current.value, n.current.value = t), n.current.previous), [t]);
}
//#endregion
//#region node_modules/@radix-ui/react-use-size/dist/index.mjs
function j(t) {
	let [n, r] = e.useState(void 0);
	return T(() => {
		if (t) {
			r({
				width: t.offsetWidth,
				height: t.offsetHeight
			});
			let e = new ResizeObserver((e) => {
				if (!Array.isArray(e) || !e.length) return;
				let n = e[0], i, a;
				if ("borderBoxSize" in n) {
					let e = n.borderBoxSize, t = Array.isArray(e) ? e[0] : e;
					i = t.inlineSize, a = t.blockSize;
				} else i = t.offsetWidth, a = t.offsetHeight;
				r({
					width: i,
					height: a
				});
			});
			return e.observe(t, { box: "border-box" }), () => e.unobserve(t);
		} else r(void 0);
	}, [t]), n;
}
//#endregion
//#region node_modules/@radix-ui/react-checkbox/node_modules/@radix-ui/react-presence/dist/index.mjs
function M(t, n) {
	return e.useReducer((e, t) => n[e][t] ?? e, t);
}
var N = (t) => {
	let { present: n, children: r } = t, i = P(n), a = typeof r == "function" ? r({ present: i.isPresent }) : e.Children.only(r), o = ee(i.ref, te(a));
	return typeof r == "function" || i.isPresent ? e.cloneElement(a, { ref: o }) : null;
};
N.displayName = "Presence";
function P(t) {
	let [n, r] = e.useState(), i = e.useRef(null), a = e.useRef(t), o = e.useRef("none"), s = e.useRef(void 0), [c, l] = M(t ? "mounted" : "unmounted", {
		mounted: {
			UNMOUNT: "unmounted",
			ANIMATION_OUT: "unmountSuspended"
		},
		unmountSuspended: {
			MOUNT: "mounted",
			ANIMATION_END: "unmounted"
		},
		unmounted: { MOUNT: "mounted" }
	});
	return e.useEffect(() => {
		c === "mounted" ? (o.current = s.current ?? I(i.current), s.current = void 0) : o.current = "none";
	}, [c]), T(() => {
		let e = i.current, n = a.current;
		if (n !== t) {
			let r = o.current, i = I(e);
			t ? (s.current = i, l("MOUNT")) : i === "none" || e?.display === "none" ? l("UNMOUNT") : l(n && r !== i ? "ANIMATION_OUT" : "UNMOUNT"), a.current = t;
		}
	}, [t, l]), T(() => {
		if (n) {
			let e, t = n.ownerDocument.defaultView ?? window, r = (r) => {
				let o = I(i.current).includes(CSS.escape(r.animationName));
				if (r.target === n && o && (l("ANIMATION_END"), !a.current)) {
					let r = n.style.animationFillMode;
					n.style.animationFillMode = "forwards", e = t.setTimeout(() => {
						n.style.animationFillMode === "forwards" && (n.style.animationFillMode = r);
					});
				}
			}, s = (e) => {
				e.target === n && (o.current = I(i.current));
			};
			return n.addEventListener("animationstart", s), n.addEventListener("animationcancel", r), n.addEventListener("animationend", r), () => {
				t.clearTimeout(e), n.removeEventListener("animationstart", s), n.removeEventListener("animationcancel", r), n.removeEventListener("animationend", r);
			};
		} else l("ANIMATION_END");
	}, [n, l]), {
		isPresent: ["mounted", "unmountSuspended"].includes(c),
		ref: e.useCallback((e) => {
			if (e) {
				let t = getComputedStyle(e);
				i.current = t, s.current = I(t);
			} else i.current = null;
			r(e);
		}, [])
	};
}
function F(e, t) {
	if (typeof e == "function") return e(t);
	e != null && (e.current = t);
}
function ee(...t) {
	let n = e.useRef(t);
	return n.current = t, e.useCallback((e) => {
		let t = n.current, r = !1, i = t.map((t) => {
			let n = F(t, e);
			return !r && typeof n == "function" && (r = !0), n;
		});
		if (r) return () => {
			for (let e = 0; e < i.length; e++) {
				let n = i[e];
				typeof n == "function" ? n() : F(t[e], null);
			}
		};
	}, []);
}
function I(e) {
	return e?.animationName || "none";
}
function te(e) {
	let t = Object.getOwnPropertyDescriptor(e.props, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning;
	return n ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
//#endregion
//#region node_modules/@radix-ui/react-slot/dist/index.mjs
// @__NO_SIDE_EFFECTS__
function ne(t) {
	let n = e.forwardRef((n, r) => {
		let { children: i, ...a } = n, o = null, s = !1, c = [];
		le(i) && typeof pe == "function" && (i = pe(i._payload)), e.Children.forEach(i, (e) => {
			if (se(e)) {
				s = !0;
				let t = e, n = "child" in t.props ? t.props.child : t.props.children;
				le(n) && typeof pe == "function" && (n = pe(n._payload)), o = ie(t, n), c.push(o?.props?.children);
			} else c.push(e);
		}), o ? o = e.cloneElement(o, void 0, c) : !s && e.Children.count(i) === 1 && e.isValidElement(i) && (o = i);
		let l = o ? oe(o) : void 0, u = v(r, l);
		if (!o) {
			if (i || i === 0) throw Error(s ? fe(t) : de(t));
			return i;
		}
		let d = ae(a, o.props ?? {});
		return o.type !== e.Fragment && (d.ref = r ? u : l), e.cloneElement(o, d);
	});
	return n.displayName = `${t}.Slot`, n;
}
var re = Symbol.for("radix.slottable"), ie = (t, n) => {
	if ("child" in t.props) {
		let n = t.props.child;
		return e.isValidElement(n) ? e.cloneElement(n, void 0, t.props.children(n.props.children)) : null;
	}
	return e.isValidElement(n) ? n : null;
};
function ae(e, t) {
	let n = { ...t };
	for (let r in t) {
		let i = e[r], a = t[r];
		/^on[A-Z]/.test(r) ? i && a ? n[r] = (...e) => {
			let t = a(...e);
			return i(...e), t;
		} : i && (n[r] = i) : r === "style" ? n[r] = {
			...i,
			...a
		} : r === "className" && (n[r] = [i, a].filter(Boolean).join(" "));
	}
	return {
		...e,
		...n
	};
}
function oe(e) {
	let t = Object.getOwnPropertyDescriptor(e.props, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning;
	return n ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
function se(t) {
	return e.isValidElement(t) && typeof t.type == "function" && "__radixId" in t.type && t.type.__radixId === re;
}
var ce = Symbol.for("react.lazy");
function le(e) {
	return typeof e == "object" && !!e && "$$typeof" in e && e.$$typeof === ce && "_payload" in e && ue(e._payload);
}
function ue(e) {
	return typeof e == "object" && !!e && "then" in e;
}
var de = (e) => `${e} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`, fe = (e) => `${e} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`, pe = e.use, me = [
	"a",
	"button",
	"div",
	"form",
	"h2",
	"h3",
	"img",
	"input",
	"label",
	"li",
	"nav",
	"ol",
	"p",
	"select",
	"span",
	"svg",
	"ul"
].reduce((t, n) => {
	let r = /* @__PURE__ */ ne(`Primitive.${n}`), i = e.forwardRef((e, t) => {
		let { asChild: i, ...a } = e, o = i ? r : n;
		return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), /* @__PURE__ */ (0, x.jsx)(o, {
			...a,
			ref: t
		});
	});
	return i.displayName = `Primitive.${n}`, {
		...t,
		[n]: i
	};
}, {}), he = "Checkbox", [ge, _e] = S(he), [ve, ye] = ge(he);
function be(t) {
	let { __scopeCheckbox: n, checked: r, children: i, defaultChecked: a, disabled: o, form: s, name: c, onCheckedChange: l, required: u, value: d = "on", internal_do_not_use_render: f } = t, [p, m] = D({
		prop: r,
		defaultProp: a ?? !1,
		onChange: l,
		caller: he
	}), [h, g] = e.useState(null), [_, v] = e.useState(null), y = e.useRef(!1), b = h ? !!s || !!h.closest("form") : !0, S = {
		checked: p,
		disabled: o,
		setChecked: m,
		control: h,
		setControl: g,
		name: c,
		form: s,
		value: d,
		hasConsumerStoppedPropagationRef: y,
		required: u,
		defaultChecked: L(a) ? !1 : a,
		isFormControl: b,
		bubbleInput: _,
		setBubbleInput: v
	};
	return /* @__PURE__ */ (0, x.jsx)(ve, {
		scope: n,
		...S,
		children: Oe(f) ? f(S) : i
	});
}
var xe = "CheckboxTrigger", Se = e.forwardRef(({ __scopeCheckbox: t, onKeyDown: n, onClick: r, ...i }, a) => {
	let { control: o, value: s, disabled: c, checked: l, required: u, setControl: d, setChecked: f, hasConsumerStoppedPropagationRef: p, isFormControl: m, bubbleInput: h } = ye(xe, t), g = v(a, d), _ = e.useRef(l);
	return e.useEffect(() => {
		let e = o?.form;
		if (e) {
			let t = () => f(_.current);
			return e.addEventListener("reset", t), () => e.removeEventListener("reset", t);
		}
	}, [o, f]), /* @__PURE__ */ (0, x.jsx)(me.button, {
		type: "button",
		role: "checkbox",
		"aria-checked": L(l) ? "mixed" : l,
		"aria-required": u,
		"data-state": ke(l),
		"data-disabled": c ? "" : void 0,
		disabled: c,
		value: s,
		...i,
		ref: g,
		onKeyDown: w(n, (e) => {
			e.key === "Enter" && e.preventDefault();
		}),
		onClick: w(r, (e) => {
			f((e) => L(e) ? !0 : !e), h && m && (p.current = e.isPropagationStopped(), p.current || e.stopPropagation());
		})
	});
});
Se.displayName = xe;
var Ce = e.forwardRef((e, t) => {
	let { __scopeCheckbox: n, name: r, checked: i, defaultChecked: a, required: o, disabled: s, value: c, onCheckedChange: l, form: u, ...d } = e;
	return /* @__PURE__ */ (0, x.jsx)(be, {
		__scopeCheckbox: n,
		checked: i,
		defaultChecked: a,
		disabled: s,
		required: o,
		onCheckedChange: l,
		name: r,
		form: u,
		value: c,
		internal_do_not_use_render: ({ isFormControl: e }) => /* @__PURE__ */ (0, x.jsxs)(x.Fragment, { children: [/* @__PURE__ */ (0, x.jsx)(Se, {
			...d,
			ref: t,
			__scopeCheckbox: n
		}), e && /* @__PURE__ */ (0, x.jsx)(De, { __scopeCheckbox: n })] })
	});
});
Ce.displayName = he;
var we = "CheckboxIndicator", Te = e.forwardRef((e, t) => {
	let { __scopeCheckbox: n, forceMount: r, ...i } = e, a = ye(we, n);
	return /* @__PURE__ */ (0, x.jsx)(N, {
		present: r || L(a.checked) || a.checked === !0,
		children: /* @__PURE__ */ (0, x.jsx)(me.span, {
			"data-state": ke(a.checked),
			"data-disabled": a.disabled ? "" : void 0,
			...i,
			ref: t,
			style: {
				pointerEvents: "none",
				...e.style
			}
		})
	});
});
Te.displayName = we;
var Ee = "CheckboxBubbleInput", De = e.forwardRef(({ __scopeCheckbox: t, ...n }, r) => {
	let { control: i, hasConsumerStoppedPropagationRef: a, checked: o, defaultChecked: s, required: c, disabled: l, name: u, value: d, form: f, bubbleInput: p, setBubbleInput: m } = ye(Ee, t), h = v(r, m), g = A(o), _ = j(i);
	e.useEffect(() => {
		let e = p;
		if (!e) return;
		let t = window.HTMLInputElement.prototype, n = Object.getOwnPropertyDescriptor(t, "checked").set, r = !a.current;
		if (g !== o && n) {
			let t = new Event("click", { bubbles: r });
			e.indeterminate = L(o), n.call(e, L(o) ? !1 : o), e.dispatchEvent(t);
		}
	}, [
		p,
		g,
		o,
		a
	]);
	let y = e.useRef(L(o) ? !1 : o);
	return /* @__PURE__ */ (0, x.jsx)(me.input, {
		type: "checkbox",
		"aria-hidden": !0,
		defaultChecked: s ?? y.current,
		required: c,
		disabled: l,
		name: u,
		value: d,
		form: f,
		...n,
		tabIndex: -1,
		ref: h,
		style: {
			...n.style,
			..._,
			position: "absolute",
			pointerEvents: "none",
			opacity: 0,
			margin: 0,
			transform: "translateX(-100%)"
		}
	});
});
De.displayName = Ee;
function Oe(e) {
	return typeof e == "function";
}
function L(e) {
	return e === "indeterminate";
}
function ke(e) {
	return L(e) ? "indeterminate" : e ? "checked" : "unchecked";
}
//#endregion
//#region node_modules/react/cjs/react-jsx-dev-runtime.production.js
var Ae = /* @__PURE__ */ m(((e) => {
	e.Fragment = Symbol.for("react.fragment"), e.jsxDEV = void 0;
})), je = /* @__PURE__ */ m(((e) => {
	process.env.NODE_ENV !== "production" && (function() {
		function t(e) {
			if (e == null) return null;
			if (typeof e == "function") return e.$$typeof === k ? null : e.displayName || e.name || null;
			if (typeof e == "string") return e;
			switch (e) {
				case v: return "Fragment";
				case b: return "Profiler";
				case y: return "StrictMode";
				case w: return "Suspense";
				case T: return "SuspenseList";
				case O: return "Activity";
			}
			if (typeof e == "object") switch (typeof e.tag == "number" && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), e.$$typeof) {
				case _: return "Portal";
				case S: return e.displayName || "Context";
				case x: return (e._context.displayName || "Context") + ".Consumer";
				case C:
					var n = e.render;
					return e = e.displayName, e ||= (e = n.displayName || n.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
				case E: return n = e.displayName || null, n === null ? t(e.type) || "Memo" : n;
				case D:
					n = e._payload, e = e._init;
					try {
						return t(e(n));
					} catch {}
			}
			return null;
		}
		function n(e) {
			return "" + e;
		}
		function r(e) {
			try {
				n(e);
				var t = !1;
			} catch {
				t = !0;
			}
			if (t) {
				t = console;
				var r = t.error, i = typeof Symbol == "function" && Symbol.toStringTag && e[Symbol.toStringTag] || e.constructor.name || "Object";
				return r.call(t, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", i), n(e);
			}
		}
		function i(e) {
			if (e === v) return "<>";
			if (typeof e == "object" && e && e.$$typeof === D) return "<...>";
			try {
				var n = t(e);
				return n ? "<" + n + ">" : "<...>";
			} catch {
				return "<...>";
			}
		}
		function a() {
			var e = A.A;
			return e === null ? null : e.getOwner();
		}
		function o() {
			return Error("react-stack-top-frame");
		}
		function s(e) {
			if (j.call(e, "key")) {
				var t = Object.getOwnPropertyDescriptor(e, "key").get;
				if (t && t.isReactWarning) return !1;
			}
			return e.key !== void 0;
		}
		function c(e, t) {
			function n() {
				P || (P = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", t));
			}
			n.isReactWarning = !0, Object.defineProperty(e, "key", {
				get: n,
				configurable: !0
			});
		}
		function l() {
			var e = t(this.type);
			return F[e] || (F[e] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release.")), e = this.props.ref, e === void 0 ? null : e;
		}
		function u(e, t, n, r, i, a) {
			var o = n.ref;
			return e = {
				$$typeof: g,
				type: e,
				key: t,
				props: n,
				_owner: r
			}, (o === void 0 ? null : o) === null ? Object.defineProperty(e, "ref", {
				enumerable: !1,
				value: null
			}) : Object.defineProperty(e, "ref", {
				enumerable: !1,
				get: l
			}), e._store = {}, Object.defineProperty(e._store, "validated", {
				configurable: !1,
				enumerable: !1,
				writable: !0,
				value: 0
			}), Object.defineProperty(e, "_debugInfo", {
				configurable: !1,
				enumerable: !1,
				writable: !0,
				value: null
			}), Object.defineProperty(e, "_debugStack", {
				configurable: !1,
				enumerable: !1,
				writable: !0,
				value: i
			}), Object.defineProperty(e, "_debugTask", {
				configurable: !1,
				enumerable: !1,
				writable: !0,
				value: a
			}), Object.freeze && (Object.freeze(e.props), Object.freeze(e)), e;
		}
		function d(e, n, i, o, l, d) {
			var p = n.children;
			if (p !== void 0) if (o) if (M(p)) {
				for (o = 0; o < p.length; o++) f(p[o]);
				Object.freeze && Object.freeze(p);
			} else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
			else f(p);
			if (j.call(n, "key")) {
				p = t(e);
				var m = Object.keys(n).filter(function(e) {
					return e !== "key";
				});
				o = 0 < m.length ? "{key: someKey, " + m.join(": ..., ") + ": ...}" : "{key: someKey}", te[p + o] || (m = 0 < m.length ? "{" + m.join(": ..., ") + ": ...}" : "{}", console.error("A props object containing a \"key\" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />", o, p, m, p), te[p + o] = !0);
			}
			if (p = null, i !== void 0 && (r(i), p = "" + i), s(n) && (r(n.key), p = "" + n.key), "key" in n) for (var h in i = {}, n) h !== "key" && (i[h] = n[h]);
			else i = n;
			return p && c(i, typeof e == "function" ? e.displayName || e.name || "Unknown" : e), u(e, p, i, a(), l, d);
		}
		function f(e) {
			p(e) ? e._store && (e._store.validated = 1) : typeof e == "object" && e && e.$$typeof === D && (e._payload.status === "fulfilled" ? p(e._payload.value) && e._payload.value._store && (e._payload.value._store.validated = 1) : e._store && (e._store.validated = 1));
		}
		function p(e) {
			return typeof e == "object" && !!e && e.$$typeof === g;
		}
		var m = h("react"), g = Symbol.for("react.transitional.element"), _ = Symbol.for("react.portal"), v = Symbol.for("react.fragment"), y = Symbol.for("react.strict_mode"), b = Symbol.for("react.profiler"), x = Symbol.for("react.consumer"), S = Symbol.for("react.context"), C = Symbol.for("react.forward_ref"), w = Symbol.for("react.suspense"), T = Symbol.for("react.suspense_list"), E = Symbol.for("react.memo"), D = Symbol.for("react.lazy"), O = Symbol.for("react.activity"), k = Symbol.for("react.client.reference"), A = m.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, j = Object.prototype.hasOwnProperty, M = Array.isArray, N = console.createTask ? console.createTask : function() {
			return null;
		};
		m = { react_stack_bottom_frame: function(e) {
			return e();
		} };
		var P, F = {}, ee = m.react_stack_bottom_frame.bind(m, o)(), I = N(i(o)), te = {};
		e.Fragment = v, e.jsxDEV = function(e, t, n, r) {
			var a = 1e4 > A.recentlyCreatedOwnerStacks++;
			return d(e, t, n, r, a ? Error("react-stack-top-frame") : ee, a ? N(i(e)) : I);
		};
	})();
})), Me = /* @__PURE__ */ m(((e, t) => {
	process.env.NODE_ENV === "production" ? t.exports = Ae() : t.exports = je();
})), Ne = /* @__PURE__ */ m(((e) => {
	var t = (e) => {
		let t, n = /* @__PURE__ */ new Set(), r = (e, r) => {
			let i = typeof e == "function" ? e(t) : e;
			if (!Object.is(i, t)) {
				let e = t;
				t = r ?? (typeof i != "object" || !i) ? i : Object.assign({}, t, i), n.forEach((n) => n(t, e));
			}
		}, i = () => t, a = {
			setState: r,
			getState: i,
			getInitialState: () => o,
			subscribe: (e) => (n.add(e), () => n.delete(e))
		}, o = t = e(r, i, a);
		return a;
	};
	e.createStore = ((e) => e ? t(e) : t);
})), Pe = /* @__PURE__ */ m(((e) => {
	var t = h("react"), n = Ne(), r = (e) => e;
	function i(e, n = r) {
		let i = t.useSyncExternalStore(e.subscribe, t.useCallback(() => n(e.getState()), [e, n]), t.useCallback(() => n(e.getInitialState()), [e, n]));
		return t.useDebugValue(i), i;
	}
	var a = (e) => {
		let t = n.createStore(e), r = (e) => i(t, e);
		return Object.assign(r, t), r;
	};
	e.create = ((e) => e ? a(e) : a), e.useStore = i;
})), Fe = /* @__PURE__ */ m(((e) => {
	var t = Ne(), n = Pe();
	Object.keys(t).forEach(function(n) {
		n !== "default" && !Object.prototype.hasOwnProperty.call(e, n) && Object.defineProperty(e, n, {
			enumerable: !0,
			get: function() {
				return t[n];
			}
		});
	}), Object.keys(n).forEach(function(t) {
		t !== "default" && !Object.prototype.hasOwnProperty.call(e, t) && Object.defineProperty(e, t, {
			enumerable: !0,
			get: function() {
				return n[t];
			}
		});
	});
})), R = Fe(), Ie = {
	activeSession: null,
	error: null,
	refresh: null,
	refreshId: 0,
	report: null,
	request: null,
	retryAttempt: 0,
	status: "idle"
}, Le = (0, R.create)()((e) => ({
	...Ie,
	refreshAudit(t) {
		e((e) => ({
			refreshId: e.refreshId + 1,
			refresh: {
				id: e.refreshId + 1,
				session: t
			}
		}));
	},
	resetAudit() {
		e(Ie);
	},
	setError(t) {
		e({
			error: t,
			retryAttempt: 0,
			status: "error"
		});
	},
	setLoaded(t, n) {
		e((e) => e.activeSession !== null && e.activeSession !== t ? e : {
			activeSession: t,
			error: null,
			report: n,
			retryAttempt: 0,
			status: "success"
		});
	},
	setLoading(t, n) {
		let r = crypto.randomUUID();
		return e((e) => ({
			activeSession: t,
			request: r,
			error: null,
			report: e.activeSession === t ? e.report : null,
			retryAttempt: n ? e.retryAttempt : 1,
			status: n ? e.status : "loading"
		})), r;
	},
	setRefreshing(t) {
		e((e) => ({
			activeSession: t,
			error: null,
			report: e.activeSession === t ? e.report : null,
			retryAttempt: 1,
			status: "refreshing"
		}));
	},
	setRetryAttempt(t) {
		e({ retryAttempt: t });
	}
})), z = Le, Re = /* @__PURE__ */ m(((e) => {
	function t(e, t) {
		let n;
		try {
			n = e();
		} catch {
			return;
		}
		return {
			getItem: (e) => {
				let r = (e) => e === null ? null : JSON.parse(e, t?.reviver), i = n.getItem(e) ?? null;
				return i instanceof Promise ? i.then(r) : r(i);
			},
			setItem: (e, r) => n.setItem(e, JSON.stringify(r, t?.replacer)),
			removeItem: (e) => n.removeItem(e)
		};
	}
	var n = (e) => (t) => {
		try {
			let r = e(t);
			return r instanceof Promise ? r : {
				then(e) {
					return n(e)(r);
				},
				catch(e) {
					return this;
				}
			};
		} catch (e) {
			return {
				then(e) {
					return this;
				},
				catch(t) {
					return n(t)(e);
				}
			};
		}
	};
	e.persist = (e, r) => (i, a, o) => {
		let s = {
			storage: t(() => window.localStorage),
			partialize: (e) => e,
			version: 0,
			merge: (e, t) => ({
				...t,
				...e
			}),
			...r
		}, c = !1, l = 0, u = /* @__PURE__ */ new Set(), d = /* @__PURE__ */ new Set(), f = s.storage;
		if (!f) return e((...e) => {
			console.warn(`[zustand persist middleware] Unable to update item '${s.name}', the given storage is currently unavailable.`), i(...e);
		}, a, o);
		let p = () => {
			let e = s.partialize({ ...a() });
			return f.setItem(s.name, {
				state: e,
				version: s.version
			});
		}, m = o.setState;
		o.setState = (e, t) => (m(e, t), p());
		let h = e((...e) => (i(...e), p()), a, o);
		o.getInitialState = () => h;
		let g, _ = () => {
			if (!f) return;
			let e = ++l;
			c = !1, u.forEach((e) => e(a() ?? h));
			let t = s.onRehydrateStorage?.call(s, a() ?? h) || void 0;
			return n(f.getItem.bind(f))(s.name).then((e) => {
				if (e) if (typeof e.version == "number" && e.version !== s.version) {
					if (s.migrate) {
						let t = s.migrate(e.state, e.version);
						return t instanceof Promise ? t.then((e) => [!0, e]) : [!0, t];
					}
					console.error("State loaded from storage couldn't be migrated since no migrate function was provided");
				} else return [!1, e.state];
				return [!1, void 0];
			}).then((t) => {
				if (e !== l) return;
				let [n, r] = t;
				if (g = s.merge(r, a() ?? h), i(g, !0), n) return p();
			}).then(() => {
				e === l && (t?.(a(), void 0), g = a(), c = !0, d.forEach((e) => e(g)));
			}).catch((n) => {
				e === l && t?.(void 0, n);
			});
		};
		return o.persist = {
			setOptions: (e) => {
				s = {
					...s,
					...e
				}, e.storage && (f = e.storage);
			},
			clearStorage: () => {
				f?.removeItem(s.name);
			},
			getOptions: () => s,
			rehydrate: () => _(),
			hasHydrated: () => c,
			onHydrate: (e) => (u.add(e), () => {
				u.delete(e);
			}),
			onFinishHydration: (e) => (d.add(e), () => {
				d.delete(e);
			})
		}, s.skipHydration || _(), g || h;
	};
})), ze = Re(), Be = (0, R.create)()((e, t) => ({
	session: null,
	json: null,
	getJSON(e) {
		return t().session === e ? t().json : null;
	},
	removeJSON(n) {
		t().session === n && e({ json: null });
	},
	resetJSON() {
		e({
			session: null,
			json: null
		});
	},
	setJSON(t, n) {
		e({
			session: t,
			json: n
		});
	}
})), B = Be;
//#endregion
//#region src/features/queue/data/indexChange.ts
function Ve(e) {
	if (!e || typeof e != "object") throw Object.assign(/* @__PURE__ */ Error("Invalid index change."), { code: "invalid_change" });
	let t = e;
	if (![
		"add",
		"update",
		"remove"
	].includes(t.action)) throw Object.assign(/* @__PURE__ */ Error("Invalid index action."), { code: "invalid_action" });
	if (typeof t.explanation != "string") throw Object.assign(/* @__PURE__ */ Error("Invalid index explanation."), { code: "invalid_explanation" });
	if (t.allow_enrichment !== void 0 && typeof t.allow_enrichment != "boolean") throw Object.assign(/* @__PURE__ */ Error("Invalid enrichment choice."), { code: "invalid_enrichment" });
	for (let e of [
		"label",
		"aspect",
		"value",
		"ambiguous"
	]) {
		let n = t[`new_index_${e}`];
		if (n !== null && typeof n != "string" || t.action === "add" && (e === "aspect" || e === "value") && !n?.trim()) throw Object.assign(/* @__PURE__ */ Error(`Invalid index ${e}.`), { code: `invalid_${e}` });
	}
	if (t.action === "add") for (let e of ["page", "source"]) {
		let n = t[`new_index_${e}`];
		if (n != null && typeof n != "string") throw Object.assign(/* @__PURE__ */ Error(`Invalid index ${e}.`), { code: `invalid_${e}` });
	}
	if ([
		t.old_index_label,
		t.old_index_aspect,
		t.old_index_value
	].some((e) => e !== null && typeof e != "string")) throw Object.assign(/* @__PURE__ */ Error("Invalid original index."), { code: "invalid_target" });
	if (t.action !== "add" && ![
		t.old_index_label,
		t.old_index_aspect,
		t.old_index_value
	].some((e) => e?.trim())) throw Object.assign(/* @__PURE__ */ Error("An index change requires its original label, aspect, or value."), { code: "invalid_target" });
}
//#endregion
//#region src/features/queue/data/queueData.ts
function V(e) {
	return [...new Set(e.normalize("NFKC").replace(/[\uFEFF\u200B\u200C\u200D]/g, "").split(/[\s_\-/. ,:]+/u).filter(Boolean).map((e) => e.replace(/[,.:;\-/]+$/, "").replace(/[A-Z]/g, (e) => e.toLowerCase())).map((e) => /^\d+$/.test(e) ? e.replace(/^0+(?=\d)/, "") : e).filter(Boolean))].sort().join("");
}
function He(e, t) {
	return [
		"label",
		"aspect",
		"value"
	].every((n) => {
		let r = t[`old_index_${n}`];
		return !r?.trim() || e[n] !== void 0 && V(e[n]) === V(r);
	});
}
function Ue(e, t, n) {
	if ("action" in e && (e.action === "reprocess" || e.action === "clear")) return [{
		action: e.action,
		segment: e.segment
	}];
	let r = [
		...t.indexes ?? [],
		...t.parties?.indexes ?? [],
		...t.execution?.indexes ?? [],
		...t.secrets ?? []
	];
	if ("action" in e && e.action === "page") return d(f(t), e.code, e.segments), [{
		action: "page",
		code: e.code,
		segments: [...e.segments],
		index: {
			code: e.code,
			segment: "page",
			value: e.code
		},
		patch: null
	}];
	if (!("data" in e)) {
		let t = r.find((t) => t.code === e.code);
		if (!t) throw Error("The selected index is no longer available.");
		return [{
			action: e.action,
			code: e.code,
			index: t,
			patch: null
		}];
	}
	let i = JSON.parse(e.data);
	if (!Array.isArray(i) || i.length === 0) throw Error("No index changes were provided.");
	let a = t;
	return i.map((t, r) => {
		Ve(t);
		let i = t, o = [
			...a.indexes ?? [],
			...a.parties?.indexes ?? [],
			...a.execution?.indexes ?? [],
			...(a.secrets ?? []).map((e) => ({
				...e,
				aspect: e.label
			})),
			...(a.legals?.groups ?? []).flatMap((e) => (e.elements ?? []).map((t) => ({
				...t,
				code: e.code,
				label: "legal",
				segment: "legal",
				page: e.page
			})))
		], s = e.segment === "party" && i.action !== "remove" && !i.allow_enrichment, c = s ? a.parties?.indexes ?? [] : o, l = i.action === "add" ? void 0 : c.find((e) => He(e, i)), u = l ? {
			...l,
			...s ? { segment: e.segment } : {}
		} : {
			code: `${n}:${r}`,
			segment: e.segment,
			...i.new_index_label === null ? {} : { label: i.new_index_label },
			...i.new_index_aspect === null ? {} : { aspect: i.new_index_aspect },
			...i.new_index_value === null ? {} : { value: i.new_index_value },
			...i.new_index_ambiguous === null ? {} : { ambiguous: i.new_index_ambiguous },
			...i.new_index_page == null ? {} : { page: i.new_index_page },
			...i.new_index_source == null ? {} : { source: i.new_index_source },
			explanation: i.explanation
		}, d = {
			action: "patch",
			code: u.code ?? "",
			index: u,
			patch: i
		};
		return a = We(a, d), d;
	});
}
function We(e, t) {
	if ("segment" in t) return e;
	if (t.action === "page") return s(d(f(e), t.code, t.segments));
	let n = t.patch, r = (e) => t.code ? e.code === t.code : !!(n && He(e, n)), i = (e, i) => n?.action === "add" ? e.some((e) => i ? e.code === t.index.code : e.aspect !== void 0 && e.value !== void 0 && V(e.aspect) === V(n.new_index_aspect) && V(e.value) === V(n.new_index_value)) ? e : [t.index, ...e] : t.action === "drop" || n?.action === "remove" ? e.filter((e) => !r(e)) : e.map((e) => {
		if (!r(e)) return e;
		if (t.action === "confirm") return {
			...e,
			ambiguous: "NO"
		};
		let i = { ...e };
		if (n) {
			for (let e of [
				"label",
				"aspect",
				"value",
				"ambiguous"
			]) {
				let t = n[`new_index_${e}`];
				t?.trim() && (i[e] = t.trim());
			}
			i.explanation = n.explanation;
		}
		return i;
	});
	if (t.index.segment === "execution") return {
		...e,
		execution: { indexes: i(e.execution?.indexes ?? [], !0) }
	};
	if (t.index.segment === "party" && n && n.action !== "remove" && !n.allow_enrichment) return {
		...e,
		parties: { indexes: i(n.action === "add" ? u(e).parties : e.parties?.indexes ?? [], !1) }
	};
	let a = {
		...e,
		indexes: i(e.indexes ?? [], !1)
	};
	return e.parties && (n?.action !== "add" || t.index.segment === "party") && (a.parties = {
		...e.parties,
		indexes: i(e.parties.indexes, !1)
	}), e.secrets && (n?.action !== "add" || t.index.segment === "secrets") && (a.secrets = i(e.secrets.map((e) => ({
		...e,
		aspect: e.label
	})), !1)), n && n.action !== "add" && e.legals?.groups && (a.legals = {
		...e.legals,
		groups: e.legals.groups.map((e) => ({
			...e,
			elements: e.elements?.flatMap((e) => He({
				...e,
				label: "legal"
			}, n) ? n.action === "remove" ? [] : [{
				...e,
				...n.new_index_aspect ? { aspect: n.new_index_aspect } : {},
				...n.new_index_value ? { value: n.new_index_value } : {},
				explanation: n.explanation
			}] : [e])
		}))
	}), a;
}
//#endregion
//#region src/features/queue/store/queueStore.ts
function H(e, t, n, r) {
	e.runtime.onChange({
		session: e.session,
		batch: e.batch,
		status: t,
		error: e.error,
		changes: structuredClone(n),
		...r === void 0 ? {} : {
			type: "metadata-updated",
			etag: U.getState().etag
		}
	});
}
var Ge = (0, R.create)()((0, ze.persist)((e, t) => {
	let n = null, r = 0, i = !1;
	function a(e) {
		return t().tasks.every((t) => t.session !== e || t.status !== "failed" && t.cursor === t.changes.length);
	}
	function o(e) {
		let n = t().session === e ? t().base : null;
		if (!n) return;
		let r = t().tasks.filter((t) => t.session === e).reduce((e, t) => t.changes.reduce((e, n, r) => n.action === "patch" && n.patch?.action === "add" || r >= t.cursor && (n.action === "page" || n.action === "confirm") ? We(e, n) : e, e), n);
		B.getState().setJSON(e, f(r));
	}
	function c(t) {
		e((e) => {
			let r = e.queues.map((n) => ({
				...n,
				pending: e.tasks.filter((e) => e.session === n.session && e.batch === n.batch && e.status !== "failed").length,
				failed: e.tasks.filter((e) => e.session === n.session && e.batch === n.batch && e.status === "failed").length,
				completed: n.completed + +(t?.session === n.session && t.batch === n.batch)
			}));
			return {
				tasks: [...e.tasks],
				queues: r,
				...n === null ? {} : { snapshot: {
					owner: n,
					session: e.session,
					tasks: e.tasks.map(({ runtime: e, ...t }) => t),
					queues: r,
					base: e.base,
					path: e.path,
					etag: e.etag,
					pagePath: e.pagePath,
					pageEtag: e.pageEtag
				} }
			};
		});
	}
	async function l() {
		if (i) return;
		i = !0;
		let n = r;
		try {
			for (;;) {
				let i = t().tasks.find((e) => e.status === "queued" && e.cursor < e.changes.length) ?? t().tasks.find((e) => e.status !== "failed" && a(e.session));
				if (!i) break;
				i.status = "processing", i.error = null;
				let s = i.cursor === i.changes.length;
				s && H(i, "processing", []), c();
				let { authToken: l, client: u, intervalMs: d } = i.runtime;
				try {
					for (; i.cursor < i.changes.length;) {
						let a = i.changes[i.cursor];
						if (H(i, "processing", [a]), "segment" in a) {
							if (await u[a.action === "clear" ? "clearSegment" : "reprocessSegment"](l, i.session, a.segment), n !== r) return;
						} else if (a.action === "page") {
							if (await u.updatePageSegments(l, i.session, a.code, a.segments), n !== r) return;
						} else {
							if (!i.result) {
								if (i.result = a.patch ? await u.patchIndex(l, i.session, i.segment, a.patch) : a.action === "confirm" ? await u.confirmIndex(l, i.session, a.code) : await u.dropIndex(l, i.session, a.code), n !== r) return;
								c();
							}
							for (; i.result.status === "pending" || i.result.status === "processing";) {
								if (await new Promise((e) => setTimeout(e, d)), n !== r || (i.result = await u.patchStatus(l, i.session, i.result.version), n !== r)) return;
								c();
							}
							if (i.result.status === "error") {
								let e = i.result.data;
								throw i.result = null, Error(e);
							}
						}
						(a.action === "page" || a.action === "confirm") && e({ base: We(t().base, a) }), H(i, "completed", [a]), i.cursor += 1, i.result = null, c();
					}
					let f = i.changes.some((e) => "segment" in e);
					if (i.status = f ? "processing" : "completed", c(s || f ? void 0 : i), !a(i.session)) continue;
					let p = t().tasks.every((e) => e.session !== i.session || e.changes.every((e) => e.action === "page")) ? {
						...t().base,
						pages: await u.pagesData(l, i.session, !0)
					} : await u.indexData(l, i.session, !0);
					if (n !== r) return;
					if (!a(i.session)) continue;
					e({ base: p });
					let m = t().tasks.filter((e) => e.session === i.session && e.changes.some((e) => "segment" in e));
					e((e) => ({ tasks: e.tasks.filter((e) => e.session !== i.session) })), o(i.session), H(i, "completed", [], p), t().tasks.some((e) => e.session === i.session) || e({ base: null }), s && H(i, "completed", []), c();
					for (let e of m) c(e);
				} catch (e) {
					if (n !== r) return;
					i.status = "failed", i.error = i.runtime.formatError(e), H(i, "failed", i.changes.slice(i.cursor, i.cursor + 1)), c();
				}
			}
		} finally {
			n === r && (i = !1);
		}
	}
	return {
		tasks: [],
		queues: [],
		snapshot: null,
		session: null,
		base: null,
		path: null,
		etag: null,
		pagePath: null,
		pageEtag: null,
		generation: 0,
		restore(a, s) {
			if (n === a) {
				for (let e of t().tasks) e.runtime = s;
				return;
			}
			r += 1, i = !1, n = a, B.getState().resetJSON();
			let u = t().snapshot?.owner === a ? t().snapshot : null;
			e({
				tasks: (u?.tasks ?? []).map((e) => {
					let t = {
						...e,
						runtime: s
					};
					return t.status === "processing" && (!t.result && t.cursor < t.changes.length ? (t.status = "failed", t.error = "The page closed before this request was acknowledged. Review the metadata before retrying; the server may already have accepted it.") : t.status = "queued", H(t, t.status, t.changes.slice(t.cursor))), t;
				}),
				queues: u?.queues ?? [],
				session: u?.session ?? null,
				base: u?.base ?? null,
				path: u?.path ?? null,
				etag: u?.etag ?? null,
				pagePath: u?.pagePath ?? null,
				pageEtag: u?.pageEtag ?? null,
				generation: r
			}), t().session && o(t().session), c(), l();
		},
		async enqueue(n, r) {
			let i = s(B.getState().getJSON(n.session));
			if (!i) throw Error("Load metadata before changing indexes.");
			let a = crypto.randomUUID(), u = Ue(n, i, a);
			if (t().session !== null && t().session !== n.session) throw Error("This change does not belong to the current metadata session.");
			t().base || e({
				session: n.session,
				base: i
			});
			let d = {
				id: a,
				batch: n.batch,
				session: n.session,
				segment: n.segment,
				changes: u,
				cursor: 0,
				result: null,
				status: "queued",
				error: null,
				runtime: r
			};
			return e((e) => ({
				tasks: [...e.tasks, d],
				queues: e.queues.some((e) => e.session === n.session && e.batch === n.batch) ? e.queues : [...e.queues, {
					id: "index",
					batch: n.batch,
					session: n.session,
					pending: 0,
					failed: 0,
					completed: 0
				}]
			})), o(n.session), H(d, "queued", u), c(), l(), { status: "accepted" };
		},
		async retry(e) {
			let n = t().tasks.find((t) => t.id === e);
			if (!n || n.status !== "failed") throw Error("This change is not available for retry.");
			return n.status = "queued", n.error = null, H(n, "retried", n.changes.slice(n.cursor)), c(), l(), { status: "accepted" };
		},
		cancel(n, r) {
			let i = t().tasks.find((e) => e.id === n);
			if (!i || i.status === "processing") throw Error("A processing change cannot be canceled.");
			let a = i.changes.slice(i.cursor).filter((e) => "segment" in e ? r === void 0 : e.code === r);
			if (a.length === 0) throw Error("A completed change cannot be canceled.");
			H(i, "canceled", a), a.includes(i.changes[i.cursor]) && (i.result = null), i.changes = i.changes.filter((e) => !a.includes(e)), i.changes.length === i.cursor && e((e) => ({ tasks: e.tasks.filter((e) => e.id !== n) })), o(i.session), t().tasks.some((e) => e.session === i.session) || e({ base: null }), c(), l();
		},
		setPagePath(n, r) {
			t().session !== null && t().session !== n || (e({
				session: n,
				pagePath: r
			}), c());
		},
		setPageEtag(n, r) {
			t().session !== null && t().session !== n || (e({
				session: n,
				pageEtag: r
			}), c());
		},
		setPath(n, r) {
			t().session !== null && t().session !== n || (e({
				session: n,
				path: r
			}), c());
		},
		setEtag(n, r) {
			t().session !== null && t().session !== n || t().session === n && r === void 0 || (e({
				session: n,
				...r === void 0 ? {} : { etag: r }
			}), c());
		},
		setMetadata(n, r) {
			t().session !== null && t().session !== n || (t().tasks.some((e) => e.session === n) ? (e({ base: r }), o(n), c()) : B.getState().setJSON(n, f(r)));
		},
		reset() {
			r += 1, i = !1, t().session && t().base && B.getState().setJSON(t().session, f(t().base)), e({
				tasks: [],
				queues: [],
				session: null,
				base: null,
				path: null,
				etag: null,
				pagePath: null,
				pageEtag: null,
				snapshot: null,
				generation: r
			}), c();
		}
	};
}, {
	name: "aurorra-index:queue",
	version: 1,
	partialize: (e) => ({ snapshot: e.snapshot })
})), U = Ge, Ke = {
	etag: null,
	reportEtag: null,
	removedCodes: /* @__PURE__ */ new Set(),
	metadataEtag: null,
	verificationEtag: null,
	verificationModel: null,
	activeSession: null,
	error: null,
	report: null,
	retryAttempt: 0,
	status: "idle"
}, qe = (0, R.create)()((e, t) => ({
	...Ke,
	generation: 0,
	reportGeneration: 0,
	resetIq() {
		e((e) => ({
			...Ke,
			generation: e.generation + 1,
			reportGeneration: e.reportGeneration + 1
		}));
	},
	setError(t) {
		e({
			error: t,
			retryAttempt: 0,
			status: "error"
		});
	},
	setLoaded(t, n, r, i, a, o) {
		e((e) => ({
			activeSession: t,
			error: null,
			report: n,
			metadataEtag: r,
			verificationEtag: i,
			verificationModel: a,
			etag: o?.etag,
			reportEtag: o?.reportEtag,
			removedCodes: new Set(o?.acknowledgements?.map((e) => e.code)),
			retryAttempt: 0,
			status: "success",
			reportGeneration: e.reportGeneration + 1
		}));
	},
	setAcknowledged(t, n) {
		e((e) => ({
			etag: n,
			removedCodes: new Set([...e.removedCodes, t])
		}));
	},
	setVerificationModel(n, r) {
		let i = t();
		i.activeSession !== n || i.verificationModel?.etag === r.etag || e({ verificationModel: r });
	},
	setLoading(t, n) {
		e((e) => ({
			activeSession: t,
			error: null,
			retryAttempt: 1,
			report: e.activeSession === t ? e.report : null,
			reportGeneration: e.reportGeneration + 1,
			etag: e.activeSession === t ? e.etag : null,
			reportEtag: e.activeSession === t ? e.reportEtag : null,
			removedCodes: e.activeSession === t ? e.removedCodes : /* @__PURE__ */ new Set(),
			metadataEtag: e.activeSession === t ? e.metadataEtag : null,
			verificationEtag: e.activeSession === t ? e.verificationEtag : null,
			verificationModel: e.activeSession === t ? e.verificationModel : null,
			status: n ? "refreshing" : "loading"
		}));
	},
	setRetryAttempt(t) {
		e({ retryAttempt: t });
	}
})), Je = qe;
//#endregion
//#region src/features/imageviewer/data/imageViewerData.ts
function Ye(e) {
	return !!e && typeof e == "object" && !Array.isArray(e);
}
function Xe(e, t) {
	if (Ye(e)) {
		let n = e;
		return {
			...e instanceof ErrorEvent ? { cause: e } : n.cause instanceof ErrorEvent ? { cause: n.cause } : {},
			code: typeof n.code == "string" ? n.code : void 0,
			details: n.details,
			error: typeof n.error == "string" ? n.error : typeof n.message == "string" ? n.message : t,
			status: typeof n.status == "number" ? n.status : void 0
		};
	}
	return { error: typeof e == "string" && e ? e : t };
}
function Ze(e) {
	return typeof e == "string" && /^https?:\/\//i.test(e);
}
function Qe(e) {
	if (!Ze(e.tiff) || !Ze(e.data)) throw {
		code: "invalid_image_package",
		details: e,
		error: "Image package JSON does not identify TIFF and JSON URLs."
	};
	return {
		jsonUrl: e.data,
		tiffUrl: e.tiff
	};
}
function $e(e) {
	return e?.code === "page_out_of_range";
}
//#endregion
//#region src/features/imageviewer/store/imageViewerStore.ts
var et = (0, R.create)()((e, t) => ({
	generation: 0,
	pageSize: null,
	apiGatewayUrl: "",
	authToken: null,
	error: null,
	fitPageVersion: 0,
	onError: null,
	pageMap: /* @__PURE__ */ new Map(),
	packageMetadata: null,
	packageStatus: null,
	packageVersion: 0,
	request: null,
	requestVersion: 0,
	searchText: "",
	selectedIndex: null,
	session: null,
	status: "idle",
	tiffBytes: null,
	tiffType: null,
	thumbsOpen: !1,
	viewerState: null,
	viewerStatus: "idle",
	workerClient: null,
	resetLens() {
		let n = t(), r = !!(n.packageMetadata && n.tiffBytes && n.tiffType !== null);
		e({
			error: null,
			fitPageVersion: 0,
			packageStatus: r ? "completed" : null,
			searchText: "",
			status: r ? "ready" : "idle",
			thumbsOpen: !1,
			viewerState: null,
			viewerStatus: "idle"
		});
	},
	resetViewer() {
		e({
			generation: t().generation + 1,
			pageSize: null,
			apiGatewayUrl: "",
			authToken: null,
			error: null,
			fitPageVersion: 0,
			onError: null,
			pageMap: /* @__PURE__ */ new Map(),
			packageMetadata: null,
			packageStatus: null,
			packageVersion: 0,
			request: null,
			requestVersion: 0,
			searchText: "",
			selectedIndex: null,
			session: null,
			status: "idle",
			tiffBytes: null,
			tiffType: null,
			thumbsOpen: !1,
			viewerState: null,
			viewerStatus: "idle",
			workerClient: null
		});
	},
	setError(n) {
		t().onError?.(n), e({
			error: n,
			status: "error"
		});
	},
	fitPage() {
		e({ fitPageVersion: t().fitPageVersion + 1 });
	},
	setHostInput(n) {
		let r = t(), i = r.session === n.session;
		e({
			generation: i ? r.generation : r.generation + 1,
			pageSize: n.pageSize,
			apiGatewayUrl: n.apiGatewayUrl,
			authToken: n.authToken,
			error: i && $e(r.error) ? r.error : null,
			fitPageVersion: i ? r.fitPageVersion : 0,
			onError: n.onError,
			pageMap: new Map(n.pageMap),
			packageMetadata: i ? r.packageMetadata : null,
			packageStatus: i ? r.packageStatus : null,
			packageVersion: i ? r.packageVersion : 0,
			request: n.request,
			requestVersion: i ? r.requestVersion : 0,
			selectedIndex: n.selectedIndex,
			session: n.session,
			status: i ? r.status : "idle",
			tiffBytes: i ? r.tiffBytes : null,
			tiffType: i ? r.tiffType : null,
			workerClient: n.workerClient ?? null
		});
	},
	setLocalPackage(n) {
		e({
			error: null,
			packageMetadata: n.packageMetadata,
			packageStatus: "completed",
			packageVersion: t().packageVersion + 1,
			status: "ready",
			tiffBytes: n.tiffBytes,
			tiffType: n.tiffType
		});
	},
	setPackageStatus(t) {
		e({ packageStatus: t });
	},
	setReady() {
		e({
			error: null,
			status: "ready"
		});
	},
	setRequest(n) {
		e({
			request: n,
			requestVersion: t().requestVersion + 1
		});
	},
	setSearchText(t) {
		e({ searchText: t });
	},
	setStatus(t) {
		e({ status: t });
	},
	setThumbsOpen(t) {
		e({ thumbsOpen: t });
	},
	setViewerState(t) {
		e({ viewerState: t });
	},
	setViewerStatus(t) {
		e({ viewerStatus: t });
	}
})), W = et, tt = (0, R.create)()((e) => ({
	request: null,
	open(t) {
		e({ request: {
			...t,
			index: { ...t.index }
		} });
	},
	close() {
		e({ request: null });
	}
})), nt = tt, rt = (0, R.create)()((e) => ({
	request: null,
	close() {
		e({ request: null });
	},
	open(t) {
		e({ request: t });
	}
})), it = rt, at = (0, R.create)()((e) => ({
	committed: [],
	error: null,
	request: null,
	selected: [],
	status: "idle",
	close() {
		e({ request: null });
	},
	open(t) {
		e({ request: t });
	},
	reset(t) {
		e({
			committed: [...t],
			error: null,
			selected: [...t],
			status: "idle"
		});
	},
	restore() {
		e((e) => ({
			error: null,
			selected: [...e.committed],
			status: "idle"
		}));
	},
	setError(t) {
		e({
			error: t,
			status: "error"
		});
	},
	setSelected(t) {
		e({
			error: null,
			selected: [...t],
			status: "idle"
		});
	},
	setSaving() {
		e({
			error: null,
			status: "saving"
		});
	}
})), ot = at, st = (0, R.create)()((e, t) => ({
	choices: null,
	activeSession: null,
	openSegment: null,
	error: null,
	pageError: null,
	pageRequest: null,
	refresh: null,
	refreshId: 0,
	retryAttempt: 0,
	status: "idle",
	getSegment(n) {
		return t().openSegment || (e({ openSegment: n }), n);
	},
	invalidateSession(n) {
		t().activeSession === n && (B.getState().removeJSON(n), e({
			pageError: null,
			pageRequest: null,
			error: null,
			status: "idle"
		}));
	},
	resetMetadata() {
		U.getState().reset(), B.getState().resetJSON(), z.getState().resetAudit(), Je.getState().resetIq(), W.getState().resetViewer(), nt.getState().close(), it.getState().close(), ot.getState().close(), ot.getState().reset([]), e({ pageError: null }), t().resetView();
	},
	resetView() {
		e({
			choices: null,
			activeSession: null,
			openSegment: null,
			error: null,
			pageRequest: null,
			refresh: null,
			refreshId: 0,
			retryAttempt: 0,
			status: "idle"
		});
	},
	refreshMetadata(n, r) {
		t().activeSession === n && e((e) => ({
			refreshId: e.refreshId + 1,
			refresh: {
				id: e.refreshId + 1,
				segment: r,
				session: n
			}
		}));
	},
	setError(t) {
		e({
			error: t,
			retryAttempt: 0,
			status: "error"
		});
	},
	setPageError(n, r) {
		t().activeSession === n && e({ pageError: r });
	},
	setPageLoading(n) {
		let r = crypto.randomUUID();
		return t().activeSession === null && t().setLoading(n), t().activeSession === n && e({ pageRequest: r }), r;
	},
	setLoaded(n) {
		t().activeSession !== n && t().setLoading(n), e({
			activeSession: n,
			error: null,
			retryAttempt: 0,
			status: "success"
		});
	},
	setLoading(n) {
		t().selectSession(n), e({
			activeSession: n,
			error: null,
			retryAttempt: 1,
			status: "loading"
		});
	},
	selectSession(e, n) {
		[
			t().activeSession,
			U.getState().session,
			B.getState().session
		].some((t) => t !== null && t !== e) && t().resetMetadata(), U.getState().setEtag(e, n), B.setState((t) => t.session === e ? t : {
			session: e,
			json: null
		});
	},
	setRetryAttempt(t) {
		e({ retryAttempt: t });
	}
})), G = st;
function ct(e) {
	G.getState().selectSession(e.session, e.etag ?? null);
}
//#endregion
//#region src/features/audit/data/loadAuditReport.ts
async function lt(e) {
	let t = U.getState().generation, n = z.getState().setLoading(e.session, e.background);
	try {
		let r = await e.workerClient.loadReport(e.authToken, e.session);
		return t !== U.getState().generation || z.getState().request !== n ? void 0 : (z.getState().setLoaded(e.session, r), r);
	} catch (r) {
		let i = z.getState();
		if (t !== U.getState().generation || i.request !== n || i.activeSession !== null && i.activeSession !== e.session) return;
		let a = r, o = {
			...r instanceof ErrorEvent ? { cause: r } : {},
			code: typeof a?.code == "string" ? a.code : void 0,
			details: a?.details,
			error: typeof a?.error == "string" ? a.error : typeof a?.message == "string" ? a.message : "Audit request failed.",
			status: typeof a?.status == "number" ? a.status : void 0
		};
		return i.setError(o), o;
	}
}
//#endregion
//#region src/shared/worker/retryWorker.ts
function ut(e) {
	if (e instanceof ErrorEvent) return !1;
	let t = e;
	if (t?.name === "AbortError") return !1;
	if (t?.status === 502 || t?.status === 503 || t?.status === 504) return !0;
	let n = String(t?.error ?? t?.message ?? "").toLowerCase();
	return n.includes("failed to fetch") || n.includes("network") || n.includes("connection") || n.includes("timeout");
}
function dt(e) {
	let t = e, n = Error(String(t?.message ?? e));
	return n.code = "connectivity_exhausted", n.details = t?.details, n.status = typeof t?.status == "number" ? t.status : void 0, n;
}
async function ft(e, t, n, r) {
	for (let i = 1;; i += 1) try {
		return await e();
	} catch (e) {
		if (!ut(e)) throw e;
		if (i === n) throw dt(e);
		r?.(i + 1), await new Promise((e) => setTimeout(e, t));
	}
}
//#endregion
//#region src/features/audit/worker/auditWorkerClient.ts
function pt(e, t) {
	let n = Error(e);
	if (t && typeof t == "object") {
		let e = t;
		typeof e.code == "string" && (n.code = e.code), typeof e.status == "number" && (n.status = e.status), typeof e.retryAfter == "string" && (n.retryAfter = e.retryAfter), typeof e.retryAt == "number" && (n.retryAt = e.retryAt), Object.prototype.hasOwnProperty.call(e, "details") && (n.details = e.details);
	}
	return n;
}
function mt(e) {
	return new Promise((t, n) => {
		let r = new Worker(new URL(
			/* @vite-ignore */
			"/assets/AuditWorker-BsoB1uNk.js",
			"" + import.meta.url
		), { type: "module" }), i = !1, a = () => {
			r.terminate();
		};
		r.onmessage = (e) => {
			if (i) return;
			i = !0, a();
			let r = e?.data;
			if (r && r.ok === !0) {
				t(r.data);
				return;
			}
			n(pt(typeof r?.error == "string" ? r.error : "Audit request failed", r));
		}, r.onerror = (e) => {
			i || (i = !0, a(), n(e));
		}, r.postMessage(e);
	});
}
function ht(e) {
	let { apiBaseUrl: t, onRetry: n, retryIntervalMs: r, retryLimit: i } = e, a = (e) => ft(() => mt(e), r, i, n);
	return { loadReport(e, n) {
		return a({
			apiBaseUrl: t,
			session: n,
			token: e,
			type: "auditData"
		});
	} };
}
//#endregion
//#region src/features/pagesegments/worker/pageSegmentsWorkerClient.ts
function gt(e, t) {
	let n = Error(e);
	if (t && typeof t == "object") {
		let e = t;
		typeof e.code == "string" && (n.code = e.code), typeof e.status == "number" && (n.status = e.status), typeof e.retryAfter == "string" && (n.retryAfter = e.retryAfter), typeof e.retryAt == "number" && (n.retryAt = e.retryAt), Object.prototype.hasOwnProperty.call(e, "details") && (n.details = e.details);
	}
	return n;
}
async function _t(e) {
	return new Promise((t, n) => {
		let r = new Worker(new URL(
			/* @vite-ignore */
			"/assets/PageSegmentsWorker-Ct4362Yf.js",
			"" + import.meta.url
		), { type: "module" }), i = !1, a = () => {
			r.terminate();
		};
		r.onmessage = (e) => {
			if (i) return;
			i = !0, a();
			let r = e?.data;
			if (r && r.ok === !0) {
				t(r.path ? {
					data: r.data,
					path: r.path,
					etag: r.etag
				} : r.data);
				return;
			}
			n(gt(typeof r?.error == "string" ? r.error : "Page segments worker request failed", r));
		}, r.onerror = (e) => {
			i || (i = !0, a(), n(e));
		}, r.postMessage(e);
	});
}
function vt(e) {
	let { apiBaseUrl: t } = e;
	return {
		pagesData(e, n, r) {
			return _t({
				apiBaseUrl: t,
				token: e,
				session: n,
				path: r,
				type: "pagesData"
			});
		},
		updatePageSegments(e, n, r, i) {
			return _t({
				apiBaseUrl: t,
				pageCode: r,
				segments: i,
				session: n,
				token: e,
				type: "updatePageSegments"
			});
		}
	};
}
//#endregion
//#region src/features/metdataview/worker/metadataWorkerClient.ts
function yt(e, t) {
	let n = Error(e);
	if (t && typeof t == "object") {
		let e = t;
		typeof e.code == "string" && (n.code = e.code), typeof e.status == "number" && (n.status = e.status), typeof e.retryAfter == "string" && (n.retryAfter = e.retryAfter), typeof e.retryAt == "number" && (n.retryAt = e.retryAt), Object.prototype.hasOwnProperty.call(e, "details") && (n.details = e.details);
	}
	return n;
}
function K(e) {
	return new Promise((t, n) => {
		let r = new Worker(new URL(
			/* @vite-ignore */
			"/assets/MetadataWorker-DHkBuWpG.js",
			"" + import.meta.url
		), { type: "module" }), i = !1;
		r.onmessage = (e) => {
			if (i) return;
			i = !0, r.terminate();
			let a = e?.data;
			if (a && a.ok === !0) {
				t(a);
				return;
			}
			n(yt(typeof a?.error == "string" ? a.error : "Index worker request failed", a));
		}, r.onerror = (e) => {
			i || (i = !0, r.terminate(), n(e));
		}, r.postMessage(e);
	});
}
//#endregion
//#region src/features/metdataview/data/metadataClient.ts
async function bt(e, t) {
	let n = U.getState().generation, r = await K({
		apiBaseUrl: e.apiGatewayUrl,
		token: e.authToken,
		session: e.session,
		type: "indexData",
		path: t
	});
	return n === U.getState().generation && (U.getState().session === null || U.getState().session === e.session) && (r.path && U.getState().setPath(e.session, r.path), (t === null || r.etag !== void 0) && U.getState().setEtag(e.session, r.etag ?? null)), {
		data: r.data,
		etag: r.etag ?? null
	};
}
function xt(e) {
	let { apiBaseUrl: t, onRetry: n, retryIntervalMs: r, retryLimit: i } = e, a = vt({ apiBaseUrl: t }), o = ht({
		apiBaseUrl: t,
		retryIntervalMs: r,
		retryLimit: i
	}), s = async (e, t, o) => {
		let s = G.getState().setPageLoading(t), c = U.getState().generation;
		try {
			let l = await ft(() => a.pagesData(e, t, o ? null : U.getState().session === t ? U.getState().pagePath : null), r, i, n);
			return c === U.getState().generation && G.getState().activeSession === t && G.getState().pageRequest === s && (U.getState().setPagePath(t, l.path), l.etag !== void 0 && U.getState().setPageEtag(t, l.etag), G.getState().setPageError(t, null)), l.data;
		} catch (e) {
			let n = e;
			throw c === U.getState().generation && G.getState().activeSession === t && G.getState().pageRequest === s && G.getState().setPageError(t, {
				...e instanceof ErrorEvent ? { cause: e } : {},
				error: n.message,
				code: n.code,
				details: n.details,
				status: n.status
			}), e;
		}
	};
	return {
		updatePageSegments: a.updatePageSegments,
		pagesData: s,
		async patchIndex(e, n, r, i) {
			return (await K({
				apiBaseUrl: t,
				change: i,
				segment: r,
				session: n,
				token: e,
				type: "patchIndex"
			})).data;
		},
		async confirmIndex(e, n, r) {
			return (await K({
				apiBaseUrl: t,
				code: r,
				session: n,
				token: e,
				type: "confirmIndex"
			})).data;
		},
		async dropIndex(e, n, r) {
			return (await K({
				apiBaseUrl: t,
				code: r,
				session: n,
				token: e,
				type: "dropIndex"
			})).data;
		},
		async indexData(e, a, c) {
			G.getState().activeSession === null && G.getState().setLoading(a);
			let l = U.getState().generation, [u, d] = await Promise.all([ft(() => bt({
				apiGatewayUrl: t,
				authToken: e,
				session: a
			}, c ? null : U.getState().session === a ? U.getState().path : null), r, i, n), s(e, a, !!c).catch(() => void 0)]);
			return l === U.getState().generation && G.getState().activeSession === a && lt({
				authToken: e,
				session: a,
				background: !0,
				workerClient: o
			}), {
				...u.data,
				pages: d
			};
		},
		async patchStatus(e, a, o) {
			return (await ft(() => K({
				apiBaseUrl: t,
				session: a,
				token: e,
				type: "patchStatus",
				version: o
			}), r, i, n)).data;
		},
		async reprocessSegment(e, n, r) {
			return (await K({
				apiBaseUrl: t,
				segment: r,
				session: n,
				token: e,
				type: "reprocessSegment"
			})).data;
		},
		async clearSegment(e, n, r) {
			return (await K({
				apiBaseUrl: t,
				segment: r,
				session: n,
				token: e,
				type: "clearSegment"
			})).data;
		}
	};
}
//#endregion
//#region src/features/metdataview/data/uniqueIndexes.ts
function St(e) {
	let t = /* @__PURE__ */ new Set();
	return e.filter((e) => t.has(e.code) ? !1 : (t.add(e.code), !0));
}
//#endregion
//#region src/features/addindex/data/addIndexData.ts
function Ct(e) {
	return e.replace(/\s+/g, " ").trim();
}
function wt(e) {
	return Ct(e).replace(/[.,;:]+$/g, "").toUpperCase();
}
function Tt(e) {
	return e.filter((e) => typeof e == "string").map(Ct).filter(Boolean).join(" ");
}
function Et(e, t) {
	let n = /* @__PURE__ */ new Map();
	return e.forEach((e) => {
		if (typeof e != "string") return;
		let r = Ct(e), i = (t ? r.replace(/[.,;:]+$/g, "") : r).trim();
		if (!i) return;
		let a = wt(i);
		a && (n.has(a) || n.set(a, i));
	}), Array.from(n.values());
}
function Dt(e) {
	let t = Et(e.groups.map((e) => Tt(e.value.token)), !0), n = Et(e.groups.map((e) => Tt(e.value.context)), !1);
	return {
		context: n.filter((e, t) => {
			let r = wt(e);
			return !n.some((e, n) => n !== t && wt(e).length > r.length && wt(e).includes(r));
		}).join("\n\n"),
		values: t.join(" ")
	};
}
//#endregion
//#region src/shared/style/typeSelectStyles.ts
var q = {
	control: {
		background: "var(--white)",
		borderWidth: "1px",
		borderStyle: "solid",
		borderColor: "var(--border-card)",
		borderRadius: "var(--radius-control)",
		minWidth: 0
	},
	focused: {
		borderColor: "var(--primary-dark)",
		boxShadow: "0 0 0 1px var(--primary)"
	},
	chips: {
		display: "flex",
		flexWrap: "wrap",
		gap: "0.35rem",
		padding: "0.5rem 0.5rem 0"
	},
	chip: {
		display: "inline-flex",
		alignItems: "center",
		gap: "0.25rem",
		maxWidth: "100%",
		borderRadius: "var(--radius-control)",
		background: "var(--gray-50)",
		border: "1px solid var(--border-card)",
		paddingLeft: "0.5rem"
	},
	chipLabel: {
		minWidth: 0,
		overflowWrap: "anywhere",
		fontSize: "0.9rem"
	},
	remove: {
		background: "transparent",
		border: 0,
		boxShadow: "none",
		color: "var(--title-ink)",
		flex: "0 0 auto",
		cursor: "pointer",
		font: "inherit",
		fontSize: "1.15rem",
		minWidth: "2.75rem",
		minHeight: "2.75rem",
		padding: "0.2rem",
		borderRadius: "var(--radius-control)"
	},
	search: {
		background: "transparent",
		border: 0,
		boxShadow: "none",
		boxSizing: "border-box",
		color: "var(--title-ink)",
		font: "inherit",
		minHeight: "2.5rem",
		width: "100%",
		minWidth: 0,
		padding: "0.5rem"
	},
	results: {
		position: "relative",
		maxHeight: "12rem",
		overflowY: "auto",
		overscrollBehavior: "contain",
		borderTop: "1px solid var(--border-card)",
		padding: "0.25rem",
		scrollPadding: "0.25rem"
	},
	group: {
		color: "var(--title-ink)",
		fontSize: "1.1em",
		fontWeight: 700,
		padding: "0.5rem 0.5rem 0.25rem"
	},
	option: {
		color: "var(--title-ink)",
		cursor: "pointer",
		padding: "0.5rem",
		borderRadius: "var(--radius-control)",
		overflowWrap: "anywhere"
	},
	active: {
		background: "var(--primary-dark)",
		color: "var(--white)"
	},
	empty: {
		color: "var(--title-ink)",
		padding: "0.75rem 0.5rem",
		fontSize: "0.9rem"
	}
}, J = Me(), Y = "C:/GitHub/Tabularium/aurorra_index/src/shared/component/TypeSelect.tsx";
function Ot({ aspects: e, segment: r, selected: o, onChange: s }) {
	let u = n(), d = i(null), f = i(null), p = i(null), m = i(null), [h, g] = a(""), [_, v] = a(!1), [y, b] = a(-1), x = l(h).toLowerCase().trim().split(/\s+/).filter(Boolean), S = Object.entries(e).sort(([e], [t]) => Number(t === r) - Number(e === r)).flatMap(([e, t]) => t.map((t) => ({
		group: e,
		type: t,
		key: JSON.stringify([e, t]),
		label: l(t)
	}))), C = S.filter((e) => !o.includes(e.key) && x.every((t) => `${l(e.group)} ${e.label}`.toLowerCase().includes(t)));
	t(() => {
		if (!_) return;
		function e(e) {
			e.target instanceof Node && !d.current?.contains(e.target) && (v(!1), b(-1));
		}
		return document.addEventListener("click", e, !0), () => document.removeEventListener("click", e, !0);
	}, [_]), t(() => {
		let e = m.current, t = p.current;
		if (!_ || !e || !t) return;
		let n = e.getBoundingClientRect(), r = t.getBoundingClientRect();
		n.top < r.top ? t.scrollTop -= Math.ceil(r.top - n.top) : n.bottom > r.bottom && (t.scrollTop += Math.ceil(n.bottom - r.bottom));
	}, [
		y,
		_,
		h
	]);
	function w(e) {
		s([...o, e]), g(""), b(-1), f.current?.focus();
	}
	function T(e) {
		s(o.filter((t) => t !== e)), b(-1), f.current?.focus();
	}
	return /* @__PURE__ */ (0, J.jsxDEV)("div", {
		ref: d,
		"data-testid": "add-type-field",
		style: c.field,
		children: [/* @__PURE__ */ (0, J.jsxDEV)("label", {
			htmlFor: u,
			style: c.label,
			children: "Type (required)"
		}, void 0, !1, {
			fileName: Y,
			lineNumber: 66,
			columnNumber: 7
		}, this), /* @__PURE__ */ (0, J.jsxDEV)("div", {
			style: {
				...q.control,
				..._ ? q.focused : {}
			},
			children: [
				o.length > 0 && /* @__PURE__ */ (0, J.jsxDEV)("div", {
					style: q.chips,
					children: o.map((e) => {
						let [t, n] = JSON.parse(e), r = l(n), i = S.filter((e) => e.label === r).length > 1;
						return /* @__PURE__ */ (0, J.jsxDEV)("span", {
							style: q.chip,
							children: [/* @__PURE__ */ (0, J.jsxDEV)("span", {
								style: q.chipLabel,
								children: [r, i ? ` (${l(t)})` : ""]
							}, void 0, !0, {
								fileName: Y,
								lineNumber: 74,
								columnNumber: 15
							}, this), /* @__PURE__ */ (0, J.jsxDEV)("button", {
								type: "button",
								"aria-label": `Remove ${r} (${l(t)})`,
								onClick: () => T(e),
								style: q.remove,
								children: /* @__PURE__ */ (0, J.jsxDEV)("span", {
									"aria-hidden": "true",
									children: "×"
								}, void 0, !1, {
									fileName: Y,
									lineNumber: 76,
									columnNumber: 67
								}, this)
							}, void 0, !1, {
								fileName: Y,
								lineNumber: 75,
								columnNumber: 15
							}, this)]
						}, e, !0, {
							fileName: Y,
							lineNumber: 73,
							columnNumber: 20
						}, this);
					})
				}, void 0, !1, {
					fileName: Y,
					lineNumber: 68,
					columnNumber: 33
				}, this),
				/* @__PURE__ */ (0, J.jsxDEV)("input", {
					ref: f,
					id: u,
					role: "combobox",
					"aria-autocomplete": "list",
					"aria-expanded": _,
					"aria-required": "true",
					"aria-controls": _ ? `${u}-list` : void 0,
					"aria-activedescendant": _ && y >= 0 && C[y] ? `${u}-option-${y}` : void 0,
					autoComplete: "off",
					placeholder: o.length ? "Add another type…" : "Search types…",
					style: q.search,
					value: h,
					onFocus: () => v(!0),
					onClick: () => v(!0),
					onChange: (e) => {
						g(e.target.value), b(0), v(!0);
					},
					onKeyDown: (e) => {
						e.nativeEvent.isComposing || (e.key === "ArrowDown" || e.key === "ArrowUp" ? (e.preventDefault(), v(!0), b(e.key === "ArrowDown" ? Math.min(y + 1, C.length - 1) : y <= 0 ? C.length - 1 : y - 1)) : e.key === "Enter" && _ ? (e.preventDefault(), C[y] && w(C[y].key)) : e.key === "Escape" && _ ? (e.preventDefault(), e.stopPropagation(), v(!1), b(-1)) : e.key === "Backspace" && !h && o.length ? (e.preventDefault(), T(o[o.length - 1])) : e.key === "Tab" && (v(!1), b(-1)));
					}
				}, void 0, !1, {
					fileName: Y,
					lineNumber: 80,
					columnNumber: 9
				}, this),
				_ && /* @__PURE__ */ (0, J.jsxDEV)("div", {
					ref: p,
					id: `${u}-list`,
					role: "listbox",
					"aria-label": "Type suggestions",
					"aria-multiselectable": "true",
					style: q.results,
					children: [[...new Set(C.map((e) => e.group))].map((e) => /* @__PURE__ */ (0, J.jsxDEV)("div", {
						role: "group",
						"aria-label": l(e),
						children: [/* @__PURE__ */ (0, J.jsxDEV)("div", {
							"aria-hidden": "true",
							style: q.group,
							children: l(e)
						}, void 0, !1, {
							fileName: Y,
							lineNumber: 111,
							columnNumber: 13
						}, this), C.map((t, n) => t.group === e && /* @__PURE__ */ (0, J.jsxDEV)("div", {
							ref: y === n ? m : void 0,
							id: `${u}-option-${n}`,
							role: "option",
							"aria-selected": "false",
							style: {
								...q.option,
								...y === n ? q.active : {}
							},
							onMouseDown: (e) => e.preventDefault(),
							onMouseMove: () => b(n),
							onClick: () => w(t.key),
							children: t.label
						}, t.key, !1, {
							fileName: Y,
							lineNumber: 112,
							columnNumber: 71
						}, this))]
					}, e, !0, {
						fileName: Y,
						lineNumber: 110,
						columnNumber: 79
					}, this)), !C.length && /* @__PURE__ */ (0, J.jsxDEV)("div", {
						role: "status",
						style: q.empty,
						children: o.length === S.length && S.length ? "All types selected" : "No matching types"
					}, void 0, !1, {
						fileName: Y,
						lineNumber: 118,
						columnNumber: 31
					}, this)]
				}, void 0, !0, {
					fileName: Y,
					lineNumber: 109,
					columnNumber: 18
				}, this)
			]
		}, void 0, !0, {
			fileName: Y,
			lineNumber: 67,
			columnNumber: 7
		}, this)]
	}, void 0, !0, {
		fileName: Y,
		lineNumber: 65,
		columnNumber: 5
	}, this);
}
//#endregion
//#region src/shared/component/IndexInput.tsx
var X = "C:/GitHub/Tabularium/aurorra_index/src/shared/component/IndexInput.tsx";
function kt({ value: e, aspects: r, segment: i, selected: a, onChange: o, onSelect: s, allowEnrichment: l, onEnrichmentChange: u }) {
	let d = n(), f = [
		"party",
		"property",
		"acknowledgment",
		"execution"
	].includes(i.toLowerCase());
	return t(() => {
		f || u(!1);
	}, [f, u]), /* @__PURE__ */ (0, J.jsxDEV)(J.Fragment, { children: [
		/* @__PURE__ */ (0, J.jsxDEV)("div", {
			"data-testid": "add-index-field",
			style: c.field,
			children: [/* @__PURE__ */ (0, J.jsxDEV)("label", {
				htmlFor: d,
				style: c.label,
				children: "Index (required)"
			}, void 0, !1, {
				fileName: X,
				lineNumber: 23,
				columnNumber: 7
			}, this), /* @__PURE__ */ (0, J.jsxDEV)("input", {
				id: d,
				onChange: (e) => o(e.target.value),
				required: !0,
				style: c.input,
				type: "text",
				value: e
			}, void 0, !1, {
				fileName: X,
				lineNumber: 24,
				columnNumber: 7
			}, this)]
		}, void 0, !0, {
			fileName: X,
			lineNumber: 22,
			columnNumber: 5
		}, this),
		/* @__PURE__ */ (0, J.jsxDEV)(Ot, {
			aspects: r,
			segment: i,
			selected: a,
			onChange: s
		}, void 0, !1, {
			fileName: X,
			lineNumber: 26,
			columnNumber: 5
		}, this),
		/* @__PURE__ */ (0, J.jsxDEV)("label", {
			htmlFor: `${d}-enrichment`,
			style: c.checkboxRow,
			children: [/* @__PURE__ */ (0, J.jsxDEV)(Ce, {
				id: `${d}-enrichment`,
				checked: f && l,
				disabled: !f,
				onCheckedChange: (e) => u(e === !0),
				style: c.checkbox(!f, l),
				children: /* @__PURE__ */ (0, J.jsxDEV)(Te, {
					"aria-hidden": !0,
					style: {
						fontSize: "0.75rem",
						lineHeight: 1
					},
					children: "✓"
				}, void 0, !1, {
					fileName: X,
					lineNumber: 30,
					columnNumber: 9
				}, this)
			}, void 0, !1, {
				fileName: X,
				lineNumber: 28,
				columnNumber: 7
			}, this), "Enhancement"]
		}, void 0, !0, {
			fileName: X,
			lineNumber: 27,
			columnNumber: 5
		}, this)
	] }, void 0, !0, {
		fileName: X,
		lineNumber: 21,
		columnNumber: 10
	}, this);
}
//#endregion
//#region src/shared/style/indexDetailsStyles.ts
var At = {
	root: {
		background: "var(--white)",
		borderTop: "1px solid var(--border-card)",
		boxSizing: "border-box",
		overflow: "visible"
	},
	trigger: {
		alignItems: "center",
		background: "transparent",
		border: 0,
		borderRadius: 0,
		boxShadow: "none",
		color: "var(--title-ink)",
		cursor: "pointer",
		display: "grid",
		font: "inherit",
		fontWeight: 700,
		gridTemplateColumns: "1fr auto",
		minHeight: "2.75rem",
		padding: "0.75rem 0.5rem",
		textAlign: "left",
		transform: "none",
		width: "100%"
	},
	content: {
		display: "grid",
		gap: "0.5rem",
		padding: "0 0.5rem 0.75rem"
	},
	quote: {
		alignItems: "start",
		gridTemplateColumns: "minmax(0, 1fr) minmax(0, 7rem)",
		background: "var(--white)",
		border: 0,
		boxSizing: "border-box",
		display: "grid",
		gap: "0.55rem",
		margin: 0,
		minInlineSize: 0,
		padding: 0
	},
	source: {
		background: "var(--white)",
		border: "1px solid var(--border-card)",
		borderRadius: "var(--radius-control)",
		boxSizing: "border-box",
		color: "var(--title-ink)",
		lineHeight: 1.4,
		minHeight: "3.6rem",
		minWidth: 0,
		padding: "0.5rem",
		resize: "vertical",
		width: "100%"
	}
}, Z = "C:/GitHub/Tabularium/aurorra_index/src/shared/component/IndexDetails.tsx";
function jt({ fields: e, onChange: t }) {
	let r = n(), i = n(), o = n(), [s, l] = a(!1);
	return /* @__PURE__ */ (0, J.jsxDEV)(p.Root, {
		onOpenChange: l,
		open: s,
		style: At.root,
		children: [/* @__PURE__ */ (0, J.jsxDEV)(p.Trigger, {
			asChild: !0,
			children: /* @__PURE__ */ (0, J.jsxDEV)("button", {
				"aria-label": "Additional details",
				style: At.trigger,
				type: "button",
				children: [/* @__PURE__ */ (0, J.jsxDEV)("span", { children: "Additional details" }, void 0, !1, {
					fileName: Z,
					lineNumber: 15,
					columnNumber: 9
				}, this), /* @__PURE__ */ (0, J.jsxDEV)("span", {
					"aria-hidden": "true",
					children: s ? "▴" : "▾"
				}, void 0, !1, {
					fileName: Z,
					lineNumber: 15,
					columnNumber: 40
				}, this)]
			}, void 0, !0, {
				fileName: Z,
				lineNumber: 14,
				columnNumber: 7
			}, this)
		}, void 0, !1, {
			fileName: Z,
			lineNumber: 13,
			columnNumber: 5
		}, this), /* @__PURE__ */ (0, J.jsxDEV)(p.Content, { children: /* @__PURE__ */ (0, J.jsxDEV)("div", {
			style: At.content,
			children: [/* @__PURE__ */ (0, J.jsxDEV)("label", {
				htmlFor: r,
				style: c.control,
				children: [/* @__PURE__ */ (0, J.jsxDEV)("span", {
					style: c.label,
					children: "Label"
				}, void 0, !1, {
					fileName: Z,
					lineNumber: 21,
					columnNumber: 11
				}, this), /* @__PURE__ */ (0, J.jsxDEV)("input", {
					id: r,
					onChange: (n) => t({
						...e,
						label: n.target.value
					}),
					style: c.input,
					type: "text",
					value: e.label
				}, void 0, !1, {
					fileName: Z,
					lineNumber: 22,
					columnNumber: 11
				}, this)]
			}, void 0, !0, {
				fileName: Z,
				lineNumber: 20,
				columnNumber: 9
			}, this), /* @__PURE__ */ (0, J.jsxDEV)("fieldset", {
				"aria-label": "Quote",
				"data-testid": "add-quote-field",
				style: At.quote,
				children: [/* @__PURE__ */ (0, J.jsxDEV)("label", {
					htmlFor: o,
					style: c.control,
					children: [/* @__PURE__ */ (0, J.jsxDEV)("span", {
						style: c.label,
						children: "Source"
					}, void 0, !1, {
						fileName: Z,
						lineNumber: 26,
						columnNumber: 13
					}, this), /* @__PURE__ */ (0, J.jsxDEV)("textarea", {
						id: o,
						onChange: (n) => t({
							...e,
							source: n.target.value
						}),
						rows: 3,
						style: At.source,
						value: e.source
					}, void 0, !1, {
						fileName: Z,
						lineNumber: 27,
						columnNumber: 13
					}, this)]
				}, void 0, !0, {
					fileName: Z,
					lineNumber: 25,
					columnNumber: 11
				}, this), /* @__PURE__ */ (0, J.jsxDEV)("label", {
					htmlFor: i,
					style: c.control,
					children: [/* @__PURE__ */ (0, J.jsxDEV)("span", {
						style: c.label,
						children: "Page Number"
					}, void 0, !1, {
						fileName: Z,
						lineNumber: 30,
						columnNumber: 13
					}, this), /* @__PURE__ */ (0, J.jsxDEV)("input", {
						id: i,
						onChange: (n) => t({
							...e,
							page: n.target.value
						}),
						style: c.input,
						type: "text",
						value: e.page
					}, void 0, !1, {
						fileName: Z,
						lineNumber: 31,
						columnNumber: 13
					}, this)]
				}, void 0, !0, {
					fileName: Z,
					lineNumber: 29,
					columnNumber: 11
				}, this)]
			}, void 0, !0, {
				fileName: Z,
				lineNumber: 24,
				columnNumber: 9
			}, this)]
		}, void 0, !0, {
			fileName: Z,
			lineNumber: 19,
			columnNumber: 7
		}, this) }, void 0, !1, {
			fileName: Z,
			lineNumber: 18,
			columnNumber: 5
		}, this)]
	}, void 0, !0, {
		fileName: Z,
		lineNumber: 12,
		columnNumber: 10
	}, this);
}
//#endregion
//#region src/shared/data/aspectGroups.ts
function Mt(e) {
	if (!e || typeof e != "object" || !("aspects" in e) || !e.aspects || typeof e.aspects != "object" || Array.isArray(e.aspects) || !Object.values(e.aspects).every((e) => Array.isArray(e) && e.every((e) => typeof e == "string"))) throw Error("Aspects resource is invalid.");
	return e.aspects;
}
//#endregion
//#region src/shared/hook/useAspects.ts
function Nt(e, n, r, i, o) {
	let [s, c] = a({}), [l, u] = a(!1);
	return t(() => {
		let e = !0;
		return u(!1), c({}), i(!1), r({
			resource: "aspects",
			session: n,
			callback(t) {
				if (e) {
					if (!t.ok) {
						o(t), i(!0);
						return;
					}
					try {
						c(Mt(t.data)), u(!0), i(!0);
					} catch (e) {
						o({ error: e.message }), i(!0);
					}
				}
			}
		}), () => {
			e = !1;
		};
	}, [
		o,
		i,
		r,
		e,
		n
	]), {
		aspects: s,
		ready: l
	};
}
//#endregion
//#region src/features/addindex/component/AddIndexPanel.tsx
var Q = "C:/GitHub/Tabularium/aurorra_index/src/features/addindex/component/AddIndexPanel.tsx";
function Pt({ apiGatewayUrl: e, authToken: n, intervalMs: s, onQueueChange: u, formatError: d, batchCode: f, retryIntervalMs: p, retryLimit: m, onClose: h, onError: g, onReadyChange: _, onResource: v, segment: y, request: b, session: x, workerClient: S }) {
	let { aspects: C, ready: w } = Nt(b, x, v, _, g), [T, E] = a([]), [D, O] = a(!1), [k, A] = a({
		index: "",
		label: "",
		page: "",
		source: ""
	}), j = r(() => S || xt({
		apiBaseUrl: e,
		retryIntervalMs: p,
		retryLimit: m
	}), [
		e,
		p,
		m,
		S
	]), M = i(!1), [N, P] = a(!1), F = r(() => {
		if ("groups" in b) {
			let e = Dt(b);
			return {
				index: e.values,
				label: "",
				page: b.pageName,
				source: e.context
			};
		} else return {
			index: "",
			label: "",
			page: "",
			source: ""
		};
	}, [b]);
	t(() => {
		M.current = !1, P(!1), A(F), E([]), O(!1);
	}, [F]);
	let ee = async () => {
		if (!(!w || !T.length || !k.index.trim() || M.current)) {
			M.current = !0, P(!0);
			try {
				for (let e of Object.keys(C)) {
					let t = C[e].filter((t) => T.includes(JSON.stringify([e, t])));
					t.length && await U.getState().enqueue({
						batch: f,
						session: x,
						segment: e,
						data: JSON.stringify(t.map((e) => ({
							action: "add",
							allow_enrichment: D,
							explanation: "Index created by user.",
							new_index_page: k.page.trim(),
							new_index_source: k.source,
							new_index_label: k.label.trim() || l(e),
							new_index_aspect: e,
							new_index_value: k.index,
							new_index_ambiguous: null,
							old_index_label: null,
							old_index_aspect: null,
							old_index_value: null
						})))
					}, {
						authToken: n,
						client: j,
						intervalMs: s,
						formatError: d,
						onChange: u
					});
				}
				h();
			} catch (e) {
				let t = e;
				g({
					code: t.code,
					details: t.details,
					error: t.message,
					status: t.status
				});
			} finally {
				M.current = !1, P(!1);
			}
		}
	};
	return /* @__PURE__ */ (0, J.jsxDEV)("section", {
		"aria-label": "Add selected index form",
		style: c.root,
		children: [/* @__PURE__ */ (0, J.jsxDEV)("div", {
			inert: N,
			style: c.fields,
			children: [/* @__PURE__ */ (0, J.jsxDEV)(kt, {
				value: k.index,
				aspects: C,
				segment: y,
				selected: T,
				onChange: (e) => A({
					...k,
					index: e
				}),
				onSelect: E,
				allowEnrichment: D,
				onEnrichmentChange: O
			}, x, !1, {
				fileName: Q,
				lineNumber: 100,
				columnNumber: 9
			}, this), /* @__PURE__ */ (0, J.jsxDEV)(jt, {
				fields: k,
				onChange: A
			}, void 0, !1, {
				fileName: Q,
				lineNumber: 101,
				columnNumber: 9
			}, this)]
		}, void 0, !0, {
			fileName: Q,
			lineNumber: 99,
			columnNumber: 7
		}, this), /* @__PURE__ */ (0, J.jsxDEV)("div", {
			"data-testid": "add-index-actions",
			style: c.actions,
			children: /* @__PURE__ */ (0, J.jsxDEV)(o, {
				disabled: N || !w || !T.length || !k.index.trim(),
				label: "Add",
				onConfirm: () => void ee(),
				style: c.button,
				variant: "primary"
			}, void 0, !1, {
				fileName: Q,
				lineNumber: 104,
				columnNumber: 9
			}, this)
		}, void 0, !1, {
			fileName: Q,
			lineNumber: 103,
			columnNumber: 7
		}, this)]
	}, void 0, !0, {
		fileName: Q,
		lineNumber: 98,
		columnNumber: 5
	}, this);
}
//#endregion
//#region src/features/imageviewer/worker/imageWorkerClient.ts
function Ft(e, t) {
	let n = Error(e);
	if (t && typeof t == "object") {
		let e = t;
		typeof e.code == "string" && (n.code = e.code), typeof e.status == "number" && (n.status = e.status), typeof e.retryAfter == "string" && (n.retryAfter = e.retryAfter), typeof e.retryAt == "number" && (n.retryAt = e.retryAt), Object.prototype.hasOwnProperty.call(e, "details") && (n.details = e.details);
	}
	return n;
}
function It(e) {
	return new Promise((t, n) => {
		let r = new Worker(new URL(
			/* @vite-ignore */
			"/assets/ImageWorker-DV_E7TeN.js",
			"" + import.meta.url
		), { type: "module" }), i = !1;
		r.onmessage = (e) => {
			if (i) return;
			i = !0, r.terminate();
			let a = e?.data;
			if (a && a.ok === !0) {
				t(a.data);
				return;
			}
			n(Ft(typeof a?.error == "string" ? a.error : "Image viewer request failed", a));
		}, r.onerror = (e) => {
			i || (i = !0, r.terminate(), n(e));
		}, r.postMessage(e);
	});
}
function Lt(e) {
	let { apiBaseUrl: t } = e;
	return {
		packageImage(e, n, r) {
			return It({
				apiBaseUrl: t,
				session: n,
				token: e,
				type: "imagePackage",
				refresh: r
			});
		},
		downloadPackage(e, t) {
			return It({
				jsonUrl: t.jsonUrl,
				tiffUrl: t.tiffUrl,
				token: e,
				type: "imageDownload"
			});
		}
	};
}
//#endregion
//#region src/features/imageviewer/data/loadImagePackage.ts
var $ = null;
async function Rt(e, t) {
	let n = W.getState(), r = !!(n.packageMetadata && n.tiffBytes && n.tiffType !== null), i = n.status === "ready" && n.viewerState?.status === "ready" && !r;
	if (!e.restart && (n.status === "ready" && r || i)) return;
	let a = e.workerClient || Lt({ apiBaseUrl: e.apiGatewayUrl });
	try {
		W.getState().setStatus("packaging");
		let n = await a.packageImage(e.authToken, e.session, e.restart === !0);
		if (W.getState().generation !== t || W.getState().session !== e.session) return;
		W.getState().setPackageStatus("completed"), W.getState().setStatus("downloading");
		let r = Qe(n.data), i = await a.downloadPackage(e.authToken, r);
		W.getState().generation === t && W.getState().session === e.session && W.getState().setLocalPackage(i);
	} catch (n) {
		let r = Xe(n, "image package request failed.");
		W.getState().generation === t && W.getState().session === e.session && W.getState().setError(r);
	}
}
async function zt(e) {
	let t = W.getState(), n = {
		pageSize: e.pageSize,
		apiGatewayUrl: e.apiGatewayUrl,
		authToken: e.authToken,
		onError: e.onError,
		pageMap: t.session === e.session ? t.pageMap : /* @__PURE__ */ new Map(),
		request: t.session === e.session ? t.request : null,
		selectedIndex: t.session === e.session ? t.selectedIndex : null,
		session: e.session,
		workerClient: e.workerClient
	};
	t.setHostInput(n);
	let r = W.getState().generation, i = $?.session === e.session && $.generation === r ? $ : null;
	if (i && !e.restart) return i.load;
	let a = i ? i.load.then(() => {
		if (W.getState().generation === r && W.getState().session === e.session) return Rt(e, r);
	}) : Rt(e, r);
	$ = {
		session: e.session,
		generation: r,
		load: a
	};
	try {
		await a;
	} finally {
		$?.load === a && ($ = null);
	}
}
//#endregion
export { B as A, et as C, qe as D, Je as E, Fe as F, Me as I, Ce as L, Re as M, z as N, U as O, Le as P, Te as R, W as S, Xe as T, at as _, kt as a, nt as b, xt as c, ft as d, lt as f, ot as g, st as h, jt as i, Be as j, Ge as k, vt as l, ct as m, Pt as n, Dt as o, G as p, Nt as r, St as s, zt as t, ht as u, it as v, $e as w, tt as x, rt as y };
