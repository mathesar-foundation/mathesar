import Diff from 'fast-diff';

/**
 * When text is modified, and that text contains a user's cursor, determine
 * where to place the user's cursor within the new text after the modification.
 *
 * A cursor position of 0 denotes the furthest left position.
 *
 * TODO: handle additional cases commented out in unit tests.
 * https://github.com/centerofci/mathesar/issues/1284
 *
 * @returns `undefined` if the new cursor position cannot be determined.
 */
export function getCursorPositionAfterReformat({
  oldText,
  oldCursorPosition,
  newText,
}: {
  oldText: string;
  oldCursorPosition: number;
  newText: string;
}): number {
  const diff = Diff(oldText, newText);
  let newCursorPosition = 0;
  diff.forEach((part) => {
    const [action] = part;
    if (action === Diff.DELETE) {
      newCursorPosition -= 1;
    } else if (action === Diff.INSERT) {
      newCursorPosition += 1;
    }
  });
  if (newCursorPosition < 0) {
    newCursorPosition = 0;
  }
  return oldCursorPosition + newCursorPosition;
}
