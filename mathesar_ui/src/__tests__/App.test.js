import '@testing-library/jest-dom/extend-expect';
import { render } from '@testing-library/svelte';
import App from '../App.svelte';

test('shows mathesar default text when rendered', () => {
  const { getByText } = render(App, {});

  expect(getByText('Welcome to Mathesar!')).toBeInTheDocument();
});
