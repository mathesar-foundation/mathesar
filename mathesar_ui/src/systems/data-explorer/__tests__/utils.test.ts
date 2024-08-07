import { getLinkFromColumn } from '../utils';

import {
  CheckoutsPkColumnId,
  SelfRefTableFkColumnId,
  checkoutsJoinableTables,
  checkoutsLinkTreeFromItems,
  groupTable,
  groupTableLinkTreeFromPerson1,
  groupTableLinkTreeFromPerson2,
  groupTablePerson1ColumnId,
  groupTablePerson2ColumnId,
  selfRefTableJoinableTables,
  selfRefTableLinkTree,
} from './mockData';

vi.mock('@mathesar/utils/preloadData', () => ({
  preloadCommonData: () => ({
    databases: [],
    servers: [],
  }),
}));

describe('Test getLinkFromColumn', () => {
  test('should generate tree with forward links', () => {
    const forwardLinksFromItem = getLinkFromColumn(
      checkoutsJoinableTables,
      CheckoutsPkColumnId,
      1,
    );
    expect(forwardLinksFromItem).toEqual(checkoutsLinkTreeFromItems);
  });

  test('should include self referential links', () => {
    const forwardLinks = getLinkFromColumn(
      selfRefTableJoinableTables,
      SelfRefTableFkColumnId,
      1,
    );
    expect(forwardLinks).toEqual(selfRefTableLinkTree);
  });

  test('should generate tree when there are multiple columns linking to the same table', () => {
    const forwardLinksFromFk1 = getLinkFromColumn(
      groupTable,
      groupTablePerson1ColumnId,
      1,
    );
    const forwardLinksFromFk2 = getLinkFromColumn(
      groupTable,
      groupTablePerson2ColumnId,
      1,
    );
    expect(forwardLinksFromFk1).toEqual(groupTableLinkTreeFromPerson1);

    expect(forwardLinksFromFk2).toEqual(groupTableLinkTreeFromPerson2);
  });
});
