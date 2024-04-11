type Ignore = () => void;
type Listen<Message> = (message: Message) => void;

/**
 * This is a simple message bus that allows sending messages with arbitrary
 * payloads to listeners in a pub/sub fashion. It is useful for components that
 * need to communicate with each other to perform actions imperatively.
 *
 * The `listen` method is similar to a Svelte store's `subscribe` method, and
 * the `send` method is similar to a Svelte store's `set` method. We don't use
 * Svelte stores for this implementation though because we want messages to be
 * ephemeral. When a new listener is added, it should not receive messages that
 * were sent before it was added. This is not possible with Svelte stores
 * because the [store contract][1] stipulates:
 *
 * > This subscription function must be immediately and synchronously called
 * > with the store's current value upon calling `.subscribe`.
 *
 * [1]:
 * https://svelte.dev/docs#component-format-script-4-prefix-stores-with-$-to-access-their-values-store-contract
 */
export default class MessageBus<Message = void> {
  private listeners: Set<Listen<Message>>;

  constructor() {
    this.listeners = new Set();
  }

  listen(listener: Listen<Message>): Ignore {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  send(message: Message) {
    this.listeners.forEach((l) => l(message));
  }
}
