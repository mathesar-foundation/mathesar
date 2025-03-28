import { compare } from 'compare-versions';
import { getContext, setContext } from 'svelte';

import {
  type GitHubRelease,
  gitHubReleases,
} from '@mathesar/3rd-party-apis/github-releases';
import { CachedFetchStore } from '@mathesar/utils/cachedFetchStore';

import { LOCAL_STORAGE_KEYS } from './localStorage';

export interface Release {
  id: number;
  tagName: string;
  date: string;
}

/**
 * This function is important because each GitHubRelease object actually has a
 * ton of junk it in that we don't care about (not documented within our TS
 * type). This function strips the object down to only the properties that
 * matter to us so that it's small when we serialize it for localStorage.
 */
function buildRelease(gh: GitHubRelease | undefined): Release | undefined {
  if (gh === undefined) {
    return undefined;
  }
  return {
    id: gh.id,
    tagName: gh.tag_name,
    date: gh.published_at,
  };
}

type UpgradeStatus = 'upgradable' | 'up-to-date';

function getUpgradeStatus(
  current: Release | undefined,
  latest: Release | undefined,
): UpgradeStatus | undefined {
  if (current === undefined || latest === undefined) {
    return undefined;
  }
  return compare(latest.tagName, current.tagName, '>')
    ? 'upgradable'
    : 'up-to-date';
}

export class ReleaseData {
  readonly current?: Release;

  readonly latest?: Release;

  readonly upgradeStatus: UpgradeStatus | undefined = undefined;

  constructor({
    current,
    latest,
  }: {
    current: Release | undefined;
    latest: Release | undefined;
  }) {
    this.current = current;
    this.latest = latest;
    this.upgradeStatus = getUpgradeStatus(current, latest);
  }

  serialize(): string {
    return JSON.stringify({
      current: this.current,
      latest: this.latest,
    });
  }

  static deserialize(serialized: string): ReleaseData | undefined {
    try {
      const deserialized = JSON.parse(serialized) as ReleaseData;
      const { current, latest } = deserialized;
      return new ReleaseData({ current, latest });
    } catch (e) {
      return undefined;
    }
  }
}

/** @throws Error if unable to reach GitHub */
async function fetchReleaseData(currentTagName: string): Promise<ReleaseData> {
  return new ReleaseData({
    current: buildRelease(await gitHubReleases.fetchByTagName(currentTagName)),
    latest: buildRelease(await gitHubReleases.fetchLatest()),
  });
}

export type ReleaseDataStore = CachedFetchStore<ReleaseData>;

function makeReleaseDataStore(currentTagName: string) {
  return new CachedFetchStore({
    inputHash: currentTagName,
    cacheKey: LOCAL_STORAGE_KEYS.releaseData,
    timeToLiveMs: 1000 * 60 * 60 * 24, // 1 day
    fetch: () => fetchReleaseData(currentTagName),
    serialize: (rd) => rd.serialize(),
    deserialize: (s) => ReleaseData.deserialize(s),
  });
}

const contextKey = Symbol('ReleaseDataStore');

export function getReleaseDataStoreFromContext(): ReleaseDataStore | undefined {
  return getContext(contextKey);
}

export function setReleasesStoreInContext(currentTagName: string): void {
  if (getReleaseDataStoreFromContext() !== undefined) {
    throw Error('ReleaseDataStore context has already been set');
  }
  setContext(contextKey, makeReleaseDataStore(currentTagName));
}
