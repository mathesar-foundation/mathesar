<script lang="ts">
  import type RecordStore from '@mathesar/stores/RecordStore';
  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';

  import ModalRecordViewContent from './ModalRecordViewContent.svelte';
  import RecordViewGatekeeper from './RecordViewGatekeeper.svelte';

  export let controller: ModalController<RecordStore>;
</script>

<ControlledModal {controller} let:options={record} size="large">
  <RecordViewGatekeeper {record}>
    <ModalRecordViewContent {record} />
  </RecordViewGatekeeper>
</ControlledModal>
