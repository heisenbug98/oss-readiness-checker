import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import { analyzeRepository } from "../src/checks.js";

test("analyzes a repository with core open source files", () => {
  const repoPath = mkdtempSync(path.join(tmpdir(), "oss-ready-"));
  mkdirSync(path.join(repoPath, ".github", "ISSUE_TEMPLATE"), { recursive: true });
  mkdirSync(path.join(repoPath, ".github", "workflows"), { recursive: true });

  writeFileSync(path.join(repoPath, "README.md"), "# Example\n");
  writeFileSync(path.join(repoPath, "LICENSE"), "MIT\n");
  writeFileSync(path.join(repoPath, "CONTRIBUTING.md"), "# Contributing\n");
  writeFileSync(path.join(repoPath, "CODE_OF_CONDUCT.md"), "# Code of Conduct\n");
  writeFileSync(path.join(repoPath, "SECURITY.md"), "# Security\n");
  writeFileSync(path.join(repoPath, ".github", "PULL_REQUEST_TEMPLATE.md"), "Checklist\n");
  writeFileSync(path.join(repoPath, ".github", "ISSUE_TEMPLATE", "bug.md"), "Bug report\n");
  writeFileSync(path.join(repoPath, ".github", "workflows", "test.yml"), "name: Test\n");
  writeFileSync(path.join(repoPath, "CHANGELOG.md"), "# Changelog\n");
  writeFileSync(
    path.join(repoPath, "package.json"),
    JSON.stringify({ scripts: { test: "node --test" } }),
  );
  initGitRepository(repoPath);

  const report = analyzeRepository(repoPath);

  assert.equal(report.results.find((result) => result.id === "readme").passed, true);
  assert.equal(report.results.find((result) => result.id === "license").passed, true);
  assert.equal(report.results.find((result) => result.id === "tests_or_ci").passed, true);
  assert.equal(report.results.find((result) => result.id === "ci_workflows").passed, true);
  assert.equal(report.results.find((result) => result.id === "changelog").passed, true);
  assert.equal(report.results.find((result) => result.id === "release_tags").found, "v0.1.0");
  assert.equal(report.score, 100);
});

test("reports missing maintenance signals", () => {
  const repoPath = mkdtempSync(path.join(tmpdir(), "oss-ready-"));
  writeFileSync(path.join(repoPath, "README.md"), "# Example\n");

  const report = analyzeRepository(repoPath);

  assert.equal(report.results.find((result) => result.id === "readme").passed, true);
  assert.equal(report.results.find((result) => result.id === "license").passed, false);
  assert.equal(report.rating, "needs-work");
});

test("handles documentation-only repositories without package.json", () => {
  const repoPath = mkdtempSync(path.join(tmpdir(), "oss-ready-"));
  writeFileSync(path.join(repoPath, "README.md"), "# Documentation only\n");
  writeFileSync(path.join(repoPath, "LICENSE"), "MIT\n");
  writeFileSync(path.join(repoPath, "CHANGELOG.md"), "# Changelog\n");

  const report = analyzeRepository(repoPath);

  assert.equal(report.results.find((result) => result.id === "readme").passed, true);
  assert.equal(report.results.find((result) => result.id === "license").passed, true);
  assert.equal(report.results.find((result) => result.id === "tests_or_ci").passed, false);
  assert.equal(report.results.find((result) => result.id === "ci_workflows").passed, false);
  assert.equal(report.rating, "needs-work");
});

test("reports release tags missing when a git repository has no version tag", () => {
  const repoPath = mkdtempSync(path.join(tmpdir(), "oss-ready-"));
  writeFileSync(path.join(repoPath, "README.md"), "# Example\n");
  writeFileSync(
    path.join(repoPath, "package.json"),
    JSON.stringify({ scripts: { test: "node --test" } }),
  );
  initGitRepository(repoPath, { tag: false });

  const report = analyzeRepository(repoPath);

  assert.equal(report.results.find((result) => result.id === "recent_commits").passed, true);
  assert.equal(report.results.find((result) => result.id === "release_tags").passed, false);
});

function initGitRepository(repoPath, options = {}) {
  execFileSync("git", ["init"], { cwd: repoPath, stdio: "ignore" });
  execFileSync("git", ["config", "user.name", "OSS Ready Test"], { cwd: repoPath, stdio: "ignore" });
  execFileSync("git", ["config", "user.email", "oss-ready@example.com"], { cwd: repoPath, stdio: "ignore" });
  execFileSync("git", ["add", "."], { cwd: repoPath, stdio: "ignore" });
  execFileSync("git", ["commit", "-m", "Initial test repo"], { cwd: repoPath, stdio: "ignore" });
  if (options.tag !== false) {
    execFileSync("git", ["tag", "v0.1.0"], { cwd: repoPath, stdio: "ignore" });
  }
}
