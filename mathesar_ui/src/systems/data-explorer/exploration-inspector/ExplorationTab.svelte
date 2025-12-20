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
    Debounce,
    Icon,
    LabeledInput,
    TextArea,
    TextInput,
    getValueFromEvent,
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

  function updateName(value: unknown) {
    let newValue = String(value ?? '');

    if (newValue.trim() === '') {
      newValue =
        $query.name ??
        getAvailableName(
          'New_Exploration',
          new Set([...$queries.data.values()].map((q) => q.name)),
        );
    }

    name = newValue;

    if ('update' in queryHandler) {
      void queryHandler.update((q) => q.withName(newValue));
    }
  }

  function updateDescription(value: unknown) {
    const newValue = String(value ?? '').trim();
    description = newValue;

    if ('update' in queryHandler) {
      void queryHandler.update((q) => q.withDescription(newValue ?? ''));
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
    const { id } = $query;
    if (id !== undefined) {
      void confirmDelete({
        identifierType: $_('exploration'),
        onProceed: async () => {
          await deleteExploration(id);
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
        <Debounce
          let:handleNewValue
          on:artificialChange={(e) => updateName(e.detail)}
        >
          <TextInput
            value={name}
            aria-label={$_('name')}
            on:input={(e) => {
              setHasChangesToTrue();
              handleNewValue({
                value: getValueFromEvent(e),
                debounce: true,
              });
            }}
            on:change={(e) =>
              handleNewValue({
                value: getValueFromEvent(e),
                debounce: false,
              })}
          />
        </Debounce>
      </LabeledInput>
    </FormField>
    <FormField>
      <LabeledInput label={$_('description')} layout="stacked">
        <Debounce
          let:handleNewValue
          on:artificialChange={(e) => updateDescription(e.detail)}
        >
          <TextArea
            value={description}
            aria-label={$_('description')}
            on:input={(e) => {
              setHasChangesToTrue();
              handleNewValue({
                value: getValueFromEvent(e),
                debounce: true,
              });
            }}
            on:change={(e) =>
              handleNewValue({
                value: getValueFromEvent(e),
                debounce: false,
              })}
          />
        </Debounce>
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
  <Button appearance="danger" on:click={handleDeleteExploration}>
    <Icon {...iconDeleteMajor} />
    <span>{$_('delete_exploration')}</span>
  </Button>
</InspectorSection>
