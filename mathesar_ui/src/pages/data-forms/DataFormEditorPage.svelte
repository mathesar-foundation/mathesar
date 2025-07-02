<script lang="ts">
  import { _ } from 'svelte-i18n';

  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import type { DataForm } from '@mathesar/models/DataForm';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { DataFormMaker } from '@mathesar/systems/data-forms';

  export let dataForm: DataForm;
</script>

<svelte:head>
  <title>{makeSimplePageTitle($_('form_maker'))}</title>
</svelte:head>

<LayoutWithHeader fitViewport>
  <DataFormMaker schema={dataForm.schema} />
</LayoutWithHeader>
