import { render } from '@testing-library/svelte';
import SteppedInputCell from '../SteppedInputCell.svelte';

const requiredProps = {
  isActive: false,
  isSelectedInRange: false,
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
});
