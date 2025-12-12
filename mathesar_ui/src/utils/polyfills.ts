export {};

if (!Array.prototype.at) {
  // eslint-disable-next-line no-extend-native, func-names
  Array.prototype.at = function (index) {
    // Convert the index to an integer
    let normalizedIndex = Math.trunc(index) || 0;

    // Handle negative indices
    if (normalizedIndex < 0) {
      normalizedIndex += this.length;
    }

    // Return undefined if out of bounds
    if (normalizedIndex < 0 || normalizedIndex >= this.length) {
      return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this[normalizedIndex];
  };
}
