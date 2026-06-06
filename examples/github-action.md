# GitHub Actions Example

Use `oss-ready` in CI when you want a pull request or release branch to keep basic maintainer signals visible.

This example installs dependencies, runs tests, and fails the workflow if the repository score drops below 80.

```yaml
name: OSS readiness

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  readiness:
    runs-on: ubuntu-latest

    steps:
      - name: Check out repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Check OSS readiness
        run: node ./bin/oss-ready.js . --fail-under 80
```

For a public repository scan, use the remote mode. Set `GITHUB_TOKEN` for higher GitHub API rate limits.

```yaml
- name: Check public repository readiness
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: node ./bin/oss-ready.js owner/repo --markdown
```
