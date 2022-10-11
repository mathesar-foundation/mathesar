import { Filtering, type FilterEntry } from '@mathesar/stores/table-data';

export function deepCloneFiltering(
  filtering: Pick<Filtering, 'combination' | 'entries'>,
): Filtering {
  return new Filtering({
    combination: filtering.combination,
    // OPTIMIZE: Find a faster way to deep clone filtering entries
    entries: JSON.parse(JSON.stringify(filtering.entries)) as FilterEntry[],
  });
}
