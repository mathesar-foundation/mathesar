import '@testing-library/jest-dom/extend-expect';
import { render } from '@testing-library/svelte';
import App from '../App';

test('shows mathesar default text when rendered', () => {
  const { getByText } = render(App, {});

  expect(getByText('Mathesar - Rendered from Svelte')).toBeInTheDocument();
});
