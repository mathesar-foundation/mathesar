<script lang="ts">
  import {
    Collapsible,
    LabeledInput,
    TextInput,
    TextArea,
    CancelOrProceedButtonPair,
  } from '@mathesar-component-library';
  import type { QueryInstance } from '@mathesar/api/queries';
  import { queries, putQuery } from '@mathesar/stores/queries';
  import { getAvailableName } from '@mathesar/utils/db';
  import Form from '@mathesar/components/Form.svelte';
  import FormField from '@mathesar/components/FormField.svelte';
  import { toast } from '@mathesar/stores/toast';
  import type QueryRunner from '../QueryRunner';
  import QueryManager from '../QueryManager';

  export let queryHandler: QueryRunner | QueryManager;
  export let name: string | undefined;
  export let description: string | undefined;

  $: ({ query } = queryHandler);
  $: hasManager = queryHandler instanceof QueryManager;

  let hasChanges = false;

  function setHasChangesToTrue() {
    hasChanges = true;
  }

  function handleNameChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.value.trim() === '') {
      target.value =
        $query.name ??
        getAvailableName(
          'New_Exploration',
          new Set([...$queries.data.values()].map((q) => q.name)),
        );
    }
    name = target.value;
    if ('update' in queryHandler) {
      void queryHandler.update((q) => q.withName(target.value));
    }
  }

  function handleDescriptionChange(e: Event) {
    const target = e.target as HTMLInputElement;
    description = target.value.trim();
    if ('update' in queryHandler) {
      void queryHandler.update((q) => q.withDescription(description ?? ''));
    }
  }

  function handleCancel() {
    name = $query.name;
    description = $query.description;
    hasChanges = false;
  }

  async function handleSave() {
    try {
      // TODO: Add description once backend accepts description
      const updatedQuery = $query.withName(name).model;
      // TODO: Write better utility methods to identify saved instances
      await putQuery(updatedQuery.toJSON() as QueryInstance);
      query.set(updatedQuery);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to save Exploration.';
      toast.error(message);
    }
  }
</script>

<Collapsible isOpen triggerAppearance="plain">
  <span slot="header">Properties</span>
  <div slot="content" class="content">
    <Form>
      <FormField>
        <LabeledInput label="Name" layout="stacked">
          <TextInput
            value={name}
            aria-label="name"
            on:change={handleNameChange}
            on:input={setHasChangesToTrue}
          />
        </LabeledInput>
      </FormField>
      <FormField>
        <LabeledInput label="Description" layout="stacked">
          <TextArea
            value={description}
            aria-label="description"
            on:change={handleDescriptionChange}
            on:input={setHasChangesToTrue}
          />
        </LabeledInput>
      </FormField>

      {#if !hasManager && hasChanges}
        <FormField>
          <CancelOrProceedButtonPair
            cancelButton={{ icon: undefined }}
            proceedButton={{ icon: undefined, label: 'Save' }}
            onCancel={handleCancel}
            onProceed={handleSave}
          />
        </FormField>
      {/if}
    </Form>
  </div>
</Collapsible>

<Collapsible isOpen triggerAppearance="plain">
  <span slot="header">Actions</span>
  <div slot="content" class="content" />
</Collapsible>

<style lang="scss">
  .content {
    padding: var(--size-large);

    :global(.form) {
      --form-field-spacing: var(--size-large);

      :global(label .label) {
        font-weight: 590;
      }
    }
  }
</style>
