<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { SheetPositionableCell } from '@mathesar/components/sheet';

  export let columnCount: number;

  // Adding once since the index is starting from 0
  $: columnSpan = columnCount + 1;
</script>

<SheetPositionableCell index={0} {columnSpan}>
  <div class="new-record-message">
    {$_('new_records_reposition_refresh')}
  </div>
</SheetPositionableCell>

<style>
  .new-record-message {
    background: var(--sky-200);
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    font-size: var(--text-size-small);
    padding: 0 0.5rem;
    min-width: max-content;
  }
</style>
