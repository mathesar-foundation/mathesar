import Cookies from 'js-cookie';
import { CancellablePromise } from '@mathesar-components';

export enum States {
  Idle = 'idle',
  Loading = 'loading',
  Done = 'done',
  Error = 'error',
}

export interface UploadCompletionOpts {
  loaded:number,
  total: number,
  percentCompleted: number
}

export interface URLObject {
  url: string,
  avoidPrefix?: boolean
}

export interface PaginatedResponse<T> {
  count: number,
  results: T[]
}

const urlPrefix = '/api/v0';
const NO_CONTENT = 204;
const successStatusCodes = new Set([200, 201, NO_CONTENT]);

/*
 * We might need to use multiple versions of apis
 * simultaneously, later on
 */
function appendUrlPrefix(url: string | URLObject): string {
  if (typeof url === 'string') {
    if (url.indexOf('/api/v') === 0) {
      return url;
    }
    return `${urlPrefix}${url}`;
  }

  if (url.avoidPrefix) {
    return url.url;
  }
  return `${urlPrefix}${url.url}`;
}

function sendXHRRequest<T>(method: string, url: string, data?: unknown): CancellablePromise<T> {
  const request = new XMLHttpRequest();
  request.open(method, appendUrlPrefix(url));
  request.setRequestHeader('Content-Type', 'application/json');
  request.setRequestHeader('X-CSRFToken', Cookies.get('csrftoken'));
  if (data) {
    request.send(JSON.stringify(data));
  } else {
    request.send();
  }

  return new CancellablePromise((resolve, reject) => {
    request.addEventListener('load', () => {
      if (successStatusCodes.has(request.status)) {
        const result = request.status === NO_CONTENT
          ? null
          : JSON.parse(request.response) as T;
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
      reject(new Error('Request was aborted'));
    });
  }, () => {
    request.abort();
  });
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
  url: string | URLObject,
  formData: FormData,
  completionCallback?: (obj: UploadCompletionOpts) => unknown,
): CancellablePromise<T> {
  const request = new XMLHttpRequest();
  request.open('POST', appendUrlPrefix(url));
  request.setRequestHeader('X-CSRFToken', Cookies.get('csrftoken'));
  request.upload.onprogress = (e) => {
    const { loaded, total } = e;
    const percentCompleted = (loaded / total) * 100;
    completionCallback({
      loaded,
      total,
      percentCompleted,
    });
  };
  request.send(formData);

  return new CancellablePromise((resolve, reject) => {
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
  }, () => {
    request.abort();
  });
}
