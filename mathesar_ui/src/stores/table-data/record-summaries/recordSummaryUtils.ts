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
 * Maps column aliases (as used in the template) to cell values (as should be
 * rendered in the template). This is the front end analog of
 * `ApiRecordSummaryInputData` from the API.
 */
export type RecordSummaryInputData = ImmutableMap<string, string>;

function buildRecordSummaryInputData(
  apiData: ApiRecordSummaryInputData,
): RecordSummaryInputData {
  const entries = Object.entries(apiData);
  return new ImmutableMap(entries.map(([k, v]) => [k, String(v)]));
}

export interface DataForRecordSummariesInFkColumn {
  template: string;
  /** Keys are stringifed record ids */
  mapRecordIdsToInputData: ImmutableMap<string, RecordSummaryInputData>;
}

function buildDataForRecordSummariesInFkColumn(
  apiData: Pick<ApiDataForRecordSummariesInFkColumn, 'data' | 'template'>,
): DataForRecordSummariesInFkColumn {
  const entries = Object.entries(apiData.data);
  return {
    template: apiData.template,
    mapRecordIdsToInputData: new ImmutableMap(
      entries.map(([recordId, inputData]) => [
        recordId,
        buildRecordSummaryInputData(inputData),
      ]),
    ),
  };
}

/** Keys are column aliases */
export type DataForRecordSummariesInFkColumns = ImmutableMap<
  string,
  DataForRecordSummariesInFkColumn
>;

export function buildDataForRecordSummariesInFkColumns(
  a: ApiDataForRecordSummariesInFkColumn[],
): DataForRecordSummariesInFkColumns {
  return new ImmutableMap(
    a.map((apiData) => [
      String(apiData.column),
      buildDataForRecordSummariesInFkColumn(apiData),
    ]),
  );
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
): RecordSummaryInputData {
  return new ImmutableMap(
    [...fields].map(([k, v]) => [String(k), _stringifyFieldValue(v)]),
  );
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

export interface DataForRecordSummaryInFkCell {
  template: string;
  inputData: RecordSummaryInputData;
  /**
   * Extra data we have to render transitive summaries in the case the the
   * summary for this record depends on the summary of a record linked via an FK
   * column on this record.
   */
  transitiveData: DataForRecordSummariesInFkColumns;
}

export function buildDataForRecordSummaryInFkCell({
  recordId,
  stringifiedColumnId,
  dataForRecordSummariesInFkColumns,
}: {
  recordId: string;
  stringifiedColumnId: string;
  dataForRecordSummariesInFkColumns: DataForRecordSummariesInFkColumns;
}): DataForRecordSummaryInFkCell | undefined {
  const dataForRecordSummariesInFkColumn =
    dataForRecordSummariesInFkColumns.get(stringifiedColumnId);
  if (!dataForRecordSummariesInFkColumn) {
    return undefined;
  }
  const { template, mapRecordIdsToInputData } =
    dataForRecordSummariesInFkColumn;
  const inputData = mapRecordIdsToInputData.get(recordId);
  if (!inputData) {
    return undefined;
  }
  return {
    template,
    inputData,
    transitiveData: dataForRecordSummariesInFkColumns,
  };
}

export function renderTransitiveRecordSummary({
  template,
  inputData,
  transitiveData,
}: DataForRecordSummaryInFkCell): string {
  /**
   * Finds the value to use in place of one column alias, using transitive
   * summary data when available.
   */
  function getValueTransitively(columnAlias: string): string | undefined {
    const cellValue = inputData.get(columnAlias);
    if (cellValue === undefined) {
      return undefined;
    }
    const dataForRecordSummariesInFkColumn = transitiveData.get(columnAlias);
    if (dataForRecordSummariesInFkColumn === undefined) {
      return cellValue;
    }
    const innerTemplate = dataForRecordSummariesInFkColumn.template;
    const { mapRecordIdsToInputData } = dataForRecordSummariesInFkColumn;
    const recordSummaryInputData = mapRecordIdsToInputData.get(cellValue);
    if (recordSummaryInputData === undefined) {
      return cellValue;
    }
    return renderRecordSummary(innerTemplate, recordSummaryInputData);
  }

  return renderRecordSummary(template, { get: getValueTransitively });
}
