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
    position: relative;
    display: flex;
    align-items: center;
    min-height: var(--lg4);
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
      padding: var(--sm2);

      .icon {
        font-size: var(--lg2);
        padding: var(--sm4);
        background: var(--icon-fill-color);
        border-radius: var(--border-radius-l);
        margin-right: var(--sm2);
        color: var(--icon-stroke-color);
      }
      .text {
        overflow: hidden;
      }
      .name {
        font-size: var(--lg3);
        margin: 0;
        font-weight: var(--font-weight-bold);
        overflow: hidden;
        color: var(--color-fg-base);
      }
      .description {
        font-size: var(--sm1);
        color: var(--color-fg-subtle-1);
        overflow: hidden;
      }
    }

    .actions {
      padding: var(--sm3);
      display: flex;
      align-items: center;
      flex-grow: 1;
      margin-left: 0.5rem;

      .actions-left {
        display: flex;
        flex-shrink: 0;

        > :global(* + *) {
          margin-left: var(--sm3);
        }
      }

      &.has-right-actions {
        .actions-left {
          margin-right: var(--lg2);
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
        gap: var(--sm3);
      }
    }

    @media (max-width: 38rem) {
      & :global(.responsive-button-label) {
        display: none;
      }
    }
  }
</style>
