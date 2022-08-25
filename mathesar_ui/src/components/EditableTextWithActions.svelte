<!-- 
  EdtiableTextWithActions enables inline editing
  with support for "Save" & "Cancel" actions

  onChange: Expects a promise in return to support interactions with the API
 -->
<script lang="ts">
  import { TextInput } from '@mathesar-component-library';
  import Button from '@mathesar/component-library/button/Button.svelte';
  import Spinner from '@mathesar/component-library/spinner/Spinner.svelte';
  import type { UIError } from '@mathesar/utils/errors';

  export let initialValue = '';
  export let onChange: (value: string) => Promise<void>;

  let isEditable = false;
  let value = '';
  let isSubmitting = false;
  let errors: string[] = [];

  const makeEditbale = () => {
    value = initialValue;
    isEditable = true;
  };

  const handleValueChange = (e: Event) => {
    const { value: valueFromInout } = e.target as HTMLInputElement;
    value = valueFromInout;
  };

  const handleCancel = () => {
    value = '';
    errors = [];
    isEditable = false;
  };

  const handleSave = () => {
    isSubmitting = true;
    onChange(value)
      .then(() => {
        value = '';
        isEditable = false;
        isSubmitting = false;
        return true;
      })
      .catch((e: UIError) => {
        errors = e.errorMessages;
        isSubmitting = false;
      });
  };
</script>

<div class="editable-text">
  {#if !isEditable}
    <span role="button" on:click={makeEditbale}>{initialValue}</span>
  {:else}
    <div class="input-container">
      <TextInput
        disabled={isSubmitting}
        autofocus
        bind:value
        on:change={handleValueChange}
      />
      {#if errors.length}
        {#each errors as error}
          <span class="error">{error}</span>
        {/each}
      {/if}
      <div class="input-actions">
        <Button
          disabled={isSubmitting}
          size="small"
          appearance="primary"
          on:click={handleSave}
        >
          {#if isSubmitting}
            <Spinner />
          {:else}
            Save
          {/if}
        </Button>
        <Button
          disabled={isSubmitting}
          size="small"
          appearance="secondary"
          on:click={handleCancel}
        >
          Cancel
        </Button>
      </div>
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
    gap: 0.25rem;
  }

  .input-actions {
    display: flex;
    flex-direction: row;
    justify-content: end;
    gap: 0.25rem;
  }
  .error {
    color: red;
    font-size: 0.75rem;
  }
</style>
