---
date:
  created: 2026-12-01
draft: false
categories:
  - Releases
tags:
  - cpp-linter-action
  - cpp-linter
  - clang-tidy
  - clang-format
  - github-actions
authors:
  - shenxianpeng
description: >-
  cpp-linter-action v3 runs cpp-linter 2.0, rewritten in Rust: one review with both tools'
  suggestions, SARIF for code scanning, and clang tools installed for you. Moving from v2 takes one line.
---

<!-- DRAFT. Open items are marked [TODO]. -->

# cpp-linter-action v3: one review for both tools, and findings where you look

cpp-linter-action v3 is out. It runs cpp-linter 2.0, a rewrite in Rust, and for most workflows the
upgrade is one line: `@v2` becomes `@v3`.

<!-- more -->

<div class="cl-cmp lt" markdown="0">
  <img src="/static/blog/v3/comment-v2-light.webp" alt="The comment cpp-linter-action v2 posts on a pull request">
  <img class="cl-new" src="/static/blog/v3/comment-v3-light.webp" alt="The comment v3 posts on the same pull request">
  <span class="cl-tag l">v3</span><span class="cl-tag r">v2</span>
  <input type="range" min="0" max="100" value="55" aria-label="Drag to compare the v3 comment (left) with the v2 comment (right)">
  <div class="cl-bar"></div>
  <div class="cl-knob" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="#171A2E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4 2 8l4 4M10 4l4 4-4 4"/></svg></div>
</div>
<div class="cl-cmp dk" markdown="0">
  <img src="/static/blog/v3/comment-v2-dark.webp" alt="The comment cpp-linter-action v2 posts on a pull request (dark theme)">
  <img class="cl-new" src="/static/blog/v3/comment-v3-dark.webp" alt="The comment v3 posts on the same pull request (dark theme)">
  <span class="cl-tag l">v3</span><span class="cl-tag r">v2</span>
  <input type="range" min="0" max="100" value="55" aria-label="Drag to compare the v3 comment (left) with the v2 comment (right)">
  <div class="cl-bar"></div>
  <div class="cl-knob" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="#171A2E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4 2 8l4 4M10 4l4 4-4 4"/></svg></div>
</div>

<script>
document.querySelectorAll(".cl-cmp").forEach(function (box) {
  var range = box.querySelector("input");
  function move() { box.style.setProperty("--pos", range.value + "%"); }
  range.addEventListener("input", move);
  move();
});
</script>

*The same pull request, commented on by v2 and by v3. Drag to compare.*

## What you will notice first

**A comment that reads at a glance.** The thread comment now opens with the verdict, then a short
table of what each tool found, then the findings per file. When there is something to fix, a
folded section says how: the command to run locally, or the patch that cpp-linter already made.
When everything passes, the comment says so in two lines.

**One review, both tools.** v2 had `tidy-review` and `format-review`, and posted their suggestions
separately. v3 has `pr-review`, which posts one review with the clang-format and clang-tidy
suggestions together. Each inline comment names its check and links to its documentation, so the
author can apply the suggestion with one click or read why it matters.

<!-- [TODO] Screenshot: one inline review comment with a suggestion, light and dark. -->

## Lighter on the runner

cpp-linter 2.0 starts in about a millisecond instead of 65, and the linter process needs about
half the memory (40 MiB instead of 87 MiB in a full clang-tidy run of libgit2). It installs the
clang tools only when there are files for them to check. The clang-tidy run itself takes as long
as before: v2 of this action already ran files in parallel, and so does v3.

## Findings where your team already looks

One run can now feed every place a reviewer looks:

| Where | How |
|---|---|
| Pull request review | `pr-review: true` |
| Pull request thread | `thread-comments: true` |
| Workflow summary | `step-summary: true` |
| Diff annotations | on by default |
| Security tab (GitHub code scanning) | `sarif-file`, then `github/codeql-action/upload-sarif` |

