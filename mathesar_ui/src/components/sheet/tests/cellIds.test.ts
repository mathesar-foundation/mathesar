import { parseCellId } from '../cellIds';

test.each(
  // prettier-ignore
  [
  // cellId    , rowId , columnId
    ['a-b'     , 'a'   , 'b'    ],
    ['a-b-c'   , 'a'   , 'b-c'  ],
    ['a--b'    , 'a'   , '-b'   ],
    [' a - b ' , ' a ' , ' b '  ],
    ['-'       , ''    , ''     ],
    [' - '     , ' '   , ' '    ],
    ['--'      , ''    , '-'    ],
    ['-a-b'    , ''    , 'a-b'  ],
    ['a-'      , 'a'   , ''     ],
  ],
)('parseCellId success %#', (cellId, rowId, columnId) => {
  const result = parseCellId(cellId);
  expect(result.rowId).toBe(rowId);
  expect(result.columnId).toBe(columnId);
});

test.each([[''], ['foobar']])('parseCellId failure %#', (cellId) => {
  expect(() => {
    parseCellId(cellId);
  }).toThrow();
});
