function getCurrentWindow(start: number, end: number): number[] {
  const arr: number[] = [];
  for (let i = start; i <= end; i += 1) {
    arr.push(i);
  }
  return arr;
}

interface PageInfo {
  currentWindow: number[];
  start: number;
  end: number;
  prevPageWindow: number;
  nextPageWindow: number;
}

export function calculatePages(
  currentPage: number,
  pageCount: number,
): PageInfo {
  let start = Math.max(currentPage - 2, 1);
  let end = Math.min(start + 4, pageCount);
  if (end - start < 4) {
    start = Math.max(end - 4, 1);
  }
  if (end > pageCount - 2) {
    start = Math.max(end - (6 - (pageCount - end)), 1);
  }
  if (start < 3) {
    end = Math.min(end + 2 - (start - 1), pageCount);
  }
  const currentWindow = getCurrentWindow(start, end);

  return {
    currentWindow,
    start,
    end,
    prevPageWindow: Math.max(start - 3, 1),
    nextPageWindow: Math.min(end + 3, pageCount),
  };
}

export function getPageCount(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize);
}
