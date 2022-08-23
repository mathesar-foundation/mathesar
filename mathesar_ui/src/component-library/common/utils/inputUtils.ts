/**
 * This is actually only a partial list. See
 * https://www.w3.org/TR/input-events-1/#interface-InputEvent-Attributes
 */
type InputType =
  | 'insertText'
  | 'insertFromPaste'
  | 'insertFromDrop'
  | 'deleteContentBackward'
  | 'deleteContentForward'
  | 'deleteByCut'
  | 'deleteByDrag'
  | 'deleteWordBackward'
  | 'deleteWordForward';

export interface BeforeInputOutcome {
  value: string;
  cursorPosition: number;
}

/**
 * Use this function to compute the value an input element will have after the
 * user has modified text and the `beforeinput` event has been fired.
 *
 * Limitations:
 *
 * - Delete by word or line is not yet supported.
 *
 * @param event A `beforeinput` event, as sent from an HTMLInputElement
 */
export function getOutcomeOfBeforeInputEvent(
  event: InputEvent,
): BeforeInputOutcome {
  const element = event.target as HTMLInputElement;
  const inputType = event.inputType as InputType;
  const fullText = element.value;
  const selectionStart = element.selectionStart ?? 0;
  const selectionEnd = element.selectionEnd ?? fullText.length;
  const selectionIsCollapsed = selectionStart === selectionEnd;
  let textBeforeSelection = fullText.substring(0, selectionStart);
  let textAfterSelection = fullText.substring(selectionEnd, fullText.length);

  const operation = (() => {
    switch (inputType) {
      case 'insertText':
      case 'insertFromPaste':
      case 'insertFromDrop':
        return 'insert';
      default:
        return 'delete';
    }
  })();

  const direction = (() => {
    switch (inputType) {
      case 'deleteContentBackward':
      case 'deleteWordBackward':
        return 'backward';
      case 'deleteContentForward':
      case 'deleteWordForward':
        return 'forward';
      default:
        return undefined;
    }
  })();

  if (operation === 'delete' && selectionIsCollapsed) {
    if (direction === 'backward') {
      textBeforeSelection = textBeforeSelection.slice(0, -1);
    } else if (direction === 'forward') {
      textAfterSelection = textAfterSelection.slice(
        1,
        textAfterSelection.length,
      );
    }
  }

  const insertionText = (operation === 'insert' && event.data) || '';
  return {
    value: `${textBeforeSelection}${insertionText}${textAfterSelection}`,
    cursorPosition: textBeforeSelection.length + insertionText.length,
  };
}

/**
 * Intended to be used with DOM `input` and `change` events dispatched from
 * input elements.
 */
export function getValueFromEvent(e: InputEvent): unknown {
  if (!e.target) {
    return undefined;
  }
  const target = e.target as { value?: unknown };
  return target.value;
}

export function getValueFromArtificialEvent(
  event: CustomEvent<unknown>,
): unknown {
  return event.detail;
}
