import type { ImmutableMap } from '@mathesar-component-library';

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

export function renderRecordSummaryFromValuesObject(
  template: string,
  /** Maps column aliases to cell values */
  values: Record<string, string>,
): string {
  return renderRecordSummary(template, (key) => values[key]);
}

export function renderRecordSummaryFromFieldsMap(
  template: string,
  /** Maps column ids to cell values  */
  fields: ImmutableMap<number, unknown>,
): string {
  function getValue(key: string): string | undefined {
    const value = fields.get(parseInt(key, 10));
    if (value === undefined) {
      return undefined;
    }
    return String(value);
  }
  return renderRecordSummary(template, getValue);
}
