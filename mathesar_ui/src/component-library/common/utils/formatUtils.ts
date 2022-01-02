export function formatSize(sizeInBytes: number): string {
  if (sizeInBytes === 0) {
    return '0 B';
  }

  /*
   * Currently we go with 1024 as the base. But some OS use 1000, including Mac.
   * TODO: Analyze on what is the best option to go with.
   */
  const repIndex = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
  const repValue = sizeInBytes / (1024 ** repIndex);
  const repUnit = ' KMGTP'.charAt(repIndex);

  return `${repValue.toFixed(2)} ${repUnit}B`;
}
