import type { GithubPullRequestCoordinates } from '../types/review';

export function parseGithubPrUrl(url?: string): GithubPullRequestCoordinates | null {
  const trimmedUrl = url?.trim();

  if (!trimmedUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

    if (
      parsedUrl.protocol !== 'https:' ||
      parsedUrl.hostname.toLowerCase() !== 'github.com' ||
      pathParts.length !== 4 ||
      pathParts[2] !== 'pull' ||
      !/^\d+$/.test(pathParts[3])
    ) {
      return null;
    }

    const [owner, repo, , pullNumber] = pathParts;

    return {
      owner,
      repo,
      pullNumber: Number(pullNumber),
      url: `https://github.com/${owner}/${repo}/pull/${pullNumber}`,
    };
  } catch {
    return null;
  }
}
