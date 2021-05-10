function getData(selector, retainData = false) {
  const preloadedData = document.querySelector(selector);
  if (preloadedData?.textContent) {
    try {
      const data = JSON.parse(preloadedData.textContent);
      if (!retainData) {
        preloadedData.remove();
      }
      return data;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  }
  return null;
}

export function preloadRouteData(routeName) {
  return getData(`#${routeName}`);
}

export function preloadCommonData() {
  return getData('#common-data', true);
}
