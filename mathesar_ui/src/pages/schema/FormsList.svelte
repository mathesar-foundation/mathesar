<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconForm } from '@mathesar/icons';
  import type { DataForm } from '@mathesar/models/DataForm';
  import type { ImmutableMap } from '@mathesar-component-library';

  import EmptyEntityList from './EmptyEntityList.svelte';
  import FormItem from './FormItem.svelte';

  export let dataForms: ImmutableMap<DataForm['id'], DataForm>;
</script>

<div class="forms-list">
  {#each [...dataForms.values()] as dataForm (dataForm.id)}
    <FormItem {dataForm} />
  {:else}
    <EmptyEntityList icon={iconForm} text={$_('no_forms')} />
  {/each}
</div>
