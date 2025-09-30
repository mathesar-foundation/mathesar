<script lang="ts">
  import { _ } from 'svelte-i18n';

  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';

  export let recordSummary: string;
</script>

<div class="linked-record-menu-heading">
  <div class="title">{$_('linked_record')}</div>
  <div class="record-summary">
    <LinkedRecord {recordSummary} />
  </div>
</div>

<style lang="scss">
  .linked-record-menu-heading {
    display: grid;
    grid-template: auto / auto 1fr;
    gap: var(--sm3);
    .record-summary {
      font-size: var(--sm1);
    }
  }
</style>
