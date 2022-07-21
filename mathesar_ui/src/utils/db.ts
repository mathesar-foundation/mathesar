export function getAvailableName(
  desiredName: string,
  reservedNames: Set<string>,
): string {
  let availableName = desiredName;
  let i = 1;
  while (reservedNames.has(availableName)) {
    availableName = `${desiredName}_${i}`;
    i += 1;
  }
  return availableName;
}
