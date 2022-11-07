<script lang="ts">
  import { iconInfo } from '../common/icons';
  import Icon from '../icon/Icon.svelte';
  import type { IconProps } from '../icon/IconTypes';
  import type { Appearance } from './AlertTypes';

  const appearanceIconMap: Record<Appearance, IconProps> = {
    info: iconInfo,
  };

  export let appearance: Appearance = 'info';
  export let icon: IconProps = appearanceIconMap[appearance];

  $: classes = ['alert-container', `alert-${appearance}`].join(' ');
</script>

<div class={classes}>
  <Icon {...icon} />
  <div class="content">
    <slot />
  </div>
</div>
