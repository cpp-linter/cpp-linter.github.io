---
title: Use cpp-linter with AI coding agents
description: Make clang-format and clang-tidy the check an AI coding agent runs after it edits C or C++ code, with configs for Claude Code, GitHub Copilot coding agent, AGENTS.md, pre-commit and pull requests.
hide:
  - navigation
---

# Use cpp-linter with AI coding agents

An AI coding agent that edits C or C++ code can run the same checks a person does: it edits a
file, runs `clang-format` and `clang-tidy` on what it changed, reads the findings and fixes them.
The checks read your `.clang-format` and `.clang-tidy`, so the agent is held to the same rules as
everyone else, and the result does not depend on the model.

This page has copy-paste configs for each place the loop can run:

| When | What runs | Checks |
| --- | --- | --- |
| After every edit (Claude Code) | [A `PostToolUse` hook](#claude-code) | The whole file that was edited |
| Before the agent finishes | [cpp-linter, from instructions in `AGENTS.md`](#check-the-changed-lines) | Changed lines since the base branch |
| On every commit | [cpp-linter-hooks](#on-every-commit) | Staged files |
| On the pull request | [cpp-linter-action](#on-the-pull-request) | Changed lines, posted as review suggestions |

The examples use LLVM 21. Use the version your project already pins, the same one in every place.

## Install the tools

[cpp-linter](https://cpp-linter.github.io/cpp-linter/) does not install `clang-format` or
`clang-tidy`. [clang-tools](https://cpp-linter.github.io/clang-tools-pip/) installs them as static
binaries:

```bash
pipx install cpp-linter
pipx install clang-tools
clang-tools install clang-format clang-tidy --version 21
```

This puts `clang-format-21` and `clang-tidy-21` in `~/.local/bin` on Linux, with unversioned
`clang-format` and `clang-tidy` links next to them. `pip install` into a virtual environment works
as well.

clang-tidy needs the compiler flags of each file, from a `compile_commands.json`. With CMake:

```bash
cmake -B build -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
```

The examples below expect it in `build/`.

## Check the changed lines

On an existing code base, a strict `.clang-tidy` reports far more than the agent changed. cpp-linter
reads `git diff` and reports only findings on added or modified lines, so the agent works on its
own changes:

```bash
git add -A
GITHUB_ACTIONS=false cpp-linter --version=21 --style=file --tidy-checks='' \
  --database=build --lines-changed-only=true --diff-base=origin/main
```

- `--style=file` and `--tidy-checks=''` use your `.clang-format` and `.clang-tidy` and nothing else.
- `--lines-changed-only=true` reports findings only on added or modified lines, and checks only
  the files the diff touches.
- `--diff-base=origin/main` is the branch the work started from. Replace it with your default
  branch.
- Stage the changes first. When any changes are staged, or there are untracked files, cpp-linter
  diffs the staged changes against the base and leaves out unstaged ones.
- `GITHUB_ACTIONS=false` makes cpp-linter read `git diff` even on a GitHub Actions runner, where
  it would otherwise ask the GitHub API for the changes of a pull request event. Outside Actions it
  changes nothing.
- cpp-linter exits 0 even when checks fail. The log ends with the counts, for example
  `INFO:CPP Linter:3 checks-failed`, and each finding before it has a file, a line and, for
  clang-tidy, the check name.
- `--fix` applies the clang-format fixes to the changed lines in place. clang-tidy fixes are not
  applied. Stage the fixed files before the next run.

## Claude Code

A Claude Code [hook](https://code.claude.com/docs/en/hooks) runs a command after a tool call.
After an `Edit` or `Write`, this one runs `clang-format` and `clang-tidy` on the edited file. When
either reports something, the hook exits 2, and Claude Code shows the hook's stderr to Claude
next to the tool result.

Save the script as `.claude/hooks/cpp-lint.sh` and make it executable
(`chmod +x .claude/hooks/cpp-lint.sh`). It reads the hook input with
[jq](https://jqlang.org/).

```bash title=".claude/hooks/cpp-lint.sh"
#!/usr/bin/env bash
# Lint the C or C++ file Claude Code just edited.
# Exit code 2 sends stderr back to Claude; exit 0 stays silent.
file=$(jq -r '.tool_input.file_path // empty')

case "$file" in
  *.c|*.cc|*.cpp|*.cxx|*.h|*.hh|*.hpp|*.hxx) ;;
  *) exit 0 ;;
esac
[ -f "$file" ] || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0

report=""
status=0

if ! out=$(clang-format --style=file --dry-run --Werror "$file" 2>&1); then
  report+="$out"$'\n'
  status=2
fi

# clang-tidy needs compiler flags; skip headers and projects without a database.
case "$file" in
  *.c|*.cc|*.cpp|*.cxx)
    if [ -f build/compile_commands.json ]; then
      if ! out=$(clang-tidy -p build --quiet --warnings-as-errors='*' "$file" 2>&1); then
        report+="$out"$'\n'
        status=2
      fi
    fi
    ;;
esac

if [ "$status" -ne 0 ]; then
  printf 'clang-format/clang-tidy findings in %s:\n%s' "$file" "$report" >&2
fi
exit "$status"
```

Register it in the project settings:

```json title=".claude/settings.json"
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/cpp-lint.sh",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

- The hook input is JSON on stdin; `tool_input.file_path` is the absolute path of the edited file.
- `clang-format --dry-run --Werror` changes nothing and fails with one
  `-Wclang-format-violations` error for each place that needs formatting.
- `--warnings-as-errors='*'` makes clang-tidy exit non-zero on warnings as well as errors.
- The hook checks the whole file, so on a file with existing findings Claude sees those too. To
  hold it only to its own lines, leave clang-tidy out of the hook and have it run the
  [changed-lines check](#check-the-changed-lines) before it finishes, from `CLAUDE.md` or
  `AGENTS.md`.
- A `PostToolUse` hook cannot undo the edit: the tool has already run. Claude decides what to do
  with the findings.
- Change `clang-format` and `clang-tidy` to `clang-format-21` and `clang-tidy-21` if other
  versions are on your PATH.

Claude Code reads `CLAUDE.md`, not `AGENTS.md`. To share one set of instructions, put `@AGENTS.md`
on a line in `CLAUDE.md`.

## GitHub Copilot coding agent

Copilot coding agent works in a GitHub Actions environment. The steps in
`.github/workflows/copilot-setup-steps.yml` run before it starts; the job has to be named
`copilot-setup-steps`, and the file has to be on the default branch. GitHub's
[guide](https://docs.github.com/en/copilot/customizing-copilot/customizing-the-development-environment-for-copilot-coding-agent)
lists what else the file can set.

```yaml title=".github/workflows/copilot-setup-steps.yml"
name: Copilot Setup Steps

on:
  workflow_dispatch:
  push:
    paths:
      - .github/workflows/copilot-setup-steps.yml
  pull_request:
    paths:
      - .github/workflows/copilot-setup-steps.yml

jobs:
  copilot-setup-steps:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0

      - name: Install cpp-linter and the clang tools
        run: |
          pipx install cpp-linter
          pipx install clang-tools
          clang-tools install clang-format clang-tidy --version 21
          echo "$HOME/.local/bin" >> "$GITHUB_PATH"

      - name: Generate compile_commands.json
        run: cmake -B build -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
```

The `push` and `pull_request` triggers run the workflow when the file changes, so you can see that
the steps work before Copilot uses them. Install your project's build dependencies before the
CMake step, as your build job does; otherwise clang-tidy cannot find their headers.

Copilot reads repository instructions from `AGENTS.md` and from `.github/copilot-instructions.md`.
Add the snippet below to one of them.

## AGENTS.md

Many coding agents read an `AGENTS.md` file at the repository root. This snippet tells the agent
which command to run and when it is done:

```markdown title="AGENTS.md"
## C and C++ checks

Formatting and static analysis use clang-format and clang-tidy with the repository's
`.clang-format` and `.clang-tidy`. Do not edit those files to make a check pass.

Before you finish a task that changes C or C++ code:

1. Generate the compilation database if `build/compile_commands.json` is missing:
   `cmake -B build -DCMAKE_EXPORT_COMPILE_COMMANDS=ON`
2. Stage your changes and run cpp-linter on the lines you changed:

       git add -A
       GITHUB_ACTIONS=false cpp-linter --version=21 --style=file --tidy-checks='' \
         --database=build --lines-changed-only=true --diff-base=origin/main

   If `origin/main` is missing, run `git fetch origin main` first.
3. Fix every finding it reports. `--fix` applies the clang-format fixes; fix clang-tidy findings
   by hand. Do not add `NOLINT` comments unless the task asks for them.
4. Repeat step 2. You are done when the log ends with `0 checks-failed`.
```

Adjust the CMake command, the LLVM version and the base branch to your project.

## On every commit

If the agent commits, [cpp-linter-hooks](https://github.com/cpp-linter/cpp-linter-hooks) runs the
checks on the staged files at each commit, on the agent's machine and on yours:

```yaml title=".pre-commit-config.yaml"
repos:
  - repo: https://github.com/cpp-linter/cpp-linter-hooks
    rev: v1.8.1
    hooks:
      - id: clang-format
        args: [--style=file, --version=21]
      - id: clang-tidy
        args: [--version=21]
```

- The hooks pip-install the clang-format and clang-tidy version you pin, so the agent's
  environment needs network access to pypi.org; `pre-commit` itself installs with
  `pipx install pre-commit`. Run `pre-commit install` once in the clone.
- The clang-format hook rewrites the files and fails the commit; the agent stages the result and
  commits again. With `--dry-run` in `args`, it prints the lines to fix instead.
- The clang-tidy hook looks for `compile_commands.json` in `build/` and a few other directories.
- Tell the agent not to commit with `--no-verify`, which skips the hooks.

[Set up a clang-format pre-commit hook](blog/posts/2026-09-20-clang-format-pre-commit-hook.md)
covers the setup in more detail.

## On the pull request

The checks above run in the agent's environment, which you may not control.
[cpp-linter-action](https://cpp-linter.github.io/cpp-linter-action/) runs on the pull request
itself, so it checks every change whoever or whatever wrote it. With `tidy-review`, the findings
are posted as a pull request review with suggested changes, which a person or the agent can apply.

```yaml title=".github/workflows/cpp-linter.yml"
name: cpp-linter
on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

jobs:
  cpp-linter:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v7

      - name: Generate compile_commands.json
        run: cmake -B build -DCMAKE_EXPORT_COMPILE_COMMANDS=ON

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

      - name: Fail on lint errors
        if: steps.linter.outputs.checks-failed > 0
        run: exit 1
```

- `lines-changed-only: true` keeps the findings to lines the pull request added or modified, which
  also keeps the suggestions inside the diff, where GitHub can show them.
- Turn on `tidy-review` or `format-review`, not both: they would post similar suggestions twice.
- Reviews are not posted on draft pull requests. An agent that opens its pull request as a draft
  gets annotations only until the pull request is marked ready; `ready_for_review` in `types`
  runs the check again at that point.
- GitHub may hold workflow runs on pull requests opened by Copilot until someone with write access
  approves them.
- The last step fails the job, so you can make the check required in branch protection.

The action's [inputs and outputs](https://cpp-linter.github.io/cpp-linter-action/inputs-outputs/)
and [pull request review caveats](https://cpp-linter.github.io/cpp-linter-action/pr-review-caveats/)
cover the details. [Run clang-tidy on pull requests with GitHub Actions](blog/posts/2026-09-20-clang-tidy-pull-requests-github-actions.md)
walks through the compilation database and the `.clang-tidy` setup.
