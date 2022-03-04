import {
  TabularType,
  Grouping,
  Sorting,
  Filtering,
  Pagination,
  SortDirection,
} from '@mathesar/stores/table-data';
import type { SavableTabData } from '../tabDataSaver';
import {
  serializeSavableTabData,
  deserializeSavableTabData,
} from '../tabDataSaver';

function roundTrip(data: SavableTabData): SavableTabData {
  return deserializeSavableTabData(serializeSavableTabData(data));
}

test('round trip serialization, empty case', () => {
  const data: SavableTabData = {
    tabs: [],
    activeTab: undefined,
  };
  expect(roundTrip(data)).toEqual(data);
});

test('round trip serialization, complex case', () => {
  const data: SavableTabData = {
    tabs: [
      {
        type: TabularType.Table,
        id: 123,
        metaProps: {
          filtering: new Filtering({
            combination: { id: 'and', label: 'and' },
            entries: [
              {
                columnName: 'Foo',
                condition: { id: 'eq', label: 'equals' },
                value: 'This is a column value',
              },
            ],
          }),
          grouping: new Grouping(['Column 1', 'Column 2']),
          sorting: new Sorting([
            ['My Column name', SortDirection.A],
            ['Your column name', SortDirection.D],
          ]),
          pagination: new Pagination({ page: 2, size: 100 }),
        },
      },
    ],
    activeTab: { type: TabularType.Table, id: 123 },
  };
  expect(roundTrip(data)).toEqual(data);
});

test("can't deserialize invalid input", () => {
  expect(() => {
    deserializeSavableTabData('This input is invalid');
  }).toThrow();
});
