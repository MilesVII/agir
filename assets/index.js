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

  // node_modules/rampike/dist/index.js
  function d(e = {}) {
    let { tagName: t, elementOptions: r } = e, n = document.createElement(t ?? "div", r);
    return l(n, e);
  }
  function l(e, { attributes: t, className: r, style: n, events: p, contents: o } = {}) {
    if (r && (e.className = r), typeof o == "string" ? e.textContent = o : Array.isArray(o) && e.append(...o), n && "style" in e) for (let a of i(n)) a.includes("-") ? e.style.setProperty(a, n[a] ?? null) : e.style[a] = n[a] ?? "";
    if (t) for (let a of Object.keys(t)) e.setAttribute(a, t[a]);
    if (p) for (let a of i(p)) e.addEventListener(a, (m2) => p[a](m2, e));
    return e;
  }
  function i(e) {
    return Object.keys(e);
  }
  var T = { skipInitialRender: false };
  function y(e, t, r, n) {
    let { skipInitialRender: p } = { ...T, ...n }, o = e;
    return o.rampike = { params: t, render: () => r(o.rampike.params, o) }, p || o.rampike.render(), o;
  }
  function c(e) {
    return s(e)[0] ?? null;
  }
  function s(e) {
    let t = e.content.cloneNode(true), r = [];
    return t.childNodes.forEach((n) => {
      n.nodeType === Node.ELEMENT_NODE && r.push(n);
    }), r;
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
      const form = d({
        tagName: "form",
        attributes: {
          method: "dialog"
        },
        events: {
          submit: (e) => e.preventDefault()
        }
      });
      this.dialog = d({
        tagName: "dialog",
        events: {
          click: (e, el) => {
            if (e.target === el) el.close();
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
  var TAG_NAME3 = "ram-pages";
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
      return this.readAttribute("pageCount", 0);
    }
    set pageCount(value) {
      this.setAttribute("pageCount", `${value}`);
      this.update();
    }
    links() {
      const r = [];
      let jam = false;
      for (let i2 = 0; i2 < this.pageCount; ++i2) {
        const distances = [
          Math.abs(i2 - 0),
          Math.abs(i2 - this.page),
          Math.abs(i2 - (this.pageCount - 1))
        ];
        if (Math.min(...distances) < this.distance) {
          r.push(i2);
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
        const current = page === this.page;
        const ellipsis = page === -1;
        const contents = ellipsis ? "\u2026" : `${page + 1}`;
        const events = ellipsis || current ? {} : {
          "click": () => this.pick(page)
        };
        const attributes = current ? { "data-current": "" } : {};
        const className = ellipsis ? this.getAttribute("class-ellipsi") : this.getAttribute("class-buttons");
        return d({
          tagName: ellipsis ? "span" : "button",
          className: className ?? void 0,
          attributes,
          events,
          contents
        });
      }));
    }
    pick(page) {
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
  function define4() {
    window.customElements.define(TAG_NAME3, RampikePages);
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
      const contents = d({
        tagName: "label",
        style: {
          display: "contents"
        },
        contents: [
          d({
            tagName: "input",
            attributes: {
              type: "file",
              accept: this.getAttribute("accept") ?? ""
            },
            style: {
              display: "none"
            }
          }),
          ...Array.from(this.children)
        ]
      });
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
      const contents = d({
        tagName: "fieldset",
        contents: [
          d({
            tagName: "legend",
            attributes: {
              for: attributes.id
            },
            contents: legend
          }),
          d({
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

  // node_modules/marked/lib/marked.esm.js
  function L() {
    return { async: false, breaks: false, extensions: null, gfm: true, hooks: null, pedantic: false, renderer: null, silent: false, tokenizer: null, walkTokens: null };
  }
  var T2 = L();
  function Z(u3) {
    T2 = u3;
  }
  var C = { exec: () => null };
  function k(u3, e = "") {
    let t = typeof u3 == "string" ? u3 : u3.source, n = { replace: (r, i2) => {
      let s2 = typeof i2 == "string" ? i2 : i2.source;
      return s2 = s2.replace(m.caret, "$1"), t = t.replace(r, s2), n;
    }, getRegex: () => new RegExp(t, e) };
    return n;
  }
  var me = (() => {
    try {
      return !!new RegExp("(?<=1)(?<!1)");
    } catch {
      return false;
    }
  })();
  var m = { codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm, outputLinkReplace: /\\([\[\]])/g, indentCodeCompensation: /^(\s+)(?:```)/, beginningSpace: /^\s+/, endingHash: /#$/, startingSpaceChar: /^ /, endingSpaceChar: / $/, nonSpaceChar: /[^ ]/, newLineCharGlobal: /\n/g, tabCharGlobal: /\t/g, multipleSpaceGlobal: /\s+/g, blankLine: /^[ \t]*$/, doubleBlankLine: /\n[ \t]*\n[ \t]*$/, blockquoteStart: /^ {0,3}>/, blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g, blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm, listReplaceTabs: /^\t+/, listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g, listIsTask: /^\[[ xX]\] +\S/, listReplaceTask: /^\[[ xX]\] +/, listTaskCheckbox: /\[[ xX]\]/, anyLine: /\n.*\n/, hrefBrackets: /^<(.*)>$/, tableDelimiter: /[:|]/, tableAlignChars: /^\||\| *$/g, tableRowBlankLine: /\n[ \t]*$/, tableAlignRight: /^ *-+: *$/, tableAlignCenter: /^ *:-+: *$/, tableAlignLeft: /^ *:-+ *$/, startATag: /^<a /i, endATag: /^<\/a>/i, startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i, endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i, startAngleBracket: /^</, endAngleBracket: />$/, pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/, unicodeAlphaNumeric: /[\p{L}\p{N}]/u, escapeTest: /[&<>"']/, escapeReplace: /[&<>"']/g, escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g, unescapeTest: /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig, caret: /(^|[^\[])\^/g, percentDecode: /%25/g, findPipe: /\|/g, splitPipe: / \|/, slashPipe: /\\\|/g, carriageReturn: /\r\n|\r/g, spaceLine: /^ +$/gm, notSpaceStart: /^\S*/, endingNewline: /\n$/, listItemRegex: (u3) => new RegExp(`^( {0,3}${u3})((?:[	 ][^\\n]*)?(?:\\n|$))`), nextBulletRegex: (u3) => new RegExp(`^ {0,${Math.min(3, u3 - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), hrRegex: (u3) => new RegExp(`^ {0,${Math.min(3, u3 - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), fencesBeginRegex: (u3) => new RegExp(`^ {0,${Math.min(3, u3 - 1)}}(?:\`\`\`|~~~)`), headingBeginRegex: (u3) => new RegExp(`^ {0,${Math.min(3, u3 - 1)}}#`), htmlBeginRegex: (u3) => new RegExp(`^ {0,${Math.min(3, u3 - 1)}}<(?:[a-z].*>|!--)`, "i") };
  var xe = /^(?:[ \t]*(?:\n|$))+/;
  var be = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/;
  var Re = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/;
  var I = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/;
  var Te = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
  var N = /(?:[*+-]|\d{1,9}[.)])/;
  var re = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/;
  var se = k(re).replace(/bull/g, N).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex();
  var Oe = k(re).replace(/bull/g, N).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex();
  var Q = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/;
  var we = /^[^\n]+/;
  var F = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/;
  var ye = k(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", F).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex();
  var Pe = k(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, N).getRegex();
  var v = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
  var j = /<!--(?:-?>|[\s\S]*?(?:-->|$))/;
  var Se = k("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", j).replace("tag", v).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
  var ie = k(Q).replace("hr", I).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", v).getRegex();
  var $e = k(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", ie).getRegex();
  var U = { blockquote: $e, code: be, def: ye, fences: Re, heading: Te, hr: I, html: Se, lheading: se, list: Pe, newline: xe, paragraph: ie, table: C, text: we };
  var te = k("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", I).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", v).getRegex();
  var _e = { ...U, lheading: Oe, table: te, paragraph: k(Q).replace("hr", I).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", te).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", v).getRegex() };
  var Le = { ...U, html: k(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", j).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(), def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/, heading: /^(#{1,6})(.*)(?:\n+|$)/, fences: C, lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/, paragraph: k(Q).replace("hr", I).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", se).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex() };
  var Me = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
  var ze = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
  var oe = /^( {2,}|\\)\n(?!\s*$)/;
  var Ae = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/;
  var D = /[\p{P}\p{S}]/u;
  var K = /[\s\p{P}\p{S}]/u;
  var ae = /[^\s\p{P}\p{S}]/u;
  var Ce = k(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, K).getRegex();
  var le = /(?!~)[\p{P}\p{S}]/u;
  var Ie = /(?!~)[\s\p{P}\p{S}]/u;
  var Ee = /(?:[^\s\p{P}\p{S}]|~)/u;
  var Be = k(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", me ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex();
  var ue = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/;
  var qe = k(ue, "u").replace(/punct/g, D).getRegex();
  var ve = k(ue, "u").replace(/punct/g, le).getRegex();
  var pe = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)";
  var De = k(pe, "gu").replace(/notPunctSpace/g, ae).replace(/punctSpace/g, K).replace(/punct/g, D).getRegex();
  var He = k(pe, "gu").replace(/notPunctSpace/g, Ee).replace(/punctSpace/g, Ie).replace(/punct/g, le).getRegex();
  var Ze = k("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, ae).replace(/punctSpace/g, K).replace(/punct/g, D).getRegex();
  var Ge = k(/\\(punct)/, "gu").replace(/punct/g, D).getRegex();
  var Ne = k(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex();
  var Qe = k(j).replace("(?:-->|$)", "-->").getRegex();
  var Fe = k("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Qe).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex();
  var q = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+[^`]*?`+(?!`)|[^\[\]\\`])*?/;
  var je = k(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label", q).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex();
  var ce = k(/^!?\[(label)\]\[(ref)\]/).replace("label", q).replace("ref", F).getRegex();
  var he = k(/^!?\[(ref)\](?:\[\])?/).replace("ref", F).getRegex();
  var Ue = k("reflink|nolink(?!\\()", "g").replace("reflink", ce).replace("nolink", he).getRegex();
  var ne = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/;
  var W = { _backpedal: C, anyPunctuation: Ge, autolink: Ne, blockSkip: Be, br: oe, code: ze, del: C, emStrongLDelim: qe, emStrongRDelimAst: De, emStrongRDelimUnd: Ze, escape: Me, link: je, nolink: he, punctuation: Ce, reflink: ce, reflinkSearch: Ue, tag: Fe, text: Ae, url: C };
  var Ke = { ...W, link: k(/^!?\[(label)\]\((.*?)\)/).replace("label", q).getRegex(), reflink: k(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", q).getRegex() };
  var G = { ...W, emStrongRDelimAst: He, emStrongLDelim: ve, url: k(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol", ne).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(), _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/, del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/, text: k(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol", ne).getRegex() };
  var We = { ...G, br: k(oe).replace("{2,}", "*").getRegex(), text: k(G.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex() };
  var E = { normal: U, gfm: _e, pedantic: Le };
  var M = { normal: W, gfm: G, breaks: We, pedantic: Ke };
  var Xe = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  var ke = (u3) => Xe[u3];
  function w(u3, e) {
    if (e) {
      if (m.escapeTest.test(u3)) return u3.replace(m.escapeReplace, ke);
    } else if (m.escapeTestNoEncode.test(u3)) return u3.replace(m.escapeReplaceNoEncode, ke);
    return u3;
  }
  function X(u3) {
    try {
      u3 = encodeURI(u3).replace(m.percentDecode, "%");
    } catch {
      return null;
    }
    return u3;
  }
  function J(u3, e) {
    let t = u3.replace(m.findPipe, (i2, s2, a) => {
      let o = false, l2 = s2;
      for (; --l2 >= 0 && a[l2] === "\\"; ) o = !o;
      return o ? "|" : " |";
    }), n = t.split(m.splitPipe), r = 0;
    if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), e) if (n.length > e) n.splice(e);
    else for (; n.length < e; ) n.push("");
    for (; r < n.length; r++) n[r] = n[r].trim().replace(m.slashPipe, "|");
    return n;
  }
  function z(u3, e, t) {
    let n = u3.length;
    if (n === 0) return "";
    let r = 0;
    for (; r < n; ) {
      let i2 = u3.charAt(n - r - 1);
      if (i2 === e && !t) r++;
      else if (i2 !== e && t) r++;
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
  function ge(u3, e, t, n, r) {
    let i2 = e.href, s2 = e.title || null, a = u3[1].replace(r.other.outputLinkReplace, "$1");
    n.state.inLink = true;
    let o = { type: u3[0].charAt(0) === "!" ? "image" : "link", raw: t, href: i2, title: s2, text: a, tokens: n.inlineTokens(a) };
    return n.state.inLink = false, o;
  }
  function Je(u3, e, t) {
    let n = u3.match(t.other.indentCodeCompensation);
    if (n === null) return e;
    let r = n[1];
    return e.split(`
`).map((i2) => {
      let s2 = i2.match(t.other.beginningSpace);
      if (s2 === null) return i2;
      let [a] = s2;
      return a.length >= r.length ? i2.slice(r.length) : i2;
    }).join(`
`);
  }
  var y2 = class {
    options;
    rules;
    lexer;
    constructor(e) {
      this.options = e || T2;
    }
    space(e) {
      let t = this.rules.block.newline.exec(e);
      if (t && t[0].length > 0) return { type: "space", raw: t[0] };
    }
    code(e) {
      let t = this.rules.block.code.exec(e);
      if (t) {
        let n = t[0].replace(this.rules.other.codeRemoveIndent, "");
        return { type: "code", raw: t[0], codeBlockStyle: "indented", text: this.options.pedantic ? n : z(n, `
`) };
      }
    }
    fences(e) {
      let t = this.rules.block.fences.exec(e);
      if (t) {
        let n = t[0], r = Je(n, t[3] || "", this.rules);
        return { type: "code", raw: n, lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2], text: r };
      }
    }
    heading(e) {
      let t = this.rules.block.heading.exec(e);
      if (t) {
        let n = t[2].trim();
        if (this.rules.other.endingHash.test(n)) {
          let r = z(n, "#");
          (this.options.pedantic || !r || this.rules.other.endingSpaceChar.test(r)) && (n = r.trim());
        }
        return { type: "heading", raw: t[0], depth: t[1].length, text: n, tokens: this.lexer.inline(n) };
      }
    }
    hr(e) {
      let t = this.rules.block.hr.exec(e);
      if (t) return { type: "hr", raw: z(t[0], `
`) };
    }
    blockquote(e) {
      let t = this.rules.block.blockquote.exec(e);
      if (t) {
        let n = z(t[0], `
`).split(`
`), r = "", i2 = "", s2 = [];
        for (; n.length > 0; ) {
          let a = false, o = [], l2;
          for (l2 = 0; l2 < n.length; l2++) if (this.rules.other.blockquoteStart.test(n[l2])) o.push(n[l2]), a = true;
          else if (!a) o.push(n[l2]);
          else break;
          n = n.slice(l2);
          let p = o.join(`
`), c2 = p.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
          r = r ? `${r}
${p}` : p, i2 = i2 ? `${i2}
${c2}` : c2;
          let g = this.lexer.state.top;
          if (this.lexer.state.top = true, this.lexer.blockTokens(c2, s2, true), this.lexer.state.top = g, n.length === 0) break;
          let h = s2.at(-1);
          if (h?.type === "code") break;
          if (h?.type === "blockquote") {
            let R = h, f = R.raw + `
` + n.join(`
`), O = this.blockquote(f);
            s2[s2.length - 1] = O, r = r.substring(0, r.length - R.raw.length) + O.raw, i2 = i2.substring(0, i2.length - R.text.length) + O.text;
            break;
          } else if (h?.type === "list") {
            let R = h, f = R.raw + `
` + n.join(`
`), O = this.list(f);
            s2[s2.length - 1] = O, r = r.substring(0, r.length - h.raw.length) + O.raw, i2 = i2.substring(0, i2.length - R.raw.length) + O.raw, n = f.substring(s2.at(-1).raw.length).split(`
`);
            continue;
          }
        }
        return { type: "blockquote", raw: r, tokens: s2, text: i2 };
      }
    }
    list(e) {
      let t = this.rules.block.list.exec(e);
      if (t) {
        let n = t[1].trim(), r = n.length > 1, i2 = { type: "list", raw: "", ordered: r, start: r ? +n.slice(0, -1) : "", loose: false, items: [] };
        n = r ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = r ? n : "[*+-]");
        let s2 = this.rules.other.listItemRegex(n), a = false;
        for (; e; ) {
          let l2 = false, p = "", c2 = "";
          if (!(t = s2.exec(e)) || this.rules.block.hr.test(e)) break;
          p = t[0], e = e.substring(p.length);
          let g = t[2].split(`
`, 1)[0].replace(this.rules.other.listReplaceTabs, (O) => " ".repeat(3 * O.length)), h = e.split(`
`, 1)[0], R = !g.trim(), f = 0;
          if (this.options.pedantic ? (f = 2, c2 = g.trimStart()) : R ? f = t[1].length + 1 : (f = t[2].search(this.rules.other.nonSpaceChar), f = f > 4 ? 1 : f, c2 = g.slice(f), f += t[1].length), R && this.rules.other.blankLine.test(h) && (p += h + `
`, e = e.substring(h.length + 1), l2 = true), !l2) {
            let O = this.rules.other.nextBulletRegex(f), V = this.rules.other.hrRegex(f), Y = this.rules.other.fencesBeginRegex(f), ee = this.rules.other.headingBeginRegex(f), fe = this.rules.other.htmlBeginRegex(f);
            for (; e; ) {
              let H = e.split(`
`, 1)[0], A;
              if (h = H, this.options.pedantic ? (h = h.replace(this.rules.other.listReplaceNesting, "  "), A = h) : A = h.replace(this.rules.other.tabCharGlobal, "    "), Y.test(h) || ee.test(h) || fe.test(h) || O.test(h) || V.test(h)) break;
              if (A.search(this.rules.other.nonSpaceChar) >= f || !h.trim()) c2 += `
` + A.slice(f);
              else {
                if (R || g.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || Y.test(g) || ee.test(g) || V.test(g)) break;
                c2 += `
` + h;
              }
              !R && !h.trim() && (R = true), p += H + `
`, e = e.substring(H.length + 1), g = A.slice(f);
            }
          }
          i2.loose || (a ? i2.loose = true : this.rules.other.doubleBlankLine.test(p) && (a = true)), i2.items.push({ type: "list_item", raw: p, task: !!this.options.gfm && this.rules.other.listIsTask.test(c2), loose: false, text: c2, tokens: [] }), i2.raw += p;
        }
        let o = i2.items.at(-1);
        if (o) o.raw = o.raw.trimEnd(), o.text = o.text.trimEnd();
        else return;
        i2.raw = i2.raw.trimEnd();
        for (let l2 of i2.items) {
          if (this.lexer.state.top = false, l2.tokens = this.lexer.blockTokens(l2.text, []), l2.task) {
            if (l2.text = l2.text.replace(this.rules.other.listReplaceTask, ""), l2.tokens[0]?.type === "text" || l2.tokens[0]?.type === "paragraph") {
              l2.tokens[0].raw = l2.tokens[0].raw.replace(this.rules.other.listReplaceTask, ""), l2.tokens[0].text = l2.tokens[0].text.replace(this.rules.other.listReplaceTask, "");
              for (let c2 = this.lexer.inlineQueue.length - 1; c2 >= 0; c2--) if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[c2].src)) {
                this.lexer.inlineQueue[c2].src = this.lexer.inlineQueue[c2].src.replace(this.rules.other.listReplaceTask, "");
                break;
              }
            }
            let p = this.rules.other.listTaskCheckbox.exec(l2.raw);
            if (p) {
              let c2 = { type: "checkbox", raw: p[0] + " ", checked: p[0] !== "[ ]" };
              l2.checked = c2.checked, i2.loose ? l2.tokens[0] && ["paragraph", "text"].includes(l2.tokens[0].type) && "tokens" in l2.tokens[0] && l2.tokens[0].tokens ? (l2.tokens[0].raw = c2.raw + l2.tokens[0].raw, l2.tokens[0].text = c2.raw + l2.tokens[0].text, l2.tokens[0].tokens.unshift(c2)) : l2.tokens.unshift({ type: "paragraph", raw: c2.raw, text: c2.raw, tokens: [c2] }) : l2.tokens.unshift(c2);
            }
          }
          if (!i2.loose) {
            let p = l2.tokens.filter((g) => g.type === "space"), c2 = p.length > 0 && p.some((g) => this.rules.other.anyLine.test(g.raw));
            i2.loose = c2;
          }
        }
        if (i2.loose) for (let l2 of i2.items) {
          l2.loose = true;
          for (let p of l2.tokens) p.type === "text" && (p.type = "paragraph");
        }
        return i2;
      }
    }
    html(e) {
      let t = this.rules.block.html.exec(e);
      if (t) return { type: "html", block: true, raw: t[0], pre: t[1] === "pre" || t[1] === "script" || t[1] === "style", text: t[0] };
    }
    def(e) {
      let t = this.rules.block.def.exec(e);
      if (t) {
        let n = t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), r = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", i2 = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
        return { type: "def", tag: n, raw: t[0], href: r, title: i2 };
      }
    }
    table(e) {
      let t = this.rules.block.table.exec(e);
      if (!t || !this.rules.other.tableDelimiter.test(t[2])) return;
      let n = J(t[1]), r = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), i2 = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], s2 = { type: "table", raw: t[0], header: [], align: [], rows: [] };
      if (n.length === r.length) {
        for (let a of r) this.rules.other.tableAlignRight.test(a) ? s2.align.push("right") : this.rules.other.tableAlignCenter.test(a) ? s2.align.push("center") : this.rules.other.tableAlignLeft.test(a) ? s2.align.push("left") : s2.align.push(null);
        for (let a = 0; a < n.length; a++) s2.header.push({ text: n[a], tokens: this.lexer.inline(n[a]), header: true, align: s2.align[a] });
        for (let a of i2) s2.rows.push(J(a, s2.header.length).map((o, l2) => ({ text: o, tokens: this.lexer.inline(o), header: false, align: s2.align[l2] })));
        return s2;
      }
    }
    lheading(e) {
      let t = this.rules.block.lheading.exec(e);
      if (t) return { type: "heading", raw: t[0], depth: t[2].charAt(0) === "=" ? 1 : 2, text: t[1], tokens: this.lexer.inline(t[1]) };
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
          let s2 = z(n.slice(0, -1), "\\");
          if ((n.length - s2.length) % 2 === 0) return;
        } else {
          let s2 = de(t[2], "()");
          if (s2 === -2) return;
          if (s2 > -1) {
            let o = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + s2;
            t[2] = t[2].substring(0, s2), t[0] = t[0].substring(0, o).trim(), t[3] = "";
          }
        }
        let r = t[2], i2 = "";
        if (this.options.pedantic) {
          let s2 = this.rules.other.pedanticHrefTitle.exec(r);
          s2 && (r = s2[1], i2 = s2[3]);
        } else i2 = t[3] ? t[3].slice(1, -1) : "";
        return r = r.trim(), this.rules.other.startAngleBracket.test(r) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(n) ? r = r.slice(1) : r = r.slice(1, -1)), ge(t, { href: r && r.replace(this.rules.inline.anyPunctuation, "$1"), title: i2 && i2.replace(this.rules.inline.anyPunctuation, "$1") }, t[0], this.lexer, this.rules);
      }
    }
    reflink(e, t) {
      let n;
      if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
        let r = (n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " "), i2 = t[r.toLowerCase()];
        if (!i2) {
          let s2 = n[0].charAt(0);
          return { type: "text", raw: s2, text: s2 };
        }
        return ge(n, i2, n[0], this.lexer, this.rules);
      }
    }
    emStrong(e, t, n = "") {
      let r = this.rules.inline.emStrongLDelim.exec(e);
      if (!r || r[3] && n.match(this.rules.other.unicodeAlphaNumeric)) return;
      if (!(r[1] || r[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
        let s2 = [...r[0]].length - 1, a, o, l2 = s2, p = 0, c2 = r[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
        for (c2.lastIndex = 0, t = t.slice(-1 * e.length + s2); (r = c2.exec(t)) != null; ) {
          if (a = r[1] || r[2] || r[3] || r[4] || r[5] || r[6], !a) continue;
          if (o = [...a].length, r[3] || r[4]) {
            l2 += o;
            continue;
          } else if ((r[5] || r[6]) && s2 % 3 && !((s2 + o) % 3)) {
            p += o;
            continue;
          }
          if (l2 -= o, l2 > 0) continue;
          o = Math.min(o, o + l2 + p);
          let g = [...r[0]][0].length, h = e.slice(0, s2 + r.index + g + o);
          if (Math.min(s2, o) % 2) {
            let f = h.slice(1, -1);
            return { type: "em", raw: h, text: f, tokens: this.lexer.inlineTokens(f) };
          }
          let R = h.slice(2, -2);
          return { type: "strong", raw: h, text: R, tokens: this.lexer.inlineTokens(R) };
        }
      }
    }
    codespan(e) {
      let t = this.rules.inline.code.exec(e);
      if (t) {
        let n = t[2].replace(this.rules.other.newLineCharGlobal, " "), r = this.rules.other.nonSpaceChar.test(n), i2 = this.rules.other.startingSpaceChar.test(n) && this.rules.other.endingSpaceChar.test(n);
        return r && i2 && (n = n.substring(1, n.length - 1)), { type: "codespan", raw: t[0], text: n };
      }
    }
    br(e) {
      let t = this.rules.inline.br.exec(e);
      if (t) return { type: "br", raw: t[0] };
    }
    del(e) {
      let t = this.rules.inline.del.exec(e);
      if (t) return { type: "del", raw: t[0], text: t[2], tokens: this.lexer.inlineTokens(t[2]) };
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
          let i2;
          do
            i2 = t[0], t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? "";
          while (i2 !== t[0]);
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
      this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || T2, this.options.tokenizer = this.options.tokenizer || new y2(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = { inLink: false, inRawBlock: false, top: true };
      let t = { other: m, block: E.normal, inline: M.normal };
      this.options.pedantic ? (t.block = E.pedantic, t.inline = M.pedantic) : this.options.gfm && (t.block = E.gfm, this.options.breaks ? t.inline = M.breaks : t.inline = M.gfm), this.tokenizer.rules = t;
    }
    static get rules() {
      return { block: E, inline: M };
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
      for (this.options.pedantic && (e = e.replace(m.tabCharGlobal, "    ").replace(m.spaceLine, "")); e; ) {
        let r;
        if (this.options.extensions?.block?.some((s2) => (r = s2.call({ lexer: this }, e, t)) ? (e = e.substring(r.raw.length), t.push(r), true) : false)) continue;
        if (r = this.tokenizer.space(e)) {
          e = e.substring(r.raw.length);
          let s2 = t.at(-1);
          r.raw.length === 1 && s2 !== void 0 ? s2.raw += `
` : t.push(r);
          continue;
        }
        if (r = this.tokenizer.code(e)) {
          e = e.substring(r.raw.length);
          let s2 = t.at(-1);
          s2?.type === "paragraph" || s2?.type === "text" ? (s2.raw += (s2.raw.endsWith(`
`) ? "" : `
`) + r.raw, s2.text += `
` + r.text, this.inlineQueue.at(-1).src = s2.text) : t.push(r);
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
          let s2 = t.at(-1);
          s2?.type === "paragraph" || s2?.type === "text" ? (s2.raw += (s2.raw.endsWith(`
`) ? "" : `
`) + r.raw, s2.text += `
` + r.raw, this.inlineQueue.at(-1).src = s2.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = { href: r.href, title: r.title }, t.push(r));
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
        let i2 = e;
        if (this.options.extensions?.startBlock) {
          let s2 = 1 / 0, a = e.slice(1), o;
          this.options.extensions.startBlock.forEach((l2) => {
            o = l2.call({ lexer: this }, a), typeof o == "number" && o >= 0 && (s2 = Math.min(s2, o));
          }), s2 < 1 / 0 && s2 >= 0 && (i2 = e.substring(0, s2 + 1));
        }
        if (this.state.top && (r = this.tokenizer.paragraph(i2))) {
          let s2 = t.at(-1);
          n && s2?.type === "paragraph" ? (s2.raw += (s2.raw.endsWith(`
`) ? "" : `
`) + r.raw, s2.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = s2.text) : t.push(r), n = i2.length !== e.length, e = e.substring(r.raw.length);
          continue;
        }
        if (r = this.tokenizer.text(e)) {
          e = e.substring(r.raw.length);
          let s2 = t.at(-1);
          s2?.type === "text" ? (s2.raw += (s2.raw.endsWith(`
`) ? "" : `
`) + r.raw, s2.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = s2.text) : t.push(r);
          continue;
        }
        if (e) {
          let s2 = "Infinite loop on byte: " + e.charCodeAt(0);
          if (this.options.silent) {
            console.error(s2);
            break;
          } else throw new Error(s2);
        }
      }
      return this.state.top = true, t;
    }
    inline(e, t = []) {
      return this.inlineQueue.push({ src: e, tokens: t }), t;
    }
    inlineTokens(e, t = []) {
      let n = e, r = null;
      if (this.tokens.links) {
        let o = Object.keys(this.tokens.links);
        if (o.length > 0) for (; (r = this.tokenizer.rules.inline.reflinkSearch.exec(n)) != null; ) o.includes(r[0].slice(r[0].lastIndexOf("[") + 1, -1)) && (n = n.slice(0, r.index) + "[" + "a".repeat(r[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
      }
      for (; (r = this.tokenizer.rules.inline.anyPunctuation.exec(n)) != null; ) n = n.slice(0, r.index) + "++" + n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
      let i2;
      for (; (r = this.tokenizer.rules.inline.blockSkip.exec(n)) != null; ) i2 = r[2] ? r[2].length : 0, n = n.slice(0, r.index + i2) + "[" + "a".repeat(r[0].length - i2 - 2) + "]" + n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
      n = this.options.hooks?.emStrongMask?.call({ lexer: this }, n) ?? n;
      let s2 = false, a = "";
      for (; e; ) {
        s2 || (a = ""), s2 = false;
        let o;
        if (this.options.extensions?.inline?.some((p) => (o = p.call({ lexer: this }, e, t)) ? (e = e.substring(o.raw.length), t.push(o), true) : false)) continue;
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
          let p = t.at(-1);
          o.type === "text" && p?.type === "text" ? (p.raw += o.raw, p.text += o.text) : t.push(o);
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
        if (o = this.tokenizer.del(e)) {
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
        let l2 = e;
        if (this.options.extensions?.startInline) {
          let p = 1 / 0, c2 = e.slice(1), g;
          this.options.extensions.startInline.forEach((h) => {
            g = h.call({ lexer: this }, c2), typeof g == "number" && g >= 0 && (p = Math.min(p, g));
          }), p < 1 / 0 && p >= 0 && (l2 = e.substring(0, p + 1));
        }
        if (o = this.tokenizer.inlineText(l2)) {
          e = e.substring(o.raw.length), o.raw.slice(-1) !== "_" && (a = o.raw.slice(-1)), s2 = true;
          let p = t.at(-1);
          p?.type === "text" ? (p.raw += o.raw, p.text += o.text) : t.push(o);
          continue;
        }
        if (e) {
          let p = "Infinite loop on byte: " + e.charCodeAt(0);
          if (this.options.silent) {
            console.error(p);
            break;
          } else throw new Error(p);
        }
      }
      return t;
    }
  };
  var P = class {
    options;
    parser;
    constructor(e) {
      this.options = e || T2;
    }
    space(e) {
      return "";
    }
    code({ text: e, lang: t, escaped: n }) {
      let r = (t || "").match(m.notSpaceStart)?.[0], i2 = e.replace(m.endingNewline, "") + `
`;
      return r ? '<pre><code class="language-' + w(r) + '">' + (n ? i2 : w(i2, true)) + `</code></pre>
` : "<pre><code>" + (n ? i2 : w(i2, true)) + `</code></pre>
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
      let i2 = t ? "ol" : "ul", s2 = t && n !== 1 ? ' start="' + n + '"' : "";
      return "<" + i2 + s2 + `>
` + r + "</" + i2 + `>
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
      for (let i2 = 0; i2 < e.header.length; i2++) n += this.tablecell(e.header[i2]);
      t += this.tablerow({ text: n });
      let r = "";
      for (let i2 = 0; i2 < e.rows.length; i2++) {
        let s2 = e.rows[i2];
        n = "";
        for (let a = 0; a < s2.length; a++) n += this.tablecell(s2[a]);
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
      return `<code>${w(e, true)}</code>`;
    }
    br(e) {
      return "<br>";
    }
    del({ tokens: e }) {
      return `<del>${this.parser.parseInline(e)}</del>`;
    }
    link({ href: e, title: t, tokens: n }) {
      let r = this.parser.parseInline(n), i2 = X(e);
      if (i2 === null) return r;
      e = i2;
      let s2 = '<a href="' + e + '"';
      return t && (s2 += ' title="' + w(t) + '"'), s2 += ">" + r + "</a>", s2;
    }
    image({ href: e, title: t, text: n, tokens: r }) {
      r && (n = this.parser.parseInline(r, this.parser.textRenderer));
      let i2 = X(e);
      if (i2 === null) return w(n);
      e = i2;
      let s2 = `<img src="${e}" alt="${n}"`;
      return t && (s2 += ` title="${w(t)}"`), s2 += ">", s2;
    }
    text(e) {
      return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : w(e.text);
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
      this.options = e || T2, this.options.renderer = this.options.renderer || new P(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new $();
    }
    static parse(e, t) {
      return new u2(t).parse(e);
    }
    static parseInline(e, t) {
      return new u2(t).parseInline(e);
    }
    parse(e) {
      let t = "";
      for (let n = 0; n < e.length; n++) {
        let r = e[n];
        if (this.options.extensions?.renderers?.[r.type]) {
          let s2 = r, a = this.options.extensions.renderers[s2.type].call({ parser: this }, s2);
          if (a !== false || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "def", "paragraph", "text"].includes(s2.type)) {
            t += a || "";
            continue;
          }
        }
        let i2 = r;
        switch (i2.type) {
          case "space": {
            t += this.renderer.space(i2);
            break;
          }
          case "hr": {
            t += this.renderer.hr(i2);
            break;
          }
          case "heading": {
            t += this.renderer.heading(i2);
            break;
          }
          case "code": {
            t += this.renderer.code(i2);
            break;
          }
          case "table": {
            t += this.renderer.table(i2);
            break;
          }
          case "blockquote": {
            t += this.renderer.blockquote(i2);
            break;
          }
          case "list": {
            t += this.renderer.list(i2);
            break;
          }
          case "checkbox": {
            t += this.renderer.checkbox(i2);
            break;
          }
          case "html": {
            t += this.renderer.html(i2);
            break;
          }
          case "def": {
            t += this.renderer.def(i2);
            break;
          }
          case "paragraph": {
            t += this.renderer.paragraph(i2);
            break;
          }
          case "text": {
            t += this.renderer.text(i2);
            break;
          }
          default: {
            let s2 = 'Token with "' + i2.type + '" type was not found.';
            if (this.options.silent) return console.error(s2), "";
            throw new Error(s2);
          }
        }
      }
      return t;
    }
    parseInline(e, t = this.renderer) {
      let n = "";
      for (let r = 0; r < e.length; r++) {
        let i2 = e[r];
        if (this.options.extensions?.renderers?.[i2.type]) {
          let a = this.options.extensions.renderers[i2.type].call({ parser: this }, i2);
          if (a !== false || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(i2.type)) {
            n += a || "";
            continue;
          }
        }
        let s2 = i2;
        switch (s2.type) {
          case "escape": {
            n += t.text(s2);
            break;
          }
          case "html": {
            n += t.html(s2);
            break;
          }
          case "link": {
            n += t.link(s2);
            break;
          }
          case "image": {
            n += t.image(s2);
            break;
          }
          case "checkbox": {
            n += t.checkbox(s2);
            break;
          }
          case "strong": {
            n += t.strong(s2);
            break;
          }
          case "em": {
            n += t.em(s2);
            break;
          }
          case "codespan": {
            n += t.codespan(s2);
            break;
          }
          case "br": {
            n += t.br(s2);
            break;
          }
          case "del": {
            n += t.del(s2);
            break;
          }
          case "text": {
            n += t.text(s2);
            break;
          }
          default: {
            let a = 'Token with "' + s2.type + '" type was not found.';
            if (this.options.silent) return console.error(a), "";
            throw new Error(a);
          }
        }
      }
      return n;
    }
  };
  var S = class {
    options;
    block;
    constructor(e) {
      this.options = e || T2;
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
    provideLexer() {
      return this.block ? x.lex : x.lexInline;
    }
    provideParser() {
      return this.block ? b.parse : b.parseInline;
    }
  };
  var B = class {
    defaults = L();
    options = this.setOptions;
    parse = this.parseMarkdown(true);
    parseInline = this.parseMarkdown(false);
    Parser = b;
    Renderer = P;
    TextRenderer = $;
    Lexer = x;
    Tokenizer = y2;
    Hooks = S;
    constructor(...e) {
      this.use(...e);
    }
    walkTokens(e, t) {
      let n = [];
      for (let r of e) switch (n = n.concat(t.call(this, r)), r.type) {
        case "table": {
          let i2 = r;
          for (let s2 of i2.header) n = n.concat(this.walkTokens(s2.tokens, t));
          for (let s2 of i2.rows) for (let a of s2) n = n.concat(this.walkTokens(a.tokens, t));
          break;
        }
        case "list": {
          let i2 = r;
          n = n.concat(this.walkTokens(i2.items, t));
          break;
        }
        default: {
          let i2 = r;
          this.defaults.extensions?.childTokens?.[i2.type] ? this.defaults.extensions.childTokens[i2.type].forEach((s2) => {
            let a = i2[s2].flat(1 / 0);
            n = n.concat(this.walkTokens(a, t));
          }) : i2.tokens && (n = n.concat(this.walkTokens(i2.tokens, t)));
        }
      }
      return n;
    }
    use(...e) {
      let t = this.defaults.extensions || { renderers: {}, childTokens: {} };
      return e.forEach((n) => {
        let r = { ...n };
        if (r.async = this.defaults.async || r.async || false, n.extensions && (n.extensions.forEach((i2) => {
          if (!i2.name) throw new Error("extension name required");
          if ("renderer" in i2) {
            let s2 = t.renderers[i2.name];
            s2 ? t.renderers[i2.name] = function(...a) {
              let o = i2.renderer.apply(this, a);
              return o === false && (o = s2.apply(this, a)), o;
            } : t.renderers[i2.name] = i2.renderer;
          }
          if ("tokenizer" in i2) {
            if (!i2.level || i2.level !== "block" && i2.level !== "inline") throw new Error("extension level must be 'block' or 'inline'");
            let s2 = t[i2.level];
            s2 ? s2.unshift(i2.tokenizer) : t[i2.level] = [i2.tokenizer], i2.start && (i2.level === "block" ? t.startBlock ? t.startBlock.push(i2.start) : t.startBlock = [i2.start] : i2.level === "inline" && (t.startInline ? t.startInline.push(i2.start) : t.startInline = [i2.start]));
          }
          "childTokens" in i2 && i2.childTokens && (t.childTokens[i2.name] = i2.childTokens);
        }), r.extensions = t), n.renderer) {
          let i2 = this.defaults.renderer || new P(this.defaults);
          for (let s2 in n.renderer) {
            if (!(s2 in i2)) throw new Error(`renderer '${s2}' does not exist`);
            if (["options", "parser"].includes(s2)) continue;
            let a = s2, o = n.renderer[a], l2 = i2[a];
            i2[a] = (...p) => {
              let c2 = o.apply(i2, p);
              return c2 === false && (c2 = l2.apply(i2, p)), c2 || "";
            };
          }
          r.renderer = i2;
        }
        if (n.tokenizer) {
          let i2 = this.defaults.tokenizer || new y2(this.defaults);
          for (let s2 in n.tokenizer) {
            if (!(s2 in i2)) throw new Error(`tokenizer '${s2}' does not exist`);
            if (["options", "rules", "lexer"].includes(s2)) continue;
            let a = s2, o = n.tokenizer[a], l2 = i2[a];
            i2[a] = (...p) => {
              let c2 = o.apply(i2, p);
              return c2 === false && (c2 = l2.apply(i2, p)), c2;
            };
          }
          r.tokenizer = i2;
        }
        if (n.hooks) {
          let i2 = this.defaults.hooks || new S();
          for (let s2 in n.hooks) {
            if (!(s2 in i2)) throw new Error(`hook '${s2}' does not exist`);
            if (["options", "block"].includes(s2)) continue;
            let a = s2, o = n.hooks[a], l2 = i2[a];
            S.passThroughHooks.has(s2) ? i2[a] = (p) => {
              if (this.defaults.async && S.passThroughHooksRespectAsync.has(s2)) return (async () => {
                let g = await o.call(i2, p);
                return l2.call(i2, g);
              })();
              let c2 = o.call(i2, p);
              return l2.call(i2, c2);
            } : i2[a] = (...p) => {
              if (this.defaults.async) return (async () => {
                let g = await o.apply(i2, p);
                return g === false && (g = await l2.apply(i2, p)), g;
              })();
              let c2 = o.apply(i2, p);
              return c2 === false && (c2 = l2.apply(i2, p)), c2;
            };
          }
          r.hooks = i2;
        }
        if (n.walkTokens) {
          let i2 = this.defaults.walkTokens, s2 = n.walkTokens;
          r.walkTokens = function(a) {
            let o = [];
            return o.push(s2.call(this, a)), i2 && (o = o.concat(i2.call(this, a))), o;
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
        let i2 = { ...r }, s2 = { ...this.defaults, ...i2 }, a = this.onError(!!s2.silent, !!s2.async);
        if (this.defaults.async === true && i2.async === false) return a(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
        if (typeof n > "u" || n === null) return a(new Error("marked(): input parameter is undefined or null"));
        if (typeof n != "string") return a(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
        if (s2.hooks && (s2.hooks.options = s2, s2.hooks.block = e), s2.async) return (async () => {
          let o = s2.hooks ? await s2.hooks.preprocess(n) : n, p = await (s2.hooks ? await s2.hooks.provideLexer() : e ? x.lex : x.lexInline)(o, s2), c2 = s2.hooks ? await s2.hooks.processAllTokens(p) : p;
          s2.walkTokens && await Promise.all(this.walkTokens(c2, s2.walkTokens));
          let h = await (s2.hooks ? await s2.hooks.provideParser() : e ? b.parse : b.parseInline)(c2, s2);
          return s2.hooks ? await s2.hooks.postprocess(h) : h;
        })().catch(a);
        try {
          s2.hooks && (n = s2.hooks.preprocess(n));
          let l2 = (s2.hooks ? s2.hooks.provideLexer() : e ? x.lex : x.lexInline)(n, s2);
          s2.hooks && (l2 = s2.hooks.processAllTokens(l2)), s2.walkTokens && this.walkTokens(l2, s2.walkTokens);
          let c2 = (s2.hooks ? s2.hooks.provideParser() : e ? b.parse : b.parseInline)(l2, s2);
          return s2.hooks && (c2 = s2.hooks.postprocess(c2)), c2;
        } catch (o) {
          return a(o);
        }
      };
    }
    onError(e, t) {
      return (n) => {
        if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
          let r = "<p>An error occurred:</p><pre>" + w(n.message + "", true) + "</pre>";
          return t ? Promise.resolve(r) : r;
        }
        if (t) return Promise.reject(n);
        throw n;
      };
    }
  };
  var _ = new B();
  function d2(u3, e) {
    return _.parse(u3, e);
  }
  d2.options = d2.setOptions = function(u3) {
    return _.setOptions(u3), d2.defaults = _.defaults, Z(d2.defaults), d2;
  };
  d2.getDefaults = L;
  d2.defaults = T2;
  d2.use = function(...u3) {
    return _.use(...u3), d2.defaults = _.defaults, Z(d2.defaults), d2;
  };
  d2.walkTokens = function(u3, e) {
    return _.walkTokens(u3, e);
  };
  d2.parseInline = _.parseInline;
  d2.Parser = b;
  d2.parser = b.parse;
  d2.Renderer = P;
  d2.TextRenderer = $;
  d2.Lexer = x;
  d2.lexer = x.lex;
  d2.Tokenizer = y2;
  d2.Hooks = S;
  d2.parse = d2;
  var Dt = d2.options;
  var Ht = d2.setOptions;
  var Zt = d2.use;
  var Gt = d2.walkTokens;
  var Nt = d2.parseInline;
  var Ft = b.parse;
  var jt = x.lex;

  // node_modules/dompurify/dist/purify.es.mjs
  var {
    entries,
    setPrototypeOf,
    isFrozen,
    getPrototypeOf,
    getOwnPropertyDescriptor
  } = Object;
  var {
    freeze,
    seal,
    create
  } = Object;
  var {
    apply,
    construct
  } = typeof Reflect !== "undefined" && Reflect;
  if (!freeze) {
    freeze = function freeze2(x2) {
      return x2;
    };
  }
  if (!seal) {
    seal = function seal2(x2) {
      return x2;
    };
  }
  if (!apply) {
    apply = function apply2(func, thisArg) {
      for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        args[_key - 2] = arguments[_key];
      }
      return func.apply(thisArg, args);
    };
  }
  if (!construct) {
    construct = function construct2(Func) {
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }
      return new Func(...args);
    };
  }
  var arrayForEach = unapply(Array.prototype.forEach);
  var arrayLastIndexOf = unapply(Array.prototype.lastIndexOf);
  var arrayPop = unapply(Array.prototype.pop);
  var arrayPush = unapply(Array.prototype.push);
  var arraySplice = unapply(Array.prototype.splice);
  var stringToLowerCase = unapply(String.prototype.toLowerCase);
  var stringToString = unapply(String.prototype.toString);
  var stringMatch = unapply(String.prototype.match);
  var stringReplace = unapply(String.prototype.replace);
  var stringIndexOf = unapply(String.prototype.indexOf);
  var stringTrim = unapply(String.prototype.trim);
  var objectHasOwnProperty = unapply(Object.prototype.hasOwnProperty);
  var regExpTest = unapply(RegExp.prototype.test);
  var typeErrorCreate = unconstruct(TypeError);
  function unapply(func) {
    return function(thisArg) {
      if (thisArg instanceof RegExp) {
        thisArg.lastIndex = 0;
      }
      for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        args[_key3 - 1] = arguments[_key3];
      }
      return apply(func, thisArg, args);
    };
  }
  function unconstruct(Func) {
    return function() {
      for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }
      return construct(Func, args);
    };
  }
  function addToSet(set2, array) {
    let transformCaseFunc = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : stringToLowerCase;
    if (setPrototypeOf) {
      setPrototypeOf(set2, null);
    }
    let l2 = array.length;
    while (l2--) {
      let element = array[l2];
      if (typeof element === "string") {
        const lcElement = transformCaseFunc(element);
        if (lcElement !== element) {
          if (!isFrozen(array)) {
            array[l2] = lcElement;
          }
          element = lcElement;
        }
      }
      set2[element] = true;
    }
    return set2;
  }
  function cleanArray(array) {
    for (let index = 0; index < array.length; index++) {
      const isPropertyExist = objectHasOwnProperty(array, index);
      if (!isPropertyExist) {
        array[index] = null;
      }
    }
    return array;
  }
  function clone(object) {
    const newObject = create(null);
    for (const [property, value] of entries(object)) {
      const isPropertyExist = objectHasOwnProperty(object, property);
      if (isPropertyExist) {
        if (Array.isArray(value)) {
          newObject[property] = cleanArray(value);
        } else if (value && typeof value === "object" && value.constructor === Object) {
          newObject[property] = clone(value);
        } else {
          newObject[property] = value;
        }
      }
    }
    return newObject;
  }
  function lookupGetter(object, prop) {
    while (object !== null) {
      const desc = getOwnPropertyDescriptor(object, prop);
      if (desc) {
        if (desc.get) {
          return unapply(desc.get);
        }
        if (typeof desc.value === "function") {
          return unapply(desc.value);
        }
      }
      object = getPrototypeOf(object);
    }
    function fallbackValue() {
      return null;
    }
    return fallbackValue;
  }
  var html$1 = freeze(["a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "bdi", "bdo", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "decorator", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "marquee", "menu", "menuitem", "meter", "nav", "nobr", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "search", "section", "select", "shadow", "slot", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]);
  var svg$1 = freeze(["svg", "a", "altglyph", "altglyphdef", "altglyphitem", "animatecolor", "animatemotion", "animatetransform", "circle", "clippath", "defs", "desc", "ellipse", "enterkeyhint", "exportparts", "filter", "font", "g", "glyph", "glyphref", "hkern", "image", "inputmode", "line", "lineargradient", "marker", "mask", "metadata", "mpath", "part", "path", "pattern", "polygon", "polyline", "radialgradient", "rect", "stop", "style", "switch", "symbol", "text", "textpath", "title", "tref", "tspan", "view", "vkern"]);
  var svgFilters = freeze(["feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence"]);
  var svgDisallowed = freeze(["animate", "color-profile", "cursor", "discard", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignobject", "hatch", "hatchpath", "mesh", "meshgradient", "meshpatch", "meshrow", "missing-glyph", "script", "set", "solidcolor", "unknown", "use"]);
  var mathMl$1 = freeze(["math", "menclose", "merror", "mfenced", "mfrac", "mglyph", "mi", "mlabeledtr", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msup", "msubsup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover", "mprescripts"]);
  var mathMlDisallowed = freeze(["maction", "maligngroup", "malignmark", "mlongdiv", "mscarries", "mscarry", "msgroup", "mstack", "msline", "msrow", "semantics", "annotation", "annotation-xml", "mprescripts", "none"]);
  var text = freeze(["#text"]);
  var html = freeze(["accept", "action", "align", "alt", "autocapitalize", "autocomplete", "autopictureinpicture", "autoplay", "background", "bgcolor", "border", "capture", "cellpadding", "cellspacing", "checked", "cite", "class", "clear", "color", "cols", "colspan", "controls", "controlslist", "coords", "crossorigin", "datetime", "decoding", "default", "dir", "disabled", "disablepictureinpicture", "disableremoteplayback", "download", "draggable", "enctype", "enterkeyhint", "exportparts", "face", "for", "headers", "height", "hidden", "high", "href", "hreflang", "id", "inert", "inputmode", "integrity", "ismap", "kind", "label", "lang", "list", "loading", "loop", "low", "max", "maxlength", "media", "method", "min", "minlength", "multiple", "muted", "name", "nonce", "noshade", "novalidate", "nowrap", "open", "optimum", "part", "pattern", "placeholder", "playsinline", "popover", "popovertarget", "popovertargetaction", "poster", "preload", "pubdate", "radiogroup", "readonly", "rel", "required", "rev", "reversed", "role", "rows", "rowspan", "spellcheck", "scope", "selected", "shape", "size", "sizes", "slot", "span", "srclang", "start", "src", "srcset", "step", "style", "summary", "tabindex", "title", "translate", "type", "usemap", "valign", "value", "width", "wrap", "xmlns", "slot"]);
  var svg = freeze(["accent-height", "accumulate", "additive", "alignment-baseline", "amplitude", "ascent", "attributename", "attributetype", "azimuth", "basefrequency", "baseline-shift", "begin", "bias", "by", "class", "clip", "clippathunits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cx", "cy", "d", "dx", "dy", "diffuseconstant", "direction", "display", "divisor", "dur", "edgemode", "elevation", "end", "exponent", "fill", "fill-opacity", "fill-rule", "filter", "filterunits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "fx", "fy", "g1", "g2", "glyph-name", "glyphref", "gradientunits", "gradienttransform", "height", "href", "id", "image-rendering", "in", "in2", "intercept", "k", "k1", "k2", "k3", "k4", "kerning", "keypoints", "keysplines", "keytimes", "lang", "lengthadjust", "letter-spacing", "kernelmatrix", "kernelunitlength", "lighting-color", "local", "marker-end", "marker-mid", "marker-start", "markerheight", "markerunits", "markerwidth", "maskcontentunits", "maskunits", "max", "mask", "mask-type", "media", "method", "mode", "min", "name", "numoctaves", "offset", "operator", "opacity", "order", "orient", "orientation", "origin", "overflow", "paint-order", "path", "pathlength", "patterncontentunits", "patterntransform", "patternunits", "points", "preservealpha", "preserveaspectratio", "primitiveunits", "r", "rx", "ry", "radius", "refx", "refy", "repeatcount", "repeatdur", "restart", "result", "rotate", "scale", "seed", "shape-rendering", "slope", "specularconstant", "specularexponent", "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "stop-color", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke", "stroke-width", "style", "surfacescale", "systemlanguage", "tabindex", "tablevalues", "targetx", "targety", "transform", "transform-origin", "text-anchor", "text-decoration", "text-rendering", "textlength", "type", "u1", "u2", "unicode", "values", "viewbox", "visibility", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "width", "word-spacing", "wrap", "writing-mode", "xchannelselector", "ychannelselector", "x", "x1", "x2", "xmlns", "y", "y1", "y2", "z", "zoomandpan"]);
  var mathMl = freeze(["accent", "accentunder", "align", "bevelled", "close", "columnsalign", "columnlines", "columnspan", "denomalign", "depth", "dir", "display", "displaystyle", "encoding", "fence", "frame", "height", "href", "id", "largeop", "length", "linethickness", "lspace", "lquote", "mathbackground", "mathcolor", "mathsize", "mathvariant", "maxsize", "minsize", "movablelimits", "notation", "numalign", "open", "rowalign", "rowlines", "rowspacing", "rowspan", "rspace", "rquote", "scriptlevel", "scriptminsize", "scriptsizemultiplier", "selection", "separator", "separators", "stretchy", "subscriptshift", "supscriptshift", "symmetric", "voffset", "width", "xmlns"]);
  var xml = freeze(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]);
  var MUSTACHE_EXPR = seal(/\{\{[\w\W]*|[\w\W]*\}\}/gm);
  var ERB_EXPR = seal(/<%[\w\W]*|[\w\W]*%>/gm);
  var TMPLIT_EXPR = seal(/\$\{[\w\W]*/gm);
  var DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]+$/);
  var ARIA_ATTR = seal(/^aria-[\-\w]+$/);
  var IS_ALLOWED_URI = seal(
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    // eslint-disable-line no-useless-escape
  );
  var IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
  var ATTR_WHITESPACE = seal(
    /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g
    // eslint-disable-line no-control-regex
  );
  var DOCTYPE_NAME = seal(/^html$/i);
  var CUSTOM_ELEMENT = seal(/^[a-z][.\w]*(-[.\w]+)+$/i);
  var EXPRESSIONS = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    ARIA_ATTR,
    ATTR_WHITESPACE,
    CUSTOM_ELEMENT,
    DATA_ATTR,
    DOCTYPE_NAME,
    ERB_EXPR,
    IS_ALLOWED_URI,
    IS_SCRIPT_OR_DATA,
    MUSTACHE_EXPR,
    TMPLIT_EXPR
  });
  var NODE_TYPE = {
    element: 1,
    attribute: 2,
    text: 3,
    cdataSection: 4,
    entityReference: 5,
    // Deprecated
    entityNode: 6,
    // Deprecated
    progressingInstruction: 7,
    comment: 8,
    document: 9,
    documentType: 10,
    documentFragment: 11,
    notation: 12
    // Deprecated
  };
  var getGlobal = function getGlobal2() {
    return typeof window === "undefined" ? null : window;
  };
  var _createTrustedTypesPolicy = function _createTrustedTypesPolicy2(trustedTypes, purifyHostElement) {
    if (typeof trustedTypes !== "object" || typeof trustedTypes.createPolicy !== "function") {
      return null;
    }
    let suffix = null;
    const ATTR_NAME = "data-tt-policy-suffix";
    if (purifyHostElement && purifyHostElement.hasAttribute(ATTR_NAME)) {
      suffix = purifyHostElement.getAttribute(ATTR_NAME);
    }
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
  function createDOMPurify() {
    let window2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : getGlobal();
    const DOMPurify = (root) => createDOMPurify(root);
    DOMPurify.version = "3.3.1";
    DOMPurify.removed = [];
    if (!window2 || !window2.document || window2.document.nodeType !== NODE_TYPE.document || !window2.Element) {
      DOMPurify.isSupported = false;
      return DOMPurify;
    }
    let {
      document: document2
    } = window2;
    const originalDocument = document2;
    const currentScript = originalDocument.currentScript;
    const {
      DocumentFragment,
      HTMLTemplateElement,
      Node: Node2,
      Element,
      NodeFilter,
      NamedNodeMap = window2.NamedNodeMap || window2.MozNamedAttrMap,
      HTMLFormElement,
      DOMParser: DOMParser2,
      trustedTypes
    } = window2;
    const ElementPrototype = Element.prototype;
    const cloneNode = lookupGetter(ElementPrototype, "cloneNode");
    const remove = lookupGetter(ElementPrototype, "remove");
    const getNextSibling = lookupGetter(ElementPrototype, "nextSibling");
    const getChildNodes = lookupGetter(ElementPrototype, "childNodes");
    const getParentNode = lookupGetter(ElementPrototype, "parentNode");
    if (typeof HTMLTemplateElement === "function") {
      const template = document2.createElement("template");
      if (template.content && template.content.ownerDocument) {
        document2 = template.content.ownerDocument;
      }
    }
    let trustedTypesPolicy;
    let emptyHTML = "";
    const {
      implementation,
      createNodeIterator,
      createDocumentFragment,
      getElementsByTagName
    } = document2;
    const {
      importNode
    } = originalDocument;
    let hooks = _createHooksMap();
    DOMPurify.isSupported = typeof entries === "function" && typeof getParentNode === "function" && implementation && implementation.createHTMLDocument !== void 0;
    const {
      MUSTACHE_EXPR: MUSTACHE_EXPR2,
      ERB_EXPR: ERB_EXPR2,
      TMPLIT_EXPR: TMPLIT_EXPR2,
      DATA_ATTR: DATA_ATTR2,
      ARIA_ATTR: ARIA_ATTR2,
      IS_SCRIPT_OR_DATA: IS_SCRIPT_OR_DATA2,
      ATTR_WHITESPACE: ATTR_WHITESPACE2,
      CUSTOM_ELEMENT: CUSTOM_ELEMENT2
    } = EXPRESSIONS;
    let {
      IS_ALLOWED_URI: IS_ALLOWED_URI$1
    } = EXPRESSIONS;
    let ALLOWED_TAGS = null;
    const DEFAULT_ALLOWED_TAGS = addToSet({}, [...html$1, ...svg$1, ...svgFilters, ...mathMl$1, ...text]);
    let ALLOWED_ATTR = null;
    const DEFAULT_ALLOWED_ATTR = addToSet({}, [...html, ...svg, ...mathMl, ...xml]);
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
    let FORCE_BODY = false;
    let RETURN_DOM = false;
    let RETURN_DOM_FRAGMENT = false;
    let RETURN_TRUSTED_TYPE = false;
    let SANITIZE_DOM = true;
    let SANITIZE_NAMED_PROPS = false;
    const SANITIZE_NAMED_PROPS_PREFIX = "user-content-";
    let KEEP_CONTENT = true;
    let IN_PLACE = false;
    let USE_PROFILES = {};
    let FORBID_CONTENTS = null;
    const DEFAULT_FORBID_CONTENTS = addToSet({}, ["annotation-xml", "audio", "colgroup", "desc", "foreignobject", "head", "iframe", "math", "mi", "mn", "mo", "ms", "mtext", "noembed", "noframes", "noscript", "plaintext", "script", "style", "svg", "template", "thead", "title", "video", "xmp"]);
    let DATA_URI_TAGS = null;
    const DEFAULT_DATA_URI_TAGS = addToSet({}, ["audio", "video", "img", "source", "image", "track"]);
    let URI_SAFE_ATTRIBUTES = null;
    const DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, ["alt", "class", "for", "id", "label", "name", "pattern", "placeholder", "role", "summary", "title", "value", "style", "xmlns"]);
    const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
    const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
    const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
    let NAMESPACE = HTML_NAMESPACE;
    let IS_EMPTY_INPUT = false;
    let ALLOWED_NAMESPACES = null;
    const DEFAULT_ALLOWED_NAMESPACES = addToSet({}, [MATHML_NAMESPACE, SVG_NAMESPACE, HTML_NAMESPACE], stringToString);
    let MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, ["mi", "mo", "mn", "ms", "mtext"]);
    let HTML_INTEGRATION_POINTS = addToSet({}, ["annotation-xml"]);
    const COMMON_SVG_AND_HTML_ELEMENTS = addToSet({}, ["title", "style", "font", "a", "script"]);
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
      if (CONFIG && CONFIG === cfg) {
        return;
      }
      if (!cfg || typeof cfg !== "object") {
        cfg = {};
      }
      cfg = clone(cfg);
      PARSER_MEDIA_TYPE = // eslint-disable-next-line unicorn/prefer-includes
      SUPPORTED_PARSER_MEDIA_TYPES.indexOf(cfg.PARSER_MEDIA_TYPE) === -1 ? DEFAULT_PARSER_MEDIA_TYPE : cfg.PARSER_MEDIA_TYPE;
      transformCaseFunc = PARSER_MEDIA_TYPE === "application/xhtml+xml" ? stringToString : stringToLowerCase;
      ALLOWED_TAGS = objectHasOwnProperty(cfg, "ALLOWED_TAGS") ? addToSet({}, cfg.ALLOWED_TAGS, transformCaseFunc) : DEFAULT_ALLOWED_TAGS;
      ALLOWED_ATTR = objectHasOwnProperty(cfg, "ALLOWED_ATTR") ? addToSet({}, cfg.ALLOWED_ATTR, transformCaseFunc) : DEFAULT_ALLOWED_ATTR;
      ALLOWED_NAMESPACES = objectHasOwnProperty(cfg, "ALLOWED_NAMESPACES") ? addToSet({}, cfg.ALLOWED_NAMESPACES, stringToString) : DEFAULT_ALLOWED_NAMESPACES;
      URI_SAFE_ATTRIBUTES = objectHasOwnProperty(cfg, "ADD_URI_SAFE_ATTR") ? addToSet(clone(DEFAULT_URI_SAFE_ATTRIBUTES), cfg.ADD_URI_SAFE_ATTR, transformCaseFunc) : DEFAULT_URI_SAFE_ATTRIBUTES;
      DATA_URI_TAGS = objectHasOwnProperty(cfg, "ADD_DATA_URI_TAGS") ? addToSet(clone(DEFAULT_DATA_URI_TAGS), cfg.ADD_DATA_URI_TAGS, transformCaseFunc) : DEFAULT_DATA_URI_TAGS;
      FORBID_CONTENTS = objectHasOwnProperty(cfg, "FORBID_CONTENTS") ? addToSet({}, cfg.FORBID_CONTENTS, transformCaseFunc) : DEFAULT_FORBID_CONTENTS;
      FORBID_TAGS = objectHasOwnProperty(cfg, "FORBID_TAGS") ? addToSet({}, cfg.FORBID_TAGS, transformCaseFunc) : clone({});
      FORBID_ATTR = objectHasOwnProperty(cfg, "FORBID_ATTR") ? addToSet({}, cfg.FORBID_ATTR, transformCaseFunc) : clone({});
      USE_PROFILES = objectHasOwnProperty(cfg, "USE_PROFILES") ? cfg.USE_PROFILES : false;
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
      IS_ALLOWED_URI$1 = cfg.ALLOWED_URI_REGEXP || IS_ALLOWED_URI;
      NAMESPACE = cfg.NAMESPACE || HTML_NAMESPACE;
      MATHML_TEXT_INTEGRATION_POINTS = cfg.MATHML_TEXT_INTEGRATION_POINTS || MATHML_TEXT_INTEGRATION_POINTS;
      HTML_INTEGRATION_POINTS = cfg.HTML_INTEGRATION_POINTS || HTML_INTEGRATION_POINTS;
      CUSTOM_ELEMENT_HANDLING = cfg.CUSTOM_ELEMENT_HANDLING || {};
      if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck)) {
        CUSTOM_ELEMENT_HANDLING.tagNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck;
      }
      if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck)) {
        CUSTOM_ELEMENT_HANDLING.attributeNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck;
      }
      if (cfg.CUSTOM_ELEMENT_HANDLING && typeof cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements === "boolean") {
        CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements = cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements;
      }
      if (SAFE_FOR_TEMPLATES) {
        ALLOW_DATA_ATTR = false;
      }
      if (RETURN_DOM_FRAGMENT) {
        RETURN_DOM = true;
      }
      if (USE_PROFILES) {
        ALLOWED_TAGS = addToSet({}, text);
        ALLOWED_ATTR = [];
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
      if (cfg.ADD_TAGS) {
        if (typeof cfg.ADD_TAGS === "function") {
          EXTRA_ELEMENT_HANDLING.tagCheck = cfg.ADD_TAGS;
        } else {
          if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) {
            ALLOWED_TAGS = clone(ALLOWED_TAGS);
          }
          addToSet(ALLOWED_TAGS, cfg.ADD_TAGS, transformCaseFunc);
        }
      }
      if (cfg.ADD_ATTR) {
        if (typeof cfg.ADD_ATTR === "function") {
          EXTRA_ELEMENT_HANDLING.attributeCheck = cfg.ADD_ATTR;
        } else {
          if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) {
            ALLOWED_ATTR = clone(ALLOWED_ATTR);
          }
          addToSet(ALLOWED_ATTR, cfg.ADD_ATTR, transformCaseFunc);
        }
      }
      if (cfg.ADD_URI_SAFE_ATTR) {
        addToSet(URI_SAFE_ATTRIBUTES, cfg.ADD_URI_SAFE_ATTR, transformCaseFunc);
      }
      if (cfg.FORBID_CONTENTS) {
        if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
          FORBID_CONTENTS = clone(FORBID_CONTENTS);
        }
        addToSet(FORBID_CONTENTS, cfg.FORBID_CONTENTS, transformCaseFunc);
      }
      if (cfg.ADD_FORBID_CONTENTS) {
        if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
          FORBID_CONTENTS = clone(FORBID_CONTENTS);
        }
        addToSet(FORBID_CONTENTS, cfg.ADD_FORBID_CONTENTS, transformCaseFunc);
      }
      if (KEEP_CONTENT) {
        ALLOWED_TAGS["#text"] = true;
      }
      if (WHOLE_DOCUMENT) {
        addToSet(ALLOWED_TAGS, ["html", "head", "body"]);
      }
      if (ALLOWED_TAGS.table) {
        addToSet(ALLOWED_TAGS, ["tbody"]);
        delete FORBID_TAGS.tbody;
      }
      if (cfg.TRUSTED_TYPES_POLICY) {
        if (typeof cfg.TRUSTED_TYPES_POLICY.createHTML !== "function") {
          throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
        }
        if (typeof cfg.TRUSTED_TYPES_POLICY.createScriptURL !== "function") {
          throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
        }
        trustedTypesPolicy = cfg.TRUSTED_TYPES_POLICY;
        emptyHTML = trustedTypesPolicy.createHTML("");
      } else {
        if (trustedTypesPolicy === void 0) {
          trustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, currentScript);
        }
        if (trustedTypesPolicy !== null && typeof emptyHTML === "string") {
          emptyHTML = trustedTypesPolicy.createHTML("");
        }
      }
      if (freeze) {
        freeze(cfg);
      }
      CONFIG = cfg;
    };
    const ALL_SVG_TAGS = addToSet({}, [...svg$1, ...svgFilters, ...svgDisallowed]);
    const ALL_MATHML_TAGS = addToSet({}, [...mathMl$1, ...mathMlDisallowed]);
    const _checkValidNamespace = function _checkValidNamespace2(element) {
      let parent = getParentNode(element);
      if (!parent || !parent.tagName) {
        parent = {
          namespaceURI: NAMESPACE,
          tagName: "template"
        };
      }
      const tagName = stringToLowerCase(element.tagName);
      const parentTagName = stringToLowerCase(parent.tagName);
      if (!ALLOWED_NAMESPACES[element.namespaceURI]) {
        return false;
      }
      if (element.namespaceURI === SVG_NAMESPACE) {
        if (parent.namespaceURI === HTML_NAMESPACE) {
          return tagName === "svg";
        }
        if (parent.namespaceURI === MATHML_NAMESPACE) {
          return tagName === "svg" && (parentTagName === "annotation-xml" || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
        }
        return Boolean(ALL_SVG_TAGS[tagName]);
      }
      if (element.namespaceURI === MATHML_NAMESPACE) {
        if (parent.namespaceURI === HTML_NAMESPACE) {
          return tagName === "math";
        }
        if (parent.namespaceURI === SVG_NAMESPACE) {
          return tagName === "math" && HTML_INTEGRATION_POINTS[parentTagName];
        }
        return Boolean(ALL_MATHML_TAGS[tagName]);
      }
      if (element.namespaceURI === HTML_NAMESPACE) {
        if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) {
          return false;
        }
        if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) {
          return false;
        }
        return !ALL_MATHML_TAGS[tagName] && (COMMON_SVG_AND_HTML_ELEMENTS[tagName] || !ALL_SVG_TAGS[tagName]);
      }
      if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && ALLOWED_NAMESPACES[element.namespaceURI]) {
        return true;
      }
      return false;
    };
    const _forceRemove = function _forceRemove2(node) {
      arrayPush(DOMPurify.removed, {
        element: node
      });
      try {
        getParentNode(node).removeChild(node);
      } catch (_2) {
        remove(node);
      }
    };
    const _removeAttribute = function _removeAttribute2(name, element) {
      try {
        arrayPush(DOMPurify.removed, {
          attribute: element.getAttributeNode(name),
          from: element
        });
      } catch (_2) {
        arrayPush(DOMPurify.removed, {
          attribute: null,
          from: element
        });
      }
      element.removeAttribute(name);
      if (name === "is") {
        if (RETURN_DOM || RETURN_DOM_FRAGMENT) {
          try {
            _forceRemove(element);
          } catch (_2) {
          }
        } else {
          try {
            element.setAttribute(name, "");
          } catch (_2) {
          }
        }
      }
    };
    const _initDocument = function _initDocument2(dirty) {
      let doc = null;
      let leadingWhitespace = null;
      if (FORCE_BODY) {
        dirty = "<remove></remove>" + dirty;
      } else {
        const matches = stringMatch(dirty, /^[\r\n\t ]+/);
        leadingWhitespace = matches && matches[0];
      }
      if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && NAMESPACE === HTML_NAMESPACE) {
        dirty = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + dirty + "</body></html>";
      }
      const dirtyPayload = trustedTypesPolicy ? trustedTypesPolicy.createHTML(dirty) : dirty;
      if (NAMESPACE === HTML_NAMESPACE) {
        try {
          doc = new DOMParser2().parseFromString(dirtyPayload, PARSER_MEDIA_TYPE);
        } catch (_2) {
        }
      }
      if (!doc || !doc.documentElement) {
        doc = implementation.createDocument(NAMESPACE, "template", null);
        try {
          doc.documentElement.innerHTML = IS_EMPTY_INPUT ? emptyHTML : dirtyPayload;
        } catch (_2) {
        }
      }
      const body = doc.body || doc.documentElement;
      if (dirty && leadingWhitespace) {
        body.insertBefore(document2.createTextNode(leadingWhitespace), body.childNodes[0] || null);
      }
      if (NAMESPACE === HTML_NAMESPACE) {
        return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? "html" : "body")[0];
      }
      return WHOLE_DOCUMENT ? doc.documentElement : body;
    };
    const _createNodeIterator = function _createNodeIterator2(root) {
      return createNodeIterator.call(
        root.ownerDocument || root,
        root,
        // eslint-disable-next-line no-bitwise
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_PROCESSING_INSTRUCTION | NodeFilter.SHOW_CDATA_SECTION,
        null
      );
    };
    const _isClobbered = function _isClobbered2(element) {
      return element instanceof HTMLFormElement && (typeof element.nodeName !== "string" || typeof element.textContent !== "string" || typeof element.removeChild !== "function" || !(element.attributes instanceof NamedNodeMap) || typeof element.removeAttribute !== "function" || typeof element.setAttribute !== "function" || typeof element.namespaceURI !== "string" || typeof element.insertBefore !== "function" || typeof element.hasChildNodes !== "function");
    };
    const _isNode = function _isNode2(value) {
      return typeof Node2 === "function" && value instanceof Node2;
    };
    function _executeHooks(hooks2, currentNode, data) {
      arrayForEach(hooks2, (hook) => {
        hook.call(DOMPurify, currentNode, data, CONFIG);
      });
    }
    const _sanitizeElements = function _sanitizeElements2(currentNode) {
      let content = null;
      _executeHooks(hooks.beforeSanitizeElements, currentNode, null);
      if (_isClobbered(currentNode)) {
        _forceRemove(currentNode);
        return true;
      }
      const tagName = transformCaseFunc(currentNode.nodeName);
      _executeHooks(hooks.uponSanitizeElement, currentNode, {
        tagName,
        allowedTags: ALLOWED_TAGS
      });
      if (SAFE_FOR_XML && currentNode.hasChildNodes() && !_isNode(currentNode.firstElementChild) && regExpTest(/<[/\w!]/g, currentNode.innerHTML) && regExpTest(/<[/\w!]/g, currentNode.textContent)) {
        _forceRemove(currentNode);
        return true;
      }
      if (currentNode.nodeType === NODE_TYPE.progressingInstruction) {
        _forceRemove(currentNode);
        return true;
      }
      if (SAFE_FOR_XML && currentNode.nodeType === NODE_TYPE.comment && regExpTest(/<[/\w]/g, currentNode.data)) {
        _forceRemove(currentNode);
        return true;
      }
      if (!(EXTRA_ELEMENT_HANDLING.tagCheck instanceof Function && EXTRA_ELEMENT_HANDLING.tagCheck(tagName)) && (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName])) {
        if (!FORBID_TAGS[tagName] && _isBasicCustomElement(tagName)) {
          if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, tagName)) {
            return false;
          }
          if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(tagName)) {
            return false;
          }
        }
        if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
          const parentNode = getParentNode(currentNode) || currentNode.parentNode;
          const childNodes = getChildNodes(currentNode) || currentNode.childNodes;
          if (childNodes && parentNode) {
            const childCount = childNodes.length;
            for (let i2 = childCount - 1; i2 >= 0; --i2) {
              const childClone = cloneNode(childNodes[i2], true);
              childClone.__removalCount = (currentNode.__removalCount || 0) + 1;
              parentNode.insertBefore(childClone, getNextSibling(currentNode));
            }
          }
        }
        _forceRemove(currentNode);
        return true;
      }
      if (currentNode instanceof Element && !_checkValidNamespace(currentNode)) {
        _forceRemove(currentNode);
        return true;
      }
      if ((tagName === "noscript" || tagName === "noembed" || tagName === "noframes") && regExpTest(/<\/no(script|embed|frames)/i, currentNode.innerHTML)) {
        _forceRemove(currentNode);
        return true;
      }
      if (SAFE_FOR_TEMPLATES && currentNode.nodeType === NODE_TYPE.text) {
        content = currentNode.textContent;
        arrayForEach([MUSTACHE_EXPR2, ERB_EXPR2, TMPLIT_EXPR2], (expr) => {
          content = stringReplace(content, expr, " ");
        });
        if (currentNode.textContent !== content) {
          arrayPush(DOMPurify.removed, {
            element: currentNode.cloneNode()
          });
          currentNode.textContent = content;
        }
      }
      _executeHooks(hooks.afterSanitizeElements, currentNode, null);
      return false;
    };
    const _isValidAttribute = function _isValidAttribute2(lcTag, lcName, value) {
      if (SANITIZE_DOM && (lcName === "id" || lcName === "name") && (value in document2 || value in formElement)) {
        return false;
      }
      if (ALLOW_DATA_ATTR && !FORBID_ATTR[lcName] && regExpTest(DATA_ATTR2, lcName)) ;
      else if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR2, lcName)) ;
      else if (EXTRA_ELEMENT_HANDLING.attributeCheck instanceof Function && EXTRA_ELEMENT_HANDLING.attributeCheck(lcName, lcTag)) ;
      else if (!ALLOWED_ATTR[lcName] || FORBID_ATTR[lcName]) {
        if (
          // First condition does a very basic check if a) it's basically a valid custom element tagname AND
          // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
          // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
          _isBasicCustomElement(lcTag) && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, lcTag) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(lcTag)) && (CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.attributeNameCheck, lcName) || CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.attributeNameCheck(lcName, lcTag)) || // Alternative, second condition checks if it's an `is`-attribute, AND
          // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
          lcName === "is" && CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, value) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(value))
        ) ;
        else {
          return false;
        }
      } else if (URI_SAFE_ATTRIBUTES[lcName]) ;
      else if (regExpTest(IS_ALLOWED_URI$1, stringReplace(value, ATTR_WHITESPACE2, ""))) ;
      else if ((lcName === "src" || lcName === "xlink:href" || lcName === "href") && lcTag !== "script" && stringIndexOf(value, "data:") === 0 && DATA_URI_TAGS[lcTag]) ;
      else if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA2, stringReplace(value, ATTR_WHITESPACE2, ""))) ;
      else if (value) {
        return false;
      } else ;
      return true;
    };
    const _isBasicCustomElement = function _isBasicCustomElement2(tagName) {
      return tagName !== "annotation-xml" && stringMatch(tagName, CUSTOM_ELEMENT2);
    };
    const _sanitizeAttributes = function _sanitizeAttributes2(currentNode) {
      _executeHooks(hooks.beforeSanitizeAttributes, currentNode, null);
      const {
        attributes
      } = currentNode;
      if (!attributes || _isClobbered(currentNode)) {
        return;
      }
      const hookEvent = {
        attrName: "",
        attrValue: "",
        keepAttr: true,
        allowedAttributes: ALLOWED_ATTR,
        forceKeepAttr: void 0
      };
      let l2 = attributes.length;
      while (l2--) {
        const attr = attributes[l2];
        const {
          name,
          namespaceURI,
          value: attrValue
        } = attr;
        const lcName = transformCaseFunc(name);
        const initValue = attrValue;
        let value = name === "value" ? initValue : stringTrim(initValue);
        hookEvent.attrName = lcName;
        hookEvent.attrValue = value;
        hookEvent.keepAttr = true;
        hookEvent.forceKeepAttr = void 0;
        _executeHooks(hooks.uponSanitizeAttribute, currentNode, hookEvent);
        value = hookEvent.attrValue;
        if (SANITIZE_NAMED_PROPS && (lcName === "id" || lcName === "name")) {
          _removeAttribute(name, currentNode);
          value = SANITIZE_NAMED_PROPS_PREFIX + value;
        }
        if (SAFE_FOR_XML && regExpTest(/((--!?|])>)|<\/(style|title|textarea)/i, value)) {
          _removeAttribute(name, currentNode);
          continue;
        }
        if (lcName === "attributename" && stringMatch(value, "href")) {
          _removeAttribute(name, currentNode);
          continue;
        }
        if (hookEvent.forceKeepAttr) {
          continue;
        }
        if (!hookEvent.keepAttr) {
          _removeAttribute(name, currentNode);
          continue;
        }
        if (!ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(/\/>/i, value)) {
          _removeAttribute(name, currentNode);
          continue;
        }
        if (SAFE_FOR_TEMPLATES) {
          arrayForEach([MUSTACHE_EXPR2, ERB_EXPR2, TMPLIT_EXPR2], (expr) => {
            value = stringReplace(value, expr, " ");
          });
        }
        const lcTag = transformCaseFunc(currentNode.nodeName);
        if (!_isValidAttribute(lcTag, lcName, value)) {
          _removeAttribute(name, currentNode);
          continue;
        }
        if (trustedTypesPolicy && typeof trustedTypes === "object" && typeof trustedTypes.getAttributeType === "function") {
          if (namespaceURI) ;
          else {
            switch (trustedTypes.getAttributeType(lcTag, lcName)) {
              case "TrustedHTML": {
                value = trustedTypesPolicy.createHTML(value);
                break;
              }
              case "TrustedScriptURL": {
                value = trustedTypesPolicy.createScriptURL(value);
                break;
              }
            }
          }
        }
        if (value !== initValue) {
          try {
            if (namespaceURI) {
              currentNode.setAttributeNS(namespaceURI, name, value);
            } else {
              currentNode.setAttribute(name, value);
            }
            if (_isClobbered(currentNode)) {
              _forceRemove(currentNode);
            } else {
              arrayPop(DOMPurify.removed);
            }
          } catch (_2) {
            _removeAttribute(name, currentNode);
          }
        }
      }
      _executeHooks(hooks.afterSanitizeAttributes, currentNode, null);
    };
    const _sanitizeShadowDOM = function _sanitizeShadowDOM2(fragment) {
      let shadowNode = null;
      const shadowIterator = _createNodeIterator(fragment);
      _executeHooks(hooks.beforeSanitizeShadowDOM, fragment, null);
      while (shadowNode = shadowIterator.nextNode()) {
        _executeHooks(hooks.uponSanitizeShadowNode, shadowNode, null);
        _sanitizeElements(shadowNode);
        _sanitizeAttributes(shadowNode);
        if (shadowNode.content instanceof DocumentFragment) {
          _sanitizeShadowDOM2(shadowNode.content);
        }
      }
      _executeHooks(hooks.afterSanitizeShadowDOM, fragment, null);
    };
    DOMPurify.sanitize = function(dirty) {
      let cfg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      let body = null;
      let importedNode = null;
      let currentNode = null;
      let returnNode = null;
      IS_EMPTY_INPUT = !dirty;
      if (IS_EMPTY_INPUT) {
        dirty = "<!-->";
      }
      if (typeof dirty !== "string" && !_isNode(dirty)) {
        if (typeof dirty.toString === "function") {
          dirty = dirty.toString();
          if (typeof dirty !== "string") {
            throw typeErrorCreate("dirty is not a string, aborting");
          }
        } else {
          throw typeErrorCreate("toString is not a function");
        }
      }
      if (!DOMPurify.isSupported) {
        return dirty;
      }
      if (!SET_CONFIG) {
        _parseConfig(cfg);
      }
      DOMPurify.removed = [];
      if (typeof dirty === "string") {
        IN_PLACE = false;
      }
      if (IN_PLACE) {
        if (dirty.nodeName) {
          const tagName = transformCaseFunc(dirty.nodeName);
          if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
            throw typeErrorCreate("root node is forbidden and cannot be sanitized in-place");
          }
        }
      } else if (dirty instanceof Node2) {
        body = _initDocument("<!---->");
        importedNode = body.ownerDocument.importNode(dirty, true);
        if (importedNode.nodeType === NODE_TYPE.element && importedNode.nodeName === "BODY") {
          body = importedNode;
        } else if (importedNode.nodeName === "HTML") {
          body = importedNode;
        } else {
          body.appendChild(importedNode);
        }
      } else {
        if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT && // eslint-disable-next-line unicorn/prefer-includes
        dirty.indexOf("<") === -1) {
          return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(dirty) : dirty;
        }
        body = _initDocument(dirty);
        if (!body) {
          return RETURN_DOM ? null : RETURN_TRUSTED_TYPE ? emptyHTML : "";
        }
      }
      if (body && FORCE_BODY) {
        _forceRemove(body.firstChild);
      }
      const nodeIterator = _createNodeIterator(IN_PLACE ? dirty : body);
      while (currentNode = nodeIterator.nextNode()) {
        _sanitizeElements(currentNode);
        _sanitizeAttributes(currentNode);
        if (currentNode.content instanceof DocumentFragment) {
          _sanitizeShadowDOM(currentNode.content);
        }
      }
      if (IN_PLACE) {
        return dirty;
      }
      if (RETURN_DOM) {
        if (RETURN_DOM_FRAGMENT) {
          returnNode = createDocumentFragment.call(body.ownerDocument);
          while (body.firstChild) {
            returnNode.appendChild(body.firstChild);
          }
        } else {
          returnNode = body;
        }
        if (ALLOWED_ATTR.shadowroot || ALLOWED_ATTR.shadowrootmode) {
          returnNode = importNode.call(originalDocument, returnNode, true);
        }
        return returnNode;
      }
      let serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
      if (WHOLE_DOCUMENT && ALLOWED_TAGS["!doctype"] && body.ownerDocument && body.ownerDocument.doctype && body.ownerDocument.doctype.name && regExpTest(DOCTYPE_NAME, body.ownerDocument.doctype.name)) {
        serializedHTML = "<!DOCTYPE " + body.ownerDocument.doctype.name + ">\n" + serializedHTML;
      }
      if (SAFE_FOR_TEMPLATES) {
        arrayForEach([MUSTACHE_EXPR2, ERB_EXPR2, TMPLIT_EXPR2], (expr) => {
          serializedHTML = stringReplace(serializedHTML, expr, " ");
        });
      }
      return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(serializedHTML) : serializedHTML;
    };
    DOMPurify.setConfig = function() {
      let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      _parseConfig(cfg);
      SET_CONFIG = true;
    };
    DOMPurify.clearConfig = function() {
      CONFIG = null;
      SET_CONFIG = false;
    };
    DOMPurify.isValidAttribute = function(tag, attr, value) {
      if (!CONFIG) {
        _parseConfig({});
      }
      const lcTag = transformCaseFunc(tag);
      const lcName = transformCaseFunc(attr);
      return _isValidAttribute(lcTag, lcName, value);
    };
    DOMPurify.addHook = function(entryPoint, hookFunction) {
      if (typeof hookFunction !== "function") {
        return;
      }
      arrayPush(hooks[entryPoint], hookFunction);
    };
    DOMPurify.removeHook = function(entryPoint, hookFunction) {
      if (hookFunction !== void 0) {
        const index = arrayLastIndexOf(hooks[entryPoint], hookFunction);
        return index === -1 ? void 0 : arraySplice(hooks[entryPoint], index, 1)[0];
      }
      return arrayPop(hooks[entryPoint]);
    };
    DOMPurify.removeHooks = function(entryPoint) {
      hooks[entryPoint] = [];
    };
    DOMPurify.removeAllHooks = function() {
      hooks = _createHooksMap();
    };
    return DOMPurify;
  }
  var purify = createDOMPurify();

  // src/utils.ts
  function nothrow(cb) {
    try {
      return { success: true, value: cb() };
    } catch (error) {
      return { success: false, error };
    }
  }
  function revolvers() {
    let _resolve;
    const promise = new Promise((resolve) => _resolve = resolve);
    return { promise, resolve: _resolve };
  }
  function makeResizable(textarea, initialHeight = 52) {
    const update3 = () => textareaReconsider(textarea, initialHeight);
    textarea.addEventListener("input", update3);
    update3();
  }
  function textareaReconsider(textarea, initialHeight = 52) {
    const bodyScroll = document.body.scrollTop;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(initialHeight, textarea.scrollHeight + 7)}px`;
    document.body.scrollTop = bodyScroll;
  }
  function getRoute() {
    return window.location.hash.slice(1).split(".");
  }
  function renderMD(content) {
    return purify.sanitize(d2.parse(content, { async: false }));
  }
  async function renderMDAsync(content) {
    return purify.sanitize(await d2.parse(content));
  }
  var PLACHEOLDER = "assets/gfx/placeholder.png";
  function placeholder(url) {
    return url || PLACHEOLDER;
  }
  function setSelectOptions(target, options, pickFirst = false) {
    const optionsList = options.map(([id, caption]) => d({
      tagName: "option",
      attributes: {
        value: id
      },
      contents: caption
    }));
    target.innerHTML = "";
    target.append(...optionsList);
    if (pickFirst && options.length > 0)
      target.value = options[0][0];
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
    const blob = new Blob([payload], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    d({
      tagName: "a",
      attributes: {
        href: url,
        download: filename
      }
    }).click();
    URL.revokeObjectURL(url);
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
    storageListeners.forEach((l2) => l2(data));
  };
  var { promise: dbInitPromise, resolve: dbInitComplete } = revolvers();
  function listen(listener) {
    storageListeners.push(listener);
  }
  async function init() {
    const result = await open();
    if (result.success) dbInitComplete(result.value);
    else console.error(result.error);
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
        const update3 = { storage: "idb", store };
        bc.postMessage(update3);
        storageListeners.forEach((l2) => l2(update3));
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
        const update3 = { storage: "idb", store };
        bc.postMessage(update3);
        storageListeners.forEach((l2) => l2(update3));
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
    const update3 = { storage: "local", key };
    bc.postMessage(update3);
    storageListeners.forEach((l2) => l2(update3));
  }
  async function upload(blob) {
    const id = crypto.randomUUID();
    await set("media", {
      id,
      media: blob,
      mime: blob.type
    });
    return id;
  }
  var map = /* @__PURE__ */ new Map();
  async function getBlobLink(imageRef) {
    if (map.has(imageRef)) {
      return map.get(imageRef);
    }
    const blob = await get("media", imageRef);
    if (!blob.success || !blob.value) return null;
    const link = URL.createObjectURL(blob.value.media);
    map.set(imageRef, link);
    return link;
  }

  // src/components/imagepicker.ts
  var _RampikeImagePicker = class extends HTMLElement {
    get value() {
      return this.file ?? this.getAttribute("value") ?? "";
    }
    set value(v2) {
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
    get file() {
      return this.input.files?.[0];
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
      this.image = placeholder(this.getAttribute("placeholder"));
      this.input.value = "";
      this.setAttribute("value", "");
    }
    paste(file) {
      const container = new DataTransfer();
      container.items.add(file);
      this.input.files = container.files;
      this.setFile(file);
    }
    async valueHandle() {
      return typeof this.value === "string" ? this.value || null : await upload(this.value);
    }
    onDirty = null;
    revokeBlob = null;
    setFile(file) {
      const link = URL.createObjectURL(file);
      this.image = link;
      this.revokeBlob = () => {
        URL.revokeObjectURL(link);
        this.revokeBlob = null;
      };
      this.setAttribute("value", "");
    }
    clearButton;
    constructor() {
      super();
      const image = d({
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
      const input = d({
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
            if (!file?.type.startsWith("image/")) return;
            this.setFile(file);
          }
        }
      });
      this.clearButton = d({
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
      const contents = [
        d({
          tagName: "label",
          style: {
            display: "contents"
          },
          contents: [input, image]
        }),
        this.clearButton
      ];
      this.style.position = "relative";
      this.append(...contents);
    }
  };
  function define8(tagName) {
    window.customElements.define(tagName, _RampikeImagePicker);
  }

  // src/units/navigation.ts
  var navigationUnit = {
    init: () => {
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
  };

  // src/units/settings/engines.ts
  var enginesUnit = {
    init: () => {
      const inputs = {
        name: document.querySelector("#settings-engines-name"),
        url: document.querySelector("#settings-engines-url"),
        key: document.querySelector("#settings-engines-key"),
        model: document.querySelector("#settings-engines-model"),
        temp: document.querySelector("#settings-engines-temp"),
        max: document.querySelector("#settings-engines-max"),
        params: document.querySelector("#settings-engines-additional")
      };
      const defaults = {
        temp: 0.9,
        max: 720
      };
      const submitButton = document.querySelector("#settings-engines-submit");
      const list = document.querySelector("#settings-engines-list");
      let editing = null;
      submitButton.addEventListener("click", submit);
      listen((update3) => {
        if (update3.storage !== "local") return;
        if (update3.key !== "engines") return;
        updateList();
      });
      updateList();
      function submit() {
        const id = editing ?? crypto.randomUUID();
        function parseNumber(key) {
          const f = parseFloat(inputs[key].value);
          if (isNaN(f) || f < 0) return defaults[key];
          return f;
        }
        function parseParams(raw) {
          const result = nothrow(() => JSON.parse(raw));
          const value = result.success ? result.value : {};
          if (typeof value !== "object") return {};
          return value;
        }
        const e = {
          name: inputs.name.value,
          url: inputs.url.value,
          key: inputs.key.value,
          model: inputs.model.value,
          temp: parseNumber("temp"),
          max: parseNumber("max"),
          params: parseParams(inputs.params.value)
        };
        const missing = ["name", "url", "model"].some((k2) => !e[k2]);
        if (missing) return;
        const eMap = readEngines();
        eMap[id] = e;
        saveEngines(eMap);
        editing = null;
        inputs.name.value = "";
        inputs.url.value = "";
        inputs.key.value = "";
        inputs.model.value = "";
        inputs.temp.value = String(defaults.temp);
        inputs.max.value = String(defaults.max);
        inputs.params.value = "";
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
        inputs.name.scrollIntoView({ behavior: "smooth" });
      }
      function updateList() {
        list.innerHTML = "";
        const enginesMap = readEngines();
        const engines = Object.entries(enginesMap);
        const items = engines.map(
          ([id, e]) => d({
            className: "lineout row settings-engine-item",
            contents: [
              d({
                contents: e.name
              }),
              d({
                className: "row-compact",
                contents: [
                  d({
                    tagName: "button",
                    className: "lineout",
                    events: {
                      click: (ev) => {
                        ev.stopPropagation();
                        copyEngine(id);
                      }
                    },
                    contents: "copy"
                  }),
                  d({
                    tagName: "button",
                    className: "lineout",
                    events: {
                      click: (ev) => {
                        ev.stopPropagation();
                        deleteEngine(id);
                      }
                    },
                    contents: "delete"
                  })
                ]
              })
            ],
            events: {
              click: () => edit(id, e)
            }
          })
        );
        if (items.length > 0)
          list.append(...items);
        else
          list.append(d({
            className: "placeholder",
            contents: "No engines found"
          }));
      }
    }
  };
  function readEngines() {
    const enginesRaw = local.get("engines");
    if (!enginesRaw) return {};
    const engines = nothrow(() => JSON.parse(enginesRaw));
    if (!engines.success) return {};
    const activeEngines = readActiveEngines();
    for (const e in engines.value) {
      engines.value[e].isActive = e === activeEngines.main;
    }
    return engines.value;
  }
  function saveEngines(eMap) {
    local.set("engines", JSON.stringify(eMap));
  }
  function deleteEngine(id) {
    if (!confirm("confirm deletion")) return;
    const e = readEngines();
    delete e[id];
    saveEngines(e);
  }
  function copyEngine(id) {
    const e = readEngines();
    if (!e[id]) return;
    const nid = crypto.randomUUID();
    e[nid] = {
      ...e[id],
      name: e[id].name + " (copy)"
    };
    saveEngines(e);
  }
  function readActiveEngines() {
    const defaultEngines = {
      main: null,
      rember: null
    };
    const activeRaw = local.get("activeEngine");
    if (!activeRaw) return defaultEngines;
    const parsed = nothrow(() => JSON.parse(activeRaw));
    if (!parsed.success) return defaultEngines;
    return parsed.value;
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
  var personaUnit = {
    init: () => {
      const filePicker = document.querySelector("#settings-persona-picture");
      const nameInput = document.querySelector("#settings-persona-name");
      const descInput = document.querySelector("#settings-persona-desc");
      const pronInput = document.querySelector("#settings-persona-pronouns");
      const personaList = document.querySelector("#settings-persona-list");
      const submitButton = document.querySelector("#settings-add-persona");
      const form = document.querySelector("#settings-persona-form");
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
        nameInput.scrollIntoView({ behavior: "smooth" });
      }
      async function updatePersonaList() {
        const personas = await idb.getAll("personas");
        if (!personas.success) return;
        personaList.innerHTML = "";
        const items = personas.value.reverse().map((p) => d({
          className: "lineout row settings-persona-item",
          attributes: {
            "data-id": p.id
          },
          contents: [
            d({
              tagName: "img",
              className: "shadow",
              attributes: {
                src: placeholder(null)
              }
            }),
            d({
              className: "list settings-persona-item-main",
              contents: [
                d({
                  className: "row-compact",
                  contents: [
                    d({
                      tagName: "h6",
                      contents: p.name
                    }),
                    d({
                      tagName: "button",
                      className: "lineout",
                      events: {
                        click: () => startEditing(p)
                      },
                      contents: "edit"
                    }),
                    d({
                      tagName: "button",
                      className: "lineout",
                      events: {
                        click: () => removePersona(p.id)
                      },
                      contents: "delete"
                    })
                  ]
                }),
                d({
                  contents: p.description
                })
              ]
            })
          ]
        }));
        personas.value.forEach(async ({ picture }, ix) => {
          if (!picture) return;
          const src = await getBlobLink(picture);
          if (src)
            items[ix].querySelector("img").src = src;
        });
        if (items.length > 0)
          personaList.append(...items);
        else
          personaList.append(d({
            className: "placeholder",
            contents: "No personas found"
          }));
      }
      listen(async (update3) => {
        if (update3.storage !== "idb") return;
        if (update3.store !== "personas") return;
        updatePersonaList();
      });
      updatePersonaList();
    }
  };

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
    const template = document.querySelector("#template-theme-selector");
    const button = c(template);
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
    saveButton.addEventListener("click", backup);
    const importPicker = document.querySelector("#settings-backup-import");
    importPicker.addEventListener("input", () => restore(importPicker));
  }
  async function backup() {
    const [chatContents, chats, personas, scenarios, media] = await Promise.all([
      idb.getAll("chatContents"),
      idb.getAll("chats"),
      idb.getAll("personas"),
      idb.getAll("scenarios"),
      idb.getAll("media")
    ]);
    const localData = {
      engines: local.get("engines"),
      activeEngine: local.get("activeEngine"),
      settings: local.get("settings"),
      theme: local.get("theme")
    };
    const validOnly = (() => {
      const results = Object.entries({ chatContents, chats, personas, scenarios });
      return Object.fromEntries(
        results.filter(([k2, v2]) => v2.success).map(([k2, v2]) => [k2, v2.value])
      );
    })();
    if (media.success) {
      validOnly.media = media.value;
      for (const m2 of validOnly.media) {
        m2.media = await b64Encoder.encode(m2.media);
      }
    }
    const payload = JSON.stringify({
      idb: validOnly,
      local: localData
    });
    const blob = new Blob([payload], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    d({
      tagName: "a",
      attributes: {
        href: url,
        download: `backup-${(/* @__PURE__ */ new Date()).toLocaleString()}.json`
      }
    }).click();
    URL.revokeObjectURL(url);
  }
  async function restore(picker) {
    const file = picker.input.files?.[0];
    if (!file) return;
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
        await idb.set(store, item);
      }
    }
    for (const [key, data] of Object.entries(parsed.local)) {
      if (data) local.set(key, data);
    }
  }

  // src/units/settings/misc.ts
  function initMisc() {
    const tailInput = document.querySelector("#settings-options-tail");
    const miscSave = document.querySelector("#settings-misc-save");
    const rember = {
      stride: document.querySelector("#settings-rember-stride"),
      prompt: document.querySelector("#settings-rember-prompt"),
      template: document.querySelector("#settings-rember-template"),
      save: document.querySelector("#settings-rember-save")
    };
    listen((u3) => {
      if (u3.storage !== "local") return;
      if (u3.key !== "settings") return;
      updateSettings();
    });
    updateSettings();
    miscSave.addEventListener("click", () => {
      const settings = loadMiscSettings();
      const tail = parseInt(tailInput.value, 10);
      settings.tail = isNaN(tail) ? 0 : tail;
      local.set("settings", JSON.stringify(settings));
    });
    rember.save.addEventListener("click", () => {
      const settings = loadMiscSettings();
      const stride = parseInt(rember.stride.value, 10);
      settings.remberStride = isNaN(stride) ? 0 : stride;
      settings.remberPrompt = rember.prompt.value.trim();
      settings.remberTemplate = rember.template.value.trim();
      local.set("settings", JSON.stringify(settings));
    });
    function updateSettings() {
      const settings = loadMiscSettings();
      tailInput.value = String(settings.tail);
      rember.stride.value = String(settings.remberStride);
      rember.prompt.value = settings.remberPrompt, rember.template.value = settings.remberTemplate;
    }
  }
  var DEFAULT_SETTINGS = {
    tail: 70,
    remberStride: 0,
    remberPrompt: "",
    remberTemplate: "",
    remberEngine: null
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
  var settingsUnit = {
    init: () => {
      initTheme();
      personaUnit.init(void 0);
      enginesUnit.init(void 0);
      initBackup();
      initMisc();
    }
  };

  // src/run.ts
  var abortController;
  async function runEngine(chat, engine, onChunk) {
    const chonks = [];
    try {
      abortController = new AbortController();
      const response = await fetch(engine.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${engine.key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: engine.model,
          messages: chat.map((m2) => ({
            role: m2.from === "model" ? "assistant" : m2.from,
            content: m2.swipes[m2.selectedSwipe]
          })),
          stream: true,
          reasoning: {
            effort: "none"
          },
          max_completion_tokens: engine.max,
          temperature: engine.temp,
          ...engine.params
        }),
        signal: abortController.signal
      });
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
          const line = buffer.slice(0, lineEnd).trim();
          buffer = buffer.slice(lineEnd + 1);
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            const parsed = nothrow(() => JSON.parse(data));
            if (!parsed.success) continue;
            const content = parsed.value.choices[0].delta.content;
            if (content) {
              chonks.push(content);
              onChunk(content);
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    return { success: true, value: chonks.join("") };
  }

  // src/units/chat/utils.ts
  async function setSwipe(chatId, messageId, swipeIx, value) {
    const contents = await idb.get("chatContents", chatId);
    if (!contents.success) return;
    const tix = contents.value.messages.findIndex((m2) => m2.id === messageId);
    if (tix < 0) return;
    contents.value.messages[tix].swipes[swipeIx] = value;
    await idb.set("chatContents", contents.value);
  }
  async function pushSwipe(chatId, messageId, value) {
    const [contents, chat] = await Promise.all([
      idb.get("chatContents", chatId),
      idb.get("chats", chatId)
    ]);
    if (!contents.success || !chat.success) return null;
    const messages = contents.value.messages;
    const mix = messages.findIndex((m2) => m2.id === messageId);
    if (mix < 0) return;
    messages[mix].swipes = messages[mix].swipes.filter((m2) => m2.trim());
    messages[mix].swipes.push(value);
    messages[mix].selectedSwipe = messages[mix].swipes.length - 1;
    chat.value.lastUpdate = Date.now();
    await Promise.all([
      idb.set("chatContents", contents.value),
      idb.set("chats", chat.value)
    ]);
    return messages[mix];
  }
  async function addMessage(chatId, value, fromUser, name) {
    const [contents, chat] = await Promise.all([
      idb.get("chatContents", chatId),
      idb.get("chats", chatId)
    ]);
    if (!contents.success || !chat.success) return null;
    const messages = contents.value.messages;
    const newMessage = {
      from: fromUser ? "user" : "model",
      id: messages.length,
      name,
      rember: null,
      selectedSwipe: 0,
      swipes: [value]
    };
    messages.push(newMessage);
    chat.value.lastUpdate = Date.now();
    chat.value.messageCount = messages.length;
    await Promise.all([
      idb.set("chatContents", contents.value),
      idb.set("chats", chat.value)
    ]);
    return newMessage;
  }
  async function deleteMessage(chatId, messageId) {
    const [contents, chat] = await Promise.all([
      idb.get("chatContents", chatId),
      idb.get("chats", chatId)
    ]);
    if (!contents.success || !chat.success) return;
    const messages = contents.value.messages;
    const mix = messages.findIndex((m2) => m2.id === messageId);
    if (mix < 0) return;
    contents.value.messages.splice(mix);
    chat.value.lastUpdate = Date.now();
    chat.value.messageCount = messages.length;
    await Promise.all([
      idb.set("chatContents", contents.value),
      idb.set("chats", chat.value)
    ]);
    const messageViews = document.querySelectorAll(".message[data-mid]");
    messageViews.forEach((m2) => {
      const mid = parseInt(m2.dataset.mid, 10);
      if (mid >= messageId) m2.remove();
      if (mid === messageId - 1) m2.rampike.params.setIsLast(true);
    });
  }
  async function reroll(chatId, messageId, name) {
    const payload = await prepareRerollPayload(chatId, messageId);
    if (!payload) return;
    loadResponse(payload, messageId, chatId, name);
  }
  async function preparePayload(contents, systemPrompt, userMessage) {
    const settings = loadMiscSettings();
    const sliced = settings.tail === 0 ? contents : contents.slice(-settings.tail);
    const system = { from: "system", id: -1, name: "", rember: null, swipes: [systemPrompt], selectedSwipe: 0 };
    const payload = [
      system,
      ...sliced
    ];
    if (!userMessage) return payload;
    const user = { from: "user", id: -1, name: "", rember: null, swipes: [userMessage], selectedSwipe: 0 };
    payload.push(user);
    return payload;
  }
  async function prepareRerollPayload(chatId, messageId) {
    const [contents, chat] = await Promise.all([
      idb.get("chatContents", chatId),
      idb.get("chats", chatId)
    ]);
    if (!contents.success || !chat.success) return null;
    const messages = contents.value.messages;
    const mix = messages.findIndex((m2) => m2.id === messageId);
    if (mix < 0) return null;
    const history = messages.slice(0, mix);
    const settings = loadMiscSettings();
    const sliced = settings.tail === 0 ? history : history.slice(-settings.tail);
    const system = { from: "system", id: -1, name: "", rember: null, swipes: [chat.value.scenario.definition], selectedSwipe: 0 };
    const payload = [
      system,
      ...sliced
    ];
    return payload;
  }
  async function loadResponse(payload, msgId, chatId, name) {
    const engineOptions = Object.entries(readEngines());
    if (engineOptions.length <= 0) {
      console.error("no engines!");
      return;
    }
    const [, engine] = engineOptions.find(([, e]) => e.isActive) ?? engineOptions[0];
    const inputModes = document.querySelector("#chat-controls");
    inputModes.tab = "pending";
    const messageView = getMessageViewByID(msgId);
    if (!messageView) {
      window.location.reload();
      return;
    }
    const responseMessageControls = messageView.rampike.params;
    const responseStreamingUpdater = responseMessageControls.startStreaming();
    const streamingResult = await runEngine(payload, engine, responseStreamingUpdater);
    if (streamingResult.success) {
      const updatedMessage = await pushSwipe(chatId, msgId, streamingResult.value);
      if (!updatedMessage) {
        console.error("failed to save response message");
        return;
      }
      responseMessageControls.updateMessage(updatedMessage);
    }
    responseMessageControls.endStreaming();
    inputModes.tab = "main";
  }
  async function loadPictures(chat) {
    return await Promise.all([
      chat.userPersona.picture && getBlobLink(chat.userPersona.picture),
      chat.scenario.picture && getBlobLink(chat.scenario.picture)
    ]);
  }
  function getMessageViewByID(messageId) {
    const list = document.querySelector("#play-messages");
    return list.querySelector(`.message[data-mid="${messageId}"]`);
  }

  // src/units/chat/message-view.ts
  function makeMessageView(msg, [userPic, modelPic], isLast, onEdit, onReroll, onDelete) {
    function controlButton(caption, hint, cb) {
      return d({
        tagName: "button",
        className: "strip ghost pointer",
        contents: caption,
        attributes: { title: hint },
        events: { click: cb }
      });
    }
    const text2 = msg.swipes[msg.selectedSwipe];
    const textBox = d({
      tagName: "div",
      className: "message-text",
      contents: text2
    });
    const swipesCaption = d({
      tagName: "span",
      contents: ""
    });
    const swipesControl = d({
      tagName: "div",
      className: "row-compact",
      contents: [
        controlButton(
          "<",
          "prev swipe",
          () => changeSwipe(-1)
        ),
        swipesCaption,
        controlButton(
          ">",
          "next swipe",
          () => changeSwipe(1)
        )
      ],
      style: {
        display: "none"
      }
    });
    async function changeSwipe(delta) {
      msg.selectedSwipe += delta;
      if (msg.selectedSwipe < 0) msg.selectedSwipe = msg.swipes.length - 1;
      if (msg.selectedSwipe >= msg.swipes.length) msg.selectedSwipe = 0;
      textBox.innerHTML = renderMD(msg.swipes[msg.selectedSwipe]);
      swipesCaption.textContent = `${msg.selectedSwipe + 1} / ${msg.swipes.length}`;
      swipesControl.style.display = isLast && msg.swipes.length > 1 ? "flex" : "none";
    }
    async function setSwipeToLast() {
      msg.selectedSwipe = msg.swipes.length - 1;
      textBox.innerHTML = renderMD(msg.swipes[msg.selectedSwipe]);
      swipesCaption.textContent = `${msg.selectedSwipe + 1} / ${msg.swipes.length}`;
      swipesControl.style.display = msg.swipes.length > 1 ? "flex" : "none";
    }
    function tab(contents) {
      return d({
        tagName: "div",
        className: "virtual",
        contents
      });
    }
    const editButton = controlButton(
      "\u270E",
      "edit message",
      () => {
        textBox.setAttribute("contenteditable", "true");
        textBox.textContent = msg.swipes[msg.selectedSwipe];
        textBox.focus();
        changeControlsState("editing");
      }
    );
    const rerollButton = controlButton(
      "\u21BA",
      "reroll this message",
      onReroll
    );
    const deleteButton = controlButton(
      "\u2716",
      "delete message along with following",
      () => {
        if (!confirm("all the following messages will be deleted too")) return;
        onDelete();
      }
    );
    const copyButton = controlButton(
      "\u29C9",
      "copy message",
      () => navigator.clipboard.writeText(msg.swipes[msg.selectedSwipe])
    );
    function updateRerollButtonStatus() {
      if (msg.from === "model" && isLast)
        rerollButton.style.removeProperty("display");
      else
        rerollButton.style.display = "none";
    }
    const mainControls = [
      swipesControl,
      editButton,
      copyButton,
      rerollButton
    ];
    if (msg.from === "user") mainControls.push(deleteButton);
    if (msg.from === "model" && isLast) {
      mainControls.push();
    }
    const controls = [
      tab(mainControls),
      tab([
        controlButton(
          "\u2714",
          "save",
          async () => {
            const newContents = textBox.innerText;
            msg.swipes[msg.selectedSwipe] = newContents;
            textBox.removeAttribute("contenteditable");
            changeControlsState("main");
            onEdit(msg.selectedSwipe, newContents);
            textBox.innerHTML = await renderMDAsync(newContents);
          }
        ),
        controlButton(
          "\u2718",
          "cancel",
          async () => {
            textBox.removeAttribute("contenteditable");
            changeControlsState("main");
            textBox.innerHTML = await renderMDAsync(msg.swipes[msg.selectedSwipe]);
          }
        )
      ]),
      tab([])
    ];
    function changeControlsState(state) {
      const tix = {
        main: 0,
        editing: 1,
        streaming: 2
      }[state];
      controls.forEach((tab2, i2) => tab2.style.display = i2 === tix ? "contents" : "none");
    }
    const element = d({
      tagName: "div",
      className: "message",
      attributes: {
        "data-mid": String(msg.id)
      },
      contents: [
        d({
          tagName: "img",
          attributes: {
            src: placeholder(msg.from === "user" ? userPic : modelPic)
          }
        }),
        d({
          contents: [
            d({
              className: "row",
              contents: [
                d({
                  className: "message-name",
                  contents: msg.name
                }),
                ...controls
              ]
            }),
            textBox
          ]
        })
      ]
    });
    changeSwipe(0);
    changeControlsState("main");
    updateRerollButtonStatus();
    function updateMessage(value) {
      msg = value;
    }
    function scrollIntoView() {
      if (elementVisible(element))
        element.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    function startStreaming() {
      textBox.removeAttribute("contenteditable");
      textBox.innerHTML = "";
      changeControlsState("streaming");
      return (value) => {
        textBox.innerText += value;
        if (elementVisible(element)) scrollIntoView();
      };
    }
    async function endStreaming() {
      await setSwipeToLast();
      changeControlsState("main");
      scrollIntoView();
    }
    function setIsLast(value) {
      isLast = value;
      changeSwipe(0);
      updateRerollButtonStatus();
    }
    const viewControls = {
      updateSwipe: changeSwipe,
      changeControlsState,
      updateMessage,
      startStreaming,
      endStreaming,
      setIsLast
    };
    const wrapped = y(
      element,
      viewControls,
      () => {
      },
      { skipInitialRender: true }
    );
    return wrapped;
  }

  // src/units/chat/load.ts
  async function loadMessages(chatId) {
    const list = document.querySelector("#play-messages");
    list.innerHTML = "";
    const [contents, meta] = await Promise.all([
      idb.get("chatContents", chatId),
      idb.get("chats", chatId)
    ]);
    if (!contents.success || !meta.success) return;
    const [userPic, modelPic] = await loadPictures(meta.value);
    const messages = contents.value.messages;
    const items = messages.map((item, ix) => {
      return makeMessageView(
        item,
        // meta.value,
        [userPic, modelPic],
        ix === messages.length - 1,
        (swipeIx, value) => {
          setSwipe(chatId, item.id, swipeIx, value);
        },
        () => reroll(chatId, item.id, meta.value.scenario.name),
        () => deleteMessage(chatId, item.id)
      );
    });
    list.append(...items);
    list.scrollTop = list.scrollHeight;
  }

  // src/units/chat/send.ts
  async function sendMessage() {
    const list = document.querySelector("#play-messages");
    const textarea = document.querySelector("#chat-textarea");
    const message = textarea.value?.trim();
    if (!message) return;
    const [, chatId] = getRoute();
    if (!chatId) return;
    const [messages, meta] = await Promise.all([
      idb.get("chatContents", chatId),
      idb.get("chats", chatId)
    ]);
    if (!messages.success || !meta.success) return;
    const payload = await preparePayload(messages.value.messages, meta.value.scenario.definition, message);
    const lastMessageId = messages.value.messages.findLast(() => true)?.id;
    getMessageViewByID(lastMessageId)?.rampike.params.setIsLast(false);
    const newUserMessage = await addMessage(meta.value.id, message, true, meta.value.userPersona.name);
    if (!newUserMessage) {
      console.error("failed to save user message");
      return;
    }
    const userMessage = makeMessageView(
      newUserMessage,
      await loadPictures(meta.value),
      false,
      // on edit
      (swipeIx, value) => {
        setSwipe(chatId, newUserMessage.id, swipeIx, value);
      },
      // on reroll
      () => {
        throw Error("haha nope");
      },
      () => deleteMessage(chatId, newUserMessage.id)
    );
    const newModelMessage = await addMessage(meta.value.id, "", false, meta.value.scenario.name);
    if (!newModelMessage) {
      console.error("failed to save user message");
      return;
    }
    const responseMessage = makeMessageView(
      newModelMessage,
      await loadPictures(meta.value),
      true,
      // on edit
      (swipeIx, value) => {
        setSwipe(chatId, newModelMessage.id, swipeIx, value);
      },
      // reroll
      () => reroll(chatId, newModelMessage.id, meta.value.scenario.name),
      () => {
        throw Error("haha nope");
      }
    );
    list.append(userMessage, responseMessage);
    loadResponse(payload, newModelMessage.id, meta.value.id, meta.value.scenario.name);
    textarea.value = "";
    textareaReconsider(textarea);
    list.scrollTop = list.scrollHeight;
  }

  // src/units/chat.ts
  var chatUnit = {
    init: () => {
      const textarea = document.querySelector("#chat-textarea");
      const sendButton = document.querySelector("#chat-send-button");
      const stopButton = document.querySelector("#chat-stop-button");
      const enginePicker = document.querySelector("#chat-engine-picker");
      makeResizable(textarea);
      window.addEventListener("hashchange", update);
      listen((u3) => {
        if (u3.storage !== "local") return;
        if (u3.key !== "engines" && u3.key !== "activeEngine") return;
        updateEngines();
      });
      sendButton.addEventListener("click", sendMessage);
      stopButton.addEventListener("click", () => abortController.abort());
      enginePicker.addEventListener("input", () => {
        pickMainEngine(enginePicker.value);
      });
      update();
      updateEngines();
    }
  };
  async function update() {
    const route = getRoute();
    if (route[0] !== "play") return;
    if (!route[1]) return;
    await loadMessages(route[1]);
  }
  function updateEngines() {
    const inputModes = document.querySelector("#chat-controls");
    const enginePicker = document.querySelector("#chat-engine-picker");
    const engineControl = document.querySelector(".chat-engine-control");
    const engineMap = readEngines();
    const engineOptions = Object.entries(engineMap);
    const activeId = engineOptions.find(([, e]) => e.isActive)?.[0];
    setSelectOptions(enginePicker, engineOptions.map(([id, e]) => [id, e.name]), !activeId);
    if (engineOptions.length > 0) {
      if (activeId) {
        enginePicker.value = activeId;
      } else {
        const actives = {
          main: engineOptions[0][0],
          rember: null
        };
        local.set("activeEngine", JSON.stringify(actives));
      }
      inputModes.tab = "main";
      engineControl.hidden = false;
    } else {
      inputModes.tab = "disabled";
      engineControl.hidden = true;
    }
  }
  function pickMainEngine(id) {
    const old = readActiveEngines();
    old.main = id;
    local.set("activeEngine", JSON.stringify(old));
  }

  // src/units/main.ts
  var mainUnit = {
    init: () => {
      listen((update3) => {
        if (update3.storage !== "idb") return;
        if (update3.store !== "chats") return;
        updateChatHandles();
      });
      updateChatHandles();
    }
  };
  async function updateChatHandles() {
    const list = document.querySelector("#main-chats");
    const handles = await idb.getAll("chats");
    if (!handles.success) return;
    list.innerHTML = "";
    const items = handles.value.reverse().map((handle) => {
      const icon = d({
        tagName: "img",
        attributes: {
          src: placeholder(null)
        }
      });
      if (handle.scenario.picture)
        getBlobLink(handle.scenario.picture).then((src) => src && (icon.src = src));
      return d({
        className: "lineout row main-chats-item",
        contents: [
          icon,
          d({
            className: "list wide",
            contents: [
              d({
                tagName: "h2",
                contents: handle.scenario.name
              }),
              d({
                className: "hint",
                contents: messagesCaption(handle.messageCount)
              })
            ]
          }),
          d({
            className: "list",
            contents: [
              d({
                tagName: "button",
                className: "lineout",
                contents: "play",
                events: {
                  click: () => window.location.hash = `play.${handle.id}`
                }
              }),
              d({
                tagName: "button",
                className: "lineout",
                contents: "delete",
                events: {
                  click: () => deleteChat(handle.id, handle.scenario.name, handle.messageCount)
                }
              })
            ]
          })
        ]
      });
    });
    if (items.length === 0) list.append(d({ className: "placeholder", contents: "No chats found" }));
    list.append(...items);
  }
  function messagesCaption(count) {
    return count % 10 === 1 ? `${count} message` : `${count} messages`;
  }
  function deleteChat(id, name, messageCount) {
    const confirmed = confirm(`Chat with ${name} (${messagesCaption(messageCount)}) will be deleted`);
    if (!confirmed) return;
    idb.del("chatContents", id);
    idb.del("chats", id);
  }

  // src/units/scenario.ts
  var definitionTemplate = [
    "# Characters",
    "## {{char}} ",
    "{{char}} is Odin-class coastal defense ship",
    "{{char}} is 79 meters-long, she weighs 3600 tons and is armed with three 24cm SK L/35 guns and eight 8.8cm guns which. she enjoys shooting the latter ones.",
    "## {{user}}",
    "{{persona}}. {{user}} is the user.",
    "",
    "# Scenario",
    "{{char}} is {{user}}'s roommate, they're on a trip in Gotland, Sweden"
  ].join("\n");
  var scenarioUnit = {
    init: () => {
      const chatIcon = document.querySelector("#scenario-chat-picture");
      const cardIcon = document.querySelector("#scenario-card-picture");
      const cardTitle = document.querySelector("#scenario-card-title");
      const cardDescription = document.querySelector("#scenario-description");
      const cardTags = document.querySelector("#scenario-tags");
      const preview = document.querySelector("#scenario-preview");
      const characterName = document.querySelector("#scenario-character-name");
      const defintion = document.querySelector("#scenario-defintion");
      const previewButton = document.querySelector("#scenario-preview-button");
      const submitButton = document.querySelector("#scenario-submit-button");
      const firstMessage = document.querySelector("#scenario-messages");
      makeResizable(cardDescription);
      makeResizable(defintion);
      const messagesControl = initFirstMessages();
      window.addEventListener("hashchange", load);
      load();
      async function load() {
        const path = getRoute();
        if (path[0] !== "scenario-editor") return;
        if (path[1]) {
          const scenario = await idb.get("scenarios", path[1]);
          if (!scenario.success) return;
          cardIcon.value = scenario.value.card.picture ?? "";
          cardTitle.value = scenario.value.card.title;
          cardDescription.value = scenario.value.card.description;
          cardTags.value = scenario.value.card.tags.join(", ");
          chatIcon.value = scenario.value.chat.picture ?? "";
          characterName.value = scenario.value.chat.name;
          defintion.value = scenario.value.chat.definition;
          messagesControl.set(scenario.value.chat.initials);
        } else {
          cardIcon.usePlaceholder();
          cardTitle.value = "";
          cardDescription.value = "";
          cardTags.value = "";
          chatIcon.usePlaceholder();
          characterName.value = "";
          defintion.value = definitionTemplate;
          messagesControl.set([""]);
        }
        textareaReconsider(cardDescription);
        textareaReconsider(defintion);
        textareaReconsider(cardTags);
        textareaReconsider(firstMessage);
      }
      submitButton.addEventListener("click", async () => {
        const firstMessages = messagesControl.get();
        const required = [
          cardTitle.value,
          defintion.value
        ];
        if (required.some((v2) => !v2) || firstMessages.length <= 0) return;
        const cardPicture = await cardIcon.valueHandle();
        const chatPicture = await chatIcon.valueHandle();
        const tags = cardTags.value.split(",").map((t) => t.trim()).filter((t) => t);
        const id = getRoute()[1] ?? crypto.randomUUID();
        const payload = {
          id,
          lastUpdate: Date.now(),
          card: {
            picture: cardPicture,
            title: cardTitle.value,
            description: cardDescription.value,
            tags
          },
          chat: {
            picture: chatPicture,
            name: characterName.value,
            definition: defintion.value,
            initials: firstMessages
          }
        };
        await idb.set("scenarios", payload);
        window.location.hash = "library";
      });
      previewButton.addEventListener("click", () => {
        const content = cardDescription.value;
        preview.innerHTML = renderMD(content);
        preview.hidden = false;
      });
    }
  };
  function initFirstMessages() {
    const messagesControls = document.querySelector("#scenario-messages-clicker");
    const messagesControlsButtons = messagesControls.querySelectorAll("button");
    const messagesControlsCaption = messagesControls.querySelector("div");
    const messages = document.querySelector("#scenario-messages");
    const messagesState = [""];
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
    }
    messages.addEventListener("input", () => {
      messagesState[messageIndex] = messages.value;
    });
    messagesControlsButtons[0].addEventListener("click", () => clickMessagesPager(-1));
    messagesControlsButtons[1].addEventListener("click", () => clickMessagesPager(1));
    updateMessagesPager();
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

  // src/units/chat/start.ts
  var PRON_MACROS = {
    "{{sub}}": "subjective",
    "{{obj}}": "objective",
    "{{poss}}": "possessiveAdj",
    "{{poss_p}}": "possessivePro",
    "{{ref}}": "reflexive"
  };
  var CHAR_NAME_MACRO = "{{char}}";
  var USER_NAME_MACRO = "{{user}}";
  var PERSONA_MACRO = "{{persona}}";
  async function start(personaId, scenarioId) {
    const [persona, scenario] = await Promise.all([
      idb.get("personas", personaId),
      idb.get("scenarios", scenarioId)
    ]);
    if (!persona.success || !scenario.success) return;
    const preparedScenario = prepareScenario(scenario.value, persona.value);
    const chatId = crypto.randomUUID();
    await Promise.all([
      idb.set("chats", {
        id: chatId,
        lastUpdate: Date.now(),
        messageCount: 1,
        scenario: preparedScenario,
        userPersona: persona.value
      }),
      idb.set("chatContents", {
        id: chatId,
        messages: [{
          id: 0,
          from: "model",
          name: scenario.value.chat.name,
          rember: null,
          selectedSwipe: 0,
          swipes: preparedScenario.initials
        }]
      })
    ]);
    window.location.hash = `play.${chatId}`;
  }
  function macros(template, pronouns, charName, userName, persona) {
    for (const [from, toKey] of Object.entries(PRON_MACROS)) {
      template = template.replaceAll(from, pronouns[toKey]);
    }
    template = template.replaceAll(CHAR_NAME_MACRO, charName);
    template = template.replaceAll(USER_NAME_MACRO, userName);
    template = template.replaceAll(PERSONA_MACRO, persona);
    return template;
  }
  function prepareScenario(origin, persona) {
    const runMacros = (template) => macros(
      template,
      persona.pronouns,
      origin.chat.name,
      persona.name,
      persona.description
    );
    return {
      id: origin.id,
      picture: origin.chat.picture || origin.card.picture,
      name: origin.chat.name || origin.card.title,
      definition: runMacros(origin.chat.definition),
      initials: origin.chat.initials.map(runMacros)
    };
  }

  // src/units/library.ts
  var openerRelay = null;
  var libraryUnit = {
    init: () => {
      const startButton = document.querySelector("#library-start-button");
      const startPersonaPicker = document.querySelector("#library-start-persona");
      const importButton = document.querySelector("#library-import");
      const modal = document.querySelector("#library-start");
      startButton.addEventListener("click", async () => {
        if (!openerRelay) return;
        const personaId = startPersonaPicker.value;
        if (!personaId) return;
        await start(personaId, openerRelay.scenarioId);
        modal.close();
      });
      importButton.addEventListener("input", () => {
        const file = importButton.input.files?.[0];
        if (!file) return;
        importScenario(file);
      });
      listen(async (u3) => {
        if (u3.storage !== "idb") return;
        if (u3.store !== "scenarios") return;
        update2();
      });
      update2();
    }
  };
  async function update2() {
    const list = document.querySelector("#library-cards");
    list.innerHTML = "";
    const items = await idb.getAll("scenarios");
    if (!items.success) return;
    const contents = items.value.reverse().map((item) => {
      let icon = d({
        tagName: "img",
        attributes: {
          src: placeholder(null)
        }
      });
      if (item.card.picture) {
        getBlobLink(item.card.picture).then((src) => {
          if (src) icon.src = src;
        });
      }
      const description = d({
        className: "scenario-card-description"
      });
      description.innerHTML = renderMD(item.card.description);
      return d({
        className: "scenario-card lineout",
        contents: [
          icon,
          d({
            className: "list",
            contents: [
              d({
                className: "row-compact",
                contents: [
                  d({
                    tagName: "h6",
                    contents: item.card.title
                  }),
                  d({
                    tagName: "button",
                    className: "strip ghost pointer",
                    events: {
                      click: () => downloadScenario(item)
                    },
                    contents: "\u2913"
                  }),
                  d({
                    tagName: "button",
                    className: "strip ghost pointer",
                    events: {
                      click: () => deleteScenario(item.id, item.card.title)
                    },
                    contents: "\u2716"
                  }),
                  d({
                    tagName: "button",
                    className: "strip ghost pointer",
                    events: {
                      click: () => {
                        document.location.hash = `scenario-editor.${item.id}`;
                      }
                    },
                    contents: "\u270E"
                  }),
                  d({
                    tagName: "button",
                    className: "lineout",
                    events: {
                      click: () => openStartModal(item.id, item.card.description)
                    },
                    contents: "play"
                  })
                ]
              }),
              d({
                tagName: "hr"
              }),
              description,
              d({
                className: "scenario-card-tags",
                contents: item.card.tags.map(
                  (tag) => d({
                    tagName: "span",
                    className: "pointer",
                    contents: tag
                  })
                ).toReversed()
              })
            ]
          })
        ]
      });
    });
    list.append(...contents);
    if (contents.length === 0)
      list.append(d({ className: "placeholder", contents: "No scenario cards found" }));
  }
  async function downloadScenario(card) {
    const payload = { ...card };
    async function encoded(value) {
      if (!value) return null;
      const icon = await idb.get("media", value);
      if (icon.success)
        return await b64Encoder.encode(icon.value.media);
      else
        return null;
    }
    payload.card.picture = await encoded(card.card.picture);
    payload.chat.picture = await encoded(card.chat.picture);
    const filename = payload.chat.name || payload.card.title || "scenario";
    download(JSON.stringify(payload), `${filename}.json`);
  }
  async function importScenario(file) {
    const raw = await file.text();
    const parsed = JSON.parse(raw);
    parsed.id = crypto.randomUUID();
    async function decode(b64) {
      if (!b64) return null;
      const file2 = await b64Encoder.decode(b64);
      const media = await upload(file2);
      return media;
    }
    parsed.card.picture = await decode(parsed.card.picture);
    parsed.chat.picture = await decode(parsed.chat.picture);
    idb.set("scenarios", parsed);
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
      true
    );
    openerRelay = {
      scenarioId: scenario
    };
    description.innerHTML = renderMD(descriptionMD);
    modal.open();
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
    scenarioUnit
  ];
  async function main() {
    units.forEach((u3) => u3.init?.(void 0));
    const dbAvailable = init();
    if (!dbAvailable) alert("indexeddb init failed");
  }
})();
/*! Bundled license information:

dompurify/dist/purify.es.mjs:
  (*! @license DOMPurify 3.3.1 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.3.1/LICENSE *)
*/
//# sourceMappingURL=index.js.map
