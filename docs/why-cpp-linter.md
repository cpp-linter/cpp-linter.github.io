---
title: Why cpp-linter?
description: How cpp-linter compares with other clang-format and clang-tidy GitHub Actions and pre-commit hooks, and how to migrate.
---

# Why cpp-linter?

There are several ways to run `clang-format` and `clang-tidy` on a pull request. Most of them do
one tool, in one place, with whatever clang version the runner happens to have. cpp-linter is built
around a different idea: **one pinned LLVM version, both tools, every place code gets checked**,
from a contributor's pre-commit hook to the review comments on the pull request.

## The short version

- **Both tools in one step.** `clang-format` and `clang-tidy` run from a single
  `cpp-linter/cpp-linter-action@v2` step. The other actions in the table below do one or the other.
- **Feedback where people read it.** Pull request reviews with suggested fixes, file annotations in
  the diff view, one thread comment that is updated on every push instead of piling up, and a job
  step summary. Each channel is an input you can switch off.
- **Only what changed.** By default only files changed in the pull request are analyzed, and
  `lines-changed-only` narrows clang-tidy findings to the changed lines, so an old code base can
  adopt a strict `.clang-tidy` without a thousand-line first comment.
- **A version you choose.** `version: '21'` selects the LLVM major version (12 to 22). The action
  installs the tools itself on ubuntu, macOS and Windows runners; there is no Docker image to
  build first.
- **The same tools locally.** [cpp-linter-hooks](https://github.com/cpp-linter/cpp-linter-hooks)
  runs the same two tools as pre-commit hooks with the same `--version` pin, the
  [cpp-linter](https://pypi.org/project/cpp-linter/) CLI runs them from any script, and
  [clang-tools](https://github.com/cpp-linter/clang-tools-pip) installs the binaries on a laptop.

## How it compares

Checked on 2026-09-12 against each project's current README and `action.yml`. Follow the header
links to verify a cell. ✓ yes · ✗ no · — not applicable.

<!-- markdownlint-disable MD013 MD033 -->

| | [cpp-linter-action](https://github.com/cpp-linter/cpp-linter-action) | [jidicula/<br>clang-format-action](https://github.com/jidicula/clang-format-action) | [DoozyX/<br>clang-format-lint-action](https://github.com/DoozyX/clang-format-lint-action) | [ZedThree/<br>clang-tidy-review](https://github.com/ZedThree/clang-tidy-review) | [platisd/<br>clang-tidy-pr-comments](https://github.com/platisd/clang-tidy-pr-comments) | [JacobDomagala/<br>StaticAnalysis](https://github.com/JacobDomagala/StaticAnalysis) | [pre-commit/<br>mirrors-clang-format](https://github.com/pre-commit/mirrors-clang-format) |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Runs clang-format | ✓ | ✓ check only | ✓ check or fix | ✗ | ✗ | ✗ | ✓ fix |
| Runs clang-tidy | ✓ | ✗ | ✗ | ✓ | ✗ (reads your `-export-fixes` YAML) | ✓ plus cppcheck | ✗ |
| PR review with suggested fixes | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ | — |
| File annotations | ✓ | ✗ | ✗ | ✓ (10 max) | ✗ | ✗ | — |
| Thread comment, updated per push | ✓ | ✗ | ✗ | LGTM only | ✗ | ✓ | — |
| Job step summary | ✓ | on failure | ✗ | ✗ | ✗ | ✗ | — |
| Only changed files / lines | ✓ both | ✗ | ✗ | ✓ diff | changed lines only | ✓ lines | staged files |
| Choose the LLVM version | 12–22 | 3–22 | 5–20 | 14, 17–21 | — | ✗ | via `rev` |
| Installs the tools itself | ✓ | Docker run | Docker | Docker (2–3 min build) | ✗ | Docker | ✓ wheel |
| Runners | ubuntu, macOS, Windows | ubuntu only | Linux (Docker) | Linux (Docker) | unclear | Linux (Docker) | — |
| Compilation database input | ✓ `database` | — | — | ✓ `build_dir` | — | ✓ | — |
| pre-commit hook from the same project | ✓ cpp-linter-hooks | ✗ | ✗ | ✗ | ✗ | ✗ | is one |

<!-- markdownlint-enable MD013 MD033 -->

If you maintain one of these projects and a cell is out of date, please
[open an issue](https://github.com/cpp-linter/cpp-linter.github.io/issues/new) or edit this page;
we will correct it. The point of the table is to help people pick the right tool, not to rank
projects.

[reviewdog](https://github.com/reviewdog/reviewdog) is not in the table because it is a reporting
framework rather than a linter: it has no built-in clang-format or clang-tidy support and needs a
wrapper plus an error-format definition. It is a good choice when you already run many linters
through it.

## When another tool is the better fit

- **You only want the job to fail when formatting is off**, nothing posted to the pull request:
  jidicula/clang-format-action is one input and one script. cpp-linter can do the same with
  `tidy-checks: '-*'` and `file-annotations: false`, but it is not smaller.
- **You already run clang-tidy in your own build job** and only want the YAML turned into review
  comments: platisd/clang-tidy-pr-comments does exactly that step.
- **You need cppcheck today**: JacobDomagala/StaticAnalysis runs it alongside clang-tidy.
  cpp-linter does not run cppcheck.
- **You want fixes committed back to the pull request automatically**: DoozyX's README shows an
  `inplace` plus commit-action recipe. cpp-linter-action has an `auto-fix` option
  [in review](https://github.com/cpp-linter/cpp-linter-action/pull/443); until it ships, the
  `format-review` suggestions are one click away from the same result.
- **You lint many languages in one framework**: reviewdog or MegaLinter, with cpp-linter's
  `cpp-linter` CLI as the C/C++ step if you like.

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
    ignore: 'third_party'  # paths to skip, separated by |
- if: steps.linter.outputs.checks-failed > 0
  run: exit 1
```

`check-path` scanned a whole directory on every run; cpp-linter checks the files changed in the
pull request by default, and `files-changed-only: false` restores the whole-tree behaviour. Drop
`tidy-checks: '-*'` when you are ready to add `clang-tidy`; with `tidy-checks: ''` the action
reads `.clang-tidy`. Set `format-review: true` to turn findings into review suggestions.

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
    lines-changed-only: true
```

The review comments land in the same job, without the separate post step and without waiting for
a Docker image to build.

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
      args: [--checks=.clang-tidy, --version=21]
```

`--version` pins the tool independently of the hooks release, so updating `rev` never changes
which clang-format formats your code. The `clang-tidy` hook is optional; it auto-detects
`compile_commands.json` in common build directories.

## Next steps

- [Getting started](getting-started.md) lists every integration and how to install the tools.
- [Who uses cpp-linter](showcase.md) shows projects that made the switch.
- The [cpp-linter-action docs](https://cpp-linter.github.io/cpp-linter-action/) describe every
  input, output and permission.
