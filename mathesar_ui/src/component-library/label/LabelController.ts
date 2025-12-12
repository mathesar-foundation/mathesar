import { getContext, setContext } from 'svelte';
import { type Writable, writable } from 'svelte/store';

import { getGloballyUniqueId } from '../common/utils/domUtils';

export class LabelController {
  disabled = writable(false);

  inputId: Writable<string>;

  constructor(inputId?: string) {
    this.inputId = writable(inputId ?? getGloballyUniqueId());
  }
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
