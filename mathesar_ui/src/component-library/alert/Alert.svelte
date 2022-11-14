<script lang="ts">
  import { iconError, iconInfo } from '../common/icons';
  import Icon from '../icon/Icon.svelte';
  import type { IconProps } from '../icon/IconTypes';
  import type { Appearance } from './AlertTypes';

  const appearanceIconMap: Record<Appearance, IconProps> = {
    info: iconInfo,
    error: iconError,
  };

  export let appearance: Appearance = 'info';
  export let icon: IconProps = appearanceIconMap[appearance];

  $: classes = ['alert-container', `alert-${appearance}`].join(' ');
</script>

<span class={classes}>
  <Icon {...icon} />
  <span class="content">
    <slot />
  </span>
</span>
