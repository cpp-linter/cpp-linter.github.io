import nox

nox.options.reuse_existing_virtualenvs = True


@nox.session
def docs(session: nox.Session) -> None:
    """Build the docs with MkDocs."""
    session.install("-r", "docs/requirements.txt")
    session.run("mkdocs", "build")


@nox.session(name="docs-live")
def docs_live(session: nox.Session) -> None:
    session.install("-r", "docs/requirements.txt")
    session.run("mkdocs", "serve", "--livereload")
