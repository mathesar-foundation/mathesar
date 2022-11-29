import { ImmutableMap } from '@mathesar-component-library';
import type {
  ApiDataForRecordSummariesInFkColumn,
  ApiRecordSummaryInputData,
} from '@mathesar/api/tables/records';

/** A generalized type that can be used for Map or ImmutableMap or others. */
interface LookerUpper<Key, Value> {
  get: (key: Key) => Value | undefined;
}

/**
 * - Sometimes tokens contain only a column id, like "{1}".
 * - Other times, tokens contain a full join path to the column, like
 *   "{2__9___10__21__col__22}"
 * - Tokens will only ever contain numbers, underscores, and lower case letters.
 */
const tokenPattern = /\{[0-9_a-z]+\}/g;

export function renderRecordSummary(
  template: string,
  inputData: LookerUpper<string, string>,
): string {
  function getReplacementValueForToken(token: string): string {
    return inputData.get(token.slice(1, -1)) ?? token;
  }
  return template.replace(tokenPattern, getReplacementValueForToken);
}

/**
 * Maps column aliases (as used in the template) to cell values (as should be
 * rendered in the template). This is the front end analog of
 * `ApiRecordSummaryInputData` from the API.
 */
type InputData = ImmutableMap<string, string>;

export function buildInputData(apiData: ApiRecordSummaryInputData): InputData {
  const entries = Object.entries(apiData);
  return new ImmutableMap(entries.map(([k, v]) => [k, String(v)]));
}

/** Keys are stringifed record ids */
export type RecordSummariesForColumn = ImmutableMap<string, string>;

function buildRecordSummariesForColumn(
  apiData: Pick<ApiDataForRecordSummariesInFkColumn, 'data' | 'template'>,
): RecordSummariesForColumn {
  const entries = Object.entries(apiData.data);
  return new ImmutableMap(
    entries.map(([recordId, apiInputData]) => [
      recordId,
      renderRecordSummary(apiData.template, buildInputData(apiInputData)),
    ]),
  );
}

function mergeRecordSummariesForColumn(
  a: RecordSummariesForColumn,
  b: RecordSummariesForColumn,
): RecordSummariesForColumn {
  return a.withEntries(b);
}

/** Keys are stringified column ids */
export type RecordSummariesForSheet = ImmutableMap<
  string,
  RecordSummariesForColumn
>;

export function buildRecordSummariesForSheet(
  a: ApiDataForRecordSummariesInFkColumn[],
): RecordSummariesForSheet {
  return new ImmutableMap(
    a.map((apiData) => [
      String(apiData.column),
      buildRecordSummariesForColumn(apiData),
    ]),
  );
}

export function mergeRecordSummariesForSheet(
  a: RecordSummariesForSheet,
  b: RecordSummariesForSheet,
): RecordSummariesForSheet {
  return a.withEntries(b, mergeRecordSummariesForColumn);
}

function stringifyFieldValue(v: unknown): string {
  if (v === undefined) {
    return '';
  }
  if (v === null) {
    return '(null)';
  }
  if (typeof v === 'string') {
    return v;
  }
  return JSON.stringify(v);
}

export function prepareFieldsAsRecordSummaryInputData(
  fields: Iterable<[number, unknown]>,
  _stringifyFieldValue = stringifyFieldValue,
): InputData {
  return new ImmutableMap(
    [...fields].map(([k, v]) => [String(k), _stringifyFieldValue(v)]),
  );
}

export function renderTransitiveRecordSummary({
  template,
  inputData,
  transitiveData,
}: {
  template: string;
  inputData: InputData;
  /**
   * Extra data we have to render transitive summaries in the case that the
   * summary for this record depends on the summary of a record linked via an FK
   * column on this record.
   */
  transitiveData: RecordSummariesForSheet;
}): string {
  /**
   * Finds the value to use in place of one column alias, using transitive
   * summary data when available.
   */
  function getValueTransitively(columnAlias: string): string | undefined {
    const cellValue = inputData.get(columnAlias);
    if (cellValue === undefined) {
      return undefined;
    }
    const recordSummariesForColumn = transitiveData.get(columnAlias);
    if (recordSummariesForColumn === undefined) {
      return cellValue;
    }
    return recordSummariesForColumn.get(cellValue) ?? cellValue;
  }

  return renderRecordSummary(template, { get: getValueTransitively });
}

export function renderRecordSummaryForRow({
  template,
  record,
  transitiveData,
}: {
  template: string;
  record: Record<string | number, unknown>;
  transitiveData: RecordSummariesForSheet;
}) {
  const entries = Object.entries(record);
  const fields: [number, unknown][] = entries.map(([k, v]) => [Number(k), v]);
  const inputData = prepareFieldsAsRecordSummaryInputData(fields);
  return renderTransitiveRecordSummary({ template, inputData, transitiveData });
}
