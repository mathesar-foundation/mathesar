import {
  parse,
  type Token,
  textToken as text,
  slotToken as slot,
} from '../richTextUtils';

describe('RichText', () => {
  const cases: [string, Token[]][] = [
    ['', []],
    ['foo', [text('foo')]],
    ['[bar]', [slot('bar')]],
    ['foo[bar]', [text('foo'), slot('bar')]],
    ['foo[0_BAR_foo_9]', [text('foo'), slot('0_BAR_foo_9')]],
    ['[bar]foo', [slot('bar'), text('foo')]],
    [' [bar]foo', [text(' '), slot('bar'), text('foo')]],
    ['foo[[bar]', [text('foo['), slot('bar')]],
    ['foo\\[bar]', [text('foo\\'), slot('bar')]],
    ['[bar]foo[baz]', [slot('bar'), text('foo'), slot('baz')]],
    ['foo [bar] baz', [text('foo '), slot('bar'), text(' baz')]],
    ['foo[bar][baz]bat', [text('foo'), slot('bar'), slot('baz'), text('bat')]],
  ];
  test.each(cases)('parse %#', (input, output) => {
    expect(parse(input)).toEqual(output);
  });

  test.each([
    'foo[]',
    'foo[ bar]',
    'foo[bar ]',
    'foo[bar',
    'foo[bar NOPE]',
    'foo[bar-nope]',
  ])('no slots %#', (input) => {
    expect(parse(input)).toEqual([text(input)]);
  });
});
