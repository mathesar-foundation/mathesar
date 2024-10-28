<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { RecordSummaryTemplate } from '@mathesar/api/rpc/tables';
  import { RadioGroup } from '@mathesar/component-library';
  import type { Database } from '@mathesar/models/Database';
  import type { ProcessedColumns } from '@mathesar/stores/table-data';

  import CustomTemplate from './CustomTemplate.svelte';
  import { makeNewCustomTemplate } from './utils';

  export let database: Pick<Database, 'id'>;
  export let template: RecordSummaryTemplate | null;
  export let columns: ProcessedColumns;
</script>

<RadioGroup
  label="Customization"
  options={[false, true]}
  getRadioLabel={(v) => (v ? 'Customize Fields' : 'Use Default')}
  isInline
  value={template !== null}
  boxed
  on:change={({ detail: { value: checked } }) => {
    template = checked ? makeNewCustomTemplate(columns) : null;
  }}
/>

{#if template}
  <div class="custom-template">
    <CustomTemplate bind:template {columns} {database} />
  </div>
{/if}

<style>
  .custom-template {
    margin-top: 1rem;
  }
</style>
