---
date:
  created: 2026-09-20
slug: clang-format-pre-commit-hook
description: >-
  Set up a clang-format pre-commit hook for C and C++: pin the clang-format version, format only
  your own code, reformat an existing code base once, and enforce the same check in CI.
categories:
  - Guides
tags:
  - clang-format
  - cpp-linter-hooks
  - pre-commit
authors:
  - shenxianpeng
---

# Set up a clang-format pre-commit hook for C and C++

Formatting comments are the cheapest part of a code review to get rid of. A pre-commit hook runs
clang-format on the files in each commit, so badly formatted code never reaches a pull request,
and CI stops failing for a missing space.

With the [pre-commit](https://pre-commit.com/) framework, nobody on the team has to install LLVM,
and everyone gets the same clang-format version.

<!-- more -->

## Step 1: Have a `.clang-format` in the repository

If the project already has one, keep it. If not, start from a built-in style and change as little
as possible:

```yaml title=".clang-format"
BasedOnStyle: Google
ColumnLimit: 100
```

The built-in styles are `LLVM`, `Google`, `Chromium`, `Mozilla`, `WebKit`, `Microsoft` and `GNU`.
`clang-format --style=Google --dump-config` prints every option of a style, and the
[clang-format configurator](https://clang-format-configurator.site/) shows the effect of each
option on sample code.

## Step 2: Install pre-commit and add the hook

pre-commit is a Python tool. Install it once per machine:

```bash
pip install pre-commit    # or: pipx install pre-commit, brew install pre-commit
```

Add the hook to the repository:

```yaml title=".pre-commit-config.yaml"
repos:
  - repo: https://github.com/cpp-linter/cpp-linter-hooks
    rev: v1.6.0
    hooks:
      - id: clang-format
        args: [--style=file, --version=21]
```

- `--style=file` makes clang-format read the `.clang-format` file.
- `--version=21` selects the clang-format version. The hook downloads it as a Python wheel, so a
  system LLVM is neither needed nor used. `rev` is the version of the hook, not of clang-format.
  `21` means the newest 21.x release (21.1.8 at the time of writing); write `--version=21.1.8` to
  pin the exact release.

Then enable it in your clone:

```bash
pre-commit install
```

Every contributor runs `pre-commit install` once after cloning. Put that line in
`CONTRIBUTING.md`.

## Step 3: Commit something

Stage a badly formatted file and commit:

```console
$ git commit -m "add main"
clang-format.............................................................Failed
- hook id: clang-format
- files were modified by this hook
```

"Failed" here means the hook reformatted the file in your working tree and stopped the commit, so
you can look at what changed:

```console
$ git status --short
AM src/main.c
$ git diff        # the formatting changes
$ git add src/main.c
$ git commit -m "add main"
clang-format.............................................................Passed
```

Two things to know about the scope:

- Only the files staged for the commit are checked, which keeps the hook fast.
- Those files are formatted completely, not just the lines you changed. Step 5 covers what that
  does to old code.

The first run takes a little longer, because pre-commit builds an environment for the hook and
downloads clang-format. Both are cached afterwards.

## Step 4: Format only your own code

By default the hook runs on C and C++ sources and headers. Vendored code should be left alone,
because reformatting it makes every later update a merge conflict. There are two ways to exclude
it.

In the hook configuration:

```yaml title=".pre-commit-config.yaml"
      - id: clang-format
        args: [--style=file, --version=21]
        exclude: ^(third_party|external)/
```

Or with a `.clang-format` inside the vendored directory, which also covers editors and anyone
running clang-format by hand:

```yaml title="third_party/.clang-format"
DisableFormat: true
SortIncludes: Never
```

clang-format also handles CUDA, Protobuf and a few other languages. The hook skips them unless you
widen its file types:

```yaml title=".pre-commit-config.yaml"
      - id: clang-format
        args: [--style=file, --version=21]
        types_or: [c++, c, cuda, proto]
```

## Step 5: Decide what to do with existing code

Because the hook formats whole files, the first person to touch an old file gets a diff where
three lines of logic are buried in three hundred lines of whitespace changes. Pick one of these
before turning the hook on for everyone.

**Reformat once.** This is the better option when you can afford it.

```bash
pre-commit run clang-format --all-files
git commit -am "style: apply clang-format to the whole tree"
git rev-parse HEAD >> .git-blame-ignore-revs
git add .git-blame-ignore-revs
git commit -m "chore: ignore the reformat commit in git blame"
```

`.git-blame-ignore-revs` keeps `git blame` useful: lines are attributed to the commit that last
changed their content, not to the reformat. GitHub's blame view reads the file automatically.
Locally, each clone needs:

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

Open branches will conflict with the reformat commit, so do it when few pull requests are open,
and announce it. After resolving the conflicts, a branch author runs
`pre-commit run clang-format --files <their files>` to bring the branch in line.

**Format as you go.** Leave the hook on and let files get formatted when somebody touches them.
Ask contributors to put the formatting change in a separate commit from the logic change, so
reviewers can skip it. The code base converges more slowly and the noisy diffs last longer.

To format only the changed lines, use `git clang-format`, which ships with LLVM. It does not run
through the pre-commit framework.

## Step 6: Enforce it in CI

A local hook can be skipped with `git commit --no-verify`, and new contributors may not have run
`pre-commit install`. Run the same configuration in CI:

```yaml title=".github/workflows/pre-commit.yml"
name: pre-commit
on:
  pull_request:
  push:
    branches: [main]

jobs:
  pre-commit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - run: pipx run pre-commit run --all-files --show-diff-on-failure
```

When a file is not formatted, the job fails and prints the required change:

```console
clang-format.............................................................Failed
- hook id: clang-format
- files were modified by this hook
pre-commit hook(s) made changes.
If you are seeing this message in CI, reproduce locally with: `pre-commit run --all-files`.
To run `pre-commit` as part of git workflow, use `pre-commit install`.
All changes made by hooks:
diff --git a/src/add.c b/src/add.c
index b9e228e..1f76448 100644
--- a/src/add.c
+++ b/src/add.c
@@ -1 +1 @@
-int  add(int a,int b){return a+b;}
+int add(int a, int b) { return a + b; }
```

If you would rather have the fix offered in the pull request, use
[cpp-linter-action](https://cpp-linter.github.io/cpp-linter-action/) with `format-review: true`
and the same `version`. It posts the formatting differences as review suggestions that can be
committed from the browser.
[Moving to cpp-linter](2026-09-12-moving-to-cpp-linter.md) has a complete workflow.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| The hook "fails" on every commit that needs formatting | It fixed the files and stopped the commit. `git add` them and commit again. |
| Formatting differs between two machines | Someone formats with another clang-format version, for example from an editor plugin or a system package. Point the editor at the same version, for example `pip install clang-format==21.1.8`. See [One clang-format version everywhere](2026-09-12-one-clang-version-everywhere.md). |
| `Could not find any stable versions of clang-format on PyPI` | The hook looks the version up on pypi.org each time it runs, so it needs network access. |
| `Unsupported clang-format version '...'` | There is no wheel for that version. The message lists the available ones. |
| Vendored or generated code gets reformatted | Exclude it; see step 4. |
| One block must keep its manual layout | Wrap it in `// clang-format off` and `// clang-format on`. |
| You need to commit without the hook once | `SKIP=clang-format git commit ...` skips this hook only; `git commit --no-verify` skips all hooks. CI still checks the result. |

## Adding clang-tidy later

The same repository provides a `clang-tidy` hook:

```yaml title=".pre-commit-config.yaml"
      - id: clang-tidy
        args: [--checks=.clang-tidy, --version=21]
```

clang-tidy needs a `compile_commands.json` to find your headers, which the hook picks up from
`build/` and a few other common directories. It is also much slower than clang-format, because it
parses every header a file includes. We suggest keeping clang-format in the hook and running
clang-tidy in CI.

## Where to go next

- All hook options, including the clang-tidy ones, are in the
  [cpp-linter-hooks README](https://github.com/cpp-linter/cpp-linter-hooks#readme). It also
  compares the hook with `mirrors-clang-format`, which is a good choice when clang-format is all
  you will ever need and you want `rev` to be the clang-format version.
- [One clang-format version everywhere](2026-09-12-one-clang-version-everywhere.md) covers
  keeping the hook, CI, editors and Docker images on one LLVM version.
