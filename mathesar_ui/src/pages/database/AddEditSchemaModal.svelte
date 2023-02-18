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
  import { logEvent } from '@mathesar/utils/telemetry';

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
      return ['Name cannot be empty.'];
    }
    if (nameIsDuplicate(name)) {
      return ['A schema with that name already exists.'];
    }
    return [];
  }

  async function save(name: string, description: string) {
    try {
      if (schema) {
        await updateSchema(database.name, { ...schema, name, description });
      } else {
        logEvent('create_schema_clicked', {
          database_name: database.name,
          schema_name: name,
          page: 'schema',
        });
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
  saveButtonLabel={schema ? 'Save' : 'Create New Schema'}
>
  <svelte:fragment slot="helpText">
    {#if !schema}
      <InfoBox>
        Name your schema to reflect its purpose. For example, your personal
        financial schema may be called "Personal Finances" and your movie
        collection "Movies." Add a description to your schema to remember what
        it's for.
      </InfoBox>
    {/if}
  </svelte:fragment>

  <span slot="title" let:initialName>
    {#if schema}
      Rename <Identifier>{initialName}</Identifier> Schema
    {:else}
      Create Schema
    {/if}
  </span>
</NameAndDescInputModalForm>
