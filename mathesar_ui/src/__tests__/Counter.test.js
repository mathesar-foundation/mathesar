
import { render, fireEvent } from '@testing-library/svelte';
import Counter from '../Counter.svelte';

test('increments the counter on click', async () => {
  const { getByText } = render(Counter);

  // Initial state
  getByText('Count: 0');

  // Click button
  const button = getByText('Increment');
  await fireEvent.click(button);

  // Updated state
  getByText('Count: 1');
});
