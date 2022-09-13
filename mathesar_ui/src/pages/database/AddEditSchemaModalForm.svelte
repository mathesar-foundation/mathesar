<script lang="ts">
  import { tick } from 'svelte';
  import type { ModalController } from '@mathesar-component-library';
  import {
    CancelOrProceedButtonPair,
    ControlledModal,
    TextInput,
  } from '@mathesar-component-library';
  import { toast } from '@mathesar/stores/toast';
  import TextArea from '@mathesar/component-library/text-area/TextArea.svelte';

  export let controller: ModalController;
  export let getNameValidationErrors: (name: string) => string[];
  export let getDescriptionValidationErrors: (description: string) => string[];
  export let getInitialName: () => string = () => '';
  export let getInitialDescription: () => string = () => '';
  export let save: (name: string, description: string) => Promise<void>;

  let isSubmitting = false;
  let inputElement: HTMLInputElement;
  let initialName = '';
  let name = '';
  let description = '';
  let nameHasChanged = false;
  let descriptionHasChanged = false;

  async function init() {
    initialName = getInitialName();
    name = initialName;
    description = getInitialDescription();
    nameHasChanged = false;
    descriptionHasChanged = false;
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
      await save(name, description);
      controller.close();
    } catch (error) {
      toast.fromError(error);
    } finally {
      isSubmitting = false;
    }
  }

  $: nameValidationErrors = getNameValidationErrors(name);
  $: descriptionValidationErrors = getDescriptionValidationErrors(description);
  $: canProceed =
    !nameValidationErrors.length && !descriptionValidationErrors.length;
</script>

<ControlledModal
  {controller}
  allowClose={!isSubmitting}
  on:open={init}
  closeOn={['button', 'esc', 'overlay']}
>
  <slot slot="title" name="title" {initialName} />
  <div class="form-container">
    <div class="input-container">
      <TextInput
        bind:value={name}
        bind:element={inputElement}
        aria-label="name"
        on:input={() => {
          nameHasChanged = true;
        }}
        disabled={isSubmitting}
        placeholder="Name"
      />
      {#if nameHasChanged && nameValidationErrors.length}
        <p class="error">
          {nameValidationErrors.join(' ')}
        </p>
      {/if}
    </div>

    <div class="input-container">
      <TextArea
        bind:value={description}
        aria-label="description"
        disabled={isSubmitting}
        placeholder="Description"
        on:input={() => {
          descriptionHasChanged = true;
        }}
      />
      {#if descriptionHasChanged && descriptionValidationErrors.length}
        <p class="error">
          {descriptionValidationErrors.join(' ')}
        </p>
      {/if}
    </div>

    <CancelOrProceedButtonPair
      slot="footer"
      proceedButton={{ label: 'Save' }}
      onCancel={() => {
        controller.close();
      }}
      onProceed={handleSave}
      {canProceed}
    />
  </div>
</ControlledModal>

<style>
  .error {
    color: var(--color-error);
    font-size: 0.8rem;
  }

  .form-container {
    display: flex;
    flex-direction: column;
  }

  .form-container > .input-container {
    margin-bottom: 1rem;
  }

  .input-container {
    display: flex;
    flex-direction: column;
  }

  .input-container > .error {
    margin-top: 0.25rem;
  }
</style>
