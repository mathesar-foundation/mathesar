<script lang="ts">
  /**
   * This component is currently used for objects where name and description
   * need to be entered by the user. This is used in places such as:
   * - Adding/Editing schema
   * - Saving Exploration
   *
   * A more common modal-form component can be created by utilizing FormBuilder
   * if such a need arises in the future.
   */
  import { tick } from 'svelte';
  import {
    LabeledInput,
    type ModalController,
  } from '@mathesar-component-library';
  import {
    CancelOrProceedButtonPair,
    ControlledModal,
    TextInput,
  } from '@mathesar-component-library';
  import { toast } from '@mathesar/stores/toast';
  import TextArea from '@mathesar/component-library/text-area/TextArea.svelte';

  export let saveButtonLabel = 'Save';
  export let controller: ModalController;
  export let getNameValidationErrors: (name: string) => string[];
  export let getInitialName: () => string = () => '';
  export let getInitialDescription: () => string = () => '';
  export let save: (name: string, description: string) => Promise<void>;

  /**
   * NOTE: This is NOT a feature
   *
   * Ideally this component should not have this prop
   * since the name of the component itself suggests
   * that its used to edit both name and description
   *
   * But still adding this prop to support only editing
   * table name. Since editing table description is planned
   * but will come in future.
   */
  export let hideDescription = false;

  let isSubmitting = false;
  let inputElement: HTMLInputElement;
  let initialName = '';
  let name = '';
  let description = '';
  let nameHasChanged = false;

  async function init() {
    initialName = getInitialName();
    name = initialName;
    description = getInitialDescription();
    nameHasChanged = false;
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
  $: canProceed = !nameValidationErrors.length;
</script>

<ControlledModal
  {controller}
  allowClose={!isSubmitting}
  on:open={init}
  closeOn={['button', 'esc', 'overlay']}
>
  <slot slot="title" name="title" {initialName} />

  <div class="form-container">
    <slot name="helpText" />

    <div class="input-container">
      <LabeledInput label="Name" layout="stacked">
        <TextInput
          bind:value={name}
          bind:element={inputElement}
          aria-label="name"
          on:input={() => {
            nameHasChanged = true;
          }}
          disabled={isSubmitting}
          placeholder="Name"
          id="name"
        />
        {#if nameHasChanged && nameValidationErrors.length}
          <p class="error">
            {nameValidationErrors.join(' ')}
          </p>
        {/if}
      </LabeledInput>
    </div>

    {#if !hideDescription}
      <div class="input-container">
        <LabeledInput label="Description" layout="stacked">
          <TextArea
            bind:value={description}
            aria-label="description"
            disabled={isSubmitting}
            placeholder="Description"
          />
        </LabeledInput>
      </div>
    {/if}
  </div>
  <CancelOrProceedButtonPair
    proceedButton={{ label: saveButtonLabel }}
    onCancel={() => {
      controller.close();
    }}
    onProceed={handleSave}
    {canProceed}
    slot="footer"
  />
</ControlledModal>

<style lang="scss">
  .error {
    color: var(--color-error);
    font-size: 0.8rem;
  }

  .form-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 1rem;
    }
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
