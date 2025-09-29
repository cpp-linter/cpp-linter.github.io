---
hide:
  - navigation
  - toc
template: home.html
---

<!-- markdownlint-disable MD041 MD033 MD036 -->

## Everything you need for linting C/C++ code

<div class="grid cards" markdown>

- :material-chart-line: **Built in Open Source**

    ---

    Open-source and MIT-licensed. Bringing contributors together to empower impactful C/C++ lint projects in open source and beyond.

- :material-cog: **Zero Configuration**

    ---

    Works out of the box with sensible defaults. Advanced users can customize every aspect to match their coding standards.

- :material-devices: **Works Everywhere**

    ---

    GitHub Actions, Pre-commit, Command Line, Docker containers and more – integrate anywhere your code lives.

</div>

<div class="grid" markdown>

</div>

## Trusted by developers worldwide

<div class="trusted-by" markdown>

**Join thousands of developers and organizations using cpp-linter in production**

<div class="logo-grid">
  <div class="logo-item">
    <img src="https://github.com/microsoft.png" alt="Microsoft" title="Microsoft">
    <span>Microsoft</span>
  </div>
  <div class="logo-item">
    <img src="https://github.com/apache.png" alt="Apache" title="Apache">
    <span>Apache</span>
  </div>
  <div class="logo-item">
    <img src="https://github.com/nasa.png" alt="NASA" title="NASA">
    <span>NASA</span>
  </div>
  <div class="logo-item">
    <img src="https://github.com/samsung.png" alt="Samsung" title="Samsung">
    <span>Samsung</span>
  </div>
  <div class="logo-item">
    <img src="https://github.com/TheAlgorithms.png" alt="TheAlgorithms" title="TheAlgorithms">
    <span>TheAlgorithms</span>
  </div>
  <div class="logo-item">
    <img src="https://github.com/Nextcloud.png" alt="Nextcloud" title="Nextcloud">
    <span>Nextcloud</span>
  </div>
  <div class="logo-item">
    <img src="https://github.com/Jupyter.png" alt="Jupyter" title="Jupyter">
    <span>Jupyter</span>
  </div>
  <div class="logo-item">
    <img src="https://github.com/CachyOS.png" alt="CachyOS" title="CachyOS">
    <span>CachyOS</span>
  </div>
</div>

<!-- <div class="stats-grid">
  <div class="stat">
    <strong>1,000+</strong>
    <span>GitHub Users</span>
  </div>
  <div class="stat">
    <strong>20K+</strong>
    <span>Downloads/Month</span>
  </div>
  <div class="stat">
    <strong>50+</strong>
    <span>Contributors</span>
  </div>
</div> -->

</div>

## Quick Start

=== "GitHub Actions"

    Add cpp-linter-action to your workflow in seconds:

    ```yaml
    steps:
      - uses: actions/checkout@v5
      - uses: cpp-linter/cpp-linter-action@v2
        id: linter
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          style: 'file'  # Use .clang-format config file
          tidy-checks: '' # Use .clang-tidy config file
          # only 'update' a single comment in a pull request thread.
          thread-comments: ${{ github.event_name == 'pull_request' && 'update' }}
      - name: Fail fast?!
        if: steps.linter.outputs.checks-failed > 0
        run: exit 1
    ```
=== "Pre-commit"

    Add to your `.pre-commit-config.yaml`:

    ```yaml
    repos:
      - repo: https://github.com/cpp-linter/cpp-linter-hooks
        rev: v1.1.3  # Use the tag or commit you want
        hooks:
        - id: clang-format
            args: [--style=Google] # Other coding style: LLVM, GNU, Chromium, Microsoft, Mozilla, WebKit.
        - id: clang-tidy
            args:
              - --checks='boost-*
              - bugprone-*
              - performance-*
              - readability-*
              - portability-*
              - modernize-*
              - clang-analyzer-*
              - cppcoreguidelines-*'
    ```

=== "Command Line"

    Install and run locally:

    ```bash
    pip install cpp-linter
    cpp-linter --style=file --tidy-checks='-*,readability-*' src/
    ```

---

<div class="community-section" markdown>

## Join Our Community

**Be part of a growing ecosystem of C/C++ developers who care about code quality.**

[GitHub Discussions :fontawesome-brands-github:](https://github.com/cpp-linter/cpp-linter/discussions){ .md-button }
<!-- [Discord Community :fontawesome-brands-discord:](https://discord.gg/cpp-linter){ .md-button }
[Stack Overflow :fontawesome-brands-stack-overflow:](https://stackoverflow.com/questions/tagged/cpp-linter){ .md-button } -->

</div>
