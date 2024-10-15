<script lang="ts">
  import { get, readable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import Identifier from '@mathesar/components/Identifier.svelte';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import NameAndDescInputModalForm from '@mathesar/components/NameAndDescInputModalForm.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import { createSchema, schemas } from '@mathesar/stores/schemas';
  import { toast } from '@mathesar/stores/toast';
  import type { ModalController } from '@mathesar-component-library';

  export let database: Database;
  export let controller: ModalController;
  export let schema: Schema | undefined = undefined;

  $: isEditMode = schema !== undefined;
  $: schemaName = schema?.name ?? readable('');
  $: schemaDescription = schema?.description ?? readable('');
  $: currentRoleOwns = schema?.currentAccess?.currentRoleOwns;

  function nameIsDuplicate(name: string) {
    // Handling the condition when the new name is equal to the current name
    // But the user has made sone key down events
    if (schema && name.trim() === $schemaName) {
      return false;
    }
    return Array.from($schemas?.data || []).some(
      ([, s]) => get(s.name).toLowerCase().trim() === name?.trim(),
    );
  }

  function getNameValidationErrors(name: string) {
    if (!name.trim()) {
      return [$_('schema_name_cannot_be_empty')];
    }
    if (nameIsDuplicate(name)) {
      return [$_('schema_name_already_exists')];
    }
    return [];
  }

  async function save(name: string, description: string) {
    try {
      if (schema) {
        await schema.updateNameAndDescription({ name, description });
      } else {
        await createSchema(database, { name, description });
      }
    } catch (err) {
      toast.fromError(err);
    }
  }
</script>

<NameAndDescInputModalForm
  {controller}
  {save}
  {getNameValidationErrors}
  getInitialName={() => $schemaName ?? ''}
  getInitialDescription={() => $schemaDescription ?? ''}
  saveButtonLabel={schema ? $_('save') : $_('create_new_schema')}
  namePlaceholder={$_('schema_name_placeholder')}
  disabled={isEditMode && !$currentRoleOwns}
>
  <svelte:fragment slot="helpText">
    {#if !schema}
      <span class="description">
        {$_('schema_description')}
      </span>
    {/if}
  </svelte:fragment>

  <span slot="title" let:initialName>
    {#if schema}
      <RichText text={$_('edit_schema_with_name')} let:slotName>
        {#if slotName === 'schemaName'}
          <Identifier>{initialName}</Identifier>
        {/if}
      </RichText>
    {:else}
      {$_('create_schema')}
    {/if}
  </span>
</NameAndDescInputModalForm>

<style>
  .description {
    display: inline-block;
    margin-bottom: 1rem;
  }
</style>
