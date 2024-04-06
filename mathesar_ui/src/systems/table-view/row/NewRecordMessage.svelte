<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { SheetPositionableCell } from '@mathesar/components/sheet';

  export let columnCount: number;
</script>

<SheetPositionableCell
  index={0}
  columnSpan={// Adding once since the index is starting from 0
  columnCount + 1}
  let:htmlAttributes
  let:style
>
  <div
    class="new-record-message"
    {...htmlAttributes}
    style="{style};min-width:400px;"
  >
    {$_('new_records_reposition_refresh')}
  </div>
</SheetPositionableCell>

<style lang="scss">
  .new-record-message {
    z-index: var(--z-index__sheet__new-record-message, auto);
    background: var(--sky-200);
    display: flex;
    align-items: center;
    font-size: var(--text-size-small);
    padding: 0 0.5rem;
  }
</style>
