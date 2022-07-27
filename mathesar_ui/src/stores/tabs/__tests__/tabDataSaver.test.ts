import {
  TabularType,
  Grouping,
  Sorting,
  Filtering,
  SortDirection,
} from '@mathesar/stores/table-data';
import Pagination from '@mathesar/utils/Pagination';
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
            combination: 'and',
            entries: [
              {
                columnId: 99,
                conditionId: 'eq',
                value: 'This is a column value',
              },
            ],
          }),
          grouping: new Grouping([127, 91]),
          sorting: new Sorting([
            [876, SortDirection.A],
            [108, SortDirection.D],
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
