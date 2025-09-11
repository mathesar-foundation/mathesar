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
