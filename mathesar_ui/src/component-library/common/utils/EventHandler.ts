export default class EventHandler {
  private listeners: Map<string, Set<(value?: unknown) => unknown>>;

  constructor() {
    this.listeners = new Map();
  }

  on(eventName: string, callback: (value?: unknown) => unknown): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)?.add(callback);
    return () => {
      this.listeners?.get(eventName)?.delete(callback);
    };
  }

  dispatch(eventName: string, value: unknown): void {
    this.listeners?.get(eventName)?.forEach((entry) => {
      try {
        entry?.(value);
      } catch (err) {
        console.error(`Failed to call a listener for ${eventName}`, err);
      }
    });
  }

  destroy(): void {
    this.listeners.clear();
  }
}
