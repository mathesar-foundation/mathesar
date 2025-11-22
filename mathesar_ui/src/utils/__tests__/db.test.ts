import { getAvailableName } from '../db';

test('getAvailableName', () => {
  expect(getAvailableName('a', new Set([]))).toBe('a');
  expect(getAvailableName('a', new Set(['a']))).toBe('a_1');
  expect(getAvailableName('a', new Set(['a', 'a_1']))).toBe('a_2');
  expect(getAvailableName('a_1', new Set(['a']))).toBe('a_1');
  expect(getAvailableName('a_1', new Set(['a', 'a_1']))).toBe('a_2');
  expect(getAvailableName('a_1', new Set(['a_1']))).toBe('a_2');
  expect(getAvailableName('a_1', new Set(['a_1', 'a_2']))).toBe('a_3');
  expect(getAvailableName('a_1', new Set(['a_2']))).toBe('a_1');
  expect(getAvailableName('a_2', new Set(['a', 'a_1']))).toBe('a_2');
  expect(getAvailableName('a_2', new Set(['a_1']))).toBe('a_2');
  expect(getAvailableName('a_2', new Set(['a_1', 'a_2', 'a_3']))).toBe('a_4');
  expect(getAvailableName('a_3', new Set(['a_1', 'a_3']))).toBe('a_4');
});
