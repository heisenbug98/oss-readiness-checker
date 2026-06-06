import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const CHECKS = [
  {
    id: "readme",
    title: "README",
    weight: 16,
    pass: (repoPath) => findFirst(repoPath, ["README.md", "README.rst", "README.txt"]),
    advice: "Add a README with what the project does, how to install it, and one runnable example.",
  },
  {
    id: "license",
    title: "License",
    weight: 12,
    pass: (repoPath) => findFirst(repoPath, ["LICENSE", "LICENSE.md", "COPYING"]),
    advice: "Add a clear open source license such as MIT, Apache-2.0, or BSD-3-Clause.",
  },
  {
    id: "contributing",
    title: "Contributing guide",
    weight: 10,
    pass: (repoPath) => findFirst(repoPath, ["CONTRIBUTING.md", ".github/CONTRIBUTING.md"]),
    advice: "Add CONTRIBUTING.md with setup steps, contribution scope, and PR expectations.",
  },
  {
    id: "code_of_conduct",
    title: "Code of conduct",
    weight: 7,
    pass: (repoPath) => findFirst(repoPath, ["CODE_OF_CONDUCT.md", ".github/CODE_OF_CONDUCT.md"]),
    advice: "Add a code of conduct so new contributors know the community norms.",
  },
  {
    id: "security",
    title: "Security policy",
    weight: 8,
    pass: (repoPath) => findFirst(repoPath, ["SECURITY.md", ".github/SECURITY.md"]),
    advice: "Add SECURITY.md with a contact path and disclosure expectations.",
  },
  {
    id: "issue_templates",
    title: "Issue templates",
    weight: 8,
    pass: (repoPath) => findDirectoryWithFiles(path.join(repoPath, ".github", "ISSUE_TEMPLATE")),
    advice: "Add issue templates for bugs, feature requests, or documentation fixes.",
  },
  {
    id: "pull_request_template",
    title: "Pull request template",
    weight: 8,
    pass: (repoPath) =>
      findFirst(repoPath, [
        "PULL_REQUEST_TEMPLATE.md",
        ".github/PULL_REQUEST_TEMPLATE.md",
        ".github/pull_request_template.md",
      ]),
    advice: "Add a PR template with a short checklist for maintainers and contributors.",
  },
  {
    id: "tests_or_ci",
    title: "Tests",
    weight: 8,
    pass: (repoPath) => hasTestSignal(repoPath),
    advice: "Add a small test script or GitHub Actions workflow.",
  },
  {
    id: "ci_workflows",
    title: "CI workflows",
    weight: 8,
    pass: (repoPath) => findDirectoryWithFiles(path.join(repoPath, ".github", "workflows")),
    advice: "Add a GitHub Actions workflow or another visible CI configuration.",
  },
  {
    id: "recent_commits",
    title: "Commit activity",
    weight: 7,
    pass: (repoPath) => getCommitCount(repoPath) > 0,
    advice: "Make at least one real commit after the initial scaffold.",
  },
  {
    id: "changelog",
    title: "Changelog",
    weight: 6,
    pass: (repoPath) => findFirst(repoPath, ["CHANGELOG.md", "HISTORY.md", "RELEASES.md"]),
    advice: "Add a changelog so users can understand what changed between releases.",
  },
  {
    id: "release_tags",
    title: "Release tags",
    weight: 8,
    pass: (repoPath) => getLatestReleaseTag(repoPath),
    advice: "Create a release tag such as v0.1.0 after a tested release.",
  },
];

export function analyzeRepository(repoPath) {
  const absolutePath = path.resolve(repoPath);

  if (!existsSync(absolutePath) || !statSync(absolutePath).isDirectory()) {
    throw new Error(`Repository path does not exist: ${absolutePath}`);
  }

  const results = CHECKS.map((check) => {
    const value = check.pass(absolutePath);
    const passed = Boolean(value);

    return {
      id: check.id,
      title: check.title,
      passed,
      weight: check.weight,
      found: getFoundValue(absolutePath, value),
      advice: passed ? null : check.advice,
    };
  });

  const githubRemote = getGithubRemote(absolutePath);

  return buildReport({
    mode: "local",
    path: absolutePath,
    repositoryUrl: githubRemote,
    githubRemote,
    metrics: null,
    results,
  });
}

export function buildReport(report) {
  const totalWeight = CHECKS.reduce((sum, check) => sum + check.weight, 0);
  const earnedWeight = report.results.reduce((sum, result) => sum + (result.passed ? result.weight : 0), 0);
  const score = Math.round((earnedWeight / totalWeight) * 100);

  return {
    ...report,
    score,
    rating: getRating(score),
  };
}

function getFoundValue(repoPath, value) {
  if (typeof value === "string") {
    return path.relative(repoPath, value);
  }

  if (typeof value?.found === "string") {
    return value.found;
  }

  return null;
}

function findFirst(repoPath, candidates) {
  for (const candidate of candidates) {
    const fullPath = path.join(repoPath, candidate);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

function findDirectoryWithFiles(directoryPath) {
  if (!existsSync(directoryPath) || !statSync(directoryPath).isDirectory()) {
    return null;
  }

  return readdirSync(directoryPath).some((entry) => !entry.startsWith(".")) ? directoryPath : null;
}

function hasTestSignal(repoPath) {
  const packageJsonPath = path.join(repoPath, "package.json");

  if (!existsSync(packageJsonPath)) {
    return false;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    return packageJson.scripts?.test ? packageJsonPath : null;
  } catch {
    return null;
  }
}

function getCommitCount(repoPath) {
  try {
    const output = execFileSync("git", ["rev-list", "--count", "HEAD"], {
      cwd: repoPath,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    return Number.parseInt(output.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

function getLatestReleaseTag(repoPath) {
  try {
    const output = execFileSync("git", ["tag", "--list", "v*"], {
      cwd: repoPath,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split("\n")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .sort(compareTags)
      .at(-1);

    return output ? { found: output } : null;
  } catch {
    return null;
  }
}

function compareTags(left, right) {
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
}

function getGithubRemote(repoPath) {
  try {
    const output = execFileSync("git", ["remote", "get-url", "origin"], {
      cwd: repoPath,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    if (output.includes("github.com")) {
      return output;
    }
  } catch {
    return null;
  }

  return null;
}

export function getRating(score) {
  if (score >= 85) {
    return "ready";
  }

  if (score >= 60) {
    return "close";
  }

  return "needs-work";
}
