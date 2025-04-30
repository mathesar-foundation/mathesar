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
    font-size: var(--text-size-small);
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
      background: var(--info-background-color);
      color: var(--info-color);
      border-color: var(--info-border-color);
    }
    &.processing .icon {
      color: var(--info-color);
    }
    &.warning {
      background: var(--warning-background-color);
      color: var(--warning-color);
      border-color: var(--warning-border-color);
    }
    &.warning .icon {
      color: var(--warning-color);
    }
    &.success {
      background: var(--success-background-color);
      color: var(--success-color);
      border-color: var(--success-border-color);
    }
    &.success .icon {
      color: var(--success-color);
    }
    &.failure {
      background: var(--danger-background-color);
      color: var(--danger-color);
      border-color: var(--danger-border-color);
    }
    &.failure .icon {
      color: var(--danger-color);
    }
  }
</style>
