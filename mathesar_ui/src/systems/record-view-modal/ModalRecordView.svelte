<script lang="ts">
  import type RecordStore from '@mathesar/systems/record-view/RecordStore';
  import RecordViewGatekeeper from '@mathesar/systems/record-view/RecordViewGatekeeper.svelte';
  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';

  import ModalRecordViewContent from './ModalRecordViewContent.svelte';
  import WithModalRecordView from './WithModalRecordView.svelte';

  export let controller: ModalController<RecordStore>;
</script>

<ControlledModal {controller} let:options={record} size="large">
  <RecordViewGatekeeper {record}>
    <WithModalRecordView>
      <ModalRecordViewContent {record} />
    </WithModalRecordView>
  </RecordViewGatekeeper>
</ControlledModal>
