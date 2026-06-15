# Getting Started

Welcome to cpp-linter! This guide will help you integrate C/C++ linting into your workflow quickly and efficiently.

## What is cpp-linter?

cpp-linter connects the standard LLVM linting tools, `clang-format` and `clang-tidy`, to the places where C/C++ projects need checks: pull requests, pre-commit hooks, local scripts, and CI jobs.

- `clang-format` checks formatting against a named style or your `.clang-format` file.
- `clang-tidy` runs static-analysis and modernization checks, usually configured by `.clang-tidy`.
- cpp-linter wraps those tools into integrations with consistent defaults, reporting, and failure controls.

## Choose Your Integration

<!-- markdownlint-disable MD033 -->

Select the method that best fits your development workflow:

| Use case | Recommended entry point |
| --- | --- |
| GitHub pull request checks | [cpp-linter-action](https://cpp-linter.github.io/cpp-linter-action/) |
| Local checks before commits | [cpp-linter-hooks](https://github.com/cpp-linter/cpp-linter-hooks) |
| Custom scripts or CI jobs | [cpp-linter CLI (Python)](https://pypi.org/project/cpp-linter/) |
| High-performance local runs | [cpp-linter-rs (Rust)](https://github.com/cpp-linter/cpp-linter-rs) |


<div class="grid cards" markdown>

- :material-github: **GitHub Actions**

    ---

    GitHub Action for automated C/C++ linting in your workflows

    **Perfect for:** CI/CD pipelines, automated PRs, team collaboration

    [Get started with GitHub Actions →](https://cpp-linter.github.io/cpp-linter-action/){ .md-button .md-button--primary }

- :material-git: **Pre-commit Hooks**

    ---

    Pre-commit hooks for automated C/C++ linting in your local development

    **Perfect for:** Catching issues before commits, local enforcement

    [Get started with pre-commit →](https://github.com/cpp-linter/cpp-linter-hooks){ .md-button .md-button--primary }

- :fontawesome-brands-python: **Command Line (Python)**

    ---

    Core Python package for cpp-linter-action behind the scenes

    **Perfect for:** Local development, custom scripts, one-off analysis

    [Get started with cpp-linter package →](https://pypi.org/project/cpp-linter/){ .md-button .md-button--primary }

- :simple-rust: **Command Line (Rust)**

    ---

    High-performance Rust implementation of cpp-linter

    **Perfect for:** Local development, custom scripts, one-off analysis

    [Get started with cpp-linter-rs →](https://github.com/cpp-linter/cpp-linter-rs){ .md-button .md-button--primary }

</div>

## Clang Tools — Simplified

We provide ready-to-use **binaries**, **Docker images**, and **Python wheels** of key clang tools:

<div class="grid cards" markdown>

- :fontawesome-brands-github: **clang-tools-static-binaries**

    ---

    Statically-linked `clang-format`, `clang-tidy`, `clang-query`, `clang-apply-replacements`, and `clang-include-cleaner` binaries for Linux, macOS, and Windows

    [Download from →](https://github.com/cpp-linter/clang-tools-static-binaries){ .md-button .md-button--primary }

- :fontawesome-brands-docker: **clang-tools-docker**

    ---

    Docker images with pre-installed `clang-format` and `clang-tidy`

    [Download from →](https://github.com/cpp-linter/clang-tools-docker){ .md-button .md-button--primary }

- :fontawesome-brands-python: **clang-tools-wheels**

    ---

    Redistribute `clang-format` and `clang-tidy` Python wheels

    [Download from →](https://github.com/cpp-linter/clang-tools-wheel){ .md-button .md-button--primary }

- :fontawesome-brands-python: **clang-apply-replacements**

    ---

    Standalone Python wheel for `clang-apply-replacements`

    [Download from →](https://github.com/cpp-linter/clang-apply-replacements){ .md-button .md-button--primary }

- :fontawesome-brands-python: **clang-include-cleaner**

    ---

    Standalone Python wheel for `clang-include-cleaner` — detects unused `#include` directives

    [Download from →](https://github.com/cpp-linter/clang-include-cleaner){ .md-button .md-button--primary }

</div>

## Easy Installation

<div class="grid cards" markdown>

- :fontawesome-brands-python: **clang-tools-pip**

    ---

    Install `clang-format`, `clang-tidy`, `clang-query`, `clang-apply-replacements`, and `clang-include-cleaner` via static binaries or Python wheels using a single CLI

    [Get started with clang-tools CLI →](https://cpp-linter.github.io/clang-tools-pip/){ .md-button .md-button--primary }

- :fontawesome-brands-python: **clang-tools-asdf**

    ---

    Easy installation of clang tools static binaries via asdf

    [Get started with asdf →](https://github.com/cpp-linter/asdf-clang-tools){ .md-button .md-button--primary }

</div>
