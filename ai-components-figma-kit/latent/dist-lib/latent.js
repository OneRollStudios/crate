import { Fragment as e, jsx as t, jsxs as n } from "react/jsx-runtime";
import { useCallback as r, useEffect as i, useMemo as a, useRef as o, useState as s } from "react";
//#region src/lib/utils/cn.ts
function c(...e) {
	return e.filter(Boolean).join(" ");
}
//#endregion
//#region src/lib/components/Button.tsx
function l({ variant: e = "ghost", size: n = "md", className: r, ...i }) {
	return /* @__PURE__ */ t("button", {
		className: c("lt-btn", e === "amber" ? "lt-btn--amber" : "lt-btn--ghost", n === "sm" && "lt-btn--sm", r),
		...i
	});
}
//#endregion
//#region src/lib/components/PromptComposer.tsx
function u({ placeholder: e = "Ask anything…", onSubmit: r, value: i, onChange: a, busy: l = !1, onStop: u, toolbar: d, className: f, autoFocus: p }) {
	let [m, h] = s(""), g = i ?? m, _ = o(null), v = (e) => {
		i === void 0 && h(e), a?.(e);
		let t = _.current;
		t && (t.style.height = "auto", t.style.height = `${Math.min(t.scrollHeight, 160)}px`);
	}, y = () => {
		let e = g.trim();
		if (!e || l) return;
		r?.(e), i === void 0 && h("");
		let t = _.current;
		t && (t.style.height = "auto");
	}, b = (e) => {
		e.key === "Enter" && !e.shiftKey && (e.preventDefault(), y());
	}, x = g.trim().length > 0;
	return /* @__PURE__ */ n("div", {
		className: c("lt-composer", f),
		children: [/* @__PURE__ */ n("div", {
			className: "lt-composer__row",
			children: [/* @__PURE__ */ t("textarea", {
				ref: _,
				rows: 1,
				value: g,
				placeholder: e,
				"aria-label": "Prompt",
				autoFocus: p,
				onChange: (e) => v(e.target.value),
				onKeyDown: b
			}), l ? /* @__PURE__ */ t("button", {
				className: "lt-composer__send",
				"aria-label": "Stop generating",
				onClick: u,
				style: {
					background: "var(--lt-line-2)",
					color: "var(--lt-text)"
				},
				children: "■"
			}) : /* @__PURE__ */ t("button", {
				className: "lt-composer__send",
				"aria-label": "Send",
				disabled: !x,
				onClick: y,
				children: "↑"
			})]
		}), d && /* @__PURE__ */ t("div", {
			className: "lt-composer__bar",
			children: d
		})]
	});
}
function d({ label: e, icon: r = "＋", onClick: i }) {
	return /* @__PURE__ */ n("button", {
		className: "lt-composer__attach",
		onClick: i,
		type: "button",
		children: [/* @__PURE__ */ t("span", {
			"aria-hidden": !0,
			children: r
		}), e]
	});
}
//#endregion
//#region src/lib/components/StreamingReply.tsx
var f = () => typeof window < "u" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function p({ text: e, speed: r = 20, caret: a = !0, loop: l = !1, loopDelay: u = 4200, onDone: d, className: p }) {
	let [m, h] = s(""), [g, _] = s(!0), v = o(void 0);
	return i(() => {
		if (r === 0 || f()) {
			h(e), _(!1), d?.();
			return;
		}
		let t = 0, n = () => {
			t += 1, h(e.slice(0, t)), t < e.length ? v.current = setTimeout(n, r + r * 2 * Math.random()) : (_(!1), d?.(), l && (v.current = setTimeout(() => {
				t = 0, h(""), _(!0), n();
			}, u)));
		};
		return h(""), _(!0), n(), () => clearTimeout(v.current);
	}, [
		e,
		r,
		l,
		u
	]), /* @__PURE__ */ n("p", {
		className: c("lt-stream", p),
		"aria-live": "polite",
		children: [m, a && g && /* @__PURE__ */ t("span", {
			className: "lt-caret",
			"aria-hidden": !0
		})]
	});
}
//#endregion
//#region src/lib/components/ReasoningTrace.tsx
function m({ summary: e, steps: r = [], live: i = !1, defaultOpen: a = !1, className: o }) {
	let [l, u] = s(a), d = r.length > 0;
	return /* @__PURE__ */ n("div", {
		className: c("lt-trace", o),
		"data-open": l,
		children: [/* @__PURE__ */ n("button", {
			className: "lt-trace__head",
			onClick: () => d && u((e) => !e),
			"aria-expanded": d ? l : void 0,
			type: "button",
			style: { cursor: d ? "pointer" : "default" },
			children: [
				i && /* @__PURE__ */ t("span", {
					className: "lt-pulse",
					"aria-hidden": !0
				}),
				/* @__PURE__ */ t("span", { children: e }),
				d && /* @__PURE__ */ t("span", {
					className: "lt-chev",
					"aria-hidden": !0,
					children: "▶"
				})
			]
		}), l && d && /* @__PURE__ */ t("div", {
			className: "lt-trace__body",
			children: r.map((e, r) => /* @__PURE__ */ n("div", {
				className: "lt-trace__step",
				children: [/* @__PURE__ */ n("span", { children: [
					r + 1,
					". ",
					e.label
				] }), e.duration && /* @__PURE__ */ t("span", {
					className: "lt-t",
					children: e.duration
				})]
			}, r))
		})]
	});
}
//#endregion
//#region src/lib/components/ToolCall.tsx
var h = {
	running: "running",
	done: "done",
	error: "error"
};
function g({ name: e, args: r = "", state: i = "done", payload: a, className: o }) {
	return /* @__PURE__ */ n("div", {
		className: c("lt-tool", o),
		children: [/* @__PURE__ */ n("div", {
			className: "lt-tool__head",
			children: [
				/* @__PURE__ */ t("span", {
					className: "lt-k",
					"aria-hidden": !0,
					children: "⚙ tool"
				}),
				/* @__PURE__ */ n("span", { children: [
					e,
					"(",
					r,
					")"
				] }),
				/* @__PURE__ */ t("span", {
					className: "lt-tool__state",
					"data-state": i,
					children: h[i]
				})
			]
		}), a && /* @__PURE__ */ t("div", {
			className: "lt-tool__payload",
			children: a
		})]
	});
}
//#endregion
//#region src/lib/components/Citations.tsx
function _({ items: r, className: i }) {
	return /* @__PURE__ */ t("div", {
		className: c("lt-cites", i),
		children: r.map((r, i) => {
			let a = /* @__PURE__ */ n(e, { children: [r.label, r.preview && /* @__PURE__ */ t("span", {
				className: "lt-cite__pop",
				children: r.preview
			})] });
			return r.href ? /* @__PURE__ */ t("a", {
				className: "lt-cite",
				href: r.href,
				target: "_blank",
				rel: "noreferrer",
				children: a
			}, i) : /* @__PURE__ */ t("span", {
				className: "lt-cite",
				tabIndex: 0,
				children: a
			}, i);
		})
	});
}
//#endregion
//#region src/lib/components/ModelPicker.tsx
function v({ models: e, value: r, onChange: i, className: a }) {
	return /* @__PURE__ */ t("div", {
		className: c("lt-models", a),
		role: "radiogroup",
		"aria-label": "Model",
		children: e.map((e) => /* @__PURE__ */ n("button", {
			className: "lt-model",
			role: "radio",
			"aria-checked": e.id === r,
			"aria-pressed": e.id === r,
			onClick: () => i?.(e.id),
			type: "button",
			children: [e.name, e.meta && /* @__PURE__ */ t("small", { children: e.meta })]
		}, e.id))
	});
}
//#endregion
//#region src/lib/components/TokenMeter.tsx
var y = (e) => e.toLocaleString("en-US");
function b({ used: e, max: r, label: i = "tokens", warnAt: a = .85, cost: o, className: s }) {
	let l = r > 0 ? Math.min(e / r, 1) : 0, u = l >= a;
	return /* @__PURE__ */ t("div", {
		className: c("lt-meter", s),
		children: /* @__PURE__ */ n("div", {
			className: "lt-meter__row",
			children: [
				/* @__PURE__ */ t("span", { children: i }),
				/* @__PURE__ */ t("span", {
					className: "lt-meter__bar",
					children: /* @__PURE__ */ t("i", {
						style: { width: `${l * 100}%` },
						"data-warn": u
					})
				}),
				/* @__PURE__ */ n("span", { children: [
					y(e),
					" / ",
					y(r)
				] }),
				o && /* @__PURE__ */ n("span", {
					style: { color: "var(--lt-faint)" },
					children: ["· ", o]
				})
			]
		})
	});
}
//#endregion
//#region src/lib/components/AgentTimeline.tsx
function x({ steps: e, className: r }) {
	return /* @__PURE__ */ t("div", {
		className: c("lt-timeline", r),
		children: e.map((e, r) => {
			let i = e.status ?? "pending";
			return /* @__PURE__ */ n("div", {
				className: "lt-tl-step",
				children: [/* @__PURE__ */ n("div", {
					className: "lt-tl-step__rail",
					children: [/* @__PURE__ */ t("span", {
						className: "lt-tl-step__dot",
						"data-status": i,
						"aria-hidden": !0,
						children: i === "done" ? "✓" : ""
					}), /* @__PURE__ */ t("span", { className: "lt-tl-step__line" })]
				}), /* @__PURE__ */ n("div", {
					className: "lt-tl-step__body",
					children: [/* @__PURE__ */ t("div", {
						className: "lt-tl-step__title",
						children: e.title
					}), e.meta && /* @__PURE__ */ t("div", {
						className: "lt-tl-step__meta",
						children: e.meta
					})]
				})]
			}, r);
		})
	});
}
//#endregion
//#region src/lib/components/DiffSuggestion.tsx
function S({ title: e = "Suggested edit", lines: r, onAccept: i, onReject: a, className: o }) {
	return /* @__PURE__ */ n("div", {
		className: c("lt-diff", o),
		children: [/* @__PURE__ */ n("div", {
			className: "lt-diff__body",
			children: [e && /* @__PURE__ */ t("div", {
				className: "lt-mono",
				style: {
					color: "var(--lt-faint)",
					fontSize: 11,
					marginBottom: 6
				},
				children: e
			}), r.map((e, t) => /* @__PURE__ */ n("span", {
				className: c("lt-diff__line", e.type === "add" && "lt-diff__line--add", e.type === "del" && "lt-diff__line--del"),
				children: [e.type === "add" ? "+ " : e.type === "del" ? "- " : "  ", e.text]
			}, t))]
		}), /* @__PURE__ */ n("div", {
			className: "lt-diff__foot",
			children: [/* @__PURE__ */ t(l, {
				variant: "amber",
				size: "sm",
				onClick: i,
				children: "✓ Accept"
			}), /* @__PURE__ */ t(l, {
				variant: "ghost",
				size: "sm",
				onClick: a,
				children: "Reject"
			})]
		})]
	});
}
//#endregion
//#region src/lib/components/CommandPalette.tsx
function C({ commands: e, open: r, onClose: l, placeholder: u = "Type a command or search…", className: d }) {
	let [f, p] = s(""), [m, h] = s(0), g = o(null), _ = a(() => {
		let t = f.trim().toLowerCase();
		return t ? e.filter((e) => e.label.toLowerCase().includes(t)) : e;
	}, [e, f]);
	if (i(() => {
		if (r) {
			p(""), h(0);
			let e = setTimeout(() => g.current?.focus(), 0);
			return () => clearTimeout(e);
		}
	}, [r]), i(() => h(0), [f]), i(() => {
		if (!r) return;
		let e = (e) => {
			if (e.key === "Escape") e.preventDefault(), l();
			else if (e.key === "ArrowDown") e.preventDefault(), h((e) => Math.min(e + 1, _.length - 1));
			else if (e.key === "ArrowUp") e.preventDefault(), h((e) => Math.max(e - 1, 0));
			else if (e.key === "Enter") {
				e.preventDefault();
				let t = _[m];
				t && (t.run?.(), l());
			}
		};
		return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
	}, [
		r,
		_,
		m,
		l
	]), !r) return null;
	let v = [];
	for (let e of _) {
		let t = e.group ?? "", n = v.find((e) => e.name === t);
		n || (n = {
			name: t,
			items: []
		}, v.push(n)), n.items.push(e);
	}
	return /* @__PURE__ */ t("div", {
		className: "lt-cmdk-overlay",
		onMouseDown: (e) => e.target === e.currentTarget && l(),
		children: /* @__PURE__ */ n("div", {
			className: c("lt-cmdk", d),
			role: "dialog",
			"aria-modal": "true",
			children: [/* @__PURE__ */ t("input", {
				ref: g,
				className: "lt-cmdk__input",
				placeholder: u,
				value: f,
				onChange: (e) => p(e.target.value),
				"aria-label": "Command"
			}), /* @__PURE__ */ n("div", {
				className: "lt-cmdk__list",
				children: [_.length === 0 && /* @__PURE__ */ t("div", {
					className: "lt-cmdk__group",
					children: "No results"
				}), v.map((e) => /* @__PURE__ */ n("div", { children: [e.name && /* @__PURE__ */ t("div", {
					className: "lt-cmdk__group",
					children: e.name
				}), e.items.map((e) => {
					let r = _.indexOf(e);
					return /* @__PURE__ */ n("div", {
						className: "lt-cmdk__item",
						"data-active": r === m,
						onMouseEnter: () => h(r),
						onClick: () => {
							e.run?.(), l();
						},
						children: [
							/* @__PURE__ */ t("span", {
								className: "lt-ico",
								"aria-hidden": !0,
								children: e.icon ?? "›"
							}),
							/* @__PURE__ */ t("span", { children: e.label }),
							e.hint && /* @__PURE__ */ t("span", {
								className: "lt-hint",
								children: e.hint
							})
						]
					}, e.id);
				})] }, e.name || "_"))]
			})]
		})
	});
}
function w() {
	let [e, t] = s(!1);
	return i(() => {
		let e = (e) => {
			(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" && (e.preventDefault(), t((e) => !e));
		};
		return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
	}, []), {
		open: e,
		setOpen: t,
		close: () => t(!1)
	};
}
//#endregion
//#region src/lib/components/Guardrail.tsx
function T({ title: e = "I can't help with that", children: r, onRetry: i, onLearnMore: a, className: o }) {
	return /* @__PURE__ */ n("div", {
		className: c("lt-guard", o),
		role: "alert",
		children: [/* @__PURE__ */ t("span", {
			className: "lt-guard__icon",
			"aria-hidden": !0,
			children: "⚠"
		}), /* @__PURE__ */ n("div", { children: [
			/* @__PURE__ */ t("div", {
				className: "lt-guard__title",
				children: e
			}),
			/* @__PURE__ */ t("div", {
				className: "lt-guard__body",
				children: r
			}),
			(i || a) && /* @__PURE__ */ n("div", {
				className: "lt-guard__actions",
				children: [i && /* @__PURE__ */ t(l, {
					variant: "ghost",
					size: "sm",
					onClick: i,
					children: "↻ Rephrase"
				}), a && /* @__PURE__ */ t(l, {
					variant: "ghost",
					size: "sm",
					onClick: a,
					children: "Why?"
				})]
			})
		] })]
	});
}
//#endregion
//#region src/lib/components/Feedback.tsx
function E({ value: e, onRate: r, onRegenerate: i, onCopy: a, className: o }) {
	let [l, u] = s(null), d = e === void 0 ? l : e, f = (t) => {
		let n = d === t ? null : t;
		e === void 0 && u(n), r?.(n);
	};
	return /* @__PURE__ */ n("div", {
		className: c("lt-feedback", o),
		children: [
			/* @__PURE__ */ t("button", {
				className: "lt-fb-btn",
				"aria-pressed": d === "up",
				"aria-label": "Good response",
				onClick: () => f("up"),
				type: "button",
				children: "▲ good"
			}),
			/* @__PURE__ */ t("button", {
				className: "lt-fb-btn",
				"aria-pressed": d === "down",
				"aria-label": "Bad response",
				onClick: () => f("down"),
				type: "button",
				children: "▼"
			}),
			i && /* @__PURE__ */ t("button", {
				className: "lt-fb-btn",
				onClick: i,
				type: "button",
				children: "↻ retry"
			}),
			a && /* @__PURE__ */ t("button", {
				className: "lt-fb-btn",
				onClick: a,
				type: "button",
				children: "⧉ copy"
			})
		]
	});
}
//#endregion
//#region src/lib/components/ConversationThread.tsx
function D({ path: e = "latent://playground", children: r, footer: i, className: a, threadHeight: o }) {
	return /* @__PURE__ */ n("div", {
		className: c("lt-demo", a),
		children: [
			/* @__PURE__ */ n("div", {
				className: "lt-demo-top",
				children: [/* @__PURE__ */ t("span", {
					className: "lt-path",
					children: e
				}), /* @__PURE__ */ n("span", {
					className: "lt-lights",
					"aria-hidden": !0,
					children: [
						/* @__PURE__ */ t("i", {}),
						/* @__PURE__ */ t("i", {}),
						/* @__PURE__ */ t("i", {})
					]
				})]
			}),
			/* @__PURE__ */ t("div", {
				className: "lt-thread",
				style: o ? { height: o } : void 0,
				children: r
			}),
			i && /* @__PURE__ */ t("div", { children: i })
		]
	});
}
function O({ role: e, children: n, className: r }) {
	return /* @__PURE__ */ t("div", {
		className: c("lt-msg", e === "user" ? "lt-msg--user" : "lt-msg--ai", r),
		children: n
	});
}
//#endregion
//#region src/lib/hooks/useTheme.ts
var k = "latent-theme";
function A() {
	return typeof window > "u" || window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function j() {
	if (typeof window > "u") return "dark";
	let e = window.localStorage.getItem(k);
	return e === "light" || e === "dark" ? e : A();
}
function M() {
	let [e, t] = s(j);
	return i(() => {
		document.documentElement.setAttribute("data-theme", e);
		try {
			window.localStorage.setItem(k, e);
		} catch {}
	}, [e]), {
		theme: e,
		setTheme: r((e) => t(e), []),
		toggle: r(() => t((e) => e === "dark" ? "light" : "dark"), [])
	};
}
//#endregion
export { x as AgentTimeline, d as AttachButton, l as Button, _ as Citations, C as CommandPalette, D as ConversationThread, S as DiffSuggestion, E as Feedback, T as Guardrail, O as Message, v as ModelPicker, u as PromptComposer, m as ReasoningTrace, p as StreamingReply, b as TokenMeter, g as ToolCall, c as cn, w as useCommandPalette, M as useTheme };
