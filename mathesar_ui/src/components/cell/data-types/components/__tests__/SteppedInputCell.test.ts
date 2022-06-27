import { render } from '@testing-library/svelte';
import SteppedInputCell from '../SteppedInputCell.svelte';

describe('StepperInputCell', () => {
  test('renders valid string', () => {
    const { container } = render(SteppedInputCell, {
      props: {
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
        value: undefined,
      },
    });

    const cellContent = container.querySelector('.content');
    expect(cellContent).not.toBeNull();
    expect(cellContent).toHaveTextContent('DEFAULT');
  });
});
