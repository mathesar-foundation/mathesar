import { getExternalApi } from '@mathesar/api/utils/requestUtils';

/**
 * GitHub's REST API gives way more info than we have here. See [docs][1]. But
 * I've only included the bare minimum that we need.
 *
 * [1]: https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28
 */
export interface GitHubRelease {
  id: number;
  tag_name: string;
  published_at: string;
  html_url: string;
}

// Toggle these lines if you want to test with a repo that has more releases.
// const baseUrl = 'https://api.github.com/repos/microsoft/vscode';
const baseUrl = 'https://api.github.com/repos/centerofci/mathesar';

/**
 * GitHub's documentation recommends that we set the HTTP header
 * `X-GitHub-Api-Version` with the version of the API that we're using, but I
 * was not able to set that header with fetch in CORS mode. I built this code
 * using GitHub API version 2022-11-28 and I'm assuming that our needs are
 * simplistic enough that the GitHub API won't change under us. We may need
 * to revisit this.
 */
function getOneRelease(endpoint: string): Promise<GitHubRelease | undefined> {
  return getExternalApi(`${baseUrl}${endpoint}`);
}

/**
 * Use GitHub's REST API to fetch release info about Mathesar.
 */
export const gitHubReleases = {
  /** @throws Error if unable to reach GitHub */
  fetchLatest(): Promise<GitHubRelease | undefined> {
    return getOneRelease('/releases/latest');
  },

  /** @throws Error if unable to reach GitHub */
  fetchByTagName(tagName: string): Promise<GitHubRelease | undefined> {
    return getOneRelease(`/releases/tags/${tagName}`);
  },
};
