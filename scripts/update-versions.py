#!/usr/bin/env python3
"""Set the cpp-linter-hooks `rev:` in the pages' examples to the latest release.

Usage:
    python3 scripts/update-versions.py [tag]

Without a tag, the script asks GitHub for the latest cpp-linter-hooks release.
Blog posts are left alone: each one shows the version of the day it was written.
"""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.request
from pathlib import Path

HOOKS_REPO = "cpp-linter/cpp-linter-hooks"
DOCS = Path(__file__).resolve().parent.parent / "docs"
REV = re.compile(
    rf"(repo: https://github\.com/{re.escape(HOOKS_REPO)}\s*\n\s*rev: )v[0-9][0-9.]*"
)


def latest_tag(repo: str) -> str:
    request = urllib.request.Request(
        f"https://api.github.com/repos/{repo}/releases/latest",
        headers={"Accept": "application/vnd.github+json"},
    )
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        request.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)["tag_name"]


def main() -> None:
    tag = sys.argv[1] if len(sys.argv) > 1 else latest_tag(HOOKS_REPO)
    if not re.fullmatch(r"v[0-9]+\.[0-9]+\.[0-9]+", tag):
        sys.exit(f"Unexpected {HOOKS_REPO} tag: {tag!r}")
    for page in sorted(DOCS.glob("*.md")):
        text = page.read_text(encoding="utf-8")
        updated = REV.sub(rf"\g<1>{tag}", text)
        if updated != text:
            page.write_text(updated, encoding="utf-8")
            print(f"{page.name}: rev set to {tag}")


if __name__ == "__main__":
    main()
