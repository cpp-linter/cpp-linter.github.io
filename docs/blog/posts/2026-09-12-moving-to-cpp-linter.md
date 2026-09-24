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
description: >-
  Replace a clang-format check and a clang-tidy review job with one cpp-linter-action step, input
  by input.
---

# Moving to cpp-linter from other clang-format and clang-tidy actions

A common C++ workflow on GitHub has two lint jobs that grew up separately: a format check that
fails the build, and a clang-tidy job that posts review comments. They pin different clang
versions, they run on different triggers, and when one of them starts flaking nobody remembers why
it was configured that way. Both jobs can be one cpp-linter-action step.

<!-- more -->

## The starting point

Two jobs, two actions, two versions of clang:

```yaml title=".github/workflows/lint.yml (before)"
jobs:
  format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: jidicula/clang-format-action@v4.18.0
        with:
          clang-format-version: '17'
          check-path: 'src'

  tidy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - run: cmake -B build -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
      - uses: ZedThree/clang-tidy-review@v0.23.1
        with:
          clang_tidy_version: '21'
          build_dir: build
          config_file: .clang-tidy
```

The format job fails with clang-format's warnings in the log; the tidy job builds a Docker image,
runs clang-tidy and posts a review. Contributors see a red check for formatting and a review for
clang-tidy, and still fix the formatting by hand.

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
      - uses: actions/checkout@v7
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
          tidy-review: true
          thread-comments: ${{ github.event_name == 'pull_request' && github.event.pull_request.head.repo.full_name == github.repository && 'update' }}
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
| the clang-tidy-review Docker build | `tidy-review: true` | The review comes from the action's own step, with no image to build. |
| the failing format job | annotations, or `auto-fix: true` | See below. |

The `checks-failed` output plus the final `exit 1` step keeps the red check for anything not fixed.

`format-review` and `tidy-review` would post suggestions on the same lines, so the action's docs
recommend enabling only one of them. Here the review is for clang-tidy, and formatting is handled
one of two ways:

- Leave it to the pre-commit hook below. The action still annotates each badly formatted file and
  fails the check.
- Set `auto-fix: true` and give the job `contents: write`. The action commits clang-format's fixes
  to the pull request branch. Pull requests from forks are skipped, and a commit pushed with
  `GITHUB_TOKEN` does not start a new workflow run; the
  [permissions page](https://cpp-linter.github.io/cpp-linter-action/permissions/#auto-fix)
  explains how to push with a token that does.

## Adopting a strict `.clang-tidy` on an old code base

Teams usually keep clang-tidy out of pull requests because of the first run, which reports
thousands of findings in files nobody is touching. Two inputs handle that:

- `files-changed-only: true` (the default) limits analysis to files in the pull request.
- `lines-changed-only: true` limits reported clang-tidy findings to lines the pull request changed.

With both set, contributors only see findings on the lines they changed. You clean up the rest of
the tree gradually: the `cpp-linter` CLI lists every finding in the tree, and `clang-tidy --fix`
applies the fixable ones in one pass.

## What contributors see

- clang-tidy findings appear as review comments on the changed lines, with the check name and a
  suggestion where clang-tidy has a fix, and as annotations in the "Files changed" tab. Draft pull
  requests get no review.
- Formatting problems show up as annotations, or are committed away by `auto-fix`.
- One thread comment summarizes the run. It is edited on each push while there are findings and
  deleted once everything passes.

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
        args: [--version=21]
```

Contributors who use the hook never see a formatting annotation, because there is nothing left to
fix. The action becomes the safety net for everyone else.

## Things to check after switching

- The `pull-requests: write` permission is required for reviews and thread comments. Pull requests
  from forks get a read-only `GITHUB_TOKEN`: annotations still appear, reviews are not posted, and
  posting the thread comment would fail the step, which is why the workflow leaves it off for them.
- If your build needs generated headers, run the build before the action, or point `database` at
  a directory produced by an earlier step.
- Compare the first run against the old jobs on one pull request before removing them.

The full input reference is in the
[cpp-linter-action documentation](https://cpp-linter.github.io/cpp-linter-action/), and the
[comparison page](../../why-cpp-linter.md) covers the other actions you might be coming from.
