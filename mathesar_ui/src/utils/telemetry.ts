export function logEvent(
  eventName: string,
  metadata: Record<string, string | number | boolean | Date>,
): void {
  window.dispatchEvent(
    new CustomEvent('event', {
      detail: {
        eventName,
        metadata,
      },
    }),
  );
}
