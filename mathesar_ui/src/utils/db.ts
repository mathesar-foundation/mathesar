/**
 * e.g.
 *
 * "foo_3" => ["foo", 3]
 * "foo_1_3" => ["foo_1", 3]
 * "foo_nope" => ["foo_nope", undefined]
 */
function stripNumericSuffix(
  input: string,
  delimiter = '_',
): [string, number | undefined] {
  let numericSuffix: number | undefined;
  // Digits can only be repeated 15 times max to avoid overflow
  const pattern = `${delimiter}\\d{1,15}$`;
  const strippedInput = input.replace(new RegExp(pattern), (s) => {
    numericSuffix = parseInt(s.slice(1), 10);
    return '';
  });
  return [strippedInput, numericSuffix];
}

export function getAvailableName(
  desiredName: string,
  reservedNames: Set<string>,
): string {
  if (!reservedNames.has(desiredName)) {
    return desiredName;
  }
  const [base, existingSuffix] = stripNumericSuffix(desiredName);
  let suffix = (existingSuffix ?? 0) + 1;
  function getGuess() {
    return `${base}_${suffix}`;
  }
  let guess = getGuess();
  while (reservedNames.has(guess)) {
    suffix += 1;
    guess = getGuess();
  }
  return guess;
}
