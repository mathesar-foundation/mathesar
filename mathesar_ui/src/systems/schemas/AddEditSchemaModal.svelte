<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Schema } from '@mathesar/api/rpc/schemas';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import NameAndDescInputModalForm from '@mathesar/components/NameAndDescInputModalForm.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import type { Database } from '@mathesar/models/databases';
  import {
    createSchema,
    schemas,
    updateSchema,
  } from '@mathesar/stores/schemas';
  import { toast } from '@mathesar/stores/toast';
  import type { ModalController } from '@mathesar-component-library';

  export let database: Database;
  export let controller: ModalController;
  export let schema: Schema | undefined = undefined;

  function nameIsDuplicate(name: string) {
    // Handling the condition when the new name is equal to the current name
    // But the user has made sone key down events
    if (schema && name.trim() === schema.name) {
      return false;
    }
    return Array.from($schemas?.data || []).some(
      ([, s]) => s.name.toLowerCase().trim() === name.trim(),
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
        await updateSchema(database.id, { ...schema, name, description });
      } else {
        await createSchema(database.id, name, description);
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
  getInitialName={() => schema?.name ?? ''}
  getInitialDescription={() => schema?.description ?? ''}
  saveButtonLabel={schema ? $_('save') : $_('create_new_schema')}
>
  <svelte:fragment slot="helpText">
    {#if !schema}
      <InfoBox>
        {$_('name_your_schema_help')}
      </InfoBox>
    {/if}
  </svelte:fragment>

  <span slot="title" let:initialName>
    {#if schema}
      <RichText text={$_('rename_schema')} let:slotName>
        {#if slotName === 'schemaName'}
          <Identifier>{initialName}</Identifier>
        {/if}
      </RichText>
    {:else}
      {$_('create_schema')}
    {/if}
  </span>
</NameAndDescInputModalForm>
