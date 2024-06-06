import ImmutableSet from '../ImmutableSet';

test('ImmutableSet', () => {
  const s = new ImmutableSet<number>([7, 8]);
  expect(s.size).toEqual(2);
  expect([...s.with(9).values()]).toEqual([7, 8, 9]);
  expect(s.with(9).valuesArray()).toEqual([7, 8, 9]);
  expect(s.size).toEqual(2);
  expect(s.with(7).valuesArray()).toEqual([7, 8]);
  expect(s.without(9).valuesArray()).toEqual([7, 8]);
  expect(s.without(8).valuesArray()).toEqual([7]);
});

test('union', () => {
  const a = new ImmutableSet<number>([2, 7, 13, 19, 5]);
  const b = new ImmutableSet<number>([23, 13, 3, 2]);
  const empty = new ImmutableSet<number>();
  expect(a.union(b).valuesArray()).toEqual([2, 7, 13, 19, 5, 23, 3]);
  expect(b.union(a).valuesArray()).toEqual([23, 13, 3, 2, 7, 19, 5]);
  expect(a.union(empty).valuesArray()).toEqual([2, 7, 13, 19, 5]);
  expect(empty.union(a).valuesArray()).toEqual([2, 7, 13, 19, 5]);
});

test('intersect', () => {
  const a = new ImmutableSet([2, 7, 13, 19, 5]);
  const b = new ImmutableSet([23, 13, 3, 2]);
  const empty = new ImmutableSet<number>();
  expect(a.intersect(a).valuesArray()).toEqual([2, 7, 13, 19, 5]);
  expect(a.intersect(b).valuesArray()).toEqual([2, 13]);
  expect(b.intersect(a).valuesArray()).toEqual([13, 2]);
  expect(a.intersect(empty).valuesArray()).toEqual([]);
  expect(empty.intersect(a).valuesArray()).toEqual([]);
  expect(empty.intersect(empty).valuesArray()).toEqual([]);
});
