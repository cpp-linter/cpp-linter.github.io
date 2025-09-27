---
hide:
  - navigation
  - toc
---

<div class="hero" markdown>

# C/C++ linting that simply works

**Professional static analysis for C/C++ code – automated, configurable, and fast. Integrate seamlessly into any workflow in minutes.**

[Get started :material-rocket-launch:](getting-started.md){ .md-button .md-button--primary }

</div>

<div class="grid cards" markdown>

-   :material-github: **GitHub Action**

    ---

    Automated C++ linting in your CI/CD pipelines with zero configuration

    [:octicons-arrow-right-24: cpp-linter-action](https://cpp-linter.github.io/cpp-linter-action/)

-   :material-git: **Pre-commit Hooks**

    ---

    Catch issues before they reach your repository with Git hooks

    [:octicons-arrow-right-24: cpp-linter-hooks](https://github.com/cpp-linter/cpp-linter-hooks)

-   :fontawesome-brands-python: **Python Package**

    ---

    Powerful command-line tool and Python API for local development

    [:octicons-arrow-right-24: cpp-linter](https://cpp-linter.github.io/cpp-linter/)


</div>

## Everything you need for C/C++ code quality

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

## Clang Tools Made Simple

**No more complex installations or version conflicts.** Get `clang-format`, `clang-tidy`, `clang-query`, and more through your favorite package manager:

<div class="grid" markdown>

<div class="card-content" markdown>
### :fontawesome-brands-python: **pip**
```bash
pip install clang-tools
clang-tools --install 20
```
[:octicons-arrow-right-24: clang-tools-pip](https://github.com/cpp-linter/clang-tools-pip)
</div>

<div class="card-content" markdown>
### :material-docker: **Docker**  
```bash
docker pull xianpengshen/clang-tools
```
[:octicons-arrow-right-24: clang-tools-docker](https://github.com/cpp-linter/clang-tools-docker)
</div>

<div class="card-content" markdown>
### :material-download: **Python Wheels**
```bash
pip install clang-<name>-<version>.whl
```
[:octicons-arrow-right-24: clang-tools-wheel](https://github.com/cpp-linter/clang-tools-wheel)
</div>

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
