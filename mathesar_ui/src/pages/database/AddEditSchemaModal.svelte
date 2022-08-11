<script lang="ts">
  import type { ModalController } from '@mathesar-component-library';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import {
    schemas,
    createSchema,
    updateSchema,
  } from '@mathesar/stores/schemas';
  import ModalTextInputForm from '@mathesar/components/ModalTextInputForm.svelte';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import { toast } from '@mathesar/stores/toast';

  export let database: Database;
  export let controller: ModalController;
  export let schema: SchemaEntry | undefined = undefined;

  function nameIsDuplicate(name: string) {
    return Array.from($schemas?.data || []).some(
      ([, s]) => s.name.toLowerCase().trim() === name.trim(),
    );
  }

  function getValidationErrors(name: string) {
    if (!name.trim()) {
      return ['Name cannot be empty.'];
    }
    if (nameIsDuplicate(name)) {
      return ['A schema with that name already exists.'];
    }
    return [];
  }

  async function save(name: string) {
    try {
      if (schema) {
        await updateSchema(database.name, { ...schema, name });
      } else {
        await createSchema(database.name, name);
      }
    } catch (err) {
      toast.fromError(err);
    }
  }
</script>

<ModalTextInputForm
  {controller}
  {save}
  {getValidationErrors}
  getInitialValue={() => schema?.name ?? ''}
  label="name"
>
  <span slot="title" let:initialValue>
    {#if schema}
      Rename <Identifier>{initialValue}</Identifier> Schema
    {:else}
      Create Schema
    {/if}
  </span>
</ModalTextInputForm>
