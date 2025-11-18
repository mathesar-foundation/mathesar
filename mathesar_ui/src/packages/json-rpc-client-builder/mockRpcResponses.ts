// ===========================================================================
// TODO_CROSS_TABLE_MVP: DELETE THIS ENTIRE FILE
// Mock responses for joined_columns and linked_record_path until backend supports them
// ===========================================================================

import type { RpcRequest, RpcResponse } from './requests';

interface RpcResult<T> {
  status: 'ok';
  value: T;
}

export function enhanceResponseWithMockJoinedSummaries<T>(
  response: RpcResult<T>,
  joinedColumns: Array<{
    alias: string;
    join_path: Array<Array<[number, number]>>;
  }>,
): RpcResult<T> {
  const mockJoinedRecordSummaries: Record<
    string,
    { results: Record<string, string> }
  > = {};

  // Extract join table OID from the first join path segment
  // The join table is the intermediate table in the path
  const joinTableOid = joinedColumns[0]?.join_path[0]?.[1]?.[0] ?? 0;

  joinedColumns.forEach((col) => {
    const { alias } = col;
    const realResults = response.value as {
      results?: Array<Record<string, unknown>>;
    };
    const resultsList = realResults?.results ?? [];
    const firstResult = resultsList[0];
    const joinedIds = firstResult?.[alias] as number[] | undefined;

    if (joinedIds && Array.isArray(joinedIds)) {
      mockJoinedRecordSummaries[alias] = {
        results: Object.fromEntries(
          joinedIds.map((id) => {
            const intId = parseInt(String(id), 10);
            return [String(intId), `Summary ${intId} for ${alias}`];
          }),
        ),
      };
    } else {
      const allIds = new Set<number>();

      resultsList.forEach((result, rowIdx) => {
        // Generate simple integer mock IDs (not based on actual data values)
        // This avoids issues with floats, decimals, or other non-ID numeric values
        const mockValues = [rowIdx * 10 + 1, rowIdx * 10 + 2];

        // Inject mock column data into result by creating a new object
        const resultWithMock = {
          ...result,
          [alias]: mockValues,
        };
        resultsList[rowIdx] = resultWithMock;

        mockValues.forEach((id) => allIds.add(id));
      });

      mockJoinedRecordSummaries[alias] = {
        results: Object.fromEntries(
          Array.from(allIds).map((id) => [
            String(id),
            `Summary ${id} for ${alias}`,
          ]),
        ),
      };
    }
  });

  // Build mapping with joined values for all aliases
  const joinedValues: Record<string, number> = {};
  Object.values(mockJoinedRecordSummaries).forEach((summaryData) => {
    Object.keys(summaryData.results).forEach((key) => {
      // Generate a mock joined value (join table row ID)
      const id = parseInt(key, 10);
      if (!Number.isNaN(id)) {
        joinedValues[key] = id * 100; // Simple mock mapping
      }
    });
  });

  const enhancedResponse: RpcResult<T> = {
    status: 'ok',
    value: {
      ...response.value,
      joined_record_summaries: mockJoinedRecordSummaries,
      mapping: {
        join_table: joinTableOid,
        joined_values: joinedValues,
      },
    } as T,
  };

  /* eslint-disable no-console */
  console.info(
    '⚠️ [Mock] Injected fake joined_record_summaries into response:',
    enhancedResponse,
  );
  /* eslint-enable no-console */

  return enhancedResponse;
}

export function getMockListSummariesResponse<T>(
  request: RpcRequest<T>,
): RpcResponse<T> | null {
  const params = request.params as Record<string, unknown>;
  if (
    request.method !== 'records.list_summaries' ||
    !params?.linked_record_path
  ) {
    return null;
  }

  const linkedRecordPath = params.linked_record_path as {
    record_pkey: number;
    join_path: Array<Array<[number, number]>>;
  };
  const joinTableOid = linkedRecordPath.join_path[0]?.[1]?.[0] ?? 0;

  const mockResponse: RpcResult<T> = {
    status: 'ok',
    value: {
      count: 100,
      results: [
        { key: 3, summary: 'Summary 3' },
        { key: 34, summary: 'Summary 34' },
        { key: 45, summary: 'Summary 45' },
      ],
      mapping: {
        join_table: joinTableOid,
        joined_values: {
          3: 4734,
          45: 5467,
        },
      },
    } as T,
  };

  /* eslint-disable no-console */
  console.info(
    '⚠️ [Mock] Returning fake response for records.list_summaries:',
    mockResponse,
  );
  /* eslint-enable no-console */

  return mockResponse as RpcResponse<T>;
}
