<script lang="ts">
  import { modal } from '@mathesar/stores/modal';
  import type RecordStore from '@mathesar/systems/record-view/RecordStore';
  import ModalRecordView from '@mathesar/systems/record-view-modal/ModalRecordView.svelte';
  import { modalRecordViewContext } from '@mathesar/systems/record-view-modal/modalRecordViewContext';

  const modalRecordView = modal.spawnModalController<RecordStore>();

  modalRecordViewContext.set(modalRecordView);
</script>

<slot />

<ModalRecordView controller={modalRecordView} />
