import { render, fireEvent } from '@testing-library/svelte';
import Select from '../Select.svelte';

test('renders select button in default appearance', () => {
  const options = [
    { id: 1, label: 'Option 1' },
    { id: 2, label: 'Option 2' },
  ];

  const { getByRole } = render(Select, {
    props: {
      options,
      triggerAppearance: 'default',
    },
  });

  // Check if the select button is rendered, along with the correct classes.
  const selectBtn = getByRole('button');
  expect(selectBtn).toBeInTheDocument();
  expect(selectBtn).toHaveClass('btn-default');
  expect(selectBtn).toHaveClass('size-medium');

  // Expect the button to contain the correct label.
  expect(selectBtn).toHaveTextContent('Option 1');
});

test('renders select with custom classes and primary appearance', async () => {
  const options = [
    { id: 1, label: 'Option 1' },
    { id: 2, label: 'Option 2' },
  ];

  const { getByRole } = render(Select, {
    props: {
      options,
      triggerAppearance: 'primary',
      contentClass: 'content-custom-class',
      triggerClass: 'trigger-custom-class',
    },
  });

  // Check if the select button is rendered, along with the correct classes.
  const selectBtn = getByRole('button');
  expect(selectBtn).toBeInTheDocument();
  expect(selectBtn).toHaveClass('btn-primary');
  expect(selectBtn).toHaveClass('size-medium');
  expect(selectBtn).toHaveClass('trigger-custom-class');

  // Expect the button to contain the correct label.
  expect(selectBtn).toHaveTextContent('Option 1');

  // Options are only rendered when the button is clicked.
  await fireEvent.click(selectBtn);

  const selectUl = getByRole('listbox');
  expect(selectUl.parentNode).toHaveClass('content-custom-class');
});

test('renders select options in default appearance', async () => {
  const options = [
    { id: 1, label: 'Option 1' },
    { id: 2, label: 'Option 2' },
  ];

  const { getByRole } = render(Select, {
    props: {
      options,
      triggerAppearance: 'default',
    },
  });

  const selectBtn = getByRole('button');

  // Options are only rendered when the button is clicked.
  await fireEvent.click(selectBtn);

  const selectUl = getByRole('listbox');
  // Check if select has the correct classes.
  expect(selectUl.parentElement).toHaveClass('dropdown');
  expect(selectUl.parentElement).toHaveClass('content');
  expect(selectUl.parentElement).toHaveClass('select');

  for (let i = 0; i < options.length; i += 1) {
    // For some reason, a space is added at the end of each option.
    expect(selectUl.children[i]).toHaveTextContent(options[i].label);
  }
});

test('updates currently selected option', async () => {
  const options = [
    { id: 1, label: 'Option 1' },
    { id: 2, label: 'Option 2' },
  ];

  const { getByRole, container } = render(Select, {
    props: {
      options,
      triggerAppearance: 'default',
    },
  });

  const selectBtn = getByRole('button');

  // Options are only rendered when the button is clicked.
  await fireEvent.click(selectBtn);
  const selectUl = getByRole('listbox');

  // Click outside the container, in order to hide the options.
  await fireEvent.click(container);

  await fireEvent.click(selectBtn);
  await fireEvent.click(selectUl.children[1]); // Not working.

  // Expect the button to contain the correct label.
  expect(selectBtn).toHaveTextContent(options[1].label);
});
