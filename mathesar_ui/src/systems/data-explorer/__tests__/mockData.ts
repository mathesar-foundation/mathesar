import type { JoinableTablesResult } from '@mathesar/api/tables/joinable_tables';

export const ItemsTableId = 75;
export const CheckoutsPkColumnId = 216;
export const ItemsPkColumnId = 221;

export const checkoutsJoinableTables: JoinableTablesResult = {
  joinable_tables: [
    {
      target: ItemsTableId,
      jp_path: [[CheckoutsPkColumnId, ItemsPkColumnId]],
      fk_path: [[188, false]],
      depth: 1,
      multiple_results: false,
    },
    {
      target: 72,
      jp_path: [[217, 228]],
      fk_path: [[189, false]],
      depth: 1,
      multiple_results: false,
    },
    {
      target: 78,
      jp_path: [
        [CheckoutsPkColumnId, ItemsPkColumnId],
        [222, 229],
      ],
      fk_path: [
        [188, false],
        [192, false],
      ],
      depth: 2,
      multiple_results: false,
    },
    {
      target: 74,
      jp_path: [
        [CheckoutsPkColumnId, ItemsPkColumnId],
        [222, 229],
        [231, 235],
      ],
      fk_path: [
        [188, false],
        [192, false],
        [196, false],
      ],
      depth: 3,
      multiple_results: false,
    },
    {
      target: 77,
      jp_path: [
        [CheckoutsPkColumnId, ItemsPkColumnId],
        [222, 229],
        [232, 211],
      ],
      fk_path: [
        [188, false],
        [192, false],
        [195, false],
      ],
      depth: 3,
      multiple_results: false,
    },
  ],
  tables: {
    [ItemsTableId]: {
      name: 'Items',
      columns: [ItemsPkColumnId, 222],
    },
    72: { name: 'Patrons', columns: [228] },
    78: { name: 'Publications', columns: [229, 231, 232] },
    74: { name: 'Publishers', columns: [235] },
    77: { name: 'Authors', columns: [211] },
  },
  columns: {
    [ItemsPkColumnId]: { name: 'id', type: 'integer' },
    222: { name: 'Publication', type: 'integer' },
    228: { name: 'id', type: 'integer' },
    229: { name: 'id', type: 'integer' },
    231: { name: 'Publisher', type: 'integer' },
    232: { name: 'Author', type: 'integer' },
    235: { name: 'id', type: 'integer' },
    211: { name: 'id', type: 'integer' },
  },
};

export const checkoutsLinkTreeFromItems = {
  id: ItemsTableId,
  linkedToColumn: {
    id: ItemsPkColumnId,
    name: 'id',
  },
  name: 'Items',
  columns: new Map([
    [
      ItemsPkColumnId,
      expect.objectContaining({
        id: ItemsPkColumnId,
        jpPath: [[216, 221]],
        linksTo: undefined,
        name: 'id',
      }),
    ],
    [
      222,
      expect.objectContaining({
        id: 222,
        jpPath: [[216, 221]],
        linksTo: {
          id: 78,
          name: 'Publications',
          linkedToColumn: { id: 229, name: 'id' },
          columns: new Map([
            [
              229,
              expect.objectContaining({
                id: 228,
                name: 'id',
                jpPath: [
                  [216, 221],
                  [222, 229],
                ],
              }),
            ],
            [
              231,
              expect.objectContaining({
                id: 231,
                name: 'Publisher',
                jpPath: [
                  [216, 221],
                  [222, 229],
                ],
                linksTo: {
                  id: 74,
                  name: 'Publishers',
                  linkedToColumn: {
                    id: 235,
                    name: 'id',
                  },
                  columns: new Map([
                    [
                      235,
                      expect.objectContaining({
                        id: 235,
                        name: 'id',
                        jpPath: [
                          [216, 221],
                          [222, 229],
                          [231, 235],
                        ],
                        linksTo: undefined,
                      }),
                    ],
                  ]),
                },
              }),
            ],
            [
              232,
              expect.objectContaining({
                id: 232,
                name: 'Author',
                jpPath: [
                  [216, 221],
                  [222, 229],
                ],
                linksTo: new Map([
                  [
                    77,
                    expect.objectContaining({
                      id: 77,
                      name: 'Authors',
                      linkedToColumn: { id: 211, name: 'id' },
                      columns: new Map([[211, { id: 221, name: 'id' }]]),
                    }),
                  ],
                ]),
              }),
            ],
          ]),
        },
        name: 'Publication',
      }),
    ],
  ]),
};

export const SelfRefTableId = 1158;
export const SelfRefTablePkColumnId = 4898;
export const SelfRefTableFkColumnId = 5355;

