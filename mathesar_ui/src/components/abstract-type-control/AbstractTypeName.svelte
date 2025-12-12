<script lang="ts">
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import type { AbstractType } from '@mathesar/stores/abstract-types/types';
  import { Help, Render } from '@mathesar-component-library';

  export let abstractType: AbstractType;

  $: enabledStateInfo = abstractType.getEnabledState?.();
  $: isDisabled = enabledStateInfo ? !enabledStateInfo.enabled : false;
  $: disabledHelp =
    enabledStateInfo && !enabledStateInfo.enabled
      ? enabledStateInfo.cause
      : undefined;
</script>

<div class="abstract-type" class:disabled={isDisabled}>
  <NameWithIcon icon={abstractType.getIcon()}>
    {abstractType.name}
  </NameWithIcon>
  {#if disabledHelp}
    <span class="help">
      <Help>
        <Render arg={disabledHelp} />
      </Help>
    </span>
  {/if}
</div>

<style lang="scss">
  .abstract-type {
    display: flex;
    align-items: center;

    .help {
      margin-left: var(--sm5);
    }
  }
</style>
