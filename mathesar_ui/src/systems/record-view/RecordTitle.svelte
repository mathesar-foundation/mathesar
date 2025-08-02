<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { Icon, Tooltip } from '@mathesar/component-library';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import TableName from '@mathesar/components/TableName.svelte';
  import { iconLinkToRecordPage, iconRecord } from '@mathesar/icons';
  import type RecordStore from '@mathesar/stores/RecordStore';

  export let record: RecordStore;

  $: ({ table, summary } = record);
</script>

<div class="record-title">
  <div class="title">
    <NameWithIcon icon={iconRecord}>{$summary}</NameWithIcon>
    <div class="link">
      <Tooltip>
        <a href="TODO_4670" slot="trigger" class="btn btn-ghost">
          <Icon {...iconLinkToRecordPage} />
        </a>
        <span slot="content">Open In Full Page</span>
      </Tooltip>
    </div>
  </div>

  <div class="table-name">
    <RichText text={$_('record_in_table')} let:slotName>
      {#if slotName === 'tableName'}
        <TableName {table} truncate={false} />
      {/if}
    </RichText>
  </div>
</div>

<style>
  .title {
    overflow: hidden;
    display: flex;
    align-items: center;
  }
  .link {
    font-size: 1rem;
  }
  .table-name {
    font-size: var(--sm1);
    color: var(--text-color-secondary);
  }
</style>
