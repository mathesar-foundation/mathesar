<script lang="ts">
  import IconPath from './IconPath.svelte';
  import type { IconProps } from './IconTypes';
  import { getDot, getPathStyle } from './iconUtils';

  // NOTE:
  // The type definition for the props here are duplicated in `Icon.d.ts` too.
  //
  // After https://github.com/sveltejs/language-tools/issues/442 is fixed, we
  // should hopefully be able to clean up this code duplication a bit.

  // The Font-awesome icon definition from 'fortawesome' package.
  export let data: IconProps['data'];
  $: [viewBoxWidth, viewBoxHeight, , , path] = data.icon;

  // The size of the icon. Accepts a valid dimension with unit.
  export let size = '1em';

  // Spin animates the icon if true.
  export let spin = false;

  // Rotates the icon with 8 steps if true.
  export let pulse = false;

  // Flips the icon. Allowed values are 'vertical', 'horizontal' or 'both'.
  export let flip: IconProps['flip'] | undefined = undefined;

  // Rotates the icon to a specified angle. Allowed values are '90', '180', '270'.
  export let rotate: IconProps['rotate'] | undefined = undefined;

  // Additional classes
  let classes = '';
  export { classes as class };

  // The aria-label for the icon. Typically describes the icon.
  export let label: string | undefined = undefined;

  // Tooltip
  export let title: string | undefined = undefined;

  export let hasNotificationDot = false;

  function concatClasses(
    _classes?: string,
    _flip?: IconProps['flip'],
    _rotate?: IconProps['rotate'],
  ): string {
    const faClass = ['fa-icon'];
    if (_classes) {
      faClass.push(_classes);
    }
    if (_flip) {
      faClass.push(`fa-flip-${_flip}`);
    }
    if (_rotate) {
      faClass.push(`fa-rotate-${_rotate}`);
    }
    return faClass.join(' ');
  }

  let faClasses: string;
  $: faClasses = concatClasses(classes, flip, rotate);
  $: dot = hasNotificationDot ? getDot(viewBoxWidth, viewBoxHeight) : undefined;
</script>

<svg
  version="1.1"
  viewBox="0 0 {viewBoxWidth} {viewBoxHeight}"
  width={size}
  height={size}
  class={faClasses}
  class:fa-spin={spin}
  class:fa-pulse={pulse}
  aria-label={label}
  role={label ? 'img' : 'presentation'}
  {...$$restProps}
>
  {#if title}
    <title>{title}</title>
  {/if}
  {#if Array.isArray(path)}
    {#each path as entry (entry)}
      <IconPath
        path={entry}
        style={getPathStyle(viewBoxWidth, viewBoxHeight, dot)}
      />
    {/each}
  {:else}
    <IconPath {path} style={getPathStyle(viewBoxWidth, viewBoxHeight, dot)} />
  {/if}
  {#if dot}
    <circle class="notification-dot" {...dot} />
  {/if}
</svg>
