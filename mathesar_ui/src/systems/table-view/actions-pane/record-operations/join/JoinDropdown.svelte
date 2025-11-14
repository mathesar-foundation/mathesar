<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { iconTableLink } from '@mathesar/icons';
  import type { Table } from '@mathesar/models/Table';
  import { Dropdown, Icon } from '@mathesar-component-library';

  import Join from './Join.svelte';

  interface $$Props extends ComponentProps<Dropdown> {
    table: Table;
  }

  export let table: Table;
</script>

<Dropdown
  showArrow={false}
  triggerAppearance="secondary"
  {...$$restProps}
  ariaLabel={$_('join')}
  autoReposition
>
  <svelte:fragment slot="trigger">
    <Icon {...iconTableLink} />
    <span class="responsive-button-label">
      {$_('join')}
    </span>
  </svelte:fragment>
  <div slot="content" class="content">
    <Join {table} />
  </div>
</Dropdown>

<style lang="scss">
  .responsive-button-label {
    display: inline-flex;
    align-items: center;
  }
  .content {
    padding: var(--sm3) var(--sm5) var(--sm1) var(--sm5);
  }
</style>
