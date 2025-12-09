export function createDebounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  duration = 300,
): {
  debounced: T;
  cancel: () => void;
} {
  let timeout: number | undefined;

  const cancel = () => {
    if (timeout !== undefined) {
      clearTimeout(timeout);
      timeout = undefined;
    }
  };

  const debounced = ((...args: Parameters<T>) => {
    cancel();
    timeout = window.setTimeout(() => {
      timeout = undefined;
      fn(...args);
    }, duration);
  }) as T;

  return { debounced, cancel };
}
