<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { iconTableLink } from '@mathesar/icons';
  import { Dropdown, Icon } from '@mathesar-component-library';

  type $$Props = ComponentProps<Dropdown>;
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
  <div slot="content">TODO</div>
</Dropdown>

<style lang="scss">
  .responsive-button-label {
    display: inline-flex;
    align-items: center;
  }
</style>
