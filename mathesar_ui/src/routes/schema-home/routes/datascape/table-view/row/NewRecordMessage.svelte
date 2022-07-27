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
    background: #069668;
    display: flex;
    align-items: center;
    color: #fff;
    padding: 0px 14px;
  }
</style>
