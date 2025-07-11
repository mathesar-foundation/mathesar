<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import type { SavedExploration } from '@mathesar/api/rpc/explorations';
  import Form from '@mathesar/components/Form.svelte';
  import FormField from '@mathesar/components/FormField.svelte';
  import InspectorSection from '@mathesar/components/InspectorSection.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import {
    deleteExploration,
    queries,
    replaceExploration,
  } from '@mathesar/stores/queries';
  import { toast } from '@mathesar/stores/toast';
  import { getAvailableName } from '@mathesar/utils/db';
  import {
    Button,
    CancelOrProceedButtonPair,
    Icon,
    LabeledInput,
    TextArea,
    TextInput,
  } from '@mathesar-component-library';

  import QueryManager from '../QueryManager';
  import type { QueryRunner } from '../QueryRunner';

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
      await replaceExploration(
        updatedQuery.toMaybeSavedExploration() as SavedExploration,
      );
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
        identifierType: $_('exploration'),
        onProceed: async () => {
          await deleteExploration(queryId);
          dispatch('delete');
        },
      });
    }
  }
</script>

<InspectorSection title={$_('properties')}>
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
</InspectorSection>

<InspectorSection title={$_('actions')}>
  <Button appearance="outline-primary" on:click={handleDeleteExploration}>
    <Icon {...iconDeleteMajor} />
    <span>{$_('delete_exploration')}</span>
  </Button>
</InspectorSection>
