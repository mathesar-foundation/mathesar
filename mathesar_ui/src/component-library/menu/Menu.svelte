<script lang="ts">
  export let style: string | undefined = undefined;
</script>

<div class="menu" role="menu" {style}>
  <slot />
</div>
