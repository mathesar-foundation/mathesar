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

  const { getByRole, getAllByRole } = render(Select, {
    props: {
      options,
      triggerAppearance: 'default',
    },
  });

  // Options are only rendered when the button is clicked.
  const selectBtn = getByRole('button');
  await fireEvent.click(selectBtn);

  // Select the second option.
  let selectOptions = getAllByRole('option');
  await fireEvent.click(selectOptions[1]);

  // Expect the button to contain the correct label.
  expect(selectBtn).toHaveTextContent(options[1].label);

  // Open the options list again, so we can update the
  // reference to the list of options.
  await fireEvent.click(selectBtn);
  selectOptions = getAllByRole('option');

  // Expect the selected option to have the correct classes.
  expect(selectOptions[1]).toHaveClass('selected');
  expect(selectOptions[1]).toHaveClass('hovered');

  expect(selectOptions[0]).not.toHaveClass('selected');
  expect(selectOptions[0]).not.toHaveClass('hovered');
});

test('select option using keyboard', async () => {
  const options = [
    { id: 1, label: 'Option 1' },
    { id: 2, label: 'Option 2' },
  ];

  const { getByRole, getAllByRole } = render(Select, {
    props: {
      options,
      triggerAppearance: 'default',
    },
  });

  // Options are only rendered when the button is clicked
  // or Enter is pressed on it.
  const selectBtn = getByRole('button');
  await fireEvent.keyDown(selectBtn, { key: 'Enter', code: 'Enter' });
  await fireEvent.keyUp(selectBtn, { key: 'Enter', code: 'Enter' });

  // Move down one option (By default, the first option is selected).
  await fireEvent.keyDown(selectBtn, { key: 'ArrowDown', code: 'ArrowDown' });
  await fireEvent.keyUp(selectBtn, { key: 'ArrowDown', code: 'ArrowDown' });

  // Check if the second option has the correct classes.
  const selectOptions = getAllByRole('option');
  expect(selectOptions[1]).toHaveClass('hovered');
  expect(selectOptions[1]).not.toHaveClass('selected');

  // Select the second option.
  await fireEvent.keyDown(selectBtn, { key: 'Enter', code: 'Enter' });
  await fireEvent.keyUp(selectBtn, { key: 'Enter', code: 'Enter' });

  expect(selectBtn).toHaveTextContent(options[1].label);
});

test('hide select dropdown by pressing ESC', async () => {
  const options = [
    { id: 1, label: 'Option 1' },
    { id: 2, label: 'Option 2' },
  ];

  const { getByRole, queryByText } = render(Select, {
    props: {
      options,
      triggerAppearance: 'default',
    },
  });

  // Options are only rendered when the button is clicked.
  const selectBtn = getByRole('button');
  await fireEvent.click(selectBtn);

  // KeyPress was not working, but it does the same thing.
  await fireEvent.keyDown(selectBtn, { key: 'Escape', code: 'Escape' });
  await fireEvent.keyUp(selectBtn, { key: 'Escape', code: 'Escape' });

  // Use `queryBy` to avoid throwing an error with `getBy`.
  const selectOption2 = queryByText(options[1].label);
  expect(selectOption2).not.toBeInTheDocument();
});
