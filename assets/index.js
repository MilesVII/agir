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
      const multiline = this.getAttribute("multiline");
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
  function makeResizable(textarea, initialHeight = 52) {
    const update = () => {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(initialHeight, textarea.scrollHeight)}px`;
    };
    textarea.addEventListener("input", update);
    update();
  }
  function getRoute() {
    return window.location.hash.slice(1).split(".");
  }

  // src/persist.ts
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
    const r = db.transaction(store, "readonly").objectStore(store).getAll();
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
        const update = { storage: "idb", store };
        bc.postMessage(update);
        storageListeners.forEach((l2) => l2(update));
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
        const update = { storage: "idb", store };
        bc.postMessage(update);
        storageListeners.forEach((l2) => l2(update));
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
        db.createObjectStore("personas", { keyPath: "id" });
        db.createObjectStore("chats", { keyPath: "id" });
        db.createObjectStore("chatContents", { keyPath: "id" });
        db.createObjectStore("scenarios", { keyPath: "id" });
      };
    });
  }
  function localGet(key) {
    return window.localStorage.getItem(key);
  }
  function localSet(key, value) {
    window.localStorage.setItem(key, value);
    const update = { storage: "local", key };
    bc.postMessage(update);
    storageListeners.forEach((l2) => l2(update));
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
    if (!blob.success) return null;
    const link = URL.createObjectURL(blob.value.media);
    map.set(imageRef, link);
    return link;
  }

  // src/components/imagepicker.ts
  var PLACHEOLDER = "assets/gfx/placeholder.png";
  var _RampikeImagePicker = class extends HTMLElement {
    get value() {
      return this.file ?? this.getAttribute("value") ?? "";
    }
    set value(v) {
      this.setAttribute("value", v);
      this.input.value = "";
      getBlobLink(v).then((src) => {
        if (!src) return;
        this.image = src;
      });
    }
    get input() {
      return this.querySelector(`input[type="file"]`);
    }
    get file() {
      return this.input.files?.[0];
    }
    set image(v) {
      const img = this.querySelector(`img`);
      this.revokeBlob?.();
      img.src = v;
      this.onDirty?.();
    }
    usePlaceholder() {
      this.image = this.getAttribute("placeholder") || PLACHEOLDER;
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
      this.onDirty?.();
    }
    constructor() {
      super();
      const image = d({
        tagName: "img",
        attributes: {
          src: this.getAttribute("placeholder") || PLACHEOLDER
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
      const contents = d({
        tagName: "label",
        style: {
          display: "contents"
        },
        contents: [input, image]
      });
      this.append(contents);
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
        tabs.tab = to;
        window.location.hash = to;
      }
      window.addEventListener("hashchange", (e) => {
        tabs.tab = getRoute()[0] ?? "chats";
      });
      const hash = getRoute()[0];
      if (hash) nav(hash);
      const buttons = document.querySelectorAll("button[data-to]");
      buttons.forEach((b) => b.addEventListener("click", () => nav(b.dataset.to)));
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
        context: document.querySelector("#settings-engines-context")
      };
      const defaults = {
        temp: 0.9,
        max: 720,
        context: 16384
      };
      const submitButton = document.querySelector("#settings-engines-submit");
      const list = document.querySelector("#settings-engines-list");
      let editing = null;
      submitButton.addEventListener("click", submit);
      function submit() {
        const id = editing ?? crypto.randomUUID();
        function parseNumber(key) {
          const f = parseFloat(inputs[key].value);
          if (isNaN(f) || f < 0) return defaults[key];
          return f;
        }
        const e = {
          name: inputs.name.value,
          url: inputs.url.value,
          key: inputs.key.value,
          model: inputs.model.value,
          temp: parseNumber("temp"),
          max: parseNumber("max"),
          context: parseNumber("context")
        };
        const missing = ["name", "url", "model"].some((k) => !e[k]);
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
        inputs.context.value = String(defaults.context);
      }
      function edit(id, e) {
        editing = id;
        inputs.name.value = e.name;
        inputs.url.value = e.url;
        inputs.key.value = e.key;
        inputs.model.value = e.model;
        inputs.temp.value = String(e.temp);
        inputs.max.value = String(e.max);
        inputs.context.value = String(e.context);
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
                tagName: "button",
                className: "lineout",
                events: {
                  click: () => deleteEngine(id)
                },
                contents: "delete"
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
      listen((update) => {
        if (update.storage !== "local") return;
        if (update.key !== "engines") return;
        updateList();
      });
      updateList();
    }
  };
  function readEngines() {
    const enginesRaw = local.get("engines");
    if (!enginesRaw) return {};
    const engines = nothrow(() => JSON.parse(enginesRaw));
    if (!engines.success) return {};
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

  // src/units/settings/persona.ts
  var PLACHEOLDER2 = "assets/gfx/placeholder.png";
  var personaUnit = {
    init: () => {
      const filePicker = document.querySelector("#settings-persona-picture");
      const clearButton = document.querySelector("#settings-persona-picture-clear");
      const nameInput = document.querySelector("#settings-persona-name");
      const descInput = document.querySelector("#settings-persona-desc");
      const personaList = document.querySelector("#settings-persona-list");
      const submitButton = document.querySelector("#settings-add-persona");
      const form = document.querySelector("#settings-persona-form");
      let editingPersona = null;
      function clear() {
        filePicker.usePlaceholder();
        clearButton.hidden = true;
      }
      clearButton.addEventListener("click", () => {
        clear();
      });
      filePicker.onDirty = () => {
        clearButton.hidden = filePicker.value === "";
      };
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
          picture
        });
        filePicker.input.value = "";
        clear();
        nameInput.value = "";
        descInput.value = "";
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
        if (persona.picture) {
          filePicker.value = persona.picture;
        }
        nameInput.scrollIntoView({ behavior: "smooth" });
      }
      async function updatePersonaList() {
        const personas = await idb.getAll("personas");
        if (!personas.success) return;
        const imageLinks = await Promise.all(
          personas.value.map(
            (p) => p.picture ? getBlobLink(p.picture) : PLACHEOLDER2
          )
        );
        personaList.innerHTML = "";
        const items = personas.value.map((p, ix) => d({
          className: "lineout row settings-persona-item",
          attributes: {
            "data-id": p.id
          },
          contents: [
            d({
              tagName: "img",
              className: "shadow",
              attributes: {
                src: imageLinks[ix]
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
        if (items.length > 0)
          personaList.append(...items);
        else
          personaList.append(d({
            className: "placeholder",
            contents: "No personas found"
          }));
      }
      listen(async (update) => {
        if (update.storage !== "idb") return;
        if (update.store !== "personas") return;
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

  // src/units/settings.ts
  var settingsUnit = {
    init: () => {
      initTheme();
      personaUnit.init(void 0);
      enginesUnit.init(void 0);
    }
  };

  // src/units/chat.ts
  var chatUnit = {
    init: () => {
      const textarea = document.querySelector("#chat-textarea");
      makeResizable(textarea);
    }
  };

  // src/units/main.ts
  var mainUnit = {
    init: () => {
      const chatImport = document.querySelector("#main-chats-import");
      chatImport.addEventListener("input", async () => {
        const file = chatImport.input.files?.[0];
        if (!file) return;
        const raw = await nothrowAsync(file.text());
        if (!raw.success) return;
        const messages = raw.value.split("\n").filter((l2) => l2.trim()).map((l2) => nothrow(JSON.parse(l2))).filter((c2) => c2.success).map((c2) => stcToInternal(c2.value));
      });
    }
  };
  function stcToInternal(stc) {
    return {
      id: crypto.randomUUID(),
      from: stc.is_system ? "system" : stc.is_user ? "user" : "model",
      name: stc.name,
      swipes: stc.swipes ?? [stc.mes],
      selectedSwipe: 0,
      rember: null
    };
  }

  // src/units/scenario.ts
  var scenarioUnit = {
    init: () => {
      const chatIcon = document.querySelector("#scenario-chat-picture");
      const cardIcon = document.querySelector("#scenario-card-picture");
      const cardTitle = document.querySelector("#scenario-card-title");
      const cardDescription = document.querySelector("#scenario-description");
      const characterName = document.querySelector("#scenario-character-name");
      const defintion = document.querySelector("#scenario-defintion");
      const previewButton = document.querySelector("#scenario-preview-button");
      const submitButton = document.querySelector("#scenario-submit-button");
      makeResizable(cardDescription);
      makeResizable(defintion);
      window.addEventListener("hashchange", async () => {
        const path = getRoute();
        if (path[0] !== "scenario-editor") return;
        if (path[1]) {
          const scenario = await idb.get("scenarios", path[1]);
          if (!scenario.success) return;
          cardIcon.value = scenario.value.card.picture ?? "";
          cardTitle.value = scenario.value.card.title;
          cardDescription.value = scenario.value.card.description;
          chatIcon.value = scenario.value.chat.picture ?? "";
          characterName.value = scenario.value.chat.name;
          defintion.value = scenario.value.chat.definition;
        } else {
          cardIcon.value = "";
          cardTitle.value = "";
          cardDescription.value = "";
          chatIcon.value = "";
          characterName.value = "";
          defintion.value = "";
        }
      });
      submitButton.addEventListener("click", async () => {
        const required = [
          cardTitle.value,
          defintion.value
        ];
        if (required.some((v) => !v)) return;
        const cardPicture = await cardIcon.valueHandle();
        const chatPicture = await chatIcon.valueHandle();
        const id = getRoute()[1] ?? crypto.randomUUID();
        const payload = {
          id,
          card: {
            picture: cardPicture,
            title: cardTitle.value,
            description: cardDescription.value
          },
          chat: {
            picture: chatPicture,
            name: characterName.value || cardTitle.value,
            definition: defintion.value
          }
        };
        await idb.set("scenarios", payload);
        window.location.hash = "library";
      });
    }
  };

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
    scenarioUnit
  ];
  async function main() {
    units.forEach((u) => u.init?.(void 0));
    const dbAvailable = init();
    if (!dbAvailable) alert("indexeddb init failed");
  }
})();
//# sourceMappingURL=index.js.map
