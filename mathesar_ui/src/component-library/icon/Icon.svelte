<script lang="ts">
  import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
  import type { IconFlip, IconRotate } from './Icon.d';

  // The Font-awesome icon definition from 'fortawesome' package.
  export let data: IconDefinition;
  $: [viewBoxWith, viewBoxHeight, , , path] = data.icon;

  // The size of the icon. Accepts a valid dimension with unit.
  export let size = '1em';

  // Spin animates the icon if true.
  export let spin = false;

  // Rotates the icon with 8 steps if true.
  export let pulse = false;

  // Flips the icon. Allowed values are 'vertical', 'horizontal' or 'both'.
  export let flip: IconFlip | undefined = undefined;

  // Rotates the icon to a specified angle. Allowed values are '90', '180', '270'.
  export let rotate: IconRotate | undefined = undefined;

  // Additional classes
  let classes = '';
  export { classes as class };

  // The aria-label for the icon. Typically describes the icon.
  export let label: string | undefined = undefined;

  function concatClasses(
    _classes?: string,
    _flip?: IconFlip,
    _rotate?: IconRotate,
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
</script>

<svg
  version="1.1"
  viewBox="0 0 {viewBoxWith} {viewBoxHeight}"
  width={size}
  height={size}
  class={faClasses}
  class:fa-spin={spin}
  class:fa-pulse={pulse}
  aria-label={label}
  role={label ? 'img' : 'presentation'}
  {...$$restProps}
>
  {#if Array.isArray(path)}
    {#each path as entry (entry)}
      <path d={entry} />
    {/each}
  {:else}
    <path d={path} />
  {/if}
</svg>
