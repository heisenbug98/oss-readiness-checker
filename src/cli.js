import { existsSync } from "node:fs";
import path from "node:path";

import { analyzeRepository } from "./checks.js";
import { analyzeGitHubRepository, parseGitHubRepository } from "./github.js";

export async function runCli(args, io) {
  const parsed = parseArgs(args);

  if (parsed.help) {
    io.stdout.write(getHelp());
    return 0;
  }

  const report = await analyzeTarget(parsed.repoPath ?? io.cwd, io);

  if (parsed.format === "json") {
    io.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else if (parsed.format === "markdown") {
    io.stdout.write(formatMarkdownReport(report));
  } else {
    io.stdout.write(formatReport(report));
  }

  if (parsed.failUnder !== null && report.score < parsed.failUnder) {
    io.stderr.write(`Score ${report.score} is below required threshold ${parsed.failUnder}.\n`);
    return 1;
  }

  return 0;
}

async function analyzeTarget(target, io) {
  const githubRepository = parseGitHubRepository(target);
  const localPath = path.resolve(io.cwd, target);

  if (githubRepository && !existsSync(localPath)) {
    return analyzeGitHubRepository(githubRepository, {
      fetch: io.fetch,
      env: io.env,
    });
  }

  return analyzeRepository(localPath);
}

function parseArgs(args) {
  const parsed = {
    help: false,
    format: "text",
    failUnder: null,
    repoPath: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--json") {
      setFormat(parsed, "json");
    } else if (arg === "--markdown") {
      setFormat(parsed, "markdown");
    } else if (arg === "--fail-under") {
      index += 1;
      parsed.failUnder = parseScore(args[index]);
    } else if (arg.startsWith("--fail-under=")) {
      parsed.failUnder = parseScore(arg.slice("--fail-under=".length));
    } else if (!parsed.repoPath) {
      parsed.repoPath = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  return parsed;
}

function setFormat(parsed, format) {
  if (parsed.format !== "text") {
    throw new Error("Choose only one output format: --json or --markdown.");
  }

  parsed.format = format;
}

function parseScore(value) {
  if (!/^\d+$/.test(value ?? "")) {
    throw new Error("--fail-under must be an integer from 0 to 100.");
  }

  const score = Number(value);

  if (!Number.isInteger(score) || score < 0 || score > 100) {
    throw new Error("--fail-under must be an integer from 0 to 100.");
  }

  return score;
}

function formatReport(report) {
  const lines = [
    `OSS readiness score: ${report.score}/100 (${report.rating})`,
    `Repository: ${getRepositoryLabel(report)}`,
  ];

  if (report.githubRemote) {
    lines.push(`GitHub remote: ${report.githubRemote}`);
  }

  if (report.metrics) {
    lines.push(
      `GitHub metrics: ${formatMetrics(report.metrics)}`,
      `Last pushed: ${report.metrics.lastPushedAt ?? "unknown"}`,
    );
  }

  lines.push("", "Checks:");

  for (const result of report.results) {
    const icon = result.passed ? "OK" : "--";
    const found = result.found ? ` (${result.found})` : "";
    lines.push(`  ${icon} ${result.title}${found}`);

    if (!result.passed) {
      lines.push(`     ${result.advice}`);
    }
  }

  lines.push("", getNextStep(report.score), "");
  return lines.join("\n");
}

function formatMarkdownReport(report) {
  const lines = [
    "# OSS readiness report",
    "",
    `**Score:** ${report.score}/100 (${report.rating})`,
    `**Repository:** \`${getRepositoryLabel(report)}\``,
  ];

  if (report.githubRemote) {
    lines.push(`**GitHub remote:** \`${report.githubRemote}\``);
  }

  if (report.metrics) {
    lines.push(
      `**GitHub metrics:** ${escapeMarkdownTableCell(formatMetrics(report.metrics))}`,
      `**Last pushed:** \`${report.metrics.lastPushedAt ?? "unknown"}\``,
    );
  }

  lines.push("", "| Status | Check | Evidence | Advice |", "| --- | --- | --- | --- |");

  for (const result of report.results) {
    const status = result.passed ? "Passed" : "Missing";
    const evidence = result.found ? `\`${escapeMarkdownTableCell(result.found)}\`` : "-";
    const advice = result.advice ? escapeMarkdownTableCell(result.advice) : "-";
    lines.push(`| ${status} | ${escapeMarkdownTableCell(result.title)} | ${evidence} | ${advice} |`);
  }

  lines.push("", `**Next step:** ${getNextStep(report.score).replace("Next step: ", "")}`, "");
  return lines.join("\n");
}

function escapeMarkdownTableCell(value) {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function getRepositoryLabel(report) {
  return report.path ?? report.repositoryUrl;
}

function formatMetrics(metrics) {
  const parts = [
    `${metrics.stars ?? 0} stars`,
    `${metrics.forks ?? 0} forks`,
    `${metrics.openIssues ?? 0} open issues`,
  ];

  if (metrics.defaultBranch) {
    parts.push(`default branch ${metrics.defaultBranch}`);
  }

  if (metrics.latestRelease) {
    parts.push(`latest release ${metrics.latestRelease}`);
  }

  return parts.join(", ");
}

function getNextStep(score) {
  if (score >= 85) {
    return "Next step: publish the repository, make one useful release, and invite real feedback.";
  }

  if (score >= 60) {
    return "Next step: fill the missing maintenance files and add one real usage example.";
  }

  return "Next step: start with README, LICENSE, CONTRIBUTING, and a tiny test.";
}

function getHelp() {
  return `oss-ready

Check whether a repository has basic open source maintenance signals.

Usage:
  oss-ready [path]
  oss-ready owner/repo
  oss-ready https://github.com/owner/repo
  oss-ready [path] --json
  oss-ready [path] --markdown
  oss-ready [path] --fail-under 80

Options:
  -h, --help             Show this help message
  --json                 Print a JSON report
  --markdown             Print a Markdown report
  --fail-under <score>   Exit with code 1 when the score is below this threshold
`;
}
