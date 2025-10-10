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
  const diff = Diff(oldText, newText, oldCursorPosition);
  let parsingPosition = 0;
  let newCursorPosition = 0;
  for (const [action, text] of diff) {
    switch (action) {
      case Diff.DELETE:
        parsingPosition += text.length;
        break;
      case Diff.INSERT:
        newCursorPosition += text.length;
        break;
      case Diff.EQUAL:
        newCursorPosition += Math.min(
          oldCursorPosition - parsingPosition,
          text.length,
        );
        parsingPosition += text.length;
        break;
      default:
        break;
    }
    if (parsingPosition >= oldCursorPosition) break;
  }
  return newCursorPosition;
}
