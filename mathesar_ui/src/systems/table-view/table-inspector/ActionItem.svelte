<script lang="ts">
  import { iconExternalLink, iconSettings } from '@mathesar/component-library';
  import Icon from '@mathesar/component-library/icon/Icon.svelte';
  import type { IconProps } from '@mathesar/component-library/types';

  export let danger = false;
  export let type: 'link' | 'modal' | 'none' = 'none';

  const iconsTypeMapping: Record<typeof type, IconProps | undefined> = {
    link: iconExternalLink,
    modal: iconSettings,
    none: undefined,
  };

  $: icon = iconsTypeMapping[type];
</script>

<button on:click class:danger>
  <div>
    <slot />
  </div>
  {#if icon}
    <Icon {...icon} />
  {/if}
</button>

<style lang="scss">
  button {
    padding: 0.75rem 1rem;
    border: 1px solid var(--slate-200);
    border-radius: var(--border-radius-m);
    display: flex;
    align-items: center;
    cursor: pointer;
    background-color: var(--white);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;

    &:hover {
      border-color: var(--brand-500);
    }

    > :global(* + *) {
      margin-left: 0.5rem;
    }

    > div {
      display: flex;
      align-items: center;

      > :global(* + *) {
        margin-left: 0.25rem;
      }
    }
  }

  button.danger {
    border-color: var(--red-500);
    color: var(--red-500);
  }
</style>
