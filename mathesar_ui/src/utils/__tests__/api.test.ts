import { getMostImportantRequestStatusState } from '../../api/utils/requestUtils';

test('getMostImportantRequestStatusState', () => {
  expect(
    getMostImportantRequestStatusState([
      { state: 'processing' },
      { state: 'success' },
      { state: 'failure', errors: ['foo'] },
    ]),
  ).toBe('processing');

  expect(
    getMostImportantRequestStatusState([
      { state: 'success' },
      { state: 'failure', errors: ['foo'] },
    ]),
  ).toBe('failue');

  expect(getMostImportantRequestStatusState([{ state: 'success' }])).toBe(
    'success',
  );

  expect(getMostImportantRequestStatusState([])).toBe(undefined);
});
