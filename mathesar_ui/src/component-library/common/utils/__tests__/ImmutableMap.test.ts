import ImmutableMap from '../ImmutableMap';

const sample = new ImmutableMap<number, string>([
  [1, 'a'],
  [2, 'b'],
]);

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
    [1, 'a'],
    [2, 'b'],
    [0, ''],
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
  expect(new ImmutableMap().size).toBe(0);
});

test('withEntries', () => {
  expect([
    ...sample.withEntries([
      [2, 'FOO'],
      [3, 'c'],
    ]),
  ]).toEqual([
    [1, 'a'],
    [2, 'FOO'],
    [3, 'c'],
  ]);
  expect([...sample.withEntries([])]).toEqual([
    [1, 'a'],
    [2, 'b'],
  ]);
  expect([
    ...sample.withEntries(
      [
        [2, 'FOO'],
        [3, 'c'],
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
