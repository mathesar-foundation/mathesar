import * as fs from 'node:fs';

/** Parse a single CSV line, handling double-quoted fields (with escaped quotes). */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      out.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  out.push(current);
  return out;
}

/** Read the header row and the first data row from a CSV file. */
export function readCsvHeaderAndFirstRow(csvPath: string): {
  header: string[];
  firstRow: string[];
} {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split(/\r?\n/);
  return {
    header: parseCsvLine(lines[0] ?? ''),
    firstRow: parseCsvLine(lines[1] ?? ''),
  };
}
