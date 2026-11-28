//#region node_modules/@tabulariumai/aurora-lens/dist/core/errors/LensError.js
var e = "unreadable_document", t = "page_out_of_range", n = "page_size", r = "raster_limit", i = "unsupported_format", a = "unknown", o = class extends Error {
	code;
	details;
	constructor(e, t, n) {
		super(t), this.code = e, this.details = n, this.name = "LensError";
	}
};
//#endregion
//#region node_modules/@tabulariumai/aurora-lens/dist/core/decoder/rasterImage.js
async function s(t, n) {
	let i = await createImageBitmap(t);
	try {
		let { width: t, height: a } = i;
		if (n && (t > n.maxRasterWidth || a > n.maxRasterHeight || t * a > n.maxRasterPixels)) throw new o(r, "Raster page exceeds the configured raster limits.");
		let s = new OffscreenCanvas(t, a);
		try {
			let n = s.getContext("2d");
			if (!n) throw new o(e, "Raster decoder canvas is unavailable.");
			return n.drawImage(i, 0, 0), {
				width: t,
				height: a,
				pixels: n.getImageData(0, 0, t, a).data
			};
		} finally {
			s.width = 0, s.height = 0;
		}
	} finally {
		i.close();
	}
}
//#endregion
//#region node_modules/@tabulariumai/aurora-lens/dist/core/input/inputs.js
function c(e) {
	if (!(e instanceof HTMLElement)) throw Error("AuroraLens: container must be an HTMLElement.");
}
function l(e) {
	if (!(e instanceof File)) throw Error("AuroraLens.decodeDoc: file must be a File.");
}
function u(e) {
	if (!e || typeof e != "object") throw Error("AuroraLens.decodeDoc: options must include page and viewMode.");
}
function d(e) {
	if (e !== "page" && e !== "thumbnails") throw Error("AuroraLens.decodeDoc: viewMode must be page or thumbnails.");
}
//#endregion
//#region node_modules/@tabulariumai/aurora-lens/dist/core/metadata/MetadataRepository.js
var f = class {
	pageMap(e, t) {
		let n = /* @__PURE__ */ new Map(), r = e === null ? void 0 : this.root(e).pageMap;
		if (r !== void 0) {
			if (!r || typeof r != "object" || Array.isArray(r)) throw Error("AuroraLens: pageMap must map names to page indexes.");
			for (let [e, i] of Object.entries(r)) {
				if (!Number.isInteger(i) || i < 0 || i >= t.length) throw Error("AuroraLens: pageMap index is outside the document.");
				n.set(e, t[i].pageId);
			}
		}
		return n;
	}
	split(e, t) {
		let n = this.root(e);
		return t.map((e) => ({
			pageId: e.pageId,
			metadata: n.pages[e.sourcePageIndex] === void 0 ? void 0 : n.pageMap === void 0 ? n.pages[e.sourcePageIndex] : {
				...n.pages[e.sourcePageIndex],
				pageNames: Object.entries(n.pageMap).filter(([, t]) => t === e.sourcePageIndex).map(([e]) => e)
			}
		})).filter((e) => e.metadata !== void 0);
	}
	root(e) {
		let t = e;
		if (!Array.isArray(t.pages)) throw Error("AuroraLens.loadMetadata: metadata must include pages.");
		return t;
	}
};
//#endregion
//#region node_modules/@tabulariumai/aurora-lens/dist/core/geometry.js
function p(e, t, n) {
	let r = !1;
	for (let i = 0, a = e.length - 2; i < e.length; a = i, i += 2) {
		let o = e[i], s = e[i + 1], c = e[a], l = e[a + 1];
		if (m(t, n, o, s, c, l)) return !0;
		s > n != l > n && t <= (c - o) * (n - s) / (l - s) + o && (r = !r);
	}
	return r;
}
function m(e, t, n, r, i, a) {
	return (e - n) * (a - r) === (t - r) * (i - n) && e >= Math.min(n, i) && e <= Math.max(n, i) && t >= Math.min(r, a) && t <= Math.max(r, a);
}
//#endregion
//#region node_modules/@tabulariumai/aurora-lens/node_modules/fuse.js/dist/fuse.mjs
function h(e) {
	return Array.isArray ? Array.isArray(e) : ee(e) === "[object Array]";
}
function g(e) {
	if (typeof e == "string") return e;
	if (typeof e == "bigint") return e.toString();
	let t = e + "";
	return t == "0" && 1 / e == -Infinity ? "-0" : t;
}
function _(e) {
	return e == null ? "" : g(e);
}
function v(e) {
	return typeof e == "string";
}
function y(e) {
	return typeof e == "number";
}
function b(e) {
	return e === !0 || e === !1 || S(e) && ee(e) == "[object Boolean]";
}
function x(e) {
	return typeof e == "object";
}
function S(e) {
	return x(e) && e !== null;
}
function C(e) {
	return e != null;
}
function w(e) {
	return !e.trim().length;
}
function ee(e) {
	return e == null ? e === void 0 ? "[object Undefined]" : "[object Null]" : Object.prototype.toString.call(e);
}
var te = "Incorrect 'index' type", ne = "Invalid doc index: must be a non-negative integer within the bounds of the docs array", re = (e) => `Invalid value for key ${e}`, ie = (e) => `Pattern length exceeds max of ${e}.`, ae = (e) => `Missing ${e} property in key`, oe = (e) => `Property 'weight' in key '${e}' must be a positive integer`, se = "Fuse.match does not support useTokenSearch: token search requires corpus-level statistics (df, fieldCount) that a one-off string comparison does not have. Use new Fuse(...).search(...) instead.", ce = Object.prototype.hasOwnProperty, le = class {
	constructor(e) {
		this._keys = [], this._keyMap = {};
		let t = 0;
		e.forEach((e) => {
			let n = ue(e);
			this._keys.push(n), this._keyMap[n.id] = n, t += n.weight;
		}), this._keys.forEach((e) => {
			e.weight /= t;
		});
	}
	get(e) {
		return this._keyMap[e];
	}
	keys() {
		return this._keys;
	}
	toJSON() {
		return JSON.stringify(this._keys);
	}
};
function ue(e) {
	let t = null, n = null, r = null, i = 1, a = null;
	if (v(e) || h(e)) r = e, t = de(e), n = T(e);
	else {
		if (!ce.call(e, "name")) throw Error(ae("name"));
		let o = e.name;
		if (r = o, ce.call(e, "weight") && e.weight !== void 0 && (i = e.weight, i <= 0)) throw Error(oe(T(o)));
		t = de(o), n = T(o), a = e.getFn ?? null;
	}
	return {
		path: t,
		id: n,
		weight: i,
		src: r,
		getFn: a
	};
}
function de(e) {
	return h(e) ? e : e.split(".");
}
function T(e) {
	return h(e) ? e.join(".") : e;
}
function fe(e, t) {
	let n = [], r = !1, i = (e, t, a, o) => {
		if (C(e)) if (!t[a]) n.push(o === void 0 ? e : {
			v: e,
			i: o
		});
		else {
			let s = e[t[a]];
			if (!C(s)) return;
			if (a === t.length - 1 && (v(s) || y(s) || b(s) || typeof s == "bigint")) n.push(o === void 0 ? _(s) : {
				v: _(s),
				i: o
			});
			else if (h(s)) {
				r = !0;
				for (let e = 0, n = s.length; e < n; e += 1) i(s[e], t, a + 1, e);
			} else t.length && i(s, t, a + 1, o);
		}
	};
	return i(e, v(t) ? t.split(".") : t, 0), r ? n : n[0];
}
var pe = {
	includeMatches: !1,
	findAllMatches: !1,
	minMatchCharLength: 1
}, me = {
	isCaseSensitive: !1,
	ignoreDiacritics: !1,
	includeScore: !1,
	keys: [],
	shouldSort: !0,
	sortFn: (e, t) => e.score === t.score ? e.idx < t.idx ? -1 : 1 : e.score < t.score ? -1 : 1
}, he = {
	location: 0,
	threshold: .6,
	distance: 100
}, ge = {
	useExtendedSearch: !1,
	useTokenSearch: !1,
	tokenize: void 0,
	tokenMatch: "any",
	getFn: fe,
	ignoreLocation: !1,
	ignoreFieldNorm: !1,
	fieldNormWeight: 1
}, E = Object.freeze({
	...me,
	...pe,
	...he,
	...ge
});
function _e(e) {
	return e >= 9 && e <= 13 || e === 32 || e === 160;
}
function ve(e = 1, t = 3) {
	let n = /* @__PURE__ */ new Map(), r = 10 ** t;
	return {
		get(t) {
			let i = 0, a = !1;
			for (let e = 0; e < t.length; e++) _e(t.charCodeAt(e)) ? a = !1 : a ||= (i++, !0);
			if (i === 0 && (i = 1), n.has(i)) return n.get(i);
			let o = Math.round(r / i ** (.5 * e)) / r;
			return n.set(i, o), o;
		},
		clear() {
			n.clear();
		}
	};
}
var ye = class {
	constructor({ getFn: e = E.getFn, fieldNormWeight: t = E.fieldNormWeight } = {}) {
		this.norm = ve(t, 3), this.getFn = e, this.isCreated = !1, this.docs = [], this.keys = [], this._keysMap = {}, this.setIndexRecords();
	}
	setSources(e = []) {
		this.docs = e;
	}
	setIndexRecords(e = []) {
		this.records = e;
	}
	setKeys(e = []) {
		this.keys = e, this._keysMap = {}, e.forEach((e, t) => {
			this._keysMap[e.id] = t;
		});
	}
	create() {
		if (this.isCreated || !this.docs.length) return;
		this.isCreated = !0;
		let e = this.docs.length;
		this.records = Array(e);
		let t = 0;
		if (v(this.docs[0])) for (let n = 0; n < e; n++) {
			let e = this._createStringRecord(this.docs[n], n);
			e && (this.records[t++] = e);
		}
		else for (let n = 0; n < e; n++) this.records[t++] = this._createObjectRecord(this.docs[n], n);
		this.records.length = t, this.norm.clear();
	}
	add(e, t) {
		if (!Number.isInteger(t) || t < 0) throw Error(ne);
		if (v(e)) {
			let n = this._createStringRecord(e, t);
			return n && this.records.push(n), n;
		}
		let n = this._createObjectRecord(e, t);
		return this.records.push(n), n;
	}
	removeAt(e) {
		if (!Number.isInteger(e) || e < 0) throw Error(ne);
		for (let t = 0, n = this.records.length; t < n; t += 1) if (this.records[t].i === e) {
			this.records.splice(t, 1);
			break;
		}
		for (let t = 0, n = this.records.length; t < n; t += 1) this.records[t].i > e && --this.records[t].i;
	}
	removeAll(e) {
		let t = /* @__PURE__ */ new Set();
		for (let n of e) Number.isInteger(n) && n >= 0 && t.add(n);
		if (t.size === 0) return;
		this.records = this.records.filter((e) => !t.has(e.i));
		let n = Array.from(t).sort((e, t) => e - t);
		for (let e of this.records) {
			let t = 0, r = n.length;
			for (; t < r;) {
				let i = t + r >>> 1;
				n[i] < e.i ? t = i + 1 : r = i;
			}
			e.i -= t;
		}
	}
	getValueForItemAtKeyId(e, t) {
		return e[this._keysMap[t]];
	}
	size() {
		return this.records.length;
	}
	_createStringRecord(e, t) {
		return !C(e) || w(e) ? null : {
			v: e,
			i: t,
			n: this.norm.get(e)
		};
	}
	_createObjectRecord(e, t) {
		let n = {
			i: t,
			$: {}
		};
		for (let t = 0, r = this.keys.length; t < r; t++) {
			let r = this.keys[t], i = r.getFn ? r.getFn(e) : this.getFn(e, r.path);
			if (C(i)) {
				if (h(i)) {
					let e = [];
					for (let t = 0, n = i.length; t < n; t += 1) {
						let n = i[t];
						if (C(n)) {
							if (v(n)) {
								if (!w(n)) {
									let r = {
										v: n,
										i: t,
										n: this.norm.get(n)
									};
									e.push(r);
								}
							} else if (C(n.v)) {
								let t = v(n.v) ? n.v : _(n.v);
								if (!w(t)) {
									let r = {
										v: t,
										i: n.i,
										n: this.norm.get(t)
									};
									e.push(r);
								}
							}
						}
					}
					n.$[t] = e;
				} else if (v(i) && !w(i)) {
					let e = {
						v: i,
						n: this.norm.get(i)
					};
					n.$[t] = e;
				}
			}
		}
		return n;
	}
	toJSON() {
		return {
			keys: this.keys.map(({ getFn: e, ...t }) => t),
			records: this.records
		};
	}
};
function be(e, t, { getFn: n = E.getFn, fieldNormWeight: r = E.fieldNormWeight } = {}) {
	let i = new ye({
		getFn: n,
		fieldNormWeight: r
	});
	return i.setKeys(e.map(ue)), i.setSources(t), i.create(), i;
}
function xe(e, { getFn: t = E.getFn, fieldNormWeight: n = E.fieldNormWeight } = {}) {
	let { keys: r, records: i } = e, a = new ye({
		getFn: t,
		fieldNormWeight: n
	});
	return a.setKeys(r), a.setIndexRecords(i), a;
}
function Se(e = [], t = E.minMatchCharLength) {
	let n = [], r = -1, i = -1, a = 0;
	for (let o = e.length; a < o; a += 1) {
		let o = e[a];
		o && r === -1 ? r = a : !o && r !== -1 && (i = a - 1, i - r + 1 >= t && n.push([r, i]), r = -1);
	}
	return e[a - 1] && a - r >= t && n.push([r, a - 1]), n;
}
function Ce(e, t, n, { location: r = E.location, distance: i = E.distance, threshold: a = E.threshold, findAllMatches: o = E.findAllMatches, minMatchCharLength: s = E.minMatchCharLength, includeMatches: c = E.includeMatches, ignoreLocation: l = E.ignoreLocation } = {}) {
	if (t.length > 32) throw Error(ie(32));
	let u = t.length, d = e.length, f = Math.max(0, Math.min(r, d)), p = a, m = f, h = (e, t) => {
		let n = e / u;
		if (l) return n;
		let r = Math.abs(f - t);
		return i ? n + r / i : r ? 1 : n;
	}, g = s > 1 || c, _ = g ? Array(d) : [], v;
	for (; (v = e.indexOf(t, m)) > -1;) {
		let e = h(0, v);
		if (p = Math.min(e, p), m = v + u, g) {
			let e = 0;
			for (; e < u;) _[v + e] = 1, e += 1;
		}
	}
	m = -1;
	let y = [], b = 1, x = 0, S = u + d, C = 1 << u - 1;
	for (let t = 0; t < u; t += 1) {
		let r = 0, i = S;
		for (; r < i;) h(t, f + i) <= p ? r = i : S = i, i = Math.floor((S - r) / 2 + r);
		S = i;
		let a = Math.max(1, f - i + 1), s = o ? d : Math.min(f + i, d) + u, c = Array(s + 2);
		c[s + 1] = (1 << t) - 1;
		for (let r = s; r >= a; --r) {
			let i = r - 1, o = n[e[i]];
			if (c[r] = (c[r + 1] << 1 | 1) & o, t && (c[r] |= (y[r + 1] | y[r]) << 1 | 1 | y[r + 1]), c[r] & C && (b = h(t, i), b <= p)) {
				if (p = b, m = i, x = t, m <= f) break;
				a = Math.max(1, 2 * f - m);
			}
		}
		if (h(t + 1, f) > p) break;
		y = c;
	}
	if (g && m >= 0) {
		let t = Math.min(d - 1, m + u - 1 + x);
		for (let r = m; r <= t; r += 1) n[e[r]] && (_[r] = 1);
	}
	let w = {
		isMatch: m >= 0,
		score: Math.max(.001, b)
	};
	if (g) {
		let e = Se(_, s);
		e.length ? c && (w.indices = e) : w.isMatch = !1;
	}
	return w;
}
function we(e) {
	let t = {};
	for (let n = 0, r = e.length; n < r; n += 1) {
		let i = e.charAt(n);
		t[i] = (t[i] || 0) | 1 << r - n - 1;
	}
	return t;
}
function Te(e) {
	if (e.length <= 1) return e;
	e.sort((e, t) => e[0] - t[0] || e[1] - t[1]);
	let t = [e[0]];
	for (let n = 1, r = e.length; n < r; n += 1) {
		let r = t[t.length - 1], i = e[n];
		i[0] <= r[1] + 1 ? r[1] = Math.max(r[1], i[1]) : t.push(i);
	}
	return t;
}
var Ee = {
	ł: "l",
	Ł: "L",
	đ: "d",
	Đ: "D",
	ø: "o",
	Ø: "O",
	ħ: "h",
	Ħ: "H",
	ŧ: "t",
	Ŧ: "T",
	ı: "i",
	ß: "ss"
}, De = RegExp("[" + Object.keys(Ee).join("") + "]", "g"), D = typeof String.prototype.normalize == "function" ? (e) => e.normalize("NFD").replace(/[\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C04\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9E5\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F]/g, "").replace(De, (e) => Ee[e]) : (e) => e, Oe = class {
	constructor(e, { location: t = E.location, threshold: n = E.threshold, distance: r = E.distance, includeMatches: i = E.includeMatches, findAllMatches: a = E.findAllMatches, minMatchCharLength: o = E.minMatchCharLength, isCaseSensitive: s = E.isCaseSensitive, ignoreDiacritics: c = E.ignoreDiacritics, ignoreLocation: l = E.ignoreLocation } = {}) {
		if (this.options = {
			location: t,
			threshold: n,
			distance: r,
			includeMatches: i,
			findAllMatches: a,
			minMatchCharLength: o,
			isCaseSensitive: s,
			ignoreDiacritics: c,
			ignoreLocation: l
		}, e = s ? e : e.toLowerCase(), e = c ? D(e) : e, this.pattern = e, this.chunks = [], !this.pattern.length) return;
		let u = (e, t) => {
			this.chunks.push({
				pattern: e,
				alphabet: we(e),
				startIndex: t
			});
		}, d = this.pattern.length;
		if (d > 32) {
			let e = 0, t = d % 32, n = d - t;
			for (; e < n;) u(this.pattern.substr(e, 32), e), e += 32;
			if (t) {
				let e = d - 32;
				u(this.pattern.substr(e), e);
			}
		} else u(this.pattern, 0);
	}
	searchIn(e) {
		let { isCaseSensitive: t, ignoreDiacritics: n, includeMatches: r } = this.options;
		if (e = t ? e : e.toLowerCase(), e = n ? D(e) : e, this.pattern === e) {
			if (e.length < this.options.minMatchCharLength) return {
				isMatch: !1,
				score: 1
			};
			let t = {
				isMatch: !0,
				score: 0
			};
			return r && (t.indices = [[0, e.length - 1]]), t;
		}
		let { location: i, distance: a, threshold: o, findAllMatches: s, minMatchCharLength: c, ignoreLocation: l } = this.options, u = [], d = 0, f = !1;
		this.chunks.forEach(({ pattern: t, alphabet: n, startIndex: p }) => {
			let { isMatch: m, score: h, indices: g } = Ce(e, t, n, {
				location: i + p,
				distance: a,
				threshold: o,
				findAllMatches: s,
				minMatchCharLength: c,
				includeMatches: r,
				ignoreLocation: l
			});
			m && (f = !0), d += h, m && g && u.push(...g);
		});
		let p = {
			isMatch: f,
			score: f ? d / this.chunks.length : 1
		};
		return f && r && (p.indices = Te(u)), p;
	}
}, ke = new Set(["fuzzy", "include"]);
function Ae(e) {
	return e.startsWith("inverse");
}
var je = [
	{
		type: "exact",
		multiRegex: /^="(.*)"$/,
		singleRegex: /^=(.*)$/,
		create: (e) => ({
			type: "exact",
			search(t) {
				let n = t === e;
				return {
					isMatch: n,
					score: +!n,
					indices: [0, e.length - 1]
				};
			}
		})
	},
	{
		type: "include",
		multiRegex: /^'"(.*)"$/,
		singleRegex: /^'(.*)$/,
		create: (e) => ({
			type: "include",
			search(t) {
				let n = 0, r, i = [], a = e.length;
				for (; (r = t.indexOf(e, n)) > -1;) n = r + a, i.push([r, n - 1]);
				let o = !!i.length;
				return {
					isMatch: o,
					score: +!o,
					indices: i
				};
			}
		})
	},
	{
		type: "prefix-exact",
		multiRegex: /^\^"(.*)"$/,
		singleRegex: /^\^(.*)$/,
		create: (e) => ({
			type: "prefix-exact",
			search(t) {
				let n = t.startsWith(e);
				return {
					isMatch: n,
					score: +!n,
					indices: [0, e.length - 1]
				};
			}
		})
	},
	{
		type: "inverse-prefix-exact",
		multiRegex: /^!\^"(.*)"$/,
		singleRegex: /^!\^(.*)$/,
		create: (e) => ({
			type: "inverse-prefix-exact",
			search(t) {
				let n = !t.startsWith(e);
				return {
					isMatch: n,
					score: +!n,
					indices: [0, t.length - 1]
				};
			}
		})
	},
	{
		type: "inverse-suffix-exact",
		multiRegex: /^!"(.*)"\$$/,
		singleRegex: /^!(.*)\$$/,
		create: (e) => ({
			type: "inverse-suffix-exact",
			search(t) {
				let n = !t.endsWith(e);
				return {
					isMatch: n,
					score: +!n,
					indices: [0, t.length - 1]
				};
			}
		})
	},
	{
		type: "suffix-exact",
		multiRegex: /^"(.*)"\$$/,
		singleRegex: /^(.*)\$$/,
		create: (e) => ({
			type: "suffix-exact",
			search(t) {
				let n = t.endsWith(e);
				return {
					isMatch: n,
					score: +!n,
					indices: [t.length - e.length, t.length - 1]
				};
			}
		})
	},
	{
		type: "inverse-exact",
		multiRegex: /^!"(.*)"$/,
		singleRegex: /^!(.*)$/,
		create: (e) => ({
			type: "inverse-exact",
			search(t) {
				let n = t.indexOf(e) === -1;
				return {
					isMatch: n,
					score: +!n,
					indices: [0, t.length - 1]
				};
			}
		})
	},
	{
		type: "fuzzy",
		multiRegex: /^"(.*)"$/,
		singleRegex: /^(.*)$/,
		create: (e, t = {}) => {
			let n = new Oe(e, {
				location: t.location ?? E.location,
				threshold: t.threshold ?? E.threshold,
				distance: t.distance ?? E.distance,
				includeMatches: t.includeMatches ?? E.includeMatches,
				findAllMatches: t.findAllMatches ?? E.findAllMatches,
				minMatchCharLength: t.minMatchCharLength ?? E.minMatchCharLength,
				isCaseSensitive: t.isCaseSensitive ?? E.isCaseSensitive,
				ignoreDiacritics: t.ignoreDiacritics ?? E.ignoreDiacritics,
				ignoreLocation: t.ignoreLocation ?? E.ignoreLocation
			});
			return {
				type: "fuzzy",
				search(e) {
					return n.searchIn(e);
				}
			};
		}
	}
], Me = je.length, Ne = "\0", Pe = "|";
function Fe(e) {
	let t = [], n = e.length, r = 0;
	for (; r < n;) {
		for (; r < n && e[r] === " ";) r++;
		if (r >= n) break;
		let i = r;
		for (; i < n && e[i] !== " " && e[i] !== "\"";) i++;
		if (i < n && e[i] === "\"") {
			for (i++; i < n;) {
				if (e[i] === "\"") {
					let t = i + 1;
					if (t >= n || e[t] === " ") {
						i++;
						break;
					}
					if (e[t] === "$" && (t + 1 >= n || e[t + 1] === " ")) {
						i += 2;
						break;
					}
				}
				i++;
			}
			t.push(e.substring(r, i)), r = i;
		} else {
			for (; i < n && e[i] !== " ";) i++;
			t.push(e.substring(r, i)), r = i;
		}
	}
	return t;
}
function Ie(e, t) {
	let n = e.match(t);
	return n ? n[1] : null;
}
function Le(e, t = {}) {
	return e.replace(/\\\|/g, Ne).split(Pe).map((e) => {
		let n = Fe(e.replace(/\u0000/g, "|").trim()).filter((e) => e && !!e.trim()), r = [];
		for (let e = 0, i = n.length; e < i; e += 1) {
			let i = n[e], a = !1, o = -1;
			for (; !a && ++o < Me;) {
				let e = je[o], n = Ie(i, e.multiRegex);
				n && (r.push(e.create(n, t)), a = !0);
			}
			if (!a) for (o = -1; ++o < Me;) {
				let e = je[o], n = Ie(i, e.singleRegex);
				if (n) {
					r.push(e.create(n, t));
					break;
				}
			}
		}
		return r;
	});
}
var Re = class {
	constructor(e, { isCaseSensitive: t = E.isCaseSensitive, ignoreDiacritics: n = E.ignoreDiacritics, includeMatches: r = E.includeMatches, minMatchCharLength: i = E.minMatchCharLength, ignoreLocation: a = E.ignoreLocation, findAllMatches: o = E.findAllMatches, location: s = E.location, threshold: c = E.threshold, distance: l = E.distance } = {}) {
		this.query = null, this.options = {
			isCaseSensitive: t,
			ignoreDiacritics: n,
			includeMatches: r,
			minMatchCharLength: i,
			findAllMatches: o,
			ignoreLocation: a,
			location: s,
			threshold: c,
			distance: l
		}, e = t ? e : e.toLowerCase(), e = n ? D(e) : e, this.pattern = e, this.query = Le(this.pattern, this.options);
	}
	static condition(e, t) {
		return t.useExtendedSearch;
	}
	searchIn(e) {
		let t = this.query;
		if (!t) return {
			isMatch: !1,
			score: 1
		};
		let { includeMatches: n, isCaseSensitive: r, ignoreDiacritics: i } = this.options;
		e = r ? e : e.toLowerCase(), e = i ? D(e) : e;
		let a = 0, o = [], s = 0, c = !1;
		for (let r = 0, i = t.length; r < i; r += 1) {
			let i = t[r];
			o.length = 0, a = 0, c = !1;
			for (let t = 0, r = i.length; t < r; t += 1) {
				let r = i[t], { isMatch: l, indices: u, score: d } = r.search(e);
				if (l) a += 1, s += d, Ae(r.type) && (c = !0), n && (ke.has(r.type) ? o.push(...u) : o.push(u));
				else {
					s = 0, a = 0, o.length = 0, c = !1;
					break;
				}
			}
			if (a) {
				let e = {
					isMatch: !0,
					score: s / a
				};
				return c && (e.hasInverse = !0), n && (e.indices = Te(o)), e;
			}
		}
		return {
			isMatch: !1,
			score: 1
		};
	}
}, ze = [];
function Be(...e) {
	ze.push(...e);
}
function O(e, t) {
	for (let n = 0, r = ze.length; n < r; n += 1) {
		let r = ze[n];
		if (r.condition(e, t)) return new r(e, t);
	}
	return new Oe(e, t);
}
var Ve = {
	AND: "$and",
	OR: "$or"
}, He = {
	PATH: "$path",
	PATTERN: "$val"
}, Ue = (e) => !!(e[Ve.AND] || e[Ve.OR]), We = (e) => !!e[He.PATH], Ge = (e) => !h(e) && x(e) && !Ue(e), Ke = (e) => ({ [Ve.AND]: Object.keys(e).map((t) => ({ [t]: e[t] })) });
function qe(e, t, { auto: n = !0 } = {}) {
	let r = (e) => {
		if (v(e)) {
			let r = {
				keyId: null,
				pattern: e
			};
			return n && (r.searcher = O(e, t)), r;
		}
		let i = Object.keys(e), a = We(e);
		if (!a && i.length > 1 && !Ue(e)) return r(Ke(e));
		if (Ge(e)) {
			let r = a ? e[He.PATH] : i[0], o = a ? e[He.PATTERN] : e[r];
			if (!v(o)) throw Error(re(r));
			let s = {
				keyId: T(r),
				pattern: o
			};
			return n && (s.searcher = O(o, t)), s;
		}
		let o = {
			children: [],
			operator: i[0]
		};
		return i.forEach((t) => {
			let n = e[t];
			h(n) && n.forEach((e) => {
				o.children.push(r(e));
			});
		}), o;
	};
	return Ue(e) || (e = Ke(e)), r(e);
}
function Je(e, { ignoreFieldNorm: t = E.ignoreFieldNorm }) {
	let n = 1;
	return e.forEach(({ key: e, norm: r, score: i }) => {
		let a = e ? e.weight : null;
		n *= (i === 0 && a ? 2 ** -52 : i) ** +((a || 1) * (t ? 1 : r));
	}), n;
}
function Ye(e, { ignoreFieldNorm: t = E.ignoreFieldNorm }) {
	e.forEach((e) => {
		e.score = Je(e.matches, { ignoreFieldNorm: t });
	});
}
var Xe = class {
	constructor(e, t) {
		this.limit = e, this.heap = [], this.comparator = t;
	}
	get size() {
		return this.heap.length;
	}
	insert(e) {
		this.size < this.limit ? (this.heap.push(e), this._bubbleUp(this.size - 1)) : this.comparator(e, this.heap[0]) < 0 && (this.heap[0] = e, this._sinkDown(0));
	}
	extractSorted() {
		return this.heap.sort(this.comparator);
	}
	_bubbleUp(e) {
		let t = this.heap;
		for (; e > 0;) {
			let n = e - 1 >> 1;
			if (this.comparator(t[e], t[n]) <= 0) break;
			let r = t[e];
			t[e] = t[n], t[n] = r, e = n;
		}
	}
	_sinkDown(e) {
		let t = this.heap, n = t.length, r = e;
		do {
			e = r;
			let i = 2 * e + 1, a = 2 * e + 2;
			if (i < n && this.comparator(t[i], t[r]) > 0 && (r = i), a < n && this.comparator(t[a], t[r]) > 0 && (r = a), r !== e) {
				let n = t[e];
				t[e] = t[r], t[r] = n;
			}
		} while (r !== e);
	}
};
function Ze(e) {
	let t = [];
	return e.matches.forEach((e) => {
		if (!C(e.indices) || !e.indices.length) return;
		let n = {
			indices: e.indices,
			value: e.value
		};
		e.key && (n.key = e.key.id), e.idx > -1 && (n.refIndex = e.idx), t.push(n);
	}), t;
}
function Qe(e, t, { includeMatches: n = E.includeMatches, includeScore: r = E.includeScore } = {}) {
	return e.map((e) => {
		let { idx: i } = e, a = {
			item: t[i],
			refIndex: i
		};
		return n && (a.matches = Ze(e)), r && (a.score = e.score), a;
	});
}
var $e = /[\p{L}\p{M}\p{N}_]+/gu, et = /* @__PURE__ */ new WeakSet();
function tt(e) {
	et.has(e) || (et.add(e), console.warn(`[Fuse] tokenize regex ${e} lacks the global flag; only the first match per text will be returned. Add the 'g' flag.`));
}
function nt(e) {
	if (typeof e == "function") {
		let t = !1;
		return (n) => {
			let r = e(n);
			if (!t && (t = !0, !Array.isArray(r) || r.some((e) => typeof e != "string"))) throw Error(`[Fuse] tokenize function must return string[]; received ${Array.isArray(r) ? "array containing non-strings" : typeof r}.`);
			return r;
		};
	}
	return e instanceof RegExp ? (e.global || tt(e), (t) => t.match(e) || []) : (e) => e.match($e) || [];
}
function rt({ isCaseSensitive: e = !1, ignoreDiacritics: t = !1, tokenize: n } = {}) {
	let r = nt(n);
	return { tokenize(n) {
		return e || (n = n.toLowerCase()), t && (n = D(n)), r(n);
	} };
}
var it = class {
	static condition(e, t) {
		return t.useTokenSearch;
	}
	constructor(e, t) {
		this.options = t, this.analyzer = rt({
			isCaseSensitive: t.isCaseSensitive,
			ignoreDiacritics: t.ignoreDiacritics,
			tokenize: t.tokenize
		});
		let n = this.analyzer.tokenize(e), { df: r, fieldCount: i } = t._invertedIndex;
		this.termSearchers = [], this.idfWeights = [];
		for (let e of n) {
			this.termSearchers.push(new Oe(e, {
				location: t.location,
				threshold: t.threshold,
				distance: t.distance,
				includeMatches: t.includeMatches,
				findAllMatches: t.findAllMatches,
				minMatchCharLength: t.minMatchCharLength,
				isCaseSensitive: t.isCaseSensitive,
				ignoreDiacritics: t.ignoreDiacritics,
				ignoreLocation: !0
			}));
			let n = r.get(e) || 0, a = Math.log(1 + (i - n + .5) / (n + .5));
			this.idfWeights.push(a);
		}
		this.combineAll = t.tokenMatch === "all", this.numTerms = this.termSearchers.length, this.useMask = this.numTerms <= 31;
	}
	searchIn(e) {
		if (!this.termSearchers.length) return {
			isMatch: !1,
			score: 1
		};
		let t = [], n = 0, r = 0, i = 0, a = 0, o = this.combineAll && !this.useMask ? /* @__PURE__ */ new Set() : null;
		for (let s = 0; s < this.termSearchers.length; s++) {
			let c = this.termSearchers[s].searchIn(e), l = this.idfWeights[s];
			r += l, c.isMatch && (i++, n += l * (1 - c.score), c.indices && t.push(...c.indices), this.combineAll && (this.useMask ? a |= 1 << s : o.add(s)));
		}
		if (i === 0) return {
			isMatch: !1,
			score: 1
		};
		let s = r > 0 ? 1 - n / r : 0, c = {
			isMatch: !0,
			score: Math.max(.001, s)
		};
		return this.options.includeMatches && t.length && (c.indices = Te(t)), this.combineAll && (this.useMask ? c.matchedMask = a : c.matchedTerms = o, c.termCount = this.numTerms), c;
	}
};
function at(e, t, n, r) {
	let i = r.tokenize(t);
	if (!i.length) return;
	e.fieldCount++, e.docFieldCount.set(n, (e.docFieldCount.get(n) || 0) + 1);
	let a = new Set(i), o = e.docTermFieldHits.get(n);
	o || (o = /* @__PURE__ */ new Map(), e.docTermFieldHits.set(n, o));
	for (let t of a) o.set(t, (o.get(t) || 0) + 1), e.df.set(t, (e.df.get(t) || 0) + 1);
}
function ot(e, t, n, r) {
	let { i, v: a, $: o } = t;
	if (a !== void 0) {
		at(e, a, i, r);
		return;
	}
	if (o) for (let t = 0; t < n; t++) {
		let n = o[t];
		if (n) if (Array.isArray(n)) for (let t of n) at(e, t.v, i, r);
		else at(e, n.v, i, r);
	}
}
function st(e, t, n) {
	let r = {
		fieldCount: 0,
		df: /* @__PURE__ */ new Map(),
		docFieldCount: /* @__PURE__ */ new Map(),
		docTermFieldHits: /* @__PURE__ */ new Map()
	};
	for (let i of e) ot(r, i, t, n);
	return r;
}
function ct(e, t, n, r) {
	ot(e, t, n, r);
}
function lt(e, t) {
	let n = e.docFieldCount.get(t);
	if (n === void 0) return;
	e.fieldCount -= n, e.docFieldCount.delete(t);
	let r = e.docTermFieldHits.get(t);
	if (r) {
		for (let [t, n] of r) {
			let r = (e.df.get(t) || 0) - n;
			r <= 0 ? e.df.delete(t) : e.df.set(t, r);
		}
		e.docTermFieldHits.delete(t);
	}
}
function ut(e, t) {
	if (t.length === 0) return;
	let n = Array.from(new Set(t)).sort((e, t) => e - t);
	for (let t of n) lt(e, t);
	let r = (e) => {
		let t = 0, r = n.length;
		for (; t < r;) {
			let i = t + r >>> 1;
			n[i] < e ? t = i + 1 : r = i;
		}
		return e - t;
	}, i = n[0], a = /* @__PURE__ */ new Map();
	for (let [t, n] of e.docFieldCount) a.set(t > i ? r(t) : t, n);
	e.docFieldCount = a;
	let o = /* @__PURE__ */ new Map();
	for (let [t, n] of e.docTermFieldHits) o.set(t > i ? r(t) : t, n);
	e.docTermFieldHits = o;
}
var k = class {
	constructor(e, t, n) {
		this.options = {
			...E,
			...t
		}, this.options.useExtendedSearch, this.options.useTokenSearch, this._keyStore = new le(this.options.keys), this._docs = e, this._myIndex = null, this._invertedIndex = null, this.setCollection(e, n), this._lastQuery = null, this._lastSearcher = null;
	}
	_getSearcher(e) {
		if (this._lastQuery === e) return this._lastSearcher;
		let t = O(e, this._invertedIndex ? {
			...this.options,
			_invertedIndex: this._invertedIndex
		} : this.options);
		return this._lastQuery = e, this._lastSearcher = t, t;
	}
	setCollection(e, t) {
		if (this._docs = e, t && !(t instanceof ye)) throw Error(te);
		if (this._myIndex = t || be(this.options.keys, this._docs, {
			getFn: this.options.getFn,
			fieldNormWeight: this.options.fieldNormWeight
		}), this.options.useTokenSearch) {
			let e = rt({
				isCaseSensitive: this.options.isCaseSensitive,
				ignoreDiacritics: this.options.ignoreDiacritics,
				tokenize: this.options.tokenize
			});
			this._invertedIndex = st(this._myIndex.records, this._myIndex.keys.length, e);
		}
		this._invalidateSearcherCache();
	}
	add(e) {
		if (!C(e)) return;
		this._docs.push(e);
		let t = this._myIndex.add(e, this._docs.length - 1);
		if (this._invertedIndex && t) {
			let e = rt({
				isCaseSensitive: this.options.isCaseSensitive,
				ignoreDiacritics: this.options.ignoreDiacritics,
				tokenize: this.options.tokenize
			});
			ct(this._invertedIndex, t, this._myIndex.keys.length, e);
		}
		this._invalidateSearcherCache();
	}
	remove(e = () => !1) {
		let t = [], n = [];
		for (let r = 0, i = this._docs.length; r < i; r += 1) e(this._docs[r], r) && (t.push(this._docs[r]), n.push(r));
		if (n.length) {
			this._invertedIndex && ut(this._invertedIndex, n);
			let e = new Set(n);
			this._docs = this._docs.filter((t, n) => !e.has(n)), this._myIndex.removeAll(n), this._invalidateSearcherCache();
		}
		return t;
	}
	removeAt(e) {
		if (!Number.isInteger(e) || e < 0 || e >= this._docs.length) throw Error(ne);
		this._invertedIndex && ut(this._invertedIndex, [e]);
		let t = this._docs.splice(e, 1)[0];
		return this._myIndex.removeAt(e), this._invalidateSearcherCache(), t;
	}
	_invalidateSearcherCache() {
		this._lastQuery = null, this._lastSearcher = null;
	}
	getIndex() {
		return this._myIndex;
	}
	_normalizedKeys() {
		return this._myIndex.keys.map((e) => this._keyStore.get(e.id) || e);
	}
	search(e, t) {
		let { limit: n = -1 } = t || {}, { includeMatches: r, includeScore: i, shouldSort: a, sortFn: o, ignoreFieldNorm: s } = this.options;
		if (v(e) && !e.trim()) {
			let e = this._docs.map((e, t) => ({
				item: e,
				refIndex: t
			}));
			return y(n) && n > -1 && (e = e.slice(0, n)), e;
		}
		let c = a && y(n) && n > 0 && v(e), l = o, u = (e, t) => l(e, t) || e.idx - t.idx, d;
		if (c) {
			let t = new Xe(n, u);
			v(this._docs[0]) ? this._searchStringList(e, {
				heap: t,
				ignoreFieldNorm: s
			}) : this._searchObjectList(e, {
				heap: t,
				ignoreFieldNorm: s
			}), d = t.extractSorted();
		} else d = v(e) ? v(this._docs[0]) ? this._searchStringList(e) : this._searchObjectList(e) : this._searchLogical(e), Ye(d, { ignoreFieldNorm: s }), a && d.sort(v(e) ? u : l), y(n) && n > -1 && (d = d.slice(0, n));
		return Qe(d, this._docs, {
			includeMatches: r,
			includeScore: i
		});
	}
	_searchStringList(e, { heap: t, ignoreFieldNorm: n } = {}) {
		let r = this._getSearcher(e), i = this.options.useTokenSearch && this.options.tokenMatch === "all", { records: a } = this._myIndex, o = t ? null : [];
		return a.forEach(({ v: e, i: a, n: s }) => {
			if (!C(e)) return;
			let c = r.searchIn(e);
			if (c.isMatch) {
				let r = {
					score: c.score,
					value: e,
					norm: s,
					indices: c.indices
				};
				i && (r.matchedMask = c.matchedMask, r.matchedTerms = c.matchedTerms, r.termCount = c.termCount);
				let l = [r];
				if (!i || this._coversAllTokens(l)) {
					let r = {
						item: e,
						idx: a,
						matches: l
					};
					t ? (r.score = Je(r.matches, { ignoreFieldNorm: n }), t.insert(r)) : o.push(r);
				}
			}
		}), o;
	}
	_searchLogical(e) {
		let t = qe(e, this.options), n = this._normalizedKeys(), r = (e, t, i) => {
			if (!("children" in e)) {
				let { keyId: r, searcher: a } = e, o;
				return r === null ? (o = [], n.forEach((e, n) => {
					o.push(...this._findMatches({
						key: e,
						value: t[n],
						searcher: a
					}));
				})) : o = this._findMatches({
					key: this._keyStore.get(r),
					value: this._myIndex.getValueForItemAtKeyId(t, r),
					searcher: a
				}), o && o.length ? [{
					idx: i,
					item: t,
					matches: o
				}] : [];
			}
			let { children: a, operator: o } = e, s = [];
			for (let e = 0, n = a.length; e < n; e += 1) {
				let n = a[e], c = r(n, t, i);
				if (c.length) s.push(...c);
				else if (o === Ve.AND) return [];
			}
			return s;
		}, i = this._myIndex.records, a = /* @__PURE__ */ new Map(), o = [];
		return i.forEach(({ $: e, i: n }) => {
			if (C(e)) {
				let i = r(t, e, n);
				i.length && (a.has(n) || (a.set(n, {
					idx: n,
					item: e,
					matches: []
				}), o.push(a.get(n))), i.forEach(({ matches: e }) => {
					a.get(n).matches.push(...e);
				}));
			}
		}), o;
	}
	_searchObjectList(e, { heap: t, ignoreFieldNorm: n } = {}) {
		let r = this._getSearcher(e), i = this.options.useTokenSearch && this.options.tokenMatch === "all", { records: a } = this._myIndex, o = this._normalizedKeys(), s = t ? null : [];
		return a.forEach(({ $: e, i: a }) => {
			if (!C(e)) return;
			let c = [], l = !1, u = !1;
			if (o.forEach((t, n) => {
				let i = this._findMatches({
					key: t,
					value: e[n],
					searcher: r
				});
				i.length ? (c.push(...i), i[0].hasInverse && (u = !0)) : l = !0;
			}), !(u && l) && c.length && (!i || this._coversAllTokens(c))) {
				let r = {
					idx: a,
					item: e,
					matches: c
				};
				t ? (r.score = Je(r.matches, { ignoreFieldNorm: n }), t.insert(r)) : s.push(r);
			}
		}), s;
	}
	_findMatches({ key: e, value: t, searcher: n }) {
		if (!C(t)) return [];
		let r = [];
		if (h(t)) t.forEach(({ v: t, i, n: a }) => {
			if (!C(t)) return;
			let o = n.searchIn(t);
			if (o.isMatch) {
				let n = {
					score: o.score,
					key: e,
					value: t,
					idx: i,
					norm: a,
					indices: o.indices,
					hasInverse: o.hasInverse
				};
				o.termCount !== void 0 && (n.matchedMask = o.matchedMask, n.matchedTerms = o.matchedTerms, n.termCount = o.termCount), r.push(n);
			}
		});
		else {
			let { v: i, n: a } = t, o = n.searchIn(i);
			if (o.isMatch) {
				let t = {
					score: o.score,
					key: e,
					value: i,
					norm: a,
					indices: o.indices,
					hasInverse: o.hasInverse
				};
				o.termCount !== void 0 && (t.matchedMask = o.matchedMask, t.matchedTerms = o.matchedTerms, t.termCount = o.termCount), r.push(t);
			}
		}
		return r;
	}
	_coversAllTokens(e) {
		let t = e.length ? e[0].termCount : void 0;
		if (t === void 0) return !0;
		if (t <= 31) {
			let n = 0;
			for (let t = 0; t < e.length; t++) n |= e[t].matchedMask || 0;
			return n === 2 ** t - 1;
		}
		let n = /* @__PURE__ */ new Set();
		for (let t = 0; t < e.length; t++) {
			let r = e[t].matchedTerms;
			if (r) for (let e of r) n.add(e);
		}
		return n.size === t;
	}
};
k.version = "7.5.0", k.createIndex = be, k.parseIndex = xe, k.config = E, k.match = function(e, t, n) {
	if (n && n.useTokenSearch) throw Error(se);
	return O(e, {
		...E,
		...n
	}).searchIn(t);
}, k.parseQuery = qe, Be(Re), Be(it), k.use = function(...e) {
	e.forEach((e) => Be(e));
};
var dt = k, ft = 5, pt = class {
	metadata = null;
	load(e) {
		let t = e;
		if (!Array.isArray(t.pages)) throw Error("AuroraLens.loadMetadata: metadata must include pages.");
		this.metadata = t;
	}
	loadPage(e, t) {
		let n = [];
		n[e] = t, this.load({ pages: n });
	}
	clear() {
		this.metadata = null;
	}
	hasPage(e) {
		return !!this.metadata?.pages[e];
	}
	pageCount() {
		return this.metadata?.pages.length ?? 0;
	}
	pageSize(e) {
		let t = this.page(e);
		return {
			width: t.width,
			height: t.height
		};
	}
	pageInfo(e) {
		let t = this.page(e);
		return {
			pageNumber: t.pageNumber,
			class: t.class ?? null,
			segments: t.segments ?? [],
			indexes: t.indexes ?? []
		};
	}
	getElement(e, t, n) {
		let r = this.page(e), i = r.tokens.filter((e) => p(e.polygon, t, n)).map((e) => this.token(e));
		return {
			tokens: i,
			contexts: r.contexts.filter((e) => p(e.polygon, t, n)).filter((e) => !i.some((t) => this.containsPoly(t.polygon, e.polygon))).map((e) => this.context(e)),
			figures: r.figures.filter((e) => p(e.polygon, t, n)).map((e) => this.figure(e))
		};
	}
	getElements(e, t, n, r, i) {
		let a = this.page(e), o = this.rect(t, n, r, i), s = this.expandRect(o, ft), c = this.tokenItems(e).filter((e) => this.inRectPoly(e.polygon, s));
		return {
			tokens: c.map((e) => e.value),
			contexts: this.contexts(a, c),
			figures: a.figures.filter((e) => this.hitRect(e.polygon, o)).map((e) => this.figure(e))
		};
	}
	selectionItems(e) {
		let t = this.page(e);
		return [...this.tokenItems(e).map((e) => ({
			tokens: [e.value],
			contexts: this.contexts(t, [e]),
			figures: []
		})), ...t.figures.map((e) => ({
			tokens: [],
			contexts: [],
			figures: [this.figure(e)]
		}))];
	}
	search(e, t, n) {
		let r = t.trim(), i = n?.trim();
		if (!r && !i) return {
			tokens: [],
			contexts: [],
			figures: []
		};
		let a = this.page(e), o = this.tokenTerms(this.tokenItems(e)), s = this.searchItems(o, r), c = this.uniqueTokens(this.searchTokens(o, a.contexts, s, !0, !1).flatMap((e) => e.tokens));
		if (i) {
			let e = this.searchContexts(a, i);
			if (r && !c.length && this.searchTokens(o, a.contexts, s, !1, !1).length) return {
				tokens: [],
				contexts: [],
				figures: []
			};
			if (r && !e.length) {
				let e = this.contexts(a, c);
				return {
					tokens: c.map((e) => e.value),
					contexts: e,
					figures: []
				};
			}
			return {
				tokens: c.filter((t) => e.some((e) => p(e.polygon, ...this.center(t.polygon)))).map((e) => e.value),
				contexts: e.map((e) => this.context(e)),
				figures: []
			};
		}
		return {
			tokens: c.map((e) => e.value),
			contexts: this.contexts(a, c),
			figures: []
		};
	}
	highlightIndex(e, t) {
		let n = this.page(e), r = this.tokenTerms(this.tokenItems(e)), i = this.searchItems(r, t.source), a = this.searchItems(r, t.value), o = this.searchTokens(r, n.contexts, i, !0, !1), s = n.contexts.filter((e) => o.some((t) => t.context ? t.context === e : t.tokens.some((t) => p(e.polygon, ...this.center(t.polygon))))), c = this.searchTokens(r, n.contexts.length ? n.contexts : null, a, !1, !0);
		!c.length && !s.length && n.contexts.length && (c = this.searchTokens(r, null, a, !1, !0));
		let l = c.length ? c : s.map((e) => ({
			context: e,
			tokens: [],
			score: 0
		})), u = null, d = -1, f = Infinity;
		for (let e of l) {
			let t = e.context ? o.find((t) => t.context === e.context) : void 0, n, r = e.score;
			if (t) n = i.matches.length, r += t.score;
			else {
				let t = this.selectTokens(i.matches.map((t) => t.filter((t) => !e.context || p(e.context.polygon, ...this.center(t.polygon))).sort((e, t) => e.position - t.position)), !0);
				n = t.length, r += t.reduce((e, t) => e + t.score, 0);
			}
			(n > d || n === d && r < f) && (u = e, d = n, f = r);
		}
		return {
			tokens: u ? u.tokens.map((e) => e.value) : [],
			contexts: u?.context && (!s.length || s.includes(u.context)) ? [this.context(u.context)] : u && !s.length ? this.contexts(n, u.tokens) : [],
			figures: []
		};
	}
	exportGroups(e, t) {
		let n = this.page(e), r = new Map(this.tokenItems(e).map((e) => [this.selectKey(e.value), e])), i = /* @__PURE__ */ new Map();
		return t.forEach((e) => {
			let t = r.get(this.selectKey(e));
			this.contexts(n, [t]).forEach((t) => {
				let n = typeof t.content == "string" ? t.content.toUpperCase() : t.content, r = typeof t.role == "string" ? t.role.toUpperCase() : "BODY", a = typeof e.token == "string" ? e.token.toUpperCase() : e.token;
				i.has(n) || i.set(n, { value: {
					token: [],
					context: [],
					kind: []
				} });
				let o = i.get(n).value;
				o.token.includes(a) || o.token.push(a), o.context.includes(n) || o.context.push(n), o.kind.includes(r) || o.kind.push(r);
			});
		}), Array.from(i.values());
	}
	searchTokens(e, t, { mode: n, matches: r }, i, a) {
		if (!r.length) return [];
		if (n === "or") {
			if (a) return this.contextTokens(e, t, [r.flat()], !1, !0);
			let n = this.uniqueTokens(r.flat());
			return [{
				tokens: n,
				context: null,
				score: Math.min(...n.map((e) => e.score))
			}];
		}
		return r.some((e) => !e.length) ? [] : r.length === 1 && !a ? [{
			tokens: r[0],
			context: null,
			score: Math.min(...r[0].map((e) => e.score))
		}] : this.contextTokens(e, t, r, i, a);
	}
	tokenTerms(e) {
		return e.flatMap((e) => this.searchTerms(e.token ?? "").map((t) => ({
			...e,
			token: t
		}))).map((e, t) => ({
			...e,
			position: t
		}));
	}
	searchTerms(e) {
		return e.replace(/[.,]/g, "").match(/[A-Za-z0-9#]+/g) ?? [];
	}
	uniqueTokens(e) {
		let t = /* @__PURE__ */ new Map();
		return e.forEach((e) => {
			t.set(this.selectKey(e.value), e);
		}), Array.from(t.values());
	}
	contextTokens(e, t, n, r, i) {
		let a = [];
		return (t ?? [null]).forEach((t) => {
			let o = n.map((e) => e.filter((e) => !t || p(t.polygon, ...this.center(e.polygon))).sort((e, t) => e.position - t.position));
			if (o.some((e) => !e.length)) return;
			if (r) {
				let t = -1;
				for (let e = 0; e < o.length; e += 1) {
					if (o[e] = o[e].filter((e) => e.position > t), !o[e].length) return;
					t = o[e][0].position;
				}
				let n = e.length;
				for (let e = o.length - 1; e >= 0; --e) o[e] = o[e].filter((e) => e.position < n), n = o[e][o[e].length - 1].position;
			}
			let s = o[0].map((e) => e.score);
			if (r) for (let e = 1; e < o.length; e += 1) {
				let t = 0, n = Infinity;
				s = o[e].map((r) => {
					for (; t < o[e - 1].length && o[e - 1][t].position < r.position;) n = Math.min(n, s[t]), t += 1;
					return n + r.score;
				});
			}
			let c = i ? this.selectTokens(o, !1) : o.flat();
			c.length && a.push({
				context: t,
				tokens: this.uniqueTokens(c).sort((e, t) => e.position - t.position),
				score: i ? c.reduce((e, t) => e + t.score, 0) : r ? Math.min(...s) : o.reduce((e, t) => e + Math.min(...t.map((e) => e.score)), 0)
			});
		}), a;
	}
	selectTokens(e, t) {
		let n = [], r = /* @__PURE__ */ new Map();
		for (let i = 0; i < e.length; i += 1) {
			let i = e.map((e, t) => n[t] ? Infinity : 0), a = /* @__PURE__ */ new Map();
			for (let t = 0; t < e.length; t += 1) {
				let t = !1;
				for (let o = 0; o < e.length; o += 1) if (i[o] !== Infinity) for (let s of e[o]) {
					if (n[o]?.position === s.position) continue;
					let e = i[o] + s.score, c = a.get(s.position);
					if (c && e >= c.cost) continue;
					a.set(s.position, {
						term: o,
						token: s,
						cost: e
					});
					let l = r.get(s.position);
					l !== void 0 && e - n[l].score < i[l] && (i[l] = e - n[l].score, t = !0);
				}
				if (!t) break;
			}
			let o = Array.from(a.values()).filter((e) => !r.has(e.token.position)).sort((e, t) => e.cost - t.cost || e.token.position - t.token.position)[0];
			if (!o) {
				if (!t) return [];
				break;
			}
			for (; o;) {
				let e = n[o.term];
				if (n[o.term] = o.token, r.set(o.token.position, o.term), !e) break;
				r.delete(e.position), o = a.get(e.position);
			}
		}
		return n.filter((e) => e);
	}
	selectKey(e) {
		return `${e.token}\n${e.polygon.join(",")}`;
	}
	tokenItems(e) {
		return this.page(e).tokens.map((e) => ({
			token: e.content || null,
			polygon: e.polygon,
			value: this.token(e)
		}));
	}
	token(e) {
		return {
			confidence: `${Math.round(e.confidence * 100)}%`,
			token: e.content || null,
			polygon: e.polygon
		};
	}
	contexts(e, t) {
		return e.contexts.filter((e) => e.content).filter((e) => t.some((t) => p(e.polygon, ...this.center(t.polygon)))).map((e) => this.context(e));
	}
	context(e) {
		return {
			role: e.role,
			content: e.content || null,
			polygon: e.polygon
		};
	}
	figure(e) {
		return { polygon: e.polygon };
	}
	searchItems(e, t) {
		let n = this.searchTerms(t), r = n.some((e) => /^or$/i.test(e)) ? "or" : "and", i = n.filter((e) => !/^(and|or)$/i.test(e)), a = [];
		if (!i.length) return {
			mode: r,
			matches: a
		};
		let o = {
			keys: ["token"],
			threshold: .3,
			isCaseSensitive: !1,
			includeScore: !0
		}, s = new dt(e, {
			...o,
			useExtendedSearch: !0
		}), c = new dt(e, {
			...o,
			useTokenSearch: !0
		}), l = /* @__PURE__ */ new Map();
		for (let e of i) {
			let t = e.toLowerCase(), n = l.get(t);
			if (!n) {
				let r = new Map(c.search(e).map((e) => [e.refIndex, e]));
				s.search(`=${e}`).forEach((e) => r.set(e.refIndex, e)), n = Array.from(r.values(), (e) => ({
					...e.item,
					score: e.score
				})), l.set(t, n);
			}
			a.push(n);
		}
		return {
			mode: r,
			matches: a
		};
	}
	searchContexts(e, t) {
		let n = this.contextItems(e), { mode: r, matches: i } = this.searchItems(n, t);
		if (!i.length) return [];
		let a = r === "or" ? i.flat() : i[0], o = new Map(a.map((e) => [e.key, e.value]));
		if (r === "or") return Array.from(o.values());
		let s = i.map((e) => new Set(e.map((e) => e.key)));
		return Array.from(o).filter(([e]) => s.every((t) => t.has(e))).map(([, e]) => e);
	}
	contextItems(e) {
		return e.contexts.flatMap((e) => this.searchTerms(e.content ?? "").map((t) => ({
			token: t,
			key: e.polygon.join(","),
			value: e
		})));
	}
	rect(e, t, n, r) {
		return {
			left: Math.min(e, n),
			top: Math.min(t, r),
			right: Math.max(e, n),
			bottom: Math.max(t, r)
		};
	}
	expandRect(e, t) {
		return {
			left: e.left - t,
			top: e.top - t,
			right: e.right + t,
			bottom: e.bottom + t
		};
	}
	center(e) {
		let t = [], n = [];
		for (let r = 0; r < e.length; r += 2) t.push(e[r]), n.push(e[r + 1]);
		return [(Math.min.apply(null, t) + Math.max.apply(null, t)) / 2, (Math.min.apply(null, n) + Math.max.apply(null, n)) / 2];
	}
	containsPoly(e, t) {
		for (let n = 0; n < t.length; n += 2) if (!p(e, t[n], t[n + 1])) return !1;
		return !0;
	}
	hitRect(e, t) {
		for (let n = 0; n < e.length; n += 2) if (this.inRect(e[n], e[n + 1], t)) return !0;
		if (p(e, t.left, t.top) || p(e, t.right, t.top) || p(e, t.right, t.bottom) || p(e, t.left, t.bottom)) return !0;
		for (let n = 0, r = e.length - 2; n < e.length; r = n, n += 2) if (this.hitRectEdge(e[r], e[r + 1], e[n], e[n + 1], t)) return !0;
		return !1;
	}
	inRect(e, t, n) {
		return e >= n.left && e <= n.right && t >= n.top && t <= n.bottom;
	}
	inRectPoly(e, t) {
		for (let n = 0; n < e.length; n += 2) if (!this.inRect(e[n], e[n + 1], t)) return !1;
		return !0;
	}
	hitRectEdge(e, t, n, r, i) {
		return this.hitLine(e, t, n, r, i.left, i.top, i.right, i.top) || this.hitLine(e, t, n, r, i.right, i.top, i.right, i.bottom) || this.hitLine(e, t, n, r, i.right, i.bottom, i.left, i.bottom) || this.hitLine(e, t, n, r, i.left, i.bottom, i.left, i.top);
	}
	hitLine(e, t, n, r, i, a, o, s) {
		let c = this.turn(e, t, n, r, i, a), l = this.turn(e, t, n, r, o, s), u = this.turn(i, a, o, s, e, t), d = this.turn(i, a, o, s, n, r);
		return c === 0 && m(i, a, e, t, n, r) || l === 0 && m(o, s, e, t, n, r) || u === 0 && m(e, t, i, a, o, s) || d === 0 && m(n, r, i, a, o, s) || c > 0 != l > 0 && u > 0 != d > 0;
	}
	turn(e, t, n, r, i, a) {
		return (n - e) * (a - t) - (r - t) * (i - e);
	}
	page(e) {
		return this.result().pages[e];
	}
	result() {
		if (!this.metadata) throw Error("AuroraLens: metadata is not loaded.");
		return this.metadata;
	}
};
//#endregion
//#region node_modules/@tabulariumai/aurora-lens/dist/core/viewer/coordinates.js
function A(e, t, n) {
	return e < t ? t : e > n ? n : e;
}
function mt(e, t, n, r, i, a) {
	if (n.width <= 0 || n.height <= 0) return null;
	let o = e >= n.left && e <= n.left + n.width, s = t >= n.top && t <= n.top + n.height;
	return a && (!o || !s) ? null : {
		x: Math.trunc(A((e - n.left) / n.width * r, 0, r - 1)),
		y: Math.trunc(A((t - n.top) / n.height * i, 0, i - 1))
	};
}
function ht(e, t, n, r) {
	if (n.width <= 0 || n.height <= 0) return null;
	let i = e >= n.left && e <= n.left + n.width, a = t >= n.top && t <= n.top + n.height;
	return r && (!i || !a) ? null : {
		x: Math.trunc(A(e - n.left, 0, n.width - 1)),
		y: Math.trunc(A(t - n.top, 0, n.height - 1))
	};
}
function gt(e, t, n, r) {
	let i = Math.trunc(A(e.x, 0, n - 1)), a = Math.trunc(A(e.y, 0, r - 1)), o = Math.trunc(A(t.x, 0, n - 1)), s = Math.trunc(A(t.y, 0, r - 1));
	return {
		x: Math.min(i, o),
		y: Math.min(a, s),
		width: Math.abs(o - i),
		height: Math.abs(s - a)
	};
}
//#endregion
//#region node_modules/@tabulariumai/aurora-lens/dist/core/viewer/watermark.js
var _t = "Powered by Tabularium AI", vt = {
	position: "absolute",
	left: "50%",
	bottom: "0.625rem",
	zIndex: "2",
	maxWidth: "calc(100% - 1.5rem)",
	padding: "0.125rem 0.375rem",
	borderRadius: "0.25rem",
	color: "rgba(31, 41, 55, 0.62)",
	background: "rgba(255, 255, 255, 0.58)",
	fontSize: "0.875rem",
	fontWeight: "700",
	lineHeight: "1.2",
	pointerEvents: "none",
	textAlign: "center",
	textShadow: "0 1px 1px rgba(255, 255, 255, 0.72)",
	transform: "translateX(-50%)",
	userSelect: "none",
	whiteSpace: "nowrap"
};
function yt() {
	let e = document.createElement("span");
	return e.textContent = _t, e.setAttribute("aria-hidden", "true"), Object.assign(e.style, vt), e;
}
//#endregion
//#region node_modules/@tabulariumai/aurora-lens/dist/core/viewer/PageViewer.js
var bt = 0, xt = class {
	options;
	root = document.createElement("div");
	frame = document.createElement("div");
	image = document.createElement("img");
	canvas = document.createElement("canvas");
	watermark = yt();
	itemLayer = document.createElement("div");
	instructions = document.createElement("p");
	id = `aurora-lens-selection-${++bt}`;
	items = [];
	active = 0;
	anchor = 0;
	page = null;
	zoom = 1;
	move = {
		x: 0,
		y: 0
	};
	currentPointer = null;
	pointerMoved = !1;
	lastPointer = {
		x: 0,
		y: 0
	};
	drawMode = !1;
	mode = null;
	startImage = null;
	startScreen = null;
	draftRect = null;
	rectangles = [];
	renderRequested = !1;
	renderFrame = null;
	onResize = () => {
		this.page && (this.frame.style.bottom = `${this.instructions.offsetHeight}px`, this.applyTransform());
	};
	constructor(e) {
		if (this.options = e, this.root.append(this.frame, this.instructions), this.frame.append(this.image, this.canvas, this.itemLayer, this.watermark), this.frame.dataset.lensSelection = "", this.frame.setAttribute("role", "listbox"), this.frame.setAttribute("aria-multiselectable", "true"), this.frame.setAttribute("aria-describedby", `${this.id}-help`), this.frame.tabIndex = -1, this.instructions.id = `${this.id}-help`, this.instructions.textContent = "Arrows: move · Space: select or deselect · Shift+Arrow: select range · Tab: leave", this.instructions.hidden = !0, !document.getElementById("aurora-lens-selection-style")) {
			let e = document.createElement("style");
			e.id = "aurora-lens-selection-style", e.textContent = "\n        [data-lens-selection]:focus-visible { outline: 2px solid #005168; outline-offset: -3px; }\n        [data-lens-selection]:focus-visible [data-active=\"true\"] { outline: 2px solid #005168; outline-offset: 2px; }\n      ", document.head.append(e);
		}
		this.style(), this.bind();
	}
	element() {
		return this.root;
	}
	getZoom() {
		return this.zoom;
	}
	getDrawMode() {
		return this.drawMode;
	}
	canZoomIn() {
		return !!this.page && this.zoom < 8;
	}
	canZoomOut() {
		return !!this.page && this.zoom > this.bestFitZoom();
	}
	show(e) {
		window.addEventListener("resize", this.onResize), this.page = e, this.currentPointer = null, this.clearRects(), this.image.src = e.url, this.image.alt = `${e.sourceName} page ${e.pageNumber}`, this.image.hidden = !1, this.canvas.hidden = !1, this.buildItems(), this.fitPage(), this.options.onCoordinates(null, null);
	}
	clear() {
		this.page = null, this.currentPointer = null, this.clearRects(), this.image.removeAttribute("src"), this.image.alt = "", this.image.hidden = !0, this.canvas.hidden = !0, this.buildItems(), this.options.selection.clear(), this.options.onCoordinates(null, null), this.options.onChange(), this.schedule();
	}
	close() {
		window.removeEventListener("resize", this.onResize), this.renderFrame !== null && cancelAnimationFrame(this.renderFrame), this.renderFrame = null, this.renderRequested = !1;
	}
	fitPage() {
		this.page && (this.zoom = this.bestFitZoom(), this.move = {
			x: 0,
			y: 0
		}, this.applyTransform());
	}
	fitWidth() {
		this.page && (this.zoom = Math.max(this.bestFitZoom(), Math.min(8, this.fitSize().width / this.page.width)), this.move = {
			x: 0,
			y: 0
		}, this.applyTransform());
	}
	fitHeight() {
		this.page && (this.zoom = Math.max(this.bestFitZoom(), Math.min(8, this.fitSize().height / this.page.height)), this.move = {
			x: 0,
			y: 0
		}, this.applyTransform());
	}
	actualSize() {
		this.page && (this.zoom = Math.max(this.bestFitZoom(), 1), this.move = {
			x: 0,
			y: 0
		}, this.applyTransform());
	}
	zoomIn() {
		this.changeZoom(1.2, this.zoomCenter());
	}
	zoomOut() {
		this.changeZoom(1 / 1.2, this.zoomCenter());
	}
	setDrawMode(e) {
		this.clearRects(), this.drawMode = e, this.syncCursor(), this.options.onChange(), this.schedule();
	}
	clearSelection() {
		this.options.selection.clear(), this.clearRects(), this.options.onChange(), this.schedule();
	}
	render() {
		this.schedule();
	}
	style() {
		Object.assign(this.root.style, {
			position: "absolute",
			inset: "0",
			minWidth: "0",
			minHeight: "0",
			overflow: "hidden"
		}), Object.assign(this.frame.style, {
			position: "absolute",
			inset: "0",
			overflow: "hidden",
			background: "#ffffff"
		}), Object.assign(this.image.style, {
			position: "absolute",
			display: "block",
			maxWidth: "none",
			objectFit: "contain",
			transformOrigin: "top left",
			userSelect: "none",
			transform: "none"
		}), this.image.draggable = !1, this.image.hidden = !0, Object.assign(this.itemLayer.style, {
			position: "absolute",
			pointerEvents: "none"
		}), Object.assign(this.instructions.style, {
			position: "absolute",
			bottom: "0",
			left: "0",
			right: "0",
			margin: "0",
			padding: "0.375rem 0.5rem",
			fontSize: "0.75rem",
			lineHeight: "1.4",
			color: "#1f2937",
			background: "#ffffff",
			borderTop: "1px solid #d6dce2"
		}), Object.assign(this.canvas.style, {
			position: "absolute",
			inset: "0",
			width: "100%",
			height: "100%",
			touchAction: "none"
		}), this.canvas.hidden = !0;
	}
	bind() {
		this.frame.addEventListener("keydown", (e) => this.onKeyDown(e)), this.frame.addEventListener("focus", () => {
			this.frame.matches(":focus-visible") && this.revealActive();
		}), this.frame.addEventListener("contextmenu", (e) => e.preventDefault()), this.frame.addEventListener("wheel", (e) => {
			this.page && (e.preventDefault(), this.currentPointer = {
				x: e.clientX,
				y: e.clientY
			}, this.changeZoom(e.deltaY < 0 ? 1.1 : 1 / 1.1, this.currentPointer), this.updateCoordinates(e.clientX, e.clientY));
		}, { passive: !1 }), this.canvas.addEventListener("pointerdown", (e) => this.onPointerDown(e)), this.canvas.addEventListener("pointermove", (e) => this.onPointerMove(e)), this.canvas.addEventListener("pointerup", (e) => this.onPointerUp(e)), this.canvas.addEventListener("pointercancel", () => this.cancelPointer()), this.canvas.addEventListener("dblclick", (e) => this.onDoubleClick(e)), this.canvas.addEventListener("pointerleave", () => {
			this.currentPointer = null;
		}), this.image.addEventListener("load", () => this.schedule()), window.addEventListener("resize", this.onResize);
	}
	fitSize() {
		let e = this.frame.getBoundingClientRect();
		return {
			width: Math.max(1, e.width),
			height: Math.max(1, e.height)
		};
	}
	bestFitZoom() {
		if (!this.page) return 1;
		let e = this.fitSize();
		return Math.min(8, Math.min(e.width / this.page.width, e.height / this.page.height));
	}
	applyTransform() {
		if (this.page) {
			let e = this.frame.getBoundingClientRect(), t = this.page.width * this.zoom, n = this.page.height * this.zoom;
			this.image.style.left = `${(e.width - t) / 2 + this.move.x}px`, this.image.style.top = `${(e.height - n) / 2 + this.move.y}px`, this.image.style.width = `${t}px`, this.image.style.height = `${n}px`;
		}
		this.image.style.transform = "none", Object.assign(this.itemLayer.style, {
			left: this.image.style.left,
			top: this.image.style.top,
			width: this.image.style.width,
			height: this.image.style.height
		}), this.syncCursor(), this.options.onChange(), this.schedule();
	}
	changeZoom(e, t) {
		if (!this.page) return;
		let n = this.zoom, r = Math.max(this.bestFitZoom(), Math.min(8, this.zoom * e));
		if (r !== n) {
			if (t) {
				let e = this.frame.getBoundingClientRect(), i = this.image.getBoundingClientRect(), a = (t.x - i.left) / n, o = (t.y - i.top) / n, s = this.page.width * r, c = this.page.height * r, l = (e.width - s) / 2, u = (e.height - c) / 2;
				this.move.x = t.x - e.left - l - a * r, this.move.y = t.y - e.top - u - o * r;
			}
			this.zoom = r, this.applyTransform();
		}
	}
	zoomCenter() {
		if (this.currentPointer) return this.currentPointer;
		let e = this.image.getBoundingClientRect();
		return {
			x: e.left + e.width / 2,
			y: e.top + e.height / 2
		};
	}
	canPan() {
		if (!this.page || this.image.hidden || this.zoom <= this.bestFitZoom()) return !1;
		let e = this.frame.getBoundingClientRect(), t = Number.parseFloat(this.image.style.width) || this.image.getBoundingClientRect().width, n = Number.parseFloat(this.image.style.height) || this.image.getBoundingClientRect().height;
		return t > e.width || n > e.height;
	}
	onPointerDown(e) {
		if (!this.page) return;
		let t = this.pageSize(this.page), n = this.screenPoint(e.clientX, e.clientY, !0);
		if (!n) {
			this.options.onCoordinates(null, null);
			return;
		}
		this.startImage = n, this.startScreen = {
			x: e.clientX,
			y: e.clientY
		}, this.currentPointer = {
			x: e.clientX,
			y: e.clientY
		}, this.pointerMoved = !1, this.lastPointer = {
			x: e.clientX,
			y: e.clientY
		}, this.drawMode ? (this.mode = "draw", this.draftRect = gt(n, n, t.width, t.height), this.schedule()) : this.canPan() ? (this.mode = "pan", this.canvas.style.cursor = "grabbing") : this.mode = "click", this.canvas.setPointerCapture(e.pointerId);
	}
	onPointerMove(e) {
		if (this.currentPointer = {
			x: e.clientX,
			y: e.clientY
		}, this.updateCoordinates(e.clientX, e.clientY), !this.mode || !this.startScreen || !this.startImage || !this.page) return;
		let t = Math.abs(e.clientX - this.startScreen.x), n = Math.abs(e.clientY - this.startScreen.y);
		if (this.pointerMoved = this.pointerMoved || t > 2 || n > 2, this.mode === "draw") {
			let t = this.pageSize(this.page), n = this.screenPoint(e.clientX, e.clientY, !1);
			this.draftRect = gt(this.startImage, n, t.width, t.height), this.schedule();
		} else this.mode === "pan" && (this.move.x += e.clientX - this.lastPointer.x, this.move.y += e.clientY - this.lastPointer.y, this.lastPointer = {
			x: e.clientX,
			y: e.clientY
		}, this.applyTransform());
	}
	onPointerUp(e) {
		let t = !this.pointerMoved;
		if (this.pointerMoved = !1, this.mode === "draw" && this.startImage && this.page) {
			let t = this.pageSize(this.page), n = this.screenPoint(e.clientX, e.clientY, !1), r = gt(this.startImage, n, t.width, t.height);
			if (r.width > 1 && r.height > 1 && this.hasMetadataPage()) {
				let t = this.options.metadata.getElements(this.page.pageIndex, r.x, r.y, r.x + r.width, r.y + r.height);
				(t.tokens.length || t.figures.length) && this.selectHits(t, e.ctrlKey), this.rectangles = [];
			} else this.updateCoordinates(e.clientX, e.clientY);
			this.draftRect = null, this.schedule();
		} else t && this.updateCoordinates(e.clientX, e.clientY);
		this.mode = null, this.startImage = null, this.startScreen = null, this.syncCursor(), this.options.onChange(), this.canvas.hasPointerCapture(e.pointerId) && this.canvas.releasePointerCapture(e.pointerId);
	}
	cancelPointer() {
		this.pointerMoved = !1, this.mode = null, this.startImage = null, this.startScreen = null, this.draftRect = null, this.currentPointer = null, this.syncCursor(), this.options.onChange(), this.schedule();
	}
	clearRects() {
		this.rectangles = [], this.draftRect = null;
	}
	screenPoint(e, t, n) {
		if (!this.page) return null;
		let r = this.pageSize(this.page);
		return mt(e, t, this.image.getBoundingClientRect(), r.width, r.height, n);
	}
	displayPoint(e, t, n) {
		return ht(e, t, this.image.getBoundingClientRect(), n);
	}
	schedule() {
		this.renderRequested || (this.renderRequested = !0, this.renderFrame = requestAnimationFrame(() => {
			this.renderFrame = null, this.renderRequested = !1, this.renderAnnotations();
		}));
	}
	renderAnnotations() {
		this.items.forEach(({ hits: e, element: t }, n) => {
			t.setAttribute("aria-selected", String(this.options.selection.isSelected(e))), t.dataset.active = String(n === this.active);
		});
		let e = this.canvas.getContext("2d");
		if (!e) return;
		let t = this.frame.getBoundingClientRect(), n = window.devicePixelRatio || 1, r = Math.max(1, Math.round(t.width)), i = Math.max(1, Math.round(t.height));
		if ((this.canvas.width !== Math.round(r * n) || this.canvas.height !== Math.round(i * n)) && (this.canvas.width = Math.round(r * n), this.canvas.height = Math.round(i * n)), e.setTransform(n, 0, 0, n, 0, 0), e.clearRect(0, 0, r, i), !this.page || this.image.hidden) return;
		let a = this.image.getBoundingClientRect(), o = this.rectangles.slice();
		this.draftRect && o.push(this.draftRect), e.fillStyle = "rgba(0, 151, 169, 0.12)", e.strokeStyle = "rgba(0, 81, 104, 0.72)", e.lineWidth = 1;
		let s = this.pageSize(this.page);
		o.forEach((n) => {
			if (n.width <= 0 || n.height <= 0 || !this.page) return;
			let r = a.left + n.x / s.width * a.width - t.left, i = a.top + n.y / s.height * a.height - t.top, o = n.width / s.width * a.width, c = n.height / s.height * a.height;
			e.fillRect(r, i, o, c), e.strokeRect(r, i, o, c);
		}), this.options.selection.draw(e, s, a, t);
	}
	buildItems() {
		this.active = 0, this.anchor = 0;
		let e = 0;
		this.items = this.hasMetadataPage() ? this.options.metadata.selectionItems(this.page.pageIndex).map((t, n) => {
			let r = document.createElement("div"), i = (t.tokens.length ? t.tokens[0] : t.figures[0]).polygon, a = i.filter((e, t) => t % 2 == 0), o = i.filter((e, t) => t % 2 == 1), s = Math.min(...a), c = Math.min(...o), l = this.pageSize(this.page);
			return r.id = `${this.id}-item-${n}`, r.setAttribute("role", "option"), t.tokens.length ? r.setAttribute("aria-label", t.tokens[0].token === null ? `Text ${n + 1}` : t.tokens[0].token) : r.setAttribute("aria-label", `Figure ${++e}`), r.setAttribute("aria-selected", String(this.options.selection.isSelected(t))), Object.assign(r.style, {
				position: "absolute",
				left: `${s / l.width * 100}%`,
				top: `${c / l.height * 100}%`,
				width: `${(Math.max(...a) - s) / l.width * 100}%`,
				height: `${(Math.max(...o) - c) / l.height * 100}%`
			}), {
				hits: t,
				element: r
			};
		}) : [], this.itemLayer.replaceChildren(...this.items.map((e) => e.element)), this.frame.setAttribute("aria-label", this.page ? `Document selection, page ${this.page.pageNumber}` : "Document selection"), this.frame.tabIndex = this.items.length ? 0 : -1, this.instructions.hidden = !this.items.length, this.frame.style.bottom = `${this.instructions.offsetHeight}px`, this.items.length ? this.frame.setAttribute("aria-activedescendant", this.items[0].element.id) : this.frame.removeAttribute("aria-activedescendant");
	}
	onKeyDown(e) {
		if (!(!this.items.length || e.altKey || e.ctrlKey || e.metaKey)) {
			if ([
				"ArrowRight",
				"ArrowDown",
				"ArrowLeft",
				"ArrowUp"
			].includes(e.key)) {
				e.preventDefault();
				let t = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
				this.active = A(this.active + t, 0, this.items.length - 1), e.shiftKey ? (this.options.selection.clear(), this.items.slice(Math.min(this.anchor, this.active), Math.max(this.anchor, this.active) + 1).forEach((e) => this.options.selection.showElements(e.hits))) : this.anchor = this.active, this.revealActive();
			} else if (e.key === " ") {
				if (e.preventDefault(), e.repeat) return;
				this.options.selection.toggle(this.items[this.active].hits), this.anchor = this.active;
			} else if (e.key === "Escape") {
				this.anchor = this.active;
				return;
			} else return;
			this.options.onChange(), this.schedule();
		}
	}
	revealActive() {
		if (!this.items.length) return;
		this.frame.setAttribute("aria-activedescendant", this.items[this.active].element.id);
		let e = this.items[this.active].element.getBoundingClientRect(), t = this.frame.getBoundingClientRect(), n = e.width > t.width - 8 || e.left < t.left + 4 ? t.left + 4 - e.left : e.right > t.right - 4 ? t.right - 4 - e.right : 0, r = e.height > t.height - 8 || e.top < t.top + 4 ? t.top + 4 - e.top : e.bottom > t.bottom - 4 ? t.bottom - 4 - e.bottom : 0;
		(n || r) && (this.move.x += n, this.move.y += r, this.applyTransform()), this.schedule();
	}
	updateCoordinates(e, t) {
		this.options.onCoordinates(this.screenPoint(e, t, !0), this.displayPoint(e, t, !0));
	}
	selectHits(e, t) {
		t ? this.options.selection.showElements(e) : this.options.selection.showElement(e);
		let n = this.items.findIndex((t) => e.tokens.some((e) => t.hits.tokens.some((t) => t.polygon === e.polygon)) || e.figures.some((e) => t.hits.figures.some((t) => t.polygon === e.polygon)));
		n !== -1 && (this.active = n, this.anchor = n, this.frame.setAttribute("aria-activedescendant", this.items[n].element.id));
	}
	onDoubleClick(e) {
		if (!this.page) return;
		let t = this.screenPoint(e.clientX, e.clientY, !0);
		if (this.clearRects(), t) {
			let n = e.ctrlKey ? this.options.selection.clearElement(t) : {
				type: "load",
				point: t
			};
			if (n.type === "load" && this.hasMetadataPage()) {
				let t = this.options.metadata.getElement(this.page.pageIndex, n.point.x, n.point.y);
				(t.tokens.length || t.figures.length) && this.selectHits(t, e.ctrlKey);
			}
			this.updateCoordinates(e.clientX, e.clientY);
		} else this.options.onCoordinates(null, null);
		this.options.onChange(), this.schedule();
	}
	pageSize(e) {
		return this.options.metadata.hasPage(e.pageIndex) ? this.options.metadata.pageSize(e.pageIndex) : e;
	}
	hasMetadataPage() {
		return !!(this.page && this.options.metadata.hasPage(this.page.pageIndex));
	}
	syncCursor() {
		this.canvas.style.cursor = this.drawMode ? "crosshair" : this.canPan() ? "grab" : "default";
	}
}, St = "rgb24", Ct = {
	pdfRasterDpi: 150,
	maxRasterPixels: 4e7,
	maxRasterWidth: 1e4,
	maxRasterHeight: 1e4
}, wt = {
	pdfRasterDpi: 300,
	maxRasterPixels: 16e7,
	maxRasterWidth: 2e4,
	maxRasterHeight: 2e4,
	tiff: {
		compression: 5,
		pixelFormat: St
	}
};
function j() {
	return {
		view: { ...Ct },
		export: {
			...wt,
			tiff: { ...wt.tiff }
		}
	};
}
//#endregion
//#region node_modules/@tabulariumai/aurora-lens/dist/core/session/viewerSessionStore.js
var Tt = "aurora-lens-web", M = "viewer-documents", N = "viewer-pages", P = "viewer-page-blobs", F = "viewer-page-metadata", I = "viewer-config", L = "active", R = "viewer-config", Et = class {
	async resetDocument(e) {
		let t = V(e.pages), n = t[e.currentPageIndex], r = await this.open();
		try {
			let i = r.transaction(Rt, "readwrite");
			return Rt.forEach((e) => {
				i.objectStore(e).clear();
			}), await H(i.objectStore(M).put({
				id: L,
				sessionId: e.sessionId,
				fileName: e.fileName,
				fileType: e.fileType,
				fileBlob: e.fileBlob,
				currentPageId: n.pageId,
				updatedAt: e.updatedAt
			})), t.forEach((e) => {
				i.objectStore(N).put(e);
			}), await U(i), t;
		} finally {
			r.close();
		}
	}
	async insertPages(e, t, n, r) {
		let i = V(t), a = n.map(jt), o = await this.open();
		try {
			let t = o.transaction([
				M,
				N,
				P
			], "readwrite"), n = B(await H(t.objectStore(M).get(L))), s = t.objectStore(N), c = V(await H(s.getAll()));
			if (e < 0 || e > c.length || i.some((e) => e.documentId !== n.id)) throw G();
			let l = Ot(c, e, i, r);
			return l.forEach((e) => {
				s.put(e);
			}), a.forEach((e) => {
				t.objectStore(P).put(e);
			}), await H(t.objectStore(M).put({
				...n,
				updatedAt: r
			})), await U(t), l;
		} finally {
			o.close();
		}
	}
	async removePages(e, t) {
		let n = await this.open();
		try {
			let r = n.transaction([
				M,
				N,
				P,
				F
			], "readwrite"), i = B(await H(r.objectStore(M).get(L))), a = r.objectStore(N), o = V(await H(a.getAll())), s = new Set(e), c = kt(o, s, t);
			if (!c.some((e) => e.pageId === i.currentPageId)) throw G();
			return s.forEach((e) => {
				a.delete(e), r.objectStore(P).delete(e), r.objectStore(F).delete(e);
			}), c.forEach((e) => {
				a.put(e);
			}), await H(r.objectStore(M).put({
				...i,
				updatedAt: t
			})), await U(r), c;
		} finally {
			n.close();
		}
	}
	async saveCurrentPage(e, t) {
		let n = await this.open();
		try {
			let r = n.transaction(M, "readwrite"), i = B(await H(r.objectStore(M).get(L)));
			await H(r.objectStore(M).put({
				...i,
				currentPageId: e,
				updatedAt: t
			})), await U(r);
		} finally {
			n.close();
		}
	}
	async readViewerConfig() {
		let e = await this.open();
		try {
			let t = e.transaction(I, "readonly"), n = await H(t.objectStore(I).get(R));
			return await U(t), n === void 0 ? j() : Nt(n);
		} finally {
			e.close();
		}
	}
	async savePageBlob(e) {
		let t = await this.open();
		try {
			let n = t.transaction(P, "readwrite");
			await H(n.objectStore(P).put(e)), await U(n);
		} finally {
			t.close();
		}
	}
	async savePageMetadata(e) {
		let t = await this.open();
		try {
			let n = t.transaction(F, "readwrite");
			await H(n.objectStore(F).put(e)), await U(n);
		} finally {
			t.close();
		}
	}
	async saveViewerConfig(e) {
		let t = Nt({
			id: R,
			view: e.view,
			export: e.export
		}), n = await this.open();
		try {
			let e = n.transaction(I, "readwrite");
			return await H(e.objectStore(I).put({
				id: R,
				...t
			})), await U(e), t;
		} finally {
			n.close();
		}
	}
	async reorderPages(e, t, n) {
		let r = await this.open();
		try {
			let i = r.transaction(N, "readwrite"), a = i.objectStore(N), o = V(await H(a.getAll()));
			if (e < 0 || e >= o.length || t < 0 || t >= o.length) throw G();
			let s = Dt(o, e, t, n);
			return s.forEach((e) => {
				a.put(e);
			}), await U(i), s;
		} finally {
			r.close();
		}
	}
	async read() {
		let e = await this.open();
		try {
			let t = e.transaction([M, N], "readonly"), n = await H(t.objectStore(M).get(L));
			if (n === void 0) return await U(t), null;
			let r = B(n), i = V(await H(t.objectStore(N).getAll())), a = i.find((e) => e.pageId === r.currentPageId);
			if (!a) throw G();
			return await U(t), {
				document: r,
				pages: i,
				currentPage: a
			};
		} finally {
			e.close();
		}
	}
	async readPageBlobRecord(e) {
		let t = await this.open();
		try {
			let n = t.transaction(P, "readonly"), r = await H(n.objectStore(P).get(e));
			return await U(n), r === void 0 ? null : jt(r);
		} finally {
			t.close();
		}
	}
	async readPageMetadata(e) {
		let t = await this.open();
		try {
			let n = t.transaction(F, "readonly"), r = await H(n.objectStore(F).get(e));
			return await U(n), r === void 0 ? null : Mt(r).metadata;
		} finally {
			t.close();
		}
	}
	async readPageMetadataIds() {
		let e = await this.open();
		try {
			let t = e.transaction(F, "readonly"), n = await H(t.objectStore(F).getAll());
			return await U(t), new Set(n.map((e) => Mt(e).pageId));
		} finally {
			e.close();
		}
	}
	async delete() {
		let e = await this.open();
		try {
			let t = e.transaction(Rt, "readwrite");
			Rt.forEach((e) => {
				t.objectStore(e).clear();
			}), await U(t);
		} finally {
			e.close();
		}
	}
	open() {
		return new Promise((e, t) => {
			let n = indexedDB.open(Tt, 4);
			n.onupgradeneeded = () => {
				let e = n.result;
				z(e, M, "id"), z(e, N, "pageId"), z(e, P, "pageId"), z(e, F, "pageId"), z(e, I, "id");
			}, n.onsuccess = () => e(n.result), n.onerror = () => t(n.error ?? /* @__PURE__ */ Error("Could not open viewer session database.")), n.onblocked = () => t(/* @__PURE__ */ Error("Viewer session database upgrade was blocked."));
		});
	}
};
function z(e, t, n) {
	e.objectStoreNames.contains(t) || e.createObjectStore(t, { keyPath: n });
}
function Dt(e, t, n, r) {
	let i = [...e], [a] = i.splice(t, 1);
	return i.splice(n, 0, a), i.map((e, t) => ({
		...e,
		sequenceNumber: t + 1,
		updatedAt: r
	}));
}
function Ot(e, t, n, r) {
	let i = [...e];
	return i.splice(t, 0, ...n), i.map((e, t) => ({
		...e,
		sequenceNumber: t + 1,
		updatedAt: r
	}));
}
function kt(e, t, n) {
	let r = e.filter((e) => !t.has(e.pageId));
	if (!r.length || r.length === e.length) throw G();
	return r.map((e, t) => ({
		...e,
		sequenceNumber: t + 1,
		updatedAt: n
	}));
}
function B(e) {
	if (!W(e)) throw G();
	let t = e.sessionId, n = e.fileName, r = e.fileType, i = e.fileBlob, a = e.currentPageId, o = e.updatedAt;
	if (t !== void 0 && (typeof t != "string" || t.trim() === "") || e.id !== "active" || typeof n != "string" || n.trim() === "" || typeof r != "string" || !(i instanceof Blob) || typeof a != "string" || a.trim() === "" || typeof o != "number" || !Number.isFinite(o) || o <= 0) throw G();
	return {
		id: L,
		sessionId: t,
		fileName: n,
		fileType: r,
		fileBlob: i,
		currentPageId: a,
		updatedAt: o
	};
}
function V(e) {
	if (!Array.isArray(e) || !e.length) throw G();
	return e.map(At).sort((e, t) => e.sequenceNumber - t.sequenceNumber);
}
function At(e) {
	if (!W(e)) throw G();
	let t = e.pageId, n = e.sequenceNumber, r = e.sourcePageIndex, i = e.updatedAt;
	if (typeof t != "string" || t.trim() === "" || e.documentId !== "active" || typeof n != "number" || !Number.isInteger(n) || n < 1 || typeof r != "number" || !Number.isInteger(r) || r < 0 || typeof i != "number" || !Number.isFinite(i) || i <= 0) throw G();
	return {
		pageId: t,
		documentId: L,
		sequenceNumber: n,
		sourcePageIndex: r,
		updatedAt: i
	};
}
function jt(e) {
	let t = W(e) ? e.updatedAt : null, n = W(e) ? e.sourceType : null, r = W(e) ? e.width : null, i = W(e) ? e.height : null, a = W(e) ? e.xResolution : null, o = W(e) ? e.yResolution : null, s = W(e) ? e.documentType : null, c = W(e) ? e.physicalWidth : null, l = W(e) ? e.physicalHeight : null;
	if (!W(e) || typeof e.pageId != "string" || e.pageId.trim() === "" || !(e.blob instanceof Blob) || !Lt(n) || typeof r != "number" || !Number.isFinite(r) || r <= 0 || typeof i != "number" || !Number.isFinite(i) || i <= 0 || typeof a != "number" || !Number.isFinite(a) || a <= 0 || typeof o != "number" || !Number.isFinite(o) || o <= 0 || typeof s != "string" || s.trim() === "" || typeof c != "number" || !Number.isFinite(c) || c <= 0 || typeof l != "number" || !Number.isFinite(l) || l <= 0 || typeof t != "number" || !Number.isFinite(t) || t <= 0) throw G();
	return {
		pageId: e.pageId,
		blob: e.blob,
		sourceType: n,
		width: r,
		height: i,
		xResolution: a,
		yResolution: o,
		documentType: s,
		physicalWidth: c,
		physicalHeight: l,
		updatedAt: t
	};
}
function Mt(e) {
	let t = W(e) ? e.updatedAt : null;
	if (!W(e) || typeof e.pageId != "string" || e.pageId.trim() === "" || !Object.prototype.hasOwnProperty.call(e, "metadata") || typeof t != "number" || !Number.isFinite(t) || t <= 0) throw G();
	return {
		pageId: e.pageId,
		metadata: e.metadata,
		updatedAt: t
	};
}
function Nt(e) {
	if (!W(e)) throw G();
	let t = e.view, n = e.export;
	if (e.id !== R || !W(t) || !W(n)) throw G();
	return {
		view: Pt(t),
		export: Ft(n)
	};
}
function Pt(e) {
	if (!W(e)) throw G();
	let t = e.pdfRasterDpi, n = e.maxRasterPixels, r = e.maxRasterWidth, i = e.maxRasterHeight;
	if (typeof t != "number" || !Number.isFinite(t) || t <= 0 || typeof n != "number" || !Number.isFinite(n) || n <= 0 || typeof r != "number" || !Number.isFinite(r) || r <= 0 || typeof i != "number" || !Number.isFinite(i) || i <= 0) throw G();
	return {
		pdfRasterDpi: t,
		maxRasterPixels: n,
		maxRasterWidth: r,
		maxRasterHeight: i
	};
}
function Ft(e) {
	let t = Pt(e);
	if (!W(e)) throw G();
	let n = e.tiff;
	if (!W(n)) throw G();
	let r = n.compression, i = n.pixelFormat;
	if (typeof r != "number" || !Number.isInteger(r) || r < 0 || !It(i)) throw G();
	return {
		...t,
		tiff: {
			compression: r,
			pixelFormat: i
		}
	};
}
function It(e) {
	return e === "bw1" || e === "gray8" || e === "rgb24";
}
function H(e) {
	return new Promise((t, n) => {
		e.onsuccess = () => t(e.result), e.onerror = () => n(e.error ?? /* @__PURE__ */ Error("Viewer session database request failed."));
	});
}
function U(e) {
	return new Promise((t, n) => {
		e.oncomplete = () => t(), e.onabort = () => n(e.error ?? /* @__PURE__ */ Error("Viewer session database transaction was aborted.")), e.onerror = () => n(e.error ?? /* @__PURE__ */ Error("Viewer session database transaction failed."));
	});
}
function W(e) {
	return typeof e == "object" && !!e;
}
function Lt(e) {
	return e === "tiff" || e === "pdf" || e === "png" || e === "jpeg";
}
function G() {
	return /* @__PURE__ */ Error("Stored viewer session is invalid.");
}
var Rt = [
	M,
	N,
	P,
	F
], K = "tiff", zt = "jpeg", Bt = {
	"application/pdf": "pdf",
	"image/jpeg": zt,
	"image/png": "png",
	"image/tiff": K
};
function Vt(e, t) {
	if (Ht(e)) return K;
	if (Ut(e)) return "pdf";
	if (Wt(e)) return "png";
	if (Gt(e)) return zt;
	let n = Bt[t.type.toLowerCase()];
	if (n) return n;
	let r = t.name.toLowerCase();
	if (/\.tiff?$/.test(r)) return K;
	if (/\.pdf$/.test(r)) return "pdf";
	if (/\.png$/.test(r)) return "png";
	if (/\.jpe?g$/.test(r)) return zt;
	throw new o(i, "Unsupported document format.");
}
function Ht(e) {
	return e.length >= 4 && (e[0] === 73 && e[1] === 73 && e[2] === 42 && e[3] === 0 || e[0] === 77 && e[1] === 77 && e[2] === 0 && e[3] === 42);
}
function Ut(e) {
	return e.length >= 5 && e[0] === 37 && e[1] === 80 && e[2] === 68 && e[3] === 70 && e[4] === 45;
}
function Wt(e) {
	return e.length >= 8 && e[0] === 137 && e[1] === 80 && e[2] === 78 && e[3] === 71 && e[4] === 13 && e[5] === 10 && e[6] === 26 && e[7] === 10;
}
function Gt(e) {
	return e.length >= 3 && e[0] === 255 && e[1] === 216 && e[2] === 255;
}
//#endregion
//#region node_modules/@tabulariumai/aurora-lens/dist/core/decoder/DocumentDecoder.js
var Kt = class {
	workers = /* @__PURE__ */ new Map();
	pending = /* @__PURE__ */ new Map();
	nextId = 1;
	generation = 0;
	tiff = null;
	async decodeDoc(e, t, n = j().view, r) {
		await this.decodeDocs([e], t, n, r);
	}
	async decodeDocs(e, t, n = j().view, r) {
		let i = this.generation, a = await Promise.all(e.map(async (e) => {
			let t = await e.arrayBuffer(), n = Vt(new Uint8Array(t), e);
			return {
				buffer: t,
				sourceName: e.name,
				sourceType: n
			};
		}));
		if (i !== this.generation) throw new DOMException("Document decoder closed.", "AbortError");
		if (r && a.length === 1 && a[0].sourceType === "tiff") {
			let o = await this.openTiff(e[0], n, a[0]);
			if (await t.pageCount(o.count, K), i !== this.generation) throw new DOMException("Document decoder closed.", "AbortError");
			await this.decodePage(e[0], r(), t, n);
			return;
		}
		let o = [], s = 0;
		for (let e of a) {
			let t = await this.countPages(e.sourceType, [e], n);
			o.push(t), s += t;
		}
		await t.pageCount(s, a.length === 1 ? a[0].sourceType : void 0);
		let c = 0;
		for (let e = 0; e < a.length; e += 1) {
			if (i !== this.generation) throw new DOMException("Document decoder closed.", "AbortError");
			let r = a[e];
			await this.decodeType(r.sourceType, [r], c, t, n), c += o[e];
		}
	}
	close() {
		this.generation += 1, this.tiff = null, this.rejectAll(new DOMException("Document decoder closed.", "AbortError")), this.workers.forEach((e) => e.terminate()), this.workers.clear();
	}
	async decodePage(e, t, n, r) {
		let i = this.generation, a = await this.openTiff(e, r);
		if (i !== this.generation) throw new DOMException("Document decoder closed.", "AbortError");
		let o = this.nextId++, s = this.worker(K);
		await new Promise((e, i) => {
			this.pending.set(o, {
				queue: Promise.resolve(),
				resolve: e,
				reject: i,
				sink: n,
				worker: s,
				acknowledge: !1
			}), s.postMessage({
				id: o,
				operation: "page",
				documentId: a.id,
				pageIndex: t,
				raster: r
			});
		});
	}
	openTiff(e, t, n) {
		if (this.tiff?.file === e) return this.tiff.ready;
		let r = this.generation, i = this.tiff, a = (async () => {
			if (i) {
				let e = await i.ready;
				this.workers.get(K)?.postMessage({
					operation: "release",
					documentId: e.id
				});
			}
			let a = n ?? {
				buffer: await e.arrayBuffer(),
				sourceName: e.name,
				sourceType: "tiff"
			};
			if (r !== this.generation) throw new DOMException("Document decoder closed.", "AbortError");
			let o = this.nextId, s = 0;
			return await this.send(K, "open", [a], t, {
				pageCount(e) {
					s = e;
				},
				pageReady() {}
			}), {
				id: o,
				count: s
			};
		})();
		return this.tiff = {
			file: e,
			ready: a
		}, a;
	}
	async countPages(e, t, n) {
		let r = 0;
		return await this.send(e, "count", t, n, {
			pageCount(e) {
				r = e;
			},
			pageReady() {}
		}), r;
	}
	decodeType(e, t, n, r, i) {
		return this.send(e, "decode", t, i, {
			pageCount: () => void 0,
			pageReady: (e, t) => r.pageReady(e, n + t)
		});
	}
	send(e, t, n, r, i) {
		let a = this.nextId;
		this.nextId += 1;
		let o = this.worker(e);
		return new Promise((s, c) => {
			this.pending.set(a, {
				queue: Promise.resolve(),
				resolve: s,
				reject: c,
				sink: i,
				worker: o,
				acknowledge: e === "tiff" && t === "decode"
			});
			let l = {
				id: a,
				operation: t,
				raster: r,
				files: n
			};
			t === "count" ? o.postMessage(l) : o.postMessage(l, n.map((e) => e.buffer));
		});
	}
	worker(e) {
		let t = this.workers.get(e);
		if (t) return t;
		let n;
		switch (e) {
			case K:
				n = new Worker(new URL(
					/* @vite-ignore */
					"/assets/tiffWorker-9YUmZNiW.js",
					"" + import.meta.url
				), { type: "module" });
				break;
			case "pdf":
				n = new Worker(new URL(
					/* @vite-ignore */
					"/assets/pdfWorker-rElFhHPr.js",
					"" + import.meta.url
				), { type: "module" });
				break;
			case "png":
			case zt:
				n = new Worker(new URL(
					/* @vite-ignore */
					"/assets/rasterWorker-UIOyg7gB.js",
					"" + import.meta.url
				), { type: "module" });
				break;
			default: throw new o(a, "Document decoder received an unknown format.");
		}
		return n.onmessage = (e) => this.receive(e.data), n.onerror = (e) => this.failWorker(e), n.onmessageerror = () => this.failWorker(new o(a, "Document decoder worker returned an unreadable response.")), this.workers.set(e, n), n;
	}
	receive(e) {
		let t = this.pending.get(e.id);
		t && (t.queue = t.queue.then(async () => {
			if (this.pending.get(e.id) === t) {
				if (e.kind === "error") {
					this.pending.delete(e.id), t.reject(new o(e.errorCode, e.error));
					return;
				}
				if (e.kind === "pageCount") {
					await t.sink.pageCount(e.pageCount);
					return;
				}
				if (e.kind === "pageReady") {
					await t.sink.pageReady(e.page, e.importIndex), t.acknowledge && this.pending.get(e.id) === t && t.worker.postMessage({
						id: e.id,
						operation: "continue"
					});
					return;
				}
				this.pending.delete(e.id), t.resolve();
			}
		}).catch((n) => {
			t.acknowledge && t.worker.postMessage({
				id: e.id,
				operation: "cancel"
			}), this.pending.delete(e.id), t.reject(n instanceof Error ? n : new o(a, String(n)));
		}));
	}
	failWorker(e) {
		this.rejectAll(e), this.close();
	}
	rejectAll(e) {
		for (let t of this.pending.values()) t.reject(e);
		this.pending.clear();
	}
}, q = {
	context: {
		fill: "rgba(255, 230, 128, 0.25)",
		stroke: "rgba(183, 121, 31, 0.72)"
	},
	figure: {
		fill: "rgba(0, 0, 128, 0.12)",
		stroke: "navy"
	},
	intelligence: {
		fill: "rgba(124, 58, 237, 0.12)",
		stroke: "#7c3aed"
	},
	token: {
		high: {
			fill: "rgba(0, 81, 104, 0.12)",
			stroke: "rgba(0, 81, 104, 0.06)"
		},
		medium: {
			fill: "rgba(183, 121, 31, 0.16)",
			stroke: "rgba(183, 121, 31, 0.06)"
		},
		low: {
			fill: "rgba(180, 35, 24, 0.12)",
			stroke: "rgba(180, 35, 24, 0.06)"
		}
	},
	confidence: {
		high: 95,
		medium: 80
	}
};
function qt(e) {
	return {
		context: J(q.context, e?.context),
		figure: J(q.figure, e?.figure),
		intelligence: J(q.intelligence, e?.intelligence),
		token: {
			high: J(q.token.high, e?.token?.high),
			medium: J(q.token.medium, e?.token?.medium),
			low: J(q.token.low, e?.token?.low)
		},
		confidence: {
			high: e?.confidence?.high ?? q.confidence.high,
			medium: e?.confidence?.medium ?? q.confidence.medium
		}
	};
}
function Jt(e, t) {
	let n = Number.parseInt(e, 10);
	return n >= t.confidence.high ? t.token.high : n >= t.confidence.medium ? t.token.medium : t.token.low;
}
function J(e, t) {
	return {
		fill: t?.fill ?? e.fill,
		stroke: t?.stroke ?? e.stroke
	};
}
//#endregion
//#region node_modules/@tabulariumai/aurora-lens/dist/core/selection/PolygonElement.js
var Yt = class {
	polygon;
	fill;
	mode;
	padRem;
	stroke;
	strokeWidth;
	constructor(e, t, n, r, i, a = 2) {
		this.polygon = e, this.fill = t, this.mode = n, this.padRem = r, this.stroke = i, this.strokeWidth = a;
	}
	draw(e, t, n, r) {
		e.save(), e.beginPath();
		let i = this.addPath(e, t, n, r);
		this.fill && (e.fillStyle = this.fill, e.globalCompositeOperation = this.mode, e.fill()), this.stroke && (e.globalCompositeOperation = "source-over", e.strokeStyle = this.stroke, e.lineWidth = this.strokeWidth, e.stroke()), this.drawLabel(e, i), e.restore();
	}
	addPath(e, t, n, r) {
		let i = this.expand(this.points(t, n, r));
		return e.moveTo(i[0].x, i[0].y), i.slice(1).forEach((t) => e.lineTo(t.x, t.y)), e.closePath(), i;
	}
	drawLabel(e, t) {}
	points(e, t, n) {
		let r = [];
		for (let i = 0; i < this.polygon.length; i += 2) r.push({
			x: t.left + this.polygon[i] / e.width * t.width - n.left,
			y: t.top + this.polygon[i + 1] / e.height * t.height - n.top
		});
		return r;
	}
	expand(e) {
		let t = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize), n = {
			left: this.padRem.left * t,
			top: this.padRem.top * t,
			right: this.padRem.right * t,
			bottom: this.padRem.bottom * t
		}, r = e.map((e) => e.x), i = e.map((e) => e.y), a = Math.min.apply(null, r), o = Math.min.apply(null, i), s = Math.max.apply(null, r), c = Math.max.apply(null, i);
		return [
			{
				x: a - n.left,
				y: o - n.top
			},
			{
				x: s + n.right,
				y: o - n.top
			},
			{
				x: s + n.right,
				y: c + n.bottom
			},
			{
				x: a - n.left,
				y: c + n.bottom
			}
		];
	}
}, Xt = class extends Yt {
	constructor(e, t) {
		super(e.polygon, t.context.fill, "multiply", {
			left: .35,
			top: .35,
			right: .35,
			bottom: .35
		}, t.context.stroke);
	}
}, Zt = class extends Yt {
	constructor(e, t) {
		super(e.polygon, t.figure.fill, "source-over", {
			left: .35,
			top: .35,
			right: .35,
			bottom: .35
		}, t.figure.stroke);
	}
}, Qt = class extends Yt {
	constructor(e, t) {
		let n = Jt(e.confidence, t);
		super(e.polygon, n.fill, "source-over", {
			left: .35,
			top: .35,
			right: .35,
			bottom: .35
		}, n.stroke, .5);
	}
}, $t = class {
	theme;
	selectedTokens = /* @__PURE__ */ new Map();
	selectedFigures = /* @__PURE__ */ new Map();
	selectedContexts = /* @__PURE__ */ new Map();
	constructor(e) {
		this.theme = e;
	}
	hasTokens() {
		return this.selectedTokens.size > 0;
	}
	tokens() {
		return Array.from(this.selectedTokens.values()).map((e) => e.token);
	}
	counts() {
		return {
			tokens: this.selectedTokens.size,
			figures: this.selectedFigures.size,
			context: this.selectedContexts.size
		};
	}
	clearElement(e) {
		return this.removeAt(e) ? { type: "handled" } : {
			type: "load",
			point: e
		};
	}
	showElement(e) {
		this.clear(), this.addHits(e);
	}
	showElements(e) {
		this.addHits(e);
	}
	isSelected(e) {
		return e.tokens.every((e) => this.selectedTokens.has(this.tokenKey(e))) && e.figures.every((e) => this.selectedFigures.has(this.figureKey(e)));
	}
	toggle(e) {
		this.isSelected(e) ? (e.tokens.forEach((e) => this.removeHit(this.selectedTokens.get(this.tokenKey(e)))), e.figures.forEach((e) => this.selectedFigures.delete(this.figureKey(e)))) : this.addHits(e);
	}
	clear() {
		this.selectedTokens = /* @__PURE__ */ new Map(), this.selectedFigures = /* @__PURE__ */ new Map(), this.selectedContexts = /* @__PURE__ */ new Map();
	}
	draw(e, t, n, r) {
		let i = Array.from(this.selectedContexts.values()).map((e) => e.element);
		i.length && (e.save(), e.beginPath(), i.forEach((i) => i.addPath(e, t, n, r)), this.theme.context.fill && (e.fillStyle = this.theme.context.fill, e.globalCompositeOperation = "multiply", e.fill()), this.theme.context.stroke && (e.globalCompositeOperation = "source-over", e.strokeStyle = this.theme.context.stroke, e.lineWidth = 2, e.stroke()), e.restore()), this.selectedFigures.forEach((i) => i.element.draw(e, t, n, r)), this.selectedTokens.forEach((i) => new Qt(i.token, this.theme).draw(e, t, n, r));
	}
	addHits(e) {
		e.tokens.forEach((t) => {
			this.addToken(t, e.contexts);
		}), e.tokens.length || e.contexts.forEach((e) => {
			this.addContext(this.polygonKey("c", e.polygon), new Xt(e, this.theme));
		}), e.figures.forEach((e) => {
			this.addFigure(e);
		});
	}
	addToken(e, t) {
		let n = this.tokenKey(e);
		if (this.selectedTokens.has(n)) return;
		let r = {
			key: n,
			token: e,
			contextKeys: []
		};
		t.forEach((e) => {
			r.contextKeys.push(this.addContext(this.polygonKey("c", e.polygon), new Xt(e, this.theme)));
		}), this.selectedTokens.set(n, r);
	}
	addFigure(e) {
		let t = this.figureKey(e);
		this.selectedFigures.has(t) || this.selectedFigures.set(t, {
			figure: e,
			element: new Zt(e, this.theme)
		});
	}
	addContext(e, t) {
		let n = this.selectedContexts.get(e);
		return n ? n.count += 1 : this.selectedContexts.set(e, {
			element: t,
			count: 1
		}), e;
	}
	removeHit(e) {
		e.contextKeys.forEach((e) => {
			let t = this.selectedContexts.get(e);
			--t.count, t.count === 0 && this.selectedContexts.delete(e);
		}), this.selectedTokens.delete(e.key);
	}
	removeAt(e) {
		for (let t of this.selectedTokens.values()) if (p(t.token.polygon, e.x, e.y)) return this.removeHit(t), !0;
		for (let [t, n] of this.selectedFigures) if (p(n.figure.polygon, e.x, e.y)) return this.selectedFigures.delete(t), !0;
		return !1;
	}
	tokenKey(e) {
		return `${e.token}\n${e.polygon.join(",")}`;
	}
	figureKey(e) {
		return this.polygonKey("f", e.polygon);
	}
	polygonKey(e, t) {
		return `${e}\n${t.join(",")}`;
	}
}, en = { style: "aurora-lens-thumbnail-style" }, Y = {
	action: "thumbnailAction",
	card: "auroraThumbnailCard",
	dragState: "dragState",
	dropTarget: "dropTarget",
	dragHandle: "thumbnailDragHandle",
	itemId: "itemId",
	media: "thumbnailMedia",
	pageIndex: "pageIndex",
	pageSelect: "pageSelect",
	titlePrimary: "titlePrimary",
	titleSecondary: "titleSecondary"
}, X = {
	addAfter: "Add after",
	addBefore: "Add before",
	confirmRemove: "Confirm remove",
	addedLoading: "Added page thumbnail loading",
	addedPage: "Added page",
	loading: "Loading",
	remove: "Remove",
	move: "Move page",
	intelligenceReady: (e) => `Page ${e} has intelligence metadata`,
	page: (e) => `Page ${e}`,
	thumbLoading: (e, t) => `${e} page ${t} thumbnail loading`
}, tn = {
	add: "Add page complete",
	drop: "Add pages complete",
	remove: "Remove page complete",
	reorder: "Reorder page complete"
}, Z = {
	activeShadow: "0 4px 12px rgba(17, 24, 39, 0.16)",
	cardMaxWidth: "21.5625rem",
	confirmMs: 3e3,
	dragShadow: "0 8px 20px rgba(17, 24, 39, 0.22)",
	imageMaxHeight: "27.34375rem",
	probeWidth: "27.34375rem",
	rangeBuffer: 6,
	rangeLimit: 20,
	scrollEdge: 64,
	scrollMax: 24
}, Q = {
	activeBorder: "#005168",
	buttonBorder: "#b7c5cf",
	cardBackground: "#ffffff",
	cardBorder: "#d6dce2",
	placeholderEdge: "#dce5eb",
	removeText: "#b42318",
	tealOverlay: "rgba(0, 81, 104, 0.12)",
	text: "#1f2937",
	title: "#005168"
}, nn = {
	add: "+",
	remove: "×"
}, $ = {
	root: {
		position: "absolute",
		inset: "0",
		width: "100%",
		height: "100%",
		minWidth: "0",
		minHeight: "0",
		margin: "0",
		border: "0",
		borderRadius: "0.5rem",
		boxShadow: "none",
		background: "transparent",
		overflow: "hidden",
		boxSizing: "border-box"
	},
	grid: {
		display: "grid",
		position: "absolute",
		inset: "0",
		gridTemplateColumns: "repeat(auto-fill, minmax(13.75rem, 21.5625rem))",
		gridTemplateRows: "none",
		gridAutoRows: "max-content",
		gap: "0.75rem",
		justifyContent: "center",
		alignContent: "start",
		alignItems: "start",
		width: "100%",
		height: "100%",
		minWidth: "0",
		minHeight: "0",
		padding: "0.875rem",
		overflow: "auto",
		overflowAnchor: "none",
		boxSizing: "border-box"
	},
	hidden: {
		position: "absolute",
		width: "1px",
		height: "1px",
		margin: "-1px",
		padding: "0",
		overflow: "hidden",
		clip: "rect(0 0 0 0)",
		whiteSpace: "nowrap",
		border: "0"
	},
	card: {
		display: "grid",
		position: "relative",
		gap: "0.5rem",
		alignContent: "start",
		minWidth: "0",
		width: "100%",
		maxWidth: Z.cardMaxWidth,
		height: "auto",
		borderRadius: "0.375rem",
		padding: "0.5rem",
		color: Q.text,
		background: Q.cardBackground,
		boxShadow: "none",
		textAlign: "left",
		transform: "translateY(0)",
		transition: "transform 140ms ease-out, box-shadow 140ms ease-out",
		boxSizing: "border-box"
	},
	media: {
		display: "grid",
		position: "relative",
		width: "100%",
		maxHeight: Z.imageMaxHeight,
		padding: "0",
		border: "0",
		background: Q.cardBackground,
		boxShadow: "none",
		boxSizing: "border-box",
		overflow: "hidden"
	},
	image: {
		display: "block",
		width: "100%",
		height: "100%",
		objectFit: "contain",
		border: "0",
		boxSizing: "border-box"
	},
	placeholder: {
		background: "radial-gradient(circle at 50% 35%, #ffffff 0%, #ffffff 54%, #f5f8fa 100%)",
		boxShadow: `inset 0 0 0 1px ${Q.placeholderEdge}, inset 0 0 2.75rem rgba(0, 81, 104, 0.055)`
	},
	title: {
		display: "flex",
		justifyContent: "space-between",
		gap: "0.5rem",
		color: Q.title,
		fontWeight: "700",
		fontSize: "0.75rem"
	},
	select: {
		position: "absolute",
		zIndex: "1",
		inset: "0",
		width: "100%",
		height: "100%",
		border: "0",
		padding: "0",
		color: "transparent",
		background: "transparent",
		cursor: "pointer"
	},
	handle: {
		position: "absolute",
		zIndex: "3",
		display: "grid",
		placeItems: "center",
		left: "50%",
		bottom: "0.375rem",
		width: "3.75rem",
		height: "1.75rem",
		border: "0",
		borderRadius: "999px",
		padding: "0",
		color: Q.activeBorder,
		background: Q.tealOverlay,
		fontSize: "1rem",
		fontWeight: "400",
		lineHeight: "1",
		boxShadow: "0 1px 4px rgba(17, 24, 39, 0.16)",
		cursor: "grab",
		transform: "translateX(-50%)",
		transition: "opacity 120ms ease-out"
	},
	action: {
		position: "absolute",
		zIndex: "3",
		display: "grid",
		placeItems: "center",
		width: "3rem",
		height: "3rem",
		border: "0",
		borderRadius: "999px",
		padding: "0",
		color: Q.activeBorder,
		background: Q.tealOverlay,
		fontSize: "1.75rem",
		fontWeight: "400",
		lineHeight: "1",
		boxShadow: "0 1px 4px rgba(17, 24, 39, 0.16)",
		cursor: "pointer",
		transition: "opacity 120ms ease-out"
	},
	armedAction: {
		zIndex: "4",
		width: "auto",
		minWidth: "7rem",
		height: "2rem",
		padding: "0 0.75rem",
		color: "#ffffff",
		background: Q.removeText,
		fontSize: "0.75rem",
		fontWeight: "800",
		lineHeight: "1",
		whiteSpace: "nowrap"
	},
	intelligence: {
		position: "absolute",
		width: "1px",
		height: "1px",
		margin: "-1px",
		padding: "0",
		overflow: "hidden",
		clip: "rect(0 0 0 0)",
		whiteSpace: "nowrap",
		border: "0"
	},
	sheen: {
		position: "absolute",
		inset: "-20% auto -20% 0",
		width: "42%",
		borderRadius: "999px",
		background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(214,226,234,0.62) 42%, rgba(255,255,255,0.9) 50%, rgba(214,226,234,0.48) 58%, rgba(255,255,255,0) 100%)",
		filter: "blur(0.375rem)",
		animation: "aurora-lens-thumbnail-sheen 1.45s cubic-bezier(0.4, 0, 0.2, 1) infinite"
	}
}, rn = `
@keyframes aurora-lens-thumbnail-sheen {
  0% { transform: translateX(-135%) rotate(8deg); opacity: 0; }
  18% { opacity: 0.92; }
  55% { opacity: 0.7; }
  100% { transform: translateX(135%) rotate(8deg); opacity: 0; }
}
[data-aurora-thumbnail-card]:hover,
[data-aurora-thumbnail-card]:focus-within {
  box-shadow: ${Z.activeShadow};
  transform: translateY(-2px);
}
[data-aurora-thumbnail-card][data-drag-state="dragging"] {
  box-shadow: ${Z.dragShadow};
  opacity: 0.72;
  transform: scale(0.985);
}
[data-aurora-thumbnail-card][data-drop-target="true"] {
  outline: 2px solid ${Q.activeBorder};
  outline-offset: 0.25rem;
}
[data-aurora-thumbnail-card][data-drag-state="dragging"] [data-thumbnail-drag-handle] {
  cursor: grabbing;
}
[data-page-select] {
  cursor: pointer;
}
[data-thumbnail-drag-handle] {
  cursor: grab;
}
[data-thumbnail-action],
[data-thumbnail-drag-handle] {
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
}
[data-aurora-thumbnail-card]:hover [data-thumbnail-action],
[data-aurora-thumbnail-card]:focus-within [data-thumbnail-action],
[data-aurora-thumbnail-card]:hover [data-thumbnail-drag-handle],
[data-aurora-thumbnail-card]:focus-within [data-thumbnail-drag-handle] {
  opacity: 1;
  pointer-events: auto;
  visibility: visible;
}
`, an = class {
	options;
	root = document.createElement("div");
	grid = document.createElement("div");
	fileInput = document.createElement("input");
	live = document.createElement("span");
	watermark = yt();
	pages = [];
	pageIds = [];
	items = [];
	metadataPages = /* @__PURE__ */ new Set();
	activeIndex = -1;
	pageCount = 0;
	pageSize = {
		width: 1,
		height: 1
	};
	sourceName = "";
	frame = 0;
	pendingAdd = null;
	dragItemId = "";
	dropTargetId = "";
	armedButton = null;
	armTimer = 0;
	scrollFrame = 0;
	scrollStep = 0;
	allowEdit;
	constructor(e) {
		this.options = e, this.allowEdit = e.allowEdit, this.ensureStyle(), this.fileInput.type = "file", this.fileInput.multiple = !0, this.fileInput.addEventListener("change", () => this.handleFilePick()), Object.assign(this.fileInput.style, { display: "none" }), this.live.setAttribute("aria-live", "polite"), Object.assign(this.live.style, $.hidden), Object.assign(this.root.style, $.root), Object.assign(this.grid.style, $.grid), this.root.append(this.grid, this.fileInput, this.live, this.watermark), this.grid.addEventListener("scroll", () => this.emitRange()), this.grid.addEventListener("dragover", (e) => {
			if (this.allowEdit && e.dataTransfer?.types.includes("Files")) {
				e.preventDefault();
				return;
			}
			this.allowEdit && this.dragItemId && (e.preventDefault(), this.updateAutoScroll(e));
		}), this.grid.addEventListener("drop", (e) => this.handleDrop(e));
	}
	element() {
		return this.root;
	}
	thumbnailSize() {
		let e = document.createElement("div");
		e.style.width = Z.probeWidth, document.body.appendChild(e);
		let t = Math.ceil(e.getBoundingClientRect().width);
		return e.remove(), t;
	}
	setAllowEdit(e) {
		this.allowEdit !== e && (this.allowEdit = e, this.pendingAdd = null, this.clearDrag(), this.clearArm(), this.pageCount && this.syncEditControls());
	}
	show(e, t, n, r, i, a, o) {
		this.pageIds = e, this.pageCount = t, this.sourceName = n, this.pageSize = r, this.pages = i, this.metadataPages = o, this.activeIndex = a, this.syncItems(), this.render(!0, !0);
	}
	update(e, t, n, r) {
		let i = this.pageCount !== e.length;
		this.pageIds = e, this.pageCount = e.length, this.pages = t, this.metadataPages = r, this.activeIndex = n, this.syncItems(), this.render(!1, i);
	}
	clear() {
		this.frame &&= (cancelAnimationFrame(this.frame), 0), this.stopAutoScroll(), this.grid.innerHTML = "", this.pages = [], this.pageIds = [], this.items = [], this.metadataPages = /* @__PURE__ */ new Set(), this.activeIndex = -1, this.pageCount = 0, this.sourceName = "", this.pageSize = {
			width: 1,
			height: 1
		}, this.pendingAdd = null, this.dragItemId = "", this.dropTargetId = "", this.clearArm(), this.live.textContent = "";
	}
	ensureStyle() {
		if (!document.getElementById(en.style)) {
			let e = document.createElement("style");
			e.id = en.style, e.textContent = rn, document.head.append(e);
		}
	}
	render(e, t) {
		let n = this.grid.scrollTop;
		if (Object.assign(this.root.style, $.root), Object.assign(this.grid.style, $.grid), this.grid.innerHTML = "", this.items.forEach((e) => {
			this.grid.appendChild(this.card(e));
		}), this.root.append(this.grid, this.fileInput, this.live, this.watermark), e) {
			let e = this.root.querySelector(`[data-page-index="${this.activeIndex}"] button[data-page-select="true"]`);
			e instanceof HTMLElement && (e.focus(), e.scrollIntoView({
				block: "nearest",
				inline: "nearest"
			}));
		} else this.grid.scrollTop = n;
		t && (this.frame && cancelAnimationFrame(this.frame), this.frame = requestAnimationFrame(() => {
			this.frame = 0, this.emitRange();
		}));
	}
	card(e) {
		let t = document.createElement("div"), n = this.metadataPages.has(e.pageId);
		return t.dataset[Y.card] = "true", Object.assign(t.style, $.card, {
			border: e.pageIndex === this.activeIndex ? `1px solid ${Q.activeBorder}` : "0",
			borderTop: n ? `0.25rem solid ${this.options.intelligenceColor.stroke}` : e.pageIndex === this.activeIndex ? `1px solid ${Q.activeBorder}` : "0"
		}), t.dataset[Y.itemId] = e.pageId, t.dataset[Y.pageIndex] = String(e.pageIndex), t.addEventListener("dragend", () => {
			this.clearDrag();
		}), t.addEventListener("dragover", (e) => {
			this.allowEdit && this.dragItemId && (e.preventDefault(), this.setDropTarget(t.dataset[Y.itemId] ?? ""), this.updateAutoScroll(e));
		}), t.addEventListener("dragleave", () => {
			this.dropTargetId === t.dataset[Y.itemId] && this.setDropTarget("");
		}), t.addEventListener("drop", (e) => this.handleReorder(e, t)), t.append(this.media(e.pageIndex), this.title(X.page(e.pageIndex + 1), this.sizeText(e.pageIndex)), this.select(e.pageIndex)), n && t.append(this.intelligenceLabel(e.pageIndex + 1)), this.allowEdit && this.addEditControls(t), t;
	}
	addEditControls(e) {
		let t = this.action(X.addBefore, nn.add, "left"), n = this.action(X.addAfter, nn.add, "right"), r = this.action(X.remove, nn.remove, "remove");
		t.addEventListener("click", (t) => this.chooseFile(t, e, "left")), n.addEventListener("click", (t) => this.chooseFile(t, e, "right")), r.addEventListener("click", (t) => this.confirmRemove(t, e, r)), e.append(this.handle(), t, n, r);
	}
	syncEditControls() {
		Array.from(this.root.querySelectorAll("[data-aurora-thumbnail-card]")).forEach((e) => {
			!(e instanceof HTMLDivElement) || !e.dataset[Y.pageIndex] || (e.querySelectorAll("[data-thumbnail-action], [data-thumbnail-drag-handle]").forEach((e) => e.remove()), this.allowEdit && this.addEditControls(e));
		});
	}
	media(e) {
		let t = this.pages[e], n = this.mediaFrame(t, e + 1);
		if (t) {
			let e = document.createElement("img");
			e.src = t.url, e.alt = `${t.sourceName} page ${t.pageNumber}`, Object.assign(e.style, $.image), n.append(e);
		} else n.append(this.sheen());
		return n;
	}
	mediaFrame(e, t) {
		let n = document.createElement("div");
		return n.dataset[Y.media] = "true", n.setAttribute("aria-label", e ? `${e.sourceName} page ${e.pageNumber}` : X.thumbLoading(this.sourceName, t)), Object.assign(n.style, $.media, { aspectRatio: e ? `${e.width} / ${e.height}` : `${this.pageSize.width} / ${this.pageSize.height}` }), e || Object.assign(n.style, $.placeholder), n;
	}
	sheen() {
		let e = document.createElement("span");
		return e.setAttribute("aria-hidden", "true"), Object.assign(e.style, $.sheen), e;
	}
	title(e, t) {
		let n = document.createElement("div"), r = document.createElement("span"), i = document.createElement("span");
		return r.dataset[Y.titlePrimary] = "true", i.dataset[Y.titleSecondary] = "true", r.textContent = e, i.textContent = t, n.append(r, i), Object.assign(n.style, $.title), n;
	}
	sizeText(e) {
		let t = this.pages[e];
		return t ? `${t.width}x${t.height}` : X.loading;
	}
	select(e) {
		let t = document.createElement("button");
		return t.type = "button", t.dataset[Y.pageSelect] = "true", t.setAttribute("aria-label", X.page(e + 1)), t.addEventListener("click", (e) => {
			let t = e.currentTarget instanceof HTMLElement ? e.currentTarget.closest("[data-page-index]") : null, n = t instanceof HTMLElement ? Number(t.dataset[Y.pageIndex]) : -1;
			Number.isInteger(n) && n >= 0 && this.options.onSelect(n);
		}), Object.assign(t.style, $.select), e === this.activeIndex && t.setAttribute("aria-current", "page"), t;
	}
	handle() {
		let e = document.createElement("button");
		return e.type = "button", e.draggable = !0, e.dataset[Y.dragHandle] = "true", e.textContent = "...", e.setAttribute("aria-label", X.move), e.title = X.move, Object.assign(e.style, $.handle), e.addEventListener("dragstart", (e) => {
			let t = e.currentTarget instanceof HTMLElement ? e.currentTarget.closest("[data-item-id]") : null;
			if (!(t instanceof HTMLElement)) return;
			this.dragItemId = t.dataset[Y.itemId] ?? "";
			let n = this.root.querySelector(`[data-item-id="${this.dragItemId}"]`);
			n instanceof HTMLElement && (n.dataset[Y.dragState] = "dragging"), e.dataTransfer && (e.dataTransfer.effectAllowed = "move"), e.dataTransfer?.setData("text/plain", this.dragItemId), this.updateAutoScroll(e);
		}), e;
	}
	action(e, t, n) {
		let r = document.createElement("button");
		return r.type = "button", r.dataset[Y.action] = "true", r.textContent = t, r.setAttribute("aria-label", e), r.title = e, Object.assign(r.style, $.action), n === "left" ? Object.assign(r.style, {
			left: "0.375rem",
			top: "50%",
			transform: "translateY(-50%)"
		}) : n === "right" ? Object.assign(r.style, {
			right: "0.375rem",
			top: "50%",
			transform: "translateY(-50%)"
		}) : (Object.assign(r.style, {
			left: "50%",
			top: "0.375rem",
			transform: "translateX(-50%)"
		}), r.style.color = Q.removeText), r;
	}
	confirmRemove(e, t, n) {
		if (e.stopPropagation(), this.armedButton !== n) {
			this.arm(n);
			return;
		}
		this.clearArm(), this.removePage(e, t);
	}
	arm(e) {
		this.clearArm(), this.armedButton = e, e.textContent = X.confirmRemove, e.setAttribute("aria-label", X.confirmRemove), e.title = X.confirmRemove, Object.assign(e.style, $.armedAction), this.armTimer = window.setTimeout(() => this.clearArm(), Z.confirmMs);
	}
	clearArm() {
		this.armTimer &&= (window.clearTimeout(this.armTimer), 0), this.armedButton &&= (this.armedButton.textContent = nn.remove, this.armedButton.setAttribute("aria-label", X.remove), this.armedButton.title = X.remove, Object.assign(this.armedButton.style, $.action, {
			left: "50%",
			minWidth: "",
			top: "0.375rem",
			transform: "translateX(-50%)",
			whiteSpace: ""
		}), this.armedButton.style.color = Q.removeText, this.armedButton.style.backgroundColor = Q.tealOverlay, null);
	}
	intelligenceLabel(e) {
		let t = document.createElement("span");
		return t.setAttribute("aria-label", X.intelligenceReady(e)), Object.assign(t.style, $.intelligence), t;
	}
	chooseFile(e, t, n) {
		if (e.stopPropagation(), !this.allowEdit) return;
		let r = this.itemFromCard(t);
		r && (this.pendingAdd = {
			pageId: r.pageId,
			pageIndex: r.pageIndex,
			side: n
		}, this.fileInput.click());
	}
	handleFilePick() {
		let e = Array.from(this.fileInput.files ?? []), t = this.pendingAdd;
		if (this.fileInput.value = "", this.pendingAdd = null, !this.allowEdit || !e.length || !t || this.items.findIndex((e) => e.pageId === t.pageId) < 0) return;
		let n = t.side === "left" ? t.pageIndex : t.pageIndex + 1;
		Promise.resolve(this.options.onAdd(e, n)).then(() => this.report(tn.add)).catch(() => void 0);
	}
	removePage(e, t) {
		if (e.stopPropagation(), !this.allowEdit) return;
		let n = this.itemFromCard(t);
		n && Promise.resolve(this.options.onRemove(n.pageId)).then(() => {
			this.report(tn.remove);
		}).catch(this.options.onError);
	}
	handleReorder(e, t) {
		if (!this.allowEdit || !this.dragItemId || e.dataTransfer?.types.includes("Files")) return;
		e.preventDefault(), e.stopPropagation();
		let n = this.itemFromCard(t);
		if (!n) {
			this.clearDrag();
			return;
		}
		let r = this.items.findIndex((e) => e.pageId === this.dragItemId), i = this.items.findIndex((e) => e.pageId === n.pageId);
		if (r < 0 || i < 0 || r === i) {
			this.clearDrag();
			return;
		}
		let a = this.grid.scrollTop, [o] = this.items.splice(r, 1), s = o.pageIndex, c = n.pageIndex;
		this.items.splice(i, 0, o), this.items = this.items.map((e, t) => ({
			...e,
			pageIndex: t
		}));
		let l = this.root.querySelector(`[data-item-id="${this.dragItemId}"]`);
		if (l instanceof HTMLElement) {
			let e = r < i ? t.nextSibling : t;
			this.grid.insertBefore(l, e);
		}
		this.refreshCards(), this.grid.scrollTop = a, this.clearDrag(), Promise.resolve(this.options.onReorder({
			fromPageIndex: s,
			toPageIndex: c
		})).then(() => this.report(tn.reorder)).catch(this.options.onError);
	}
	refresh(e, t, n, r) {
		let i = this.grid.scrollTop;
		this.pageIds = e, this.pageCount = e.length, this.pages = t, this.metadataPages = r, this.activeIndex = n, this.syncItems(), this.refreshCards(), this.grid.scrollTop = i;
	}
	refreshCards() {
		Array.from(this.root.querySelectorAll("[data-aurora-thumbnail-card]")).forEach((e, t) => {
			if (!(e instanceof HTMLElement)) return;
			let n = this.items[t];
			if (!n) return;
			let r = n.pageIndex, i = this.metadataPages.has(n.pageId);
			e.dataset[Y.itemId] = n.pageId, e.dataset[Y.pageIndex] = String(r), Object.assign(e.style, {
				border: r === this.activeIndex ? `1px solid ${Q.activeBorder}` : "0",
				borderTop: i ? `0.25rem solid ${this.options.intelligenceColor.stroke}` : r === this.activeIndex ? `1px solid ${Q.activeBorder}` : "0"
			});
			let a = e.querySelector("[data-title-primary]"), o = e.querySelector("[data-title-secondary]");
			a && (a.textContent = X.page(r + 1)), o && (o.textContent = this.sizeText(r));
			let s = e.querySelector("[data-page-select]");
			s instanceof HTMLElement && (s.setAttribute("aria-label", X.page(r + 1)), r === this.activeIndex ? s.setAttribute("aria-current", "page") : s.removeAttribute("aria-current"));
			let c = e.querySelector("[data-thumbnail-media]"), l = this.pages[r];
			c instanceof HTMLElement && c.setAttribute("aria-label", l ? `${l.sourceName} page ${l.pageNumber}` : X.thumbLoading(this.sourceName, r + 1));
			let u = e.querySelector("[aria-label$='has intelligence metadata']");
			i && !(u instanceof HTMLElement) ? e.append(this.intelligenceLabel(r + 1)) : i && u instanceof HTMLElement ? u.setAttribute("aria-label", X.intelligenceReady(r + 1)) : u instanceof HTMLElement && u.remove();
		});
	}
	itemFromCard(e) {
		let t = e.dataset[Y.itemId];
		return this.items.find((e) => e.pageId === t) ?? null;
	}
	syncItems() {
		this.items = this.pageIds.map((e, t) => ({
			kind: "page",
			pageId: e,
			pageIndex: t
		}));
	}
	handleDrop(e) {
		let t = e.dataTransfer?.files;
		!this.allowEdit || !t?.length || (e.preventDefault(), Promise.resolve(this.options.onAdd(Array.from(t), this.pageCount)).then(() => this.report(tn.drop)).catch(() => void 0));
	}
	report(e) {
		this.live.textContent = e;
	}
	emitRange() {
		this.pageCount && this.options.onRange(this.visibleIndexes());
	}
	visibleIndexes() {
		let e = [], t = this.grid.scrollTop, n = t + this.grid.clientHeight;
		Array.from(this.grid.children).forEach((r, i) => {
			let a = this.items[i];
			if (!(r instanceof HTMLElement) || !a) return;
			let o = r.offsetTop;
			o + r.offsetHeight >= t && o <= n && e.push(a.pageIndex);
		}), e.length || e.push(Math.max(0, this.activeIndex));
		let r = Math.max(0, Math.min(...e) - Z.rangeBuffer), i = Math.min(this.pageCount - 1, Math.max(...e) + Z.rangeBuffer), a = [];
		for (let e = r; e <= i && a.length < Z.rangeLimit; e += 1) a.push(e);
		return a;
	}
	setDropTarget(e) {
		if (this.dropTargetId !== e && (this.root.querySelectorAll("[data-drop-target='true']").forEach((e) => {
			e instanceof HTMLElement && delete e.dataset[Y.dropTarget];
		}), this.dropTargetId = e, e)) {
			let t = this.root.querySelector(`[data-item-id="${e}"]`);
			t instanceof HTMLElement && (t.dataset[Y.dropTarget] = "true");
		}
	}
	clearDrag() {
		this.stopAutoScroll(), this.root.querySelectorAll("[data-drag-state], [data-drop-target]").forEach((e) => {
			e instanceof HTMLElement && (delete e.dataset[Y.dragState], delete e.dataset[Y.dropTarget]);
		}), this.dragItemId = "", this.dropTargetId = "";
	}
	updateAutoScroll(e) {
		let t = this.grid.getBoundingClientRect(), n = e.clientY - t.top, r = t.bottom - e.clientY;
		n < Z.scrollEdge ? this.startAutoScroll(-this.scrollStepFor(n)) : r < Z.scrollEdge ? this.startAutoScroll(this.scrollStepFor(r)) : this.stopAutoScroll();
	}
	scrollStepFor(e) {
		return Math.ceil((Z.scrollEdge - Math.max(0, e)) / Z.scrollEdge * Z.scrollMax);
	}
	startAutoScroll(e) {
		this.scrollStep = e, this.scrollFrame ||= requestAnimationFrame(() => this.scrollDrag());
	}
	scrollDrag() {
		if (this.scrollFrame = 0, !this.dragItemId || !this.scrollStep) return;
		let e = this.grid.scrollTop;
		if (this.grid.scrollTop += this.scrollStep, this.grid.scrollTop === e) {
			this.scrollStep = 0;
			return;
		}
		this.emitRange(), this.scrollFrame = requestAnimationFrame(() => this.scrollDrag());
	}
	stopAutoScroll() {
		this.scrollStep = 0, this.scrollFrame &&= (cancelAnimationFrame(this.scrollFrame), 0);
	}
}, on = class {
	pending = /* @__PURE__ */ new Map();
	async export(e, t, n) {
		let r = new Worker(new URL(
			/* @vite-ignore */
			"/assets/tiffExportWorker-CwUgqTpI.js",
			"" + import.meta.url
		), { type: "module" });
		try {
			return await new Promise((i, s) => {
				this.pending.set(r, s), r.onmessage = (e) => {
					let t = e.data;
					try {
						t.kind === "progress" ? n?.(t.progress) : t.kind === "done" ? i(t.blob) : s(new o(t.errorCode, t.error));
					} catch (e) {
						s(e);
					}
				}, r.onerror = s, r.onmessageerror = () => s(new o(a, "TIFF export worker returned an unreadable response.")), r.postMessage({
					pages: e,
					config: t
				});
			});
		} finally {
			this.pending.delete(r), r.terminate();
		}
	}
	close() {
		for (let e of this.pending.values()) e(new DOMException("TIFF export closed.", "AbortError"));
	}
};
//#endregion
//#region node_modules/@tabulariumai/aurora-lens/dist/core/validation/pageSizeValidation.js
function sn(e, t) {
	let n = t.formats.flatMap((t) => {
		if (e.xResolution <= 0 || e.yResolution <= 0) return [];
		let n = e.width / e.xResolution, r = e.height / e.yResolution;
		return [t, {
			width: t.height,
			height: t.width
		}].map((i) => ({
			documentType: t.name,
			xResolution: e.xResolution,
			yResolution: e.yResolution,
			physicalWidth: n,
			physicalHeight: r,
			tolerance: Math.max(Math.abs(n / i.width - 1), Math.abs(r / i.height - 1))
		}));
	}), r = Math.max(e.width, e.height) / Math.min(e.width, e.height);
	for (let i of t.formats) {
		let t = e.height >= e.width, a = t ? i.width : i.height, o = t ? i.height : i.width, s = Math.max(i.width, i.height) / Math.min(i.width, i.height);
		n.push({
			documentType: i.name,
			xResolution: e.width / a,
			yResolution: e.height / o,
			physicalWidth: a,
			physicalHeight: o,
			tolerance: Math.abs(r / s - 1)
		});
	}
	let i = n.find((e) => e.tolerance <= t.tolerance);
	return i ? {
		valid: !0,
		documentType: i.documentType,
		xResolution: i.xResolution,
		yResolution: i.yResolution,
		physicalWidth: i.physicalWidth,
		physicalHeight: i.physicalHeight
	} : {
		valid: !1,
		reason: `Page size ${e.width}x${e.height} does not match configured formats`,
		requiredTolerance: Math.min(...n.map((e) => e.tolerance))
	};
}
//#endregion
//#region node_modules/@tabulariumai/aurora-lens/dist/core/AuroraLens.js
var cn = "Could not restore the previous viewer session.", ln = "image/tiff", un = 3, dn = 64 * 1024 * 1024, fn = 1, pn = class {
	container;
	options;
	metadata = new pt();
	metadataRepository = new f();
	theme;
	selection;
	decoder = new Kt();
	exporter = new on();
	sessionStore;
	pageViewer;
	thumbnailViewer;
	file = null;
	page = null;
	pageMap = /* @__PURE__ */ new Map();
	metadataInput = null;
	metadataPending = !1;
	sessionPages = [];
	metadataPageIds = /* @__PURE__ */ new Set();
	memoryBlobs = /* @__PURE__ */ new Map();
	thumbnails = [];
	thumbnailJobs = /* @__PURE__ */ new Set();
	thumbnailKeep = /* @__PURE__ */ new Set();
	storedPageIds = /* @__PURE__ */ new Set();
	baselinePageIds = [];
	thumbnailRun = 0;
	viewMode = "page";
	status = "idle";
	coordinates = null;
	displayCoordinates = null;
	pageCount = 0;
	runId = 0;
	documentRun = 0;
	sourceType = null;
	requestedPageId = null;
	sourcePages = /* @__PURE__ */ new Set();
	sourceNames = /* @__PURE__ */ new Map();
	pageJobs = /* @__PURE__ */ new Map();
	pageQueue = Promise.resolve();
	sessionDeletion = Promise.resolve();
	thumbnailQueue = Promise.resolve();
	constructor(e, t) {
		this.container = e, this.options = t, c(e), this.sessionStore = t.sessionStore ?? null, this.theme = qt(t.selectionTheme), this.selection = new $t(this.theme), this.pageViewer = new xt({
			metadata: this.metadata,
			selection: this.selection,
			onChange: () => this.emitState(),
			onCoordinates: (e, t) => {
				this.coordinates = e, this.displayCoordinates = t, this.emitState();
			}
		}), this.thumbnailViewer = new an({
			allowEdit: t.allowEdit,
			intelligenceColor: this.theme.intelligence,
			onAdd: (e, t) => this.addPages(e, t),
			onRange: (e) => {
				this.loadThumbnails(e);
			},
			onReorder: (e) => this.reorderPages(e),
			onRemove: (e) => this.removePage(e),
			onError: (e) => this.fail(e),
			onSelect: (e) => {
				Promise.resolve(this.goPage(e)).catch(() => void 0);
			}
		}), this.mount(), this.emitStatus(), this.emitState();
	}
	close() {
		this.clearView(), this.pageViewer.close();
	}
	clear() {
		this.clearView();
		let e = this.runId;
		this.sessionDeletion = this.sessionDeletion.catch(() => void 0).then(() => this.deleteSession()), this.sessionDeletion.catch((t) => {
			e === this.runId && this.fail(t);
		});
	}
	clearView() {
		this.decoder.close(), this.documentRun += 1, this.sourceType = null, this.requestedPageId = null, this.sourcePages.clear(), this.sourceNames.clear(), this.pageJobs.clear(), this.pageQueue = Promise.resolve(), this.exporter.close(), this.runId += 1, this.revokePage(), this.revokeThumbnails(), this.file = null, this.baselinePageIds = [], this.pageCount = 0, this.viewMode = "page", this.status = "idle", this.coordinates = null, this.displayCoordinates = null, this.metadataInput = null, this.pageMap.clear(), this.metadataPending = !1, this.sessionPages = [], this.metadataPageIds = /* @__PURE__ */ new Set(), this.memoryBlobs = /* @__PURE__ */ new Map(), this.storedPageIds = /* @__PURE__ */ new Set(), this.metadata.clear(), this.pageViewer.clear(), this.thumbnailViewer.clear(), this.showView("page"), this.emitStatus(), this.emitState();
	}
	loadMetadata(e) {
		this.metadataInput = e, this.metadataPending = !0, this.metadata.load(e), this.sessionPages.length && (this.pageMap = this.metadataRepository.pageMap(e, this.sessionPages), this.saveMetadataPages(e).then(() => this.loadCurrentPageMetadata()).catch((e) => this.fail(e))), this.emitState();
	}
	async restoreSession() {
		if (!this.sessionStore) return !1;
		let e = this.runId;
		try {
			await this.sessionDeletion;
			let t = await this.sessionStore.read();
			if (e !== this.runId || !t) return !1;
			if (t.document.sessionId !== this.options.sessionId) return await this.deleteSession(), !1;
			this.clearView(), e = this.runId, this.sessionPages = t.pages, this.pageMap = this.metadataRepository.pageMap(null, this.sessionPages);
			let n = [], r = Object.create(null);
			for (let t of this.sessionPages) {
				let i = await this.sessionStore.readPageMetadata(t.pageId);
				if (e !== this.runId) return !1;
				i !== null && (n[t.sourcePageIndex] = i);
				for (let e of i?.pageNames ?? []) this.pageMap.set(e, t.pageId), r[e] = t.sourcePageIndex;
			}
			n.length && (this.metadataInput = {
				pages: n,
				pageMap: r
			});
			let i = await this.sessionStore.readPageMetadataIds();
			if (e !== this.runId || (this.metadataPageIds = i, this.storedPageIds = new Set(t.pages.map((e) => e.pageId)), this.baselinePageIds = this.pageIds(), this.file = new File([t.document.fileBlob], t.document.fileName, { type: t.document.fileType || ln }), this.sourceType = Vt(new Uint8Array(await this.file.slice(0, 8).arrayBuffer()), this.file), e !== this.runId)) return !1;
			this.sourcePages = new Set(this.sessionPages.map((e) => e.pageId));
			let a = this.loadPage(this.pagePosition(t.currentPage.pageId), {
				loadMetadata: !0,
				saveCurrentPage: !0,
				setReady: !0
			});
			return e = this.runId, await a !== null;
		} catch {
			return e === this.runId ? (this.clearView(), await this.deleteSession().catch(() => void 0), this.options.onError?.(/* @__PURE__ */ Error(cn)), !1) : !1;
		}
	}
	async decodeDoc(e, t) {
		l(e), u(t), d(t.viewMode);
		let n, r = this.runId + 1, i = ++this.documentRun;
		this.decoder.close(), this.pageJobs.clear(), this.pageQueue = Promise.resolve(), this.sourcePages.clear(), this.sourceNames.clear(), this.sourceType = null, this.requestedPageId = null, this.exporter.close(), this.runId = r;
		try {
			if (await this.sessionDeletion, i !== this.documentRun) throw new DOMException("Document decoder closed.", "AbortError");
			this.revokePage(), this.revokeThumbnails(), this.file = e, this.pageCount = 0, this.sessionPages = [], this.metadataPageIds = /* @__PURE__ */ new Set(), this.memoryBlobs = /* @__PURE__ */ new Map(), this.storedPageIds = /* @__PURE__ */ new Set(), this.selection.clear(), this.metadataPending || (this.metadataInput = null, this.metadata.clear()), this.setStatus("loadingPage");
			let a = await this.readViewerConfig();
			if (i !== this.documentRun) throw new DOMException("Document decoder closed.", "AbortError");
			let o = !1, s = () => void 0, c = () => void 0, l = new Promise((e, t) => {
				s = e, c = t;
			});
			this.decoder.decodeDoc(e, {
				pageCount: async (r, a) => {
					if (i !== this.documentRun) return;
					this.sourceType = a ?? null;
					let o = Date.now();
					if (this.sessionPages = this.createPageRecords(r, o), this.pageCount = r, this.pageMap = this.metadataRepository.pageMap(this.metadataInput, this.sessionPages), n = this.resolvePage(t.page), this.requestedPageId = this.sessionPages[n].pageId, this.sessionStore) {
						let t = await this.sessionStore.resetDocument({
							sessionId: this.options.sessionId,
							fileName: e.name,
							fileType: e.type,
							fileBlob: e,
							pages: this.sessionPages,
							pageCount: r,
							currentPageIndex: n,
							updatedAt: o
						});
						if (i !== this.documentRun) throw new DOMException("Document decoder closed.", "AbortError");
						this.sessionPages = t;
					}
					this.baselinePageIds = this.pageIds(), this.sourcePages = new Set(this.baselinePageIds), this.metadataInput !== null && await this.saveMetadataPages(this.metadataInput);
				},
				pageReady: async (e) => {
					if (i !== this.documentRun) return;
					let a = this.sessionPages[e.pageIndex];
					if (!a) return;
					let c = this.validateImportPage(e, e.pageIndex), l = await this.storePage(c, a.pageId, i);
					if (!l) return;
					let u = this.pagePosition(a.pageId);
					if (e.pageIndex === n && !o) {
						let e = await this.toPage(c, void 0, u, l);
						if (r !== this.runId) {
							URL.revokeObjectURL(e.url);
							return;
						}
						this.revokePage(), this.page = e, this.coordinates = null, this.displayCoordinates = null, this.selection.clear(), await this.loadStoredPageMetadata(e.pageId, e.pageIndex), this.viewMode = t.viewMode, t.viewMode === "page" ? (this.showView("page"), this.pageViewer.show(e)) : (this.thumbnailRun += 1, this.thumbnailKeep = /* @__PURE__ */ new Set(), this.thumbnailViewer.show(this.pageIds(), this.pageCount, e.sourceName, e, this.thumbnails, e.pageIndex, this.thumbnailMetadata()), this.showView("thumbnails")), await this.saveCurrentPage(e.pageId), this.metadataPending = !1, o = !0, this.setStatus("ready"), s(), this.prefetch(r, u);
					}
				}
			}, a.view, () => n).catch((e) => {
				if (!o) {
					c(e);
					return;
				}
				i === this.documentRun && this.failStoredDocumentPersistence(e, i);
			}), await l;
		} catch (e) {
			throw i === this.documentRun && (await this.deleteSession().catch(() => void 0), this.clearView()), e;
		}
	}
	isDirty() {
		let e = this.pageIds();
		return !this.baselinePageIds.length || !e.length ? !1 : e.length === this.baselinePageIds.length ? e.some((e, t) => e !== this.baselinePageIds[t]) : !0;
	}
	async addPages(e, t) {
		let n = Array.from(e);
		if (n.forEach(l), !this.file || !this.page || !this.sessionPages.length) throw Error("AuroraLens.addPages: open a document before adding pages.");
		if (!this.sessionStore) throw Error("AuroraLens.addPages: package-owned storage is required.");
		if (!Number.isInteger(t) || t < 0 || t > this.sessionPages.length) throw Error("AuroraLens.addPages: insertIndex must be between 0 and the current page count.");
		if (!n.length) return;
		let r = this.documentRun;
		this.setStatus("addingPages");
		let i = [];
		try {
			let e = await this.readViewerConfig();
			await this.decoder.decodeDocs(n, {
				pageCount: async (e) => {
					if (r !== this.documentRun) throw new DOMException("Document decoder closed.", "AbortError");
					let n = Date.now();
					i = this.createPageRecords(e, n), this.sessionPages = await this.sessionStore.insertPages(t, i, [], n), this.pageCount = this.sessionPages.length, this.insertEmptyThumbnails(t, e), await this.refreshCurrentPageOrder(), this.viewMode === "thumbnails" && this.thumbnailViewer.update(this.pageIds(), this.thumbnails, this.state().pageIndex, this.thumbnailMetadata());
				},
				pageReady: async (e, t) => {
					if (r !== this.documentRun) return;
					let n = i[t];
					if (!n) throw Error("AuroraLens.addPages: decoder emitted a page before the page count.");
					let a = this.validateImportPage(e, t);
					await this.storePage(a, n.pageId, r);
				}
			}, e.view), r === this.documentRun && this.setStatus("ready");
		} catch (e) {
			throw r === this.documentRun && (await this.removeImportedPages(i), this.setStatus("ready"), this.options.onAddError?.(e instanceof Error ? e : Error(e instanceof ErrorEvent ? e.message : String(e), { cause: e }))), e;
		}
	}
	actualSize() {
		this.pageViewer.actualSize();
	}
	clearSelection() {
		this.pageViewer.clearSelection(), this.emitState();
	}
	setAllowEdit(e) {
		this.thumbnailViewer.setAllowEdit(e);
	}
	async readViewerConfig() {
		return this.sessionStore ? this.sessionStore.readViewerConfig() : j();
	}
	async saveViewerConfig(e) {
		return this.sessionStore ? this.sessionStore.saveViewerConfig(e) : {
			view: { ...e.view },
			export: {
				...e.export,
				tiff: { ...e.export.tiff }
			}
		};
	}
	async exportTiff(e) {
		if (!this.sessionStore || !this.sessionPages.length) throw Error("AuroraLens.exportTiff: open a document before exporting.");
		let t = this.runId, n = this.sessionPages, r = await this.readViewerConfig(), i = [];
		for (let e of n) {
			await this.ensurePage(e.pageId, t);
			let n = await this.sessionStore.readPageBlobRecord(e.pageId);
			if (t !== this.runId) throw new DOMException("TIFF export closed.", "AbortError");
			if (!n) throw Error("AuroraLens.exportTiff: document pages are not ready.");
			i.push(n);
		}
		return this.exporter.export(i, r.export, e);
	}
	readPageInfo() {
		return !this.page || !this.metadata.hasPage(this.page.pageIndex) ? null : this.metadata.pageInfo(this.page.pageIndex);
	}
	readPageName() {
		if (!this.page) return null;
		let e = [...this.pageMap].filter(([, e]) => e === this.page?.pageId).map(([e]) => e);
		return e.find((e) => !/^\d+$/.test(e)) ?? e[0] ?? null;
	}
	exportSelection() {
		return !this.page || !this.selection.hasTokens() ? [] : this.metadata.exportGroups(this.page.pageIndex, this.selection.tokens());
	}
	async copySelection() {
		let e = this.runId, t = this.exportSelection();
		if (!t.length) return {
			copied: !1,
			groups: [],
			text: ""
		};
		this.setStatus("copyingSelection");
		try {
			let n = [...new Set(t.flatMap((e) => e.value.token.filter((e) => typeof e == "string")))].join(" ");
			return await navigator.clipboard.writeText(n), e === this.runId && this.setStatus("ready"), {
				copied: !0,
				groups: t,
				text: n
			};
		} catch (t) {
			throw e === this.runId && this.fail(t), t;
		}
	}
	fitHeight() {
		this.pageViewer.fitHeight();
	}
	fitPage() {
		this.pageViewer.fitPage();
	}
	fitWidth() {
		this.pageViewer.fitWidth();
	}
	search(e, t) {
		if (!this.page || !this.metadata.hasPage(this.page.pageIndex)) return null;
		let n = this.metadata.search(this.page.pageIndex, e, t?.context);
		return this.showHits(n, t?.additive), n;
	}
	highlightIndex(e, t, n) {
		if (!this.page || this.page.pageIndex !== this.resolvePage(e) || !this.metadata.hasPage(this.page.pageIndex)) return !1;
		let r = this.metadata.highlightIndex(this.page.pageIndex, t);
		return this.showHits(r, n?.additive), r.tokens.length > 0 || r.contexts.length > 0;
	}
	showHits(e, t) {
		t ? this.selection.showElements(e) : this.selection.showElement(e), this.pageViewer.render(), this.emitState();
	}
	setDrawMode(e) {
		this.pageViewer.setDrawMode(e);
	}
	zoomIn() {
		this.pageViewer.zoomIn();
	}
	zoomOut() {
		this.pageViewer.zoomOut();
	}
	firstPage() {
		return this.goPage(0);
	}
	lastPage() {
		return this.goPage(this.pageCount - 1);
	}
	nextPage() {
		return this.goPage(this.state().pageIndex + 1);
	}
	previousPage() {
		return this.goPage(this.state().pageIndex - 1);
	}
	resolvePage(e) {
		let n = new Map(this.sessionPages.map((e, t) => [String(t + 1), e.pageId]));
		for (let [e, t] of this.pageMap) n.set(e, t);
		let r = n.get(String(e)), i = this.sessionPages.findIndex((e) => e.pageId === r);
		if (i < 0) throw new o(t, `Page ${e} is outside the available page range.`);
		return i;
	}
	async goToPage(e) {
		let t;
		try {
			t = this.resolvePage(e);
		} catch (e) {
			throw this.fail(e), e;
		}
		await this.goPage(t);
	}
	async showThumbnails() {
		if (!(!this.file || !this.page || !this.pageCount)) try {
			this.thumbnailRun += 1, this.thumbnailJobs.clear(), this.thumbnailKeep = /* @__PURE__ */ new Set(), this.viewMode = "thumbnails", this.thumbnailViewer.show(this.pageIds(), this.pageCount, this.page.sourceName, this.page, this.thumbnails, this.page.pageIndex, this.thumbnailMetadata()), this.showView("thumbnails"), this.setStatus("ready");
		} catch (e) {
			throw this.fail(e), e;
		}
	}
	mount() {
		this.container.innerHTML = "", Object.assign(this.container.style, {
			position: "relative",
			width: "100%",
			height: "100%",
			maxHeight: "100%",
			minWidth: "0",
			minHeight: "0",
			overflow: "hidden"
		}), this.container.append(this.pageViewer.element(), this.thumbnailViewer.element()), this.showView("page");
	}
	async goPage(e) {
		if (e < 0 || e >= this.pageCount) return;
		let t = this.documentRun;
		try {
			await this.loadPage(e, {
				loadMetadata: !0,
				saveCurrentPage: !0,
				setReady: !0
			});
		} catch (e) {
			throw await this.failStoredDocumentPersistence(e, t), e;
		}
	}
	async loadPage(e, t) {
		if (!this.file) return null;
		let n = this.runId + 1;
		this.runId = n, this.requestedPageId = this.sessionPages[e]?.pageId ?? null, this.setStatus("loadingPage");
		let r = await this.loadStoredRaster(e, n);
		if (!r || n !== this.runId) return null;
		let i = await this.toPage(r, void 0, e, r.blob);
		return n !== this.runId || (t.loadMetadata && await this.loadStoredPageMetadata(i.pageId, i.pageIndex), n !== this.runId) ? (URL.revokeObjectURL(i.url), null) : (this.revokePage(), this.page = i, this.pageCount = i.pageCount, this.viewMode = "page", this.coordinates = null, this.displayCoordinates = null, this.selection.clear(), this.showView("page"), this.pageViewer.show(i), this.revokeThumbnails(), t.saveCurrentPage && await this.saveCurrentPage(i.pageId), t.setReady && this.setStatus("ready"), this.prefetch(n, e), i);
	}
	showView(e) {
		this.pageViewer.element().style.display = e === "page" ? "block" : "none", this.thumbnailViewer.element().style.display = e === "thumbnails" ? "grid" : "none";
	}
	revokePage() {
		this.page &&= (URL.revokeObjectURL(this.page.url), null);
	}
	revokeThumbnails() {
		this.thumbnailRun += 1, this.thumbnailJobs.clear(), this.thumbnailKeep = /* @__PURE__ */ new Set(), this.thumbnails.forEach((e) => {
			e && URL.revokeObjectURL(e.url);
		}), this.thumbnails = [];
	}
	loadThumbnails(e) {
		if (!this.file || this.viewMode !== "thumbnails") return;
		let t = this.thumbnailRun, n = new Set(e);
		this.thumbnailKeep = n, this.revokeSkipped(n);
		let r = this.thumbnailViewer.thumbnailSize();
		e.forEach((e) => {
			let n = this.sessionPages[e]?.pageId;
			!this.sourcePages.has(n) && !this.storedPageIds.has(n) || this.thumbnails[e] || this.thumbnailJobs.has(e) || (this.thumbnailJobs.add(e), this.thumbnailQueue = this.thumbnailQueue.catch(() => void 0).then(async () => {
				if (t !== this.thumbnailRun || this.viewMode !== "thumbnails" || !this.thumbnailKeep.has(e) || this.sessionPages[e]?.pageId !== n) return null;
				let i = await this.loadStoredRaster(e, this.runId);
				return t !== this.thumbnailRun || this.sessionPages[e]?.pageId !== n ? null : i ? this.toPage(i, r, e) : null;
			}).then((r) => {
				if (t === this.thumbnailRun && this.thumbnailJobs.delete(e), r) {
					if (t !== this.thumbnailRun || this.viewMode !== "thumbnails" || !this.thumbnailKeep.has(e) || this.sessionPages[e]?.pageId !== n) {
						URL.revokeObjectURL(r.url);
						return;
					}
					this.thumbnails[e] = r, this.thumbnailViewer.update(this.pageIds(), this.thumbnails, this.state().pageIndex, this.thumbnailMetadata()), this.revokeSkipped(this.thumbnailKeep);
				}
			}).catch((n) => {
				t === this.thumbnailRun && this.thumbnailJobs.delete(e), t === this.thumbnailRun && this.fail(n);
			}));
		});
	}
	revokeSkipped(e) {
		this.thumbnails.forEach((t, n) => {
			t && !e.has(n) && (URL.revokeObjectURL(t.url), this.thumbnails[n] = void 0);
		});
	}
	thumbnailMetadata() {
		return new Set(this.metadataPageIds);
	}
	setStatus(e) {
		this.status = e, this.emitStatus(), this.emitState();
	}
	fail(e) {
		let t = e instanceof Error ? e : Error(e instanceof ErrorEvent ? e.message : String(e), { cause: e });
		this.status = "error", this.emitStatus(), this.emitState(), this.options.onError?.(t);
	}
	emitStatus() {
		this.options.onStatusChange?.(this.status);
	}
	emitState() {
		this.options.onStateChange?.(this.state());
	}
	async savePageBlob(e, t, n, r) {
		let i = this.sessionPages[e];
		if (i && this.sourceNames.set(i.pageId, r.sourceName), i && !this.sessionStore && (this.memoryBlobs.set(i.pageId, t), this.sourceType === "tiff")) {
			let e = [...this.memoryBlobs.values()].reduce((e, t) => e + t.size, 0);
			for (let [t, n] of this.memoryBlobs) {
				if (this.memoryBlobs.size <= un && e <= dn) break;
				this.memoryBlobs.delete(t), e -= n.size;
			}
		}
		this.sessionStore && i && await this.sessionStore.savePageBlob({
			pageId: i.pageId,
			blob: t,
			sourceType: r.sourceType,
			width: r.width,
			height: r.height,
			xResolution: r.xResolution,
			yResolution: r.yResolution,
			documentType: r.documentType,
			physicalWidth: r.physicalWidth,
			physicalHeight: r.physicalHeight,
			updatedAt: n
		});
	}
	async saveMetadataPages(e) {
		if (!this.sessionStore) return;
		let t = Date.now(), n = this.documentRun, r = this.metadataRepository.split(e, this.sessionPages);
		for (let e of r) {
			if (n !== this.documentRun || (await this.sessionStore.savePageMetadata({
				pageId: e.pageId,
				metadata: e.metadata,
				updatedAt: t
			}), n !== this.documentRun)) return;
			this.metadataPageIds.add(e.pageId);
		}
	}
	async loadCurrentPageMetadata() {
		this.page && await this.loadStoredPageMetadata(this.page.pageId, this.page.pageIndex);
	}
	async loadStoredPageMetadata(e, t) {
		if (!this.sessionStore) return;
		this.metadata.clear();
		let n = this.runId, r = await this.sessionStore.readPageMetadata(e);
		n === this.runId && r !== null && (this.metadata.loadPage(t, r), this.metadataPageIds.add(e));
	}
	async saveCurrentPage(e) {
		this.sessionStore && await this.sessionStore.saveCurrentPage(e, Date.now());
	}
	insertEmptyThumbnails(e, t) {
		this.thumbnails.splice(e, 0, ...Array(t).fill(void 0)), this.thumbnails = this.thumbnails.map((e, t) => e && {
			...e,
			pageIndex: t,
			pageNumber: t + 1,
			pageCount: this.sessionPages.length
		});
	}
	async removeImportedPages(e) {
		let t = e.filter((e) => !this.storedPageIds.has(e.pageId)).map((e) => e.pageId);
		if (!this.sessionStore || !t.length) return;
		this.sessionPages = await this.sessionStore.removePages(t, Date.now());
		let n = new Map(this.thumbnails.filter((e) => !!e).map((e) => [e.pageId, e]));
		this.thumbnails = this.sessionPages.map((e, t) => {
			let r = n.get(e.pageId);
			return r ? {
				...r,
				pageIndex: t,
				pageNumber: t + 1,
				pageCount: this.sessionPages.length
			} : void 0;
		}), this.storedPageIds = new Set(Array.from(this.storedPageIds).filter((e) => !t.includes(e))), this.pageCount = this.sessionPages.length, await this.refreshCurrentPageOrder(), this.viewMode === "thumbnails" && this.thumbnailViewer.update(this.pageIds(), this.thumbnails, this.state().pageIndex, this.thumbnailMetadata());
	}
	async reorderPages(e) {
		if (this.sessionPages.length) {
			let t = this.documentRun, n = Date.now(), r = this.sessionStore ? await this.sessionStore.reorderPages(e.fromPageIndex, e.toPageIndex, n) : Dt(this.sessionPages, e.fromPageIndex, e.toPageIndex, n);
			if (t !== this.documentRun) return;
			this.sessionPages = r, this.moveThumbnail(e.fromPageIndex, e.toPageIndex), await this.refreshCurrentPageOrder(), this.viewMode === "thumbnails" && this.page && this.thumbnailViewer.refresh(this.pageIds(), this.thumbnails, this.page.pageIndex, this.thumbnailMetadata());
		}
	}
	async removePage(e) {
		if (!this.sessionStore || this.sessionPages.length < 2) throw Error("AuroraLens.removePage: package-owned storage and at least two pages are required.");
		let t = this.sessionPages.findIndex((t) => t.pageId === e);
		if (t < 0) throw Error("AuroraLens.removePage: pageId must match an open document page.");
		this.setStatus("loadingPage");
		let n = this.page?.pageId === e, r = Math.min(t, this.sessionPages.length - 2), i = n ? this.sessionPages[r === t ? t + 1 : r].pageId : null;
		i && await this.saveCurrentPage(i);
		let a = Date.now();
		this.sessionPages = await this.sessionStore.removePages([e], a), this.removeThumbnail(e), this.memoryBlobs.delete(e), this.sourceNames.delete(e), this.storedPageIds.delete(e), this.metadataPageIds.delete(e), this.pageCount = this.sessionPages.length, n ? await this.loadCurrentAfterRemove(r) : await this.refreshCurrentPageOrder(), this.viewMode === "thumbnails" && this.thumbnailViewer.update(this.pageIds(), this.thumbnails, this.state().pageIndex, this.thumbnailMetadata()), this.setStatus("ready");
	}
	removeThumbnail(e) {
		let t = new Map(this.thumbnails.filter((e) => !!e).map((e) => [e.pageId, e])), n = t.get(e);
		n && URL.revokeObjectURL(n.url), t.delete(e), this.thumbnails = this.sessionPages.map((e, n) => {
			let r = t.get(e.pageId);
			return r ? {
				...r,
				pageIndex: n,
				pageNumber: n + 1,
				pageCount: this.sessionPages.length
			} : void 0;
		});
	}
	async loadCurrentAfterRemove(e) {
		let t = await this.loadStoredRaster(e, this.runId);
		if (!t) return;
		let n = await this.toPage(t, void 0, e, t.blob);
		this.revokePage(), this.page = n, this.coordinates = null, this.displayCoordinates = null, this.selection.clear(), await this.loadStoredPageMetadata(n.pageId, n.pageIndex), this.viewMode === "page" && (this.showView("page"), this.pageViewer.show(n)), await this.saveCurrentPage(n.pageId);
	}
	async refreshCurrentPageOrder() {
		if (!this.page) return;
		let e = this.sessionPages.findIndex((e) => e.pageId === this.page?.pageId);
		e < 0 || (this.page = {
			...this.page,
			pageIndex: e,
			pageNumber: e + 1,
			pageCount: this.sessionPages.length
		}, await this.loadStoredPageMetadata(this.page.pageId, e), this.pageViewer.show(this.page), await this.saveCurrentPage(this.page.pageId));
	}
	moveThumbnail(e, t) {
		let [n] = this.thumbnails.splice(e, 1);
		this.thumbnails.splice(t, 0, n ? {
			...n,
			pageIndex: t,
			pageNumber: t + 1
		} : void 0), this.thumbnails = this.thumbnails.map((e, t) => e && {
			...e,
			pageIndex: t,
			pageNumber: t + 1
		});
	}
	async storePage(e, t, n) {
		let r = await this.toBlob(e, e.width, e.height);
		return n !== this.documentRun || !this.sessionPages.some((e) => e.pageId === t) || (await this.savePageBlob(this.pagePosition(t), r, Date.now(), e), n !== this.documentRun) ? null : (this.storedPageIds.add(t), this.viewMode === "thumbnails" && this.loadThumbnails([...this.thumbnailKeep]), r);
	}
	ensurePage(e, t) {
		let n = this.pageJobs.get(e);
		if (n) return n;
		let r = this.documentRun, i = this.file, a = this.pageQueue.catch(() => void 0).then(async () => {
			if (r !== this.documentRun || !i || t !== this.runId && e !== this.requestedPageId) return null;
			let n = this.sessionPages.find((t) => t.pageId === e);
			if (!n) return null;
			let a = this.memoryBlobs.get(e);
			if (a) return this.memoryBlobs.delete(e), this.memoryBlobs.set(e, a), a;
			let o = await this.sessionStore?.readPageBlobRecord(e);
			if (r !== this.documentRun) return null;
			if (o) return o.blob;
			if (this.sourceType !== "tiff" || !this.sourcePages.has(e)) return null;
			let s = await this.readViewerConfig();
			if (r !== this.documentRun) return null;
			let c = null;
			return await this.decoder.decodePage(i, n.sourcePageIndex, {
				pageCount() {},
				pageReady: async (t) => {
					r === this.documentRun && (c = await this.storePage(this.validateImportPage(t, t.pageIndex), e, r));
				}
			}, s.view), c;
		});
		return this.pageQueue = a, this.pageJobs.set(e, a), a.finally(() => {
			this.pageJobs.get(e) === a && this.pageJobs.delete(e);
		}).catch(() => void 0), a;
	}
	async prefetch(e, t) {
		if (this.sourceType !== "tiff") return;
		let n = this.documentRun;
		try {
			for (let n = 1; n <= fn; n++) for (let r of [t + n, t - n]) {
				if (e !== this.runId || this.viewMode !== "page") return;
				let t = this.sessionPages[r];
				t && await this.ensurePage(t.pageId, e);
			}
		} catch (e) {
			await this.failStoredDocumentPersistence(e, n);
		}
	}
	async loadStoredRaster(e, t) {
		let n = this.sessionPages[e]?.pageId;
		if (!n) return null;
		let r = await this.ensurePage(n, t);
		if (!r) return null;
		let i = await s(r);
		return {
			sourceName: this.sourceNames.get(n) ?? this.file?.name ?? "",
			pageIndex: e,
			pageNumber: e + 1,
			pageCount: this.sessionPages.length,
			...i,
			blob: r
		};
	}
	pagePosition(e) {
		let t = this.sessionPages.findIndex((t) => t.pageId === e);
		if (t < 0) throw Error("Stored viewer session is invalid.");
		return t;
	}
	async deleteSession() {
		this.sessionStore && await this.sessionStore.delete();
	}
	async failStoredDocumentPersistence(e, t) {
		t === this.documentRun && (await this.deleteSession().catch(() => void 0), t === this.documentRun && (this.clearView(), this.fail(e)));
	}
	state() {
		let e = this.status === "addingPages" || this.status === "loadingPage" || this.status === "loadingThumbnails" || this.status === "copyingSelection", t = !!this.page, n = this.page?.pageIndex ?? -1;
		return {
			viewMode: this.viewMode,
			status: this.status,
			sourceName: this.page?.sourceName ?? null,
			pageIndex: n,
			pageName: this.readPageName(),
			pageCount: this.pageCount,
			metadataPageCount: this.metadataPageIds.size,
			pageInfo: t && this.metadata.hasPage(n) ? this.metadata.pageInfo(n) : null,
			pageWidth: this.page?.width ?? null,
			pageHeight: this.page?.height ?? null,
			zoom: this.pageViewer.getZoom(),
			coordinates: this.coordinates,
			displayCoordinates: this.displayCoordinates,
			selectionCounts: this.selection.counts(),
			drawMode: this.pageViewer.getDrawMode(),
			canZoomIn: t && !e && this.pageViewer.canZoomIn(),
			canZoomOut: t && !e && this.pageViewer.canZoomOut(),
			canFitWidth: t && !e,
			canFitHeight: t && !e,
			canFitPage: t && !e,
			canActualSize: t && !e,
			canGoFirst: t && !e && n > 0,
			canGoPrevious: t && !e && n > 0,
			canGoNext: t && !e && n >= 0 && n < this.pageCount - 1,
			canGoLast: t && !e && n >= 0 && n < this.pageCount - 1,
			canShowThumbnails: this.pageCount > 0 && !e,
			canSearch: t && !e && this.metadata.hasPage(n),
			canDraw: t && !e,
			canClearSelection: t && !e,
			canCopy: t && !e && this.selection.hasTokens()
		};
	}
	async toPage(e, t, n = e.pageIndex, r) {
		let i = this.targetSize(e, t), a = r && i.width === e.width && i.height === e.height ? r : await this.toBlob(e, i.width, i.height);
		return {
			sourceName: e.sourceName,
			pageId: this.sessionPages[n].pageId,
			pageIndex: n,
			pageNumber: n + 1,
			pageCount: this.sessionPages.length || e.pageCount,
			width: i.width,
			height: i.height,
			url: URL.createObjectURL(a)
		};
	}
	pageIds() {
		return this.sessionPages.map((e) => e.pageId);
	}
	createPageRecords(e, t) {
		let n = [];
		for (let r = 0; r < e; r += 1) n.push(this.createPageRecord(r, r + 1, t));
		return n;
	}
	createPageRecord(e, t, n) {
		return {
			pageId: crypto.randomUUID(),
			documentId: L,
			sequenceNumber: t,
			sourcePageIndex: e,
			updatedAt: n
		};
	}
	validateImportPage(e, t) {
		let r = sn({
			width: e.width,
			height: e.height,
			xResolution: "xResolution" in e && typeof e.xResolution == "number" ? e.xResolution : 0,
			yResolution: "yResolution" in e && typeof e.yResolution == "number" ? e.yResolution : 0
		}, this.options.pageSize);
		if (!r.valid) throw new o(n, `${e.sourceName}: page ${t + 1} rejected. ${r.reason}`, {
			sourceName: e.sourceName,
			pageNumber: t + 1,
			width: e.width,
			height: e.height,
			tolerance: this.options.pageSize.tolerance,
			requiredTolerance: r.requiredTolerance
		});
		if (!e.sourceType) throw Error("AuroraLens: decoded page is missing source type.");
		return {
			...e,
			sourceType: e.sourceType,
			xResolution: r.xResolution,
			yResolution: r.yResolution,
			documentType: r.documentType,
			physicalWidth: r.physicalWidth,
			physicalHeight: r.physicalHeight
		};
	}
	targetSize(e, t) {
		if (!t) return {
			width: e.width,
			height: e.height
		};
		let n = Math.min(1, t / Math.max(e.width, e.height));
		return {
			width: Math.max(1, Math.ceil(e.width * n)),
			height: Math.max(1, Math.ceil(e.height * n))
		};
	}
	toBlob(e, t, n) {
		let r = document.createElement("canvas");
		r.width = e.width, r.height = e.height;
		let i = r.getContext("2d");
		if (!i) throw Error("AuroraLens: canvas 2D context is not available.");
		i.putImageData(new ImageData(e.pixels, e.width, e.height), 0, 0);
		let a = t === e.width && n === e.height ? r : document.createElement("canvas");
		if (a !== r) {
			a.width = t, a.height = n;
			let e = a.getContext("2d");
			if (!e) throw Error("AuroraLens: canvas 2D context is not available.");
			e.imageSmoothingEnabled = !0, e.imageSmoothingQuality = "high", e.drawImage(r, 0, 0, t, n);
		}
		return new Promise((e, t) => {
			a.toBlob((n) => {
				if (r.width = 0, r.height = 0, a.width = 0, a.height = 0, !n) {
					t(/* @__PURE__ */ Error("AuroraLens: canvas did not produce a PNG blob."));
					return;
				}
				e(n);
			}, "image/png");
		});
	}
};
//#endregion
export { pn as AuroraLens, Et as IndexedDbViewerSessionStore };
