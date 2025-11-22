import * as Papa from 'papaparse';

export function serializeTsv(data: string[][]): string {
  return Papa.unparse(data, {
    delimiter: '\t',
    // From the [Papa Parse][1] library, `escapeFormulae` helps defend against
    // formula [injection attacks][2]. We modify the default value though
    // because it [didn't work][3] for negative numbers. We're supplying our own
    // regex that uses the default behavior plus special handling for negative
    // numbers. It doesn't escape negative numbers because they are valid. But
    // it does escape anything else that begins with a hyphen.
    //
    // [1]: https://www.papaparse.com/docs
    //
    // [2]: https://owasp.org/www-community/attacks/CSV_Injection
    //
    // [3]: https://github.com/mathesar-foundation/mathesar/issues/3576
    escapeFormulae: /^=|^\+|^@|^\t|^\r|^-(?!\d+(\.\d+)?$)/,
  });
}

function emptyStrings(count: number) {
  return Array(count).fill('') as string[];
}

/**
 * Ensure that all rows have the same length by padding them with empty strings.
 */
function makeRectangular(data: string[][]): string[][] {
  const width = Math.max(...data.map((row) => row.length));
  return data.map((r) => [...r, ...emptyStrings(width - r.length)]);
}

export function deserializeTsv(data: string): string[][] {
  // Trimming is necessary because copied data from spreadsheets can have
  // trailing newlines.
  const trimmedData = data.trim();

  const result = Papa.parse(trimmedData, {
    delimiter: '\t',
    skipEmptyLines: false,
  });

  // Note: `result.errors` is an array of error objects but it doesn't seem like
  // we actually need to handle them. From the [docs][1]:
  //
  // > Just because errors are generated does not necessarily mean that parsing
  // > failed. The worst error you can get is probably MissingQuotes.
  //
  // [1]: https://www.papaparse.com/docs#errors

  return makeRectangular(result.data as string[][]);
}
