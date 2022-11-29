<!-- 
  @component

  Enables inline editing with support for "Save" & "Cancel" actions.
 -->
<script lang="ts">
  import {
    CancelOrProceedButtonPair,
    TextInput,
  } from '@mathesar-component-library';
  import type { ComponentAndProps } from '@mathesar/component-library/types';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';

  export let initialValue: any = '';
  export let onSubmit: (value: string) => Promise<void>;
  export let getValidationErrors: (value: string) => string[] = () => [];
  export let inputComponentAndProps: ComponentAndProps = {
    component: TextInput,
  };

  let isEditable = false;
  let value = '';
  let isSubmitting = false;

  $: validationErrors =
    value === initialValue ? [] : getValidationErrors(value);
  $: canSave = validationErrors.length === 0 && value !== initialValue;

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
  {#if !isEditable}
    <TextInput on:focus={makeEditable} value={initialValue} />
  {:else}
    <div class="input-container">
      <svelte:component
        this={inputComponentAndProps.component}
        {...inputComponentAndProps.props || {}}
        autofocus
        bind:value
        disabled={isSubmitting}
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
        proceedButton={{ label: 'Save' }}
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
    font-size: var(--text-size-x-small);
  }
</style>
