# Changelog

## Unreleased

- Add a PR comment workflow MVP for Markdown readiness reports.
- Document scoring rationale, maintainer responsibilities, and npm publishing preparation.
- Add package metadata and a packaging dry-run script for npm readiness.
- Add fixture tests for documentation-only repositories, missing release tags, rate limits, and tag fallback behavior.

## 0.3.0

- Add GitHub remote scan mode for public repositories by `owner/repo` or GitHub URL.
- Include remote repository metadata in text, JSON, and Markdown reports.
- Add tests for GitHub URL parsing, mocked API checks, API errors, and network failures.
- Update documentation with remote scan examples and a sample GitHub report.

## 0.2.0

- Add release-readiness checks for changelogs, CI workflows, and release tags.
- Rebalance readiness scoring to keep the total score at 100.
- Update sample reports and documentation for release management signals.

## 0.1.1

- Validate `--fail-under` values strictly so partial numbers such as `80abc` are rejected.

## 0.1.0

- Add the first `oss-ready` CLI.
- Check common open source maintenance files and testing signals.
- Support text, JSON, and Markdown output.
- Support `--fail-under` for CI usage.
