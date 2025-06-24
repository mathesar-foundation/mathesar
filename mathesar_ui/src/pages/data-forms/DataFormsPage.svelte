<script lang="ts">
  import { _ } from 'svelte-i18n';

  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import type { Schema } from '@mathesar/models/Schema';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { DataFormMaker } from '@mathesar/systems/data-forms';

  export let schema: Schema;
</script>

<svelte:head>
  <title>{makeSimplePageTitle($_('form_maker'))}</title>
</svelte:head>

<LayoutWithHeader fitViewport>
  <DataFormMaker {schema}/>
</LayoutWithHeader>
