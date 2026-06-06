import test from "node:test";
import assert from "node:assert/strict";

import { analyzeGitHubRepository, parseGitHubRepository } from "../src/github.js";

test("parses GitHub repository inputs", () => {
  assert.deepEqual(parseGitHubRepository("heisenbug98/oss-readiness-checker"), {
    owner: "heisenbug98",
    name: "oss-readiness-checker",
    slug: "heisenbug98/oss-readiness-checker",
  });
  assert.deepEqual(parseGitHubRepository("github.com/heisenbug98/oss-readiness-checker"), {
    owner: "heisenbug98",
    name: "oss-readiness-checker",
    slug: "heisenbug98/oss-readiness-checker",
  });
  assert.deepEqual(parseGitHubRepository("https://github.com/heisenbug98/oss-readiness-checker.git"), {
    owner: "heisenbug98",
    name: "oss-readiness-checker",
    slug: "heisenbug98/oss-readiness-checker",
  });
  assert.equal(parseGitHubRepository("../some-repo"), null);
});

test("analyzes a public GitHub repository response", async () => {
  const report = await analyzeGitHubRepository(
    { owner: "heisenbug98", name: "oss-readiness-checker" },
    { fetch: createMockFetch() },
  );

  assert.equal(report.mode, "github");
  assert.equal(report.repositoryUrl, "https://github.com/heisenbug98/oss-readiness-checker");
  assert.equal(report.metrics.stars, 3);
  assert.equal(report.metrics.latestRelease, "v0.3.0");
  assert.equal(report.results.find((result) => result.id === "readme").found, "README.md");
  assert.equal(report.results.find((result) => result.id === "license").found, "MIT");
  assert.equal(report.results.find((result) => result.id === "release_tags").found, "v0.3.0");
  assert.equal(report.score, 100);
});

test("reports missing remote maintenance signals", async () => {
  const report = await analyzeGitHubRepository(
    { owner: "heisenbug98", name: "thin-repo" },
    {
      fetch: createMockFetch({
        repository: {
          full_name: "heisenbug98/thin-repo",
          html_url: "https://github.com/heisenbug98/thin-repo",
          default_branch: "main",
          stargazers_count: 0,
          forks_count: 0,
          open_issues_count: 0,
          watchers_count: 0,
          pushed_at: "2026-06-01T00:00:00Z",
          fork: false,
          license: null,
        },
        contents: {
          "README.md": { path: "README.md" },
        },
      }),
    },
  );

  assert.equal(report.results.find((result) => result.id === "readme").passed, true);
  assert.equal(report.results.find((result) => result.id === "license").passed, false);
  assert.equal(report.rating, "needs-work");
});

test("surfaces GitHub API errors clearly", async () => {
  await assert.rejects(
    () =>
      analyzeGitHubRepository(
        { owner: "missing", name: "repo" },
        {
          fetch: async () =>
            new Response(JSON.stringify({ message: "Not Found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            }),
        },
      ),
    /GitHub API request failed \(404\): Not Found/,
  );
});

test("surfaces network failures clearly", async () => {
  await assert.rejects(
    () =>
      analyzeGitHubRepository(
        { owner: "heisenbug98", name: "oss-readiness-checker" },
        {
          fetch: async () => {
            throw new Error("socket closed");
          },
        },
      ),
    /Could not reach GitHub API: socket closed/,
  );
});

function createMockFetch(overrides = {}) {
  const repository = overrides.repository ?? {
    full_name: "heisenbug98/oss-readiness-checker",
    html_url: "https://github.com/heisenbug98/oss-readiness-checker",
    default_branch: "main",
    stargazers_count: 3,
    forks_count: 1,
    open_issues_count: 2,
    subscribers_count: 4,
    pushed_at: "2026-06-07T00:00:00Z",
    fork: false,
    license: { spdx_id: "MIT" },
  };
  const defaultContents = {
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
  const contents = overrides.contents ?? defaultContents;

  return async (url) => {
    const parsedUrl = new URL(String(url));
    const endpoint = parsedUrl.pathname.replace(/^\/repos\//, "");

    if (endpoint === "heisenbug98/oss-readiness-checker" || endpoint === "heisenbug98/thin-repo") {
      return jsonResponse(repository);
    }

    if (endpoint.endsWith("/readme")) {
      return contents["README.md"] ? jsonResponse(contents["README.md"]) : notFoundResponse();
    }

    if (endpoint.endsWith("/releases/latest")) {
      return overrides.latestRelease === null
        ? notFoundResponse()
        : jsonResponse(overrides.latestRelease ?? { tag_name: "v0.3.0" });
    }

    if (endpoint.endsWith("/tags")) {
      return jsonResponse(overrides.tags ?? [{ name: "v0.3.0" }]);
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
