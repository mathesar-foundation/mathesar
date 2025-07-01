<script lang="ts">
  import { iconDescription, iconMoreActions } from '@mathesar/icons';
  import { DropdownMenu, Icon, Tooltip } from '@mathesar-component-library';
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
  export let largeName = false;
</script>

<div class="entity-list-item" class:pending={!!pendingMessage}>
  <a class="link passthrough" {href} aria-label={name}>
    <div class="top">
      <div class="name" class:large={largeName}>
        <Icon {...icon} />
        <span>{name}</span>
      </div>
      {#if description}
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
    border: 1px solid var(--card-border);
    background-color: var(--card-background);
    overflow: hidden;
    border-radius: var(--corner-tl) var(--corner-tr) var(--corner-br)
      var(--corner-bl);
    --corner-tl: 0;
    --corner-tr: 0;
    --corner-br: 0;
    --corner-bl: 0;
  }

  .entity-list-item + :global(.entity-list-item) {
    border-top: none;
  }

  .entity-list-item:first-child {
    --corner-tl: var(--border-radius-l);
    --corner-tr: var(--border-radius-l);
  }
  .entity-list-item:last-child {
    --corner-br: var(--border-radius-l);
    --corner-bl: var(--border-radius-l);
  }

  .entity-list-item:has(.link:focus):not(:hover) {
    outline: 1px solid var(--card-focus-outline);
    outline-offset: -1px;
  }

  .entity-list-item:has(.link:hover) {
    box-shadow: var(--shadow-color) 0 2px 4px 0;
    background: var(--card-hover-background);
    padding-left: 0;
    &::before {
      content: '';
      border-radius: var(--corner-tl) var(--corner-tr) var(--corner-br)
        var(--corner-bl);
      border-left: solid 3px var(--salmon-400);
      position: absolute;
      height: 100%;
      width: 10px;
      top: 0;
      left: 0;
      pointer-events: none;
    }
  }

  .entity-list-item.pending {
    color: var(--text-color-muted);
    background-color: var(--disabled-background);
  }

  .link {
    display: grid;
    cursor: pointer;
    padding: var(--sm2) var(--lg1);

    .top {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--sm2);
    }

    .detail {
      margin: var(--sm6) 0 0 var(--lg1);
      font-size: var(--sm1);
      color: var(--text-color-muted);
    }
  }

  .name {
    font-weight: var(--font-weight-medium);
    &.large {
      font-size: var(--lg1);
    }
  }

  .description-icon {
    color: var(--text-color-muted);
    font-size: var(--sm1);
  }

  .pending-message {
    font-size: var(--sm1);
    padding: 0.25rem 0.5rem;
    border-radius: var(--border-radius-m);
    background: var(--warning-background-color);
    color: var(--warning-color);
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
