import { render } from '@testing-library/svelte';

import Skeleton from '../Skeleton.svelte';

test('renders skeleton when loading is true', () => {
  const { container } = render(Skeleton, {
    loading: true,
  });

  const skeleton = container.querySelector('.skeleton');
  expect(skeleton).not.toBeNull();
});

test('does not render skeleton when loading is false', () => {
  const { container } = render(Skeleton);

  const skeleton = container.querySelector('.skeleton');
  expect(skeleton).toBeNull();
});
