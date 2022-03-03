function hasLabelProperty(v: unknown): v is { label: unknown } {
  return typeof v === 'object' && v !== null && 'label' in v;
}

export function hasStringLabelProperty(v: unknown): v is { label: string } {
  return hasLabelProperty(v) && typeof v.label === 'string';
}
