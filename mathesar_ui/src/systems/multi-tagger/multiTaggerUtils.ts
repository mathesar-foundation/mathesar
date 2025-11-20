import { type Writable, writable } from 'svelte/store';

import type { RecordsSummaryListResponse } from '@mathesar/api/rpc/_common/commonTypes';

import { MultiTaggerOption } from './MultiTaggerOption';

export function* buildOptions(
  response: RecordsSummaryListResponse | undefined,
): Generator<Writable<MultiTaggerOption>> {
  if (!response) return;
  const joinedValues = response.mapping?.joined_values ?? {};
  for (const { key, summary } of response.results) {
    const mappingId = joinedValues[String(key)];
    yield writable(new MultiTaggerOption({ key, summary, mappingId }));
  }
}
