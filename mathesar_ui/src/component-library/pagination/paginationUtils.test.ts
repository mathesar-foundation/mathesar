import { calculatePages } from './paginationUtils';

test('calculatePages', () => {
  expect(calculatePages(1, 1)).toEqual({
    currentWindow: [1],
    start: 1,
    end: 1,
    prevPageWindow: 1,
    nextPageWindow: 1,
  });
  expect(calculatePages(1, 7)).toEqual({
    currentWindow: [1, 2, 3, 4, 5, 6, 7],
    start: 1,
    end: 7,
    prevPageWindow: 1,
    nextPageWindow: 7,
  });
  expect(calculatePages(1, 9)).toEqual({
    currentWindow: [1, 2, 3, 4, 5, 6, 7],
    start: 1,
    end: 7,
    prevPageWindow: 1,
    nextPageWindow: 9,
  });
  expect(calculatePages(50, 100)).toEqual({
    currentWindow: [48, 49, 50, 51, 52],
    start: 48,
    end: 52,
    prevPageWindow: 45,
    nextPageWindow: 55,
  });
  expect(calculatePages(9, 12)).toEqual({
    currentWindow: [6, 7, 8, 9, 10, 11],
    start: 6,
    end: 11,
    prevPageWindow: 3,
    nextPageWindow: 12,
  });
  expect(calculatePages(1, 8)).toEqual({
    currentWindow: [1, 2, 3, 4, 5, 6, 7],
    start: 1,
    end: 7,
    prevPageWindow: 1,
    nextPageWindow: 8,
  });
});
