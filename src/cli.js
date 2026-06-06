import { analyzeRepository } from "./checks.js";

export async function runCli(args, io) {
  const parsed = parseArgs(args);

  if (parsed.help) {
    io.stdout.write(getHelp());
    return 0;
  }

  const report = analyzeRepository(parsed.repoPath ?? io.cwd);

  if (parsed.json) {
    io.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    io.stdout.write(formatReport(report));
  }

  if (parsed.failUnder !== null && report.score < parsed.failUnder) {
    io.stderr.write(`Score ${report.score} is below required threshold ${parsed.failUnder}.\n`);
    return 1;
  }

  return 0;
}

function parseArgs(args) {
  const parsed = {
    help: false,
    json: false,
    failUnder: null,
    repoPath: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--json") {
      parsed.json = true;
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

function parseScore(value) {
  const score = Number.parseInt(value, 10);

  if (!Number.isInteger(score) || score < 0 || score > 100) {
    throw new Error("--fail-under must be an integer from 0 to 100.");
  }

  return score;
}

function formatReport(report) {
  const lines = [
    `OSS readiness score: ${report.score}/100 (${report.rating})`,
    `Repository: ${report.path}`,
  ];

  if (report.githubRemote) {
    lines.push(`GitHub remote: ${report.githubRemote}`);
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
  oss-ready [path] --json
  oss-ready [path] --fail-under 80

Options:
  -h, --help             Show this help message
  --json                 Print a JSON report
  --fail-under <score>   Exit with code 1 when the score is below this threshold
`;
}
