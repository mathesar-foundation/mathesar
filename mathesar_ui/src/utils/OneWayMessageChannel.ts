type ListenerCancellation = () => void;
type Listener<T> = (v: T) => void;

export type MessageSender<T = void> = (v: T) => void;
export type MessageReceiver<T = void> = (
  m: Listener<T>,
) => ListenerCancellation;

export function oneWayMessageChannel<T = void>(): [
  MessageSender<T>,
  MessageReceiver<T>,
] {
  const listeners = new Set<Listener<T>>();

  function send(v: T) {
    for (const listener of listeners) {
      listener(v);
    }
  }

  function receive(listener: Listener<T>): ListenerCancellation {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return [send, receive];
}
