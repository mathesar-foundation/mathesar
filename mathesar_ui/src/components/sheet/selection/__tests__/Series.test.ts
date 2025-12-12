import Series from '../Series';

describe('Series', () => {
  const h = 'h';
  const i = 'i';
  const j = 'j';
  const k = 'k';
  const l = 'l';
  const all = [h, i, j, k, l];
  const s = new Series(all);

  test('basics', () => {
    expect(s.length).toBe(5);
    expect(s.first).toBe(h);
    expect(s.last).toBe(l);
    expect([...s]).toEqual(all);
  });

  test.each([
    [[i, j, k], i],
    [[k, j, i], i],
    [[i, 'NOPE'], i],
    [['NOPE'], undefined],
    [[], undefined],
  ])('min %#', (input, expected) => {
    expect(s.min(input)).toBe(expected);
  });

  test.each([
    [[i, j, k], k],
    [[k, j, i], k],
    [[i, 'NOPE'], i],
    [['NOPE'], undefined],
    [[], undefined],
  ])('max %#', (input, expected) => {
    expect(s.max(input)).toBe(expected);
  });

  test.each([
    [i, k, [i, j, k]],
    [k, i, [i, j, k]],
    [i, i, [i]],
  ])('range %#', (a, b, expected) => {
    expect([...s.range(a, b)]).toEqual(expected);
  });

  test.each([
    [i, 'NOPE'],
    ['NOPE', i],
  ])('range failures %#', (a, b) => {
    expect(() => s.range(a, b)).toThrow();
  });

  test.each([
    [i, 0, i],
    [i, 1, j],
    [i, 2, k],
    [i, -1, h],
    [i, -2, undefined],
    ['NOPE', 0, undefined],
    ['NOPE', 1, undefined],
  ])('offset %#', (value, offset, expected) => {
    expect(s.offset(value, offset)).toBe(expected);
  });

  test.each([
    [[i, k], 0, undefined],
    [[i, k], 1, l],
    [[i, k], 2, undefined],
    [[i, k], -1, h],
    [[i, k], -2, undefined],
    [[i, 'NOPE'], 0, undefined],
    [[i, 'NOPE'], 1, j],
    [[], 0, undefined],
  ])('collapsedOffset %#', (values, offset, expected) => {
    expect(s.collapsedOffset(values, offset)).toBe(expected);
  });
});
