import { CHECKS, buildReport } from "./checks.js";

const GITHUB_URL_PATTERN = /^(?:https?:\/\/)?github\.com\/([^/\s]+)\/([^/\s#?]+)(?:\/)?$/i;
const OWNER_REPO_PATTERN = /^([A-Za-z0-9][A-Za-z0-9-]*)\/([A-Za-z0-9._-]+)$/;
const RECENT_PUSH_WINDOW_DAYS = 180;

export function parseGitHubRepository(input) {
  const trimmed = input?.trim();

  if (!trimmed) {
    return null;
  }

  const githubUrlMatch = trimmed.match(GITHUB_URL_PATTERN);
  if (githubUrlMatch) {
    return normalizeRepositoryParts(githubUrlMatch[1], githubUrlMatch[2]);
  }

  const ownerRepoMatch = trimmed.match(OWNER_REPO_PATTERN);
  if (ownerRepoMatch) {
    return normalizeRepositoryParts(ownerRepoMatch[1], ownerRepoMatch[2]);
  }

  return null;
}

export async function analyzeGitHubRepository(repository, options = {}) {
  const client = createGitHubClient(options);
  const repo = await client.getJson(`/repos/${repository.owner}/${repository.name}`);

  const checks = createRemoteChecks(repo, client);
  const results = await Promise.all(
    CHECKS.map(async (check) => {
      const value = await checks[check.id]();
      const passed = Boolean(value);

      return {
        id: check.id,
        title: check.title,
        passed,
        weight: check.weight,
        found: getFoundValue(value),
        advice: passed ? null : check.advice,
      };
    }),
  );

  return buildReport({
    mode: "github",
    path: null,
    repositoryUrl: repo.html_url,
    githubRemote: repo.html_url,
    metrics: {
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      watchers: repo.subscribers_count ?? repo.watchers_count,
      defaultBranch: repo.default_branch,
      latestRelease: await getLatestRelease(repo, client),
      lastPushedAt: repo.pushed_at,
      isFork: repo.fork,
    },
    results,
  });
}

function normalizeRepositoryParts(owner, name) {
  const normalizedName = name.replace(/\.git$/i, "");

  return {
    owner,
    name: normalizedName,
    slug: `${owner}/${normalizedName}`,
  };
}

function createGitHubClient(options) {
  const fetchImpl = options.fetch ?? globalThis.fetch;

  if (!fetchImpl) {
    throw new Error("GitHub remote scanning requires Node.js 18 or a fetch implementation.");
  }

  const token = options.env?.GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;
  const headers = {
    Accept: "application/vnd.github+json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return {
    async getJson(endpoint, requestOptions = {}) {
      const url = new URL(endpoint, "https://api.github.com");

      try {
        const response = await fetchImpl(url, { headers });

        if (response.status === 404 && requestOptions.optional) {
          return null;
        }

        if (!response.ok) {
          const body = await readErrorBody(response);
          throw new Error(`GitHub API request failed (${response.status}): ${body}`);
        }

        return response.json();
      } catch (error) {
        if (error.message?.startsWith("GitHub API request failed")) {
          throw error;
        }

        throw new Error(`Could not reach GitHub API: ${error.message}`);
      }
    },
  };
}

function createRemoteChecks(repo, client) {
  return {
    readme: async () => {
      const readme = await client.getJson(`/repos/${repo.full_name}/readme`, { optional: true });
      return readme?.path ? { found: readme.path } : null;
    },
    license: async () => {
      if (repo.license?.spdx_id) {
        return { found: repo.license.spdx_id };
      }

      return findFirstContent(repo, client, ["LICENSE", "LICENSE.md", "COPYING"]);
    },
    contributing: async () =>
      findFirstContent(repo, client, ["CONTRIBUTING.md", ".github/CONTRIBUTING.md"]),
    code_of_conduct: async () =>
      findFirstContent(repo, client, ["CODE_OF_CONDUCT.md", ".github/CODE_OF_CONDUCT.md"]),
    security: async () => findFirstContent(repo, client, ["SECURITY.md", ".github/SECURITY.md"]),
    issue_templates: async () => findDirectoryWithFiles(repo, client, ".github/ISSUE_TEMPLATE"),
    pull_request_template: async () =>
      findFirstContent(repo, client, [
        "PULL_REQUEST_TEMPLATE.md",
        ".github/PULL_REQUEST_TEMPLATE.md",
        ".github/pull_request_template.md",
      ]),
    tests_or_ci: async () => hasTestScript(repo, client),
    ci_workflows: async () => findDirectoryWithFiles(repo, client, ".github/workflows"),
    recent_commits: async () => hasRecentPush(repo.pushed_at),
    changelog: async () => findFirstContent(repo, client, ["CHANGELOG.md", "HISTORY.md", "RELEASES.md"]),
    release_tags: async () => getReleaseTag(repo, client),
  };
}

async function findFirstContent(repo, client, candidates) {
  for (const candidate of candidates) {
    const content = await getContent(repo, client, candidate);

    if (content) {
      return { found: content.path ?? candidate };
    }
  }

  return null;
}

async function findDirectoryWithFiles(repo, client, directoryPath) {
  const content = await getContent(repo, client, directoryPath);

  if (!Array.isArray(content)) {
    return null;
  }

  return content.some((entry) => !entry.name.startsWith(".")) ? { found: directoryPath } : null;
}

async function hasTestScript(repo, client) {
  const packageJson = await getContent(repo, client, "package.json");

  if (!packageJson?.content) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(packageJson.content, "base64").toString("utf8"));
    return parsed.scripts?.test ? { found: "package.json" } : null;
  } catch {
    return null;
  }
}

function hasRecentPush(pushedAt) {
  if (!pushedAt) {
    return null;
  }

  const pushedTime = new Date(pushedAt).getTime();
  const windowMs = RECENT_PUSH_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  if (Number.isNaN(pushedTime) || Date.now() - pushedTime > windowMs) {
    return null;
  }

  return { found: `pushed ${pushedAt.slice(0, 10)}` };
}

async function getReleaseTag(repo, client) {
  const latestRelease = await client.getJson(`/repos/${repo.full_name}/releases/latest`, {
    optional: true,
  });

  if (latestRelease?.tag_name) {
    return { found: latestRelease.tag_name };
  }

  const tags = await client.getJson(`/repos/${repo.full_name}/tags?per_page=100`, {
    optional: true,
  });
  const releaseTag = Array.isArray(tags)
    ? tags
        .map((tag) => tag.name)
        .filter((tag) => tag?.startsWith("v"))
        .sort(compareTags)
        .at(-1)
    : null;

  return releaseTag ? { found: releaseTag } : null;
}

async function getLatestRelease(repo, client) {
  const latestRelease = await client.getJson(`/repos/${repo.full_name}/releases/latest`, {
    optional: true,
  });

  return latestRelease?.tag_name ?? null;
}

async function getContent(repo, client, contentPath) {
  return client.getJson(`/repos/${repo.full_name}/contents/${encodeContentPath(contentPath)}`, {
    optional: true,
  });
}

function encodeContentPath(contentPath) {
  return contentPath.split("/").map(encodeURIComponent).join("/");
}

function getFoundValue(value) {
  return typeof value?.found === "string" ? value.found : null;
}

function compareTags(left, right) {
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
}

async function readErrorBody(response) {
  try {
    const body = await response.json();
    return body.message ?? response.statusText;
  } catch {
    return response.statusText;
  }
}
