<script lang="ts">
  import { getRandomInteger } from '@mathesar-component-library-dir/common/utils/miscUtils';

  export let textShade: 'light' | 'dark' = 'dark';
  export let background = (() => {
    const h = getRandomInteger(0, 359);
    const s = getRandomInteger(0, 100);
    const l = textShade === 'dark' ? 85 : 40;
    return `hsl(${h}, ${s}%, ${l}%)`;
  })();
  export let display: 'block' | 'inline' | 'inline-block' = 'block';

  let classes = '';
  export { classes as class };
</script>

<span class="chip display-{display} {classes}" style:background>
  <slot />
</span>
