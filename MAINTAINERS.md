# Maintainers

## Primary Maintainer

- GitHub: https://github.com/heisenbug98
- Role: primary maintainer
- Scope: roadmap, issue triage, pull request review, release management, and documentation quality.

## Maintenance Principles

- Keep the project small, explainable, and useful for early open source maintainers.
- Prefer real maintainer workflow improvements over activity that only makes the repository look busy.
- Keep scoring transparent and document why checks are weighted.
- Treat stars, forks, and watchers as context, not as proof of project quality.
- Make every release traceable through tests, a pull request, and a changelog entry.

## Review Expectations

- Each feature change should include tests or a clear reason tests are not useful.
- Documentation changes should keep examples runnable and avoid unsupported claims.
- Workflow changes should be safe for pull requests and avoid posting duplicate comments.
- Public API or output changes should be reflected in README examples and sample reports.

## Release Checklist

1. Run `npm test`.
2. Run `node ./bin/oss-ready.js . --fail-under 90`.
3. Run `node ./bin/oss-ready.js . --json`.
4. Run `node ./bin/oss-ready.js . --markdown`.
5. Update `CHANGELOG.md` when user-facing behavior changes.
6. Create a GitHub release only for package or CLI behavior changes.
