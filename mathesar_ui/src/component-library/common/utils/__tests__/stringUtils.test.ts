import { transliterateToAscii } from '../stringUtils';

test('transliterateToAscii', () => {
  expect(transliterateToAscii('')).toBe('');
  expect(transliterateToAscii('ABC')).toBe('ABC');
  expect(transliterateToAscii('Crème Brulée')).toBe('Creme Brulee');
});
