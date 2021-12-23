import { render, fireEvent } from '@testing-library/svelte';
import TextInput from '../TextInput.svelte';
import TextInputWrapper from './TextInputTestWrapper.svelte';

test('renders text-input with value', () => {
  const { container } = render(TextInput, {
    props: {
      class: 'some-class',
      value: 'somevalue',
    },
  });

  const inputWrapper = container.querySelector('.text-input');
  expect(inputWrapper).not.toBeNull();
  expect(inputWrapper).toHaveClass('some-class');

  const inputElement = inputWrapper?.querySelector('input');
  expect(inputElement).not.toBeNull();
  expect(inputElement?.value).toEqual('somevalue');
});

test('renders slotted content', () => {
  const { container, getByTestId } = render(TextInputWrapper, {
    props: {
      value: 'testvalue',
    },
  });

  const inputWrapper = container.querySelector('.text-input');
  expect(inputWrapper).not.toBeNull();

  const inputElement = inputWrapper?.querySelector('input');
  expect(inputElement).not.toBeNull();
  expect(inputElement?.value).toEqual('testvalue');

  expect(getByTestId('prepend')).toBeInTheDocument();
  expect(getByTestId('append')).toBeInTheDocument();
});

test('focuses/blurs parent on focus/blur of input', async () => {
  const { container } = render(TextInputWrapper);

  const inputWrapper = container.querySelector('.text-input');
  expect(inputWrapper).not.toBeNull();

  const inputElement = inputWrapper?.querySelector('input');
  expect(inputElement).not.toBeNull();

  if (!inputElement) {
    return;
  }
  await fireEvent.focus(inputElement);
  expect(inputWrapper?.className).toContain('focus');

  await fireEvent.blur(inputElement);
  expect(inputWrapper?.className).not.toContain('focus');
});
