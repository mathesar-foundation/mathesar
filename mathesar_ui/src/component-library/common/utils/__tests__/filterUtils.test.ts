import { filterTree } from '../filterUtils';

function filterRecords(
  data: Record<string, unknown>[],
  labelKey: string,
  childKey: string,
  searchTerm: string,
): Record<string, unknown>[] {
  return filterTree(data, (e) => String(e[labelKey]), searchTerm, {
    get: (e) => e[childKey] as Record<string, unknown>[],
    set: (e, v) => ({ ...e, [childKey]: v }),
  });
}

const dummyData = [
  {
    alevel1Key1: 'level1Value1',
    targetChildKey: [
      {
        level2Key1: 'level2Value1',
        targetChildKey: [
          {
            level3Key1: 'target',
          },
          {
            nonSearchNonChildEntry: 'someValue',
          },
        ],
      },
    ],
  },
  {
    blevel1Key1: 'level1Value1',
    targetChildKey: [
      {
        level2Key1: 'level2Value1',
        targetChildKey: [
          {
            level3Key1: 'randomValue',
          },
        ],
      },
    ],
  },
];

const testRes = [
  {
    alevel1Key1: 'level1Value1',
    targetChildKey: [
      {
        level2Key1: 'level2Value1',
        targetChildKey: [
          {
            level3Key1: 'target',
          },
        ],
      },
    ],
  },
];
test('filterUtils', () => {
  expect(
    filterRecords(dummyData, 'level3Key1', 'targetChildKey', 'get'),
  ).toEqual(testRes);
  expect(filterRecords(dummyData, 'level3Key1', 'targetChildKey', '')).toEqual(
    dummyData,
  );
});
