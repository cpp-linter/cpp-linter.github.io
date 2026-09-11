---
date:
  created: 2026-09-12
categories:
  - Guides
tags:
  - cpp-linter-action
  - clang-format
  - clang-tidy
  - migration
authors:
  - shenxianpeng
---

# Moving from clang-format-action and clang-tidy-review to cpp-linter

A common C++ workflow on GitHub has two lint jobs that grew up separately: a format check that
fails the build, and a clang-tidy job that posts review comments. They pin different clang
versions, they run on different triggers, and when one of them starts flaking nobody remembers why
it was configured that way. This post walks through replacing both with one cpp-linter-action step,
and what changes for contributors.

<!-- more -->

## The starting point

Two jobs, two actions, two versions of clang:

```yaml title=".github/workflows/lint.yml (before)"
jobs:
  format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: jidicula/clang-format-action@v4.18.0
        with:
          clang-format-version: '17'
          check-path: 'src'

  tidy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - run: cmake -B build -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
      - uses: ZedThree/clang-tidy-review@v0.23.1
        with:
          clang_tidy_version: '21'
          build_dir: build
          config_file: .clang-tidy
      - uses: ZedThree/clang-tidy-review/upload@v0.23.1
```

The format job fails with a diff in the log; the tidy job builds a Docker image, runs, uploads an
artifact, and a second workflow posts the review. Contributors see a red check for formatting and a
review for clang-tidy, and format fixes still have to be made by hand.

## The replacement

```yaml title=".github/workflows/lint.yml (after)"
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
      - run: cmake -B build -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
      - uses: cpp-linter/cpp-linter-action@v2
        id: linter
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          version: '21'
          style: file
          tidy-checks: ''
          database: build
          lines-changed-only: true
          format-review: true
          tidy-review: true
          thread-comments: ${{ github.event_name == 'pull_request' && 'update' }}
      - name: Fail on lint errors
        if: steps.linter.outputs.checks-failed > 0
        run: exit 1
```

What each input replaces:

| Before | After | Notes |
| --- | --- | --- |
| `clang-format-version: '17'` and `clang_tidy_version: '21'` | `version: '21'` | One LLVM major for both tools. Reformat the tree once when you unify. |
| `check-path: 'src'` | default `files-changed-only: true` | Only files touched by the pull request are checked. Use `ignore` to exclude directories. |
| `config_file: .clang-tidy` | `tidy-checks: ''` | Empty means "use `.clang-tidy`". `style: file` does the same for `.clang-format`. |
| `build_dir: build` | `database: build` | Directory that holds `compile_commands.json`. |
| the `upload` step and post workflow | `tidy-review: true` | Reviews are posted from the same job. |
| the failing format job | `format-review: true` | Formatting differences become review suggestions a contributor can apply from the browser. |

The `checks-failed` output plus the final `exit 1` step keeps the red check for anything not fixed.
`thread-comments: update` keeps a single summary comment on the pull request and rewrites it on
every push instead of adding a new one.

## Adopting a strict `.clang-tidy` on an old code base

The usual reason teams keep clang-tidy out of pull requests is the first run: thousands of
findings in files nobody is touching. Two inputs handle that:

- `files-changed-only: true` (the default) limits analysis to files in the pull request.
- `lines-changed-only: true` limits reported clang-tidy findings to lines the pull request changed.

With both set, a pull request only hears about the code it wrote. The rest of the tree gets cleaned
up gradually, or in a dedicated pass with the `cpp-linter` CLI.

## What contributors see

- Formatting problems show up as review suggestions. Clicking "Commit suggestion" fixes them
  without a local round trip.
- clang-tidy findings appear as review comments on the changed lines, with the check name, and as
  annotations in the "Files changed" tab.
- One thread comment summarizes the run and is updated in place.

## Keep the local side in sync

Add the pre-commit hooks with the same version, so the same clang-format runs before the commit
exists:

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

Contributors who use the hook never see the review suggestions, because there is nothing left to
suggest. The action becomes the safety net for everyone else.

## Things to check after switching

- The `pull-requests: write` permission is required for reviews and thread comments.
  Pull requests from forks get a read-only `GITHUB_TOKEN`; file annotations and the step summary
  still work there.
- If your build needs generated headers, run the build before the action, or point `database` at
  a directory produced by an earlier step.
- Compare the first run against the old jobs on one pull request before removing them.

The full input reference is in the
[cpp-linter-action documentation](https://cpp-linter.github.io/cpp-linter-action/), and the
[comparison page](../../why-cpp-linter.md) covers the other actions you might be coming from.
