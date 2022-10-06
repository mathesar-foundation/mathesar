import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/svelte';
import SlotTest from '@mathesar-component-library-dir/__meta__/utils/SlotTest.svelte';
import Button from '../Button.svelte';

test('renders button in default appearance and medium size', () => {
  const { getByRole } = render(Button);

  const button = getByRole('button');
  expect(button).toBeInTheDocument();
  expect(button).toHaveClass('btn-default');
  expect(button).toHaveClass('size-medium');
});

test('renders button based on passed props', () => {
  const { getByRole } = render(Button, {
    props: {
      appearance: 'primary',
      size: 'small',
      class: 'custom-class',
    },
  });

  const button = getByRole('button');
  expect(button).toHaveClass('btn-primary');
  expect(button).toHaveClass('size-small');
  expect(button).toHaveClass('custom-class');
});

test('handles click event', async () => {
  const { getByRole, component } = render(Button);

  const mock = vi.fn();
  const off = component.$on('click', mock);

  const button = getByRole('button');
  await fireEvent.click(button);
  expect(mock).toHaveBeenCalled();

  off();
});

test('renders slotted content', () => {
  const { getByTestId } = render(SlotTest, {
    props: { component: Button },
  });

  expect(getByTestId('slot')).toBeInTheDocument();
});
