import { getContext, setContext } from 'svelte';
import { writable } from 'svelte/store';

import { getGloballyUniqueId } from '../common/utils/domUtils';

export class LabelController {
  disabled = writable(false);

  inputId = writable<string>(getGloballyUniqueId());
}

const key = {};

export function setLabelControllerInContext(c: LabelController): void {
  setContext(key, c);
}

export function getLabelControllerFromContainingLabel():
  | LabelController
  | undefined {
  return getContext<LabelController>(key);
}
