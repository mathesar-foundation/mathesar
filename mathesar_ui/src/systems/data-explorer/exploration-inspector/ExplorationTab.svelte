<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import type { QueryInstance } from '@mathesar/api/rest/types/queries';
  import Form from '@mathesar/components/Form.svelte';
  import FormField from '@mathesar/components/FormField.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { deleteQuery, putQuery, queries } from '@mathesar/stores/queries';
  import { toast } from '@mathesar/stores/toast';
  import { getAvailableName } from '@mathesar/utils/db';
  import {
    Button,
    CancelOrProceedButtonPair,
    Collapsible,
    Icon,
    LabeledInput,
    TextArea,
    TextInput,
  } from '@mathesar-component-library';

  import QueryManager from '../QueryManager';
  import type QueryRunner from '../QueryRunner';

  const dispatch = createEventDispatcher();

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
      const updatedQuery = $query
        .withName(name)
        .model.withDescription(description).model;
      // TODO: Write better utility methods to identify saved instances
      await putQuery(updatedQuery.toJson() as QueryInstance);
      query.set(updatedQuery);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : $_('unable_to_save_exploration');
      toast.error(message);
    }
  }

  function handleDeleteExploration() {
    if ($query.id !== undefined) {
      const queryId = $query.id;
      void confirmDelete({
        identifierType: 'Exploration',
        onProceed: async () => {
          await deleteQuery(queryId);
          dispatch('delete');
        },
      });
    }
  }
</script>

<Collapsible isOpen triggerAppearance="plain">
  <span slot="header">{$_('properties')}</span>
  <div slot="content" class="section-content">
    <Form>
      <FormField>
        <LabeledInput label={$_('name')} layout="stacked">
          <TextInput
            value={name}
            aria-label={$_('name')}
            on:change={handleNameChange}
            on:input={setHasChangesToTrue}
          />
        </LabeledInput>
      </FormField>
      <FormField>
        <LabeledInput label={$_('description')} layout="stacked">
          <TextArea
            value={description}
            aria-label={$_('description')}
            on:change={handleDescriptionChange}
            on:input={setHasChangesToTrue}
          />
        </LabeledInput>
      </FormField>

      {#if !hasManager && hasChanges}
        <FormField>
          <CancelOrProceedButtonPair
            cancelButton={{ icon: undefined }}
            proceedButton={{ icon: undefined, label: $_('save') }}
            onCancel={handleCancel}
            onProceed={handleSave}
          />
        </FormField>
      {/if}
    </Form>
  </div>
</Collapsible>

<Collapsible isOpen triggerAppearance="plain">
  <span slot="header">{$_('actions')}</span>
  <div slot="content" class="section-content actions">
    <Button
      class="delete-button"
      appearance="outline-primary"
      on:click={handleDeleteExploration}
    >
      <Icon {...iconDeleteMajor} />
      <span>{$_('delete_exploration')}</span>
    </Button>
  </div>
</Collapsible>
