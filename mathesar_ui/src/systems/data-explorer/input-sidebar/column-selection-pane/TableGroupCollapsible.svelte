<script lang="ts">
  import {
    Collapsible,
    Icon,
    Button,
    iconExpandDown,
  } from '@mathesar-component-library';
  import { iconTable } from '@mathesar/icons';
  import type { ColumnWithLink } from '../../utils';

  export let linkCollapsibleOpenState: Record<ColumnWithLink['id'], boolean> =
    {};
  export let column: Pick<ColumnWithLink, 'id' | 'name'>;
  export let tableName: string;
</script>

<div class="table-group">
  <Collapsible bind:isOpen={linkCollapsibleOpenState[column.id]}>
    <Button
      slot="trigger"
      appearance="plain"
      class="column-name"
      let:toggle
      let:isOpen
      on:click={toggle}
    >
      <span class="table-name">
        <Icon
          {...iconExpandDown}
          size="0.7rem"
          rotate={isOpen ? undefined : 270}
        />
        <Icon {...iconTable} size="0.9rem" />
        <span>{tableName}</span>
      </span>
      <span class="fk-column">
        via {column.name}
      </span>
    </Button>
    <div class="column-list" slot="content">
      <slot />
      <div class="line-down" />
    </div>
  </Collapsible>
</div>

<style lang="scss">
  .table-group {
    position: relative;
    display: flex;
    flex-direction: column;

    :global(.column-name) {
      flex-direction: column;
      padding: 0;
      width: 100%;
    }

    .table-name,
    .fk-column {
      display: block;
      max-width: 100%;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      margin-right: auto;
    }

    .table-name {
      > span {
        display: inline-block;
        vertical-align: middle;
        font-weight: 590;
      }
    }
    .fk-column {
      font-size: var(--text-size-small);
    }

    :global(.collapsible .collapsible-header) {
      padding: 0.5rem 0.75rem;
      border: 1px solid #dfdfdf;
      border-radius: 2px;
      cursor: pointer;
      display: flex;
      align-items: center;
    }

    .column-list {
      margin-top: 0.7rem;
      margin-left: 1rem;
    }

    .line-down {
      position: absolute;
      width: 1px;
      top: -0.7rem;
      bottom: 0;
      left: 0.25rem;
      border: 1px dashed #dfdfdf;
    }

    + :global(.table-group) {
      margin-top: var(--size-small);
    }
  }
</style>
