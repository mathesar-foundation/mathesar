<script lang="ts">
  import IconPath from '@mathesar/component-library/icon/IconPath.svelte';
  import { staticText } from '@mathesar/i18n/staticText';
  import { iconMathesarName } from '@mathesar/icons';

  const [viewBoxWidth, viewBoxHeight, , , paths] = iconMathesarName.data.icon;
  const path = (Array.isArray(paths) ? paths : [paths]).at(0);
</script>

{#if path}
  <svg
    class="mathesar-name"
    version="1.1"
    viewBox="0 0 {viewBoxWidth} {viewBoxHeight}"
    height="0.77em"
    role="img"
    aria-label={staticText.MATHESAR}
  >
    <IconPath {path} />
  </svg>
{/if}

<style>
  .mathesar-name {
    fill: currentcolor;
  }
</style>
