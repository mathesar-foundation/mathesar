<script lang="ts">
  import type RecordStore from '@mathesar/stores/RecordStore';
  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';

  import RecordView from './RecordView.svelte';

  export let controller: ModalController<RecordStore>;
</script>

<ControlledModal {controller} let:options={record}>
  <span slot="title"> FOO </span>
  <RecordView {record} />
</ControlledModal>
