function isObject(obj: unknown): obj is Record<string, unknown> {
  return obj !== null && typeof obj === 'object';
}

export function objectsAreDeeplyEqual(a: unknown, b: unknown): boolean {
  if (!isObject(a) || !isObject(b)) return a === b;

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every((key) => objectsAreDeeplyEqual(a[key], b[key]));
}
