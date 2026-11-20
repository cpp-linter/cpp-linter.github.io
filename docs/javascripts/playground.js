// The clang-format playground on /playground/.
//
// clang-format runs in the browser: each LLVM version is a WebAssembly build
// from the @wasm-fmt/clang-format npm package, imported from jsDelivr the first
// time that version is picked. Releases up to 21 export `init` from
// clang-format.js; from 22 the browser entry is clang-format-web.js. Both then
// export `format(code, filename, style)` and `version()`.
//
// The result and the commands are <pre> elements without <code>: Material
// rewrites every `pre > code` it finds when the page loads.
//
// The picked version, style, language, code and .clang-format text are kept in
// the URL hash, so "Copy link" shares exactly what is on screen.

const CDN = "https://cdn.jsdelivr.net/npm/@wasm-fmt/clang-format@";

// LLVM major version -> the newest @wasm-fmt/clang-format release for it.
const VERSIONS = [
  ["23", "23.1.1"],
  ["22", "22.1.8"],
  ["21", "21.1.8"],
  ["20", "20.1.7"],
  ["19", "19.1.7"],
  ["18", "18.1.8"],
  ["17", "17.0.6"],
  ["16", "16.0.6"],
];
const DEFAULT_VERSION = "21";
const STYLES = ["LLVM", "Google", "Chromium", "Mozilla", "WebKit", "Microsoft", "GNU", "file"];

const SAMPLE = `#include <string>
#include<vector>
namespace demo{
struct Point{int x;int y;};
int sum(const std::vector<int>&values){int total=0;
for(auto v:values){total+=v;}
  return total;}
std::string greet(const std::string &name) { return "Hello, "+name+"!"; }
}
`;

// Lines past this are formatted but not diffed: the diff is quadratic.
const MAX_DIFF_LINES = 3000;
// Unchanged lines shown around each change in the diff.
const CONTEXT = 3;

const $ = (id) => document.getElementById(id);
const ui = {
  version: $("cl-pg-version"),
  style: $("cl-pg-style"),
  lang: $("cl-pg-lang"),
  share: $("cl-pg-share"),
  configWrap: $("cl-pg-config-wrap"),
  config: $("cl-pg-config"),
  input: $("cl-pg-input"),
  status: $("cl-pg-status"),
  diff: $("cl-pg-diff"),
  out: $("cl-pg-out"),
  copyOut: $("cl-pg-copy-out"),
  viewDiff: $("cl-pg-view-diff"),
  viewOut: $("cl-pg-view-out"),
  cmdLocal: $("cl-pg-cmd-local"),
  cmdHooks: $("cl-pg-cmd-hooks"),
  cmdAction: $("cl-pg-cmd-action"),
  fileNote: $("cl-pg-file-note"),
};

const ICON_PASS =
  '<svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="8" fill="#48B888"/><path d="M4.5 8.2l2.3 2.3 4.7-4.9" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_WARN =
  '<svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="8" fill="#F8C418"/><path d="M8 4v5" stroke="#1F1D1A" stroke-width="1.9" stroke-linecap="round"/><circle cx="8" cy="11.6" r="1.1" fill="#1F1D1A"/></svg>';
const ICON_FAIL =
  '<svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="8" fill="#E5534B"/><path d="M5.4 5.4l5.2 5.2M10.6 5.4l-5.2 5.2" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>';

// ---- loading clang-format -------------------------------------------------

const modules = new Map();

function loadVersion(major) {
  if (!modules.has(major)) {
    const release = VERSIONS.find(([m]) => m === major)[1];
    const entry = Number(major) >= 22 ? "clang-format-web.js" : "clang-format.js";
    const loading = import(`${CDN}${release}/${entry}`).then(async (mod) => {
      await mod.default();
      return mod;
    });
    // A failed download is retried the next time the version is picked.
    loading.catch(() => modules.delete(major));
    modules.set(major, loading);
  }
  return modules.get(major);
}

// ---- URL hash -------------------------------------------------------------

