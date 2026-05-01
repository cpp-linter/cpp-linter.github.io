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
| Custom scripts or CI jobs | [cpp-linter CLI](https://cpp-linter.github.io/cpp-linter/) |
| High-performance local runs | [cpp-linter-rs](https://cpp-linter.github.io/cpp-linter-rs/) |


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

- :fontawesome-brands-python: **Command Line**

    ---

    Core Python package for cpp-linter-action behind the scenes

    **Perfect for:** Local development, custom scripts, one-off analysis

    [Get started with cpp-linter package →](https://cpp-linter.github.io/cpp-linter/){ .md-button .md-button--primary }

- :simple-rust: **Command Line (Rust)**

    ---

    High-performance Rust implementation of cpp-linter

    **Perfect for:** Local development, custom scripts, one-off analysis

    [Get started with cpp-linter-rs →](https://cpp-linter.github.io/cpp-linter-rs/){ .md-button .md-button--primary }

</div>

## Clang Tools Distribution

<div class="grid cards" markdown>

- :fontawesome-brands-github: **clang-tools-static-binaries**

    ---

    Distribution clang tools static binaries for various platforms

    [Download from →](https://github.com/cpp-linter/clang-tools-static-binaries){ .md-button .md-button--primary }

- :fontawesome-brands-docker: **clang-tools-docker**

    ---

    Distribution clang tools Docker images for various platforms

    [Download from →](https://github.com/cpp-linter/clang-tools-docker){ .md-button .md-button--primary }

- :fontawesome-brands-python: **clang-tools-wheels**

    ---

    Distribution clang tools Python wheels for various platforms

    [Download from →](https://github.com/cpp-linter/clang-tools-wheel){ .md-button .md-button--primary }

</div>

## Easy Installation

<div class="grid cards" markdown>

- :fontawesome-brands-python: **clang-tools-pip**

    ---

    Easy installation of clang tools static binaries via pip

    [Get started with clang-tools CLI →](https://cpp-linter.github.io/clang-tools-pip/){ .md-button .md-button--primary }

- :fontawesome-brands-python: **clang-tools-asdf**

    ---

    Easy installation of clang tools static binaries via asdf

    [Get started with asdf →](https://github.com/cpp-linter/asdf-clang-tools){ .md-button .md-button--primary }

</div>
