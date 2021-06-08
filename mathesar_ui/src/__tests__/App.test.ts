import '@testing-library/jest-dom/extend-expect';
import { render } from '@testing-library/svelte';
import App from '../App.svelte';

function addCommonDataScript() {
  const commonDataScript = document.createElement('script');
  commonDataScript.id = 'common-data';
  commonDataScript.type = 'application/json';
  commonDataScript.textContent = JSON.stringify({
    schemas: [],
    databases: ['mathesar_tables'],
  });
  document.body.append(commonDataScript);
}

function removeCommonDataScript() {
  const commonDataScript = document.querySelector('#common-data');
  if (commonDataScript) {
    commonDataScript.remove();
  }
}

test('shows mathesar default text when rendered', () => {
  addCommonDataScript();
  const { getByText } = render(App, {});
  expect(getByText('mathesar_tables')).toBeInTheDocument();
  removeCommonDataScript();
});
