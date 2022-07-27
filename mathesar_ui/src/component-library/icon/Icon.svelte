<script lang="ts">
  import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
  import type { IconProps } from './IconTypes';

  // NOTE:
  // The type definition for the props here are duplicated in `Icon.d.ts` too.
  //
  // After https://github.com/sveltejs/language-tools/issues/442 is fixed, we
  // should hopefully be able to clean up this code duplication a bit.

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
  export let flip: IconProps['flip'] | undefined = undefined;

  // Rotates the icon to a specified angle. Allowed values are '90', '180', '270'.
  export let rotate: IconProps['rotate'] | undefined = undefined;

  // Additional classes
  let classes = '';
  export { classes as class };

  // The aria-label for the icon. Typically describes the icon.
  export let label: string | undefined = undefined;

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
