import Cookies from 'js-cookie';

export default function getAPI(url, onSuccess, onFailure) {
  fetch(url, {
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': Cookies.get('csrftoken'),
    },
  })
    .then((res) => {
      if (res.status === 200) {
        return res.json();
      }
      throw new Error({
        status: res.status,
        statusText: res.statusText,
        detail: 'An error has occurred while fetching data',
      });
    })
    .then((response) => {
      if (onSuccess) {
        onSuccess(response);
      }
      return response;
    })
    .catch((error) => {
      if (onFailure) {
        onFailure(error);
      }
    });
}
