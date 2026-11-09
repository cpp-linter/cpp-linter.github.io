---
date:
  created: 2026-11-09
categories:
  - Guides
tags:
  - clang-format
  - github-actions
  - cpp-linter-action
  - cpp-linter-hooks
authors:
  - shenxianpeng
description: >-
  After ubuntu-latest moved to Ubuntu 26.04, the runner's default clang-format went from 18
  to 21 and format checks started failing on unchanged code. Pin the version in your repository.
---

# clang-format changed under you: ubuntu-latest is now Ubuntu 26.04

If your clang-format CI check started failing on lines nobody touched, and your workflow says
`runs-on: ubuntu-latest`, the code probably didn't change. The formatter did.

<!-- more -->

## The symptom

A format check that was green for months suddenly reports dozens of violations, usually in
files the pull request never edited:

```text
src/socket_identity.cpp:129:23: error: code should be clang-formatted [-Wclang-format-violations]
```

Or the job doesn't get that far, because a versioned binary it called is gone:

```text
clang-format-18: command not found
```

Nothing in `.clang-format` changed and nobody reformatted anything. The only difference is the
machine the job ran on.

## Why it happens

GitHub is moving the `ubuntu-latest` label from Ubuntu 24.04 to Ubuntu 26.04. The rollout
started on October 19, 2026 and is planned to finish by November 19, 2026
([runner-images#14748](https://github.com/actions/runner-images/issues/14748)). During those
weeks the same workflow can land on either image, so a check can pass on one run and fail on
the next.

The two releases ship different default clang-format versions:

| Ubuntu release | `clang-format` package (default) | Source |
| --- | --- | --- |
| 24.04 (noble) | 18 | [packages.ubuntu.com](https://packages.ubuntu.com/noble/clang-format) |
| 26.04 (resolute) | 21 | [packages.ubuntu.com](https://packages.ubuntu.com/resolute/clang-format) |

clang-format does not promise identical output across major versions, so the same
`.clang-format` file can lay out the same code differently under 21 than under 18. A job that
runs plain `clang-format` (or `apt install clang-format`) quietly picks up the new version.

A job that calls `clang-format-18` breaks in a different way. Ubuntu 26.04 still has a
`clang-format-18` package in its archive, but the 26.04 runner image doesn't preinstall it, so
the command is simply missing.

The root problem is the same in both cases: the formatter version comes from the runner image,
not from your repository.

## It's already happening

In the first weeks of the rollout, several open-source C and C++ projects hit exactly this:

| Project | What happened |
| --- | --- |
| [nnstreamer#5169](https://github.com/nnstreamer/nnstreamer/issues/5169) | The static-checks job installed clang-format from the runner's apt archive with no pin. On 26.04 it jumped from 18 to 21.1.6, and pull requests failed on lines they didn't change. 14 of 149 C++ files would be reformatted. |
| [AntHocNet#848](https://github.com/swarm-routing/AntHocNet/issues/848) | The first try on 26.04 failed with `clang-format-18: command not found` (exit 127). The `.clang-format` file was tuned for 18, so switching versions wasn't an option. |
| [libtmux-cxx#148](https://github.com/libtmux/libtmux-cxx/issues/148) | One of five causes of a red CI on `ubuntu-latest`: the lint job reported 62 lines of `-Wclang-format-violations`, with no code change behind them. |
| [pgagroal#1099](https://github.com/pgagroal/pgagroal/issues/1099) | A related failure: the format check installs from apt.llvm.org, and a short DNS outage there failed the whole pipeline, since every job depends on it. |

The usual first fix is to pin the job back to `runs-on: ubuntu-24.04`. That buys time, but
24.04 will be retired too, and the next image change will bring the same problem back.

## The fix: pin clang-format in your repository

Make the version a line in your repository, so that changing the runner image can't change it.
Pick whichever of these matches how you already run the check.

### Option 1: the PyPI wheel, in any script

clang-format is published on PyPI as a wheel for Linux, macOS and Windows, so one line installs
the exact release on every runner image:

```sh
pip install clang-format==18.1.8
clang-format --version   # clang-format version 18.1.8
```

The wheel installs the command as plain `clang-format`, not `clang-format-18`, so scripts that
call the versioned name need a one-word change. It also doesn't depend on apt.llvm.org being
reachable.

### Option 2: cpp-linter-action, in GitHub Actions

[cpp-linter-action](https://github.com/cpp-linter/cpp-linter-action) installs the clang-format
major you ask for itself, so the runner image doesn't matter:

```yaml
- uses: cpp-linter/cpp-linter-action@v2
  id: linter
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    version: '18'      # the clang-format major your style was tuned for
    style: file        # use your .clang-format
    tidy-checks: '-*'  # format check only
- if: steps.linter.outputs.checks-failed > 0
  run: exit 1
```

nnstreamer's own `cpp-linter.yml` workflow kept working through the switch for this reason: it
sets the version itself.

### Option 3: cpp-linter-hooks, in pre-commit

If the CI job runs `pre-commit run --all-files`, pin the version in the hook. Contributors then
get the same binary locally too:

```yaml
repos:
  - repo: https://github.com/cpp-linter/cpp-linter-hooks
    rev: v1.8.4
    hooks:
      - id: clang-format
        args: [--style=file, --version=18]
```

`--version=18` takes the newest 18.x release, and `--version=18.1.8` pins the exact one. For
keeping pre-commit, CI and laptops on the same version, see
[One clang-format version everywhere](2026-09-12-one-clang-version-everywhere.md).

## Moving to a newer clang-format on purpose

Pinning doesn't mean staying on 18 forever. It means upgrading when you decide to, in one pull
request:

1. Bump the pin to the new version (for example `21.1.8`, or `version: '21'`).
2. Reformat the whole tree with that version, in a commit that contains only formatting.
3. Add that commit's hash to `.git-blame-ignore-revs`, so `git blame` skips it.
4. Mention the new version in your contributing guide.

After that, the next runner image change is a non-event for your format check. Use
`ubuntu-latest` or `ubuntu-26.04` for everything else, and let the pin decide which
clang-format runs.
