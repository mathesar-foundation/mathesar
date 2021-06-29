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

const urlPrefix = '/api/v0';
const successStatusCodes = new Set([200, 201]);

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

export function getAPI<T>(url: string): CancellablePromise<T> {
  const request = new XMLHttpRequest();
  request.open('GET', appendUrlPrefix(url));
  request.setRequestHeader('Content-Type', 'application/json');
  request.setRequestHeader('X-CSRFToken', Cookies.get('csrftoken'));
  request.send();

  return new CancellablePromise((resolve, reject) => {
    request.addEventListener('load', () => {
      if (successStatusCodes.has(request.status)) {
        resolve(JSON.parse(request.response) as T);
      } else {
        reject(new Error('An error has occurred while fetching data'));
      }
    });
  }, () => {
    request.abort();
  });
}

export async function uploadFile<T>(
  url: string | URLObject,
  formData: FormData,
  completionCallback?: (obj: UploadCompletionOpts) => unknown,
): Promise<T> {
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

  return new Promise((resolve, reject) => {
    request.addEventListener('load', () => {
      if (successStatusCodes.has(request.status)) {
        resolve(request.response);
      } else {
        reject(new Error('An error has occurred while uploading file'));
      }
    });
  });
}
