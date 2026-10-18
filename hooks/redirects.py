"""Write redirect pages for old URLs that still get visits.

GitHub Pages cannot send real redirects, so each old path gets a small page
that forwards the browser with a meta refresh and tells search engines where
the content lives now. The paths are the ones Google Analytics recorded as
404s on this site: pages that moved into the sponsor page, short names for the
getting started guide, and doc pages of cpp-linter-action, cpp-linter and
cpp-linter-rs requested without their project prefix.

A key ending in .html is written as that file; any other key is a directory
and gets an index.html. Targets are relative to site_url.
"""

from __future__ import annotations

import html
from pathlib import Path

REDIRECTS = {
    "docs/": "getting-started/",
    "merch/": "sponsor/#t-shirt-perk",
    "inputs-outputs/": "cpp-linter-action/inputs-outputs/",
    "examples/": "cpp-linter-action/examples/",
    "permissions/": "cpp-linter-action/permissions/",
    "pr-review-caveats/": "cpp-linter-action/pr-review-caveats/",
    "cli_args/": "cpp-linter/cli_args.html",
    "cpp_linter_rs/": "cpp-linter-rs/",
    "cpp_linter_rs/cli.html": "cpp-linter-rs/cli/",
}

PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Redirecting to {url}</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="{url}">
<meta http-equiv="refresh" content="0; url={url}">
<script>location.replace({url_js})</script>
</head>
<body>
<p>This page has moved to <a href="{url}">{url}</a>.</p>
</body>
</html>
"""


def on_post_build(config, **kwargs) -> None:
    site_dir = Path(config["site_dir"])
    site_url = config["site_url"]
    for source, target in REDIRECTS.items():
        path = site_dir / source
        if not source.endswith(".html"):
            path = path / "index.html"
        if path.exists():
            raise ValueError(f"redirect from {source} would replace a built page")
        url = site_url + target
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            PAGE.format(url=html.escape(url), url_js=repr(url)), encoding="utf-8"
        )
