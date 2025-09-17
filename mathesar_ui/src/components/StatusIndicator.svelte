<script lang="ts">
  import {
    Icon,
    Spinner,
    iconError,
    iconSuccess,
    iconWarning,
  } from '@mathesar-component-library';

  type State = 'processing' | 'success' | 'failure' | 'warning';

  export let state: State;
  export let messages: Partial<Record<State, string>>;

  let classes = '';
  export { classes as class };
</script>

<span class="status-indicator {state} {classes}">
  <span class="icon">
    {#if state === 'processing'}
      <Spinner />
    {:else if state === 'success'}
      <Icon {...iconSuccess} />
    {:else if state === 'failure'}
      <Icon {...iconError} />
    {:else}
      <Icon {...iconWarning} />
    {/if}
  </span>
  <span>
    {messages[state] ?? ''}
  </span>
</span>

<style lang="scss">
  .status-indicator {
    border-radius: 500px;
    padding: 0.25em 0.75rem;
    font-size: var(--sm1);
    display: inline-flex;
    align-items: center;
    font-weight: var(--font-weight-medium);
    white-space: nowrap;
    border: 1px solid;

    .icon > :global(*) {
      display: block;
    }
    > :global(* + *) {
      margin-left: 0.5em;
    }

    &.processing {
      background: var(--color-bg-info);
      color: var(--color-fg-info);
      border-color: var(--color-border-info);
    }
    &.processing .icon {
      color: var(--color-fg-info);
    }
    &.warning {
      background: var(--color-bg-warning);
      color: var(--color-fg-warning);
      border-color: var(--color-border-warning);
    }
    &.warning .icon {
      color: var(--color-fg-warning);
    }
    &.success {
      background: var(--color-bg-success);
      color: var(--color-fg-success);
      border-color: var(--color-border-success);
    }
    &.success .icon {
      color: var(--color-fg-success);
    }
    &.failure {
      background: var(--color-bg-danger);
      color: var(--color-fg-danger);
      border-color: var(--color-border-danger);
    }
    &.failure .icon {
      color: var(--color-fg-danger);
    }
  }
</style>
