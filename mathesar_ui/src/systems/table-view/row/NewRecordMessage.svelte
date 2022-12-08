<script lang="ts">
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
    New records will be repositioned on refresh
  </div>
</SheetPositionableCell>

<style lang="scss">
  .new-record-message {
    z-index: var(--z-index-new-record-message, auto);
    background: var(--sky-200);
    display: flex;
    align-items: center;
    font-size: var(--text-size-small);
    padding: 0 0.5rem;
  }
</style>
