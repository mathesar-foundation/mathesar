import IdSequence from '../IdSequence';

test('IdSequence', () => {
  const s = new IdSequence(['h', 'i', 'j', 'k', 'l']);
  expect(s.length).toBe(5);
  expect(s.first).toBe('h');
  expect(s.last).toBe('l');

  expect([...s]).toEqual(['h', 'i', 'j', 'k', 'l']);

  expect(s.min(['i', 'j', 'k'])).toBe('i');
  expect(s.min(['k', 'j', 'i'])).toBe('i');
  expect(s.min(['i', 'NOPE'])).toBe('i');
  expect(s.min(['NOPE'])).toBe(undefined);
  expect(s.min([])).toBe(undefined);

  expect(s.max(['i', 'j', 'k'])).toBe('k');
  expect(s.max(['k', 'j', 'i'])).toBe('k');
  expect(s.max(['i', 'NOPE'])).toBe('i');
  expect(s.max(['NOPE'])).toBe(undefined);
  expect(s.max([])).toBe(undefined);

  expect([...s.range('i', 'k')]).toEqual(['i', 'j', 'k']);
  expect([...s.range('k', 'i')]).toEqual(['i', 'j', 'k']);
  expect([...s.range('i', 'i')]).toEqual(['i']);
  expect(() => s.range('i', 'NOPE')).toThrow();

  expect(s.offset('i', 0)).toBe('i');
  expect(s.offset('i', 1)).toBe('j');
  expect(s.offset('i', 2)).toBe('k');
  expect(s.offset('i', -1)).toBe('h');
  expect(s.offset('i', -2)).toBe(undefined);
  expect(s.offset('NOPE', 0)).toBe(undefined);
  expect(s.offset('NOPE', 1)).toBe(undefined);

  expect(s.collapsedOffset(['i', 'k'], 0)).toBe(undefined);
  expect(s.collapsedOffset(['i', 'k'], 1)).toBe('l');
  expect(s.collapsedOffset(['i', 'k'], 2)).toBe(undefined);
  expect(s.collapsedOffset(['i', 'k'], -1)).toBe('h');
  expect(s.collapsedOffset(['i', 'k'], -2)).toBe(undefined);
  expect(s.collapsedOffset(['i', 'NOPE'], 0)).toBe(undefined);
  expect(s.collapsedOffset(['i', 'NOPE'], 1)).toBe('j');
  expect(s.collapsedOffset([], 0)).toBe(undefined);
});
