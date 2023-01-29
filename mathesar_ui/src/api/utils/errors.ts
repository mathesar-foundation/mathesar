/* eslint-disable max-classes-per-file */

import {
  hasProperty,
  hasStringProperty,
  ImmutableMap,
} from '@mathesar-component-library';
import { getErrorMessage } from '@mathesar/utils/errors';

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
  detail?: unknown;
}

interface SegregatedErrorMessages<T extends string = string> {
  commonErrors: string[];
  fieldSpecificErrors: ImmutableMap<T, string[]>;
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
    detail: hasProperty(data, 'detail') ? data.detail : undefined,
  };
}

export class ApiError extends Error {
  code?: string | number;

  field?: string;

  detail?: unknown;

  constructor(anything: unknown) {
    const data = getApiErrorData(anything);
    super(data.message);
    this.name = 'ApiError';
    this.code = data.code;
    this.field = data.field;
    this.detail = data.detail;
  }

  getSegregatedErrors(): SegregatedErrorMessages {
    if (this.field) {
      return {
        commonErrors: [],
        fieldSpecificErrors: new ImmutableMap([
          [this.field, [getErrorMessage(this)]],
        ]),
      };
    }
    return {
      commonErrors: [getErrorMessage(this)],
      fieldSpecificErrors: new ImmutableMap(),
    };
  }
}

export class ApiMultiError extends Error {
  readonly errors: ApiError[];

  constructor(anything: unknown) {
    const inputArray = Array.isArray(anything) ? anything : [anything];
    const errors = inputArray.map((d) => new ApiError(d));
    super(errors.map((e) => e.message).join(' '));
    this.name = 'ApiMultiError';
    this.errors = errors;
  }

  getSegregatedErrors(): SegregatedErrorMessages {
    return this.errors.reduce(
      (accumulator, currentApiError) => {
        const currentApiSegregatedErrors =
          currentApiError.getSegregatedErrors();
        return {
          commonErrors: [
            ...accumulator.commonErrors,
            ...currentApiSegregatedErrors.commonErrors,
          ],
          fieldSpecificErrors: accumulator.fieldSpecificErrors.withEntries(
            currentApiSegregatedErrors.fieldSpecificErrors,
            (a, b) => [...a, ...b],
          ),
        };
      },
      {
        commonErrors: [],
        fieldSpecificErrors: new ImmutableMap(),
      } as SegregatedErrorMessages,
    );
  }
}

export function extractDetailedFieldBasedErrors<T extends string = string>(
  e: unknown,
  fieldNameMappings?: Record<string, string>,
): SegregatedErrorMessages<T> {
  if (e instanceof ApiMultiError || e instanceof ApiError) {
    const { commonErrors, fieldSpecificErrors } = e.getSegregatedErrors();
    if (fieldNameMappings) {
      return {
        commonErrors,
        fieldSpecificErrors: new ImmutableMap<T, string[]>(
          [...fieldSpecificErrors.entries()].map(([key, value]) => [
            (fieldNameMappings[key] ?? key) as T,
            value,
          ]),
        ),
      };
    }
    return {
      commonErrors,
      fieldSpecificErrors,
    } as SegregatedErrorMessages<T>;
  }

  return {
    commonErrors: [getErrorMessage(e)],
    fieldSpecificErrors: new ImmutableMap(),
  };
}

/* eslint-enable max-classes-per-file */
