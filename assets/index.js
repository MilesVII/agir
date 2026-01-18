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
    set value(v) {
      this.select(v);
    }
    options = [];
    slider = null;
    select(v = this.value) {
      const oldValue = this.value;
      if (oldValue !== v) {
        this.setAttribute("value", v);
        this.dispatchEvent(new CustomEvent("r-change", {
          detail: {
            oldValue,
            newValue: v
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
    set selected(v) {
      if (v)
        this.setAttribute("selected", "true");
      else
        this.removeAttribute("selected");
    }
    get key() {
      return this.getAttribute("key") ?? "";
    }
    set key(v) {
      this.setAttribute("key", v);
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
        buttons.forEach((b) => {
          b.active = b.tab === value;
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
    if (p) for (let a of i(p)) e.addEventListener(a, (m) => p[a](m, e));
    return e;
  }
  function i(e) {
    return Object.keys(e);
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
        className: "shadow",
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
          for (const [a, v] of attributes) {
            parsed.setAttribute(a, v);
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

  // src/units/navigation.ts
  var navigationUnit = {
    init: () => {
      const tabs = document.querySelector("ram-tabs#tabs-main");
      function nav(to) {
        tabs.tab = to;
        window.location.hash = to;
      }
      const hash = window.location.hash.slice(1);
      if (hash) nav(hash);
      const buttons = document.querySelectorAll("button[data-to]");
      buttons.forEach((b) => b.addEventListener("click", () => nav(b.dataset.to)));
    },
    update: () => {
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

  // src/units/settings.ts
  var settingsUnit = {
    init: () => {
      initTheme();
    }
  };

  // src/units/chat.ts
  var chatUnit = {
    init: () => {
      const textarea = document.querySelector("#chat-textarea");
      const initialHeight = textarea.clientHeight;
      const update = () => {
        textarea.style.height = "auto";
        textarea.style.height = `${Math.max(initialHeight, textarea.scrollHeight)}px`;
      };
      textarea.addEventListener("input", update);
      update();
    }
  };

  // src/index.ts
  define2();
  define();
  define3("ram-modal");
  define4();
  define5("ram-import");
  window.addEventListener("DOMContentLoaded", main);
  var units = [
    navigationUnit,
    settingsUnit,
    chatUnit
  ];
  async function main() {
    units.forEach((u) => u.init?.(void 0));
  }
})();
//# sourceMappingURL=index.js.map
