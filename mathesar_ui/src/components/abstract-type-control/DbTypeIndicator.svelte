<script lang="ts">
  import { _ } from 'svelte-i18n';
  import type { DbType } from '@mathesar/AppTypes';
  import { RichText } from '@mathesar/components/rich-text';

  export let type: DbType | undefined;
</script>

<div>
  <RichText text={$_('database_type_displayer')} let:slotName>
    {#if slotName === 'format'}
      <span>{type ?? 'UNKNOWN'}</span>
    {/if}
  </RichText>
</div>

<style lang="scss">
  div {
    margin-top: 0.5rem;
    font-size: var(--text-size-small);

    span {
      text-transform: uppercase;
      background-color: var(--slate-200);
      border-radius: var(--border-radius-m);
      padding: 2px 4px;
      font-size: var(--text-size-x-small);
    }
  }
</style>
