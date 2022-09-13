<script lang="ts">
  import type { ModalController } from '@mathesar-component-library';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import {
    schemas,
    createSchema,
    updateSchema,
  } from '@mathesar/stores/schemas';
  import AddEditSchemaModalForm from '@mathesar/pages/database/AddEditSchemaModalForm.svelte';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import { toast } from '@mathesar/stores/toast';

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

  function getDescriptionValidationErrors(description: string) {
    // Making description non mandatory since that's how the API and DB works
    // if (!description.trim()) {
    //   return ['Description cannot be empty.'];
    // }
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

<AddEditSchemaModalForm
  {controller}
  {save}
  {getNameValidationErrors}
  {getDescriptionValidationErrors}
  getInitialName={() => schema?.name ?? ''}
  getInitialDescription={() => schema?.description ?? ''}
>
  <span slot="title" let:initialName>
    {#if schema}
      Rename <Identifier>{initialName}</Identifier> Schema
    {:else}
      Create Schema
    {/if}
  </span>
</AddEditSchemaModalForm>
