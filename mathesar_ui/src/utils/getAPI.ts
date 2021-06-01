import Cookies from 'js-cookie';

export enum States {
  Loading = 'loading',
  Done = 'done',
  Error = 'error',
}

export default async function getAPI<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': Cookies.get('csrftoken'),
    },
  });
  if (response.status === 200) {
    return await response.json() as T;
  }
  throw new Error('An error has occurred while fetching data');
}
