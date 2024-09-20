<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { IconProps } from '@mathesar/component-library/types';
  import { Icon } from '@mathesar-component-library';

  import LinkItem from './LinkItem.svelte';
  import type { TableLink } from './utils';

  export let icon: IconProps;
  export let title: string;
  export let links: TableLink[];
</script>

<div class="link-section-container">
  <div class="header">
    <div class="left">
      <Icon {...icon} />
      <span>{title}</span>
    </div>
  </div>
  <div class="links">
    {#each links as link}
      <LinkItem {link} />
    {/each}
  </div>
</div>

<style lang="scss">
  .link-section-container {
    .header {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;

      > :global(* + *) {
        margin-left: 0.25rem;
      }

      .left {
        display: flex;
        flex-direction: row;
        align-items: center;

        > :global(* + *) {
          margin-left: 0.25rem;
        }
      }
    }

    .links {
      display: flex;
      flex-direction: column;

      > :global(* + *) {
        margin-top: 0.5rem;
      }
    }
  }
</style>
