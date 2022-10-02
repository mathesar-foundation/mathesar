<script lang="ts">
  import { Button, Icon, iconLoading } from '@mathesar/component-library';
  import { iconDeleteMajor } from '@mathesar/icons';
  import type { Selection } from '@mathesar/stores/table-data/selection';
  import type { RecordsData } from '@mathesar/stores/table-data/types';
  import { toast } from '@mathesar/stores/toast';

  export let selectedRoweKey: number[];
  export let recordsData: RecordsData;
  export let selection: Selection;

  let isDeleting = false;

  async function handleDeleteRecords() {
    if (!isDeleting) {
      try {
        isDeleting = true;
        selection.freezeSelection = true;
        await recordsData.deleteSelected(selectedRoweKey);
        selection.resetSelection();
      } catch (e) {
        toast.fromError(e);
      } finally {
        selection.freezeSelection = false;
        isDeleting = true;
      }
    }
  }
</script>

<div class="actions-container">
  <Button appearance="ghost" on:click={handleDeleteRecords}>
    <Icon {...isDeleting ? iconLoading : iconDeleteMajor} />
    <span>
      Delete {selectedRoweKey.length} record{selectedRoweKey.length > 1
        ? 's'
        : ''}
    </span>
  </Button>
</div>

<style>
  .actions-container {
    display: flex;
    flex-direction: column;
  }
</style>
