---
hide:
  - navigation
  - toc
  - feedback
# The home page people see is built by docs/overrides/home.html, which does not
# render the Markdown below. That Markdown is the page's copy for AI agents and
# llms.txt (the llms_txt plugin publishes it as index.md). Keep the two in step.
template: home.html
title: C/C++ Linter with clang-format and clang-tidy
description: clang-format and clang-tidy for C and C++ pull requests, pre-commit hooks and CI, with the LLVM version you pin.
---

# cpp-linter

cpp-linter runs clang-format and clang-tidy on the C and C++ files a pull request changes. It
reports what it finds in the job log and as annotations on the pull request, and can post the
fixes as review suggestions. It reads the repository's `.clang-format` and `.clang-tidy` files.
Set the same LLVM version in each tool, and laptops and CI run the same major release.

## Pick where the checks run

| Where | Project | Docs |
| --- | --- | --- |
| On the pull request (GitHub Actions) | cpp-linter-action | <https://cpp-linter.github.io/cpp-linter-action/> |
| Before each commit (pre-commit) | cpp-linter-hooks | <https://github.com/cpp-linter/cpp-linter-hooks> |
| Locally or in other CI | cpp-linter, the Python command behind the action | <https://cpp-linter.github.io/cpp-linter/> |
| Just the clang tools, by LLVM version | clang-tools (pip), npm, asdf, Docker, Homebrew | <https://cpp-linter.github.io/clang-tools-pip/> |
| Static clang-format and clang-tidy binaries | clang-tools-static-binaries | <https://cpp-linter.github.io/clang-tools-static-binaries/> |
| Version 2, a rewrite in Rust (release candidates) | cpp-linter-rs | <https://cpp-linter.github.io/cpp-linter-rs/> |

The action and clang-tools cover LLVM 12 to 23. The clang-tidy pre-commit hook covers LLVM 13 to 23.

## Start with one workflow file

Save this as `.github/workflows/cpp-linter.yml` and open a pull request that changes C or C++ files:

```yaml
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
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          style: file
          tidy-checks: ''
          format-review: true
```

On pull requests from forks the token is read-only, so findings show up as annotations only.

## More

- [Get started](getting-started.md): the action, the pre-commit hooks, the command and the clang tools.
- [Other CI](other-ci.md): GitLab CI, Jenkins, Azure Pipelines and Bitbucket Pipelines.
- [AI coding agents](ai-coding-agents.md): run the checks from Claude Code, Copilot coding agent and `AGENTS.md`.
- [Why cpp-linter](why-cpp-linter.md): how it compares with other clang-format and clang-tidy actions and hooks.
