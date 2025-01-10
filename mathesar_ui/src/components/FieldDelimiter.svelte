<!--
@component This component is used:

- to display a separarator between a table and a column within it
- to display a separator between columns in a chain of FK references
-->

<script lang="ts">
  import { iconFieldDelimiter } from '@mathesar/icons';
  import { Icon } from '@mathesar-component-library';
</script>

<span class="field-delimiter"><Icon {...iconFieldDelimiter} /></span>

<style>
  .field-delimiter {
    color: var(--sand-600);
  }
</style>
