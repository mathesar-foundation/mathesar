let maxId = 0;

export function getGloballyUniqueId(): string {
  maxId += 1;
  return `_global-id-${maxId}`;
}
