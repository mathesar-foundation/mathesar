import ImmutableSet from './ImmutableSet';

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
