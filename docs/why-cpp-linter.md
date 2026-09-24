---
title: Why cpp-linter?
description: How cpp-linter compares with other clang-format and clang-tidy GitHub Actions and pre-commit hooks, and how to migrate.
hide:
  - navigation
---

# Why cpp-linter?

There are several ways to run `clang-format` and `clang-tidy` on a pull request. Most of them run
one tool in one place, each with its own way of choosing the clang version. cpp-linter runs both
tools in pre-commit hooks, on the pull request and in other CI. Set the same LLVM version in each
and they all run the same major release.

## What the action does

cpp-linter-action runs `clang-format` and `clang-tidy` in one step. Annotations in the diff view
are on by default (`file-annotations`); GitHub shows up to 10 warnings per step. Three more
reports each take one input: pull request reviews with suggested fixes (`format-review`,
`tidy-review`), one comment that is edited on each push while there are findings
(`thread-comments: update`), and the job step summary (`step-summary`).

Reviews and the comment need `GITHUB_TOKEN` with `pull-requests: write`. Pull requests from forks
get a read-only token: annotations still work, reviews are not posted, and `thread-comments` fails
the step. Since v2.23.0, `auto-fix: true` with `contents: write` commits the clang-format fixes to
the branch of a pull request from the same repository.

Only the files changed in the pull request are checked unless you set `files-changed-only: false`,
and `lines-changed-only: true` drops clang-tidy findings outside the changed lines. That is how a
strict `.clang-tidy` becomes usable on a code base that has never run it.

