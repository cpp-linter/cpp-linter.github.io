# cpp-linter.github.io

[![Website](https://img.shields.io/static/v1?logo=googlechrome&logoColor=white&label=Website&message=cpp-linter.github.io&color=yellow)](https://cpp-linter.github.io/)
[![GitHub Org](https://img.shields.io/badge/github-cpp--linter-181717?logo=github)](https://github.com/cpp-linter)
[![License](https://img.shields.io/github/license/cpp-linter/cpp-linter.github.io)](LICENSE)
[![MkDocs](https://img.shields.io/badge/docs-MkDocs%20Material-526CFE?logo=materialformkdocs&logoColor=white)](https://cpp-linter.github.io/)

Documentation website for the `cpp-linter` project and organization.

This repository hosts the public site at <https://cpp-linter.github.io/>, including the homepage, getting started guides, and community links for the C/C++ linting ecosystem around `cpp-linter`.

## Website

- Main site: <https://cpp-linter.github.io/>
- GitHub organization: <https://github.com/cpp-linter>

## What You'll Find

- Project overview and landing page content
- Getting started documentation
- "Why cpp-linter?": how the toolchain compares with other clang-format / clang-tidy actions and hooks
- Showcase of open-source projects that use cpp-linter
- Blog posts and guides
- Links to the clang tools packages (pip, Homebrew, asdf, static binaries, Docker images, wheels)
- Community entry points and the sponsor page

## Build

```bash
pipx run nox -s docs       # build into site/
pipx run nox -s docs-live  # preview with live reload
```

## Files other projects use

Other repositories load these files from the published site, so do not rename or remove them
without updating those repositories:

- `docs/stylesheets/shared.css`, served at <https://cpp-linter.github.io/stylesheets/shared.css>,
  is loaded by the docs sites of cpp-linter-action, cpp-linter, clang-tools-pip and cpp-linter-rs.
- `docs/install-wheel.sh`, served at <https://cpp-linter.github.io/install-wheel.sh>, is used by
  the clang-tools-wheel README and its release workflow.
