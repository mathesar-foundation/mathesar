<script lang="ts">
  import { iconDescription, iconMoreActions } from '@mathesar/icons';
  import {
    DropdownMenu,
    Icon,
    Tooltip,
    Truncate,
  } from '@mathesar-component-library';
  import type { IconProps } from '@mathesar-component-library/types';

  export let href: string;
  export let icon: IconProps;
  export let name: string;
  export let description: string | undefined;
  /**
   * If this entity is in a pending state, the given message will explain why
   * (e.g. an unconfirmed table import).
   */
  export let pendingMessage: string | undefined = undefined;
  export let primary = false;
</script>

<div class="entity-list-item" class:pending={!!pendingMessage} class:primary>
  <a class="link passthrough" {href} aria-label={name}>
    <div class="top">
      <div class="name">
        <Icon {...icon} />
        <span>{name}</span>
      </div>
      {#if description && !primary}
        <Tooltip>
          <div class="description-icon" slot="trigger">
            <Icon {...iconDescription} />
          </div>
          <div slot="content">{description}</div>
        </Tooltip>
      {/if}
      {#if pendingMessage}
        <div class="pending-message">
          {pendingMessage}
        </div>
      {/if}
    </div>
    {#if description && primary}
      <div class="description">
        <Truncate>{description}</Truncate>
      </div>
    {/if}
    {#if $$slots.detail}
      <div class="detail">
        <slot name="detail" />
      </div>
    {/if}
  </a>

  <div class="actions">
    <slot name="action-buttons" />
    <div class="menu-container">
      <DropdownMenu
        showArrow={false}
        triggerAppearance="plain"
        triggerClass="dropdown-menu-button"
        closeOnInnerClick={true}
        placements={['bottom-end', 'right-start', 'left-start']}
        label=""
        icon={iconMoreActions}
        size="small"
      >
        <slot name="menu" />
      </DropdownMenu>
    </div>
  </div>
</div>

<style lang="scss">
  .entity-list-item {
    position: relative;
    display: grid;
    grid-template: auto / 1fr auto;
    align-items: center;
    overflow: hidden;
    border-radius: var(--corner-tl) var(--corner-tr) var(--corner-br)
      var(--corner-bl);
    --corner-tl: 0;
    --corner-tr: 0;
    --corner-br: 0;
    --corner-bl: 0;
  }

  .entity-list-item.primary {
    border: 1px solid var(--border-card);
    background-color: var(--surface-card);
  }

  .entity-list-item.primary + :global(.entity-list-item.primary) {
    border-top: none;
  }

  .entity-list-item.primary:first-child {
    --corner-tl: var(--border-radius-l);
    --corner-tr: var(--border-radius-l);
  }
  .entity-list-item.primary:last-child {
    --corner-br: var(--border-radius-l);
    --corner-bl: var(--border-radius-l);
  }

  .entity-list-item:has(.link:focus):not(:hover) {
    outline: 1px solid var(--border-card-focused);
    outline-offset: -1px;
  }

  .entity-list-item:has(.link:hover) {
    background: var(--color-table-hover-10);
  }

  .entity-list-item.primary:has(.link:hover) {
    background: var(--color-table-hover-10);
    padding-left: 0;
    &::before {
      content: '';
      border-radius: var(--corner-tl) var(--corner-tr) var(--corner-br)
        var(--corner-bl);
      border-left: solid 3px var(--color-table-40);
      position: absolute;
      height: 100%;
      width: 10px;
      top: 0;
      left: 0;
      pointer-events: none;
    }
  }

  .entity-list-item.pending {
    color: var(--text-disabled);
    background-color: var(--surface-card-disabled);
  }

  .link {
    overflow: hidden;
    display: grid;
    cursor: pointer;
    padding: var(--sm2) var(--sm2);

    .top {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--sm2);
    }

    .detail {
      margin: var(--sm6) 0 0 var(--lg1);
      font-size: var(--sm1);
      color: var(--text-disabled);
    }
  }
  .entity-list-item.primary .link {
    padding: var(--sm2) var(--lg1);
  }

  .name {
    font-weight: var(--font-weight-medium);
  }
  .entity-list-item.primary .name {
    font-size: var(--lg1);
  }

  .description {
    overflow: hidden;
  }
  .description-icon {
    color: var(--text-disabled);
    font-size: var(--sm1);
  }

  .pending-message {
    font-size: var(--sm1);
    padding: 0.25rem 0.5rem;
    border-radius: var(--border-radius-m);
    background: var(--semantic-warning-bg);
    color: var(--semantic-warning-text);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
  }

  .menu-container {
    display: flex;
  }
</style>
