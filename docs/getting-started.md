---
title: Get started
description: Set up cpp-linter-action, the cpp-linter pre-commit hooks, the cpp-linter command or the clang tools, with the LLVM version you pin.
hide:
  - navigation
---

# Get started

cpp-linter runs `clang-format` and `clang-tidy` on pull requests, in pre-commit hooks and on the
command line. Every tool reads the `.clang-format` and `.clang-tidy` files in your repository.
Their default LLVM versions differ, so set the same version in each.

| Where the checks run | Tool |
| --- | --- |
| On every pull request | [cpp-linter-action](#on-every-pull-request) |
| Before every commit | [cpp-linter-hooks](#before-every-commit) |
| Locally or in other CI | [cpp-linter](#locally-or-in-other-ci) |
| Just the clang tools | [clang-tools and packages](#just-the-clang-tools) |

## On every pull request

[cpp-linter-action](https://cpp-linter.github.io/cpp-linter-action/) checks the C and C++ files a
pull request changes. Save this as `.github/workflows/cpp-linter.yml`:

```yaml title=".github/workflows/cpp-linter.yml"
name: cpp-linter
on: pull_request

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
          format-review: true
      - name: Fail on lint errors
        if: steps.linter.outputs.checks-failed > 0
        run: exit 1
```

- `style: file` and `tidy-checks: ''` use your `.clang-format` and `.clang-tidy`. `version` takes
  an LLVM major from 12 to 23; `21` is the default.
- Annotations in the diff view are on by default. `format-review`, `tidy-review` and
  `thread-comments` are opt-in and need `pull-requests: write`; turn on one of the two reviews, not
  both. `auto-fix` commits the clang-format fixes to the branch and needs `contents: write`.
- The action does not fail the job by itself; the last step does, using the `checks-failed`
  output.
- Pull requests from forks get a read-only token: annotations still appear, but reviews are not
  posted, and `thread-comments` would fail the step. Draft pull requests get no review.

The [action docs](https://cpp-linter.github.io/cpp-linter-action/) list every input, output and
permission. [Moving to cpp-linter](blog/posts/2026-09-12-moving-to-cpp-linter.md) shows a
workflow with clang-tidy reviews and a compilation database.

## Before every commit

[cpp-linter-hooks](https://github.com/cpp-linter/cpp-linter-hooks) are pre-commit hooks that
pip-install the clang-format and clang-tidy version you pin:

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

Run `pre-commit install` once in each clone. `--version=21` installs the newest 21.x wheel;
clang-tidy wheels cover LLVM 13 to 22. The clang-tidy hook needs a `compile_commands.json`, which
it looks for in `build/` and a few other directories; leave it out if you only run clang-tidy in
CI. [Set up a clang-format pre-commit hook](blog/posts/2026-09-20-clang-format-pre-commit-hook.md)
walks through the whole setup.

## Locally or in other CI

[cpp-linter](https://cpp-linter.github.io/cpp-linter/) is the Python command behind the action:

```bash
pip install cpp-linter
cpp-linter --version=21 --style=file --tidy-checks=''
```

- It does not install the clang tools. Install them first, for example with clang-tools below;
  without them, `--version=21` falls back to whatever `clang-format` is on your PATH.
- It exits 0 even when checks fail, so it reports findings but does not fail a build.
- Locally, `--files-changed-only` and `--lines-changed-only` read `git diff`. In other CI, check
  the whole repository (the default): most CI systems set `CI=true`, and with it those options ask
  the GitHub API for the changed files.

cpp-linter v2, a rewrite in Rust ([cpp-linter-rs](https://github.com/cpp-linter/cpp-linter-rs)),
is in release candidates. Use the Python package until 2.0 is released.

## Just the clang tools

These install `clang-format`, `clang-tidy` and other LLVM tools without building LLVM. clang-tools,
asdf and the Homebrew tap use the same
[static binaries](https://github.com/cpp-linter/clang-tools-static-binaries/releases).

| Package | LLVM | Runs on | Install |
| --- | --- | --- | --- |
| [clang-tools](https://cpp-linter.github.io/clang-tools-pip/) | 12 to 23 | Linux, macOS, Windows | `pip install clang-tools`, then `clang-tools install clang-format clang-tidy --version 21` |
| [asdf plugin](https://github.com/cpp-linter/asdf-clang-tools) | 12 to 23 | wherever asdf runs | `asdf plugin add clang-format https://github.com/cpp-linter/asdf-clang-tools.git` |
| [Homebrew tap](https://github.com/cpp-linter/homebrew-tap) | 19 to 23 | macOS only | `brew install cpp-linter/tap/clang-format@21` |
| [Static binaries](https://github.com/cpp-linter/clang-tools-static-binaries/releases) | 12 to 23 | Linux, macOS, Windows on x86-64 and ARM64 | download from GitHub Releases |
| [Docker images](https://hub.docker.com/r/xianpengshen/clang-tools) | up to 22 | Docker | `docker pull xianpengshen/clang-tools:21` |

The static binaries include clang-format, clang-tidy, clang-query, clang-apply-replacements,
clang-include-cleaner (LLVM 18 and later), clang-scan-deps, llvm-cov, llvm-profdata and
llvm-symbolizer. The Docker images carry Ubuntu's clang-format and clang-tidy packages.

Single tools are also on PyPI as Python wheels: `clang-format` and `clang-tidy` (the wheels
cpp-linter-hooks installs), [clang-apply-replacements](https://pypi.org/project/clang-apply-replacements/)
(LLVM 16 and 17) and [clang-include-cleaner](https://pypi.org/project/clang-include-cleaner/)
(LLVM 22).
