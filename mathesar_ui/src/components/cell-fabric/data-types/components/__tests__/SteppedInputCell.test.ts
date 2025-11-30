import '@testing-library/jest-dom';
import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';

import SteppedInputCell from '../SteppedInputCell.svelte';

const requiredProps = {
  isActive: false,
  isSelected: false,
  disabled: false,
};

describe('StepperInputCell', () => {
  test('renders valid string', () => {
    const { container } = render(SteppedInputCell, {
      props: {
        ...requiredProps,
        value: 'string value',
      },
    });

    const cellContent = container.querySelector('.content');
    expect(cellContent).not.toBeNull();
    expect(cellContent).toHaveTextContent('string value');
  });

  test('renders valid numbers', () => {
    const { container } = render(SteppedInputCell, {
      props: {
        ...requiredProps,
        value: 0,
      },
    });

    const cellContent = container.querySelector('.content');
    expect(cellContent).not.toBeNull();
    expect(cellContent).toHaveTextContent('0');
  });

  test('renders Null component', () => {
    const { container } = render(SteppedInputCell, {
      props: {
        ...requiredProps,
        value: null,
      },
    });

    const cellContent = container.querySelector('.content');
    expect(cellContent).not.toBeNull();
    expect(cellContent).toHaveTextContent('NULL');
  });

  test('renders nothing on invalid values', () => {
    const { container } = render(SteppedInputCell, {
      props: {
        ...requiredProps,
        value: undefined,
      },
    });

    const cellContent = container.querySelector('.content');
    expect(cellContent).not.toBeNull();
    expect(cellContent).toHaveTextContent('DEFAULT');
  });

  test('syncs lastSavedValue with value prop updates when not in edit mode (Bug A)', async () => {
    const { component, container } = render(SteppedInputCell, {
      props: {
        ...requiredProps,
        value: 'Initial',
      },
    });

    // Simulate store update (e.g. soft refresh)
    component.$set({ value: 'Updated' });
    await tick();

    // Enter edit mode
    const cellWrapper = container.querySelector('.cell-wrapper');
    if (cellWrapper) {
      await fireEvent.dblClick(cellWrapper);

      // Simulate editing (though we just want to check revert value)
      // Press Escape to revert
      await fireEvent.keyDown(cellWrapper, { key: 'Escape' });

      // Check if value reverted to 'Updated'
      await tick();
      const content = container.querySelector('.content');
      expect(content).toHaveTextContent('Updated');
    }
  });
});
