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

export function isDefinedNonNullable<T>(x: T): x is NonNullable<T> {
  return x !== null && x !== undefined;
}

export function optionalNonNullable<T>(
  prop: T,
  defaultValue?: NonNullable<T>,
): NonNullable<T> | undefined {
  if (isDefinedNonNullable(prop)) {
    return prop;
  }
  return defaultValue;
}

export function requiredNonNullable<T>(
  prop: T,
  defaultValue: NonNullable<T>,
): NonNullable<T> {
  if (isDefinedNonNullable(prop)) {
    return prop;
  }
  return defaultValue;
}
