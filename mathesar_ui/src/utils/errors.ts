import { hasStringProperty } from '@mathesar-component-library';

export function getErrorMessage(data: unknown): string {
  if (typeof data === 'string') {
    return data;
  }
  if (hasStringProperty(data, 'message')) {
    return data.message;
  }
  if (typeof data === 'object') {
    return JSON.stringify(data);
  }
  return String(data);
}
