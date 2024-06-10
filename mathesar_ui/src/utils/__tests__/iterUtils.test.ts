import { cartesianProduct } from '../iterUtils';

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
