import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import InputGroupTest from './InputGroupTest.svelte';

test('renders slotted content', () => {
  const { container, queryByTestId } = render(InputGroupTest);

  const inputGroupWrapper = container.querySelector('.input-group');
  expect(inputGroupWrapper).not.toBeNull();

  const inputElement1 = queryByTestId('input-1') as HTMLInputElement;
  expect(inputElement1).not.toBeNull();
  expect(inputElement1.value).toEqual('value1');

  const inputElement2 = queryByTestId('input-2') as HTMLInputElement;
  expect(inputElement2).not.toBeNull();
  expect(inputElement2.value).toEqual('value2');

  const prependedData = queryByTestId('prepend');
  expect(prependedData).not.toBeNull();
  expect(prependedData).toContainHTML('Prepended data');

  const appendedData = queryByTestId('append');
  expect(appendedData).not.toBeNull();
  expect(appendedData).toContainHTML('Appended data');
});
