<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { RadioGroup } from '@mathesar/component-library';
  import type { Database } from '@mathesar/models/Database';
  import type { ProcessedColumns } from '@mathesar/stores/table-data';

  import CustomTemplate from './CustomTemplate.svelte';
  import { TemplateConfig } from './TemplateConfig';

  export let database: Pick<Database, 'id'>;
  export let templateConfig: TemplateConfig | undefined;
  export let columns: ProcessedColumns;
</script>

<RadioGroup
  label="Customization"
  options={[false, true]}
  getRadioLabel={(v) => (v ? 'Customize Fields' : 'Use Default')}
  isInline
  value={templateConfig !== null}
  boxed
  on:change={({ detail: { value: checked } }) => {
    templateConfig = checked ? TemplateConfig.newCustom(columns) : undefined;
  }}
/>

{#if templateConfig}
  <div class="custom-template">
    <CustomTemplate bind:templateConfig {columns} {database} />
  </div>
{/if}

<style>
  .custom-template {
    margin-top: 1rem;
  }
</style>
