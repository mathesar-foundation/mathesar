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
  expect(selectBtn).toHaveClass('btn-default', 'size-medium');

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
  expect(selectBtn).toHaveClass(
    'btn-primary',
    'size-medium',
    'trigger-custom-class',
  );

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
  expect(selectUl.parentElement).toHaveClass('dropdown', 'content', 'select');

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
  expect(selectOptions[1]).toHaveClass('selected', 'in-focus');

  expect(selectOptions[0]).not.toHaveClass('selected', 'in-focus');
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
  expect(selectOptions[1]).toHaveClass('in-focus');
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

  const { getByRole, queryByRole } = render(Select, {
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
  const selectOption2 = queryByRole('listbox');
  expect(selectOption2).not.toBeInTheDocument();
});

test('list scrolls automatically to display the currently selected option', async () => {
  const options = [];
  for (let i = 1; i < 10; i += 1) {
    options.push({ id: i, label: `Option ${i}` });
  }

  const { getByRole, getAllByRole } = render(Select, {
    props: {
      options,
      triggerAppearance: 'default',
    },
  });

  // options are only rendered when the button is clicked
  const selectBtn = getByRole('button');
  await fireEvent.click(selectBtn);

  // scrolling through the list to reach second last element
  Array(7).forEach(() => async () => {
    await fireEvent.keyDown(selectBtn, {
      key: 'ArrowDown',
      code: 'ArrowDown',
    });
    await fireEvent.keyUp(selectBtn, { key: 'ArrowDown', code: 'ArrowDown' });
  });

  // select the option
  await fireEvent.keyDown(selectBtn, { key: 'Enter', code: 'Enter' });
  await fireEvent.keyUp(selectBtn, { key: 'Enter', code: 'Enter' });

  // reopen the dropdown
  await fireEvent.click(selectBtn);

  // obtain dropdown container
  const selectUl = getByRole('listbox');
  const dropdownContainer: HTMLElement | null = selectUl?.parentElement;

  // second last element obtained
  const optionElementList = getAllByRole('option');
  const optionElement = optionElementList[7];

  expect(dropdownContainer).toBeInTheDocument();
  expect(optionElement.offsetTop).toBeGreaterThanOrEqual(
    dropdownContainer ? dropdownContainer.scrollTop : 0,
  );
  expect(
    optionElement.offsetTop + optionElement.clientHeight,
  ).toBeLessThanOrEqual(
    dropdownContainer
      ? dropdownContainer.scrollTop + dropdownContainer.clientHeight
      : 0,
  );
});
