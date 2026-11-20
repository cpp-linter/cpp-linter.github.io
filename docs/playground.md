---
title: clang-format playground
description: Paste C or C++ code, pick an LLVM version from 16 to 23 and a style, and see what clang-format changes. It runs in your browser.
template: playground.html
hide:
  - navigation
  - toc
---

# clang-format playground

Paste C or C++ code, pick an LLVM version and a style, and see what clang-format changes.
clang-format runs in your browser as WebAssembly, so your code is not sent anywhere.

<div class="cl-pg" id="cl-pg">
  <div class="cl-pg__controls">
    <label class="cl-pg__field">
      <span>LLVM version</span>
      <select id="cl-pg-version"></select>
    </label>
    <label class="cl-pg__field">
      <span>Style</span>
      <select id="cl-pg-style">
        <option value="LLVM">LLVM</option>
        <option value="Google">Google</option>
        <option value="Chromium">Chromium</option>
        <option value="Mozilla">Mozilla</option>
        <option value="WebKit">WebKit</option>
        <option value="Microsoft">Microsoft</option>
        <option value="GNU">GNU</option>
        <option value="file">My .clang-format</option>
      </select>
    </label>
    <label class="cl-pg__field">
      <span>Language</span>
      <select id="cl-pg-lang">
        <option value="main.cpp">C++</option>
        <option value="main.c">C</option>
      </select>
    </label>
    <button type="button" class="md-button" id="cl-pg-share">Copy link</button>
  </div>

  <label class="cl-pg__config" id="cl-pg-config-wrap" hidden>
    <span>.clang-format</span>
    <textarea id="cl-pg-config" spellcheck="false" wrap="off" rows="6">BasedOnStyle: LLVM
IndentWidth: 4
ColumnLimit: 100</textarea>
  </label>

  <div class="cl-pg__panes">
    <label class="cl-pg__pane">
      <span class="cl-pg__pane-title">Your code</span>
      <textarea id="cl-pg-input" spellcheck="false" wrap="off" autocomplete="off" autocapitalize="off"></textarea>
    </label>
    <section class="cl-pg__pane" aria-labelledby="cl-pg-result-title">
      <div class="cl-pg__pane-head">
        <span class="cl-pg__pane-title" id="cl-pg-result-title">What clang-format changes</span>
        <div class="cl-pg__head-actions">
          <button type="button" class="cl-pg__copy" id="cl-pg-copy-out" hidden>Copy</button>
          <div class="cl-pg__tabs" role="group" aria-label="Result view">
            <button type="button" class="cl-pg__tab" id="cl-pg-view-diff" aria-pressed="true">Diff</button>
            <button type="button" class="cl-pg__tab" id="cl-pg-view-out" aria-pressed="false">Formatted</button>
          </div>
        </div>
      </div>
      <p class="cl-pg__status" id="cl-pg-status" role="status">Loading clang-format…</p>
      <div class="cl-pg__result" id="cl-pg-diff"></div>
      <pre class="cl-pg__result cl-pg__code" id="cl-pg-out" hidden></pre>
    </section>
  </div>

  <h2 id="run-the-same-check">Run the same check</h2>
  <p>These use the version and style picked above.</p>
  <div class="cl-pg__cmds">
    <figure class="cl-pg__cmd">
      <figcaption>
        <span>On your machine, with <a href="https://cpp-linter.github.io/clang-tools-pip/">clang-tools</a></span>
        <button type="button" class="cl-pg__copy" data-copy="cl-pg-cmd-local">Copy</button>
      </figcaption>
      <pre class="cl-pg__code" id="cl-pg-cmd-local"></pre>
    </figure>
    <figure class="cl-pg__cmd">
      <figcaption>
        <span>Before every commit, in <code>.pre-commit-config.yaml</code> with <a href="https://github.com/cpp-linter/cpp-linter-hooks">cpp-linter-hooks</a></span>
        <button type="button" class="cl-pg__copy" data-copy="cl-pg-cmd-hooks">Copy</button>
      </figcaption>
      <pre class="cl-pg__code" id="cl-pg-cmd-hooks"></pre>
    </figure>
    <figure class="cl-pg__cmd">
      <figcaption>
        <span>On every pull request, with <a href="https://cpp-linter.github.io/cpp-linter-action/">cpp-linter-action</a></span>
        <button type="button" class="cl-pg__copy" data-copy="cl-pg-cmd-action">Copy</button>
      </figcaption>
      <pre class="cl-pg__code" id="cl-pg-cmd-action"></pre>
    </figure>
  </div>
  <p class="cl-pg__note" id="cl-pg-file-note" hidden>Save the configuration above as <code>.clang-format</code> in the root of your repository first.</p>
</div>

<noscript>The playground needs JavaScript and WebAssembly.</noscript>

The WebAssembly builds of clang-format come from the
[@wasm-fmt/clang-format](https://www.npmjs.com/package/@wasm-fmt/clang-format) npm package and are
loaded from jsDelivr when you open this page. Their patch release can differ from the one
cpp-linter installs for the same LLVM version. The playground has no clang-tidy: it needs the
compile flags and headers of a real build.
