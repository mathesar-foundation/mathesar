import { hasProperty, hasStringProperty } from '@mathesar-component-library';

// TODO: create and document specific error codes instead of using a fallback
const FALLBACK_ERROR_CODE = 0;

export class RpcError extends Error {
  status = 'error' as const;

  code: number;

  data?: unknown;

  constructor(p: { message: string; code: number; data?: unknown }) {
    super(p.message);
    this.code = p.code;
    this.data = p.data;
  }

  /**
   * This static method does its best to extract the error message, code, and
   * data out of whatever you give it.
   */
  static fromAnything(value: unknown): RpcError {
    // This is so we can handle creating RpcError instances from various types
    // of errors that might be thrown, e.g. from fetch if there's a network
    // problem.
    if (value instanceof RpcError) {
      return value;
    }

    if (value instanceof Error) {
      return new RpcError({
        code: FALLBACK_ERROR_CODE,
        message: value.message,
      });
    }

    // If our HTTP request succeeded (status 200) and we've received a valid
    // response object conforming to the JSON-RPC spec, then this is the place
    // where we handle the standard JSON-RPC error object within that response.
    if (hasProperty(value, 'error')) {
      return RpcError.fromAnything(value.error);
    }

    const message = (() => {
      if (hasStringProperty(value, 'message')) {
        return value.message;
      }
      if (typeof value === 'string') {
        return value;
      }
      if (
        hasProperty(value, 'toString') &&
        typeof value.toString === 'function'
      ) {
        return String(value.toString());
      }
      return JSON.stringify(value);
    })();

    const code =
      hasProperty(value, 'code') && typeof value.code === 'number'
        ? value.code
        : FALLBACK_ERROR_CODE;

    const data = hasProperty(value, 'data') ? value.data : undefined;

    return new RpcError({ code, message, data });
  }
}
