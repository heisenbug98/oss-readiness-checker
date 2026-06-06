# Publishing Preparation

OSS Readiness Checker is prepared for npm-style packaging, but publishing should happen only when the maintainer is ready to support public installation.

## Package Metadata

The package exposes one CLI binary:

```bash
oss-ready
```

The package should include source files, CLI entrypoint, documentation, examples, and the license. It should not include local build artifacts or private workspace files.

## Dry Run

Run these checks before publishing:

```bash
npm test
npm run check
npm run pack:dry-run
```

`npm run pack:dry-run` shows which files would be included in the package without publishing anything.

## Publish Checklist

1. Confirm `package.json` metadata is correct.
2. Confirm the CLI works from the repository root.
3. Confirm `README.md` has install and usage examples.
4. Confirm `CHANGELOG.md` describes the release.
5. Create a GitHub release for the version.
6. Publish only from a clean `main` branch.

## Installation Shape After Publish

After the package is published, users should be able to run:

```bash
npm install -g oss-readiness-checker
oss-ready .
```

The project does not currently require runtime dependencies.
