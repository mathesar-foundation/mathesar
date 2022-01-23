import { filterTree } from '../filterUtils';

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
    targetChildKey: [{
      level2Key1: 'level2Value1',
      targetChildKey: [{
        level3Key1: 'randomValue',
      }],
    }],
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
  expect(filterTree(dummyData, 'level3Key1', 'targetChildKey', 'get')).toEqual(testRes);
  expect(filterTree(dummyData, 'level3Key1', 'targetChildKey', '')).toEqual(dummyData);
});
