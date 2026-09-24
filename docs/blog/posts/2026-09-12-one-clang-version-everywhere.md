---
date:
  created: 2026-09-12
categories:
  - Guides
tags:
  - clang-format
  - clang-tidy
  - cpp-linter-action
  - cpp-linter-hooks
  - clang-tools
authors:
  - shenxianpeng
description: >-
  Use the same LLVM major version for clang-format and clang-tidy in pre-commit, in
  cpp-linter-action and on your laptop, and upgrade it in one commit.
---

# One clang-format version everywhere: pre-commit, CI and your laptop

A pull request fails the format check. The author runs `clang-format -i` locally, pushes, and it
fails again with a different diff. Nothing is wrong with the code. The laptop has clang-format 18,
CI installed 21 from a package repository last week, and the reviewer's editor plugin ships 19.

Every major LLVM release changes clang-format's output in small ways: new style options, changed
defaults, fixed bugs. `clang-tidy` is worse, because new checks appear and old ones move between
categories. Pinning the *project* version of a linter wrapper does not help if the wrapper pulls
whatever clang happens to be around.

<!-- more -->

The cpp-linter tools are built to pick one LLVM major version and use it in every place code gets
checked.

## Pick the version once

Write it down somewhere visible, for example in `CONTRIBUTING.md`:

```text
Formatting and static analysis use LLVM 21 (clang-format 21, clang-tidy 21).
```

Everything below pins `21`. Pick a major every tool has: the clang-tidy hook covers LLVM 13 to 22,
the action and clang-tools 12 to 23.

## Pre-commit: cpp-linter-hooks

[cpp-linter-hooks](https://github.com/cpp-linter/cpp-linter-hooks) installs `clang-format` and
`clang-tidy` as Python wheels, so every contributor gets the same release regardless of what their
distribution ships. The `rev` is the hooks release; the tool version is a separate `--version`
argument:

```yaml title=".pre-commit-config.yaml"
repos:
  - repo: https://github.com/cpp-linter/cpp-linter-hooks
    rev: v1.6.0
    hooks:
      - id: clang-format
        args: [--style=file, --version=21]
      - id: clang-tidy
        args: [--version=21]
```

`21` means the newest 21.x wheel on PyPI, looked up on each run, so the two hooks can land on
different patch releases of 21. `--style=file` reads `.clang-format`, and clang-tidy finds
`.clang-tidy` by itself: the hooks read the same files CI will use, so the rules, like the version,
are defined in one place. The clang-tidy hook needs a `compile_commands.json`; if your build does
not produce one before commit time, run clang-tidy only in CI.

## CI: cpp-linter-action

[cpp-linter-action](https://github.com/cpp-linter/cpp-linter-action) installs the requested
version itself; the workflow does not need `apt-get install clang-format-21` or a matching LLVM
apt repository. The `version` input takes only the LLVM major version. It also accepts a path to
tools you installed yourself, or an empty string for whatever the runner has; the
[input reference](https://cpp-linter.github.io/cpp-linter-action/inputs-outputs/#version) has the
details.

```yaml title=".github/workflows/lint.yml"
name: cpp-linter
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  cpp-linter:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v7
      - uses: cpp-linter/cpp-linter-action@v2
        id: linter
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          version: '21'
          style: file
          tidy-checks: ''
          thread-comments: ${{ github.event_name == 'pull_request' && github.event.pull_request.head.repo.full_name == github.repository && 'update' }}
      - name: Fail on lint errors
        if: steps.linter.outputs.checks-failed > 0
        run: exit 1
```

`style: file` and an empty `tidy-checks` tell the action to use `.clang-format` and
`.clang-tidy` from the repository, the same files pre-commit used a minute earlier on the
developer's machine. The result is file annotations in the diff view, plus a thread comment on the
pull request that is edited on each push while there are findings and removed once they are fixed.
Pull requests from forks get a read-only token, and posting the comment would fail the step, so
the condition leaves the comment off for them.

## Local one-off runs: clang-tools

Sometimes you want the binary itself: a quick `clang-format --dry-run` over a few files, or a
`clang-tidy` run with a hand-written compile database. [clang-tools](https://github.com/cpp-linter/clang-tools-pip)
downloads the static binary for that LLVM major (21.1.0 for 21) unless a `clang-format-21` is
already on your PATH, and falls back to the PyPI wheel if the download fails. In a virtualenv:

```bash
pip install clang-tools
clang-tools install clang-format clang-tidy --version 21
clang-format-21 --version
```

The binaries come from [clang-tools-static-binaries](https://github.com/cpp-linter/clang-tools-static-binaries),
which publishes a rolling window of recent LLVM majors for Linux, macOS and Windows, on x86-64 and
ARM64; each release lists its exact versions in
[`versions.json`](https://github.com/cpp-linter/clang-tools-static-binaries/releases/latest/download/versions.json).
cpp-linter-action uses the runner's package manager where it can: apt on Linux, Homebrew's
`llvm@21` on macOS, these binaries on Windows. Every place runs clang-format 21, but not always the
same patch release.

## Containers and other package managers

[Docker images](https://github.com/cpp-linter/clang-tools-docker) carry Ubuntu's clang-format and
clang-tidy packages, tagged by major version up to 22:

```bash
docker run --rm -v "$PWD":/src xianpengshen/clang-tools:21 clang-format --dry-run --Werror /src/main.cpp
```

On macOS, the [Homebrew tap](https://github.com/cpp-linter/homebrew-tap) (LLVM 19 to 23) installs
the same static binaries; the [asdf plugin](https://github.com/cpp-linter/asdf-clang-tools) does so
on every platform, for teams that already manage tool versions that way:

```bash
brew install cpp-linter/tap/clang-format@21 cpp-linter/tap/clang-tidy@21
```

## Upgrading

When LLVM 22 is the version you want, change it everywhere in one commit:

1. Change `21` to `22` in `.pre-commit-config.yaml`, the workflow and `CONTRIBUTING.md`.
2. Run `pre-commit run clang-format --all-files` and commit the reformatted tree together with the
   version change.
3. Open the pull request. cpp-linter-action runs with 22 and should report nothing, because the
   tree was formatted with the same major version a moment ago.

If the action does report differences, compare the exact releases: the action's log prints the one
it ran (`clang-format-22 --version`), and the hook uses the newest 22.x wheel. `clang-tidy` drifts
more than `clang-format`: a new major adds, renames and tightens checks, so a pull request that
passes locally and fails in CI with a check nobody has heard of usually means the two version
numbers above differ.
