<script lang="ts">
  import {
    Collapsible,
    Icon,
    Button,
    iconExpandDown,
    Truncate,
  } from '@mathesar-component-library';
  import TableName from '@mathesar/components/TableName.svelte';
  import type { ColumnWithLink } from '../../utils';

  export let linkCollapsibleOpenState: Record<ColumnWithLink['id'], boolean> =
    {};
  export let column: Pick<ColumnWithLink, 'id' | 'name'>;
  export let tableName: string;
</script>

<div class="table-group">
  <Collapsible bind:isOpen={linkCollapsibleOpenState[column.id]}>
    <!--
      A fragment is used here because sveltecheck does not seem to
      recognize toggle as a defined variable when directly using the
      Button as the slot element.
    -->
    <svelte:fragment slot="trigger" let:toggle let:isOpen>
      <Button appearance="plain" class="column-name" on:click={toggle}>
        <span class="table-name">
          <Icon
            {...iconExpandDown}
            size="0.7rem"
            rotate={isOpen ? undefined : 270}
          />
          <span>
            <TableName table={{ name: tableName }} />
          </span>
        </span>
        <span class="fk-column">
          <Truncate>
            via {column.name}
          </Truncate>
        </span>
      </Button>
    </svelte:fragment>
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
      align-items: flex-start;
      overflow: hidden;
    }

    .table-name {
      display: flex;
      max-width: 100%;
      overflow: hidden;
      align-items: center;

      > span {
        display: inline-block;
        font-weight: 590;
        margin-left: 0.3rem;
        overflow: hidden;
      }
    }
    .fk-column {
      font-size: var(--text-size-small);
      display: block;
      max-width: 100%;
      overflow: hidden;
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
      border: 1px dashed var(--slate-200);
    }

    + :global(.table-group) {
      margin-top: var(--size-small);
    }
  }
</style>
