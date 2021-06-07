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
  .fa-icon {
    display: inline-block;
    vertical-align: middle;
    fill: currentColor;
  }
  .fa-flip-horizontal {
    transform: scale(-1, 1);
  }
  .fa-flip-vertical {
    transform: scale(1, -1);
  }
  .fa-flip-both {
    transform: scale(-1);
  }
  .fa-spin {
    animation: spin 1s 0s infinite linear;
  }
  .fa-pulse {
    animation: spin 1s infinite steps(8);
  }
  .fa-rotate-90 {
    transform: rotate(90deg);
  }
  .fa-rotate-180 {
    transform: rotate(180deg);
  }
  .fa-rotate-270 {
    transform: rotate(270deg);
  }
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
