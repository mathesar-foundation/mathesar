<script lang="ts">
  import { iconError, iconInfo, iconWarning } from '../common/icons';
  import Icon from '../icon/Icon.svelte';
  import type { IconProps } from '../icon/IconTypes';
  import type { AlertAppearance } from './AlertTypes';

  const appearanceIconMap: Record<AlertAppearance, IconProps> = {
    info: iconInfo,
    error: iconError,
    warning: iconWarning,
  };

  export let appearance: AlertAppearance = 'info';
  export let icon: IconProps = appearanceIconMap[appearance];

  $: classes = ['alert-container', `alert-${appearance}`].join(' ');
</script>

<div class={classes}>
  <span class="icon">
    <Icon {...icon} />
  </span>
  <div class="content">
    <slot />
  </div>
</div>