export const selfRefTableJoinableTables: JoinableTablesResult = {
  joinable_tables: [
    {
      target: SelfRefTableId,
      jp_path: [[SelfRefTableFkColumnId, SelfRefTablePkColumnId]],
      fk_path: [[2529, false]],
      depth: 1,
      multiple_results: false,
    },
    {
      target: SelfRefTableId,
      jp_path: [[SelfRefTablePkColumnId, SelfRefTableFkColumnId]],
      fk_path: [[2529, true]],
      depth: 1,
      multiple_results: true,
    },
    {
      target: SelfRefTableId,
      jp_path: [
        [SelfRefTableFkColumnId, SelfRefTablePkColumnId],
        [SelfRefTableFkColumnId, SelfRefTablePkColumnId],
      ],
      fk_path: [
        [2529, false],
        [2529, false],
      ],
      depth: 2,
      multiple_results: false,
    },
    {
      target: SelfRefTableId,
      jp_path: [
        [SelfRefTablePkColumnId, SelfRefTableFkColumnId],
        [SelfRefTablePkColumnId, SelfRefTableFkColumnId],
      ],
      fk_path: [
        [2529, true],
        [2529, true],
      ],
      depth: 2,
      multiple_results: true,
    },
    {
      target: SelfRefTableId,
      jp_path: [
        [SelfRefTableFkColumnId, SelfRefTablePkColumnId],
        [SelfRefTableFkColumnId, SelfRefTablePkColumnId],
        [SelfRefTableFkColumnId, SelfRefTablePkColumnId],
      ],
      fk_path: [
        [2529, false],
        [2529, false],
        [2529, false],
      ],
      depth: 3,
      multiple_results: false,
    },
    {
      target: SelfRefTableId,
      jp_path: [
        [SelfRefTablePkColumnId, SelfRefTableFkColumnId],
        [SelfRefTablePkColumnId, SelfRefTableFkColumnId],
        [SelfRefTablePkColumnId, SelfRefTableFkColumnId],
      ],
      fk_path: [
        [2529, true],
        [2529, true],
        [2529, true],
      ],
      depth: 3,
      multiple_results: true,
    },
  ],
  tables: {
    [SelfRefTableId]: {
      name: 'Self Referential Table',
      columns: [SelfRefTablePkColumnId, SelfRefTableFkColumnId],
    },
  },
  columns: {
    [SelfRefTablePkColumnId]: { name: 'id', type: 'integer' },
    [SelfRefTableFkColumnId]: { name: 'Self Referential Row', type: 'integer' },
  },
};

export const selfRefTableLinkTree = {
  id: SelfRefTableId,
  name: 'Self Referential Table',
  linkedToColumn: {
    id: SelfRefTablePkColumnId,
    name: 'id',
  },
  columns: new Map([
    [
      SelfRefTablePkColumnId,
      expect.objectContaining({
        id: SelfRefTablePkColumnId,
        jpPath: [[SelfRefTableFkColumnId, SelfRefTablePkColumnId]],
        linksTo: undefined,
        name: 'id',
      }),
    ],
    [
      SelfRefTableFkColumnId,
      expect.objectContaining({
        id: SelfRefTableFkColumnId,
        jpPath: [[SelfRefTableFkColumnId, SelfRefTablePkColumnId]],
        linksTo: {
          id: SelfRefTableId,
          name: 'Self Referential Table',
          linkedToColumn: { id: SelfRefTablePkColumnId, name: 'id' },
          columns: new Map([
            [
              SelfRefTablePkColumnId,
              expect.objectContaining({
                id: SelfRefTablePkColumnId,
                jpPath: [
                  [SelfRefTableFkColumnId, SelfRefTablePkColumnId],
                  [SelfRefTableFkColumnId, SelfRefTablePkColumnId],
                ],
                linksTo: undefined,
              }),
            ],
            [
              SelfRefTableFkColumnId,
              expect.objectContaining({
                id: SelfRefTableFkColumnId,
                jpPath: [
                  [SelfRefTableFkColumnId, SelfRefTablePkColumnId],
                  [SelfRefTableFkColumnId, SelfRefTablePkColumnId],
                ],
                linksTo: {
                  id: SelfRefTableId,
                  linkedToColumn: {
                    id: SelfRefTablePkColumnId,
                    name: 'id',
                  },
                  columns: new Map([
                    [
                      SelfRefTablePkColumnId,
                      expect.objectContaining({
                        id: SelfRefTablePkColumnId,
                        jpPath: [
                          [SelfRefTableFkColumnId, SelfRefTablePkColumnId],
                          [SelfRefTableFkColumnId, SelfRefTablePkColumnId],
                          [SelfRefTableFkColumnId, SelfRefTablePkColumnId],
                        ],
                        linksTo: undefined,
                        name: 'id',
                      }),
                    ],
                    [
                      SelfRefTableFkColumnId,
                      expect.objectContaining({
                        id: SelfRefTableFkColumnId,
                        jpPath: [
                          [SelfRefTableFkColumnId, SelfRefTablePkColumnId],
                          [SelfRefTableFkColumnId, SelfRefTablePkColumnId],
                          [SelfRefTableFkColumnId, SelfRefTablePkColumnId],
                        ],
                        linksTo: undefined,
                        name: 'Self Referential Row',
                      }),
                    ],
                  ]),
                },
              }),
            ],
          ]),
        },
        name: 'Self Referential Row',
      }),
    ],
  ]),
};

