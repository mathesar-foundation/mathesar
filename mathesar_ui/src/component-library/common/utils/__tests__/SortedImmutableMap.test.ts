import SortedImmutableMap from '../SortedImmutableMap';

const sample = new SortedImmutableMap<number, string>(
  (v) => [...v].sort(([, a], [, b]) => a.localeCompare(b)),
  [
    [2, 'b'],
    [1, 'a'],
  ],
);

test('with', () => {
  expect([...sample.with(2, 'b')]).toEqual([
    [1, 'a'],
    [2, 'b'],
  ]);
  expect([...sample.with(2, 'c')]).toEqual([
    [1, 'a'],
    [2, 'c'],
  ]);
  expect([...sample.with(3, 'c')]).toEqual([
    [1, 'a'],
    [2, 'b'],
    [3, 'c'],
  ]);
  expect([...sample.with(0, '')]).toEqual([
    [0, ''],
    [1, 'a'],
    [2, 'b'],
  ]);
});

test('without', () => {
  expect([...sample.without(2)]).toEqual([[1, 'a']]);
  expect([...sample.without(3)]).toEqual([
    [1, 'a'],
    [2, 'b'],
  ]);
});

test('has', () => {
  expect(sample.has(2)).toBe(true);
  expect(sample.has(3)).toBe(false);
});

test('size', () => {
  expect(sample.size).toBe(2);
  expect(new SortedImmutableMap((v) => [...v].sort()).size).toBe(0);
});

test('withEntries', () => {
  expect([
    ...sample.withEntries([
      [2, 'FOO'],
      [3, 'c'],
    ]),
  ]).toEqual([
    [1, 'a'],
    [3, 'c'],
    [2, 'FOO'],
  ]);
  expect([...sample.withEntries([])]).toEqual([
    [1, 'a'],
    [2, 'b'],
  ]);
  expect([
    ...sample.withEntries(
      [
        [3, 'c'],
        [2, 'FOO'],
      ],
      (a, b) => `${a}-${b}`,
    ),
  ]).toEqual([
    [1, 'a'],
    [2, 'b-FOO'],
    [3, 'c'],
  ]);
});

test('mapValues', () => {
  expect([...sample.mapValues((v) => `(${v})`)]).toEqual([
    [1, '(a)'],
    [2, '(b)'],
  ]);
});

test('coalesce', () => {
  expect([...sample.coalesce(1, 'FOO')]).toEqual([
    [1, 'a'],
    [2, 'b'],
  ]);
  expect([...sample.coalesce(3, 'FOO')]).toEqual([
    [1, 'a'],
    [2, 'b'],
    [3, 'FOO'],
  ]);
});

test('coalesceEntries', () => {
  expect([...sample.coalesceEntries([[1, 'FOO']])]).toEqual([
    [1, 'a'],
    [2, 'b'],
  ]);
  expect([...sample.coalesceEntries([])]).toEqual([
    [1, 'a'],
    [2, 'b'],
  ]);
  expect([...sample.coalesceEntries([[3, 'FOO']])]).toEqual([
    [1, 'a'],
    [2, 'b'],
    [3, 'FOO'],
  ]);
});
