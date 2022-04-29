import { getCursorPositionAfterReformat } from '../formattedInputUtils';

test.each(
  // prettier-ignore
  [ // oldText       oldCursorPosition  newText        newCursorPosition
    [  ''          , 0                , ''           , 0 ],
    [  '123'       , 1                , '123'        , 1 ],
    [  '1234'      , 4                , '1,234'      , 5 ],
    [  '1234'      , 1                , '1,234'      , 2 ],
    // // These cases are commented out because they're not yet handled.
    // // See https://github.com/centerofci/mathesar/issues/1284
    // [  '.12,345'   , 1                , '0.12345'    , 2 ],
    // [  '1,24'      , 3                , '124'        , 2 ],
    // [  '1,23'      , 4                , '123'        , 3 ],
    // [  '100,0000'  , 6                , '1,000,000'  , 7 ],
    // [  '1,000,00'  , 7                , '100,000'    , 6 ],
    // [  '2a3'       , 2                , '23'         , 1 ],
    // [  '2aaaa3'    , 5                , '23'         , 1 ],
    // [  '23'        , 2                , '23'         , 1 ],
    // [  '-23'       , 1                , '23'         , 0 ],
  ],
)(
  'getCursorPositionAfterReformat oldText: "%s", oldCursorPosition: %d, newText: "%s"',
  (oldText, oldCursorPosition, newText, newCursorPosition) => {
    expect(
      getCursorPositionAfterReformat({ oldText, oldCursorPosition, newText }),
    ).toBe(newCursorPosition);
  },
);
