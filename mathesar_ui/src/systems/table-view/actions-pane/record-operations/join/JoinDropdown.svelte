<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { iconTableLink } from '@mathesar/icons';
  import { Dropdown, Icon } from '@mathesar-component-library';
  import type { Table } from '@mathesar/models/Table';

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
>
  <svelte:fragment slot="trigger">
    <Icon {...iconTableLink} />
    <span class="responsive-button-label">
      {$_('join')}
    </span>
  </svelte:fragment>
  <div slot="content">
    <Join {table} />
  </div>
</Dropdown>

<style lang="scss">
  .responsive-button-label {
    display: inline-flex;
    align-items: center;
  }
</style>