function encode(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decode(text) {
  const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

function readHash() {
  const params = new URLSearchParams(location.hash.slice(1));
  const state = {};
  const v = params.get("v");
  if (VERSIONS.some(([m]) => m === v)) state.version = v;
  const s = params.get("style");
  if (STYLES.includes(s)) state.style = s;
  const l = params.get("lang");
  if (l === "c") state.lang = "main.c";
  try {
    if (params.has("code")) state.code = decode(params.get("code"));
    if (params.has("config")) state.config = decode(params.get("config"));
  } catch {
    // A truncated or edited link: keep the defaults for what cannot be read.
  }
  return state;
}

function writeHash() {
  const params = new URLSearchParams();
  params.set("v", ui.version.value);
  params.set("style", ui.style.value);
  if (ui.lang.value === "main.c") params.set("lang", "c");
  if (ui.style.value === "file") params.set("config", encode(ui.config.value));
  params.set("code", encode(ui.input.value));
  history.replaceState(null, "", `#${params}`);
}

// ---- diff -----------------------------------------------------------------

// A line diff from the longest common subsequence. Returns rows of
// {kind: " " | "-" | "+", text, a, b} with 1-based line numbers.
function diffLines(before, after) {
  const a = before.split("\n");
  const b = after.split("\n");
  const n = a.length;
  const m = b.length;
  const width = m + 1;
  const lcs = new Uint32Array((n + 1) * width);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i * width + j] =
        a[i] === b[j]
          ? lcs[(i + 1) * width + j + 1] + 1
          : Math.max(lcs[(i + 1) * width + j], lcs[i * width + j + 1]);
    }
  }
  const rows = [];
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) {
      rows.push({ kind: " ", text: a[i], a: i + 1, b: j + 1 });
      i++;
      j++;
    } else if (i < n && (j === m || lcs[(i + 1) * width + j] >= lcs[i * width + j + 1])) {
      rows.push({ kind: "-", text: a[i], a: i + 1, b: "" });
      i++;
    } else {
      rows.push({ kind: "+", text: b[j], a: "", b: j + 1 });
      j++;
    }
  }
  // In each run of changed lines, show the removed lines before the added
  // ones, the way a unified diff reads.
  const ordered = [];
  let run = [];
  const flush = () => {
    ordered.push(...run.filter((r) => r.kind === "-"), ...run.filter((r) => r.kind === "+"));
    run = [];
  };
  for (const row of rows) {
    if (row.kind === " ") {
      flush();
      ordered.push(row);
    } else {
      run.push(row);
    }
  }
  flush();
  return ordered;
}

function renderDiff(rows) {
  const frag = document.createElement("div");
  frag.className = "cl-pg__lines";
  const changed = rows.map((r) => r.kind !== " ");
  const near = new Uint8Array(rows.length);
  changed.forEach((c, k) => {
    if (!c) return;
    for (let d = Math.max(0, k - CONTEXT); d <= Math.min(rows.length - 1, k + CONTEXT); d++) near[d] = 1;
  });
  let skipped = 0;
  const flushSkipped = () => {
    if (!skipped) return;
    const gap = document.createElement("div");
    gap.className = "cl-pg__gap";
    gap.textContent = `${skipped} unchanged line${skipped === 1 ? "" : "s"}`;
    frag.append(gap);
    skipped = 0;
  };
  rows.forEach((row, k) => {
    if (!near[k]) {
      skipped++;
      return;
    }
    flushSkipped();
    const line = document.createElement("div");
    line.className = "cl-pg__line" + (row.kind === "-" ? " cl-pg__line--del" : row.kind === "+" ? " cl-pg__line--add" : "");
    const numA = document.createElement("span");
    numA.className = "cl-pg__num";
    numA.textContent = row.a;
    const numB = document.createElement("span");
    numB.className = "cl-pg__num";
    numB.textContent = row.b;
    const sign = document.createElement("span");
    sign.className = "cl-pg__sign";
    sign.textContent = row.kind === " " ? "" : row.kind === "-" ? "−" : "+";
    const code = document.createElement("code");
    code.textContent = row.text || " ";
    line.append(numA, numB, sign, code);
    frag.append(line);
  });
  flushSkipped();
  ui.diff.replaceChildren(frag);
}

// ---- commands -------------------------------------------------------------

function renderCommands() {
  const v = ui.version.value;
  const style = ui.style.value;
  const file = ui.lang.value;
  ui.cmdLocal.textContent = [
    "pip install clang-tools",
    `clang-tools install clang-format --version ${v}`,
    `clang-format-${v} --style=${style} -i ${file}`,
  ].join("\n");
  // scripts/update-versions.py keeps this rev at the latest release.
  ui.cmdHooks.textContent = `- repo: https://github.com/cpp-linter/cpp-linter-hooks
  rev: v1.9.0
  hooks:
    - id: clang-format
      args: [--style=${style}, --version=${v}]`;
  ui.cmdAction.textContent = [
    "- uses: cpp-linter/cpp-linter-action@v2",
    "  with:",
    `    style: ${style}`,
    `    version: ${v}`,
  ].join("\n");
  ui.fileNote.hidden = style !== "file";
}

// ---- formatting -----------------------------------------------------------

// "clang-format version 21.1.8 (https://github.com/wasm-fmt/...)" -> "21.1.8"
function shortVersion(mod) {
  const match = /\d+\.\d+\.\d+/.exec(mod.version());
  return match ? match[0] : mod.version();
}

// clang-format prints why a style failed to stderr, which the WebAssembly
// build sends to console.error. Keep those lines while it runs. Releases up to
// 16 return the error as the result instead of throwing it.
function runFormat(mod, source, filename, style) {
  const printed = [];
  const original = console.error;
  console.error = (...args) => printed.push(args.join(" "));
  try {
    const result = mod.format(source, filename, style);
    if (/^Error (reading \.clang-format|parsing -style): /.test(result) && result !== source) {
      throw new Error(result);
    }
    return result;
  } catch (err) {
    const detail = printed.find((line) => line.trim() && !/^Error /.test(line)) || "";
    err.detail = detail.replace(/^error: /, "").trim();
    throw err;
  } finally {
    console.error = original;
  }
}

