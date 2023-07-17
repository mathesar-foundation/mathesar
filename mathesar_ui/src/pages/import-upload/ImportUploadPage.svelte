<script lang="ts">
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import ColumnTypeInferenceInput from './column-type-inference/ColumnTypeInferenceInput.svelte';
  import DataSourceInput from './data-source/DataSourceInput.svelte';
  import { SpinnerButton } from '@mathesar-component-library';
  import { FieldLayout } from '@mathesar/components/form';

  export let database: Database;
  export let schema: SchemaEntry;

  let useColumnTypeInference = true;
</script>

<svelte:head><title>{makeSimplePageTitle('Import')}</title></svelte:head>

<LayoutWithHeader
  restrictWidth
  cssVariables={{
    '--page-padding': 'var(--inset-page-padding)',
    '--max-layout-width': 'var(--max-layout-width-data-pages)',
    '--layout-background-color': 'var(--sand-200)',
  }}
>
  <h1>Create a table by importing your data</h1>
  <div class="import-file-view">
    <FieldLayout>
      <DataSourceInput {database} {schema} />
    </FieldLayout>

    <FieldLayout>
      <ColumnTypeInferenceInput bind:value={useColumnTypeInference} />
    </FieldLayout>

    <FieldLayout>
      <div class="submit">
        <SpinnerButton label="Continue" disabled />
      </div>
    </FieldLayout>
  </div>
</LayoutWithHeader>

<style>
  .import-file-view {
    padding: var(--size-xx-large);
    border: 1px solid var(--slate-300);
    border-radius: var(--border-radius-m);
    background-color: var(--white);
    margin-bottom: 2rem;
  }

  .submit {
    text-align: right;
  }
</style>
