<script lang="ts">
  import type RecordStore from '@mathesar/stores/RecordStore';
  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';

  import RecordViewContent from './RecordViewContent.svelte';
  import RecordViewGatekeeper from './RecordViewGatekeeper.svelte';

  export let controller: ModalController<RecordStore>;
</script>

<ControlledModal {controller} let:options={record}>
  <span slot="title"> FOO </span>
  <RecordViewGatekeeper {record}>
    <RecordViewContent {record} />
  </RecordViewGatekeeper>
</ControlledModal>
