<script lang="ts">
  import { Collapsible, Icon } from '@mathesar-component-library';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import { iconInwardLink, iconOutwardLink } from '@mathesar/icons';

  export let column: { name: string; type: string };
  export let tableName: string;
  export let direction: 'in' | 'out';
</script>

<div class="table-group">
  <div class="table-name">
    <Icon
      {...direction === 'in' ? iconInwardLink : iconOutwardLink}
      size="0.6rem"
    />
    {tableName}
  </div>
  <Collapsible>
    <div slot="header" class="column-name">
      <ColumnName
        column={{
          ...column,
          type_options: null,
          display_options: null,
        }}
      />
    </div>
    <div class="column-list" slot="content">
      <slot />
      <div class="line-down" />
    </div>
  </Collapsible>
</div>

<style lang="scss">
  .table-group {
    margin: 0.7rem 0;
    position: relative;
    display: flex;
    flex-direction: column;

    .table-name {
      display: inline-block;
      padding: 0.2rem 0.7rem;
      background: #efefef;
      border: 1px solid #dfdfdf;
      border-radius: 0.2rem 0.2rem 0 0;
      margin-bottom: -1px;
      max-width: 100%;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      margin-right: auto;
      font-size: 0.8rem;
    }

    // TODO: Check with @pavish
    // This is leading to unwanted padding and border
    // when collapsible is used in isolation
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
  }
</style>
