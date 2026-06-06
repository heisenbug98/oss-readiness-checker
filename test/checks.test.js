import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import { analyzeRepository } from "../src/checks.js";

test("analyzes a repository with core open source files", () => {
  const repoPath = mkdtempSync(path.join(tmpdir(), "oss-ready-"));
  mkdirSync(path.join(repoPath, ".github", "ISSUE_TEMPLATE"), { recursive: true });

  writeFileSync(path.join(repoPath, "README.md"), "# Example\n");
  writeFileSync(path.join(repoPath, "LICENSE"), "MIT\n");
  writeFileSync(path.join(repoPath, "CONTRIBUTING.md"), "# Contributing\n");
  writeFileSync(path.join(repoPath, "CODE_OF_CONDUCT.md"), "# Code of Conduct\n");
  writeFileSync(path.join(repoPath, "SECURITY.md"), "# Security\n");
  writeFileSync(path.join(repoPath, ".github", "PULL_REQUEST_TEMPLATE.md"), "Checklist\n");
  writeFileSync(path.join(repoPath, ".github", "ISSUE_TEMPLATE", "bug.md"), "Bug report\n");
  writeFileSync(
    path.join(repoPath, "package.json"),
    JSON.stringify({ scripts: { test: "node --test" } }),
  );

  const report = analyzeRepository(repoPath);

  assert.equal(report.results.find((result) => result.id === "readme").passed, true);
  assert.equal(report.results.find((result) => result.id === "license").passed, true);
  assert.equal(report.results.find((result) => result.id === "tests_or_ci").passed, true);
  assert.equal(report.score, 89);
});

test("reports missing maintenance signals", () => {
  const repoPath = mkdtempSync(path.join(tmpdir(), "oss-ready-"));
  writeFileSync(path.join(repoPath, "README.md"), "# Example\n");

  const report = analyzeRepository(repoPath);

  assert.equal(report.results.find((result) => result.id === "readme").passed, true);
  assert.equal(report.results.find((result) => result.id === "license").passed, false);
  assert.equal(report.rating, "needs-work");
});
