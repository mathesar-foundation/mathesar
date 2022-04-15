export function hasProperty<PropertyName extends string>(
  object: unknown,
  property: PropertyName,
): object is { [k in PropertyName]: unknown } {
  return typeof object === 'object' && object !== null && property in object;
}

export function hasStringProperty<PropertyName extends string>(
  object: unknown,
  property: PropertyName,
): object is { [k in PropertyName]: string } {
  return hasProperty(object, property) && typeof object[property] === 'string';
}
