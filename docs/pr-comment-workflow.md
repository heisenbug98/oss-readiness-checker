# PR Comment Workflow

This document describes the maintainer workflow for posting `oss-ready` Markdown reports to pull requests.

The first implementation lives in `.github/workflows/oss-readiness-comment.yml`. It is intentionally small and reviewable before adding API-assisted summaries or a hosted bot.

## Goal

Help maintainers see whether a pull request changes visible repository maintenance signals.

The workflow should make missing basics easy to notice without blocking every contribution or pretending that a score is a complete measure of project quality.

## Proposed Flow

1. A pull request opens or updates.
2. CI checks out the branch with full git history.
3. `oss-ready . --markdown` generates a report.
4. The workflow posts or updates one PR comment with the latest report.
5. Maintainers use the report as triage context during review.

## Minimal Implementation Shape

- Keep the CLI as the source of truth for scoring.
- Use Markdown output directly for the PR comment body.
- Use a hidden marker comment so pushes update one existing bot comment.
- Keep hard score gates separate from the comment workflow.

## API Credits Use Case

API credits could add a concise maintainer summary above the raw report:

- Explain the most important missing signal in plain language.
- Draft a small checklist for the PR author.
- Suggest release note or changelog text when release signals changed.
- Keep tone neutral and avoid judging project value from stars or forks.

## Non-goals

- Do not generate fake activity, stars, forks, or engagement.
- Do not rank repositories against each other.
- Do not claim eligibility for grants or support programs.
- Do not auto-merge or auto-reject pull requests based only on the score.
