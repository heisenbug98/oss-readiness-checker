# OSS Readiness Checker

`oss-ready` is a small CLI that checks whether a repository has the basic public signals expected from a maintained open source project.

It is built for new maintainers who want a quick, honest checklist before sharing a project, applying to open source support programs, or inviting contributors.

The goal is not to fake activity. The goal is to make real maintenance easier to start.

## What it checks

- README
- License
- Contributing guide
- Code of conduct
- Security policy
- Issue templates
- Pull request template
- Tests or CI
- Commit activity

When a GitHub origin remote exists, the report also prints it.

## Install

Clone the repository and run the CLI locally:

```bash
git clone https://github.com/heisenbug98/oss-readiness-checker.git
cd oss-readiness-checker
node ./bin/oss-ready.js .
```

## Usage

Run it against the current repository:

```bash
npm run check
```

Or run it against another path:

```bash
node ./bin/oss-ready.js ../some-repo
```

Print JSON:

```bash
node ./bin/oss-ready.js . --json
```

Use it in CI with a minimum score:

```bash
node ./bin/oss-ready.js . --fail-under 80
```

## Example output

```text
OSS readiness score: 79/100 (close)
Repository: /path/to/repo

Checks:
  OK README (README.md)
  OK License (LICENSE)
  -- Contributing guide
     Add CONTRIBUTING.md with setup steps, contribution scope, and PR expectations.
```

## Why this exists

Many small open source projects are useful but hard to evaluate because the maintenance basics are missing or scattered. This tool makes those signals visible so maintainers can improve them one by one.

It does not try to predict eligibility for any specific grant or support program. It simply checks common public signals that make a repository easier to understand, trust, and contribute to.

## Documentation

- [Maintainer checklist](docs/maintainer-checklist.md)
- [Roadmap](docs/roadmap.md)
- [Sample report](examples/sample-report.txt)

## Development

```bash
npm test
npm run check
```

Run the CI-style gate locally:

```bash
node ./bin/oss-ready.js . --fail-under 80
```

## License

MIT