The SARIF file lists clang-tidy diagnostics, so code scanning tracks them per branch and marks the
new ones on a pull request. The "GitHub code scanning" [recipe](https://cpp-linter.github.io/cpp-linter-action/examples/)
shows a complete workflow.

![One cpp-linter run sends its findings to the pull request review, the thread comment, the step summary, diff annotations and the Security tab](../../static/blog/v3/fanout-light.svg#only-light)
![One cpp-linter run sends its findings to the pull request review, the thread comment, the step summary, diff annotations and the Security tab](../../static/blog/v3/fanout-dark.svg#only-dark)

## No setup step for clang tools

You no longer install clang-format and clang-tidy before the action runs. Set `version` and v3
installs what it needs, and only for the files it is about to check:

- a major version such as `18`, any version from LLVM 12 to 23;
- a requirement such as `>=17, <20`, or `=18.1.8` for an exact release;
- `latest`, the new default, for the newest major version cpp-linter can install.

v3 tries the runner's package manager first, then PyPI wheels, then the static binaries that
cpp-linter builds for LLVM 12 to 23 on six platforms. We test it on Ubuntu, macOS and Windows
runners, on both x64 and Arm.

## Fixes you can review

With `auto-fix: true`, v2 committed clang-format fixes. v3 commits one patch with the clang-format
and the clang-tidy fixes, and also sets its path as the `fix-patch-path` output, so you can upload
it as an artifact instead of committing it. cpp-linter itself never edits your files; the action
applies the patch only when `auto-fix` is on.

## Upgrade

![The upgrade as a diff: @v2 becomes @v3, and format-review becomes pr-review](../../static/blog/v3/upgrade-light.svg#only-light)
![The upgrade as a diff: @v2 becomes @v3, and format-review becomes pr-review](../../static/blog/v3/upgrade-dark.svg#only-dark)

```diff
-      - uses: cpp-linter/cpp-linter-action@v2
+      - uses: cpp-linter/cpp-linter-action@v3
         id: linter
         env:
           GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
         with:
           style: file
           tidy-checks: ''
-          format-review: true
+          pr-review: true
```


Before you merge the upgrade, check these:

1. `tidy-review` and `format-review` still work, as aliases of `pr-review`. Either one now turns on
   suggestions from both tools.
2. Some defaults changed, so an input you don't set may now behave differently:
    - `style` and `tidy-checks` follow your repository's `.clang-format` and `.clang-tidy` files.
    - `lines-changed-only` is `true`, so only the lines you add are checked.
    - `thread-comments` is `update` on pull requests: one comment, edited in place on each push.
      It needs the `pull-requests: write` permission.
    - `step-summary` is `true`.
    - `version` is `latest`. Pin a major version if you want results that don't change when a new
      LLVM release comes out.
3. The new `strict` input fails the step when any check fails. It is off by default, so an
   upgrade never turns a passing job red. We recommend `strict: true`: it replaces the separate
   step that reads `checks-failed`, and the outputs are still set when the step fails.

The [migration guide](https://cpp-linter.github.io/cpp-linter-action/migration/) lists every input
that changed, and covers workflows still on v1.

## Staying on v2

Workflows that use `@v2` keep working. v2 gets bug and security fixes, and new features go into
v3. If your workflow uses `@main`, it now runs v3; pin `@v2` to stay where you are.

## Beyond GitHub Actions

cpp-linter 2.0 is also a command you can run anywhere:

- install it from PyPI, npm or crates.io, or download a prebuilt binary
  ([Quick start](https://cpp-linter.github.io/cpp-linter-rs/#quick-start));
- on GitLab, `--code-quality-file` writes a Code Quality report that shows the findings in merge
  requests;
- on your own machine, it checks your uncommitted changes, so you can fix them before you push.

The command line is where 2.0 is fastest. cpp-linter 1.x checks one file at a time unless you pass
`--jobs`, and 2.0 always uses every core. On a GitHub-hosted `ubuntu-24.04` runner (4 vCPU), a
full run over the 133 C files of libgit2 with clang 18 took 270 s with 1.x and 103 s with 2.0, with
the same findings.

![cpp-linter 1.16.1 takes 270 s and cpp-linter 2.0 takes 103 s for the same full run](../../static/blog/v3/race-light.svg#only-light)
![cpp-linter 1.16.1 takes 270 s and cpp-linter 2.0 takes 103 s for the same full run](../../static/blog/v3/race-dark.svg#only-dark)

We measured both with hyperfine. The [benchmark workflow](https://github.com/cpp-linter/test-cpp-linter-action/blob/65bf51cadf77482bcd893fbcfd8cefb7c3c7f6c3/.github/workflows/bench.yml)
has every command, so you can run it yourself.

## Thank you

cpp-linter 2.0 is the result of more than two years of work by
[@2bndy5](https://github.com/2bndy5), who rewrote cpp-linter in Rust and built the clang tools
installer it relies on. Thank you also to everyone who tried the release candidates and reported
what broke.

If v3 helps your team, a star on
[cpp-linter-action](https://github.com/cpp-linter/cpp-linter-action) helps others find it.
