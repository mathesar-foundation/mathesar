<script lang="ts">
  import { ControlledModal } from '@mathesar-component-library';
  import RecordSelectorContent from './RecordSelectorContent.svelte';
  import type { RecordSelectorController } from './RecordSelectorController';
  import RecordSelectorTitle from './RecordSelectorTitle.svelte';

  export let controller: RecordSelectorController;

  $: ({ tableName } = controller);
</script>

<ControlledModal
  controller={controller.modal}
  closeOn={['button', 'esc', 'overlay']}
  size="flex"
  on:close={() => controller.cancel()}
>
  <RecordSelectorTitle slot="title" tableName={$tableName} />
  <RecordSelectorContent {controller} />
</ControlledModal>
