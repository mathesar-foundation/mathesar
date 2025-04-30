<script lang="ts">
  export let display:
    | 'block'
    | 'inline'
    | 'inline-block'
    | 'flex'
    | 'inline-flex' = 'block';

  let classes = '';
  export { classes as class };
</script>

<span class="chip display-{display} {classes}">
  <slot />
</span>