export const personTableId = 1332;
export const groupTablePerson1ColumnId = 5831;
export const groupTablePerson2ColumnId = 5914;
export const personTablePkColumnId = 5570;
export const groupTable: JoinableTablesResult = {
  joinable_tables: [
    {
      target: personTableId,
      jp_path: [[groupTablePerson1ColumnId, personTablePkColumnId]],
      fk_path: [[2765, false]],
      depth: 1,
      multiple_results: false,
    },
    {
      target: personTableId,
      jp_path: [[groupTablePerson2ColumnId, personTablePkColumnId]],
      fk_path: [[2801, false]],
      depth: 1,
      multiple_results: false,
    },
    {
      target: 1295,
      jp_path: [
        [groupTablePerson1ColumnId, personTablePkColumnId],
        [personTablePkColumnId, groupTablePerson2ColumnId],
      ],
      fk_path: [
        [2765, false],
        [2801, true],
      ],
      depth: 2,
      multiple_results: true,
    },
    {
      target: 1295,
      jp_path: [
        [groupTablePerson2ColumnId, personTablePkColumnId],
        [personTablePkColumnId, groupTablePerson1ColumnId],
      ],
      fk_path: [
        [2801, false],
        [2765, true],
      ],
      depth: 2,
      multiple_results: true,
    },
    {
      target: personTableId,
      jp_path: [
        [groupTablePerson1ColumnId, personTablePkColumnId],
        [personTablePkColumnId, groupTablePerson2ColumnId],
        [groupTablePerson1ColumnId, personTablePkColumnId],
      ],
      fk_path: [
        [2765, false],
        [2801, true],
        [2765, false],
      ],
      depth: 3,
      multiple_results: true,
    },
    {
      target: personTableId,
      jp_path: [
        [groupTablePerson2ColumnId, personTablePkColumnId],
        [personTablePkColumnId, groupTablePerson1ColumnId],
        [groupTablePerson2ColumnId, personTablePkColumnId],
      ],
      fk_path: [
        [2801, false],
        [2765, true],
        [2801, false],
      ],
      depth: 3,
      multiple_results: true,
    },
  ],
  tables: {
    [personTableId]: { name: 'Person', columns: [personTablePkColumnId, 5781] },
    1295: {
      name: 'Group',
      columns: [5431, groupTablePerson1ColumnId, groupTablePerson2ColumnId],
    },
  },
  columns: {
    [personTablePkColumnId]: { name: 'id', type: 'integer' },
    5781: { name: 'name', type: 'text' },
    5431: { name: 'id', type: 'integer' },
    [groupTablePerson1ColumnId]: { name: 'Person1', type: 'integer' },
    [groupTablePerson2ColumnId]: { name: 'Person2', type: 'integer' },
  },
};

export const groupTableLinkTreeFromPerson1 = {
  id: personTableId,
  name: 'Person',
  linkedToColumn: {
    id: personTablePkColumnId,
    name: 'id',
  },
  columns: new Map([
    [
      personTablePkColumnId,
      expect.objectContaining({
        id: personTablePkColumnId,
        jpPath: [[groupTablePerson1ColumnId, personTablePkColumnId]],
      }),
    ],
    [
      5781,
      expect.objectContaining({
        id: 5781,
      }),
    ],
  ]),
};

export const groupTableLinkTreeFromPerson2 = {
  id: personTableId,
  name: 'Person',
  linkedToColumn: {
    id: personTablePkColumnId,
    name: 'id',
  },
  columns: new Map([
    [
      personTablePkColumnId,
      expect.objectContaining({
        id: personTablePkColumnId,
        jpPath: [[groupTablePerson2ColumnId, personTablePkColumnId]],
      }),
    ],
    [
      5781,
      expect.objectContaining({
        id: 5781,
      }),
    ],
  ]),
};
