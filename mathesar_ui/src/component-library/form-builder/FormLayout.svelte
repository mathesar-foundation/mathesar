<script lang="ts">
  import type { FormLayout } from './types';

  export let orientation: FormLayout['orientation'] = 'vertical';
  export let elements: FormLayout['elements'];
</script>

<div class="form-element form-layout {orientation}">
  {#each elements || [] as element (element)}
    <slot {element} />
  {/each}
</div>
