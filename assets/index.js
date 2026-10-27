"use strict";
(() => {
  // src/components/radio.ts
  var TAG_NAME = {
    radio: "ram-radio",
    option: "ram-radio-option",
    slider: "ram-radio-slider"
  };
  var RampikeRadio = class extends HTMLElement {
    get value() {
      return this.getAttribute("value") ?? "";
    }
    set value(v2) {
      this.select(v2);
    }
    options = [];
    slider = null;
    select(v2 = this.value) {
      const oldValue = this.value;
      if (oldValue !== v2) {
        this.setAttribute("value", v2);
        this.dispatchEvent(new CustomEvent("r-change", {
          detail: {
            oldValue,
            newValue: v2
          }
        }));
      }
      this.options.forEach((item) => item.selected = this.value === item.key);
      const selected = this.options.find((item) => this.value === item.key) ?? null;
      if (selected) {
        this.slider?.connect(selected);
      }
    }
    update() {
      const options = Array.from(this.querySelectorAll(TAG_NAME.option));
      const groupFilter = (o) => torpedo(
        o,
        (t) => t.tagName === TAG_NAME.radio.toUpperCase()
      ) === this;
      this.options = options.filter(groupFilter);
      const slider = this.querySelector(TAG_NAME.slider);
      this.slider = slider && groupFilter(slider) ? slider : null;
      this.style.setProperty("--option-count", `${this.options.length}`);
    }
    constructor() {
      super();
      this.style.position = "relative";
      setTimeout(() => {
        this.update();
        this.select();
      }, 0);
    }
  };
  var RampikeRadioOption = class extends HTMLElement {
    get selected() {
      return this.getAttribute("selected") === "true";
    }
    set selected(v2) {
      if (v2)
        this.setAttribute("selected", "true");
      else
        this.removeAttribute("selected");
    }
    get key() {
      return this.getAttribute("key") ?? "";
    }
    set key(v2) {
      this.setAttribute("key", v2);
    }
    constructor() {
      super();
      this.style.position = "relative";
      const seeker = (candidate) => candidate.tagName === TAG_NAME.radio.toUpperCase();
      const parent = torpedo(this, seeker);
      if (!parent) return;
      this.addEventListener("click", () => parent.value = this.key);
    }
  };
  var RampikeRadioSlider = class extends HTMLElement {
    target;
    connect(target) {
      this.target = target;
      const container = torpedo(this, (t) => t.tagName === TAG_NAME.radio.toUpperCase());
      const containerBox = container.getBoundingClientRect();
      const targetBox = target.getBoundingClientRect();
      this.style.left = `${targetBox.left - containerBox.left}px`;
      this.style.right = `${containerBox.right - targetBox.right}px`;
    }
    constructor() {
      super();
      this.style.position = "absolute";
      this.style.top = "0";
      this.style.bottom = "0";
      const observer = new IntersectionObserver(() => this.target && this.connect(this.target));
      observer.observe(this);
    }
  };
  function define() {
    window.customElements.define(TAG_NAME.radio, RampikeRadio);
    window.customElements.define(TAG_NAME.option, RampikeRadioOption);
    window.customElements.define(TAG_NAME.slider, RampikeRadioSlider);
  }
  function torpedo(origin, seeker) {
    while (true) {
      const parent = origin.parentElement;
      if (!parent) return null;
      if (seeker(parent)) return parent;
      origin = parent;
    }
  }

  // src/components/tabs.ts
  var TAG_NAME2 = {
    button: "ram-tab-button",
    tab: "ram-tab",
    tabs: "ram-tabs"
  };
  var RampikeTab = class extends HTMLElement {
    get key() {
      return this.getAttribute("key") ?? "";
    }
    set key(value) {
      this.setAttribute("key", value);
    }
    constructor() {
      super();
      this.style.display = "contents";
    }
  };
  var RampikeTabContainer = class extends HTMLElement {
    static get observedAttributes() {
      return ["tab"];
    }
    attributeChangedCallback(name, oldValue, value) {
      if (name !== "tab") return;
      if (oldValue === value) return;
      this.tab = value;
    }
    constructor() {
      super();
      this.style.display = "contents";
      this.update();
    }
    get tab() {
      return this.getAttribute("tab") ?? "";
    }
    set tab(value) {
      if (value === this.tab) return;
      this.setAttribute("tab", value);
      this.update();
    }
    update() {
      const value = this.tab;
      this.querySelectorAll(TAG_NAME2.tab).forEach((tab) => {
        if (findParentTabContainer(tab)?.id !== this.id) return;
        const hidden = tab.key !== value;
        tab.hidden = hidden;
        tab.style.display = hidden ? "none" : "contents";
      });
      if (this.id) {
        const buttons = document.querySelectorAll(`${TAG_NAME2.button}[for="${this.id}"]`);
        buttons.forEach((b2) => {
          b2.active = b2.tab === value;
        });
      }
    }
  };
  var RampikeTabButton = class extends HTMLElement {
    get tab() {
      return this.getAttribute("tab");
    }
    get targetContainer() {
      return this.getAttribute("for");
    }
    get active() {
      return this.getAttribute("tab-active") === "true";
    }
    set active(value) {
      if (value)
        this.setAttribute("tab-active", "true");
      else
        this.removeAttribute("tab-active");
    }
    constructor() {
      super();
      this.addEventListener("click", () => {
        const containerId = this.getAttribute("for");
        const tab = this.getAttribute("tab");
        if (!containerId || !tab) return;
        const container = document.querySelector(`${TAG_NAME2.tabs}#${containerId}`);
        if (!container) return;
        container.tab = tab;
      });
    }
  };
  function define2() {
    window.customElements.define(TAG_NAME2.tab, RampikeTab);
    window.customElements.define(TAG_NAME2.tabs, RampikeTabContainer);
    window.customElements.define(TAG_NAME2.button, RampikeTabButton);
  }
  function findParentTabContainer(origin) {
    let target = origin.parentElement;
    while (target !== null && target.tagName !== TAG_NAME2.tabs.toUpperCase()) {
      target = target.parentElement;
    }
    return target;
  }

  // ../../node_modules/rampike/dist/index.js
  function E(e = {}) {
    let { tagName: t, elementOptions: r } = e, o = document.createElement(t ?? "div", r);
    return d(o, e);
  }
  function d(e, { attributes: t, className: r, style: o, events: l, signal: s, contents: n } = {}) {
    if (r !== void 0 && (e.className = r), typeof n == "string" ? e.textContent = n : n && e.replaceChildren(...n.filter(f)), o && "style" in e) {
      let i = e.style;
      for (let [a, m2] of Object.entries(o)) a.includes("-") ? i.setProperty(a, m2 ?? null) : i[a] = m2 ?? "";
    }
    if (t) for (let [i, a] of Object.entries(t)) a === null ? e.removeAttribute(i) : a !== void 0 && e.setAttribute(i, String(a));
    if (l) for (let i of c(l)) {
      let a = l[i];
      a && e.addEventListener(i, (m2) => a(m2, e), { signal: s });
    }
    return e;
  }
  function f(e) {
    return e != null && e !== false;
  }
  function c(e) {
    return Object.keys(e);
  }
  function R(e) {
    let t = document.createElement("template");
    return t.innerHTML = e, t;
  }
  function k(e) {
    let t = e.content.firstElementChild;
    return t ? document.importNode(t, true) : null;
  }
  function p(e) {
    let t = document.importNode(e.content, true);
    return Array.from(t.children);
  }
  function N(e, t, r) {
    let o = e, l = r ?? "rampike";
    return o[l] = t, o;
  }
  function y(e, t) {
    let r = /* @__PURE__ */ new Map(), o = (n) => {
      let i = n.getAttribute("data-ref");
      r.has(i) || r.set(i, n);
    };
    for (let n of e instanceof Node ? [e] : e) n instanceof Element && n.hasAttribute("data-ref") && o(n), n.querySelectorAll("[data-ref]").forEach(o);
    let l = T(t) ? t.map((n) => [n, HTMLElement]) : Object.entries(t), s = {};
    for (let [n, i] of l) {
      let a = r.get(n);
      if (!a) throw new Error(`rampike: missing [data-ref="${n}"]`);
      let m2 = a.localName;
      if (!(a instanceof i)) throw new Error(`rampike: [data-ref="${n}"] is <${m2}>, expected ${i.name}`);
      s[n] = a;
    }
    return s;
  }
  function h(e, t) {
    let r = p(e), [o] = r;
    if (!o) throw new Error("rampike: template has no root element");
    return { root: o, roots: r, refs: y(r, t ?? []) };
  }
  function T(e) {
    return Array.isArray(e);
  }

  // src/components/modal.ts
  var RampikeModal = class extends HTMLElement {
    dialog;
    open() {
      if (this.dialog.open) return;
      this.dialog.showModal();
    }
    close() {
      if (!this.dialog.open) return;
      this.dialog.close();
    }
    constructor() {
      super();
      this.style.display = "contents";
      const contents = Array.from(this.childNodes);
      const form = E({
        tagName: "form",
        attributes: {
          method: "dialog"
        },
        events: {
          submit: (e) => e.preventDefault()
        }
      });
      this.dialog = E({
        tagName: "dialog",
        events: {
          click: (e, el) => {
            if (e.target === el && !this.hasAttribute("strong")) el.close();
          }
        },
        contents: [form]
      });
      this.append(this.dialog);
      contents.forEach((e) => form.appendChild(e));
    }
  };
  function define3(name) {
    window.customElements.define(name, RampikeModal);
  }

  // src/components/pagination.ts
  var RampikePages = class extends HTMLElement {
    readAttribute(key, def) {
      const raw = this.getAttribute(key);
      return raw ? parseInt(raw, 10) : def;
    }
    get page() {
      return this.readAttribute("page", 0);
    }
    set page(value) {
      this.setAttribute("page", `${value}`);
      this.update();
    }
    get distance() {
      return this.readAttribute("distance", 3);
    }
    set distance(value) {
      this.setAttribute("distance", `${value}`);
      this.update();
    }
    get pageCount() {
      return this.readAttribute("page-count", 0);
    }
    set pageCount(value) {
      this.setAttribute("page-count", `${value}`);
      this.update();
    }
    links() {
      const r = [];
      let jam = false;
      for (let i = 0; i < this.pageCount; ++i) {
        const distances = [
          Math.abs(i - 0),
          Math.abs(i - this.page),
          Math.abs(i - (this.pageCount - 1))
        ];
        if (Math.min(...distances) < this.distance) {
          r.push(i);
          jam = false;
        } else {
          if (!jam)
            r.push(-1);
          jam = true;
        }
      }
      return r;
    }
    update() {
      this.innerHTML = "";
      this.append(...this.links().map((page) => {
        const current2 = page === this.page;
        const ellipsis = page === -1;
        const contents = ellipsis ? "\u2026" : `${page + 1}`;
        const events = ellipsis || current2 ? {} : {
          "click": () => this.pick(page)
        };
        const attributes = current2 ? { "data-current": "" } : {};
        const className = ellipsis ? this.getAttribute("class-ellipsi") : this.getAttribute("class-buttons");
        return E({
          tagName: ellipsis ? "span" : "button",
          className: className ?? void 0,
          attributes,
          events,
          contents
        });
      }));
    }
    pick(page) {
      this.page = page;
      this.dispatchEvent(new CustomEvent("pick", {
        detail: {
          page
        }
        // bubbles: true,
        // cancelable: true
      }));
    }
    constructor() {
      super();
      this.update();
    }
  };
  function define4(tagName = "ram-page") {
    window.customElements.define(tagName, RampikePages);
  }

  // src/components/import.ts
  var parser = new DOMParser();
  var RampikeSVGImport = class extends HTMLElement {
    constructor() {
      super();
      const path = this.getAttribute("path");
      const attributes = this.getAttributeNames().filter((a) => a !== "path").map((name) => [name, this.getAttribute(name)]);
      if (!path) return;
      fetch(path).then(async (response) => {
        if (response.ok) {
          const raw = await response.text();
          const candidates = Array.from(parser.parseFromString(raw, "image/svg+xml").children);
          const parsed = candidates.find((c2) => c2.tagName.toLowerCase() === "svg");
          if (!parsed) return;
          for (const [a, v2] of attributes) {
            parsed.setAttribute(a, v2);
          }
          this.parentElement?.replaceChild(parsed, this);
        }
        ;
      });
    }
  };
  function define5(tagName) {
    window.customElements.define(tagName, RampikeSVGImport);
  }

  // src/components/filepicker.ts
  var _RampikeFilePicker = class extends HTMLElement {
    get input() {
      return this.querySelector(`input[type="file"]`);
    }
    get value() {
      return this.input.value;
    }
    constructor() {
      super();
      const input = E({
        tagName: "input",
        attributes: {
          type: "file",
          accept: this.getAttribute("accept") ?? ""
        },
        style: {
          display: "none"
        }
      });
      const contents = E({
        tagName: "label",
        style: {
          display: "contents"
        },
        contents: [
          input,
          ...Array.from(this.children)
        ]
      });
      if (this.hasAttribute("multiple"))
        input.setAttribute("multiple", "");
      this.append(contents);
    }
  };
  function define6(tagName) {
    window.customElements.define(tagName, _RampikeFilePicker);
  }

  // src/components/fieldset.ts
  var RampikeLabeled = class extends HTMLElement {
    constructor() {
      super();
      const legend = this.getAttribute("legend") ?? "";
      const multiline = this.hasAttribute("multiline");
      const attributes = Object.fromEntries(
        this.getAttributeNames().filter((a) => a !== "legend" && a !== "multiline").map((name) => [name, this.getAttribute(name)])
      );
      if (!multiline) attributes.type = "text";
      const contents = E({
        tagName: "fieldset",
        contents: [
          E({
            tagName: "legend",
            attributes: {
              for: attributes.id
            },
            contents: legend
          }),
          E({
            tagName: multiline ? "textarea" : "input",
            attributes
          })
        ]
      });
      this.parentElement?.replaceChild(contents, this);
    }
  };
  function define7(tagName) {
    window.customElements.define(tagName, RampikeLabeled);
  }

  // src/units/toasts.ts
  function toast(message, options) {
    const list = document.querySelector("#toast-container");
    const rects = Array.from(list.children).map((t) => t.getBoundingClientRect());
    const totalH = rects.reduce((p2, c2) => p2 + c2.height, 0);
    let closed = false;
    const actions = options?.actions ? options.actions.map(
      ([caption, cb]) => E({
        tagName: "button",
        className: "lineout",
        contents: caption,
        events: {
          click: () => !closed && cb(close)
        }
      })
    ) : [];
    const item = E({
      tagName: "div",
      className: "toast list pointer",
      contents: [
        E({
          tagName: "div",
          contents: message
        }),
        E({
          tagName: "div",
          className: "row-compact jc-end",
          style: actions.length ? {} : { display: "none" },
          contents: actions
        })
      ],
      style: {
        left: "var(--gap)",
        bottom: `calc(${totalH}px + var(--gap) * ${rects.length + 1})`,
        transform: "translateX(calc(-100% - var(--gap) * 2))"
      },
      events: {
        click: () => !options?.actions && close()
      }
    });
    function close() {
      if (closed) return;
      closed = true;
      const { width } = item.getBoundingClientRect();
      item.style.left = `calc(${-width}px - var(--gap))`;
      item.addEventListener("transitionend", () => {
        item.remove();
        squish();
      });
    }
    if (options?.parent) {
      item.style.position = "unset";
      options?.parent.append(item);
    } else {
      list.append(item);
    }
    setTimeout(() => item.style.transform = `translateX(0px)`, 100);
    if (options?.timeoutMS) {
      setTimeout(close, options.timeoutMS);
    }
    return close;
  }
  function squish() {
    const list = document.querySelector("#toast-container");
    let totalH = 0;
    const items = Array.from(list.children);
    items.forEach((item, ix) => {
      const { height } = item.getBoundingClientRect();
      item.style.bottom = `calc(${totalH}px + var(--gap) * ${ix + 1})`;
      totalH += height;
    });
  }

  // ../../node_modules/marked/lib/marked.esm.js
  function M() {
    return { async: false, breaks: false, extensions: null, gfm: true, hooks: null, pedantic: false, renderer: null, silent: false, tokenizer: null, walkTokens: null };
  }
  var O = M();
  function G(u3) {
    O = u3;
  }
  var _ = { exec: () => null };
  function k2(u3, e = "") {
    let t = typeof u3 == "string" ? u3 : u3.source, n = { replace: (r, i) => {
      let s = typeof i == "string" ? i : i.source;
      return s = s.replace(m.caret, "$1"), t = t.replace(r, s), n;
    }, getRegex: () => new RegExp(t, e) };
    return n;
  }
  var be = (() => {
    try {
      return !!new RegExp("(?<=1)(?<!1)");
    } catch {
      return false;
    }
  })();
  var m = { codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm, outputLinkReplace: /\\([\[\]])/g, indentCodeCompensation: /^(\s+)(?:```)/, beginningSpace: /^\s+/, endingHash: /#$/, startingSpaceChar: /^ /, endingSpaceChar: / $/, nonSpaceChar: /[^ ]/, newLineCharGlobal: /\n/g, tabCharGlobal: /\t/g, multipleSpaceGlobal: /\s+/g, blankLine: /^[ \t]*$/, doubleBlankLine: /\n[ \t]*\n[ \t]*$/, blockquoteStart: /^ {0,3}>/, blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g, blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm, listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g, listIsTask: /^\[[ xX]\] +\S/, listReplaceTask: /^\[[ xX]\] +/, listTaskCheckbox: /\[[ xX]\]/, anyLine: /\n.*\n/, hrefBrackets: /^<(.*)>$/, tableDelimiter: /[:|]/, tableAlignChars: /^\||\| *$/g, tableRowBlankLine: /\n[ \t]*$/, tableAlignRight: /^ *-+: *$/, tableAlignCenter: /^ *:-+: *$/, tableAlignLeft: /^ *:-+ *$/, startATag: /^<a /i, endATag: /^<\/a>/i, startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i, endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i, startAngleBracket: /^</, endAngleBracket: />$/, pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/, unicodeAlphaNumeric: /[\p{L}\p{N}]/u, escapeTest: /[&<>"']/, escapeReplace: /[&<>"']/g, escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g, caret: /(^|[^\[])\^/g, percentDecode: /%25/g, findPipe: /\|/g, splitPipe: / \|/, slashPipe: /\\\|/g, carriageReturn: /\r\n|\r/g, spaceLine: /^ +$/gm, notSpaceStart: /^\S*/, endingNewline: /\n$/, listItemRegex: (u3) => new RegExp(`^( {0,3}${u3})((?:[	 ][^\\n]*)?(?:\\n|$))`), nextBulletRegex: (u3) => new RegExp(`^ {0,${Math.min(3, u3 - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), hrRegex: (u3) => new RegExp(`^ {0,${Math.min(3, u3 - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), fencesBeginRegex: (u3) => new RegExp(`^ {0,${Math.min(3, u3 - 1)}}(?:\`\`\`|~~~)`), headingBeginRegex: (u3) => new RegExp(`^ {0,${Math.min(3, u3 - 1)}}#`), htmlBeginRegex: (u3) => new RegExp(`^ {0,${Math.min(3, u3 - 1)}}<(?:[a-z].*>|!--)`, "i"), blockquoteBeginRegex: (u3) => new RegExp(`^ {0,${Math.min(3, u3 - 1)}}>`) };
  var Re = /^(?:[ \t]*(?:\n|$))+/;
  var Oe = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/;
  var Te = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/;
  var C = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/;
  var we = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
  var Q = / {0,3}(?:[*+-]|\d{1,9}[.)])/;
  var se = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/;
  var ie = k2(se).replace(/bull/g, Q).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex();
  var ye = k2(se).replace(/bull/g, Q).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex();
  var j = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/;
  var Pe = /^[^\n]+/;
  var F = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/;
  var Se = k2(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", F).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex();
  var $e = k2(/^(bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, Q).getRegex();
  var v = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
  var U = /<!--(?:-?>|[\s\S]*?(?:-->|$))/;
  var _e = k2("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", U).replace("tag", v).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
  var oe = k2(j).replace("hr", C).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", v).getRegex();
  var Le = k2(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", oe).getRegex();
  var K = { blockquote: Le, code: Oe, def: Se, fences: Te, heading: we, hr: C, html: _e, lheading: ie, list: $e, newline: Re, paragraph: oe, table: _, text: Pe };
  var ne = k2("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", C).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", v).getRegex();
  var Me = { ...K, lheading: ye, table: ne, paragraph: k2(j).replace("hr", C).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", ne).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", v).getRegex() };
  var ze = { ...K, html: k2(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", U).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(), def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/, heading: /^(#{1,6})(.*)(?:\n+|$)/, fences: _, lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/, paragraph: k2(j).replace("hr", C).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", ie).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex() };
  var Ee = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
  var Ie = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
  var ae = /^( {2,}|\\)\n(?!\s*$)/;
  var Ae = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/;
  var z = /[\p{P}\p{S}]/u;
  var H = /[\s\p{P}\p{S}]/u;
  var W = /[^\s\p{P}\p{S}]/u;
  var Ce = k2(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, H).getRegex();
  var le = /(?!~)[\p{P}\p{S}]/u;
  var Be = /(?!~)[\s\p{P}\p{S}]/u;
  var De = /(?:[^\s\p{P}\p{S}]|~)/u;
  var qe = k2(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", be ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex();
  var ue = /^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/;
  var ve = k2(ue, "u").replace(/punct/g, z).getRegex();
  var He = k2(ue, "u").replace(/punct/g, le).getRegex();
  var pe = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)";
  var Ze = k2(pe, "gu").replace(/notPunctSpace/g, W).replace(/punctSpace/g, H).replace(/punct/g, z).getRegex();
  var Ge = k2(pe, "gu").replace(/notPunctSpace/g, De).replace(/punctSpace/g, Be).replace(/punct/g, le).getRegex();
  var Ne = k2("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, W).replace(/punctSpace/g, H).replace(/punct/g, z).getRegex();
  var Qe = k2(/^~~?(?:((?!~)punct)|[^\s~])/, "u").replace(/punct/g, z).getRegex();
  var je = "^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)";
  var Fe = k2(je, "gu").replace(/notPunctSpace/g, W).replace(/punctSpace/g, H).replace(/punct/g, z).getRegex();
  var Ue = k2(/\\(punct)/, "gu").replace(/punct/g, z).getRegex();
  var Ke = k2(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex();
  var We = k2(U).replace("(?:-->|$)", "-->").getRegex();
  var Xe = k2("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", We).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex();
  var q = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/;
  var Je = k2(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/).replace("label", q).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex();
  var ce = k2(/^!?\[(label)\]\[(ref)\]/).replace("label", q).replace("ref", F).getRegex();
  var he = k2(/^!?\[(ref)\](?:\[\])?/).replace("ref", F).getRegex();
  var Ve = k2("reflink|nolink(?!\\()", "g").replace("reflink", ce).replace("nolink", he).getRegex();
  var re = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/;
  var X = { _backpedal: _, anyPunctuation: Ue, autolink: Ke, blockSkip: qe, br: ae, code: Ie, del: _, delLDelim: _, delRDelim: _, emStrongLDelim: ve, emStrongRDelimAst: Ze, emStrongRDelimUnd: Ne, escape: Ee, link: Je, nolink: he, punctuation: Ce, reflink: ce, reflinkSearch: Ve, tag: Xe, text: Ae, url: _ };
  var Ye = { ...X, link: k2(/^!?\[(label)\]\((.*?)\)/).replace("label", q).getRegex(), reflink: k2(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", q).getRegex() };
  var N2 = { ...X, emStrongRDelimAst: Ge, emStrongLDelim: He, delLDelim: Qe, delRDelim: Fe, url: k2(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol", re).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(), _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/, del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/, text: k2(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol", re).getRegex() };
  var et = { ...N2, br: k2(ae).replace("{2,}", "*").getRegex(), text: k2(N2.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex() };
  var B = { normal: K, gfm: Me, pedantic: ze };
  var E2 = { normal: X, gfm: N2, breaks: et, pedantic: Ye };
  var tt = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  var ke = (u3) => tt[u3];
  function T2(u3, e) {
    if (e) {
      if (m.escapeTest.test(u3)) return u3.replace(m.escapeReplace, ke);
    } else if (m.escapeTestNoEncode.test(u3)) return u3.replace(m.escapeReplaceNoEncode, ke);
    return u3;
  }
  function J(u3) {
    try {
      u3 = encodeURI(u3).replace(m.percentDecode, "%");
    } catch {
      return null;
    }
    return u3;
  }
  function V(u3, e) {
    let t = u3.replace(m.findPipe, (i, s, a) => {
      let o = false, l = s;
      for (; --l >= 0 && a[l] === "\\"; ) o = !o;
      return o ? "|" : " |";
    }), n = t.split(m.splitPipe), r = 0;
    if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), e) if (n.length > e) n.splice(e);
    else for (; n.length < e; ) n.push("");
    for (; r < n.length; r++) n[r] = n[r].trim().replace(m.slashPipe, "|");
    return n;
  }
  function I(u3, e, t) {
    let n = u3.length;
    if (n === 0) return "";
    let r = 0;
    for (; r < n; ) {
      let i = u3.charAt(n - r - 1);
      if (i === e && !t) r++;
      else if (i !== e && t) r++;
      else break;
    }
    return u3.slice(0, n - r);
  }
  function de(u3, e) {
    if (u3.indexOf(e[1]) === -1) return -1;
    let t = 0;
    for (let n = 0; n < u3.length; n++) if (u3[n] === "\\") n++;
    else if (u3[n] === e[0]) t++;
    else if (u3[n] === e[1] && (t--, t < 0)) return n;
    return t > 0 ? -2 : -1;
  }
  function ge(u3, e = 0) {
    let t = e, n = "";
    for (let r of u3) if (r === "	") {
      let i = 4 - t % 4;
      n += " ".repeat(i), t += i;
    } else n += r, t++;
    return n;
  }
  function fe(u3, e, t, n, r) {
    let i = e.href, s = e.title || null, a = u3[1].replace(r.other.outputLinkReplace, "$1");
    n.state.inLink = true;
    let o = { type: u3[0].charAt(0) === "!" ? "image" : "link", raw: t, href: i, title: s, text: a, tokens: n.inlineTokens(a) };
    return n.state.inLink = false, o;
  }
  function nt(u3, e, t) {
    let n = u3.match(t.other.indentCodeCompensation);
    if (n === null) return e;
    let r = n[1];
    return e.split(`
`).map((i) => {
      let s = i.match(t.other.beginningSpace);
      if (s === null) return i;
      let [a] = s;
      return a.length >= r.length ? i.slice(r.length) : i;
    }).join(`
`);
  }
  var w = class {
    options;
    rules;
    lexer;
    constructor(e) {
      this.options = e || O;
    }
    space(e) {
      let t = this.rules.block.newline.exec(e);
      if (t && t[0].length > 0) return { type: "space", raw: t[0] };
    }
    code(e) {
      let t = this.rules.block.code.exec(e);
      if (t) {
        let n = t[0].replace(this.rules.other.codeRemoveIndent, "");
        return { type: "code", raw: t[0], codeBlockStyle: "indented", text: this.options.pedantic ? n : I(n, `
`) };
      }
    }
    fences(e) {
      let t = this.rules.block.fences.exec(e);
      if (t) {
        let n = t[0], r = nt(n, t[3] || "", this.rules);
        return { type: "code", raw: n, lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2], text: r };
      }
    }
    heading(e) {
      let t = this.rules.block.heading.exec(e);
      if (t) {
        let n = t[2].trim();
        if (this.rules.other.endingHash.test(n)) {
          let r = I(n, "#");
          (this.options.pedantic || !r || this.rules.other.endingSpaceChar.test(r)) && (n = r.trim());
        }
        return { type: "heading", raw: t[0], depth: t[1].length, text: n, tokens: this.lexer.inline(n) };
      }
    }
    hr(e) {
      let t = this.rules.block.hr.exec(e);
      if (t) return { type: "hr", raw: I(t[0], `
`) };
    }
    blockquote(e) {
      let t = this.rules.block.blockquote.exec(e);
      if (t) {
        let n = I(t[0], `
`).split(`
`), r = "", i = "", s = [];
        for (; n.length > 0; ) {
          let a = false, o = [], l;
          for (l = 0; l < n.length; l++) if (this.rules.other.blockquoteStart.test(n[l])) o.push(n[l]), a = true;
          else if (!a) o.push(n[l]);
          else break;
          n = n.slice(l);
          let p2 = o.join(`
`), c2 = p2.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
          r = r ? `${r}
${p2}` : p2, i = i ? `${i}
${c2}` : c2;
          let d2 = this.lexer.state.top;
          if (this.lexer.state.top = true, this.lexer.blockTokens(c2, s, true), this.lexer.state.top = d2, n.length === 0) break;
          let h2 = s.at(-1);
          if (h2?.type === "code") break;
          if (h2?.type === "blockquote") {
            let R2 = h2, f2 = R2.raw + `
` + n.join(`
`), S = this.blockquote(f2);
            s[s.length - 1] = S, r = r.substring(0, r.length - R2.raw.length) + S.raw, i = i.substring(0, i.length - R2.text.length) + S.text;
            break;
          } else if (h2?.type === "list") {
            let R2 = h2, f2 = R2.raw + `
` + n.join(`
`), S = this.list(f2);
            s[s.length - 1] = S, r = r.substring(0, r.length - h2.raw.length) + S.raw, i = i.substring(0, i.length - R2.raw.length) + S.raw, n = f2.substring(s.at(-1).raw.length).split(`
`);
            continue;
          }
        }
        return { type: "blockquote", raw: r, tokens: s, text: i };
      }
    }
    list(e) {
      let t = this.rules.block.list.exec(e);
      if (t) {
        let n = t[1].trim(), r = n.length > 1, i = { type: "list", raw: "", ordered: r, start: r ? +n.slice(0, -1) : "", loose: false, items: [] };
        n = r ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = r ? n : "[*+-]");
        let s = this.rules.other.listItemRegex(n), a = false;
        for (; e; ) {
          let l = false, p2 = "", c2 = "";
          if (!(t = s.exec(e)) || this.rules.block.hr.test(e)) break;
          p2 = t[0], e = e.substring(p2.length);
          let d2 = ge(t[2].split(`
`, 1)[0], t[1].length), h2 = e.split(`
`, 1)[0], R2 = !d2.trim(), f2 = 0;
          if (this.options.pedantic ? (f2 = 2, c2 = d2.trimStart()) : R2 ? f2 = t[1].length + 1 : (f2 = d2.search(this.rules.other.nonSpaceChar), f2 = f2 > 4 ? 1 : f2, c2 = d2.slice(f2), f2 += t[1].length), R2 && this.rules.other.blankLine.test(h2) && (p2 += h2 + `
`, e = e.substring(h2.length + 1), l = true), !l) {
            let S = this.rules.other.nextBulletRegex(f2), Y = this.rules.other.hrRegex(f2), ee = this.rules.other.fencesBeginRegex(f2), te = this.rules.other.headingBeginRegex(f2), me = this.rules.other.htmlBeginRegex(f2), xe = this.rules.other.blockquoteBeginRegex(f2);
            for (; e; ) {
              let Z = e.split(`
`, 1)[0], A;
              if (h2 = Z, this.options.pedantic ? (h2 = h2.replace(this.rules.other.listReplaceNesting, "  "), A = h2) : A = h2.replace(this.rules.other.tabCharGlobal, "    "), ee.test(h2) || te.test(h2) || me.test(h2) || xe.test(h2) || S.test(h2) || Y.test(h2)) break;
              if (A.search(this.rules.other.nonSpaceChar) >= f2 || !h2.trim()) c2 += `
` + A.slice(f2);
              else {
                if (R2 || d2.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || ee.test(d2) || te.test(d2) || Y.test(d2)) break;
                c2 += `
` + h2;
              }
              R2 = !h2.trim(), p2 += Z + `
`, e = e.substring(Z.length + 1), d2 = A.slice(f2);
            }
          }
          i.loose || (a ? i.loose = true : this.rules.other.doubleBlankLine.test(p2) && (a = true)), i.items.push({ type: "list_item", raw: p2, task: !!this.options.gfm && this.rules.other.listIsTask.test(c2), loose: false, text: c2, tokens: [] }), i.raw += p2;
        }
        let o = i.items.at(-1);
        if (o) o.raw = o.raw.trimEnd(), o.text = o.text.trimEnd();
        else return;
        i.raw = i.raw.trimEnd();
        for (let l of i.items) {
          if (this.lexer.state.top = false, l.tokens = this.lexer.blockTokens(l.text, []), l.task) {
            if (l.text = l.text.replace(this.rules.other.listReplaceTask, ""), l.tokens[0]?.type === "text" || l.tokens[0]?.type === "paragraph") {
              l.tokens[0].raw = l.tokens[0].raw.replace(this.rules.other.listReplaceTask, ""), l.tokens[0].text = l.tokens[0].text.replace(this.rules.other.listReplaceTask, "");
              for (let c2 = this.lexer.inlineQueue.length - 1; c2 >= 0; c2--) if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[c2].src)) {
                this.lexer.inlineQueue[c2].src = this.lexer.inlineQueue[c2].src.replace(this.rules.other.listReplaceTask, "");
                break;
              }
            }
            let p2 = this.rules.other.listTaskCheckbox.exec(l.raw);
            if (p2) {
              let c2 = { type: "checkbox", raw: p2[0] + " ", checked: p2[0] !== "[ ]" };
              l.checked = c2.checked, i.loose ? l.tokens[0] && ["paragraph", "text"].includes(l.tokens[0].type) && "tokens" in l.tokens[0] && l.tokens[0].tokens ? (l.tokens[0].raw = c2.raw + l.tokens[0].raw, l.tokens[0].text = c2.raw + l.tokens[0].text, l.tokens[0].tokens.unshift(c2)) : l.tokens.unshift({ type: "paragraph", raw: c2.raw, text: c2.raw, tokens: [c2] }) : l.tokens.unshift(c2);
            }
          }
          if (!i.loose) {
            let p2 = l.tokens.filter((d2) => d2.type === "space"), c2 = p2.length > 0 && p2.some((d2) => this.rules.other.anyLine.test(d2.raw));
            i.loose = c2;
          }
        }
        if (i.loose) for (let l of i.items) {
          l.loose = true;
          for (let p2 of l.tokens) p2.type === "text" && (p2.type = "paragraph");
        }
        return i;
      }
    }
    html(e) {
      let t = this.rules.block.html.exec(e);
      if (t) return { type: "html", block: true, raw: t[0], pre: t[1] === "pre" || t[1] === "script" || t[1] === "style", text: t[0] };
    }
    def(e) {
      let t = this.rules.block.def.exec(e);
      if (t) {
        let n = t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), r = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", i = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
        return { type: "def", tag: n, raw: t[0], href: r, title: i };
      }
    }
    table(e) {
      let t = this.rules.block.table.exec(e);
      if (!t || !this.rules.other.tableDelimiter.test(t[2])) return;
      let n = V(t[1]), r = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), i = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], s = { type: "table", raw: t[0], header: [], align: [], rows: [] };
      if (n.length === r.length) {
        for (let a of r) this.rules.other.tableAlignRight.test(a) ? s.align.push("right") : this.rules.other.tableAlignCenter.test(a) ? s.align.push("center") : this.rules.other.tableAlignLeft.test(a) ? s.align.push("left") : s.align.push(null);
        for (let a = 0; a < n.length; a++) s.header.push({ text: n[a], tokens: this.lexer.inline(n[a]), header: true, align: s.align[a] });
        for (let a of i) s.rows.push(V(a, s.header.length).map((o, l) => ({ text: o, tokens: this.lexer.inline(o), header: false, align: s.align[l] })));
        return s;
      }
    }
    lheading(e) {
      let t = this.rules.block.lheading.exec(e);
      if (t) {
        let n = t[1].trim();
        return { type: "heading", raw: t[0], depth: t[2].charAt(0) === "=" ? 1 : 2, text: n, tokens: this.lexer.inline(n) };
      }
    }
    paragraph(e) {
      let t = this.rules.block.paragraph.exec(e);
      if (t) {
        let n = t[1].charAt(t[1].length - 1) === `
` ? t[1].slice(0, -1) : t[1];
        return { type: "paragraph", raw: t[0], text: n, tokens: this.lexer.inline(n) };
      }
    }
    text(e) {
      let t = this.rules.block.text.exec(e);
      if (t) return { type: "text", raw: t[0], text: t[0], tokens: this.lexer.inline(t[0]) };
    }
    escape(e) {
      let t = this.rules.inline.escape.exec(e);
      if (t) return { type: "escape", raw: t[0], text: t[1] };
    }
    tag(e) {
      let t = this.rules.inline.tag.exec(e);
      if (t) return !this.lexer.state.inLink && this.rules.other.startATag.test(t[0]) ? this.lexer.state.inLink = true : this.lexer.state.inLink && this.rules.other.endATag.test(t[0]) && (this.lexer.state.inLink = false), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t[0]) ? this.lexer.state.inRawBlock = true : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t[0]) && (this.lexer.state.inRawBlock = false), { type: "html", raw: t[0], inLink: this.lexer.state.inLink, inRawBlock: this.lexer.state.inRawBlock, block: false, text: t[0] };
    }
    link(e) {
      let t = this.rules.inline.link.exec(e);
      if (t) {
        let n = t[2].trim();
        if (!this.options.pedantic && this.rules.other.startAngleBracket.test(n)) {
          if (!this.rules.other.endAngleBracket.test(n)) return;
          let s = I(n.slice(0, -1), "\\");
          if ((n.length - s.length) % 2 === 0) return;
        } else {
          let s = de(t[2], "()");
          if (s === -2) return;
          if (s > -1) {
            let o = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + s;
            t[2] = t[2].substring(0, s), t[0] = t[0].substring(0, o).trim(), t[3] = "";
          }
        }
        let r = t[2], i = "";
        if (this.options.pedantic) {
          let s = this.rules.other.pedanticHrefTitle.exec(r);
          s && (r = s[1], i = s[3]);
        } else i = t[3] ? t[3].slice(1, -1) : "";
        return r = r.trim(), this.rules.other.startAngleBracket.test(r) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(n) ? r = r.slice(1) : r = r.slice(1, -1)), fe(t, { href: r && r.replace(this.rules.inline.anyPunctuation, "$1"), title: i && i.replace(this.rules.inline.anyPunctuation, "$1") }, t[0], this.lexer, this.rules);
      }
    }
    reflink(e, t) {
      let n;
      if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
        let r = (n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " "), i = t[r.toLowerCase()];
        if (!i) {
          let s = n[0].charAt(0);
          return { type: "text", raw: s, text: s };
        }
        return fe(n, i, n[0], this.lexer, this.rules);
      }
    }
    emStrong(e, t, n = "") {
      let r = this.rules.inline.emStrongLDelim.exec(e);
      if (!r || !r[1] && !r[2] && !r[3] && !r[4] || r[4] && n.match(this.rules.other.unicodeAlphaNumeric)) return;
      if (!(r[1] || r[3] || "") || !n || this.rules.inline.punctuation.exec(n)) {
        let s = [...r[0]].length - 1, a, o, l = s, p2 = 0, c2 = r[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
        for (c2.lastIndex = 0, t = t.slice(-1 * e.length + s); (r = c2.exec(t)) !== null; ) {
          if (a = r[1] || r[2] || r[3] || r[4] || r[5] || r[6], !a) continue;
          if (o = [...a].length, r[3] || r[4]) {
            l += o;
            continue;
          } else if ((r[5] || r[6]) && s % 3 && !((s + o) % 3)) {
            p2 += o;
            continue;
          }
          if (l -= o, l > 0) continue;
          o = Math.min(o, o + l + p2);
          let d2 = [...r[0]][0].length, h2 = e.slice(0, s + r.index + d2 + o);
          if (Math.min(s, o) % 2) {
            let f2 = h2.slice(1, -1);
            return { type: "em", raw: h2, text: f2, tokens: this.lexer.inlineTokens(f2) };
          }
          let R2 = h2.slice(2, -2);
          return { type: "strong", raw: h2, text: R2, tokens: this.lexer.inlineTokens(R2) };
        }
      }
    }
    codespan(e) {
      let t = this.rules.inline.code.exec(e);
      if (t) {
        let n = t[2].replace(this.rules.other.newLineCharGlobal, " "), r = this.rules.other.nonSpaceChar.test(n), i = this.rules.other.startingSpaceChar.test(n) && this.rules.other.endingSpaceChar.test(n);
        return r && i && (n = n.substring(1, n.length - 1)), { type: "codespan", raw: t[0], text: n };
      }
    }
    br(e) {
      let t = this.rules.inline.br.exec(e);
      if (t) return { type: "br", raw: t[0] };
    }
    del(e, t, n = "") {
      let r = this.rules.inline.delLDelim.exec(e);
      if (!r) return;
      if (!(r[1] || "") || !n || this.rules.inline.punctuation.exec(n)) {
        let s = [...r[0]].length - 1, a, o, l = s, p2 = this.rules.inline.delRDelim;
        for (p2.lastIndex = 0, t = t.slice(-1 * e.length + s); (r = p2.exec(t)) !== null; ) {
          if (a = r[1] || r[2] || r[3] || r[4] || r[5] || r[6], !a || (o = [...a].length, o !== s)) continue;
          if (r[3] || r[4]) {
            l += o;
            continue;
          }
          if (l -= o, l > 0) continue;
          o = Math.min(o, o + l);
          let c2 = [...r[0]][0].length, d2 = e.slice(0, s + r.index + c2 + o), h2 = d2.slice(s, -s);
          return { type: "del", raw: d2, text: h2, tokens: this.lexer.inlineTokens(h2) };
        }
      }
    }
    autolink(e) {
      let t = this.rules.inline.autolink.exec(e);
      if (t) {
        let n, r;
        return t[2] === "@" ? (n = t[1], r = "mailto:" + n) : (n = t[1], r = n), { type: "link", raw: t[0], text: n, href: r, tokens: [{ type: "text", raw: n, text: n }] };
      }
    }
    url(e) {
      let t;
      if (t = this.rules.inline.url.exec(e)) {
        let n, r;
        if (t[2] === "@") n = t[0], r = "mailto:" + n;
        else {
          let i;
          do
            i = t[0], t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? "";
          while (i !== t[0]);
          n = t[0], t[1] === "www." ? r = "http://" + t[0] : r = t[0];
        }
        return { type: "link", raw: t[0], text: n, href: r, tokens: [{ type: "text", raw: n, text: n }] };
      }
    }
    inlineText(e) {
      let t = this.rules.inline.text.exec(e);
      if (t) {
        let n = this.lexer.state.inRawBlock;
        return { type: "text", raw: t[0], text: t[0], escaped: n };
      }
    }
  };
  var x = class u {
    tokens;
    options;
    state;
    inlineQueue;
    tokenizer;
    constructor(e) {
      this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || O, this.options.tokenizer = this.options.tokenizer || new w(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = { inLink: false, inRawBlock: false, top: true };
      let t = { other: m, block: B.normal, inline: E2.normal };
      this.options.pedantic ? (t.block = B.pedantic, t.inline = E2.pedantic) : this.options.gfm && (t.block = B.gfm, this.options.breaks ? t.inline = E2.breaks : t.inline = E2.gfm), this.tokenizer.rules = t;
    }
    static get rules() {
      return { block: B, inline: E2 };
    }
    static lex(e, t) {
      return new u(t).lex(e);
    }
    static lexInline(e, t) {
      return new u(t).inlineTokens(e);
    }
    lex(e) {
      e = e.replace(m.carriageReturn, `
`), this.blockTokens(e, this.tokens);
      for (let t = 0; t < this.inlineQueue.length; t++) {
        let n = this.inlineQueue[t];
        this.inlineTokens(n.src, n.tokens);
      }
      return this.inlineQueue = [], this.tokens;
    }
    blockTokens(e, t = [], n = false) {
      for (this.tokenizer.lexer = this, this.options.pedantic && (e = e.replace(m.tabCharGlobal, "    ").replace(m.spaceLine, "")); e; ) {
        let r;
        if (this.options.extensions?.block?.some((s) => (r = s.call({ lexer: this }, e, t)) ? (e = e.substring(r.raw.length), t.push(r), true) : false)) continue;
        if (r = this.tokenizer.space(e)) {
          e = e.substring(r.raw.length);
          let s = t.at(-1);
          r.raw.length === 1 && s !== void 0 ? s.raw += `
` : t.push(r);
          continue;
        }
        if (r = this.tokenizer.code(e)) {
          e = e.substring(r.raw.length);
          let s = t.at(-1);
          s?.type === "paragraph" || s?.type === "text" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.text, this.inlineQueue.at(-1).src = s.text) : t.push(r);
          continue;
        }
        if (r = this.tokenizer.fences(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.heading(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.hr(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.blockquote(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.list(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.html(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.def(e)) {
          e = e.substring(r.raw.length);
          let s = t.at(-1);
          s?.type === "paragraph" || s?.type === "text" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.raw, this.inlineQueue.at(-1).src = s.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = { href: r.href, title: r.title }, t.push(r));
          continue;
        }
        if (r = this.tokenizer.table(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.lheading(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        let i = e;
        if (this.options.extensions?.startBlock) {
          let s = 1 / 0, a = e.slice(1), o;
          this.options.extensions.startBlock.forEach((l) => {
            o = l.call({ lexer: this }, a), typeof o == "number" && o >= 0 && (s = Math.min(s, o));
          }), s < 1 / 0 && s >= 0 && (i = e.substring(0, s + 1));
        }
        if (this.state.top && (r = this.tokenizer.paragraph(i))) {
          let s = t.at(-1);
          n && s?.type === "paragraph" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = s.text) : t.push(r), n = i.length !== e.length, e = e.substring(r.raw.length);
          continue;
        }
        if (r = this.tokenizer.text(e)) {
          e = e.substring(r.raw.length);
          let s = t.at(-1);
          s?.type === "text" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = s.text) : t.push(r);
          continue;
        }
        if (e) {
          let s = "Infinite loop on byte: " + e.charCodeAt(0);
          if (this.options.silent) {
            console.error(s);
            break;
          } else throw new Error(s);
        }
      }
      return this.state.top = true, t;
    }
    inline(e, t = []) {
      return this.inlineQueue.push({ src: e, tokens: t }), t;
    }
    inlineTokens(e, t = []) {
      this.tokenizer.lexer = this;
      let n = e, r = null;
      if (this.tokens.links) {
        let o = Object.keys(this.tokens.links);
        if (o.length > 0) for (; (r = this.tokenizer.rules.inline.reflinkSearch.exec(n)) !== null; ) o.includes(r[0].slice(r[0].lastIndexOf("[") + 1, -1)) && (n = n.slice(0, r.index) + "[" + "a".repeat(r[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
      }
      for (; (r = this.tokenizer.rules.inline.anyPunctuation.exec(n)) !== null; ) n = n.slice(0, r.index) + "++" + n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
      let i;
      for (; (r = this.tokenizer.rules.inline.blockSkip.exec(n)) !== null; ) i = r[2] ? r[2].length : 0, n = n.slice(0, r.index + i) + "[" + "a".repeat(r[0].length - i - 2) + "]" + n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
      n = this.options.hooks?.emStrongMask?.call({ lexer: this }, n) ?? n;
      let s = false, a = "";
      for (; e; ) {
        s || (a = ""), s = false;
        let o;
        if (this.options.extensions?.inline?.some((p2) => (o = p2.call({ lexer: this }, e, t)) ? (e = e.substring(o.raw.length), t.push(o), true) : false)) continue;
        if (o = this.tokenizer.escape(e)) {
          e = e.substring(o.raw.length), t.push(o);
          continue;
        }
        if (o = this.tokenizer.tag(e)) {
          e = e.substring(o.raw.length), t.push(o);
          continue;
        }
        if (o = this.tokenizer.link(e)) {
          e = e.substring(o.raw.length), t.push(o);
          continue;
        }
        if (o = this.tokenizer.reflink(e, this.tokens.links)) {
          e = e.substring(o.raw.length);
          let p2 = t.at(-1);
          o.type === "text" && p2?.type === "text" ? (p2.raw += o.raw, p2.text += o.text) : t.push(o);
          continue;
        }
        if (o = this.tokenizer.emStrong(e, n, a)) {
          e = e.substring(o.raw.length), t.push(o);
          continue;
        }
        if (o = this.tokenizer.codespan(e)) {
          e = e.substring(o.raw.length), t.push(o);
          continue;
        }
        if (o = this.tokenizer.br(e)) {
          e = e.substring(o.raw.length), t.push(o);
          continue;
        }
        if (o = this.tokenizer.del(e, n, a)) {
          e = e.substring(o.raw.length), t.push(o);
          continue;
        }
        if (o = this.tokenizer.autolink(e)) {
          e = e.substring(o.raw.length), t.push(o);
          continue;
        }
        if (!this.state.inLink && (o = this.tokenizer.url(e))) {
          e = e.substring(o.raw.length), t.push(o);
          continue;
        }
        let l = e;
        if (this.options.extensions?.startInline) {
          let p2 = 1 / 0, c2 = e.slice(1), d2;
          this.options.extensions.startInline.forEach((h2) => {
            d2 = h2.call({ lexer: this }, c2), typeof d2 == "number" && d2 >= 0 && (p2 = Math.min(p2, d2));
          }), p2 < 1 / 0 && p2 >= 0 && (l = e.substring(0, p2 + 1));
        }
        if (o = this.tokenizer.inlineText(l)) {
          e = e.substring(o.raw.length), o.raw.slice(-1) !== "_" && (a = o.raw.slice(-1)), s = true;
          let p2 = t.at(-1);
          p2?.type === "text" ? (p2.raw += o.raw, p2.text += o.text) : t.push(o);
          continue;
        }
        if (e) {
          let p2 = "Infinite loop on byte: " + e.charCodeAt(0);
          if (this.options.silent) {
            console.error(p2);
            break;
          } else throw new Error(p2);
        }
      }
      return t;
    }
  };
  var y2 = class {
    options;
    parser;
    constructor(e) {
      this.options = e || O;
    }
    space(e) {
      return "";
    }
    code({ text: e, lang: t, escaped: n }) {
      let r = (t || "").match(m.notSpaceStart)?.[0], i = e.replace(m.endingNewline, "") + `
`;
      return r ? '<pre><code class="language-' + T2(r) + '">' + (n ? i : T2(i, true)) + `</code></pre>
` : "<pre><code>" + (n ? i : T2(i, true)) + `</code></pre>
`;
    }
    blockquote({ tokens: e }) {
      return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
    }
    html({ text: e }) {
      return e;
    }
    def(e) {
      return "";
    }
    heading({ tokens: e, depth: t }) {
      return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
    }
    hr(e) {
      return `<hr>
`;
    }
    list(e) {
      let t = e.ordered, n = e.start, r = "";
      for (let a = 0; a < e.items.length; a++) {
        let o = e.items[a];
        r += this.listitem(o);
      }
      let i = t ? "ol" : "ul", s = t && n !== 1 ? ' start="' + n + '"' : "";
      return "<" + i + s + `>
` + r + "</" + i + `>
`;
    }
    listitem(e) {
      return `<li>${this.parser.parse(e.tokens)}</li>
`;
    }
    checkbox({ checked: e }) {
      return "<input " + (e ? 'checked="" ' : "") + 'disabled="" type="checkbox"> ';
    }
    paragraph({ tokens: e }) {
      return `<p>${this.parser.parseInline(e)}</p>
`;
    }
    table(e) {
      let t = "", n = "";
      for (let i = 0; i < e.header.length; i++) n += this.tablecell(e.header[i]);
      t += this.tablerow({ text: n });
      let r = "";
      for (let i = 0; i < e.rows.length; i++) {
        let s = e.rows[i];
        n = "";
        for (let a = 0; a < s.length; a++) n += this.tablecell(s[a]);
        r += this.tablerow({ text: n });
      }
      return r && (r = `<tbody>${r}</tbody>`), `<table>
<thead>
` + t + `</thead>
` + r + `</table>
`;
    }
    tablerow({ text: e }) {
      return `<tr>
${e}</tr>
`;
    }
    tablecell(e) {
      let t = this.parser.parseInline(e.tokens), n = e.header ? "th" : "td";
      return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>
`;
    }
    strong({ tokens: e }) {
      return `<strong>${this.parser.parseInline(e)}</strong>`;
    }
    em({ tokens: e }) {
      return `<em>${this.parser.parseInline(e)}</em>`;
    }
    codespan({ text: e }) {
      return `<code>${T2(e, true)}</code>`;
    }
    br(e) {
      return "<br>";
    }
    del({ tokens: e }) {
      return `<del>${this.parser.parseInline(e)}</del>`;
    }
    link({ href: e, title: t, tokens: n }) {
      let r = this.parser.parseInline(n), i = J(e);
      if (i === null) return r;
      e = i;
      let s = '<a href="' + e + '"';
      return t && (s += ' title="' + T2(t) + '"'), s += ">" + r + "</a>", s;
    }
    image({ href: e, title: t, text: n, tokens: r }) {
      r && (n = this.parser.parseInline(r, this.parser.textRenderer));
      let i = J(e);
      if (i === null) return T2(n);
      e = i;
      let s = `<img src="${e}" alt="${T2(n)}"`;
      return t && (s += ` title="${T2(t)}"`), s += ">", s;
    }
    text(e) {
      return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : T2(e.text);
    }
  };
  var $ = class {
    strong({ text: e }) {
      return e;
    }
    em({ text: e }) {
      return e;
    }
    codespan({ text: e }) {
      return e;
    }
    del({ text: e }) {
      return e;
    }
    html({ text: e }) {
      return e;
    }
    text({ text: e }) {
      return e;
    }
    link({ text: e }) {
      return "" + e;
    }
    image({ text: e }) {
      return "" + e;
    }
    br() {
      return "";
    }
    checkbox({ raw: e }) {
      return e;
    }
  };
  var b = class u2 {
    options;
    renderer;
    textRenderer;
    constructor(e) {
      this.options = e || O, this.options.renderer = this.options.renderer || new y2(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new $();
    }
    static parse(e, t) {
      return new u2(t).parse(e);
    }
    static parseInline(e, t) {
      return new u2(t).parseInline(e);
    }
    parse(e) {
      this.renderer.parser = this;
      let t = "";
      for (let n = 0; n < e.length; n++) {
        let r = e[n];
        if (this.options.extensions?.renderers?.[r.type]) {
          let s = r, a = this.options.extensions.renderers[s.type].call({ parser: this }, s);
          if (a !== false || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "def", "paragraph", "text"].includes(s.type)) {
            t += a || "";
            continue;
          }
        }
        let i = r;
        switch (i.type) {
          case "space": {
            t += this.renderer.space(i);
            break;
          }
          case "hr": {
            t += this.renderer.hr(i);
            break;
          }
          case "heading": {
            t += this.renderer.heading(i);
            break;
          }
          case "code": {
            t += this.renderer.code(i);
            break;
          }
          case "table": {
            t += this.renderer.table(i);
            break;
          }
          case "blockquote": {
            t += this.renderer.blockquote(i);
            break;
          }
          case "list": {
            t += this.renderer.list(i);
            break;
          }
          case "checkbox": {
            t += this.renderer.checkbox(i);
            break;
          }
          case "html": {
            t += this.renderer.html(i);
            break;
          }
          case "def": {
            t += this.renderer.def(i);
            break;
          }
          case "paragraph": {
            t += this.renderer.paragraph(i);
            break;
          }
          case "text": {
            t += this.renderer.text(i);
            break;
          }
          default: {
            let s = 'Token with "' + i.type + '" type was not found.';
            if (this.options.silent) return console.error(s), "";
            throw new Error(s);
          }
        }
      }
      return t;
    }
    parseInline(e, t = this.renderer) {
      this.renderer.parser = this;
      let n = "";
      for (let r = 0; r < e.length; r++) {
        let i = e[r];
        if (this.options.extensions?.renderers?.[i.type]) {
          let a = this.options.extensions.renderers[i.type].call({ parser: this }, i);
          if (a !== false || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(i.type)) {
            n += a || "";
            continue;
          }
        }
        let s = i;
        switch (s.type) {
          case "escape": {
            n += t.text(s);
            break;
          }
          case "html": {
            n += t.html(s);
            break;
          }
          case "link": {
            n += t.link(s);
            break;
          }
          case "image": {
            n += t.image(s);
            break;
          }
          case "checkbox": {
            n += t.checkbox(s);
            break;
          }
          case "strong": {
            n += t.strong(s);
            break;
          }
          case "em": {
            n += t.em(s);
            break;
          }
          case "codespan": {
            n += t.codespan(s);
            break;
          }
          case "br": {
            n += t.br(s);
            break;
          }
          case "del": {
            n += t.del(s);
            break;
          }
          case "text": {
            n += t.text(s);
            break;
          }
          default: {
            let a = 'Token with "' + s.type + '" type was not found.';
            if (this.options.silent) return console.error(a), "";
            throw new Error(a);
          }
        }
      }
      return n;
    }
  };
  var P = class {
    options;
    block;
    constructor(e) {
      this.options = e || O;
    }
    static passThroughHooks = /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens", "emStrongMask"]);
    static passThroughHooksRespectAsync = /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens"]);
    preprocess(e) {
      return e;
    }
    postprocess(e) {
      return e;
    }
    processAllTokens(e) {
      return e;
    }
    emStrongMask(e) {
      return e;
    }
    provideLexer(e = this.block) {
      return e ? x.lex : x.lexInline;
    }
    provideParser(e = this.block) {
      return e ? b.parse : b.parseInline;
    }
  };
  var D = class {
    defaults = M();
    options = this.setOptions;
    parse = this.parseMarkdown(true);
    parseInline = this.parseMarkdown(false);
    Parser = b;
    Renderer = y2;
    TextRenderer = $;
    Lexer = x;
    Tokenizer = w;
    Hooks = P;
    constructor(...e) {
      this.use(...e);
    }
    walkTokens(e, t) {
      let n = [];
      for (let r of e) switch (n = n.concat(t.call(this, r)), r.type) {
        case "table": {
          let i = r;
          for (let s of i.header) n = n.concat(this.walkTokens(s.tokens, t));
          for (let s of i.rows) for (let a of s) n = n.concat(this.walkTokens(a.tokens, t));
          break;
        }
        case "list": {
          let i = r;
          n = n.concat(this.walkTokens(i.items, t));
          break;
        }
        default: {
          let i = r;
          this.defaults.extensions?.childTokens?.[i.type] ? this.defaults.extensions.childTokens[i.type].forEach((s) => {
            let a = i[s].flat(1 / 0);
            n = n.concat(this.walkTokens(a, t));
          }) : i.tokens && (n = n.concat(this.walkTokens(i.tokens, t)));
        }
      }
      return n;
    }
    use(...e) {
      let t = this.defaults.extensions || { renderers: {}, childTokens: {} };
      return e.forEach((n) => {
        let r = { ...n };
        if (r.async = this.defaults.async || r.async || false, n.extensions && (n.extensions.forEach((i) => {
          if (!i.name) throw new Error("extension name required");
          if ("renderer" in i) {
            let s = t.renderers[i.name];
            s ? t.renderers[i.name] = function(...a) {
              let o = i.renderer.apply(this, a);
              return o === false && (o = s.apply(this, a)), o;
            } : t.renderers[i.name] = i.renderer;
          }
          if ("tokenizer" in i) {
            if (!i.level || i.level !== "block" && i.level !== "inline") throw new Error("extension level must be 'block' or 'inline'");
            let s = t[i.level];
            s ? s.unshift(i.tokenizer) : t[i.level] = [i.tokenizer], i.start && (i.level === "block" ? t.startBlock ? t.startBlock.push(i.start) : t.startBlock = [i.start] : i.level === "inline" && (t.startInline ? t.startInline.push(i.start) : t.startInline = [i.start]));
          }
          "childTokens" in i && i.childTokens && (t.childTokens[i.name] = i.childTokens);
        }), r.extensions = t), n.renderer) {
          let i = this.defaults.renderer || new y2(this.defaults);
          for (let s in n.renderer) {
            if (!(s in i)) throw new Error(`renderer '${s}' does not exist`);
            if (["options", "parser"].includes(s)) continue;
            let a = s, o = n.renderer[a], l = i[a];
            i[a] = (...p2) => {
              let c2 = o.apply(i, p2);
              return c2 === false && (c2 = l.apply(i, p2)), c2 || "";
            };
          }
          r.renderer = i;
        }
        if (n.tokenizer) {
          let i = this.defaults.tokenizer || new w(this.defaults);
          for (let s in n.tokenizer) {
            if (!(s in i)) throw new Error(`tokenizer '${s}' does not exist`);
            if (["options", "rules", "lexer"].includes(s)) continue;
            let a = s, o = n.tokenizer[a], l = i[a];
            i[a] = (...p2) => {
              let c2 = o.apply(i, p2);
              return c2 === false && (c2 = l.apply(i, p2)), c2;
            };
          }
          r.tokenizer = i;
        }
        if (n.hooks) {
          let i = this.defaults.hooks || new P();
          for (let s in n.hooks) {
            if (!(s in i)) throw new Error(`hook '${s}' does not exist`);
            if (["options", "block"].includes(s)) continue;
            let a = s, o = n.hooks[a], l = i[a];
            P.passThroughHooks.has(s) ? i[a] = (p2) => {
              if (this.defaults.async && P.passThroughHooksRespectAsync.has(s)) return (async () => {
                let d2 = await o.call(i, p2);
                return l.call(i, d2);
              })();
              let c2 = o.call(i, p2);
              return l.call(i, c2);
            } : i[a] = (...p2) => {
              if (this.defaults.async) return (async () => {
                let d2 = await o.apply(i, p2);
                return d2 === false && (d2 = await l.apply(i, p2)), d2;
              })();
              let c2 = o.apply(i, p2);
              return c2 === false && (c2 = l.apply(i, p2)), c2;
            };
          }
          r.hooks = i;
        }
        if (n.walkTokens) {
          let i = this.defaults.walkTokens, s = n.walkTokens;
          r.walkTokens = function(a) {
            let o = [];
            return o.push(s.call(this, a)), i && (o = o.concat(i.call(this, a))), o;
          };
        }
        this.defaults = { ...this.defaults, ...r };
      }), this;
    }
    setOptions(e) {
      return this.defaults = { ...this.defaults, ...e }, this;
    }
    lexer(e, t) {
      return x.lex(e, t ?? this.defaults);
    }
    parser(e, t) {
      return b.parse(e, t ?? this.defaults);
    }
    parseMarkdown(e) {
      return (n, r) => {
        let i = { ...r }, s = { ...this.defaults, ...i }, a = this.onError(!!s.silent, !!s.async);
        if (this.defaults.async === true && i.async === false) return a(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
        if (typeof n > "u" || n === null) return a(new Error("marked(): input parameter is undefined or null"));
        if (typeof n != "string") return a(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
        if (s.hooks && (s.hooks.options = s, s.hooks.block = e), s.async) return (async () => {
          let o = s.hooks ? await s.hooks.preprocess(n) : n, p2 = await (s.hooks ? await s.hooks.provideLexer(e) : e ? x.lex : x.lexInline)(o, s), c2 = s.hooks ? await s.hooks.processAllTokens(p2) : p2;
          s.walkTokens && await Promise.all(this.walkTokens(c2, s.walkTokens));
          let h2 = await (s.hooks ? await s.hooks.provideParser(e) : e ? b.parse : b.parseInline)(c2, s);
          return s.hooks ? await s.hooks.postprocess(h2) : h2;
        })().catch(a);
        try {
          s.hooks && (n = s.hooks.preprocess(n));
          let l = (s.hooks ? s.hooks.provideLexer(e) : e ? x.lex : x.lexInline)(n, s);
          s.hooks && (l = s.hooks.processAllTokens(l)), s.walkTokens && this.walkTokens(l, s.walkTokens);
          let c2 = (s.hooks ? s.hooks.provideParser(e) : e ? b.parse : b.parseInline)(l, s);
          return s.hooks && (c2 = s.hooks.postprocess(c2)), c2;
        } catch (o) {
          return a(o);
        }
      };
    }
    onError(e, t) {
      return (n) => {
        if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
          let r = "<p>An error occurred:</p><pre>" + T2(n.message + "", true) + "</pre>";
          return t ? Promise.resolve(r) : r;
        }
        if (t) return Promise.reject(n);
        throw n;
      };
    }
  };
  var L = new D();
  function g(u3, e) {
    return L.parse(u3, e);
  }
  g.options = g.setOptions = function(u3) {
    return L.setOptions(u3), g.defaults = L.defaults, G(g.defaults), g;
  };
  g.getDefaults = M;
  g.defaults = O;
  g.use = function(...u3) {
    return L.use(...u3), g.defaults = L.defaults, G(g.defaults), g;
  };
  g.walkTokens = function(u3, e) {
    return L.walkTokens(u3, e);
  };
  g.parseInline = L.parseInline;
  g.Parser = b;
  g.parser = b.parse;
  g.Renderer = y2;
  g.TextRenderer = $;
  g.Lexer = x;
  g.lexer = x.lex;
  g.Tokenizer = w;
  g.Hooks = P;
  g.parse = g;
  var Qt = g.options;
  var jt = g.setOptions;
  var Ft = g.use;
  var Ut = g.walkTokens;
  var Kt = g.parseInline;
  var Xt = b.parse;
  var Jt = x.lex;

  // ../../node_modules/dompurify/dist/purify.es.mjs
  function _OverloadYield(e, d2) {
    this.v = e, this.k = d2;
  }
  function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
    return n;
  }
  function _arrayWithHoles(r) {
    if (Array.isArray(r)) return r;
  }
  function _iterableToArrayLimit(r, l) {
    var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (null != t) {
      var e, n, i, u3, a = [], f2 = true, o = false;
      try {
        if (i = (t = t.call(r)).next, 0 === l) {
          if (Object(t) !== t) return;
          f2 = false;
        } else for (; !(f2 = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f2 = true) ;
      } catch (r2) {
        o = true, n = r2;
      } finally {
        try {
          if (!f2 && null != t.return && (u3 = t.return(), Object(u3) !== u3)) return;
        } finally {
          if (o) throw n;
        }
      }
      return a;
    }
  }
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _slicedToArray(r, e) {
    return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
  }
  function _unsupportedIterableToArray(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
  }
  function AsyncGenerator(e) {
    var t, n;
    function resume(t2, n2) {
      try {
        var r = e[t2](n2), o = r.value, u3 = o instanceof _OverloadYield;
        Promise.resolve(u3 ? o.v : o).then(function(n3) {
          if (u3) {
            var i = "return" === t2 && o.k ? t2 : "next";
            if (!o.k || n3.done) return resume(i, n3);
            n3 = e[i](n3).value;
          }
          settle(!!r.done, n3);
        }, function(e2) {
          resume("throw", e2);
        });
      } catch (e2) {
        settle(2, e2);
      }
    }
    function settle(e2, r) {
      2 === e2 ? t.reject(r) : t.resolve({
        value: r,
        done: e2
      }), (t = t.next) ? resume(t.key, t.arg) : n = null;
    }
    this._invoke = function(e2, r) {
      return new Promise(function(o, u3) {
        var i = {
          key: e2,
          arg: r,
          resolve: o,
          reject: u3,
          next: null
        };
        n ? n = n.next = i : (t = n = i, resume(e2, r));
      });
    }, "function" != typeof e.return && (this.return = void 0);
  }
  AsyncGenerator.prototype["function" == typeof Symbol && Symbol.asyncIterator || "@@asyncIterator"] = function() {
    return this;
  }, AsyncGenerator.prototype.next = function(e) {
    return this._invoke("next", e);
  }, AsyncGenerator.prototype.throw = function(e) {
    return this._invoke("throw", e);
  }, AsyncGenerator.prototype.return = function(e) {
    return this._invoke("return", e);
  };
  var entries = Object.entries;
  var setPrototypeOf = Object.setPrototypeOf;
  var isFrozen = Object.isFrozen;
  var getPrototypeOf = Object.getPrototypeOf;
  var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
  var freeze = Object.freeze;
  var seal = Object.seal;
  var create = Object.create;
  var _ref = typeof Reflect !== "undefined" && Reflect;
  var apply = _ref.apply;
  var construct = _ref.construct;
  if (!freeze) freeze = function freeze2(x2) {
    return x2;
  };
  if (!seal) seal = function seal2(x2) {
    return x2;
  };
  if (!apply) apply = function apply2(func, thisArg) {
    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) args[_key - 2] = arguments[_key];
    return func.apply(thisArg, args);
  };
  if (!construct) construct = function construct2(Func) {
    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) args[_key2 - 1] = arguments[_key2];
    return new Func(...args);
  };
  var arrayForEach = unapply(Array.prototype.forEach);
  Array.prototype.indexOf;
  var arrayLastIndexOf = unapply(Array.prototype.lastIndexOf);
  var arrayPop = unapply(Array.prototype.pop);
  var arrayPush = unapply(Array.prototype.push);
  var arraySlice = unapply(Array.prototype.slice);
  var arraySplice = unapply(Array.prototype.splice);
  var arrayIsArray = Array.isArray;
  var setCreate = unconstruct(Set);
  var setAdd = unapply(Set.prototype.add);
  var setHas = unapply(Set.prototype.has);
  var stringToLowerCase = unapply(String.prototype.toLowerCase);
  var stringToString = unapply(String.prototype.toString);
  var stringMatch = unapply(String.prototype.match);
  var stringReplace = unapply(String.prototype.replace);
  var stringIndexOf = unapply(String.prototype.indexOf);
  var stringTrim = unapply(String.prototype.trim);
  var numberToString = unapply(Number.prototype.toString);
  var booleanToString = unapply(Boolean.prototype.toString);
  var bigintToString = typeof BigInt === "undefined" ? null : unapply(BigInt.prototype.toString);
  var symbolToString = typeof Symbol === "undefined" ? null : unapply(Symbol.prototype.toString);
  var objectHasOwnProperty = unapply(Object.prototype.hasOwnProperty);
  var objectToString = unapply(Object.prototype.toString);
  var regExpTest = unapply(RegExp.prototype.test);
  var typeErrorCreate = unconstruct(TypeError);
  function unapply(func) {
    return function(thisArg) {
      if (thisArg instanceof RegExp) thisArg.lastIndex = 0;
      for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) args[_key3 - 1] = arguments[_key3];
      return apply(func, thisArg, args);
    };
  }
  function unconstruct(Func) {
    return function() {
      for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) args[_key4] = arguments[_key4];
      return construct(Func, args);
    };
  }
  function addToSet(set2, array) {
    let transformCaseFunc = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : stringToLowerCase;
    if (setPrototypeOf) setPrototypeOf(set2, null);
    if (!arrayIsArray(array)) return set2;
    let l = array.length;
    while (l--) {
      let element = array[l];
      if (typeof element === "string") {
        const lcElement = transformCaseFunc(element);
        if (lcElement !== element) {
          if (!isFrozen(array)) array[l] = lcElement;
          element = lcElement;
        }
      }
      set2[element] = true;
    }
    return set2;
  }
  function cleanArray(array) {
    for (let index = 0; index < array.length; index++) if (!objectHasOwnProperty(array, index)) array[index] = null;
    return array;
  }
  function clone(object) {
    const newObject = create(null);
    for (const _ref2 of entries(object)) {
      var _ref3 = _slicedToArray(_ref2, 2);
      const property = _ref3[0];
      const value = _ref3[1];
      if (objectHasOwnProperty(object, property)) {
        if (arrayIsArray(value)) newObject[property] = cleanArray(value);
        else if (value && typeof value === "object" && value.constructor === Object) newObject[property] = clone(value);
        else newObject[property] = value;
      }
    }
    return newObject;
  }
  function stringifyValue(value) {
    switch (typeof value) {
      case "string":
        return value;
      case "number":
        return numberToString(value);
      case "boolean":
        return booleanToString(value);
      case "bigint":
        return bigintToString ? bigintToString(value) : "0";
      case "symbol":
        return symbolToString ? symbolToString(value) : "Symbol()";
      case "undefined":
        return objectToString(value);
      case "function":
      case "object": {
        if (value === null) return objectToString(value);
        const valueAsRecord = value;
        const valueToString = lookupGetter(valueAsRecord, "toString");
        if (typeof valueToString === "function") {
          const stringified = valueToString(valueAsRecord);
          return typeof stringified === "string" ? stringified : objectToString(stringified);
        }
        return objectToString(value);
      }
      default:
        return objectToString(value);
    }
  }
  function lookupGetter(object, prop) {
    while (object !== null) {
      const desc = getOwnPropertyDescriptor(object, prop);
      if (desc) {
        if (desc.get) return unapply(desc.get);
        if (typeof desc.value === "function") return unapply(desc.value);
      }
      object = getPrototypeOf(object);
    }
    function fallbackValue() {
      return null;
    }
    return fallbackValue;
  }
  function lookupAccessor(object, prop) {
    while (object !== null) {
      const desc = getOwnPropertyDescriptor(object, prop);
      if (desc) return desc.get ? unapply(desc.get) : null;
      object = getPrototypeOf(object);
    }
    return null;
  }
  function isRegex(value) {
    try {
      regExpTest(value, "");
      return true;
    } catch (_unused) {
      return false;
    }
  }
  var html$1 = freeze([
    "a",
    "abbr",
    "acronym",
    "address",
    "area",
    "article",
    "aside",
    "audio",
    "b",
    "bdi",
    "bdo",
    "big",
    "blink",
    "blockquote",
    "body",
    "br",
    "button",
    "canvas",
    "caption",
    "center",
    "cite",
    "code",
    "col",
    "colgroup",
    "content",
    "data",
    "datalist",
    "dd",
    "decorator",
    "del",
    "details",
    "dfn",
    "dialog",
    "dir",
    "div",
    "dl",
    "dt",
    "element",
    "em",
    "fieldset",
    "figcaption",
    "figure",
    "font",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "head",
    "header",
    "hgroup",
    "hr",
    "html",
    "i",
    "img",
    "input",
    "ins",
    "kbd",
    "label",
    "legend",
    "li",
    "main",
    "map",
    "mark",
    "marquee",
    "menu",
    "menuitem",
    "meter",
    "nav",
    "nobr",
    "ol",
    "optgroup",
    "option",
    "output",
    "p",
    "picture",
    "pre",
    "progress",
    "q",
    "rp",
    "rt",
    "ruby",
    "s",
    "samp",
    "search",
    "section",
    "select",
    "shadow",
    "slot",
    "small",
    "source",
    "spacer",
    "span",
    "strike",
    "strong",
    "style",
    "sub",
    "summary",
    "sup",
    "table",
    "tbody",
    "td",
    "template",
    "textarea",
    "tfoot",
    "th",
    "thead",
    "time",
    "tr",
    "track",
    "tt",
    "u",
    "ul",
    "var",
    "video",
    "wbr"
  ]);
  var svg$1 = freeze([
    "svg",
    "a",
    "altglyph",
    "altglyphdef",
    "altglyphitem",
    "animatecolor",
    "animatemotion",
    "animatetransform",
    "circle",
    "clippath",
    "defs",
    "desc",
    "ellipse",
    "enterkeyhint",
    "exportparts",
    "filter",
    "font",
    "g",
    "glyph",
    "glyphref",
    "hkern",
    "image",
    "inputmode",
    "line",
    "lineargradient",
    "marker",
    "mask",
    "metadata",
    "mpath",
    "part",
    "path",
    "pattern",
    "polygon",
    "polyline",
    "radialgradient",
    "rect",
    "stop",
    "style",
    "switch",
    "symbol",
    "text",
    "textpath",
    "title",
    "tref",
    "tspan",
    "view",
    "vkern"
  ]);
  var svgFilters = freeze([
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feDistantLight",
    "feDropShadow",
    "feFlood",
    "feFuncA",
    "feFuncB",
    "feFuncG",
    "feFuncR",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMergeNode",
    "feMorphology",
    "feOffset",
    "fePointLight",
    "feSpecularLighting",
    "feSpotLight",
    "feTile",
    "feTurbulence"
  ]);
  var svgDisallowed = freeze([
    "animate",
    "color-profile",
    "cursor",
    "discard",
    "font-face",
    "font-face-format",
    "font-face-name",
    "font-face-src",
    "font-face-uri",
    "foreignobject",
    "hatch",
    "hatchpath",
    "mesh",
    "meshgradient",
    "meshpatch",
    "meshrow",
    "missing-glyph",
    "script",
    "set",
    "solidcolor",
    "unknown",
    "use"
  ]);
  var mathMl$1 = freeze([
    "math",
    "menclose",
    "merror",
    "mfenced",
    "mfrac",
    "mglyph",
    "mi",
    "mlabeledtr",
    "mmultiscripts",
    "mn",
    "mo",
    "mover",
    "mpadded",
    "mphantom",
    "mroot",
    "mrow",
    "ms",
    "mspace",
    "msqrt",
    "mstyle",
    "msub",
    "msup",
    "msubsup",
    "mtable",
    "mtd",
    "mtext",
    "mtr",
    "munder",
    "munderover",
    "mprescripts"
  ]);
  var mathMlDisallowed = freeze([
    "maction",
    "maligngroup",
    "malignmark",
    "mlongdiv",
    "mscarries",
    "mscarry",
    "msgroup",
    "mstack",
    "msline",
    "msrow",
    "semantics",
    "annotation",
    "annotation-xml",
    "mprescripts",
    "none"
  ]);
  var text = freeze(["#text"]);
  var html = freeze([
    "accept",
    "action",
    "align",
    "alt",
    "autocapitalize",
    "autocomplete",
    "autopictureinpicture",
    "autoplay",
    "background",
    "bgcolor",
    "border",
    "capture",
    "cellpadding",
    "cellspacing",
    "checked",
    "cite",
    "class",
    "clear",
    "color",
    "cols",
    "colspan",
    "command",
    "commandfor",
    "controls",
    "controlslist",
    "coords",
    "crossorigin",
    "datetime",
    "decoding",
    "default",
    "dir",
    "disabled",
    "disablepictureinpicture",
    "disableremoteplayback",
    "download",
    "draggable",
    "enctype",
    "enterkeyhint",
    "exportparts",
    "face",
    "for",
    "headers",
    "height",
    "hidden",
    "high",
    "href",
    "hreflang",
    "id",
    "inert",
    "inputmode",
    "integrity",
    "ismap",
    "kind",
    "label",
    "lang",
    "list",
    "loading",
    "loop",
    "low",
    "max",
    "maxlength",
    "media",
    "method",
    "min",
    "minlength",
    "multiple",
    "muted",
    "name",
    "nonce",
    "noshade",
    "novalidate",
    "nowrap",
    "open",
    "optimum",
    "part",
    "pattern",
    "placeholder",
    "playsinline",
    "popover",
    "popovertarget",
    "popovertargetaction",
    "poster",
    "preload",
    "pubdate",
    "radiogroup",
    "readonly",
    "rel",
    "required",
    "rev",
    "reversed",
    "role",
    "rows",
    "rowspan",
    "spellcheck",
    "scope",
    "selected",
    "shape",
    "size",
    "sizes",
    "slot",
    "span",
    "srclang",
    "start",
    "src",
    "srcset",
    "step",
    "style",
    "summary",
    "tabindex",
    "title",
    "translate",
    "type",
    "usemap",
    "valign",
    "value",
    "width",
    "wrap",
    "xmlns"
  ]);
  var svg = freeze([
    "accent-height",
    "accumulate",
    "additive",
    "alignment-baseline",
    "amplitude",
    "ascent",
    "attributename",
    "attributetype",
    "azimuth",
    "basefrequency",
    "baseline-shift",
    "begin",
    "bias",
    "by",
    "class",
    "clip",
    "clippathunits",
    "clip-path",
    "clip-rule",
    "color",
    "color-interpolation",
    "color-interpolation-filters",
    "color-profile",
    "color-rendering",
    "cx",
    "cy",
    "d",
    "dx",
    "dy",
    "diffuseconstant",
    "direction",
    "display",
    "divisor",
    "dominant-baseline",
    "dur",
    "edgemode",
    "elevation",
    "end",
    "exponent",
    "fill",
    "fill-opacity",
    "fill-rule",
    "filter",
    "filterunits",
    "flood-color",
    "flood-opacity",
    "font-family",
    "font-size",
    "font-size-adjust",
    "font-stretch",
    "font-style",
    "font-variant",
    "font-weight",
    "fx",
    "fy",
    "g1",
    "g2",
    "glyph-name",
    "glyphref",
    "gradientunits",
    "gradienttransform",
    "height",
    "href",
    "id",
    "image-rendering",
    "in",
    "in2",
    "intercept",
    "k",
    "k1",
    "k2",
    "k3",
    "k4",
    "kerning",
    "keypoints",
    "keysplines",
    "keytimes",
    "lang",
    "lengthadjust",
    "letter-spacing",
    "kernelmatrix",
    "kernelunitlength",
    "lighting-color",
    "local",
    "marker-end",
    "marker-mid",
    "marker-start",
    "markerheight",
    "markerunits",
    "markerwidth",
    "maskcontentunits",
    "maskunits",
    "max",
    "mask",
    "mask-type",
    "media",
    "method",
    "mode",
    "min",
    "name",
    "numoctaves",
    "offset",
    "operator",
    "opacity",
    "order",
    "orient",
    "orientation",
    "origin",
    "overflow",
    "paint-order",
    "path",
    "pathlength",
    "patterncontentunits",
    "patterntransform",
    "patternunits",
    "pointer-events",
    "points",
    "preservealpha",
    "preserveaspectratio",
    "primitiveunits",
    "r",
    "rx",
    "ry",
    "radius",
    "refx",
    "refy",
    "repeatcount",
    "repeatdur",
    "restart",
    "result",
    "rotate",
    "scale",
    "seed",
    "shape-rendering",
    "slope",
    "specularconstant",
    "specularexponent",
    "spreadmethod",
    "startoffset",
    "stddeviation",
    "stitchtiles",
    "stop-color",
    "stop-opacity",
    "stroke-dasharray",
    "stroke-dashoffset",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-miterlimit",
    "stroke-opacity",
    "stroke",
    "stroke-width",
    "style",
    "surfacescale",
    "systemlanguage",
    "tabindex",
    "tablevalues",
    "targetx",
    "targety",
    "transform",
    "transform-origin",
    "text-anchor",
    "text-decoration",
    "text-orientation",
    "text-rendering",
    "textlength",
    "type",
    "u1",
    "u2",
    "unicode",
    "values",
    "vector-effect",
    "viewbox",
    "visibility",
    "version",
    "vert-adv-y",
    "vert-origin-x",
    "vert-origin-y",
    "width",
    "word-spacing",
    "wrap",
    "writing-mode",
    "xchannelselector",
    "ychannelselector",
    "x",
    "x1",
    "x2",
    "xmlns",
    "y",
    "y1",
    "y2",
    "z",
    "zoomandpan"
  ]);
  var mathMl = freeze([
    "accent",
    "accentunder",
    "align",
    "bevelled",
    "close",
    "columnalign",
    "columnlines",
    "columnspacing",
    "columnspan",
    "denomalign",
    "depth",
    "dir",
    "display",
    "displaystyle",
    "encoding",
    "fence",
    "frame",
    "height",
    "href",
    "id",
    "largeop",
    "length",
    "linethickness",
    "lquote",
    "lspace",
    "mathbackground",
    "mathcolor",
    "mathsize",
    "mathvariant",
    "maxsize",
    "minsize",
    "movablelimits",
    "notation",
    "numalign",
    "open",
    "rowalign",
    "rowlines",
    "rowspacing",
    "rowspan",
    "rspace",
    "rquote",
    "scriptlevel",
    "scriptminsize",
    "scriptsizemultiplier",
    "selection",
    "separator",
    "separators",
    "stretchy",
    "subscriptshift",
    "supscriptshift",
    "symmetric",
    "voffset",
    "width",
    "xmlns"
  ]);
  var xml = freeze([
    "xlink:href",
    "xml:id",
    "xlink:title",
    "xml:space",
    "xmlns:xlink"
  ]);
  var MUSTACHE_EXPR = seal(/{{[\w\W]*|^[\w\W]*}}/g);
  var ERB_EXPR = seal(/<%[\w\W]*|^[\w\W]*%>/g);
  var TMPLIT_EXPR = seal(/\${[\w\W]*/g);
  var DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]+$/);
  var ARIA_ATTR = seal(/^aria-[\-\w]+$/);
  var IS_ALLOWED_URI = seal(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i);
  var IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
  var ATTR_WHITESPACE = seal(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g);
  var DOCTYPE_NAME = seal(/^html$/i);
  var CUSTOM_ELEMENT = seal(/^[a-z][.\w]*(-[.\w]+)+$/i);
  var ELEMENT_MARKUP_PROBE = seal(/<[/\w!]/g);
  var COMMENT_MARKUP_PROBE = seal(/<[/\w]/g);
  var FALLBACK_TAG_CLOSE = seal(/<\/no(script|embed|frames)/i);
  var SELF_CLOSING_TAG = seal(/\/>/i);
  var NODE_TYPE = {
    element: 1,
    attribute: 2,
    text: 3,
    cdataSection: 4,
    entityReference: 5,
    entityNode: 6,
    processingInstruction: 7,
    comment: 8,
    document: 9,
    documentType: 10,
    documentFragment: 11,
    notation: 12
  };
  var LITERAL_TEXT_ELEMENTS = freeze(addToSet({}, [
    "style",
    "script",
    "xmp",
    "iframe",
    "noembed",
    "noframes",
    "plaintext",
    "noscript"
  ]));
  var getGlobal = function getGlobal2() {
    return typeof window === "undefined" ? null : window;
  };
  var _createTrustedTypesPolicy = function _createTrustedTypesPolicy2(trustedTypes, purifyHostElement) {
    if (typeof trustedTypes !== "object" || typeof trustedTypes.createPolicy !== "function") return null;
    let suffix = null;
    const ATTR_NAME = "data-tt-policy-suffix";
    if (purifyHostElement && purifyHostElement.hasAttribute(ATTR_NAME)) suffix = purifyHostElement.getAttribute(ATTR_NAME);
    const policyName = "dompurify" + (suffix ? "#" + suffix : "");
    try {
      return trustedTypes.createPolicy(policyName, {
        createHTML(html2) {
          return html2;
        },
        createScriptURL(scriptUrl) {
          return scriptUrl;
        }
      });
    } catch (_2) {
      console.warn("TrustedTypes policy " + policyName + " could not be created.");
      return null;
    }
  };
  var _createHooksMap = function _createHooksMap2() {
    return {
      afterSanitizeAttributes: [],
      afterSanitizeElements: [],
      afterSanitizeShadowDOM: [],
      beforeSanitizeAttributes: [],
      beforeSanitizeElements: [],
      beforeSanitizeShadowDOM: [],
      uponSanitizeAttribute: [],
      uponSanitizeElement: [],
      uponSanitizeShadowNode: []
    };
  };
  var _resolveSetOption = function _resolveSetOption2(cfg, key, fallback, options) {
    return objectHasOwnProperty(cfg, key) && arrayIsArray(cfg[key]) ? addToSet(options.base ? clone(options.base) : {}, cfg[key], options.transform) : fallback;
  };
  var _resolveObjectOption = function _resolveObjectOption2(cfg, key, makeFallback) {
    const value = objectHasOwnProperty(cfg, key) ? cfg[key] : void 0;
    return value && typeof value === "object" ? clone(value) : makeFallback();
  };
  function createDOMPurify() {
    let window2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : getGlobal();
    const DOMPurify = (root) => createDOMPurify(root);
    DOMPurify.version = "3.4.17";
    DOMPurify.removed = [];
    if (!window2 || !window2.document || window2.document.nodeType !== NODE_TYPE.document || !window2.Element) {
      DOMPurify.isSupported = false;
      return DOMPurify;
    }
    let document2 = window2.document;
    const originalDocument = document2;
    const currentScript = originalDocument.currentScript;
    window2.DocumentFragment;
    const HTMLTemplateElement = window2.HTMLTemplateElement, Node2 = window2.Node, Element2 = window2.Element, NodeFilter = window2.NodeFilter;
    window2.NamedNodeMap === void 0 && (window2.NamedNodeMap || window2.MozNamedAttrMap);
    window2.HTMLFormElement;
    const DOMParser2 = window2.DOMParser, trustedTypes = window2.trustedTypes;
    const ElementPrototype = Element2.prototype;
    const cloneNode = lookupGetter(ElementPrototype, "cloneNode");
    const remove = lookupGetter(ElementPrototype, "remove");
    const removeAttributeNode = lookupGetter(ElementPrototype, "removeAttributeNode");
    const getNextSibling = lookupGetter(ElementPrototype, "nextSibling");
    const getChildNodes = lookupGetter(ElementPrototype, "childNodes");
    const getParentNode = lookupGetter(ElementPrototype, "parentNode");
    const getShadowRoot = lookupGetter(ElementPrototype, "shadowRoot");
    const getAttributes = lookupGetter(ElementPrototype, "attributes");
    const getNodeType = Node2 && Node2.prototype ? lookupGetter(Node2.prototype, "nodeType") : null;
    const getNodeName = Node2 && Node2.prototype ? lookupGetter(Node2.prototype, "nodeName") : null;
    const getOwnerDocument = Node2 && Node2.prototype ? lookupGetter(Node2.prototype, "ownerDocument") : null;
    const _readNodeType = function _readNodeType2(node) {
      return getNodeType ? getNodeType(node) : node.nodeType;
    };
    const _readNodeName = function _readNodeName2(node) {
      return getNodeName ? getNodeName(node) : node.nodeName;
    };
    const getNamespaceURI = lookupAccessor(ElementPrototype, "namespaceURI");
    const _readNamespaceURI = function _readNamespaceURI2(element) {
      return getNamespaceURI ? getNamespaceURI(element) : element.namespaceURI;
    };
    if (typeof HTMLTemplateElement === "function") {
      const template10 = document2.createElement("template");
      if (template10.content && template10.content.ownerDocument) document2 = template10.content.ownerDocument;
    }
    let trustedTypesPolicy;
    let emptyHTML = "";
    let defaultTrustedTypesPolicy;
    let defaultTrustedTypesPolicyResolved = false;
    let IN_TRUSTED_TYPES_POLICY = 0;
    const _assertNotInTrustedTypesPolicy = function _assertNotInTrustedTypesPolicy2() {
      if (IN_TRUSTED_TYPES_POLICY > 0) throw typeErrorCreate('A configured TRUSTED_TYPES_POLICY callback (createHTML or createScriptURL) must not call DOMPurify.sanitize, as that causes infinite recursion. Do not pass a policy whose callbacks wrap DOMPurify as TRUSTED_TYPES_POLICY; see the "DOMPurify and Trusted Types" section of the README.');
    };
    const _createTrustedHTML = function _createTrustedHTML2(html2) {
      _assertNotInTrustedTypesPolicy();
      IN_TRUSTED_TYPES_POLICY++;
      try {
        return trustedTypesPolicy.createHTML(html2);
      } finally {
        IN_TRUSTED_TYPES_POLICY--;
      }
    };
    const _createTrustedScriptURL = function _createTrustedScriptURL2(scriptUrl) {
      _assertNotInTrustedTypesPolicy();
      IN_TRUSTED_TYPES_POLICY++;
      try {
        return trustedTypesPolicy.createScriptURL(scriptUrl);
      } finally {
        IN_TRUSTED_TYPES_POLICY--;
      }
    };
    const _getDefaultTrustedTypesPolicy = function _getDefaultTrustedTypesPolicy2() {
      if (!defaultTrustedTypesPolicyResolved) {
        defaultTrustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, currentScript);
        defaultTrustedTypesPolicyResolved = true;
      }
      return defaultTrustedTypesPolicy;
    };
    const _document = document2, implementation = _document.implementation, createNodeIterator = _document.createNodeIterator, createDocumentFragment = _document.createDocumentFragment, getElementsByTagName = _document.getElementsByTagName;
    const importNode = originalDocument.importNode;
    let hooks = _createHooksMap();
    DOMPurify.isSupported = typeof entries === "function" && typeof getParentNode === "function" && implementation && implementation.createHTMLDocument !== void 0;
    const MUSTACHE_EXPR$1 = MUSTACHE_EXPR, ERB_EXPR$1 = ERB_EXPR, TMPLIT_EXPR$1 = TMPLIT_EXPR, DATA_ATTR$1 = DATA_ATTR, ARIA_ATTR$1 = ARIA_ATTR, IS_SCRIPT_OR_DATA$1 = IS_SCRIPT_OR_DATA, ATTR_WHITESPACE$1 = ATTR_WHITESPACE, CUSTOM_ELEMENT$1 = CUSTOM_ELEMENT;
    let IS_ALLOWED_URI$1 = IS_ALLOWED_URI;
    let ALLOWED_TAGS = null;
    const DEFAULT_ALLOWED_TAGS = addToSet({}, [
      ...html$1,
      ...svg$1,
      ...svgFilters,
      ...mathMl$1,
      ...text
    ]);
    let ALLOWED_ATTR = null;
    const DEFAULT_ALLOWED_ATTR = addToSet({}, [
      ...html,
      ...svg,
      ...mathMl,
      ...xml
    ]);
    let CUSTOM_ELEMENT_HANDLING = Object.seal(create(null, {
      tagNameCheck: {
        writable: true,
        configurable: false,
        enumerable: true,
        value: null
      },
      attributeNameCheck: {
        writable: true,
        configurable: false,
        enumerable: true,
        value: null
      },
      allowCustomizedBuiltInElements: {
        writable: true,
        configurable: false,
        enumerable: true,
        value: false
      }
    }));
    let FORBID_TAGS = null;
    let FORBID_ATTR = null;
    const EXTRA_ELEMENT_HANDLING = Object.seal(create(null, {
      tagCheck: {
        writable: true,
        configurable: false,
        enumerable: true,
        value: null
      },
      attributeCheck: {
        writable: true,
        configurable: false,
        enumerable: true,
        value: null
      }
    }));
    let ALLOW_ARIA_ATTR = true;
    let ALLOW_DATA_ATTR = true;
    let ALLOW_UNKNOWN_PROTOCOLS = false;
    let ALLOW_SELF_CLOSE_IN_ATTR = true;
    let SAFE_FOR_TEMPLATES = false;
    let SAFE_FOR_XML = true;
    let WHOLE_DOCUMENT = false;
    let SET_CONFIG = false;
    let SET_CONFIG_ALLOWED_TAGS = null;
    let SET_CONFIG_ALLOWED_ATTR = null;
    let FORCE_BODY = false;
    let RETURN_DOM = false;
    let RETURN_DOM_FRAGMENT = false;
    let RETURN_TRUSTED_TYPE = false;
    let SANITIZE_DOM = true;
    let SANITIZE_NAMED_PROPS = false;
    const SANITIZE_NAMED_PROPS_PREFIX = "user-content-";
    let KEEP_CONTENT = true;
    let IN_PLACE = false;
    let IN_PLACE_VISITED = null;
    let USE_PROFILES = {};
    let FORBID_CONTENTS = null;
    const DEFAULT_FORBID_CONTENTS = addToSet({}, [
      "annotation-xml",
      "audio",
      "colgroup",
      "desc",
      "foreignobject",
      "head",
      "iframe",
      "math",
      "mi",
      "mn",
      "mo",
      "ms",
      "mtext",
      "noembed",
      "noframes",
      "noscript",
      "plaintext",
      "script",
      "selectedcontent",
      "style",
      "svg",
      "template",
      "thead",
      "title",
      "video",
      "xmp"
    ]);
    let DATA_URI_TAGS = null;
    const DEFAULT_DATA_URI_TAGS = addToSet({}, [
      "audio",
      "video",
      "img",
      "source",
      "image",
      "track"
    ]);
    let URI_SAFE_ATTRIBUTES = null;
    const DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, [
      "alt",
      "class",
      "for",
      "id",
      "label",
      "name",
      "pattern",
      "placeholder",
      "role",
      "summary",
      "title",
      "value",
      "style",
      "xmlns"
    ]);
    const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
    const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
    const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
    let NAMESPACE = HTML_NAMESPACE;
    let IS_EMPTY_INPUT = false;
    let ALLOWED_NAMESPACES = null;
    const DEFAULT_ALLOWED_NAMESPACES = addToSet({}, [
      MATHML_NAMESPACE,
      SVG_NAMESPACE,
      HTML_NAMESPACE
    ], stringToString);
    const DEFAULT_MATHML_TEXT_INTEGRATION_POINTS = freeze([
      "mi",
      "mo",
      "mn",
      "ms",
      "mtext"
    ]);
    let MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, DEFAULT_MATHML_TEXT_INTEGRATION_POINTS);
    const DEFAULT_HTML_INTEGRATION_POINTS = freeze(["annotation-xml"]);
    let HTML_INTEGRATION_POINTS = addToSet({}, DEFAULT_HTML_INTEGRATION_POINTS);
    const COMMON_SVG_AND_HTML_ELEMENTS = addToSet({}, [
      "title",
      "style",
      "font",
      "a",
      "script"
    ]);
    let PARSER_MEDIA_TYPE = null;
    const SUPPORTED_PARSER_MEDIA_TYPES = ["application/xhtml+xml", "text/html"];
    const DEFAULT_PARSER_MEDIA_TYPE = "text/html";
    let transformCaseFunc = null;
    let CONFIG = null;
    const formElement = document2.createElement("form");
    const isRegexOrFunction = function isRegexOrFunction2(testValue) {
      return testValue instanceof RegExp || testValue instanceof Function;
    };
    const _parseConfig = function _parseConfig2() {
      let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      if (CONFIG && CONFIG === cfg) return;
      if (!cfg || typeof cfg !== "object") cfg = {};
      cfg = clone(cfg);
      PARSER_MEDIA_TYPE = SUPPORTED_PARSER_MEDIA_TYPES.indexOf(cfg.PARSER_MEDIA_TYPE) === -1 ? DEFAULT_PARSER_MEDIA_TYPE : cfg.PARSER_MEDIA_TYPE;
      transformCaseFunc = PARSER_MEDIA_TYPE === "application/xhtml+xml" ? stringToString : stringToLowerCase;
      ALLOWED_TAGS = _resolveSetOption(cfg, "ALLOWED_TAGS", DEFAULT_ALLOWED_TAGS, { transform: transformCaseFunc });
      ALLOWED_ATTR = _resolveSetOption(cfg, "ALLOWED_ATTR", DEFAULT_ALLOWED_ATTR, { transform: transformCaseFunc });
      ALLOWED_NAMESPACES = _resolveSetOption(cfg, "ALLOWED_NAMESPACES", DEFAULT_ALLOWED_NAMESPACES, { transform: stringToString });
      URI_SAFE_ATTRIBUTES = _resolveSetOption(cfg, "ADD_URI_SAFE_ATTR", DEFAULT_URI_SAFE_ATTRIBUTES, {
        transform: transformCaseFunc,
        base: DEFAULT_URI_SAFE_ATTRIBUTES
      });
      DATA_URI_TAGS = _resolveSetOption(cfg, "ADD_DATA_URI_TAGS", DEFAULT_DATA_URI_TAGS, {
        transform: transformCaseFunc,
        base: DEFAULT_DATA_URI_TAGS
      });
      FORBID_CONTENTS = _resolveSetOption(cfg, "FORBID_CONTENTS", DEFAULT_FORBID_CONTENTS, { transform: transformCaseFunc });
      FORBID_TAGS = _resolveSetOption(cfg, "FORBID_TAGS", clone({}), { transform: transformCaseFunc });
      FORBID_ATTR = _resolveSetOption(cfg, "FORBID_ATTR", clone({}), { transform: transformCaseFunc });
      USE_PROFILES = objectHasOwnProperty(cfg, "USE_PROFILES") ? cfg.USE_PROFILES && typeof cfg.USE_PROFILES === "object" ? clone(cfg.USE_PROFILES) : cfg.USE_PROFILES : false;
      ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false;
      ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false;
      ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false;
      ALLOW_SELF_CLOSE_IN_ATTR = cfg.ALLOW_SELF_CLOSE_IN_ATTR !== false;
      SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false;
      SAFE_FOR_XML = cfg.SAFE_FOR_XML !== false;
      WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false;
      RETURN_DOM = cfg.RETURN_DOM || false;
      RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false;
      RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false;
      FORCE_BODY = cfg.FORCE_BODY || false;
      SANITIZE_DOM = cfg.SANITIZE_DOM !== false;
      SANITIZE_NAMED_PROPS = cfg.SANITIZE_NAMED_PROPS || false;
      KEEP_CONTENT = cfg.KEEP_CONTENT !== false;
      IN_PLACE = cfg.IN_PLACE || false;
      IS_ALLOWED_URI$1 = isRegex(cfg.ALLOWED_URI_REGEXP) ? cfg.ALLOWED_URI_REGEXP : IS_ALLOWED_URI;
      NAMESPACE = typeof cfg.NAMESPACE === "string" ? cfg.NAMESPACE : HTML_NAMESPACE;
      MATHML_TEXT_INTEGRATION_POINTS = _resolveObjectOption(cfg, "MATHML_TEXT_INTEGRATION_POINTS", () => addToSet({}, DEFAULT_MATHML_TEXT_INTEGRATION_POINTS));
      HTML_INTEGRATION_POINTS = _resolveObjectOption(cfg, "HTML_INTEGRATION_POINTS", () => addToSet({}, DEFAULT_HTML_INTEGRATION_POINTS));
      const customElementHandling = _resolveObjectOption(cfg, "CUSTOM_ELEMENT_HANDLING", () => create(null));
      CUSTOM_ELEMENT_HANDLING = create(null);
      if (objectHasOwnProperty(customElementHandling, "tagNameCheck") && isRegexOrFunction(customElementHandling.tagNameCheck)) CUSTOM_ELEMENT_HANDLING.tagNameCheck = customElementHandling.tagNameCheck;
      if (objectHasOwnProperty(customElementHandling, "attributeNameCheck") && isRegexOrFunction(customElementHandling.attributeNameCheck)) CUSTOM_ELEMENT_HANDLING.attributeNameCheck = customElementHandling.attributeNameCheck;
      if (objectHasOwnProperty(customElementHandling, "allowCustomizedBuiltInElements") && typeof customElementHandling.allowCustomizedBuiltInElements === "boolean") CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements = customElementHandling.allowCustomizedBuiltInElements;
      seal(CUSTOM_ELEMENT_HANDLING);
      if (SAFE_FOR_TEMPLATES) ALLOW_DATA_ATTR = false;
      if (RETURN_DOM_FRAGMENT) RETURN_DOM = true;
      if (USE_PROFILES) {
        ALLOWED_TAGS = addToSet({}, text);
        ALLOWED_ATTR = create(null);
        if (USE_PROFILES.html === true) {
          addToSet(ALLOWED_TAGS, html$1);
          addToSet(ALLOWED_ATTR, html);
        }
        if (USE_PROFILES.svg === true) {
          addToSet(ALLOWED_TAGS, svg$1);
          addToSet(ALLOWED_ATTR, svg);
          addToSet(ALLOWED_ATTR, xml);
        }
        if (USE_PROFILES.svgFilters === true) {
          addToSet(ALLOWED_TAGS, svgFilters);
          addToSet(ALLOWED_ATTR, svg);
          addToSet(ALLOWED_ATTR, xml);
        }
        if (USE_PROFILES.mathMl === true) {
          addToSet(ALLOWED_TAGS, mathMl$1);
          addToSet(ALLOWED_ATTR, mathMl);
          addToSet(ALLOWED_ATTR, xml);
        }
      }
      EXTRA_ELEMENT_HANDLING.tagCheck = null;
      EXTRA_ELEMENT_HANDLING.attributeCheck = null;
      if (objectHasOwnProperty(cfg, "ADD_TAGS")) {
        if (typeof cfg.ADD_TAGS === "function") EXTRA_ELEMENT_HANDLING.tagCheck = cfg.ADD_TAGS;
        else if (arrayIsArray(cfg.ADD_TAGS)) {
          if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) ALLOWED_TAGS = clone(ALLOWED_TAGS);
          addToSet(ALLOWED_TAGS, cfg.ADD_TAGS, transformCaseFunc);
        }
      }
      if (objectHasOwnProperty(cfg, "ADD_ATTR")) {
        if (typeof cfg.ADD_ATTR === "function") EXTRA_ELEMENT_HANDLING.attributeCheck = cfg.ADD_ATTR;
        else if (arrayIsArray(cfg.ADD_ATTR)) {
          if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) ALLOWED_ATTR = clone(ALLOWED_ATTR);
          addToSet(ALLOWED_ATTR, cfg.ADD_ATTR, transformCaseFunc);
        }
      }
      if (objectHasOwnProperty(cfg, "ADD_FORBID_CONTENTS") && arrayIsArray(cfg.ADD_FORBID_CONTENTS)) {
        if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) FORBID_CONTENTS = clone(FORBID_CONTENTS);
        addToSet(FORBID_CONTENTS, cfg.ADD_FORBID_CONTENTS, transformCaseFunc);
      }
      if (KEEP_CONTENT) ALLOWED_TAGS["#text"] = true;
      if (WHOLE_DOCUMENT) addToSet(ALLOWED_TAGS, [
        "html",
        "head",
        "body"
      ]);
      if (ALLOWED_TAGS.table) {
        addToSet(ALLOWED_TAGS, ["tbody"]);
        delete FORBID_TAGS.tbody;
      }
      if (cfg.TRUSTED_TYPES_POLICY) {
        if (typeof cfg.TRUSTED_TYPES_POLICY.createHTML !== "function") throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
        if (typeof cfg.TRUSTED_TYPES_POLICY.createScriptURL !== "function") throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
        const previousTrustedTypesPolicy = trustedTypesPolicy;
        trustedTypesPolicy = cfg.TRUSTED_TYPES_POLICY;
        try {
          emptyHTML = _createTrustedHTML("");
        } catch (error) {
          trustedTypesPolicy = previousTrustedTypesPolicy;
          throw error;
        }
      } else if (cfg.TRUSTED_TYPES_POLICY === null) {
        trustedTypesPolicy = void 0;
        emptyHTML = "";
      } else {
        if (trustedTypesPolicy === void 0) trustedTypesPolicy = _getDefaultTrustedTypesPolicy();
        if (trustedTypesPolicy && typeof emptyHTML === "string") emptyHTML = _createTrustedHTML("");
      }
      if (freeze) freeze(cfg);
      CONFIG = cfg;
    };
    const ALL_SVG_TAGS = addToSet({}, [
      ...svg$1,
      ...svgFilters,
      ...svgDisallowed
    ]);
    const ALL_MATHML_TAGS = addToSet({}, [...mathMl$1, ...mathMlDisallowed]);
    const _checkSvgNamespace = function _checkSvgNamespace2(tagName, parent, parentTagName) {
      if (parent.namespaceURI === HTML_NAMESPACE) return tagName === "svg";
      if (parent.namespaceURI === MATHML_NAMESPACE) return tagName === "svg" && (parentTagName === "annotation-xml" || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
      return Boolean(ALL_SVG_TAGS[tagName]);
    };
    const _checkMathMlNamespace = function _checkMathMlNamespace2(tagName, parent, parentTagName) {
      if (parent.namespaceURI === HTML_NAMESPACE) return tagName === "math";
      if (parent.namespaceURI === SVG_NAMESPACE) return tagName === "math" && HTML_INTEGRATION_POINTS[parentTagName];
      return Boolean(ALL_MATHML_TAGS[tagName]);
    };
    const _checkHtmlNamespace = function _checkHtmlNamespace2(tagName, parent, parentTagName) {
      if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) return false;
      if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) return false;
      return !ALL_MATHML_TAGS[tagName] && (COMMON_SVG_AND_HTML_ELEMENTS[tagName] || !ALL_SVG_TAGS[tagName]);
    };
    const _checkValidNamespace = function _checkValidNamespace2(element) {
      const elementNamespace = _readNamespaceURI(element);
      const tagName = stringToLowerCase(_readNodeName(element));
      const parentNode = getParentNode(element);
      let parent;
      let parentTagName;
      if (parentNode && _readNodeType(parentNode) === NODE_TYPE.element) {
        parent = { namespaceURI: _readNamespaceURI(parentNode) };
        parentTagName = stringToLowerCase(_readNodeName(parentNode));
      } else {
        parent = { namespaceURI: NAMESPACE };
        parentTagName = "template";
      }
      if (!ALLOWED_NAMESPACES[elementNamespace]) return false;
      if (elementNamespace === SVG_NAMESPACE) return _checkSvgNamespace(tagName, parent, parentTagName);
      if (elementNamespace === MATHML_NAMESPACE) return _checkMathMlNamespace(tagName, parent, parentTagName);
      if (elementNamespace === HTML_NAMESPACE) return _checkHtmlNamespace(tagName, parent, parentTagName);
      if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && ALLOWED_NAMESPACES[elementNamespace]) return true;
      return false;
    };
    const _forceRemove = function _forceRemove2(node) {
      arrayPush(DOMPurify.removed, { element: node });
      try {
        getParentNode(node).removeChild(node);
      } catch (_2) {
        remove(node);
        if (!getParentNode(node)) throw typeErrorCreate("a node selected for removal could not be detached from its tree and cannot be safely returned; refusing to sanitize in place");
      }
    };
    const _stripAttributeNode = function _stripAttributeNode2(element, attribute, name) {
      try {
        removeAttributeNode(element, attribute);
      } catch (_2) {
        try {
          element.removeAttribute(name);
        } catch (_3) {
        }
      }
    };
    const _neutralizeRoot = function _neutralizeRoot2(root) {
      _neutralizeSubtree(root);
      const childNodes = getChildNodes(root);
      if (childNodes) arrayForEach(arraySlice(childNodes), (child) => {
        try {
          remove(child);
        } catch (_2) {
        }
      });
      const attributes = _readNodeType(root) === NODE_TYPE.element ? getAttributes(root) : null;
      if (attributes) for (let i = attributes.length - 1; i >= 0; --i) {
        const attribute = attributes[i];
        const name = attribute && attribute.name;
        if (typeof name === "string") _stripAttributeNode(root, attribute, name);
      }
    };
    const _removeAttribute = function _removeAttribute2(name, element, attr) {
      if (!attr) try {
        attr = element.getAttributeNode(name);
      } catch (_2) {
        attr = null;
      }
      arrayPush(DOMPurify.removed, {
        attribute: attr || null,
        from: element
      });
      try {
        if (attr) removeAttributeNode(element, attr);
        else element.removeAttribute(name);
      } catch (_2) {
        try {
          element.removeAttribute(name);
        } catch (_3) {
        }
      }
      if (name === "is") {
        if (RETURN_DOM || RETURN_DOM_FRAGMENT) try {
          _forceRemove(element);
        } catch (_2) {
        }
        else try {
          element.setAttribute(name, "");
        } catch (_2) {
        }
      }
    };
    const _stripDisallowedAttributes = function _stripDisallowedAttributes2(element) {
      const attributes = getAttributes(element);
      if (!attributes) return;
      for (let i = attributes.length - 1; i >= 0; --i) {
        const attribute = attributes[i];
        const name = attribute && attribute.name;
        if (typeof name !== "string" || ALLOWED_ATTR[transformCaseFunc(name)]) continue;
        _stripAttributeNode(element, attribute, name);
      }
    };
    const _walkTree = function _walkTree2(root, visit) {
      let intoShadow = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
      const stack = [root];
      while (stack.length > 0) {
        const node = stack.pop();
        if (visit(node) === false) continue;
        if (intoShadow && _readNodeType(node) === NODE_TYPE.element) {
          const shadowRoot = getShadowRoot(node);
          if (_isDocumentFragment(shadowRoot)) stack.push(shadowRoot);
        }
        const childNodes = getChildNodes(node);
        if (childNodes) for (let i = childNodes.length - 1; i >= 0; --i) stack.push(childNodes[i]);
      }
    };
    const _neutralizeSubtree = function _neutralizeSubtree2(root) {
      _walkTree(root, (node) => {
        if (_readNodeType(node) === NODE_TYPE.element) _stripDisallowedAttributes(node);
      });
    };
    const _collectLiveNodes = function _collectLiveNodes2(root) {
      const nodes = [];
      _walkTree(root, (node) => {
        nodes.push(node);
      }, true);
      return nodes;
    };
    const _neutralizeEscapedElements = function _neutralizeEscapedElements2(root, before) {
      const reachable = setCreate();
      arrayForEach(_collectLiveNodes(root), (node) => {
        if (_readNodeType(node) === NODE_TYPE.element) setAdd(reachable, node);
      });
      arrayForEach(before, (node) => {
        if (_readNodeType(node) === NODE_TYPE.element && !setHas(reachable, node)) _stripDisallowedAttributes(node);
      });
    };
    const _neutralizeDiscarded = function _neutralizeDiscarded2(root, before) {
      let rootRemoved = false;
      arrayForEach(DOMPurify.removed, (entry) => {
        if (entry.element) {
          rootRemoved = rootRemoved || entry.element === root;
          _neutralizeSubtree(entry.element);
        }
      });
      _neutralizeEscapedElements(root, before);
      return rootRemoved;
    };
    const MAX_UNVISITED_ROUNDS = 8;
    const _sanitizeUnvisitedNodes = function _sanitizeUnvisitedNodes2(root, before) {
      const visited = IN_PLACE_VISITED;
      let original = null;
      const getOriginal = () => {
        if (!original) {
          original = setCreate();
          arrayForEach(before, (beforeNode) => {
            setAdd(original, beforeNode);
          });
        }
        return original;
      };
      for (let round = 0; ; round++) {
        const live = _collectLiveNodes(root);
        const containers = [root];
        let pending = false;
        arrayForEach(live, (node) => {
          if (_readNodeType(node) === NODE_TYPE.documentFragment) arrayPush(containers, node);
          else if (!pending && !setHas(visited, node)) pending = setHas(getOriginal(), node);
        });
        if (!pending) return;
        if (round >= MAX_UNVISITED_ROUNDS) throw typeErrorCreate("the tree kept changing during in-place sanitization; refusing to return it");
        arrayForEach(containers, (container, index) => {
          _sanitizeUnvisitedIn(container, index > 0, root, getOriginal());
        });
      }
    };
    const _sanitizeUnvisitedIn = function _sanitizeUnvisitedIn2(container, inShadow, root, original) {
      const iterator = _createNodeIterator(container);
      let node;
      while (node = iterator.nextNode()) {
        if (!setHas(original, node) || setHas(IN_PLACE_VISITED, node)) continue;
        if (inShadow) _executeHooks(hooks.uponSanitizeShadowNode, node, null);
        _sanitizeElements(node, root);
        _sanitizeAttributes(node, root);
        if (_isDocumentFragment(node.content)) _sanitizeShadowDOM2(node.content);
      }
    };
    const _markVisited = function _markVisited2(node) {
      if (IN_PLACE_VISITED) setAdd(IN_PLACE_VISITED, node);
    };
    const _isPatchLinkageAttribute = function _isPatchLinkageAttribute2(lcName, lcTag) {
      if (!SAFE_FOR_XML) return false;
      if (lcName === "patchsrc") return true;
      return lcName === "for" && lcTag !== "label" && lcTag !== "output";
    };
    const _neutralizePatchLinkage = function _neutralizePatchLinkage2(root) {
      if (!SAFE_FOR_XML) return;
      _walkTree(root, (node) => {
        const nodeType = _readNodeType(node);
        if (nodeType === NODE_TYPE.processingInstruction || nodeType === NODE_TYPE.comment && regExpTest(COMMENT_MARKUP_PROBE, node.data)) {
          try {
            remove(node);
          } catch (_2) {
          }
          return false;
        }
        if (nodeType === NODE_TYPE.element) {
          const element = node;
          const lcTag = transformCaseFunc(_readNodeName(node));
          try {
            if (element.hasAttribute && element.hasAttribute("patchsrc")) element.removeAttribute("patchsrc");
            if (element.hasAttribute && element.hasAttribute("for") && _isPatchLinkageAttribute("for", lcTag)) element.removeAttribute("for");
          } catch (_2) {
          }
        }
        return true;
      });
    };
    const _initDocument = function _initDocument2(dirty) {
      let doc = null;
      let leadingWhitespace = null;
      if (FORCE_BODY) dirty = "<remove></remove>" + dirty;
      else {
        const matches2 = stringMatch(dirty, /^[\r\n\t ]+/);
        leadingWhitespace = matches2 && matches2[0];
      }
      if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && NAMESPACE === HTML_NAMESPACE) dirty = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + dirty + "</body></html>";
      const dirtyPayload = trustedTypesPolicy ? _createTrustedHTML(dirty) : dirty;
      if (NAMESPACE === HTML_NAMESPACE) try {
        doc = new DOMParser2().parseFromString(dirtyPayload, PARSER_MEDIA_TYPE);
      } catch (_2) {
      }
      if (!doc || !doc.documentElement) {
        doc = implementation.createDocument(NAMESPACE, "template", null);
        try {
          doc.documentElement.innerHTML = IS_EMPTY_INPUT ? emptyHTML : dirtyPayload;
        } catch (_2) {
        }
      }
      const body = doc.body || doc.documentElement;
      if (dirty && leadingWhitespace) body.insertBefore(document2.createTextNode(leadingWhitespace), body.childNodes[0] || null);
      if (NAMESPACE === HTML_NAMESPACE) return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? "html" : "body")[0];
      return WHOLE_DOCUMENT ? doc.documentElement : body;
    };
    const _createNodeIterator = function _createNodeIterator2(root) {
      const doc = getOwnerDocument ? getOwnerDocument(root) : root.ownerDocument;
      return createNodeIterator.call(doc || root, root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_PROCESSING_INSTRUCTION | NodeFilter.SHOW_CDATA_SECTION, null);
    };
    const _stripTemplateExpressions = function _stripTemplateExpressions2(value) {
      value = stringReplace(value, MUSTACHE_EXPR$1, " ");
      value = stringReplace(value, ERB_EXPR$1, " ");
      value = stringReplace(value, TMPLIT_EXPR$1, " ");
      return value;
    };
    const _scrubTemplateExpressions2 = function _scrubTemplateExpressions(node) {
      var _node$querySelectorAl;
      _scrubOwnCharacterData(node);
      const templates = (_node$querySelectorAl = node.querySelectorAll) === null || _node$querySelectorAl === void 0 ? void 0 : _node$querySelectorAl.call(node, "template");
      if (templates) arrayForEach(templates, (tmpl) => {
        if (_isDocumentFragment(tmpl.content)) _scrubTemplateExpressions2(tmpl.content);
      });
    };
    const _scrubOwnCharacterData = function _scrubOwnCharacterData2(node) {
      node.normalize();
      const doc = getOwnerDocument ? getOwnerDocument(node) : node.ownerDocument;
      const walker = createNodeIterator.call(doc || node, node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_CDATA_SECTION | NodeFilter.SHOW_PROCESSING_INSTRUCTION, null);
      let currentNode = walker.nextNode();
      while (currentNode) {
        currentNode.data = _stripTemplateExpressions(currentNode.data);
        currentNode = walker.nextNode();
      }
    };
    const _isClobbered = function _isClobbered2(element) {
      const realTagName = getNodeName ? getNodeName(element) : null;
      if (typeof realTagName !== "string") return false;
      if (transformCaseFunc(realTagName) !== "form") return false;
      return typeof element.nodeName !== "string" || typeof element.textContent !== "string" || typeof element.removeChild !== "function" || element.attributes !== getAttributes(element) || typeof element.removeAttribute !== "function" || typeof element.removeAttributeNode !== "function" || typeof element.getAttributeNode !== "function" || typeof element.setAttribute !== "function" || typeof element.namespaceURI !== "string" || typeof element.insertBefore !== "function" || typeof element.hasChildNodes !== "function" || element.nodeType !== getNodeType(element) || element.childNodes !== getChildNodes(element);
    };
    const _isDocumentFragment = function _isDocumentFragment2(value) {
      if (!getNodeType || typeof value !== "object" || value === null) return false;
      try {
        return getNodeType(value) === NODE_TYPE.documentFragment;
      } catch (_2) {
        return false;
      }
    };
    const _isNode = function _isNode2(value) {
      if (!getNodeType || typeof value !== "object" || value === null) return false;
      try {
        return typeof getNodeType(value) === "number";
      } catch (_2) {
        return false;
      }
    };
    function _executeHooks(hooks2, currentNode, data) {
      if (hooks2.length === 0) return;
      arrayForEach(hooks2, (hook) => {
        hook.call(DOMPurify, currentNode, data, CONFIG);
      });
    }
    const _isUnsafeNode = function _isUnsafeNode2(currentNode, tagName) {
      if (SAFE_FOR_XML && currentNode.hasChildNodes() && !_isNode(currentNode.firstElementChild) && regExpTest(ELEMENT_MARKUP_PROBE, currentNode.textContent) && regExpTest(ELEMENT_MARKUP_PROBE, currentNode.innerHTML)) return true;
      if (SAFE_FOR_XML && LITERAL_TEXT_ELEMENTS[tagName] && _readNodeType(currentNode) === NODE_TYPE.element && _readNamespaceURI(currentNode) === HTML_NAMESPACE && (_isNode(currentNode.firstElementChild) || typeof currentNode.textContent === "string" && regExpTest(ELEMENT_MARKUP_PROBE, currentNode.textContent))) return true;
      if (currentNode.nodeType === NODE_TYPE.processingInstruction) return true;
      if (SAFE_FOR_XML && currentNode.nodeType === NODE_TYPE.comment && regExpTest(COMMENT_MARKUP_PROBE, currentNode.data)) return true;
      return false;
    };
    const _matchesNameCheck = function _matchesNameCheck2(check, name) {
      if (check instanceof RegExp) return regExpTest(check, name);
      if (check instanceof Function) {
        for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) args[_key - 2] = arguments[_key];
        return Boolean(check(name, ...args));
      }
      return false;
    };
    const _sanitizeDisallowedNode = function _sanitizeDisallowedNode2(currentNode, tagName, root) {
      if (!FORBID_TAGS[tagName] && _isBasicCustomElement(tagName) && _matchesNameCheck(CUSTOM_ELEMENT_HANDLING.tagNameCheck, tagName)) return false;
      if (KEEP_CONTENT && !FORBID_CONTENTS[tagName] && !FORBID_CONTENTS[stringToLowerCase(tagName)]) {
        const parentNode = getParentNode(currentNode);
        const childNodes = getChildNodes(currentNode);
        if (childNodes && parentNode) {
          const childCount = childNodes.length;
          for (let i = childCount - 1; i >= 0; --i) {
            const hoisted = currentNode === root ? cloneNode(childNodes[i], true) : childNodes[i];
            parentNode.insertBefore(hoisted, getNextSibling(currentNode));
          }
        }
      }
      _forceRemove(currentNode);
      return true;
    };
    const _forkSharedAllowlist = function _forkSharedAllowlist2(hookList, set2, defaultSet, setConfigSet) {
      if (hookList.length === 0) return set2;
      return set2 === defaultSet || set2 === setConfigSet ? clone(set2) : set2;
    };
    const _handleHookDetachedNode = function _handleHookDetachedNode2(currentNode, root) {
      if (currentNode === root || getParentNode(currentNode) !== null) return false;
      if (IN_PLACE) _neutralizeSubtree(currentNode);
      return true;
    };
    const _sanitizeElements = function _sanitizeElements2(currentNode, root) {
      _markVisited(currentNode);
      _executeHooks(hooks.beforeSanitizeElements, currentNode, null);
      if (_handleHookDetachedNode(currentNode, root)) return true;
      if (_isClobbered(currentNode)) {
        _forceRemove(currentNode);
        return true;
      }
      const tagName = transformCaseFunc(_readNodeName(currentNode));
      ALLOWED_TAGS = _forkSharedAllowlist(hooks.uponSanitizeElement, ALLOWED_TAGS, DEFAULT_ALLOWED_TAGS, SET_CONFIG_ALLOWED_TAGS);
      _executeHooks(hooks.uponSanitizeElement, currentNode, {
        tagName,
        allowedTags: ALLOWED_TAGS
      });
      if (_handleHookDetachedNode(currentNode, root)) return true;
      if (_isUnsafeNode(currentNode, tagName)) {
        _forceRemove(currentNode);
        return true;
      }
      if (FORBID_TAGS[tagName] || !(EXTRA_ELEMENT_HANDLING.tagCheck instanceof Function && EXTRA_ELEMENT_HANDLING.tagCheck(tagName)) && !ALLOWED_TAGS[tagName]) {
        const removed = _sanitizeDisallowedNode(currentNode, tagName, root);
        if (removed === false) {
          _executeHooks(hooks.afterSanitizeElements, currentNode, null);
          if (_handleHookDetachedNode(currentNode, root)) return true;
        }
        return removed;
      }
      if (_readNodeType(currentNode) === NODE_TYPE.element && !_checkValidNamespace(currentNode)) {
        _forceRemove(currentNode);
        return true;
      }
      if ((tagName === "noscript" || tagName === "noembed" || tagName === "noframes") && regExpTest(FALLBACK_TAG_CLOSE, currentNode.innerHTML)) {
        _forceRemove(currentNode);
        return true;
      }
      if (SAFE_FOR_TEMPLATES && currentNode.nodeType === NODE_TYPE.text) {
        const content = _stripTemplateExpressions(currentNode.textContent);
        if (currentNode.textContent !== content) {
          arrayPush(DOMPurify.removed, { element: currentNode.cloneNode() });
          currentNode.textContent = content;
        }
      }
      _executeHooks(hooks.afterSanitizeElements, currentNode, null);
      return _handleHookDetachedNode(currentNode, root);
    };
    const _isValidAttribute = function _isValidAttribute2(lcTag, lcName, value) {
      if (FORBID_ATTR[lcName]) return false;
      if (_isPatchLinkageAttribute(lcName, lcTag)) return false;
      if (SANITIZE_DOM && (lcName === "id" || lcName === "name") && (value in document2 || value in formElement)) return false;
      const nameIsPermitted = ALLOWED_ATTR[lcName] || EXTRA_ELEMENT_HANDLING.attributeCheck instanceof Function && EXTRA_ELEMENT_HANDLING.attributeCheck(lcName, lcTag);
      if (ALLOW_DATA_ATTR && regExpTest(DATA_ATTR$1, lcName)) return true;
      if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR$1, lcName)) return true;
      if (!nameIsPermitted) return _isBasicCustomElement(lcTag) && _matchesNameCheck(CUSTOM_ELEMENT_HANDLING.tagNameCheck, lcTag) && _matchesNameCheck(CUSTOM_ELEMENT_HANDLING.attributeNameCheck, lcName, lcTag) || lcName === "is" && CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements && _matchesNameCheck(CUSTOM_ELEMENT_HANDLING.tagNameCheck, value);
      if (URI_SAFE_ATTRIBUTES[lcName]) return true;
      if (regExpTest(IS_ALLOWED_URI$1, stringReplace(value, ATTR_WHITESPACE$1, ""))) return true;
      if ((lcName === "src" || lcName === "xlink:href" || lcName === "href") && lcTag !== "script" && stringIndexOf(value, "data:") === 0 && DATA_URI_TAGS[lcTag]) return true;
      if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA$1, stringReplace(value, ATTR_WHITESPACE$1, ""))) return true;
      return !value;
    };
    const RESERVED_CUSTOM_ELEMENT_NAMES = addToSet({}, [
      "annotation-xml",
      "color-profile",
      "font-face",
      "font-face-format",
      "font-face-name",
      "font-face-src",
      "font-face-uri",
      "missing-glyph"
    ]);
    const _isBasicCustomElement = function _isBasicCustomElement2(tagName) {
      return !RESERVED_CUSTOM_ELEMENT_NAMES[stringToLowerCase(tagName)] && regExpTest(CUSTOM_ELEMENT$1, tagName);
    };
    const _applyTrustedTypesToAttribute = function _applyTrustedTypesToAttribute2(lcTag, lcName, namespaceURI, value) {
      if (trustedTypesPolicy && typeof trustedTypes === "object" && typeof trustedTypes.getAttributeType === "function" && !namespaceURI) switch (trustedTypes.getAttributeType(lcTag, lcName)) {
        case "TrustedHTML":
          return _createTrustedHTML(value);
        case "TrustedScriptURL":
          return _createTrustedScriptURL(value);
      }
      return value;
    };
    const _setAttributeValue = function _setAttributeValue2(currentNode, name, namespaceURI, value) {
      try {
        if (namespaceURI) currentNode.setAttributeNS(namespaceURI, name, value);
        else currentNode.setAttribute(name, value);
        if (_isClobbered(currentNode)) {
          _forceRemove(currentNode);
          return false;
        }
        return true;
      } catch (_2) {
        _removeAttribute(name, currentNode);
        return false;
      }
    };
    const _isUnsafeAttributeValue = function _isUnsafeAttributeValue2(name, value) {
      if (SAFE_FOR_XML && regExpTest(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, value)) return true;
      return stringToLowerCase(name) === "attributename" && stringMatch(value, "href") !== null;
    };
    const _sanitizeAttributes = function _sanitizeAttributes2(currentNode, root) {
      _executeHooks(hooks.beforeSanitizeAttributes, currentNode, null);
      if (_handleHookDetachedNode(currentNode, root)) return;
      const attributes = currentNode.attributes;
      if (!attributes || _isClobbered(currentNode)) return;
      ALLOWED_ATTR = _forkSharedAllowlist(hooks.uponSanitizeAttribute, ALLOWED_ATTR, DEFAULT_ALLOWED_ATTR, SET_CONFIG_ALLOWED_ATTR);
      const hookEvent = {
        attrName: "",
        attrValue: "",
        keepAttr: true,
        allowedAttributes: ALLOWED_ATTR,
        forceKeepAttr: void 0
      };
      let l = attributes.length;
      const lcTag = transformCaseFunc(currentNode.nodeName);
      while (l--) {
        const attr = attributes[l];
        const name = attr.name, namespaceURI = attr.namespaceURI, attrValue = attr.value;
        const lcName = transformCaseFunc(name);
        const initValue = attrValue;
        let value = name === "value" ? initValue : stringTrim(initValue);
        let recreatedNamedProp = false;
        hookEvent.attrName = lcName;
        hookEvent.attrValue = value;
        hookEvent.keepAttr = true;
        hookEvent.forceKeepAttr = void 0;
        _executeHooks(hooks.uponSanitizeAttribute, currentNode, hookEvent);
        value = hookEvent.attrValue;
        if (SANITIZE_NAMED_PROPS && (lcName === "id" || lcName === "name") && stringIndexOf(value, SANITIZE_NAMED_PROPS_PREFIX) !== 0) {
          _removeAttribute(name, currentNode, attr);
          value = SANITIZE_NAMED_PROPS_PREFIX + value;
          recreatedNamedProp = true;
        }
        if (_isUnsafeAttributeValue(name, value)) {
          _removeAttribute(name, currentNode, attr);
          continue;
        }
        if (hookEvent.forceKeepAttr) continue;
        if (!hookEvent.keepAttr) {
          _removeAttribute(name, currentNode, attr);
          continue;
        }
        if (!ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(SELF_CLOSING_TAG, value)) {
          _removeAttribute(name, currentNode, attr);
          continue;
        }
        if (SAFE_FOR_TEMPLATES) value = _stripTemplateExpressions(value);
        if (!_isValidAttribute(lcTag, lcName, value)) {
          _removeAttribute(name, currentNode, attr);
          continue;
        }
        value = _applyTrustedTypesToAttribute(lcTag, lcName, namespaceURI, value);
        if (value !== initValue) {
          if (_setAttributeValue(currentNode, name, namespaceURI, value) && recreatedNamedProp) arrayPop(DOMPurify.removed);
        }
      }
      _executeHooks(hooks.afterSanitizeAttributes, currentNode, null);
      _handleHookDetachedNode(currentNode, root);
    };
    const _sanitizeShadowDOM2 = function _sanitizeShadowDOM(fragment) {
      let shadowNode = null;
      const shadowIterator = _createNodeIterator(fragment);
      _executeHooks(hooks.beforeSanitizeShadowDOM, fragment, null);
      while (shadowNode = shadowIterator.nextNode()) {
        _executeHooks(hooks.uponSanitizeShadowNode, shadowNode, null);
        _sanitizeElements(shadowNode, fragment);
        _sanitizeAttributes(shadowNode, fragment);
        if (_isDocumentFragment(shadowNode.content)) _sanitizeShadowDOM2(shadowNode.content);
        if (_readNodeType(shadowNode) === NODE_TYPE.element) {
          const innerSr = getShadowRoot(shadowNode);
          if (_isDocumentFragment(innerSr)) {
            _sanitizeAttachedShadowRoots(innerSr);
            _sanitizeShadowDOM2(innerSr);
          }
        }
      }
      if (SAFE_FOR_TEMPLATES) _scrubOwnCharacterData(fragment);
      _executeHooks(hooks.afterSanitizeShadowDOM, fragment, null);
    };
    const _sanitizeAttachedShadowRoots = function _sanitizeAttachedShadowRoots2(root) {
      const stack = [{
        node: root,
        shadow: null
      }];
      while (stack.length > 0) {
        const item = stack.pop();
        if (item.shadow) {
          _sanitizeShadowDOM2(item.shadow);
          continue;
        }
        const node = item.node;
        const isElement = _readNodeType(node) === NODE_TYPE.element;
        const childNodes = getChildNodes(node);
        if (childNodes) for (let i = childNodes.length - 1; i >= 0; --i) stack.push({
          node: childNodes[i],
          shadow: null
        });
        if (isElement) {
          const rootName = getNodeName ? getNodeName(node) : null;
          if (typeof rootName === "string" && transformCaseFunc(rootName) === "template") {
            const content = node.content;
            if (_isDocumentFragment(content)) stack.push({
              node: content,
              shadow: null
            });
          }
        }
        if (isElement) {
          const sr = getShadowRoot(node);
          if (_isDocumentFragment(sr)) stack.push({
            node: null,
            shadow: sr
          }, {
            node: sr,
            shadow: null
          });
        }
      }
    };
    DOMPurify.sanitize = function(dirty) {
      let cfg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      let body = null;
      let importedNode = null;
      let currentNode = null;
      let returnNode = null;
      IS_EMPTY_INPUT = !dirty;
      if (IS_EMPTY_INPUT) dirty = "<!-->";
      if (typeof dirty !== "string" && !_isNode(dirty)) {
        dirty = stringifyValue(dirty);
        if (typeof dirty !== "string") throw typeErrorCreate("dirty is not a string, aborting");
      }
      if (!DOMPurify.isSupported) return dirty;
      if (SET_CONFIG) {
        ALLOWED_TAGS = SET_CONFIG_ALLOWED_TAGS;
        ALLOWED_ATTR = SET_CONFIG_ALLOWED_ATTR;
      } else _parseConfig(cfg);
      if (hooks.uponSanitizeElement.length > 0 || hooks.uponSanitizeAttribute.length > 0) ALLOWED_TAGS = clone(ALLOWED_TAGS);
      if (hooks.uponSanitizeAttribute.length > 0) ALLOWED_ATTR = clone(ALLOWED_ATTR);
      DOMPurify.removed = [];
      const inPlace = IN_PLACE && typeof dirty !== "string" && _isNode(dirty);
      let inPlaceNodes = [];
      const outerVisited = IN_PLACE_VISITED;
      if (inPlace) {
        _neutralizePatchLinkage(dirty);
        const nn = _readNodeName(dirty);
        if (typeof nn === "string") {
          const tagName = transformCaseFunc(nn);
          if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
            _neutralizeRoot(dirty);
            throw typeErrorCreate("root node is forbidden and cannot be sanitized in-place");
          }
        }
        if (_isClobbered(dirty)) {
          _neutralizeRoot(dirty);
          throw typeErrorCreate("root node is clobbered and cannot be sanitized in-place");
        }
        inPlaceNodes = _collectLiveNodes(dirty);
        IN_PLACE_VISITED = setCreate();
      } else if (_isNode(dirty)) {
        body = _initDocument("<!---->");
        importedNode = body.ownerDocument.importNode(dirty, true);
        if (importedNode.nodeType === NODE_TYPE.element && importedNode.nodeName === "BODY") body = importedNode;
        else if (importedNode.nodeName === "HTML") body = importedNode;
        else body.appendChild(importedNode);
        _sanitizeAttachedShadowRoots(body);
      } else {
        if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT && dirty.indexOf("<") === -1) return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? _createTrustedHTML(dirty) : dirty;
        body = _initDocument(dirty);
        if (!body) return RETURN_DOM ? null : RETURN_TRUSTED_TYPE ? emptyHTML : "";
      }
      if (body && FORCE_BODY) _forceRemove(body.firstChild);
      const walkRoot = inPlace ? dirty : body;
      try {
        if (inPlace) _sanitizeAttachedShadowRoots(dirty);
        const nodeIterator = _createNodeIterator(walkRoot);
        while (currentNode = nodeIterator.nextNode()) {
          _sanitizeElements(currentNode, walkRoot);
          _sanitizeAttributes(currentNode, walkRoot);
          if (_isDocumentFragment(currentNode.content)) _sanitizeShadowDOM2(currentNode.content);
        }
        if (inPlace) _sanitizeUnvisitedNodes(dirty, inPlaceNodes);
      } catch (error) {
        if (inPlace) {
          _neutralizeRoot(dirty);
          _neutralizeDiscarded(dirty, inPlaceNodes);
        }
        throw error;
      } finally {
        IN_PLACE_VISITED = outerVisited;
      }
      if (inPlace) {
        if (_neutralizeDiscarded(dirty, inPlaceNodes)) throw typeErrorCreate("a node selected for removal could not be safely returned; refusing to sanitize in place");
        if (SAFE_FOR_TEMPLATES) _scrubTemplateExpressions2(dirty);
        return dirty;
      }
      if (RETURN_DOM) {
        if (SAFE_FOR_TEMPLATES) _scrubTemplateExpressions2(body);
        if (RETURN_DOM_FRAGMENT) {
          returnNode = createDocumentFragment.call(body.ownerDocument);
          while (body.firstChild) returnNode.appendChild(body.firstChild);
        } else returnNode = body;
        if (ALLOWED_ATTR.shadowroot || ALLOWED_ATTR.shadowrootmode) returnNode = importNode.call(originalDocument, returnNode, true);
        return returnNode;
      }
      let serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
      if (WHOLE_DOCUMENT && ALLOWED_TAGS["!doctype"] && body.ownerDocument && body.ownerDocument.doctype && body.ownerDocument.doctype.name && regExpTest(DOCTYPE_NAME, body.ownerDocument.doctype.name)) serializedHTML = "<!DOCTYPE " + body.ownerDocument.doctype.name + ">\n" + serializedHTML;
      if (SAFE_FOR_TEMPLATES) serializedHTML = _stripTemplateExpressions(serializedHTML);
      return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? _createTrustedHTML(serializedHTML) : serializedHTML;
    };
    DOMPurify.setConfig = function() {
      let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      _parseConfig(cfg);
      SET_CONFIG = true;
      SET_CONFIG_ALLOWED_TAGS = ALLOWED_TAGS;
      SET_CONFIG_ALLOWED_ATTR = ALLOWED_ATTR;
    };
    DOMPurify.clearConfig = function() {
      CONFIG = null;
      SET_CONFIG = false;
      SET_CONFIG_ALLOWED_TAGS = null;
      SET_CONFIG_ALLOWED_ATTR = null;
      trustedTypesPolicy = defaultTrustedTypesPolicy;
      emptyHTML = "";
    };
    DOMPurify.isValidAttribute = function(tag, attr, value) {
      if (!CONFIG) _parseConfig({});
      const lcTag = transformCaseFunc(tag);
      const lcName = transformCaseFunc(attr);
      if (typeof value === "string" && (_isUnsafeAttributeValue(attr, value) || !ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(SELF_CLOSING_TAG, value))) return false;
      return _isValidAttribute(lcTag, lcName, value);
    };
    DOMPurify.addHook = function(entryPoint, hookFunction) {
      if (typeof hookFunction !== "function") return;
      if (!objectHasOwnProperty(hooks, entryPoint)) return;
      arrayPush(hooks[entryPoint], hookFunction);
    };
    DOMPurify.removeHook = function(entryPoint, hookFunction) {
      if (!objectHasOwnProperty(hooks, entryPoint)) return;
      if (hookFunction !== void 0) {
        const index = arrayLastIndexOf(hooks[entryPoint], hookFunction);
        return index === -1 ? void 0 : arraySplice(hooks[entryPoint], index, 1)[0];
      }
      return arrayPop(hooks[entryPoint]);
    };
    DOMPurify.removeHooks = function(entryPoint) {
      if (!objectHasOwnProperty(hooks, entryPoint)) return;
      hooks[entryPoint] = [];
    };
    DOMPurify.removeAllHooks = function() {
      hooks = _createHooksMap();
    };
    return DOMPurify;
  }
  var purify_default = createDOMPurify();

  // src/utils.ts
  function nothrow(cb) {
    try {
      return { success: true, value: cb() };
    } catch (error) {
      return { success: false, error };
    }
  }
  function nothrowAsync(cb) {
    return new Promise((resolve) => {
      cb.then((value) => resolve({ success: true, value })).catch((error) => resolve({ success: false, error }));
    });
  }
  function revolvers() {
    let _resolve;
    const promise = new Promise((resolve) => _resolve = resolve);
    return { promise, resolve: _resolve };
  }
  function makeResizable(textarea, scrollParent = document.body, initialHeight = 52) {
    const update4 = () => textareaReconsider(textarea, scrollParent, initialHeight);
    textarea.addEventListener("input", update4);
    update4();
  }
  function textareaReconsider(textarea, scrollParent = document.body, initialHeight = 52) {
    const bodyScroll = scrollParent.scrollTop;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(initialHeight, textarea.scrollHeight + 7)}px`;
    scrollParent.scrollTop = bodyScroll;
  }
  function getRoute() {
    return window.location.hash.slice(1).split(".");
  }
  var markedOptions = {
    gfm: false
  };
  function renderMD(content) {
    return purify_default.sanitize(g.parse(content, { ...markedOptions, async: false }));
  }
  var PLACHEOLDER = "assets/gfx/placeholder.png";
  function placeholder(url) {
    return url || PLACHEOLDER;
  }
  function setSelectOptions(target, options, pick = null) {
    const optionsList = options.map(([id, caption]) => E({
      tagName: "option",
      attributes: {
        value: id
      },
      contents: caption
    }));
    target.innerHTML = "";
    target.append(...optionsList);
    if (pick && options.length > 0) {
      target.value = pick;
    }
  }
  function setSelectMenu(target, displayCaption, options) {
    const option = (id, caption) => E({
      tagName: "option",
      attributes: {
        value: id
      },
      contents: caption
    });
    const optionsList = options.map(([caption], ix) => option(String(ix), caption));
    const defaultOption = option("", displayCaption);
    target.innerHTML = "";
    target.append(defaultOption, ...optionsList);
    target.value = "";
    target.addEventListener("change", () => {
      if (!target.value) return;
      options.find((_2, ix) => String(ix) === target.value)?.[1]();
      target.value = "";
    });
  }
  function elementVisible(e) {
    const rect = e.getBoundingClientRect();
    return rect.top < (window.innerHeight || document.documentElement.clientHeight) && rect.bottom > 0;
  }
  var b64Encoder = {
    encode: async function(file) {
      const array = await file.bytes();
      if ("toBase64" in array)
        return array.toBase64();
      const base64url = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      return base64url.slice(base64url.indexOf(",") + 1);
    },
    decode: async function(value) {
      const response = await fetch(`data:application/octet-stream;base64,${value}`);
      return await response.blob();
    }
  };
  function download(payload, filename) {
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    E({
      tagName: "a",
      attributes: {
        href: url,
        download: filename
      }
    }).click();
    URL.revokeObjectURL(url);
  }
  var MAIN_TITLE = "\xC4gir";
  function updateTitle(page) {
    document.title = page ? `${page} | ${MAIN_TITLE}` : MAIN_TITLE;
  }
  async function asyncMap(a, map2) {
    return await Promise.all(a.map(map2));
  }
  function neatNumber(v2) {
    if (v2 < 1e3) {
      return String(Math.round(v2));
    }
    return (v2 / 1e3).toFixed(1) + "k";
  }
  async function reportingFetch(url, onProgress) {
    const response = await fetch(url);
    const reader = response.body?.getReader();
    const contentLength = parseInt(response.headers?.get("content-length") || "0", 10);
    if (!reader) {
      return await response.blob();
    }
    let received = 0;
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      const f2 = contentLength ? received / contentLength : 0;
      onProgress(f2);
    }
    onProgress(1);
    return new Blob(chunks);
  }
  function unique(a) {
    const set2 = new Set(a);
    return Array.from(set2.values());
  }
  function clamp(v2, min, max) {
    return Math.min(Math.max(v2, min), max);
  }
  async function sha1Hex(text2) {
    const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text2));
    return Array.from(new Uint8Array(digest), (b2) => b2.toString(16).padStart(2, "0")).join("");
  }

  // src/persist.ts
  var IDB_INDESEX = {
    personas: "lastUpdate",
    chats: "lastUpdate",
    scenarios: "lastUpdate"
  };
  var INDEX_SORTED = "sorted";
  var storageListeners = [];
  var bc = new BroadcastChannel("storage-updates");
  bc.onmessage = ({ data }) => {
    const update4 = { ...data, remote: true };
    storageListeners.forEach((l) => l(update4));
  };
  var { promise: dbInitPromise, resolve: dbInitComplete } = revolvers();
  function listen(listener) {
    storageListeners.push(listener);
  }
  async function init() {
    const result = await open();
    if (result.success) dbInitComplete(result.value);
    else toast(result.error);
    return result.success;
  }
  var idb = { get, set, getAll, del };
  var local = { get: localGet, set: localSet };
  async function get(store, key) {
    const db = await dbInitPromise;
    const r = db.transaction(store, "readonly").objectStore(store).get(key);
    return await new Promise((resolve) => {
      r.onsuccess = () => resolve({ success: true, value: r.result });
      r.onerror = () => resolve({ success: false, error: "read error" });
    });
  }
  async function getAll(store) {
    const db = await dbInitPromise;
    const r = store in IDB_INDESEX ? db.transaction(store, "readonly").objectStore(store).index("sorted").getAll() : db.transaction(store, "readonly").objectStore(store).getAll();
    return await new Promise((resolve) => {
      r.onsuccess = () => resolve({ success: true, value: r.result });
      r.onerror = () => resolve({ success: false, error: "read error" });
    });
  }
  async function set(store, value) {
    const db = await dbInitPromise;
    const r = db.transaction(store, "readwrite").objectStore(store).put(value);
    return await new Promise((resolve) => {
      r.onsuccess = () => {
        resolve({ success: true, value: r.result });
        const update4 = { storage: "idb", store };
        bc.postMessage(update4);
        storageListeners.forEach((l) => l(update4));
      };
      r.onerror = () => resolve({ success: false, error: "write error" });
    });
  }
  async function del(store, id) {
    const db = await dbInitPromise;
    const r = db.transaction(store, "readwrite").objectStore(store).delete(id);
    return await new Promise((resolve) => {
      r.onsuccess = () => {
        resolve({ success: true, value: r.result });
        const update4 = { storage: "idb", store };
        bc.postMessage(update4);
        storageListeners.forEach((l) => l(update4));
      };
      r.onerror = () => resolve({ success: false, error: "write error" });
    });
  }
  function open() {
    return new Promise((resolve) => {
      const r = window.indexedDB.open("ehh", 1);
      r.onsuccess = () => resolve({ success: true, value: r.result });
      r.onerror = () => resolve({ success: false, error: r.error });
      r.onupgradeneeded = () => {
        const db = r.result;
        db.createObjectStore("media", { keyPath: "id" });
        const personas = db.createObjectStore("personas", { keyPath: "id" });
        const chats = db.createObjectStore("chats", { keyPath: "id" });
        db.createObjectStore("chatContents", { keyPath: "id" });
        const scenarios = db.createObjectStore("scenarios", { keyPath: "id" });
        personas.createIndex(INDEX_SORTED, IDB_INDESEX.personas);
        chats.createIndex(INDEX_SORTED, IDB_INDESEX.chats);
        scenarios.createIndex(INDEX_SORTED, IDB_INDESEX.scenarios);
      };
    });
  }
  function localGet(key) {
    return window.localStorage.getItem(key);
  }
  function localSet(key, value) {
    window.localStorage.setItem(key, value);
    const update4 = { storage: "local", key };
    bc.postMessage(update4);
    storageListeners.forEach((l) => l(update4));
  }
  async function upload(blob) {
    const bytes = await nothrowAsync(blob.arrayBuffer());
    if (!bytes.success) {
      toast("can't read the picture, it was not saved");
      return null;
    }
    const id = crypto.randomUUID();
    const media = new Blob([bytes.value], { type: blob.type });
    const stored = await set("media", { id, media, mime: media.type });
    if (!stored.success) {
      toast("can't save the picture");
      return null;
    }
    return id;
  }
  function isRemoteRef(imageRef) {
    return /^https?:\/\//i.test(imageRef);
  }
  async function getMedia(imageRef) {
    const stored = await get("media", imageRef);
    if (stored.success && stored.value) return stored.value;
    if (!isRemoteRef(imageRef)) return null;
    const response = await nothrowAsync(fetch(imageRef));
    if (!response.success || !response.value.ok) return null;
    const media = await nothrowAsync(response.value.blob());
    if (!media.success) return null;
    return { id: imageRef, media: media.value, mime: media.value.type };
  }
  var map = /* @__PURE__ */ new Map();
  async function getBlobLink(imageRef) {
    if (map.has(imageRef)) {
      return map.get(imageRef);
    }
    const blob = await get("media", imageRef);
    if (!blob.success || !blob.value) return isRemoteRef(imageRef) ? imageRef : null;
    const link = URL.createObjectURL(blob.value.media);
    map.set(imageRef, link);
    return link;
  }

  // src/components/imagepicker.ts
  var _RampikeImagePicker = class extends HTMLElement {
    /** A freshly picked picture as an in-memory blob, or the media id or URL of a stored one, or "" */
    get value() {
      return this.picked ?? this.getAttribute("value") ?? "";
    }
    set value(v2) {
      this.picked = null;
      this.setAttribute("value", v2);
      this.input.value = "";
      if (v2) {
        getBlobLink(v2).then((src) => {
          if (!src) return;
          this.image = src;
        });
      }
    }
    get input() {
      return this.querySelector(`input[type="file"]`);
    }
    set image(v2) {
      const img = this.querySelector(`img`);
      this.revokeBlob?.();
      img.src = v2;
      this.onDirty?.();
      setTimeout(() => {
        this.clearButton.hidden = !this.value;
      }, 0);
    }
    usePlaceholder() {
      this.picked = null;
      this.image = placeholder(this.getAttribute("placeholder"));
      this.input.value = "";
      this.setAttribute("value", "");
    }
    paste(file) {
      this.setFile(file);
    }
    onDirty = null;
    /**
     * Picked files are copied into memory right away: a File from an <input> is only a handle,
     * and picker apps on Android drop their temporary copy soon after, which makes the handle
     * unreadable by the time the form is saved.
     */
    picked = null;
    revokeBlob = null;
    async setFile(file) {
      const bytes = await nothrowAsync(file.arrayBuffer());
      this.input.value = "";
      if (!bytes.success) {
        toast("can't read the picture, try picking it again");
        return;
      }
      this.picked = new Blob([bytes.value], { type: file.type });
      this.setAttribute("value", "");
      const link = URL.createObjectURL(this.picked);
      this.image = link;
      this.revokeBlob = () => {
        URL.revokeObjectURL(link);
        this.revokeBlob = null;
      };
    }
    clearButton;
    constructor() {
      super();
      const image = E({
        tagName: "img",
        attributes: {
          src: placeholder(this.getAttribute("placeholder"))
        }
      });
      const preview = this.getAttribute("value");
      if (preview) getBlobLink(preview).then((src) => {
        if (!src) return;
        image.src = src;
      });
      const input = E({
        tagName: "input",
        attributes: {
          type: "file",
          accept: this.getAttribute("accept") ?? ""
        },
        style: {
          display: "none"
        },
        events: {
          input: (_ev, el) => {
            const file = el.files?.[0];
            if (!file) return;
            if (file.type && !file.type.startsWith("image/")) {
              el.value = "";
              return;
            }
            this.setFile(file);
          }
        }
      });
      this.clearButton = E({
        tagName: "button",
        className: "lineout image-picker-clear pointer",
        contents: "clear",
        attributes: {
          hidden: "true"
        },
        events: {
          click: () => this.usePlaceholder()
        }
      });
      const pasteButton = E({
        tagName: "button",
        className: "lineout image-picker-paste pointer",
        contents: "\u2398",
        events: {
          click: async () => {
            const contents2 = await navigator.clipboard.read();
            for (const item of contents2) {
              const type = item.types.find((t) => t.startsWith("image/"));
              if (!type) continue;
              const file = await item.getType(type);
              this.paste(new File([file], "pasted", { type }));
              return;
            }
          }
        }
      });
      const contents = [
        E({
          tagName: "label",
          style: {
            display: "contents"
          },
          contents: [input, image]
        }),
        this.clearButton,
        pasteButton
      ];
      this.style.position = "relative";
      this.append(...contents);
    }
  };
  function define8(tagName) {
    window.customElements.define(tagName, _RampikeImagePicker);
  }

  // src/units/navigation.ts
  function navigationUnit() {
    const tabs = document.querySelector("ram-tabs#tabs-main");
    function nav(to) {
      window.location.hash = to;
    }
    function readHash() {
      tabs.tab = getRoute()[0] || "chats";
    }
    window.addEventListener("hashchange", readHash);
    readHash();
    const buttons = document.querySelectorAll("button[data-to]");
    buttons.forEach((b2) => b2.addEventListener("click", () => nav(b2.dataset.to)));
  }

  // src/views/common.ts
  function tabGroups(root) {
    const groups = Array.from(root.querySelectorAll("[data-tab]"));
    return {
      pick(name) {
        groups.forEach((g2) => g2.hidden = g2.dataset.tab !== name);
      }
    };
  }
  function emit(target, name, detail) {
    target.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
  }
  function setPicture(image, source) {
    if (typeof source === "string") image.src = source;
    else if (source) source.then((src) => {
      if (src) image.src = src;
    });
  }
  function placeholderView(text2) {
    return E({ className: "placeholder", contents: text2 });
  }

  // src/views/provider-item.html
  var provider_item_default = '<div class="lineout row settings-provider-item">\n	<div data-ref="name"></div>\n	<div class="row-compact">\n		<button class="lineout" data-ref="edit">edit</button>\n		<button class="lineout" data-ref="copy">copy</button>\n		<button class="lineout" data-ref="delete">delete</button>\n	</div>\n</div>\n';

  // src/views/provider-item.ts
  var template = R(provider_item_default);
  var REFS = ["name", "edit", "copy", "delete"];
  function makeProviderItemView(name, handlers) {
    const { root, refs: r } = h(template, REFS);
    r.name.textContent = name;
    r.edit.addEventListener("click", handlers.edit);
    r.copy.addEventListener("click", handlers.copy);
    r.delete.addEventListener("click", handlers.delete);
    return root;
  }

  // src/units/settings/providers.ts
  function providersUnit() {
    const inputs = {
      name: document.querySelector("#settings-providers-name"),
      url: document.querySelector("#settings-providers-url"),
      key: document.querySelector("#settings-providers-key"),
      model: document.querySelector("#settings-providers-model"),
      reason: document.querySelector("#settings-providers-reasoning"),
      temp: document.querySelector("#settings-providers-temp"),
      max: document.querySelector("#settings-providers-max"),
      params: document.querySelector("#settings-providers-additional"),
      suffix: document.querySelector("#settings-providers-suffix")
    };
    const defaults = {
      temp: 0.9,
      max: 720
    };
    const modelsDatalist = document.querySelector("#settings-providers-models-datalist");
    const submitButton = document.querySelector("#settings-providers-submit");
    const fetchModelsButton = document.querySelector("#settings-providers-fetch-models");
    const list = document.querySelector("#settings-providers-list");
    const editingIndicator = document.querySelector("#settings-providers-editing-indicator");
    let editing = null;
    const addNew = document.querySelector("#settings-providers-add");
    const form = {
      modal: document.querySelector("#settings-providers-modal"),
      close: document.querySelector("#settings-providers-modal-close")
    };
    submitButton.addEventListener("click", submit);
    fetchModelsButton.addEventListener("click", fetchModels);
    form.close.addEventListener("click", () => form.modal.close());
    addNew.addEventListener("click", () => {
      clearInputs();
      form.modal.open();
    });
    makeResizable(inputs.params);
    makeResizable(inputs.suffix);
    listen((update4) => {
      if (update4.storage !== "local") return;
      if (update4.key !== "providers") return;
      updateList();
    });
    updateList();
    function submit() {
      const id = editing ?? crypto.randomUUID();
      function parseNumber(key) {
        const f2 = parseFloat(inputs[key].value);
        if (isNaN(f2) || f2 < 0) return defaults[key];
        return f2;
      }
      function parseParams(raw) {
        if (!raw.trim()) return {};
        const result = nothrow(() => JSON.parse(raw));
        const value = result.success ? result.value : {};
        if (!result.success || typeof value !== "object") {
          toast("the additional parameters value must be a valid JSON object, provider is not updated", { parent: getToastParent() });
          return null;
        }
        return value;
      }
      const e = {
        name: inputs.name.value.trim(),
        url: inputs.url.value.trim(),
        key: inputs.key.value.trim(),
        model: inputs.model.value.trim(),
        temp: parseNumber("temp"),
        max: parseNumber("max"),
        params: parseParams(inputs.params.value.trim()),
        suffix: inputs.suffix.value.trim(),
        reasoning: inputs.reason.value
      };
      const missing = ["name", "url", "model"].some((k3) => !e[k3]);
      if (e.params === null) return;
      if (missing) {
        toast("some of required inputs are missing", { parent: getToastParent() });
        return;
      }
      const eMap = readProviders();
      eMap[id] = e;
      saveProviders(eMap);
      clearInputs();
      form.modal.close();
    }
    async function fetchModels() {
      const url = inputs.url.value.trim().replace("/v1/chat/completions", "/v1/models");
      if (!url) return;
      const key = inputs.key.value;
      const closeToast = toast("calling...", { parent: getToastParent() });
      const response = await nothrowAsync(fetch(url, {
        headers: {
          Authorization: `Bearer ${key}`
        }
      }));
      closeToast();
      if (!response.success) {
        toast(`can't reach "${url}"
${response.error}`, { parent: getToastParent() });
        return;
      }
      if (!response.value.ok) {
        const text2 = await response.value.text();
        toast(`"${url}" returned error
status ${response.value.status}
${text2.slice(0, 64)}`, { parent: getToastParent() });
        return;
      }
      const payload = await response.value.json();
      if (!payload.data) return;
      console.log(payload.data);
      modelsDatalist.innerHTML = "";
      modelsDatalist.append(
        ...payload.data.map(
          (m2) => E({
            tagName: "option",
            attributes: { value: m2.id }
          })
        )
      );
      toast(`success; ${payload.data.length} models are available`), { parent: getToastParent() };
    }
    function edit(id, e) {
      function stringifyParams() {
        if (!e.params) return "";
        if (Object.keys(e.params).length === 0) return "";
        return JSON.stringify(e.params);
      }
      editing = id;
      inputs.name.value = e.name;
      inputs.url.value = e.url;
      inputs.key.value = e.key;
      inputs.model.value = e.model;
      inputs.temp.value = String(e.temp);
      inputs.max.value = String(e.max);
      inputs.params.value = stringifyParams();
      inputs.suffix.value = e.suffix ?? "";
      inputs.reason.value = e.reasoning ?? "unset";
      textareaReconsider(inputs.params);
      textareaReconsider(inputs.suffix);
      editingIndicator.textContent = `editing provider: ${e.name}`;
      editingIndicator.hidden = false;
      form.modal.open();
    }
    function updateList() {
      modelsDatalist.innerHTML = "";
      list.innerHTML = "";
      const providersMap = readProviders();
      const providers = Object.entries(providersMap);
      const items = providers.map(([id, e]) => makeProviderItemView(e.name, {
        edit: () => edit(id, e),
        copy: () => copyProvider(id),
        delete: () => deleteProvider(id)
      }));
      if (items.length > 0)
        list.append(...items);
      else
        list.append(placeholderView("No providers found"));
    }
    function clearInputs() {
      editing = null;
      inputs.name.value = "";
      inputs.url.value = "";
      inputs.key.value = "";
      inputs.model.value = "";
      inputs.temp.value = String(defaults.temp);
      inputs.max.value = String(defaults.max);
      inputs.params.value = "";
      inputs.suffix.value = "";
      inputs.reason.value = "unset";
      textareaReconsider(inputs.params);
      textareaReconsider(inputs.suffix);
      editingIndicator.hidden = true;
    }
  }
  function readProviders() {
    const providersRaw = local.get("providers");
    if (!providersRaw) return {};
    const providers = nothrow(() => JSON.parse(providersRaw));
    if (!providers.success) return {};
    const ActiveProviders = readActiveProviders();
    for (const e in providers.value) {
      providers.value[e].isActive = e === ActiveProviders.main;
      providers.value[e].remberActive = e === ActiveProviders.rember;
    }
    return providers.value;
  }
  function saveProviders(eMap) {
    local.set("providers", JSON.stringify(eMap));
    toast("providers updated", { timeoutMS: 5e3 });
  }
  function deleteProvider(id) {
    if (!confirm("confirm deletion")) return;
    const e = readProviders();
    delete e[id];
    saveProviders(e);
  }
  function copyProvider(id) {
    const e = readProviders();
    if (!e[id]) return;
    const nid = crypto.randomUUID();
    e[nid] = {
      ...e[id],
      name: e[id].name + " (copy)"
    };
    saveProviders(e);
  }
  function readActiveProviders() {
    const defaultProviders = {
      main: null,
      rember: null
    };
    const activeRaw = local.get("activeProvider");
    if (!activeRaw) return defaultProviders;
    const parsed = nothrow(() => JSON.parse(activeRaw));
    if (!parsed.success) return defaultProviders;
    return parsed.value;
  }
  function getToastParent() {
    return document.querySelector("#settings-providers-toasts") ?? void 0;
  }

  // src/views/persona-item.html
  var persona_item_default = '<div class="lineout row settings-persona-item" data-ref="root">\n	<img class="shadow" data-ref="picture">\n	<div class="list settings-persona-item-main">\n		<div class="row-compact">\n			<h6 data-ref="name"></h6>\n			<button class="lineout" data-ref="edit">edit</button>\n			<button class="lineout" data-ref="delete">delete</button>\n		</div>\n		<div data-ref="description"></div>\n	</div>\n</div>\n';

  // src/views/persona-item.ts
  var template2 = R(persona_item_default);
  var REFS2 = {
    root: HTMLDivElement,
    picture: HTMLImageElement,
    name: HTMLElement,
    description: HTMLElement,
    edit: HTMLButtonElement,
    delete: HTMLButtonElement
  };
  function makePersonaItemView(persona, picture, handlers) {
    const { refs: r } = h(template2, REFS2);
    r.root.dataset.id = persona.id;
    r.picture.src = placeholder(null);
    setPicture(r.picture, picture);
    r.name.textContent = persona.name;
    r.description.textContent = persona.description;
    r.edit.addEventListener("click", handlers.edit);
    r.delete.addEventListener("click", handlers.delete);
    return r.root;
  }

  // src/units/settings/persona.ts
  var PRONOUNS_HE = {
    subjective: "he",
    objective: "him",
    possessiveAdj: "his",
    possessivePro: "his",
    reflexive: "himself"
  };
  var PRONOUNS_SHE = {
    subjective: "she",
    objective: "her",
    possessiveAdj: "her",
    possessivePro: "hers",
    reflexive: "herself"
  };
  var PRONOUNS_THEY = {
    subjective: "they",
    objective: "them",
    possessiveAdj: "their",
    possessivePro: "theirs",
    reflexive: "themselves"
  };
  var pronMap = {
    he: PRONOUNS_HE,
    she: PRONOUNS_SHE,
    they: PRONOUNS_THEY
  };
  function personaUnit() {
    const filePicker = document.querySelector("#settings-persona-picture");
    const nameInput = document.querySelector("#settings-persona-name");
    const descInput = document.querySelector("#settings-persona-desc");
    const pronInput = document.querySelector("#settings-persona-pronouns");
    const personaList = document.querySelector("#settings-persona-list");
    const submitButton = document.querySelector("#settings-add-persona");
    const form = document.querySelector("#settings-persona-form");
    const divider = document.querySelector("#settings-persona-divider");
    const editingIndicator = document.querySelector("#settings-persona-editing-indicator");
    let editingPersona = null;
    submitButton.addEventListener("click", async () => {
      const name = nameInput.value;
      const desc = descInput.value;
      if (!name || !desc) return;
      const file = filePicker.value;
      const picture = typeof file === "string" ? file || null : await upload(file);
      await idb.set("personas", {
        id: editingPersona?.id ?? crypto.randomUUID(),
        name,
        description: desc,
        pronouns: pronMap[pronInput.value],
        picture,
        lastUpdate: Date.now()
      });
      filePicker.usePlaceholder();
      nameInput.value = "";
      descInput.value = "";
      pronInput.value = "they";
      editingPersona = null;
      editingIndicator.hidden = true;
    });
    form.addEventListener("paste", (e) => {
      const file = e.clipboardData?.files[0];
      if (!file) return;
      e.preventDefault();
      filePicker.paste(file);
    });
    function removePersona(id) {
      if (!confirm("confirm deletion")) return;
      return idb.del("personas", id);
    }
    async function startEditing(persona) {
      editingPersona = persona;
      nameInput.value = persona.name;
      descInput.value = persona.description;
      pronInput.value = persona.pronouns.subjective;
      if (persona.picture) {
        filePicker.value = persona.picture;
      }
      editingIndicator.hidden = false;
      editingIndicator.textContent = `editing: ${persona.name}`;
      divider.scrollIntoView({ behavior: "smooth" });
    }
    async function updatePersonaList() {
      const personas = await idb.getAll("personas");
      if (!personas.success) return;
      personaList.innerHTML = "";
      const items = personas.value.reverse().map((p2) => makePersonaItemView(
        p2,
        p2.picture ? getBlobLink(p2.picture) : null,
        {
          edit: () => startEditing(p2),
          delete: () => removePersona(p2.id)
        }
      ));
      if (items.length > 0)
        personaList.append(...items);
      else
        personaList.append(placeholderView("No personas found"));
    }
    listen(async (update4) => {
      if (update4.storage !== "idb") return;
      if (update4.store !== "personas") return;
      updatePersonaList();
    });
    updatePersonaList();
  }

  // src/units/settings/themes.ts
  var STORAGE_KEY_THEME = "theme";
  var CSS_THEMES_FILE = "theme.css";
  function initTheme() {
    const theme = window.localStorage.getItem(STORAGE_KEY_THEME);
    if (theme) switchTheme(theme);
    const rules = [];
    for (const ss of Array.from(document.styleSheets))
      if (ss.href?.includes(CSS_THEMES_FILE)) {
        const raw = [...Array.from(ss.cssRules)];
        rules.push(...raw.filter((r) => r.constructor.name === "CSSStyleRule"));
      }
    const themes = rules.map((r) => r.selectorText.match(/\.theme-(.*)/)).filter((r) => r);
    document.querySelector("#settings-themes")?.append(...themes.map((t) => selectorItem(t[1])));
  }
  function selectorItem(name) {
    const template10 = document.querySelector("#template-theme-selector");
    const button = k(template10);
    const themeClassName = `theme-${name}`;
    button.classList.add(themeClassName);
    button.addEventListener("click", () => switchTheme(themeClassName));
    return button;
  }
  function switchTheme(themeClassName) {
    document.body.classList.forEach((c2) => {
      if (c2.startsWith("theme-")) document.body.classList.remove(c2);
    });
    document.body.classList.add(themeClassName);
    window.localStorage.setItem(STORAGE_KEY_THEME, themeClassName);
  }

  // src/units/settings/backup.ts
  function initBackup() {
    const saveButton = document.querySelector("#settings-backup-save");
    const importPicker = document.querySelector("#settings-backup-import");
    const cleanupButton = document.querySelector("#settings-media-clean");
    const partialList = document.querySelector("#settings-backup-partial-list");
    const savePartialButton = document.querySelector("#settings-backup-partial");
    const { backupCall: runPartial } = initPartial(partialList);
    saveButton.addEventListener("click", () => backup());
    importPicker.addEventListener("input", () => restore(importPicker));
    cleanupButton.addEventListener("click", mediaCleanup);
    savePartialButton.addEventListener("click", () => runPartial());
  }
  var ALL_STORES = [
    "chatContents",
    "chats",
    "personas",
    "scenarios",
    "media"
  ];
  async function backup(backupKeys = ALL_STORES, settings = true) {
    if (backupKeys.length === 0 && !settings) {
      toast("nothing selected");
      return;
    }
    const closeToast = toast("on it, please wait...");
    const idbBackupEntries = await Promise.all(
      backupKeys.map(
        async (k3) => [k3, await idb.getAll(k3)]
      )
    );
    const idbBackup = Object.fromEntries(
      idbBackupEntries.filter(([k3, v2]) => {
        if (!v2.success) {
          toast(`failed to read ${k3}; skipped`);
        }
        return v2.success;
      }).map(([k3, v2]) => [k3, v2.success ? v2.value : []])
    );
    if ("media" in idbBackup) {
      for (const m2 of idbBackup.media) {
        m2.media = await b64Encoder.encode(m2.media);
      }
    }
    const backup2 = {
      idb: idbBackup,
      local: {}
    };
    if (settings) {
      const localData = {
        providers: local.get("providers"),
        activeProvider: local.get("activeProvider"),
        settings: local.get("settings"),
        theme: local.get("theme")
      };
      backup2.local = localData;
    }
    const payload = JSON.stringify(backup2);
    closeToast();
    const isFull = ALL_STORES.length === backupKeys.length && settings;
    download(payload, `${(/* @__PURE__ */ new Date()).toLocaleString()}${isFull ? "" : "_PARTIAL"}.aegir.backup.json`);
  }
  async function restore(picker) {
    const file = picker.input.files?.[0];
    if (!file) return;
    const closeToast = toast("on it, please wait...");
    const raw = await file.text();
    const parsed = JSON.parse(raw);
    if (parsed.idb.media) {
      for (const item of parsed.idb.media) {
        await idb.set(
          "media",
          {
            id: item.id,
            media: await b64Encoder.decode(item.media),
            mime: item.mime
          }
        );
      }
    }
    for (const [store, data] of Object.entries(parsed.idb)) {
      if (store === "media") continue;
      for (const item of data) {
        if (store === "chats" && !item.messageChunks)
          item.messageChunks = [];
        await idb.set(store, item);
      }
    }
    for (const [key, data] of Object.entries(parsed.local)) {
      if (data) local.set(key, data);
    }
    closeToast();
    toast("restore complete!");
  }
  async function mediaCleanup() {
    const media = await idb.getAll("media");
    if (!media.success) {
      toast("can't load media");
      return;
    }
    const mids = new Set(media.value.map((m2) => m2.id));
    const checkout = (id) => {
      if (id) mids.delete(id);
    };
    const [
      chats,
      personas,
      scenarios
    ] = await Promise.all([
      idb.getAll("chats"),
      idb.getAll("personas"),
      idb.getAll("scenarios")
    ]);
    if (!chats.success || !personas.success || !scenarios.success) {
      toast("loaded the media but can't load other data, aborting");
      return;
    }
    for (const chat of chats.value) {
      checkout(chat.scenario.picture);
      checkout(chat.userPersona.picture);
    }
    for (const persona of personas.value) {
      checkout(persona.picture);
    }
    for (const scenario of scenarios.value) {
      checkout(scenario.card.picture);
      checkout(scenario.chat.picture);
    }
    if (mids.size > 0) {
      const close = toast(`media found: ${mids.size}, deleting...`);
      await Promise.all(
        mids.values().map((id) => idb.del("media", id))
      );
      close();
      toast(`done; ${mids.size} items deleted`);
    } else {
      toast("no unused media found");
    }
  }
  function initPartial(list) {
    function checkbox(caption) {
      const cb = E({
        tagName: "input",
        attributes: {
          type: "checkbox",
          checked: "true"
        }
      });
      const e = E({
        tagName: "label",
        className: "row-compact align-center",
        contents: [
          cb,
          E({
            tagName: "div",
            contents: caption
          })
        ]
      });
      return [e, () => cb.checked];
    }
    list.innerHTML = "";
    const items = {
      chats: checkbox("Chats"),
      media: checkbox("Media"),
      personas: checkbox("Personas"),
      scenarios: checkbox("Scenario library"),
      settings: checkbox("Settings")
    };
    list.append(...Object.values(items).map(([e]) => e));
    return {
      backupCall: () => {
        const stores = [];
        if (items.chats[1]()) {
          stores.push("chats");
          stores.push("chatContents");
        }
        if (items.media[1]()) stores.push("media");
        if (items.personas[1]()) stores.push("personas");
        if (items.scenarios[1]()) stores.push("scenarios");
        return backup(stores, items.settings[1]());
      }
    };
  }

  // src/units/settings/misc.ts
  function initMisc() {
    const tailInput = document.querySelector("#settings-options-tail");
    const remberStretchInput = document.querySelector("#settings-options-rember-stretch");
    const oocAsUserInput = document.querySelector("#settings-options-ooc-user");
    const cwo = document.querySelector("#settings-options-cwo");
    const miscSave = document.querySelector("#settings-misc-save");
    listen((u3) => {
      if (u3.storage !== "local") return;
      if (u3.key !== "settings") return;
      updateSettings();
    });
    updateSettings();
    miscSave.addEventListener("click", () => {
      const settings = loadMiscSettings();
      const tail = parseInt(tailInput.value, 10);
      const cw = parseFloat(cwo.value);
      settings.tail = isNaN(tail) ? 0 : tail;
      settings.remberStretch = remberStretchInput.checked;
      settings.oocAsUser = oocAsUserInput.checked;
      settings.contentWidthOverride = isNaN(cw) ? 0 : cw;
      local.set("settings", JSON.stringify(settings));
      toast("settings updated");
    });
    function updateSettings() {
      const settings = loadMiscSettings();
      tailInput.value = String(settings.tail);
      remberStretchInput.checked = settings.remberStretch;
      oocAsUserInput.checked = settings.oocAsUser;
      cwo.value = String(settings.contentWidthOverride);
    }
  }
  var DEFAULT_SETTINGS = {
    tail: 100,
    remberStretch: true,
    oocAsUser: false,
    contentWidthOverride: 0
  };
  function loadMiscSettings() {
    const raw = local.get("settings");
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = nothrow(() => JSON.parse(raw));
    if (!parsed.success) return DEFAULT_SETTINGS;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed.value
    };
  }

  // src/units/settings.ts
  function settingsUnit() {
    initTheme();
    personaUnit();
    providersUnit();
    initBackup();
    initMisc();
  }

  // ../../node_modules/tokenx/dist/index.mjs
  var PATTERNS = {
    whitespace: /^\s+$/,
    structuredWhitespace: /\n\s/,
    cjk: /[\u4E00-\u9FFF\u3400-\u4DBF\u3000-\u30FF\uFF00-\uFFEF\u2E80-\u2EFF\u31C0-\u31EF\u3200-\u32FF\u3300-\u33FF\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/,
    numeric: /^\d+$/,
    punctuation: /[.,!?;(){}[\]<>:/\\|@#$%^&*+=`~_"-]/
  };
  var TOKEN_SPLIT_PATTERN = new RegExp(`(\\s+|${PATTERNS.punctuation.source}+)`);
  var DEFAULT_CHARS_PER_TOKEN = 6;
  var SHORT_TOKEN_THRESHOLD = 3;
  var KANA_CHARS_PER_TOKEN = 1.35;
  var DEFAULT_LANGUAGE_CONFIGS = [
    {
      pattern: /[äöüßẞ]/i,
      averageCharsPerToken: 2.6
    },
    {
      pattern: /[éèêëàâîïôûùüÿçœæáíóúñ]/i,
      averageCharsPerToken: 3
    },
    {
      pattern: /[ąćęłńóśźżěščřžýůúďťň]/i,
      averageCharsPerToken: 2.5
    },
    {
      pattern: /[\u0430-\u044F\u0451]/i,
      averageCharsPerToken: 4
    },
    {
      pattern: /[\u03AC-\u03CE]/i,
      averageCharsPerToken: 2.75
    },
    {
      pattern: /^\p{Extended_Pictographic}[\p{Extended_Pictographic}\p{Emoji_Component}]*$/u,
      averageCharsPerToken: 0.75
    }
  ];
  function* walkSegments(text2, options = {}) {
    if (!text2) return;
    const resolvedOptions = resolveOptions(options);
    for (const segment of text2.split(TOKEN_SPLIT_PATTERN)) if (segment) yield {
      segment,
      tokenCount: estimateSegmentTokens(segment, resolvedOptions)
    };
  }
  function resolveOptions(options) {
    return {
      defaultCharsPerToken: options.defaultCharsPerToken ?? DEFAULT_CHARS_PER_TOKEN,
      languageConfigs: options.languageConfigs ?? DEFAULT_LANGUAGE_CONFIGS
    };
  }
  function estimateSegmentTokens(segment, { languageConfigs, defaultCharsPerToken }) {
    if (PATTERNS.whitespace.test(segment)) return PATTERNS.structuredWhitespace.test(segment) ? 1 : 0;
    const languageCharsPerToken = getLanguageSpecificCharsPerToken(segment, languageConfigs);
    if (languageCharsPerToken !== void 0) return Math.ceil(getCharacterCount(segment) / languageCharsPerToken);
    if (PATTERNS.cjk.test(segment)) return estimateCjkTokens(segment);
    if (PATTERNS.numeric.test(segment)) return Math.ceil(segment.length / 3);
    if (segment.length <= SHORT_TOKEN_THRESHOLD) return 1;
    if (PATTERNS.punctuation.test(segment)) return Math.ceil(segment.length / 2);
    return Math.ceil(segment.length / defaultCharsPerToken);
  }
  function getLanguageSpecificCharsPerToken(segment, languageConfigs) {
    for (const config of languageConfigs) if (segment.search(config.pattern) !== -1) return config.averageCharsPerToken;
  }
  function getCharacterCount(text2) {
    return Array.from(text2).length;
  }
  function estimateCjkTokens(segment) {
    let kanaCount = 0;
    let otherCount = 0;
    for (const character of segment) {
      const codePoint = character.codePointAt(0);
      if (codePoint >= 12352 && codePoint <= 12543) kanaCount++;
      else otherCount++;
    }
    return otherCount + Math.ceil(kanaCount / KANA_CHARS_PER_TOKEN);
  }
  function estimateTokenCount(text2, options = {}) {
    if (!text2) return 0;
    let tokenCount = 0;
    for (const segmentEstimate of walkSegments(text2, options)) tokenCount += segmentEstimate.tokenCount;
    return tokenCount;
  }

  // src/run.ts
  var OR_ATTRIBUTION_HEADERS = {
    "HTTP-Referer": "https://aegir",
    // retarded OR attribution expects me to own the whole domain for some reason
    "X-OpenRouter-Title": "Aegir (https://milesvii.github.io/agir/)",
    // unicode? never heard of her
    "X-OpenRouter-Categories": "roleplay"
  };
  async function runProvider(prompt2, provider, hooks) {
    const chonks = [];
    const reasoningEffort = provider.reasoning && provider.reasoning !== "unset" ? { reasoning: { effort: provider.reasoning } } : {};
    const params = {
      model: provider.model,
      messages: prompt2,
      stream: true,
      ...reasoningEffort,
      max_completion_tokens: provider.max,
      temperature: provider.temp,
      ...provider.params
    };
    if (!provider.max) delete params.max_completion_tokens;
    try {
      const attribution = provider.url.toLowerCase().includes("openrouter.ai/") ? OR_ATTRIBUTION_HEADERS : {};
      const response = await fetch(provider.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider.key}`,
          "Content-Type": "application/json",
          ...attribution
        },
        body: JSON.stringify(params),
        signal: hooks.signal
      });
      if (!response.ok) {
        const body = await nothrowAsync(response.text());
        if (!body.success) {
          return {
            success: false,
            error: `Status ${response.status}, unknown error`
          };
        }
        const parsed = nothrow(() => JSON.parse(body.value));
        if (!parsed.success || !parsed.value?.error?.message) {
          return {
            success: false,
            error: `Unparsed; Provider says "${body.value}"
Status ${response.status}`
          };
        }
        const meta = parsed.value?.error?.metadata;
        const metaWrapped = meta ? `
Metadata:
${JSON.stringify(meta, null, "	")}` : "";
        return {
          success: false,
          error: `Provider says "${parsed.value.error.message}"
Status ${response.status}${metaWrapped}`
        };
      }
      const reader = response.body?.getReader();
      if (!reader) {
        return {
          success: false,
          error: "Response body is not readable"
        };
      }
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        while (true) {
          const lineEnd = buffer.indexOf("\n");
          if (lineEnd === -1) break;
          const line = buffer.slice(0, lineEnd);
          buffer = buffer.slice(lineEnd + 1);
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            const parsed = nothrow(() => JSON.parse(data));
            if (!parsed.success) continue;
            if (parsed.value.error) {
              return {
                success: false,
                error: `Provider says "${JSON.stringify(parsed.value.error)}"`
              };
            }
            try {
              const delta = parsed.value.choices[0].delta;
              const reasoning = delta.reasoning || delta.reasoning_content;
              const content = delta.content;
              if (reasoning) {
                hooks.onReasoningStatus?.(true);
                hooks.onReasoningChunk?.(reasoning);
              } else if (content) {
                hooks.onReasoningStatus?.(false);
                chonks.push(content);
                hooks.onChunk(content);
              }
            } catch (e) {
              console.warn("Chunk error: ", parsed.value, e);
            }
          }
        }
      }
    } catch (e) {
      if (!hooks.signal.aborted)
        return {
          success: false,
          error: e?.message ?? "unknown error"
        };
    }
    const result = chonks.join("");
    const legacyReasoningSeparator = "</think>";
    if (result.includes(legacyReasoningSeparator)) {
      const [reasoning, value] = result.split(legacyReasoningSeparator).map((v2) => v2.trim());
      if (reasoning) hooks.onReasoningChunk?.(reasoning);
      return { success: true, value: value.trim() };
    }
    return { success: true, value: result };
  }

  // src/units/chat/generation.ts
  var active = null;
  var listeners = [];
  function activeJob() {
    return active?.kind ?? null;
  }
  function onJobChange(listener) {
    listeners.push(listener);
  }
  function cancelJob() {
    active?.controller.abort();
  }
  async function runJob(kind, provider, prompt2, hooks) {
    if (active) return { success: false, error: `please wait until ${active.kind} generation is over` };
    const controller = new AbortController();
    active = { kind, controller };
    listeners.forEach((l) => l(kind));
    const result = await runProvider(prompt2, provider, { ...hooks, signal: controller.signal });
    active = null;
    listeners.forEach((l) => l(null));
    return result;
  }

  // src/units/chat/session.ts
  var current = null;
  var replacedListeners = [];
  var commitListeners = [];
  function onSessionReplaced(listener) {
    replacedListeners.push(listener);
  }
  function onSessionCommit(listener) {
    commitListeners.push(listener);
  }
  function getSession() {
    return current;
  }
  async function openSession(chatId) {
    current = chatId ? await load(chatId) : null;
    replacedListeners.forEach((l) => l(current));
    return current;
  }
  async function load(chatId) {
    const [chat, contents] = await Promise.all([
      idb.get("chats", chatId),
      idb.get("chatContents", chatId)
    ]);
    if (!chat.success || !contents.success) return null;
    if (!chat.value || !contents.value) return null;
    healSwipeIndexes(contents.value.messages);
    return { chat: chat.value, contents: contents.value };
  }
  listen((update4) => {
    if (update4.storage !== "idb" || !update4.remote || !current) return;
    if (update4.store !== "chats" && update4.store !== "chatContents") return;
    if (activeJob()) return;
    openSession(current.chat.id);
  });
  async function commit(session) {
    session.chat.lastUpdate = Date.now();
    session.chat.messageCount = session.contents.messages.length;
    return await write(session, true, true);
  }
  async function commitContents(session) {
    return await write(session, false, true);
  }
  async function commitChat(session) {
    return await write(session, true, false);
  }
  async function write(session, chat, contents) {
    const results = await Promise.all([
      chat ? idb.set("chats", session.chat) : null,
      contents ? idb.set("chatContents", session.contents) : null
    ]);
    const ok = results.every((r) => r === null || r.success);
    if (!ok) {
      toast("failed to save chat");
      return false;
    }
    if (current && current !== session && current.chat.id === session.chat.id) {
      current = session;
      replacedListeners.forEach((l) => l(current));
    }
    commitListeners.forEach((l) => l(session));
    return true;
  }
  function messageByID(session, mid) {
    return session.contents.messages.find((m2) => m2.id === mid) ?? null;
  }
  function lastModelMessage(session) {
    return session.contents.messages.findLast((m2) => m2.from === "model") ?? null;
  }
  function selectedText(message) {
    return message.swipes[message.selectedSwipe] ?? message.swipes[0] ?? "";
  }
  var NAMES_BY_ROLE = {
    system: "OOC"
  };
  function addMessage(session, from, text2) {
    const messages = session.contents.messages;
    const names = {
      user: session.chat.userPersona.name,
      model: session.chat.scenario.name,
      system: NAMES_BY_ROLE.system
    };
    const message = {
      id: messages.reduce((max, m2) => Math.max(max, m2.id), -1) + 1,
      from,
      name: names[from],
      rember: null,
      selectedSwipe: 0,
      swipes: [text2]
    };
    messages.push(message);
    return message;
  }
  function removeMessage(session, mid) {
    const messages = session.contents.messages;
    const index = messages.findIndex((m2) => m2.id === mid);
    if (index < 0 || messages[index].from !== "system") return false;
    messages.splice(index, 1);
    return true;
  }
  function pushSwipe(session, mid, text2, reasoning) {
    const message = messageByID(session, mid);
    if (!message) return null;
    message.swipes = message.swipes.filter((s) => s.trim());
    message.swipes.push(text2);
    message.selectedSwipe = message.swipes.length - 1;
    if (reasoning) {
      if (!message.reasoningBoxes) message.reasoningBoxes = [];
      message.reasoningBoxes[message.selectedSwipe] = reasoning;
    }
    return message;
  }
  function setSwipeText(session, mid, swipe, text2) {
    const message = messageByID(session, mid);
    if (!message || typeof message.swipes[swipe] !== "string") return false;
    message.swipes[swipe] = text2;
    return true;
  }
  function selectSwipe(session, mid, swipe) {
    const message = messageByID(session, mid);
    if (!message) return false;
    if (typeof message.swipes[swipe] !== "string") {
      toast(`error: setting six ${swipe} on mid ${mid}, but only ${message.swipes.length} swipes are present`);
      return false;
    }
    message.selectedSwipe = swipe;
    return true;
  }
  function setRember(session, mid, value) {
    const message = messageByID(session, mid);
    if (!message) return false;
    message.rember = value;
    return true;
  }
  function truncateFrom(session, mid) {
    const messages = session.contents.messages;
    const index = messages.findIndex((m2) => m2.id === mid);
    if (index < 0) return [];
    return messages.splice(index).map((m2) => m2.id);
  }
  function healSwipeIndexes(messages) {
    messages.forEach((m2) => {
      if (typeof m2.swipes[m2.selectedSwipe] !== "string") {
        toast(`healed malformed message: mid ${m2.id}, old six: ${m2.selectedSwipe}`);
        m2.selectedSwipe = 0;
      }
    });
  }

  // src/units/chat/editor.ts
  function initChatEditor() {
    const saveButton = document.querySelector("#play-editor-save");
    const resetButton = document.querySelector("#play-editor-reset");
    const closeButton = document.querySelector("#play-editor-close");
    const definitionInput = document.querySelector("#play-editor-definition");
    const modal = document.querySelector("#play-editor");
    makeResizable(definitionInput);
    resetButton.addEventListener("click", fill);
    closeButton.addEventListener("click", () => modal.close());
    saveButton.addEventListener("click", async () => {
      const value = definitionInput.value.trim();
      if (!value) return;
      const session = getSession();
      if (!session) return;
      session.chat.scenario.definition = value;
      session.chat.scenario.tokenCount = estimateTokenCount(value);
      await commitChat(session);
      modal.close();
    });
    function fill() {
      const session = getSession();
      if (!session) return;
      definitionInput.value = session.chat.scenario.definition;
      textareaReconsider(definitionInput);
    }
    return {
      open: () => {
        fill();
        modal.open();
        textareaReconsider(definitionInput);
      }
    };
  }

  // src/units/chat/prompt.ts
  var REMBER_DEFAULTS = {
    stride: 40,
    prompt: [
      "provide summary of a text roleplay session described by the user.",
      "update provided state to reflect any changes to it.",
      "format trivia as a list of facts.",
      "stay concise and ignore any info irrelevant to possible future scenarios.",
      "do not provide any commentary, only describe the new state, do not change the format (the headings), do not include the chat history.",
      "follow this format when describing the roleplay state summary:",
      "```",
      "## current location",
      "",
      "## locations and objects",
      "### location example",
      "- example item",
      "- example item",
      "",
      "## noteworthy trivia",
      "",
      "## future plans and promises",
      "",
      "```"
    ].join("\n")
  };
  var SYSTEM_MACRO = "{{system}}";
  function roleplayPrompt(session, beforeMid, options) {
    const messages = session.contents.messages;
    const upTo = messages.findIndex((m2) => m2.id === beforeMid);
    const history = upTo === -1 ? messages : messages.slice(0, upTo);
    const remberAt = history.findLastIndex((m2) => m2.rember);
    let start2 = options.tail > 0 ? Math.max(0, history.length - options.tail) : 0;
    if (options.remberStretch && remberAt !== -1) start2 = Math.min(start2, remberAt);
    const definition = session.chat.scenario.definition;
    const lore = options.lore;
    const prompt2 = [];
    if (lore?.before.length) prompt2.push(system(lore.before.join("\n\n")));
    prompt2.push(system(options.suffix ? `${definition}
${options.suffix}` : definition));
    if (lore?.after.length) prompt2.push(system(lore.after.join("\n\n")));
    const turns = [];
    for (let i = start2; i < history.length; ++i) {
      if (i === remberAt)
        turns.push(system(`# Roleplay state summary:
${history[i].rember}`));
      turns.push(toPrompt(history[i], options.oocAsUser));
    }
    for (const { depth, role, content } of [...lore?.atDepth ?? []].sort((a, b2) => b2.depth - a.depth))
      turns.splice(Math.max(0, turns.length - depth), 0, { role, content });
    return [...prompt2, ...turns];
  }
  function remberPrompt(session, settings, scope, previousState) {
    const names = {
      user: session.chat.userPersona.name,
      model: session.chat.scenario.name,
      system: ""
    };
    const history = scope.filter((m2) => m2.from !== "system").map((m2) => `## ${names[m2.from]}:
${selectedText(m2)}

`).join("\n");
    const payload = [
      ...previousState ? ["# saved roleplay state", previousState, ""] : [],
      "# chat history",
      history
    ].join("\n");
    const definition = session.chat.scenario.definition.replace(/^#+/gm, (v2) => `#${v2}`);
    return [
      system(settings.prompt.replace(SYSTEM_MACRO, definition)),
      { role: "user", content: payload }
    ];
  }
  function system(content) {
    return { role: "system", content };
  }
  var OOC_PREFIX = "OOC: ";
  function toPrompt(message, oocAsUser) {
    if (message.from === "system" && oocAsUser)
      return { role: "user", content: OOC_PREFIX + selectedText(message) };
    return {
      role: message.from === "model" ? "assistant" : message.from,
      content: selectedText(message)
    };
  }

  // src/units/chat/macros.ts
  var PRON_MACROS = {
    "{{sub}}": "subjective",
    "{{he}}": "subjective",
    "{{she}}": "subjective",
    "{{they}}": "subjective",
    "{{obj}}": "objective",
    "{{them}}": "objective",
    "{{poss}}": "possessiveAdj",
    "{{their}}": "possessiveAdj",
    "{{poss_p}}": "possessivePro",
    "{{theirs}}": "possessivePro",
    "{{ref}}": "reflexive",
    "{{themselves}}": "reflexive"
  };
  var CHAR_NAME_MACRO = "{{char}}";
  var USER_NAME_MACRO = "{{user}}";
  var PERSONA_MACRO = "{{persona}}";
  var MACROS_MACRO = "{{macros}}";
  var MACROS = `# Macros
## Names
{{char}}
    Character name
{{user}}
    User's persona name

## User's persona pronouns:
{{sub}} or {{they}}
    subjective (he/she/they)
{{obj}} or {{them}}
    objective (him/her/them)
{{poss}} or {{their}}
    possessive (his/her/their)
{{poss_p}} or {{theirs}}
    possessive pronoun (his/hers/theirs)
{{ref}} or {{themselves}}
    reflexive (himself/herself/themselves)`;
  function runMacros(template10, context) {
    for (const [from, toKey] of Object.entries(PRON_MACROS)) {
      template10 = template10.replaceAll(from, context.pronouns[toKey]);
    }
    template10 = template10.replaceAll(CHAR_NAME_MACRO, context.charName);
    template10 = template10.replaceAll(USER_NAME_MACRO, context.userName);
    template10 = template10.replaceAll(PERSONA_MACRO, context.persona);
    template10 = template10.replaceAll(MACROS_MACRO, MACROS);
    return template10;
  }
  function macroContext(chat) {
    return {
      pronouns: chat.userPersona.pronouns,
      charName: chat.scenario.name,
      userName: chat.userPersona.name,
      persona: chat.userPersona.description
    };
  }

  // src/units/chat/lore.ts
  var LORE_DEFAULTS = {
    scanDepth: 2,
    tokenBudget: 2048
  };
  var MAX_RECURSION = 10;
  function loreSettingsOf(session) {
    return session.chat.lore ?? LORE_DEFAULTS;
  }
  function activateLore(session, beforeMid) {
    const books = (session.chat.lorebooks ?? []).filter((b2) => b2.enabled);
    if (books.length === 0) return null;
    const settings = loreSettingsOf(session);
    const messages = session.contents.messages;
    const upTo = messages.findIndex((m2) => m2.id === beforeMid);
    const history = (upTo === -1 ? messages : messages.slice(0, upTo)).filter((m2) => m2.from !== "system");
    const summary = history.findLast((m2) => m2.rember)?.rember ?? "";
    const macros = macroContext(session.chat);
    const buffers = /* @__PURE__ */ new Map();
    const buffer = (depth) => {
      let text2 = buffers.get(depth);
      if (text2 === void 0) {
        text2 = [...history.slice(-Math.max(1, depth)).map(selectedText), summary].join("\n");
        buffers.set(depth, text2);
      }
      return text2;
    };
    const expand = (c2) => runMacros(c2.entry.content, macros);
    const candidates = books.flatMap(
      (book) => book.entries.filter((e) => e.enabled).map((entry) => ({ book, entry }))
    );
    const activated = /* @__PURE__ */ new Map();
    for (const c2 of candidates) {
      if (c2.entry.constant) {
        activated.set(c2, expand(c2));
        continue;
      }
      const depth = c2.entry.scanDepth ?? c2.book.scanDepth ?? settings.scanDepth;
      if (matches(c2, buffer(depth))) activated.set(c2, expand(c2));
    }
    let fresh = [...activated.keys()];
    for (let pass = 0; pass < MAX_RECURSION && fresh.length > 0; ++pass) {
      const text2 = fresh.filter((c2) => c2.book.recursive && !c2.entry.preventRecursion).map((c2) => activated.get(c2)).join("\n");
      if (!text2) break;
      fresh = candidates.filter(
        (c2) => !activated.has(c2) && c2.book.recursive && !c2.entry.excludeRecursion && matches(c2, text2)
      );
      fresh.forEach((c2) => activated.set(c2, expand(c2)));
    }
    const kept = [];
    const bookTokens = /* @__PURE__ */ new Map();
    let tokens = 0;
    let dropped = 0;
    for (const c2 of [...activated.keys()].sort((a, b2) => b2.entry.order - a.entry.order)) {
      const content = activated.get(c2);
      const cost = estimateTokenCount(content);
      const bookTotal = (bookTokens.get(c2.book.id) ?? 0) + cost;
      const overBudget = tokens + cost > settings.tokenBudget || c2.book.tokenBudget !== null && bookTotal > c2.book.tokenBudget;
      if (overBudget && !c2.entry.constant) {
        ++dropped;
        continue;
      }
      tokens += cost;
      bookTokens.set(c2.book.id, bookTotal);
      kept.push({ book: c2.book.name, entry: c2.entry, content, tokens: cost });
    }
    kept.sort((a, b2) => a.entry.order - b2.entry.order);
    return {
      before: kept.filter((k3) => k3.entry.position === "before").map((k3) => k3.content),
      after: kept.filter((k3) => k3.entry.position === "after").map((k3) => k3.content),
      atDepth: kept.filter((k3) => k3.entry.position === "depth").map((k3) => ({ depth: k3.entry.depth, role: k3.entry.role, content: k3.content })),
      activated: kept,
      dropped,
      tokens
    };
  }
  function matches({ book, entry }, text2) {
    const caseSensitive = entry.caseSensitive ?? book.caseSensitive;
    const wholeWords = entry.wholeWords ?? book.wholeWords;
    const hit = (key) => keyPattern(key, caseSensitive, wholeWords).test(text2);
    if (!entry.keys.some(hit)) return false;
    if (entry.secondaryKeys.length === 0) return true;
    const any = entry.secondaryKeys.some(hit);
    const all = entry.secondaryKeys.every(hit);
    switch (entry.logic) {
      case "andAny":
        return any;
      case "andAll":
        return all;
      case "notAny":
        return !any;
      case "notAll":
        return !all;
    }
  }
  var patterns = /* @__PURE__ */ new Map();
  function keyPattern(key, caseSensitive, wholeWords) {
    const flags = "u" + (caseSensitive ? "" : "i");
    const cacheKey = `${flags}/${wholeWords}/${key}`;
    let pattern = patterns.get(cacheKey);
    if (!pattern) {
      const escaped = key.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      pattern = new RegExp(wholeWords ? `(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])` : escaped, flags);
      patterns.set(cacheKey, pattern);
    }
    return pattern;
  }
  var last = null;
  var listeners2 = [];
  function reportLore(activation) {
    last = activation;
    listeners2.forEach((l) => l(activation));
  }
  function onLore(listener) {
    listeners2.push(listener);
  }

  // src/views/message.html
  var message_default = '<div class="message" data-ref="root">\n	<img data-ref="avatar">\n	<div>\n		<div class="row">\n			<div data-ref="name"   class="message-name"></div>\n			<div data-ref="status" class="message-status" hidden></div>\n			<div class="message-controls-scroller row">\n				<div class="virtual" data-tab="main">\n					<button data-ref="reasoning" class="strip ghost pointer message-control" title="show reasoning" hidden>R</button>\n					<button data-ref="rember"    class="strip ghost pointer message-control rember-glow" title="open rember" hidden>\u29D6</button>\n					<div data-ref="swipes" class="row-compact no-shrink" hidden>\n						<button data-ref="prev" class="strip ghost pointer message-control" title="prev swipe">&lt;</button>\n						<span   data-ref="swipe-caption"></span>\n						<button data-ref="next" class="strip ghost pointer message-control" title="next swipe">&gt;</button>\n					</div>\n					<button data-ref="edit"  class="strip ghost pointer message-control" title="edit message">\u270E</button>\n					<button data-ref="copy"  class="strip ghost pointer message-control" title="copy message">\u29C9</button>\n					<button data-ref="reroll" class="strip ghost pointer message-control" title="reroll this message" hidden>\u21BA</button>\n					<button data-ref="delete" class="strip ghost pointer message-control" title="delete message along with following" hidden>\u2716</button>\n				</div>\n				<div class="virtual" data-tab="editing" hidden>\n					<button data-ref="save"   class="strip ghost pointer message-control" title="save">\u2714</button>\n					<button data-ref="cancel" class="strip ghost pointer message-control" title="cancel">\u2718</button>\n				</div>\n			</div>\n		</div>\n		<div data-ref="reasoning-preview" class="lineout message-reasoning-preview" hidden></div>\n		<div data-ref="reasoning-box" class="lineout message-think-box" hidden></div>\n		<div data-ref="text" class="message-text edible md"></div>\n	</div>\n</div>\n';

  // src/views/message.ts
  var STATUS = {
    RESPONDING: "responding...",
    REASONING: "thinking..."
  };
  var template3 = R(message_default);
  var REFS3 = {
    root: HTMLDivElement,
    avatar: HTMLImageElement,
    name: HTMLElement,
    status: HTMLElement,
    reasoning: HTMLButtonElement,
    rember: HTMLButtonElement,
    swipes: HTMLElement,
    prev: HTMLButtonElement,
    "swipe-caption": HTMLElement,
    next: HTMLButtonElement,
    edit: HTMLButtonElement,
    copy: HTMLButtonElement,
    reroll: HTMLButtonElement,
    delete: HTMLButtonElement,
    save: HTMLButtonElement,
    cancel: HTMLButtonElement,
    "reasoning-preview": HTMLElement,
    "reasoning-box": HTMLElement,
    text: HTMLElement
  };
  function makeMessageView(msg, [userPic, modelPic], isLast) {
    const { refs: r } = h(template3, REFS3);
    const root = r.root;
    const tabs = tabGroups(root);
    root.dataset.mid = String(msg.id);
    r.avatar.src = placeholder(msg.from === "user" ? userPic : modelPic);
    r.avatar.title = `mid #${msg.id}`;
    r.name.textContent = msg.name;
    r.delete.hidden = msg.from !== "user";
    let streamNode = null;
    r.prev.addEventListener("click", () => swipeBy(-1));
    r.next.addEventListener("click", () => swipeBy(1));
    r.reasoning.addEventListener("click", () => r["reasoning-box"].hidden = !r["reasoning-box"].hidden);
    r.rember.addEventListener("click", () => emit(root, "message:rember", { mid: msg.id }));
    r.reroll.addEventListener("click", () => emit(root, "message:reroll", { mid: msg.id }));
    r.delete.addEventListener("click", () => emit(root, "message:delete", { mid: msg.id }));
    r.copy.addEventListener("click", async () => {
      await navigator.clipboard.writeText(currentText());
      toast("message copied to clipboard", { timeoutMS: 3200 });
    });
    r.edit.addEventListener("click", () => {
      r.text.setAttribute("contenteditable", "true");
      r.text.textContent = currentText();
      r.text.focus();
      tabs.pick("editing");
    });
    r.save.addEventListener("click", () => {
      const text2 = r.text.innerText;
      stopEditing();
      emit(root, "message:edit", { mid: msg.id, swipe: msg.selectedSwipe, text: text2 });
    });
    r.cancel.addEventListener("click", () => {
      stopEditing();
      refresh();
    });
    function currentText() {
      return msg.swipes[msg.selectedSwipe] ?? "";
    }
    function swipeBy(delta) {
      const count = msg.swipes.length;
      const swipe = (msg.selectedSwipe + delta + count) % count;
      emit(root, "message:swipe", { mid: msg.id, swipe });
    }
    function stopEditing() {
      r.text.removeAttribute("contenteditable");
      tabs.pick("main");
    }
    function setStatus(value) {
      r.status.hidden = value === null;
      r.status.textContent = value ?? "";
    }
    function scrollIntoView() {
      if (elementVisible(root))
        root.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    function refresh() {
      streamNode = null;
      r.text.innerHTML = renderMD(currentText());
      r["swipe-caption"].textContent = `${msg.selectedSwipe + 1} / ${msg.swipes.length}`;
      r.swipes.hidden = !(isLast && msg.swipes.length > 1);
      r.reroll.hidden = !(msg.from === "model" && isLast);
      r.rember.hidden = !msg.rember;
      const reasoning = msg.reasoningBoxes?.[msg.selectedSwipe];
      r.reasoning.hidden = !reasoning;
      r["reasoning-box"].textContent = reasoning ?? "";
      r["reasoning-box"].hidden = true;
    }
    function setIsLast(value) {
      isLast = value;
      refresh();
    }
    function startStreaming() {
      r.text.removeAttribute("contenteditable");
      r.text.innerHTML = "";
      streamNode = document.createTextNode("");
      r.text.append(streamNode);
      r["reasoning-preview"].textContent = "";
      r["reasoning-preview"].hidden = true;
      r["reasoning-box"].hidden = true;
      tabs.pick("streaming");
      setStatus(STATUS.RESPONDING);
    }
    function appendChunk(chunk) {
      if (!streamNode) startStreaming();
      streamNode.appendData(chunk);
      scrollIntoView();
    }
    function addReasoningChunk(chunk) {
      if (!streamNode) startStreaming();
      r["reasoning-preview"].hidden = false;
      r["reasoning-preview"].append(chunk);
      r["reasoning-preview"].scrollTop = r["reasoning-preview"].scrollHeight;
    }
    function reasoningStatus(reasoning) {
      setStatus(reasoning ? STATUS.REASONING : STATUS.RESPONDING);
    }
    function endStreaming() {
      r["reasoning-preview"].textContent = "";
      r["reasoning-preview"].hidden = true;
      refresh();
      tabs.pick("main");
      setStatus(null);
      scrollIntoView();
    }
    refresh();
    tabs.pick("main");
    return N(root, {
      mid: msg.id,
      refresh,
      setIsLast,
      startStreaming,
      appendChunk,
      addReasoningChunk,
      reasoningStatus,
      endStreaming
    }, "controls");
  }

  // src/views/system-message.html
  var system_message_default = '<div class="message system-message" data-ref="root">\n	<img data-ref="avatar">\n	<div>\n		<div class="row">\n			<div data-ref="name" class="message-name"></div>\n			<div class="message-controls-scroller row">\n				<div class="virtual" data-tab="main">\n					<button data-ref="edit"   class="strip ghost pointer message-control" title="edit">\u270E</button>\n					<button data-ref="copy"   class="strip ghost pointer message-control" title="copy">\u29C9</button>\n					<button data-ref="delete" class="strip ghost pointer message-control" title="delete">\u2716</button>\n				</div>\n				<div class="virtual" data-tab="editing" hidden>\n					<button data-ref="save"   class="strip ghost pointer message-control" title="save">\u2714</button>\n					<button data-ref="cancel" class="strip ghost pointer message-control" title="cancel">\u2718</button>\n				</div>\n			</div>\n		</div>\n		<div data-ref="text" class="message-text edible system-message-text"></div>\n	</div>\n</div>\n';

  // src/views/system-message.ts
  var REMBER_KEY_SUFFIX = "-r";
  function systemViewKey(mid, rember) {
    return rember ? `${mid}${REMBER_KEY_SUFFIX}` : String(mid);
  }
  var template4 = R(system_message_default);
  var REFS4 = {
    root: HTMLDivElement,
    avatar: HTMLImageElement,
    name: HTMLElement,
    edit: HTMLButtonElement,
    copy: HTMLButtonElement,
    delete: HTMLButtonElement,
    save: HTMLButtonElement,
    cancel: HTMLButtonElement,
    text: HTMLElement
  };
  function makeSystemView(options) {
    const { mid, rember, read } = options;
    const { refs: r } = h(template4, REFS4);
    const root = r.root;
    const tabs = tabGroups(root);
    root.dataset.mid = systemViewKey(mid, rember);
    root.classList.toggle("rember-message", rember);
    root.hidden = !!options.hidden;
    r.avatar.src = placeholder(options.icon);
    r.avatar.title = rember ? `rEmber summary for mid #${mid}` : `mid #${mid}`;
    r.name.textContent = options.name;
    let streamNode = null;
    r.edit.addEventListener("click", () => {
      r.text.setAttribute("contenteditable", "true");
      r.text.textContent = read();
      r.text.focus();
      tabs.pick("editing");
    });
    r.save.addEventListener("click", () => {
      const text2 = r.text.innerText;
      stopEditing();
      emit(root, "system:edit", { mid, rember, text: text2 });
    });
    r.cancel.addEventListener("click", () => {
      stopEditing();
      refresh();
    });
    r.copy.addEventListener("click", async () => {
      await navigator.clipboard.writeText(read());
      toast("copied to clipboard", { timeoutMS: 3200 });
    });
    r.delete.addEventListener("click", () => emit(root, "system:delete", { mid, rember }));
    function stopEditing() {
      r.text.removeAttribute("contenteditable");
      tabs.pick("main");
    }
    function refresh() {
      streamNode = null;
      r.text.textContent = read();
    }
    function startStreaming() {
      r.text.removeAttribute("contenteditable");
      r.text.textContent = "";
      streamNode = document.createTextNode("");
      r.text.append(streamNode);
      tabs.pick("streaming");
    }
    function appendChunk(chunk) {
      if (!streamNode) startStreaming();
      streamNode.appendData(chunk);
    }
    function endStreaming() {
      refresh();
      tabs.pick("main");
    }
    function show() {
      root.hidden = false;
    }
    function toggle() {
      root.hidden = !root.hidden;
    }
    refresh();
    tabs.pick("main");
    return N(root, {
      mid,
      rember,
      refresh,
      startStreaming,
      appendChunk,
      endStreaming,
      show,
      toggle
    }, "controls");
  }

  // src/units/chat/messages.ts
  var BUSY_TOAST = "please wait until message generation is over";
  var OOC_NAME = "OOC";
  var REMBER_NAME = "rEmber";
  var REMBER_ICON = "assets/gfx/rember.png";
  function listElement() {
    return document.querySelector("#play-messages");
  }
  function initMessageList() {
    const list = listElement();
    list.addEventListener("message:swipe", ({ detail }) => {
      const session = getSession();
      if (!session) return;
      if (selectSwipe(session, detail.mid, detail.swipe)) commitContents(session);
      getMessageView(session.chat.id, detail.mid)?.controls.refresh();
    });
    list.addEventListener("message:edit", ({ detail }) => {
      const session = getSession();
      if (!session) return;
      if (setSwipeText(session, detail.mid, detail.swipe, detail.text)) commitContents(session);
      getMessageView(session.chat.id, detail.mid)?.controls.refresh();
    });
    list.addEventListener("message:reroll", ({ detail }) => generate(detail.mid));
    list.addEventListener("message:delete", ({ detail }) => deleteFrom(detail.mid));
    list.addEventListener("message:rember", ({ detail }) => {
      const session = getSession();
      if (!session) return;
      getSystemView(session.chat.id, detail.mid, true)?.controls.toggle();
    });
    list.addEventListener("system:edit", ({ detail }) => {
      const session = getSession();
      if (!session) return;
      const changed = detail.rember ? setRember(session, detail.mid, detail.text) : setNoteText(session, detail.mid, detail.text);
      if (changed) commitContents(session);
      getSystemView(session.chat.id, detail.mid, detail.rember)?.controls.refresh();
    });
    list.addEventListener("system:delete", ({ detail }) => {
      if (detail.rember) deleteRember(detail.mid);
      else deleteNote(detail.mid);
    });
  }
  async function renderMessages(session) {
    const list = listElement();
    list.innerHTML = "";
    delete list.dataset.chat;
    if (!session) return;
    const pictures = await loadPictures(session.chat);
    if (getSession() !== session) return;
    const last2 = lastModelMessage(session);
    list.dataset.chat = session.chat.id;
    list.append(...session.contents.messages.flatMap((m2) => [
      ...m2.rember ? [remberView(m2, true)] : [],
      m2.from === "system" ? noteView(m2) : makeMessageView(m2, pictures, m2 === last2)
    ]));
    list.scrollTop = list.scrollHeight;
  }
  function remberView(message, hidden) {
    return makeSystemView({
      mid: message.id,
      rember: true,
      name: REMBER_NAME,
      icon: REMBER_ICON,
      read: () => message.rember ?? "",
      hidden
    });
  }
  function noteView(message) {
    return makeSystemView({
      mid: message.id,
      rember: false,
      name: message.name || OOC_NAME,
      icon: null,
      read: () => selectedText(message)
    });
  }
  function getMessageView(chatId, mid) {
    const list = listElement();
    if (list.dataset.chat !== chatId) return null;
    return list.querySelector(`.message:not(.system-message)[data-mid="${mid}"]`);
  }
  function getSystemView(chatId, mid, rember) {
    const list = listElement();
    if (list.dataset.chat !== chatId) return null;
    return list.querySelector(`.system-message[data-mid="${systemViewKey(mid, rember)}"]`);
  }
  function ensureRemberView(chatId, mid) {
    const session = getSession();
    const message = session && messageByID(session, mid);
    if (!session || session.chat.id !== chatId || !message) return null;
    const existing = getSystemView(chatId, mid, true);
    if (existing) {
      existing.controls.show();
      return existing;
    }
    const anchor = getMessageView(chatId, mid);
    if (!anchor) return null;
    const view = remberView(message, false);
    anchor.before(view);
    return view;
  }
  function scrollToMessage(chatId, mid) {
    getMessageView(chatId, mid)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  async function sendMessage(text2) {
    const session = getSession();
    if (!session) return false;
    if (activeJob()) {
      toast(BUSY_TOAST);
      return false;
    }
    const previous = lastModelMessage(session);
    const request = addMessage(session, "user", text2);
    const reply = addMessage(session, "model", "");
    if (!await commit(session)) return false;
    const pictures = await loadPictures(session.chat);
    const list = listElement();
    if (previous) getMessageView(session.chat.id, previous.id)?.controls.setIsLast(false);
    list.append(
      makeMessageView(request, pictures, false),
      makeMessageView(reply, pictures, true)
    );
    list.scrollTop = list.scrollHeight;
    generate(reply.id);
    return true;
  }
  async function appendNote(text2) {
    const session = getSession();
    if (!session) return false;
    if (activeJob()) {
      toast(BUSY_TOAST);
      return false;
    }
    const note = addMessage(session, "system", text2);
    if (!await commit(session)) return false;
    const list = listElement();
    list.append(noteView(note));
    list.scrollTop = list.scrollHeight;
    return true;
  }
  async function generate(mid) {
    const session = getSession();
    if (!session) return;
    if (activeJob()) {
      toast(BUSY_TOAST);
      return;
    }
    const provider = mainProvider();
    if (!provider) {
      toast("no providers found");
      return;
    }
    const message = messageByID(session, mid);
    if (!message || message.from !== "model") return;
    const view = getMessageView(session.chat.id, mid);
    if (!view) return;
    const chatId = session.chat.id;
    const settings = loadMiscSettings();
    const lore = activateLore(session, mid);
    reportLore(lore);
    const prompt2 = roleplayPrompt(session, mid, {
      tail: settings.tail,
      remberStretch: settings.remberStretch,
      oocAsUser: settings.oocAsUser,
      suffix: provider.suffix,
      lore
    });
    view.controls.startStreaming();
    let reasoning = "";
    const result = await runJob("roleplay", provider, prompt2, {
      onChunk: (chunk) => getMessageView(chatId, mid)?.controls.appendChunk(chunk),
      onReasoningChunk: (chunk) => {
        reasoning += chunk;
        getMessageView(chatId, mid)?.controls.addReasoningChunk(chunk);
      },
      onReasoningStatus: (on) => getMessageView(chatId, mid)?.controls.reasoningStatus(on)
    });
    if (result.success) {
      pushSwipe(session, mid, result.value, reasoning);
      await commit(session);
    } else {
      toast(result.error);
    }
    getMessageView(chatId, mid)?.controls.endStreaming();
  }
  async function deleteFrom(mid) {
    const session = getSession();
    if (!session) return;
    if (activeJob()) {
      toast(BUSY_TOAST);
      return;
    }
    if (!confirm("all the following messages will be deleted too")) return;
    const removed = truncateFrom(session, mid);
    if (removed.length === 0) return;
    await commit(session);
    const chatId = session.chat.id;
    removed.forEach((id) => {
      getMessageView(chatId, id)?.remove();
      getSystemView(chatId, id, false)?.remove();
      getSystemView(chatId, id, true)?.remove();
    });
    const last2 = lastModelMessage(session);
    if (last2) getMessageView(chatId, last2.id)?.controls.setIsLast(true);
  }
  async function deleteNote(mid) {
    const session = getSession();
    if (!session) return;
    if (activeJob()) {
      toast(BUSY_TOAST);
      return;
    }
    if (!confirm("the note will be deleted")) return;
    if (!removeMessage(session, mid)) return;
    await commit(session);
    getSystemView(session.chat.id, mid, false)?.remove();
  }
  async function deleteRember(mid) {
    const session = getSession();
    if (!session) return;
    if (!confirm(`the rEmber summary attached to message #${mid} will be removed`)) return;
    if (setRember(session, mid, null)) await commitContents(session);
    getSystemView(session.chat.id, mid, true)?.remove();
    getMessageView(session.chat.id, mid)?.controls.refresh();
  }
  function setNoteText(session, mid, text2) {
    const note = messageByID(session, mid);
    if (!note) return false;
    return setSwipeText(session, mid, note.selectedSwipe, text2);
  }
  async function loadPictures(chat) {
    const [user, model] = await Promise.all([
      chat.userPersona.picture ? getBlobLink(chat.userPersona.picture) : null,
      chat.scenario.picture ? getBlobLink(chat.scenario.picture) : null
    ]);
    return [user, model];
  }
  function mainProvider() {
    const providers = Object.values(readProviders());
    return providers.find((p2) => p2.isActive) ?? providers[0] ?? null;
  }

  // src/units/chat/rember.ts
  function initRember() {
    const modal = document.querySelector("#play-rember");
    const providerPicker = document.querySelector("#play-rember-provider-picker");
    const strideInput = document.querySelector("#play-rember-stride");
    const promptInput = document.querySelector("#play-rember-prompt");
    const latest = {
      container: document.querySelector("#play-rember-latest"),
      caption: document.querySelector("#play-rember-latest-caption"),
      text: document.querySelector("#play-rember-latest-text")
    };
    const buttons = {
      one: document.querySelector("#play-rember-add-one"),
      save: document.querySelector("#play-rember-save"),
      reset: document.querySelector("#play-rember-reset"),
      close: document.querySelector("#play-rember-modal-close")
    };
    let latestMid = null;
    buttons.one.addEventListener("click", runOne);
    buttons.save.addEventListener("click", saveSettings);
    buttons.reset.addEventListener("click", resetPrompt);
    buttons.close.addEventListener("click", () => modal.close());
    latest.container.addEventListener("click", () => {
      const session = getSession();
      if (!session || latestMid === null) return;
      modal.close();
      ensureRemberView(session.chat.id, latestMid);
      scrollToMessage(session.chat.id, latestMid);
    });
    providerPicker.addEventListener("input", () => {
      const actives = readActiveProviders();
      actives.rember = providerPicker.value;
      local.set("activeProvider", JSON.stringify(actives));
    });
    listen((u3) => {
      if (u3.storage !== "local" || u3.key !== "activeProvider") return;
      updateProviderPicker();
    });
    updateProviderPicker();
    onSessionReplaced(updateRemberCounter);
    onSessionCommit((session) => {
      if (session === getSession()) updateRemberCounter(session);
    });
    function updateProviderPicker() {
      const providerOptions = Object.entries(readProviders());
      const activeId = providerOptions.find(([, e]) => e.remberActive)?.[0];
      setSelectOptions(providerPicker, providerOptions.map(([id, e]) => [id, e.name]), activeId);
    }
    function fill(session) {
      const settings = settingsOf(session);
      strideInput.value = String(settings.stride);
      promptInput.value = settings.prompt;
      const message = session.contents.messages.findLast((m2) => m2.rember);
      latestMid = message?.id ?? null;
      latest.container.hidden = !message;
      latest.caption.textContent = message ? `latest summary, attached to message #${message.id}` : "";
      latest.text.textContent = message?.rember ?? "";
    }
    async function runOne() {
      const session = getSession();
      if (!session) return;
      const provider = readProviders()[providerPicker.value];
      if (!provider) {
        toast("pick a provider for rEmber first");
        return;
      }
      const settings = readSettingsInputs();
      const plan = planRember(session.contents.messages, settings.stride);
      if (!plan) {
        toast("nothing left to summarize");
        return;
      }
      const chatId = session.chat.id;
      const hadSummary = !!messageByID(session, plan.at)?.rember;
      modal.close();
      ensureRemberView(chatId, plan.at)?.controls.startStreaming();
      scrollToMessage(chatId, plan.at);
      const result = await runJob(
        "rember",
        provider,
        remberPrompt(session, settings, plan.scope, plan.previousState),
        { onChunk: (chunk) => getSystemView(chatId, plan.at, true)?.controls.appendChunk(chunk) }
      );
      if (!result.success) {
        toast(result.error);
        const view = getSystemView(chatId, plan.at, true);
        if (hadSummary) view?.controls.endStreaming();
        else view?.remove();
        return;
      }
      setRember(session, plan.at, result.value.trim());
      await commitContents(session);
      getSystemView(chatId, plan.at, true)?.controls.endStreaming();
      getMessageView(chatId, plan.at)?.controls.refresh();
    }
    async function saveSettings() {
      const session = getSession();
      if (!session) return;
      session.chat.rember = readSettingsInputs();
      await commitChat(session);
      const details = strideInput.closest("details");
      if (details) details.open = false;
    }
    function resetPrompt() {
      if (!confirm("the current rember prompt will be lost after saving the settings")) return;
      promptInput.value = REMBER_DEFAULTS.prompt;
    }
    function readSettingsInputs() {
      const stride = parseInt(strideInput.value, 10);
      return {
        prompt: promptInput.value.trim(),
        stride: isNaN(stride) ? REMBER_DEFAULTS.stride : stride
      };
    }
    return {
      open: () => {
        const session = getSession();
        if (!session) return;
        fill(session);
        modal.open();
      }
    };
  }
  function settingsOf(session) {
    return session.chat.rember ?? REMBER_DEFAULTS;
  }
  function planRember(messages, stride) {
    const lastModel = messages.findLastIndex((m2) => m2.from === "model");
    const story = messages.slice(0, Math.max(0, lastModel - 1)).filter((m2) => m2.from !== "system");
    const lastAt = story.findLastIndex((m2) => m2.rember);
    const start2 = lastAt === -1 ? 0 : lastAt;
    const at = Math.min(story.length - 1, start2 + stride * 2);
    if (at <= start2) return null;
    return {
      at: story[at].id,
      scope: story.slice(start2, at),
      previousState: lastAt === -1 ? null : story[lastAt].rember
    };
  }
  function updateRemberCounter(session = getSession()) {
    const counter = document.querySelector("#chat-rember-counter");
    counter.hidden = true;
    if (!session) return;
    const story = session.contents.messages.filter((m2) => m2.from !== "system");
    const lastRembered = story.findLastIndex((m2) => m2.rember);
    if (lastRembered === -1) return;
    const delta = story.length - 1 - lastRembered;
    counter.textContent = `\u29D6${delta}`;
    counter.dataset.run = delta > settingsOf(session).stride * 2 ? "true" : "false";
    counter.hidden = false;
  }

  // src/units/library/lorebook.ts
  var ST_LOGIC = ["andAny", "notAll", "notAny", "andAll"];
  var ST_ROLE = ["system", "user", "assistant"];
  var ST_DEPTH = 4;
  var ST_ORDER = 100;
  var BOOK_DEFAULTS = {
    recursive: true,
    caseSensitive: false,
    wholeWords: true
  };
  function stPosition(code, fallback) {
    if (code === void 0 || code === null) return fallback;
    if (code === 0) return "before";
    if (code === 4) return "depth";
    return "after";
  }
  function stLogic(code) {
    return ST_LOGIC[code ?? 0] ?? "andAny";
  }
  function stRole(code) {
    return ST_ROLE[code ?? 0] ?? "system";
  }
  async function fromCharacterBook(book, fallbackName) {
    const entries2 = (book.entries ?? []).map((e, ix) => {
      const ext = e.extensions ?? {};
      const keys = e.keys ?? [];
      return {
        id: e.id ?? ix,
        name: e.name || e.comment || keys[0] || `#${ix}`,
        keys,
        secondaryKeys: e.selective ? e.secondary_keys ?? [] : [],
        logic: stLogic(ext.selectiveLogic ?? ext.selective_logic),
        content: e.content ?? "",
        enabled: e.enabled !== false,
        constant: !!e.constant,
        order: e.insertion_order ?? ST_ORDER,
        position: stPosition(ext.position, e.position === "after_char" ? "after" : "before"),
        depth: ext.depth ?? ST_DEPTH,
        role: stRole(ext.role),
        caseSensitive: e.case_sensitive ?? null,
        wholeWords: ext.match_whole_words ?? ext.matchWholeWords ?? null,
        excludeRecursion: !!(ext.exclude_recursion ?? ext.excludeRecursion),
        preventRecursion: !!(ext.prevent_recursion ?? ext.preventRecursion),
        scanDepth: ext.scan_depth ?? ext.scanDepth ?? null
      };
    });
    return await finalize({
      name: book.name || fallbackName,
      scanDepth: book.scan_depth ?? null,
      tokenBudget: book.token_budget ?? null,
      recursive: book.recursive_scanning ?? BOOK_DEFAULTS.recursive
    }, entries2);
  }
  async function fromWorldInfo(info, fallbackName) {
    const raw = Array.isArray(info.entries) ? info.entries : Object.values(info.entries ?? {});
    const entries2 = raw.map((e, ix) => {
      const keys = e.key ?? [];
      return {
        id: e.uid ?? ix,
        name: e.comment || keys[0] || `#${ix}`,
        keys,
        secondaryKeys: e.selective ? e.keysecondary ?? [] : [],
        logic: stLogic(e.selectiveLogic),
        content: e.content ?? "",
        enabled: !e.disable,
        constant: !!e.constant,
        order: e.order ?? ST_ORDER,
        position: stPosition(e.position, "before"),
        depth: e.depth ?? ST_DEPTH,
        role: stRole(e.role),
        caseSensitive: e.caseSensitive ?? null,
        wholeWords: e.matchWholeWords ?? null,
        excludeRecursion: !!e.excludeRecursion,
        preventRecursion: !!e.preventRecursion,
        scanDepth: e.scanDepth ?? null
      };
    });
    return await finalize({
      name: info.name || fallbackName,
      scanDepth: null,
      tokenBudget: null,
      recursive: BOOK_DEFAULTS.recursive
    }, entries2);
  }
  async function finalize(book, entries2) {
    const fingerprint = JSON.stringify(entries2.map((e) => [e.keys, e.secondaryKeys, e.content]));
    return {
      id: await sha1Hex(fingerprint),
      enabled: true,
      caseSensitive: BOOK_DEFAULTS.caseSensitive,
      wholeWords: BOOK_DEFAULTS.wholeWords,
      ...book,
      entries: entries2
    };
  }
  async function parseLorebookFile(file) {
    const text2 = await nothrowAsync(file.text());
    if (!text2.success) return { success: false, error: "can't read the file" };
    const parsed = nothrow(() => JSON.parse(text2.value));
    if (!parsed.success) return { success: false, error: "the file is not valid JSON" };
    const name = file.name.replace(/\.json$/i, "").replace(/_?sillytavern_lorebook$/i, "");
    const json = parsed.value;
    if (json?.data?.character_book?.entries)
      return { success: true, value: await fromCharacterBook(json.data.character_book, json.data.name ?? name) };
    if (json?.entries) {
      const items = Array.isArray(json.entries) ? json.entries : Object.values(json.entries);
      const first = items[0];
      if (!first) return { success: false, error: "the lorebook has no entries" };
      if ("keys" in first) return { success: true, value: await fromCharacterBook(json, name) };
      if ("key" in first) return { success: true, value: await fromWorldInfo(json, name) };
    }
    return { success: false, error: "this doesn't look like a lorebook" };
  }

  // src/views/lorebook-item.html
  var lorebook_item_default = '<label class="lineout pointer row-compact align-center">\n	<input type="checkbox" data-ref="enabled" title="enabled">\n	<div class="list wide">\n		<div data-ref="name"></div>\n		<div class="hint" data-ref="details"></div>\n	</div>\n	<button class="lineout" data-ref="remove" title="remove">\u2716</button>\n</label>\n';

  // src/views/lorebook-item.ts
  var template5 = R(lorebook_item_default);
  var REFS5 = {
    enabled: HTMLInputElement,
    name: HTMLElement,
    details: HTMLElement,
    remove: HTMLButtonElement
  };
  function makeLorebookItemView(book, handlers) {
    const { root, refs: r } = h(template5, REFS5);
    const enabledEntries = book.entries.filter((e) => e.enabled).length;
    const constant = book.entries.filter((e) => e.constant).length;
    r.name.textContent = book.name;
    r.details.textContent = [
      `${enabledEntries} of ${book.entries.length} entries enabled`,
      constant ? `${constant} constant` : null,
      book.recursive ? "recursive" : null,
      `#${book.id.slice(0, 8)}`
    ].filter((p2) => p2).join(" \xB7 ");
    r.enabled.checked = book.enabled;
    r.enabled.addEventListener("change", () => handlers.toggle(r.enabled.checked));
    r.remove.addEventListener("click", handlers.remove);
    return root;
  }

  // src/units/chat/lorebooks.ts
  function initLorebooks() {
    const modal = document.querySelector("#play-lore");
    const counter = document.querySelector("#chat-lore-counter");
    const list = document.querySelector("#play-lore-list");
    const status = document.querySelector("#play-lore-status");
    const importer = document.querySelector("#play-lore-import");
    const scanDepth = document.querySelector("#play-lore-scan-depth");
    const budget = document.querySelector("#play-lore-budget");
    const buttons = {
      copy: document.querySelector("#play-lore-copy"),
      save: document.querySelector("#play-lore-save"),
      close: document.querySelector("#play-lore-close")
    };
    let last2 = null;
    counter.addEventListener("click", open2);
    buttons.close.addEventListener("click", () => modal.close());
    buttons.copy.addEventListener("click", copyFromCard);
    buttons.save.addEventListener("click", saveSettings);
    importer.addEventListener("input", async () => {
      const file = importer.input.files?.[0];
      importer.input.value = "";
      if (!file) return;
      const parsed = await parseLorebookFile(file);
      if (!parsed.success) {
        toast(parsed.error);
        return;
      }
      await attach([parsed.value]);
    });
    onSessionReplaced((session) => {
      last2 = null;
      updateCounter(session);
    });
    onLore((activation) => {
      last2 = activation;
      updateCounter(getSession());
      if (modal.dialog.open) showStatus();
    });
    function updateCounter(session) {
      const books = session?.chat.lorebooks ?? [];
      counter.hidden = books.length === 0;
      counter.textContent = last2 ? `\u{1F56E}${last2.activated.length}` : "\u{1F56E}";
      counter.dataset.run = last2 && last2.activated.length > 0 ? "true" : "false";
    }
    function fill(session) {
      const settings = loreSettingsOf(session);
      scanDepth.value = String(settings.scanDepth);
      budget.value = String(settings.tokenBudget);
      list.innerHTML = "";
      const books = session.chat.lorebooks ?? [];
      if (books.length === 0) list.append(placeholderView("No lorebooks attached"));
      list.append(...books.map((book) => makeLorebookItemView(book, {
        toggle: async (enabled) => {
          book.enabled = enabled;
          await commitChat(session);
          updateCounter(session);
        },
        remove: async () => {
          if (!confirm(`"${book.name}" will be detached from this chat`)) return;
          session.chat.lorebooks = books.filter((b2) => b2 !== book);
          await commitChat(session);
          fill(session);
          updateCounter(session);
        }
      })));
      showStatus();
    }
    function showStatus() {
      if (!last2) {
        status.textContent = "nothing was sent yet";
        return;
      }
      const names = last2.activated.map((a) => a.entry.name).join(", ");
      const dropped = last2.dropped ? `, ${last2.dropped} dropped over budget` : "";
      status.textContent = last2.activated.length ? `last prompt: ${last2.activated.length} entries, ~${last2.tokens} tokens${dropped}: ${names}` : `last prompt: no entries fired${dropped}`;
    }
    async function attach(books) {
      const session = getSession();
      if (!session) return;
      const present = new Set((session.chat.lorebooks ?? []).map((b2) => b2.id));
      const fresh = books.filter((b2) => !present.has(b2.id));
      if (fresh.length === 0) {
        toast("already attached");
        return;
      }
      session.chat.lorebooks = [...session.chat.lorebooks ?? [], ...fresh];
      await commitChat(session);
      fill(session);
      updateCounter(session);
    }
    async function copyFromCard() {
      const session = getSession();
      if (!session) return;
      const card = await idb.get("scenarios", session.chat.scenario.id);
      const books = card.success ? card.value?.lorebooks ?? [] : [];
      if (books.length === 0) {
        toast("the scenario card has no lorebooks");
        return;
      }
      await attach(books);
    }
    async function saveSettings() {
      const session = getSession();
      if (!session) return;
      const depth = parseInt(scanDepth.value, 10);
      const tokens = parseInt(budget.value, 10);
      session.chat.lore = {
        scanDepth: isNaN(depth) ? LORE_DEFAULTS.scanDepth : Math.max(1, depth),
        tokenBudget: isNaN(tokens) ? LORE_DEFAULTS.tokenBudget : Math.max(0, tokens)
      };
      await commitChat(session);
      const details = scanDepth.closest("details");
      if (details) details.open = false;
    }
    function open2() {
      const session = getSession();
      if (!session) return;
      fill(session);
      modal.open();
    }
    return { open: open2 };
  }

  // src/units/chat.ts
  function chatUnit() {
    const scroller = document.querySelector("#play-messages");
    const textarea = document.querySelector("#chat-textarea");
    const sendButton = document.querySelector("#chat-send-button");
    const stopButton = document.querySelector("#chat-stop-button");
    const remberCounter = document.querySelector("#chat-rember-counter");
    const providerPicker = document.querySelector("#chat-provider-picker");
    const menuButton = document.querySelector("#chat-menu-select");
    const inputModes = document.querySelector("#chat-controls");
    const previewContainer = document.querySelector("#play-card");
    const previewEditButton = document.querySelector("#play-card-edit");
    const previewCloseButton = document.querySelector("#play-card-close");
    makeResizable(textarea, scroller);
    initMessageList();
    const editor = initChatEditor();
    const rember = initRember();
    const lore = initLorebooks();
    window.addEventListener("hashchange", update);
    listen((u3) => {
      if (u3.storage !== "local") return;
      if (u3.key !== "providers" && u3.key !== "activeProvider") return;
      updateProviders();
    });
    onSessionReplaced((session) => {
      renderMessages(session);
      if (session) updateTitle(session.chat.scenario.name);
    });
    onJobChange((kind) => {
      if (inputModes.tab === "disabled") return;
      inputModes.tab = kind ? "pending" : "main";
    });
    initSendButton(sendButton, send, note);
    stopButton.addEventListener("click", cancelJob);
    remberCounter.addEventListener("click", rember.open);
    providerPicker.addEventListener("input", () => pickMainProvider(providerPicker.value));
    previewEditButton.addEventListener("click", () => window.open(cardPreviewRelay.url));
    previewCloseButton.addEventListener("click", () => previewContainer.close());
    window.addEventListener("beforeunload", (e) => {
      const halt = !!textarea.value.trim();
      if (halt) {
        e.preventDefault();
        e.returnValue = "";
      }
    });
    const { contentWidthOverride } = loadMiscSettings();
    if (contentWidthOverride)
      scroller.parentElement.style.setProperty("--content-width", `min(${contentWidthOverride}vw, calc(100vw - var(--min-content-pad)))`);
    else
      scroller.parentElement.style.removeProperty("--content-width");
    setSelectMenu(menuButton, "\u2630", [
      ["Scenario card", openScenarioIfExists],
      ["Edit definition", editor.open],
      ["\u29D6 rEmber", rember.open],
      ["\u{1F56E} Lorebooks", lore.open],
      ["Export", exportChat],
      ["Clone", cloneChat]
    ]);
    update();
    updateProviders();
    async function send() {
      const text2 = textarea.value.trim();
      if (!text2) return;
      if (await sendMessage(text2)) {
        textarea.value = "";
        textareaReconsider(textarea);
      }
    }
    async function note() {
      const text2 = textarea.value.trim();
      if (!text2) return;
      if (!confirm("append as an OOC note without asking for a reply?")) return;
      if (await appendNote(text2)) {
        textarea.value = "";
        textareaReconsider(textarea);
      }
    }
  }
  var LONG_PRESS_MS = 600;
  function initSendButton(button, onTap, onHold) {
    let timer = null;
    let held = false;
    const cancel = () => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    };
    button.addEventListener("pointerdown", () => {
      held = false;
      cancel();
      timer = window.setTimeout(() => {
        timer = null;
        held = true;
        onHold();
      }, LONG_PRESS_MS);
    });
    for (const event of ["pointerup", "pointerleave", "pointercancel"])
      button.addEventListener(event, cancel);
    button.addEventListener("click", () => {
      if (held) {
        held = false;
        return;
      }
      onTap();
    });
    button.addEventListener("contextmenu", (e) => e.preventDefault());
  }
  async function update() {
    const [page, chatId] = getRoute();
    if (page !== "play") {
      updateTitle(null);
      return;
    }
    if (!chatId) return;
    if (activeJob() && getSession()?.chat.id === chatId) return;
    if (getSession()?.chat.id !== chatId) {
      renderMessages(null);
      updateRemberCounter(null);
      updateTitle(null);
    }
    await openSession(chatId);
  }
  function updateProviders() {
    const inputModes = document.querySelector("#chat-controls");
    const providerPicker = document.querySelector("#chat-provider-picker");
    const providerControl = document.querySelector(".chat-provider-control");
    const providerOptions = Object.entries(readProviders());
    const activeId = providerOptions.find(([, e]) => e.isActive)?.[0];
    setSelectOptions(providerPicker, providerOptions.map(([id, e]) => [id, e.name]), activeId || providerOptions[0]?.[0]);
    if (providerOptions.length > 0) {
      if (activeId) {
        providerPicker.value = activeId;
      } else {
        const actives = {
          main: providerOptions[0][0],
          rember: null
        };
        local.set("activeProvider", JSON.stringify(actives));
      }
      inputModes.tab = activeJob() ? "pending" : "main";
      providerControl.hidden = false;
    } else {
      inputModes.tab = "disabled";
      providerControl.hidden = true;
    }
  }
  function pickMainProvider(id) {
    const actives = readActiveProviders();
    actives.main = id;
    local.set("activeProvider", JSON.stringify(actives));
  }
  var cardPreviewRelay = {
    url: ""
  };
  async function openScenarioIfExists() {
    const previewContainer = document.querySelector("#play-card");
    const preview = document.querySelector("#play-card-preview");
    const session = getSession();
    if (!session) return;
    const cardId = session.chat.scenario.id;
    const card = await idb.get("scenarios", cardId);
    if (card.success && card.value) {
      cardPreviewRelay.url = `#scenario-editor.${cardId}`;
      const contents = `# ${card.value.card.title}
${card.value.card.description}`;
      preview.innerHTML = renderMD(contents);
      previewContainer.open();
    } else
      toast("Scenario card not found");
  }
  async function exportChat() {
    const session = getSession();
    if (!session) return;
    const { chat, contents } = session;
    const mediaIDs = [
      chat.userPersona.picture,
      chat.scenario.picture
    ].filter((id) => id);
    const encodedMedia = await asyncMap(
      mediaIDs,
      async (id) => {
        const picture = await getMedia(id);
        if (!picture) return null;
        return {
          ...picture,
          media: await b64Encoder.encode(picture.media)
        };
      }
    );
    const payload = {
      chat,
      contents,
      media: encodedMedia.filter((m2) => m2)
    };
    download(JSON.stringify(payload), `${chat.scenario.name}.${chat.id}.aegir.chat.json`);
  }
  async function cloneChat() {
    const session = getSession();
    if (!session) return;
    const nid = crypto.randomUUID();
    await Promise.all([
      idb.set("chats", {
        ...session.chat,
        id: nid,
        lastUpdate: Date.now()
      }),
      idb.set("chatContents", {
        ...session.contents,
        id: nid
      })
    ]);
    toast("new chat created");
  }

  // src/units/cheats.ts
  var cheatLockCounter = 7;
  var cheatCodes = {
    "ee7668710593603e1bf765b32d532ac6b3c5b6f9": gibbadge
  };
  function cheatsUnit() {
    const cheats = getCheats();
    if (cheats["badge"]) {
      const [caption, type] = cheats["badge"];
      const badge = document.querySelector("#settings-badge");
      if (badge && caption && type) {
        badge.classList.add(`badge-${type}`);
        badge.textContent = caption;
        badge.hidden = false;
      }
    }
  }
  async function cheatHandler() {
    if (cheatLockCounter > 0) {
      --cheatLockCounter;
      if (cheatLockCounter < 3) {
        toast(`you are ${cheatLockCounter + 1} taps away from becoming a VIP`, { timeoutMS: 2e3 });
      }
      return;
    }
    const code = prompt("enter your code");
    if (!code) return;
    const [cheat, ...params] = code.split(":");
    const cheatHandler2 = await hashsum(cheat);
    cheatCodes[cheatHandler2]?.(...params.map(deob));
  }
  async function hashsum(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hash = await window.crypto.subtle.digest("SHA-1", data);
    const hashHex = new Uint8Array(hash)?.toHex();
    return hashHex;
  }
  function gibbadge(text2, type = "aurora") {
    addCheats({
      "badge": [text2, type]
    });
  }
  function getCheats() {
    const raw = local.get("cheats");
    if (!raw) return {};
    return JSON.parse(raw);
  }
  function addCheats(v2) {
    const old = getCheats();
    local.set("cheats", JSON.stringify({ ...old, ...v2 }));
  }
  function deob(raw) {
    const binaryString = atob(raw);
    const bytes = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  // src/views/chat-handle.html
  var chat_handle_default = '<div class="lineout row main-chats-item">\n	<img class="pointer" data-ref="icon">\n	<div class="list wide">\n		<h2 class="pointer" data-ref="title"></h2>\n		<div class="row-compact main-chats-item-user">\n			<img data-ref="user-icon">\n			<div data-ref="user-name"></div>\n		</div>\n		<div class="hint" data-ref="messages"></div>\n		<button class="lineout fit reset-text" data-ref="memo"></button>\n	</div>\n	<div class="list main-chats-item-actions">\n		<button class="lineout" data-ref="play">play</button>\n		<select class="lineout center-text pointer" data-ref="folder"></select>\n		<button class="lineout" data-ref="delete">delete</button>\n	</div>\n</div>\n';

  // src/views/chat-handle.ts
  var template6 = R(chat_handle_default);
  var REFS6 = {
    icon: HTMLImageElement,
    "user-icon": HTMLImageElement,
    title: HTMLElement,
    "user-name": HTMLElement,
    messages: HTMLElement,
    memo: HTMLButtonElement,
    play: HTMLButtonElement,
    delete: HTMLButtonElement,
    folder: HTMLSelectElement
  };
  function makeChatHandleView(handle, pictures, folderOptions, handlers) {
    const { root, refs: r } = h(template6, REFS6);
    r.icon.src = placeholder(null);
    r["user-icon"].src = placeholder(null);
    setPicture(r.icon, pictures.scenario);
    setPicture(r["user-icon"], pictures.user);
    r.title.textContent = handle.scenario.name;
    r["user-name"].textContent = handle.userPersona.name;
    r.messages.textContent = messagesCaption(handle.messageCount);
    r.memo.textContent = handle.memo ?? "\u{1F4DD}";
    r.icon.addEventListener("click", handlers.play);
    r.title.addEventListener("click", handlers.play);
    r.play.addEventListener("click", handlers.play);
    r.memo.addEventListener("click", handlers.setMemo);
    r.delete.addEventListener("click", handlers.delete);
    setSelectMenu(
      r.folder,
      handle.folder ?? "-folder-",
      [
        ["unassigned", () => handlers.assignFolder(null)],
        ["new folder", handlers.newFolder],
        ...folderOptions.map((f2) => [f2, () => handlers.assignFolder(f2)])
      ]
    );
    return root;
  }
  function messagesCaption(count) {
    const singular = count === 1 || count % 10 === 1 && count % 100 !== 11;
    return `${count} ${singular ? "message" : "messages"}`;
  }

  // src/units/main.ts
  function mainUnit() {
    const importButton = document.querySelector("#main-import");
    const chatCounter = document.querySelector("#main-counter");
    importButton.addEventListener("input", () => {
      const file = importButton.input.files?.[0];
      if (!file) return;
      importChat(file);
    });
    chatCounter.addEventListener("click", cheatHandler);
    listen((u3) => {
      if (u3.storage !== "idb") return;
      if (u3.store !== "chats") return;
      update2(null);
    });
    update2(null);
  }
  async function update2(folder) {
    const chatCounter = document.querySelector("#main-counter");
    const handles = await idb.getAll("chats");
    if (!handles.success) return;
    const cc = handles.value.length;
    const singular = cc === 1 || cc % 10 === 1 && cc % 100 !== 11;
    chatCounter.textContent = `${handles.value.length} ${singular ? "chat" : "chats"}`;
    const folderOptions = unique(handles.value.map((c2) => c2.folder).filter((f2) => f2));
    updateChatHandles(handles.value, folder, folderOptions);
    updateFolders(folder, folderOptions, update2);
  }
  function updateChatHandles(handles, folder, folderOptions) {
    const list = document.querySelector("#main-chats");
    list.innerHTML = "";
    const filtered = folder ? handles.filter((c2) => c2.folder === folder) : handles;
    const items = filtered.reverse().map((c2) => handleView(c2, folderOptions));
    if (items.length === 0) list.append(placeholderView("No chats found"));
    list.append(...items);
  }
  function updateFolders(folder, options, onChange) {
    const folders = document.querySelector("#main-folders");
    folders.innerHTML = "";
    const folderButton = (f2) => E({
      tagName: "button",
      className: "strip fit pointer",
      events: {
        click: () => {
          updateFolders(f2, options, onChange);
          onChange(f2);
        }
      },
      attributes: {
        "data-selected": folder === f2 ? "true" : "not true"
      },
      contents: f2 || "all chats"
    });
    folders.append(
      folderButton(null),
      ...options.map(folderButton)
    );
  }
  function handleView(handle, folderOptions) {
    return makeChatHandleView(
      handle,
      {
        scenario: handle.scenario.picture ? getBlobLink(handle.scenario.picture) : null,
        user: handle.userPersona.picture ? getBlobLink(handle.userPersona.picture) : null
      },
      folderOptions,
      {
        play: () => window.location.hash = `play.${handle.id}`,
        delete: () => deleteChat(handle.id, handle.scenario.name, handle.messageCount),
        setMemo: () => setMemo(handle.id, handle.memo),
        assignFolder: (folder) => assignToFolder(handle.id, folder),
        newFolder: () => {
          const newName = prompt("Enter the name of the new folder")?.trim();
          if (!newName) return;
          assignToFolder(handle.id, newName);
        }
      }
    );
  }
  function deleteChat(id, name, messageCount) {
    const confirmed = confirm(`Chat with ${name} (${messagesCaption(messageCount)}) will be deleted`);
    if (!confirmed) return;
    idb.del("chatContents", id);
    idb.del("chats", id);
  }
  async function assignToFolder(id, folder) {
    const chat = await idb.get("chats", id);
    if (!chat.success) return false;
    chat.value.folder = folder;
    await idb.set("chats", chat.value);
    return true;
  }
  async function setMemo(id, old) {
    const newMemo = prompt("set chat memo", old ?? "");
    if (newMemo === null) return;
    const chat = await idb.get("chats", id);
    if (!chat.success) return false;
    chat.value.memo = newMemo || void 0;
    await idb.set("chats", chat.value);
  }
  async function importChat(file) {
    const json = await file.text();
    const parsed = nothrow(() => JSON.parse(json));
    if (!parsed.success) return;
    const chat = parsed.value.chat;
    const contents = parsed.value.contents;
    const media = parsed.value.media;
    for (const m2 of media) {
      m2.media = await b64Encoder.decode(m2.media);
      await idb.set("media", m2);
    }
    await idb.set("chats", chat);
    await idb.set("chatContents", contents);
  }

  // src/optimizer.ts
  var SMALLER_SIZE_LIMIT = 2048;
  async function optimizeToWEBP(blob) {
    if (await isWebp(blob)) {
      return Promise.resolve([blob, false]);
    }
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        const smallerSide = Math.min(width, height);
        if (smallerSide > SMALLER_SIZE_LIMIT) {
          const scale = SMALLER_SIZE_LIMIT / smallerSide;
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve([blob, false]);
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (newBlob) => resolve(newBlob ? [newBlob, true] : [blob, false]),
          "image/webp",
          0.94
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve([blob, false]);
      };
      img.src = url;
    });
  }
  async function isWebp(blob) {
    if (blob.type === "image/webp") return true;
    const header = await blob.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(header);
    const RIFF = [82, 73, 70, 70];
    const WEBP = [87, 69, 66, 80];
    for (let i = 0; i < 4; ++i) {
      if (bytes[i] !== RIFF[i])
        return false;
      if (bytes[8 + i] !== WEBP[i])
        return false;
    }
    return true;
  }

  // src/units/scenario.ts
  var definitionTemplate = [
    "# Characters",
    "## {{char}} ",
    "",
    "## {{user}}",
    "{{persona}}",
    "",
    "# Scenario",
    "",
    "# Instructions",
    "The user is {{user}}, all other characters are played by you"
  ].join("\n");
  function scenarioUnit() {
    const chatIcon = document.querySelector("#scenario-chat-picture");
    const cardIcon = document.querySelector("#scenario-card-picture");
    const cardTitle = document.querySelector("#scenario-card-title");
    const cardAuthorName = document.querySelector("#scenario-card-author-name");
    const cardAuthorURL = document.querySelector("#scenario-card-author-url");
    const cardDescription = document.querySelector("#scenario-description");
    const cardTags = document.querySelector("#scenario-tags");
    const previewModal = document.querySelector("#scenario-preview");
    const preview = document.querySelector("#scenario-preview-container");
    const previewClose = document.querySelector("#scenario-preview-close");
    const characterName = document.querySelector("#scenario-character-name");
    const definition = document.querySelector("#scenario-definition");
    const previewButton = document.querySelector("#scenario-preview-button");
    const submitButton = document.querySelector("#scenario-submit-button");
    const cloneButton = document.querySelector("#scenario-clone-button");
    const firstMessage = document.querySelector("#scenario-messages");
    const lorebookList = document.querySelector("#scenario-lorebooks");
    const lorebookImport = document.querySelector("#scenario-lorebook-import");
    makeResizable(cardDescription);
    makeResizable(definition);
    const messagesControl = initFirstMessages();
    let lorebooks = [];
    let loaded = null;
    lorebookImport.addEventListener("input", async () => {
      const file = lorebookImport.input.files?.[0];
      lorebookImport.input.value = "";
      if (!file) return;
      const parsed = await parseLorebookFile(file);
      if (!parsed.success) {
        toast(parsed.error);
        return;
      }
      if (lorebooks.some((b2) => b2.id === parsed.value.id)) {
        toast("this lorebook is already attached");
        return;
      }
      lorebooks.push(parsed.value);
      renderLorebooks();
    });
    function renderLorebooks() {
      lorebookList.innerHTML = "";
      if (lorebooks.length === 0) lorebookList.append(placeholderView("No lorebooks attached"));
      lorebookList.append(...lorebooks.map((book) => makeLorebookItemView(book, {
        toggle: (enabled) => {
          book.enabled = enabled;
        },
        remove: () => {
          lorebooks = lorebooks.filter((b2) => b2 !== book);
          renderLorebooks();
        }
      })));
    }
    window.addEventListener("hashchange", load2);
    load2();
    async function load2() {
      const path = getRoute();
      if (path[0] !== "scenario-editor") return;
      cardIcon.usePlaceholder();
      chatIcon.usePlaceholder();
      document.body.scrollTo({ behavior: "instant", top: 0 });
      cloneButton.hidden = !path[1];
      loaded = null;
      if (path[1]) {
        const scenario = await idb.get("scenarios", path[1]);
        if (!scenario.success || !scenario.value) return;
        loaded = scenario.value;
        cardIcon.value = scenario.value.card.picture ?? "";
        cardTitle.value = scenario.value.card.title;
        cardAuthorName.value = scenario.value.card.author?.name ?? "";
        cardAuthorURL.value = scenario.value.card.author?.url ?? "";
        cardDescription.value = scenario.value.card.description;
        cardTags.value = scenario.value.card.tags.join(", ");
        chatIcon.value = scenario.value.chat.picture ?? "";
        characterName.value = scenario.value.chat.name;
        definition.value = scenario.value.chat.definition;
        messagesControl.set(scenario.value.chat.initials);
        lorebooks = scenario.value.lorebooks ?? [];
      } else {
        cardIcon.usePlaceholder();
        cardTitle.value = "";
        cardAuthorName.value = "";
        cardAuthorURL.value = "";
        cardDescription.value = "";
        cardTags.value = "";
        chatIcon.usePlaceholder();
        characterName.value = "";
        definition.value = definitionTemplate;
        messagesControl.set([""]);
        lorebooks = [];
      }
      renderLorebooks();
      textareaReconsider(cardDescription);
      textareaReconsider(definition);
      textareaReconsider(cardTags);
      textareaReconsider(firstMessage);
    }
    submitButton.addEventListener("click", async () => {
      const payload = await buildPayload(getRoute()[1] ?? crypto.randomUUID());
      if (!payload) return;
      await idb.set("scenarios", payload);
      window.location.hash = "library";
    });
    cloneButton.addEventListener("click", async () => {
      const payload = await buildPayload(crypto.randomUUID());
      if (!payload) return;
      payload.card.title += " (copy)";
      await idb.set("scenarios", payload);
      toast("scenario cloned, you are now editing the copy");
      window.location.hash = `scenario-editor.${payload.id}`;
    });
    async function buildPayload(id) {
      const firstMessages = messagesControl.get();
      const checks = [
        [() => cardTitle.value, "Card name is required", cardTitle],
        [() => definition.value, "Character definiton is required", definition],
        [() => firstMessages.length > 0, "At least one non-empty opening message is required", firstMessage]
      ];
      for (const [cb, msg, target] of checks) {
        if (cb()) continue;
        toast(msg);
        target?.focus({ preventScroll: true });
        target?.scrollIntoView({ behavior: "smooth", block: "center" });
        return null;
      }
      const cardPicture = await storePicture(cardIcon);
      const chatPicture = await storePicture(chatIcon);
      const tags = cardTags.value.split(",").map((t) => t.trim()).filter((t) => t);
      function author() {
        if (cardAuthorName.value.trim()) {
          return {
            name: cardAuthorName.value.trim(),
            url: cardAuthorURL.value.trim() || null
          };
        } else return null;
      }
      const payload = {
        ...loaded,
        id,
        lastUpdate: Date.now(),
        card: {
          picture: cardPicture,
          title: cardTitle.value,
          description: cardDescription.value,
          tags,
          author: author()
        },
        chat: {
          picture: chatPicture,
          name: characterName.value,
          definition: definition.value,
          initials: firstMessages,
          tokenCount: estimateTokenCount(definition.value)
        },
        lorebooks
      };
      if (!payload.chat.definition.includes("{{persona}}")) {
        toast([
          "warning!\nthe saved definition lacks",
          " {{persona}} macro -- meaning the bot",
          " won't be able to know abything about",
          " user's persona"
        ].join(""));
      }
      return payload;
    }
    previewClose.addEventListener("click", () => previewModal.close());
    previewButton.addEventListener("click", () => {
      const content = cardDescription.value;
      preview.innerHTML = renderMD(content);
      previewModal.open();
    });
  }
  function initFirstMessages() {
    const messagesControls = document.querySelector("#scenario-messages-clicker");
    const messagesControlsButtons = messagesControls.querySelectorAll("button");
    const messagesControlsCaption = messagesControls.querySelector("div");
    const messages = document.querySelector("#scenario-messages");
    const messagesState = [""];
    const asterizeButton = document.querySelector("#scenario-messages-asterize");
    let messageIndex = 0;
    makeResizable(messages);
    function clickMessagesPager(delta) {
      let newIndex = messageIndex + delta;
      if (newIndex < 0) newIndex = messagesState.length - 1;
      else if (newIndex >= messagesState.length) {
        if (messagesState[messageIndex].trim()) {
          messagesState.push("");
        } else {
          newIndex = 0;
        }
      }
      messageIndex = newIndex;
      updateMessagesPager();
    }
    function updateMessagesPager() {
      messagesControlsCaption.textContent = `${messageIndex + 1}/${messagesState.length}`;
      messages.value = messagesState[messageIndex];
      textareaReconsider(messages);
    }
    messages.addEventListener("input", () => {
      messagesState[messageIndex] = messages.value;
    });
    messagesControlsButtons[0].addEventListener("click", () => clickMessagesPager(-1));
    messagesControlsButtons[1].addEventListener("click", () => clickMessagesPager(1));
    updateMessagesPager();
    asterizeButton.addEventListener("click", () => {
      const lines = messages.value.trim().split("\n");
      const asterized = lines.map((line) => {
        if (line.trim().length === 0) return "";
        return line.replace(
          /(^|"\s)([^"]+)(\s"|$)/gm,
          (_2, g0, g1, g2) => `${g0}*${g1}*${g2}`
        );
      });
      messagesState[messageIndex] = messages.value = asterized.join("\n");
    });
    return {
      set: (values) => {
        messagesState.splice(0, messagesState.length);
        messagesState.push(...values);
        messageIndex = 0;
        messages.value = messagesState[messageIndex];
        updateMessagesPager();
      },
      get: () => {
        return messagesState.map((v2) => v2.trim()).filter((v2) => v2);
      }
    };
  }
  async function storePicture(picker) {
    const value = picker.value;
    if (typeof value === "string") return value || null;
    const optimized = await nothrowAsync(optimizeToWEBP(value));
    if (!optimized.success) {
      toast("can't process the picture, the card is saved without it");
      return null;
    }
    const [picture, changed] = optimized.value;
    if (changed) console.log(`optimized delta: ${picture.size - value.size} (negative means win)`);
    return await upload(picture);
  }

  // src/views/scenario-card.html
  var scenario_card_default = '<div class="scenario-card lineout">\n	<div class="scenario-card-icon-container">\n		<img class="pointer" data-ref="icon">\n	</div>\n	<div class="list grow">\n		<div class="row-compact">\n			<h6 class="pointer" data-ref="title"></h6>\n			<button class="strip ghost pointer" data-ref="download">\u2913</button>\n			<button class="strip ghost pointer" data-ref="delete">\u2716</button>\n			<button class="strip ghost pointer" data-ref="edit">\u270E</button>\n			<button class="lineout" data-ref="play">play</button>\n		</div>\n		<div class="row baseline">\n			<a data-ref="author-link" hidden></a>\n			<span data-ref="author" hidden></span>\n			<div class="hint float-end" data-ref="tokens"></div>\n		</div>\n		<hr>\n		<div class="scenario-card-description md" data-ref="description"></div>\n		<div class="scenario-card-tags" data-ref="tags"></div>\n	</div>\n</div>\n';

  // src/views/scenario-card.ts
  var template7 = R(scenario_card_default);
  var REFS7 = {
    icon: HTMLImageElement,
    title: HTMLElement,
    download: HTMLButtonElement,
    delete: HTMLButtonElement,
    edit: HTMLButtonElement,
    play: HTMLButtonElement,
    "author-link": HTMLAnchorElement,
    author: HTMLElement,
    tokens: HTMLElement,
    description: HTMLElement,
    tags: HTMLElement
  };
  function makeScenarioCardView(item, picture, handlers) {
    const { root, refs: r } = h(template7, REFS7);
    r.icon.src = placeholder(null);
    setPicture(r.icon, picture);
    r.title.textContent = item.card.title;
    const author = item.card.author;
    if (author?.url) {
      r["author-link"].textContent = author.name;
      r["author-link"].href = author.url;
      r["author-link"].hidden = false;
    } else {
      r.author.textContent = author?.name ?? "";
      r.author.hidden = false;
    }
    r.tokens.textContent = `${neatNumber(item.chat.tokenCount ?? 0)} tokens`;
    r.tokens.title = `${item.chat.tokenCount ?? "N/A"} tokens`;
    r.description.innerHTML = renderMD(item.card.description ?? "");
    r.tags.append(
      ...item.card.tags.map((tag) => E({ tagName: "span", className: "pointer", contents: tag })).toReversed()
    );
    r.icon.addEventListener("click", handlers.play);
    r.title.addEventListener("click", handlers.play);
    r.play.addEventListener("click", handlers.play);
    r.download.addEventListener("click", handlers.download);
    r.delete.addEventListener("click", handlers.delete);
    r.edit.addEventListener("click", handlers.edit);
    return root;
  }

  // src/units/chat/start.ts
  async function start(personaId, scenarioId, messages) {
    const [persona, scenario] = await Promise.all([
      idb.get("personas", personaId),
      idb.get("scenarios", scenarioId)
    ]);
    if (!persona.success || !scenario.success) return;
    if (messages) {
      messages = messages.map((m2) => {
        if (m2.from === "model") m2.name = scenario.value.chat.name;
        if (m2.from === "user") m2.name = persona.value.name;
        return m2;
      });
    }
    const preparedScenario = prepareScenario(scenario.value, persona.value);
    const chatId = crypto.randomUUID();
    await Promise.all([
      idb.set("chats", {
        id: chatId,
        lastUpdate: Date.now(),
        messageCount: messages?.length ?? 1,
        scenario: preparedScenario,
        userPersona: persona.value,
        messageChunks: [],
        rember: REMBER_DEFAULTS,
        folder: null,
        lorebooks: scenario.value.lorebooks ?? [],
        lore: LORE_DEFAULTS
      }),
      idb.set("chatContents", {
        id: chatId,
        messages: messages ?? [{
          id: 0,
          from: "model",
          name: scenario.value.chat.name || scenario.value.card.title,
          rember: null,
          selectedSwipe: 0,
          swipes: preparedScenario.initials
        }]
      })
    ]);
    window.location.hash = `play.${chatId}`;
  }
  function prepareScenario(origin, persona) {
    const context = {
      pronouns: persona.pronouns,
      charName: origin.chat.name,
      userName: persona.name,
      persona: persona.description
    };
    const expand = (template10) => runMacros(template10, context);
    const definition = expand(origin.chat.definition);
    return {
      id: origin.id,
      picture: origin.chat.picture || origin.card.picture,
      name: origin.chat.name || origin.card.title,
      definition,
      initials: origin.chat.initials.map(expand),
      tokenCount: estimateTokenCount(definition)
    };
  }

  // src/units/library/st.ts
  async function importSTMessages(file) {
    const raw = await nothrowAsync(file.text());
    if (!raw.success) return [];
    const pre = raw.value.split("\n").filter((l) => l.trim()).map((l) => nothrow(() => JSON.parse(l))).filter((c2) => c2.success).map((c2, ix) => stcToInternal(c2.value, ix));
    const text2 = (c2) => c2.swipes[c2.selectedSwipe];
    if (pre.length > 2 && text2(pre[0]) === text2(pre[1])) {
      pre.splice(0, 1);
    }
    return pre;
  }
  function stcToInternal(stc, index) {
    const swipes = stc.swipes ?? [stc.mes];
    const selectedSwipe = clamp(stc.swipe_id ?? 0, 0, swipes.length - 1);
    return {
      id: index,
      from: stc.is_system ? "system" : stc.is_user ? "user" : "model",
      name: stc.name,
      swipes,
      selectedSwipe,
      rember: null
    };
  }

  // src/views/armory-item.html
  var armory_item_default = '<div class="row-compact baseline">\n	<div class="lineout wide pointer">\n		<div data-ref="name"></div>\n	</div>\n	<button class="lineout float-end" data-ref="delete">\u2716</button>\n	<button class="lineout" data-ref="open">open</button>\n</div>\n';

  // src/views/armory-item.ts
  var template8 = R(armory_item_default);
  var REFS8 = ["name", "open", "delete"];
  function makeArmoryItemView(name, handlers) {
    const { root, refs: r } = h(template8, REFS8);
    r.name.textContent = name;
    r.open.addEventListener("click", handlers.open);
    r.delete.addEventListener("click", handlers.delete);
    return root;
  }

  // src/views/armory-card.html
  var armory_card_default = '<div class="lineout row armory-item">\n	<img data-ref="icon">\n	<div class="list wide">\n		<div class="armory-item-summary" data-ref="summary"></div>\n		<div class="row-compact float-bottom">\n			<button class="lineout float-end" data-ref="download"></button>\n		</div>\n		<progress max="100" value="0" data-ref="progress" hidden></progress>\n		<div class="placeholder fit float-end" data-ref="status" hidden>scenario downloaded</div>\n	</div>\n</div>\n';

  // src/views/armory-card.ts
  var template9 = R(armory_card_default);
  var REFS9 = {
    icon: HTMLImageElement,
    summary: HTMLElement,
    download: HTMLButtonElement,
    progress: HTMLProgressElement,
    status: HTMLElement
  };
  function makeArmoryCardView(data, onDownload) {
    const { root, refs: r } = h(template9, REFS9);
    r.icon.src = placeholder(data.icon);
    r.summary.textContent = data.summary;
    r.download.textContent = data.downloadCaption;
    r.download.addEventListener("click", onDownload);
    function setState(state) {
      r.download.hidden = state !== "ready";
      r.progress.hidden = state !== "downloading";
      r.status.hidden = state !== "done";
    }
    function setProgress(fraction) {
      r.progress.value = fraction * 100;
    }
    setState(data.downloadable ? "ready" : "done");
    return N(root, { setState, setProgress }, "controls");
  }

  // src/units/library/armory.ts
  function startArmory() {
    const modal = document.querySelector("#library-armory");
    const tabs = document.querySelector("#library-armory-tabs");
    const list = document.querySelector("#library-armory-list");
    const addButton = document.querySelector("#library-armory-add-button");
    const addInput = document.querySelector("#library-armory-add-input");
    const view = {
      back: document.querySelector("#library-armory-view-back"),
      title: document.querySelector("#library-armory-view-title"),
      status: document.querySelector("#library-armory-view-status"),
      items: document.querySelector("#library-armory-view-items")
    };
    tabs.tab = "list";
    const libraryPromise = idb.getAll("scenarios");
    addButton.addEventListener("click", () => {
      const url = addInput.value;
      if (!url.trim()) return;
      addInput.value = "";
      addArmory({
        id: crypto.randomUUID(),
        name: url,
        url
      });
      refresh();
    });
    view.back.addEventListener("click", () => tabs.tab = "list");
    const refresh = () => refreshList(
      list,
      (id) => {
        if (!confirm("This armory will be deleted from device. You can add it again later by adding its link")) return;
        deleteArmory(id);
        refresh();
      },
      openArmory
    );
    refresh();
    async function openArmory(a) {
      view.title.textContent = a.name;
      view.status.textContent = "Loading...";
      view.status.hidden = false;
      view.items.innerHTML = "";
      tabs.tab = "view";
      const response = await nothrowAsync(fetch(a.url));
      if (!response.success || !response.value.ok) {
        view.status.textContent = "Armory cannot be reached";
        return;
      }
      const payload = await nothrowAsync(response.value.json());
      if (!payload.success) {
        view.status.textContent = "Armory response is invalid";
        return;
      }
      view.status.hidden = true;
      const parsed = payload.value;
      if (parsed.name) {
        deleteArmory(a.id);
        addArmory({
          id: a.id,
          name: parsed.name,
          url: a.url
        });
        refresh();
        view.title.textContent = parsed.name;
      }
      const libraryResult = await libraryPromise;
      const library = libraryResult.success ? libraryResult.value : [];
      const items = parsed.items.sort((a2, b2) => b2.lastUpdate - a2.lastUpdate).map((i) => armoryItemView(i, library));
      view.items.append(...items);
    }
    modal.open();
  }
  function refreshList(list, deleteArmory2, openArmory) {
    list.innerHTML = "";
    const armories = getArmories();
    if (armories.length === 0) {
      list.append(placeholderView("No armories added"));
    } else {
      list.append(...armories.map((a) => makeArmoryItemView(a.name, {
        open: () => openArmory(a),
        delete: () => deleteArmory2(a.id)
      })));
    }
  }
  function armoryItemView(item, library) {
    const existing = library.find((c2) => c2.id === item.id);
    const updateAvailable = existing && existing.lastUpdate < item.lastUpdate;
    const downloadable = Boolean(!existing || updateAvailable);
    const downloadCaption = "download" + (updateAvailable ? " (update available)" : "");
    const view = makeArmoryCardView(
      { icon: item.icon, summary: item.summary, downloadCaption, downloadable },
      () => dl(item.url)
    );
    async function dl(url) {
      view.controls.setState("downloading");
      const response = await nothrowAsync(fetch(url));
      if (!response.success || !response.value.ok) {
        view.controls.setState("ready");
        return;
      }
      const blob = await nothrowAsync(reportingFetch(url, view.controls.setProgress));
      if (!blob.success) {
        view.controls.setState("ready");
        return;
      }
      view.controls.setState("done");
      importScenario(blob.value);
    }
    return view;
  }
  function getArmories() {
    const value = local.get("armories");
    if (!value) {
      const a = {
        id: crypto.randomUUID(),
        name: "Fenrir armory (default)",
        url: "https://fenrir.milesseventh.workers.dev/armory-meta"
      };
      local.set("armories", JSON.stringify([a]));
      return [a];
    }
    return JSON.parse(value);
  }
  function addArmory(a) {
    const armories = getArmories();
    armories.push(a);
    local.set("armories", JSON.stringify(armories));
  }
  function deleteArmory(id) {
    const nv = getArmories().filter((a) => a.id !== id);
    local.set("armories", JSON.stringify(nv));
  }

  // src/units/library/datacat.ts
  var definitionTemplate2 = {
    characters: [
      "# Characters",
      "## {{char}} "
    ],
    userPersona: [
      "## {{user}}",
      "{{persona}}"
    ],
    instructions: [
      "# Instructions and scenario",
      "The user is {{user}}, all other roles are played by you"
    ]
  };
  async function importDatacatJSON(parsed) {
    const definitionSource = parsed.data.description ? parsed.data.description.replace("##DESCRIPTION START##", "") : parsed.data.personality;
    const author = parsed.metadata.janitor_creator_name ? {
      name: parsed.metadata.janitor_creator_name,
      url: parsed.data.creator
    } : {
      name: parsed.data.creator,
      url: null
    };
    const definition = [
      ...definitionTemplate2.characters,
      fix(definitionSource.trim()),
      "",
      ...definitionTemplate2.userPersona,
      "",
      ...definitionTemplate2.instructions,
      fix(parsed.data.scenario ?? "")
    ].join("\n").trim();
    const book = parsed.data.character_book?.entries?.length ? await fromCharacterBook(parsed.data.character_book, parsed.data.name) : null;
    const converted = {
      id: crypto.randomUUID(),
      lastUpdate: Date.now(),
      lorebooks: book ? [book] : [],
      card: {
        author,
        description: parsed.metadata.raw_description_html ?? parsed.data.description,
        picture: await avatar(parsed.data.avatar),
        tags: parsed.data.tags,
        title: parsed.metadata.janitor_character_name ?? parsed.data.name
      },
      chat: {
        definition,
        initials: [
          parsed.data.first_mes,
          ...parsed.data.alternate_greetings ?? []
        ].map(fix),
        name: parsed.metadata.janitor_character_chatname ?? parsed.metadata.janitor_character_name ?? parsed.data.name,
        picture: null,
        tokenCount: estimateTokenCount(definition)
      }
    };
    console.log(converted);
    return converted;
  }
  async function avatar(url) {
    if (!url) return null;
    const response = await nothrowAsync(fetch(url));
    if (!response.success) return null;
    const blob = await nothrowAsync(response.value.blob());
    if (!blob.success) return null;
    return upload(blob.value);
  }
  function fix(raw) {
    return raw.replace(/(?<!\{)\{[^}]*\}(?!\})/g, (v2) => `{${v2.toLowerCase()}}`).replace(/\{\{.*?\}\}/g, (v2) => v2.toLowerCase()).replace(/^#+/gm, (v2) => `##${v2}`);
  }

  // src/units/library/search.ts
  function filterBySearch(cards) {
    const params = getSearchParams();
    if (!params) return cards;
    return cards.filter(params.filter);
  }
  function getSearchParams() {
    const search = {
      dialog: document.querySelector("#library-search-dialog"),
      input: document.querySelector("#library-search-input"),
      filters: {
        ct: document.querySelector("#library-search-f-ct"),
        cd: document.querySelector("#library-search-f-cd"),
        tg: document.querySelector("#library-search-f-tg"),
        cn: document.querySelector("#library-search-f-cn"),
        an: document.querySelector("#library-search-f-an"),
        cp: document.querySelector("#library-search-f-cp"),
        co: document.querySelector("#library-search-f-co")
      }
    };
    const q2 = search.input.value.trim().toLowerCase();
    if (search.dialog.hidden || !search.dialog.dataset.active || !q2) return null;
    return {
      query: q2,
      filter: (card) => {
        if (search.filters.ct.checked && card.card.title?.toLowerCase().includes(q2)) return true;
        if (search.filters.cd.checked && card.card.description.toLowerCase().includes(q2)) return true;
        if (search.filters.tg.checked && card.card.tags?.some((t) => t.toLowerCase().includes(q2))) return true;
        if (search.filters.cn.checked && card.chat.name?.toLowerCase().includes(q2)) return true;
        if (search.filters.an.checked && card.card.author?.name?.toLowerCase().includes(q2)) return true;
        if (search.filters.an.checked && card.card.author?.url?.toLowerCase().includes(q2)) return true;
        if (search.filters.cp.checked && card.chat.definition.toLowerCase().includes(q2)) return true;
        if (search.filters.ct.checked && card.chat.initials.some((m2) => m2.toLowerCase().includes(q2))) return true;
        return false;
      }
    };
  }

  // src/units/library/hash.ts
  var HASH_IMPORT_ROUTE = "#hash-import.";
  function hashListenerUnit() {
    const check = () => {
      if (!window.location.hash.startsWith(HASH_IMPORT_ROUTE)) return;
      importFromHash();
    };
    window.addEventListener("hashchange", check);
    check();
  }
  async function importFromHash() {
    const data = window.location.hash.slice(HASH_IMPORT_ROUTE.length);
    const raw = decodeURIComponent(data);
    const parsed = nothrow(() => JSON.parse(raw));
    if (!parsed.success) {
      toast("failed to parse hash import, the card is likely too long. if that's the case, please import JSON file");
      console.error(raw);
      window.location.hash = "chats";
      return;
    }
    const converted = await importDatacatJSON(parsed.value);
    idb.set("scenarios", converted);
    toast(`scenario card ${converted.card.title} imported successfully`);
    window.location.hash = "library";
  }

  // src/units/library.ts
  var CARDS_PER_PAGE = 16;
  var openerRelay = null;
  function libraryUnit() {
    hashListenerUnit();
    const startButton = document.querySelector("#library-start-button");
    const startPersonaPicker = document.querySelector("#library-start-persona");
    const startImportButton = document.querySelector("#library-start-import");
    const importButton = document.querySelector("#library-import");
    const downloadButton = document.querySelector("#library-download");
    const armoryButton = document.querySelector("#library-armory-button");
    const pager = document.querySelector("#library-pager");
    const modal = document.querySelector("#library-start");
    const search = {
      open: document.querySelector("#library-search"),
      button: document.querySelector("#library-search-button"),
      cancel: document.querySelector("#library-search-cancel"),
      dialog: document.querySelector("#library-search-dialog")
    };
    startButton.addEventListener("click", async () => {
      if (!openerRelay) return;
      const personaId = startPersonaPicker.value;
      if (!personaId) return;
      await start(personaId, openerRelay.scenarioId);
      modal.close();
    });
    startImportButton.addEventListener("input", async () => {
      const file = startImportButton.input.files?.[0];
      if (!file) return;
      const personaId = startPersonaPicker.value;
      if (!personaId) return;
      if (!openerRelay) return;
      const messages = await importSTMessages(file);
      if (messages.length === 0) return;
      await start(personaId, openerRelay.scenarioId, messages);
      modal.close();
    });
    importButton.addEventListener("input", () => {
      const files = importButton.input.files;
      if (!files?.[0]) return;
      for (let i = 0; i < files.length; ++i) {
        importScenario(files.item(i));
      }
    });
    downloadButton.addEventListener("click", async () => {
      alert([
        "Apologies, download is not available. jannyai.com",
        " started using Cloudflare's bot protection and",
        " can't be accessed automatically anymore.\n\n",
        "You still can import JSON files downloaded from",
        " https://datacat.run/ \n\n",
        "There's a chance a better integration will be",
        " implemented soon"
      ].join(""));
      return;
    });
    armoryButton.addEventListener("click", startArmory);
    search.open.addEventListener("click", () => {
      search.dialog.hidden = false;
    });
    search.button.addEventListener("click", () => {
      pager.page = 0;
      search.dialog.dataset.active = "true";
      update3();
    });
    search.cancel.addEventListener("click", () => {
      search.dialog.hidden = true;
      search.dialog.removeAttribute("data-active");
      update3();
    });
    pager.addEventListener("pick", update3);
    listen(async (u3) => {
      if (u3.storage !== "idb") return;
      if (u3.store !== "scenarios") return;
      update3();
    });
    update3();
  }
  async function update3() {
    const list = document.querySelector("#library-cards");
    const pager = document.querySelector("#library-pager");
    list.innerHTML = "";
    const items = await idb.getAll("scenarios");
    if (!items.success) return;
    items.value = filterBySearch(items.value);
    pager.pageCount = Math.ceil(items.value.length / CARDS_PER_PAGE);
    pager.style.display = pager.pageCount <= 1 ? "none" : "flex";
    if (pager.page >= pager.pageCount) pager.page = pager.pageCount - 1;
    if (pager.pageCount > 0 && pager.page < 0) pager.page = 0;
    const ix0 = pager.page * CARDS_PER_PAGE;
    const ix1 = ix0 + CARDS_PER_PAGE;
    const contents = items.value.reverse().slice(ix0, ix1).map(scenarioCardView);
    list.append(...contents);
    if (contents.length === 0)
      list.append(placeholderView("No scenario cards found"));
  }
  function scenarioCardView(item) {
    return makeScenarioCardView(
      item,
      item.card.picture ? getBlobLink(item.card.picture) : null,
      {
        play: () => openStartModal(item.id, item.card.description),
        download: () => downloadScenario(item),
        delete: () => deleteScenario(item.id, item.card.title),
        edit: () => {
          document.location.hash = `scenario-editor.${item.id}`;
        }
      }
    );
  }
  async function downloadScenario(card) {
    const payload = { ...card, card: { ...card.card }, chat: { ...card.chat } };
    async function encoded(value) {
      if (!value) return null;
      const icon = await getMedia(value);
      if (icon)
        return await b64Encoder.encode(icon.media);
      return isRemoteRef(value) ? value : null;
    }
    payload.card.picture = await encoded(card.card.picture);
    payload.chat.picture = await encoded(card.chat.picture);
    const filename = [payload.card.title, payload.chat.name].filter((t) => t).join(" | ");
    download(JSON.stringify(payload), `${filename}.aegir.scenario.json`);
  }
  async function importScenario(file) {
    const raw = await file.text();
    const parsed = JSON.parse(raw);
    if ("spec" in parsed && parsed.spec === "chara_card_v2") {
      const converted = await importDatacatJSON(parsed);
      idb.set("scenarios", converted);
    }
    if ("id" in parsed) {
      async function decode(b64) {
        if (!b64) return null;
        if (isRemoteRef(b64)) return b64;
        const file2 = await b64Encoder.decode(b64);
        const media = await upload(file2);
        return media;
      }
      parsed.card.picture = await decode(parsed.card.picture);
      parsed.chat.picture = await decode(parsed.chat.picture);
      parsed.lastUpdate = Date.now();
      idb.set("scenarios", parsed);
    }
  }
  function deleteScenario(id, name) {
    const ok = confirm(`scenario "${name}" will be deleted`);
    if (!ok) return;
    idb.del("scenarios", id);
  }
  async function openStartModal(scenario, descriptionMD) {
    const modal = document.querySelector("#library-start");
    const picker = modal.querySelector("#library-start-persona");
    const description = document.querySelector("#library-start-description");
    const placeholder2 = modal.querySelector("#library-start-placeholder");
    const noPlaceholder = modal.querySelector("#library-start-no-placeholder");
    const personas = await idb.getAll("personas");
    if (!personas.success) return;
    placeholder2.hidden = personas.value.length > 0;
    noPlaceholder.style.display = placeholder2.hidden ? "contents" : "none";
    setSelectOptions(
      picker,
      personas.value.map(({ id, name }) => [id, name]),
      personas.value[0]?.id
    );
    openerRelay = {
      scenarioId: scenario
    };
    description.hidden = descriptionMD.trim() ? false : true;
    description.innerHTML = renderMD(descriptionMD);
    modal.open();
  }

  // src/units/docs.ts
  function docsUnit() {
    const introMessage = document.querySelector("#help-message");
    const introModal = document.querySelector("#help-modal");
    const introClose = document.querySelector("#help-close");
    introClose.addEventListener("click", () => introModal.close());
    const fl = local.get("firstLaunch");
    if (fl) return;
    fetch("assets/docs/intro.md").then(async (r) => {
      if (!r.ok) return;
      local.set("firstLaunch", `{ "intro": true }`);
      introMessage.innerHTML = renderMD(await r.text());
      introModal.open();
    });
  }

  // src/index.ts
  define2();
  define();
  define3("ram-modal");
  define4();
  define5("ram-import");
  define6("ram-file-picker");
  define8("ram-image-picker");
  define7("ram-labeled");
  window.addEventListener("DOMContentLoaded", main);
  var units = [
    navigationUnit,
    settingsUnit,
    chatUnit,
    mainUnit,
    libraryUnit,
    scenarioUnit,
    docsUnit,
    cheatsUnit
  ];
  async function main() {
    units.forEach((u3) => u3());
    const dbAvailable = await init();
    if (!dbAvailable) toast("indexeddb init failed");
  }
})();
/*! Bundled license information:

dompurify/dist/purify.es.mjs:
  (*! @license DOMPurify 3.4.17 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.4.17/LICENSE *)
  (*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE *)
*/
//# sourceMappingURL=index.js.map
