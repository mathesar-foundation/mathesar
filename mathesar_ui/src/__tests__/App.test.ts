import '@testing-library/jest-dom/extend-expect';
import { render } from '@testing-library/svelte';

function addCommonDataScript() {
  const commonDataScript = document.createElement('script');
  commonDataScript.id = 'common-data';
  commonDataScript.type = 'application/json';
  const selectedDB = { id: 1, name: 'mathesar_tables' };
  commonDataScript.textContent = JSON.stringify({
    schemas: [],
    databases: [selectedDB],
    selected_db: selectedDB.name,
  });
  document.body.append(commonDataScript);
}

function removeCommonDataScript() {
  const commonDataScript = document.querySelector('#common-data');
  if (commonDataScript) {
    commonDataScript.remove();
  }
}

test('shows mathesar default text when rendered', async () => {
  addCommonDataScript();
  const App = await import('../App.svelte');
  const { getByText } = render(App.default, {});
  expect(getByText('mathesar_tables')).toBeInTheDocument();
  removeCommonDataScript();
});
