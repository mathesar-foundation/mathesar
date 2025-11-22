import { match } from '../patternMatching';

test('match', () => {
  type Shape =
    | { kind: 'circle'; radius: number }
    | { kind: 'square'; x: number }
    | { kind: 'triangle'; x: number; y: number };

  function area(shape: Shape) {
    return match(shape, 'kind', {
      circle: ({ radius }) => Math.PI * radius ** 2,
      square: ({ x }) => x ** 2,
      triangle: ({ x, y }) => (x * y) / 2,
    });
  }

  expect(area({ kind: 'circle', radius: 5 })).toBe(78.53981633974483);
  expect(area({ kind: 'square', x: 5 })).toBe(25);
  expect(area({ kind: 'triangle', x: 5, y: 6 })).toBe(15);
});
