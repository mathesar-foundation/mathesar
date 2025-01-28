import { cartesianProduct, partition } from '../iterUtils';

test.each([
  [[], [], []],
  [[], ['a', 'b'], []],
  [['a', 'b'], [], []],
  [
    ['a', 'b'],
    ['x', 'y', 'z'],
    [
      ['a', 'x'],
      ['a', 'y'],
      ['a', 'z'],
      ['b', 'x'],
      ['b', 'y'],
      ['b', 'z'],
    ],
  ],
])('cartesianProduct', (a, b, result) => {
  expect([...cartesianProduct(a, b)]).toStrictEqual(result);
});

test('partition', () => {
  const [even, odd] = partition([1, 2, 3, 4, 5], (v: number) => v % 2 === 0);
  expect([...odd]).toStrictEqual([1, 3, 5]);
  expect([...even]).toStrictEqual([2, 4]);
});

test('partition by type', () => {
  const [string, number] = partition(
    // eslint-disable-next-line no-new-wrappers
    [new String('a'), 1, 2, new String('b'), 3],
    // eslint-disable-next-line @typescript-eslint/ban-types
    (v: String | number): v is String => v instanceof String,
  );
  // eslint-disable-next-line no-new-wrappers
  expect([...string]).toStrictEqual([new String('a'), new String('b')]);
  expect([...number]).toStrictEqual([1, 2, 3]);
});
