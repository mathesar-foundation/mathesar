<script lang="ts">
  import AttachableDropdown from '@mathesar-component-library-dir/dropdown/AttachableDropdown.svelte';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import { iconHelp } from '@mathesar-component-library-dir/common/icons';

  let trigger: HTMLElement | undefined;
  let isContentShown = false;
</script>

<span
  bind:this={trigger}
  aria-label="Help"
  class="help-trigger"
  on:mouseenter={() => {
    isContentShown = true;
  }}
  on:mouseleave={() => {
    isContentShown = false;
  }}
>
  <Icon {...iconHelp} />
</span>

<AttachableDropdown
  {trigger}
  isOpen={isContentShown}
  placement="top"
  class="help-content tooltip"
>
  <slot />
</AttachableDropdown>
