import type { Page } from '@playwright/test';

import type { Table } from '../api/mathesar';
import { tableUrl } from './urls';

/**
 * The decoded `q` parameter of a table page URL, undefined for the default view. Columns
 * are attnum strings: `[[page, size], sorting, grouping, filtering, joining, hiddenColumns]`.
 */
export function viewStateInUrl(page: Page): unknown {
  const encoded = new URL(page.url()).searchParams.get('q');
  if (!encoded) return undefined;
  return JSON.parse(Buffer.from(encoded, 'base64url').toString());
}

/** The URL of a table page with this text as its `q` parameter, as it is. */
export function tableUrlWithQuery(table: Table, q: string): string {
  return `${tableUrl(table)}?q=${q}`;
}

/** The value of the `q` parameter for a view state. */
export function encodeViewState(viewState: unknown): string {
  return Buffer.from(JSON.stringify(viewState)).toString('base64url');
}
