type SlotToken = { type: 'slot'; name: string; arg?: string };
type TextToken = { type: 'text'; content: string };
export type Token = SlotToken | TextToken;

export function textToken(s: string): TextToken {
  return { type: 'text', content: s };
}

export function slotToken(name: string, arg?: string): SlotToken {
  return { type: 'slot', name, arg };
}

interface ParseState {
  tokens: Token[];
  remainder: string;
}

/**
 * Try to extract a slot token from the beginning of the provided text. Returns
 * undefined if no slot token is found.
 */
function parseSlot(text: string): ParseState | undefined {
  let token: Token | undefined;
  const remainder = text.replace(
    /^\[(\w+)\]\(([^)]+)\)|^\[(\w+)\]/,
    (
      _,
      nameOfSlotWithArg: string | undefined,
      argOfSlotWithArg: string | undefined,
      nameOfSlotWithoutArg: string | undefined,
    ) => {
      if (nameOfSlotWithArg) {
        token = slotToken(nameOfSlotWithArg, argOfSlotWithArg);
      } else if (nameOfSlotWithoutArg) {
        token = slotToken(nameOfSlotWithoutArg);
      }
      return '';
    },
  );

  return token ? { tokens: [token], remainder } : undefined;
}

/**
 * Move one character from the remainder text onto the last text token. Create a
 * last text token if one does not exist.
 */
function consumeChar({ tokens, remainder }: ParseState): ParseState {
  const char = remainder[0];
  const last = tokens[tokens.length - 1];
  const newTokens: Token[] =
    last && last.type === 'text'
      ? [...tokens.slice(0, -1), textToken(last.content + char)]
      : [...tokens, textToken(char)];
  return {
    tokens: newTokens,
    remainder: remainder.slice(1),
  };
}

/**
 * Recursively consume the remainder text into extracted tokens.
 */
function advance(state: ParseState): ParseState {
  if (state.remainder === '') {
    return state;
  }
  const slot = parseSlot(state.remainder);
  const newState = slot
    ? { tokens: [...state.tokens, ...slot.tokens], remainder: slot.remainder }
    : consumeChar(state);
  return advance(newState);
}

export function parse(text: string): Token[] {
  return advance({ tokens: [], remainder: text }).tokens;
}
