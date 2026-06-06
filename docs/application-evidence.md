# Application Evidence

This document collects public evidence that OSS Readiness Checker is being maintained through real project workflows.

It is not a guarantee of eligibility for any support program. It is a concise record of repository activity, release discipline, testing, and external open source participation.

## Repository

- Repository: https://github.com/heisenbug98/oss-readiness-checker
- Latest release: https://github.com/heisenbug98/oss-readiness-checker/releases/tag/v0.3.0
- Public launch note: https://gist.github.com/heisenbug98/0e2b0626489092f84cfea2bec95abed3
- Role: primary maintainer

## Maintainer Workflow Evidence

- Issue #7: https://github.com/heisenbug98/oss-readiness-checker/issues/7
- PR #8: https://github.com/heisenbug98/oss-readiness-checker/pull/8
- Issue #9: https://github.com/heisenbug98/oss-readiness-checker/issues/9
- PR #10: https://github.com/heisenbug98/oss-readiness-checker/pull/10
- Issue #11: https://github.com/heisenbug98/oss-readiness-checker/issues/11
- PR #12: https://github.com/heisenbug98/oss-readiness-checker/pull/12
- Release v0.3.0: https://github.com/heisenbug98/oss-readiness-checker/releases/tag/v0.3.0
- Local readiness score: 100/100 with `node ./bin/oss-ready.js . --fail-under 90`
- Remote readiness score: 100/100 with `node ./bin/oss-ready.js heisenbug98/oss-readiness-checker --markdown`
- CI: GitHub Actions test workflow passed on the merged PR.
- Maintainer docs: scoring rationale, PR comment workflow, GitHub Actions usage, and publishing preparation.

## External Open Source Evidence

- External PR: https://github.com/EbookFoundation/free-programming-books/pull/13298
- Status checked on 2026-06-07 KST: open, mergeable, and all visible checks passing.
- Contribution: add a free Korean Linux command line book entry with author, translator, format, and license metadata.

## What The Project Does

OSS Readiness Checker helps maintainers inspect visible repository trust signals before sharing a project, inviting contributors, or preparing for support program applications.

It checks for maintainer basics such as README, license, contribution guide, security policy, issue templates, PR template, tests, CI workflows, changelog, release tags, and recent activity.

The v0.3.0 release added public GitHub repository scanning so a maintainer can inspect a repo by `owner/repo` or GitHub URL, not only from a local checkout. Later documentation work added application evidence, scoring rationale, a PR comment workflow, maintainer responsibilities, and npm publishing preparation.

## Short Application Drafts

Why this repository qualifies:

```text
OSS Readiness Checker is a maintained CLI I built to help public repos surface maintainer readiness signals: docs, license, security policy, templates, tests, CI, changelog, releases, and public GitHub scans. It has issue->PR->CI->merge workflows, v0.3.0 release, 100/100 self-checks, PR comment automation docs, maintainer docs, tests for API failures, and an external OSS PR with all checks passing.
```

How API credits would be used:

```text
I would use API credits to turn the CLI into practical maintainer automation: summarize readiness reports for PR comments, suggest missing docs/templates, draft changelog and release notes, and review small OSS maintenance changes. The goal is useful triage and release support for early maintainers, not fake activity, star exchanges, or artificial GitHub signals.
```
