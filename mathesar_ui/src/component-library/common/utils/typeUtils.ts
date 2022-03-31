export function hasStringProperty(object: unknown, property: string): boolean {
  return (
    typeof object === 'object' &&
    object !== null &&
    property in object &&
    typeof (object as Record<string, unknown>)[property] === 'string'
  );
}
