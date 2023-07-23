<!-- TODO: Shouldn't this be inside the schema page instead? -->
<script lang="ts">
  import type { ModalController } from '@mathesar-component-library';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import {
    schemas,
    createSchema,
    updateSchema,
  } from '@mathesar/stores/schemas';
  import NameAndDescInputModalForm from '@mathesar/components/NameAndDescInputModalForm.svelte';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import { toast } from '@mathesar/stores/toast';
  import { LL } from '@mathesar/i18n/i18n-svelte';
  import RichText from '@mathesar/components/RichText.svelte';

  export let database: Database;
  export let controller: ModalController;
  export let schema: SchemaEntry | undefined = undefined;

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
      return [$LL.general.nameCannotBeEmpty()];
    }
    if (nameIsDuplicate(name)) {
      return [$LL.addEditSchemaModal.schemaWithNameExists()];
    }
    return [];
  }

  async function save(name: string, description: string) {
    try {
      if (schema) {
        await updateSchema(database.name, { ...schema, name, description });
      } else {
        await createSchema(database.name, name, description);
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
  saveButtonLabel={schema
    ? $LL.general.save()
    : $LL.addEditSchemaModal.createNewSchema()}
>
  <svelte:fragment slot="helpText">
    {#if !schema}
      <InfoBox>
        {$LL.addEditSchemaModal.schemaNameHelp()}
      </InfoBox>
    {/if}
  </svelte:fragment>

  <span slot="title" let:initialName>
    {#if schema}
      <RichText text={$LL.addEditSchemaModal.renameSchema()} let:slotName>
        {#if slotName === 'identifier'}
          <Identifier>{initialName}</Identifier>
        {/if}
      </RichText>
    {:else}
      {$LL.general.createSchema()}
    {/if}
  </span>
</NameAndDescInputModalForm>
