# Scoring Rationale

OSS Readiness Checker uses a 100 point score to make common maintainer signals easy to scan.

The score is not a measure of project value, popularity, or eligibility for any support program. It is a checklist for visible maintenance basics that help users and contributors understand whether a repository is ready to inspect, use, or contribute to.

## Weights

| Check | Weight | Why it matters |
| --- | ---: | --- |
| README | 16 | The README is the first place users learn what the project does, how to run it, and whether it is relevant. |
| License | 12 | A clear license makes reuse and contribution legally understandable. |
| Contributing guide | 10 | Contribution instructions reduce guesswork for first-time contributors. |
| Code of conduct | 7 | Community expectations make participation safer and clearer. |
| Security policy | 8 | A security contact path helps users report sensitive issues responsibly. |
| Issue templates | 8 | Templates make bug reports and feature requests easier to triage. |
| Pull request template | 8 | A PR checklist helps maintainers review changes consistently. |
| Tests | 8 | A test script gives maintainers and contributors a basic regression signal. |
| CI workflows | 8 | CI makes checks repeatable for pull requests and releases. |
| Commit activity | 7 | Recent real commits show that the repository is not abandoned. |
| Changelog | 6 | A changelog helps users understand what changed across versions. |
| Release tags | 8 | Release tags make tested versions easier to find and reference. |

## Design Choices

- Documentation and licensing carry the most weight because they decide whether a new user can understand and legally reuse the project.
- Review and triage files are grouped in the middle because they help maintainers handle incoming work.
- Tests, CI, changelog, and release tags make maintenance repeatable without requiring a large project.
- Stars, forks, and watchers are shown as context in remote scans but are not used for scoring.

## Rating Bands

| Score | Rating | Meaning |
| ---: | --- | --- |
| 85-100 | ready | The repository has most visible maintainer basics in place. |
| 60-84 | close | The repository is missing a few important signals. |
| 0-59 | needs-work | The repository should start with core docs, licensing, tests, or release basics. |

## Limits

The tool cannot know whether a project is useful, secure, popular, or well governed. It only checks visible signals that are common across many open source repositories.
