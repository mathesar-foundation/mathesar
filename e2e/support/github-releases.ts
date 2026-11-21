import type { BrowserContext, Route } from '@playwright/test';

const RELEASES_API =
  'https://api.github.com/repos/centerofci/mathesar/releases';

export interface Release {
  tagName: string;
  publishedAt?: string;
}

function fulfillWithRelease(route: Route, release: Release): Promise<void> {
  const { tagName, publishedAt = '2026-01-01T00:00:00Z' } = release;
  return route.fulfill({
    json: {
      id: 1,
      tag_name: tagName,
      published_at: publishedAt,
      html_url: `https://github.com/mathesar-foundation/mathesar/releases/tag/${tagName}`,
    },
  });
}

async function readRunningVersion(route: Route): Promise<string> {
  const commonData = await route
    .request()
    .frame()
    .locator('#common-data')
    .textContent();
  const { current_release_tag_name: version } = JSON.parse(
    commonData ?? '{}',
  ) as { current_release_tag_name: string };
  return version;
}

/**
 * Answers the app's release lookups, so that tests do not depend on GitHub.
 * Without `latest`, the running version is reported as the latest release.
 */
export async function stubGitHubReleases(
  context: BrowserContext,
  latest?: Release,
): Promise<void> {
  await context.route(`${RELEASES_API}/tags/*`, (route) => {
    const tagName = route.request().url().split('/').at(-1) ?? '';
    return fulfillWithRelease(route, { tagName });
  });
  await context.route(`${RELEASES_API}/latest`, async (route) =>
    fulfillWithRelease(
      route,
      latest ?? { tagName: await readRunningVersion(route) },
    ),
  );
}
