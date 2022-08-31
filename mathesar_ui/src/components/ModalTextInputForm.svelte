<script lang="ts">
  import { tick } from 'svelte';
  import type { ModalController } from '@mathesar-component-library';
  import {
    CancelOrProceedButtonPair,
    ControlledModal,
    TextInput,
  } from '@mathesar-component-library';
  import { toast } from '@mathesar/stores/toast';
  import type { ButtonDetails } from '@mathesar-component-library/types';

  export let controller: ModalController;
  export let getValidationErrors: (value: string) => string[];
  export let getInitialValue: () => string = () => '';
  export let save: (value: string) => Promise<void>;
  export let label: string;
  export let proceedButton: Partial<ButtonDetails> = { label: 'Save' };

  let isSubmitting = false;
  let inputElement: HTMLInputElement;
  let initialValue = '';
  let value = '';
  let proceed: () => Promise<void>;
  let valueHasChanged = false;

  async function init() {
    initialValue = getInitialValue();
    value = initialValue;
    valueHasChanged = false;
    if (!inputElement) {
      return;
    }
    await tick();
    inputElement.focus();
    inputElement.setSelectionRange(0, inputElement.value.length);
  }

  async function handleSave() {
    try {
      isSubmitting = true;
      await save(value);
      controller.close();
    } catch (error) {
      toast.fromError(error);
    } finally {
      isSubmitting = false;
    }
  }

  async function handleInputKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      await proceed?.();
    }
  }

  $: validationErrors = getValidationErrors(value);
  $: canProceed = !validationErrors.length;
</script>

<ControlledModal
  {controller}
  allowClose={!isSubmitting}
  on:open={init}
  closeOn={['button', 'esc', 'overlay']}
>
  <slot slot="title" name="title" {initialValue} />
  <TextInput
    bind:value
    bind:element={inputElement}
    aria-label={label}
    on:keydown={handleInputKeydown}
    on:input={() => {
      valueHasChanged = true;
    }}
    disabled={isSubmitting}
  />
  {#if valueHasChanged && validationErrors.length}
    <p class="error">
      {validationErrors.join(' ')}
    </p>
  {/if}
  <CancelOrProceedButtonPair
    bind:proceed
    slot="footer"
    {proceedButton}
    onCancel={() => {
      controller.close();
    }}
    onProceed={handleSave}
    {canProceed}
  />
</ControlledModal>

<style>
  .error {
    color: var(--color-error);
  }
</style>
