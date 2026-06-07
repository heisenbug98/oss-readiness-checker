# OSS Readiness Checker

`oss-ready` is a small CLI that checks whether a local repository or public GitHub repository has the basic public signals expected from a maintained open source project.

It is built for new maintainers who want a quick, honest checklist before sharing a project, applying to open source support programs, or inviting contributors.

The goal is not to fake activity. The goal is to make real maintenance easier to start.

## Who this is for

- New maintainers preparing a small repository for public feedback.
- Project owners who want a quick checklist before inviting contributors.
- Maintainers who want CI-friendly reminders for docs, security, templates, tests, and releases.
- People evaluating their own repository before writing an honest support-program application.

## What it checks

- README
- License
- Contributing guide
- Code of conduct
- Security policy
- Issue templates
- Pull request template
- Tests
- CI workflows
- Commit activity
- Changelog
- Release tags

When a GitHub origin remote exists, the report also prints it. When you scan a public GitHub repository, the report includes lightweight metadata such as stars, forks, open issues, default branch, latest release, and last pushed date. These metrics are shown as context, not as score multipliers.

## Install

Install the CLI from npm:

```bash
npm install -g oss-ready
oss-ready .
```

Or run it without a global install:

```bash
npx oss-ready .
```

You can also clone the repository and run the CLI locally:

```bash
git clone https://github.com/heisenbug98/oss-readiness-checker.git
cd oss-readiness-checker
node ./bin/oss-ready.js .
```

## Usage

Run it against the current repository:

```bash
oss-ready .
```

Or run it against another path:

```bash
oss-ready ../some-repo
```

Analyze a public GitHub repository:

```bash
oss-ready heisenbug98/oss-readiness-checker
oss-ready https://github.com/heisenbug98/oss-readiness-checker
```

Remote scans use the public GitHub API. Set `GITHUB_TOKEN` if you want higher API rate limits, but it is not required for public repositories.

Print JSON:

```bash
oss-ready . --json
```

Print Markdown for a GitHub issue, pull request comment, or release note:

```bash
oss-ready . --markdown
```

Use it in CI with a minimum score:

```bash
oss-ready . --fail-under 80
```

## Example output

```text
OSS readiness score: 79/100 (close)
Repository: /path/to/repo

Checks:
  OK README (README.md)
  OK License (LICENSE)
  OK Tests (package.json)
  OK CI workflows (.github/workflows)
  OK Changelog (CHANGELOG.md)
  OK Release tags (v0.3.0)
  -- Contributing guide
     Add CONTRIBUTING.md with setup steps, contribution scope, and PR expectations.
```

## Why this exists

Many small open source projects are useful but hard to evaluate because the maintenance basics are missing or scattered. This tool makes those signals visible so maintainers can improve them one by one.

It does not try to predict eligibility for any specific grant or support program. It simply checks common public signals that make a repository easier to understand, trust, and contribute to.

## Documentation

- [Maintainer checklist](docs/maintainer-checklist.md)
- [Scoring rationale](docs/scoring.md)
- [Roadmap](docs/roadmap.md)
- [Application evidence](docs/application-evidence.md)
- [PR comment workflow](docs/pr-comment-workflow.md)
- [GitHub Actions example](examples/github-action.md)
- [Publishing preparation](docs/publishing.md)
- [Sample report](examples/sample-report.txt)
- [Sample Markdown report](examples/sample-report.md)
- [Sample GitHub report](examples/github-report.md)
- [Maintainers](MAINTAINERS.md)

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
