# cpp-linter.github.io

The source of <https://cpp-linter.github.io/>: the home page, Get started, Why cpp-linter, the
showcase, the blog and the community and sponsor pages.

[Website](https://cpp-linter.github.io/) ·
[Get started](https://cpp-linter.github.io/getting-started/) ·
[Discussions](https://github.com/orgs/cpp-linter/discussions)

## Build

```bash
pipx run nox -s docs       # build into site/
pipx run nox -s docs-live  # preview with live reload
```

## Files other projects use

Other repositories load these files from the published site, so do not rename or remove them
without updating those repositories:

- `docs/stylesheets/shared.css`, served at <https://cpp-linter.github.io/stylesheets/shared.css>,
  is loaded by the docs sites of cpp-linter-action, cpp-linter, clang-tools-pip and cpp-linter-rs.
  It carries the site's look (colors, header, fonts), so a change to it changes all of them.
- `docs/fonts/`, served under `https://cpp-linter.github.io/fonts/`, holds the fonts that
  `shared.css` declares (SIL Open Font License 1.1). Keep the file names in sync with it.
- `docs/install-wheel.sh`, served at <https://cpp-linter.github.io/install-wheel.sh>, is used by
  the clang-tools-wheel README and its release workflow.

## Contributing

See the [contributing guide](https://github.com/cpp-linter/.github/blob/main/CONTRIBUTING.md) and
[open an issue](https://github.com/cpp-linter/cpp-linter.github.io/issues) for anything wrong on the site.

## License

[MIT](https://github.com/cpp-linter/cpp-linter.github.io/blob/main/LICENSE)
