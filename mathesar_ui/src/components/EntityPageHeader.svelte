<script lang="ts">
  import { Icon, Truncate } from '@mathesar-component-library';
  import type { IconProps } from '@mathesar-component-library/types';

  export let title:
    | {
        icon: IconProps;
        name: string;
        description?: string;
      }
    | undefined = undefined;
</script>

<div class="entity-page-header">
  {#if title}
    <div class="heading">
      <div class="icon">
        <Icon {...title.icon} class="block" />
      </div>
      <div class="text">
        <h1 class="name">
          <Truncate>{title.name}</Truncate>
        </h1>
        {#if title.description}
          <div class="description">
            <Truncate>{title.description}</Truncate>
          </div>
        {/if}
      </div>
    </div>
  {/if}
  <div class="actions" class:has-right-actions={$$slots['actions-right']}>
    {#if $$slots.default}
      <div class="actions-left">
        <slot />
      </div>
    {/if}
    {#if $$slots['actions-right']}
      <div class="actions-right">
        <slot name="actions-right" />
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .entity-page-header {
    border-bottom: 1px solid var(--border-color);
    background-color: linear-gradient(
      var(--card-gradient-direction),
      var(--card-gradient-start),
      var(--card-gradient-end)
    );
    position: relative;
    display: flex;
    align-items: center;
    min-height: var(--size-ultra-large);
    overflow: hidden;

    .heading {
      display: flex;
      align-items: center;
      overflow: hidden;
      min-width: 10rem;
      max-width: 50%;
      flex-grow: 0;
      flex-shrink: 1;
      min-height: 100%;
      border-right: 1px solid var(--border-color);
      padding: var(--size-small) var(--size-large);

      .icon {
        font-size: var(--size-large);
        padding: var(--size-ultra-small);
      }
      .text {
        overflow: hidden;
      }
      .name {
        font-size: var(--text-size-x-large);
        margin: 0;
        font-weight: var(--font-weight-bold);
        overflow: hidden;
        color: var(--text-color-primary);
      }
      .description {
        font-size: var(--text-size-small);
        color: var(--text-color-secondary);
        overflow: hidden;
      }
    }

    .actions {
      padding: var(--size-xx-small);
      display: flex;
      align-items: center;
      flex-grow: 1;

      .actions-left {
        display: flex;
        flex-shrink: 0;

        > :global(* + *) {
          margin-left: var(--size-xx-small);
        }
      }

      &.has-right-actions {
        .actions-left {
          margin-right: var(--size-x-large);
        }
      }

      &:not(.has-right-actions) {
        .actions-left {
          flex-grow: 1;
        }
      }

      .actions-right {
        margin-left: auto;
        display: grid;
        grid-auto-flow: column;
        align-items: center;
        gap: var(--size-xx-small);
      }
    }

    @media (max-width: 38rem) {
      & :global(.responsive-button-label) {
        display: none;
      }
    }
  }
</style>
