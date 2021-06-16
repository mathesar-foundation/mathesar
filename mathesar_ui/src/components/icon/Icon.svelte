<script lang="ts">
  import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
  import type { IconFlip, IconRotate } from './Icon.d';
  
  export let data: IconDefinition;
  $: [viewBoxWith, viewBoxHeight, , , path] = data.icon;

  export let size = '1em';
  export let label = null;

  export let spin = false;
  export let pulse = false;
  export let flip: IconFlip = null;
  export let rotate: IconRotate = null;

  let classes = '';
  export { classes as class };

  function concatClasses(_classes?: string, _flip?: IconFlip, _rotate?: IconRotate): string {
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

<svg version="1.1" viewBox="0 0 {viewBoxWith} {viewBoxHeight}"
      width={size} height={size} class={faClasses}
      class:fa-spin={spin} class:fa-pulse={pulse}
      aria-label={label} role={label ? 'img' : 'presentation'}>
  {#if Array.isArray(path)}
    {#each path as entry (entry)}
      <path d={entry}></path>
    {/each}
  {:else}
    <path d={path}></path>
  {/if}
</svg>

<style global lang="scss">
  @import "Icon.scss";
</style>
