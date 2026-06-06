import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import { runCli } from "../src/cli.js";

test("returns a failing exit code when score is below threshold", async () => {
  const repoPath = mkdtempSync(path.join(tmpdir(), "oss-ready-"));
  writeFileSync(path.join(repoPath, "README.md"), "# Example\n");
  const output = captureOutput();

  const exitCode = await runCli([repoPath, "--fail-under", "80"], {
    cwd: repoPath,
    stdout: output.stdout,
    stderr: output.stderr,
  });

  assert.equal(exitCode, 1);
  assert.match(output.stderr.text, /below required threshold 80/);
});

test("prints JSON when requested", async () => {
  const repoPath = mkdtempSync(path.join(tmpdir(), "oss-ready-"));
  writeFileSync(path.join(repoPath, "README.md"), "# Example\n");
  const output = captureOutput();

  const exitCode = await runCli([repoPath, "--json"], {
    cwd: repoPath,
    stdout: output.stdout,
    stderr: output.stderr,
  });

  const report = JSON.parse(output.stdout.text);
  assert.equal(exitCode, 0);
  assert.equal(report.results.find((result) => result.id === "readme").passed, true);
});

test("prints Markdown when requested", async () => {
  const repoPath = mkdtempSync(path.join(tmpdir(), "oss-ready-"));
  writeFileSync(path.join(repoPath, "README.md"), "# Example\n");
  const output = captureOutput();

  const exitCode = await runCli([repoPath, "--markdown"], {
    cwd: repoPath,
    stdout: output.stdout,
    stderr: output.stderr,
  });

  assert.equal(exitCode, 0);
  assert.match(output.stdout.text, /^# OSS readiness report/);
  assert.match(output.stdout.text, /\| Passed \| README \| `README.md` \| - \|/);
  assert.match(output.stdout.text, /\| Missing \| License \| - \| Add a clear open source license/);
});

test("prints remote GitHub metrics in Markdown reports", async () => {
  const output = captureOutput();

  const exitCode = await runCli(["heisenbug98/oss-readiness-checker", "--markdown"], {
    cwd: process.cwd(),
    stdout: output.stdout,
    stderr: output.stderr,
    fetch: createRemoteFetch(),
  });

  assert.equal(exitCode, 0);
  assert.match(output.stdout.text, /Repository:\*\* `https:\/\/github.com\/heisenbug98\/oss-readiness-checker`/);
  assert.match(output.stdout.text, /GitHub metrics:\*\* 1 stars, 0 forks, 0 open issues/);
  assert.match(output.stdout.text, /\| Passed \| Release tags \| `v0.3.0` \| - \|/);
});

test("rejects multiple output formats", async () => {
  const output = captureOutput();

  await assert.rejects(
    () =>
      runCli(["--json", "--markdown"], {
        cwd: process.cwd(),
        stdout: output.stdout,
        stderr: output.stderr,
      }),
    /Choose only one output format/,
  );
});

test("rejects invalid fail-under scores", async () => {
  const output = captureOutput();

  for (const value of ["80abc", "80.5", "-1", "101", ""]) {
    await assert.rejects(
      () =>
        runCli(["--fail-under", value], {
          cwd: process.cwd(),
          stdout: output.stdout,
          stderr: output.stderr,
        }),
      /--fail-under must be an integer from 0 to 100/,
    );
  }
});

function captureOutput() {
  return {
    stdout: {
      text: "",
      write(chunk) {
        this.text += chunk;
      },
    },
    stderr: {
      text: "",
      write(chunk) {
        this.text += chunk;
      },
    },
  };
}

function createRemoteFetch() {
  const contents = {
    "README.md": { path: "README.md" },
    "CONTRIBUTING.md": { path: "CONTRIBUTING.md" },
    "CODE_OF_CONDUCT.md": { path: "CODE_OF_CONDUCT.md" },
    "SECURITY.md": { path: "SECURITY.md" },
    ".github/PULL_REQUEST_TEMPLATE.md": { path: ".github/PULL_REQUEST_TEMPLATE.md" },
    ".github/ISSUE_TEMPLATE": [{ name: "bug.md" }],
    ".github/workflows": [{ name: "test.yml" }],
    "CHANGELOG.md": { path: "CHANGELOG.md" },
    "package.json": {
      path: "package.json",
      content: Buffer.from(JSON.stringify({ scripts: { test: "node --test" } })).toString("base64"),
    },
  };

  return async (url) => {
    const parsedUrl = new URL(String(url));
    const endpoint = parsedUrl.pathname.replace(/^\/repos\//, "");

    if (endpoint === "heisenbug98/oss-readiness-checker") {
      return jsonResponse({
        full_name: "heisenbug98/oss-readiness-checker",
        html_url: "https://github.com/heisenbug98/oss-readiness-checker",
        default_branch: "main",
        stargazers_count: 1,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 1,
        pushed_at: "2026-06-07T00:00:00Z",
        fork: false,
        license: { spdx_id: "MIT" },
      });
    }

    if (endpoint.endsWith("/readme")) {
      return jsonResponse(contents["README.md"]);
    }

    if (endpoint.endsWith("/releases/latest")) {
      return jsonResponse({ tag_name: "v0.3.0" });
    }

    const contentPath = decodeURIComponent(endpoint.split("/contents/")[1] ?? "");
    return contents[contentPath] ? jsonResponse(contents[contentPath]) : notFoundResponse();
  };
}

function jsonResponse(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function notFoundResponse() {
  return new Response(JSON.stringify({ message: "Not Found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}
