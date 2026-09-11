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

This is the problem the cpp-linter tools are built around: **pick one LLVM major version and use it
in every place code gets checked**.

## Pick the version once

Write it down somewhere visible, for example in `CONTRIBUTING.md`:

```text
Formatting and static analysis use LLVM 21 (clang-format 21, clang-tidy 21).
```

Everything below pins `21`. When you move to 22, change it in all places in one commit, reformat
the tree in the same commit, and the history stays clean.

## Pre-commit: cpp-linter-hooks

[cpp-linter-hooks](https://github.com/cpp-linter/cpp-linter-hooks) installs `clang-format` and
`clang-tidy` as Python wheels, so every contributor gets the same binary regardless of what their
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
        args: [--checks=.clang-tidy, --version=21]
```

`--style=file` and `--checks=.clang-tidy` read the same `.clang-format` and `.clang-tidy` files
that CI will use, so there is one source of truth for the rules as well as for the version.

## CI: cpp-linter-action

[cpp-linter-action](https://github.com/cpp-linter/cpp-linter-action) installs the requested
version itself; the workflow does not need `apt-get install clang-format-21` or a matching LLVM
apt repository. The `version` input takes the LLVM major version:

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
      - uses: actions/checkout@v5
      - uses: cpp-linter/cpp-linter-action@v2
        id: linter
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          version: '21'
          style: file
          tidy-checks: ''
          thread-comments: ${{ github.event_name == 'pull_request' && 'update' }}
      - name: Fail on lint errors
        if: steps.linter.outputs.checks-failed > 0
        run: exit 1
```

`style: file` and an empty `tidy-checks` tell the action to use `.clang-format` and
`.clang-tidy` from the repository, the same files pre-commit used a minute earlier on the
developer's machine. The result is a thread comment on the pull request that is updated on every
push instead of a new comment each time, plus file annotations in the diff view.

## Local one-off runs: clang-tools

Sometimes you want the binary itself: a quick `clang-format --dry-run` over a directory, or a
`clang-tidy` run with a hand-written compile database. [clang-tools](https://github.com/cpp-linter/clang-tools-pip)
downloads a statically linked binary for the exact major version and falls back to the Python
wheel when there is no binary for your platform:

```bash
pip install clang-tools
clang-tools install clang-format clang-tidy --version 21
clang-format-21 --version
```

The binaries come from [clang-tools-static-binaries](https://github.com/cpp-linter/clang-tools-static-binaries),
which publishes LLVM 12 through 23 for Linux, macOS and Windows, on x86-64 and ARM64. The same
release is what cpp-linter-action downloads in CI, so the bytes match.

## Containers and other package managers

The same versions are available as
[Docker images](https://github.com/cpp-linter/clang-tools-docker) tagged by major version:

```bash
docker run -v "$PWD":/src xianpengshen/clang-tools:21 clang-format --dry-run --Werror /src/main.cpp
```

The [Homebrew tap](https://github.com/cpp-linter/homebrew-tap) and the
[asdf plugin](https://github.com/cpp-linter/asdf-clang-tools) are built from the same static
binaries, for teams that already manage tool versions that way:

```bash
brew install cpp-linter/tap/clang-format@21 cpp-linter/tap/clang-tidy@21
```

## Upgrading

When LLVM 22 is the version you want:

1. Change `21` to `22` in `.pre-commit-config.yaml`, the workflow and `CONTRIBUTING.md`.
2. Run `pre-commit run clang-format --all-files` and commit the reformatted tree together with the
   version change.
3. Open the pull request. cpp-linter-action runs with 22 and should report nothing, because the
   tree was formatted with the same version a moment ago.

If the action reports differences at this point, the two tools are not on the same version, and
the numbers above are the first thing to check.

## Why this matters more for clang-tidy

`clang-format` version drift produces noisy diffs. `clang-tidy` version drift produces *different
findings*: checks that were added, renamed or made stricter. A pull request that passes locally and
fails in CI with a check nobody has heard of is usually a version mismatch, not a code problem.
Pinning the same major version in the hook and in the action turns "why does CI complain" into a
deterministic question.
