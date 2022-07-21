import { setContext, hasContext, getContext, onDestroy } from 'svelte';
import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export type ValidationFunction = () => boolean;
export type ValidationResultStore = Writable<boolean>;

const VALIDATION_CONTEXT_KEY = 'validationContext';

class ContextBasedValidator {
  validationResult: Writable<boolean> = writable(true);

  validationFunctionMap: Map<string, ValidationFunction> = new Map();

  validate(): boolean {
    let isValid = true;
    for (const validationFn of this.validationFunctionMap.values()) {
      isValid = isValid && validationFn();
    }
    this.validationResult.set(isValid);
    return isValid;
  }

  addValidator(key: string, fn: ValidationFunction) {
    this.validationFunctionMap.set(key, fn);

    onDestroy(() => {
      this.validationFunctionMap.delete(key);
      this.validate();
    });
  }
}

export function createValidationContext(): ContextBasedValidator {
  const contextBasedValidator = new ContextBasedValidator();
  setContext(VALIDATION_CONTEXT_KEY, contextBasedValidator);
  return contextBasedValidator;
}

export function getValidationContext(): ContextBasedValidator {
  if (!hasContext(VALIDATION_CONTEXT_KEY)) {
    throw Error('Validation context not present');
  }
  return getContext<ContextBasedValidator>(VALIDATION_CONTEXT_KEY);
}