function setStatus(icon, text) {
  ui.status.innerHTML = icon;
  ui.status.append(document.createTextNode(text));
}

let run = 0;

async function update() {
  const ticket = ++run;
  const major = ui.version.value;
  const styleName = ui.style.value;
  const style = styleName === "file" ? ui.config.value : styleName;
  ui.configWrap.hidden = styleName !== "file";
  renderCommands();
  writeHash();

  let mod;
  if (!modules.has(major)) setStatus("", `Loading clang-format ${major}…`);
  try {
    mod = await loadVersion(major);
  } catch (err) {
    if (ticket !== run) return;
    setStatus(ICON_FAIL, `Could not load clang-format ${major} from jsDelivr. Check your connection and pick the version again.`);
    return;
  }
  if (ticket !== run) return;

  const source = ui.input.value;
  let formatted;
  try {
    formatted = runFormat(mod, source, ui.lang.value, style);
  } catch (err) {
    const message = String(err.message || err).replace(/: Invalid argument$/, "").trim();
    setStatus(ICON_FAIL, `clang-format ${shortVersion(mod)}: ${message}${err.detail ? ` (${err.detail})` : ""}.`);
    ui.diff.replaceChildren();
    ui.out.textContent = "";
    return;
  }

  const label = `clang-format ${shortVersion(mod)} with ${styleName === "file" ? "your .clang-format" : `--style=${styleName}`}`;
  ui.out.textContent = formatted;
  if (formatted === source) {
    setStatus(ICON_PASS, `Already formatted. ${label} changes nothing.`);
    ui.diff.replaceChildren();
    return;
  }
  const lines = Math.max(source.split("\n").length, formatted.split("\n").length);
  if (lines > MAX_DIFF_LINES) {
    setStatus(ICON_WARN, `${label} changes this file. It is too long to diff here: see Formatted.`);
    ui.diff.replaceChildren();
    return;
  }
  const rows = diffLines(source, formatted);
  const removed = rows.filter((r) => r.kind === "-").length;
  const added = rows.filter((r) => r.kind === "+").length;
  setStatus(ICON_WARN, `${label} changes ${removed} line${removed === 1 ? "" : "s"} into ${added}.`);
  renderDiff(rows);
}

let timer;
function scheduleUpdate() {
  clearTimeout(timer);
  timer = setTimeout(update, 250);
}

function showView(view) {
  const diff = view === "diff";
  ui.viewDiff.setAttribute("aria-pressed", String(diff));
  ui.viewOut.setAttribute("aria-pressed", String(!diff));
  ui.diff.hidden = !diff;
  ui.out.hidden = diff;
  ui.copyOut.hidden = diff;
}

async function copyText(button, text) {
  const label = button.textContent;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied";
  } catch {
    button.textContent = "Select and copy";
  }
  setTimeout(() => (button.textContent = label), 2000);
}

// ---- start ----------------------------------------------------------------

for (const [major, release] of VERSIONS) {
  const option = document.createElement("option");
  option.value = major;
  option.textContent = `${major} (clang-format ${release})`;
  ui.version.append(option);
}

const initial = readHash();
ui.version.value = initial.version || DEFAULT_VERSION;
ui.style.value = initial.style || "LLVM";
ui.lang.value = initial.lang || "main.cpp";
if (initial.config !== undefined) ui.config.value = initial.config;
ui.input.value = initial.code !== undefined ? initial.code : SAMPLE;

ui.version.addEventListener("change", update);
ui.style.addEventListener("change", update);
ui.lang.addEventListener("change", update);
ui.input.addEventListener("input", scheduleUpdate);
ui.config.addEventListener("input", scheduleUpdate);
ui.viewDiff.addEventListener("click", () => showView("diff"));
ui.viewOut.addEventListener("click", () => showView("out"));

// Tab inserts indentation instead of leaving the editor; Escape then Tab leaves it.
let escaped = false;
ui.input.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    escaped = true;
    return;
  }
  if (event.key === "Tab" && !event.shiftKey && !escaped) {
    event.preventDefault();
    ui.input.setRangeText("    ", ui.input.selectionStart, ui.input.selectionEnd, "end");
    scheduleUpdate();
  }
  escaped = false;
});

ui.share.addEventListener("click", () => {
  writeHash();
  copyText(ui.share, location.href);
});
ui.copyOut.addEventListener("click", () => copyText(ui.copyOut, ui.out.textContent));
for (const button of document.querySelectorAll(".cl-pg [data-copy]")) {
  button.addEventListener("click", () => copyText(button, $(button.dataset.copy).textContent));
}

update();
