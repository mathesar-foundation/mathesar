export function parseColumnId(id: unknown): number | null {
  if (id === null || id === undefined) return null;

  // Reject empty string early
  if (id === '') return null;

  // If it's already a number and is finite, return it
  if (typeof id === 'number') {
    return Number.isFinite(id) ? id : null;
  }

  // If it's a string, accept only clean integer-like strings
  if (typeof id === 'string') {
    const trimmed = id.trim();
    if (/^-?\d+$/.test(trimmed)) {
      return Number.parseInt(trimmed, 10);
    }
    return null;
  }

  // All other types not supported
  return null;
}
