<script lang="ts">
  import { Button, Icon } from '@mathesar-component-library';
  import type { IconProps } from '@mathesar-component-library/types';

  export let changeView: () => void;

  export let icon: IconProps;
  export let header: string;
  export let description: string;
</script>

<Button on:click={changeView}>
  <div class="content">
    <div class="icon-circle">
      <Icon {...icon} size="2rem" />
    </div>
    <div>
      <div class="header">
        {header}
      </div>
      <div class="description">
        {description}
      </div>
    </div>
  </div>
</Button>

<style>
  .content {
    display: grid;
    align-items: center;
    grid-template-columns: auto 1fr;
    gap: var(--size-large);
    text-align: left;
    padding: var(--size-large);
  }
  .icon-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #e1cfb5;
    height: 3.6rem;
    width: 3.6rem;
    border-radius: 3.6rem;
  }
  .header {
    font-size: var(--text-size-large);
    font-weight: 500;
  }
  .description {
    color: var(--slate-500);
    margin-top: var(--size-ultra-small);
  }
</style>
