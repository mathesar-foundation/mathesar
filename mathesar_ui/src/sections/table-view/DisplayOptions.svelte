<script lang="ts">
  import { fade } from 'svelte/transition';
</script>

<div class="display-opts" transition:fade|local={{ duration: 250 }}>
  <h3>Table Display Properties</h3>
  <section>
    <h4>Filter</h4>
  </section>
  <section>
    <h4>Sort</h4>
  </section>
  <section>
    <h4>Group</h4>
  </section>
</div>
