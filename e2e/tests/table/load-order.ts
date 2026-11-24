import type { Page, Request } from '@playwright/test';

import { holdRequests, holdRpcCalls } from '../../support/held-requests';

interface RpcCall {
  method: string;
}

function callsMethod(request: Request, method: string): boolean {
  if (!request.url().endsWith('/api/rpc/v0/')) return false;
  const body = request.postDataJSON() as RpcCall | RpcCall[];
  return [body].flat().some((call) => call.method === method);
}

/**
 * Makes the next table page get its columns after its first records. The records
 * that the page then asks for again wait for the returned function.
 */
export async function answerColumnsAfterRecords(
  page: Page,
): Promise<() => void> {
  let recordsAnswered = false;
  const releaseColumns = await holdRpcCalls(page, 'columns.list_with_metadata');
  const releaseRecords = await holdRequests(
    page,
    '**/api/rpc/v0/',
    (request) => recordsAnswered && callsMethod(request, 'records.list'),
  );
  page.on('response', (response) => {
    if (!callsMethod(response.request(), 'records.list')) return;
    recordsAnswered = true;
    releaseColumns();
  });
  return releaseRecords;
}

/** Makes the next table page get its records only after its columns and constraints. */
export async function answerRecordsLast(page: Page): Promise<void> {
  const releaseRecords = await holdRpcCalls(page, 'records.list');
  const structure = ['columns.list_with_metadata', 'constraints.list'];
  const answered = new Set<string>();
  page.on('response', (response) => {
    for (const method of structure) {
      if (callsMethod(response.request(), method)) answered.add(method);
    }
    if (answered.size === structure.length) releaseRecords();
  });
}
