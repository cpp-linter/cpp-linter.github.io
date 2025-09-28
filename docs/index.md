---
hide:
  - navigation
  - toc
---

<div class="hero" markdown>

# C/C++ linting that simply works

**Lint your C/C++ code in workflow – automated, configurable, and fast. Integrate seamlessly into any workflow in minutes.**

[Get started :material-rocket-launch:](getting-started.md){ .md-button .md-button--primary }

</div>

<div class="grid cards" markdown>

</div>

## Everything you need for linting C/C++ code

<div class="grid cards" markdown>

-   :material-chart-line: **Built in Open Source**

    ---

    Open-source and permissively licensed. Bringing contributors together to empower impactful C/C++ lint projects in open source and beyond.

-   :material-cog: **Zero Configuration**

    ---

    Works out of the box with sensible defaults. Advanced users can customize every aspect to match their coding standards.

-   :material-devices: **Works Everywhere**

    ---

    GitHub Actions, Pre-commit, Command Line, Docker containers – integrate anywhere your code lives.

</div>

<div class="grid" markdown>

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
            args: [--checks='boost-*,bugprone-*,performance-*,readability-*,portability-*,modernize-*,clang-analyzer-*,cppcoreguidelines-*']
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
