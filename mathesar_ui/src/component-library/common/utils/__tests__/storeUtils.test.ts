import { get, writable } from 'svelte/store';

import { collapse, unite } from '../storeUtils';

test('collapse', () => {
  const innerA = writable(21);
  const innerB = writable(31);
  const outer = writable(innerA);
  const collapsed = collapse<number>(outer);
  expect(get(collapsed)).toBe(21);
  innerA.set(22);
  expect(get(collapsed)).toBe(22);
  outer.set(innerB);
  expect(get(collapsed)).toBe(31);
  innerB.set(32);
  expect(get(collapsed)).toBe(32);
});

test('unite', () => {
  const a = writable(21);
  const b = writable(31);
  const all = [a, b];
  const united = unite(all);
  expect(get(united)).toEqual([21, 31]);
  a.set(22);
  expect(get(united)).toEqual([22, 31]);
  b.set(32);
  expect(get(united)).toEqual([22, 32]);
});
