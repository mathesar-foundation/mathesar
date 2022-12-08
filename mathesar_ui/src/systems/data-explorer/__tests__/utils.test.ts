import {
  checkoutsJoinableTables,
  CheckoutsPkColumnId,
  checkoutsLinkTreeFromItems,
  selfRefTableJoinableTables,
  SelfRefTableFkColumnId,
  selfRefTableLinkTree,
  groupTable,
  groupTablePerson1ColumnId,
  groupTablePerson2ColumnId,
  groupTableLinkTreeFromPerson1,
  groupTableLinkTreeFromPerson2,
} from './mockData';
import { getLinkFromColumn } from '../utils';

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
