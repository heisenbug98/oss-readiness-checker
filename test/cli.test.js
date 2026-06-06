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
