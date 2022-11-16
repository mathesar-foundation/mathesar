<script lang="ts">
  import { iconInfo, iconWarning } from '../common/icons';
  import Icon from '../icon/Icon.svelte';
  import type { IconProps } from '../icon/IconTypes';
  import type { AlertAppearance } from './AlertTypes';

  const appearanceIconMap: Record<AlertAppearance, IconProps> = {
    info: iconInfo,
    warning: iconWarning,
  };

  export let appearance: AlertAppearance = 'info';
  export let icon: IconProps = appearanceIconMap[appearance];

  $: classes = ['alert-container', `alert-${appearance}`].join(' ');
</script>

<div class={classes}>
  <Icon {...icon} />
  <div class="content">
    <slot />
  </div>
</div>
