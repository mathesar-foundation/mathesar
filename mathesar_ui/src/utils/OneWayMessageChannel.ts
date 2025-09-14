export type MessageSender<T = void> = (v: T) => void;
export type MessageReceiver<T = void> = (m: (v: T) => void) => void;

export function oneWayMessageChannel<T = void>(): [
  MessageSender<T>,
  MessageReceiver<T>,
] {
  throw new Error('Not implemented');
}
