import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import NumberInput from '../NumberInput.svelte';

test.each([
  {
    description: 'adds US thousands separator',
    locale: 'en-US',
    entry: '1234',
    formattedText: '1,234',
  },
  {
    description: 'Adds German thousands separator',
    locale: 'de-DE',
    entry: '1234',
    formattedText: '1.234',
  },
  {
    description: 'rejects numbers that lead to loss of precision',
    locale: 'en-US',
    entry: '11111111111111119',
    formattedText: '1,111,111,111,111,111',
  },
])('NumberInput %o', async ({ locale, entry, formattedText }) => {
  const user = userEvent.setup();
  const label = 'label';
  const { getByLabelText } = render(NumberInput, {
    locale,
    'aria-label': label,
    useGrouping: true,
  });
  const input = getByLabelText(label) as HTMLInputElement;
  expect(input.value).toBe('');
  await user.type(input, entry);
  expect(input.value).toBe(formattedText);
});
