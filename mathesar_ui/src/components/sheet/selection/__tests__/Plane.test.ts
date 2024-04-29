import Series from '../Series';
import Plane from '../Plane';
import { Direction } from '../Direction';

test('Plane with placeholder row', () => {
  const p = new Plane(
    new Series(['r1', 'r2', 'r3', 'r4']),
    new Series(['c1', 'c2', 'c3', 'c4']),
    'PH',
  );

  expect([...p.allDataCells()]).toEqual([
    '["r1","c1"]',
    '["r1","c2"]',
    '["r1","c3"]',
    '["r1","c4"]',
    '["r2","c1"]',
    '["r2","c2"]',
    '["r2","c3"]',
    '["r2","c4"]',
    '["r3","c1"]',
    '["r3","c2"]',
    '["r3","c3"]',
    '["r3","c4"]',
    '["r4","c1"]',
    '["r4","c2"]',
    '["r4","c3"]',
    '["r4","c4"]',
  ]);

  expect([...p.dataCellsInFlexibleRowRange('r1', 'r2')].length).toBe(8);
  expect([...p.dataCellsInFlexibleRowRange('r1', 'r3')].length).toBe(12);
  expect([...p.dataCellsInFlexibleRowRange('r3', 'r4')].length).toBe(8);
  expect([...p.dataCellsInFlexibleRowRange('r3', 'PH')].length).toBe(8);
  expect([...p.dataCellsInFlexibleRowRange('PH', 'PH')]).toEqual([
    '["r4","c1"]',
    '["r4","c2"]',
    '["r4","c3"]',
    '["r4","c4"]',
  ]);

  expect([...p.dataCellsInColumnRange('c1', 'c2')].length).toBe(8);
  expect([...p.dataCellsInColumnRange('c1', 'c3')].length).toBe(12);

  expect(p.getAdjacentCell('["r4","c4"]', Direction.Up)).toEqual({
    type: 'dataCell',
    cellId: '["r3","c4"]',
  });
  expect(p.getAdjacentCell('["r4","c4"]', Direction.Right)).toEqual({
    type: 'none',
  });
  expect(p.getAdjacentCell('["r4","c4"]', Direction.Down)).toEqual({
    type: 'placeholderCell',
    cellId: '["PH","c4"]',
  });
  expect(p.getAdjacentCell('["r4","c4"]', Direction.Left)).toEqual({
    type: 'dataCell',
    cellId: '["r4","c3"]',
  });
});
