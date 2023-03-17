import Cookies from 'js-cookie';

import { CancellablePromise } from '@mathesar-component-library';
import { ApiMultiError } from './errors';

/**
 * @deprecated in favor of `RequestStatus` which also stores info about the
 * errors.
 */
export enum States {
  /** Before any requests have been made */
  Idle = 'idle',
  Loading = 'loading',
  /** After a request has completed successfully */
  Done = 'done',
  Error = 'error',
}

export type RequestStatus<ErrorType = string[]> =
  | { state: 'processing' }
  | { state: 'success' }
  | { state: 'failure'; errors: ErrorType };

/**
 * When multiple states are present, the one listed highest here is considered
 * the most important.
 */
const requestStatusStatesByImportance: RequestStatus['state'][] = [
  'processing',
  'failure',
  'success',
];
const paramountRequestStatusState = requestStatusStatesByImportance[0];

function pickMostImportantRequestStatusState(
  a: RequestStatus['state'],
  b: RequestStatus['state'],
): RequestStatus['state'] {
  for (const state of requestStatusStatesByImportance) {
    if (a === state || b === state) {
      return state;
    }
  }
  throw new Error('Invalid RequestStatus states.');
}

export function getMostImportantRequestStatusState(
  statuses: Iterable<RequestStatus>,
): RequestStatus['state'] | undefined {
  let result: RequestStatus['state'] | undefined;
  for (const { state } of statuses) {
    if (state === paramountRequestStatusState) {
      return state;
    }
    result = result
      ? pickMostImportantRequestStatusState(state, result)
      : state;
  }
  return result;
}

export interface UploadCompletionOpts {
  loaded: number;
  total: number;
  percentCompleted: number;
}

export interface PaginatedResponse<T> {
  count: number;
  results: T[];
}

const NO_CONTENT = 204;
const successStatusCodes = new Set([200, 201, NO_CONTENT]);
const UNAUTHORIZED = 401;

function getResultFromRequest<T>(request: XMLHttpRequest): T | undefined {
  if (request.status === NO_CONTENT) {
    return undefined;
  }

  const response = String(request.response);
  if (response.trim().length === 0) {
    // This is to accommodate poorly-behaving APIs that return an empty string
    // when they should instead respond with HTTP 204.
    return undefined;
  }
  return JSON.parse(String(response)) as T;
}

function sendXHRRequest<T>(
  method: string,
  url: string,
  data?: unknown,
): CancellablePromise<T> {
  const request = new XMLHttpRequest();
  request.open(method, url);
  request.setRequestHeader('Content-Type', 'application/json');
  const csrfToken = Cookies.get('csrftoken');
  if (csrfToken) {
    request.setRequestHeader('X-CSRFToken', csrfToken);
  }
  if (data) {
    request.send(JSON.stringify(data));
  } else {
    request.send();
  }
  let isManuallyAborted = false;

  return new CancellablePromise(
    (resolve, reject) => {
      request.addEventListener('load', () => {
        if (successStatusCodes.has(request.status)) {
          resolve(getResultFromRequest<T>(request));
        } else {
          if (request.status === UNAUTHORIZED) {
            window.location.reload();
            return;
          }
          try {
            reject(new ApiMultiError(JSON.parse(String(request.response))));
          } catch {
            const msg = [
              'When making an XHR request, the server responded with an',
              'error, but the response body was not valid JSON.',
            ].join(' ');
            reject(new Error(msg));
          }
        }
      });

      request.addEventListener('error', () => {
        reject(new Error('An unexpected error has occurred'));
      });

      request.addEventListener('abort', () => {
        if (!isManuallyAborted) {
          reject(new Error('Request was aborted'));
        }
      });
    },
    () => {
      isManuallyAborted = true;
      request.abort();
    },
  );
}

export function getAPI<T>(url: string): CancellablePromise<T> {
  return sendXHRRequest('GET', url);
}

export function postAPI<T>(url: string, data: unknown): CancellablePromise<T> {
  return sendXHRRequest('POST', url, data);
}

export function patchAPI<T>(url: string, data: unknown): CancellablePromise<T> {
  return sendXHRRequest('PATCH', url, data);
}

export function putAPI<T>(url: string, data: unknown): CancellablePromise<T> {
  return sendXHRRequest('PUT', url, data);
}

export function deleteAPI<T>(url: string): CancellablePromise<T> {
  return sendXHRRequest('DELETE', url);
}

export function uploadFile<T>(
  url: string,
  formData: FormData,
  completionCallback?: (obj: UploadCompletionOpts) => unknown,
): CancellablePromise<T> {
  const request = new XMLHttpRequest();
  request.open('POST', url);
  const csrfToken = Cookies.get('csrftoken');
  if (csrfToken) {
    request.setRequestHeader('X-CSRFToken', csrfToken);
  }
  request.upload.onprogress = (e) => {
    const { loaded, total } = e;
    const percentCompleted = (loaded / total) * 100;
    completionCallback?.({
      loaded,
      total,
      percentCompleted,
    });
  };
  request.send(formData);

  return new CancellablePromise(
    (resolve, reject) => {
      request.addEventListener('load', () => {
        if (successStatusCodes.has(request.status)) {
          try {
            const response = JSON.parse(String(request.response)) as T;
            resolve(response);
          } catch (exp) {
            resolve(request.response as T);
          }
        } else {
          reject(new Error('An error has occurred while uploading file'));
        }
      });
    },
    () => {
      request.abort();
    },
  );
}

export async function getExternalApi<T>(url: string): Promise<T | undefined> {
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) {
    return undefined;
  }
  return (await response.json()) as T;
}
