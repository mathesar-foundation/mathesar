import {
  hasProperty,
  hasStringProperty,
  ImmutableMap,
  isNumber,
} from '@mathesar-component-library';
import { getErrorMessage } from '@mathesar/utils/errors';
import { ApiError, ApiMultiError } from './errors';

/** Keys are column ids */
type ColumnErrors = ImmutableMap<number, string[]>;

/**
 * When a POST or PATCH to the records API fails, sometimes we get detailed info
 * about which column(s) caused the error, and sometimes we just get a generic
 * top-level error message. Because the API schema supports sending multiple
 * errors in one response, we use a data structure here that can handle both
 * situations at the same time.
 */
export interface DetailedRecordsErrors {
  columnErrors: ColumnErrors;
  recordErrors: string[];
}

function columnErrorsOnly(columnErrors: ColumnErrors): DetailedRecordsErrors {
  return { columnErrors, recordErrors: [] };
}

function recordErrorsOnly(recordErrors: string[]): DetailedRecordsErrors {
  return { columnErrors: new ImmutableMap(), recordErrors };
}

function noErrors(): DetailedRecordsErrors {
  return recordErrorsOnly([]);
}

function mergeColumnErrors(a: ColumnErrors, b: ColumnErrors): ColumnErrors {
  return a.withEntries(b, (x, y) => [...x, ...y]);
}

function mergeDetailedRecordsErrors(
  a: DetailedRecordsErrors,
  b: DetailedRecordsErrors,
): DetailedRecordsErrors {
  return {
    columnErrors: mergeColumnErrors(a.columnErrors, b.columnErrors),
    recordErrors: [...a.recordErrors, ...b.recordErrors],
  };
}

/**
 * Add more anonymous functions to this array to handle more cases where the API
 * returns detailed error information, potentially in its own unique schema to
 * represent the error.
 */
const columnErrorParsers: ((detail: unknown) => ColumnErrors | undefined)[] = [
  // Constraint violation, e.g. uniqueness check
  (d) => {
    if (!hasProperty(d, 'constraint_columns')) {
      return undefined;
    }
    if (!Array.isArray(d.constraint_columns)) {
      return undefined;
    }
    if (!hasStringProperty(d, 'original_details')) {
      return undefined;
    }
    return new ImmutableMap(
      d.constraint_columns
        .filter(isNumber)
        .map((columnId) => [columnId, [d.original_details]]),
    );
  },
];

function getColumnErrors(detail: unknown): ColumnErrors | undefined {
  for (const parse of columnErrorParsers) {
    const columnErrors = parse(detail);
    if (columnErrors) {
      return columnErrors;
    }
  }
  return undefined;
}

export function getDetailedRecordsErrors(e: unknown): DetailedRecordsErrors {
  // Case where we have a "detail" object within an API error response
  {
    const columnErrors = getColumnErrors(e);
    if (columnErrors) {
      return columnErrorsOnly(columnErrors);
    }
  }

  // Case where we have one API error object
  if (e instanceof ApiError) {
    const columnErrors = getColumnErrors(e.detail);
    return columnErrors
      ? columnErrorsOnly(columnErrors)
      : recordErrorsOnly([e.message]);
  }

  // Case where we have multiple API error objects
  if (e instanceof ApiMultiError) {
    return e.errors
      .map(getDetailedRecordsErrors)
      .reduce(mergeDetailedRecordsErrors, noErrors());
  }

  // Fallback case
  return recordErrorsOnly([getErrorMessage(e)]);
}
