/* eslint-disable max-classes-per-file */

import { hasStringProperty } from '@mathesar-component-library';

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
