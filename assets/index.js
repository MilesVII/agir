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
  function T(e = {}) {
    let { tagName: n, elementOptions: o } = e, t = document.createElement(n ?? "div", o);
    return l(t, e);
  }
  function l(e, { attributes: n, className: o, style: t, events: i, contents: r } = {}) {
    if (o && (e.className = o), typeof r == "string" ? e.textContent = r : Array.isArray(r) && e.append(...r), t && "style" in e) for (let a of m(t)) a.includes("-") ? e.style.setProperty(a, t[a] ?? null) : e.style[a] = t[a] ?? "";
    if (n) for (let a of Object.keys(n)) e.setAttribute(a, n[a]);
    if (i) for (let a of m(i)) e.addEventListener(a, (s) => i[a](s, e));
    return e;
  }
  function m(e) {
    return Object.keys(e);
  }
  function f(e) {
    return p(e)[0] ?? null;
  }
  function p(e) {
    let n = e.content.cloneNode(true), o = [];
    return n.childNodes.forEach((t) => {
      t.nodeType === Node.ELEMENT_NODE && o.push(t);
    }), o;
  }
  function M(e, n, o) {
    let t = e, i = o ?? "rampike";
    return t[i] = n, t;
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
      const form = T({
        tagName: "form",
        attributes: {
          method: "dialog"
        },
        events: {
          submit: (e) => e.preventDefault()
        }
      });
      this.dialog = T({
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
        const current = page === this.page;
        const ellipsis = page === -1;
        const contents = ellipsis ? "\u2026" : `${page + 1}`;
        const events = ellipsis || current ? {} : {
          "click": () => this.pick(page)
        };
        const attributes = current ? { "data-current": "" } : {};
        const className = ellipsis ? this.getAttribute("class-ellipsi") : this.getAttribute("class-buttons");
        return T({
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
          const parsed = candidates.find((c) => c.tagName.toLowerCase() === "svg");
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
      const input = T({
        tagName: "input",
        attributes: {
          type: "file",
          accept: this.getAttribute("accept") ?? ""
        },
        style: {
          display: "none"
        }
      });
      const contents = T({
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
      const contents = T({
        tagName: "fieldset",
        contents: [
          T({
            tagName: "legend",
            attributes: {
              for: attributes.id
            },
            contents: legend
          }),
          T({
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
    let t = typeof u3 == "string" ? u3 : u3.source, n = { replace: (r, i) => {
      let s = typeof i == "string" ? i : i.source;
      return s = s.replace(m2.caret, "$1"), t = t.replace(r, s), n;
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
  var m2 = { codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm, outputLinkReplace: /\\([\[\]])/g, indentCodeCompensation: /^(\s+)(?:```)/, beginningSpace: /^\s+/, endingHash: /#$/, startingSpaceChar: /^ /, endingSpaceChar: / $/, nonSpaceChar: /[^ ]/, newLineCharGlobal: /\n/g, tabCharGlobal: /\t/g, multipleSpaceGlobal: /\s+/g, blankLine: /^[ \t]*$/, doubleBlankLine: /\n[ \t]*\n[ \t]*$/, blockquoteStart: /^ {0,3}>/, blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g, blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm, listReplaceTabs: /^\t+/, listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g, listIsTask: /^\[[ xX]\] +\S/, listReplaceTask: /^\[[ xX]\] +/, listTaskCheckbox: /\[[ xX]\]/, anyLine: /\n.*\n/, hrefBrackets: /^<(.*)>$/, tableDelimiter: /[:|]/, tableAlignChars: /^\||\| *$/g, tableRowBlankLine: /\n[ \t]*$/, tableAlignRight: /^ *-+: *$/, tableAlignCenter: /^ *:-+: *$/, tableAlignLeft: /^ *:-+ *$/, startATag: /^<a /i, endATag: /^<\/a>/i, startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i, endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i, startAngleBracket: /^</, endAngleBracket: />$/, pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/, unicodeAlphaNumeric: /[\p{L}\p{N}]/u, escapeTest: /[&<>"']/, escapeReplace: /[&<>"']/g, escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g, unescapeTest: /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig, caret: /(^|[^\[])\^/g, percentDecode: /%25/g, findPipe: /\|/g, splitPipe: / \|/, slashPipe: /\\\|/g, carriageReturn: /\r\n|\r/g, spaceLine: /^ +$/gm, notSpaceStart: /^\S*/, endingNewline: /\n$/, listItemRegex: (u3) => new RegExp(`^( {0,3}${u3})((?:[	 ][^\\n]*)?(?:\\n|$))`), nextBulletRegex: (u3) => new RegExp(`^ {0,${Math.min(3, u3 - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), hrRegex: (u3) => new RegExp(`^ {0,${Math.min(3, u3 - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), fencesBeginRegex: (u3) => new RegExp(`^ {0,${Math.min(3, u3 - 1)}}(?:\`\`\`|~~~)`), headingBeginRegex: (u3) => new RegExp(`^ {0,${Math.min(3, u3 - 1)}}#`), htmlBeginRegex: (u3) => new RegExp(`^ {0,${Math.min(3, u3 - 1)}}<(?:[a-z].*>|!--)`, "i") };
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
  var M2 = { normal: W, gfm: G, breaks: We, pedantic: Ke };
  var Xe = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  var ke = (u3) => Xe[u3];
  function w(u3, e) {
    if (e) {
      if (m2.escapeTest.test(u3)) return u3.replace(m2.escapeReplace, ke);
    } else if (m2.escapeTestNoEncode.test(u3)) return u3.replace(m2.escapeReplaceNoEncode, ke);
    return u3;
  }
  function X(u3) {
    try {
      u3 = encodeURI(u3).replace(m2.percentDecode, "%");
    } catch {
      return null;
    }
    return u3;
  }
  function J(u3, e) {
    let t = u3.replace(m2.findPipe, (i, s, a) => {
      let o = false, l2 = s;
      for (; --l2 >= 0 && a[l2] === "\\"; ) o = !o;
      return o ? "|" : " |";
    }), n = t.split(m2.splitPipe), r = 0;
    if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), e) if (n.length > e) n.splice(e);
    else for (; n.length < e; ) n.push("");
    for (; r < n.length; r++) n[r] = n[r].trim().replace(m2.slashPipe, "|");
    return n;
  }
  function z(u3, e, t) {
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
  function ge(u3, e, t, n, r) {
    let i = e.href, s = e.title || null, a = u3[1].replace(r.other.outputLinkReplace, "$1");
    n.state.inLink = true;
    let o = { type: u3[0].charAt(0) === "!" ? "image" : "link", raw: t, href: i, title: s, text: a, tokens: n.inlineTokens(a) };
    return n.state.inLink = false, o;
  }
  function Je(u3, e, t) {
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
  var y = class {
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
`), r = "", i = "", s = [];
        for (; n.length > 0; ) {
          let a = false, o = [], l2;
          for (l2 = 0; l2 < n.length; l2++) if (this.rules.other.blockquoteStart.test(n[l2])) o.push(n[l2]), a = true;
          else if (!a) o.push(n[l2]);
          else break;
          n = n.slice(l2);
          let p2 = o.join(`
`), c = p2.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
          r = r ? `${r}
${p2}` : p2, i = i ? `${i}
${c}` : c;
          let g = this.lexer.state.top;
          if (this.lexer.state.top = true, this.lexer.blockTokens(c, s, true), this.lexer.state.top = g, n.length === 0) break;
          let h = s.at(-1);
          if (h?.type === "code") break;
          if (h?.type === "blockquote") {
            let R = h, f2 = R.raw + `
` + n.join(`
`), O = this.blockquote(f2);
            s[s.length - 1] = O, r = r.substring(0, r.length - R.raw.length) + O.raw, i = i.substring(0, i.length - R.text.length) + O.text;
            break;
          } else if (h?.type === "list") {
            let R = h, f2 = R.raw + `
` + n.join(`
`), O = this.list(f2);
            s[s.length - 1] = O, r = r.substring(0, r.length - h.raw.length) + O.raw, i = i.substring(0, i.length - R.raw.length) + O.raw, n = f2.substring(s.at(-1).raw.length).split(`
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
          let l2 = false, p2 = "", c = "";
          if (!(t = s.exec(e)) || this.rules.block.hr.test(e)) break;
          p2 = t[0], e = e.substring(p2.length);
          let g = t[2].split(`
`, 1)[0].replace(this.rules.other.listReplaceTabs, (O) => " ".repeat(3 * O.length)), h = e.split(`
`, 1)[0], R = !g.trim(), f2 = 0;
          if (this.options.pedantic ? (f2 = 2, c = g.trimStart()) : R ? f2 = t[1].length + 1 : (f2 = t[2].search(this.rules.other.nonSpaceChar), f2 = f2 > 4 ? 1 : f2, c = g.slice(f2), f2 += t[1].length), R && this.rules.other.blankLine.test(h) && (p2 += h + `
`, e = e.substring(h.length + 1), l2 = true), !l2) {
            let O = this.rules.other.nextBulletRegex(f2), V = this.rules.other.hrRegex(f2), Y = this.rules.other.fencesBeginRegex(f2), ee = this.rules.other.headingBeginRegex(f2), fe = this.rules.other.htmlBeginRegex(f2);
            for (; e; ) {
              let H = e.split(`
`, 1)[0], A;
              if (h = H, this.options.pedantic ? (h = h.replace(this.rules.other.listReplaceNesting, "  "), A = h) : A = h.replace(this.rules.other.tabCharGlobal, "    "), Y.test(h) || ee.test(h) || fe.test(h) || O.test(h) || V.test(h)) break;
              if (A.search(this.rules.other.nonSpaceChar) >= f2 || !h.trim()) c += `
` + A.slice(f2);
              else {
                if (R || g.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || Y.test(g) || ee.test(g) || V.test(g)) break;
                c += `
` + h;
              }
              !R && !h.trim() && (R = true), p2 += H + `
`, e = e.substring(H.length + 1), g = A.slice(f2);
            }
          }
          i.loose || (a ? i.loose = true : this.rules.other.doubleBlankLine.test(p2) && (a = true)), i.items.push({ type: "list_item", raw: p2, task: !!this.options.gfm && this.rules.other.listIsTask.test(c), loose: false, text: c, tokens: [] }), i.raw += p2;
        }
        let o = i.items.at(-1);
        if (o) o.raw = o.raw.trimEnd(), o.text = o.text.trimEnd();
        else return;
        i.raw = i.raw.trimEnd();
        for (let l2 of i.items) {
          if (this.lexer.state.top = false, l2.tokens = this.lexer.blockTokens(l2.text, []), l2.task) {
            if (l2.text = l2.text.replace(this.rules.other.listReplaceTask, ""), l2.tokens[0]?.type === "text" || l2.tokens[0]?.type === "paragraph") {
              l2.tokens[0].raw = l2.tokens[0].raw.replace(this.rules.other.listReplaceTask, ""), l2.tokens[0].text = l2.tokens[0].text.replace(this.rules.other.listReplaceTask, "");
              for (let c = this.lexer.inlineQueue.length - 1; c >= 0; c--) if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[c].src)) {
                this.lexer.inlineQueue[c].src = this.lexer.inlineQueue[c].src.replace(this.rules.other.listReplaceTask, "");
                break;
              }
            }
            let p2 = this.rules.other.listTaskCheckbox.exec(l2.raw);
            if (p2) {
              let c = { type: "checkbox", raw: p2[0] + " ", checked: p2[0] !== "[ ]" };
              l2.checked = c.checked, i.loose ? l2.tokens[0] && ["paragraph", "text"].includes(l2.tokens[0].type) && "tokens" in l2.tokens[0] && l2.tokens[0].tokens ? (l2.tokens[0].raw = c.raw + l2.tokens[0].raw, l2.tokens[0].text = c.raw + l2.tokens[0].text, l2.tokens[0].tokens.unshift(c)) : l2.tokens.unshift({ type: "paragraph", raw: c.raw, text: c.raw, tokens: [c] }) : l2.tokens.unshift(c);
            }
          }
          if (!i.loose) {
            let p2 = l2.tokens.filter((g) => g.type === "space"), c = p2.length > 0 && p2.some((g) => this.rules.other.anyLine.test(g.raw));
            i.loose = c;
          }
        }
        if (i.loose) for (let l2 of i.items) {
          l2.loose = true;
          for (let p2 of l2.tokens) p2.type === "text" && (p2.type = "paragraph");
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
      let n = J(t[1]), r = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), i = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], s = { type: "table", raw: t[0], header: [], align: [], rows: [] };
      if (n.length === r.length) {
        for (let a of r) this.rules.other.tableAlignRight.test(a) ? s.align.push("right") : this.rules.other.tableAlignCenter.test(a) ? s.align.push("center") : this.rules.other.tableAlignLeft.test(a) ? s.align.push("left") : s.align.push(null);
        for (let a = 0; a < n.length; a++) s.header.push({ text: n[a], tokens: this.lexer.inline(n[a]), header: true, align: s.align[a] });
        for (let a of i) s.rows.push(J(a, s.header.length).map((o, l2) => ({ text: o, tokens: this.lexer.inline(o), header: false, align: s.align[l2] })));
        return s;
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
          let s = z(n.slice(0, -1), "\\");
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
        return r = r.trim(), this.rules.other.startAngleBracket.test(r) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(n) ? r = r.slice(1) : r = r.slice(1, -1)), ge(t, { href: r && r.replace(this.rules.inline.anyPunctuation, "$1"), title: i && i.replace(this.rules.inline.anyPunctuation, "$1") }, t[0], this.lexer, this.rules);
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
        return ge(n, i, n[0], this.lexer, this.rules);
      }
    }
    emStrong(e, t, n = "") {
      let r = this.rules.inline.emStrongLDelim.exec(e);
      if (!r || r[3] && n.match(this.rules.other.unicodeAlphaNumeric)) return;
      if (!(r[1] || r[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
        let s = [...r[0]].length - 1, a, o, l2 = s, p2 = 0, c = r[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
        for (c.lastIndex = 0, t = t.slice(-1 * e.length + s); (r = c.exec(t)) != null; ) {
          if (a = r[1] || r[2] || r[3] || r[4] || r[5] || r[6], !a) continue;
          if (o = [...a].length, r[3] || r[4]) {
            l2 += o;
            continue;
          } else if ((r[5] || r[6]) && s % 3 && !((s + o) % 3)) {
            p2 += o;
            continue;
          }
          if (l2 -= o, l2 > 0) continue;
          o = Math.min(o, o + l2 + p2);
          let g = [...r[0]][0].length, h = e.slice(0, s + r.index + g + o);
          if (Math.min(s, o) % 2) {
            let f2 = h.slice(1, -1);
            return { type: "em", raw: h, text: f2, tokens: this.lexer.inlineTokens(f2) };
          }
          let R = h.slice(2, -2);
          return { type: "strong", raw: h, text: R, tokens: this.lexer.inlineTokens(R) };
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
      this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || T2, this.options.tokenizer = this.options.tokenizer || new y(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = { inLink: false, inRawBlock: false, top: true };
      let t = { other: m2, block: E.normal, inline: M2.normal };
      this.options.pedantic ? (t.block = E.pedantic, t.inline = M2.pedantic) : this.options.gfm && (t.block = E.gfm, this.options.breaks ? t.inline = M2.breaks : t.inline = M2.gfm), this.tokenizer.rules = t;
    }
    static get rules() {
      return { block: E, inline: M2 };
    }
    static lex(e, t) {
      return new u(t).lex(e);
    }
    static lexInline(e, t) {
      return new u(t).inlineTokens(e);
    }
    lex(e) {
      e = e.replace(m2.carriageReturn, `
`), this.blockTokens(e, this.tokens);
      for (let t = 0; t < this.inlineQueue.length; t++) {
        let n = this.inlineQueue[t];
        this.inlineTokens(n.src, n.tokens);
      }
      return this.inlineQueue = [], this.tokens;
    }
    blockTokens(e, t = [], n = false) {
      for (this.options.pedantic && (e = e.replace(m2.tabCharGlobal, "    ").replace(m2.spaceLine, "")); e; ) {
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
          this.options.extensions.startBlock.forEach((l2) => {
            o = l2.call({ lexer: this }, a), typeof o == "number" && o >= 0 && (s = Math.min(s, o));
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
      let n = e, r = null;
      if (this.tokens.links) {
        let o = Object.keys(this.tokens.links);
        if (o.length > 0) for (; (r = this.tokenizer.rules.inline.reflinkSearch.exec(n)) != null; ) o.includes(r[0].slice(r[0].lastIndexOf("[") + 1, -1)) && (n = n.slice(0, r.index) + "[" + "a".repeat(r[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
      }
      for (; (r = this.tokenizer.rules.inline.anyPunctuation.exec(n)) != null; ) n = n.slice(0, r.index) + "++" + n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
      let i;
      for (; (r = this.tokenizer.rules.inline.blockSkip.exec(n)) != null; ) i = r[2] ? r[2].length : 0, n = n.slice(0, r.index + i) + "[" + "a".repeat(r[0].length - i - 2) + "]" + n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
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
          let p2 = 1 / 0, c = e.slice(1), g;
          this.options.extensions.startInline.forEach((h) => {
            g = h.call({ lexer: this }, c), typeof g == "number" && g >= 0 && (p2 = Math.min(p2, g));
          }), p2 < 1 / 0 && p2 >= 0 && (l2 = e.substring(0, p2 + 1));
        }
        if (o = this.tokenizer.inlineText(l2)) {
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
      let r = (t || "").match(m2.notSpaceStart)?.[0], i = e.replace(m2.endingNewline, "") + `
`;
      return r ? '<pre><code class="language-' + w(r) + '">' + (n ? i : w(i, true)) + `</code></pre>
` : "<pre><code>" + (n ? i : w(i, true)) + `</code></pre>
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
      return `<code>${w(e, true)}</code>`;
    }
    br(e) {
      return "<br>";
    }
    del({ tokens: e }) {
      return `<del>${this.parser.parseInline(e)}</del>`;
    }
    link({ href: e, title: t, tokens: n }) {
      let r = this.parser.parseInline(n), i = X(e);
      if (i === null) return r;
      e = i;
      let s = '<a href="' + e + '"';
      return t && (s += ' title="' + w(t) + '"'), s += ">" + r + "</a>", s;
    }
    image({ href: e, title: t, text: n, tokens: r }) {
      r && (n = this.parser.parseInline(r, this.parser.textRenderer));
      let i = X(e);
      if (i === null) return w(n);
      e = i;
      let s = `<img src="${e}" alt="${n}"`;
      return t && (s += ` title="${w(t)}"`), s += ">", s;
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
    Tokenizer = y;
    Hooks = S;
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
          let i = this.defaults.renderer || new P(this.defaults);
          for (let s in n.renderer) {
            if (!(s in i)) throw new Error(`renderer '${s}' does not exist`);
            if (["options", "parser"].includes(s)) continue;
            let a = s, o = n.renderer[a], l2 = i[a];
            i[a] = (...p2) => {
              let c = o.apply(i, p2);
              return c === false && (c = l2.apply(i, p2)), c || "";
            };
          }
          r.renderer = i;
        }
        if (n.tokenizer) {
          let i = this.defaults.tokenizer || new y(this.defaults);
          for (let s in n.tokenizer) {
            if (!(s in i)) throw new Error(`tokenizer '${s}' does not exist`);
            if (["options", "rules", "lexer"].includes(s)) continue;
            let a = s, o = n.tokenizer[a], l2 = i[a];
            i[a] = (...p2) => {
              let c = o.apply(i, p2);
              return c === false && (c = l2.apply(i, p2)), c;
            };
          }
          r.tokenizer = i;
        }
        if (n.hooks) {
          let i = this.defaults.hooks || new S();
          for (let s in n.hooks) {
            if (!(s in i)) throw new Error(`hook '${s}' does not exist`);
            if (["options", "block"].includes(s)) continue;
            let a = s, o = n.hooks[a], l2 = i[a];
            S.passThroughHooks.has(s) ? i[a] = (p2) => {
              if (this.defaults.async && S.passThroughHooksRespectAsync.has(s)) return (async () => {
                let g = await o.call(i, p2);
                return l2.call(i, g);
              })();
              let c = o.call(i, p2);
              return l2.call(i, c);
            } : i[a] = (...p2) => {
              if (this.defaults.async) return (async () => {
                let g = await o.apply(i, p2);
                return g === false && (g = await l2.apply(i, p2)), g;
              })();
              let c = o.apply(i, p2);
              return c === false && (c = l2.apply(i, p2)), c;
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
          let o = s.hooks ? await s.hooks.preprocess(n) : n, p2 = await (s.hooks ? await s.hooks.provideLexer() : e ? x.lex : x.lexInline)(o, s), c = s.hooks ? await s.hooks.processAllTokens(p2) : p2;
          s.walkTokens && await Promise.all(this.walkTokens(c, s.walkTokens));
          let h = await (s.hooks ? await s.hooks.provideParser() : e ? b.parse : b.parseInline)(c, s);
          return s.hooks ? await s.hooks.postprocess(h) : h;
        })().catch(a);
        try {
          s.hooks && (n = s.hooks.preprocess(n));
          let l2 = (s.hooks ? s.hooks.provideLexer() : e ? x.lex : x.lexInline)(n, s);
          s.hooks && (l2 = s.hooks.processAllTokens(l2)), s.walkTokens && this.walkTokens(l2, s.walkTokens);
          let c = (s.hooks ? s.hooks.provideParser() : e ? b.parse : b.parseInline)(l2, s);
          return s.hooks && (c = s.hooks.postprocess(c)), c;
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
  function d(u3, e) {
    return _.parse(u3, e);
  }
  d.options = d.setOptions = function(u3) {
    return _.setOptions(u3), d.defaults = _.defaults, Z(d.defaults), d;
  };
  d.getDefaults = L;
  d.defaults = T2;
  d.use = function(...u3) {
    return _.use(...u3), d.defaults = _.defaults, Z(d.defaults), d;
  };
  d.walkTokens = function(u3, e) {
    return _.walkTokens(u3, e);
  };
  d.parseInline = _.parseInline;
  d.Parser = b;
  d.parser = b.parse;
  d.Renderer = P;
  d.TextRenderer = $;
  d.Lexer = x;
  d.lexer = x.lex;
  d.Tokenizer = y;
  d.Hooks = S;
  d.parse = d;
  var Dt = d.options;
  var Ht = d.setOptions;
  var Zt = d.use;
  var Gt = d.walkTokens;
  var Nt = d.parseInline;
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
            for (let i = childCount - 1; i >= 0; --i) {
              const childClone = cloneNode(childNodes[i], true);
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
    const update3 = () => textareaReconsider(textarea, scrollParent, initialHeight);
    textarea.addEventListener("input", update3);
    update3();
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
    return purify.sanitize(d.parse(content, { ...markedOptions, async: false }));
  }
  async function renderMDAsync(content) {
    return purify.sanitize(await d.parse(content, markedOptions));
  }
  var PLACHEOLDER = "assets/gfx/placeholder.png";
  function placeholder(url) {
    return url || PLACHEOLDER;
  }
  function setSelectOptions(target, options, pick = null) {
    const optionsList = options.map(([id, caption]) => T({
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
    const option = (id, caption) => T({
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
    T({
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
      const image = T({
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
      const input = T({
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
      this.clearButton = T({
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
      const pasteButton = T({
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
              this.paste(new File([file], "pasted"));
              return;
            }
          }
        }
      });
      const contents = [
        T({
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

  // src/units/settings/providers.ts
  function providersUnit() {
    const inputs = {
      name: document.querySelector("#settings-providers-name"),
      url: document.querySelector("#settings-providers-url"),
      key: document.querySelector("#settings-providers-key"),
      model: document.querySelector("#settings-providers-model"),
      temp: document.querySelector("#settings-providers-temp"),
      max: document.querySelector("#settings-providers-max"),
      params: document.querySelector("#settings-providers-additional")
    };
    const defaults = {
      temp: 0.9,
      max: 720
    };
    const submitButton = document.querySelector("#settings-providers-submit");
    const list = document.querySelector("#settings-providers-list");
    const divider = document.querySelector("#settings-providers-divider");
    let editing = null;
    submitButton.addEventListener("click", submit);
    listen((update3) => {
      if (update3.storage !== "local") return;
      if (update3.key !== "providers") return;
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
      const eMap = readProviders();
      eMap[id] = e;
      saveProviders(eMap);
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
      divider.scrollIntoView({ behavior: "smooth" });
    }
    function updateList() {
      list.innerHTML = "";
      const providersMap = readProviders();
      const providers = Object.entries(providersMap);
      const items = providers.map(
        ([id, e]) => T({
          className: "lineout row settings-provider-item",
          contents: [
            T({
              contents: e.name
            }),
            T({
              className: "row-compact",
              contents: [
                T({
                  tagName: "button",
                  className: "lineout",
                  events: {
                    click: (ev) => {
                      ev.stopPropagation();
                      copyProvider(id);
                    }
                  },
                  contents: "copy"
                }),
                T({
                  tagName: "button",
                  className: "lineout",
                  events: {
                    click: (ev) => {
                      ev.stopPropagation();
                      deleteProvider(id);
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
        list.append(T({
          className: "placeholder",
          contents: "No providers found"
        }));
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
      divider.scrollIntoView({ behavior: "smooth" });
    }
    async function updatePersonaList() {
      const personas = await idb.getAll("personas");
      if (!personas.success) return;
      personaList.innerHTML = "";
      const items = personas.value.reverse().map((p2) => T({
        className: "lineout row settings-persona-item",
        attributes: {
          "data-id": p2.id
        },
        contents: [
          T({
            tagName: "img",
            className: "shadow",
            attributes: {
              src: placeholder(null)
            }
          }),
          T({
            className: "list settings-persona-item-main",
            contents: [
              T({
                className: "row-compact",
                contents: [
                  T({
                    tagName: "h6",
                    contents: p2.name
                  }),
                  T({
                    tagName: "button",
                    className: "lineout",
                    events: {
                      click: () => startEditing(p2)
                    },
                    contents: "edit"
                  }),
                  T({
                    tagName: "button",
                    className: "lineout",
                    events: {
                      click: () => removePersona(p2.id)
                    },
                    contents: "delete"
                  })
                ]
              }),
              T({
                contents: p2.description
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
        personaList.append(T({
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
    const button = f(template);
    const themeClassName = `theme-${name}`;
    button.classList.add(themeClassName);
    button.addEventListener("click", () => switchTheme(themeClassName));
    return button;
  }
  function switchTheme(themeClassName) {
    document.body.classList.forEach((c) => {
      if (c.startsWith("theme-")) document.body.classList.remove(c);
    });
    document.body.classList.add(themeClassName);
    window.localStorage.setItem(STORAGE_KEY_THEME, themeClassName);
  }

  // src/units/toasts.ts
  function toast(message, options) {
    const list = document.querySelector("#toast-container");
    const rects = Array.from(list.children).map((t) => t.getBoundingClientRect());
    const totalH = rects.reduce((p2, c) => p2 + c.height, 0);
    let closed = false;
    const actions = options?.actions ? options.actions.map(
      ([caption, cb]) => T({
        tagName: "button",
        className: "lineout",
        contents: caption,
        events: {
          click: () => !closed && cb(close)
        }
      })
    ) : [];
    const item = T({
      tagName: "div",
      className: "toast list pointer",
      contents: [
        T({
          tagName: "div",
          contents: message
        }),
        T({
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
    list.append(item);
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

  // src/units/settings/backup.ts
  function initBackup() {
    const saveButton = document.querySelector("#settings-backup-save");
    saveButton.addEventListener("click", backup);
    const importPicker = document.querySelector("#settings-backup-import");
    importPicker.addEventListener("input", () => restore(importPicker));
  }
  async function backup() {
    const closeToast = toast("on it, please wait...");
    const [
      chatContents,
      chats,
      personas,
      scenarios,
      media
    ] = await Promise.all([
      idb.getAll("chatContents"),
      idb.getAll("chats"),
      idb.getAll("personas"),
      idb.getAll("scenarios"),
      idb.getAll("media")
    ]);
    const localData = {
      providers: local.get("providers"),
      activeProvider: local.get("activeProvider"),
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
      for (const m3 of validOnly.media) {
        m3.media = await b64Encoder.encode(m3.media);
      }
    }
    const payload = JSON.stringify({
      idb: validOnly,
      local: localData
    });
    closeToast();
    download(payload, `${(/* @__PURE__ */ new Date()).toLocaleString()}.aegir.backup.json`);
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

  // src/units/settings/misc.ts
  function initMisc() {
    const tailInput = document.querySelector("#settings-options-tail");
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
      settings.tail = isNaN(tail) ? 0 : tail;
      local.set("settings", JSON.stringify(settings));
    });
    function updateSettings() {
      const settings = loadMiscSettings();
      tailInput.value = String(settings.tail);
    }
  }
  var DEFAULT_SETTINGS = {
    tail: 70
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

  // src/run.ts
  var abortController;
  async function runProvider(chat, provider, onChunk) {
    const chonks = [];
    const params = {
      model: provider.model,
      messages: chat.map((m3) => ({
        role: m3.from === "model" ? "assistant" : m3.from,
        content: m3.swipes[m3.from === "user" ? 0 : m3.selectedSwipe]
        // HACK: user messages sometimes have nonzero selectedSwipe
      })),
      stream: true,
      reasoning: {
        effort: "none"
      },
      max_completion_tokens: provider.max,
      temperature: provider.temp,
      ...provider.params
    };
    if (!provider.max) delete params.max_completion_tokens;
    try {
      abortController = new AbortController();
      const response = await fetch(provider.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider.key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(params),
        signal: abortController.signal
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
            error: `Provider says "${body}"
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
        const { done, value: value2 } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value2, { stream: true });
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
    let value = chonks.join("");
    if (value.includes("</think>")) {
      if (!value.includes("<think>")) {
        value = "<think>" + value;
      }
    }
    return { success: true, value };
  }

  // src/units/chat/utils.ts
  async function setSwipe(chatId, messageId, swipeIx, value) {
    const contents = await idb.get("chatContents", chatId);
    if (!contents.success) return;
    const tix = contents.value.messages.findIndex((m3) => m3.id === messageId);
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
    const mix = messages.findIndex((m3) => m3.id === messageId);
    if (mix < 0) return;
    messages[mix].swipes = messages[mix].swipes.filter((m3) => m3.trim());
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
    contents.value.messages.forEach((m3) => {
      if (typeof m3.swipes[m3.selectedSwipe] !== "string") {
        toast(`healed malformed message: mid ${m3.id}, old six: ${m3.selectedSwipe}`);
        m3.selectedSwipe = 0;
      }
    });
    await Promise.all([
      idb.set("chatContents", contents.value),
      idb.set("chats", chat.value)
    ]);
    return newMessage;
  }
  async function updateSwipeIndex(six, mid, chatId) {
    const contents = await idb.get("chatContents", chatId);
    if (!contents.success) return;
    const mix = contents.value.messages.findIndex((m3) => m3.id === mid);
    if (typeof contents.value.messages[mix].swipes[six] !== "string") {
      toast(`error: settings six ${six} on mid ${mid}, but only ${contents.value.messages[mix].swipes.length} swipes are present`);
      return;
    }
    contents.value.messages[mix].selectedSwipe = six;
    await idb.set("chatContents", contents.value);
  }
  async function updateRember(value, mid, chatId) {
    const contents = await idb.get("chatContents", chatId);
    if (!contents.success) return;
    const mix = contents.value.messages.findIndex((m3) => m3.id === mid);
    contents.value.messages[mix].rember = value;
    await idb.set("chatContents", contents.value);
  }
  async function deleteMessage(chatId, messageId) {
    const inputModes = document.querySelector("#chat-controls");
    if (inputModes.tab !== "main") return;
    if (!confirm("all the following messages will be deleted too")) return;
    const [contents, chat] = await Promise.all([
      idb.get("chatContents", chatId),
      idb.get("chats", chatId)
    ]);
    if (!contents.success || !chat.success) return;
    const messages = contents.value.messages;
    const mix = messages.findIndex((m3) => m3.id === messageId);
    if (mix < 0) return;
    contents.value.messages.splice(mix);
    chat.value.lastUpdate = Date.now();
    chat.value.messageCount = messages.length;
    await Promise.all([
      idb.set("chatContents", contents.value),
      idb.set("chats", chat.value)
    ]);
    const messageViews = document.querySelectorAll(".message[data-mid]");
    messageViews.forEach((m3) => {
      const mid = parseInt(m3.dataset.mid, 10);
      if (mid >= messageId) m3.remove();
      if (mid === messageId - 1) m3.controls.setIsLast(true);
    });
  }
  async function reroll(chatId, messageId) {
    const payload = await prepareRerollPayload(chatId, messageId);
    if (!payload) return;
    loadResponse(payload, messageId, chatId);
  }
  async function preparePayload(contents, systemPrompt, userMessage) {
    const settings = loadMiscSettings();
    const sliced = settings.tail === 0 ? contents : contents.slice(-settings.tail);
    const system = dullMessage("system", systemPrompt);
    const payload = [
      system,
      ...sliced
    ];
    if (!userMessage) return payload;
    const user = dullMessage("user", userMessage);
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
    const mix = messages.findIndex((m3) => m3.id === messageId);
    if (mix < 0) return null;
    const history = messages.slice(0, mix);
    const settings = loadMiscSettings();
    const sliced = settings.tail === 0 ? history : history.slice(-settings.tail);
    const system = dullMessage("system", chat.value.scenario.definition);
    const payload = [
      system,
      ...sliced
    ];
    return payload;
  }
  async function loadResponse(payload, msgId, chatId) {
    const providerOptions = Object.entries(readProviders());
    if (providerOptions.length <= 0) {
      console.error("no providers!");
      return;
    }
    const [, provider] = providerOptions.find(([, e]) => e.isActive) ?? providerOptions[0];
    const inputModes = document.querySelector("#chat-controls");
    inputModes.tab = "pending";
    const messageView = getMessageViewByID(msgId);
    if (!messageView) {
      window.location.reload();
      return;
    }
    const responseStreamingUpdater = messageView.controls.startStreaming();
    const streamingResult = await runProvider(expandRember(payload), provider, responseStreamingUpdater);
    if (streamingResult.success) {
      const updatedMessage = await pushSwipe(chatId, msgId, streamingResult.value);
      if (!updatedMessage) {
        toast("failed to save response message");
        return;
      }
      messageView.controls.updateMessage(updatedMessage);
    } else {
      toast(streamingResult.error);
    }
    messageView.controls.endStreaming();
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
  function dullMessage(from, text2) {
    return { from, id: -1, name: "", rember: null, swipes: [text2], selectedSwipe: 0 };
  }
  function expandRember(chat) {
    const remberAt = chat.findLastIndex((m3) => m3.rember);
    if (remberAt === -1) {
      return chat;
    } else {
      return chat.slice(0, remberAt + 1).concat(
        dullMessage("system", `# Roleplay state summary:
${chat[remberAt].rember}`),
        chat.slice(remberAt + 1)
      );
    }
  }
  async function getCurrentChat(chat = true, contents = true) {
    const [page, chatId] = getRoute();
    if (page !== "play") return null;
    if (chat && contents) {
      const [messages, chat2] = await Promise.all([
        idb.get("chatContents", chatId),
        idb.get("chats", chatId)
      ]);
      if (!messages.success || !chat2.success) return null;
      return { messages: messages.value, chat: chat2.value };
    } else if (chat) {
      const chat2 = await idb.get("chats", chatId);
      if (chat2.success)
        return { chat: chat2.value };
      else
        return null;
    } else if (contents) {
      const messages = await idb.get("chatContents", chatId);
      if (messages.success)
        return { messages: messages.value };
      else
        return null;
    }
    return null;
  }

  // src/units/chat/views.ts
  function makeMessageView(msg, [userPic, modelPic], isLast, onEdit, onReroll, onDelete, onSwipe) {
    const status = T({
      tagName: "div",
      className: "message-status"
    });
    const text2 = msg.swipes[msg.selectedSwipe];
    const textBox = T({
      tagName: "div",
      className: "message-text edible md",
      contents: text2
    });
    const swipesCaption = T({
      tagName: "span",
      contents: ""
    });
    const swipesControl = T({
      tagName: "div",
      className: "row-compact no-shrink",
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
      onSwipe(msg.selectedSwipe);
    }
    async function setSwipeToLast() {
      msg.selectedSwipe = msg.swipes.length - 1;
      textBox.innerHTML = renderMD(msg.swipes[msg.selectedSwipe]);
      swipesCaption.textContent = `${msg.selectedSwipe + 1} / ${msg.swipes.length}`;
      swipesControl.style.display = msg.swipes.length > 1 ? "flex" : "none";
    }
    function setStatus(value) {
      if (value === null) {
        status.hidden = true;
        return;
      }
      status.hidden = false;
      status.textContent = value;
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
      onDelete
    );
    const copyButton = controlButton(
      "\u29C9",
      "copy message",
      async () => {
        await navigator.clipboard.writeText(msg.swipes[msg.selectedSwipe]);
        toast("message copied to clipboard", { timeoutMS: 3200 });
      }
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
    const controlsTab = virtualTabs(
      ["main", mainControls],
      ["editing", [
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
      ]],
      ["streaming", []]
    );
    const controls = controlsTab.contents;
    const changeControlsState = controlsTab.pickTab;
    const element = T({
      tagName: "div",
      className: "message",
      attributes: {
        "data-mid": String(msg.id)
      },
      contents: [
        T({
          tagName: "img",
          attributes: {
            src: placeholder(msg.from === "user" ? userPic : modelPic)
          }
        }),
        T({
          contents: [
            T({
              className: "row",
              contents: [
                T({
                  className: "message-name",
                  contents: msg.name
                }),
                status,
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
    setStatus(null);
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
      setStatus("responding...");
      return (value) => {
        textBox.innerText += value;
        if (elementVisible(element)) scrollIntoView();
      };
    }
    async function endStreaming() {
      await setSwipeToLast();
      changeControlsState("main");
      scrollIntoView();
      setStatus(null);
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
    return M(element, viewControls, "controls");
  }
  function remberMessageView(messageId, onEdit, onRemove, contents = "") {
    const textBox = T({
      tagName: "div",
      className: "chat-rember-view edible",
      contents
    });
    let editPocket = "";
    const buttons = {
      edit: controlButton(
        "\u270E",
        "edit",
        () => {
          textBox.setAttribute("contenteditable", "");
          textBox.focus();
          editPocket = textBox.innerText;
          changeControlsState("edit");
        }
      ),
      remove: controlButton(
        "\u2716",
        "remove",
        () => {
          if (!confirm(`the rEmber state for message #${messageId} will be removed`)) return;
          onRemove();
          suicide();
        }
      ),
      editConfirm: controlButton(
        "\u2714",
        "save",
        async () => {
          textBox.removeAttribute("contenteditable");
          changeControlsState("main");
          onEdit(textBox.innerText);
        }
      ),
      editCancel: controlButton(
        "\u2718",
        "cancel",
        async () => {
          textBox.removeAttribute("contenteditable");
          changeControlsState("main");
          textBox.innerHTML = editPocket;
        }
      )
    };
    const controlTabs = virtualTabs(
      ["main", [
        buttons.edit,
        buttons.remove
      ]],
      ["edit", [
        buttons.editConfirm,
        buttons.editCancel
      ]],
      ["streaming", []]
    );
    const changeControlsState = controlTabs.pickTab;
    changeControlsState("main");
    const container = T({
      tagName: "div",
      className: "lineout list",
      contents: [
        T({
          tagName: "div",
          className: "row",
          contents: [
            T({
              tagName: "span",
              className: "hint",
              contents: `#${messageId}`
            }),
            T({
              tagName: "div",
              className: "row-compact float-end",
              contents: controlTabs.contents
            })
          ]
        }),
        textBox
      ],
      attributes: {
        title: String(messageId)
      }
    });
    function appendContent(value) {
      textBox.textContent += value;
    }
    function enable(value) {
      textBox.textContent = value;
      changeControlsState("main");
    }
    function suicide() {
      container.remove();
    }
    function hideControls() {
      changeControlsState("streaming");
    }
    return M(
      container,
      {
        appendContent,
        enable,
        hideControls
      },
      "controls"
    );
  }
  function controlButton(caption, hint, cb) {
    return T({
      tagName: "button",
      className: "strip ghost pointer message-control",
      contents: caption,
      attributes: { title: hint },
      events: { click: cb }
    });
  }
  function virtualTabs(...tabs) {
    const ixes = new Map(tabs.map(([k2], i) => [k2, i]));
    const contents = tabs.map(
      ([_2, tab]) => T({
        tagName: "div",
        className: "virtual",
        contents: tab
      })
    );
    function pickTab(state) {
      const tix = ixes.get(state);
      contents.forEach((tab, i) => tab.style.display = i === tix ? "contents" : "none");
    }
    return {
      contents,
      pickTab
    };
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
    updateTitle(meta.value.scenario.name);
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
        () => reroll(chatId, item.id),
        () => deleteMessage(chatId, item.id),
        (six) => updateSwipeIndex(six, item.id, chatId)
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
    getMessageViewByID(lastMessageId)?.controls.setIsLast(false);
    const newUserMessage = await addMessage(meta.value.id, message, true, meta.value.userPersona.name);
    if (!newUserMessage) {
      console.error("failed to save user message");
      return;
    }
    const swipesDisabled = (six) => toast(`attempt to swipe user message, mid: ${newUserMessage.id}, six: ${six}`);
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
      () => deleteMessage(chatId, newUserMessage.id),
      swipesDisabled
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
      () => reroll(chatId, newModelMessage.id),
      () => {
        throw Error("haha nope");
      },
      (six) => updateSwipeIndex(six, newUserMessage.id, chatId)
    );
    list.append(userMessage, responseMessage);
    loadResponse(payload, newModelMessage.id, meta.value.id);
    textarea.value = "";
    textareaReconsider(textarea);
    list.scrollTop = list.scrollHeight;
  }

  // node_modules/tokenx/dist/index.mjs
  var PATTERNS = {
    whitespace: /^\s+$/,
    cjk: /[\u4E00-\u9FFF\u3400-\u4DBF\u3000-\u303F\uFF00-\uFFEF\u30A0-\u30FF\u2E80-\u2EFF\u31C0-\u31EF\u3200-\u32FF\u3300-\u33FF\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/,
    numeric: /^\d+(?:[.,]\d+)*$/,
    punctuation: /[.,!?;(){}[\]<>:/\\|@#$%^&*+=`~_-]/,
    alphanumeric: /^[a-zA-Z0-9\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]+$/
  };
  var TOKEN_SPLIT_PATTERN = /* @__PURE__ */ new RegExp(`(\\s+|${PATTERNS.punctuation.source}+)`);
  var DEFAULT_CHARS_PER_TOKEN = 6;
  var SHORT_TOKEN_THRESHOLD = 3;
  var DEFAULT_LANGUAGE_CONFIGS = [
    {
      pattern: /[äöüßẞ]/i,
      averageCharsPerToken: 3
    },
    {
      pattern: /[éèêëàâîïôûùüÿçœæáíóúñ]/i,
      averageCharsPerToken: 3
    },
    {
      pattern: /[ąćęłńóśźżěščřžýůúďťň]/i,
      averageCharsPerToken: 3.5
    }
  ];
  function estimateTokenCount(text2, options = {}) {
    if (!text2) return 0;
    const { defaultCharsPerToken = DEFAULT_CHARS_PER_TOKEN, languageConfigs = DEFAULT_LANGUAGE_CONFIGS } = options;
    const segments = text2.split(TOKEN_SPLIT_PATTERN).filter(Boolean);
    let tokenCount = 0;
    for (const segment of segments) tokenCount += estimateSegmentTokens(segment, languageConfigs, defaultCharsPerToken);
    return tokenCount;
  }
  function estimateSegmentTokens(segment, languageConfigs, defaultCharsPerToken) {
    if (PATTERNS.whitespace.test(segment)) return 0;
    if (PATTERNS.cjk.test(segment)) return getCharacterCount(segment);
    if (PATTERNS.numeric.test(segment)) return 1;
    if (segment.length <= SHORT_TOKEN_THRESHOLD) return 1;
    if (PATTERNS.punctuation.test(segment)) return segment.length > 1 ? Math.ceil(segment.length / 2) : 1;
    if (PATTERNS.alphanumeric.test(segment)) {
      const charsPerToken$1 = getLanguageSpecificCharsPerToken(segment, languageConfigs) ?? defaultCharsPerToken;
      return Math.ceil(segment.length / charsPerToken$1);
    }
    const charsPerToken = getLanguageSpecificCharsPerToken(segment, languageConfigs) ?? defaultCharsPerToken;
    return Math.ceil(segment.length / charsPerToken);
  }
  function getLanguageSpecificCharsPerToken(segment, languageConfigs) {
    for (const config of languageConfigs) if (config.pattern.test(segment)) return config.averageCharsPerToken;
  }
  function getCharacterCount(text2) {
    return Array.from(text2).length;
  }

  // src/units/chat/editor.ts
  function initChatEditor() {
    const saveButton = document.querySelector("#play-editor-save");
    const resetButton = document.querySelector("#play-editor-reset");
    const closeButton = document.querySelector("#play-editor-close");
    const definitionInput = document.querySelector("#play-editor-definition");
    const modal = document.querySelector("#play-editor");
    makeResizable(definitionInput);
    listen((update3) => {
      if (update3.storage !== "idb") return;
      if (update3.store !== "chats") return;
      updateDefinition();
    });
    window.addEventListener("hashchange", updateDefinition);
    resetButton.addEventListener("click", updateDefinition);
    updateDefinition();
    async function getChat() {
      const [page, chatId] = getRoute();
      if (page !== "play" || !chatId) return null;
      const chat = await idb.get("chats", chatId);
      if (!chat.success) return null;
      return chat.value;
    }
    async function updateDefinition() {
      const chat = await getChat();
      if (!chat) return;
      definitionInput.value = chat.scenario.definition;
      textareaReconsider(definitionInput);
    }
    saveButton.addEventListener("click", async () => {
      const value = definitionInput.value.trim();
      if (!value) return;
      const chat = await getChat();
      if (!chat) return;
      chat.scenario.definition = value;
      chat.scenario.tokenCount = estimateTokenCount(value);
      await idb.set("chats", chat);
      modal.close();
    });
    closeButton.addEventListener("click", () => {
      modal.close();
    });
    return {
      open: () => {
        modal.open();
        textareaReconsider(definitionInput);
      }
    };
  }

  // src/units/chat/rember.ts
  var REMBER_DEFAULTS = {
    stride: 10,
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
      "",
      "## trivia",
      "",
      "## plans and intentions",
      "",
      "```"
    ].join("\n")
  };
  function initRember() {
    const modal = document.querySelector("#play-rember");
    const providerPicker = document.querySelector("#play-rember-provider-picker");
    const strideInput = document.querySelector("#play-rember-stride");
    const prompt2 = document.querySelector("#play-rember-prompt");
    const buttons = {
      one: document.querySelector("#play-rember-add-one"),
      all: document.querySelector("#play-rember-add-all"),
      stop: document.querySelector("#play-rember-stop"),
      save: document.querySelector("#play-rember-save"),
      reset: document.querySelector("#play-rember-reset")
    };
    const list = document.querySelector("#play-rember-messages");
    buttons.one.addEventListener("click", runOne);
    buttons.all.addEventListener("click", runAll);
    buttons.stop.addEventListener("click", forgor);
    buttons.save.addEventListener("click", saveSettings);
    buttons.reset.addEventListener("click", resetPrompt);
    providerPicker.addEventListener("input", providerPickerChanged);
    buttons.stop.hidden = true;
    listen((u3) => {
      if (u3.storage !== "local") return;
      if (u3.key !== "activeProvider") return;
      updateProviderPicker();
    });
    updateProviderPicker();
    function updateProviderPicker() {
      const providerMap = readProviders();
      const providerOptions = Object.entries(providerMap);
      const activeId = providerOptions.find(([, e]) => e.remberActive)?.[0];
      setSelectOptions(providerPicker, providerOptions.map(([id, e]) => [id, e.name]), activeId);
    }
    async function onOpen() {
      const state = await getCurrentChat();
      if (!state) return;
      prompt2.value = state.chat.rember?.prompt ?? REMBER_DEFAULTS.prompt;
      list.innerHTML = "";
      const remberMessages = state.messages.messages.filter((m3) => m3.rember);
      const items = remberMessages.map((m3) => remberMessageView(
        m3.id,
        (v2) => updateRember(v2, m3.id, state.chat.id),
        () => updateRember(null, m3.id, state.chat.id),
        m3.rember
      )).toReversed();
      list.append(...items);
    }
    async function step() {
      const state = await getCurrentChat(true, false);
      if (!state) return;
      let view = null;
      function checkView(mid) {
        if (!view) {
          view = remberMessageView(
            mid,
            (v2) => updateRember(v2, mid, state.chat.id),
            () => updateRember(null, mid, state.chat.id)
          );
          list.prepend(view);
        }
        return view;
      }
      const result = await runRember(
        (content, mid) => {
          checkView(mid).controls.appendContent(content);
          checkView(mid).controls.hideControls();
        },
        providerPicker.value,
        getStride(),
        prompt2.value.trim(),
        state.chat.scenario.definition
      );
      if (!result.success) return false;
      checkView(result.value.mid).controls.enable(result.value.response);
      return true;
    }
    async function runOne() {
      buttons.one.hidden = true;
      buttons.all.hidden = true;
      buttons.stop.hidden = false;
      await step();
      buttons.one.hidden = false;
      buttons.all.hidden = false;
      buttons.stop.hidden = true;
    }
    let interruptFlag = false;
    async function runAll() {
      buttons.one.hidden = true;
      buttons.all.hidden = true;
      buttons.stop.hidden = false;
      while (!interruptFlag) {
        const proceed = await step();
        if (!proceed) break;
      }
      interruptFlag = false;
      buttons.one.hidden = false;
      buttons.all.hidden = false;
      buttons.stop.hidden = true;
    }
    function forgor() {
      interruptFlag = true;
      abortController.abort();
    }
    async function saveSettings() {
      const state = await getCurrentChat(true, false);
      if (!state) return;
      const v2 = {
        prompt: prompt2.value.trim(),
        stride: getStride()
      };
      state.chat.rember = v2;
      await idb.set("chats", state.chat);
    }
    function resetPrompt() {
      if (!confirm("the current rember prompt will be lost after saving the settings")) return;
      prompt2.value = REMBER_DEFAULTS.prompt;
    }
    function providerPickerChanged() {
      const actives = readActiveProviders();
      actives.rember = providerPicker.value;
      local.set("activeProvider", JSON.stringify(actives));
    }
    function getStride() {
      const value = parseInt(strideInput.value, 10);
      if (isNaN(value)) return REMBER_DEFAULTS.stride;
      return value;
    }
    return {
      open: () => {
        onOpen();
        modal.open();
      }
    };
  }
  async function runRember(onChunk, provider, stride, prompt2, system) {
    const eh = await getCurrentChat();
    if (!eh) return { success: false, error: "noload" };
    const { chat, messages } = eh;
    const noLastAction = messages.messages.slice(0, -2);
    let lix = noLastAction.findLastIndex((m3) => m3.rember);
    const state = lix === -1 ? null : noLastAction[lix].rember;
    if (lix === -1) lix = 0;
    const tix = Math.min(noLastAction.length - 1, lix + stride * 2);
    if (tix === lix) return { success: false, error: "iscomplete" };
    const scope = noLastAction.slice(lix, tix);
    const payload = prepareMessages(
      scope,
      {
        user: chat.userPersona.name,
        model: chat.scenario.name,
        system: ""
      },
      prompt2,
      state,
      system
    );
    const providers = readProviders();
    if (!providers[provider]) return { success: false, error: "noproviders" };
    const response = await runProvider(payload, providers[provider], (value) => onChunk(value, tix));
    if (!response.success) {
      toast(response.error);
      return { success: false, error: "failed" };
    }
    const thinkingParts = response.value.split("</think>");
    const result = (thinkingParts[1] ?? thinkingParts[0]).trim();
    messages.messages[tix].rember = result;
    await idb.set("chatContents", messages);
    return {
      success: true,
      value: {
        response: result,
        mid: tix
      }
    };
  }
  function prepareMessages(parts, names, prompt2, state, system) {
    const chat = parts.map((m3) => `## ${names[m3.from]}:
${m3.swipes[m3.selectedSwipe]}

`).join("\n");
    const payload = [
      ...state ? [
        "# saved roleplay state",
        state,
        ""
      ] : [],
      "# chat history",
      chat
    ].join("\n");
    const systemNested = system.replace(/^#+/gm, (v2) => `#${v2}`);
    return [
      dullMessage("system", prompt2.replace("{{system}}", systemNested)),
      dullMessage("user", payload)
    ];
  }

  // src/units/chat.ts
  function chatUnit() {
    const scroller = document.querySelector("#play-messages");
    const textarea = document.querySelector("#chat-textarea");
    const sendButton = document.querySelector("#chat-send-button");
    const stopButton = document.querySelector("#chat-stop-button");
    const providerPicker = document.querySelector("#chat-provider-picker");
    const menuButton = document.querySelector("#chat-menu-select");
    const inputModes = document.querySelector("#chat-controls");
    makeResizable(textarea, scroller);
    window.addEventListener("hashchange", update);
    listen((u3) => {
      if (u3.storage !== "local") return;
      if (u3.key !== "providers" && u3.key !== "activeProvider") return;
      updateProviders();
    });
    sendButton.addEventListener("click", sendMessage);
    stopButton.addEventListener("click", () => abortController.abort());
    providerPicker.addEventListener("input", () => {
      pickMainProvider(providerPicker.value);
    });
    update();
    updateProviders();
    const { open: openChatEditor } = initChatEditor();
    const { open: openRember } = initRember();
    const openRemberGuarded = () => {
      if (inputModes.tab !== "main") {
        toast("please wait until message generation is over");
        return;
      }
      openRember();
    };
    setSelectMenu(menuButton, "menu", [
      ["Scenario card", openScenarioIfExists],
      ["Edit definition", openChatEditor],
      ["rEmber", openRemberGuarded],
      ["Export", exportChat]
    ]);
  }
  async function update() {
    const route = getRoute();
    if (route[0] !== "play") {
      updateTitle(null);
      return;
    }
    if (!route[1]) return;
    await loadMessages(route[1]);
  }
  function updateProviders() {
    const inputModes = document.querySelector("#chat-controls");
    const providerPicker = document.querySelector("#chat-provider-picker");
    const providerControl = document.querySelector(".chat-provider-control");
    const providerMap = readProviders();
    const providerOptions = Object.entries(providerMap);
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
      if (inputModes.tab !== "pending")
        inputModes.tab = "main";
      providerControl.hidden = false;
    } else {
      inputModes.tab = "disabled";
      providerControl.hidden = true;
    }
  }
  function pickMainProvider(id) {
    const old = readActiveProviders();
    old.main = id;
    local.set("activeProvider", JSON.stringify(old));
  }
  async function openScenarioIfExists() {
    const [, chatId] = getRoute();
    if (!chatId) return;
    const chat = await idb.get("chats", chatId);
    if (!chat.success) return;
    const cardId = chat.value.scenario.id;
    const card = await idb.get("scenarios", cardId);
    if (card.success && card.value)
      window.open(`#scenario-editor.${cardId}`);
    else
      toast("Scenario card not found");
  }
  async function exportChat() {
    const [, chatId] = getRoute();
    if (!chatId) return;
    const [chat, contents] = await Promise.all([
      idb.get("chats", chatId),
      idb.get("chatContents", chatId)
    ]);
    if (!chat.success || !contents.success) return;
    const mediaIDs = [
      chat.value.userPersona.picture,
      chat.value.scenario.picture
    ].filter((id) => id);
    const encodedMedia = await asyncMap(
      mediaIDs,
      async (id) => {
        const picture = await idb.get("media", id);
        if (!picture.success) return null;
        return {
          ...picture.value,
          media: await b64Encoder.encode(picture.value.media)
        };
      }
    );
    const payload = {
      chat: chat.value,
      contents: contents.value,
      media: encodedMedia.filter((m3) => m3)
    };
    download(JSON.stringify(payload), `${chat.value.scenario.name}.${chat.value.id}.aegir.chat.json`);
  }

  // src/units/main.ts
  function mainUnit() {
    const importButton = document.querySelector("#main-import");
    importButton.addEventListener("input", () => {
      const file = importButton.input.files?.[0];
      if (!file) return;
      importChat(file);
    });
    listen((update3) => {
      if (update3.storage !== "idb") return;
      if (update3.store !== "chats") return;
      updateChatHandles();
    });
    updateChatHandles();
  }
  async function updateChatHandles() {
    const list = document.querySelector("#main-chats");
    const handles = await idb.getAll("chats");
    if (!handles.success) return;
    list.innerHTML = "";
    const items = handles.value.reverse().map((handle) => {
      const play = () => window.location.hash = `play.${handle.id}`;
      const icon = T({
        tagName: "img",
        className: "pointer",
        attributes: {
          src: placeholder(null)
        },
        events: {
          click: play
        }
      });
      const userIcon = T({
        tagName: "img",
        attributes: {
          src: placeholder(null)
        }
      });
      if (handle.scenario.picture)
        getBlobLink(handle.scenario.picture).then((src) => src && (icon.src = src));
      if (handle.userPersona.picture)
        getBlobLink(handle.userPersona.picture).then((src) => src && (userIcon.src = src));
      return T({
        className: "lineout row main-chats-item",
        contents: [
          icon,
          T({
            className: "list wide",
            contents: [
              T({
                tagName: "h2",
                className: "pointer",
                contents: handle.scenario.name,
                events: {
                  click: play
                }
              }),
              T({
                className: "row-compact main-chats-item-user",
                contents: [
                  userIcon,
                  T({
                    contents: handle.userPersona.name
                  })
                ]
              }),
              T({
                className: "hint",
                contents: messagesCaption(handle.messageCount)
              })
            ]
          }),
          T({
            className: "list",
            contents: [
              T({
                tagName: "button",
                className: "lineout",
                contents: "play",
                events: {
                  click: play
                }
              }),
              T({
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
    if (items.length === 0) list.append(T({ className: "placeholder", contents: "No chats found" }));
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
  async function importChat(file) {
    const json = await file.text();
    const parsed = nothrow(() => JSON.parse(json));
    if (!parsed.success) return;
    const chat = parsed.value.chat;
    const contents = parsed.value.contents;
    const media = parsed.value.media;
    for (const m3 of media) {
      m3.media = await b64Encoder.decode(m3.media);
      await idb.set("media", m3);
    }
    await idb.set("chats", chat);
    await idb.set("chatContents", contents);
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
    "You play as {{char}}, the user is {{user}}"
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
      cardIcon.usePlaceholder();
      chatIcon.usePlaceholder();
      document.body.scrollTo({ behavior: "instant", top: 0 });
      if (path[1]) {
        const scenario = await idb.get("scenarios", path[1]);
        if (!scenario.success) return;
        cardIcon.value = scenario.value.card.picture ?? "";
        cardTitle.value = scenario.value.card.title;
        cardAuthorName.value = scenario.value.card.author?.name ?? "";
        cardAuthorURL.value = scenario.value.card.author?.url ?? "";
        cardDescription.value = scenario.value.card.description;
        cardTags.value = scenario.value.card.tags.join(", ");
        chatIcon.value = scenario.value.chat.picture ?? "";
        characterName.value = scenario.value.chat.name;
        defintion.value = scenario.value.chat.definition;
        messagesControl.set(scenario.value.chat.initials);
      } else {
        cardIcon.usePlaceholder();
        cardTitle.value = "";
        cardAuthorName.value = "";
        cardAuthorURL.value = "";
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
      function author() {
        if (cardAuthorName.value.trim()) {
          return {
            name: cardAuthorName.value.trim(),
            url: cardAuthorURL.value.trim() || null
          };
        } else return null;
      }
      const id = getRoute()[1] ?? crypto.randomUUID();
      const payload = {
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
          definition: defintion.value,
          initials: firstMessages,
          tokenCount: estimateTokenCount(defintion.value)
        }
      };
      if (!payload.chat.definition.includes("{{persona}}")) {
        toast([
          "warning!\nthe saved definition lacks",
          " {{persona}} macro -- meaning the bot",
          " won't be able to know abything about",
          " user's persona"
        ].join(""));
      }
      await idb.set("scenarios", payload);
      window.location.hash = "library";
    });
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
  async function start(personaId, scenarioId, messages) {
    const [persona, scenario] = await Promise.all([
      idb.get("personas", personaId),
      idb.get("scenarios", scenarioId)
    ]);
    if (!persona.success || !scenario.success) return;
    if (messages) {
      messages = messages.map((m3) => {
        if (m3.from === "model") m3.name = scenario.value.chat.name;
        if (m3.from === "user") m3.name = persona.value.name;
        return m3;
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
        rember: REMBER_DEFAULTS
      }),
      idb.set("chatContents", {
        id: chatId,
        messages: messages ?? [{
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
    const definition = runMacros(origin.chat.definition);
    return {
      id: origin.id,
      picture: origin.chat.picture || origin.card.picture,
      name: origin.chat.name || origin.card.title,
      definition,
      initials: origin.chat.initials.map(runMacros),
      tokenCount: estimateTokenCount(definition)
    };
  }

  // src/units/library/st.ts
  async function importSTMessages(file) {
    const raw = await nothrowAsync(file.text());
    if (!raw.success) return [];
    const pre = raw.value.split("\n").filter((l2) => l2.trim()).map((l2) => nothrow(() => JSON.parse(l2))).filter((c) => c.success).map((c, ix) => stcToInternal(c.value, ix));
    const text2 = (c) => c.swipes[c.selectedSwipe];
    if (pre.length > 2 && text2(pre[0]) === text2(pre[1])) {
      pre.splice(0, 1);
    }
    return pre;
  }
  function stcToInternal(stc, index) {
    return {
      id: index,
      from: stc.is_system ? "system" : stc.is_user ? "user" : "model",
      name: stc.name,
      swipes: stc.swipes ?? [stc.mes],
      selectedSwipe: stc.swipe_id ?? 0,
      rember: null
    };
  }

  // src/units/library/dl.ts
  var parser2 = new DOMParser();
  var definitionTemplate2 = {
    characters: [
      "# Characters",
      "## {{char}} "
    ].join("\n"),
    userPersona: [
      "## {{user}}",
      "{{persona}}"
    ].join("\n"),
    instructions: [
      "# Instructions",
      "You play as {{char}}, the user is {{user}}"
    ].join("\n")
  };
  async function downloadScenarioCard(url) {
    url = url.toLowerCase().replace("janitorai.com/", "jannyai.com/");
    const response = await fetch(`https://fenrir.milesseventh.workers.dev/steel/${encodeURIComponent(url)}`);
    if (!response.ok) {
      toast("network error");
      return null;
    }
    const raw = await response.text();
    const dom = parser2.parseFromString(raw, "text/html");
    const pivot = dom.querySelector("h1");
    if (!pivot) {
      toast("can't find title in downloaded page");
      return null;
    }
    const [title, description, tagsContainer] = Array.from(pivot.parentElement.children);
    const tags = Array.from(tagsContainer.querySelectorAll("li")).map((e) => e.innerText);
    let personality = "";
    let scenario = "";
    let firstMessage = "";
    const definitionContainer = dom.querySelector("details ul");
    definitionContainer.querySelectorAll("li").forEach((e) => {
      const caption = e.querySelector("span");
      const captionText = caption.innerText.toLocaleLowerCase().trim();
      caption.remove();
      if (captionText.includes("personality")) personality = fix(e.innerText.trim());
      if (captionText.includes("scenario")) scenario = fix(e.innerText.trim());
      if (captionText.includes("first")) firstMessage = fix(e.innerText.trim());
    });
    function fix(raw2) {
      return raw2.replace(/(?<!\{)\{[^}]*\}(?!\})/g, (v2) => `{${v2.toLowerCase()}}`).replace(/^#+/gm, (v2) => `##${v2}`);
    }
    let definition = `${definitionTemplate2.characters}
${personality}

${definitionTemplate2.userPersona}

`;
    if (scenario) definition = definition.concat(`# Scenario
${scenario}

`);
    definition = definition.concat(`${definitionTemplate2.instructions}`);
    const authorName = Array.from(dom.querySelectorAll("a")).find((e) => e.innerText.trim().startsWith("@"))?.innerText.trim().slice(1);
    let picture = null;
    const pictureContainer = dom.querySelector("img.w-full");
    if (pictureContainer) {
      const response2 = await fetch(pictureContainer.src);
      if (response2.ok) {
        const blob = await response2.blob();
        picture = await upload(blob);
      }
    }
    return {
      card: {
        author: {
          name: authorName || "unknown",
          url
        },
        title: title.innerText,
        description: description.innerHTML,
        tags,
        picture
      },
      chat: {
        definition,
        initials: [firstMessage],
        name: "",
        picture: null,
        tokenCount: estimateTokenCount(definition)
      },
      id: crypto.randomUUID(),
      lastUpdate: Date.now()
    };
  }

  // src/units/library.ts
  var openerRelay = null;
  function libraryUnit() {
    const startButton = document.querySelector("#library-start-button");
    const startPersonaPicker = document.querySelector("#library-start-persona");
    const startImportButton = document.querySelector("#library-start-import");
    const importButton = document.querySelector("#library-import");
    const downloadButton = document.querySelector("#library-download");
    const modal = document.querySelector("#library-start");
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
      const url = prompt("Enter the link to a character page on janitorai.com")?.trim();
      if (!url) return;
      const card = await downloadScenarioCard(url);
      if (card) {
        await idb.set("scenarios", card);
        toast(
          "scenario downloaded!\ndon't forget to add the character name and check the definition",
          {
            actions: [
              ["ok", (close) => close()],
              ["open", (close) => {
                close();
                window.open(`#scenario-editor.${card.id}`);
              }]
            ]
          }
        );
      }
    });
    listen(async (u3) => {
      if (u3.storage !== "idb") return;
      if (u3.store !== "scenarios") return;
      update2();
    });
    update2();
  }
  async function update2() {
    const list = document.querySelector("#library-cards");
    list.innerHTML = "";
    const items = await idb.getAll("scenarios");
    if (!items.success) return;
    const contents = items.value.reverse().map(scenarioCardView);
    list.append(...contents);
    if (contents.length === 0)
      list.append(T({ className: "placeholder", contents: "No scenario cards found" }));
  }
  function scenarioCardView(item) {
    const play = () => openStartModal(item.id, item.card.description);
    let icon = T({
      tagName: "img",
      className: "pointer",
      attributes: {
        src: placeholder(null)
      },
      events: {
        click: play
      }
    });
    if (item.card.picture) {
      getBlobLink(item.card.picture).then((src) => {
        if (src) icon.src = src;
      });
    }
    const description = T({
      className: "scenario-card-description md"
    });
    description.innerHTML = renderMD(item.card.description);
    const author = T({
      tagName: item.card.author?.url ? "a" : "span",
      contents: item.card.author?.name ?? ""
    });
    if (item.card.author?.url) {
      author.setAttribute("href", item.card.author.url);
    }
    const tokens = T({
      className: "hint float-end",
      contents: `${neatNumber(item.chat.tokenCount ?? 0)} tokens`,
      attributes: {
        title: `${item.chat.tokenCount ?? "N/A"} tokens`
      }
    });
    return T({
      className: "scenario-card lineout",
      contents: [
        T({
          tagName: "div",
          className: "scenario-card-icon-container",
          contents: [
            icon
          ]
        }),
        T({
          className: "list grow",
          contents: [
            T({
              className: "row-compact",
              contents: [
                T({
                  tagName: "h6",
                  className: "pointer",
                  contents: item.card.title,
                  events: {
                    click: play
                  }
                }),
                T({
                  tagName: "button",
                  className: "strip ghost pointer",
                  events: {
                    click: () => downloadScenario(item)
                  },
                  contents: "\u2913"
                }),
                T({
                  tagName: "button",
                  className: "strip ghost pointer",
                  events: {
                    click: () => deleteScenario(item.id, item.card.title)
                  },
                  contents: "\u2716"
                }),
                T({
                  tagName: "button",
                  className: "strip ghost pointer",
                  events: {
                    click: () => {
                      document.location.hash = `scenario-editor.${item.id}`;
                    }
                  },
                  contents: "\u270E"
                }),
                T({
                  tagName: "button",
                  className: "lineout",
                  events: {
                    click: play
                  },
                  contents: "play"
                })
              ]
            }),
            T({
              tagName: "div",
              className: "row baseline",
              contents: [author, tokens]
            }),
            T({
              tagName: "hr"
            }),
            description,
            T({
              className: "scenario-card-tags",
              contents: item.card.tags.map(
                (tag) => T({
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
    const filename = [payload.card.title, payload.chat.name].filter((t) => t).join(" | ");
    download(JSON.stringify(payload), `${filename}.aegir.scenario.json`);
  }
  async function importScenario(file) {
    const raw = await file.text();
    const parsed = JSON.parse(raw);
    async function decode(b64) {
      if (!b64) return null;
      const file2 = await b64Encoder.decode(b64);
      const media = await upload(file2);
      return media;
    }
    parsed.card.picture = await decode(parsed.card.picture);
    parsed.chat.picture = await decode(parsed.chat.picture);
    parsed.lastUpdate = Date.now();
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
      personas.value[0]?.id
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
    units.forEach((u3) => u3());
    const dbAvailable = init();
    if (!dbAvailable) toast("indexeddb init failed");
  }
})();
/*! Bundled license information:

dompurify/dist/purify.es.mjs:
  (*! @license DOMPurify 3.3.1 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.3.1/LICENSE *)
*/
//# sourceMappingURL=index.js.map