The `version` input picks the clang tools: an LLVM major version from 12 to 23 (the default is
`21`), a path to tools you installed yourself, or an empty string for whatever the runner already
has. The [input reference](https://cpp-linter.github.io/cpp-linter-action/inputs-outputs/#version)
has the details. The action installs the tools itself, with apt on Linux, Homebrew on macOS and the
[clang-tools](https://github.com/cpp-linter/clang-tools-pip) static binaries on Windows, so there
is no Docker image to build before the first result.

The same tools run outside the action too. The pre-commit hooks in
[cpp-linter-hooks](https://github.com/cpp-linter/cpp-linter-hooks) take the same version number
(the clang-tidy hook covers LLVM 13 to 22). The [cpp-linter](https://pypi.org/project/cpp-linter/)
CLI runs from a script or another CI system; it expects the clang tools to be installed already
and exits 0 even when checks fail. On a laptop, `clang-tools` installs the binaries.

## How it compares

Checked on 2026-09-24 against each project's current README, `action.yml` and source. Follow the
header links to verify a cell. ✓ yes · ✗ no · — not applicable.

<!-- markdownlint-disable MD013 MD033 -->

<div class="compare" markdown>

| | [cpp-linter-action](https://github.com/cpp-linter/cpp-linter-action) | [jidicula/<br>clang-format-action](https://github.com/jidicula/clang-format-action) | [DoozyX/<br>clang-format-lint-action](https://github.com/DoozyX/clang-format-lint-action) | [ZedThree/<br>clang-tidy-review](https://github.com/ZedThree/clang-tidy-review) | [platisd/<br>clang-tidy-pr-comments](https://github.com/platisd/clang-tidy-pr-comments) | [JacobDomagala/<br>StaticAnalysis](https://github.com/JacobDomagala/StaticAnalysis) | [pre-commit/<br>mirrors-clang-format](https://github.com/pre-commit/mirrors-clang-format) |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Runs clang-format | ✓ check, or fix with `auto-fix` | ✓ check only | ✓ check or fix | ✗ | ✗ | ✗ | ✓ fix |
| Runs clang-tidy | ✓ | ✗ | ✗ | ✓ | ✗ (reads your `-export-fixes` YAML) | ✓ plus cppcheck | ✗ |
| PR review with suggested fixes | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ | — |
| File annotations | ✓ (10 per step) | ✗ | ✗ | ✓ instead of the review (10 max) | ✗ | ✗ | — |
| Thread comment, updated per push | ✓ | ✗ | ✗ | LGTM only | ✗ | ✓ | — |
| Job step summary | ✓ | on failure | ✗ | timings only | ✗ | ✗ | — |
| Reviews or comments on fork PRs | annotations only | — | — | ✓ split workflow | ✓ `workflow_run` | ✓ `pull_request_target` | — |
| Only changed files / lines | ✓ both | ✗ | ✗ | ✓ diff | changed lines only | ✓ lines | staged files |
| Choose the LLVM version | [12–23, a path, or the runner's](https://cpp-linter.github.io/cpp-linter-action/inputs-outputs/#version) | 3–22 | 5–20 | 14, 17–21 | — | ✗ | via `rev` |
| Installs the tools itself | ✓ | Docker run | Docker | Docker (2–3 min build) | ✗ | Docker | ✓ wheel |
| Runners | Linux, macOS, Windows | Linux (Docker) | Linux (Docker) | Linux (Docker) | Linux | Linux (Docker) | — |
| Compilation database input | ✓ `database` | — | — | ✓ `build_dir` | — | ✓ | — |
| pre-commit hook from the same project | ✓ cpp-linter-hooks | ✗ | ✗ | ✗ | ✗ | ✗ | is one |

</div>

<!-- markdownlint-enable MD013 MD033 -->

The table is there to help people pick a tool. If you maintain one of these projects and a cell is
out of date, [open an issue](https://github.com/cpp-linter/cpp-linter.github.io/issues/new) or
edit this page and we will correct it.

[reviewdog](https://github.com/reviewdog/reviewdog) is not in the table because it is a reporting
framework rather than a linter: it has no built-in clang-format or clang-tidy support and needs a
wrapper plus an error-format definition. It is a good choice when you already run many linters
through it.

## When another tool is the better fit

If all you want is a red check when formatting is off, jidicula/clang-format-action is a single
step with no required inputs. cpp-linter-action does the same with `tidy-checks: '-*'` plus a step
that fails on `checks-failed` (see below), but it is not smaller. If you already run clang-tidy in
your own build job and only want its YAML turned into review comments,
platisd/clang-tidy-pr-comments does exactly that step, and nothing else.

cpp-linter does not run cppcheck; JacobDomagala/StaticAnalysis runs it next to clang-tidy. If most
pull requests come from forks, clang-tidy-review's split workflow or clang-tidy-pr-comments'
`workflow_run` recipe can post reviews on them, while cpp-linter-action shows annotations only. If
you lint many languages through one framework, reviewdog or MegaLinter fit better; neither ships
clang-tidy support, and MegaLinter's C/C++ linters are clang-format, cpplint and cppcheck.

## Migrating

### From jidicula/clang-format-action

```yaml title="Before"
- uses: jidicula/clang-format-action@v4.18.0
  with:
    clang-format-version: '21'
    check-path: 'src'
```

```yaml title="After"
- uses: cpp-linter/cpp-linter-action@v2
  id: linter
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    version: '21'
    style: file            # .clang-format
    tidy-checks: '-*'      # keep it format-only for now
    ignore: '|!src'        # check only src/, like check-path
- if: steps.linter.outputs.checks-failed > 0
  run: exit 1
```

`check-path` scanned all of `src` on every run; cpp-linter checks only the files the pull request
changes, and `files-changed-only: false` checks every file the `ignore` filter lets through. When
you are ready for clang-tidy, change the line to `tidy-checks: ''` so only your `.clang-tidy`
applies (removing the line adds the action's default checks). `format-review: true` turns findings
into review suggestions and needs `pull-requests: write`.

### From ZedThree/clang-tidy-review

```yaml title="Before"
- uses: ZedThree/clang-tidy-review@v0.23.1
  with:
    clang_tidy_version: '21'
    build_dir: build
    config_file: .clang-tidy
```

```yaml title="After"
- uses: cpp-linter/cpp-linter-action@v2
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    version: '21'
    database: build        # directory holding compile_commands.json
    tidy-checks: ''        # .clang-tidy
    style: file            # .clang-format, or '' to skip clang-format
    tidy-review: true
    passive-reviews: true  # comment, don't request changes
    lines-changed-only: true
```

The review comes from the same step, without waiting for a Docker image to build, and a new one
is posted on each push. Keep `pull-requests: write` on the job. Pull requests from forks get
annotations only; if most of yours come from forks, stay with the split workflow.

### From pre-commit/mirrors-clang-format

```yaml title="Before"
- repo: https://github.com/pre-commit/mirrors-clang-format
  rev: v21.1.0
  hooks:
    - id: clang-format
```

```yaml title="After"
- repo: https://github.com/cpp-linter/cpp-linter-hooks
  rev: v1.6.0
  hooks:
    - id: clang-format
      args: [--style=file, --version=21]
    - id: clang-tidy
      args: [--version=21]
```

`--version=21` installs the newest 21.x wheel on PyPI whatever the hooks `rev` is; write
`--version=21.1.0` to keep exactly what the mirror pinned. The `clang-tidy` hook is optional; it
auto-detects `compile_commands.json` in common build directories. The clang-format hook only runs
on C and C++ files, so keep the mirror if you also format CUDA, Objective-C, proto, Java or JSON.

## Next steps

- [Getting started](getting-started.md) lists every integration and how to install the tools.
- [Who uses cpp-linter](showcase.md) lists open-source projects that run it.
- The [cpp-linter-action docs](https://cpp-linter.github.io/cpp-linter-action/) describe every
  input, output and permission.
