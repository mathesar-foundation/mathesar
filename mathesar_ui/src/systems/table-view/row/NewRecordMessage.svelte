<script lang="ts">
  import { SheetPositionableCell } from '@mathesar/components/sheet';

  export let columnCount: number;
</script>

<SheetPositionableCell
  index={1}
  columnSpan={columnCount}
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
    background: var(--color-green-medium);
    display: flex;
    align-items: center;
    font-size: var(--text-size-small);
    color: var(--color-white);
    padding: 0 0.5rem;
  }
</style>
