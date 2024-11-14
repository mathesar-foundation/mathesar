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
  export let errorsDisplayed: string[] = [];
</script>

<RadioGroup
  label={$_('customization')}
  options={[false, true]}
  getRadioLabel={(v) => (v ? $_('customize_fields') : $_('use_default'))}
  isInline
  value={templateConfig !== undefined}
  boxed
  on:change={({ detail: { value: checked } }) => {
    templateConfig = checked ? TemplateConfig.newCustom(columns) : undefined;
  }}
/>

{#if templateConfig}
  <div class="custom-template">
    <CustomTemplate
      bind:templateConfig
      {columns}
      {database}
      {errorsDisplayed}
    />
  </div>
{/if}

<style>
  .custom-template {
    margin-top: 1rem;
  }
</style>
