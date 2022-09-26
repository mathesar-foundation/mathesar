import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import TextInput from '../TextInput.svelte';

test('renders text-input with value', () => {
  const { container } = render(TextInput, {
    props: {
      class: 'some-class',
      value: 'somevalue',
    },
  });

  const inputElement = container.querySelector('input');
  expect(inputElement).not.toBeNull();
  expect(inputElement).toHaveClass('some-class');
  expect(inputElement?.value).toEqual('somevalue');
});
