export function stringifyMapKeys<V>(m: Map<number, V>): Map<string, V> {
  return new Map([...m.entries()].map(([k, v]) => [String(k), v]));
}
