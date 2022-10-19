<script lang="ts">
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';

  export let icon: IconProps;
  export let type: string;
  export let name: string;
</script>

<div class="container">
  <div class="top">
    <div class="left">
      <div class="entity-container">
        <div class="entity-icon">
          <Icon {...icon} size="2em" />
        </div>
        <div class="left-meta-container">
          <span class="entity-type">{type}</span>
          <span class="entity-name">{name}</span>
        </div>
      </div>
    </div>
    <slot name="action" />
  </div>
  <slot name="bottom" />
</div>

<style lang="scss">
  .container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 1rem;
    }
  }
  .top {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .entity-container {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .entity-icon {
    width: 3.42rem;
    height: 3.42rem;
    background-color: var(--brand-500);
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: var(--border-radius-l);
    color: var(--white);
  }

  .left-meta-container {
    display: flex;
    flex-direction: column;
    margin-left: 0.75rem;
  }

  .entity-type {
    font-weight: 600;
    font-size: 0.857rem;
    text-transform: uppercase;
  }

  .entity-name {
    font-weight: 600;
    font-size: 2.28rem;
  }
</style>
