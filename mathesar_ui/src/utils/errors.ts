/* eslint-disable max-classes-per-file */

import { hasProperty, hasStringProperty } from '@mathesar-component-library';

/**
 * This is our front end representation of API errors. It's almost the same as
 * the [API error response schema][1], except that here we're using `undefined`
 * where the response schema uses `null`.
 *
 * [1]: https://wiki.mathesar.org/en/engineering/standards/api
 */
interface ApiErrorData {
  message: string;
  code?: string | number;
  field?: string;
  details?: unknown;
}

export function getErrorMessage(data: unknown): string {
  if (typeof data === 'string') {
    return data;
  }
  if (hasStringProperty(data, 'message')) {
    return data.message;
  }
  if (typeof data === 'object') {
    return JSON.stringify(data);
  }
  return String(data);
}

function getApiErrorCode(data: unknown): string | number | undefined {
  if (hasProperty(data, 'code')) {
    const { code } = data;
    if (typeof code === 'string' || typeof code === 'number') {
      return code;
    }
  }
  return undefined;
}

function getApiErrorData(data: unknown): ApiErrorData {
  return {
    message: getErrorMessage(data),
    code: getApiErrorCode(data),
    field: hasStringProperty(data, 'field') ? data.field : undefined,
    details: hasProperty(data, 'details') ? data.details : undefined,
  };
}

export class ApiError extends Error {
  code?: string | number;

  field?: string;

  details?: unknown;

  constructor(anything: unknown) {
    const data = getApiErrorData(anything);
    super(data.message);
    this.code = data.code;
    this.field = data.field;
    this.details = data.details;
  }
}

export class ApiMultiError extends Error {
  readonly errors: ApiError[];

  constructor(anything: unknown) {
    const inputArray = Array.isArray(anything) ? anything : [anything];
    const errors = inputArray.map((d) => new ApiError(d));
    super(errors.map((e) => e.message).join(' '));
    this.name = 'ApiErrorSet';
    this.errors = errors;
  }
}

/**
 * This error should be thrown when a union type has not been sufficiently
 * narrowed by exhaustiveness checking.
 */
export class MissingExhaustiveConditionError extends Error {
  constructor(value: never, message?: string) {
    super(`${JSON.stringify(value)}${message ? ` ${message}` : ''}`);
    this.name = 'MissingExhaustiveConditionError';
  }
}

/* eslint-enable max-classes-per-file */
