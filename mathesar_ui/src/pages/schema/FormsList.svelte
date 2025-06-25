<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconForm } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';

  import EmptyEntityList from './EmptyEntityList.svelte';
  import FormItem from './FormItem.svelte';

  type Form = { id: number; name: string; description?: string | null };

  export let database: Database;
  export let schema: Schema;

  // const forms: Form[] = [];

  const forms: Form[] = [
    { id: 1, name: 'My First Form' },
    { id: 2, name: 'And Another One', description: 'Cool!' },
  ];
</script>

<div class="forms-list">
  {#each forms as form (form.id)}
    <FormItem {form} {database} {schema} />
  {:else}
    <EmptyEntityList icon={iconForm} text={$_('no_forms')} />
  {/each}
</div>
