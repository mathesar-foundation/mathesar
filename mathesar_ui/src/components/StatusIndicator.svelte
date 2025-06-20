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
      background: var(--SYS-semantic-info-bg);
      color: var(--SYS-semantic-info-text);
      border-color: var(--SYS-semantic-info-border);
    }
    &.processing .icon {
      color: var(--SYS-semantic-info-text);
    }
    &.warning {
      background: var(--SYS-semantic-warning-bg);
      color: var(--SYS-semantic-warning-text);
      border-color: var(--SYS-semantic-warning-border);
    }
    &.warning .icon {
      color: var(--SYS-semantic-warning-text);
    }
    &.success {
      background: var(--SYS-semantic-success-bg);
      color: var(--SYS-semantic-success-text);
      border-color: var(--SYS-semantic-success-border);
    }
    &.success .icon {
      color: var(--SYS-semantic-success-text);
    }
    &.failure {
      background: var(--SYS-semantic-danger-bg);
      color: var(--SYS-semantic-danger-text);
      border-color: var(--SYS-semantic-danger-border);
    }
    &.failure .icon {
      color: var(--SYS-semantic-danger-text);
    }
  }
</style>
