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

export function deserializeTsv(data: string): string[][] {
  throw new Error('Not implemented'); // TODO
}
