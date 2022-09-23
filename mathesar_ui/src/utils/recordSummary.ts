import { ImmutableMap } from '@mathesar-component-library';
import type { RecordSummaryInputData } from '@mathesar/api/tables/records';
import type { DataForRecordSummaryInFkCell } from './recordSummaryTypes';

function stringifyIfDefined(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return String(value);
}

/**
 * @param template e.g. "{1} {2}" or "{2__9___10__21__col__22}"
 */
export function renderRecordSummary(
  template: string,
  getValue: (key: string) => string | undefined,
): string {
  return template.replace(
    /\{[0-9_a-z]+\}/g,
    (token) => getValue(token.slice(1, -1)) ?? token,
  );
}

export function renderSummaryFromValuesObject(
  template: string,
  /** Maps column aliases to cell values */
  values: RecordSummaryInputData,
): string {
  return renderRecordSummary(template, (k) => stringifyIfDefined(values[k]));
}

/**
 * Renders the record summary for one record.
 *
 * @param fields the direct values of the record
 * @param fkSummaryDataMap extra data we have to render transitive summaries in
 * the case the the summary for this record depends on the summary of a record
 * linked via an FK column on this record.
 */
export function renderSummaryFromFieldsAndFkData(
  template: string,
  /** Maps column ids to cell values  */
  fields: ImmutableMap<number, unknown>,
  /** Maps column ids to FK data */
  fkSummaryDataMap: ImmutableMap<
    number,
    DataForRecordSummaryInFkCell
  > = new ImmutableMap(),
): string {
  function getValue(key: string): string | undefined {
    const fkSummaryData = fkSummaryDataMap.get(Number(key));
    if (fkSummaryData) {
      return renderSummaryFromValuesObject(
        fkSummaryData.template,
        fkSummaryData.data,
      );
    }
    return stringifyIfDefined(fields.get(Number(key)));
  }
  return renderRecordSummary(template, getValue);
}
