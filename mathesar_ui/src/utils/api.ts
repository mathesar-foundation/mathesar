import Cookies from 'js-cookie';
import { CancellablePromise } from '@mathesar-component-library';

export enum States {
  /** Before any requests have been made */
  Idle = 'idle',
  Loading = 'loading',
  /** After a request has completed successfully */
  Done = 'done',
  Error = 'error',
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
          const result =
            request.status === NO_CONTENT
              ? undefined
              : (JSON.parse(request.response) as T);
          resolve(result);
        } else {
          let errorMessage = 'An unexpected error has occurred';
          try {
            // TODO: Follow a proper error message structure
            const message = JSON.parse(request.response) as string | string[];
            if (Array.isArray(message)) {
              errorMessage = message.join(', ');
            } else if (typeof message === 'string') {
              errorMessage = message;
            } else if (message) {
              errorMessage = JSON.stringify(message);
            }
          } finally {
            reject(new Error(errorMessage));
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
            const response = JSON.parse(request.response) as T;
            resolve(response);
          } catch (exp) {
            resolve(request.response);
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
