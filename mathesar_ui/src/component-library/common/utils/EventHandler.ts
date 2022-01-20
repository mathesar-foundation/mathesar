export default class EventHandler {
  protected listeners: Map<string, Set<(value?: unknown) => Promise<unknown>>>;

  constructor() {
    this.listeners = new Map();
  }

  /**
   * We do not have to explicity un-listen to these events as long as all
   * listeners are cleared with the `destroy` function.
   */
  on(
    eventName: string,
    callback: (value?: unknown) => Promise<unknown>,
  ): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)?.add(callback);
    return () => {
      this.listeners?.get(eventName)?.delete(callback);
    };
  }

  protected async dispatch(eventName: string, value: unknown): Promise<void> {
    const callbacks = this.listeners.get(eventName);
    if (!callbacks) {
      throw new Error(`Unable to dispatch unknown event '${eventName}'.`);
    }
    await Promise.all(
      [...callbacks.values()].map((callback) => callback(value)),
    );
  }

  protected destroy(): void {
    this.listeners.clear();
  }
}
