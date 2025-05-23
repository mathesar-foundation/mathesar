<!--
  @component

  Enables inline editing with support for "Save" & "Cancel" actions.
-->
<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import {
    CancelOrProceedButtonPair,
    TextArea,
    TextInput,
  } from '@mathesar-component-library';

  export let initialValue = '';
  export let onSubmit: (value: string) => Promise<void>;
  export let getValidationErrors: (value: string) => string[] = () => [];
  export let isLongText = false;
  export let disabled = false;

  let isEditable = false;
  let value = '';
  let isSubmitting = false;

  $: validationErrors =
    value === initialValue ? [] : getValidationErrors(value);
  $: canSave = validationErrors.length === 0 && value !== initialValue;
  $: inputElement = isLongText ? TextArea : TextInput;

  function makeEditable() {
    value = initialValue;
    isEditable = true;
  }

  function handleCancel() {
    value = '';
    isEditable = false;
  }

  async function handleSave() {
    isSubmitting = true;
    try {
      await onSubmit(value);
      value = '';
      isEditable = false;
    } catch (e: unknown) {
      toast.error(getErrorMessage(e));
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="editable-text">
  {#if !isEditable || disabled}
    <svelte:component
      this={inputElement}
      on:focus={makeEditable}
      value={initialValue}
      {disabled}
    />
  {:else}
    <div class="input-container">
      <svelte:component
        this={inputElement}
        disabled={isSubmitting}
        autofocus
        bind:value
      />
      {#if validationErrors.length}
        {#each validationErrors as error}
          <span class="error">{error}</span>
        {/each}
      {/if}
      <CancelOrProceedButtonPair
        onProceed={handleSave}
        onCancel={handleCancel}
        isProcessing={isSubmitting}
        canProceed={canSave}
        proceedButton={{ label: $_('save') }}
        size="small"
      />
    </div>
  {/if}
</div>

<style lang="scss">
  .editable-text {
    display: flex;
    flex-direction: column;
    cursor: pointer;
  }

  .input-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }

  .error {
    color: var(--color-error);
    font-size: var(--sm2);
  }
</style>
