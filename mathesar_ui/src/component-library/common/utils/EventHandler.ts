type Callback<Arg> = (value: Arg) => Promise<void>;
type CallbackSet<Arg = unknown> = Set<Callback<Arg>>;

export default class EventHandler<Events extends Record<string, unknown>> {
  protected listeners: Map<keyof Events, CallbackSet>;

  constructor() {
    this.listeners = new Map();
  }

  private getCallbackSet<EventName extends keyof Events>(
    eventName: EventName,
  ): CallbackSet<Events[EventName]> {
    const existingSet = this.listeners.get(eventName);
    if (existingSet) {
      return existingSet;
    }
    const newSet: CallbackSet = new Set();
    this.listeners.set(eventName, newSet);
    return newSet;
  }

  /**
   * We do not have to explicity un-listen to these events as long as all
   * listeners are cleared with the `destroy` function.
   */
  on<EventName extends keyof Events>(
    eventName: EventName,
    callback: Callback<Events[EventName]>,
  ): () => void {
    const callbacks = this.getCallbackSet(eventName);
    callbacks.add(callback);
    return () => {
      callbacks.delete(callback);
    };
  }

  protected async dispatch<EventName extends keyof Events>(
    eventName: EventName,
    value?: Events[EventName],
  ): Promise<void> {
    const callbacks = this.listeners.get(eventName);
    if (!callbacks) {
      // eslint-disable-next-line no-console
      console.warn(
        `No listeners found when dispatching event '${String(eventName)}'.`,
      );
      return;
    }
    await Promise.all(
      [...callbacks.values()].map((callback) => callback(value)),
    );
  }

  protected destroy(): void {
    this.listeners.clear();
  }
}
