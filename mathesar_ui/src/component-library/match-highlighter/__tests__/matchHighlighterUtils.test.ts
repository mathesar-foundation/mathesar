import {
  splitMatchParts,
  match as m,
  nonMatch as n,
} from '../matchHighlighterUtils';

test.each([
  ['', '', []],
  ['', 'foo', []],
  ['foo', '', [n('foo')]],
  ['foo', 'foo', [m('foo')]],
  ['foo', 'foobar', [n('foo')]],
  ['foo', 'a', [n('foo')]],
  ['foo', 'o', [n('f'), m('o'), m('o')]],
  ['foo', 'oo', [n('f'), m('oo')]],
  ['fooo', 'oo', [n('f'), m('oo'), n('o')]],
  ['foo BAR', 'bar', [n('foo '), m('BAR')]],
  ['123abcabcabcab', 'abcab', [n('123'), m('abcab'), n('c'), m('abcab')]],
])('splitMatchParts text:"%s" substring:"%s"', (text, substring, result) => {
  expect(splitMatchParts(text, substring)).toEqual(result);
});
