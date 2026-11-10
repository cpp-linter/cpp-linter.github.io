---
title: Other CI systems
description: Run clang-format and clang-tidy on the files a branch changes in GitLab CI, Jenkins, Azure Pipelines and Bitbucket Pipelines, with the cpp-linter command.
hide:
  - navigation
---

# Other CI systems

[cpp-linter-action](getting-started.md#on-every-pull-request) is for GitHub Actions. On any other
CI system, run the `cpp-linter` command: it reads `git diff`, checks the C and C++ files your
branch changes with the LLVM version you pin, and writes a report.

What you get outside GitHub:

- The findings in the job log, and a Markdown report in `cpp-linter.md` that the job keeps.
- A failed job when there are findings.
- No comments or reviews on the merge request or pull request. cpp-linter posts those on GitHub
  only.

## The script

Save this as `ci/cpp-linter.sh`. It is the same for every CI system; only the job definition
around it differs.

```bash title="ci/cpp-linter.sh"
#!/usr/bin/env bash
# Checks the files this branch changes with clang-format and clang-tidy.
# Usage: ci/cpp-linter.sh <target branch>
set -euo pipefail

target="$1"
llvm=21

python3 -m venv .venv
. .venv/bin/activate
pip install --quiet 'cpp-linter<2' clang-tools
clang-tools install clang-format clang-tidy --version "$llvm" --directory .venv/bin --no-progress-bar

git fetch --quiet origin "+refs/heads/$target:refs/remotes/origin/$target"
base="$(git merge-base "origin/$target" HEAD)"

cpp-linter --version="$llvm" --style=file --tidy-checks='' \
  --files-changed-only=true --diff-base="$base" \
  --summary-output-file=cpp-linter.md 2>&1 | tee cpp-linter.log

# cpp-linter exits with 0 when it finds problems, so fail the job here.
grep -q ':0 checks-failed$' cpp-linter.log
```

- The script needs Python 3.11 or later, git and a full clone: `git merge-base` cannot find the
  point where your branch started in a shallow clone. Each job below turns shallow cloning off.
- `clang-tools` downloads static clang-format and clang-tidy binaries into the virtual
  environment, with clang's builtin headers. Nothing is installed outside `.venv`.
- `--style=file` and `--tidy-checks=''` use your `.clang-format` and `.clang-tidy`.
- `--files-changed-only=true` checks every line of the files the branch changes. Add
  `--lines-changed-only=true` to report only on the changed lines.
- clang-tidy needs a `compile_commands.json` to find your include paths and flags. Build it
  before the script runs and add `--database=build` (the directory that holds it).
- `'cpp-linter<2'` keeps the Python package. Version 2, a rewrite in Rust, is in release
  candidates and changes some options.

Run it on your machine first, from a branch of your repository:

```bash
bash ci/cpp-linter.sh main
```

## GitLab CI

```yaml title=".gitlab-ci.yml"
cpp-linter:
  image: python:3.13
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
  variables:
    GIT_DEPTH: 0
  script:
    - bash ci/cpp-linter.sh "$CI_MERGE_REQUEST_TARGET_BRANCH_NAME"
  artifacts:
    when: always
    paths:
      - cpp-linter.md
```

## Jenkins

For a multibranch pipeline, where Jenkins sets `CHANGE_TARGET` on pull request builds:

```groovy title="Jenkinsfile"
pipeline {
  agent { docker { image 'python:3.13' } }
  stages {
    stage('cpp-linter') {
      when { changeRequest() }
      steps {
        sh 'bash ci/cpp-linter.sh "$CHANGE_TARGET"'
      }
    }
  }
  post {
    always {
      archiveArtifacts artifacts: 'cpp-linter.md', allowEmptyArchive: true
    }
  }
}
```

## Azure Pipelines

```yaml title="azure-pipelines.yml"
pr:
  - main

pool:
  vmImage: ubuntu-latest

steps:
  - checkout: self
    fetchDepth: 0
  - task: UsePythonVersion@0
    inputs:
      versionSpec: '3.13'
  - script: bash ci/cpp-linter.sh "$(System.PullRequest.targetBranchName)"
    displayName: cpp-linter
    condition: eq(variables['Build.Reason'], 'PullRequest')
  - publish: cpp-linter.md
    artifact: cpp-linter
    condition: and(always(), eq(variables['Build.Reason'], 'PullRequest'))
```

The `pr` trigger works for repositories on GitHub and Bitbucket Cloud. For a repository in Azure
Repos, start the pipeline from a branch policy's build validation instead.

## Bitbucket Pipelines

```yaml title="bitbucket-pipelines.yml"
image: python:3.13

clone:
  depth: full

pipelines:
  pull-requests:
    '**':
      - step:
          name: cpp-linter
          script:
            - bash ci/cpp-linter.sh "$BITBUCKET_PR_DESTINATION_BRANCH"
          artifacts:
            - cpp-linter.md
```

## What was tested

The script was run as written, on Linux, with cpp-linter 1.16.0 and LLVM 21: it fails on a branch
with findings and passes on a clean one. The four job definitions use each system's documented
variables for the target branch, but were not run on those systems. If one does not work for
you, [open an issue](https://github.com/cpp-linter/cpp-linter.github.io/issues).

## Only clang-format, without Python

The [Docker images](https://github.com/cpp-linter/clang-tools-docker) hold the clang tools and
nothing else to install. This GitLab job checks the formatting of every source file under `src`:

```yaml title=".gitlab-ci.yml"
clang-format:
  image: ghcr.io/cpp-linter/clang-tools:21
  script:
    - find src -name '*.cpp' -o -name '*.h' | xargs -r clang-format --dry-run --Werror
```
