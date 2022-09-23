import { render } from '@testing-library/svelte';
import { faCat } from '@fortawesome/free-solid-svg-icons';
import Icon from '../Icon.svelte';

test('renders icon with default role as presentation', () => {
  const { getByRole } = render(Icon, {
    props: {
      data: faCat,
    },
  });

  const icon = getByRole('presentation');
  expect(icon).toBeInTheDocument();
  expect(icon).toHaveClass('fa-icon');
});

test('renders icon with size prop as height and width', () => {
  const { getByRole } = render(Icon, {
    props: {
      data: faCat,
      size: '20px',
    },
  });

  const icon = getByRole('presentation');
  expect(icon).toBeInTheDocument();
  expect(icon).toHaveAttribute('width', '20px');
  expect(icon).toHaveAttribute('height', '20px');
});

test('renders icon based on passed props', () => {
  const { getByRole } = render(Icon, {
    props: {
      data: faCat,
      flip: 'both',
      rotate: 180,
      class: 'custom-class',
      spin: true,
      pulse: true,
    },
  });

  const icon = getByRole('presentation');
  expect(icon).toBeInTheDocument();
  expect(icon).toHaveClass('fa-spin');
  expect(icon).toHaveClass('fa-pulse');
  expect(icon).toHaveClass('fa-flip-both');
  expect(icon).toHaveClass('fa-rotate-180');
  expect(icon).toHaveClass('custom-class');
});

test('sets aria-label and role as img when label is present', () => {
  const { getByRole } = render(Icon, {
    props: {
      data: faCat,
      label: 'A cat',
    },
  });

  const icon = getByRole('img');
  expect(icon).toBeInTheDocument();
  expect(icon).toHaveClass('fa-icon');
});
